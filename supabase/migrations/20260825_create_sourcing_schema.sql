-- ==============================================================================
-- SCHEMA SUPABASE : SOURCING RÉEL, FOURNISSEURS, DEMANDES CLIENT ET DEVIS (ÉTAPE 9)
-- SinoSenegal / Dallou Chine - Plateforme Sourcing & Logistique Chine -> Sénégal
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ENUMS POUR LE SOURCING
DO $$ BEGIN
    CREATE TYPE sourcing_status_enum AS ENUM (
        'new',
        'researching',
        'supplier_found',
        'negotiating',
        'quote_ready',
        'quote_sent',
        'accepted',
        'rejected',
        'ordered',
        'completed',
        'cancelled'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE sourcing_quote_status_enum AS ENUM (
        'draft',
        'sent',
        'accepted',
        'rejected',
        'expired',
        'superseded'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. TABLE DES FOURNISSEURS (SUPPLIERS)
CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    platform VARCHAR(64) NOT NULL DEFAULT '1688', -- 1688, alibaba, taobao, direct_factory, yiwu_market, other
    product_url TEXT NULL,
    contact_person VARCHAR(255) NULL,
    contact_phone VARCHAR(64) NULL,
    contact_wechat VARCHAR(64) NULL,
    contact_email VARCHAR(255) NULL,
    country VARCHAR(100) NOT NULL DEFAULT 'Chine',
    city VARCHAR(100) NOT NULL DEFAULT 'Guangzhou',
    supplier_code VARCHAR(64) UNIQUE NOT NULL,
    moq INT NOT NULL DEFAULT 1,
    supplier_price_cny NUMERIC(14, 2) NULL,
    supplier_price_xof NUMERIC(14, 2) NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'CNY',
    lead_time_days INT NULL DEFAULT 15,
    customization_available BOOLEAN NOT NULL DEFAULT false,
    rating NUMERIC(3, 2) NOT NULL DEFAULT 4.8,
    verification_status VARCHAR(50) NOT NULL DEFAULT 'verified', -- pending, verified, preferred, suspended
    -- Notes internes strictement confidentielles
    internal_notes TEXT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_suppliers_code ON public.suppliers(supplier_code);
CREATE INDEX IF NOT EXISTS idx_suppliers_platform ON public.suppliers(platform);

-- 3. TABLE DES DEMANDES DE SOURCING (SOURCING_REQUESTS)
CREATE TABLE IF NOT EXISTS public.sourcing_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(64) UNIQUE NOT NULL, -- e.g. SRC-2026-0089
    customer_id UUID NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_company VARCHAR(255) NULL,
    customer_phone VARCHAR(64) NOT NULL,
    customer_email VARCHAR(255) NULL,
    
    product_name VARCHAR(255) NOT NULL,
    product_description TEXT NULL,
    product_link TEXT NULL,
    product_images JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    quantity INT NOT NULL DEFAULT 1,
    target_budget NUMERIC(14, 2) NOT NULL DEFAULT 0,
    currency VARCHAR(10) NOT NULL DEFAULT 'XOF',
    
    specifications TEXT NULL,
    customization TEXT NULL,
    desired_deadline TIMESTAMP WITH TIME ZONE NULL,
    destination VARCHAR(255) NOT NULL DEFAULT 'Dakar, Sénégal',
    notes TEXT NULL,
    
    status sourcing_status_enum NOT NULL DEFAULT 'new',
    
    assigned_sourcer_id UUID NULL,
    assigned_sourcer_name VARCHAR(255) NULL,
    assigned_at TIMESTAMP WITH TIME ZONE NULL,
    assigned_by UUID NULL,
    
    -- Préparation Architecture IA (Données séparées des données validées)
    ai_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sourcing_code ON public.sourcing_requests(code);
CREATE INDEX IF NOT EXISTS idx_sourcing_customer_id ON public.sourcing_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_sourcing_status ON public.sourcing_requests(status);
CREATE INDEX IF NOT EXISTS idx_sourcing_assigned_sourcer ON public.sourcing_requests(assigned_sourcer_id);

-- 4. TABLE DE LIAISON MULTI-FOURNISSEURS PAR DEMANDE (SOURCING_REQUEST_SUPPLIERS)
CREATE TABLE IF NOT EXISTS public.sourcing_request_suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID NOT NULL REFERENCES public.sourcing_requests(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
    
    initial_price_cny NUMERIC(14, 2) NULL,
    negotiated_price_cny NUMERIC(14, 2) NULL,
    unit_price_xof NUMERIC(14, 2) NULL,
    moq INT NOT NULL DEFAULT 1,
    lead_time_days INT NULL DEFAULT 15,
    sample_available BOOLEAN NOT NULL DEFAULT false,
    sample_cost_cny NUMERIC(14, 2) NULL,
    customization_confirmed BOOLEAN NOT NULL DEFAULT false,
    
    -- Distinction stricte entre notes internes et notes publiques devis
    internal_notes TEXT NULL,
    client_visible_notes TEXT NULL,
    is_selected BOOLEAN NOT NULL DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_req_suppliers_req_id ON public.sourcing_request_suppliers(request_id);
CREATE INDEX IF NOT EXISTS idx_req_suppliers_sup_id ON public.sourcing_request_suppliers(supplier_id);

-- 5. TABLE DES DEVIS (SOURCING_QUOTES) & VERSIONNAGE
CREATE TABLE IF NOT EXISTS public.sourcing_quotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(64) UNIQUE NOT NULL, -- e.g. DEV-2026-0048
    sourcing_request_id UUID NOT NULL REFERENCES public.sourcing_requests(id) ON DELETE CASCADE,
    customer_id UUID NULL,
    assigned_sourcer_id UUID NULL,
    selected_supplier_id UUID NULL REFERENCES public.suppliers(id) ON DELETE SET NULL,
    
    version INT NOT NULL DEFAULT 1,
    status sourcing_quote_status_enum NOT NULL DEFAULT 'draft',
    
    quantity INT NOT NULL DEFAULT 1,
    unit_product_price_xof NUMERIC(14, 2) NOT NULL DEFAULT 0,
    total_product_price_xof NUMERIC(14, 2) NOT NULL DEFAULT 0,
    sourcing_fee_xof NUMERIC(14, 2) NOT NULL DEFAULT 0,
    inspection_fee_xof NUMERIC(14, 2) NOT NULL DEFAULT 0,
    estimated_logistics_xof NUMERIC(14, 2) NOT NULL DEFAULT 0,
    estimated_customs_xof NUMERIC(14, 2) NOT NULL DEFAULT 0,
    additional_fees_xof NUMERIC(14, 2) NOT NULL DEFAULT 0,
    
    -- Montant final client certifié serveur
    total_client_xof NUMERIC(14, 2) NOT NULL DEFAULT 0,
    currency VARCHAR(10) NOT NULL DEFAULT 'XOF',
    
    -- Marge interne strictement masquée au client
    internal_margin_xof NUMERIC(14, 2) NULL DEFAULT 0,
    internal_notes TEXT NULL,
    
    deposit_required_percent INT NOT NULL DEFAULT 40,
    deposit_amount_xof NUMERIC(14, 2) NOT NULL DEFAULT 0,
    balance_due_xof NUMERIC(14, 2) NOT NULL DEFAULT 0,
    
    lead_time_days VARCHAR(100) NOT NULL DEFAULT '15-20 jours',
    transport_mode VARCHAR(50) NOT NULL DEFAULT 'sea',
    conditions JSONB NOT NULL DEFAULT '[]'::jsonb,
    valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
    
    sent_at TIMESTAMP WITH TIME ZONE NULL,
    accepted_at TIMESTAMP WITH TIME ZONE NULL,
    accepted_by UUID NULL,
    rejected_at TIMESTAMP WITH TIME ZONE NULL,
    rejected_reason TEXT NULL,
    
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sourcing_quotes_req_id ON public.sourcing_quotes(sourcing_request_id);
CREATE INDEX IF NOT EXISTS idx_sourcing_quotes_customer ON public.sourcing_quotes(customer_id);
CREATE INDEX IF NOT EXISTS idx_sourcing_quotes_status ON public.sourcing_quotes(status);

-- 6. TABLE DES PIÈCES JOINTES ET DOCUMENTS (SOURCING_ATTACHMENTS)
CREATE TABLE IF NOT EXISTS public.sourcing_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sourcing_request_id UUID NOT NULL REFERENCES public.sourcing_requests(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_type VARCHAR(100) NOT NULL, -- image/jpeg, application/pdf, etc.
    file_size_bytes INT NOT NULL DEFAULT 0,
    is_internal BOOLEAN NOT NULL DEFAULT false, -- si true: confidentiel équipe interne
    uploaded_by UUID NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sourcing_attach_req_id ON public.sourcing_attachments(sourcing_request_id);
CREATE INDEX IF NOT EXISTS idx_sourcing_attach_internal ON public.sourcing_attachments(is_internal);

-- 7. TABLE IMMUTABLE DES ÉVÉNEMENTS D'AUDIT (SOURCING_EVENTS)
CREATE TABLE IF NOT EXISTS public.sourcing_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sourcing_request_id UUID NOT NULL REFERENCES public.sourcing_requests(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    previous_status VARCHAR(100) NULL,
    new_status VARCHAR(100) NULL,
    description TEXT NOT NULL,
    actor_user_id UUID NULL,
    actor_role VARCHAR(64) NULL,
    actor_name VARCHAR(255) NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sourcing_events_req_id ON public.sourcing_events(sourcing_request_id);
CREATE INDEX IF NOT EXISTS idx_sourcing_events_created_at ON public.sourcing_events(created_at ASC);

-- 8. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sourcing_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sourcing_request_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sourcing_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sourcing_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sourcing_events ENABLE ROW LEVEL SECURITY;

-- SUPPLIERS : Lecture publique/authentifiée restreinte, administration réservée
CREATE POLICY "Lecture des usines vérifiées"
    ON public.suppliers FOR SELECT
    USING (verification_status = 'verified' OR auth.jwt() ->> 'role' IN ('admin', 'SUPER_ADMIN', 'OPERATIONS', 'SOURCING'));

CREATE POLICY "Gestion des usines par admin/sourcer"
    ON public.suppliers FOR ALL
    USING (auth.jwt() ->> 'role' IN ('admin', 'SUPER_ADMIN', 'OPERATIONS', 'SOURCING'));

-- SOURCING_REQUESTS :
CREATE POLICY "Client voit ses propres demandes de sourcing"
    ON public.sourcing_requests FOR SELECT
    USING (
        auth.uid() = customer_id
        OR auth.jwt() ->> 'role' IN ('admin', 'SUPER_ADMIN', 'OPERATIONS', 'SOURCING')
    );

CREATE POLICY "Client insère sa propre demande"
    ON public.sourcing_requests FOR INSERT
    WITH CHECK (auth.uid() = customer_id OR customer_id IS NULL OR auth.jwt() ->> 'role' IN ('admin', 'SUPER_ADMIN', 'OPERATIONS', 'SOURCING'));

CREATE POLICY "Sourcer et Admin modifient les demandes"
    ON public.sourcing_requests FOR UPDATE
    USING (auth.jwt() ->> 'role' IN ('admin', 'SUPER_ADMIN', 'OPERATIONS', 'SOURCING'));

-- SOURCING_QUOTES :
CREATE POLICY "Client voit ses devis"
    ON public.sourcing_quotes FOR SELECT
    USING (
        auth.uid() = customer_id
        OR auth.jwt() ->> 'role' IN ('admin', 'SUPER_ADMIN', 'OPERATIONS', 'SOURCING')
    );

CREATE POLICY "Gestion devis par admin/sourcer"
    ON public.sourcing_quotes FOR ALL
    USING (auth.jwt() ->> 'role' IN ('admin', 'SUPER_ADMIN', 'OPERATIONS', 'SOURCING'));

-- SOURCING_ATTACHMENTS :
CREATE POLICY "Client voit les pièces jointes publiques de ses demandes"
    ON public.sourcing_attachments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.sourcing_requests r
            WHERE r.id = sourcing_attachments.sourcing_request_id
            AND r.customer_id = auth.uid()
            AND sourcing_attachments.is_internal = false
        )
        OR auth.jwt() ->> 'role' IN ('admin', 'SUPER_ADMIN', 'OPERATIONS', 'SOURCING')
    );

CREATE POLICY "Client peut joindre des fichiers à ses demandes"
    ON public.sourcing_attachments FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.sourcing_requests r
            WHERE r.id = sourcing_attachments.sourcing_request_id
            AND r.customer_id = auth.uid()
        )
        OR auth.jwt() ->> 'role' IN ('admin', 'SUPER_ADMIN', 'OPERATIONS', 'SOURCING')
    );

-- SOURCING_EVENTS :
CREATE POLICY "Client lit l'historique public de ses demandes"
    ON public.sourcing_events FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.sourcing_requests r
            WHERE r.id = sourcing_events.sourcing_request_id
            AND (r.customer_id = auth.uid() OR auth.jwt() ->> 'role' IN ('admin', 'SUPER_ADMIN', 'OPERATIONS', 'SOURCING'))
        )
    );

CREATE POLICY "Écriture événements sourcing par admin/sourcer uniquement"
    ON public.sourcing_events FOR INSERT
    WITH CHECK (auth.jwt() ->> 'role' IN ('admin', 'SUPER_ADMIN', 'OPERATIONS', 'SOURCING') OR auth.role() = 'service_role');
