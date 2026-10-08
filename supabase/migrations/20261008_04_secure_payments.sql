-- =============================================================================
-- DALUCHE — Sécurisation des paiements (sans dépendre de la clé service_role)
-- =============================================================================
-- Problème corrigé : process_geniuspay_webhook faisait confiance au paramètre
-- p_signature_verified et était exécutable par anon → n'importe qui pouvait
-- marquer une commande « payée ». Désormais :
--   • la base vérifie elle-même la signature HMAC-SHA256 (secret dans Vault) ;
--   • process_geniuspay_webhook n'est plus appelable que par service_role
--     ou depuis geniuspay_ingest (vérification faite) ;
--   • create_payment_attempt / get_order_payment_details imposent l'identité
--     de l'appelant (auth.uid()) au lieu de la recevoir en paramètre ;
--   • attach_payment_checkout : seul champ modifiable par le client = l'URL
--     de paiement de SA tentative en attente.
-- Étape 1/2 : ajoute les points d'entrée sûrs (sans rien casser).
-- Étape 2/2 : 20261008_05_lock_legacy_payment_rpcs.sql, APRÈS déploiement du nouveau serveur.
-- Prérequis : secret Vault « geniuspay_webhook_secret » = GENIUSPAY_WEBHOOK_SECRET.
--   select vault.create_secret('<whsec_…>', 'geniuspay_webhook_secret');
--   (rotation : select vault.update_secret(id, '<nouveau>') from vault.secrets where name='geniuspay_webhook_secret';)
-- =============================================================================

-- 1. Lecture du secret (jamais exposée à l'API)
CREATE OR REPLACE FUNCTION public._geniuspay_webhook_secret()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'geniuspay_webhook_secret' LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public._geniuspay_webhook_secret() FROM PUBLIC, anon, authenticated;

-- 2. Point d'entrée signé : vérifie la signature puis traite l'événement
CREATE OR REPLACE FUNCTION public.geniuspay_ingest(
  p_raw_body text,
  p_signature text,
  p_timestamp text DEFAULT NULL,
  p_event_header text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_secret text := public._geniuspay_webhook_secret();
  v_sig text := lower(trim(coalesce(p_signature, '')));
  v_direct text;
  v_stamped text;
  v_payload jsonb;
  v_tx jsonb;
  v_event text;
  v_raw_status text;
  v_status text;
  v_amount numeric;
  v_meta jsonb;
  v_tx_id text;
  v_event_id text;
BEGIN
  IF v_secret IS NULL OR v_secret = '' THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'SECRET_NOT_CONFIGURED', 'error_message', 'Secret webhook non configuré en base.');
  END IF;
  IF v_sig = '' OR p_raw_body IS NULL OR length(p_raw_body) > 200000 THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'INVALID_SIGNATURE', 'error_message', 'Signature manquante.');
  END IF;

  -- Anti-rejeu : 5 minutes si horodatage fourni
  IF p_timestamp IS NOT NULL AND p_timestamp <> '' THEN
    IF p_timestamp !~ '^\d{9,11}$' OR abs(extract(epoch FROM now()) - p_timestamp::bigint) > 300 THEN
      RETURN jsonb_build_object('success', false, 'error_code', 'INVALID_SIGNATURE', 'error_message', 'Horodatage expiré.');
    END IF;
  END IF;

  v_direct := encode(hmac(convert_to(p_raw_body, 'UTF8'), convert_to(v_secret, 'UTF8'), 'sha256'), 'hex');
  v_stamped := CASE WHEN coalesce(p_timestamp, '') <> ''
    THEN encode(hmac(convert_to(p_timestamp || '.' || p_raw_body, 'UTF8'), convert_to(v_secret, 'UTF8'), 'sha256'), 'hex') END;
  IF v_sig <> v_direct AND (v_stamped IS NULL OR v_sig <> v_stamped) THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'INVALID_SIGNATURE', 'error_message', 'Signature cryptographique invalide.');
  END IF;

  BEGIN
    v_payload := p_raw_body::jsonb;
  EXCEPTION WHEN others THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'BAD_PAYLOAD', 'error_message', 'Payload JSON malformé.');
  END;

  v_event := lower(coalesce(v_payload->>'event', p_event_header, v_payload->>'type', 'payment.success'));
  v_tx := coalesce(v_payload->'data'->'transaction', v_payload->'data', v_payload);
  v_raw_status := lower(coalesce(v_tx->>'status', v_tx->>'payment_status', ''));
  v_status := CASE
    WHEN v_raw_status IN ('completed', 'paid', 'success', 'successful') THEN 'paid'
    WHEN v_raw_status IN ('failed', 'declined', 'rejected') THEN 'failed'
    WHEN v_raw_status IN ('cancelled', 'canceled') THEN 'cancelled'
    WHEN v_raw_status = 'expired' THEN 'expired'
    WHEN v_raw_status IN ('refunded', 'partially_refunded') THEN 'refunded'
    WHEN v_raw_status <> '' THEN 'pending'
    WHEN v_event IN ('payment.success', 'payment_success', 'payment_intent.confirmed', 'payment.completed') THEN 'paid'
    WHEN v_event IN ('payment.failed', 'payment_failed', 'payment.declined') THEN 'failed'
    WHEN v_event IN ('payment.cancelled', 'payment_cancelled') THEN 'cancelled'
    WHEN v_event IN ('payment.expired', 'payment_expired') THEN 'expired'
    WHEN v_event IN ('payment.refunded') THEN 'refunded'
    ELSE 'pending'
  END;
  IF v_status = 'pending' THEN
    RETURN jsonb_build_object('success', true, 'ignored', true, 'message', 'Statut intermédiaire ignoré.');
  END IF;

  v_amount := nullif(coalesce(v_tx->>'amount', v_tx->>'total_amount'), '')::numeric;
  v_meta := coalesce(v_tx->'metadata', v_payload->'metadata', '{}'::jsonb);
  v_tx_id := coalesce(v_tx->>'id', v_tx->>'transaction_id', v_tx->>'payment_id');
  v_event_id := coalesce(v_payload->>'id', v_payload->>'event_id', 'evt_' || coalesce(v_tx_id, '') || '_' || v_status);

  RETURN public.process_geniuspay_webhook(
    v_event_id,
    v_event,
    v_tx_id,
    coalesce(v_tx->>'reference', v_tx->>'merchant_reference', v_tx->>'provider_reference', v_meta->>'merchant_reference'),
    coalesce(v_meta->>'order_id', v_tx->>'order_id', v_payload->>'order_id'),
    v_status,
    v_amount,
    coalesce(v_tx->>'currency', 'XOF'),
    v_payload,
    true
  );
END;
$$;
REVOKE ALL ON FUNCTION public.geniuspay_ingest(text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.geniuspay_ingest(text, text, text, text) TO anon, authenticated, service_role;

-- 3. Création de tentative : l'identité vient du jeton, pas d'un paramètre
CREATE OR REPLACE FUNCTION public.create_payment_attempt_secure(p_order_id uuid, p_ip text DEFAULT NULL, p_user_agent text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_recent int;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'UNAUTHENTICATED', 'error_message', 'Connectez-vous pour payer.');
  END IF;
  -- Limite anti-abus : 10 tentatives par commande et par heure
  SELECT count(*) INTO v_recent FROM public.payment_attempts WHERE order_id = p_order_id AND created_at > now() - interval '1 hour';
  IF v_recent >= 10 THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'TOO_MANY_ATTEMPTS', 'error_message', 'Trop de tentatives de paiement. Réessayez dans une heure ou contactez-nous.');
  END IF;
  RETURN public.create_payment_attempt(p_order_id, v_uid, p_ip, p_user_agent);
END;
$$;
REVOKE ALL ON FUNCTION public.create_payment_attempt_secure(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_payment_attempt_secure(uuid, text, text) TO authenticated, service_role;

-- 4. Enregistrement de l'URL de paiement par le propriétaire (aucun autre champ)
CREATE OR REPLACE FUNCTION public.attach_payment_checkout(
  p_payment_id uuid,
  p_attempt_id uuid,
  p_checkout_url text,
  p_provider_payment_id text,
  p_provider_reference text
)
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
     AND (auth.role() = 'service_role' OR p.user_id = auth.uid());
  IF NOT FOUND THEN RETURN false; END IF;
  UPDATE public.payment_attempts a
     SET provider_payment_id = coalesce(p_provider_payment_id, a.provider_payment_id),
         provider_reference = coalesce(p_provider_reference, a.provider_reference),
         updated_at = now()
   WHERE a.id = p_attempt_id AND a.payment_id = p_payment_id AND a.status = 'pending';
  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.attach_payment_checkout(uuid, uuid, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.attach_payment_checkout(uuid, uuid, text, text, text) TO authenticated, service_role;

-- 5. Détails de paiement : propriétaire ou équipe uniquement
CREATE OR REPLACE FUNCTION public.get_my_order_payment(p_order_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner uuid;
BEGIN
  SELECT user_id INTO v_owner FROM public.orders WHERE id::text = p_order_id OR tracking_code = p_order_id LIMIT 1;
  IF v_owner IS NULL THEN
    RETURN jsonb_build_object('found', false);
  END IF;
  IF auth.role() <> 'service_role' AND v_owner IS DISTINCT FROM auth.uid() AND NOT public.is_admin() THEN
    RETURN jsonb_build_object('found', false);
  END IF;
  RETURN public.get_order_payment_details(p_order_id);
END;
$$;
REVOKE ALL ON FUNCTION public.get_my_order_payment(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_order_payment(text) TO authenticated, service_role;

-- 6. Fonctions de déclenchement : jamais appelables directement
REVOKE ALL ON FUNCTION public.daluche_on_order_paid() FROM PUBLIC, anon, authenticated;
