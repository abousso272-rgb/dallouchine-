-- =============================================================================
-- DALUCHE — Règles et actions sécurisées des groupages
-- =============================================================================
--  • Réservations non payées libérées automatiquement après un délai (48 h par défaut)
--  • Cycle de vie strict (transitions autorisées uniquement, via RPC)
--  • Validation : les réservations non payées sont annulées, seuls les payés continuent
--  • Annulation (admin) : remboursements marqués « à rembourser »
--  • Gestionnaire : retirer un participant, publier une actualité, prévenir les participants
--  • Journal (groupage_events) : public pour les étapes, privé pour les notes internes
--  • Compteurs recalculés depuis les participations (plus de dérive)
-- =============================================================================

-- 1. Colonnes de règles et de remboursement ---------------------------------
ALTER TABLE public.groupages
  ADD COLUMN IF NOT EXISTS reservation_hours int NOT NULL DEFAULT 48,
  ADD COLUMN IF NOT EXISTS terms text;
DO $$ BEGIN
  ALTER TABLE public.groupages ADD CONSTRAINT groupages_reservation_hours_check CHECK (reservation_hours BETWEEN 1 AND 336);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.groupage_participants
  ADD COLUMN IF NOT EXISTS cancelled_reason text,
  ADD COLUMN IF NOT EXISTS cancelled_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS refund_status text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS refund_reference text,
  ADD COLUMN IF NOT EXISTS refunded_at timestamptz;
DO $$ BEGIN
  ALTER TABLE public.groupage_participants ADD CONSTRAINT groupage_participants_refund_status_check CHECK (refund_status IN ('none', 'pending', 'done'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_groupage_participants_groupage ON public.groupage_participants (groupage_id, status);

-- 2. Journal du groupage ------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.groupage_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  groupage_id uuid NOT NULL REFERENCES public.groupages(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  kind text NOT NULL CHECK (kind IN ('status', 'update', 'note', 'participant', 'refund', 'system')),
  title text NOT NULL,
  message text,
  is_public boolean NOT NULL DEFAULT false,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_groupage_events_groupage ON public.groupage_events (groupage_id, created_at DESC);
ALTER TABLE public.groupage_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS groupage_events_public_read ON public.groupage_events;
CREATE POLICY groupage_events_public_read ON public.groupage_events FOR SELECT
  USING (
    (is_public AND EXISTS (SELECT 1 FROM public.groupages g WHERE g.id = groupage_id AND g.status <> 'draft'))
    OR public.is_admin()
    OR public.manages_groupage(groupage_id)
  );
-- Aucune écriture directe : uniquement via les fonctions ci-dessous
REVOKE INSERT, UPDATE, DELETE ON public.groupage_events FROM anon, authenticated;
GRANT SELECT ON public.groupage_events TO anon, authenticated;

CREATE OR REPLACE FUNCTION public._groupage_log(p_groupage_id uuid, p_kind text, p_title text, p_message text, p_public boolean, p_data jsonb DEFAULT '{}'::jsonb)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.groupage_events (groupage_id, actor_id, kind, title, message, is_public, data)
  VALUES (p_groupage_id, auth.uid(), p_kind, p_title, NULLIF(trim(coalesce(p_message, '')), ''), p_public, coalesce(p_data, '{}'::jsonb));
$$;
REVOKE ALL ON FUNCTION public._groupage_log(uuid, text, text, text, boolean, jsonb) FROM PUBLIC, anon, authenticated;

-- 3. Recalcul des compteurs à partir des participations -----------------------
CREATE OR REPLACE FUNCTION public._groupage_recompute(p_groupage_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reserved int;
  v_people int;
BEGIN
  SELECT coalesce(sum(quantity), 0), count(DISTINCT user_id)
    INTO v_reserved, v_people
    FROM public.groupage_participants
   WHERE groupage_id = p_groupage_id AND status IN ('reserved', 'confirmed', 'paid');

  PERFORM set_config('daluche.groupage_system', 'on', true);
  UPDATE public.groupages g
     SET reserved_quantity = v_reserved,
         participants_count = v_people,
         status = CASE
           WHEN g.status IN ('open', 'almost_full', 'full') THEN
             CASE WHEN v_reserved >= g.target_quantity THEN 'full'
                  WHEN v_reserved >= ceil(g.target_quantity * 0.8) THEN 'almost_full'
                  ELSE 'open' END
           ELSE g.status END
   WHERE g.id = p_groupage_id;
  PERFORM set_config('daluche.groupage_system', 'off', true);
END;
$$;
REVOKE ALL ON FUNCTION public._groupage_recompute(uuid) FROM PUBLIC, anon, authenticated;

-- 4. Protection des écritures directes (statut et compteurs) ------------------
CREATE OR REPLACE FUNCTION public.guard_groupage_writes()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF current_user NOT IN ('anon', 'authenticated') OR current_setting('daluche.groupage_system', true) = 'on' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.reserved_quantity := 0;
    NEW.participants_count := 0;
    NEW.created_by := auth.uid();
    IF NOT public.is_admin() THEN
      NEW.assigned_manager_id := auth.uid();
      NEW.status := 'draft';
    ELSIF NEW.status NOT IN ('draft', 'open') THEN
      NEW.status := 'draft';
    END IF;
    RETURN NEW;
  END IF;

  -- Compteurs et statut ne changent que par les fonctions métier
  NEW.reserved_quantity := OLD.reserved_quantity;
  NEW.participants_count := OLD.participants_count;
  NEW.status := OLD.status;
  NEW.created_by := OLD.created_by;
  IF NOT public.is_admin() THEN
    NEW.assigned_manager_id := OLD.assigned_manager_id;
    IF NOT public.has_permission('set_groupage_prices')
       AND OLD.status <> 'draft'
       AND (NEW.unit_price_xof IS DISTINCT FROM OLD.unit_price_xof
            OR NEW.target_quantity IS DISTINCT FROM OLD.target_quantity) THEN
      RAISE EXCEPTION 'PERMISSION_DENIED: prix et objectif d''un groupage publié modifiables par l''administration uniquement'
        USING ERRCODE = '42501';
    END IF;
  END IF;
  IF OLD.status NOT IN ('draft', 'open', 'almost_full', 'full') AND (
       NEW.unit_price_xof IS DISTINCT FROM OLD.unit_price_xof
       OR NEW.target_quantity IS DISTINCT FROM OLD.target_quantity
       OR NEW.min_order_per_user IS DISTINCT FROM OLD.min_order_per_user
       OR NEW.max_order_per_user IS DISTINCT FROM OLD.max_order_per_user) THEN
    RAISE EXCEPTION 'LOCKED: prix, objectif et quantités sont figés une fois le groupage validé';
  END IF;
  IF NEW.target_quantity < OLD.reserved_quantity THEN
    RAISE EXCEPTION 'INVALID_TARGET: l''objectif ne peut pas être inférieur aux % unités déjà réservées', OLD.reserved_quantity;
  END IF;
  RETURN NEW;
END;
$$;

-- 5. Libération des réservations expirées -------------------------------------
CREATE OR REPLACE FUNCTION public.release_expired_groupage_reservations(p_groupage_id uuid DEFAULT NULL)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r record;
  v_count int := 0;
  v_touched uuid[] := '{}';
  g_id uuid;
BEGIN
  FOR r IN
    SELECT gp.id, gp.groupage_id, gp.user_id, gp.order_id, g.code
      FROM public.groupage_participants gp
      JOIN public.groupages g ON g.id = gp.groupage_id
     WHERE gp.status IN ('reserved', 'confirmed')
       AND (p_groupage_id IS NULL OR gp.groupage_id = p_groupage_id)
       AND gp.created_at < now() - make_interval(hours => g.reservation_hours)
       AND g.status IN ('open', 'almost_full', 'full')
       -- jamais pendant un paiement en cours (2 h de marge)
       AND NOT EXISTS (
         SELECT 1 FROM public.payment_attempts pa
          WHERE pa.order_id = gp.order_id AND pa.status = 'pending' AND pa.created_at > now() - interval '2 hours')
       AND NOT EXISTS (SELECT 1 FROM public.orders o WHERE o.id = gp.order_id AND o.payment_status = 'paid')
     FOR UPDATE OF gp SKIP LOCKED
  LOOP
    UPDATE public.groupage_participants
       SET status = 'cancelled', cancelled_reason = 'Délai de paiement dépassé'
     WHERE id = r.id;
    IF r.order_id IS NOT NULL THEN
      UPDATE public.orders SET order_status = 'cancelled', payment_status = 'expired'
       WHERE id = r.order_id AND payment_status <> 'paid';
      INSERT INTO public.order_status_history (order_id, old_status, new_status, location, description)
      VALUES (r.order_id, 'pending_payment', 'cancelled', 'DALUCHE', 'Réservation libérée : délai de paiement dépassé');
    END IF;
    PERFORM public.daluche_notify(r.user_id, 'groupage', 'Réservation expirée',
      'Votre réservation dans le groupage ' || r.code || ' a été libérée faute de paiement. Vous pouvez participer à nouveau s''il reste des places.',
      '/groupages/' || r.groupage_id);
    v_count := v_count + 1;
    IF NOT r.groupage_id = ANY (v_touched) THEN v_touched := v_touched || r.groupage_id; END IF;
  END LOOP;

  FOREACH g_id IN ARRAY v_touched LOOP
    PERFORM public._groupage_recompute(g_id);
  END LOOP;
  RETURN v_count;
END;
$$;
REVOKE ALL ON FUNCTION public.release_expired_groupage_reservations(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.release_expired_groupage_reservations(uuid) TO anon, authenticated, service_role;

-- 6. Participation : libère d'abord les places expirées, compteurs recalculés --
CREATE OR REPLACE FUNCTION public.join_groupage(p_groupage_id uuid, p_quantity integer, p_customer_name text DEFAULT NULL, p_customer_phone text DEFAULT NULL, p_customer_city text DEFAULT NULL, p_hub_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_profile public.profiles%ROWTYPE;
  v_email text;
  g public.groupages%ROWTYPE;
  p public.products%ROWTYPE;
  v_image text;
  v_existing_qty int;
  v_pending int;
  v_total numeric(14,2);
  v_order_id uuid;
  v_participant_id uuid;
  v_tracking text := 'AWP-' || upper(substr(md5(gen_random_uuid()::text), 1, 8));
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'AUTHENTICATION_REQUIRED: connectez-vous pour participer';
  END IF;
  IF p_quantity IS NULL OR p_quantity <= 0 OR p_quantity > 100000 THEN
    RAISE EXCEPTION 'INVALID_QUANTITY: quantité invalide';
  END IF;

  PERFORM public.release_expired_groupage_reservations(p_groupage_id);

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

  SELECT coalesce(sum(quantity), 0),
         count(*) FILTER (WHERE status IN ('reserved', 'confirmed'))
    INTO v_existing_qty, v_pending
    FROM public.groupage_participants
   WHERE groupage_id = g.id AND user_id = v_uid AND status IN ('reserved', 'confirmed', 'paid');

  IF v_pending >= 3 THEN
    RAISE EXCEPTION 'TOO_MANY_PENDING: réglez vos réservations en attente avant d''en ajouter une nouvelle';
  END IF;
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
    coalesce(NULLIF(trim(p_customer_name), ''), NULLIF(v_profile.full_name, ''), 'Client DALUCHE'),
    coalesce(NULLIF(trim(p_customer_phone), ''), NULLIF(v_profile.phone, ''), 'Non renseigné'),
    coalesce(v_email, v_profile.email, ''),
    coalesce(NULLIF(trim(p_customer_city), ''), v_profile.city, 'Dakar'),
    v_total, 0, 0, v_total, 'XOF',
    'geniuspay', 'pending', 'pending_payment', 'hub_pickup', p_hub_id,
    'Participation au groupage ' || g.code, 'groupage'
  ) RETURNING id INTO v_order_id;

  INSERT INTO public.order_items (
    order_id, product_id, groupage_id, product_name_snapshot, sku_snapshot, image_url_snapshot,
    transport_mode_snapshot, quantity, unit_price_xof, subtotal_xof
  ) VALUES (
    v_order_id, g.product_id, g.id, coalesce(p.name, g.title), p.sku, coalesce(g.image_url, v_image),
    g.transport_mode, p_quantity, g.unit_price_xof, v_total
  );

  INSERT INTO public.order_status_history (order_id, old_status, new_status, location, description, actor_id)
  VALUES (v_order_id, NULL, 'pending_payment', 'DALUCHE',
          'Participation au groupage ' || g.code || ' : à régler sous ' || g.reservation_hours || ' h', v_uid);

  INSERT INTO public.groupage_participants (groupage_id, user_id, quantity, unit_price_xof, total_xof, status, order_id)
  VALUES (g.id, v_uid, p_quantity, g.unit_price_xof, v_total, 'reserved', v_order_id)
  RETURNING id INTO v_participant_id;

  PERFORM public._groupage_recompute(g.id);
  SELECT * INTO g FROM public.groupages WHERE id = g.id;

  IF g.status = 'full' THEN
    PERFORM public._groupage_log(g.id, 'system', 'Objectif atteint', 'Toutes les places sont réservées.', true);
  END IF;

  RETURN jsonb_build_object(
    'order_id', v_order_id,
    'tracking_code', v_tracking,
    'participant_id', v_participant_id,
    'total_xof', v_total,
    'groupage_status', g.status,
    'pay_before', now() + make_interval(hours => g.reservation_hours)
  );
END;
$$;

-- 7. Annulation par le client (compteurs recalculés) ---------------------------
CREATE OR REPLACE FUNCTION public.cancel_my_groupage_participation(p_participant_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  gp public.groupage_participants%ROWTYPE;
  g public.groupages%ROWTYPE;
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

  UPDATE public.groupage_participants
     SET status = 'cancelled', cancelled_reason = 'Annulée par le client', cancelled_by = v_uid
   WHERE id = gp.id;
  IF gp.order_id IS NOT NULL THEN
    UPDATE public.orders SET order_status = 'cancelled', payment_status = 'cancelled'
     WHERE id = gp.order_id AND payment_status <> 'paid';
    INSERT INTO public.order_status_history (order_id, old_status, new_status, location, description, actor_id)
    VALUES (gp.order_id, 'pending_payment', 'cancelled', 'DALUCHE', 'Participation annulée par le client', v_uid);
  END IF;
  PERFORM public._groupage_recompute(g.id);
  RETURN jsonb_build_object('success', true);
END;
$$;

-- 8. Cycle de vie strict --------------------------------------------------------
DROP FUNCTION IF EXISTS public.staff_update_groupage_status(uuid, text, text);
CREATE OR REPLACE FUNCTION public.staff_update_groupage_status(p_groupage_id uuid, p_status text, p_note text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  g public.groupages%ROWTYPE;
  r record;
  v_paid int;
  v_note text := NULLIF(trim(coalesce(p_note, '')), '');
  v_labels jsonb := jsonb_build_object(
    'draft', 'Brouillon', 'open', 'Ouvert', 'almost_full', 'Presque complet', 'full', 'Objectif atteint',
    'validated', 'Validé', 'supplier_ordered', 'Commandé à l''usine', 'preparing', 'En préparation',
    'shipped', 'Expédié', 'arrived', 'Arrivé', 'completed', 'Terminé', 'cancelled', 'Annulé');
  v_allowed jsonb := jsonb_build_object(
    'draft', '["open","cancelled"]'::jsonb,
    'open', '["validated","cancelled","draft"]'::jsonb,
    'almost_full', '["validated","cancelled"]'::jsonb,
    'full', '["validated","cancelled"]'::jsonb,
    'validated', '["supplier_ordered","cancelled"]'::jsonb,
    'supplier_ordered', '["preparing","shipped"]'::jsonb,
    'preparing', '["shipped"]'::jsonb,
    'shipped', '["arrived"]'::jsonb,
    'arrived', '["completed"]'::jsonb,
    'completed', '[]'::jsonb,
    'cancelled', '[]'::jsonb);
BEGIN
  IF NOT (public.is_admin() OR public.manages_groupage(p_groupage_id)) THEN
    RAISE EXCEPTION 'PERMISSION_DENIED' USING ERRCODE = '42501';
  END IF;
  IF NOT (v_labels ? p_status) THEN RAISE EXCEPTION 'INVALID_STATUS'; END IF;

  PERFORM public.release_expired_groupage_reservations(p_groupage_id);
  SELECT * INTO g FROM public.groupages WHERE id = p_groupage_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  IF g.status = p_status THEN RETURN jsonb_build_object('success', true, 'unchanged', true); END IF;

  IF NOT ((v_allowed -> g.status) ? p_status) THEN
    RAISE EXCEPTION 'INVALID_TRANSITION: impossible de passer de « % » à « % »', v_labels ->> g.status, v_labels ->> p_status;
  END IF;
  IF p_status = 'cancelled' AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'PERMISSION_DENIED: l''annulation d''un groupage est réservée à l''administration' USING ERRCODE = '42501';
  END IF;
  IF p_status = 'cancelled' AND v_note IS NULL THEN
    RAISE EXCEPTION 'REASON_REQUIRED: indiquez le motif de l''annulation (il est envoyé aux participants)';
  END IF;
  IF p_status = 'draft' AND g.reserved_quantity > 0 THEN
    RAISE EXCEPTION 'INVALID_TRANSITION: un groupage avec des participants ne peut pas repasser en brouillon';
  END IF;
  IF p_status = 'open' AND (g.unit_price_xof IS NULL OR g.unit_price_xof <= 0 OR g.deadline IS NULL OR g.deadline < now()) THEN
    RAISE EXCEPTION 'INCOMPLETE: prix et date limite future requis avant l''ouverture';
  END IF;

  IF p_status = 'validated' THEN
    SELECT coalesce(sum(quantity), 0) INTO v_paid FROM public.groupage_participants
     WHERE groupage_id = g.id AND status = 'paid';
    IF v_paid = 0 THEN
      RAISE EXCEPTION 'NOTHING_PAID: aucune participation payée, le groupage ne peut pas être validé';
    END IF;
    -- Seuls les participants qui ont payé poursuivent
    FOR r IN SELECT id, user_id, order_id FROM public.groupage_participants
              WHERE groupage_id = g.id AND status IN ('reserved', 'confirmed') FOR UPDATE LOOP
      UPDATE public.groupage_participants SET status = 'cancelled', cancelled_reason = 'Non payée à la validation du groupage', cancelled_by = auth.uid() WHERE id = r.id;
      UPDATE public.orders SET order_status = 'cancelled', payment_status = 'cancelled' WHERE id = r.order_id AND payment_status <> 'paid';
      PERFORM public.daluche_notify(r.user_id, 'groupage', 'Groupage ' || g.code,
        'Le groupage a été validé avec les participations payées. Votre réservation non réglée a été annulée.', '/groupages/' || g.id);
    END LOOP;
  END IF;

  IF p_status = 'cancelled' THEN
    FOR r IN SELECT id, user_id, order_id, status FROM public.groupage_participants
              WHERE groupage_id = g.id AND status IN ('reserved', 'confirmed', 'paid') FOR UPDATE LOOP
      UPDATE public.groupage_participants
         SET status = 'cancelled', cancelled_reason = 'Groupage annulé : ' || v_note, cancelled_by = auth.uid(),
             refund_status = CASE WHEN r.status = 'paid' THEN 'pending' ELSE refund_status END
       WHERE id = r.id;
      UPDATE public.orders SET order_status = 'cancelled',
             payment_status = CASE WHEN payment_status = 'paid' THEN payment_status ELSE 'cancelled' END
       WHERE id = r.order_id;
    END LOOP;
  END IF;

  PERFORM set_config('daluche.groupage_system', 'on', true);
  UPDATE public.groupages SET status = p_status, status_note = coalesce(v_note, status_note) WHERE id = g.id;
  PERFORM set_config('daluche.groupage_system', 'off', true);
  IF p_status IN ('validated', 'cancelled', 'open') THEN
    PERFORM public._groupage_recompute(g.id);
  END IF;

  PERFORM public._groupage_log(g.id, 'status', v_labels ->> p_status, v_note, true,
    jsonb_build_object('from', g.status, 'to', p_status));

  FOR r IN SELECT DISTINCT user_id FROM public.groupage_participants
            WHERE groupage_id = g.id AND (status IN ('paid', 'reserved', 'confirmed') OR (p_status = 'cancelled' AND status = 'cancelled' AND cancelled_reason LIKE 'Groupage annulé%')) LOOP
    PERFORM public.daluche_notify(r.user_id, 'groupage', 'Groupage ' || g.code,
      'Nouvelle étape : ' || (v_labels ->> p_status) || coalesce(' — ' || v_note, '')
        || CASE WHEN p_status = 'cancelled' THEN '. Les participations payées seront remboursées.' ELSE '' END,
      '/groupages/' || g.id);
  END LOOP;

  RETURN jsonb_build_object('success', true, 'status', p_status);
END;
$$;
REVOKE ALL ON FUNCTION public.staff_update_groupage_status(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.staff_update_groupage_status(uuid, text, text) TO authenticated;

-- 9. Retirer un participant (gestionnaire ou admin) ----------------------------
CREATE OR REPLACE FUNCTION public.staff_cancel_groupage_participant(p_participant_id uuid, p_reason text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  gp public.groupage_participants%ROWTYPE;
  g public.groupages%ROWTYPE;
  v_reason text := NULLIF(trim(coalesce(p_reason, '')), '');
BEGIN
  SELECT * INTO gp FROM public.groupage_participants WHERE id = p_participant_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  IF NOT (public.is_admin() OR public.manages_groupage(gp.groupage_id)) THEN
    RAISE EXCEPTION 'PERMISSION_DENIED' USING ERRCODE = '42501';
  END IF;
  IF v_reason IS NULL THEN RAISE EXCEPTION 'REASON_REQUIRED: indiquez le motif (il est envoyé au client)'; END IF;
  IF gp.status NOT IN ('reserved', 'confirmed', 'paid') THEN RAISE EXCEPTION 'ALREADY_CANCELLED'; END IF;
  SELECT * INTO g FROM public.groupages WHERE id = gp.groupage_id FOR UPDATE;
  IF g.status IN ('shipped', 'arrived', 'completed') THEN
    RAISE EXCEPTION 'LOCKED: marchandise expédiée, contactez l''administration';
  END IF;

  UPDATE public.groupage_participants
     SET status = 'cancelled', cancelled_reason = v_reason, cancelled_by = auth.uid(),
         refund_status = CASE WHEN gp.status = 'paid' THEN 'pending' ELSE refund_status END
   WHERE id = gp.id;
  UPDATE public.orders SET order_status = 'cancelled',
         payment_status = CASE WHEN payment_status = 'paid' THEN payment_status ELSE 'cancelled' END
   WHERE id = gp.order_id;
  IF gp.order_id IS NOT NULL THEN
    INSERT INTO public.order_status_history (order_id, old_status, new_status, location, description, actor_id)
    VALUES (gp.order_id, NULL, 'cancelled', 'DALUCHE', 'Participation retirée : ' || v_reason, auth.uid());
  END IF;

  PERFORM public._groupage_recompute(g.id);
  PERFORM public._groupage_log(g.id, 'participant', 'Participation retirée', v_reason, false,
    jsonb_build_object('participant_id', gp.id, 'quantity', gp.quantity, 'was_paid', gp.status = 'paid'));
  PERFORM public.daluche_notify(gp.user_id, 'groupage', 'Participation annulée',
    'Votre participation au groupage ' || g.code || ' a été annulée : ' || v_reason
      || CASE WHEN gp.status = 'paid' THEN '. Votre paiement sera remboursé.' ELSE '.' END,
    '/compte/groupages');
  RETURN jsonb_build_object('success', true, 'refund_required', gp.status = 'paid');
END;
$$;
REVOKE ALL ON FUNCTION public.staff_cancel_groupage_participant(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.staff_cancel_groupage_participant(uuid, text) TO authenticated;

-- 10. Remboursement effectué (administration uniquement) ------------------------
CREATE OR REPLACE FUNCTION public.admin_mark_participant_refunded(p_participant_id uuid, p_reference text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  gp public.groupage_participants%ROWTYPE;
  v_ref text := NULLIF(trim(coalesce(p_reference, '')), '');
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'PERMISSION_DENIED' USING ERRCODE = '42501'; END IF;
  IF v_ref IS NULL THEN RAISE EXCEPTION 'REFERENCE_REQUIRED: indiquez la référence du remboursement'; END IF;
  SELECT * INTO gp FROM public.groupage_participants WHERE id = p_participant_id FOR UPDATE;
  IF NOT FOUND OR gp.refund_status <> 'pending' THEN RAISE EXCEPTION 'NOT_REFUNDABLE: aucun remboursement en attente'; END IF;

  UPDATE public.groupage_participants
     SET status = 'refunded', refund_status = 'done', refund_reference = v_ref, refunded_at = now()
   WHERE id = gp.id;
  UPDATE public.orders SET payment_status = 'refunded' WHERE id = gp.order_id;
  UPDATE public.payments SET status = 'refunded', updated_at = now() WHERE order_id = gp.order_id AND status = 'paid';
  PERFORM public._groupage_log(gp.groupage_id, 'refund', 'Remboursement effectué', 'Réf. ' || v_ref, false,
    jsonb_build_object('participant_id', gp.id, 'amount', gp.total_xof));
  PERFORM public.daluche_notify(gp.user_id, 'payment', 'Remboursement effectué',
    'Votre remboursement de ' || to_char(gp.total_xof, 'FM999G999G999') || ' FCFA a été effectué (réf. ' || v_ref || ').',
    '/compte/paiements');
  RETURN jsonb_build_object('success', true);
END;
$$;
REVOKE ALL ON FUNCTION public.admin_mark_participant_refunded(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_mark_participant_refunded(uuid, text) TO authenticated;

-- 11. Actualité du groupage (publique ou note interne) --------------------------
CREATE OR REPLACE FUNCTION public.staff_post_groupage_update(p_groupage_id uuid, p_title text, p_message text, p_public boolean DEFAULT true, p_notify boolean DEFAULT true)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  g public.groupages%ROWTYPE;
  r record;
  v_title text := NULLIF(trim(coalesce(p_title, '')), '');
  v_count int := 0;
BEGIN
  IF NOT (public.is_admin() OR public.manages_groupage(p_groupage_id)) THEN
    RAISE EXCEPTION 'PERMISSION_DENIED' USING ERRCODE = '42501';
  END IF;
  IF v_title IS NULL OR length(v_title) > 140 OR length(coalesce(p_message, '')) > 2000 THEN
    RAISE EXCEPTION 'INVALID_INPUT: titre requis (140 caractères max), message 2000 caractères max';
  END IF;
  SELECT * INTO g FROM public.groupages WHERE id = p_groupage_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;

  PERFORM public._groupage_log(g.id, CASE WHEN p_public THEN 'update' ELSE 'note' END, v_title, p_message, p_public);

  IF p_public AND p_notify THEN
    FOR r IN SELECT DISTINCT user_id FROM public.groupage_participants
              WHERE groupage_id = g.id AND status IN ('reserved', 'confirmed', 'paid') LOOP
      PERFORM public.daluche_notify(r.user_id, 'groupage', g.code || ' · ' || v_title, coalesce(p_message, ''), '/groupages/' || g.id);
      v_count := v_count + 1;
    END LOOP;
  END IF;
  RETURN jsonb_build_object('success', true, 'notified', v_count);
END;
$$;
REVOKE ALL ON FUNCTION public.staff_post_groupage_update(uuid, text, text, boolean, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.staff_post_groupage_update(uuid, text, text, boolean, boolean) TO authenticated;

-- 12. Liste des participants enrichie --------------------------------------------
DROP FUNCTION IF EXISTS public.get_groupage_participants(uuid);
CREATE FUNCTION public.get_groupage_participants(p_groupage_id uuid)
RETURNS TABLE(participant_id uuid, user_id uuid, full_name text, phone text, email text, quantity integer, total_xof numeric,
              status text, order_id uuid, order_code text, payment_status text, order_status text, created_at timestamptz,
              cancelled_reason text, refund_status text, refund_reference text, pay_before timestamptz)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (public.is_admin() OR public.manages_groupage(p_groupage_id)) THEN
    RAISE EXCEPTION 'PERMISSION_DENIED' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
  SELECT gp.id, gp.user_id, coalesce(NULLIF(pr.full_name, ''), o.customer_name)::text,
         coalesce(NULLIF(pr.phone, ''), o.customer_phone)::text, coalesce(pr.email, o.customer_email)::text,
         gp.quantity, gp.total_xof, gp.status::text, gp.order_id, o.tracking_code::text,
         o.payment_status::text, o.order_status::text, gp.created_at,
         gp.cancelled_reason, gp.refund_status, gp.refund_reference,
         CASE WHEN gp.status IN ('reserved', 'confirmed') THEN gp.created_at + make_interval(hours => g.reservation_hours) END
    FROM public.groupage_participants gp
    JOIN public.groupages g ON g.id = gp.groupage_id
    LEFT JOIN public.profiles pr ON pr.id = gp.user_id
    LEFT JOIN public.orders o ON o.id = gp.order_id
   WHERE gp.groupage_id = p_groupage_id
   ORDER BY gp.created_at DESC;
END;
$$;
REVOKE ALL ON FUNCTION public.get_groupage_participants(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_groupage_participants(uuid) TO authenticated;

-- 13. Remise en cohérence des compteurs existants -------------------------------
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT id FROM public.groupages LOOP
    PERFORM public._groupage_recompute(r.id);
  END LOOP;
END $$;
