-- =============================================================================
-- DALUCHE — DURCISSEMENT DES FONCTIONS DE PAIEMENT
--
-- ⚠️  À appliquer UNIQUEMENT après avoir ajouté SUPABASE_SERVICE_ROLE_KEY aux
--     variables d'environnement du serveur (Vercel) et redéployé.
--
-- Avant cette migration, les fonctions ci-dessous sont exécutables avec la clé
-- publique (anon) : n'importe qui peut appeler process_geniuspay_webhook avec
-- p_signature_verified = true et marquer une commande comme payée, ou lire les
-- détails de paiement d'une commande. Après cette migration, seul le serveur
-- (service_role) peut les appeler ; il vérifie lui-même la signature HMAC du
-- webhook GeniusPay et l'identité du client.
-- =============================================================================

BEGIN;

DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN ('process_geniuspay_webhook', 'get_order_payment_details', 'create_payment_attempt')
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated', r.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', r.sig);
  END LOOP;
END $$;

COMMIT;

NOTIFY pgrst, 'reload schema';
