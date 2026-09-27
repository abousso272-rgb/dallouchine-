-- =============================================================================
-- DALUCHE — PLATEFORME OPÉRATIONNELLE
-- Rôles & permissions, sécurité, automobile, messagerie, devis, invitations,
-- workflows sourcing / B2B / véhicules / groupages, tableaux de bord.
--
-- Migration idempotente : peut être rejouée sans effet de bord.
-- À exécuter dans Supabase > SQL Editor (rôle postgres).
-- =============================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =============================================================================
-- 1. RÔLES
--    admin général  : admin, super_admin (+ anciens rôles operations/commercial/finance)
--    transitaire    : transitaire (+ anciens rôles sourcing/sourcer)
--    groupages      : groupage_manager
--    client         : client (+ customer, b2b_customer, b2b_client)
-- =============================================================================

-- Supprime toute contrainte CHECK existante portant sur le rôle (le nom peut varier)
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.profiles'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%role%'
  LOOP
    EXECUTE format('ALTER TABLE public.profiles DROP CONSTRAINT %I', r.conname);
  END LOOP;
END $$;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS roles text[] DEFAULT ARRAY['client']::text[];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS permissions text[] DEFAULT '{}'::text[];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address text;

ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (
  role IN (
    'client', 'customer', 'b2b_customer', 'b2b_client',
    'admin', 'super_admin', 'operations', 'commercial', 'finance',
    'transitaire', 'sourcing', 'sourcer',
    'groupage_manager'
  )
);

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND status = 'active'
      AND (
        lower(role) IN ('admin', 'super_admin', 'operations', 'commercial', 'finance')
        OR COALESCE(roles, '{}'::text[]) && ARRAY['admin', 'super_admin', 'operations', 'commercial', 'finance']::text[]
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.is_transitaire()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND status = 'active'
      AND (
        lower(role) IN ('transitaire', 'sourcing', 'sourcer')
        OR COALESCE(roles, '{}'::text[]) && ARRAY['transitaire', 'sourcing', 'sourcer']::text[]
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.is_groupage_manager()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND status = 'active'
      AND (lower(role) = 'groupage_manager' OR 'groupage_manager' = ANY(COALESCE(roles, '{}'::text[])))
  );
$$;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.is_admin() OR public.is_transitaire() OR public.is_groupage_manager();
$$;

-- Rôle applicatif normalisé : admin | transitaire | groupage_manager | client | anonymous
CREATE OR REPLACE FUNCTION public.app_role()
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT CASE
    WHEN auth.uid() IS NULL THEN 'anonymous'
    WHEN public.is_admin() THEN 'admin'
    WHEN public.is_transitaire() THEN 'transitaire'
    WHEN public.is_groupage_manager() THEN 'groupage_manager'
    ELSE 'client'
  END;
$$;

CREATE OR REPLACE FUNCTION public.has_permission(p_permission text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.is_admin() OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND p_permission = ANY(COALESCE(permissions, '{}'::text[]))
  );
$$;

-- =============================================================================
-- 2. SÉCURITÉ DES PROFILS
--    Un utilisateur ne peut pas modifier son propre rôle, ses permissions ni son statut.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.guard_profile_privileges()
RETURNS trigger
LANGUAGE plpgsql SET search_path = public
AS $$
BEGIN
  -- Seules les requêtes directes des rôles API (anon / authenticated) sont contrôlées.
  -- Les fonctions SECURITY DEFINER (propriétaire postgres) et le service_role passent.
  IF current_user IN ('anon', 'authenticated') AND NOT public.is_admin() THEN
    IF TG_OP = 'INSERT' THEN
      NEW.role := 'client';
      NEW.roles := ARRAY['client']::text[];
      NEW.permissions := '{}'::text[];
      NEW.status := 'active';
    ELSIF NEW.role IS DISTINCT FROM OLD.role
       OR NEW.roles IS DISTINCT FROM OLD.roles
       OR NEW.permissions IS DISTINCT FROM OLD.permissions
       OR NEW.status IS DISTINCT FROM OLD.status
       OR NEW.id IS DISTINCT FROM OLD.id THEN
      RAISE EXCEPTION 'PERMISSION_DENIED: la modification des droits est réservée à l''administration'
        USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_guard_privileges ON public.profiles;
CREATE TRIGGER trg_profiles_guard_privileges
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_profile_privileges();

-- =============================================================================
-- 3. RÉVOCATION DES DROITS ANONYMES SUR LES FONCTIONS SENSIBLES
--    (Supabase accorde EXECUTE à anon par défaut : un REVOKE FROM PUBLIC ne suffit pas.)
-- =============================================================================

DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig, p.proname
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'get_financial_kpi', 'get_operations_kpi', 'get_commercial_kpi', 'get_sourcing_kpi',
        'get_superadmin_kpi', 'get_customer_kpi', 'get_b2b_client_kpi',
        'check_user_permission', 'log_audit_event',
        'update_sourcing_status', 'assign_sourcing_request', 'add_supplier_to_request',
        'create_sourcing_quote', 'admin_update_groupage_status', 'calculate_order_logistics',
        'update_b2b_status', 'assign_b2b_request', 'qualify_b2b_request', 'add_supplier_to_b2b_request',
        'create_b2b_quote', 'send_b2b_quote', 'start_b2b_production', 'update_b2b_production_stage',
        'transition_b2b_to_shipment', 'create_shipment_for_order', 'update_shipment_status'
      )
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon', r.sig);
    -- Les fonctions qui acceptent un rôle d'acteur fourni par l'appelant ne doivent
    -- jamais être appelables directement par un utilisateur connecté.
    IF r.proname IN ('update_sourcing_status', 'assign_sourcing_request', 'add_supplier_to_request',
                     'create_sourcing_quote', 'get_customer_kpi', 'get_b2b_client_kpi', 'check_user_permission') THEN
      EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM authenticated', r.sig);
    END IF;
  END LOOP;
END $$;

-- =============================================================================
-- 4. CORRECTION : récursion infinie des politiques company_members
-- =============================================================================

DO $$
DECLARE r record;
BEGIN
  IF to_regclass('public.company_members') IS NOT NULL THEN
    FOR r IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'company_members' LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.company_members', r.policyname);
    END LOOP;

    EXECUTE $f$
      CREATE OR REPLACE FUNCTION public.daluche_company_member_of(p_company_id uuid)
      RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $b$
        SELECT EXISTS (SELECT 1 FROM public.company_members
                       WHERE company_id = p_company_id AND user_id = auth.uid() AND active = true);
      $b$;
    $f$;

    EXECUTE $f$
      CREATE OR REPLACE FUNCTION public.daluche_company_manager_of(p_company_id uuid)
      RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $b$
        SELECT EXISTS (SELECT 1 FROM public.company_members
                       WHERE company_id = p_company_id AND user_id = auth.uid()
                         AND active = true AND role IN ('owner', 'admin'));
      $b$;
    $f$;

    EXECUTE 'ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY';
    EXECUTE $p$
      CREATE POLICY daluche_company_members_select ON public.company_members FOR SELECT
      USING (user_id = auth.uid() OR public.daluche_company_member_of(company_id) OR public.is_admin())
    $p$;
    EXECUTE $p$
      CREATE POLICY daluche_company_members_manage ON public.company_members FOR ALL
      USING (public.is_admin() OR public.daluche_company_manager_of(company_id))
      WITH CHECK (public.is_admin() OR public.daluche_company_manager_of(company_id))
    $p$;
  END IF;
END $$;

-- =============================================================================
-- 5. COLONNES COMPLÉMENTAIRES SUR LES TABLES EXISTANTES
-- =============================================================================

-- Groupages : gestionnaire attitré, créateur, visuel dédié
ALTER TABLE public.groupages ADD COLUMN IF NOT EXISTS assigned_manager_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.groupages ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.groupages ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE public.groupages ADD COLUMN IF NOT EXISTS highlights text[] DEFAULT '{}'::text[];
CREATE INDEX IF NOT EXISTS idx_groupages_assigned_manager ON public.groupages(assigned_manager_id);

-- Participation : lien vers la commande payée
ALTER TABLE public.groupage_participants ADD COLUMN IF NOT EXISTS order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_groupage_participants_order ON public.groupage_participants(order_id);

-- Commandes : type, devis lié, informations logistiques
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_kind text NOT NULL DEFAULT 'catalog';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS quote_id uuid REFERENCES public.quotes(id) ON DELETE SET NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS quote_payment_kind text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS logistics_notes text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS carrier_reference text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS estimated_delivery_date date;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_orders_quote ON public.orders(quote_id);
CREATE INDEX IF NOT EXISTS idx_orders_kind ON public.orders(order_kind);

-- Sourcing : attribution à un membre de l'équipe, notes internes
ALTER TABLE public.sourcing_requests ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.sourcing_requests ADD COLUMN IF NOT EXISTS internal_notes text;
CREATE INDEX IF NOT EXISTS idx_sourcing_requests_assigned_to ON public.sourcing_requests(assigned_to);

-- B2B : notes internes
ALTER TABLE public.b2b_requests ADD COLUMN IF NOT EXISTS internal_notes text;

-- Devis : envoi, refus, auteur
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS sent_at timestamptz;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS accepted_at timestamptz;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS rejected_at timestamptz;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS rejection_reason text;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS title text;

-- Notifications : lien de redirection
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS link text;

-- =============================================================================
-- 6. NOUVELLES TABLES
-- =============================================================================

-- 6.1 Coûts internes des produits (jamais exposés au public)
CREATE TABLE IF NOT EXISTS public.product_costs (
  product_id uuid PRIMARY KEY REFERENCES public.products(id) ON DELETE CASCADE,
  purchase_price_cny numeric(14,2),
  purchase_price_xof numeric(14,2) NOT NULL DEFAULT 0 CHECK (purchase_price_xof >= 0),
  logistics_cost_xof numeric(14,2) NOT NULL DEFAULT 0 CHECK (logistics_cost_xof >= 0),
  supplier_name text,
  supplier_url text,
  notes text,
  updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 6.2 Véhicules (voitures, motos, utilitaires, poids lourds…)
CREATE TABLE IF NOT EXISTS public.vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  vehicle_type text NOT NULL DEFAULT 'car' CHECK (vehicle_type IN (
    'car', 'suv', 'pickup', 'van', 'truck', 'bus', 'motorcycle', 'scooter', 'tricycle', 'machinery', 'other'
  )),
  brand text NOT NULL,
  model text NOT NULL,
  year int CHECK (year IS NULL OR (year BETWEEN 1950 AND 2100)),
  condition text NOT NULL DEFAULT 'new' CHECK (condition IN ('new', 'used', 'refurbished')),
  mileage_km int CHECK (mileage_km IS NULL OR mileage_km >= 0),
  fuel text CHECK (fuel IS NULL OR fuel IN ('petrol', 'diesel', 'electric', 'hybrid', 'lpg', 'other')),
  transmission text CHECK (transmission IS NULL OR transmission IN ('manual', 'automatic')),
  engine text,
  power_hp int,
  seats int,
  color text,
  price_xof numeric(14,2) CHECK (price_xof IS NULL OR price_xof >= 0),
  price_on_request boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'on_order', 'reserved', 'sold')),
  is_published boolean NOT NULL DEFAULT false,
  is_featured boolean NOT NULL DEFAULT false,
  description text,
  features text[] NOT NULL DEFAULT '{}'::text[],
  images text[] NOT NULL DEFAULT '{}'::text[],
  location text DEFAULT 'Chine',
  lead_time text DEFAULT '45 à 60 jours',
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_vehicles_published ON public.vehicles(is_published, status);
CREATE INDEX IF NOT EXISTS idx_vehicles_type ON public.vehicles(vehicle_type);

-- 6.3 Demandes automobiles
CREATE TABLE IF NOT EXISTS public.vehicle_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  vehicle_id uuid REFERENCES public.vehicles(id) ON DELETE SET NULL,
  request_type text NOT NULL DEFAULT 'vehicle' CHECK (request_type IN ('vehicle', 'custom_search')),
  vehicle_type text,
  brand text,
  model text,
  year_min int,
  budget_xof numeric(14,2) CHECK (budget_xof IS NULL OR budget_xof >= 0),
  quantity int NOT NULL DEFAULT 1 CHECK (quantity > 0),
  contact_name text NOT NULL,
  phone text NOT NULL,
  email text,
  city text DEFAULT 'Dakar',
  message text,
  status text NOT NULL DEFAULT 'new' CHECK (status IN (
    'new', 'in_review', 'quote_sent', 'accepted', 'deposit_paid', 'ordered', 'shipped', 'delivered', 'cancelled'
  )),
  assigned_to uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  internal_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_vehicle_requests_user ON public.vehicle_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_requests_status ON public.vehicle_requests(status);

ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS vehicle_request_id uuid REFERENCES public.vehicle_requests(id) ON DELETE SET NULL;

-- 6.4 Résultats de recherche fournisseurs (internes : prix d'achat)
CREATE TABLE IF NOT EXISTS public.request_findings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_type text NOT NULL CHECK (request_type IN ('sourcing', 'b2b', 'vehicle')),
  request_id uuid NOT NULL,
  supplier_name text NOT NULL,
  supplier_url text,
  unit_price_cny numeric(14,2),
  unit_price_xof numeric(14,2),
  moq int,
  lead_time_days int,
  notes text,
  photos text[] NOT NULL DEFAULT '{}'::text[],
  is_selected boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_request_findings_request ON public.request_findings(request_type, request_id);

-- 6.5 Messagerie liée aux demandes et commandes
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_type text NOT NULL CHECK (thread_type IN ('sourcing', 'b2b', 'vehicle', 'order')),
  thread_id uuid NOT NULL,
  sender_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  sender_role text NOT NULL DEFAULT 'client' CHECK (sender_role IN ('client', 'staff')),
  sender_name text,
  body text NOT NULL CHECK (length(trim(body)) > 0 AND length(body) <= 4000),
  attachment_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_messages_thread ON public.messages(thread_type, thread_id, created_at);

-- 6.6 Invitations de l'équipe
CREATE TABLE IF NOT EXISTS public.team_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  full_name text,
  role text NOT NULL CHECK (role IN ('admin', 'transitaire', 'groupage_manager')),
  permissions text[] NOT NULL DEFAULT '{}'::text[],
  token uuid NOT NULL DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'revoked')),
  invited_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  accepted_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '14 days')
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_team_invitations_pending_email
  ON public.team_invitations (lower(email)) WHERE status = 'pending';

-- updated_at automatiques
CREATE OR REPLACE FUNCTION public.daluche_touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_product_costs_touch ON public.product_costs;
CREATE TRIGGER trg_product_costs_touch BEFORE UPDATE ON public.product_costs
  FOR EACH ROW EXECUTE FUNCTION public.daluche_touch_updated_at();
DROP TRIGGER IF EXISTS trg_vehicles_touch ON public.vehicles;
CREATE TRIGGER trg_vehicles_touch BEFORE UPDATE ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION public.daluche_touch_updated_at();
DROP TRIGGER IF EXISTS trg_vehicle_requests_touch ON public.vehicle_requests;
CREATE TRIGGER trg_vehicle_requests_touch BEFORE UPDATE ON public.vehicle_requests
  FOR EACH ROW EXECUTE FUNCTION public.daluche_touch_updated_at();

-- =============================================================================
-- 7. FONCTIONS UTILITAIRES
-- =============================================================================

CREATE OR REPLACE FUNCTION public.daluche_code(p_prefix text)
RETURNS text LANGUAGE sql VOLATILE AS $$
  SELECT p_prefix || '-' || to_char(now(), 'YYMM') || '-' || upper(substr(md5(gen_random_uuid()::text), 1, 6));
$$;

CREATE OR REPLACE FUNCTION public.daluche_notify(
  p_user_id uuid, p_type text, p_title text, p_message text, p_link text DEFAULT NULL, p_data jsonb DEFAULT '{}'::jsonb
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF p_user_id IS NULL THEN RETURN; END IF;
  INSERT INTO public.notifications (user_id, type, title, message, link, data, is_read)
  VALUES (p_user_id, COALESCE(p_type, 'info'), p_title, p_message, p_link, COALESCE(p_data, '{}'::jsonb), false);
EXCEPTION WHEN OTHERS THEN
  -- Une notification ne doit jamais bloquer une opération métier.
  RAISE WARNING 'daluche_notify: %', SQLERRM;
END;
$$;

-- Le groupage est-il géré par l'utilisateur courant ?
CREATE OR REPLACE FUNCTION public.manages_groupage(p_groupage_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_groupage_manager() AND EXISTS (
    SELECT 1 FROM public.groupages g
    WHERE g.id = p_groupage_id AND (g.assigned_manager_id = auth.uid() OR g.created_by = auth.uid())
  );
$$;

-- La commande contient-elle un article d'un groupage géré par l'utilisateur courant ?
CREATE OR REPLACE FUNCTION public.manages_order(p_order_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_groupage_manager() AND EXISTS (
    SELECT 1 FROM public.order_items oi
    JOIN public.groupages g ON g.id = oi.groupage_id
    WHERE oi.order_id = p_order_id AND (g.assigned_manager_id = auth.uid() OR g.created_by = auth.uid())
  );
$$;

-- Accès à un fil de discussion
CREATE OR REPLACE FUNCTION public.can_access_thread(p_thread_type text, p_thread_id uuid)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_owner uuid;
BEGIN
  IF auth.uid() IS NULL THEN RETURN false; END IF;
  IF public.is_admin() THEN RETURN true; END IF;

  IF p_thread_type = 'sourcing' THEN
    SELECT user_id INTO v_owner FROM public.sourcing_requests WHERE id = p_thread_id;
    RETURN v_owner = auth.uid() OR public.is_transitaire();
  ELSIF p_thread_type = 'b2b' THEN
    SELECT user_id INTO v_owner FROM public.b2b_requests WHERE id = p_thread_id;
    RETURN v_owner = auth.uid() OR public.is_transitaire();
  ELSIF p_thread_type = 'vehicle' THEN
    SELECT user_id INTO v_owner FROM public.vehicle_requests WHERE id = p_thread_id;
    RETURN v_owner = auth.uid() OR public.is_transitaire();
  ELSIF p_thread_type = 'order' THEN
    SELECT user_id INTO v_owner FROM public.orders WHERE id = p_thread_id;
    RETURN v_owner = auth.uid() OR public.is_transitaire() OR public.manages_order(p_thread_id);
  END IF;
  RETURN false;
END;
$$;

-- =============================================================================
-- 8. GARDE-FOUS SUR LES ÉCRITURES DIRECTES DU PERSONNEL
-- =============================================================================

-- Produits : un transitaire crée des brouillons ; publication et prix publics selon permissions
CREATE OR REPLACE FUNCTION public.guard_product_writes()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF current_user NOT IN ('anon', 'authenticated') OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NOT public.has_permission('publish_products') THEN
      NEW.is_active := false;
      NEW.is_featured := false;
    END IF;
  ELSE
    IF NOT public.has_permission('publish_products') THEN
      NEW.is_active := OLD.is_active;
      NEW.is_featured := OLD.is_featured;
    END IF;
    IF OLD.is_active AND NOT public.has_permission('set_margins')
       AND (NEW.price_xof IS DISTINCT FROM OLD.price_xof
            OR NEW.compare_at_price_xof IS DISTINCT FROM OLD.compare_at_price_xof) THEN
      RAISE EXCEPTION 'PERMISSION_DENIED: modification du prix public d''un produit publié non autorisée'
        USING ERRCODE = '42501';
    END IF;
    NEW.reserved_quantity := OLD.reserved_quantity;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_products_guard_writes ON public.products;
CREATE TRIGGER trg_products_guard_writes
  BEFORE INSERT OR UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.guard_product_writes();

-- Groupages : un gestionnaire ne manipule ni les compteurs ni l'attribution
CREATE OR REPLACE FUNCTION public.guard_groupage_writes()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF current_user NOT IN ('anon', 'authenticated') OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.reserved_quantity := 0;
    NEW.participants_count := 0;
    NEW.created_by := auth.uid();
    NEW.assigned_manager_id := auth.uid();
  ELSE
    NEW.reserved_quantity := OLD.reserved_quantity;
    NEW.participants_count := OLD.participants_count;
    NEW.assigned_manager_id := OLD.assigned_manager_id;
    NEW.created_by := OLD.created_by;
    IF NOT public.has_permission('set_groupage_prices')
       AND OLD.status <> 'draft'
       AND (NEW.unit_price_xof IS DISTINCT FROM OLD.unit_price_xof
            OR NEW.target_quantity IS DISTINCT FROM OLD.target_quantity) THEN
      RAISE EXCEPTION 'PERMISSION_DENIED: prix et objectif d''un groupage publié modifiables par l''administration uniquement'
        USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_groupages_guard_writes ON public.groupages;
CREATE TRIGGER trg_groupages_guard_writes
  BEFORE INSERT OR UPDATE ON public.groupages
  FOR EACH ROW EXECUTE FUNCTION public.guard_groupage_writes();

-- =============================================================================
-- 9. POLITIQUES RLS
-- =============================================================================

ALTER TABLE public.product_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;

-- 9.1 Produits, images, catégories
DROP POLICY IF EXISTS daluche_products_staff_read ON public.products;
CREATE POLICY daluche_products_staff_read ON public.products FOR SELECT USING (public.is_staff());
DROP POLICY IF EXISTS daluche_products_transitaire_insert ON public.products;
CREATE POLICY daluche_products_transitaire_insert ON public.products FOR INSERT WITH CHECK (public.is_transitaire());
DROP POLICY IF EXISTS daluche_products_transitaire_update ON public.products;
CREATE POLICY daluche_products_transitaire_update ON public.products FOR UPDATE
  USING (public.is_transitaire()) WITH CHECK (public.is_transitaire());

DROP POLICY IF EXISTS daluche_product_images_staff_read ON public.product_images;
CREATE POLICY daluche_product_images_staff_read ON public.product_images FOR SELECT USING (public.is_staff());
DROP POLICY IF EXISTS daluche_product_images_transitaire_write ON public.product_images;
CREATE POLICY daluche_product_images_transitaire_write ON public.product_images FOR ALL
  USING (public.is_transitaire()) WITH CHECK (public.is_transitaire());

DROP POLICY IF EXISTS daluche_categories_staff_read ON public.categories;
CREATE POLICY daluche_categories_staff_read ON public.categories FOR SELECT USING (public.is_staff());

DROP POLICY IF EXISTS daluche_product_costs_staff ON public.product_costs;
CREATE POLICY daluche_product_costs_staff ON public.product_costs FOR ALL
  USING (public.is_admin() OR public.is_transitaire())
  WITH CHECK (public.is_admin() OR public.is_transitaire());

-- 9.2 Groupages
DROP POLICY IF EXISTS daluche_groupages_staff_read ON public.groupages;
CREATE POLICY daluche_groupages_staff_read ON public.groupages FOR SELECT USING (public.is_staff());
DROP POLICY IF EXISTS daluche_groupages_manager_insert ON public.groupages;
CREATE POLICY daluche_groupages_manager_insert ON public.groupages FOR INSERT
  WITH CHECK (public.is_groupage_manager() AND public.has_permission('create_groupages'));
DROP POLICY IF EXISTS daluche_groupages_manager_update ON public.groupages;
CREATE POLICY daluche_groupages_manager_update ON public.groupages FOR UPDATE
  USING (public.manages_groupage(id)) WITH CHECK (public.is_groupage_manager());

DROP POLICY IF EXISTS daluche_participants_manager_read ON public.groupage_participants;
CREATE POLICY daluche_participants_manager_read ON public.groupage_participants FOR SELECT
  USING (public.manages_groupage(groupage_id));

-- 9.3 Commandes (lecture personnel ; écritures via fonctions contrôlées)
DROP POLICY IF EXISTS daluche_orders_staff_read ON public.orders;
CREATE POLICY daluche_orders_staff_read ON public.orders FOR SELECT
  USING (public.is_transitaire() OR public.manages_order(id));
DROP POLICY IF EXISTS daluche_order_items_staff_read ON public.order_items;
CREATE POLICY daluche_order_items_staff_read ON public.order_items FOR SELECT
  USING (public.is_transitaire() OR public.manages_order(order_id));
DROP POLICY IF EXISTS daluche_order_history_staff_read ON public.order_status_history;
CREATE POLICY daluche_order_history_staff_read ON public.order_status_history FOR SELECT
  USING (public.is_transitaire() OR public.manages_order(order_id));

-- Coûts & revenus internes : administration générale et transitaire (coûts uniquement)
DROP POLICY IF EXISTS daluche_order_costs_admin ON public.order_costs;
CREATE POLICY daluche_order_costs_admin ON public.order_costs FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS daluche_order_costs_transitaire_read ON public.order_costs;
CREATE POLICY daluche_order_costs_transitaire_read ON public.order_costs FOR SELECT USING (public.is_transitaire());
DROP POLICY IF EXISTS daluche_order_costs_transitaire_insert ON public.order_costs;
CREATE POLICY daluche_order_costs_transitaire_insert ON public.order_costs FOR INSERT WITH CHECK (public.is_transitaire());
DROP POLICY IF EXISTS daluche_platform_revenues_admin ON public.platform_revenues;
CREATE POLICY daluche_platform_revenues_admin ON public.platform_revenues FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 9.4 Demandes de sourcing, B2B, devis
DROP POLICY IF EXISTS daluche_sourcing_transitaire_read ON public.sourcing_requests;
CREATE POLICY daluche_sourcing_transitaire_read ON public.sourcing_requests FOR SELECT USING (public.is_transitaire());
DROP POLICY IF EXISTS daluche_b2b_transitaire_read ON public.b2b_requests;
CREATE POLICY daluche_b2b_transitaire_read ON public.b2b_requests FOR SELECT USING (public.is_transitaire());
DROP POLICY IF EXISTS daluche_quotes_transitaire_read ON public.quotes;
CREATE POLICY daluche_quotes_transitaire_read ON public.quotes FOR SELECT USING (public.is_transitaire());
DROP POLICY IF EXISTS daluche_quote_items_transitaire_read ON public.quote_items;
CREATE POLICY daluche_quote_items_transitaire_read ON public.quote_items FOR SELECT USING (public.is_transitaire());

-- Fournisseurs & logistique : transitaire
DROP POLICY IF EXISTS daluche_suppliers_transitaire ON public.suppliers;
CREATE POLICY daluche_suppliers_transitaire ON public.suppliers FOR ALL
  USING (public.is_transitaire()) WITH CHECK (public.is_transitaire());
DROP POLICY IF EXISTS daluche_shipments_transitaire ON public.shipments;
CREATE POLICY daluche_shipments_transitaire ON public.shipments FOR ALL
  USING (public.is_transitaire()) WITH CHECK (public.is_transitaire());
DROP POLICY IF EXISTS daluche_shipment_events_transitaire ON public.shipment_events;
CREATE POLICY daluche_shipment_events_transitaire ON public.shipment_events FOR ALL
  USING (public.is_transitaire()) WITH CHECK (public.is_transitaire());

-- 9.5 Véhicules
DROP POLICY IF EXISTS daluche_vehicles_public_read ON public.vehicles;
CREATE POLICY daluche_vehicles_public_read ON public.vehicles FOR SELECT
  USING (is_published = true OR public.is_admin() OR public.is_transitaire());
DROP POLICY IF EXISTS daluche_vehicles_staff_insert ON public.vehicles;
CREATE POLICY daluche_vehicles_staff_insert ON public.vehicles FOR INSERT
  WITH CHECK (public.is_admin() OR public.is_transitaire());
DROP POLICY IF EXISTS daluche_vehicles_staff_update ON public.vehicles;
CREATE POLICY daluche_vehicles_staff_update ON public.vehicles FOR UPDATE
  USING (public.is_admin() OR public.is_transitaire())
  WITH CHECK (public.is_admin() OR public.is_transitaire());
DROP POLICY IF EXISTS daluche_vehicles_admin_delete ON public.vehicles;
CREATE POLICY daluche_vehicles_admin_delete ON public.vehicles FOR DELETE USING (public.is_admin());

DROP POLICY IF EXISTS daluche_vehicle_requests_read ON public.vehicle_requests;
CREATE POLICY daluche_vehicle_requests_read ON public.vehicle_requests FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin() OR public.is_transitaire());
-- Pas de politique INSERT/UPDATE : création et évolution via fonctions contrôlées.

-- 9.6 Résultats fournisseurs, messages, invitations
DROP POLICY IF EXISTS daluche_request_findings_staff ON public.request_findings;
CREATE POLICY daluche_request_findings_staff ON public.request_findings FOR ALL
  USING (public.is_admin() OR public.is_transitaire())
  WITH CHECK (public.is_admin() OR public.is_transitaire());

DROP POLICY IF EXISTS daluche_messages_read ON public.messages;
CREATE POLICY daluche_messages_read ON public.messages FOR SELECT
  USING (public.can_access_thread(thread_type, thread_id));

DROP POLICY IF EXISTS daluche_team_invitations_admin ON public.team_invitations;
CREATE POLICY daluche_team_invitations_admin ON public.team_invitations FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- =============================================================================
-- 10. CRÉATION DES DEMANDES CLIENT (identité issue exclusivement de auth.uid())
-- =============================================================================

CREATE OR REPLACE FUNCTION public.submit_sourcing_request(
  p_title text,
  p_description text,
  p_quantity int,
  p_product_url text DEFAULT NULL,
  p_image_url text DEFAULT NULL,
  p_additional_images text[] DEFAULT '{}'::text[],
  p_budget_xof numeric DEFAULT NULL,
  p_category text DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_client_name text DEFAULT NULL,
  p_client_phone text DEFAULT NULL,
  p_client_email text DEFAULT NULL
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_profile public.profiles%ROWTYPE;
  v_id uuid;
  v_code text := public.daluche_code('SRC');
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'AUTHENTICATION_REQUIRED: connectez-vous pour envoyer une demande';
  END IF;
  IF p_title IS NULL OR length(trim(p_title)) < 2 THEN
    RAISE EXCEPTION 'INVALID_INPUT: indiquez le nom du produit recherché';
  END IF;
  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RAISE EXCEPTION 'INVALID_INPUT: la quantité doit être supérieure à 0';
  END IF;
  IF p_product_url IS NOT NULL AND length(trim(p_product_url)) > 0 AND p_product_url !~* '^https?://' THEN
    RAISE EXCEPTION 'INVALID_INPUT: le lien doit commencer par http:// ou https://';
  END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE id = v_uid;

  INSERT INTO public.sourcing_requests (
    code, user_id, client_name, client_phone, client_email,
    title, description, product_url, image_url, additional_images,
    category, quantity, budget_xof, notes, status
  ) VALUES (
    v_code, v_uid,
    COALESCE(NULLIF(trim(p_client_name), ''), NULLIF(v_profile.full_name, ''), 'Client DALUCHE'),
    COALESCE(NULLIF(trim(p_client_phone), ''), NULLIF(v_profile.phone, ''), 'Non renseigné'),
    COALESCE(NULLIF(trim(p_client_email), ''), v_profile.email),
    trim(p_title),
    COALESCE(NULLIF(trim(p_description), ''), trim(p_title)),
    NULLIF(trim(p_product_url), ''),
    p_image_url,
    COALESCE(p_additional_images, '{}'::text[]),
    COALESCE(NULLIF(trim(p_category), ''), 'Général'),
    p_quantity,
    p_budget_xof,
    NULLIF(trim(p_notes), ''),
    'new'
  ) RETURNING id INTO v_id;

  PERFORM public.daluche_notify(v_uid, 'sourcing', 'Demande de sourcing reçue',
    'Votre demande ' || v_code || ' a bien été reçue. Notre équipe l''analyse.', '/compte/demandes/sourcing/' || v_id);

  RETURN jsonb_build_object('id', v_id, 'code', v_code);
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_b2b_request(
  p_company_name text,
  p_contact_name text,
  p_phone text,
  p_email text,
  p_product_description text,
  p_quantity int,
  p_sector text DEFAULT NULL,
  p_budget_xof numeric DEFAULT NULL,
  p_destination text DEFAULT NULL,
  p_customization boolean DEFAULT false,
  p_logo_instructions text DEFAULT NULL,
  p_packaging_requested boolean DEFAULT false,
  p_transport_preference text DEFAULT 'recommended',
  p_notes text DEFAULT NULL,
  p_attachments text[] DEFAULT '{}'::text[]
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_id uuid;
  v_code text := public.daluche_code('B2B');
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'AUTHENTICATION_REQUIRED: connectez-vous pour envoyer une demande';
  END IF;
  IF coalesce(length(trim(p_company_name)), 0) < 2 OR coalesce(length(trim(p_contact_name)), 0) < 2 THEN
    RAISE EXCEPTION 'INVALID_INPUT: entreprise et nom du contact obligatoires';
  END IF;
  IF coalesce(length(trim(p_phone)), 0) < 6 OR coalesce(length(trim(p_email)), 0) < 5 THEN
    RAISE EXCEPTION 'INVALID_INPUT: téléphone et email professionnels obligatoires';
  END IF;
  IF coalesce(length(trim(p_product_description)), 0) < 5 THEN
    RAISE EXCEPTION 'INVALID_INPUT: décrivez les produits recherchés';
  END IF;
  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RAISE EXCEPTION 'INVALID_INPUT: la quantité doit être supérieure à 0';
  END IF;

  INSERT INTO public.b2b_requests (
    code, user_id, company_name, contact_name, phone, email, sector,
    product_description, quantity, budget_xof, transport_preference, destination,
    customization, logo_instructions, packaging_requested, attachments, notes, status
  ) VALUES (
    v_code, v_uid, trim(p_company_name), trim(p_contact_name), trim(p_phone), lower(trim(p_email)),
    NULLIF(trim(p_sector), ''), trim(p_product_description), p_quantity, p_budget_xof,
    COALESCE(NULLIF(p_transport_preference, ''), 'recommended'),
    COALESCE(NULLIF(trim(p_destination), ''), 'Dakar, Sénégal'),
    COALESCE(p_customization, false), NULLIF(trim(p_logo_instructions), ''),
    COALESCE(p_packaging_requested, false), COALESCE(p_attachments, '{}'::text[]),
    NULLIF(trim(p_notes), ''), 'new'
  ) RETURNING id INTO v_id;

  UPDATE public.profiles SET company_name = COALESCE(company_name, trim(p_company_name)) WHERE id = v_uid;

  PERFORM public.daluche_notify(v_uid, 'b2b', 'Demande professionnelle reçue',
    'Votre demande ' || v_code || ' est enregistrée. Un conseiller vous répond sous 48 h ouvrées.', '/compte/demandes/b2b/' || v_id);

  RETURN jsonb_build_object('id', v_id, 'code', v_code);
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_vehicle_request(
  p_contact_name text,
  p_phone text,
  p_vehicle_id uuid DEFAULT NULL,
  p_email text DEFAULT NULL,
  p_city text DEFAULT NULL,
  p_message text DEFAULT NULL,
  p_vehicle_type text DEFAULT NULL,
  p_brand text DEFAULT NULL,
  p_model text DEFAULT NULL,
  p_year_min int DEFAULT NULL,
  p_budget_xof numeric DEFAULT NULL,
  p_quantity int DEFAULT 1
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_vehicle public.vehicles%ROWTYPE;
  v_id uuid;
  v_code text := public.daluche_code('AUTO');
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'AUTHENTICATION_REQUIRED: connectez-vous pour envoyer une demande';
  END IF;
  IF coalesce(length(trim(p_contact_name)), 0) < 2 OR coalesce(length(trim(p_phone)), 0) < 6 THEN
    RAISE EXCEPTION 'INVALID_INPUT: nom et téléphone obligatoires';
  END IF;
  IF p_vehicle_id IS NOT NULL THEN
    SELECT * INTO v_vehicle FROM public.vehicles WHERE id = p_vehicle_id AND is_published = true;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'NOT_FOUND: véhicule introuvable';
    END IF;
  ELSIF coalesce(length(trim(p_brand)), 0) = 0 AND coalesce(length(trim(p_message)), 0) < 5 THEN
    RAISE EXCEPTION 'INVALID_INPUT: précisez le véhicule recherché';
  END IF;

  INSERT INTO public.vehicle_requests (
    code, user_id, vehicle_id, request_type, vehicle_type, brand, model, year_min,
    budget_xof, quantity, contact_name, phone, email, city, message, status
  ) VALUES (
    v_code, v_uid, p_vehicle_id,
    CASE WHEN p_vehicle_id IS NULL THEN 'custom_search' ELSE 'vehicle' END,
    COALESCE(v_vehicle.vehicle_type, NULLIF(p_vehicle_type, '')),
    COALESCE(v_vehicle.brand, NULLIF(trim(p_brand), '')),
    COALESCE(v_vehicle.model, NULLIF(trim(p_model), '')),
    COALESCE(v_vehicle.year, p_year_min),
    p_budget_xof, GREATEST(COALESCE(p_quantity, 1), 1),
    trim(p_contact_name), trim(p_phone), NULLIF(lower(trim(p_email)), ''),
    COALESCE(NULLIF(trim(p_city), ''), 'Dakar'), NULLIF(trim(p_message), ''), 'new'
  ) RETURNING id INTO v_id;

  PERFORM public.daluche_notify(v_uid, 'vehicle', 'Demande automobile reçue',
    'Votre demande ' || v_code || ' est enregistrée. Un conseiller vous contacte rapidement.', '/compte/demandes/vehicle/' || v_id);

  RETURN jsonb_build_object('id', v_id, 'code', v_code);
END;
$$;

-- =============================================================================
-- 11. GROUPAGES : participation + commande à payer, en une transaction
-- =============================================================================

CREATE OR REPLACE FUNCTION public.join_groupage(
  p_groupage_id uuid,
  p_quantity int,
  p_customer_name text DEFAULT NULL,
  p_customer_phone text DEFAULT NULL,
  p_customer_city text DEFAULT NULL,
  p_hub_id uuid DEFAULT NULL
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_profile public.profiles%ROWTYPE;
  v_email text;
  g public.groupages%ROWTYPE;
  p public.products%ROWTYPE;
  v_image text;
  v_existing_qty int;
  v_is_new_participant boolean;
  v_new_reserved int;
  v_status text;
  v_total numeric(14,2);
  v_order_id uuid;
  v_participant_id uuid;
  v_tracking text := 'AWP-' || upper(substr(md5(gen_random_uuid()::text), 1, 8));
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'AUTHENTICATION_REQUIRED: connectez-vous pour participer';
  END IF;
  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RAISE EXCEPTION 'INVALID_QUANTITY: quantité invalide';
  END IF;

  SELECT * INTO g FROM public.groupages WHERE id = p_groupage_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'NOT_FOUND: groupage introuvable';
  END IF;
  IF g.status NOT IN ('open', 'almost_full') THEN
    RAISE EXCEPTION 'GROUPAGE_CLOSED: ce groupage n''accepte plus de participations';
  END IF;
  IF g.deadline IS NOT NULL AND g.deadline < now() THEN
    RAISE EXCEPTION 'GROUPAGE_EXPIRED: la date limite de participation est dépassée';
  END IF;
  IF p_quantity < g.min_order_per_user THEN
    RAISE EXCEPTION 'MIN_QUANTITY: minimum % unité(s) par participant', g.min_order_per_user;
  END IF;

  SELECT COALESCE(SUM(quantity), 0) INTO v_existing_qty
  FROM public.groupage_participants
  WHERE groupage_id = g.id AND user_id = v_uid AND status NOT IN ('cancelled', 'refunded');

  IF v_existing_qty + p_quantity > g.max_order_per_user THEN
    RAISE EXCEPTION 'MAX_QUANTITY: maximum % unité(s) par participant', g.max_order_per_user;
  END IF;
  IF g.reserved_quantity + p_quantity > g.target_quantity THEN
    RAISE EXCEPTION 'INSUFFICIENT_QUOTA: il reste % unité(s) disponible(s)', GREATEST(g.target_quantity - g.reserved_quantity, 0);
  END IF;

  SELECT * INTO p FROM public.products WHERE id = g.product_id;
  SELECT image_url INTO v_image FROM public.product_images
    WHERE product_id = g.product_id ORDER BY is_primary DESC, sort_order ASC LIMIT 1;

  SELECT * INTO v_profile FROM public.profiles WHERE id = v_uid;
  SELECT email INTO v_email FROM auth.users WHERE id = v_uid;

  v_total := g.unit_price_xof * p_quantity;

  INSERT INTO public.orders (
    tracking_code, user_id, customer_name, customer_phone, customer_email, customer_city,
    subtotal_xof, shipping_fee_xof, discount_amount_xof, total_xof, currency,
    payment_method, payment_status, order_status, delivery_type, hub_location_id, notes, order_kind
  ) VALUES (
    v_tracking, v_uid,
    COALESCE(NULLIF(trim(p_customer_name), ''), NULLIF(v_profile.full_name, ''), 'Client DALUCHE'),
    COALESCE(NULLIF(trim(p_customer_phone), ''), NULLIF(v_profile.phone, ''), 'Non renseigné'),
    COALESCE(v_email, v_profile.email, ''),
    COALESCE(NULLIF(trim(p_customer_city), ''), v_profile.city, 'Dakar'),
    v_total, 0, 0, v_total, 'XOF',
    'geniuspay', 'pending', 'pending_payment', 'hub_pickup', p_hub_id,
    'Participation au groupage ' || g.code, 'groupage'
  ) RETURNING id INTO v_order_id;

  INSERT INTO public.order_items (
    order_id, product_id, groupage_id, product_name_snapshot, sku_snapshot, image_url_snapshot,
    transport_mode_snapshot, quantity, unit_price_xof, subtotal_xof
  ) VALUES (
    v_order_id, g.product_id, g.id, COALESCE(p.name, g.title), p.sku, COALESCE(g.image_url, v_image),
    g.transport_mode, p_quantity, g.unit_price_xof, v_total
  );

  INSERT INTO public.order_status_history (order_id, old_status, new_status, location, description, actor_id)
  VALUES (v_order_id, NULL, 'pending_payment', 'DALUCHE', 'Participation au groupage ' || g.code || ' en attente de paiement', v_uid);

  INSERT INTO public.groupage_participants (groupage_id, user_id, quantity, unit_price_xof, total_xof, status, order_id)
  VALUES (g.id, v_uid, p_quantity, g.unit_price_xof, v_total, 'reserved', v_order_id)
  RETURNING id INTO v_participant_id;

  v_is_new_participant := v_existing_qty = 0;
  v_new_reserved := g.reserved_quantity + p_quantity;
  v_status := CASE
    WHEN v_new_reserved >= g.target_quantity THEN 'full'
    WHEN v_new_reserved >= ceil(g.target_quantity * 0.8) THEN 'almost_full'
    ELSE g.status
  END;

  UPDATE public.groupages
  SET reserved_quantity = v_new_reserved,
      participants_count = participants_count + CASE WHEN v_is_new_participant THEN 1 ELSE 0 END,
      status = v_status
  WHERE id = g.id;

  RETURN jsonb_build_object(
    'order_id', v_order_id,
    'tracking_code', v_tracking,
    'participant_id', v_participant_id,
    'total_xof', v_total,
    'groupage_status', v_status
  );
END;
$$;

-- Annulation d'une participation non payée par le client
CREATE OR REPLACE FUNCTION public.cancel_my_groupage_participation(p_participant_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  gp public.groupage_participants%ROWTYPE;
  g public.groupages%ROWTYPE;
  v_remaining int;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'AUTHENTICATION_REQUIRED'; END IF;

  SELECT * INTO gp FROM public.groupage_participants WHERE id = p_participant_id FOR UPDATE;
  IF NOT FOUND OR gp.user_id <> v_uid THEN
    RAISE EXCEPTION 'NOT_FOUND: participation introuvable';
  END IF;
  IF gp.status NOT IN ('reserved', 'confirmed') THEN
    RAISE EXCEPTION 'NOT_CANCELLABLE: une participation payée ne peut pas être annulée en ligne, contactez le support';
  END IF;

  SELECT * INTO g FROM public.groupages WHERE id = gp.groupage_id FOR UPDATE;
  IF g.status NOT IN ('open', 'almost_full', 'full') THEN
    RAISE EXCEPTION 'NOT_CANCELLABLE: le groupage est déjà en cours de traitement';
  END IF;

  UPDATE public.groupage_participants SET status = 'cancelled' WHERE id = gp.id;

  SELECT count(*) INTO v_remaining FROM public.groupage_participants
  WHERE groupage_id = g.id AND user_id = v_uid AND status NOT IN ('cancelled', 'refunded');

  UPDATE public.groupages
  SET reserved_quantity = GREATEST(reserved_quantity - gp.quantity, 0),
      participants_count = GREATEST(participants_count - CASE WHEN v_remaining = 0 THEN 1 ELSE 0 END, 0),
      status = CASE WHEN status IN ('full', 'almost_full')
                     AND GREATEST(reserved_quantity - gp.quantity, 0) < ceil(target_quantity * 0.8)
                    THEN 'open' ELSE status END
  WHERE id = g.id;

  IF gp.order_id IS NOT NULL THEN
    UPDATE public.orders SET order_status = 'cancelled', payment_status = 'cancelled'
    WHERE id = gp.order_id AND payment_status <> 'paid';
    INSERT INTO public.order_status_history (order_id, old_status, new_status, location, description, actor_id)
    VALUES (gp.order_id, 'pending_payment', 'cancelled', 'DALUCHE', 'Participation annulée par le client', v_uid);
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- =============================================================================
-- 12. PERSONNEL : COMMANDES, COÛTS, DEMANDES, DEVIS, GROUPAGES
-- =============================================================================

CREATE OR REPLACE FUNCTION public.staff_update_order(
  p_order_id uuid,
  p_status text DEFAULT NULL,
  p_note text DEFAULT NULL,
  p_location text DEFAULT NULL,
  p_carrier_reference text DEFAULT NULL,
  p_logistics_notes text DEFAULT NULL,
  p_estimated_delivery_date date DEFAULT NULL,
  p_transport_mode text DEFAULT NULL
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  o public.orders%ROWTYPE;
  v_uid uuid := auth.uid();
  v_is_admin boolean := public.is_admin();
  v_fulfillment text[] := ARRAY['supplier_ordered', 'preparing', 'shipped', 'in_transit', 'arrived', 'ready_for_delivery', 'delivered'];
  v_labels jsonb := jsonb_build_object(
    'pending_payment', 'En attente de paiement', 'paid', 'Paiement confirmé',
    'supplier_ordered', 'Commandé auprès du fournisseur', 'preparing', 'En préparation en Chine',
    'shipped', 'Expédié depuis la Chine', 'in_transit', 'En transit international',
    'arrived', 'Arrivé à destination', 'ready_for_delivery', 'Prêt pour retrait / livraison',
    'delivered', 'Livré', 'cancelled', 'Annulée');
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'AUTHENTICATION_REQUIRED'; END IF;

  SELECT * INTO o FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'NOT_FOUND: commande introuvable'; END IF;

  IF NOT (v_is_admin OR public.is_transitaire() OR public.manages_order(p_order_id)) THEN
    RAISE EXCEPTION 'PERMISSION_DENIED' USING ERRCODE = '42501';
  END IF;

  IF p_status IS NOT NULL AND p_status IS DISTINCT FROM o.order_status THEN
    IF NOT (v_labels ? p_status) THEN
      RAISE EXCEPTION 'INVALID_STATUS: statut inconnu';
    END IF;
    IF NOT v_is_admin THEN
      IF NOT (p_status = ANY(v_fulfillment)) THEN
        RAISE EXCEPTION 'PERMISSION_DENIED: statut réservé à l''administration' USING ERRCODE = '42501';
      END IF;
      IF o.payment_status <> 'paid' THEN
        RAISE EXCEPTION 'PAYMENT_REQUIRED: la commande doit être payée avant traitement logistique';
      END IF;
    END IF;

    UPDATE public.orders SET order_status = p_status,
      payment_status = CASE WHEN p_status = 'cancelled' AND payment_status <> 'paid' THEN 'cancelled' ELSE payment_status END
    WHERE id = o.id;

    -- Annulation : libère le quota des participations groupage non payées
    IF p_status = 'cancelled' THEN
      UPDATE public.groupages g
      SET reserved_quantity = GREATEST(g.reserved_quantity - x.qty, 0),
          status = CASE WHEN g.status IN ('full', 'almost_full') THEN 'open' ELSE g.status END
      FROM (SELECT groupage_id, sum(quantity) AS qty FROM public.groupage_participants
            WHERE order_id = o.id AND status IN ('reserved', 'confirmed') GROUP BY groupage_id) x
      WHERE g.id = x.groupage_id;
      UPDATE public.groupage_participants SET status = 'cancelled'
      WHERE order_id = o.id AND status IN ('reserved', 'confirmed');
    END IF;

    INSERT INTO public.order_status_history (order_id, old_status, new_status, location, description, actor_id)
    VALUES (o.id, o.order_status, p_status, COALESCE(NULLIF(trim(p_location), ''), 'DALUCHE'),
            COALESCE(NULLIF(trim(p_note), ''), v_labels ->> p_status), v_uid);

    PERFORM public.daluche_notify(o.user_id, 'order', 'Commande ' || o.tracking_code,
      'Nouveau statut : ' || (v_labels ->> p_status) || COALESCE(' — ' || NULLIF(trim(p_note), ''), ''),
      '/compte/commandes/' || o.id);
  END IF;

  UPDATE public.orders SET
    carrier_reference = COALESCE(NULLIF(trim(p_carrier_reference), ''), carrier_reference),
    logistics_notes = COALESCE(NULLIF(trim(p_logistics_notes), ''), logistics_notes),
    estimated_delivery_date = COALESCE(p_estimated_delivery_date, estimated_delivery_date),
    transport_mode = COALESCE(NULLIF(p_transport_mode, ''), transport_mode)
  WHERE id = o.id;

  RETURN jsonb_build_object('success', true, 'order_id', o.id);
END;
$$;

CREATE OR REPLACE FUNCTION public.staff_add_order_cost(
  p_order_id uuid, p_cost_type text, p_amount_xof numeric, p_description text DEFAULT NULL
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid;
BEGIN
  IF NOT (public.is_admin() OR public.is_transitaire()) THEN
    RAISE EXCEPTION 'PERMISSION_DENIED' USING ERRCODE = '42501';
  END IF;
  IF p_amount_xof IS NULL OR p_amount_xof < 0 THEN
    RAISE EXCEPTION 'INVALID_INPUT: montant invalide';
  END IF;
  IF p_cost_type NOT IN ('supplier', 'sourcing', 'inspection', 'consolidation', 'transport', 'customs', 'other') THEN
    RAISE EXCEPTION 'INVALID_INPUT: type de coût invalide';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.orders WHERE id = p_order_id) THEN
    RAISE EXCEPTION 'NOT_FOUND: commande introuvable';
  END IF;
  INSERT INTO public.order_costs (order_id, cost_type, amount_xof, currency, description)
  VALUES (p_order_id, p_cost_type, round(p_amount_xof), 'XOF', NULLIF(trim(p_description), ''))
  RETURNING id INTO v_id;
  RETURN jsonb_build_object('id', v_id);
END;
$$;

-- Mise à jour d'une demande (sourcing | b2b | vehicle) par le personnel
CREATE OR REPLACE FUNCTION public.staff_update_request(
  p_type text,
  p_id uuid,
  p_status text DEFAULT NULL,
  p_assigned_to uuid DEFAULT NULL,
  p_internal_notes text DEFAULT NULL,
  p_message_to_client text DEFAULT NULL,
  p_unassign boolean DEFAULT false
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_owner uuid;
  v_code text;
  v_old_status text;
  v_allowed text[];
  v_link text;
  v_labels jsonb := jsonb_build_object(
    'new', 'Reçue', 'researching', 'Recherche fournisseurs', 'supplier_found', 'Fournisseur identifié',
    'negotiating', 'Négociation en cours', 'quote_ready', 'Devis en préparation', 'quote_sent', 'Devis envoyé',
    'accepted', 'Devis accepté', 'rejected', 'Refusée', 'ordered', 'Commandée', 'completed', 'Terminée',
    'cancelled', 'Annulée', 'qualified', 'Qualifiée', 'sourcing', 'Recherche fournisseurs',
    'negotiation', 'Négociation en cours', 'deposit_paid', 'Acompte reçu', 'production', 'En production',
    'shipping', 'Expédition en cours', 'in_review', 'En cours d''étude', 'shipped', 'Expédié',
    'delivered', 'Livré');
BEGIN
  IF v_uid IS NULL OR NOT (public.is_admin() OR public.is_transitaire()) THEN
    RAISE EXCEPTION 'PERMISSION_DENIED' USING ERRCODE = '42501';
  END IF;

  IF p_assigned_to IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = p_assigned_to
      AND (lower(role) IN ('admin', 'super_admin', 'operations', 'commercial', 'finance', 'transitaire', 'sourcing', 'sourcer'))
  ) THEN
    RAISE EXCEPTION 'INVALID_INPUT: la personne assignée doit faire partie de l''équipe';
  END IF;
  -- Un transitaire ne peut s'attribuer une demande qu'à lui-même
  IF p_assigned_to IS NOT NULL AND NOT public.is_admin() AND p_assigned_to <> v_uid THEN
    RAISE EXCEPTION 'PERMISSION_DENIED: seule l''administration peut attribuer une demande à un autre membre' USING ERRCODE = '42501';
  END IF;

  IF p_type = 'sourcing' THEN
    v_allowed := ARRAY['new', 'researching', 'supplier_found', 'negotiating', 'quote_ready', 'quote_sent', 'accepted', 'rejected', 'ordered', 'completed', 'cancelled'];
    SELECT user_id, code, status INTO v_owner, v_code, v_old_status FROM public.sourcing_requests WHERE id = p_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
    IF p_status IS NOT NULL AND NOT (p_status = ANY(v_allowed)) THEN RAISE EXCEPTION 'INVALID_STATUS'; END IF;
    UPDATE public.sourcing_requests SET
      status = COALESCE(p_status, status),
      assigned_to = CASE WHEN p_unassign THEN NULL ELSE COALESCE(p_assigned_to, assigned_to) END,
      internal_notes = COALESCE(p_internal_notes, internal_notes)
    WHERE id = p_id;
    v_link := '/compte/demandes/sourcing/' || p_id;
  ELSIF p_type = 'b2b' THEN
    v_allowed := ARRAY['new', 'qualified', 'sourcing', 'negotiation', 'quote_sent', 'accepted', 'deposit_paid', 'production', 'shipping', 'completed', 'cancelled'];
    SELECT user_id, code, status INTO v_owner, v_code, v_old_status FROM public.b2b_requests WHERE id = p_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
    IF p_status IS NOT NULL AND NOT (p_status = ANY(v_allowed)) THEN RAISE EXCEPTION 'INVALID_STATUS'; END IF;
    UPDATE public.b2b_requests SET
      status = COALESCE(p_status, status),
      assigned_user_id = CASE WHEN p_unassign THEN NULL ELSE COALESCE(p_assigned_to, assigned_user_id) END,
      internal_notes = COALESCE(p_internal_notes, internal_notes)
    WHERE id = p_id;
    v_link := '/compte/demandes/b2b/' || p_id;
  ELSIF p_type = 'vehicle' THEN
    v_allowed := ARRAY['new', 'in_review', 'quote_sent', 'accepted', 'deposit_paid', 'ordered', 'shipped', 'delivered', 'cancelled'];
    SELECT user_id, code, status INTO v_owner, v_code, v_old_status FROM public.vehicle_requests WHERE id = p_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
    IF p_status IS NOT NULL AND NOT (p_status = ANY(v_allowed)) THEN RAISE EXCEPTION 'INVALID_STATUS'; END IF;
    UPDATE public.vehicle_requests SET
      status = COALESCE(p_status, status),
      assigned_to = CASE WHEN p_unassign THEN NULL ELSE COALESCE(p_assigned_to, assigned_to) END,
      internal_notes = COALESCE(p_internal_notes, internal_notes)
    WHERE id = p_id;
    v_link := '/compte/demandes/vehicle/' || p_id;
  ELSE
    RAISE EXCEPTION 'INVALID_TYPE';
  END IF;

  IF p_status IS NOT NULL AND p_status IS DISTINCT FROM v_old_status THEN
    PERFORM public.daluche_notify(v_owner, p_type, 'Demande ' || v_code,
      'Nouveau statut : ' || COALESCE(v_labels ->> p_status, p_status), v_link);
  END IF;

  IF p_message_to_client IS NOT NULL AND length(trim(p_message_to_client)) > 0 THEN
    INSERT INTO public.messages (thread_type, thread_id, sender_id, sender_role, sender_name, body)
    VALUES (p_type, p_id, v_uid, 'staff', 'Équipe DALUCHE', trim(p_message_to_client));
    PERFORM public.daluche_notify(v_owner, 'message', 'Nouveau message — ' || v_code,
      left(trim(p_message_to_client), 180), v_link);
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Création (et envoi) d'un devis pour une demande
CREATE OR REPLACE FUNCTION public.staff_create_quote(
  p_type text,
  p_request_id uuid,
  p_items jsonb,
  p_shipping_xof numeric DEFAULT 0,
  p_customs_xof numeric DEFAULT 0,
  p_fees_xof numeric DEFAULT 0,
  p_discount_xof numeric DEFAULT 0,
  p_deposit_percent numeric DEFAULT 50,
  p_valid_days int DEFAULT 15,
  p_lead_time text DEFAULT NULL,
  p_transport_mode text DEFAULT 'sea',
  p_conditions text[] DEFAULT '{}'::text[],
  p_notes text DEFAULT NULL,
  p_send boolean DEFAULT true
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_owner uuid;
  v_code text;
  v_title text;
  v_client_name text;
  v_company text;
  v_phone text;
  v_email text;
  v_subtotal numeric(14,2) := 0;
  v_total numeric(14,2);
  v_deposit numeric(14,2);
  v_version int;
  v_quote_id uuid;
  v_number text := public.daluche_code('DEV');
  v_item jsonb;
  v_qty int;
  v_price numeric;
  v_link text;
BEGIN
  IF v_uid IS NULL OR NOT (public.is_admin() OR public.is_transitaire()) THEN
    RAISE EXCEPTION 'PERMISSION_DENIED' USING ERRCODE = '42501';
  END IF;
  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'INVALID_INPUT: ajoutez au moins une ligne au devis';
  END IF;

  IF p_type = 'sourcing' THEN
    SELECT user_id, code, title, client_name, client_company, client_phone, client_email
      INTO v_owner, v_code, v_title, v_client_name, v_company, v_phone, v_email
      FROM public.sourcing_requests WHERE id = p_request_id;
  ELSIF p_type = 'b2b' THEN
    SELECT user_id, code, left(product_description, 120), contact_name, company_name, phone, email
      INTO v_owner, v_code, v_title, v_client_name, v_company, v_phone, v_email
      FROM public.b2b_requests WHERE id = p_request_id;
  ELSIF p_type = 'vehicle' THEN
    SELECT user_id, code, trim(COALESCE(brand, '') || ' ' || COALESCE(model, '')), contact_name, NULL, phone, email
      INTO v_owner, v_code, v_title, v_client_name, v_company, v_phone, v_email
      FROM public.vehicle_requests WHERE id = p_request_id;
  ELSE
    RAISE EXCEPTION 'INVALID_TYPE';
  END IF;
  IF v_code IS NULL THEN RAISE EXCEPTION 'NOT_FOUND: demande introuvable'; END IF;
  IF v_owner IS NULL THEN RAISE EXCEPTION 'INVALID_INPUT: la demande n''est rattachée à aucun compte client'; END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_qty := GREATEST(COALESCE((v_item ->> 'quantity')::int, 1), 1);
    v_price := GREATEST(COALESCE((v_item ->> 'unit_price_xof')::numeric, 0), 0);
    v_subtotal := v_subtotal + round(v_qty * v_price);
  END LOOP;

  v_total := GREATEST(v_subtotal + COALESCE(p_shipping_xof, 0) + COALESCE(p_customs_xof, 0)
                      + COALESCE(p_fees_xof, 0) - COALESCE(p_discount_xof, 0), 0);
  IF v_total <= 0 THEN RAISE EXCEPTION 'INVALID_INPUT: le total du devis doit être positif'; END IF;
  v_deposit := round(v_total * LEAST(GREATEST(COALESCE(p_deposit_percent, 100), 0), 100) / 100);

  SELECT COALESCE(max(version), 0) + 1 INTO v_version FROM public.quotes
  WHERE (p_type = 'sourcing' AND sourcing_request_id = p_request_id)
     OR (p_type = 'b2b' AND b2b_request_id = p_request_id)
     OR (p_type = 'vehicle' AND vehicle_request_id = p_request_id);

  -- Les devis précédents encore ouverts sont remplacés
  UPDATE public.quotes SET status = 'cancelled'
  WHERE status IN ('draft', 'sent', 'viewed')
    AND ((p_type = 'sourcing' AND sourcing_request_id = p_request_id)
      OR (p_type = 'b2b' AND b2b_request_id = p_request_id)
      OR (p_type = 'vehicle' AND vehicle_request_id = p_request_id));

  INSERT INTO public.quotes (
    quote_number, user_id, sourcing_request_id, b2b_request_id, vehicle_request_id,
    client_name, company_name, phone, email, currency,
    subtotal_xof, shipping_xof, customs_xof, fees_xof, discount_xof, total_xof,
    deposit_required_percent, deposit_amount_xof, balance_due_xof,
    valid_until, lead_time_days, transport_mode, conditions, version, status, notes,
    sent_at, created_by, title
  ) VALUES (
    v_number, v_owner,
    CASE WHEN p_type = 'sourcing' THEN p_request_id END,
    CASE WHEN p_type = 'b2b' THEN p_request_id END,
    CASE WHEN p_type = 'vehicle' THEN p_request_id END,
    COALESCE(v_client_name, 'Client DALUCHE'), v_company, COALESCE(v_phone, 'Non renseigné'), v_email, 'XOF',
    v_subtotal, COALESCE(p_shipping_xof, 0), COALESCE(p_customs_xof, 0), COALESCE(p_fees_xof, 0),
    COALESCE(p_discount_xof, 0), v_total,
    LEAST(GREATEST(COALESCE(p_deposit_percent, 100), 0), 100), v_deposit, v_total - v_deposit,
    (current_date + GREATEST(COALESCE(p_valid_days, 15), 1)),
    COALESCE(NULLIF(trim(p_lead_time), ''), 'À confirmer'),
    COALESCE(NULLIF(p_transport_mode, ''), 'sea'),
    COALESCE(p_conditions, '{}'::text[]), v_version,
    CASE WHEN p_send THEN 'sent' ELSE 'draft' END,
    NULLIF(trim(p_notes), ''),
    CASE WHEN p_send THEN now() END, v_uid, v_title
  ) RETURNING id INTO v_quote_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_qty := GREATEST(COALESCE((v_item ->> 'quantity')::int, 1), 1);
    v_price := GREATEST(COALESCE((v_item ->> 'unit_price_xof')::numeric, 0), 0);
    INSERT INTO public.quote_items (quote_id, description, quantity, unit_price_xof, subtotal_xof)
    VALUES (v_quote_id, COALESCE(NULLIF(trim(v_item ->> 'description'), ''), 'Article'), v_qty, v_price, round(v_qty * v_price));
  END LOOP;

  IF p_send THEN
    IF p_type = 'sourcing' THEN
      UPDATE public.sourcing_requests SET status = 'quote_sent' WHERE id = p_request_id;
      v_link := '/compte/demandes/sourcing/' || p_request_id;
    ELSIF p_type = 'b2b' THEN
      UPDATE public.b2b_requests SET status = 'quote_sent' WHERE id = p_request_id;
      v_link := '/compte/demandes/b2b/' || p_request_id;
    ELSE
      UPDATE public.vehicle_requests SET status = 'quote_sent' WHERE id = p_request_id;
      v_link := '/compte/demandes/vehicle/' || p_request_id;
    END IF;
    PERFORM public.daluche_notify(v_owner, 'quote', 'Nouveau devis disponible',
      'Le devis ' || v_number || ' pour votre demande ' || v_code || ' est prêt. Consultez-le et validez-le en ligne.',
      v_link);
  END IF;

  RETURN jsonb_build_object('id', v_quote_id, 'quote_number', v_number, 'total_xof', v_total, 'version', v_version);
END;
$$;

-- Réponse du client à un devis
CREATE OR REPLACE FUNCTION public.respond_to_quote(p_quote_id uuid, p_accept boolean, p_reason text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  q public.quotes%ROWTYPE;
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'AUTHENTICATION_REQUIRED'; END IF;
  SELECT * INTO q FROM public.quotes WHERE id = p_quote_id FOR UPDATE;
  IF NOT FOUND OR q.user_id IS DISTINCT FROM v_uid THEN
    RAISE EXCEPTION 'NOT_FOUND: devis introuvable';
  END IF;
  IF q.status NOT IN ('sent', 'viewed') THEN
    RAISE EXCEPTION 'INVALID_STATE: ce devis n''est plus modifiable';
  END IF;
  IF q.valid_until < current_date THEN
    UPDATE public.quotes SET status = 'expired' WHERE id = q.id;
    RAISE EXCEPTION 'QUOTE_EXPIRED: ce devis a expiré, demandez une mise à jour à notre équipe';
  END IF;

  IF p_accept THEN
    UPDATE public.quotes SET status = 'accepted', accepted_at = now() WHERE id = q.id;
    UPDATE public.sourcing_requests SET status = 'accepted' WHERE id = q.sourcing_request_id;
    UPDATE public.b2b_requests SET status = 'accepted' WHERE id = q.b2b_request_id;
    UPDATE public.vehicle_requests SET status = 'accepted' WHERE id = q.vehicle_request_id;
  ELSE
    UPDATE public.quotes SET status = 'rejected', rejected_at = now(), rejection_reason = NULLIF(trim(p_reason), '')
    WHERE id = q.id;
    UPDATE public.sourcing_requests SET status = 'negotiating' WHERE id = q.sourcing_request_id;
    UPDATE public.b2b_requests SET status = 'negotiation' WHERE id = q.b2b_request_id;
    UPDATE public.vehicle_requests SET status = 'in_review' WHERE id = q.vehicle_request_id;
    IF p_reason IS NOT NULL AND length(trim(p_reason)) > 0 THEN
      INSERT INTO public.messages (thread_type, thread_id, sender_id, sender_role, sender_name, body)
      SELECT t.kind, t.rid, v_uid, 'client', NULL, 'Devis ' || q.quote_number || ' refusé : ' || trim(p_reason)
      FROM (VALUES ('sourcing', q.sourcing_request_id), ('b2b', q.b2b_request_id), ('vehicle', q.vehicle_request_id)) AS t(kind, rid)
      WHERE t.rid IS NOT NULL;
    END IF;
  END IF;

  RETURN jsonb_build_object('success', true, 'status', CASE WHEN p_accept THEN 'accepted' ELSE 'rejected' END);
END;
$$;

-- Commande de paiement (acompte / solde / total) pour un devis accepté
CREATE OR REPLACE FUNCTION public.create_order_from_quote(p_quote_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  q public.quotes%ROWTYPE;
  v_uid uuid := auth.uid();
  v_profile public.profiles%ROWTYPE;
  v_deposit_paid boolean;
  v_balance_paid boolean;
  v_kind text;
  v_amount numeric(14,2);
  v_existing uuid;
  v_order_id uuid;
  v_tracking text := 'AWP-' || upper(substr(md5(gen_random_uuid()::text), 1, 8));
  v_label text;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'AUTHENTICATION_REQUIRED'; END IF;
  SELECT * INTO q FROM public.quotes WHERE id = p_quote_id FOR UPDATE;
  IF NOT FOUND OR q.user_id IS DISTINCT FROM v_uid THEN RAISE EXCEPTION 'NOT_FOUND: devis introuvable'; END IF;
  IF q.status <> 'accepted' THEN RAISE EXCEPTION 'INVALID_STATE: validez d''abord le devis'; END IF;

  SELECT EXISTS (SELECT 1 FROM public.orders WHERE quote_id = q.id AND payment_status = 'paid' AND quote_payment_kind IN ('deposit', 'full'))
    INTO v_deposit_paid;
  SELECT EXISTS (SELECT 1 FROM public.orders WHERE quote_id = q.id AND payment_status = 'paid' AND quote_payment_kind IN ('balance', 'full'))
    INTO v_balance_paid;

  IF v_balance_paid THEN RAISE EXCEPTION 'ALREADY_PAID: ce devis est entièrement réglé'; END IF;

  IF NOT v_deposit_paid THEN
    IF q.deposit_amount_xof > 0 AND q.deposit_amount_xof < q.total_xof THEN
      v_kind := 'deposit'; v_amount := q.deposit_amount_xof; v_label := 'Acompte';
    ELSE
      v_kind := 'full'; v_amount := q.total_xof; v_label := 'Règlement';
    END IF;
  ELSE
    v_kind := 'balance'; v_amount := q.total_xof - q.deposit_amount_xof; v_label := 'Solde';
    IF v_amount <= 0 THEN RAISE EXCEPTION 'ALREADY_PAID: aucun solde restant'; END IF;
  END IF;

  -- Réutilise une commande en attente pour la même échéance (double clic, retour arrière…)
  SELECT id INTO v_existing FROM public.orders
  WHERE quote_id = q.id AND quote_payment_kind = v_kind AND payment_status IN ('pending', 'processing', 'failed')
    AND order_status = 'pending_payment'
  ORDER BY created_at DESC LIMIT 1;
  IF v_existing IS NOT NULL THEN
    RETURN jsonb_build_object('order_id', v_existing, 'amount_xof', v_amount, 'kind', v_kind, 'reused', true);
  END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE id = v_uid;

  INSERT INTO public.orders (
    tracking_code, user_id, customer_name, customer_phone, customer_email, customer_city,
    subtotal_xof, shipping_fee_xof, discount_amount_xof, total_xof, currency,
    payment_method, payment_status, order_status, delivery_type, notes,
    order_kind, quote_id, quote_payment_kind
  ) VALUES (
    v_tracking, v_uid, q.client_name, q.phone,
    COALESCE(q.email, v_profile.email, ''), COALESCE(v_profile.city, 'Dakar'),
    v_amount, 0, 0, v_amount, 'XOF',
    'geniuspay', 'pending', 'pending_payment', 'hub_pickup',
    v_label || ' du devis ' || q.quote_number, 'quote', q.id, v_kind
  ) RETURNING id INTO v_order_id;

  INSERT INTO public.order_items (order_id, product_id, product_name_snapshot, quantity, unit_price_xof, subtotal_xof)
  VALUES (v_order_id, NULL, v_label || ' — devis ' || q.quote_number || COALESCE(' — ' || q.title, ''), 1, v_amount, v_amount);

  INSERT INTO public.order_status_history (order_id, old_status, new_status, location, description, actor_id)
  VALUES (v_order_id, NULL, 'pending_payment', 'DALUCHE', v_label || ' du devis ' || q.quote_number || ' en attente de paiement', v_uid);

  RETURN jsonb_build_object('order_id', v_order_id, 'amount_xof', v_amount, 'kind', v_kind, 'reused', false);
END;
$$;

-- Messagerie : envoi d'un message (client ou personnel)
CREATE OR REPLACE FUNCTION public.post_message(p_thread_type text, p_thread_id uuid, p_body text, p_attachment_url text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_is_staff boolean := public.is_staff();
  v_owner uuid;
  v_code text;
  v_name text;
  v_id uuid;
  v_link text;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'AUTHENTICATION_REQUIRED'; END IF;
  IF p_body IS NULL OR length(trim(p_body)) = 0 THEN RAISE EXCEPTION 'INVALID_INPUT: message vide'; END IF;
  IF NOT public.can_access_thread(p_thread_type, p_thread_id) THEN
    RAISE EXCEPTION 'PERMISSION_DENIED' USING ERRCODE = '42501';
  END IF;

  IF p_thread_type = 'sourcing' THEN
    SELECT user_id, code INTO v_owner, v_code FROM public.sourcing_requests WHERE id = p_thread_id;
  ELSIF p_thread_type = 'b2b' THEN
    SELECT user_id, code INTO v_owner, v_code FROM public.b2b_requests WHERE id = p_thread_id;
  ELSIF p_thread_type = 'vehicle' THEN
    SELECT user_id, code INTO v_owner, v_code FROM public.vehicle_requests WHERE id = p_thread_id;
  ELSE
    SELECT user_id, tracking_code INTO v_owner, v_code FROM public.orders WHERE id = p_thread_id;
  END IF;

  SELECT full_name INTO v_name FROM public.profiles WHERE id = v_uid;

  INSERT INTO public.messages (thread_type, thread_id, sender_id, sender_role, sender_name, body, attachment_url)
  VALUES (p_thread_type, p_thread_id, v_uid,
          CASE WHEN v_is_staff AND v_owner IS DISTINCT FROM v_uid THEN 'staff' ELSE 'client' END,
          CASE WHEN v_is_staff AND v_owner IS DISTINCT FROM v_uid THEN 'Équipe DALUCHE' ELSE v_name END,
          trim(p_body), p_attachment_url)
  RETURNING id INTO v_id;

  v_link := CASE WHEN p_thread_type = 'order' THEN '/compte/commandes/' ELSE '/compte/demandes/' || p_thread_type || '/' END || p_thread_id;
  IF v_is_staff AND v_owner IS DISTINCT FROM v_uid THEN
    PERFORM public.daluche_notify(v_owner, 'message', 'Nouveau message — ' || v_code, left(trim(p_body), 180), v_link);
  END IF;

  RETURN jsonb_build_object('id', v_id);
END;
$$;

-- Statut d'un groupage (admin ou gestionnaire attitré)
CREATE OR REPLACE FUNCTION public.staff_update_groupage_status(p_groupage_id uuid, p_status text, p_note text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  g public.groupages%ROWTYPE;
  r record;
  v_labels jsonb := jsonb_build_object(
    'draft', 'Brouillon', 'open', 'Ouvert', 'almost_full', 'Presque complet', 'full', 'Objectif atteint',
    'validated', 'Validé', 'supplier_ordered', 'Commandé à l''usine', 'preparing', 'En préparation',
    'shipped', 'Expédié', 'arrived', 'Arrivé', 'completed', 'Terminé', 'cancelled', 'Annulé');
BEGIN
  IF NOT (public.is_admin() OR public.manages_groupage(p_groupage_id)) THEN
    RAISE EXCEPTION 'PERMISSION_DENIED' USING ERRCODE = '42501';
  END IF;
  IF NOT (v_labels ? p_status) THEN RAISE EXCEPTION 'INVALID_STATUS'; END IF;

  SELECT * INTO g FROM public.groupages WHERE id = p_groupage_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  IF g.status = p_status THEN RETURN jsonb_build_object('success', true, 'unchanged', true); END IF;
  IF p_status = 'cancelled' AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'PERMISSION_DENIED: l''annulation d''un groupage est réservée à l''administration' USING ERRCODE = '42501';
  END IF;

  UPDATE public.groupages SET status = p_status, status_note = COALESCE(NULLIF(trim(p_note), ''), status_note)
  WHERE id = g.id;

  FOR r IN SELECT DISTINCT user_id FROM public.groupage_participants
           WHERE groupage_id = g.id AND status NOT IN ('cancelled', 'refunded') LOOP
    PERFORM public.daluche_notify(r.user_id, 'groupage', 'Groupage ' || g.code,
      'Nouvelle étape : ' || (v_labels ->> p_status) || COALESCE(' — ' || NULLIF(trim(p_note), ''), ''),
      '/groupages/' || g.id);
  END LOOP;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Participants d'un groupage (personnel autorisé uniquement)
CREATE OR REPLACE FUNCTION public.get_groupage_participants(p_groupage_id uuid)
RETURNS TABLE (
  participant_id uuid, user_id uuid, full_name text, phone text, email text,
  quantity int, total_xof numeric, status text, order_id uuid, order_code text,
  payment_status text, order_status text, created_at timestamptz
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT (public.is_admin() OR public.manages_groupage(p_groupage_id)) THEN
    RAISE EXCEPTION 'PERMISSION_DENIED' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
  SELECT gp.id, gp.user_id, COALESCE(NULLIF(pr.full_name, ''), o.customer_name)::text,
         COALESCE(NULLIF(pr.phone, ''), o.customer_phone)::text, COALESCE(pr.email, o.customer_email)::text,
         gp.quantity, gp.total_xof, gp.status::text, gp.order_id, o.tracking_code::text,
         o.payment_status::text, o.order_status::text, gp.created_at
  FROM public.groupage_participants gp
  LEFT JOIN public.profiles pr ON pr.id = gp.user_id
  LEFT JOIN public.orders o ON o.id = gp.order_id
  WHERE gp.groupage_id = p_groupage_id
  ORDER BY gp.created_at DESC;
END;
$$;

-- =============================================================================
-- 13. ÉQUIPE : rôles, invitations
-- =============================================================================

CREATE OR REPLACE FUNCTION public.list_team_members()
RETURNS TABLE (id uuid, full_name text, email text, phone text, role text, permissions text[], status text, created_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_staff() THEN RAISE EXCEPTION 'PERMISSION_DENIED' USING ERRCODE = '42501'; END IF;
  RETURN QUERY
  SELECT p.id, p.full_name::text, p.email::text,
         CASE WHEN public.is_admin() THEN p.phone::text ELSE NULL END,
         p.role::text, COALESCE(p.permissions, '{}'::text[]), p.status::text, p.created_at
  FROM public.profiles p
  WHERE lower(p.role) IN ('admin', 'super_admin', 'operations', 'commercial', 'finance',
                          'transitaire', 'sourcing', 'sourcer', 'groupage_manager')
  ORDER BY p.full_name;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_user_role(
  p_user_id uuid, p_role text, p_permissions text[] DEFAULT NULL, p_status text DEFAULT NULL
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'PERMISSION_DENIED' USING ERRCODE = '42501'; END IF;
  IF p_role NOT IN ('client', 'admin', 'transitaire', 'groupage_manager') THEN
    RAISE EXCEPTION 'INVALID_ROLE';
  END IF;
  IF p_status IS NOT NULL AND p_status NOT IN ('active', 'suspended') THEN
    RAISE EXCEPTION 'INVALID_STATUS';
  END IF;
  IF p_user_id = auth.uid() AND (p_role <> 'admin' OR p_status = 'suspended') THEN
    RAISE EXCEPTION 'INVALID_INPUT: vous ne pouvez pas retirer vos propres droits d''administration';
  END IF;
  UPDATE public.profiles
  SET role = CASE WHEN p_role = 'admin' AND lower(role) = 'super_admin' THEN role ELSE p_role END,
      roles = ARRAY[p_role]::text[],
      permissions = COALESCE(p_permissions, permissions),
      status = COALESCE(p_status, status)
  WHERE id = p_user_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'NOT_FOUND: utilisateur introuvable'; END IF;
  RETURN jsonb_build_object('success', true);
END;
$$;

-- Invite un collaborateur. L'invitation n'est appliquée que lorsque la personne ouvre le lien
-- d'invitation (jeton secret) en étant connectée avec l'email invité : la simple possession
-- d'un compte à cet email ne suffit pas (protection si la confirmation d'email est désactivée).
CREATE OR REPLACE FUNCTION public.invite_team_member(
  p_email text, p_role text, p_full_name text DEFAULT NULL, p_permissions text[] DEFAULT '{}'::text[]
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_email text := lower(trim(p_email));
  v_invite public.team_invitations%ROWTYPE;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'PERMISSION_DENIED' USING ERRCODE = '42501'; END IF;
  IF v_email !~ '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$' THEN RAISE EXCEPTION 'INVALID_INPUT: email invalide'; END IF;
  IF p_role NOT IN ('admin', 'transitaire', 'groupage_manager') THEN RAISE EXCEPTION 'INVALID_ROLE'; END IF;

  UPDATE public.team_invitations SET status = 'revoked' WHERE lower(email) = v_email AND status = 'pending';

  INSERT INTO public.team_invitations (email, full_name, role, permissions, invited_by)
  VALUES (v_email, NULLIF(trim(p_full_name), ''), p_role, COALESCE(p_permissions, '{}'::text[]), auth.uid())
  RETURNING * INTO v_invite;

  RETURN jsonb_build_object(
    'invitation_id', v_invite.id,
    'token', v_invite.token,
    'account_exists', EXISTS (SELECT 1 FROM auth.users WHERE lower(email) = v_email)
  );
END;
$$;

-- L'ancien déclencheur d'application automatique par email n'est plus utilisé
DROP TRIGGER IF EXISTS trg_profiles_apply_invitation ON public.profiles;
DROP FUNCTION IF EXISTS public.apply_team_invitation_on_profile();

-- Informations publiques d'une invitation (le jeton fait office de secret)
CREATE OR REPLACE FUNCTION public.get_team_invitation(p_token uuid)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(
    (SELECT jsonb_build_object('email', email, 'role', role, 'full_name', full_name,
                               'status', CASE WHEN status = 'pending' AND expires_at < now() THEN 'expired' ELSE status END)
     FROM public.team_invitations WHERE token = p_token),
    jsonb_build_object('status', 'not_found'));
$$;

-- Acceptation par la personne invitée, connectée avec l'email invité
CREATE OR REPLACE FUNCTION public.accept_team_invitation(p_token uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_email text;
  v_invite public.team_invitations%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'AUTHENTICATION_REQUIRED'; END IF;
  SELECT lower(email) INTO v_email FROM auth.users WHERE id = v_uid;

  SELECT * INTO v_invite FROM public.team_invitations WHERE token = p_token FOR UPDATE;
  IF NOT FOUND OR v_invite.status = 'revoked' THEN
    RAISE EXCEPTION 'NOT_FOUND: invitation introuvable ou révoquée';
  END IF;
  IF v_invite.status = 'accepted' THEN
    IF v_invite.accepted_by = v_uid THEN RETURN jsonb_build_object('applied', true, 'role', v_invite.role); END IF;
    RAISE EXCEPTION 'INVALID_STATE: invitation déjà utilisée';
  END IF;
  IF v_invite.expires_at < now() THEN RAISE EXCEPTION 'EXPIRED: invitation expirée, demandez-en une nouvelle'; END IF;
  IF lower(v_invite.email) <> v_email THEN
    RAISE EXCEPTION 'EMAIL_MISMATCH: connectez-vous avec l''adresse %', v_invite.email;
  END IF;

  UPDATE public.profiles
  SET role = v_invite.role, roles = ARRAY[v_invite.role]::text[], permissions = v_invite.permissions, status = 'active',
      full_name = COALESCE(NULLIF(full_name, ''), v_invite.full_name, full_name)
  WHERE id = v_uid;
  UPDATE public.team_invitations SET status = 'accepted', accepted_by = v_uid, accepted_at = now() WHERE id = v_invite.id;

  RETURN jsonb_build_object('applied', true, 'role', v_invite.role);
END;
$$;

-- =============================================================================
-- 14. TABLEAUX DE BORD
-- =============================================================================

CREATE OR REPLACE FUNCTION public.admin_dashboard_stats()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_revenue numeric := 0;
  v_revenue_month numeric := 0;
  v_recorded_costs numeric := 0;
  v_estimated_purchase numeric := 0;
  v_activity jsonb;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'PERMISSION_DENIED' USING ERRCODE = '42501'; END IF;

  SELECT COALESCE(SUM(total_xof), 0),
         COALESCE(SUM(total_xof) FILTER (WHERE COALESCE(paid_at, updated_at) >= date_trunc('month', now())), 0)
    INTO v_revenue, v_revenue_month
  FROM public.orders WHERE payment_status = 'paid';

  SELECT COALESCE(SUM(c.amount_xof), 0) INTO v_recorded_costs
  FROM public.order_costs c JOIN public.orders o ON o.id = c.order_id
  WHERE o.payment_status = 'paid';

  -- Coût d'achat estimé depuis la fiche coûts produit, pour les commandes sans coût fournisseur saisi
  SELECT COALESCE(SUM(oi.quantity * (pc.purchase_price_xof + pc.logistics_cost_xof)), 0) INTO v_estimated_purchase
  FROM public.order_items oi
  JOIN public.orders o ON o.id = oi.order_id
  JOIN public.product_costs pc ON pc.product_id = oi.product_id
  WHERE o.payment_status = 'paid'
    AND NOT EXISTS (SELECT 1 FROM public.order_costs c WHERE c.order_id = o.id AND c.cost_type = 'supplier');

  SELECT COALESCE(jsonb_agg(a ORDER BY a.at DESC), '[]'::jsonb) INTO v_activity FROM (
    (SELECT 'order' AS kind, id, tracking_code AS ref, customer_name AS who, total_xof AS amount,
            order_status AS status, created_at AS at, '/espace-pro/commandes/' || id AS link
     FROM public.orders ORDER BY created_at DESC LIMIT 8)
    UNION ALL
    (SELECT 'payment', o.id, o.tracking_code, o.customer_name, o.total_xof, 'paid',
            COALESCE(o.paid_at, o.updated_at), '/espace-pro/commandes/' || o.id
     FROM public.orders o WHERE o.payment_status = 'paid' ORDER BY COALESCE(o.paid_at, o.updated_at) DESC LIMIT 8)
    UNION ALL
    (SELECT 'sourcing', id, code, client_name, budget_xof, status, created_at, '/espace-pro/demandes/sourcing/' || id
     FROM public.sourcing_requests ORDER BY created_at DESC LIMIT 6)
    UNION ALL
    (SELECT 'b2b', id, code, company_name, budget_xof, status, created_at, '/espace-pro/demandes/b2b/' || id
     FROM public.b2b_requests ORDER BY created_at DESC LIMIT 6)
    UNION ALL
    (SELECT 'vehicle', id, code, contact_name, budget_xof, status, created_at, '/espace-pro/demandes/vehicle/' || id
     FROM public.vehicle_requests ORDER BY created_at DESC LIMIT 6)
    ORDER BY at DESC LIMIT 14
  ) a;

  RETURN jsonb_build_object(
    'revenue_xof', v_revenue,
    'revenue_month_xof', v_revenue_month,
    'costs_xof', v_recorded_costs + v_estimated_purchase,
    'recorded_costs_xof', v_recorded_costs,
    'estimated_purchase_xof', v_estimated_purchase,
    'margin_xof', v_revenue - (v_recorded_costs + v_estimated_purchase),
    'orders_total', (SELECT count(*) FROM public.orders),
    'orders_paid', (SELECT count(*) FROM public.orders WHERE payment_status = 'paid'),
    'orders_pending_payment', (SELECT count(*) FROM public.orders WHERE order_status = 'pending_payment'),
    'orders_to_process', (SELECT count(*) FROM public.orders WHERE payment_status = 'paid' AND order_status IN ('paid', 'supplier_ordered', 'preparing')),
    'orders_in_transit', (SELECT count(*) FROM public.orders WHERE order_status IN ('shipped', 'in_transit', 'arrived', 'ready_for_delivery')),
    'groupages_active', (SELECT count(*) FROM public.groupages WHERE status IN ('open', 'almost_full')),
    'groupages_full', (SELECT count(*) FROM public.groupages WHERE status IN ('full', 'validated')),
    'sourcing_new', (SELECT count(*) FROM public.sourcing_requests WHERE status = 'new'),
    'sourcing_open', (SELECT count(*) FROM public.sourcing_requests WHERE status NOT IN ('completed', 'cancelled', 'rejected', 'ordered')),
    'b2b_open', (SELECT count(*) FROM public.b2b_requests WHERE status NOT IN ('completed', 'cancelled')),
    'vehicle_open', (SELECT count(*) FROM public.vehicle_requests WHERE status NOT IN ('delivered', 'cancelled')),
    'quotes_awaiting', (SELECT count(*) FROM public.quotes WHERE status IN ('sent', 'viewed')),
    'clients_count', (SELECT count(*) FROM public.profiles WHERE lower(role) IN ('client', 'customer', 'b2b_customer', 'b2b_client')),
    'activity', v_activity
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.staff_dashboard_stats()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid();
BEGIN
  IF public.is_admin() OR public.is_transitaire() THEN
    RETURN jsonb_build_object(
      'role', 'transitaire',
      'sourcing_new', (SELECT count(*) FROM public.sourcing_requests WHERE status = 'new'),
      'sourcing_mine', (SELECT count(*) FROM public.sourcing_requests WHERE assigned_to = v_uid AND status NOT IN ('completed', 'cancelled', 'rejected')),
      'sourcing_open', (SELECT count(*) FROM public.sourcing_requests WHERE status NOT IN ('completed', 'cancelled', 'rejected', 'ordered')),
      'b2b_open', (SELECT count(*) FROM public.b2b_requests WHERE status NOT IN ('completed', 'cancelled')),
      'vehicle_open', (SELECT count(*) FROM public.vehicle_requests WHERE status NOT IN ('delivered', 'cancelled')),
      'orders_to_process', (SELECT count(*) FROM public.orders WHERE payment_status = 'paid' AND order_status IN ('paid', 'supplier_ordered', 'preparing')),
      'orders_in_transit', (SELECT count(*) FROM public.orders WHERE order_status IN ('shipped', 'in_transit', 'arrived', 'ready_for_delivery')),
      'products_draft', (SELECT count(*) FROM public.products WHERE is_active = false)
    );
  ELSIF public.is_groupage_manager() THEN
    RETURN jsonb_build_object(
      'role', 'groupage_manager',
      'groupages_mine', (SELECT count(*) FROM public.groupages WHERE assigned_manager_id = v_uid OR created_by = v_uid),
      'groupages_active', (SELECT count(*) FROM public.groupages WHERE (assigned_manager_id = v_uid OR created_by = v_uid) AND status IN ('open', 'almost_full')),
      'groupages_full', (SELECT count(*) FROM public.groupages WHERE (assigned_manager_id = v_uid OR created_by = v_uid) AND status IN ('full', 'validated')),
      'participants', (SELECT COALESCE(sum(participants_count), 0) FROM public.groupages WHERE assigned_manager_id = v_uid OR created_by = v_uid),
      'orders_paid', (SELECT count(DISTINCT o.id) FROM public.orders o JOIN public.order_items oi ON oi.order_id = o.id
                       JOIN public.groupages g ON g.id = oi.groupage_id
                       WHERE (g.assigned_manager_id = v_uid OR g.created_by = v_uid) AND o.payment_status = 'paid'),
      'orders_pending', (SELECT count(DISTINCT o.id) FROM public.orders o JOIN public.order_items oi ON oi.order_id = o.id
                       JOIN public.groupages g ON g.id = oi.groupage_id
                       WHERE (g.assigned_manager_id = v_uid OR g.created_by = v_uid) AND o.payment_status <> 'paid' AND o.order_status <> 'cancelled')
    );
  END IF;
  RAISE EXCEPTION 'PERMISSION_DENIED' USING ERRCODE = '42501';
END;
$$;

-- =============================================================================
-- 15. SUIVI PUBLIC D'UNE COMMANDE (sans aucune donnée personnelle)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.track_order_public(p_code text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  o public.orders%ROWTYPE;
  v_events jsonb;
BEGIN
  IF p_code IS NULL OR length(trim(p_code)) < 6 THEN RETURN jsonb_build_object('found', false); END IF;
  SELECT * INTO o FROM public.orders WHERE upper(tracking_code) = upper(trim(p_code)) LIMIT 1;
  IF NOT FOUND THEN RETURN jsonb_build_object('found', false); END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object('status', new_status, 'location', location,
                                               'description', description, 'at', created_at)
                            ORDER BY created_at), '[]'::jsonb)
    INTO v_events
  FROM public.order_status_history WHERE order_id = o.id;

  RETURN jsonb_build_object(
    'found', true,
    'tracking_code', o.tracking_code,
    'order_status', o.order_status,
    'payment_status', o.payment_status,
    'created_at', o.created_at,
    'estimated_delivery_date', o.estimated_delivery_date,
    'items_count', (SELECT COALESCE(sum(quantity), 0) FROM public.order_items WHERE order_id = o.id),
    'events', v_events
  );
END;
$$;

-- =============================================================================
-- 16. EFFETS DU PAIEMENT CONFIRMÉ (webhook GeniusPay → orders.payment_status = 'paid')
-- =============================================================================

CREATE OR REPLACE FUNCTION public.daluche_on_order_paid()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE q public.quotes%ROWTYPE;
BEGIN
  IF NEW.payment_status = 'paid' AND OLD.payment_status IS DISTINCT FROM 'paid' THEN
    -- Participations groupage
    UPDATE public.groupage_participants SET status = 'paid'
    WHERE order_id = NEW.id AND status IN ('reserved', 'confirmed');

    -- Devis : acompte / solde
    IF NEW.quote_id IS NOT NULL THEN
      SELECT * INTO q FROM public.quotes WHERE id = NEW.quote_id;
      IF FOUND AND NEW.quote_payment_kind IN ('deposit', 'full') THEN
        UPDATE public.sourcing_requests SET status = 'ordered' WHERE id = q.sourcing_request_id AND status IN ('accepted', 'quote_sent');
        UPDATE public.b2b_requests SET status = 'deposit_paid' WHERE id = q.b2b_request_id AND status IN ('accepted', 'quote_sent');
        UPDATE public.vehicle_requests SET status = 'deposit_paid' WHERE id = q.vehicle_request_id AND status IN ('accepted', 'quote_sent');
      END IF;
    END IF;

    PERFORM public.daluche_notify(NEW.user_id, 'payment', 'Paiement confirmé',
      'Nous avons bien reçu votre paiement pour la commande ' || NEW.tracking_code || '.',
      '/compte/commandes/' || NEW.id);
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Le paiement ne doit jamais être bloqué par un effet secondaire
  RAISE WARNING 'daluche_on_order_paid: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_daluche_order_paid ON public.orders;
CREATE TRIGGER trg_daluche_order_paid
  AFTER UPDATE OF payment_status ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.daluche_on_order_paid();

-- =============================================================================
-- 17. STOCKAGE DES FICHIERS
--   daluche-media   : public  — visuels produits, véhicules, groupages (écriture personnel)
--   daluche-uploads : privé   — photos / pièces jointes clients (dossier = id utilisateur)
-- =============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('daluche-media', 'daluche-media', true, 8388608, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']),
  ('daluche-uploads', 'daluche-uploads', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'application/pdf'])
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS daluche_media_staff_insert ON storage.objects;
CREATE POLICY daluche_media_staff_insert ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'daluche-media' AND public.is_staff());
DROP POLICY IF EXISTS daluche_media_staff_update ON storage.objects;
CREATE POLICY daluche_media_staff_update ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'daluche-media' AND public.is_staff());
DROP POLICY IF EXISTS daluche_media_staff_delete ON storage.objects;
CREATE POLICY daluche_media_staff_delete ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'daluche-media' AND public.is_staff());

DROP POLICY IF EXISTS daluche_uploads_owner_insert ON storage.objects;
CREATE POLICY daluche_uploads_owner_insert ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'daluche-uploads' AND (storage.foldername(name))[1] = auth.uid()::text);
DROP POLICY IF EXISTS daluche_uploads_read ON storage.objects;
CREATE POLICY daluche_uploads_read ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'daluche-uploads'
         AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin() OR public.is_transitaire()));

-- =============================================================================
-- 18. DROITS D'EXÉCUTION
-- =============================================================================

REVOKE EXECUTE ON FUNCTION public.daluche_notify(uuid, text, text, text, text, jsonb) FROM PUBLIC, anon, authenticated;

DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname IN (
      'submit_sourcing_request', 'submit_b2b_request', 'submit_vehicle_request', 'join_groupage',
      'cancel_my_groupage_participation', 'staff_update_order', 'staff_add_order_cost', 'staff_update_request',
      'staff_create_quote', 'respond_to_quote', 'create_order_from_quote', 'post_message',
      'staff_update_groupage_status', 'get_groupage_participants', 'list_team_members', 'admin_set_user_role',
      'invite_team_member', 'accept_team_invitation', 'admin_dashboard_stats', 'staff_dashboard_stats'
    )
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon', r.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated, service_role', r.sig);
  END LOOP;
END $$;

GRANT EXECUTE ON FUNCTION public.track_order_public(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_team_invitation(uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.app_role() TO anon, authenticated, service_role;

GRANT SELECT ON public.vehicles TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicles TO authenticated;
GRANT SELECT ON public.vehicle_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_costs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.request_findings TO authenticated;
GRANT SELECT ON public.messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_invitations TO authenticated;

COMMIT;

-- Recharge le cache de schéma de l'API REST
NOTIFY pgrst, 'reload schema';
