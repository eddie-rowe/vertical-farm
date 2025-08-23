-- Add webhook configuration and event logging tables for Square integration
-- This enables webhook-driven cache invalidation for real-time updates

-- Table to store webhook configurations per user
CREATE TABLE IF NOT EXISTS square_webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    webhook_id TEXT, -- Square's webhook ID (when registered)
    webhook_url TEXT NOT NULL,
    signature_key TEXT NOT NULL, -- Square's webhook signature key
    event_types TEXT[] NOT NULL DEFAULT '{}', -- Array of subscribed event types
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive', 'error')),
    last_verified_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Ensure one webhook config per user
    UNIQUE(user_id)
);

-- Table to log webhook events for monitoring and debugging
CREATE TABLE IF NOT EXISTS square_webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_id TEXT NOT NULL, -- Square's event ID
    event_type TEXT NOT NULL, -- e.g., 'order.created', 'catalog.version.updated'
    merchant_id TEXT NOT NULL,
    payload JSONB NOT NULL, -- Full webhook payload
    signature_header TEXT NOT NULL, -- For verification debugging
    processed_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'processed', 'failed', 'ignored')),
    cache_invalidated BOOLEAN DEFAULT FALSE,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Prevent duplicate event processing
    UNIQUE(user_id, event_id)
);

-- Add webhook invalidation tracking to existing cache tables
ALTER TABLE square_locations_cache 
ADD COLUMN IF NOT EXISTS webhook_invalidated_at TIMESTAMPTZ;

ALTER TABLE square_products_cache 
ADD COLUMN IF NOT EXISTS webhook_invalidated_at TIMESTAMPTZ;

ALTER TABLE square_customers_cache 
ADD COLUMN IF NOT EXISTS webhook_invalidated_at TIMESTAMPTZ;

ALTER TABLE square_orders_cache 
ADD COLUMN IF NOT EXISTS webhook_invalidated_at TIMESTAMPTZ;

ALTER TABLE square_payments_cache 
ADD COLUMN IF NOT EXISTS webhook_invalidated_at TIMESTAMPTZ;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_square_webhooks_user_id ON square_webhooks(user_id);
CREATE INDEX IF NOT EXISTS idx_square_webhooks_status ON square_webhooks(status);

CREATE INDEX IF NOT EXISTS idx_square_webhook_events_user_id ON square_webhook_events(user_id);
CREATE INDEX IF NOT EXISTS idx_square_webhook_events_event_type ON square_webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_square_webhook_events_created_at ON square_webhook_events(created_at);
CREATE INDEX IF NOT EXISTS idx_square_webhook_events_status ON square_webhook_events(status);

-- RLS policies for webhook tables
ALTER TABLE square_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE square_webhook_events ENABLE ROW LEVEL SECURITY;

-- Users can only access their own webhook configurations
CREATE POLICY "Users can view their own webhook configs" ON square_webhooks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own webhook configs" ON square_webhooks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own webhook configs" ON square_webhooks
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own webhook configs" ON square_webhooks
    FOR DELETE USING (auth.uid() = user_id);

-- Users can view their own webhook events (read-only for users)
CREATE POLICY "Users can view their own webhook events" ON square_webhook_events
    FOR SELECT USING (auth.uid() = user_id);

-- System can insert webhook events (this will be handled by service account)
CREATE POLICY "System can insert webhook events" ON square_webhook_events
    FOR INSERT WITH CHECK (true);

-- System can update webhook events
CREATE POLICY "System can update webhook events" ON square_webhook_events
    FOR UPDATE USING (true);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_square_webhooks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_square_webhooks_updated_at
    BEFORE UPDATE ON square_webhooks
    FOR EACH ROW
    EXECUTE FUNCTION update_square_webhooks_updated_at();

-- Function to invalidate cache based on webhook event
CREATE OR REPLACE FUNCTION invalidate_square_cache_by_webhook(
    p_user_id UUID,
    p_event_type TEXT,
    p_event_id TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    invalidation_time TIMESTAMPTZ := NOW();
    rows_affected INTEGER := 0;
BEGIN
    -- Invalidate cache based on event type
    CASE 
        WHEN p_event_type LIKE 'catalog.%' THEN
            UPDATE square_products_cache 
            SET webhook_invalidated_at = invalidation_time
            WHERE user_id = p_user_id;
            GET DIAGNOSTICS rows_affected = ROW_COUNT;
            
        WHEN p_event_type LIKE 'order.%' THEN
            UPDATE square_orders_cache 
            SET webhook_invalidated_at = invalidation_time
            WHERE user_id = p_user_id;
            GET DIAGNOSTICS rows_affected = ROW_COUNT;
            
        WHEN p_event_type LIKE 'payment.%' THEN
            UPDATE square_payments_cache 
            SET webhook_invalidated_at = invalidation_time
            WHERE user_id = p_user_id;
            GET DIAGNOSTICS rows_affected = ROW_COUNT;
            
        WHEN p_event_type LIKE 'customer.%' THEN
            UPDATE square_customers_cache 
            SET webhook_invalidated_at = invalidation_time
            WHERE user_id = p_user_id;
            GET DIAGNOSTICS rows_affected = ROW_COUNT;
            
        WHEN p_event_type LIKE 'inventory.%' THEN
            -- Inventory changes affect both products and orders
            UPDATE square_products_cache 
            SET webhook_invalidated_at = invalidation_time
            WHERE user_id = p_user_id;
            
            UPDATE square_orders_cache 
            SET webhook_invalidated_at = invalidation_time
            WHERE user_id = p_user_id;
            GET DIAGNOSTICS rows_affected = ROW_COUNT;
            
        ELSE
            -- Unknown event type, log but don't invalidate
            RETURN FALSE;
    END CASE;
    
    -- Log the invalidation
    INSERT INTO square_sync_logs (user_id, operation, status, details, created_at)
    VALUES (
        p_user_id, 
        'webhook_invalidation', 
        'success', 
        jsonb_build_object(
            'event_type', p_event_type,
            'event_id', p_event_id,
            'rows_affected', rows_affected,
            'invalidation_time', invalidation_time
        ),
        NOW()
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Comment the tables
COMMENT ON TABLE square_webhooks IS 'Webhook configurations for Square integration per user';
COMMENT ON TABLE square_webhook_events IS 'Log of received Square webhook events for monitoring';
COMMENT ON FUNCTION invalidate_square_cache_by_webhook IS 'Invalidates Square cache entries based on webhook event type'; 