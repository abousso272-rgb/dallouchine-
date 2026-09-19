-- ==============================================================================
-- SCHEMA SUPABASE : GESTION DE LA LOGISTIQUE, EXPÉDITIONS ET TRACKING RÉEL (ÉTAPE 8)
-- SinoSenegal / Dallou Chine - Plateforme Sourcing & Logistique Chine -> Sénégal
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ENUM STATUTS D'EXPÉDITION (State Machine 11 étapes)
DO $$ BEGIN
    CREATE TYPE shipment_status_enum AS ENUM (
        'awaiting_supplier',
        'supplier_confirmed',
        'preparing_in_china',
        'ready_to_ship',
        'shipped_from_china',
        'in_transit',
        'arrived_senegal',
        'customs',
        'at_hub',
        'out_for_delivery',
        'delivered',
        'cancelled'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. TABLE TRANSPORTEURS (CARRIERS)
CREATE TABLE IF NOT EXISTS public.carriers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    contact VARCHAR(255) NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    mode VARCHAR(50) NOT NULL DEFAULT 'air', -- 'air', 'sea', 'express'
    rate_per_kg_xof NUMERIC(14, 2) NULL,
    rate_per_cbm_xof NUMERIC(14, 2) NULL,
    min_charge_xof NUMERIC(14, 2) NULL,
    volumetric_factor NUMERIC(10, 2) NULL DEFAULT 6000,
    base_transit_days_min INT NULL DEFAULT 5,
    base_transit_days_max INT NULL DEFAULT 10,
    notes TEXT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_carriers_code ON public.carriers(code);
CREATE INDEX IF NOT EXISTS idx_carriers_active ON public.carriers(active);

-- 3. TABLE HUBS LOGISTIQUES
CREATE TABLE IF NOT EXISTS public.hubs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    city VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    phone VARCHAR(64) NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    manager_name VARCHAR(255) NULL,
    max_capacity INT NOT NULL DEFAULT 500,
    active_parcels_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_hubs_code ON public.hubs(code);
CREATE INDEX IF NOT EXISTS idx_hubs_city ON public.hubs(city);

-- 4. TABLE EXPÉDITIONS (SHIPMENTS)
-- Supporte plusieurs expéditions pour une même commande (order_id)
CREATE TABLE IF NOT EXISTS public.shipments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    order_code VARCHAR(64) NOT NULL,
    user_id UUID NULL,
    tracking_code VARCHAR(64) UNIQUE NOT NULL,
    carrier_id UUID NULL REFERENCES public.carriers(id) ON DELETE SET NULL,
    hub_id UUID NULL REFERENCES public.hubs(id) ON DELETE SET NULL,
    origin VARCHAR(255) NOT NULL DEFAULT 'Guangzhou, Chine',
    destination VARCHAR(255) NOT NULL DEFAULT 'Dakar, Sénégal',
    transport_mode VARCHAR(50) NOT NULL DEFAULT 'air', -- 'air', 'sea', 'express'
    status shipment_status_enum NOT NULL DEFAULT 'awaiting_supplier',
    estimated_departure TIMESTAMP WITH TIME ZONE NULL,
    actual_departure TIMESTAMP WITH TIME ZONE NULL,
    estimated_arrival TIMESTAMP WITH TIME ZONE NULL,
    actual_arrival TIMESTAMP WITH TIME ZONE NULL,
    notes TEXT NULL,
    -- Coûts logistiques internes strictement masqués au client
    internal_cost_estimated_xof NUMERIC(14, 2) NULL DEFAULT 0,
    internal_cost_confirmed_xof NUMERIC(14, 2) NULL DEFAULT 0,
    internal_cost_actual_xof NUMERIC(14, 2) NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_shipments_order_id ON public.shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_shipments_user_id ON public.shipments(user_id);
CREATE INDEX IF NOT EXISTS idx_shipments_tracking_code ON public.shipments(tracking_code);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON public.shipments(status);
CREATE INDEX IF NOT EXISTS idx_shipments_carrier_id ON public.shipments(carrier_id);
CREATE INDEX IF NOT EXISTS idx_shipments_hub_id ON public.shipments(hub_id);
CREATE INDEX IF NOT EXISTS idx_shipments_created_at ON public.shipments(created_at DESC);

-- 5. TABLE ÉVÉNEMENTS LOGISTIQUES IMMUTABLES (SHIPMENT_EVENTS)
CREATE TABLE IF NOT EXISTS public.shipment_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    previous_status VARCHAR(100) NOT NULL,
    new_status VARCHAR(100) NOT NULL,
    location VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    actor_user_id UUID NULL,
    actor_role VARCHAR(64) NULL,
    actor_name VARCHAR(255) NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_shipment_events_shipment_id ON public.shipment_events(shipment_id);
CREATE INDEX IF NOT EXISTS idx_shipment_events_created_at ON public.shipment_events(created_at ASC);

-- 6. TABLE DOCUMENTS ASSOCIÉS AUX EXPÉDITIONS (SHIPMENT_DOCUMENTS)
CREATE TABLE IF NOT EXISTS public.shipment_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    doc_type VARCHAR(100) NOT NULL, -- packing_list, commercial_invoice, bill_of_lading, customs_declaration
    file_url TEXT NOT NULL,
    is_internal BOOLEAN NOT NULL DEFAULT false, -- Si true: STRICTEMENT INVISIBLE POUR LE CLIENT
    uploaded_by UUID NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_shipment_docs_shipment_id ON public.shipment_documents(shipment_id);
CREATE INDEX IF NOT EXISTS idx_shipment_docs_is_internal ON public.shipment_documents(is_internal);

-- 7. TABLE NOTIFICATIONS IN-APP
CREATE TABLE IF NOT EXISTS public.in_app_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'logistics',
    shipment_id UUID NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
    tracking_code VARCHAR(64) NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.in_app_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.in_app_notifications(is_read);

-- 8. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.carriers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipment_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.in_app_notifications ENABLE ROW LEVEL SECURITY;

-- CARRIERS : Lecture publique/authentifiée des transporteurs actifs
CREATE POLICY "Lecture des transporteurs actifs par tous"
    ON public.carriers FOR SELECT
    USING (active = true OR auth.jwt() ->> 'role' IN ('admin', 'SUPER_ADMIN', 'OPERATIONS', 'LOGISTICS'));

CREATE POLICY "Gestion des transporteurs par admin/operations"
    ON public.carriers FOR ALL
    USING (auth.jwt() ->> 'role' IN ('admin', 'SUPER_ADMIN', 'OPERATIONS', 'LOGISTICS'));

-- HUBS : Lecture publique/authentifiée des hubs actifs
CREATE POLICY "Lecture des hubs par tous"
    ON public.hubs FOR SELECT
    USING (active = true OR auth.jwt() ->> 'role' IN ('admin', 'SUPER_ADMIN', 'OPERATIONS', 'LOGISTICS'));

CREATE POLICY "Gestion des hubs par admin/operations"
    ON public.hubs FOR ALL
    USING (auth.jwt() ->> 'role' IN ('admin', 'SUPER_ADMIN', 'OPERATIONS', 'LOGISTICS'));

-- SHIPMENTS : 
-- Client ne peut voir QUE ses propres expéditions
CREATE POLICY "Client voit ses propres expéditions"
    ON public.shipments FOR SELECT
    USING (
        auth.uid() = user_id 
        OR auth.jwt() ->> 'role' IN ('admin', 'SUPER_ADMIN', 'OPERATIONS', 'LOGISTICS')
    );

-- Seuls les administrateurs / opérations / logistique peuvent créer ou modifier un shipment
CREATE POLICY "Admin et Operations créent et modifient les expéditions"
    ON public.shipments FOR ALL
    USING (auth.jwt() ->> 'role' IN ('admin', 'SUPER_ADMIN', 'OPERATIONS', 'LOGISTICS'));

-- SHIPMENT_EVENTS :
-- Client peut lire l'historique uniquement pour ses expéditions
CREATE POLICY "Client lit les événements de ses propres expéditions"
    ON public.shipment_events FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.shipments s
            WHERE s.id = shipment_events.shipment_id
            AND (s.user_id = auth.uid() OR auth.jwt() ->> 'role' IN ('admin', 'SUPER_ADMIN', 'OPERATIONS', 'LOGISTICS'))
        )
    );

-- Seul le serveur / opérations peut insérer un événement (immuable, pas d'update ni delete)
CREATE POLICY "Écriture événements logistiques par opérations uniquement"
    ON public.shipment_events FOR INSERT
    WITH CHECK (auth.jwt() ->> 'role' IN ('admin', 'SUPER_ADMIN', 'OPERATIONS', 'LOGISTICS') OR auth.role() = 'service_role');

-- INTERDICTION FORMELLE de UPDATE ou DELETE sur shipment_events (Audit Trail Immuable)
-- Aucune policy UPDATE ou DELETE n'est créée sur shipment_events

-- SHIPMENT_DOCUMENTS :
-- Documents internes masqués aux clients !
CREATE POLICY "Client voit uniquement les documents publics de son expédition"
    ON public.shipment_documents FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.shipments s
            WHERE s.id = shipment_documents.shipment_id
            AND s.user_id = auth.uid()
            AND shipment_documents.is_internal = false
        )
        OR auth.jwt() ->> 'role' IN ('admin', 'SUPER_ADMIN', 'OPERATIONS', 'LOGISTICS')
    );

CREATE POLICY "Gestion des documents par admin/operations"
    ON public.shipment_documents FOR ALL
    USING (auth.jwt() ->> 'role' IN ('admin', 'SUPER_ADMIN', 'OPERATIONS', 'LOGISTICS'));

-- IN_APP_NOTIFICATIONS :
CREATE POLICY "Client voit ses notifications"
    ON public.in_app_notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Client met à jour le statut lu de sa notification"
    ON public.in_app_notifications FOR UPDATE
    USING (auth.uid() = user_id);
