-- =============================================================================
-- AUTONOMIE DE L'ÉQUIPE : tableur produits et coûts
-- -----------------------------------------------------------------------------
-- * product_costs.list_price_cny : prix affiché par le fournisseur (mesure le gain de négociation)
-- * staff_cost_sheet()           : produits + coûts pour le tableur (admin, transitaire ; gestionnaire : ses produits)
-- * staff_import_products(rows)  : crée / met à jour des produits et leurs coûts en une fois, ligne par ligne
-- Règles : un produit créé est TOUJOURS un brouillon. Publier ou changer le prix d'un produit en ligne
-- exige les permissions publish_products / set_margins (l'admin les accorde, ou non).
-- Idempotent.
-- =============================================================================

ALTER TABLE public.product_costs ADD COLUMN IF NOT EXISTS list_price_cny numeric(14, 2);
-- Cargo par unité saisi à la main (tarif transporteur connu) ; NULL = estimé avec la grille de fret
ALTER TABLE public.product_costs ADD COLUMN IF NOT EXISTS cargo_unit_xof numeric(14, 2);
-- Auteur du produit (products.sourcer_id pointe vers la table des sourceurs, pas vers les comptes)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS created_by uuid;

-- Qui a le droit d'utiliser le tableur
CREATE OR REPLACE FUNCTION public._can_manage_products()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_admin() OR public.is_transitaire() OR (public.is_groupage_manager() AND public.has_permission('manage_products'));
$$;
REVOKE ALL ON FUNCTION public._can_manage_products() FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------- Lecture
CREATE OR REPLACE FUNCTION public.staff_cost_sheet()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_rows jsonb; v_all boolean;
BEGIN
  IF NOT public._can_manage_products() THEN RAISE EXCEPTION 'PERMISSION_DENIED' USING ERRCODE = '42501'; END IF;
  v_all := public.is_admin() OR public.is_transitaire();
  SELECT COALESCE(jsonb_agg(x ORDER BY x.name), '[]'::jsonb) INTO v_rows
  FROM (
    SELECT p.id AS product_id, p.name, p.sku, p.slug, c.name AS category, p.price_xof, p.moq, p.weight_kg, p.cbm,
           p.default_transport_mode AS transport_mode, p.estimated_delivery_days AS delivery_days, p.stock_quantity AS stock,
           p.is_active, pc.supplier_name, pc.supplier_url, pc.list_price_cny, pc.purchase_price_cny, pc.purchase_price_xof,
           pc.logistics_cost_xof, pc.cargo_unit_xof, pc.notes
    FROM public.products p
    LEFT JOIN public.categories c ON c.id = p.category_id
    LEFT JOIN public.product_costs pc ON pc.product_id = p.id
    WHERE v_all OR p.created_by = auth.uid()
    ORDER BY p.name
    LIMIT 1000
  ) x;
  RETURN v_rows;
END;
$$;

-- ---------------------------------------------------------------- Import / enregistrement en lot
CREATE OR REPLACE FUNCTION public.staff_import_products(p_rows jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r jsonb; v_out jsonb := '[]'::jsonb;
  v_privileged boolean; v_can_price boolean;
  v_cat uuid; v_existing record; v_pid uuid; v_status text; v_msg text; v_slug text; v_base text; v_n integer;
  v_name text; v_price numeric;
BEGIN
  IF NOT public._can_manage_products() THEN RAISE EXCEPTION 'PERMISSION_DENIED' USING ERRCODE = '42501'; END IF;
  IF p_rows IS NULL OR jsonb_typeof(p_rows) <> 'array' THEN RAISE EXCEPTION 'INVALID_INPUT: tableau attendu' USING ERRCODE = '22023'; END IF;
  IF jsonb_array_length(p_rows) > 500 THEN RAISE EXCEPTION 'INVALID_INPUT: 500 lignes maximum par enregistrement' USING ERRCODE = '22023'; END IF;
  v_privileged := public.is_admin() OR public.is_transitaire();
  v_can_price := public.has_permission('set_margins');

  FOR r IN SELECT * FROM jsonb_array_elements(p_rows) LOOP
    v_status := 'error'; v_msg := NULL; v_pid := NULL;
    BEGIN
      v_name := trim(COALESCE(r ->> 'name', ''));
      v_price := NULLIF(r ->> 'price_xof', '')::numeric;
      IF length(v_name) < 2 THEN RAISE EXCEPTION 'Nom du produit manquant'; END IF;
      IF v_price IS NULL OR v_price <= 0 THEN RAISE EXCEPTION 'Prix de vente manquant ou invalide'; END IF;

      SELECT id INTO v_cat FROM public.categories
      WHERE lower(name) = lower(trim(COALESCE(r ->> 'category', ''))) OR lower(slug) = lower(trim(COALESCE(r ->> 'category', '')))
      LIMIT 1;
      IF v_cat IS NULL THEN RAISE EXCEPTION 'Catégorie « % » inconnue', COALESCE(r ->> 'category', ''); END IF;

      -- Produit existant : identifiant, sinon référence (sku), sinon adresse (slug)
      v_existing := NULL;
      IF NULLIF(r ->> 'product_id', '') IS NOT NULL THEN
        SELECT * INTO v_existing FROM public.products WHERE id = (r ->> 'product_id')::uuid;
      END IF;
      IF v_existing.id IS NULL AND NULLIF(trim(COALESCE(r ->> 'sku', '')), '') IS NOT NULL THEN
        SELECT * INTO v_existing FROM public.products WHERE lower(sku) = lower(trim(r ->> 'sku')) LIMIT 1;
      END IF;
      IF v_existing.id IS NULL AND NULLIF(r ->> 'slug', '') IS NOT NULL THEN
        SELECT * INTO v_existing FROM public.products WHERE slug = r ->> 'slug' LIMIT 1;
      END IF;

      IF v_existing.id IS NOT NULL THEN
        IF NOT v_privileged AND v_existing.created_by IS DISTINCT FROM auth.uid() THEN
          RAISE EXCEPTION 'Ce produit appartient à un autre membre de l''équipe';
        END IF;
        v_pid := v_existing.id;
        UPDATE public.products SET
          name = v_name,
          sku = NULLIF(trim(COALESCE(r ->> 'sku', '')), ''),
          category_id = v_cat,
          moq = GREATEST(1, COALESCE(NULLIF(r ->> 'moq', '')::integer, 1)),
          weight_kg = GREATEST(0, COALESCE(NULLIF(r ->> 'weight_kg', '')::numeric, 0)),
          cbm = GREATEST(0, COALESCE(NULLIF(r ->> 'cbm', '')::numeric, 0)),
          default_transport_mode = CASE WHEN r ->> 'transport_mode' IN ('air', 'sea', 'express') THEN r ->> 'transport_mode' ELSE default_transport_mode END,
          estimated_delivery_days = COALESCE(NULLIF(r ->> 'delivery_days', ''), estimated_delivery_days),
          stock_quantity = GREATEST(0, COALESCE(NULLIF(r ->> 'stock', '')::integer, stock_quantity)),
          price_xof = CASE WHEN v_existing.is_active AND NOT v_can_price THEN price_xof ELSE round(v_price) END,
          updated_at = now()
        WHERE id = v_pid;
        v_status := 'updated';
        IF v_existing.is_active AND NOT v_can_price AND round(v_price) <> v_existing.price_xof THEN
          v_msg := 'Prix de vente en ligne inchangé : la permission « fixer les prix publics » est requise.';
        END IF;
      ELSE
        v_base := COALESCE(NULLIF(regexp_replace(lower(COALESCE(r ->> 'slug', v_name)), '[^a-z0-9]+', '-', 'g'), ''), 'produit');
        v_base := trim(both '-' from v_base);
        v_slug := v_base; v_n := 1;
        WHILE EXISTS (SELECT 1 FROM public.products WHERE slug = v_slug) LOOP
          v_n := v_n + 1; v_slug := v_base || '-' || v_n;
        END LOOP;
        INSERT INTO public.products (name, slug, sku, category_id, short_description, description, price_xof, moq, stock_quantity,
                                     weight_kg, cbm, default_transport_mode, estimated_delivery_days, features, specifications,
                                     is_active, is_featured, is_auto_mobility, created_by)
        VALUES (v_name, v_slug, NULLIF(trim(COALESCE(r ->> 'sku', '')), ''), v_cat, v_name, '', round(v_price),
                GREATEST(1, COALESCE(NULLIF(r ->> 'moq', '')::integer, 1)),
                GREATEST(0, COALESCE(NULLIF(r ->> 'stock', '')::integer, 0)),
                GREATEST(0, COALESCE(NULLIF(r ->> 'weight_kg', '')::numeric, 0)),
                GREATEST(0, COALESCE(NULLIF(r ->> 'cbm', '')::numeric, 0)),
                CASE WHEN r ->> 'transport_mode' IN ('air', 'sea', 'express') THEN r ->> 'transport_mode' ELSE 'air' END,
                NULLIF(r ->> 'delivery_days', ''), '{}'::text[], '{}'::jsonb,
                false, false, false, auth.uid())
        RETURNING id INTO v_pid;
        v_status := 'created';
        v_msg := 'Créé en brouillon : à publier depuis la liste des produits.';
      END IF;

      INSERT INTO public.product_costs (product_id, purchase_price_cny, purchase_price_xof, logistics_cost_xof, cargo_unit_xof, supplier_name, supplier_url, list_price_cny, notes, updated_by, updated_at)
      VALUES (v_pid,
              NULLIF(r ->> 'purchase_price_cny', '')::numeric,
              GREATEST(0, round(COALESCE(NULLIF(r ->> 'purchase_price_xof', '')::numeric, 0))),
              GREATEST(0, round(COALESCE(NULLIF(r ->> 'logistics_cost_xof', '')::numeric, 0))),
              NULLIF(r ->> 'cargo_unit_xof', '')::numeric,
              NULLIF(r ->> 'supplier_name', ''), NULLIF(r ->> 'supplier_url', ''),
              NULLIF(r ->> 'list_price_cny', '')::numeric, NULLIF(r ->> 'notes', ''), auth.uid(), now())
      ON CONFLICT (product_id) DO UPDATE SET
        purchase_price_cny = EXCLUDED.purchase_price_cny, purchase_price_xof = EXCLUDED.purchase_price_xof,
        logistics_cost_xof = EXCLUDED.logistics_cost_xof, cargo_unit_xof = EXCLUDED.cargo_unit_xof, supplier_name = EXCLUDED.supplier_name,
        supplier_url = EXCLUDED.supplier_url, list_price_cny = EXCLUDED.list_price_cny, notes = EXCLUDED.notes,
        updated_by = auth.uid(), updated_at = now();
    EXCEPTION WHEN OTHERS THEN
      v_status := 'error'; v_msg := SQLERRM; v_pid := NULL;
    END;
    v_out := v_out || jsonb_build_array(jsonb_build_object('rid', r ->> 'rid', 'status', v_status, 'product_id', v_pid, 'message', v_msg));
  END LOOP;
  RETURN jsonb_build_object('results', v_out);
END;
$$;

DO $$
DECLARE s text;
BEGIN
  FOREACH s IN ARRAY ARRAY['public.staff_cost_sheet()', 'public.staff_import_products(jsonb)'] LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon', s);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated, service_role', s);
  END LOOP;
END $$;
