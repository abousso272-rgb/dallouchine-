-- =============================================================================
-- DALLOU CHINE — INTÉGRATION PASSERELLE PAYTECH SÉNÉGAL
-- =============================================================================
-- Active PayTech dans toutes les fonctions de paiement Supabase :
--   1. payment_ingest : confirmation signée des IPN PayTech (Wave, OM, Free)
--   2. payment_provider_ready : test de préparation du secret Vault
--   3. create_payment_attempt_secure : autorisation client pour PayTech
--   4. staff_create_payment_attempt : autorisation équipe pour liens PayTech
-- =============================================================================

-- 1. Confirmation signée par fournisseur (payment_ingest) -------------------------
CREATE OR REPLACE FUNCTION public.payment_ingest(
  p_provider text,
  p_raw_body text,
  p_signature text,
  p_timestamp text
)
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
  IF p_provider IS NULL OR p_provider NOT IN ('saspay', 'paytech') THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'UNKNOWN_PROVIDER', 'error_message', 'Fournisseur inconnu.');
  END IF;

  -- Secret Vault par fournisseur : <provider>_webhook_secret (ou <provider>_api_secret)
  SELECT decrypted_secret INTO v_secret 
  FROM vault.decrypted_secrets 
  WHERE name = p_provider || '_webhook_secret' OR name = p_provider || '_api_secret'
  LIMIT 1;

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

-- 2. Test de préparation Vault (payment_provider_ready) ---------------------------
CREATE OR REPLACE FUNCTION public.payment_provider_ready(
  p_provider text,
  p_probe text,
  p_signature text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_secret text;
  v_expected text;
BEGIN
  IF p_provider IS NULL OR p_provider NOT IN ('saspay', 'paytech') THEN
    RETURN 'error';
  END IF;

  IF p_probe IS NULL OR p_probe = '' OR p_signature IS NULL OR p_signature = '' THEN
    RETURN 'error';
  END IF;

  SELECT decrypted_secret INTO v_secret
  FROM vault.decrypted_secrets
  WHERE name = p_provider || '_webhook_secret' OR name = p_provider || '_api_secret'
  LIMIT 1;

  IF v_secret IS NULL OR v_secret = '' THEN
    RETURN 'missing';
  END IF;

  v_expected := encode(hmac(convert_to(p_probe, 'UTF8'), convert_to(v_secret, 'UTF8'), 'sha256'), 'hex');

  IF lower(trim(p_signature)) = lower(v_expected) THEN
    RETURN 'ok';
  ELSE
    RETURN 'mismatch';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RETURN 'error';
END;
$$;
REVOKE ALL ON FUNCTION public.payment_provider_ready(text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.payment_provider_ready(text, text, text) TO service_role;

-- 3. Autorisation PayTech côté client (create_payment_attempt_secure) ------------
CREATE OR REPLACE FUNCTION public.create_payment_attempt_secure(
  p_order_id uuid,
  p_ip text DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_provider text DEFAULT 'paytech'
)
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
  IF p_provider NOT IN ('geniuspay', 'saspay', 'paytech') THEN
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

-- 4. Lien de paiement équipe (staff_create_payment_attempt) ----------------------
CREATE OR REPLACE FUNCTION public.staff_create_payment_attempt(
  p_order_id uuid,
  p_provider text DEFAULT 'paytech',
  p_ip text DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
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
  IF p_provider NOT IN ('geniuspay', 'saspay', 'paytech') THEN
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

