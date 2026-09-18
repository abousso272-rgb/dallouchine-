-- ==============================================================================
-- SCHEMA SUPABASE : GESTION DES PAIEMENTS ET TRANSACTIONS GENIUSPAY
-- SinoSenegal - Plateforme Sourcing & E-commerce Chine-Sénégal
-- ==============================================================================

-- 1. EXTENSIONS & TYPES ÉNUMÉRÉS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Types de statuts de paiement (Spécifique aux passerelles de paiement comme GeniusPay)
DO $$ BEGIN
    CREATE TYPE payment_status_enum AS ENUM (
        'pending',
        'paid',
        'failed',
        'cancelled',
        'refunded',
        'expired'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Types de statuts de commande interne
DO $$ BEGIN
    CREATE TYPE order_status_enum AS ENUM (
        'pending_payment',
        'paid',
        'processing',
        'purchased_in_china',
        'quality_control_passed',
        'shipped_from_china',
        'in_transit',
        'arrived_in_senegal',
        'customs_cleared',
        'arrived_at_hub',
        'ready_for_pickup',
        'out_for_delivery',
        'delivered',
        'cancelled'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. TABLE DES COMMANDES (Si non existante ou pour alignement des contraintes)
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tracking_code VARCHAR(32) UNIQUE NOT NULL,
    user_id UUID NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(64) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_city VARCHAR(100) NOT NULL,
    subtotal_xof NUMERIC(14, 2) NOT NULL DEFAULT 0,
    shipping_fee_xof NUMERIC(14, 2) NOT NULL DEFAULT 0,
    discount_amount_xof NUMERIC(14, 2) NOT NULL DEFAULT 0,
    total_xof NUMERIC(14, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL DEFAULT 'wave',
    payment_status payment_status_enum NOT NULL DEFAULT 'pending',
    order_status order_status_enum NOT NULL DEFAULT 'pending_payment',
    delivery_type VARCHAR(50) NOT NULL DEFAULT 'hub_pickup',
    hub_location_id VARCHAR(64) NULL,
    delivery_address JSONB NULL,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    notes TEXT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    paid_at TIMESTAMP WITH TIME ZONE NULL
);

-- Index sur orders
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_tracking_code ON public.orders(tracking_code);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

-- 3. TABLE DES PAIEMENTS (Couche d'abstraction des transactions financières)
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    user_id UUID NULL,
    provider VARCHAR(50) NOT NULL DEFAULT 'geniuspay',
    provider_transaction_id VARCHAR(255) UNIQUE NULL,
    provider_reference VARCHAR(255) NULL,
    amount NUMERIC(14, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'XOF',
    status payment_status_enum NOT NULL DEFAULT 'pending',
    payment_method VARCHAR(50) NULL,
    checkout_url TEXT NULL,
    customer_email VARCHAR(255) NULL,
    customer_phone VARCHAR(64) NULL,
    error_code VARCHAR(100) NULL,
    error_message TEXT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    raw_provider_response JSONB NULL,
    expires_at TIMESTAMP WITH TIME ZONE NULL,
    paid_at TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index sur payments
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_provider_tx_id ON public.payments(provider_transaction_id);
CREATE INDEX IF NOT EXISTS idx_payments_provider_ref ON public.payments(provider_reference);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.payments(created_at DESC);

-- 4. TABLE DES TENTATIVES DE PAIEMENT (Historique d'audit multi-tentatives)
CREATE TABLE IF NOT EXISTS public.payment_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    attempt_number INT NOT NULL DEFAULT 1,
    status payment_status_enum NOT NULL DEFAULT 'pending',
    provider_transaction_id VARCHAR(255) NULL,
    error_details TEXT NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_payment_attempts_payment_id ON public.payment_attempts(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_attempts_order_id ON public.payment_attempts(order_id);

-- 5. TABLE DES LOGS DE WEBHOOKS (Idempotence & Anti-Rejeu)
CREATE TABLE IF NOT EXISTS public.webhook_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider VARCHAR(50) NOT NULL DEFAULT 'geniuspay',
    event_type VARCHAR(100) NOT NULL,
    event_id VARCHAR(255) UNIQUE NULL,
    provider_transaction_id VARCHAR(255) NULL,
    signature_header VARCHAR(255) NULL,
    payload JSONB NOT NULL,
    processed BOOLEAN NOT NULL DEFAULT false,
    processing_error TEXT NULL,
    processed_at TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_webhook_logs_event_id ON public.webhook_logs(event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_provider_tx_id ON public.webhook_logs(provider_transaction_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON public.webhook_logs(created_at DESC);

-- 6. SÉCURITÉ ROW LEVEL SECURITY (RLS)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- Politiques pour la table orders
CREATE POLICY "Les utilisateurs peuvent voir leurs propres commandes" 
    ON public.orders FOR SELECT 
    USING (auth.uid() = user_id OR auth.uid() IS NULL);

CREATE POLICY "Les administrateurs ont accès total aux commandes" 
    ON public.orders FOR ALL 
    USING (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'app_role' = 'SUPER_ADMIN');

-- Politiques pour la table payments
CREATE POLICY "Les utilisateurs peuvent voir leurs propres paiements" 
    ON public.payments FOR SELECT 
    USING (auth.uid() = user_id OR auth.uid() IS NULL);

CREATE POLICY "Les administrateurs ont accès total aux paiements" 
    ON public.payments FOR ALL 
    USING (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'app_role' = 'SUPER_ADMIN');

-- Politiques pour webhook_logs (Seul le serveur / service_role a accès)
CREATE POLICY "Accès service_role uniquement pour webhook_logs" 
    ON public.webhook_logs FOR ALL 
    USING (auth.role() = 'service_role');
