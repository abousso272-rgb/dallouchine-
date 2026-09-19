-- ==============================================================================
-- DALLOU CHINE - SCHEMA COMPLET POSTGRESQL (SUPABASE)
-- Version : 2026-09-19
-- Architecture : Production-Ready, UUID, RLS, Contraintes d'intégrité, Audit
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. FONCTION UTILITAIRE : Mise à jour automatique de updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. TABLE PROFILES (Utilisateurs et Rôles)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL DEFAULT '',
    phone VARCHAR(64),
    email VARCHAR(255),
    avatar_url TEXT,
    role VARCHAR(50) NOT NULL DEFAULT 'client' CHECK (
        role IN ('client', 'admin', 'super_admin', 'operations', 'sourcing', 'commercial', 'finance')
    ),
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (
        status IN ('active', 'suspended', 'pending_verification')
    ),
    city VARCHAR(100) DEFAULT 'Dakar',
    country VARCHAR(100) DEFAULT 'Sénégal',
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

CREATE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 4. FONCTION UTILITAIRE : Vérification des privilèges Administrateur / Staff
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin', 'operations', 'sourcing', 'commercial', 'finance')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 5. TRIGGER AUTOMATIQUE : Création de profil lors de l'inscription Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, phone, role, status)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'phone', ''),
        'client',
        'active'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. TABLE CATEGORIES
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    image_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON public.categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON public.categories(is_active);

CREATE TRIGGER trg_categories_updated_at
    BEFORE UPDATE ON public.categories
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 7. TABLE SUPPLIERS (Fournisseurs - Données Internes)
CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    company_name VARCHAR(255),
    contact_name VARCHAR(255),
    phone VARCHAR(64),
    email VARCHAR(255),
    wechat VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Chine',
    city VARCHAR(100),
    address TEXT,
    supplier_url TEXT,
    platform VARCHAR(50) DEFAULT '1688' CHECK (
        platform IN ('1688', 'direct_factory', 'made_in_china', 'yiwu_market', 'alibaba', 'other')
    ),
    rating NUMERIC(3, 2) DEFAULT 5.0 CHECK (rating >= 0 AND rating <= 5),
    notes TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'verified' CHECK (
        status IN ('pending', 'verified', 'preferred', 'suspended')
    ),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_suppliers_status ON public.suppliers(status);
CREATE INDEX IF NOT EXISTS idx_suppliers_city ON public.suppliers(city);

CREATE TRIGGER trg_suppliers_updated_at
    BEFORE UPDATE ON public.suppliers
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 8. TABLE SOURCERS (Agents Terrain Chine)
CREATE TABLE IF NOT EXISTS public.sourcers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(64),
    email VARCHAR(255),
    location_city VARCHAR(100) DEFAULT 'Guangzhou',
    specialization TEXT[] DEFAULT '{}'::text[],
    commission_rate_percent NUMERIC(5, 2) DEFAULT 5.0 CHECK (commission_rate_percent >= 0),
    rating NUMERIC(3, 2) DEFAULT 5.0 CHECK (rating >= 0 AND rating <= 5),
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (
        status IN ('active', 'busy', 'inactive')
    ),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sourcers_profile_id ON public.sourcers(profile_id);
CREATE INDEX IF NOT EXISTS idx_sourcers_status ON public.sourcers(status);

CREATE TRIGGER trg_sourcers_updated_at
    BEFORE UPDATE ON public.sourcers
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 9. TABLE PRODUCTS (Catalogue Produits)
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES public.categories(id) ON DELETE RESTRICT,
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
    sourcer_id UUID REFERENCES public.sourcers(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    sku VARCHAR(100) UNIQUE,
    short_description TEXT,
    description TEXT,
    price_xof NUMERIC(14, 2) NOT NULL CHECK (price_xof >= 0),
    compare_at_price_xof NUMERIC(14, 2) CHECK (compare_at_price_xof IS NULL OR compare_at_price_xof >= 0),
    currency VARCHAR(10) NOT NULL DEFAULT 'XOF',
    moq INT NOT NULL DEFAULT 1 CHECK (moq >= 1),
    stock_quantity INT NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    reserved_quantity INT NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0),
    weight_kg NUMERIC(10, 3) NOT NULL DEFAULT 0 CHECK (weight_kg >= 0),
    length_cm NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (length_cm >= 0),
    width_cm NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (width_cm >= 0),
    height_cm NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (height_cm >= 0),
    cbm NUMERIC(10, 4) NOT NULL DEFAULT 0 CHECK (cbm >= 0),
    default_transport_mode VARCHAR(20) NOT NULL DEFAULT 'air' CHECK (
        default_transport_mode IN ('air', 'sea', 'express')
    ),
    estimated_delivery_days VARCHAR(50) DEFAULT '12-18 jours',
    is_groupage BOOLEAN NOT NULL DEFAULT false,
    is_customizable BOOLEAN NOT NULL DEFAULT false,
    customization_details JSONB DEFAULT '{}'::jsonb,
    specifications JSONB DEFAULT '{}'::jsonb,
    features TEXT[] DEFAULT '{}'::text[],
    tags TEXT[] DEFAULT '{}'::text[],
    rating NUMERIC(3, 2) DEFAULT 5.0 CHECK (rating >= 0 AND rating <= 5),
    reviews_count INT DEFAULT 0 CHECK (reviews_count >= 0),
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    is_auto_mobility BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_supplier_id ON public.products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON public.products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_is_auto_mobility ON public.products(is_auto_mobility);

CREATE TRIGGER trg_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 10. TABLE PRODUCT_IMAGES
CREATE TABLE IF NOT EXISTS public.product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    alt_text VARCHAR(255),
    sort_order INT NOT NULL DEFAULT 0,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON public.product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_is_primary ON public.product_images(is_primary);

-- 11. TABLE PRODUCT_AUTO_SPECS (Verticale Auto & Mobilité)
CREATE TABLE IF NOT EXISTS public.product_auto_specs (
    product_id UUID PRIMARY KEY REFERENCES public.products(id) ON DELETE CASCADE,
    vehicle_type VARCHAR(50) NOT NULL CHECK (
        vehicle_type IN ('electric_car', 'electric_motorcycle', 'motorcycle', 'scooter', 'spare_part', 'battery', 'accessory')
    ),
    brand VARCHAR(100),
    model VARCHAR(100),
    model_year INT,
    battery_capacity_kwh NUMERIC(8, 2),
    range_km INT,
    motor_power_kw NUMERIC(8, 2),
    motor_power_hp INT,
    charging_time VARCHAR(50),
    top_speed_kmh INT,
    weight_kg NUMERIC(10, 2),
    dimensions VARCHAR(100),
    certification VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_product_auto_specs_vehicle_type ON public.product_auto_specs(vehicle_type);
CREATE INDEX IF NOT EXISTS idx_product_auto_specs_brand ON public.product_auto_specs(brand);

CREATE TRIGGER trg_product_auto_specs_updated_at
    BEFORE UPDATE ON public.product_auto_specs
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 12. TABLE GROUPAGES (Achats Groupés Collaboratifs)
CREATE TABLE IF NOT EXISTS public.groupages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    target_quantity INT NOT NULL CHECK (target_quantity > 0),
    reserved_quantity INT NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0),
    min_order_per_user INT NOT NULL DEFAULT 1 CHECK (min_order_per_user >= 1),
    max_order_per_user INT NOT NULL DEFAULT 100 CHECK (max_order_per_user >= min_order_per_user),
    participants_count INT NOT NULL DEFAULT 0 CHECK (participants_count >= 0),
    unit_price_xof NUMERIC(14, 2) NOT NULL CHECK (unit_price_xof >= 0),
    original_price_xof NUMERIC(14, 2) NOT NULL CHECK (original_price_xof >= 0),
    currency VARCHAR(10) NOT NULL DEFAULT 'XOF',
    supplier_moq INT NOT NULL CHECK (supplier_moq > 0),
    transport_mode VARCHAR(20) NOT NULL DEFAULT 'sea' CHECK (
        transport_mode IN ('air', 'sea', 'express')
    ),
    logistics_route VARCHAR(255) DEFAULT 'Yiwu Hub -> Dakar Port/Airport',
    departure_country VARCHAR(100) DEFAULT 'Chine',
    arrival_country VARCHAR(100) DEFAULT 'Sénégal',
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    deadline TIMESTAMPTZ NOT NULL,
    estimated_departure_date DATE,
    estimated_arrival_date DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'open' CHECK (
        status IN ('draft', 'open', 'almost_full', 'full', 'validated', 'supplier_ordered', 'preparing', 'shipped', 'arrived', 'completed', 'cancelled')
    ),
    status_note TEXT,
    guarantee_note TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_groupages_code ON public.groupages(code);
CREATE INDEX IF NOT EXISTS idx_groupages_product_id ON public.groupages(product_id);
CREATE INDEX IF NOT EXISTS idx_groupages_status ON public.groupages(status);
CREATE INDEX IF NOT EXISTS idx_groupages_deadline ON public.groupages(deadline);

CREATE TRIGGER trg_groupages_updated_at
    BEFORE UPDATE ON public.groupages
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 13. TABLE GROUPAGE_PARTICIPANTS
CREATE TABLE IF NOT EXISTS public.groupage_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    groupage_id UUID NOT NULL REFERENCES public.groupages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price_xof NUMERIC(14, 2) NOT NULL CHECK (unit_price_xof >= 0),
    total_xof NUMERIC(14, 2) NOT NULL CHECK (total_xof >= 0),
    status VARCHAR(50) NOT NULL DEFAULT 'reserved' CHECK (
        status IN ('reserved', 'confirmed', 'paid', 'cancelled', 'refunded')
    ),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_groupage_participants_groupage_id ON public.groupage_participants(groupage_id);
CREATE INDEX IF NOT EXISTS idx_groupage_participants_user_id ON public.groupage_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_groupage_participants_status ON public.groupage_participants(status);

CREATE TRIGGER trg_groupage_participants_updated_at
    BEFORE UPDATE ON public.groupage_participants
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 14. TABLE CARRIERS (Transporteurs Aérien & Maritime)
CREATE TABLE IF NOT EXISTS public.carriers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255),
    phone VARCHAR(64),
    email VARCHAR(255),
    mode VARCHAR(20) NOT NULL CHECK (mode IN ('air', 'sea', 'express')),
    rate_per_kg_xof NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (rate_per_kg_xof >= 0),
    rate_per_cbm_xof NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (rate_per_cbm_xof >= 0),
    min_charge_xof NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (min_charge_xof >= 0),
    volumetric_factor INT NOT NULL DEFAULT 6000 CHECK (volumetric_factor > 0),
    base_transit_days_min INT NOT NULL DEFAULT 1 CHECK (base_transit_days_min >= 1),
    base_transit_days_max INT NOT NULL DEFAULT 30 CHECK (base_transit_days_max >= base_transit_days_min),
    reliability_score NUMERIC(4, 1) DEFAULT 95.0 CHECK (reliability_score >= 0 AND reliability_score <= 100),
    departure_frequency VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_carriers_mode ON public.carriers(mode);
CREATE INDEX IF NOT EXISTS idx_carriers_status ON public.carriers(status);

CREATE TRIGGER trg_carriers_updated_at
    BEFORE UPDATE ON public.carriers
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 15. TABLE HUBS (Hubs Relais Dakar & Sénégal)
CREATE TABLE IF NOT EXISTS public.hubs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    district VARCHAR(100),
    city VARCHAR(100) NOT NULL DEFAULT 'Dakar',
    country VARCHAR(100) NOT NULL DEFAULT 'Sénégal',
    address TEXT NOT NULL,
    opening_hours VARCHAR(255),
    manager_name VARCHAR(255),
    manager_phone VARCHAR(64),
    active_parcels_count INT NOT NULL DEFAULT 0 CHECK (active_parcels_count >= 0),
    capacity_limit INT NOT NULL DEFAULT 500 CHECK (capacity_limit > 0),
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'inactive')),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_hubs_city ON public.hubs(city);
CREATE INDEX IF NOT EXISTS idx_hubs_status ON public.hubs(status);

CREATE TRIGGER trg_hubs_updated_at
    BEFORE UPDATE ON public.hubs
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 16. TABLE ORDERS (Commandes)
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tracking_code VARCHAR(32) UNIQUE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(64) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_city VARCHAR(100) NOT NULL DEFAULT 'Dakar',
    subtotal_xof NUMERIC(14, 2) NOT NULL CHECK (subtotal_xof >= 0),
    shipping_fee_xof NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (shipping_fee_xof >= 0),
    discount_amount_xof NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (discount_amount_xof >= 0),
    total_xof NUMERIC(14, 2) NOT NULL CHECK (total_xof >= 0),
    currency VARCHAR(10) NOT NULL DEFAULT 'XOF',
    payment_method VARCHAR(50) NOT NULL DEFAULT 'wave',
    payment_status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (
        payment_status IN ('pending', 'processing', 'paid', 'failed', 'cancelled', 'refunded')
    ),
    order_status VARCHAR(50) NOT NULL DEFAULT 'pending_payment' CHECK (
        order_status IN ('pending_payment', 'paid', 'supplier_ordered', 'preparing', 'shipped', 'in_transit', 'arrived', 'ready_for_delivery', 'delivered', 'cancelled')
    ),
    delivery_type VARCHAR(50) NOT NULL DEFAULT 'hub_pickup' CHECK (
        delivery_type IN ('hub_pickup', 'home_delivery')
    ),
    hub_location_id UUID REFERENCES public.hubs(id) ON DELETE SET NULL,
    delivery_address JSONB,
    notes TEXT,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_tracking_code ON public.orders(tracking_code);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_order_status ON public.orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

CREATE TRIGGER trg_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 17. TABLE ORDER_ITEMS (Snapshot des articles au moment de l'achat)
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    groupage_id UUID REFERENCES public.groupages(id) ON DELETE SET NULL,
    product_name_snapshot VARCHAR(255) NOT NULL,
    sku_snapshot VARCHAR(100),
    image_url_snapshot TEXT,
    transport_mode_snapshot VARCHAR(20) DEFAULT 'air',
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price_xof NUMERIC(14, 2) NOT NULL CHECK (unit_price_xof >= 0),
    subtotal_xof NUMERIC(14, 2) NOT NULL CHECK (subtotal_xof >= 0),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);

-- 18. TABLE ORDER_STATUS_HISTORY (Piste d'Audit des Jalons de Commande)
CREATE TABLE IF NOT EXISTS public.order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    location VARCHAR(255) DEFAULT 'Hub Dakar',
    description TEXT,
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON public.order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_created_at ON public.order_status_history(created_at);

-- 19. TABLE SOURCING_REQUESTS (Demandes de Sourcing Personnalisées Chine)
CREATE TABLE IF NOT EXISTS public.sourcing_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    client_name VARCHAR(255) NOT NULL,
    client_phone VARCHAR(64) NOT NULL,
    client_email VARCHAR(255),
    client_company VARCHAR(255),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    product_url TEXT,
    alibaba_url TEXT,
    url_1688 TEXT,
    image_url TEXT,
    additional_images TEXT[] DEFAULT '{}'::text[],
    category VARCHAR(100),
    quantity INT NOT NULL CHECK (quantity > 0),
    budget_xof NUMERIC(14, 2) CHECK (budget_xof IS NULL OR budget_xof >= 0),
    currency VARCHAR(10) NOT NULL DEFAULT 'XOF',
    customization BOOLEAN DEFAULT false,
    customization_details TEXT,
    notes TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'new' CHECK (
        status IN ('new', 'researching', 'supplier_found', 'negotiating', 'quote_ready', 'quote_sent', 'accepted', 'rejected', 'ordered', 'completed', 'cancelled')
    ),
    assigned_sourcer_id UUID REFERENCES public.sourcers(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sourcing_requests_user_id ON public.sourcing_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_sourcing_requests_status ON public.sourcing_requests(status);
CREATE INDEX IF NOT EXISTS idx_sourcing_requests_code ON public.sourcing_requests(code);
CREATE INDEX IF NOT EXISTS idx_sourcing_requests_assigned_sourcer_id ON public.sourcing_requests(assigned_sourcer_id);

CREATE TRIGGER trg_sourcing_requests_updated_at
    BEFORE UPDATE ON public.sourcing_requests
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 20. TABLE SOURCING_MESSAGES
CREATE TABLE IF NOT EXISTS public.sourcing_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES public.sourcing_requests(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    message TEXT NOT NULL,
    attachment_url TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sourcing_messages_request_id ON public.sourcing_messages(request_id);

-- 21. TABLE B2B_REQUESTS (Grands Comptes & Conteneurs)
CREATE TABLE IF NOT EXISTS public.b2b_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    company_name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255) NOT NULL,
    phone VARCHAR(64) NOT NULL,
    email VARCHAR(255) NOT NULL,
    sector VARCHAR(100),
    product_description TEXT NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    budget_xof NUMERIC(14, 2) CHECK (budget_xof IS NULL OR budget_xof >= 0),
    currency VARCHAR(10) NOT NULL DEFAULT 'XOF',
    transport_preference VARCHAR(20) DEFAULT 'recommended',
    destination VARCHAR(100) DEFAULT 'Dakar, Sénégal',
    customization BOOLEAN DEFAULT false,
    logo_instructions TEXT,
    packaging_requested BOOLEAN DEFAULT false,
    attachments TEXT[] DEFAULT '{}'::text[],
    notes TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'new' CHECK (
        status IN ('new', 'qualified', 'sourcing', 'negotiation', 'quote_sent', 'accepted', 'deposit_paid', 'production', 'shipping', 'completed', 'cancelled')
    ),
    assigned_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_b2b_requests_user_id ON public.b2b_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_b2b_requests_status ON public.b2b_requests(status);
CREATE INDEX IF NOT EXISTS idx_b2b_requests_code ON public.b2b_requests(code);

CREATE TRIGGER trg_b2b_requests_updated_at
    BEFORE UPDATE ON public.b2b_requests
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 22. TABLE QUOTES (Devis Commerciaux)
CREATE TABLE IF NOT EXISTS public.quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_number VARCHAR(50) UNIQUE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    sourcing_request_id UUID REFERENCES public.sourcing_requests(id) ON DELETE SET NULL,
    b2b_request_id UUID REFERENCES public.b2b_requests(id) ON DELETE SET NULL,
    client_name VARCHAR(255) NOT NULL,
    company_name VARCHAR(255),
    phone VARCHAR(64) NOT NULL,
    email VARCHAR(255),
    currency VARCHAR(10) NOT NULL DEFAULT 'XOF',
    subtotal_xof NUMERIC(14, 2) NOT NULL CHECK (subtotal_xof >= 0),
    shipping_xof NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (shipping_xof >= 0),
    customs_xof NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (customs_xof >= 0),
    fees_xof NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (fees_xof >= 0),
    discount_xof NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (discount_xof >= 0),
    total_xof NUMERIC(14, 2) NOT NULL CHECK (total_xof >= 0),
    deposit_required_percent NUMERIC(5, 2) DEFAULT 60.0,
    deposit_amount_xof NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (deposit_amount_xof >= 0),
    balance_due_xof NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (balance_due_xof >= 0),
    valid_until DATE NOT NULL,
    lead_time_days VARCHAR(50) DEFAULT '15-20 jours',
    transport_mode VARCHAR(20) DEFAULT 'air',
    conditions TEXT[] DEFAULT '{}'::text[],
    version INT NOT NULL DEFAULT 1 CHECK (version >= 1),
    status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (
        status IN ('draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired', 'cancelled')
    ),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_quotes_quote_number ON public.quotes(quote_number);
CREATE INDEX IF NOT EXISTS idx_quotes_user_id ON public.quotes(user_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON public.quotes(status);

CREATE TRIGGER trg_quotes_updated_at
    BEFORE UPDATE ON public.quotes
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 23. TABLE QUOTE_ITEMS
CREATE TABLE IF NOT EXISTS public.quote_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price_xof NUMERIC(14, 2) NOT NULL CHECK (unit_price_xof >= 0),
    subtotal_xof NUMERIC(14, 2) NOT NULL CHECK (subtotal_xof >= 0),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_quote_items_quote_id ON public.quote_items(quote_id);

-- 24. TABLE SHIPMENTS (Expéditions & Conteneurs)
CREATE TABLE IF NOT EXISTS public.shipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tracking_code VARCHAR(50) UNIQUE NOT NULL,
    carrier_id UUID REFERENCES public.carriers(id) ON DELETE SET NULL,
    origin VARCHAR(100) NOT NULL DEFAULT 'Chine (Yiwu/Guangzhou)',
    destination VARCHAR(100) NOT NULL DEFAULT 'Sénégal (Port/Aéroport Dakar)',
    transport_mode VARCHAR(20) NOT NULL DEFAULT 'sea' CHECK (
        transport_mode IN ('air', 'sea', 'express')
    ),
    container_number VARCHAR(100),
    vessel_or_flight_number VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'preparing_in_china' CHECK (
        status IN ('awaiting_supplier', 'supplier_confirmed', 'preparing_in_china', 'ready_to_ship', 'shipped_from_china', 'in_transit', 'arrived_senegal', 'customs', 'at_hub', 'out_for_delivery', 'delivered')
    ),
    estimated_departure TIMESTAMPTZ,
    estimated_arrival TIMESTAMPTZ,
    actual_departure TIMESTAMPTZ,
    actual_arrival TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_shipments_tracking_code ON public.shipments(tracking_code);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON public.shipments(status);
CREATE INDEX IF NOT EXISTS idx_shipments_carrier_id ON public.shipments(carrier_id);

CREATE TRIGGER trg_shipments_updated_at
    BEFORE UPDATE ON public.shipments
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 25. TABLE SHIPMENT_ORDERS (Association Many-to-Many Expédition <-> Commandes)
CREATE TABLE IF NOT EXISTS public.shipment_orders (
    shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    PRIMARY KEY (shipment_id, order_id)
);

CREATE INDEX IF NOT EXISTS idx_shipment_orders_order_id ON public.shipment_orders(order_id);

-- 26. TABLE SHIPMENT_EVENTS (Jalons Logistiques en Direct)
CREATE TABLE IF NOT EXISTS public.shipment_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    location VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_shipment_events_shipment_id ON public.shipment_events(shipment_id);
CREATE INDEX IF NOT EXISTS idx_shipment_events_created_at ON public.shipment_events(created_at);

-- 27. TABLE PAYMENTS (Couche d'abstraction financière / GeniusPay)
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    provider VARCHAR(50) NOT NULL DEFAULT 'geniuspay',
    provider_payment_id VARCHAR(255) UNIQUE,
    provider_reference VARCHAR(255),
    amount_xof NUMERIC(14, 2) NOT NULL CHECK (amount_xof >= 0),
    currency VARCHAR(10) NOT NULL DEFAULT 'XOF',
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (
        status IN ('pending', 'paid', 'failed', 'cancelled', 'refunded', 'expired')
    ),
    payment_method VARCHAR(50) NOT NULL DEFAULT 'wave',
    checkout_url TEXT,
    customer_name VARCHAR(255),
    customer_email VARCHAR(255),
    customer_phone VARCHAR(64),
    error_code VARCHAR(100),
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    raw_provider_response JSONB,
    expires_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_provider_payment_id ON public.payments(provider_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.payments(created_at DESC);

CREATE TRIGGER trg_payments_updated_at
    BEFORE UPDATE ON public.payments
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 28. TABLE PAYMENT_ATTEMPTS (Audit Multi-Tentatives)
CREATE TABLE IF NOT EXISTS public.payment_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    attempt_number INT NOT NULL DEFAULT 1 CHECK (attempt_number >= 1),
    provider_reference VARCHAR(255),
    amount_xof NUMERIC(14, 2) NOT NULL CHECK (amount_xof >= 0),
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    error_code VARCHAR(100),
    error_message TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_payment_attempts_payment_id ON public.payment_attempts(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_attempts_order_id ON public.payment_attempts(order_id);

-- 29. TABLE WEBHOOK_EVENTS (Journal Idempotence Anti-Rejeu)
CREATE TABLE IF NOT EXISTS public.webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider VARCHAR(50) NOT NULL DEFAULT 'geniuspay',
    event_id VARCHAR(255) UNIQUE,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    signature_valid BOOLEAN NOT NULL DEFAULT false,
    processed BOOLEAN NOT NULL DEFAULT false,
    processing_error TEXT,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_event_id ON public.webhook_events(event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON public.webhook_events(processed);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at ON public.webhook_events(created_at DESC);

-- 30. TABLE DOCUMENTS (Gestion Documentaire & Fichiers Storage)
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    sourcing_request_id UUID REFERENCES public.sourcing_requests(id) ON DELETE SET NULL,
    b2b_request_id UUID REFERENCES public.b2b_requests(id) ON DELETE SET NULL,
    quote_id UUID REFERENCES public.quotes(id) ON DELETE SET NULL,
    reference VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    document_type VARCHAR(50) NOT NULL CHECK (
        document_type IN ('quote', 'invoice', 'receipt', 'order_confirmation', 'delivery_note', 'proforma', 'customs_doc', 'other')
    ),
    file_path TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) DEFAULT 'application/pdf',
    file_size BIGINT DEFAULT 0,
    visibility VARCHAR(50) NOT NULL DEFAULT 'private' CHECK (
        visibility IN ('private', 'public', 'internal')
    ),
    amount_xof NUMERIC(14, 2) DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'valid' CHECK (
        status IN ('valid', 'paid', 'provisional', 'archived')
    ),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_order_id ON public.documents(order_id);
CREATE INDEX IF NOT EXISTS idx_documents_quote_id ON public.documents(quote_id);
CREATE INDEX IF NOT EXISTS idx_documents_reference ON public.documents(reference);

-- 31. TABLE NOTIFICATIONS (Centre d'alertes & notifications clients)
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL DEFAULT 'info',
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}'::jsonb,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- 32. TABLE FAVORITES (Liste de souhaits)
CREATE TABLE IF NOT EXISTS public.favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites(user_id);

-- 33. TABLE CART_ITEMS (Panier persistant multi-dispositifs)
CREATE TABLE IF NOT EXISTS public.cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    groupage_id UUID REFERENCES public.groupages(id) ON DELETE SET NULL,
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (user_id, product_id, groupage_id)
);

CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON public.cart_items(user_id);

CREATE TRIGGER trg_cart_items_updated_at
    BEFORE UPDATE ON public.cart_items
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 34. TABLE PLATFORM_SETTINGS (Paramètres & Taux Globaux)
CREATE TABLE IF NOT EXISTS public.platform_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_platform_settings_key ON public.platform_settings(key);

-- 35. TABLE ORDER_COSTS (Comptabilité Analytique & Coûts Internes - STRICTEMENT INTERNE)
CREATE TABLE IF NOT EXISTS public.order_costs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    cost_type VARCHAR(50) NOT NULL CHECK (
        cost_type IN ('supplier', 'sourcing', 'inspection', 'consolidation', 'transport', 'customs', 'other')
    ),
    amount_xof NUMERIC(14, 2) NOT NULL CHECK (amount_xof >= 0),
    currency VARCHAR(10) NOT NULL DEFAULT 'XOF',
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_order_costs_order_id ON public.order_costs(order_id);
CREATE INDEX IF NOT EXISTS idx_order_costs_cost_type ON public.order_costs(cost_type);

-- 36. TABLE PLATFORM_REVENUES (Revenus de la Plateforme - STRICTEMENT INTERNE)
CREATE TABLE IF NOT EXISTS public.platform_revenues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    revenue_type VARCHAR(50) NOT NULL CHECK (
        revenue_type IN ('service_fee', 'sourcing_fee', 'transaction_fee', 'b2b_fee', 'other')
    ),
    amount_xof NUMERIC(14, 2) NOT NULL CHECK (amount_xof >= 0),
    currency VARCHAR(10) NOT NULL DEFAULT 'XOF',
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_platform_revenues_order_id ON public.platform_revenues(order_id);
CREATE INDEX IF NOT EXISTS idx_platform_revenues_revenue_type ON public.platform_revenues(revenue_type);

-- 37. TABLE AUDIT_LOGS (Journal de Sécurité et Audit Opérationnel)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(255) NOT NULL,
    old_data JSONB,
    new_data JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- ==============================================================================
-- 38. ACTIVATION DE LA ROW LEVEL SECURITY (RLS) SUR TOUTES LES TABLES
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sourcers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_auto_specs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groupages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groupage_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carriers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sourcing_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sourcing_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.b2b_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipment_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_revenues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 39. POLITIQUES DE SÉCURITÉ (POLICIES)
-- ==============================================================================

-- A. PROFILES
CREATE POLICY "Lecture de son propre profil par l'utilisateur"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Mise à jour de son profil par l'utilisateur"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Accès complet administrateur sur les profils"
    ON public.profiles FOR ALL
    USING (public.is_admin());

-- B. CATEGORIES
CREATE POLICY "Lecture publique des catégories actives"
    ON public.categories FOR SELECT
    USING (is_active = true OR public.is_admin());

CREATE POLICY "Gestion administrateur des catégories"
    ON public.categories FOR ALL
    USING (public.is_admin());

-- C. PRODUCTS, IMAGES & AUTO SPECS
CREATE POLICY "Lecture publique des produits actifs"
    ON public.products FOR SELECT
    USING (is_active = true OR public.is_admin());

CREATE POLICY "Gestion administrateur des produits"
    ON public.products FOR ALL
    USING (public.is_admin());

CREATE POLICY "Lecture publique des images produits"
    ON public.product_images FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.products p
        WHERE p.id = product_id AND (p.is_active = true OR public.is_admin())
    ));

CREATE POLICY "Gestion administrateur des images produits"
    ON public.product_images FOR ALL
    USING (public.is_admin());

CREATE POLICY "Lecture publique des spécifications auto"
    ON public.product_auto_specs FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.products p
        WHERE p.id = product_id AND (p.is_active = true OR public.is_admin())
    ));

CREATE POLICY "Gestion administrateur des spécifications auto"
    ON public.product_auto_specs FOR ALL
    USING (public.is_admin());

-- D. SUPPLIERS (Strictement réservé au staff / admin)
CREATE POLICY "Accès administrateur et sourcers aux fournisseurs"
    ON public.suppliers FOR ALL
    USING (public.is_admin());

-- E. SOURCERS
CREATE POLICY "Lecture publique de l'annuaire des sourcers actifs"
    ON public.sourcers FOR SELECT
    USING (status = 'active' OR public.is_admin());

CREATE POLICY "Gestion administrateur des sourcers"
    ON public.sourcers FOR ALL
    USING (public.is_admin());

-- F. GROUPAGES & PARTICIPANTS
CREATE POLICY "Lecture publique des groupages"
    ON public.groupages FOR SELECT
    USING (status != 'draft' OR public.is_admin());

CREATE POLICY "Gestion administrateur des groupages"
    ON public.groupages FOR ALL
    USING (public.is_admin());

CREATE POLICY "Lecture de ses propres participations au groupage"
    ON public.groupage_participants FOR SELECT
    USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Insertion de sa propre participation au groupage"
    ON public.groupage_participants FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Gestion administrateur des participations aux groupages"
    ON public.groupage_participants FOR ALL
    USING (public.is_admin());

-- G. CARRIERS & HUBS
CREATE POLICY "Lecture publique des transporteurs"
    ON public.carriers FOR SELECT
    USING (status = 'active' OR public.is_admin());

CREATE POLICY "Gestion administrateur des transporteurs"
    ON public.carriers FOR ALL
    USING (public.is_admin());

CREATE POLICY "Lecture publique des hubs actifs"
    ON public.hubs FOR SELECT
    USING (status = 'active' OR public.is_admin());

CREATE POLICY "Gestion administrateur des hubs"
    ON public.hubs FOR ALL
    USING (public.is_admin());

-- H. ORDERS, ORDER_ITEMS & ORDER_STATUS_HISTORY
CREATE POLICY "Lecture de ses propres commandes"
    ON public.orders FOR SELECT
    USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Création de sa propre commande"
    ON public.orders FOR INSERT
    WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL OR public.is_admin());

CREATE POLICY "Gestion administrateur des commandes"
    ON public.orders FOR ALL
    USING (public.is_admin());

CREATE POLICY "Lecture de ses propres articles de commande"
    ON public.order_items FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.orders o
        WHERE o.id = order_id AND (o.user_id = auth.uid() OR public.is_admin())
    ));

CREATE POLICY "Insertion de ses propres articles de commande"
    ON public.order_items FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.orders o
        WHERE o.id = order_id AND (o.user_id = auth.uid() OR o.user_id IS NULL OR public.is_admin())
    ));

CREATE POLICY "Gestion administrateur des articles de commande"
    ON public.order_items FOR ALL
    USING (public.is_admin());

CREATE POLICY "Lecture de l'historique de statut de sa commande"
    ON public.order_status_history FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.orders o
        WHERE o.id = order_id AND (o.user_id = auth.uid() OR public.is_admin())
    ));

CREATE POLICY "Gestion administrateur de l'historique de statut"
    ON public.order_status_history FOR ALL
    USING (public.is_admin());

-- I. SOURCING REQUESTS & MESSAGES
CREATE POLICY "Lecture de ses propres demandes de sourcing"
    ON public.sourcing_requests FOR SELECT
    USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Création de sa propre demande de sourcing"
    ON public.sourcing_requests FOR INSERT
    WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);

CREATE POLICY "Gestion administrateur des demandes de sourcing"
    ON public.sourcing_requests FOR ALL
    USING (public.is_admin());

CREATE POLICY "Lecture des messages de sa demande de sourcing"
    ON public.sourcing_messages FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.sourcing_requests sr
        WHERE sr.id = request_id AND (sr.user_id = auth.uid() OR public.is_admin())
    ));

CREATE POLICY "Envoi de message sur sa demande de sourcing"
    ON public.sourcing_messages FOR INSERT
    WITH CHECK (
        auth.uid() = sender_id AND
        EXISTS (
            SELECT 1 FROM public.sourcing_requests sr
            WHERE sr.id = request_id AND (sr.user_id = auth.uid() OR public.is_admin())
        )
    );

CREATE POLICY "Gestion administrateur des messages de sourcing"
    ON public.sourcing_messages FOR ALL
    USING (public.is_admin());

-- J. B2B REQUESTS
CREATE POLICY "Lecture de ses propres demandes B2B"
    ON public.b2b_requests FOR SELECT
    USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Création de sa propre demande B2B"
    ON public.b2b_requests FOR INSERT
    WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);

CREATE POLICY "Gestion administrateur des demandes B2B"
    ON public.b2b_requests FOR ALL
    USING (public.is_admin());

-- K. QUOTES & QUOTE_ITEMS
CREATE POLICY "Lecture de ses propres devis émis"
    ON public.quotes FOR SELECT
    USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Gestion administrateur des devis"
    ON public.quotes FOR ALL
    USING (public.is_admin());

CREATE POLICY "Lecture des articles de ses propres devis"
    ON public.quote_items FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.quotes q
        WHERE q.id = quote_id AND (q.user_id = auth.uid() OR public.is_admin())
    ));

CREATE POLICY "Gestion administrateur des articles de devis"
    ON public.quote_items FOR ALL
    USING (public.is_admin());

-- L. SHIPMENTS, SHIPMENT_ORDERS & SHIPMENT_EVENTS
CREATE POLICY "Lecture des expéditions associées à ses commandes"
    ON public.shipments FOR SELECT
    USING (
        public.is_admin() OR
        EXISTS (
            SELECT 1 FROM public.shipment_orders so
            JOIN public.orders o ON o.id = so.order_id
            WHERE so.shipment_id = public.shipments.id AND o.user_id = auth.uid()
        )
    );

CREATE POLICY "Gestion administrateur des expéditions"
    ON public.shipments FOR ALL
    USING (public.is_admin());

CREATE POLICY "Gestion administrateur des liaisons expéditions-commandes"
    ON public.shipment_orders FOR ALL
    USING (public.is_admin());

CREATE POLICY "Lecture des événements d'expédition pour ses commandes"
    ON public.shipment_events FOR SELECT
    USING (
        public.is_admin() OR
        EXISTS (
            SELECT 1 FROM public.shipment_orders so
            JOIN public.orders o ON o.id = so.order_id
            WHERE so.shipment_id = public.shipment_events.shipment_id AND o.user_id = auth.uid()
        )
    );

CREATE POLICY "Gestion administrateur des événements d'expédition"
    ON public.shipment_events FOR ALL
    USING (public.is_admin());

-- M. PAYMENTS & PAYMENT_ATTEMPTS
CREATE POLICY "Lecture de ses propres paiements"
    ON public.payments FOR SELECT
    USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Gestion administrateur des paiements"
    ON public.payments FOR ALL
    USING (public.is_admin());

CREATE POLICY "Lecture de ses tentatives de paiement"
    ON public.payment_attempts FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.orders o
        WHERE o.id = order_id AND (o.user_id = auth.uid() OR public.is_admin())
    ));

CREATE POLICY "Gestion administrateur des tentatives de paiement"
    ON public.payment_attempts FOR ALL
    USING (public.is_admin());

-- N. WEBHOOK_EVENTS (Strictement interne : service_role uniquement)
CREATE POLICY "Accès service_role uniquement pour webhook_events"
    ON public.webhook_events FOR ALL
    USING (auth.role() = 'service_role');

-- O. DOCUMENTS
CREATE POLICY "Lecture de ses propres documents ou documents publics"
    ON public.documents FOR SELECT
    USING (
        visibility = 'public' OR
        auth.uid() = user_id OR
        public.is_admin()
    );

CREATE POLICY "Gestion administrateur des documents"
    ON public.documents FOR ALL
    USING (public.is_admin());

-- P. NOTIFICATIONS
CREATE POLICY "Lecture de ses propres notifications"
    ON public.notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Mise à jour (lecture) de ses propres notifications"
    ON public.notifications FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Gestion administrateur des notifications"
    ON public.notifications FOR ALL
    USING (public.is_admin());

-- Q. FAVORITES
CREATE POLICY "Gestion de ses propres favoris"
    ON public.favorites FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- R. CART_ITEMS
CREATE POLICY "Gestion de son propre panier"
    ON public.cart_items FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- S. PLATFORM_SETTINGS
CREATE POLICY "Lecture publique des paramètres de la plateforme"
    ON public.platform_settings FOR SELECT
    USING (true);

CREATE POLICY "Modification administrateur des paramètres de la plateforme"
    ON public.platform_settings FOR ALL
    USING (public.is_admin());

-- T. ORDER_COSTS & PLATFORM_REVENUES (Strictement internes - Confidentialité financière absolue)
CREATE POLICY "Accès strictement administrateur finance et super_admin sur les coûts"
    ON public.order_costs FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role IN ('super_admin', 'finance')
        )
    );

CREATE POLICY "Accès strictement administrateur finance et super_admin sur les revenus"
    ON public.platform_revenues FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role IN ('super_admin', 'finance')
        )
    );

-- U. AUDIT_LOGS
CREATE POLICY "Lecture des journaux d'audit par les super_admins"
    ON public.audit_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role = 'super_admin'
        )
    );

CREATE POLICY "Insertion des logs d'audit par le service_role ou staff"
    ON public.audit_logs FOR INSERT
    WITH CHECK (true);
