-- Consolidated Grow Management System Schema
-- This migration builds upon the existing grow_recipes table (with parameters added in 20250524155256)
-- and creates the complete database structure for comprehensive grow management

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Core crop and seed variety tables
CREATE TABLE IF NOT EXISTS crops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(50) NOT NULL, -- leafy_greens, herbs, microgreens, etc.
    description TEXT,
    typical_grow_days INTEGER,
    optimal_temp_min DECIMAL(4,1),
    optimal_temp_max DECIMAL(4,1),
    optimal_humidity_min DECIMAL(4,1),
    optimal_humidity_max DECIMAL(4,1),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS seed_varieties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    crop_id UUID REFERENCES crops(id) ON DELETE CASCADE,
    variety_name VARCHAR(100) NOT NULL,
    supplier VARCHAR(100),
    days_to_germination INTEGER,
    days_to_harvest INTEGER,
    yield_per_plant DECIMAL(6,2),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(crop_id, variety_name)
);

-- Physical farm structure
CREATE TABLE IF NOT EXISTS grow_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('row', 'rack', 'shelf')),
    parent_id UUID REFERENCES grow_locations(id),
    capacity INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enhance existing grow_recipes table with additional fields for the comprehensive system
-- Note: The table already exists with parameters added in previous migration
DO $$
BEGIN
    -- Add crop_id reference if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'grow_recipes' AND column_name = 'crop_id'
    ) THEN
        ALTER TABLE public.grow_recipes ADD COLUMN crop_id UUID REFERENCES crops(id);
    END IF;

    -- Add template and versioning fields if they don't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'grow_recipes' AND column_name = 'is_template'
    ) THEN
        ALTER TABLE public.grow_recipes ADD COLUMN is_template BOOLEAN DEFAULT TRUE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'grow_recipes' AND column_name = 'created_by'
    ) THEN
        ALTER TABLE public.grow_recipes ADD COLUMN created_by UUID REFERENCES auth.users(id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'grow_recipes' AND column_name = 'success_rate'
    ) THEN
        ALTER TABLE public.grow_recipes ADD COLUMN success_rate DECIMAL(4,2) DEFAULT 0;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'grow_recipes' AND column_name = 'version'
    ) THEN
        ALTER TABLE public.grow_recipes ADD COLUMN version INTEGER DEFAULT 1;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'grow_recipes' AND column_name = 'parent_recipe_id'
    ) THEN
        ALTER TABLE public.grow_recipes ADD COLUMN parent_recipe_id UUID REFERENCES grow_recipes(id);
    END IF;

    -- Add additional JSONB field for complex parameters (complementing the specific columns)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'grow_recipes' AND column_name = 'parameters'
    ) THEN
        ALTER TABLE public.grow_recipes ADD COLUMN parameters JSONB DEFAULT '{}';
    END IF;

    -- Add timestamps if they don't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'grow_recipes' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE public.grow_recipes ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'grow_recipes' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.grow_recipes ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- Enhance existing seed_varieties table with missing columns
DO $$
BEGIN
    -- Add crop_id reference if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'seed_varieties' AND column_name = 'crop_id'
    ) THEN
        ALTER TABLE public.seed_varieties ADD COLUMN crop_id UUID REFERENCES crops(id);
    END IF;

    -- Add supplier column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'seed_varieties' AND column_name = 'supplier'
    ) THEN
        ALTER TABLE public.seed_varieties ADD COLUMN supplier VARCHAR(100);
    END IF;

    -- Add days_to_germination column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'seed_varieties' AND column_name = 'days_to_germination'
    ) THEN
        ALTER TABLE public.seed_varieties ADD COLUMN days_to_germination INTEGER;
    END IF;

    -- Add days_to_harvest column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'seed_varieties' AND column_name = 'days_to_harvest'
    ) THEN
        ALTER TABLE public.seed_varieties ADD COLUMN days_to_harvest INTEGER;
    END IF;

    -- Add yield_per_plant column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'seed_varieties' AND column_name = 'yield_per_plant'
    ) THEN
        ALTER TABLE public.seed_varieties ADD COLUMN yield_per_plant DECIMAL(6,2);
    END IF;

    -- Add notes column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'seed_varieties' AND column_name = 'notes'
    ) THEN
        ALTER TABLE public.seed_varieties ADD COLUMN notes TEXT;
    END IF;

    -- Add timestamps if they don't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'seed_varieties' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE public.seed_varieties ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'seed_varieties' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.seed_varieties ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- Growth stage definitions
CREATE TABLE IF NOT EXISTS grow_stages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL,
    order_index INTEGER NOT NULL,
    description TEXT,
    typical_duration_days INTEGER,
    color_code VARCHAR(7) DEFAULT '#22c55e'
);

-- Main grows table
CREATE TABLE IF NOT EXISTS grows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    seed_variety_id UUID REFERENCES seed_varieties(id) NOT NULL,
    recipe_id UUID REFERENCES grow_recipes(id),
    current_stage_id UUID REFERENCES grow_stages(id),
    status VARCHAR(20) DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'harvested', 'failed', 'paused')),
    plant_count INTEGER NOT NULL DEFAULT 1,
    planted_date DATE,
    expected_harvest_date DATE,
    actual_harvest_date DATE,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns to grows table if they don't exist
DO $$
BEGIN
    -- Add created_by column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'grows' AND column_name = 'created_by'
    ) THEN
        ALTER TABLE public.grows ADD COLUMN created_by UUID REFERENCES auth.users(id);
    END IF;

    -- Add created_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'grows' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE public.grows ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;

    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'grows' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.grows ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- Location assignments for grows
CREATE TABLE IF NOT EXISTS grow_location_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    grow_id UUID REFERENCES grows(id) ON DELETE CASCADE,
    location_id UUID REFERENCES grow_locations(id),
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    removed_at TIMESTAMPTZ,
    plant_count INTEGER DEFAULT 1,
    UNIQUE(grow_id, location_id, removed_at)
);

-- Environmental parameters for individual grows
CREATE TABLE IF NOT EXISTS grow_parameters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    grow_id UUID REFERENCES grows(id) ON DELETE CASCADE,
    parameter_type VARCHAR(50) NOT NULL, -- temperature, humidity, light_schedule, water_schedule, etc.
    value JSONB NOT NULL,
    unit VARCHAR(20),
    effective_from TIMESTAMPTZ DEFAULT NOW(),
    effective_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Timeline events for grows
CREATE TABLE IF NOT EXISTS grow_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    grow_id UUID REFERENCES grows(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL, -- planted, watered, observed, harvested, etc.
    description TEXT,
    metadata JSONB DEFAULT '{}',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Note: Harvest records table is defined in core schema migration

-- Alerts and notifications
CREATE TABLE IF NOT EXISTS grow_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    grow_id UUID REFERENCES grows(id),
    alert_type VARCHAR(50) NOT NULL, -- watering_due, harvest_ready, parameter_out_of_range, etc.
    message TEXT NOT NULL,
    severity VARCHAR(20) DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns to other tables if they don't exist
DO $$
BEGIN
    -- Add created_by column to grow_events if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'grow_events' AND column_name = 'created_by'
    ) THEN
        ALTER TABLE public.grow_events ADD COLUMN created_by UUID REFERENCES auth.users(id);
    END IF;

    -- Add created_by column to harvests if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'harvests' AND column_name = 'created_by' AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.harvests ADD COLUMN created_by UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- Create indexes for performance
DO $$
BEGIN
    -- Index on grows table
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes WHERE indexname = 'idx_grows_status'
    ) THEN
        CREATE INDEX idx_grows_status ON grows(status);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes WHERE indexname = 'idx_grows_created_by'
    ) THEN
        CREATE INDEX idx_grows_created_by ON grows(created_by);
    END IF;

    -- Index on grow_alerts for performance
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes WHERE indexname = 'idx_grow_alerts_unresolved'
    ) THEN
        CREATE INDEX idx_grow_alerts_unresolved ON grow_alerts(is_resolved, created_at DESC) WHERE is_resolved = FALSE;
    END IF;

    -- Index on grow_recipes
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes WHERE indexname = 'idx_grow_recipes_created_by'
    ) THEN
        CREATE INDEX idx_grow_recipes_created_by ON grow_recipes(created_by);
    END IF;
END $$;

-- Create view for comprehensive grow information
CREATE OR REPLACE VIEW grow_overview AS
SELECT 
    g.id,
    g.name,
    g.status,
    g.plant_count,
    g.planted_date,
    g.expected_harvest_date,
    g.actual_harvest_date,
    gs.name as current_stage,
    gs.color_code as stage_color,
    c.name as crop_name,
    c.category as crop_category,
    sv.variety_name,
    gr.name as recipe_name,
    gr.difficulty,
    gr.total_grow_days,
    g.created_by,
    g.created_at,
    g.updated_at
FROM grows g
LEFT JOIN grow_stages gs ON g.current_stage_id = gs.id
LEFT JOIN seed_varieties sv ON g.seed_variety_id = sv.id
LEFT JOIN crops c ON sv.crop_id = c.id
LEFT JOIN grow_recipes gr ON g.recipe_id = gr.id;

-- Grant appropriate permissions on the view
GRANT SELECT ON grow_overview TO authenticated;

-- Add RLS to the view
ALTER VIEW grow_overview SET (security_invoker = true);

-- Functions for automation
CREATE OR REPLACE FUNCTION update_grow_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for timestamp updates
DO $$
BEGIN
    -- Add trigger to grow_recipes if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'update_grow_recipes_timestamp'
    ) THEN
        CREATE TRIGGER update_grow_recipes_timestamp 
            BEFORE UPDATE ON grow_recipes 
            FOR EACH ROW 
            EXECUTE FUNCTION update_grow_timestamp();
    END IF;

    -- Add trigger to grows table
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'update_grows_timestamp'
    ) THEN
        CREATE TRIGGER update_grows_timestamp 
            BEFORE UPDATE ON grows 
            FOR EACH ROW 
            EXECUTE FUNCTION update_grow_timestamp();
    END IF;
END $$;

-- Insert initial data (only if tables are empty)
INSERT INTO grow_stages (name, order_index, description, typical_duration_days, color_code) 
SELECT * FROM (VALUES
    ('Planning', 1, 'Planning and preparation phase', 1, '#6b7280'),
    ('Seeding', 2, 'Seeds planted and germinating', 3, '#f59e0b'),
    ('Seedling', 3, 'Early growth stage', 7, '#84cc16'),
    ('Vegetative', 4, 'Active growth and leaf development', 14, '#22c55e'),
    ('Pre-Harvest', 5, 'Nearly ready for harvest', 3, '#f97316'),
    ('Harvest', 6, 'Ready for harvest', 7, '#dc2626'),
    ('Completed', 7, 'Harvest completed', 0, '#64748b')
) AS v(name, order_index, description, typical_duration_days, color_code)
WHERE NOT EXISTS (SELECT 1 FROM grow_stages);

-- Insert sample crops data, skip if they already exist
DO $$
BEGIN
    -- Insert each crop individually to avoid UUID conflicts
    INSERT INTO crops (name, category, description, typical_grow_days, optimal_temp_min, optimal_temp_max, optimal_humidity_min, optimal_humidity_max) 
    SELECT 'Lettuce', 'leafy_greens', 'Quick-growing leafy green', 28, 60.0, 70.0, 60.0, 70.0
    WHERE NOT EXISTS (SELECT 1 FROM crops WHERE name = 'Lettuce');
    
    INSERT INTO crops (name, category, description, typical_grow_days, optimal_temp_min, optimal_temp_max, optimal_humidity_min, optimal_humidity_max) 
    SELECT 'Basil', 'herbs', 'Aromatic herb with strong flavor', 35, 65.0, 75.0, 50.0, 60.0
    WHERE NOT EXISTS (SELECT 1 FROM crops WHERE name = 'Basil');
    
    INSERT INTO crops (name, category, description, typical_grow_days, optimal_temp_min, optimal_temp_max, optimal_humidity_min, optimal_humidity_max) 
    SELECT 'Spinach', 'leafy_greens', 'Nutrient-dense leafy green', 25, 50.0, 65.0, 65.0, 75.0
    WHERE NOT EXISTS (SELECT 1 FROM crops WHERE name = 'Spinach');
    
    INSERT INTO crops (name, category, description, typical_grow_days, optimal_temp_min, optimal_temp_max, optimal_humidity_min, optimal_humidity_max) 
    SELECT 'Arugula', 'leafy_greens', 'Peppery salad green', 21, 55.0, 68.0, 60.0, 70.0
    WHERE NOT EXISTS (SELECT 1 FROM crops WHERE name = 'Arugula');
    
    INSERT INTO crops (name, category, description, typical_grow_days, optimal_temp_min, optimal_temp_max, optimal_humidity_min, optimal_humidity_max) 
    SELECT 'Microgreens Mix', 'microgreens', 'Quick-growing micro vegetables', 10, 65.0, 75.0, 55.0, 65.0
    WHERE NOT EXISTS (SELECT 1 FROM crops WHERE name = 'Microgreens Mix');
END $$;

-- Enable Row Level Security on new tables
ALTER TABLE grows ENABLE ROW LEVEL SECURITY;
ALTER TABLE grow_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE grow_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.harvests ENABLE ROW LEVEL SECURITY;
ALTER TABLE grow_recipes ENABLE ROW LEVEL SECURITY;

-- RLS Policies (basic - users can see their own data)
-- NOTE: These policies are created AFTER ensuring the created_by column exists
DO $$
BEGIN
    -- Policies for grows table
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'grows' AND policyname = 'Users can view own grows'
    ) THEN
        CREATE POLICY "Users can view own grows" ON grows
            FOR SELECT USING (created_by = auth.uid());
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'grows' AND policyname = 'Users can create grows'
    ) THEN
        CREATE POLICY "Users can create grows" ON grows
            FOR INSERT WITH CHECK (created_by = auth.uid());
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'grows' AND policyname = 'Users can update own grows'
    ) THEN
        CREATE POLICY "Users can update own grows" ON grows
            FOR UPDATE USING (created_by = auth.uid());
    END IF;

    -- Policies for grow_recipes table
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'grow_recipes' AND policyname = 'Users can view own recipes'
    ) THEN
        CREATE POLICY "Users can view own recipes" ON grow_recipes
            FOR SELECT USING (created_by = auth.uid() OR is_template = true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'grow_recipes' AND policyname = 'Users can create recipes'
    ) THEN
        CREATE POLICY "Users can create recipes" ON grow_recipes
            FOR INSERT WITH CHECK (created_by = auth.uid());
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'grow_recipes' AND policyname = 'Users can update own recipes'
    ) THEN
        CREATE POLICY "Users can update own recipes" ON grow_recipes
            FOR UPDATE USING (created_by = auth.uid());
    END IF;

    -- Policies for grow_events table
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'grow_events' AND policyname = 'Users can view own grow events'
    ) THEN
        CREATE POLICY "Users can view own grow events" ON grow_events
            FOR SELECT USING (created_by = auth.uid());
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'grow_events' AND policyname = 'Users can create grow events'
    ) THEN
        CREATE POLICY "Users can create grow events" ON grow_events
            FOR INSERT WITH CHECK (created_by = auth.uid());
    END IF;

    -- Policies for harvests table (defined in public schema)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'harvests' AND schemaname = 'public' AND policyname = 'Users can view own harvests'
    ) THEN
        CREATE POLICY "Users can view own harvests" ON public.harvests
            FOR SELECT USING (created_by = auth.uid());
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'harvests' AND schemaname = 'public' AND policyname = 'Users can create harvests'
    ) THEN
        CREATE POLICY "Users can create harvests" ON public.harvests
            FOR INSERT WITH CHECK (created_by = auth.uid());
    END IF;

    -- Policies for grow_alerts table
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'grow_alerts' AND policyname = 'Users can view relevant alerts'
    ) THEN
        CREATE POLICY "Users can view relevant alerts" ON grow_alerts
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM grows 
                    WHERE grows.id = grow_alerts.grow_id 
                    AND grows.created_by = auth.uid()
                )
            );
    END IF;
END $$;

-- Add comments for the new fields on grow_recipes
COMMENT ON COLUMN public.grow_recipes.crop_id IS 'Reference to the crop type this recipe is for';
COMMENT ON COLUMN public.grow_recipes.is_template IS 'Whether this recipe is a template or an instance';
COMMENT ON COLUMN public.grow_recipes.created_by IS 'User who created this recipe';
COMMENT ON COLUMN public.grow_recipes.success_rate IS 'Historical success rate of this recipe (0-100)';
COMMENT ON COLUMN public.grow_recipes.version IS 'Version number for recipe iterations';
COMMENT ON COLUMN public.grow_recipes.parent_recipe_id IS 'Reference to parent recipe if this is a variant';
COMMENT ON COLUMN public.grow_recipes.parameters IS 'Additional flexible parameters in JSON format (complements specific columns)';

-- Final success message
DO $$
BEGIN
    RAISE NOTICE 'Consolidated grow management schema migration completed successfully';
END $$; 