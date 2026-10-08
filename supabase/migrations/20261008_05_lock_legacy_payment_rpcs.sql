-- =============================================================================
-- DALUCHE — Étape 2/2 : fermeture des anciennes fonctions de paiement
-- À appliquer APRÈS le déploiement du serveur qui utilise geniuspay_ingest,
-- create_payment_attempt_secure, attach_payment_checkout et get_my_order_payment.
-- Remplace 20260927_02_harden_payment_rpcs.sql (qui exigeait la clé service_role).
-- =============================================================================
-- 3. Le traitement brut n'est plus accessible depuis l'API publique
REVOKE ALL ON FUNCTION public.process_geniuspay_webhook(text, text, text, text, text, text, numeric, text, jsonb, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.process_geniuspay_webhook(text, text, text, text, text, text, numeric, text, jsonb, boolean) TO service_role;

REVOKE ALL ON FUNCTION public.create_payment_attempt(uuid, uuid, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_payment_attempt(uuid, uuid, text, text) TO service_role;

REVOKE ALL ON FUNCTION public.get_order_payment_details(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_order_payment_details(text) TO service_role;

