-- =============================================================================
-- Dallou Chine — Paiements multi-fournisseurs, comptabilité et encaissements manuels
-- =============================================================================
--  • payment_ingest(provider, …) : confirmation signée (HMAC, secret dans Vault)
--  • frais / net / mode de frais enregistrés sur chaque paiement ; frais à notre
--    charge enregistrés automatiquement comme coût de la commande (marge exacte)
--  • choix du fournisseur à la création de la tentative de paiement
--  • liens de paiement générés par l'équipe pour une commande de client
--  • encaissement manuel (virement, espèces, chèque…) par l'administration
-- Secret Vault requis par fournisseur : « <provider>_webhook_secret » (ex. saspay_webhook_secret).
-- =============================================================================

-- 1. Comptabilité ---------------------------------------------------------------
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS fee_xof numeric(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS net_xof numeric(14,2),
  ADD COLUMN IF NOT EXISTS charged_xof numeric(14,2),
  ADD COLUMN IF NOT EXISTS fee_charge_mode text,
  ADD COLUMN IF NOT EXISTS provider_tx_reference text,
  ADD COLUMN IF NOT EXISTS network text,
  ADD COLUMN IF NOT EXISTS recorded_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.order_costs DROP CONSTRAINT IF EXISTS order_costs_cost_type_check;
ALTER TABLE public.order_costs ADD CONSTRAINT order_costs_cost_type_check CHECK (
  cost_type::text = ANY (ARRAY['supplier','sourcing','inspection','consolidation','transport','customs','payment_fee','other']::text[])
);

-- 2. Confirmation signée par fournisseur ------------------------------------------
CREATE OR REPLACE FUNCTION public.payment_ingest(p_provider text, p_raw_body text, p_signature text, p_timestamp text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_secret text;
  v_sig text := lower(trim(coalesce(p_signature, '')));
  v_payload jsonb;
  v_tx jsonb;
  v_status text;
  v_amount numeric;
  v_net numeric;
  v_charged numeric;
  v_res jsonb;
  v_order uuid;
  v_cost numeric;
BEGIN
  IF p_provider IS NULL OR p_provider NOT IN ('saspay') THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'UNKNOWN_PROVIDER', 'error_message', 'Fournisseur inconnu.');
  END IF;
  SELECT decrypted_secret INTO v_secret FROM vault.decrypted_secrets WHERE name = p_provider || '_webhook_secret' LIMIT 1;
  IF v_secret IS NULL OR v_secret = '' THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'SECRET_NOT_CONFIGURED', 'error_message', 'Secret non configuré en base.');
  END IF;
  IF v_sig = '' OR p_raw_body IS NULL OR length(p_raw_body) > 100000 OR coalesce(p_timestamp, '') !~ '^\d{9,11}$'
     OR abs(extract(epoch FROM now()) - p_timestamp::bigint) > 300 THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'INVALID_SIGNATURE', 'error_message', 'Signature ou horodatage invalide.');
  END IF;
  IF v_sig <> encode(hmac(convert_to(p_timestamp || '.' || p_raw_body, 'UTF8'), convert_to(v_secret, 'UTF8'), 'sha256'), 'hex') THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'INVALID_SIGNATURE', 'error_message', 'Signature cryptographique invalide.');
  END IF;

  BEGIN
    v_payload := p_raw_body::jsonb;
  EXCEPTION WHEN others THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'BAD_PAYLOAD', 'error_message', 'Payload JSON malformé.');
  END;
  v_tx := v_payload -> 'data' -> 'transaction';
  IF v_tx IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'BAD_PAYLOAD', 'error_message', 'Transaction absente.');
  END IF;

  v_status := lower(coalesce(v_tx ->> 'status', ''));
  IF v_status NOT IN ('paid', 'failed', 'cancelled', 'expired') THEN
    RETURN jsonb_build_object('success', true, 'ignored', true, 'message', 'Statut intermédiaire ignoré.');
  END IF;
  v_amount := nullif(v_tx ->> 'amount', '')::numeric;
  v_net := nullif(v_tx ->> 'net_amount', '')::numeric;
  v_charged := nullif(v_tx ->> 'charged', '')::numeric;

  v_res := public.process_geniuspay_webhook(
    coalesce(v_payload ->> 'id', p_provider || '_' || (v_tx ->> 'id') || '_' || v_status),
    coalesce(v_payload ->> 'event', 'transaction.' || v_status),
    v_tx ->> 'id',
    v_tx ->> 'reference',
    coalesce(v_tx -> 'metadata' ->> 'order_id', ''),
    v_status,
    v_amount,
    coalesce(v_tx ->> 'currency', 'XOF'),
    v_payload,
    true
  );

  IF v_status = 'paid' AND coalesce((v_res ->> 'success')::boolean, false) AND v_res ? 'order_id'
     AND NOT coalesce((v_res ->> 'already_processed')::boolean, false) THEN
    v_order := (v_res ->> 'order_id')::uuid;
    UPDATE public.payments
       SET fee_xof = abs(coalesce(v_charged, v_amount) - coalesce(v_net, v_amount)),
           net_xof = coalesce(v_net, v_amount),
           charged_xof = coalesce(v_charged, v_amount),
           fee_charge_mode = v_tx ->> 'fee_charge_mode',
           provider_tx_reference = v_tx ->> 'tx_reference',
           network = v_tx ->> 'network',
           payment_method = coalesce(nullif(v_tx ->> 'network', ''), payment_method),
           provider = p_provider
     WHERE order_id = v_order AND status = 'paid';
    -- frais à notre charge = montant demandé − net reçu
    v_cost := greatest(coalesce(v_amount, 0) - coalesce(v_net, v_amount), 0);
    IF v_cost > 0 AND NOT EXISTS (SELECT 1 FROM public.order_costs WHERE order_id = v_order AND cost_type = 'payment_fee') THEN
      INSERT INTO public.order_costs (order_id, cost_type, amount_xof, currency, description)
      VALUES (v_order, 'payment_fee', v_cost, 'XOF', 'Frais de passerelle ' || p_provider || ' (' || coalesce(v_tx ->> 'tx_reference', v_tx ->> 'id') || ')');
    END IF;
  END IF;
  RETURN v_res;
END;
$$;
REVOKE ALL ON FUNCTION public.payment_ingest(text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.payment_ingest(text, text, text, text) TO anon, authenticated, service_role;

-- 3. Tentative de paiement : fournisseur au choix -------------------------------------
DROP FUNCTION IF EXISTS public.create_payment_attempt_secure(uuid, text, text);
CREATE OR REPLACE FUNCTION public.create_payment_attempt_secure(p_order_id uuid, p_ip text DEFAULT NULL, p_user_agent text DEFAULT NULL, p_provider text DEFAULT 'geniuspay')
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_recent int;
  v_res jsonb;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'UNAUTHENTICATED', 'error_message', 'Connectez-vous pour payer.');
  END IF;
  IF p_provider NOT IN ('geniuspay', 'saspay') THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'UNKNOWN_PROVIDER', 'error_message', 'Moyen de paiement indisponible.');
  END IF;
  SELECT count(*) INTO v_recent FROM public.payment_attempts WHERE order_id = p_order_id AND created_at > now() - interval '1 hour';
  IF v_recent >= 10 THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'TOO_MANY_ATTEMPTS', 'error_message', 'Trop de tentatives de paiement. Réessayez dans une heure ou contactez-nous.');
  END IF;
  v_res := public.create_payment_attempt(p_order_id, v_uid, p_ip, p_user_agent);
  IF coalesce((v_res ->> 'success')::boolean, false) THEN
    UPDATE public.payments SET provider = p_provider WHERE id = (v_res ->> 'payment_id')::uuid;
    UPDATE public.payment_attempts SET provider = p_provider WHERE id = (v_res ->> 'attempt_id')::uuid;
  END IF;
  RETURN v_res;
END;
$$;
REVOKE ALL ON FUNCTION public.create_payment_attempt_secure(uuid, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_payment_attempt_secure(uuid, text, text, text) TO authenticated, service_role;

-- 4. Lien de paiement créé par l'équipe pour la commande d'un client -------------------
CREATE OR REPLACE FUNCTION public.staff_create_payment_attempt(p_order_id uuid, p_provider text DEFAULT 'saspay', p_ip text DEFAULT NULL, p_user_agent text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner uuid;
  v_res jsonb;
BEGIN
  IF NOT (public.is_admin() OR public.is_transitaire()) THEN
    RAISE EXCEPTION 'PERMISSION_DENIED' USING ERRCODE = '42501';
  END IF;
  IF p_provider NOT IN ('geniuspay', 'saspay') THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'UNKNOWN_PROVIDER', 'error_message', 'Moyen de paiement indisponible.');
  END IF;
  SELECT user_id INTO v_owner FROM public.orders WHERE id = p_order_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'ORDER_NOT_FOUND', 'error_message', 'Commande introuvable.');
  END IF;
  v_res := public.create_payment_attempt(p_order_id, v_owner, p_ip, p_user_agent);
  IF coalesce((v_res ->> 'success')::boolean, false) THEN
    UPDATE public.payments SET provider = p_provider WHERE id = (v_res ->> 'payment_id')::uuid;
    UPDATE public.payment_attempts SET provider = p_provider WHERE id = (v_res ->> 'attempt_id')::uuid;
  END IF;
  RETURN v_res;
END;
$$;
REVOKE ALL ON FUNCTION public.staff_create_payment_attempt(uuid, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.staff_create_payment_attempt(uuid, text, text, text) TO authenticated;

-- 5. L'équipe peut enregistrer l'URL de paiement et consulter l'état -----------------------
CREATE OR REPLACE FUNCTION public.attach_payment_checkout(p_payment_id uuid, p_attempt_id uuid, p_checkout_url text, p_provider_payment_id text, p_provider_reference text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_checkout_url IS NOT NULL AND p_checkout_url !~* '^https://' THEN
    RAISE EXCEPTION 'URL de paiement invalide';
  END IF;
  UPDATE public.payments p
     SET checkout_url = p_checkout_url,
         provider_payment_id = coalesce(p_provider_payment_id, p.provider_payment_id),
         provider_reference = coalesce(p_provider_reference, p.provider_reference),
         updated_at = now()
   WHERE p.id = p_payment_id
     AND p.status = 'pending'
     AND (auth.role() = 'service_role' OR p.user_id = auth.uid() OR public.is_admin() OR public.is_transitaire());
  IF NOT FOUND THEN RETURN false; END IF;
  UPDATE public.payment_attempts a
     SET provider_payment_id = coalesce(p_provider_payment_id, a.provider_payment_id),
         provider_reference = coalesce(p_provider_reference, a.provider_reference),
         updated_at = now()
   WHERE a.id = p_attempt_id AND a.payment_id = p_payment_id AND a.status = 'pending';
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_my_order_payment(p_order_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner uuid;
  v_found boolean;
BEGIN
  SELECT user_id, true INTO v_owner, v_found FROM public.orders WHERE id::text = p_order_id OR tracking_code = p_order_id LIMIT 1;
  IF v_found IS NOT TRUE THEN
    RETURN jsonb_build_object('found', false);
  END IF;
  IF auth.role() <> 'service_role' AND v_owner IS DISTINCT FROM auth.uid() AND NOT (public.is_admin() OR public.is_transitaire()) THEN
    RETURN jsonb_build_object('found', false);
  END IF;
  RETURN public.get_order_payment_details(p_order_id);
END;
$$;

-- 6. Encaissement manuel (virement, espèces, chèque…) — administration uniquement -------------
CREATE OR REPLACE FUNCTION public.staff_record_manual_payment(p_order_id uuid, p_method text, p_reference text, p_note text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  o public.orders%ROWTYPE;
  v_ref text := NULLIF(trim(coalesce(p_reference, '')), '');
  v_pay uuid;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'PERMISSION_DENIED' USING ERRCODE = '42501'; END IF;
  IF p_method NOT IN ('bank_transfer', 'cash', 'cheque', 'mobile_money_manual') THEN RAISE EXCEPTION 'INVALID_METHOD'; END IF;
  IF v_ref IS NULL OR length(v_ref) < 3 THEN RAISE EXCEPTION 'REFERENCE_REQUIRED: indiquez la référence du virement, du reçu ou du chèque'; END IF;

  SELECT * INTO o FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'NOT_FOUND: commande introuvable'; END IF;
  IF o.payment_status = 'paid' THEN RAISE EXCEPTION 'ALREADY_PAID: cette commande est déjà réglée'; END IF;
  IF o.order_status = 'cancelled' THEN RAISE EXCEPTION 'ORDER_CANCELLED: commande annulée'; END IF;

  SELECT id INTO v_pay FROM public.payments WHERE order_id = o.id ORDER BY created_at DESC LIMIT 1;
  IF v_pay IS NULL THEN
    INSERT INTO public.payments (order_id, user_id, provider, provider_reference, amount_xof, currency, status, payment_method,
                                 customer_name, customer_email, customer_phone, paid_at, net_xof, charged_xof, recorded_by, metadata)
    VALUES (o.id, o.user_id, 'manual', v_ref, o.total_xof, 'XOF', 'paid', p_method,
            o.customer_name, o.customer_email, o.customer_phone, now(), o.total_xof, o.total_xof, auth.uid(),
            jsonb_build_object('note', p_note, 'order_code', o.tracking_code))
    RETURNING id INTO v_pay;
  ELSE
    UPDATE public.payments
       SET provider = 'manual', provider_reference = v_ref, amount_xof = o.total_xof, status = 'paid', payment_method = p_method,
           paid_at = now(), net_xof = o.total_xof, charged_xof = o.total_xof, recorded_by = auth.uid(), checkout_url = NULL,
           metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object('note', p_note, 'manual', true), updated_at = now()
     WHERE id = v_pay;
  END IF;
  UPDATE public.payment_attempts SET status = 'cancelled', updated_at = now() WHERE order_id = o.id AND status = 'pending';

  UPDATE public.orders
     SET payment_status = 'paid',
         order_status = CASE WHEN order_status = 'pending_payment' THEN 'paid' ELSE order_status END,
         paid_at = now(), updated_at = now()
   WHERE id = o.id;
  INSERT INTO public.order_status_history (order_id, old_status, new_status, location, description, actor_id)
  VALUES (o.id, o.order_status, 'paid', 'DALLOU CHINE', 'Paiement enregistré (' || p_method || ', réf. ' || v_ref || ')', auth.uid());
  RETURN jsonb_build_object('success', true, 'payment_id', v_pay);
END;
$$;
REVOKE ALL ON FUNCTION public.staff_record_manual_payment(uuid, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.staff_record_manual_payment(uuid, text, text, text) TO authenticated;

-- 7. Journal des paiements pour l'administration (lecture directe, RLS déjà en place) -------
CREATE INDEX IF NOT EXISTS idx_payments_order ON public.payments (order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status_paid_at ON public.payments (status, paid_at DESC);
