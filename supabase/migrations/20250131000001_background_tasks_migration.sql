-- Enable the pgmq extension for message queues
CREATE EXTENSION IF NOT EXISTS pgmq;

-- Create task logging table
CREATE TABLE IF NOT EXISTS task_logs (
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
CREATE INDEX IF NOT EXISTS idx_task_logs_task_id ON task_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_task_logs_task_type ON task_logs(task_type);
CREATE INDEX IF NOT EXISTS idx_task_logs_created_at ON task_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_task_logs_success ON task_logs(success);

-- Create integrations table for storing Home Assistant and other integration configs
CREATE TABLE IF NOT EXISTS integrations (
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
CREATE INDEX IF NOT EXISTS idx_integrations_user_id ON integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_integrations_type ON integrations(type);
CREATE INDEX IF NOT EXISTS idx_integrations_health_status ON integrations(health_status);

-- Create Home Assistant devices table
CREATE TABLE IF NOT EXISTS home_assistant_devices (
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
CREATE INDEX IF NOT EXISTS idx_ha_devices_user_id ON home_assistant_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_ha_devices_entity_id ON home_assistant_devices(entity_id);
CREATE INDEX IF NOT EXISTS idx_ha_devices_device_type ON home_assistant_devices(device_type);
CREATE INDEX IF NOT EXISTS idx_ha_devices_is_assigned ON home_assistant_devices(is_assigned);

-- Create device assignments table for mapping devices to farm locations
CREATE TABLE IF NOT EXISTS device_assignments (
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
CREATE INDEX IF NOT EXISTS idx_device_assignments_user_id ON device_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_device_assignments_entity_id ON device_assignments(entity_id);
CREATE INDEX IF NOT EXISTS idx_device_assignments_farm_id ON device_assignments(farm_id);
CREATE INDEX IF NOT EXISTS idx_device_assignments_row_id ON device_assignments(row_id);
CREATE INDEX IF NOT EXISTS idx_device_assignments_rack_id ON device_assignments(rack_id);
CREATE INDEX IF NOT EXISTS idx_device_assignments_shelf_id ON device_assignments(shelf_id);

-- Create device schedules table
CREATE TABLE IF NOT EXISTS device_schedules (
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
CREATE INDEX IF NOT EXISTS idx_device_schedules_user_id ON device_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_device_schedules_is_active ON device_schedules(is_active);
CREATE INDEX IF NOT EXISTS idx_device_schedules_last_executed ON device_schedules(last_executed);

-- Create device history table for storing historical data
CREATE TABLE IF NOT EXISTS device_history (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    entity_id TEXT NOT NULL,
    state TEXT,
    attributes JSONB,
    recorded_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for device history
CREATE INDEX IF NOT EXISTS idx_device_history_user_id ON device_history(user_id);
CREATE INDEX IF NOT EXISTS idx_device_history_entity_id ON device_history(entity_id);
CREATE INDEX IF NOT EXISTS idx_device_history_recorded_at ON device_history(recorded_at);

-- Create message queues for different priority levels
SELECT pgmq.create('critical_tasks');
SELECT pgmq.create('high_tasks');
SELECT pgmq.create('normal_tasks');
SELECT pgmq.create('low_tasks');
SELECT pgmq.create('failed_tasks'); -- Dead letter queue

-- Create RLS policies for all tables
ALTER TABLE task_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE home_assistant_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_history ENABLE ROW LEVEL SECURITY;

-- Task logs policies (admin only for now)
CREATE POLICY "task_logs_admin_access" ON task_logs
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Integrations policies
CREATE POLICY "integrations_user_access" ON integrations
    FOR ALL USING (auth.uid() = user_id);

-- Home Assistant devices policies
CREATE POLICY "ha_devices_user_access" ON home_assistant_devices
    FOR ALL USING (auth.uid() = user_id);

-- Device assignments policies
CREATE POLICY "device_assignments_user_access" ON device_assignments
    FOR ALL USING (auth.uid() = user_id);

-- Device schedules policies
CREATE POLICY "device_schedules_user_access" ON device_schedules
    FOR ALL USING (auth.uid() = user_id);

-- Device history policies
CREATE POLICY "device_history_user_access" ON device_history
    FOR ALL USING (auth.uid() = user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_integrations_updated_at BEFORE UPDATE ON integrations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ha_devices_updated_at BEFORE UPDATE ON home_assistant_devices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_device_assignments_updated_at BEFORE UPDATE ON device_assignments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_device_schedules_updated_at BEFORE UPDATE ON device_schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create helper functions for queue operations
CREATE OR REPLACE FUNCTION queue_background_task(
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
    task_id := 'task_' || extract(epoch from now()) || '_' || gen_random_uuid();
    
    -- Determine queue name
    queue_name := priority || '_tasks';
    
    -- Build task message
    task_message := jsonb_build_object(
        'id', task_id,
        'type', task_type,
        'priority', priority,
        'payload', payload,
        'metadata', jsonb_build_object(
            'created_at', now(),
            'retry_count', 0,
            'max_retries', 3,
            'user_id', user_id_param
        )
    );
    
    -- Send to queue
    PERFORM pgmq.send(queue_name, task_message);
    
    RETURN task_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get queue statistics
CREATE OR REPLACE FUNCTION get_queue_stats()
RETURNS TABLE (
    queue_name TEXT,
    queue_length BIGINT,
    oldest_msg_age_seconds BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        q.queue_name::TEXT,
        COALESCE(pgmq.queue_length(q.queue_name), 0) as queue_length,
        COALESCE(
            EXTRACT(EPOCH FROM (NOW() - (
                SELECT enqueued_at 
                FROM pgmq.q_critical_tasks 
                ORDER BY enqueued_at ASC 
                LIMIT 1
            )))::BIGINT, 
            0
        ) as oldest_msg_age_seconds
    FROM (
        VALUES 
            ('critical_tasks'),
            ('high_tasks'),
            ('normal_tasks'),
            ('low_tasks'),
            ('failed_tasks')
    ) AS q(queue_name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA pgmq_public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA pgmq_public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Insert some sample data for testing
INSERT INTO integrations (user_id, type, name, config) VALUES
    (
        '00000000-0000-0000-0000-000000000000', -- Replace with actual user ID
        'home_assistant',
        'Main Home Assistant',
        '{"url": "http://homeassistant.local:8123", "access_token": "your_token_here"}'::jsonb
    ) ON CONFLICT DO NOTHING; 