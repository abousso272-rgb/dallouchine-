-- =====================================================================
-- ÉTAPE 11 : MULTI-RÔLES AVANCÉ, RBAC, DÉLÉGATION & DASHBOARDS UNIFIÉS
-- =====================================================================

-- 1. Élargissement des rôles et multi-rôles sur profiles
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check CHECK (
    (role)::text = ANY (ARRAY[
      'client'::character varying,
      'customer'::character varying,
      'b2b_customer'::character varying,
      'b2b_client'::character varying,
      'commercial'::character varying,
      'sourcing'::character varying,
      'sourcer'::character varying,
      'operations'::character varying,
      'finance'::character varying,
      'admin'::character varying,
      'super_admin'::character varying
    ]::text[])
  );

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS roles text[] DEFAULT ARRAY['client']::text[],
  ADD COLUMN IF NOT EXISTS permissions text[] DEFAULT '{}'::text[];

-- Synchronisation des rôles existants dans le tableau roles
UPDATE public.profiles
SET roles = ARRAY[role]::text[]
WHERE roles IS NULL OR array_length(roles, 1) IS NULL OR array_length(roles, 1) = 0;

-- Keep the legacy helper aligned with the new multi-role model.  Existing RLS
-- policies use this function, so leaving it based only on `role` would make a
-- staff member lose access as soon as their primary role is changed.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND (
        role IN ('admin', 'super_admin', 'operations', 'sourcing', 'commercial', 'finance')
        OR COALESCE(roles, '{}'::text[]) && ARRAY['admin', 'super_admin', 'operations', 'sourcing', 'commercial', 'finance']::text[]
      )
  );
$function$;

CREATE OR REPLACE FUNCTION public.has_platform_role(p_roles text[])
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND (
        role = ANY(p_roles)
        OR COALESCE(roles, '{}'::text[]) && p_roles
      )
  );
$function$;

-- 2. Table company_members (Multi-utilisateurs Entreprise)
CREATE TABLE IF NOT EXISTS public.company_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'member', -- 'owner', 'admin', 'buyer', 'accountant', 'logistics', 'member'
    permissions text[] DEFAULT '{}'::text[],
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (company_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_company_members_user ON public.company_members(user_id);
CREATE INDEX IF NOT EXISTS idx_company_members_company ON public.company_members(company_id);

ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;

-- SECURITY DEFINER helpers avoid recursive RLS evaluation when a member is
-- checking other members of the same company.
CREATE OR REPLACE FUNCTION public.is_active_company_member(p_company_id uuid)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.company_members
    WHERE company_id = p_company_id AND user_id = auth.uid() AND active = true
  );
$function$;

CREATE OR REPLACE FUNCTION public.can_manage_company_members(p_company_id uuid)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.company_members
    WHERE company_id = p_company_id
      AND user_id = auth.uid()
      AND active = true
      AND role IN ('owner', 'admin')
  )
  OR EXISTS (
    SELECT 1 FROM public.companies
    WHERE id = p_company_id AND user_id = auth.uid()
  );
$function$;

-- RLS company_members
DROP POLICY IF EXISTS "company_members_select" ON public.company_members;
CREATE POLICY "company_members_select" ON public.company_members
  FOR SELECT USING (
    auth.uid() = user_id
    OR public.is_active_company_member(company_id)
    OR is_admin()
  );

DROP POLICY IF EXISTS "company_members_manage" ON public.company_members;
DROP POLICY IF EXISTS "company_members_admin" ON public.company_members;
CREATE POLICY "company_members_manage" ON public.company_members
  FOR ALL
  USING (is_admin() OR public.can_manage_company_members(company_id))
  WITH CHECK (is_admin() OR public.can_manage_company_members(company_id));

-- 3. Table delegations (Délégations Contrôlées & Temporaires)
CREATE TABLE IF NOT EXISTS public.delegations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    delegator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    delegatee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    scope_type VARCHAR(50) NOT NULL, -- 'sourcing_request', 'b2b_request', 'order', 'shipment', 'all'
    scope_id VARCHAR(100),           -- UUID de l'objet ciblé ou NULL si 'all'
    permissions text[] NOT NULL DEFAULT '{}'::text[],
    starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ,          -- NULL si indéterminé
    active BOOLEAN NOT NULL DEFAULT true,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT delegations_dates_check CHECK (expires_at IS NULL OR starts_at <= expires_at)
);

CREATE INDEX IF NOT EXISTS idx_delegations_delegatee ON public.delegations(delegatee_id, active);
CREATE INDEX IF NOT EXISTS idx_delegations_delegator ON public.delegations(delegator_id);
CREATE INDEX IF NOT EXISTS idx_delegations_scope ON public.delegations(scope_type, scope_id);

ALTER TABLE public.delegations ENABLE ROW LEVEL SECURITY;

-- RLS delegations
DROP POLICY IF EXISTS "delegations_select" ON public.delegations;
CREATE POLICY "delegations_select" ON public.delegations
  FOR SELECT USING (
    auth.uid() = delegator_id
    OR auth.uid() = delegatee_id
    OR is_admin()
  );

DROP POLICY IF EXISTS "delegations_manage" ON public.delegations;
CREATE POLICY "delegations_manage" ON public.delegations
  FOR ALL
  USING (auth.uid() = delegator_id OR is_admin())
  WITH CHECK (auth.uid() = delegator_id OR is_admin());

-- 4. Audit logs helper RPC
CREATE OR REPLACE FUNCTION public.log_audit_event(
    p_actor_id uuid,
    p_action text,
    p_entity_type text,
    p_entity_id text,
    p_old_data jsonb DEFAULT NULL,
    p_new_data jsonb DEFAULT NULL,
    p_ip_address text DEFAULT NULL,
    p_user_agent text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_id UUID;
BEGIN
    -- An authenticated caller may only record an event in their own name.
    -- Service-role calls are allowed for trusted backend jobs.
    IF auth.role() <> 'service_role' AND auth.uid() IS DISTINCT FROM p_actor_id THEN
        RAISE EXCEPTION 'PERMISSION_DENIED: Un utilisateur ne peut pas usurper un acteur dans le journal d''audit.';
    END IF;

    INSERT INTO public.audit_logs (
        actor_id,
        action,
        entity_type,
        entity_id,
        old_data,
        new_data,
        ip_address,
        user_agent,
        created_at
    ) VALUES (
        p_actor_id,
        p_action,
        p_entity_type,
        p_entity_id,
        p_old_data,
        p_new_data,
        p_ip_address,
        p_user_agent,
        NOW()
    ) RETURNING id INTO v_id;

    RETURN v_id;
END;
$function$;

-- 5. RPC check_user_permission (vérifie permissions directes + délégations)
CREATE OR REPLACE FUNCTION public.check_user_permission(
    p_user_id uuid,
    p_permission text,
    p_scope_type text DEFAULT NULL,
    p_scope_id text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_profile RECORD;
    v_has_direct BOOLEAN := false;
    v_has_delegated BOOLEAN := false;
BEGIN
    -- Super admins ont toutes les permissions
    SELECT * INTO v_profile FROM public.profiles WHERE id = p_user_id;
    IF NOT FOUND THEN
        RETURN false;
    END IF;

    IF v_profile.role IN ('super_admin', 'admin') OR 'super_admin' = ANY(v_profile.roles) OR 'admin' = ANY(v_profile.roles) THEN
        RETURN true;
    END IF;

    -- Vérification permission directe sur le profil
    IF p_permission = ANY(v_profile.permissions) THEN
        RETURN true;
    END IF;

    -- Vérification délégations actives et non expirées
    SELECT EXISTS (
        SELECT 1 FROM public.delegations
        WHERE delegatee_id = p_user_id
          AND active = true
          AND starts_at <= NOW()
          AND (expires_at IS NULL OR expires_at >= NOW())
          AND (
            scope_type = 'all'
            OR (p_scope_type IS NOT NULL AND scope_type = p_scope_type)
          )
          AND (scope_id IS NULL OR (p_scope_id IS NOT NULL AND scope_id = p_scope_id))
          AND p_permission = ANY(permissions)
    ) INTO v_has_delegated;

    RETURN v_has_delegated;
END;
$function$;

-- 6. RPC get_financial_kpi (Stricte isolation : finance & super_admin uniquement)
CREATE OR REPLACE FUNCTION public.get_financial_kpi(p_timeframe text DEFAULT '30d')
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_caller_role TEXT;
    v_caller_roles TEXT[];
    v_start_date TIMESTAMPTZ;
    v_total_revenue NUMERIC(14, 2) := 0;
    v_paid_orders_count INT := 0;
    v_total_order_amount NUMERIC(14, 2) := 0;
    v_estimated_logistics_cost NUMERIC(14, 2) := 0;
    v_confirmed_logistics_cost NUMERIC(14, 2) := 0;
    v_actual_logistics_cost NUMERIC(14, 2) := 0;
    v_estimated_customs_cost NUMERIC(14, 2) := 0;
    v_actual_customs_cost NUMERIC(14, 2) := 0;
    v_supplier_costs NUMERIC(14, 2) := 0;
    v_platform_service_fee NUMERIC(14, 2) := 0;
    v_platform_sourcing_fee NUMERIC(14, 2) := 0;
    v_platform_b2b_fee NUMERIC(14, 2) := 0;
    v_global_margin NUMERIC(14, 2) := 0;
    v_net_profit_confirmed NUMERIC(14, 2) := 0;
BEGIN
    -- Contrôle d'autorisation strict : auth.uid() doit être 'finance', 'super_admin' ou 'admin'
    IF auth.role() != 'service_role' THEN
        SELECT role, roles INTO v_caller_role, v_caller_roles FROM public.profiles WHERE id = auth.uid();
        IF v_caller_role NOT IN ('finance', 'super_admin', 'admin')
           AND NOT ('finance' = ANY(v_caller_roles) OR 'super_admin' = ANY(v_caller_roles) OR 'admin' = ANY(v_caller_roles)) THEN
            RAISE EXCEPTION 'PERMISSION_DENIED: Accès restreint à la Direction Financière et aux Super Administrateurs.';
        END IF;
    END IF;

    -- Période
    IF p_timeframe = 'today' THEN
        v_start_date := date_trunc('day', NOW());
    ELSIF p_timeframe = '7d' THEN
        v_start_date := NOW() - INTERVAL '7 days';
    ELSIF p_timeframe = '3m' THEN
        v_start_date := NOW() - INTERVAL '3 months';
    ELSIF p_timeframe = '12m' THEN
        v_start_date := NOW() - INTERVAL '1 year';
    ELSIF p_timeframe = 'all' THEN
        v_start_date := '2020-01-01'::timestamptz;
    ELSE
        v_start_date := NOW() - INTERVAL '30 days';
    END IF;

    -- 1. Commandes et encaissements réels
    SELECT
        COALESCE(SUM(total_xof), 0),
        COUNT(*)
    INTO v_total_order_amount, v_paid_orders_count
    FROM public.orders
    WHERE payment_status = 'paid'
      AND created_at >= v_start_date;

    -- 2. Revenus plateforme ventilés
    SELECT
        COALESCE(SUM(amount_xof), 0),
        COALESCE(SUM(CASE WHEN revenue_type = 'service_fee' THEN amount_xof ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN revenue_type = 'sourcing_fee' THEN amount_xof ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN revenue_type = 'b2b_fee' THEN amount_xof ELSE 0 END), 0)
    INTO v_total_revenue, v_platform_service_fee, v_platform_sourcing_fee, v_platform_b2b_fee
    FROM public.platform_revenues
    WHERE created_at >= v_start_date;

    -- 3. Coûts logistiques avec distinction formelle (estimated, confirmed, actual)
    SELECT
        COALESCE(SUM(CASE WHEN status = 'calculated' THEN transport_cost ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN status = 'confirmed' THEN transport_cost ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN status = 'actual' THEN transport_cost ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN status = 'calculated' THEN customs_cost ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN status IN ('confirmed', 'actual') THEN customs_cost ELSE 0 END), 0)
    INTO
        v_estimated_logistics_cost,
        v_confirmed_logistics_cost,
        v_actual_logistics_cost,
        v_estimated_customs_cost,
        v_actual_customs_cost
    FROM public.logistics_costs
    WHERE created_at >= v_start_date;

    -- 4. Coûts d'achat fournisseurs
    SELECT COALESCE(SUM(amount_xof), 0)
    INTO v_supplier_costs
    FROM public.order_costs
    WHERE cost_type = 'supplier'
      AND created_at >= v_start_date;

    -- Calculs de rentabilité et marges
    v_global_margin := v_total_order_amount - (v_supplier_costs + v_confirmed_logistics_cost + v_actual_logistics_cost + v_actual_customs_cost);
    IF v_total_order_amount > 0 THEN
        v_net_profit_confirmed := ROUND(v_global_margin, 2);
    END IF;

    RETURN jsonb_build_object(
        'timeframe', p_timeframe,
        'start_date', v_start_date,
        'orders', jsonb_build_object(
            'paid_count', v_paid_orders_count,
            'total_amount_xof', v_total_order_amount
        ),
        'revenues', jsonb_build_object(
            'total_platform_revenue_xof', v_total_revenue,
            'service_fee_xof', v_platform_service_fee,
            'sourcing_fee_xof', v_platform_sourcing_fee,
            'b2b_fee_xof', v_platform_b2b_fee
        ),
        'costs', jsonb_build_object(
            'supplier_costs_xof', v_supplier_costs,
            'transport', jsonb_build_object(
                'estimated_xof', v_estimated_logistics_cost,
                'confirmed_xof', v_confirmed_logistics_cost,
                'actual_xof', v_actual_logistics_cost
            ),
            'customs', jsonb_build_object(
                'estimated_xof', v_estimated_customs_cost,
                'actual_xof', v_actual_customs_cost
            )
        ),
        'margins', jsonb_build_object(
            'net_profit_xof', v_net_profit_confirmed,
            'status', CASE WHEN v_actual_logistics_cost > 0 THEN 'actual' ELSE 'confirmed' END
        )
    );
END;
$function$;

-- 7. RPC get_operations_kpi (Opérations Logistiques)
CREATE OR REPLACE FUNCTION public.get_operations_kpi(p_timeframe text DEFAULT '30d')
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_start_date TIMESTAMPTZ;
    v_pending_orders INT := 0;
    v_shipped_orders INT := 0;
    v_delivered_orders INT := 0;
    v_active_shipments INT := 0;
    v_arrived_shipments INT := 0;
    v_active_groupages INT := 0;
    v_hub_parcels INT := 0;
BEGIN
    IF auth.role() != 'service_role'
       AND NOT public.has_platform_role(ARRAY['operations', 'admin', 'super_admin']::text[]) THEN
        RAISE EXCEPTION 'PERMISSION_DENIED: Accès réservé aux Opérations et administrateurs.';
    END IF;

    IF p_timeframe = 'today' THEN
        v_start_date := date_trunc('day', NOW());
    ELSIF p_timeframe = '7d' THEN
        v_start_date := NOW() - INTERVAL '7 days';
    ELSIF p_timeframe = 'all' THEN
        v_start_date := '2020-01-01'::timestamptz;
    ELSE
        v_start_date := NOW() - INTERVAL '30 days';
    END IF;

    SELECT
        COUNT(CASE WHEN order_status IN ('paid', 'supplier_ordered', 'preparing') THEN 1 END),
        COUNT(CASE WHEN order_status IN ('shipped', 'in_transit') THEN 1 END),
        COUNT(CASE WHEN order_status = 'delivered' THEN 1 END)
    INTO v_pending_orders, v_shipped_orders, v_delivered_orders
    FROM public.orders
    WHERE created_at >= v_start_date;

    SELECT
        COUNT(CASE WHEN status IN ('ready_to_ship', 'shipped_from_china', 'in_transit', 'customs') THEN 1 END),
        COUNT(CASE WHEN status IN ('arrived_senegal', 'at_hub', 'out_for_delivery', 'delivered') THEN 1 END)
    INTO v_active_shipments, v_arrived_shipments
    FROM public.shipments
    WHERE created_at >= v_start_date;

    SELECT COUNT(*) INTO v_active_groupages
    FROM public.groupages
    WHERE status IN ('open', 'almost_full', 'full', 'shipped');

    SELECT COALESCE(SUM(active_parcels_count), 0) INTO v_hub_parcels
    FROM public.hubs
    WHERE status = 'active';

    RETURN jsonb_build_object(
        'timeframe', p_timeframe,
        'orders_to_prepare', v_pending_orders,
        'orders_in_transit', v_shipped_orders,
        'orders_delivered', v_delivered_orders,
        'shipments_active', v_active_shipments,
        'shipments_arrived', v_arrived_shipments,
        'active_groupages', v_active_groupages,
        'hub_parcels', v_hub_parcels
    );
END;
$function$;

-- 8. RPC get_commercial_kpi (Commercial & Ventes B2B)
CREATE OR REPLACE FUNCTION public.get_commercial_kpi(p_timeframe text DEFAULT '30d', p_user_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_start_date TIMESTAMPTZ;
    v_new_b2b INT := 0;
    v_qualified_b2b INT := 0;
    v_quotes_draft INT := 0;
    v_quotes_sent INT := 0;
    v_quotes_accepted INT := 0;
    v_quotes_rejected INT := 0;
    v_total_quote_value NUMERIC(14, 2) := 0;
BEGIN
    IF auth.role() != 'service_role'
       AND NOT public.has_platform_role(ARRAY['commercial', 'admin', 'super_admin']::text[]) THEN
        RAISE EXCEPTION 'PERMISSION_DENIED: Accès réservé au pôle Commercial et administrateurs.';
    END IF;

    IF p_timeframe = 'today' THEN
        v_start_date := date_trunc('day', NOW());
    ELSIF p_timeframe = '7d' THEN
        v_start_date := NOW() - INTERVAL '7 days';
    ELSIF p_timeframe = 'all' THEN
        v_start_date := '2020-01-01'::timestamptz;
    ELSE
        v_start_date := NOW() - INTERVAL '30 days';
    END IF;

    SELECT
        COUNT(CASE WHEN status = 'new' THEN 1 END),
        COUNT(CASE WHEN status IN ('qualified', 'sourcing', 'negotiation') THEN 1 END)
    INTO v_new_b2b, v_qualified_b2b
    FROM public.b2b_requests
    WHERE created_at >= v_start_date
      AND (p_user_id IS NULL OR assigned_user_id = p_user_id);

    SELECT
        COUNT(CASE WHEN status = 'draft' THEN 1 END),
        COUNT(CASE WHEN status = 'sent' THEN 1 END),
        COUNT(CASE WHEN status = 'accepted' THEN 1 END),
        COUNT(CASE WHEN status = 'rejected' THEN 1 END),
        COALESCE(SUM(CASE WHEN status = 'accepted' THEN total_xof ELSE 0 END), 0)
    INTO v_quotes_draft, v_quotes_sent, v_quotes_accepted, v_quotes_rejected, v_total_quote_value
    FROM public.quotes
    WHERE created_at >= v_start_date;

    RETURN jsonb_build_object(
        'timeframe', p_timeframe,
        'b2b_new_requests', v_new_b2b,
        'b2b_in_progress', v_qualified_b2b,
        'quotes_draft', v_quotes_draft,
        'quotes_sent', v_quotes_sent,
        'quotes_accepted', v_quotes_accepted,
        'quotes_rejected', v_quotes_rejected,
        'accepted_volume_xof', v_total_quote_value,
        'conversion_rate', CASE WHEN (v_quotes_accepted + v_quotes_rejected) > 0
            THEN ROUND((v_quotes_accepted::numeric / (v_quotes_accepted + v_quotes_rejected)::numeric) * 100, 1)
            ELSE 0 END
    );
END;
$function$;

-- 9. RPC get_sourcing_kpi (Sourcer Chine)
CREATE OR REPLACE FUNCTION public.get_sourcing_kpi(p_timeframe text DEFAULT '30d', p_sourcer_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_start_date TIMESTAMPTZ;
    v_assigned_requests INT := 0;
    v_researching_requests INT := 0;
    v_negotiating_requests INT := 0;
    v_quotes_ready INT := 0;
    v_suppliers_recorded INT := 0;
BEGIN
    IF auth.role() != 'service_role'
       AND NOT public.has_platform_role(ARRAY['sourcing', 'sourcer', 'admin', 'super_admin']::text[]) THEN
        RAISE EXCEPTION 'PERMISSION_DENIED: Accès réservé au pôle Sourcing et administrateurs.';
    END IF;

    IF p_timeframe = 'today' THEN
        v_start_date := date_trunc('day', NOW());
    ELSIF p_timeframe = '7d' THEN
        v_start_date := NOW() - INTERVAL '7 days';
    ELSIF p_timeframe = 'all' THEN
        v_start_date := '2020-01-01'::timestamptz;
    ELSE
        v_start_date := NOW() - INTERVAL '30 days';
    END IF;

    SELECT
        COUNT(*),
        COUNT(CASE WHEN status IN ('new', 'reviewing', 'researching') THEN 1 END),
        COUNT(CASE WHEN status IN ('supplier_found', 'negotiating') THEN 1 END),
        COUNT(CASE WHEN status IN ('quote_ready', 'quote_sent') THEN 1 END)
    INTO v_assigned_requests, v_researching_requests, v_negotiating_requests, v_quotes_ready
    FROM public.sourcing_requests
    WHERE created_at >= v_start_date
      AND (p_sourcer_id IS NULL OR assigned_sourcer_id IN (SELECT id FROM public.sourcers WHERE user_id = p_sourcer_id));

    SELECT COUNT(*) INTO v_suppliers_recorded
    FROM public.suppliers
    WHERE created_at >= v_start_date;

    RETURN jsonb_build_object(
        'timeframe', p_timeframe,
        'assigned_requests', v_assigned_requests,
        'researching', v_researching_requests,
        'negotiating', v_negotiating_requests,
        'quotes_ready', v_quotes_ready,
        'suppliers_recorded', v_suppliers_recorded
    );
END;
$function$;

-- 10. RPC get_superadmin_kpi (Synthèse Exécutive Consolidée)
CREATE OR REPLACE FUNCTION public.get_superadmin_kpi(p_timeframe text DEFAULT '30d')
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_caller_role TEXT;
    v_caller_roles TEXT[];
    v_ops JSONB;
    v_comm JSONB;
    v_sourcing JSONB;
    v_fin JSONB;
    v_active_delegations INT := 0;
    v_total_users INT := 0;
    v_total_companies INT := 0;
BEGIN
    -- Contrôle d'autorisation strict : super_admin ou admin
    IF auth.role() != 'service_role' THEN
        SELECT role, roles INTO v_caller_role, v_caller_roles FROM public.profiles WHERE id = auth.uid();
        IF v_caller_role NOT IN ('super_admin', 'admin')
           AND NOT ('super_admin' = ANY(v_caller_roles) OR 'admin' = ANY(v_caller_roles)) THEN
            RAISE EXCEPTION 'PERMISSION_DENIED: Seuls les Super Administrateurs peuvent accéder au cockpit consolidé.';
        END IF;
    END IF;

    v_ops := public.get_operations_kpi(p_timeframe);
    v_comm := public.get_commercial_kpi(p_timeframe);
    v_sourcing := public.get_sourcing_kpi(p_timeframe);
    v_fin := public.get_financial_kpi(p_timeframe);

    SELECT COUNT(*) INTO v_active_delegations
    FROM public.delegations
    WHERE active = true AND (expires_at IS NULL OR expires_at >= NOW());

    SELECT COUNT(*) INTO v_total_users FROM public.profiles;
    SELECT COUNT(*) INTO v_total_companies FROM public.companies;

    RETURN jsonb_build_object(
        'timeframe', p_timeframe,
        'generated_at', NOW(),
        'operations', v_ops,
        'commercial', v_comm,
        'sourcing', v_sourcing,
        'finance', v_fin,
        'platform', jsonb_build_object(
            'total_users', v_total_users,
            'total_companies', v_total_companies,
            'active_delegations', v_active_delegations
        )
    );
END;
$function$;

-- 11. RPC get_customer_kpi (Client Particulier)
CREATE OR REPLACE FUNCTION public.get_customer_kpi(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_active_orders INT := 0;
    v_delivered_orders INT := 0;
    v_active_groupages INT := 0;
    v_sourcing_requests INT := 0;
    v_pending_quotes INT := 0;
BEGIN
    -- Protection : caller doit être propriétaire ou staff
    IF auth.role() != 'service_role' AND auth.uid() != p_user_id AND NOT is_admin() THEN
        RAISE EXCEPTION 'PERMISSION_DENIED: Consultation non autorisée.';
    END IF;

    SELECT
        COUNT(CASE WHEN order_status NOT IN ('delivered', 'cancelled') THEN 1 END),
        COUNT(CASE WHEN order_status = 'delivered' THEN 1 END)
    INTO v_active_orders, v_delivered_orders
    FROM public.orders
    WHERE user_id = p_user_id;

    SELECT COUNT(*) INTO v_active_groupages
    FROM public.groupage_participants gp
    JOIN public.groupages g ON g.id = gp.groupage_id
    WHERE gp.user_id = p_user_id
      AND g.status IN ('open', 'almost_full', 'full', 'shipped');

    SELECT COUNT(*) INTO v_sourcing_requests
    FROM public.sourcing_requests
    WHERE user_id = p_user_id;

    SELECT COUNT(*) INTO v_pending_quotes
    FROM public.quotes
    WHERE user_id = p_user_id
      AND status = 'sent';

    RETURN jsonb_build_object(
        'user_id', p_user_id,
        'active_orders', v_active_orders,
        'delivered_orders', v_delivered_orders,
        'active_groupages', v_active_groupages,
        'sourcing_requests', v_sourcing_requests,
        'pending_quotes', v_pending_quotes
    );
END;
$function$;

-- 12. RPC get_b2b_client_kpi (Client Entreprise B2B)
CREATE OR REPLACE FUNCTION public.get_b2b_client_kpi(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_company_ids UUID[];
    v_b2b_requests INT := 0;
    v_pending_quotes INT := 0;
    v_in_production INT := 0;
    v_in_shipping INT := 0;
    v_completed_orders INT := 0;
BEGIN
    IF auth.role() != 'service_role' AND auth.uid() != p_user_id AND NOT is_admin() THEN
        RAISE EXCEPTION 'PERMISSION_DENIED: Consultation non autorisée.';
    END IF;

    -- Récupérer les entreprises où l'utilisateur est propriétaire ou membre actif
    SELECT ARRAY_AGG(DISTINCT company_id) INTO v_company_ids
    FROM (
        SELECT id AS company_id FROM public.companies WHERE user_id = p_user_id
        UNION
        SELECT company_id FROM public.company_members WHERE user_id = p_user_id AND active = true
    ) sub;

    IF v_company_ids IS NOT NULL AND array_length(v_company_ids, 1) > 0 THEN
        SELECT
            COUNT(CASE WHEN status IN ('new', 'qualified', 'sourcing', 'negotiation') THEN 1 END),
            COUNT(CASE WHEN status = 'quote_sent' THEN 1 END),
            COUNT(CASE WHEN status IN ('deposit_paid', 'production') THEN 1 END),
            COUNT(CASE WHEN status = 'shipping' THEN 1 END),
            COUNT(CASE WHEN status = 'completed' THEN 1 END)
        INTO v_b2b_requests, v_pending_quotes, v_in_production, v_in_shipping, v_completed_orders
        FROM public.b2b_requests
        WHERE company_id = ANY(v_company_ids);
    END IF;

    RETURN jsonb_build_object(
        'user_id', p_user_id,
        'company_count', COALESCE(array_length(v_company_ids, 1), 0),
        'active_requests', v_b2b_requests,
        'pending_quotes', v_pending_quotes,
        'in_production', v_in_production,
        'in_shipping', v_in_shipping,
        'completed_orders', v_completed_orders
    );
END;
$function$;

-- Functions marked SECURITY DEFINER must never be executable by anonymous
-- callers. The backend service role remains available for trusted jobs.
REVOKE ALL ON FUNCTION public.log_audit_event(uuid, text, text, text, jsonb, jsonb, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.check_user_permission(uuid, text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_financial_kpi(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_operations_kpi(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_commercial_kpi(text, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_sourcing_kpi(text, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_superadmin_kpi(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_customer_kpi(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_b2b_client_kpi(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.log_audit_event(uuid, text, text, text, jsonb, jsonb, text, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.check_user_permission(uuid, text, text, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_financial_kpi(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_operations_kpi(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_commercial_kpi(text, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_sourcing_kpi(text, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_superadmin_kpi(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_customer_kpi(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_b2b_client_kpi(uuid) TO authenticated, service_role;
