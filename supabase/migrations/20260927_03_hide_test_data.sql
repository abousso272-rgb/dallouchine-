-- =============================================================================
-- DALUCHE — MASQUAGE DES DONNÉES DE TEST (non destructif)
--
-- Les anciennes suites de tests automatisées ont laissé en production des
-- produits et groupages fictifs visibles publiquement. Cette migration les
-- masque sans rien supprimer (réversible depuis l'espace administrateur).
-- =============================================================================

BEGIN;

-- Produits de test : dépubliés
UPDATE public.products
SET is_active = false, is_featured = false
WHERE name IN ('Produit Snapshot Test', 'Produit Concurrence Stock')
   OR name ILIKE '%test%' AND name ILIKE 'produit%';

-- Groupages de test : repassés en brouillon (invisibles pour le public)
UPDATE public.groupages
SET status = 'draft', status_note = COALESCE(status_note, 'Masqué : donnée de test')
WHERE code ~ '^GRP-(CLO|FULL|EXP|RACE|100|T4)-[0-9]+$'
   OR title ILIKE '%test%';

COMMIT;
