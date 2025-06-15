-- Queue System Setup Migration
-- This migration sets up the complete queue system for background task processing

-- Set the search path to include public schema
SET search_path TO public;

-- Enable the pgmq extension for message queues
CREATE EXTENSION IF NOT EXISTS pgmq;

-- Create task logging table
CREATE TABLE IF NOT EXISTS public.task_logs (
    id BIGSERIAL PRIMARY KEY,
    task_id TEXT NOT NULL,
    task_type TEXT NOT NULL,
    priority TEXT NOT NULL CHECK (priority IN ('critical', 'high', 'normal', 'low')),
    success BOOLEAN NOT NULL,
    execution_time INTEGER NOT NULL, -- milliseconds
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for task logs
CREATE INDEX IF NOT EXISTS idx_task_logs_task_id ON public.task_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_task_logs_task_type ON public.task_logs(task_type);
CREATE INDEX IF NOT EXISTS idx_task_logs_created_at ON public.task_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_task_logs_success ON public.task_logs(success);

-- Create integrations table for storing Home Assistant and other integration configs
CREATE TABLE IF NOT EXISTS public.integrations (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'home_assistant', 'zigbee', etc.
    name TEXT NOT NULL,
    config JSONB NOT NULL, -- Store connection details, API keys, etc.
    health_status TEXT DEFAULT 'unknown' CHECK (health_status IN ('healthy', 'unhealthy', 'unknown')),
    last_health_check TIMESTAMPTZ,
    response_time INTEGER, -- milliseconds
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, type, name)
);

-- Create indexes for integrations
CREATE INDEX IF NOT EXISTS idx_integrations_user_id ON public.integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_integrations_type ON public.integrations(type);
CREATE INDEX IF NOT EXISTS idx_integrations_health_status ON public.integrations(health_status);

-- Create Home Assistant devices table
CREATE TABLE IF NOT EXISTS public.home_assistant_devices (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    entity_id TEXT NOT NULL,
    name TEXT NOT NULL,
    device_type TEXT NOT NULL, -- 'light', 'switch', 'fan', 'valve'
    state TEXT,
    attributes JSONB,
    farm_location JSONB, -- {row: 1, rack: 2, shelf: 3}
    is_assigned BOOLEAN DEFAULT false,
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, entity_id)
);

-- Create indexes for Home Assistant devices
CREATE INDEX IF NOT EXISTS idx_ha_devices_user_id ON public.home_assistant_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_ha_devices_entity_id ON public.home_assistant_devices(entity_id);
CREATE INDEX IF NOT EXISTS idx_ha_devices_device_type ON public.home_assistant_devices(device_type);
CREATE INDEX IF NOT EXISTS idx_ha_devices_is_assigned ON public.home_assistant_devices(is_assigned);

-- Create device assignments table for mapping devices to farm locations
CREATE TABLE IF NOT EXISTS public.device_assignments (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    entity_id TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    friendly_name TEXT,
    farm_id UUID,
    row_id UUID,
    rack_id UUID,
    shelf_id UUID,
    assigned_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, entity_id)
);

-- Create indexes for device assignments
CREATE INDEX IF NOT EXISTS idx_device_assignments_user_id ON public.device_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_device_assignments_entity_id ON public.device_assignments(entity_id);
CREATE INDEX IF NOT EXISTS idx_device_assignments_farm_id ON public.device_assignments(farm_id);
CREATE INDEX IF NOT EXISTS idx_device_assignments_row_id ON public.device_assignments(row_id);
CREATE INDEX IF NOT EXISTS idx_device_assignments_rack_id ON public.device_assignments(rack_id);
CREATE INDEX IF NOT EXISTS idx_device_assignments_shelf_id ON public.device_assignments(shelf_id);

-- Create device schedules table
CREATE TABLE IF NOT EXISTS public.device_schedules (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    entity_ids TEXT[] NOT NULL, -- Array of Home Assistant entity IDs
    action TEXT NOT NULL, -- 'turn_on', 'turn_off', 'set_brightness'
    value INTEGER, -- For brightness, temperature, etc.
    cron_expression TEXT NOT NULL, -- Standard cron format
    is_active BOOLEAN DEFAULT true,
    last_executed TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for device schedules
CREATE INDEX IF NOT EXISTS idx_device_schedules_user_id ON public.device_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_device_schedules_is_active ON public.device_schedules(is_active);
CREATE INDEX IF NOT EXISTS idx_device_schedules_last_executed ON public.device_schedules(last_executed);

-- Create device history table for storing historical data
CREATE TABLE IF NOT EXISTS public.device_history (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    entity_id TEXT NOT NULL,
    state TEXT,
    attributes JSONB,
    recorded_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for device history
CREATE INDEX IF NOT EXISTS idx_device_history_user_id ON public.device_history(user_id);
CREATE INDEX IF NOT EXISTS idx_device_history_entity_id ON public.device_history(entity_id);
CREATE INDEX IF NOT EXISTS idx_device_history_recorded_at ON public.device_history(recorded_at);

-- Create message queues for different priority levels
SELECT pgmq.create('critical_tasks');
SELECT pgmq.create('high_tasks');
SELECT pgmq.create('normal_tasks');
SELECT pgmq.create('low_tasks');
SELECT pgmq.create('failed_tasks'); -- Dead letter queue

-- Create RLS policies for all tables
ALTER TABLE public.task_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.home_assistant_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_history ENABLE ROW LEVEL SECURITY;

-- Task logs policies (admin only for now)
CREATE POLICY "task_logs_admin_access" ON public.task_logs
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Integrations policies
CREATE POLICY "integrations_user_access" ON public.integrations
    FOR ALL USING (auth.uid() = user_id);

-- Home Assistant devices policies
CREATE POLICY "ha_devices_user_access" ON public.home_assistant_devices
    FOR ALL USING (auth.uid() = user_id);

-- Device assignments policies
CREATE POLICY "device_assignments_user_access" ON public.device_assignments
    FOR ALL USING (auth.uid() = user_id);

-- Device schedules policies
CREATE POLICY "device_schedules_user_access" ON public.device_schedules
    FOR ALL USING (auth.uid() = user_id);

-- Device history policies
CREATE POLICY "device_history_user_access" ON public.device_history
    FOR ALL USING (auth.uid() = user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_integrations_updated_at BEFORE UPDATE ON public.integrations
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ha_devices_updated_at BEFORE UPDATE ON public.home_assistant_devices
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_device_assignments_updated_at BEFORE UPDATE ON public.device_assignments
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_device_schedules_updated_at BEFORE UPDATE ON public.device_schedules
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create helper functions for queue operations
CREATE OR REPLACE FUNCTION public.queue_background_task(
    task_type TEXT,
    priority TEXT DEFAULT 'normal',
    payload JSONB DEFAULT '{}',
    user_id_param UUID DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
    task_id TEXT;
    queue_name TEXT;
    task_message JSONB;
BEGIN
    -- Generate unique task ID
    task_id := 'task_' || extract(epoch from now()) || '_' || floor(random() * 1000000);
    
    -- Determine queue based on priority
    queue_name := priority || '_tasks';
    
    -- Create task message
    task_message := jsonb_build_object(
        'task_id', task_id,
        'task_type', task_type,
        'priority', priority,
        'payload', payload,
        'user_id', user_id_param,
        'created_at', now()
    );
    
    -- Send message to appropriate queue
    PERFORM pgmq.send(queue_name, task_message);
    
    RETURN task_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to read from queues
CREATE OR REPLACE FUNCTION public.read_queue_messages(
    queue_name TEXT,
    batch_size INTEGER DEFAULT 10
)
RETURNS TABLE(
    msg_id BIGINT,
    read_ct INTEGER,
    enqueued_at TIMESTAMPTZ,
    message JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM pgmq.read(queue_name, 30, batch_size); -- 30 second visibility timeout
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to delete processed messages
CREATE OR REPLACE FUNCTION public.delete_queue_message(
    queue_name TEXT,
    msg_id BIGINT
)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN pgmq.delete(queue_name, msg_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get queue statistics
CREATE OR REPLACE FUNCTION public.get_queue_stats()
RETURNS TABLE(
    queue_name TEXT,
    queue_length BIGINT,
    newest_msg_age_sec INTEGER,
    oldest_msg_age_sec INTEGER,
    total_messages BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        q.queue_name::TEXT,
        q.queue_length,
        q.newest_msg_age_sec,
        q.oldest_msg_age_sec,
        q.total_messages
    FROM pgmq.metrics_all() q
    WHERE q.queue_name IN ('critical_tasks', 'high_tasks', 'normal_tasks', 'low_tasks', 'failed_tasks');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to move failed messages to dead letter queue
CREATE OR REPLACE FUNCTION public.move_to_failed_queue(
    original_queue TEXT,
    msg_id BIGINT,
    error_message TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    message_data JSONB;
    failed_message JSONB;
BEGIN
    -- Get the original message
    SELECT message INTO message_data 
    FROM pgmq.read(original_queue, 1, 1) 
    WHERE msg_id = move_to_failed_queue.msg_id;
    
    IF message_data IS NOT NULL THEN
        -- Add failure information
        failed_message := message_data || jsonb_build_object(
            'failed_at', now(),
            'original_queue', original_queue,
            'error_message', error_message
        );
        
        -- Send to failed queue
        PERFORM pgmq.send('failed_tasks', failed_message);
        
        -- Delete from original queue
        PERFORM pgmq.delete(original_queue, msg_id);
        
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to log task execution
CREATE OR REPLACE FUNCTION public.log_task_execution(
    task_id_param TEXT,
    task_type_param TEXT,
    priority_param TEXT,
    success_param BOOLEAN,
    execution_time_param INTEGER,
    error_message_param TEXT DEFAULT NULL,
    retry_count_param INTEGER DEFAULT 0
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.task_logs (
        task_id,
        task_type,
        priority,
        success,
        execution_time,
        error_message,
        retry_count
    ) VALUES (
        task_id_param,
        task_type_param,
        priority_param,
        success_param,
        execution_time_param,
        error_message_param,
        retry_count_param
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Grant service role permissions for queue operations
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role; 