-- Layer One: Device Monitoring/Control Infrastructure
-- Migration: Add device assignments and monitoring tables

-- First, check if device_assignments table exists and add missing columns
-- Add location_id column to existing device_assignments table if it doesn't exist
DO $$
BEGIN
    -- Add location_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'device_assignments' 
        AND column_name = 'location_id'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE device_assignments ADD COLUMN location_id TEXT;
    END IF;
    
    -- Add home_assistant_entity_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'device_assignments' 
        AND column_name = 'home_assistant_entity_id'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE device_assignments ADD COLUMN home_assistant_entity_id TEXT;
    END IF;
    
    -- Add device_type column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'device_assignments' 
        AND column_name = 'device_type'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE device_assignments ADD COLUMN device_type TEXT CHECK (device_type IN ('light', 'pump', 'fan', 'sensor'));
    END IF;
    
    -- Add device_name column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'device_assignments' 
        AND column_name = 'device_name'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE device_assignments ADD COLUMN device_name TEXT;
    END IF;
    
    -- Add capabilities column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'device_assignments' 
        AND column_name = 'capabilities'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE device_assignments ADD COLUMN capabilities JSONB DEFAULT '{}';
    END IF;
    
    -- Add is_active column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'device_assignments' 
        AND column_name = 'is_active'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE device_assignments ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Create device_assignments table if it doesn't exist (fallback for new installations)
CREATE TABLE IF NOT EXISTS device_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    location_id TEXT, -- Format: 'R1-S3' (Row1-Shelf3) - now nullable for existing data
    home_assistant_entity_id TEXT,
    device_type TEXT CHECK (device_type IN ('light', 'pump', 'fan', 'sensor')),
    device_name TEXT,
    capabilities JSONB DEFAULT '{}', -- brightness, color, flow_rate, etc.
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Keep existing columns from the original table
    shelf_id UUID,
    rack_id UUID,
    row_id UUID,
    farm_id UUID,
    entity_id TEXT,
    entity_type TEXT,
    friendly_name TEXT,
    assigned_by UUID,
    integration_id UUID,
    manual_url TEXT,
    installation_photos TEXT[]
);

-- Device state cache - for performance and offline capability
CREATE TABLE IF NOT EXISTS device_states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    home_assistant_entity_id TEXT NOT NULL,
    state TEXT NOT NULL, -- 'on', 'off', 'unavailable', etc.
    attributes JSONB DEFAULT '{}', -- brightness, temperature, etc.
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_changed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(user_id, home_assistant_entity_id)
);

-- Device control history - audit trail for device actions
CREATE TABLE IF NOT EXISTS device_control_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    home_assistant_entity_id TEXT NOT NULL,
    action_type TEXT NOT NULL, -- 'turn_on', 'turn_off', 'set_brightness', etc.
    previous_state TEXT,
    new_state TEXT,
    triggered_by TEXT DEFAULT 'manual', -- 'manual', 'automation', 'schedule'
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance - now checking if location_id exists
DO $$
BEGIN
    -- Only create location_id index if the column exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'device_assignments' 
        AND column_name = 'location_id'
        AND table_schema = 'public'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_device_assignments_user_location ON device_assignments(user_id, location_id);
    END IF;
    
    -- Only create home_assistant_entity_id index if the column exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'device_assignments' 
        AND column_name = 'home_assistant_entity_id'
        AND table_schema = 'public'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_device_assignments_entity ON device_assignments(home_assistant_entity_id);
    END IF;
END $$;

-- Safe indexes that should work with existing schema
CREATE INDEX IF NOT EXISTS idx_device_assignments_user ON device_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_device_states_user_entity ON device_states(user_id, home_assistant_entity_id);
CREATE INDEX IF NOT EXISTS idx_device_states_updated ON device_states(last_updated);
CREATE INDEX IF NOT EXISTS idx_device_control_history_user ON device_control_history(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_device_control_history_entity ON device_control_history(home_assistant_entity_id, created_at);

-- RLS Policies for device_assignments
ALTER TABLE device_assignments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own device assignments" ON device_assignments;
DROP POLICY IF EXISTS "Users can insert their own device assignments" ON device_assignments;
DROP POLICY IF EXISTS "Users can update their own device assignments" ON device_assignments;
DROP POLICY IF EXISTS "Users can delete their own device assignments" ON device_assignments;

CREATE POLICY "Users can view their own device assignments" ON device_assignments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own device assignments" ON device_assignments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own device assignments" ON device_assignments
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own device assignments" ON device_assignments
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for device_states
ALTER TABLE device_states ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own device states" ON device_states
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own device states" ON device_states
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own device states" ON device_states
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- RLS Policies for device_control_history
ALTER TABLE device_control_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own device history" ON device_control_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own device history" ON device_control_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Functions for device state management
CREATE OR REPLACE FUNCTION update_device_state(
    p_user_id UUID,
    p_entity_id TEXT,
    p_state TEXT,
    p_attributes JSONB DEFAULT '{}'
) RETURNS VOID AS $$
BEGIN
    INSERT INTO device_states (user_id, home_assistant_entity_id, state, attributes, last_updated, last_changed)
    VALUES (p_user_id, p_entity_id, p_state, p_attributes, NOW(), NOW())
    ON CONFLICT (user_id, home_assistant_entity_id)
    DO UPDATE SET
        state = EXCLUDED.state,
        attributes = EXCLUDED.attributes,
        last_updated = NOW(),
        last_changed = CASE 
            WHEN device_states.state != EXCLUDED.state THEN NOW()
            ELSE device_states.last_changed
        END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get devices for a location - made more flexible
CREATE OR REPLACE FUNCTION get_location_devices(
    p_user_id UUID,
    p_location_id TEXT
) RETURNS TABLE (
    assignment_id UUID,
    entity_id TEXT,
    device_type TEXT,
    device_name TEXT,
    capabilities JSONB,
    current_state TEXT,
    attributes JSONB,
    last_updated TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        da.id as assignment_id,
        COALESCE(da.home_assistant_entity_id, da.entity_id) as entity_id,
        COALESCE(da.device_type, da.entity_type) as device_type,
        COALESCE(da.device_name, da.friendly_name) as device_name,
        COALESCE(da.capabilities, '{}'::jsonb) as capabilities,
        ds.state as current_state,
        ds.attributes,
        ds.last_updated
    FROM device_assignments da
    LEFT JOIN device_states ds ON ds.user_id = da.user_id AND ds.home_assistant_entity_id = COALESCE(da.home_assistant_entity_id, da.entity_id)
    WHERE da.user_id = p_user_id 
    AND (da.location_id = p_location_id OR (da.location_id IS NULL AND p_location_id IS NULL))
    AND COALESCE(da.is_active, true) = true
    ORDER BY COALESCE(da.device_type, da.entity_type), COALESCE(da.device_name, da.friendly_name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log device control actions
CREATE OR REPLACE FUNCTION log_device_control(
    p_user_id UUID,
    p_entity_id TEXT,
    p_action_type TEXT,
    p_previous_state TEXT,
    p_new_state TEXT,
    p_triggered_by TEXT DEFAULT 'manual',
    p_success BOOLEAN DEFAULT true,
    p_error_message TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    control_id UUID;
BEGIN
    INSERT INTO device_control_history (
        user_id, home_assistant_entity_id, action_type, 
        previous_state, new_state, triggered_by, success, error_message
    )
    VALUES (
        p_user_id, p_entity_id, p_action_type,
        p_previous_state, p_new_state, p_triggered_by, p_success, p_error_message
    )
    RETURNING id INTO control_id;
    
    RETURN control_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable realtime for device states (for live updates)
-- Only add to publication if not already there
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'device_states'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE device_states;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'device_assignments'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE device_assignments;
    END IF;
END $$;

-- Update triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS update_device_assignments_updated_at ON device_assignments;
CREATE TRIGGER update_device_assignments_updated_at 
    BEFORE UPDATE ON device_assignments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE device_assignments IS 'Maps Home Assistant entities to farm locations (rows, racks, shelves)';
COMMENT ON TABLE device_states IS 'Cached device states for performance and offline capability';
COMMENT ON TABLE device_control_history IS 'Audit trail of all device control actions';
COMMENT ON FUNCTION update_device_state IS 'Updates device state with automatic change tracking';
COMMENT ON FUNCTION get_location_devices IS 'Returns all devices assigned to a specific farm location with current states';
COMMENT ON FUNCTION log_device_control IS 'Logs device control actions for audit and debugging'; 