-- ==============================================================================
-- DALLOU CHINE - SEED DATA POUR ENVIRONNEMENT DE DÉVELOPPEMENT & TEST
-- Ne pas exécuter en production. Fixtures de test uniquement.
-- UUIDs valides (caractères hexadécimaux 0-9 et a-f uniquement)
-- ==============================================================================

-- 1. PARAMÈTRES DE LA PLATEFORME
INSERT INTO public.platform_settings (key, value, description)
VALUES 
    ('default_currency', '"XOF"'::jsonb, 'Devise par défaut de facturation et affichage'),
    ('exchange_rates', '{"cny_to_xof": 88.5, "usd_to_xof": 615.0}'::jsonb, 'Taux de conversion officiels plateforme'),
    ('freight_rates', '{"air_per_kg_xof": 7500, "sea_per_cbm_xof": 185000, "express_per_kg_xof": 12500}'::jsonb, 'Grille tarifaire par défaut fret Chine-Dakar'),
    ('fees_structure', '{"sourcing_fee_percent": 4.5, "inspection_fixed_xof": 15000, "consolidation_cbm_xof": 12000, "customs_percent": 6.0, "customs_fixed_xof": 25000, "buffer_percent": 5.0, "default_margin_percent": 35.0}'::jsonb, 'Structure de coûts et commissions internes')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 2. CATÉGORIES PRINCIPALES
INSERT INTO public.categories (id, name, slug, description, sort_order, is_active)
VALUES
    ('a0000000-0000-0000-0000-000000000001', 'Auto & Mobilité', 'auto-mobilite', 'Véhicules électriques, motos, scooters, batteries et pièces détachées certifiées', 1, true),
    ('a0000000-0000-0000-0000-000000000002', 'Électronique & High-Tech', 'electronique', 'Smartphones, projecteurs, caméras, accessoires connectés et domotique', 2, true),
    ('a0000000-0000-0000-0000-000000000003', 'Maison & Électroménager', 'maison-electromenager', 'Petit électroménager, machines à café, climatiseurs solaires et mobilier', 3, true),
    ('a0000000-0000-0000-0000-000000000004', 'Machines & Équipement Pro', 'machines-pro', 'Générateurs, broyeurs, machines d''emballage et outillage industriel', 4, true)
ON CONFLICT (id) DO NOTHING;

-- 3. TRANSPORTEURS (Carriers)
INSERT INTO public.carriers (id, name, contact_name, phone, email, mode, rate_per_kg_xof, rate_per_cbm_xof, min_charge_xof, volumetric_factor, base_transit_days_min, base_transit_days_max, reliability_score, departure_frequency, status)
VALUES
    ('b0000000-0000-0000-0000-000000000001', 'Air Cargo Express Sino-Dakar (Vols directs via Addis)', 'Capitaine Ndiaye', '+221 77 120 44 88', 'aircargo@dallouchine.sn', 'air', 7500, 0, 15000, 6000, 12, 18, 98.4, '3 départs / semaine (Mardi, Jeudi, Samedi)', 'active'),
    ('b0000000-0000-0000-0000-000000000002', 'Ligne Maritime Groupage Port de Dakar (LCL Consolidé)', 'M. Traoré', '+221 77 340 55 99', 'maritime@dallouchine.sn', 'sea', 0, 185000, 45000, 1000, 30, 45, 96.0, '2 conteneurs groupés / mois', 'active'),
    ('b0000000-0000-0000-0000-000000000003', 'Express Courier VIP (Prioritaire)', 'Mme Diop', '+221 77 550 66 11', 'express@dallouchine.sn', 'express', 13500, 0, 25000, 5000, 5, 8, 99.5, 'Départs quotidiens', 'active')
ON CONFLICT (id) DO NOTHING;

-- 4. HUBS DE DISTRIBUTION DAKAR
INSERT INTO public.hubs (id, name, district, city, country, address, opening_hours, manager_name, manager_phone, active_parcels_count, capacity_limit, status)
VALUES
    ('c0000000-0000-0000-0000-000000000001', 'Hub Central Almadies HQ', 'Almadies', 'Dakar', 'Sénégal', 'Route des Almadies, Immeuble Horizon 3ème étage', 'Lun-Sam: 08h30 - 19h00', 'Moustapha Fall', '+221 77 540 22 11', 28, 500, 'active'),
    ('c0000000-0000-0000-0000-000000000002', 'Hub Relais Colobane Express', 'Colobane', 'Dakar', 'Sénégal', 'Avenue Faidherbe angle Rue 12, Dakar', 'Lun-Sam: 08h00 - 18h30', 'Ousmane Sow', '+221 78 210 33 44', 45, 600, 'active')
ON CONFLICT (id) DO NOTHING;

-- 5. FOURNISSEURS AUDITÉS CHINE
INSERT INTO public.suppliers (id, name, company_name, contact_name, phone, email, wechat, country, city, address, supplier_url, platform, rating, notes, status)
VALUES
    ('d0000000-0000-0000-0000-000000000001', 'Shenzhen MicroVision Optoelectronics Co., Ltd.', 'MicroVision Tech Group', 'Mr. Liu Kang', '+86 138 2841 9022', 'sales@microvision-sz.com', 'wx_microvision_sz', 'Chine', 'Shenzhen', 'Baoan District, Shenzhen, Guangdong', 'https://1688.com/supplier/microvision', '1688', 4.9, 'Fournisseur audité sur site. Taux de défectuosité inférieur à 0.3%. Garantie 1 an.', 'preferred'),
    ('d0000000-0000-0000-0000-000000000002', 'Yiwu SuperGreen Mobility Electric Vehicles Co.', 'SuperGreen EV Factory', 'Ms. Chen Xiaoling', '+86 159 5892 4110', 'chen@supergreen-ev.cn', 'yiwu_supergreen_ev', 'Chine', 'Yiwu', 'Futian Industrial Park, Yiwu, Zhejiang', 'https://1688.com/supplier/supergreen-ev', 'direct_factory', 4.8, 'Fabricant certifié CE & ISO pour scooters électriques et batteries lithium LiFePO4.', 'preferred')
ON CONFLICT (id) DO NOTHING;

-- 6. AGENTS DE SOURCING CHINE
INSERT INTO public.sourcers (id, name, phone, email, location_city, specialization, commission_rate_percent, rating, status)
VALUES
    ('e0000000-0000-0000-0000-000000000001', 'Agent Zhang Wei (Yiwu)', '+86 186 5798 1234', 'zhang.wei@dallouchine.cn', 'Yiwu', ARRAY['Petits appareils', 'Quincaillerie', 'Maison', 'Consolidation maritime'], 4.5, 4.9, 'active'),
    ('e0000000-0000-0000-0000-000000000002', 'Agent Li Ming (Shenzhen & Guangzhou)', '+86 139 2244 5678', 'li.ming@dallouchine.cn', 'Shenzhen', ARRAY['High-tech', 'Auto & Mobilité électrique', 'Batteries', 'Contrôle qualité usine'], 5.0, 5.0, 'active')
ON CONFLICT (id) DO NOTHING;

-- 7. EXEMPLE PRODUIT AUTO & MOBILITÉ
INSERT INTO public.products (
    id, category_id, supplier_id, sourcer_id, name, slug, sku,
    short_description, description, price_xof, compare_at_price_xof, currency,
    moq, stock_quantity, reserved_quantity, weight_kg, length_cm, width_cm, height_cm, cbm,
    default_transport_mode, estimated_delivery_days, is_groupage, is_auto_mobility, is_featured, is_active
) VALUES (
    'f0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000002',
    'e0000000-0000-0000-0000-000000000002',
    'Scooter Électrique Urbain Pro 3000W 72V 40Ah',
    'scooter-electrique-urbain-pro-3000w',
    'EV-SCOOT-3000W',
    'Scooter 100% électrique homologué, autonomie 95 km, batterie amovible, zéro carburant.',
    'Le Scooter Électrique Urbain Pro 3000W est spécialement tropicalisé pour les conditions de route ouest-africaines. Moteur brushless étanche IP67, freinage double disque hydraulique, recharge sur prise 220V standard.',
    985000, 1250000, 'XOF',
    1, 15, 3, 95.0, 185.0, 72.0, 115.0, 1.53,
    'sea', '30-40 jours', true, true, true, true
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.product_auto_specs (
    product_id, vehicle_type, brand, model, model_year,
    battery_capacity_kwh, range_km, motor_power_kw, motor_power_hp,
    charging_time, top_speed_kmh, weight_kg, certification
) VALUES (
    'f0000000-0000-0000-0000-000000000001',
    'electric_motorcycle', 'SuperGreen', 'Urbain Pro GT', 2026,
    2.88, 95, 3.0, 4,
    '4-5 heures', 85, 95.0, 'CE / EEC / ISO9001'
) ON CONFLICT (product_id) DO NOTHING;

INSERT INTO public.product_images (product_id, image_url, alt_text, sort_order, is_primary)
VALUES (
    'f0000000-0000-0000-0000-000000000001',
    'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&auto=format&fit=crop',
    'Scooter Électrique Urbain Pro 3000W vue latérale',
    1, true
) ON CONFLICT DO NOTHING;

-- 8. EXEMPLE GROUPAGE ACTIF
INSERT INTO public.groupages (
    id, code, product_id, title, description,
    target_quantity, reserved_quantity, min_order_per_user, max_order_per_user,
    participants_count, unit_price_xof, original_price_xof, currency, supplier_moq,
    transport_mode, logistics_route, departure_country, arrival_country,
    start_date, deadline, estimated_departure_date, estimated_arrival_date, status, guarantee_note
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'GRP-EV-026',
    'f0000000-0000-0000-0000-000000000001',
    'Campagne Groupage : Scooters Électriques Urbains 3000W (Conteneur Maritime 40ft)',
    'Mutualisez le fret maritime au départ du Hub Yiwu vers le Port de Dakar et bénéficiez du tarif usine négocié.',
    20, 14, 1, 5,
    9, 875000, 1250000, 'XOF', 10,
    'sea', 'Yiwu Consolidation Hub -> Port de Dakar', 'Chine', 'Sénégal',
    CURRENT_DATE - INTERVAL '10 days',
    NOW() + INTERVAL '12 days',
    CURRENT_DATE + INTERVAL '16 days',
    CURRENT_DATE + INTERVAL '45 days',
    'open', 'Séquestre bancaire garanti : fonds débloqués uniquement après inspection qualité en Chine.'
) ON CONFLICT (id) DO NOTHING;
