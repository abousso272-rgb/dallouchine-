-- ==============================================================================
-- DALLOU CHINE — MISE À JOUR DU 22/10 (à coller en une fois dans Supabase > SQL Editor > Run)
-- 1. Groupages rentables (création par les gestionnaires, simulateur, coûts par groupage)
-- 2. Audience du site (statistiques de visite)
-- Peut être rejoué sans danger.
-- ==============================================================================

-- >>>>>>>>>> 20261022_01_groupage_profitability
-- =============================================================================
-- GROUPAGES RENTABLES : le gestionnaire crée ses groupages de A à Z
-- -----------------------------------------------------------------------------
-- * Tout gestionnaire de groupages peut créer un groupage (brouillon), sans permission spéciale.
-- * staff_create_draft_product(p) : crée le produit (brouillon) et ses coûts pour un nouveau groupage.
-- * groupage_economics : hypothèses de rentabilité d'un groupage (prix d'achat, cargo, frais fixes…),
--   visibles par l'équipe uniquement (jamais par les clients).
-- * Le cockpit utilise ces hypothèses ; le gestionnaire voit la marge de ses propres groupages.
-- Idempotent.
-- =============================================================================

DROP POLICY IF EXISTS daluche_groupages_manager_insert ON public.groupages;
CREATE POLICY daluche_groupages_manager_insert ON public.groupages FOR INSERT
  WITH CHECK (public.is_groupage_manager());

-- ---------------------------------------------------------------- Hypothèses de rentabilité
CREATE TABLE IF NOT EXISTS public.groupage_economics (
  groupage_id uuid PRIMARY KEY REFERENCES public.groupages(id) ON DELETE CASCADE,
  purchase_price_cny numeric(14, 2),
  fx_cny_xof numeric(12, 4),
  weight_kg numeric(12, 4),
  cbm numeric(12, 6),
  transport_mode text,
  cargo_unit_xof numeric(14, 2),
  fixed_costs_xof numeric(14, 2) NOT NULL DEFAULT 0,
  payment_fee_pct numeric(6, 2) NOT NULL DEFAULT 2,
  target_margin_pct numeric(6, 2),
  landed_unit_xof numeric(14, 2),
  breakeven_quantity integer,
  notes text,
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.groupage_economics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS groupage_economics_staff_read ON public.groupage_economics;
CREATE POLICY groupage_economics_staff_read ON public.groupage_economics FOR SELECT
  USING (public.is_admin() OR public.is_transitaire() OR public.manages_groupage(groupage_id));
DROP POLICY IF EXISTS groupage_economics_staff_insert ON public.groupage_economics;
CREATE POLICY groupage_economics_staff_insert ON public.groupage_economics FOR INSERT
  WITH CHECK (public.is_admin() OR public.manages_groupage(groupage_id));
DROP POLICY IF EXISTS groupage_economics_staff_update ON public.groupage_economics;
CREATE POLICY groupage_economics_staff_update ON public.groupage_economics FOR UPDATE
  USING (public.is_admin() OR public.manages_groupage(groupage_id))
  WITH CHECK (public.is_admin() OR public.manages_groupage(groupage_id));

-- ---------------------------------------------------------------- Produit brouillon pour un groupage
CREATE OR REPLACE FUNCTION public.staff_create_draft_product(p jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_name text := trim(COALESCE(p ->> 'name', ''));
  v_cat uuid; v_pid uuid; v_slug text; v_base text; v_n integer := 1; v_img text := NULLIF(trim(COALESCE(p ->> 'image_url', '')), '');
  v_fx numeric; v_cny numeric := NULLIF(p ->> 'purchase_price_cny', '')::numeric;
BEGIN
  IF NOT (public.is_admin() OR public.is_transitaire() OR public.is_groupage_manager()) THEN
    RAISE EXCEPTION 'PERMISSION_DENIED' USING ERRCODE = '42501';
  END IF;
  IF length(v_name) < 2 THEN RAISE EXCEPTION 'INVALID_INPUT: nom du produit manquant' USING ERRCODE = '22023'; END IF;
  SELECT id INTO v_cat FROM public.categories WHERE id::text = p ->> 'category_id' AND is_active;
  IF v_cat IS NULL THEN RAISE EXCEPTION 'INVALID_INPUT: catégorie inconnue' USING ERRCODE = '22023'; END IF;
  IF v_img IS NOT NULL AND v_img !~* '^https://' THEN RAISE EXCEPTION 'INVALID_INPUT: lien d''image invalide' USING ERRCODE = '22023'; END IF;

  v_base := trim(both '-' from regexp_replace(lower(translate(v_name, 'àâäáãåçéèêëíìîïñóòôöõúùûüýÿÀÂÄÁÃÅÇÉÈÊËÍÌÎÏÑÓÒÔÖÕÚÙÛÜÝ', 'aaaaaaceeeeiiiinooooouuuuyyAAAAAACEEEEIIIINOOOOOUUUUY')), '[^a-z0-9]+', '-', 'g'));
  v_base := COALESCE(NULLIF(v_base, ''), 'produit');
  v_slug := v_base;
  WHILE EXISTS (SELECT 1 FROM public.products WHERE slug = v_slug) LOOP v_n := v_n + 1; v_slug := v_base || '-' || v_n; END LOOP;

  INSERT INTO public.products (name, slug, category_id, short_description, description, price_xof, moq, stock_quantity, weight_kg, cbm,
                               default_transport_mode, features, specifications, is_active, is_featured, is_auto_mobility, is_groupage, created_by)
  VALUES (v_name, v_slug, v_cat, left(COALESCE(NULLIF(p ->> 'description', ''), v_name), 280), COALESCE(p ->> 'description', ''),
          GREATEST(1, round(COALESCE(NULLIF(p ->> 'price_xof', '')::numeric, 1))), GREATEST(1, COALESCE(NULLIF(p ->> 'moq', '')::integer, 1)), 0,
          GREATEST(0, COALESCE(NULLIF(p ->> 'weight_kg', '')::numeric, 0)), GREATEST(0, COALESCE(NULLIF(p ->> 'cbm', '')::numeric, 0)),
          CASE WHEN p ->> 'transport_mode' IN ('air', 'sea', 'express') THEN p ->> 'transport_mode' ELSE 'sea' END,
          '{}'::text[], '{}'::jsonb, false, false, false, true, auth.uid())
  RETURNING id INTO v_pid;

  IF v_img IS NOT NULL THEN
    INSERT INTO public.product_images (product_id, image_url, sort_order, is_primary, alt_text) VALUES (v_pid, v_img, 0, true, v_name);
  END IF;

  IF v_cny IS NOT NULL AND v_cny > 0 THEN
    SELECT NULLIF(value ->> 'cny_to_xof', '')::numeric INTO v_fx FROM public.platform_settings WHERE key = 'exchange_rates';
    INSERT INTO public.product_costs (product_id, purchase_price_cny, purchase_price_xof, logistics_cost_xof, supplier_name, supplier_url, list_price_cny, cargo_unit_xof, updated_by, updated_at)
    VALUES (v_pid, v_cny, round(v_cny * COALESCE(v_fx, 0)), GREATEST(0, round(COALESCE(NULLIF(p ->> 'logistics_cost_xof', '')::numeric, 0))),
            NULLIF(p ->> 'supplier_name', ''), NULLIF(p ->> 'supplier_url', ''), NULLIF(p ->> 'list_price_cny', '')::numeric,
            NULLIF(p ->> 'cargo_unit_xof', '')::numeric, auth.uid(), now())
    ON CONFLICT (product_id) DO NOTHING;
  END IF;

  RETURN jsonb_build_object('id', v_pid, 'slug', v_slug);
END;
$$;

REVOKE ALL ON FUNCTION public.staff_create_draft_product(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.staff_create_draft_product(jsonb) TO authenticated, service_role;

-- ---------------------------------------------------------------- Cockpit : coûts du groupage d'abord
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

  -- Coût par unité : hypothèses du groupage (simulateur), sinon fiche coûts du produit
  SELECT ge.landed_unit_xof INTO v_unit_cost FROM public.groupage_economics ge WHERE ge.groupage_id = p_id AND ge.landed_unit_xof > 0;
  IF v_unit_cost IS NULL THEN
    SELECT pc.purchase_price_xof + pc.logistics_cost_xof INTO v_unit_cost
    FROM public.product_costs pc WHERE pc.product_id = g.product_id AND pc.purchase_price_xof > 0;
  END IF;

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
  -- Le gestionnaire voit la rentabilité de SES groupages : c'est lui qui la construit
  v_margin_ok := public.has_permission('view_margins') OR public.manages_groupage(p_groupage_id);

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


REVOKE ALL ON FUNCTION public.groupage_cockpit(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.groupage_cockpit(uuid) TO authenticated, service_role;

-- >>>>>>>>>> 20261022_02_audience
-- =============================================================================
-- AUDIENCE : statistiques de visite propres au site (sans dépendre de Google)
-- -----------------------------------------------------------------------------
-- * analytics_events : une ligne par page vue ou événement, écrite UNIQUEMENT par le serveur (clé service_role).
--   Aucune donnée personnelle : identifiant de visite aléatoire (session), pays déduit de l'adresse IP
--   par l'hébergeur (l'adresse IP elle-même n'est pas conservée), type d'appareil, source.
-- * admin_audience(p_days) : tableau de bord de l'administration.
-- * Purge automatique au-delà de 13 mois (à l'appel du tableau de bord).
-- Idempotent.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.analytics_events (
  id bigserial PRIMARY KEY,
  at timestamptz NOT NULL DEFAULT now(),
  session_id text NOT NULL,
  event text NOT NULL DEFAULT 'page_view',
  path text NOT NULL,
  source text NOT NULL DEFAULT 'direct',
  medium text,
  campaign text,
  referrer_host text,
  country text,
  device text,
  lang text,
  is_new_session boolean NOT NULL DEFAULT false,
  user_id uuid
);
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
-- Aucune politique : lecture et écriture réservées au serveur et aux fonctions ci-dessous.

CREATE INDEX IF NOT EXISTS idx_analytics_events_at ON public.analytics_events (at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session ON public.analytics_events (session_id);

CREATE OR REPLACE FUNCTION public.admin_audience(p_days integer DEFAULT 30)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_days integer := LEAST(400, GREATEST(1, COALESCE(p_days, 30)));
  v_from timestamptz := date_trunc('day', now()) - make_interval(days => v_days - 1);
  v_prev_from timestamptz := v_from - make_interval(days => v_days);
  r jsonb;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'PERMISSION_DENIED' USING ERRCODE = '42501'; END IF;

  DELETE FROM public.analytics_events WHERE at < now() - interval '13 months';

  WITH ev AS (SELECT * FROM public.analytics_events WHERE at >= v_from),
  sessions AS (
    SELECT session_id,
           min(at) AS started,
           (array_agg(source ORDER BY at))[1] AS source,
           (array_agg(country ORDER BY at))[1] AS country,
           (array_agg(device ORDER BY at))[1] AS device,
           (array_agg(path ORDER BY at))[1] AS landing,
           count(*) FILTER (WHERE event = 'page_view') AS pages
    FROM ev GROUP BY session_id
  ),
  days AS (SELECT d::date AS day FROM generate_series(v_from, date_trunc('day', now()), interval '1 day') d)
  SELECT jsonb_build_object(
    'days', v_days,
    'visits', (SELECT count(*) FROM sessions),
    'pageviews', (SELECT count(*) FROM ev WHERE event = 'page_view'),
    'visits_today', (SELECT count(*) FROM sessions WHERE started >= date_trunc('day', now())),
    'visits_prev', (SELECT count(DISTINCT session_id) FROM public.analytics_events WHERE at >= v_prev_from AND at < v_from),
    'bounce_pct', (SELECT CASE WHEN count(*) > 0 THEN round(count(*) FILTER (WHERE pages <= 1)::numeric / count(*) * 100, 1) END FROM sessions),
    'pages_per_visit', (SELECT CASE WHEN count(*) > 0 THEN round(sum(pages)::numeric / count(*), 1) END FROM sessions),
    'daily', (SELECT COALESCE(jsonb_agg(jsonb_build_object('day', d.day, 'visits', COALESCE(x.n, 0)) ORDER BY d.day), '[]'::jsonb)
              FROM days d LEFT JOIN (SELECT started::date AS day, count(*) AS n FROM sessions GROUP BY 1) x ON x.day = d.day),
    'sources', (SELECT COALESCE(jsonb_agg(jsonb_build_object('source', source, 'visits', n) ORDER BY n DESC), '[]'::jsonb)
                FROM (SELECT source, count(*) AS n FROM sessions GROUP BY source ORDER BY n DESC LIMIT 12) s),
    'countries', (SELECT COALESCE(jsonb_agg(jsonb_build_object('country', country, 'visits', n) ORDER BY n DESC), '[]'::jsonb)
                  FROM (SELECT COALESCE(country, '??') AS country, count(*) AS n FROM sessions GROUP BY 1 ORDER BY n DESC LIMIT 12) c),
    'devices', (SELECT COALESCE(jsonb_agg(jsonb_build_object('device', device, 'visits', n) ORDER BY n DESC), '[]'::jsonb)
                FROM (SELECT COALESCE(device, 'inconnu') AS device, count(*) AS n FROM sessions GROUP BY 1) d),
    'pages', (SELECT COALESCE(jsonb_agg(jsonb_build_object('path', path, 'views', n) ORDER BY n DESC), '[]'::jsonb)
              FROM (SELECT path, count(*) AS n FROM ev WHERE event = 'page_view' GROUP BY path ORDER BY n DESC LIMIT 15) p),
    'landings', (SELECT COALESCE(jsonb_agg(jsonb_build_object('path', landing, 'visits', n) ORDER BY n DESC), '[]'::jsonb)
                 FROM (SELECT landing, count(*) AS n FROM sessions GROUP BY landing ORDER BY n DESC LIMIT 10) l),
    'campaigns', (SELECT COALESCE(jsonb_agg(jsonb_build_object('campaign', campaign, 'source', source, 'visits', n) ORDER BY n DESC), '[]'::jsonb)
                  FROM (SELECT campaign, (array_agg(source))[1] AS source, count(DISTINCT session_id) AS n FROM ev WHERE campaign IS NOT NULL GROUP BY campaign ORDER BY n DESC LIMIT 10) k),
    'events', (SELECT COALESCE(jsonb_object_agg(event, n), '{}'::jsonb) FROM (SELECT event, count(*) AS n FROM ev WHERE event <> 'page_view' GROUP BY event) e),
    'signups', (SELECT count(*) FROM public.profiles WHERE created_at >= v_from AND lower(role) IN ('client', 'customer', 'b2b_customer', 'b2b_client')),
    'orders', (SELECT count(*) FROM public.orders WHERE created_at >= v_from),
    'orders_paid', (SELECT count(*) FROM public.orders WHERE created_at >= v_from AND payment_status = 'paid'),
    'requests', (SELECT (SELECT count(*) FROM public.sourcing_requests WHERE created_at >= v_from) + (SELECT count(*) FROM public.b2b_requests WHERE created_at >= v_from) + (SELECT count(*) FROM public.vehicle_requests WHERE created_at >= v_from)),
    'first_event_at', (SELECT min(at) FROM public.analytics_events)
  ) INTO r;
  RETURN r;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_audience(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_audience(integer) TO authenticated, service_role;

