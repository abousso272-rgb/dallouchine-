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
