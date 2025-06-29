-- Migration to add Square webhook support for real-time cache invalidation
-- Phase 2: Webhook-driven cache updates to minimize Square API calls

-- ============================================================================
-- 1. WEBHOOK REGISTRATION TABLE
-- ============================================================================

-- Store webhook configurations per user Square config
CREATE TABLE public.square_webhook_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    config_id UUID NOT NULL REFERENCES public.user_square_configs(id) ON DELETE CASCADE,
    webhook_url TEXT NOT NULL, -- Our webhook endpoint URL
    webhook_signature_key TEXT NOT NULL, -- Square webhook signature key for verification
    square_webhook_id TEXT, -- Square's webhook ID (when registered with Square)
    event_types TEXT[] NOT NULL DEFAULT ARRAY[
        'catalog.version.updated',
        'order.created',
        'order.updated', 
        'payment.created',
        'payment.updated',
        'customer.created',
        'customer.updated'
    ], -- Webhook events we're subscribed to
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE, -- Whether webhook signature verification passed
    last_verified_at TIMESTAMP WITH TIME ZONE,
    registration_status TEXT DEFAULT 'pending' CHECK (registration_status IN ('pending', 'registered', 'failed', 'disabled')),
    registration_error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- One webhook config per Square config
    CONSTRAINT unique_webhook_per_config UNIQUE (config_id)
);

-- ============================================================================
-- 2. WEBHOOK EVENT LOG TABLE
-- ============================================================================

-- Track all webhook events received and processed
CREATE TABLE public.square_webhook_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    config_id UUID NOT NULL REFERENCES public.user_square_configs(id) ON DELETE CASCADE,
    webhook_config_id UUID NOT NULL REFERENCES public.square_webhook_configs(id) ON DELETE CASCADE,
    square_event_id TEXT, -- Square's event ID (if provided)
    event_type TEXT NOT NULL, -- e.g., 'catalog.version.updated'
    event_data JSONB NOT NULL, -- Full webhook payload from Square
    processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed', 'ignored')),
    processing_started_at TIMESTAMP WITH TIME ZONE,
    processing_completed_at TIMESTAMP WITH TIME ZONE,
    processing_error TEXT,
    cache_invalidation_result JSONB, -- Result of cache invalidation operations
    signature_valid BOOLEAN DEFAULT FALSE,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 3. INDEXES FOR WEBHOOK TABLES
-- ============================================================================

-- Webhook configs indexes
CREATE INDEX idx_square_webhook_configs_user_config ON public.square_webhook_configs(user_id, config_id);
CREATE INDEX idx_square_webhook_configs_active ON public.square_webhook_configs(is_active);
CREATE INDEX idx_square_webhook_configs_status ON public.square_webhook_configs(registration_status);

-- Webhook events indexes
CREATE INDEX idx_square_webhook_events_config ON public.square_webhook_events(config_id);
CREATE INDEX idx_square_webhook_events_type ON public.square_webhook_events(event_type);
CREATE INDEX idx_square_webhook_events_status ON public.square_webhook_events(processing_status);
CREATE INDEX idx_square_webhook_events_created ON public.square_webhook_events(created_at);
CREATE INDEX idx_square_webhook_events_square_id ON public.square_webhook_events(square_event_id);

-- ============================================================================
-- 4. WEBHOOK PROCESSING FUNCTIONS
-- ============================================================================

-- Function to process webhook events and invalidate cache
CREATE OR REPLACE FUNCTION process_square_webhook_event(
    p_webhook_event_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    webhook_event RECORD;
    invalidation_result JSONB := '{}';
    entity_ids TEXT[];
    invalidated_count INTEGER := 0;
BEGIN
    -- Get webhook event details
    SELECT we.*, wc.config_id 
    INTO webhook_event
    FROM public.square_webhook_events we
    JOIN public.square_webhook_configs wc ON we.webhook_config_id = wc.id
    WHERE we.id = p_webhook_event_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Webhook event not found: %', p_webhook_event_id;
    END IF;
    
    -- Update processing status
    UPDATE public.square_webhook_events 
    SET processing_status = 'processing', 
        processing_started_at = NOW(),
        updated_at = NOW()
    WHERE id = p_webhook_event_id;
    
    -- Process based on event type
    CASE webhook_event.event_type
        WHEN 'catalog.version.updated' THEN
            -- Invalidate all products cache for this config
            SELECT invalidate_square_entity_cache(webhook_event.config_id, 'products') INTO invalidated_count;
            invalidation_result := jsonb_build_object(
                'entity_type', 'products',
                'invalidated_count', invalidated_count,
                'action', 'full_invalidation'
            );
            
        WHEN 'order.created', 'order.updated' THEN
            -- Extract order ID from webhook data and invalidate specific order
            entity_ids := ARRAY[webhook_event.event_data->>'order_id'];
            IF entity_ids[1] IS NOT NULL THEN
                SELECT invalidate_square_entity_cache(webhook_event.config_id, 'orders', entity_ids) INTO invalidated_count;
                invalidation_result := jsonb_build_object(
                    'entity_type', 'orders',
                    'entity_ids', entity_ids,
                    'invalidated_count', invalidated_count,
                    'action', 'specific_invalidation'
                );
            END IF;
            
        WHEN 'payment.created', 'payment.updated' THEN
            -- Extract payment ID from webhook data and invalidate specific payment
            entity_ids := ARRAY[webhook_event.event_data->>'payment_id'];
            IF entity_ids[1] IS NOT NULL THEN
                SELECT invalidate_square_entity_cache(webhook_event.config_id, 'payments', entity_ids) INTO invalidated_count;
                invalidation_result := jsonb_build_object(
                    'entity_type', 'payments',
                    'entity_ids', entity_ids,
                    'invalidated_count', invalidated_count,
                    'action', 'specific_invalidation'
                );
            END IF;
            
        WHEN 'customer.created', 'customer.updated' THEN
            -- Extract customer ID from webhook data and invalidate specific customer
            entity_ids := ARRAY[webhook_event.event_data->>'customer_id'];
            IF entity_ids[1] IS NOT NULL THEN
                SELECT invalidate_square_entity_cache(webhook_event.config_id, 'customers', entity_ids) INTO invalidated_count;
                invalidation_result := jsonb_build_object(
                    'entity_type', 'customers',
                    'entity_ids', entity_ids,
                    'invalidated_count', invalidated_count,
                    'action', 'specific_invalidation'
                );
            END IF;
            
        ELSE
            -- Unknown event type, mark as ignored
            UPDATE public.square_webhook_events 
            SET processing_status = 'ignored',
                processing_completed_at = NOW(),
                processing_error = 'Unknown event type: ' || webhook_event.event_type,
                updated_at = NOW()
            WHERE id = p_webhook_event_id;
            
            RETURN jsonb_build_object(
                'status', 'ignored',
                'reason', 'unknown_event_type',
                'event_type', webhook_event.event_type
            );
    END CASE;
    
    -- Log sync operation
    INSERT INTO public.square_sync_logs (
        user_id, config_id, entity_type, sync_operation, sync_status,
        records_processed, records_updated, completed_at
    ) VALUES (
        webhook_event.user_id, 
        webhook_event.config_id,
        invalidation_result->>'entity_type',
        'webhook_update',
        'completed',
        1,
        invalidated_count,
        NOW()
    );
    
    -- Update webhook event as completed
    UPDATE public.square_webhook_events 
    SET processing_status = 'completed',
        processing_completed_at = NOW(),
        cache_invalidation_result = invalidation_result,
        updated_at = NOW()
    WHERE id = p_webhook_event_id;
    
    RETURN invalidation_result;
    
EXCEPTION WHEN OTHERS THEN
    -- Update webhook event as failed
    UPDATE public.square_webhook_events 
    SET processing_status = 'failed',
        processing_completed_at = NOW(),
        processing_error = SQLERRM,
        updated_at = NOW()
    WHERE id = p_webhook_event_id;
    
    -- Log failed sync operation
    INSERT INTO public.square_sync_logs (
        user_id, config_id, entity_type, sync_operation, sync_status,
        error_message, completed_at
    ) VALUES (
        webhook_event.user_id,
        webhook_event.config_id,
        'webhook',
        'webhook_update',
        'failed',
        SQLERRM,
        NOW()
    );
    
    RAISE;
END;
$$;

-- Function to cleanup old webhook events
CREATE OR REPLACE FUNCTION cleanup_old_webhook_events(
    days_to_keep INTEGER DEFAULT 30
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    cutoff_time TIMESTAMP WITH TIME ZONE;
    deleted_count INTEGER;
BEGIN
    cutoff_time := NOW() - (days_to_keep * INTERVAL '1 day');
    
    DELETE FROM public.square_webhook_events 
    WHERE created_at < cutoff_time 
    AND processing_status IN ('completed', 'ignored', 'failed');
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;

-- ============================================================================
-- 5. UPDATED_AT TRIGGERS
-- ============================================================================

-- Add updated_at triggers for webhook tables
CREATE TRIGGER trigger_updated_at_square_webhook_configs
    BEFORE UPDATE ON public.square_webhook_configs
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_updated_at_square_webhook_events
    BEFORE UPDATE ON public.square_webhook_events
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- 6. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on webhook tables
ALTER TABLE public.square_webhook_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.square_webhook_events ENABLE ROW LEVEL SECURITY;

-- RLS policies for webhook configs
CREATE POLICY "Users can view their own webhook configs" ON public.square_webhook_configs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own webhook configs" ON public.square_webhook_configs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own webhook configs" ON public.square_webhook_configs
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own webhook configs" ON public.square_webhook_configs
    FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for webhook events
CREATE POLICY "Users can view their own webhook events" ON public.square_webhook_events
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert webhook events" ON public.square_webhook_events
    FOR INSERT WITH CHECK (true); -- Webhooks come from external service

CREATE POLICY "Service role can update webhook events" ON public.square_webhook_events
    FOR UPDATE USING (true); -- Processing updates come from service

-- ============================================================================
-- 7. COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE public.square_webhook_configs IS 'Configuration for Square webhooks per user Square config';
COMMENT ON TABLE public.square_webhook_events IS 'Log of all Square webhook events received and processed';
COMMENT ON FUNCTION process_square_webhook_event IS 'Process a webhook event and invalidate relevant cache entries';
COMMENT ON FUNCTION cleanup_old_webhook_events IS 'Clean up old webhook event logs to prevent table bloat'; 