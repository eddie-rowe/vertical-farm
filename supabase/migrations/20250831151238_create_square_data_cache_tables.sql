-- Migration: Create Square Data Cache Tables
-- Description: Creates all necessary cache tables for Square POS data with proper RLS policies
-- Issue: #56 - Complete Square POS integration

-- =====================================================
-- FOREIGN KEY VALIDATION
-- =====================================================

-- Ensure user_square_configs table exists before creating dependent tables
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_square_configs' AND table_schema = 'public') THEN
        RAISE EXCEPTION 'Table user_square_configs does not exist. Please run the Square configuration migration first.';
    END IF;
END $$;

-- =====================================================
-- CONSTRAINTS AND VALIDATIONS  
-- =====================================================

-- Add constraint function for positive money amounts
CREATE OR REPLACE FUNCTION validate_positive_amount()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.amount IS NOT NULL AND NEW.amount < 0 THEN
        RAISE EXCEPTION 'Amount must be positive or zero, got: %', NEW.amount;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SQUARE DATA CACHE TABLES
-- =====================================================

-- Cache table for Square customers
CREATE TABLE IF NOT EXISTS public.square_cache_customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    config_id UUID NOT NULL REFERENCES public.user_square_configs(id) ON DELETE CASCADE,
    
    -- Square customer data
    square_customer_id TEXT NOT NULL,
    given_name TEXT,
    family_name TEXT,
    email_address TEXT,
    phone_number TEXT,
    company_name TEXT,
    
    -- Cache metadata
    cache_key TEXT NOT NULL,
    cached_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    ttl_minutes INTEGER DEFAULT 1440, -- 24 hours
    last_synced_at TIMESTAMPTZ DEFAULT NOW(),
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    UNIQUE(user_id, config_id, square_customer_id),
    UNIQUE(user_id, cache_key)
);

-- Cache table for Square orders
CREATE TABLE IF NOT EXISTS public.square_cache_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    config_id UUID NOT NULL REFERENCES public.user_square_configs(id) ON DELETE CASCADE,
    
    -- Square order data
    square_order_id TEXT NOT NULL,
    location_id TEXT,
    state TEXT,
    total_amount BIGINT, -- Square uses cents
    currency TEXT DEFAULT 'USD',
    created_at_square TIMESTAMPTZ,
    updated_at_square TIMESTAMPTZ,
    
    -- Derived/calculated fields for business metrics
    customer_id TEXT,
    line_items JSONB,
    fulfillments JSONB,
    
    -- Cache metadata  
    cache_key TEXT NOT NULL,
    cached_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    ttl_minutes INTEGER DEFAULT 60, -- 1 hour (orders change frequently)
    last_synced_at TIMESTAMPTZ DEFAULT NOW(),
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    UNIQUE(user_id, config_id, square_order_id),
    UNIQUE(user_id, cache_key)
);

-- Cache table for Square payments
CREATE TABLE IF NOT EXISTS public.square_cache_payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    config_id UUID NOT NULL REFERENCES public.user_square_configs(id) ON DELETE CASCADE,
    
    -- Square payment data
    square_payment_id TEXT NOT NULL,
    order_id TEXT,
    amount BIGINT NOT NULL, -- Square uses cents
    currency TEXT DEFAULT 'USD',
    status TEXT,
    source_type TEXT,
    card_details JSONB,
    created_at_square TIMESTAMPTZ,
    
    -- Cache metadata
    cache_key TEXT NOT NULL,
    cached_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    ttl_minutes INTEGER DEFAULT 1440, -- 24 hours (payments are immutable)
    last_synced_at TIMESTAMPTZ DEFAULT NOW(),
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    UNIQUE(user_id, config_id, square_payment_id),
    UNIQUE(user_id, cache_key)
);

-- Cache table for Square products/catalog items
CREATE TABLE IF NOT EXISTS public.square_cache_products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    config_id UUID NOT NULL REFERENCES public.user_square_configs(id) ON DELETE CASCADE,
    
    -- Square product data
    square_item_id TEXT NOT NULL,
    name TEXT,
    description TEXT,
    category_id TEXT,
    variations JSONB,
    image_url TEXT,
    is_deleted BOOLEAN DEFAULT FALSE,
    
    -- Cache metadata
    cache_key TEXT NOT NULL,
    cached_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    ttl_minutes INTEGER DEFAULT 720, -- 12 hours
    last_synced_at TIMESTAMPTZ DEFAULT NOW(),
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    UNIQUE(user_id, config_id, square_item_id),
    UNIQUE(user_id, cache_key)
);

-- Cache table for Square inventory
CREATE TABLE IF NOT EXISTS public.square_cache_inventory (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    config_id UUID NOT NULL REFERENCES public.user_square_configs(id) ON DELETE CASCADE,
    
    -- Square inventory data
    catalog_object_id TEXT NOT NULL,
    location_id TEXT,
    state TEXT,
    quantity TEXT, -- Square returns as string
    calculated_at TIMESTAMPTZ,
    
    -- Cache metadata
    cache_key TEXT NOT NULL,
    cached_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    ttl_minutes INTEGER DEFAULT 30, -- 30 minutes (inventory changes frequently)
    last_synced_at TIMESTAMPTZ DEFAULT NOW(),
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    UNIQUE(user_id, config_id, catalog_object_id, location_id),
    UNIQUE(user_id, cache_key)
);

-- Cache table for Square refunds
CREATE TABLE IF NOT EXISTS public.square_cache_refunds (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    config_id UUID NOT NULL REFERENCES public.user_square_configs(id) ON DELETE CASCADE,
    
    -- Square refund data
    square_refund_id TEXT NOT NULL,
    payment_id TEXT,
    order_id TEXT,
    location_id TEXT,
    amount BIGINT NOT NULL, -- Square uses cents
    currency TEXT DEFAULT 'USD',
    status TEXT,
    reason TEXT,
    created_at_square TIMESTAMPTZ,
    
    -- Cache metadata
    cache_key TEXT NOT NULL,
    cached_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    ttl_minutes INTEGER DEFAULT 1440, -- 24 hours (refunds are immutable)
    last_synced_at TIMESTAMPTZ DEFAULT NOW(),
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    UNIQUE(user_id, config_id, square_refund_id),
    UNIQUE(user_id, cache_key)
);

-- Cache table for Square disputes
CREATE TABLE IF NOT EXISTS public.square_cache_disputes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    config_id UUID NOT NULL REFERENCES public.user_square_configs(id) ON DELETE CASCADE,
    
    -- Square dispute data
    square_dispute_id TEXT NOT NULL,
    amount BIGINT NOT NULL, -- Square uses cents
    currency TEXT DEFAULT 'USD',
    reason TEXT,
    state TEXT,
    due_at TIMESTAMPTZ,
    disputed_payment_id TEXT,
    evidence_ids JSONB,
    card_brand TEXT,
    created_at_square TIMESTAMPTZ,
    
    -- Cache metadata
    cache_key TEXT NOT NULL,
    cached_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    ttl_minutes INTEGER DEFAULT 120, -- 2 hours (disputes can change)
    last_synced_at TIMESTAMPTZ DEFAULT NOW(),
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    UNIQUE(user_id, config_id, square_dispute_id),
    UNIQUE(user_id, cache_key)
);

-- Cache table for Square payouts
CREATE TABLE IF NOT EXISTS public.square_cache_payouts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    config_id UUID NOT NULL REFERENCES public.user_square_configs(id) ON DELETE CASCADE,
    
    -- Square payout data
    square_payout_id TEXT NOT NULL,
    status TEXT,
    location_id TEXT,
    amount BIGINT, -- Square uses cents
    currency TEXT DEFAULT 'USD',
    destination_type TEXT,
    destination_id TEXT,
    version INTEGER,
    created_at_square TIMESTAMPTZ,
    
    -- Cache metadata
    cache_key TEXT NOT NULL,
    cached_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    ttl_minutes INTEGER DEFAULT 360, -- 6 hours
    last_synced_at TIMESTAMPTZ DEFAULT NOW(),
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    UNIQUE(user_id, config_id, square_payout_id),
    UNIQUE(user_id, cache_key)
);

-- Cache table for Square team members
CREATE TABLE IF NOT EXISTS public.square_cache_team_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    config_id UUID NOT NULL REFERENCES public.user_square_configs(id) ON DELETE CASCADE,
    
    -- Square team member data
    square_team_member_id TEXT NOT NULL,
    reference_id TEXT,
    is_owner BOOLEAN DEFAULT FALSE,
    status TEXT,
    given_name TEXT,
    family_name TEXT,
    email_address TEXT,
    phone_number TEXT,
    assigned_locations JSONB,
    created_at_square TIMESTAMPTZ,
    
    -- Cache metadata
    cache_key TEXT NOT NULL,
    cached_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    ttl_minutes INTEGER DEFAULT 720, -- 12 hours
    last_synced_at TIMESTAMPTZ DEFAULT NOW(),
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    UNIQUE(user_id, config_id, square_team_member_id),
    UNIQUE(user_id, cache_key)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Customer cache indexes
CREATE INDEX IF NOT EXISTS idx_square_cache_customers_user_config ON public.square_cache_customers(user_id, config_id);
CREATE INDEX IF NOT EXISTS idx_square_cache_customers_cache_key ON public.square_cache_customers(cache_key);
CREATE INDEX IF NOT EXISTS idx_square_cache_customers_cached_at ON public.square_cache_customers(cached_at);
CREATE INDEX IF NOT EXISTS idx_square_cache_customers_email ON public.square_cache_customers(email_address);

-- Order cache indexes
CREATE INDEX IF NOT EXISTS idx_square_cache_orders_user_config ON public.square_cache_orders(user_id, config_id);
CREATE INDEX IF NOT EXISTS idx_square_cache_orders_cache_key ON public.square_cache_orders(cache_key);
CREATE INDEX IF NOT EXISTS idx_square_cache_orders_cached_at ON public.square_cache_orders(cached_at);
CREATE INDEX IF NOT EXISTS idx_square_cache_orders_created_at_square ON public.square_cache_orders(created_at_square DESC);
CREATE INDEX IF NOT EXISTS idx_square_cache_orders_state ON public.square_cache_orders(state);
CREATE INDEX IF NOT EXISTS idx_square_cache_orders_customer ON public.square_cache_orders(customer_id);

-- Payment cache indexes
CREATE INDEX IF NOT EXISTS idx_square_cache_payments_user_config ON public.square_cache_payments(user_id, config_id);
CREATE INDEX IF NOT EXISTS idx_square_cache_payments_cache_key ON public.square_cache_payments(cache_key);
CREATE INDEX IF NOT EXISTS idx_square_cache_payments_cached_at ON public.square_cache_payments(cached_at);
CREATE INDEX IF NOT EXISTS idx_square_cache_payments_created_at_square ON public.square_cache_payments(created_at_square DESC);
CREATE INDEX IF NOT EXISTS idx_square_cache_payments_order ON public.square_cache_payments(order_id);
CREATE INDEX IF NOT EXISTS idx_square_cache_payments_status ON public.square_cache_payments(status);

-- Product cache indexes
CREATE INDEX IF NOT EXISTS idx_square_cache_products_user_config ON public.square_cache_products(user_id, config_id);
CREATE INDEX IF NOT EXISTS idx_square_cache_products_cache_key ON public.square_cache_products(cache_key);
CREATE INDEX IF NOT EXISTS idx_square_cache_products_cached_at ON public.square_cache_products(cached_at);
CREATE INDEX IF NOT EXISTS idx_square_cache_products_name ON public.square_cache_products(name);
CREATE INDEX IF NOT EXISTS idx_square_cache_products_category ON public.square_cache_products(category_id);

-- Inventory cache indexes
CREATE INDEX IF NOT EXISTS idx_square_cache_inventory_user_config ON public.square_cache_inventory(user_id, config_id);
CREATE INDEX IF NOT EXISTS idx_square_cache_inventory_cache_key ON public.square_cache_inventory(cache_key);
CREATE INDEX IF NOT EXISTS idx_square_cache_inventory_cached_at ON public.square_cache_inventory(cached_at);
CREATE INDEX IF NOT EXISTS idx_square_cache_inventory_location ON public.square_cache_inventory(location_id);
CREATE INDEX IF NOT EXISTS idx_square_cache_inventory_calculated_at ON public.square_cache_inventory(calculated_at DESC);

-- Refund cache indexes
CREATE INDEX IF NOT EXISTS idx_square_cache_refunds_user_config ON public.square_cache_refunds(user_id, config_id);
CREATE INDEX IF NOT EXISTS idx_square_cache_refunds_cache_key ON public.square_cache_refunds(cache_key);
CREATE INDEX IF NOT EXISTS idx_square_cache_refunds_cached_at ON public.square_cache_refunds(cached_at);
CREATE INDEX IF NOT EXISTS idx_square_cache_refunds_payment ON public.square_cache_refunds(payment_id);
CREATE INDEX IF NOT EXISTS idx_square_cache_refunds_created_at_square ON public.square_cache_refunds(created_at_square DESC);

-- Dispute cache indexes
CREATE INDEX IF NOT EXISTS idx_square_cache_disputes_user_config ON public.square_cache_disputes(user_id, config_id);
CREATE INDEX IF NOT EXISTS idx_square_cache_disputes_cache_key ON public.square_cache_disputes(cache_key);
CREATE INDEX IF NOT EXISTS idx_square_cache_disputes_cached_at ON public.square_cache_disputes(cached_at);
CREATE INDEX IF NOT EXISTS idx_square_cache_disputes_state ON public.square_cache_disputes(state);
CREATE INDEX IF NOT EXISTS idx_square_cache_disputes_due_at ON public.square_cache_disputes(due_at);

-- Payout cache indexes
CREATE INDEX IF NOT EXISTS idx_square_cache_payouts_user_config ON public.square_cache_payouts(user_id, config_id);
CREATE INDEX IF NOT EXISTS idx_square_cache_payouts_cache_key ON public.square_cache_payouts(cache_key);
CREATE INDEX IF NOT EXISTS idx_square_cache_payouts_cached_at ON public.square_cache_payouts(cached_at);
CREATE INDEX IF NOT EXISTS idx_square_cache_payouts_status ON public.square_cache_payouts(status);
CREATE INDEX IF NOT EXISTS idx_square_cache_payouts_created_at_square ON public.square_cache_payouts(created_at_square DESC);

-- Team member cache indexes
CREATE INDEX IF NOT EXISTS idx_square_cache_team_members_user_config ON public.square_cache_team_members(user_id, config_id);
CREATE INDEX IF NOT EXISTS idx_square_cache_team_members_cache_key ON public.square_cache_team_members(cache_key);
CREATE INDEX IF NOT EXISTS idx_square_cache_team_members_cached_at ON public.square_cache_team_members(cached_at);
CREATE INDEX IF NOT EXISTS idx_square_cache_team_members_status ON public.square_cache_team_members(status);
CREATE INDEX IF NOT EXISTS idx_square_cache_team_members_email ON public.square_cache_team_members(email_address);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all cache tables
ALTER TABLE public.square_cache_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.square_cache_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.square_cache_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.square_cache_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.square_cache_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.square_cache_refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.square_cache_disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.square_cache_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.square_cache_team_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for square_cache_customers
CREATE POLICY "customers_cache_select_own" ON public.square_cache_customers FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "customers_cache_insert_own" ON public.square_cache_customers FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "customers_cache_update_own" ON public.square_cache_customers FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "customers_cache_delete_own" ON public.square_cache_customers FOR DELETE USING (user_id = auth.uid());

-- RLS Policies for square_cache_orders
CREATE POLICY "orders_cache_select_own" ON public.square_cache_orders FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "orders_cache_insert_own" ON public.square_cache_orders FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "orders_cache_update_own" ON public.square_cache_orders FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "orders_cache_delete_own" ON public.square_cache_orders FOR DELETE USING (user_id = auth.uid());

-- RLS Policies for square_cache_payments
CREATE POLICY "payments_cache_select_own" ON public.square_cache_payments FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "payments_cache_insert_own" ON public.square_cache_payments FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "payments_cache_update_own" ON public.square_cache_payments FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "payments_cache_delete_own" ON public.square_cache_payments FOR DELETE USING (user_id = auth.uid());

-- RLS Policies for square_cache_products
CREATE POLICY "products_cache_select_own" ON public.square_cache_products FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "products_cache_insert_own" ON public.square_cache_products FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "products_cache_update_own" ON public.square_cache_products FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "products_cache_delete_own" ON public.square_cache_products FOR DELETE USING (user_id = auth.uid());

-- RLS Policies for square_cache_inventory
CREATE POLICY "inventory_cache_select_own" ON public.square_cache_inventory FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "inventory_cache_insert_own" ON public.square_cache_inventory FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "inventory_cache_update_own" ON public.square_cache_inventory FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "inventory_cache_delete_own" ON public.square_cache_inventory FOR DELETE USING (user_id = auth.uid());

-- RLS Policies for square_cache_refunds
CREATE POLICY "refunds_cache_select_own" ON public.square_cache_refunds FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "refunds_cache_insert_own" ON public.square_cache_refunds FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "refunds_cache_update_own" ON public.square_cache_refunds FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "refunds_cache_delete_own" ON public.square_cache_refunds FOR DELETE USING (user_id = auth.uid());

-- RLS Policies for square_cache_disputes
CREATE POLICY "disputes_cache_select_own" ON public.square_cache_disputes FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "disputes_cache_insert_own" ON public.square_cache_disputes FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "disputes_cache_update_own" ON public.square_cache_disputes FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "disputes_cache_delete_own" ON public.square_cache_disputes FOR DELETE USING (user_id = auth.uid());

-- RLS Policies for square_cache_payouts
CREATE POLICY "payouts_cache_select_own" ON public.square_cache_payouts FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "payouts_cache_insert_own" ON public.square_cache_payouts FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "payouts_cache_update_own" ON public.square_cache_payouts FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "payouts_cache_delete_own" ON public.square_cache_payouts FOR DELETE USING (user_id = auth.uid());

-- RLS Policies for square_cache_team_members
CREATE POLICY "team_members_cache_select_own" ON public.square_cache_team_members FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "team_members_cache_insert_own" ON public.square_cache_team_members FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "team_members_cache_update_own" ON public.square_cache_team_members FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "team_members_cache_delete_own" ON public.square_cache_team_members FOR DELETE USING (user_id = auth.uid());

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Add updated_at triggers for all cache tables
CREATE TRIGGER trigger_updated_at_square_cache_customers
    BEFORE UPDATE ON public.square_cache_customers
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_updated_at_square_cache_orders
    BEFORE UPDATE ON public.square_cache_orders
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_updated_at_square_cache_payments
    BEFORE UPDATE ON public.square_cache_payments
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_updated_at_square_cache_products
    BEFORE UPDATE ON public.square_cache_products
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_updated_at_square_cache_inventory
    BEFORE UPDATE ON public.square_cache_inventory
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_updated_at_square_cache_refunds
    BEFORE UPDATE ON public.square_cache_refunds
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_updated_at_square_cache_disputes
    BEFORE UPDATE ON public.square_cache_disputes
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_updated_at_square_cache_payouts
    BEFORE UPDATE ON public.square_cache_payouts
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_updated_at_square_cache_team_members
    BEFORE UPDATE ON public.square_cache_team_members
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- AMOUNT VALIDATION TRIGGERS
-- =====================================================

-- Add amount validation triggers for financial tables
CREATE TRIGGER trigger_validate_payment_amount
    BEFORE INSERT OR UPDATE ON public.square_cache_payments
    FOR EACH ROW
    EXECUTE FUNCTION validate_positive_amount();

CREATE TRIGGER trigger_validate_refund_amount
    BEFORE INSERT OR UPDATE ON public.square_cache_refunds
    FOR EACH ROW
    EXECUTE FUNCTION validate_positive_amount();

CREATE TRIGGER trigger_validate_dispute_amount
    BEFORE INSERT OR UPDATE ON public.square_cache_disputes
    FOR EACH ROW
    EXECUTE FUNCTION validate_positive_amount();

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE public.square_cache_customers IS 'Cached Square customer data with TTL for business management';
COMMENT ON TABLE public.square_cache_orders IS 'Cached Square order data for revenue tracking and analytics';
COMMENT ON TABLE public.square_cache_payments IS 'Cached Square payment data for financial reporting';
COMMENT ON TABLE public.square_cache_products IS 'Cached Square product catalog for inventory management';
COMMENT ON TABLE public.square_cache_inventory IS 'Cached Square inventory counts with frequent updates';
COMMENT ON TABLE public.square_cache_refunds IS 'Cached Square refund data for business reporting';
COMMENT ON TABLE public.square_cache_disputes IS 'Cached Square dispute data for risk management';
COMMENT ON TABLE public.square_cache_payouts IS 'Cached Square payout data for financial tracking';
COMMENT ON TABLE public.square_cache_team_members IS 'Cached Square team member data for staff management';