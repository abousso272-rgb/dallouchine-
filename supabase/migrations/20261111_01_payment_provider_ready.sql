-- =============================================================================
-- DALLOU CHINE — VÉRIFICATION DE PRÉPARATION DU PAIEMENT (VAULT)
-- =============================================================================
-- Appelé par PaymentService.readiness() pour s'assurer que le secret côté serveur
-- est identique à celui stocké dans Supabase Vault sans jamais divulguer le secret.
--
-- Retourne :
--   'ok'       : Secret présent dans Vault et signature HMAC vérifiée avec succès
--   'missing'  : Secret non configuré dans Vault (vault.decrypted_secrets)
--   'mismatch' : Secret présent mais différent de celui du serveur
--   'error'    : Paramètres invalides ou fournisseur non pris en charge
-- =============================================================================

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
  IF p_provider IS NULL OR p_provider NOT IN ('saspay') THEN
    RETURN 'error';
  END IF;

  IF p_probe IS NULL OR p_probe = '' OR p_signature IS NULL OR p_signature = '' THEN
    RETURN 'error';
  END IF;

  -- Récupère le secret Vault correspondant au fournisseur actif
  SELECT decrypted_secret INTO v_secret
  FROM vault.decrypted_secrets
  WHERE name = p_provider || '_webhook_secret'
  LIMIT 1;

  IF v_secret IS NULL OR v_secret = '' THEN
    RETURN 'missing';
  END IF;

  -- Calcule la signature HMAC attendue avec le secret en base
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

-- Restreint l'exécution au seul rôle de service (backend sécurisé)
REVOKE ALL ON FUNCTION public.payment_provider_ready(text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.payment_provider_ready(text, text, text) TO service_role;

