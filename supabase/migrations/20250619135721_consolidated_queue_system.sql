-- ============================================================================
-- CONSOLIDATED QUEUE SYSTEM MIGRATION
-- ============================================================================
-- Description: Consolidated queue and task processing system for vertical farming automation
-- Date: 2025-02-03
-- Consolidates: 002_queue_system.sql, 20250101000000_farm_automation_queues.sql,
--               20250203000000_queue_system_setup.sql, 20250203000002_supabase_queues_setup.sql,
--               20250131200000_enhance_queue_automation.sql
--
-- This migration creates a comprehensive queue system with:
-- - PGMQ integration for reliable message processing
-- - Custom job queue for complex automation tasks
-- - Task logging and monitoring
-- - Automated scheduling and retry logic
-- - Performance optimizations
-- ============================================================================

-- Enable required extensions with proper schema handling
-- First, try to create in extensions schema (Supabase default)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

-- Create a wrapper function in public schema to ensure uuid_generate_v4() is accessible
DO $$
BEGIN
    -- Check if the function already exists in public schema
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname = 'uuid_generate_v4' AND n.nspname = 'public'
    ) THEN
        -- Create wrapper function that calls the extensions version
        CREATE OR REPLACE FUNCTION public.uuid_generate_v4()
        RETURNS uuid
        LANGUAGE sql
        IMMUTABLE PARALLEL SAFE
        AS 'SELECT extensions.uuid_generate_v4();';
        
        -- Grant execute permissions
        GRANT EXECUTE ON FUNCTION public.uuid_generate_v4() TO anon, authenticated, service_role;
    END IF;
END $$;

-- Also try creating in public schema as fallback
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;

-- Enable PGMQ extension
CREATE EXTENSION IF NOT EXISTS pgmq;

-- ============================================================================
-- CORE QUEUE TABLES
-- ============================================================================

-- Main job queue for complex automation tasks
CREATE TABLE IF NOT EXISTS public.job_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    queue_name TEXT NOT NULL,
    job_type TEXT NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}',
    priority INTEGER DEFAULT 0, -- Higher numbers = higher priority
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    scheduled_for TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    error_message TEXT,
    execution_time_ms INTEGER,
    worker_id TEXT,
    metadata JSONB DEFAULT '{}',
    created_by UUID REFERENCES public.user_profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Queue configuration and management
CREATE TABLE IF NOT EXISTS public.queue_config (
    queue_name TEXT PRIMARY KEY,
    is_active BOOLEAN DEFAULT TRUE,
    max_concurrent_jobs INTEGER DEFAULT 5,
    retry_delay_seconds INTEGER DEFAULT 300,
    max_job_runtime_seconds INTEGER DEFAULT 3600,
    priority_weight NUMERIC DEFAULT 1.0,
    auto_cleanup_days INTEGER DEFAULT 7,
    notification_settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns to existing task_logs table
DO $$
BEGIN
    -- Add queue_name column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'task_logs' AND column_name = 'queue_name'
    ) THEN
        ALTER TABLE public.task_logs ADD COLUMN queue_name TEXT;
    END IF;
    
    -- Add execution_time_ms column if it doesn't exist (rename from execution_time)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'task_logs' AND column_name = 'execution_time_ms'
    ) THEN
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'task_logs' AND column_name = 'execution_time'
        ) THEN
            ALTER TABLE public.task_logs RENAME COLUMN execution_time TO execution_time_ms;
        ELSE
            ALTER TABLE public.task_logs ADD COLUMN execution_time_ms INTEGER NOT NULL DEFAULT 0;
        END IF;
    END IF;
    
    -- Add worker_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'task_logs' AND column_name = 'worker_id'
    ) THEN
        ALTER TABLE public.task_logs ADD COLUMN worker_id TEXT;
    END IF;
    
    -- Add metadata column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'task_logs' AND column_name = 'metadata'
    ) THEN
        ALTER TABLE public.task_logs ADD COLUMN metadata JSONB DEFAULT '{}';
    END IF;
END $$;

-- Background task processing queue (PGMQ)
CREATE TABLE IF NOT EXISTS public.background_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_type TEXT NOT NULL,
    grow_id UUID REFERENCES public.grows(id) ON DELETE CASCADE,
    device_assignment_id UUID REFERENCES public.device_assignments(id) ON DELETE CASCADE,
    farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE,
    payload JSONB NOT NULL DEFAULT '{}',
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('critical', 'high', 'normal', 'low')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    scheduled_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PGMQ QUEUE INITIALIZATION
-- ============================================================================

-- Initialize PGMQ queues for different task types
SELECT pgmq.create('farm_automation');
SELECT pgmq.create('sensor_processing');
SELECT pgmq.create('notifications');
SELECT pgmq.create('analytics');
SELECT pgmq.create('maintenance');
SELECT pgmq.create('background_tasks');

-- ============================================================================
-- PERFORMANCE INDEXES
-- ============================================================================

-- Job queue indexes
CREATE INDEX IF NOT EXISTS idx_job_queue_status_priority ON public.job_queue(queue_name, status, priority DESC, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_job_queue_processing ON public.job_queue(status, started_at) WHERE status = 'processing';
CREATE INDEX IF NOT EXISTS idx_job_queue_scheduled ON public.job_queue(scheduled_for) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_job_queue_worker_id ON public.job_queue(worker_id) WHERE worker_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_job_queue_created_at ON public.job_queue(created_at DESC);

-- Task logs indexes
CREATE INDEX IF NOT EXISTS idx_task_logs_task_id ON public.task_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_task_logs_task_type ON public.task_logs(task_type);
CREATE INDEX IF NOT EXISTS idx_task_logs_queue_name ON public.task_logs(queue_name);
CREATE INDEX IF NOT EXISTS idx_task_logs_created_at ON public.task_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_task_logs_success ON public.task_logs(success);
CREATE INDEX IF NOT EXISTS idx_task_logs_user_id ON public.task_logs(user_id);

-- Background tasks indexes
CREATE INDEX IF NOT EXISTS idx_background_tasks_status_priority ON public.background_tasks(status, priority, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_background_tasks_task_type ON public.background_tasks(task_type);
CREATE INDEX IF NOT EXISTS idx_background_tasks_grow_id ON public.background_tasks(grow_id);
CREATE INDEX IF NOT EXISTS idx_background_tasks_device_assignment_id ON public.background_tasks(device_assignment_id);

-- ============================================================================
-- QUEUE MANAGEMENT FUNCTIONS
-- ============================================================================

-- Enhanced job enqueue function
CREATE OR REPLACE FUNCTION public.enqueue_job(
    p_queue_name TEXT,
    p_job_type TEXT,
    p_payload JSONB DEFAULT '{}',
    p_priority INTEGER DEFAULT 0,
    p_scheduled_for TIMESTAMPTZ DEFAULT NOW(),
    p_max_attempts INTEGER DEFAULT 3
) RETURNS UUID AS $$
DECLARE
    job_id UUID;
BEGIN
    INSERT INTO public.job_queue (
        queue_name, job_type, payload, priority, scheduled_for, max_attempts, created_by
    ) VALUES (
        p_queue_name, p_job_type, p_payload, p_priority, p_scheduled_for, p_max_attempts, auth.uid()
    ) RETURNING id INTO job_id;
    
    -- Also send to PGMQ for immediate processing if scheduled for now
    IF p_scheduled_for <= NOW() THEN
        PERFORM pgmq.send(
            p_queue_name, 
            jsonb_build_object(
                'job_id', job_id,
                'job_type', p_job_type,
                'payload', p_payload,
                'priority', p_priority
            )
        );
    END IF;
    
    RETURN job_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get next job from queue with worker assignment
CREATE OR REPLACE FUNCTION public.get_next_job(
    p_queue_name TEXT,
    p_worker_id TEXT DEFAULT NULL
) RETURNS TABLE (
    job_id UUID,
    job_type TEXT,
    payload JSONB,
    attempts INTEGER,
    priority INTEGER
) AS $$
BEGIN
    RETURN QUERY
    UPDATE public.job_queue 
    SET 
        status = 'processing',
        started_at = NOW(),
        updated_at = NOW(),
        attempts = attempts + 1,
        worker_id = p_worker_id
    WHERE id = (
        SELECT jq.id
        FROM public.job_queue jq
        JOIN public.queue_config qc ON jq.queue_name = qc.queue_name
        WHERE jq.queue_name = p_queue_name
        AND jq.status = 'pending'
        AND jq.scheduled_for <= NOW()
        AND qc.is_active = TRUE
        AND jq.attempts < jq.max_attempts
        AND (
            SELECT COUNT(*)
            FROM public.job_queue
            WHERE queue_name = p_queue_name
            AND status = 'processing'
        ) < qc.max_concurrent_jobs
        ORDER BY jq.priority DESC, jq.scheduled_for ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED
    )
    RETURNING job_queue.id, job_queue.job_type, job_queue.payload, job_queue.attempts, job_queue.priority;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Complete job with enhanced logging
CREATE OR REPLACE FUNCTION public.complete_job(
    p_job_id UUID, 
    p_status TEXT, 
    p_error_message TEXT DEFAULT NULL,
    p_execution_time_ms INTEGER DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    job_record RECORD;
    log_priority TEXT;
BEGIN
    SELECT * INTO job_record FROM public.job_queue WHERE id = p_job_id;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Update job status
    UPDATE public.job_queue
    SET 
        status = p_status,
        completed_at = NOW(),
        updated_at = NOW(),
        error_message = p_error_message,
        execution_time_ms = COALESCE(p_execution_time_ms, EXTRACT(EPOCH FROM (NOW() - started_at)) * 1000)
    WHERE id = p_job_id;
    
    -- Determine log priority
    log_priority := CASE 
        WHEN p_status = 'failed' THEN 'high'
        WHEN p_status = 'completed' THEN 'normal'
        ELSE 'normal'
    END;
    
    -- Log task execution
    PERFORM public.log_task_execution(
        p_job_id::TEXT,
        job_record.job_type,
        log_priority,
        p_status = 'completed',
        COALESCE(p_execution_time_ms, EXTRACT(EPOCH FROM (NOW() - job_record.started_at)) * 1000)::INTEGER,
        p_error_message,
        job_record.attempts
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced task logging function
CREATE OR REPLACE FUNCTION public.log_task_execution(
    p_task_id TEXT,
    p_task_type TEXT,
    p_priority TEXT,
    p_success BOOLEAN,
    p_execution_time_ms INTEGER,
    p_error_message TEXT DEFAULT NULL,
    p_retry_count INTEGER DEFAULT 0,
    p_queue_name TEXT DEFAULT NULL,
    p_worker_id TEXT DEFAULT NULL
) RETURNS BIGINT AS $$
DECLARE
    log_id BIGINT;
BEGIN
    INSERT INTO public.task_logs (
        task_id, task_type, queue_name, priority, success, execution_time_ms,
        error_message, retry_count, worker_id, user_id
    ) VALUES (
        p_task_id, p_task_type, p_queue_name, p_priority, p_success, p_execution_time_ms,
        p_error_message, p_retry_count, p_worker_id, auth.uid()
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Retry failed job with exponential backoff
CREATE OR REPLACE FUNCTION public.retry_failed_job(p_job_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    job_record RECORD;
    retry_delay INTEGER;
    backoff_multiplier INTEGER := 2;
BEGIN
    SELECT jq.*, qc.retry_delay_seconds
    INTO job_record
    FROM public.job_queue jq
    JOIN public.queue_config qc ON jq.queue_name = qc.queue_name
    WHERE jq.id = p_job_id;
    
    IF NOT FOUND OR job_record.attempts >= job_record.max_attempts THEN
        RETURN FALSE;
    END IF;
    
    -- Calculate exponential backoff delay
    retry_delay := job_record.retry_delay_seconds * POWER(backoff_multiplier, job_record.attempts - 1);
    
    UPDATE public.job_queue
    SET 
        status = 'pending',
        scheduled_for = NOW() + (retry_delay || ' seconds')::INTERVAL,
        started_at = NULL,
        completed_at = NULL,
        error_message = NULL,
        worker_id = NULL,
        updated_at = NOW()
    WHERE id = p_job_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- AUTOMATION SCHEDULING FUNCTIONS
-- ============================================================================

-- Schedule grow automation jobs
CREATE OR REPLACE FUNCTION public.schedule_grow_automation_jobs()
RETURNS INTEGER AS $$
DECLARE
    scheduled_count INTEGER := 0;
BEGIN
    -- Schedule stage progression checks for active grows
    WITH new_jobs AS (
        INSERT INTO public.job_queue (queue_name, job_type, payload, priority, scheduled_for)
        SELECT 
            'farm_automation',
            'check_stage_progression',
            jsonb_build_object(
                'grow_id', g.id,
                'shelf_id', g.shelf_id,
                'current_stage_id', g.current_stage_id
            ),
            5, -- Medium priority
            NOW() + INTERVAL '1 hour'
        FROM public.grows g
        WHERE g.status = 'active'
        AND g.id NOT IN (
            SELECT (payload->>'grow_id')::UUID
            FROM public.job_queue
            WHERE queue_name = 'farm_automation'
            AND job_type = 'check_stage_progression'
            AND status IN ('pending', 'processing')
            AND (payload->>'grow_id')::UUID = g.id
        )
        RETURNING 1
    )
    SELECT COUNT(*) INTO scheduled_count FROM new_jobs;
    
    -- Schedule harvest readiness checks
    WITH harvest_jobs AS (
        INSERT INTO public.job_queue (queue_name, job_type, payload, priority, scheduled_for)
        SELECT 
            'farm_automation',
            'check_harvest_readiness',
            jsonb_build_object(
                'grow_id', g.id,
                'shelf_id', g.shelf_id,
                'estimated_harvest_date', g.estimated_harvest_date
            ),
            8, -- High priority for harvest checks
            NOW() + INTERVAL '6 hours'
        FROM public.grows g
        WHERE g.status = 'active'
        AND g.estimated_harvest_date <= NOW() + INTERVAL '3 days'
        AND g.id NOT IN (
            SELECT (payload->>'grow_id')::UUID
            FROM public.job_queue
            WHERE queue_name = 'farm_automation'
            AND job_type = 'check_harvest_readiness'
            AND status IN ('pending', 'processing')
            AND (payload->>'grow_id')::UUID = g.id
        )
        RETURNING 1
    )
    SELECT scheduled_count + COUNT(*) INTO scheduled_count FROM harvest_jobs;
    
    RETURN scheduled_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule sensor data processing
CREATE OR REPLACE FUNCTION public.schedule_sensor_processing()
RETURNS INTEGER AS $$
DECLARE
    scheduled_count INTEGER := 0;
BEGIN
    -- Process recent sensor readings that haven't been analyzed
    WITH sensor_jobs AS (
        INSERT INTO public.job_queue (queue_name, job_type, payload, priority)
        SELECT DISTINCT
            'sensor_processing',
            'analyze_sensor_data',
            jsonb_build_object(
                'device_assignment_id', sr.device_assignment_id,
                'sensor_type', sr.sensor_type,
                'time_window', '1 hour'
            ),
            3 -- Normal priority
        FROM public.sensor_readings sr
        WHERE sr.timestamp >= NOW() - INTERVAL '1 hour'
        AND sr.processed_at IS NULL
        AND NOT EXISTS (
            SELECT 1 FROM public.job_queue jq
            WHERE jq.queue_name = 'sensor_processing'
            AND jq.job_type = 'analyze_sensor_data'
            AND jq.status IN ('pending', 'processing')
            AND (jq.payload->>'device_assignment_id')::UUID = sr.device_assignment_id
            AND jq.payload->>'sensor_type' = sr.sensor_type
        )
        LIMIT 100 -- Batch processing limit
        RETURNING 1
    )
    SELECT COUNT(*) INTO scheduled_count FROM sensor_jobs;
    
    RETURN scheduled_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- CLEANUP AND MAINTENANCE FUNCTIONS
-- ============================================================================

-- Clean up old completed jobs
CREATE OR REPLACE FUNCTION public.cleanup_completed_jobs(p_days_old INTEGER DEFAULT 7)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.job_queue
    WHERE status IN ('completed', 'failed', 'cancelled')
    AND completed_at < NOW() - (p_days_old || ' days')::INTERVAL;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Also clean up old task logs
    DELETE FROM public.task_logs
    WHERE created_at < NOW() - (p_days_old || ' days')::INTERVAL;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- QUEUE CONFIGURATION INITIALIZATION
-- ============================================================================

-- Initialize queue configurations
INSERT INTO public.queue_config (
    queue_name, max_concurrent_jobs, retry_delay_seconds, max_job_runtime_seconds, priority_weight
) VALUES
('farm_automation', 5, 300, 3600, 1.5),
('sensor_processing', 10, 60, 1800, 1.0),
('notifications', 8, 120, 600, 0.8),
('analytics', 3, 600, 7200, 0.5),
('maintenance', 2, 1800, 10800, 0.3),
('background_tasks', 15, 180, 3600, 1.2);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on task_logs
ALTER TABLE public.task_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for task_logs (drop if exists first)
DROP POLICY IF EXISTS "Users can manage their own task logs" ON public.task_logs;
CREATE POLICY "Users can manage their own task logs" ON public.task_logs
    FOR ALL USING (auth.uid() = user_id);

-- Enable RLS on job_queue  
ALTER TABLE public.job_queue ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for job_queue
CREATE POLICY "Users can manage jobs they created" ON public.job_queue
    FOR ALL USING (auth.uid() = created_by OR EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE id = auth.uid() AND role IN ('admin', 'farm_manager')
    ));

-- ============================================================================
-- TRIGGERS FOR AUTOMATED SCHEDULING
-- ============================================================================

-- Trigger function for grow automation
CREATE OR REPLACE FUNCTION public.trigger_grow_automation()
RETURNS TRIGGER AS $$
BEGIN
    -- When a grow is created or updated to active, schedule automation jobs
    IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.status = 'active' AND OLD.status != 'active') THEN
        PERFORM public.enqueue_job(
            'farm_automation',
            'initialize_grow_automation',
            jsonb_build_object(
                'grow_id', NEW.id,
                'shelf_id', NEW.shelf_id,
                'grow_recipe_id', NEW.grow_recipe_id
            ),
            7 -- High priority for new grows
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for schedule automation
CREATE TRIGGER grow_automation_trigger
    AFTER INSERT OR UPDATE ON public.grows
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_grow_automation();

-- Trigger function for sensor processing
CREATE OR REPLACE FUNCTION public.trigger_sensor_processing()
RETURNS TRIGGER AS $$
BEGIN
    -- Queue sensor data for processing if it's a critical reading
    IF NEW.sensor_type IN ('temperature', 'humidity', 'ph', 'ec') THEN
        PERFORM pgmq.send(
            'sensor_processing',
            jsonb_build_object(
                'sensor_reading_id', NEW.id,
                'device_assignment_id', NEW.device_assignment_id,
                'sensor_type', NEW.sensor_type,
                'value', NEW.value,
                'timestamp', NEW.timestamp
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for sensor processing
CREATE TRIGGER sensor_processing_trigger
    AFTER INSERT ON public.sensor_readings
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_sensor_processing();

-- ============================================================================
-- COMMENTS AND DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE public.job_queue IS 'Main job queue for complex automation tasks with priority and retry logic';
COMMENT ON TABLE public.queue_config IS 'Configuration settings for different queue types';
COMMENT ON TABLE public.task_logs IS 'Comprehensive logging for all queue operations and task executions';
COMMENT ON TABLE public.background_tasks IS 'Background task processing queue integrated with PGMQ';

COMMENT ON FUNCTION public.enqueue_job IS 'Enqueue a new job with PGMQ integration for immediate processing';
COMMENT ON FUNCTION public.get_next_job IS 'Get the next available job from queue with worker assignment';
COMMENT ON FUNCTION public.complete_job IS 'Mark job as completed with enhanced logging and metrics';
COMMENT ON FUNCTION public.schedule_grow_automation_jobs IS 'Schedule automation jobs for active growing schedules';

-- Mark migration as completed in consolidation log
-- UPDATE public.migration_consolidation_log 
-- SET status = 'completed', completed_at = NOW() 
-- WHERE consolidation_phase = 'queue_system';
-- Note: migration_consolidation_log table does not exist in production 