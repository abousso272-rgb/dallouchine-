-- =============================================================================
-- MOTEUR DE RENTABILITÉ, PRÉVISIONS ET COCKPITS PAR RÔLE
-- -----------------------------------------------------------------------------
-- * _finance_orders        : marge réelle par commande payée (coûts saisis → logistique réelle → estimation produit)
-- * admin_finance_overview : CA, marge, courbe mensuelle, canaux, trésorerie, prévisions, alertes
-- * groupage_cockpit       : progression, vélocité, prévision de la quantité minimale, trésorerie, relances
-- * manager_groupage_overview / staff_remind_groupage_reservations
-- * transitaire_overview   : file de demandes (SLA), délais de réponse, conversion des devis
-- * get_finance_context / admin_set_exchange_rate / admin_update_finance_targets
-- * admin_dashboard_stats  : marge corrigée (plus de marge = CA quand les coûts sont inconnus)
-- Idempotent : peut être rejoué sans effet de bord.
-- =============================================================================

-- ---------------------------------------------------------------- 1. Paramètres
INSERT INTO public.platform_settings (key, value, description)
SELECT 'finance_targets',
       '{"min_margin_pct":15,"target_margin_pct":35,"quote_conversion_pct":40,"payment_rate_pct":50,"abandon_hours":24}'::jsonb,
       'Objectifs financiers : marge minimale et cible, hypothèses de prévision (frais et douane : voir fees_structure)'
WHERE NOT EXISTS (SELECT 1 FROM public.platform_settings WHERE key = 'finance_targets');

CREATE TABLE IF NOT EXISTS public.exchange_rate_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cny_to_xof numeric(12, 4) NOT NULL CHECK (cny_to_xof > 0),
  usd_to_xof numeric(12, 4),
  set_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.exchange_rate_history ENABLE ROW LEVEL SECURITY;
-- Aucune politique : l'historique n'est lu et écrit que par les fonctions ci-dessous.

INSERT INTO public.exchange_rate_history (cny_to_xof, usd_to_xof)
SELECT (value ->> 'cny_to_xof')::numeric, NULLIF(value ->> 'usd_to_xof', '')::numeric
FROM public.platform_settings
WHERE key = 'exchange_rates' AND (value ->> 'cny_to_xof') IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.exchange_rate_history);

CREATE INDEX IF NOT EXISTS idx_exchange_rate_history_created ON public.exchange_rate_history (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_groupage_participants_group_status ON public.groupage_participants (groupage_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status_paid_at ON public.orders (payment_status, paid_at);

-- ---------------------------------------------------------------- 2. Marge par commande
-- Interne : aucun droit d'exécution direct, appelée par les fonctions autorisées.
CREATE OR REPLACE FUNCTION public._finance_orders(
  p_from timestamptz DEFAULT NULL, p_to timestamptz DEFAULT NULL, p_order uuid DEFAULT NULL
)
RETURNS TABLE (
  order_id uuid, tracking_code text, order_kind text, customer_name text, groupage_id uuid, at timestamptz,
  revenue_xof numeric, payment_fee_xof numeric,
  purchase_xof numeric, purchase_source text,
  logistics_xof numeric, logistics_source text,
  other_xof numeric, total_cost_xof numeric, margin_xof numeric, margin_pct numeric, cost_quality text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH base AS (
    SELECT o.id, o.tracking_code::text AS tracking_code, o.order_kind::text AS order_kind,
           o.customer_name::text AS customer_name, COALESCE(o.paid_at, o.updated_at) AS at, o.total_xof AS revenue
    FROM public.orders o
    WHERE o.payment_status = 'paid'
      AND (p_order IS NULL OR o.id = p_order)
      AND (p_from IS NULL OR COALESCE(o.paid_at, o.updated_at) >= p_from)
      AND (p_to IS NULL OR COALESCE(o.paid_at, o.updated_at) < p_to)
  ),
  rec AS (
    SELECT c.order_id,
           COALESCE(SUM(c.amount_xof) FILTER (WHERE c.cost_type = 'payment_fee'), 0) AS fee,
           COALESCE(SUM(c.amount_xof) FILTER (WHERE c.cost_type = 'supplier'), 0) AS supplier,
           COALESCE(SUM(c.amount_xof) FILTER (WHERE c.cost_type IN ('transport', 'customs', 'inspection', 'consolidation')), 0) AS logistics,
           COALESCE(SUM(c.amount_xof) FILTER (WHERE c.cost_type IN ('sourcing', 'other')), 0) AS other,
           COALESCE(bool_or(c.cost_type = 'supplier'), false) AS has_supplier,
           COALESCE(bool_or(c.cost_type IN ('transport', 'customs', 'inspection', 'consolidation')), false) AS has_logistics
    FROM public.order_costs c
    WHERE c.order_id IN (SELECT id FROM base)
    GROUP BY c.order_id
  ),
  items AS (
    SELECT oi.order_id,
           count(*) AS n_items,
           count(pc.product_id) AS n_costed,
           COALESCE(SUM(oi.quantity * pc.purchase_price_xof), 0) AS est_purchase,
           COALESCE(SUM(oi.quantity * pc.logistics_cost_xof), 0) AS est_logistics
    FROM public.order_items oi
    LEFT JOIN public.product_costs pc ON pc.product_id = oi.product_id AND pc.purchase_price_xof > 0
    WHERE oi.order_id IN (SELECT id FROM base)
    GROUP BY oi.order_id
  ),
  lc AS (
    SELECT DISTINCT ON (l.order_id) l.order_id, l.total_internal_cost
    FROM public.logistics_costs l
    WHERE l.order_id IN (SELECT id FROM base) AND l.total_internal_cost > 0
    ORDER BY l.order_id, (l.status = 'confirmed') DESC, l.calculated_at DESC NULLS LAST
  ),
  grp AS (
    SELECT DISTINCT ON (oi.order_id) oi.order_id, oi.groupage_id
    FROM public.order_items oi
    WHERE oi.order_id IN (SELECT id FROM base) AND oi.groupage_id IS NOT NULL
    ORDER BY oi.order_id, oi.created_at
  ),
  calc AS (
    SELECT b.*,
           COALESCE(r.fee, 0) AS fee,
           COALESCE(r.other, 0) AS other,
           CASE WHEN COALESCE(r.has_supplier, false) THEN 'recorded'
                WHEN COALESCE(i.n_items, 0) > 0 AND i.n_costed = i.n_items THEN 'estimated'
                ELSE 'missing' END AS p_src,
           CASE WHEN COALESCE(r.has_supplier, false) THEN r.supplier
                WHEN COALESCE(i.n_items, 0) > 0 AND i.n_costed = i.n_items THEN i.est_purchase
                ELSE 0 END AS purchase,
           CASE WHEN COALESCE(r.has_logistics, false) THEN 'recorded'
                WHEN lc.order_id IS NOT NULL THEN 'logistics'
                WHEN COALESCE(i.est_logistics, 0) > 0 THEN 'estimated'
                ELSE 'missing' END AS l_src,
           CASE WHEN COALESCE(r.has_logistics, false) THEN r.logistics
                WHEN lc.order_id IS NOT NULL THEN lc.total_internal_cost
                WHEN COALESCE(i.est_logistics, 0) > 0 THEN i.est_logistics
                ELSE 0 END AS logistics,
           g.groupage_id
    FROM base b
    LEFT JOIN rec r ON r.order_id = b.id
    LEFT JOIN items i ON i.order_id = b.id
    LEFT JOIN lc ON lc.order_id = b.id
    LEFT JOIN grp g ON g.order_id = b.id
  )
  SELECT c.id, c.tracking_code, c.order_kind, c.customer_name, c.groupage_id, c.at,
         c.revenue, c.fee,
         c.purchase, c.p_src,
         c.logistics, c.l_src,
         c.other,
         c.fee + c.purchase + c.logistics + c.other,
         CASE WHEN c.p_src = 'missing' THEN NULL ELSE c.revenue - (c.fee + c.purchase + c.logistics + c.other) END,
         CASE WHEN c.p_src = 'missing' OR c.revenue <= 0 THEN NULL
              ELSE round((c.revenue - (c.fee + c.purchase + c.logistics + c.other)) / c.revenue * 100, 1) END,
         CASE WHEN c.p_src = 'missing' THEN 'missing' WHEN c.l_src = 'missing' THEN 'partial' ELSE 'complete' END
  FROM calc c;
$$;

REVOKE ALL ON FUNCTION public._finance_orders(timestamptz, timestamptz, uuid) FROM PUBLIC, anon, authenticated;

-- Détail financier d'une commande (page commande de l'espace pro)
CREATE OR REPLACE FUNCTION public.staff_order_financials(p_order_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE r record;
BEGIN
  IF NOT public.has_permission('view_margins') THEN RAISE EXCEPTION 'PERMISSION_DENIED' USING ERRCODE = '42501'; END IF;
  SELECT * INTO r FROM public._finance_orders(NULL, NULL, p_order_id);
  IF NOT FOUND THEN RETURN NULL; END IF;
  RETURN to_jsonb(r);
END;
$$;

-- ---------------------------------------------------------------- 3. Groupage : indicateurs
CREATE OR REPLACE FUNCTION public._groupage_metrics(p_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  g record;
  v_paid integer; v_resv integer; v_last7 integer; v_active integer;
  v_collected numeric; v_pending numeric;
  v_moq integer; v_window numeric; v_vel numeric; v_days numeric; v_proj numeric;
  v_risk text; v_prob numeric; v_dtm integer;
  v_unit_cost numeric; v_exp jsonb; v_exp_n integer; v_exp_qty integer; v_exp_val numeric;
  v_hours integer;
BEGIN
  SELECT * INTO g FROM public.groupages WHERE id = p_id;
  IF NOT FOUND THEN RETURN NULL; END IF;

  SELECT COALESCE(SUM(quantity) FILTER (WHERE status = 'paid'), 0),
         COALESCE(SUM(quantity) FILTER (WHERE status = 'reserved'), 0),
         COALESCE(SUM(quantity) FILTER (WHERE status IN ('paid', 'reserved') AND created_at >= now() - interval '7 days'), 0),
         COALESCE(SUM(total_xof) FILTER (WHERE status = 'paid'), 0),
         COALESCE(SUM(total_xof) FILTER (WHERE status = 'reserved'), 0)
    INTO v_paid, v_resv, v_last7, v_collected, v_pending
  FROM public.groupage_participants WHERE groupage_id = p_id;

  v_active := v_paid + v_resv;
  v_moq := GREATEST(1, COALESCE(g.supplier_moq, g.target_quantity, 1));
  v_window := LEAST(7, GREATEST(1, extract(epoch FROM (now() - COALESCE(g.start_date::timestamptz, g.created_at))) / 86400));
  v_vel := round(v_last7::numeric / v_window, 2);
  v_days := GREATEST(0, extract(epoch FROM (g.deadline - now())) / 86400);
  v_proj := round(v_active + v_vel * v_days, 0);

  IF g.status IN ('draft', 'cancelled') THEN v_risk := 'inactive';
  ELSIF g.status NOT IN ('open', 'almost_full') THEN v_risk := 'confirmed';
  ELSIF v_active >= v_moq THEN v_risk := 'reached';
  ELSIF g.deadline < now() THEN v_risk := 'failed';
  ELSIF v_proj >= v_moq THEN v_risk := 'on_track';
  ELSIF v_proj >= 0.6 * v_moq THEN v_risk := 'at_risk';
  ELSE v_risk := 'critical';
  END IF;

  v_prob := CASE WHEN v_risk IN ('reached', 'confirmed') THEN 1
                 WHEN v_risk IN ('failed', 'inactive') THEN 0
                 ELSE round(LEAST(1, v_proj / v_moq), 2) END;
  v_dtm := CASE WHEN v_active >= v_moq THEN 0
                WHEN v_vel > 0 THEN ceil((v_moq - v_active) / v_vel)::integer
                ELSE NULL END;

  SELECT pc.purchase_price_xof + pc.logistics_cost_xof INTO v_unit_cost
  FROM public.product_costs pc WHERE pc.product_id = g.product_id AND pc.purchase_price_xof > 0;

  v_hours := COALESCE(g.reservation_hours, 48);
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
           'participant_id', e.id, 'user_id', e.user_id, 'name', e.name, 'phone', e.phone,
           'quantity', e.quantity, 'total_xof', e.total_xof, 'expires_at', e.expires_at,
           'hours_left', round(extract(epoch FROM (e.expires_at - now())) / 3600, 1)
         ) ORDER BY e.expires_at), '[]'::jsonb),
         count(*), COALESCE(SUM(e.quantity), 0), COALESCE(SUM(e.total_xof), 0)
    INTO v_exp, v_exp_n, v_exp_qty, v_exp_val
  FROM (
    SELECT gp.id, gp.user_id, pr.full_name AS name, pr.phone, gp.quantity, gp.total_xof,
           gp.created_at + make_interval(hours => v_hours) AS expires_at
    FROM public.groupage_participants gp
    LEFT JOIN public.profiles pr ON pr.id = gp.user_id
    WHERE gp.groupage_id = p_id AND gp.status = 'reserved'
      AND gp.created_at + make_interval(hours => v_hours) > now()
      AND gp.created_at + make_interval(hours => v_hours) <= now() + interval '24 hours'
    LIMIT 50
  ) e;

  RETURN jsonb_build_object(
    'id', g.id, 'code', g.code, 'title', g.title, 'status', g.status, 'deadline', g.deadline,
    'unit_price_xof', g.unit_price_xof, 'target_quantity', g.target_quantity, 'supplier_moq', v_moq,
    'paid_quantity', v_paid, 'reserved_quantity', v_resv, 'active_quantity', v_active,
    'progress_moq_pct', round(LEAST(100, v_active::numeric / v_moq * 100), 1),
    'progress_target_pct', CASE WHEN COALESCE(g.target_quantity, 0) > 0 THEN round(LEAST(100, v_active::numeric / g.target_quantity * 100), 1) ELSE NULL END,
    'velocity_per_day', v_vel, 'days_left', round(v_days, 1), 'projected_quantity', v_proj,
    'days_to_moq', v_dtm, 'risk', v_risk, 'probability', v_prob,
    'collected_xof', v_collected, 'pending_xof', v_pending,
    'unit_cost_xof', v_unit_cost,
    'supplier_due_estimate_xof', CASE WHEN v_unit_cost IS NULL THEN NULL ELSE round(v_paid * v_unit_cost, 0) END,
    'expiring_count', v_exp_n, 'expiring_quantity', v_exp_qty, 'expiring_xof', v_exp_val,
    'expiring', v_exp
  );
END;
$$;

REVOKE ALL ON FUNCTION public._groupage_metrics(uuid) FROM PUBLIC, anon, authenticated;

-- Cockpit complet d'un groupage (admin ou gestionnaire du groupage)
CREATE OR REPLACE FUNCTION public.groupage_cockpit(p_groupage_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  m jsonb; v_series jsonb; v_status jsonb; v_refunds integer; v_margin_ok boolean; v_cost numeric;
BEGIN
  IF NOT (public.is_admin() OR public.manages_groupage(p_groupage_id)) THEN
    RAISE EXCEPTION 'PERMISSION_DENIED' USING ERRCODE = '42501';
  END IF;
  m := public._groupage_metrics(p_groupage_id);
  IF m IS NULL THEN RETURN NULL; END IF;
  v_margin_ok := public.has_permission('view_margins');

  SELECT COALESCE(jsonb_agg(jsonb_build_object('day', d.day::date, 'quantity', COALESCE(q.qty, 0)) ORDER BY d.day), '[]'::jsonb)
    INTO v_series
  FROM generate_series(current_date - 13, current_date, interval '1 day') AS d(day)
  LEFT JOIN (
    SELECT created_at::date AS day, SUM(quantity) AS qty
    FROM public.groupage_participants
    WHERE groupage_id = p_groupage_id AND status IN ('paid', 'reserved', 'refunded', 'cancelled')
      AND created_at >= current_date - 13
    GROUP BY created_at::date
  ) q ON q.day = d.day::date;

  SELECT COALESCE(jsonb_object_agg(status, n), '{}'::jsonb) INTO v_status
  FROM (SELECT status, count(*) AS n FROM public.groupage_participants WHERE groupage_id = p_groupage_id GROUP BY status) s;

  SELECT count(*) INTO v_refunds FROM public.groupage_participants
  WHERE groupage_id = p_groupage_id AND status = 'cancelled' AND COALESCE(refund_status, '') = 'pending';

  v_cost := NULLIF(m ->> 'unit_cost_xof', '')::numeric;
  m := m || jsonb_build_object('daily_joins', v_series, 'participants_by_status', v_status, 'refunds_pending', v_refunds,
                               'margin_visible', v_margin_ok);
  IF v_margin_ok AND v_cost IS NOT NULL THEN
    m := m || jsonb_build_object(
      'unit_margin_xof', round((m ->> 'unit_price_xof')::numeric - v_cost, 0),
      'unit_margin_pct', CASE WHEN (m ->> 'unit_price_xof')::numeric > 0
                              THEN round(((m ->> 'unit_price_xof')::numeric - v_cost) / (m ->> 'unit_price_xof')::numeric * 100, 1) END,
      'margin_collected_xof', round((m ->> 'collected_xof')::numeric - (m ->> 'paid_quantity')::numeric * v_cost, 0),
      'margin_if_target_xof', round(COALESCE((m ->> 'target_quantity')::numeric, 0) * ((m ->> 'unit_price_xof')::numeric - v_cost), 0)
    );
  END IF;
  RETURN m;
END;
$$;

-- Vue d'ensemble des groupages d'un gestionnaire (ou de tous pour l'admin)
CREATE OR REPLACE FUNCTION public.manager_groupage_overview()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_rows jsonb;
BEGIN
  IF NOT (public.is_admin() OR public.is_groupage_manager()) THEN RAISE EXCEPTION 'PERMISSION_DENIED' USING ERRCODE = '42501'; END IF;
  SELECT COALESCE(jsonb_agg(x.m ORDER BY
           CASE x.m ->> 'risk' WHEN 'critical' THEN 0 WHEN 'failed' THEN 1 WHEN 'at_risk' THEN 2 WHEN 'on_track' THEN 3 ELSE 4 END,
           (x.m ->> 'deadline')), '[]'::jsonb)
    INTO v_rows
  FROM (
    SELECT public._groupage_metrics(g.id) - 'expiring' AS m
    FROM public.groupages g
    WHERE g.status NOT IN ('draft', 'cancelled', 'delivered', 'completed')
      AND (public.is_admin() OR public.manages_groupage(g.id))
  ) x;
  RETURN v_rows;
END;
$$;

-- Relance des participants dont la réservation expire dans moins de 24 h
CREATE OR REPLACE FUNCTION public.staff_remind_groupage_reservations(p_groupage_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  g record; r record; v_hours integer; v_n integer := 0;
BEGIN
  IF NOT (public.is_admin() OR public.manages_groupage(p_groupage_id)) THEN RAISE EXCEPTION 'PERMISSION_DENIED' USING ERRCODE = '42501'; END IF;
  SELECT * INTO g FROM public.groupages WHERE id = p_groupage_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'NOT_FOUND' USING ERRCODE = 'P0002'; END IF;
  IF g.status NOT IN ('open', 'almost_full') THEN RAISE EXCEPTION 'INVALID_STATUS: ce groupage n''accepte plus de paiements' USING ERRCODE = 'P0001'; END IF;
  v_hours := COALESCE(g.reservation_hours, 48);

  FOR r IN
    SELECT gp.id, gp.user_id, gp.quantity, gp.created_at + make_interval(hours => v_hours) AS expires_at
    FROM public.groupage_participants gp
    WHERE gp.groupage_id = p_groupage_id AND gp.status = 'reserved'
      AND gp.created_at + make_interval(hours => v_hours) > now()
      AND gp.created_at + make_interval(hours => v_hours) <= now() + interval '24 hours'
      AND NOT EXISTS (
        SELECT 1 FROM public.notifications n
        WHERE n.user_id = gp.user_id AND n.type = 'groupage_reminder'
          AND n.data ->> 'participant_id' = gp.id::text AND n.created_at > now() - interval '12 hours'
      )
  LOOP
    PERFORM public.daluche_notify(
      r.user_id, 'groupage_reminder', 'Votre place expire bientôt',
      format('Votre réservation de %s unité(s) dans « %s » expire le %s. Réglez avant pour la garder.',
             r.quantity, g.title, to_char(r.expires_at AT TIME ZONE 'UTC', 'DD/MM à HH24"h"MI')),
      '/compte/commandes',
      jsonb_build_object('participant_id', r.id, 'groupage_id', g.id)
    );
    v_n := v_n + 1;
  END LOOP;

  INSERT INTO public.groupage_events (groupage_id, actor_id, kind, title, message, is_public, data)
  VALUES (g.id, auth.uid(), 'note', 'Relance des réservations', format('%s participant(s) relancé(s)', v_n), false, jsonb_build_object('notified', v_n));
  RETURN jsonb_build_object('success', true, 'notified', v_n);
END;
$$;

-- ---------------------------------------------------------------- 4. Vue d'ensemble financière (admin)
CREATE OR REPLACE FUNCTION public.admin_finance_overview(p_months integer DEFAULT 6)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_t jsonb := COALESCE((SELECT value FROM public.platform_settings WHERE key = 'finance_targets' LIMIT 1), '{}'::jsonb);
  v_min numeric := COALESCE((v_t ->> 'min_margin_pct')::numeric, 15);
  v_conv_set numeric := COALESCE((v_t ->> 'quote_conversion_pct')::numeric, 40);
  v_pay_set numeric := COALESCE((v_t ->> 'payment_rate_pct')::numeric, 50);
  v_abandon integer := COALESCE((v_t ->> 'abandon_hours')::integer, 24);
  v_months integer := LEAST(24, GREATEST(1, COALESCE(p_months, 6)));
  v_core jsonb; v_cash jsonb; v_fx jsonb; v_hist jsonb; v_forecast jsonb; v_groupages jsonb;
  v_created30 integer; v_paid30 integer; v_pay_rate numeric; v_pay_src text;
  v_acc integer; v_res integer; v_conv numeric; v_conv_src text;
  v_q_n integer; v_q_val numeric; v_pend_val numeric; v_aband_val numeric; v_gr_future numeric;
BEGIN
  IF NOT public.has_permission('view_margins') THEN RAISE EXCEPTION 'PERMISSION_DENIED' USING ERRCODE = '42501'; END IF;

  WITH f AS (SELECT * FROM public._finance_orders(NULL, NULL, NULL)),
  totals AS (
    SELECT COALESCE(sum(revenue_xof), 0) AS revenue,
           COALESCE(sum(revenue_xof) FILTER (WHERE margin_xof IS NOT NULL), 0) AS rev_known,
           COALESCE(sum(payment_fee_xof), 0) AS fees,
           COALESCE(sum(purchase_xof), 0) AS purchase,
           COALESCE(sum(logistics_xof), 0) AS logistics,
           COALESCE(sum(other_xof), 0) AS other,
           COALESCE(sum(margin_xof), 0) AS margin,
           count(*) AS orders,
           count(*) FILTER (WHERE cost_quality = 'missing') AS n_missing,
           count(*) FILTER (WHERE cost_quality = 'partial') AS n_partial
    FROM f
  ),
  months AS (
    SELECT m::date AS month
    FROM generate_series(date_trunc('month', now()) - make_interval(months => v_months - 1), date_trunc('month', now()), interval '1 month') m
  ),
  monthly AS (
    SELECT mo.month, COALESCE(sum(f.revenue_xof), 0) AS revenue, COALESCE(sum(f.margin_xof), 0) AS margin, count(f.order_id) AS orders
    FROM months mo LEFT JOIN f ON date_trunc('month', f.at)::date = mo.month
    GROUP BY mo.month
  ),
  channels AS (
    SELECT order_kind, count(*) AS orders, COALESCE(sum(revenue_xof), 0) AS revenue,
           COALESCE(sum(margin_xof), 0) AS margin,
           COALESCE(sum(revenue_xof) FILTER (WHERE margin_xof IS NOT NULL), 0) AS rev_known
    FROM f GROUP BY order_kind
  ),
  low AS (
    SELECT order_id, tracking_code, customer_name, revenue_xof, margin_xof, margin_pct
    FROM f WHERE margin_pct IS NOT NULL AND margin_pct < v_min ORDER BY margin_pct LIMIT 10
  ),
  missing AS (
    SELECT order_id, tracking_code, customer_name, revenue_xof
    FROM f WHERE cost_quality = 'missing' ORDER BY revenue_xof DESC LIMIT 10
  )
  SELECT jsonb_build_object(
    'revenue_xof', t.revenue, 'revenue_with_costs_xof', t.rev_known,
    'coverage_pct', CASE WHEN t.revenue > 0 THEN round(t.rev_known / t.revenue * 100, 1) ELSE 100 END,
    'payment_fees_xof', t.fees, 'purchase_xof', t.purchase, 'logistics_xof', t.logistics, 'other_costs_xof', t.other,
    'margin_xof', t.margin,
    'margin_pct', CASE WHEN t.rev_known > 0 THEN round(t.margin / t.rev_known * 100, 1) ELSE NULL END,
    'orders_paid', t.orders, 'orders_missing_costs', t.n_missing, 'orders_partial_costs', t.n_partial,
    'min_margin_pct', v_min,
    'monthly', (SELECT COALESCE(jsonb_agg(jsonb_build_object('month', month, 'revenue_xof', revenue, 'margin_xof', margin, 'orders', orders) ORDER BY month), '[]'::jsonb) FROM monthly),
    'channels', (SELECT COALESCE(jsonb_agg(jsonb_build_object('kind', order_kind, 'orders', orders, 'revenue_xof', revenue, 'margin_xof', margin,
                   'margin_pct', CASE WHEN rev_known > 0 THEN round(margin / rev_known * 100, 1) END) ORDER BY revenue DESC), '[]'::jsonb) FROM channels),
    'low_margin_orders', (SELECT COALESCE(jsonb_agg(to_jsonb(low)), '[]'::jsonb) FROM low),
    'missing_cost_orders', (SELECT COALESCE(jsonb_agg(to_jsonb(missing)), '[]'::jsonb) FROM missing)
  ) INTO v_core
  FROM totals t;

  -- Trésorerie et entonnoir de paiement
  SELECT count(*) FILTER (WHERE created_at >= now() - interval '30 days'),
         count(*) FILTER (WHERE created_at >= now() - interval '30 days' AND payment_status = 'paid')
    INTO v_created30, v_paid30
  FROM public.orders;
  IF v_created30 >= 10 THEN v_pay_rate := round(v_paid30::numeric / v_created30 * 100, 1); v_pay_src := 'mesuré sur 30 jours';
  ELSE v_pay_rate := v_pay_set; v_pay_src := 'hypothèse (échantillon trop petit)'; END IF;

  SELECT COALESCE(sum(total_xof) FILTER (WHERE created_at >= now() - make_interval(hours => v_abandon)), 0),
         COALESCE(sum(total_xof) FILTER (WHERE created_at < now() - make_interval(hours => v_abandon)), 0)
    INTO v_pend_val, v_aband_val
  FROM public.orders WHERE payment_status = 'pending' AND order_status = 'pending_payment';

  v_cash := jsonb_build_object(
    'collected_month_xof', COALESCE((SELECT sum(total_xof) FROM public.orders WHERE payment_status = 'paid' AND COALESCE(paid_at, updated_at) >= date_trunc('month', now())), 0),
    'pending_count', (SELECT count(*) FROM public.orders WHERE payment_status = 'pending' AND order_status = 'pending_payment' AND created_at >= now() - make_interval(hours => v_abandon)),
    'pending_xof', v_pend_val,
    'abandoned_count', (SELECT count(*) FROM public.orders WHERE payment_status = 'pending' AND order_status = 'pending_payment' AND created_at < now() - make_interval(hours => v_abandon)),
    'abandoned_xof', v_aband_val,
    'abandon_hours', v_abandon,
    'refunded_xof', COALESCE((SELECT sum(amount_xof) FROM public.payments WHERE status = 'refunded'), 0),
    'refunds_pending_count', (SELECT count(*) FROM public.groupage_participants WHERE status = 'cancelled' AND COALESCE(refund_status, '') = 'pending'),
    'refunds_pending_xof', COALESCE((SELECT sum(total_xof) FROM public.groupage_participants WHERE status = 'cancelled' AND COALESCE(refund_status, '') = 'pending'), 0),
    'orders_created_30d', v_created30, 'orders_paid_30d', v_paid30, 'payment_rate_pct', v_pay_rate, 'payment_rate_source', v_pay_src
  );

  -- Prévisions à 30 jours (estimations, hypothèses affichées)
  SELECT count(*) FILTER (WHERE status = 'accepted'), count(*) FILTER (WHERE status IN ('rejected', 'expired'))
    INTO v_acc, v_res
  FROM public.quotes WHERE created_at >= now() - interval '120 days';
  IF v_acc + v_res >= 5 THEN v_conv := round(v_acc::numeric / (v_acc + v_res) * 100, 1); v_conv_src := 'mesuré sur 120 jours';
  ELSE v_conv := v_conv_set; v_conv_src := 'hypothèse (peu de devis conclus)'; END IF;

  SELECT count(*), COALESCE(sum(total_xof), 0) INTO v_q_n, v_q_val
  FROM public.quotes WHERE status IN ('sent', 'viewed') AND (valid_until IS NULL OR valid_until >= current_date);

  SELECT COALESCE(jsonb_agg(m ORDER BY (m ->> 'deadline')), '[]'::jsonb),
         COALESCE(sum(GREATEST(0, (m ->> 'projected_quantity')::numeric - (m ->> 'active_quantity')::numeric)
                      * (m ->> 'unit_price_xof')::numeric * (m ->> 'probability')::numeric), 0)
    INTO v_groupages, v_gr_future
  FROM (
    SELECT public._groupage_metrics(g.id) - 'expiring' AS m
    FROM public.groupages g WHERE g.status IN ('open', 'almost_full')
  ) x;

  v_forecast := jsonb_build_object(
    'quotes_open_count', v_q_n, 'quotes_open_xof', v_q_val, 'quote_conversion_pct', v_conv, 'quote_conversion_source', v_conv_src,
    'quotes_expected_xof', round(v_q_val * v_conv / 100, 0),
    'pending_orders_xof', v_pend_val, 'pending_expected_xof', round(v_pend_val * v_pay_rate / 100, 0),
    'groupages_expected_xof', round(v_gr_future, 0),
    'expected_total_xof', round(v_q_val * v_conv / 100 + v_pend_val * v_pay_rate / 100 + v_gr_future, 0),
    'groupages_at_risk', (SELECT COALESCE(jsonb_agg(g), '[]'::jsonb) FROM jsonb_array_elements(v_groupages) g WHERE g ->> 'risk' IN ('at_risk', 'critical', 'failed')),
    'assumptions', jsonb_build_array(
      'Devis ouverts × taux de conversion (' || v_conv_src || ')',
      'Commandes en attente de paiement × taux de paiement (' || v_pay_src || ')',
      'Groupages ouverts : quantités encore attendues au rythme actuel × probabilité d''atteindre la quantité minimale'
    )
  );

  SELECT value INTO v_fx FROM public.platform_settings WHERE key = 'exchange_rates' LIMIT 1;
  SELECT COALESCE(jsonb_agg(jsonb_build_object('cny_to_xof', cny_to_xof, 'usd_to_xof', usd_to_xof, 'at', created_at) ORDER BY created_at DESC), '[]'::jsonb)
    INTO v_hist
  FROM (SELECT * FROM public.exchange_rate_history ORDER BY created_at DESC LIMIT 10) h;

  RETURN v_core || jsonb_build_object('cash', v_cash, 'forecast', v_forecast, 'fx', COALESCE(v_fx, '{}'::jsonb), 'fx_history', v_hist, 'targets', v_t);
END;
$$;

-- ---------------------------------------------------------------- 5. Transitaire : file de demandes et délais
CREATE OR REPLACE FUNCTION public.transitaire_overview()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_queue jsonb; v_old24 integer; v_old48 integer; v_avg numeric; v_acc integer; v_res integer;
  v_q_n integer; v_q_val numeric; v_exp_soon integer;
BEGIN
  IF NOT (public.is_admin() OR public.is_transitaire()) THEN RAISE EXCEPTION 'PERMISSION_DENIED' USING ERRCODE = '42501'; END IF;

  WITH r AS (
    SELECT 'sourcing'::text AS type, id, code, title::text AS label, created_at FROM public.sourcing_requests WHERE status = 'new'
    UNION ALL SELECT 'b2b', id, code, COALESCE(company_name, product_name)::text, created_at FROM public.b2b_requests WHERE status = 'new'
    UNION ALL SELECT 'vehicle', id, code, COALESCE(NULLIF(trim(concat_ws(' ', brand, model)), ''), contact_name)::text, created_at FROM public.vehicle_requests WHERE status = 'new'
  )
  SELECT COALESCE(jsonb_agg(jsonb_build_object('type', type, 'id', id, 'code', code, 'label', label,
           'age_hours', round(extract(epoch FROM (now() - created_at)) / 3600, 1)) ORDER BY created_at), '[]'::jsonb),
         count(*) FILTER (WHERE created_at < now() - interval '24 hours'),
         count(*) FILTER (WHERE created_at < now() - interval '48 hours')
    INTO v_queue, v_old24, v_old48
  FROM (SELECT * FROM r ORDER BY created_at LIMIT 200) q;
  v_queue := (SELECT COALESCE(jsonb_agg(t.e ORDER BY t.n), '[]'::jsonb) FROM (SELECT e, n FROM jsonb_array_elements(v_queue) WITH ORDINALITY AS x(e, n) ORDER BY n LIMIT 8) t);

  WITH first_quote AS (
    SELECT q.id, q.sent_at,
           COALESCE(s.created_at, b.created_at, v.created_at) AS req_at
    FROM public.quotes q
    LEFT JOIN public.sourcing_requests s ON s.id = q.sourcing_request_id
    LEFT JOIN public.b2b_requests b ON b.id = q.b2b_request_id
    LEFT JOIN public.vehicle_requests v ON v.id = q.vehicle_request_id
    WHERE q.sent_at IS NOT NULL AND q.sent_at >= now() - interval '90 days'
  )
  SELECT round(avg(extract(epoch FROM (sent_at - req_at)) / 3600)::numeric, 1) INTO v_avg
  FROM first_quote WHERE req_at IS NOT NULL AND sent_at >= req_at;

  SELECT count(*) FILTER (WHERE status = 'accepted'), count(*) FILTER (WHERE status IN ('rejected', 'expired'))
    INTO v_acc, v_res FROM public.quotes WHERE created_at >= now() - interval '90 days';

  SELECT count(*), COALESCE(sum(total_xof), 0),
         count(*) FILTER (WHERE valid_until IS NOT NULL AND valid_until <= current_date + 3)
    INTO v_q_n, v_q_val, v_exp_soon
  FROM public.quotes WHERE status IN ('sent', 'viewed') AND (valid_until IS NULL OR valid_until >= current_date);

  RETURN jsonb_build_object(
    'queue', v_queue, 'waiting_over_24h', v_old24, 'waiting_over_48h', v_old48,
    'avg_response_hours', v_avg,
    'quotes_resolved_90d', v_acc + v_res,
    'quote_conversion_pct', CASE WHEN v_acc + v_res > 0 THEN round(v_acc::numeric / (v_acc + v_res) * 100, 1) END,
    'quotes_open_count', v_q_n, 'quotes_open_xof', v_q_val, 'quotes_expiring_3d', v_exp_soon
  );
END;
$$;

-- ---------------------------------------------------------------- 6. Contexte de prix (calculateur) et réglages
CREATE OR REPLACE FUNCTION public.get_finance_context()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_fx jsonb; v_t jsonb; v_rates jsonb; v_hist jsonb; v_fees jsonb;
BEGIN
  IF NOT public.is_staff() THEN RAISE EXCEPTION 'PERMISSION_DENIED' USING ERRCODE = '42501'; END IF;
  SELECT value INTO v_fx FROM public.platform_settings WHERE key = 'exchange_rates' LIMIT 1;
  SELECT value INTO v_t FROM public.platform_settings WHERE key = 'finance_targets' LIMIT 1;
  SELECT value INTO v_fees FROM public.platform_settings WHERE key = 'fees_structure' LIMIT 1;
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
           'id', id, 'transport_mode', transport_mode, 'origin', origin, 'destination', destination,
           'pricing_unit', pricing_unit, 'rate_xof', rate_xof, 'min_charge_xof', min_charge_xof,
           'volumetric_factor', volumetric_factor, 'days_min', base_transit_days_min, 'days_max', base_transit_days_max
         ) ORDER BY transport_mode), '[]'::jsonb)
    INTO v_rates
  FROM public.transport_rates WHERE active AND (valid_until IS NULL OR valid_until > now());
  SELECT COALESCE(jsonb_agg(jsonb_build_object('cny_to_xof', cny_to_xof, 'at', created_at) ORDER BY created_at DESC), '[]'::jsonb)
    INTO v_hist FROM (SELECT * FROM public.exchange_rate_history ORDER BY created_at DESC LIMIT 5) h;
  RETURN jsonb_build_object('fx', COALESCE(v_fx, '{}'::jsonb), 'targets', COALESCE(v_t, '{}'::jsonb), 'fees', COALESCE(v_fees, '{}'::jsonb), 'freight', v_rates, 'fx_history', v_hist);
END;
$$;

-- Le taux de change est un outil de travail du transitaire (qui fait aussi le sourcing) : admin ET transitaire peuvent le modifier.
-- Chaque changement est tracé (historique avec l'auteur) et limité à ±30 % pour éviter une faute de frappe.
CREATE OR REPLACE FUNCTION public.admin_set_exchange_rate(p_cny_to_xof numeric, p_usd_to_xof numeric DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_old jsonb; v_new jsonb; v_prev numeric;
BEGIN
  IF NOT (public.is_admin() OR public.is_transitaire()) THEN RAISE EXCEPTION 'PERMISSION_DENIED' USING ERRCODE = '42501'; END IF;
  IF p_cny_to_xof IS NULL OR p_cny_to_xof <= 0 THEN RAISE EXCEPTION 'INVALID_RATE: le taux doit être positif' USING ERRCODE = '22023'; END IF;
  IF p_usd_to_xof IS NOT NULL AND p_usd_to_xof <= 0 THEN RAISE EXCEPTION 'INVALID_RATE: le taux doit être positif' USING ERRCODE = '22023'; END IF;
  SELECT value INTO v_old FROM public.platform_settings WHERE key = 'exchange_rates' LIMIT 1;
  v_prev := NULLIF(v_old ->> 'cny_to_xof', '')::numeric;
  IF v_prev IS NOT NULL AND (p_cny_to_xof < v_prev * 0.7 OR p_cny_to_xof > v_prev * 1.4) THEN
    RAISE EXCEPTION 'RATE_OUT_OF_RANGE: variation supérieure à 30 %% (ancien taux %), vérifiez la saisie', v_prev USING ERRCODE = '22023';
  END IF;
  v_new := COALESCE(v_old, '{}'::jsonb) || jsonb_build_object('cny_to_xof', p_cny_to_xof)
           || CASE WHEN p_usd_to_xof IS NOT NULL THEN jsonb_build_object('usd_to_xof', p_usd_to_xof) ELSE '{}'::jsonb END;
  IF v_old IS NULL THEN
    INSERT INTO public.platform_settings (key, value, description) VALUES ('exchange_rates', v_new, 'Taux de conversion officiels plateforme');
  ELSE
    UPDATE public.platform_settings SET value = v_new, updated_at = now() WHERE key = 'exchange_rates';
  END IF;
  INSERT INTO public.exchange_rate_history (cny_to_xof, usd_to_xof, set_by)
  VALUES (p_cny_to_xof, NULLIF(v_new ->> 'usd_to_xof', '')::numeric, auth.uid());
  RETURN v_new;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_update_finance_targets(p_targets jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_old jsonb; v_new jsonb; k text; v numeric;
  v_limits constant jsonb := '{"min_margin_pct":[0,90],"target_margin_pct":[0,95],"quote_conversion_pct":[0,100],"payment_rate_pct":[0,100],"abandon_hours":[1,720]}';
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'PERMISSION_DENIED' USING ERRCODE = '42501'; END IF;
  IF p_targets IS NULL OR jsonb_typeof(p_targets) <> 'object' THEN RAISE EXCEPTION 'INVALID_INPUT' USING ERRCODE = '22023'; END IF;
  FOR k IN SELECT jsonb_object_keys(p_targets) LOOP
    IF NOT v_limits ? k THEN RAISE EXCEPTION 'INVALID_INPUT: paramètre inconnu %', k USING ERRCODE = '22023'; END IF;
    v := (p_targets ->> k)::numeric;
    IF v < (v_limits -> k ->> 0)::numeric OR v > (v_limits -> k ->> 1)::numeric THEN
      RAISE EXCEPTION 'INVALID_INPUT: % doit être entre % et %', k, v_limits -> k ->> 0, v_limits -> k ->> 1 USING ERRCODE = '22023';
    END IF;
  END LOOP;
  SELECT value INTO v_old FROM public.platform_settings WHERE key = 'finance_targets' LIMIT 1;
  v_new := COALESCE(v_old, '{}'::jsonb) || p_targets;
  IF v_old IS NULL THEN
    INSERT INTO public.platform_settings (key, value, description) VALUES ('finance_targets', v_new, 'Objectifs financiers');
  ELSE
    UPDATE public.platform_settings SET value = v_new, updated_at = now() WHERE key = 'finance_targets';
  END IF;
  RETURN v_new;
END;
$$;

-- ---------------------------------------------------------------- 7. Tableau de bord admin : marge honnête
CREATE OR REPLACE FUNCTION public.admin_dashboard_stats()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_revenue numeric := 0; v_revenue_month numeric := 0;
  v_costs numeric := 0; v_margin numeric := 0; v_rev_known numeric := 0;
  v_recorded numeric := 0; v_estimated numeric := 0; v_missing integer := 0;
  v_activity jsonb;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'PERMISSION_DENIED' USING ERRCODE = '42501'; END IF;

  SELECT COALESCE(SUM(total_xof), 0),
         COALESCE(SUM(total_xof) FILTER (WHERE COALESCE(paid_at, updated_at) >= date_trunc('month', now())), 0)
    INTO v_revenue, v_revenue_month
  FROM public.orders WHERE payment_status = 'paid';

  SELECT COALESCE(SUM(total_cost_xof) FILTER (WHERE margin_xof IS NOT NULL), 0),
         COALESCE(SUM(margin_xof), 0),
         COALESCE(SUM(revenue_xof) FILTER (WHERE margin_xof IS NOT NULL), 0),
         COALESCE(SUM(purchase_xof) FILTER (WHERE purchase_source = 'estimated'), 0),
         count(*) FILTER (WHERE cost_quality = 'missing')
    INTO v_costs, v_margin, v_rev_known, v_estimated, v_missing
  FROM public._finance_orders(NULL, NULL, NULL);

  SELECT COALESCE(SUM(c.amount_xof), 0) INTO v_recorded
  FROM public.order_costs c JOIN public.orders o ON o.id = c.order_id WHERE o.payment_status = 'paid';

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
    'costs_xof', v_costs,
    'recorded_costs_xof', v_recorded,
    'estimated_purchase_xof', v_estimated,
    'margin_xof', v_margin,
    'margin_coverage_pct', CASE WHEN v_revenue > 0 THEN round(v_rev_known / v_revenue * 100, 1) ELSE 100 END,
    'orders_missing_costs', v_missing,
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

-- ---------------------------------------------------------------- 8. Droits d'exécution
DO $$
DECLARE s text;
BEGIN
  FOREACH s IN ARRAY ARRAY[
    'public.staff_order_financials(uuid)',
    'public.groupage_cockpit(uuid)',
    'public.manager_groupage_overview()',
    'public.staff_remind_groupage_reservations(uuid)',
    'public.admin_finance_overview(integer)',
    'public.transitaire_overview()',
    'public.get_finance_context()',
    'public.admin_set_exchange_rate(numeric, numeric)',
    'public.admin_update_finance_targets(jsonb)',
    'public.admin_dashboard_stats()'
  ] LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon', s);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated, service_role', s);
  END LOOP;
END $$;
