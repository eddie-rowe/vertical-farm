-- Layer Two: Grow-Device Integration Schema
-- This migration bridges the grow management system with the device monitoring layer
-- enabling automated device control based on grow parameters

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Grow automation rules - defines how devices should be controlled for grows
CREATE TABLE IF NOT EXISTS grow_automation_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    grow_id UUID REFERENCES grows(id) ON DELETE CASCADE,
    device_assignment_id UUID REFERENCES device_assignments(id) ON DELETE CASCADE,
    rule_type VARCHAR(50) NOT NULL, -- schedule, condition, event_trigger
    rule_config JSONB NOT NULL, -- stores rule parameters (schedule, conditions, etc.)
    is_active BOOLEAN DEFAULT TRUE,
    priority INTEGER DEFAULT 0, -- higher numbers = higher priority
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Grow automation schedules - handles time-based automation
CREATE TABLE IF NOT EXISTS grow_automation_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    grow_id UUID REFERENCES grows(id) ON DELETE CASCADE,
    device_assignment_id UUID REFERENCES device_assignments(id) ON DELETE CASCADE,
    schedule_name VARCHAR(100) NOT NULL,
    schedule_type VARCHAR(30) NOT NULL, -- daily, weekly, stage_based, custom
    cron_expression VARCHAR(100), -- for complex schedules
    device_action JSONB NOT NULL, -- action to perform
    is_active BOOLEAN DEFAULT TRUE,
    starts_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Grow automation conditions - handles sensor-based automation
CREATE TABLE IF NOT EXISTS grow_automation_conditions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    grow_id UUID REFERENCES grows(id) ON DELETE CASCADE,
    device_assignment_id UUID REFERENCES device_assignments(id) ON DELETE CASCADE,
    condition_name VARCHAR(100) NOT NULL,
    sensor_entity_id VARCHAR(255) NOT NULL, -- Home Assistant sensor entity
    condition_type VARCHAR(30) NOT NULL, -- above, below, between, equals
    threshold_value DECIMAL(10,2),
    threshold_min DECIMAL(10,2),
    threshold_max DECIMAL(10,2),
    device_action JSONB NOT NULL, -- action to perform when condition is met
    cooldown_minutes INTEGER DEFAULT 0, -- prevent rapid triggering
    is_active BOOLEAN DEFAULT TRUE,
    last_triggered_at TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Grow automation execution log - track when automation runs
CREATE TABLE IF NOT EXISTS grow_automation_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    grow_id UUID REFERENCES grows(id) ON DELETE CASCADE,
    automation_type VARCHAR(50) NOT NULL, -- rule, schedule, condition, manual
    automation_id UUID, -- ID of the rule/schedule/condition that triggered
    device_assignment_id UUID REFERENCES device_assignments(id) ON DELETE CASCADE,
    action_taken JSONB NOT NULL,
    execution_status VARCHAR(30) DEFAULT 'pending', -- pending, success, failed, skipped
    execution_result JSONB, -- response from device control
    error_message TEXT,
    executed_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Grow device profiles - templates for common device configurations
CREATE TABLE IF NOT EXISTS grow_device_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_name VARCHAR(100) NOT NULL,
    crop_id UUID REFERENCES crops(id),
    grow_stage_id UUID REFERENCES grow_stages(id),
    device_type VARCHAR(50) NOT NULL, -- light, pump, fan, sensor
    profile_config JSONB NOT NULL, -- device-specific configuration
    description TEXT,
    is_template BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(profile_name, crop_id, grow_stage_id, device_type)
);

-- Enhanced grow parameters to include device automation settings
DO $$
BEGIN
    -- Add automation_enabled column to grows table if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'grows' AND column_name = 'automation_enabled'
    ) THEN
        ALTER TABLE public.grows ADD COLUMN automation_enabled BOOLEAN DEFAULT TRUE;
    END IF;

    -- Add device_profile_id to grows table for template-based automation
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'grows' AND column_name = 'device_profile_id'
    ) THEN
        ALTER TABLE public.grows ADD COLUMN device_profile_id UUID REFERENCES grow_device_profiles(id);
    END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_grow_automation_rules_grow_id ON grow_automation_rules(grow_id);
CREATE INDEX IF NOT EXISTS idx_grow_automation_rules_device_assignment_id ON grow_automation_rules(device_assignment_id);
CREATE INDEX IF NOT EXISTS idx_grow_automation_rules_active ON grow_automation_rules(is_active, grow_id);

CREATE INDEX IF NOT EXISTS idx_grow_automation_schedules_grow_id ON grow_automation_schedules(grow_id);
CREATE INDEX IF NOT EXISTS idx_grow_automation_schedules_active ON grow_automation_schedules(is_active, starts_at, ends_at);

CREATE INDEX IF NOT EXISTS idx_grow_automation_conditions_grow_id ON grow_automation_conditions(grow_id);
CREATE INDEX IF NOT EXISTS idx_grow_automation_conditions_sensor ON grow_automation_conditions(sensor_entity_id, is_active);

CREATE INDEX IF NOT EXISTS idx_grow_automation_executions_grow_id ON grow_automation_executions(grow_id);
CREATE INDEX IF NOT EXISTS idx_grow_automation_executions_status ON grow_automation_executions(execution_status, executed_at);

-- Database functions for automation management
CREATE OR REPLACE FUNCTION get_grow_device_assignments(grow_id_param UUID)
RETURNS TABLE (
    assignment_id UUID,
    entity_id VARCHAR,
    device_type VARCHAR,
    location_id UUID,
    location_name VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        da.id as assignment_id,
        da.home_assistant_entity_id as entity_id,
        da.device_type,
        gla.location_id,
        gl.name as location_name
    FROM device_assignments da
    JOIN grow_location_assignments gla ON da.location_id = gla.location_id
    JOIN grow_locations gl ON gla.location_id = gl.id
    WHERE gla.grow_id = grow_id_param 
    AND gla.removed_at IS NULL
    AND da.is_active = TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION create_automation_schedule(
    grow_id_param UUID,
    device_assignment_id_param UUID,
    schedule_name_param VARCHAR,
    schedule_type_param VARCHAR,
    device_action_param JSONB,
    cron_expression_param VARCHAR DEFAULT NULL,
    starts_at_param TIMESTAMPTZ DEFAULT NULL,
    ends_at_param TIMESTAMPTZ DEFAULT NULL,
    created_by_param UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    schedule_id UUID;
BEGIN
    INSERT INTO grow_automation_schedules (
        grow_id,
        device_assignment_id,
        schedule_name,
        schedule_type,
        device_action,
        cron_expression,
        starts_at,
        ends_at,
        created_by
    ) VALUES (
        grow_id_param,
        device_assignment_id_param,
        schedule_name_param,
        schedule_type_param,
        device_action_param,
        cron_expression_param,
        COALESCE(starts_at_param, NOW()),
        ends_at_param,
        created_by_param
    ) RETURNING id INTO schedule_id;
    
    RETURN schedule_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION log_automation_execution(
    grow_id_param UUID,
    automation_type_param VARCHAR,
    automation_id_param UUID,
    device_assignment_id_param UUID,
    action_taken_param JSONB,
    execution_status_param VARCHAR DEFAULT 'pending',
    execution_result_param JSONB DEFAULT NULL,
    error_message_param TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    execution_id UUID;
BEGIN
    INSERT INTO grow_automation_executions (
        grow_id,
        automation_type,
        automation_id,
        device_assignment_id,
        action_taken,
        execution_status,
        execution_result,
        error_message,
        completed_at
    ) VALUES (
        grow_id_param,
        automation_type_param,
        automation_id_param,
        device_assignment_id_param,
        action_taken_param,
        execution_status_param,
        execution_result_param,
        error_message_param,
        CASE WHEN execution_status_param != 'pending' THEN NOW() ELSE NULL END
    ) RETURNING id INTO execution_id;
    
    RETURN execution_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function for timestamp updates
CREATE OR REPLACE FUNCTION update_automation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for timestamp updates
CREATE TRIGGER update_grow_automation_rules_timestamp 
    BEFORE UPDATE ON grow_automation_rules 
    FOR EACH ROW 
    EXECUTE FUNCTION update_automation_timestamp();

CREATE TRIGGER update_grow_automation_schedules_timestamp 
    BEFORE UPDATE ON grow_automation_schedules 
    FOR EACH ROW 
    EXECUTE FUNCTION update_automation_timestamp();

CREATE TRIGGER update_grow_automation_conditions_timestamp 
    BEFORE UPDATE ON grow_automation_conditions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_automation_timestamp();

CREATE TRIGGER update_grow_device_profiles_timestamp 
    BEFORE UPDATE ON grow_device_profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_automation_timestamp();

-- Enable RLS on all tables
ALTER TABLE grow_automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE grow_automation_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE grow_automation_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE grow_automation_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE grow_device_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own automation rules" ON grow_automation_rules
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM grows g 
            WHERE g.id = grow_automation_rules.grow_id 
            AND g.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can manage their own automation schedules" ON grow_automation_schedules
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM grows g 
            WHERE g.id = grow_automation_schedules.grow_id 
            AND g.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can manage their own automation conditions" ON grow_automation_conditions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM grows g 
            WHERE g.id = grow_automation_conditions.grow_id 
            AND g.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can view their own automation executions" ON grow_automation_executions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM grows g 
            WHERE g.id = grow_automation_executions.grow_id 
            AND g.created_by = auth.uid()
        )
    );

CREATE POLICY "Service can insert automation executions" ON grow_automation_executions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can manage their own device profiles" ON grow_device_profiles
    FOR ALL USING (created_by = auth.uid() OR is_template = true);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON grow_automation_rules TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON grow_automation_schedules TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON grow_automation_conditions TO authenticated;
GRANT SELECT ON grow_automation_executions TO authenticated;
GRANT INSERT ON grow_automation_executions TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON grow_device_profiles TO authenticated;

-- Grant function permissions
GRANT EXECUTE ON FUNCTION get_grow_device_assignments(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION create_automation_schedule(UUID, UUID, VARCHAR, VARCHAR, JSONB, VARCHAR, TIMESTAMPTZ, TIMESTAMPTZ, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION log_automation_execution(UUID, VARCHAR, UUID, UUID, JSONB, VARCHAR, JSONB, TEXT) TO service_role;

-- Enable realtime for automation tables
ALTER PUBLICATION supabase_realtime ADD TABLE grow_automation_rules;
ALTER PUBLICATION supabase_realtime ADD TABLE grow_automation_schedules;
ALTER PUBLICATION supabase_realtime ADD TABLE grow_automation_conditions;
ALTER PUBLICATION supabase_realtime ADD TABLE grow_automation_executions;

-- Insert default device profiles for common crops (safe approach)
-- Use DO blocks to safely insert only if records don't exist
DO $$
BEGIN
    -- Insert Leafy Greens Light Schedule if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM grow_device_profiles 
        WHERE profile_name = 'Leafy Greens - Light Schedule' 
        AND device_type = 'light' 
        AND crop_id IS NULL 
        AND grow_stage_id IS NULL
    ) THEN
        INSERT INTO grow_device_profiles (profile_name, device_type, profile_config, description, is_template) 
        VALUES ('Leafy Greens - Light Schedule', 'light', '{"schedule": "daily", "on_time": "06:00", "off_time": "22:00", "intensity": 80}'::jsonb, 'Standard lighting schedule for leafy greens', true);
    END IF;

    -- Insert Herbs Watering Schedule if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM grow_device_profiles 
        WHERE profile_name = 'Herbs - Watering Schedule' 
        AND device_type = 'pump' 
        AND crop_id IS NULL 
        AND grow_stage_id IS NULL
    ) THEN
        INSERT INTO grow_device_profiles (profile_name, device_type, profile_config, description, is_template) 
        VALUES ('Herbs - Watering Schedule', 'pump', '{"schedule": "every_2_days", "duration_seconds": 30, "flow_rate": "medium"}'::jsonb, 'Watering schedule for herbs', true);
    END IF;

    -- Insert Microgreens Fan Control if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM grow_device_profiles 
        WHERE profile_name = 'Microgreens - Fan Control' 
        AND device_type = 'fan' 
        AND crop_id IS NULL 
        AND grow_stage_id IS NULL
    ) THEN
        INSERT INTO grow_device_profiles (profile_name, device_type, profile_config, description, is_template) 
        VALUES ('Microgreens - Fan Control', 'fan', '{"temperature_trigger": 24, "humidity_trigger": 70, "speed": "medium"}'::jsonb, 'Air circulation for microgreens', true);
    END IF;

    -- Insert General Temperature Control if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM grow_device_profiles 
        WHERE profile_name = 'General - Temperature Control' 
        AND device_type = 'fan' 
        AND crop_id IS NULL 
        AND grow_stage_id IS NULL
    ) THEN
        INSERT INTO grow_device_profiles (profile_name, device_type, profile_config, description, is_template) 
        VALUES ('General - Temperature Control', 'fan', '{"min_temp": 18, "max_temp": 26, "target_temp": 22}'::jsonb, 'General temperature control', true);
    END IF;
END $$; 