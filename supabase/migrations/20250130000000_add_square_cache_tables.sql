-- Migration to add Square API caching tables and infrastructure
-- Phase 1: Core cache tables for reducing Square API calls
-- This enables per-user caching of Square data with intelligent invalidation

-- ============================================================================
-- 1. SYNC METADATA TRACKING TABLE
-- ============================================================================

-- Central table to track sync operations and metadata
CREATE TABLE public.square_sync_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    config_id UUID NOT NULL REFERENCES public.user_square_configs(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL, -- 'locations', 'products', 'customers', 'orders', 'payments'
    sync_operation TEXT NOT NULL, -- 'full_sync', 'delta_sync', 'webhook_update', 'manual_refresh'
    sync_status TEXT NOT NULL DEFAULT 'pending' CHECK (sync_status IN ('pending', 'in_progress', 'completed', 'failed')),
    records_processed INTEGER DEFAULT 0,
    records_updated INTEGER DEFAULT 0,
    records_added INTEGER DEFAULT 0,
    records_deleted INTEGER DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    error_details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 2. CORE CACHE TABLES
-- ============================================================================

-- Square Locations Cache
CREATE TABLE public.square_locations_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    config_id UUID NOT NULL REFERENCES public.user_square_configs(id) ON DELETE CASCADE,
    square_location_id TEXT NOT NULL, -- Square's location ID
    location_data JSONB NOT NULL, -- Full Square location object
    is_active BOOLEAN DEFAULT TRUE,
    last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    square_updated_at TIMESTAMP WITH TIME ZONE, -- When Square last updated this record
    cache_version INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique location per config
    CONSTRAINT unique_location_per_config UNIQUE (config_id, square_location_id)
);

-- Square Products Cache
CREATE TABLE public.square_products_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    config_id UUID NOT NULL REFERENCES public.user_square_configs(id) ON DELETE CASCADE,
    square_product_id TEXT NOT NULL, -- Square's catalog object ID
    product_data JSONB NOT NULL, -- Full Square product object
    category_id TEXT, -- For filtering and organization
    is_active BOOLEAN DEFAULT TRUE,
    is_deleted BOOLEAN DEFAULT FALSE, -- Square soft delete tracking
    last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    square_updated_at TIMESTAMP WITH TIME ZONE, -- When Square last updated this record
    cache_version INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique product per config
    CONSTRAINT unique_product_per_config UNIQUE (config_id, square_product_id)
);

-- Square Customers Cache
CREATE TABLE public.square_customers_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    config_id UUID NOT NULL REFERENCES public.user_square_configs(id) ON DELETE CASCADE,
    square_customer_id TEXT NOT NULL, -- Square's customer ID
    customer_data JSONB NOT NULL, -- Full Square customer object
    email_address TEXT, -- Indexed for quick lookups
    phone_number TEXT, -- Indexed for quick lookups
    is_active BOOLEAN DEFAULT TRUE,
    last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    square_updated_at TIMESTAMP WITH TIME ZONE, -- When Square last updated this record
    cache_version INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique customer per config
    CONSTRAINT unique_customer_per_config UNIQUE (config_id, square_customer_id)
);

-- Square Orders Cache
CREATE TABLE public.square_orders_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    config_id UUID NOT NULL REFERENCES public.user_square_configs(id) ON DELETE CASCADE,
    square_order_id TEXT NOT NULL, -- Square's order ID
    square_location_id TEXT, -- Associated location
    order_data JSONB NOT NULL, -- Full Square order object
    order_state TEXT, -- For filtering (OPEN, COMPLETED, CANCELED, etc.)
    total_amount_cents BIGINT, -- For sorting and filtering
    currency_code TEXT DEFAULT 'USD',
    customer_id TEXT, -- Reference to Square customer
    is_active BOOLEAN DEFAULT TRUE,
    last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    square_updated_at TIMESTAMP WITH TIME ZONE, -- When Square last updated this record
    square_created_at TIMESTAMP WITH TIME ZONE, -- When order was created in Square
    cache_version INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique order per config
    CONSTRAINT unique_order_per_config UNIQUE (config_id, square_order_id)
);

-- Square Payments Cache
CREATE TABLE public.square_payments_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    config_id UUID NOT NULL REFERENCES public.user_square_configs(id) ON DELETE CASCADE,
    square_payment_id TEXT NOT NULL, -- Square's payment ID
    square_order_id TEXT, -- Associated order
    square_location_id TEXT, -- Associated location
    payment_data JSONB NOT NULL, -- Full Square payment object
    payment_status TEXT, -- For filtering (APPROVED, COMPLETED, CANCELED, etc.)
    amount_cents BIGINT, -- For sorting and filtering
    currency_code TEXT DEFAULT 'USD',
    source_type TEXT, -- CARD, CASH, etc.
    is_active BOOLEAN DEFAULT TRUE,
    last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    square_updated_at TIMESTAMP WITH TIME ZONE, -- When Square last updated this record
    square_created_at TIMESTAMP WITH TIME ZONE, -- When payment was created in Square
    cache_version INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique payment per config
    CONSTRAINT unique_payment_per_config UNIQUE (config_id, square_payment_id)
);

-- ============================================================================
-- 3. INDEXES FOR PERFORMANCE
-- ============================================================================

-- Sync logs indexes
CREATE INDEX idx_square_sync_logs_user_config ON public.square_sync_logs(user_id, config_id);
CREATE INDEX idx_square_sync_logs_entity_type ON public.square_sync_logs(entity_type);
CREATE INDEX idx_square_sync_logs_status ON public.square_sync_logs(sync_status);
CREATE INDEX idx_square_sync_logs_created_at ON public.square_sync_logs(created_at);

-- Locations cache indexes
CREATE INDEX idx_square_locations_cache_user_config ON public.square_locations_cache(user_id, config_id);
CREATE INDEX idx_square_locations_cache_active ON public.square_locations_cache(config_id, is_active);
CREATE INDEX idx_square_locations_cache_synced ON public.square_locations_cache(last_synced_at);

-- Products cache indexes
CREATE INDEX idx_square_products_cache_user_config ON public.square_products_cache(user_id, config_id);
CREATE INDEX idx_square_products_cache_active ON public.square_products_cache(config_id, is_active);
CREATE INDEX idx_square_products_cache_category ON public.square_products_cache(config_id, category_id);
CREATE INDEX idx_square_products_cache_synced ON public.square_products_cache(last_synced_at);
CREATE INDEX idx_square_products_cache_deleted ON public.square_products_cache(config_id, is_deleted);

-- Customers cache indexes
CREATE INDEX idx_square_customers_cache_user_config ON public.square_customers_cache(user_id, config_id);
CREATE INDEX idx_square_customers_cache_active ON public.square_customers_cache(config_id, is_active);
CREATE INDEX idx_square_customers_cache_email ON public.square_customers_cache(config_id, email_address);
CREATE INDEX idx_square_customers_cache_phone ON public.square_customers_cache(config_id, phone_number);
CREATE INDEX idx_square_customers_cache_synced ON public.square_customers_cache(last_synced_at);

-- Orders cache indexes
CREATE INDEX idx_square_orders_cache_user_config ON public.square_orders_cache(user_id, config_id);
CREATE INDEX idx_square_orders_cache_location ON public.square_orders_cache(config_id, square_location_id);
CREATE INDEX idx_square_orders_cache_state ON public.square_orders_cache(config_id, order_state);
CREATE INDEX idx_square_orders_cache_customer ON public.square_orders_cache(config_id, customer_id);
CREATE INDEX idx_square_orders_cache_amount ON public.square_orders_cache(config_id, total_amount_cents);
CREATE INDEX idx_square_orders_cache_created ON public.square_orders_cache(config_id, square_created_at);
CREATE INDEX idx_square_orders_cache_synced ON public.square_orders_cache(last_synced_at);

-- Payments cache indexes
CREATE INDEX idx_square_payments_cache_user_config ON public.square_payments_cache(user_id, config_id);
CREATE INDEX idx_square_payments_cache_order ON public.square_payments_cache(config_id, square_order_id);
CREATE INDEX idx_square_payments_cache_location ON public.square_payments_cache(config_id, square_location_id);
CREATE INDEX idx_square_payments_cache_status ON public.square_payments_cache(config_id, payment_status);
CREATE INDEX idx_square_payments_cache_amount ON public.square_payments_cache(config_id, amount_cents);
CREATE INDEX idx_square_payments_cache_created ON public.square_payments_cache(config_id, square_created_at);
CREATE INDEX idx_square_payments_cache_synced ON public.square_payments_cache(last_synced_at);

-- ============================================================================
-- 4. CACHE INVALIDATION FUNCTIONS
-- ============================================================================

-- Function to invalidate cache entries older than specified TTL
CREATE OR REPLACE FUNCTION invalidate_stale_square_cache(
    ttl_hours INTEGER DEFAULT 24
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    cutoff_time TIMESTAMP WITH TIME ZONE;
    total_invalidated INTEGER := 0;
    table_count INTEGER;
BEGIN
    cutoff_time := NOW() - (ttl_hours * INTERVAL '1 hour');
    
    -- Invalidate stale locations
    UPDATE public.square_locations_cache 
    SET is_active = FALSE, updated_at = NOW()
    WHERE last_synced_at < cutoff_time AND is_active = TRUE;
    GET DIAGNOSTICS table_count = ROW_COUNT;
    total_invalidated := total_invalidated + table_count;
    
    -- Invalidate stale products
    UPDATE public.square_products_cache 
    SET is_active = FALSE, updated_at = NOW()
    WHERE last_synced_at < cutoff_time AND is_active = TRUE;
    GET DIAGNOSTICS table_count = ROW_COUNT;
    total_invalidated := total_invalidated + table_count;
    
    -- Invalidate stale customers
    UPDATE public.square_customers_cache 
    SET is_active = FALSE, updated_at = NOW()
    WHERE last_synced_at < cutoff_time AND is_active = TRUE;
    GET DIAGNOSTICS table_count = ROW_COUNT;
    total_invalidated := total_invalidated + table_count;
    
    -- Invalidate stale orders
    UPDATE public.square_orders_cache 
    SET is_active = FALSE, updated_at = NOW()
    WHERE last_synced_at < cutoff_time AND is_active = TRUE;
    GET DIAGNOSTICS table_count = ROW_COUNT;
    total_invalidated := total_invalidated + table_count;
    
    -- Invalidate stale payments
    UPDATE public.square_payments_cache 
    SET is_active = FALSE, updated_at = NOW()
    WHERE last_synced_at < cutoff_time AND is_active = TRUE;
    GET DIAGNOSTICS table_count = ROW_COUNT;
    total_invalidated := total_invalidated + table_count;
    
    RETURN total_invalidated;
END;
$$;

-- Function to invalidate specific entity cache for a config
CREATE OR REPLACE FUNCTION invalidate_square_entity_cache(
    p_config_id UUID,
    p_entity_type TEXT,
    p_entity_ids TEXT[] DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    total_invalidated INTEGER := 0;
    table_count INTEGER;
BEGIN
    CASE p_entity_type
        WHEN 'locations' THEN
            IF p_entity_ids IS NULL THEN
                UPDATE public.square_locations_cache 
                SET is_active = FALSE, updated_at = NOW()
                WHERE config_id = p_config_id AND is_active = TRUE;
            ELSE
                UPDATE public.square_locations_cache 
                SET is_active = FALSE, updated_at = NOW()
                WHERE config_id = p_config_id AND square_location_id = ANY(p_entity_ids) AND is_active = TRUE;
            END IF;
            GET DIAGNOSTICS total_invalidated = ROW_COUNT;
            
        WHEN 'products' THEN
            IF p_entity_ids IS NULL THEN
                UPDATE public.square_products_cache 
                SET is_active = FALSE, updated_at = NOW()
                WHERE config_id = p_config_id AND is_active = TRUE;
            ELSE
                UPDATE public.square_products_cache 
                SET is_active = FALSE, updated_at = NOW()
                WHERE config_id = p_config_id AND square_product_id = ANY(p_entity_ids) AND is_active = TRUE;
            END IF;
            GET DIAGNOSTICS total_invalidated = ROW_COUNT;
            
        WHEN 'customers' THEN
            IF p_entity_ids IS NULL THEN
                UPDATE public.square_customers_cache 
                SET is_active = FALSE, updated_at = NOW()
                WHERE config_id = p_config_id AND is_active = TRUE;
            ELSE
                UPDATE public.square_customers_cache 
                SET is_active = FALSE, updated_at = NOW()
                WHERE config_id = p_config_id AND square_customer_id = ANY(p_entity_ids) AND is_active = TRUE;
            END IF;
            GET DIAGNOSTICS total_invalidated = ROW_COUNT;
            
        WHEN 'orders' THEN
            IF p_entity_ids IS NULL THEN
                UPDATE public.square_orders_cache 
                SET is_active = FALSE, updated_at = NOW()
                WHERE config_id = p_config_id AND is_active = TRUE;
            ELSE
                UPDATE public.square_orders_cache 
                SET is_active = FALSE, updated_at = NOW()
                WHERE config_id = p_config_id AND square_order_id = ANY(p_entity_ids) AND is_active = TRUE;
            END IF;
            GET DIAGNOSTICS total_invalidated = ROW_COUNT;
            
        WHEN 'payments' THEN
            IF p_entity_ids IS NULL THEN
                UPDATE public.square_payments_cache 
                SET is_active = FALSE, updated_at = NOW()
                WHERE config_id = p_config_id AND is_active = TRUE;
            ELSE
                UPDATE public.square_payments_cache 
                SET is_active = FALSE, updated_at = NOW()
                WHERE config_id = p_config_id AND square_payment_id = ANY(p_entity_ids) AND is_active = TRUE;
            END IF;
            GET DIAGNOSTICS total_invalidated = ROW_COUNT;
            
        ELSE
            RAISE EXCEPTION 'Invalid entity_type: %. Must be one of: locations, products, customers, orders, payments', p_entity_type;
    END CASE;
    
    RETURN total_invalidated;
END;
$$;

-- Function to clean up old cache entries (hard delete)
CREATE OR REPLACE FUNCTION cleanup_old_square_cache(
    days_to_keep INTEGER DEFAULT 30
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    cutoff_time TIMESTAMP WITH TIME ZONE;
    total_deleted INTEGER := 0;
    table_count INTEGER;
BEGIN
    cutoff_time := NOW() - (days_to_keep * INTERVAL '1 day');
    
    -- Delete old sync logs
    DELETE FROM public.square_sync_logs 
    WHERE created_at < cutoff_time;
    GET DIAGNOSTICS table_count = ROW_COUNT;
    total_deleted := total_deleted + table_count;
    
    -- Delete old inactive cache entries
    DELETE FROM public.square_locations_cache 
    WHERE updated_at < cutoff_time AND is_active = FALSE;
    GET DIAGNOSTICS table_count = ROW_COUNT;
    total_deleted := total_deleted + table_count;
    
    DELETE FROM public.square_products_cache 
    WHERE updated_at < cutoff_time AND is_active = FALSE;
    GET DIAGNOSTICS table_count = ROW_COUNT;
    total_deleted := total_deleted + table_count;
    
    DELETE FROM public.square_customers_cache 
    WHERE updated_at < cutoff_time AND is_active = FALSE;
    GET DIAGNOSTICS table_count = ROW_COUNT;
    total_deleted := total_deleted + table_count;
    
    DELETE FROM public.square_orders_cache 
    WHERE updated_at < cutoff_time AND is_active = FALSE;
    GET DIAGNOSTICS table_count = ROW_COUNT;
    total_deleted := total_deleted + table_count;
    
    DELETE FROM public.square_payments_cache 
    WHERE updated_at < cutoff_time AND is_active = FALSE;
    GET DIAGNOSTICS table_count = ROW_COUNT;
    total_deleted := total_deleted + table_count;
    
    RETURN total_deleted;
END;
$$;

-- ============================================================================
-- 5. UPDATED_AT TRIGGERS
-- ============================================================================

-- Add updated_at triggers for all cache tables
CREATE TRIGGER trigger_updated_at_square_sync_logs
    BEFORE UPDATE ON public.square_sync_logs
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_updated_at_square_locations_cache
    BEFORE UPDATE ON public.square_locations_cache
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_updated_at_square_products_cache
    BEFORE UPDATE ON public.square_products_cache
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_updated_at_square_customers_cache
    BEFORE UPDATE ON public.square_customers_cache
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_updated_at_square_orders_cache
    BEFORE UPDATE ON public.square_orders_cache
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_updated_at_square_payments_cache
    BEFORE UPDATE ON public.square_payments_cache
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all cache tables
ALTER TABLE public.square_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.square_locations_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.square_products_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.square_customers_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.square_orders_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.square_payments_cache ENABLE ROW LEVEL SECURITY;

-- Sync logs policies
CREATE POLICY "sync_logs_select_own" ON public.square_sync_logs
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "sync_logs_insert_own" ON public.square_sync_logs
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "sync_logs_update_own" ON public.square_sync_logs
    FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "sync_logs_delete_own" ON public.square_sync_logs
    FOR DELETE USING (user_id = auth.uid());

-- Locations cache policies
CREATE POLICY "locations_cache_select_own" ON public.square_locations_cache
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "locations_cache_insert_own" ON public.square_locations_cache
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "locations_cache_update_own" ON public.square_locations_cache
    FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "locations_cache_delete_own" ON public.square_locations_cache
    FOR DELETE USING (user_id = auth.uid());

-- Products cache policies
CREATE POLICY "products_cache_select_own" ON public.square_products_cache
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "products_cache_insert_own" ON public.square_products_cache
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "products_cache_update_own" ON public.square_products_cache
    FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "products_cache_delete_own" ON public.square_products_cache
    FOR DELETE USING (user_id = auth.uid());

-- Customers cache policies
CREATE POLICY "customers_cache_select_own" ON public.square_customers_cache
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "customers_cache_insert_own" ON public.square_customers_cache
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "customers_cache_update_own" ON public.square_customers_cache
    FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "customers_cache_delete_own" ON public.square_customers_cache
    FOR DELETE USING (user_id = auth.uid());

-- Orders cache policies
CREATE POLICY "orders_cache_select_own" ON public.square_orders_cache
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "orders_cache_insert_own" ON public.square_orders_cache
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "orders_cache_update_own" ON public.square_orders_cache
    FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "orders_cache_delete_own" ON public.square_orders_cache
    FOR DELETE USING (user_id = auth.uid());

-- Payments cache policies
CREATE POLICY "payments_cache_select_own" ON public.square_payments_cache
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "payments_cache_insert_own" ON public.square_payments_cache
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "payments_cache_update_own" ON public.square_payments_cache
    FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "payments_cache_delete_own" ON public.square_payments_cache
    FOR DELETE USING (user_id = auth.uid());

-- Admin access policies for all cache tables
CREATE POLICY "admins_full_access_sync_logs" ON public.square_sync_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "admins_full_access_locations_cache" ON public.square_locations_cache
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "admins_full_access_products_cache" ON public.square_products_cache
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "admins_full_access_customers_cache" ON public.square_customers_cache
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "admins_full_access_orders_cache" ON public.square_orders_cache
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "admins_full_access_payments_cache" ON public.square_payments_cache
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================================================
-- 7. DOCUMENTATION COMMENTS
-- ============================================================================

-- Table comments
COMMENT ON TABLE public.square_sync_logs IS 'Tracks sync operations and metadata for Square API caching';
COMMENT ON TABLE public.square_locations_cache IS 'Cached Square location data per user configuration';
COMMENT ON TABLE public.square_products_cache IS 'Cached Square product/catalog data per user configuration';
COMMENT ON TABLE public.square_customers_cache IS 'Cached Square customer data per user configuration';
COMMENT ON TABLE public.square_orders_cache IS 'Cached Square order data per user configuration';
COMMENT ON TABLE public.square_payments_cache IS 'Cached Square payment data per user configuration';

-- Key column comments
COMMENT ON COLUMN public.square_locations_cache.location_data IS 'Full Square location object as JSONB for flexibility';
COMMENT ON COLUMN public.square_locations_cache.last_synced_at IS 'When this cache entry was last synchronized with Square API';
COMMENT ON COLUMN public.square_locations_cache.cache_version IS 'Version number for cache invalidation strategies';

COMMENT ON COLUMN public.square_products_cache.product_data IS 'Full Square product object as JSONB for flexibility';
COMMENT ON COLUMN public.square_products_cache.is_deleted IS 'Tracks Square soft-deleted products';

COMMENT ON COLUMN public.square_customers_cache.customer_data IS 'Full Square customer object as JSONB for flexibility';
COMMENT ON COLUMN public.square_customers_cache.email_address IS 'Extracted for indexing and quick lookups';
COMMENT ON COLUMN public.square_customers_cache.phone_number IS 'Extracted for indexing and quick lookups';

COMMENT ON COLUMN public.square_orders_cache.order_data IS 'Full Square order object as JSONB for flexibility';
COMMENT ON COLUMN public.square_orders_cache.total_amount_cents IS 'Order total in cents for sorting and filtering';

COMMENT ON COLUMN public.square_payments_cache.payment_data IS 'Full Square payment object as JSONB for flexibility';
COMMENT ON COLUMN public.square_payments_cache.amount_cents IS 'Payment amount in cents for sorting and filtering';

-- Function comments
COMMENT ON FUNCTION invalidate_stale_square_cache IS 'Invalidates cache entries older than specified TTL hours';
COMMENT ON FUNCTION invalidate_square_entity_cache IS 'Invalidates specific entity cache entries for a configuration';
COMMENT ON FUNCTION cleanup_old_square_cache IS 'Hard deletes old inactive cache entries and sync logs'; 