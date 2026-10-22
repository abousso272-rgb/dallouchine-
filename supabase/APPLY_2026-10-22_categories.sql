-- =============================================================================
-- CATÉGORIES : l'équipe (admin, transitaire, gestionnaire de groupages) crée et modifie les catégories
-- en ajoutant ses produits. La suppression reste réservée à l'administration.
-- Idempotent.
-- =============================================================================
DROP POLICY IF EXISTS daluche_categories_staff_insert ON public.categories;
CREATE POLICY daluche_categories_staff_insert ON public.categories FOR INSERT WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS daluche_categories_staff_update ON public.categories;
CREATE POLICY daluche_categories_staff_update ON public.categories FOR UPDATE USING (public.is_staff()) WITH CHECK (public.is_staff());
