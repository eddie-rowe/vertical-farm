-- Add comprehensive monitoring schema for Layer Three
-- Migration: 20250629233000_add_grow_monitoring_schema.sql

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- MONITORING METRICS TABLE
-- =============================================
-- Stores time-series environmental and sensor data
CREATE TABLE IF NOT EXISTS grow_monitoring_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    grow_id UUID NOT NULL REFERENCES grows(id) ON DELETE CASCADE,
    shelf_id UUID REFERENCES shelves(id) ON DELETE SET NULL,
    metric_type VARCHAR(50) NOT NULL, -- temperature, humidity, light_intensity, ph, ec, etc.
    value DECIMAL(10,4) NOT NULL,
    unit VARCHAR(20) NOT NULL, -- celsius, percentage, ppfd, etc.
    source_entity_id VARCHAR(100), -- Home Assistant entity ID
    source_type VARCHAR(30) DEFAULT 'sensor', -- sensor, manual, calculated
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Indexes for efficient time-series queries
    CONSTRAINT valid_metric_value CHECK (value IS NOT NULL)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_grow_monitoring_metrics_grow_id ON grow_monitoring_metrics(grow_id);
CREATE INDEX IF NOT EXISTS idx_grow_monitoring_metrics_type_time ON grow_monitoring_metrics(metric_type, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_grow_monitoring_metrics_shelf_time ON grow_monitoring_metrics(shelf_id, recorded_at DESC) WHERE shelf_id IS NOT NULL;

-- =============================================
-- GROWTH STAGES TABLE UPDATES
-- =============================================
-- Add missing columns to existing grow_stages table
DO $$
BEGIN
    -- Add crop_type column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'grow_stages' AND column_name = 'crop_type'
    ) THEN
        ALTER TABLE public.grow_stages ADD COLUMN crop_type VARCHAR(50);
    END IF;

    -- Add stage_name column if it doesn't exist (mapped to existing name column)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'grow_stages' AND column_name = 'stage_name'
    ) THEN
        ALTER TABLE public.grow_stages ADD COLUMN stage_name VARCHAR(50);
    END IF;

    -- Add stage_order column if it doesn't exist (mapped to existing order_index)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'grow_stages' AND column_name = 'stage_order'
    ) THEN
        ALTER TABLE public.grow_stages ADD COLUMN stage_order INTEGER;
    END IF;

    -- Add expected_duration_days column if it doesn't exist (mapped to existing typical_duration_days)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'grow_stages' AND column_name = 'expected_duration_days'
    ) THEN
        ALTER TABLE public.grow_stages ADD COLUMN expected_duration_days INTEGER;
    END IF;

    -- Add milestone_description column if it doesn't exist (mapped to existing description)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'grow_stages' AND column_name = 'milestone_description'
    ) THEN
        ALTER TABLE public.grow_stages ADD COLUMN milestone_description TEXT;
    END IF;

    -- Add optimal_conditions column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'grow_stages' AND column_name = 'optimal_conditions'
    ) THEN
        ALTER TABLE public.grow_stages ADD COLUMN optimal_conditions JSONB;
    END IF;

    -- Add created_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'grow_stages' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE public.grow_stages ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
    END IF;
END $$;

-- Update existing grow_stages constraints if needed
DO $$
BEGIN
    -- Drop problematic order_index unique constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'grow_stages' 
        AND constraint_name = 'grow_stages_order_index_key'
    ) THEN
        ALTER TABLE public.grow_stages DROP CONSTRAINT grow_stages_order_index_key;
    END IF;

    -- Add unique constraint for crop_type and stage_order if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'grow_stages' 
        AND constraint_name = 'grow_stages_crop_type_stage_order_key'
    ) THEN
        ALTER TABLE public.grow_stages ADD CONSTRAINT grow_stages_crop_type_stage_order_key 
        UNIQUE(crop_type, stage_order);
    END IF;

    -- Add unique constraint for crop_type and stage_name if it doesn't exist  
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'grow_stages' 
        AND constraint_name = 'grow_stages_crop_type_stage_name_key'
    ) THEN
        ALTER TABLE public.grow_stages ADD CONSTRAINT grow_stages_crop_type_stage_name_key 
        UNIQUE(crop_type, stage_name);
    END IF;
EXCEPTION
    WHEN others THEN
        NULL; -- Ignore constraint errors if they already exist
END $$;

-- =============================================
-- GROW PROGRESS TABLE
-- =============================================
-- Tracks current stage and milestone progress for each grow
CREATE TABLE IF NOT EXISTS grow_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    grow_id UUID NOT NULL REFERENCES grows(id) ON DELETE CASCADE,
    current_stage_id UUID NOT NULL REFERENCES grow_stages(id),
    stage_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expected_stage_end TIMESTAMPTZ,
    milestones_achieved JSONB DEFAULT '[]'::jsonb,
    notes TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(grow_id)
);

-- =============================================
-- GROW ALERTS TABLE
-- =============================================
-- Alert management system with severity levels
DO $$ BEGIN
    CREATE TYPE alert_severity AS ENUM ('critical', 'high', 'medium', 'low');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE alert_type AS ENUM ('environmental', 'growth', 'resource', 'system', 'automation');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS grow_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    grow_id UUID NOT NULL REFERENCES grows(id) ON DELETE CASCADE,
    alert_type alert_type NOT NULL,
    severity alert_severity NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    threshold_config JSONB, -- configuration that triggered alert
    metric_value DECIMAL(10,4), -- value that triggered alert
    shelf_id UUID REFERENCES shelves(id) ON DELETE SET NULL,
    acknowledged_at TIMESTAMPTZ,
    acknowledged_by UUID REFERENCES auth.users(id),
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES auth.users(id),
    resolution_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for alert management
CREATE INDEX IF NOT EXISTS idx_grow_alerts_grow_id ON grow_alerts(grow_id);
CREATE INDEX IF NOT EXISTS idx_grow_alerts_severity ON grow_alerts(severity, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_grow_alerts_unresolved ON grow_alerts(grow_id, created_at DESC) WHERE resolved_at IS NULL;

-- =============================================
-- GROW OBSERVATIONS TABLE
-- =============================================
-- Manual observations and notes from users
DO $$ BEGIN
    CREATE TYPE observation_type AS ENUM ('visual_inspection', 'measurements', 'issues', 'notes', 'milestone');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS grow_observations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    grow_id UUID NOT NULL REFERENCES grows(id) ON DELETE CASCADE,
    observation_type observation_type NOT NULL,
    title VARCHAR(200) NOT NULL,
    notes TEXT,
    images TEXT[] DEFAULT ARRAY[]::TEXT[], -- URLs to uploaded images
    measurements JSONB, -- structured measurement data
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    shelf_id UUID REFERENCES shelves(id) ON DELETE SET NULL,
    recorded_by UUID NOT NULL REFERENCES auth.users(id),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for observations
CREATE INDEX IF NOT EXISTS idx_grow_observations_grow_id ON grow_observations(grow_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_grow_observations_type ON grow_observations(observation_type, recorded_at DESC);

-- =============================================
-- MONITORING THRESHOLDS TABLE
-- =============================================
-- Configurable alert thresholds per crop type and growth stage
CREATE TABLE IF NOT EXISTS monitoring_thresholds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    crop_type VARCHAR(50) NOT NULL,
    stage_id UUID REFERENCES grow_stages(id) ON DELETE CASCADE,
    metric_type VARCHAR(50) NOT NULL,
    min_value DECIMAL(10,4),
    max_value DECIMAL(10,4),
    optimal_min DECIMAL(10,4),
    optimal_max DECIMAL(10,4),
    severity alert_severity NOT NULL DEFAULT 'medium',
    unit VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT valid_threshold_range CHECK (
        (min_value IS NULL OR max_value IS NULL OR min_value <= max_value) AND
        (optimal_min IS NULL OR optimal_max IS NULL OR optimal_min <= optimal_max)
    )
);

-- Indexes for threshold lookups
CREATE INDEX IF NOT EXISTS idx_monitoring_thresholds_crop_metric ON monitoring_thresholds(crop_type, metric_type);
CREATE INDEX IF NOT EXISTS idx_monitoring_thresholds_stage ON monitoring_thresholds(stage_id) WHERE stage_id IS NOT NULL;

-- =============================================
-- DATABASE FUNCTIONS
-- =============================================

-- Function to get latest metrics for a grow
CREATE OR REPLACE FUNCTION get_latest_grow_metrics(p_grow_id UUID, p_hours INTEGER DEFAULT 24)
RETURNS TABLE (
    metric_type VARCHAR(50),
    latest_value DECIMAL(10,4),
    unit VARCHAR(20),
    recorded_at TIMESTAMPTZ,
    shelf_name VARCHAR(100)
) AS $$
BEGIN
    RETURN QUERY
    WITH latest_metrics AS (
        SELECT DISTINCT ON (m.metric_type, m.shelf_id)
            m.metric_type,
            m.value as latest_value,
            m.unit,
            m.recorded_at,
            s.name as shelf_name
        FROM grow_monitoring_metrics m
        LEFT JOIN shelves s ON m.shelf_id = s.id
        WHERE m.grow_id = p_grow_id
            AND m.recorded_at >= NOW() - INTERVAL '%s hours' % p_hours
        ORDER BY m.metric_type, m.shelf_id, m.recorded_at DESC
    )
    SELECT * FROM latest_metrics ORDER BY metric_type, shelf_name NULLS LAST;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate grow health score
CREATE OR REPLACE FUNCTION calculate_grow_health_score(p_grow_id UUID)
RETURNS TABLE (
    overall_score INTEGER,
    environmental_score INTEGER,
    growth_score INTEGER,
    alert_score INTEGER,
    last_updated TIMESTAMPTZ
) AS $$
DECLARE
    env_score INTEGER := 100;
    growth_score INTEGER := 100;
    alert_penalty INTEGER := 0;
    critical_alerts INTEGER;
    high_alerts INTEGER;
    medium_alerts INTEGER;
BEGIN
    -- Calculate alert penalty
    SELECT 
        COUNT(*) FILTER (WHERE severity = 'critical'),
        COUNT(*) FILTER (WHERE severity = 'high'),
        COUNT(*) FILTER (WHERE severity = 'medium')
    INTO critical_alerts, high_alerts, medium_alerts
    FROM grow_alerts 
    WHERE grow_id = p_grow_id 
        AND resolved_at IS NULL
        AND created_at >= NOW() - INTERVAL '7 days';
    
    -- Alert scoring penalty
    alert_penalty := (critical_alerts * 30) + (high_alerts * 15) + (medium_alerts * 5);
    alert_penalty := LEAST(alert_penalty, 70); -- Cap at 70 point penalty
    
    -- Environmental scoring (simplified - can be enhanced with actual threshold checking)
    -- TODO: Implement actual metric comparison against thresholds
    
    -- Growth scoring (simplified - based on stage progression)
    -- TODO: Implement actual growth rate analysis
    
    RETURN QUERY
    SELECT 
        GREATEST(0, LEAST(100, (env_score + growth_score) / 2 - alert_penalty)) as overall_score,
        env_score as environmental_score,
        growth_score as growth_score,
        (100 - alert_penalty) as alert_score,
        NOW() as last_updated;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE grow_monitoring_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE grow_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE grow_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE grow_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE grow_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitoring_thresholds ENABLE ROW LEVEL SECURITY;

-- RLS Policies for grow_monitoring_metrics
DO $$ BEGIN
    CREATE POLICY "Users can view metrics for their grows" ON grow_monitoring_metrics
        FOR SELECT USING (
            grow_id IN (
                SELECT id FROM grows 
                WHERE created_by = auth.uid()
            )
        );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can insert metrics for their grows" ON grow_monitoring_metrics
        FOR INSERT WITH CHECK (
            grow_id IN (
                SELECT id FROM grows 
                WHERE created_by = auth.uid()
            )
        );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- RLS Policies for grow_stages (read-only reference data)
DO $$ BEGIN
    CREATE POLICY "Everyone can view grow stages" ON grow_stages
        FOR SELECT USING (true);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- RLS Policies for grow_progress
DO $$ BEGIN
    CREATE POLICY "Users can manage progress for their grows" ON grow_progress
        FOR ALL USING (
            grow_id IN (
                SELECT id FROM grows 
                WHERE created_by = auth.uid()
            )
        );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- RLS Policies for grow_alerts
DO $$ BEGIN
    CREATE POLICY "Users can manage alerts for their grows" ON grow_alerts
        FOR ALL USING (
            grow_id IN (
                SELECT id FROM grows 
                WHERE created_by = auth.uid()
            )
        );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- RLS Policies for grow_observations
DO $$ BEGIN
    CREATE POLICY "Users can manage observations for their grows" ON grow_observations
        FOR ALL USING (
            grow_id IN (
                SELECT id FROM grows 
                WHERE created_by = auth.uid()
            )
        );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- RLS Policies for monitoring_thresholds (read-only reference data)
DO $$ BEGIN
    CREATE POLICY "Everyone can view monitoring thresholds" ON monitoring_thresholds
        FOR SELECT USING (true);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =============================================
-- REALTIME SUBSCRIPTIONS
-- =============================================

-- Enable realtime for monitoring tables
DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE grow_monitoring_metrics;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE grow_progress;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE grow_alerts;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE grow_observations;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =============================================
-- REFERENCE DATA
-- =============================================

-- Insert default growth stages for common crops
-- Use individual checks to prevent primary key violations

-- Leafy Greens stages
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM grow_stages WHERE crop_type = 'leafy_greens' AND stage_name = 'Seed') THEN
        INSERT INTO grow_stages (name, stage_type, order_index, description, typical_duration_days, color_code, crop_type, stage_name, stage_order, expected_duration_days, milestone_description, optimal_conditions)
        VALUES ('Seed', 'seeding', 1, 'Seeds planted in growing medium', 2, '#22c55e', 'leafy_greens', 'Seed', 1, 2, 'Seeds planted in growing medium', '{"temperature": {"min": 18, "max": 22}, "humidity": {"min": 70, "max": 85}}');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM grow_stages WHERE crop_type = 'leafy_greens' AND stage_name = 'Germination') THEN
        INSERT INTO grow_stages (name, stage_type, order_index, description, typical_duration_days, color_code, crop_type, stage_name, stage_order, expected_duration_days, milestone_description, optimal_conditions)
        VALUES ('Germination', 'germination', 2, 'First sprouts emerge from seeds', 3, '#16a34a', 'leafy_greens', 'Germination', 2, 3, 'First sprouts emerge from seeds', '{"temperature": {"min": 20, "max": 24}, "humidity": {"min": 75, "max": 90}}');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM grow_stages WHERE crop_type = 'leafy_greens' AND stage_name = 'Seedling') THEN
        INSERT INTO grow_stages (name, stage_type, order_index, description, typical_duration_days, color_code, crop_type, stage_name, stage_order, expected_duration_days, milestone_description, optimal_conditions)
        VALUES ('Seedling', 'vegetative', 3, 'First true leaves develop', 7, '#15803d', 'leafy_greens', 'Seedling', 3, 7, 'First true leaves develop', '{"temperature": {"min": 18, "max": 22}, "humidity": {"min": 65, "max": 80}, "light_hours": 14}');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM grow_stages WHERE crop_type = 'leafy_greens' AND stage_name = 'Vegetative') THEN
        INSERT INTO grow_stages (name, stage_type, order_index, description, typical_duration_days, color_code, crop_type, stage_name, stage_order, expected_duration_days, milestone_description, optimal_conditions)
        VALUES ('Vegetative', 'vegetative', 4, 'Rapid leaf growth and development', 14, '#166534', 'leafy_greens', 'Vegetative', 4, 14, 'Rapid leaf growth and development', '{"temperature": {"min": 16, "max": 20}, "humidity": {"min": 60, "max": 75}, "light_hours": 16}');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM grow_stages WHERE crop_type = 'leafy_greens' AND stage_name = 'Harvest') THEN
        INSERT INTO grow_stages (name, stage_type, order_index, description, typical_duration_days, color_code, crop_type, stage_name, stage_order, expected_duration_days, milestone_description, optimal_conditions)
        VALUES ('Harvest', 'harvest', 5, 'Ready for harvest', 7, '#14532d', 'leafy_greens', 'Harvest', 5, 7, 'Ready for harvest', '{"temperature": {"min": 14, "max": 18}, "humidity": {"min": 55, "max": 70}}');
    END IF;
END $$;

-- Herbs stages
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM grow_stages WHERE crop_type = 'herbs' AND stage_name = 'Seed') THEN
        INSERT INTO grow_stages (name, stage_type, order_index, description, typical_duration_days, color_code, crop_type, stage_name, stage_order, expected_duration_days, milestone_description, optimal_conditions)
        VALUES ('Herb Seed', 'seeding', 1, 'Seeds planted in growing medium', 3, '#0ea5e9', 'herbs', 'Seed', 1, 3, 'Seeds planted in growing medium', '{"temperature": {"min": 20, "max": 25}, "humidity": {"min": 70, "max": 85}}');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM grow_stages WHERE crop_type = 'herbs' AND stage_name = 'Germination') THEN
        INSERT INTO grow_stages (name, stage_type, order_index, description, typical_duration_days, color_code, crop_type, stage_name, stage_order, expected_duration_days, milestone_description, optimal_conditions)
        VALUES ('Herb Germination', 'germination', 2, 'First sprouts emerge from seeds', 5, '#0284c7', 'herbs', 'Germination', 2, 5, 'First sprouts emerge from seeds', '{"temperature": {"min": 22, "max": 26}, "humidity": {"min": 75, "max": 90}}');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM grow_stages WHERE crop_type = 'herbs' AND stage_name = 'Seedling') THEN
        INSERT INTO grow_stages (name, stage_type, order_index, description, typical_duration_days, color_code, crop_type, stage_name, stage_order, expected_duration_days, milestone_description, optimal_conditions)
        VALUES ('Herb Seedling', 'vegetative', 3, 'First true leaves develop', 10, '#0369a1', 'herbs', 'Seedling', 3, 10, 'First true leaves develop', '{"temperature": {"min": 20, "max": 24}, "humidity": {"min": 65, "max": 80}, "light_hours": 14}');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM grow_stages WHERE crop_type = 'herbs' AND stage_name = 'Vegetative') THEN
        INSERT INTO grow_stages (name, stage_type, order_index, description, typical_duration_days, color_code, crop_type, stage_name, stage_order, expected_duration_days, milestone_description, optimal_conditions)
        VALUES ('Herb Vegetative', 'vegetative', 4, 'Bushy growth and leaf development', 21, '#075985', 'herbs', 'Vegetative', 4, 21, 'Bushy growth and leaf development', '{"temperature": {"min": 18, "max": 22}, "humidity": {"min": 60, "max": 75}, "light_hours": 16}');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM grow_stages WHERE crop_type = 'herbs' AND stage_name = 'Harvest') THEN
        INSERT INTO grow_stages (name, stage_type, order_index, description, typical_duration_days, color_code, crop_type, stage_name, stage_order, expected_duration_days, milestone_description, optimal_conditions)
        VALUES ('Herb Harvest', 'harvest', 5, 'Continuous harvest period', 14, '#0c4a6e', 'herbs', 'Harvest', 5, 14, 'Continuous harvest period', '{"temperature": {"min": 18, "max": 22}, "humidity": {"min": 55, "max": 70}}');
    END IF;
END $$;

-- Microgreens stages
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM grow_stages WHERE crop_type = 'microgreens' AND stage_name = 'Seed') THEN
        INSERT INTO grow_stages (name, stage_type, order_index, description, typical_duration_days, color_code, crop_type, stage_name, stage_order, expected_duration_days, milestone_description, optimal_conditions)
        VALUES ('Micro Seed', 'seeding', 1, 'Seeds planted densely', 1, '#a855f7', 'microgreens', 'Seed', 1, 1, 'Seeds planted densely', '{"temperature": {"min": 18, "max": 22}, "humidity": {"min": 80, "max": 95}}');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM grow_stages WHERE crop_type = 'microgreens' AND stage_name = 'Germination') THEN
        INSERT INTO grow_stages (name, stage_type, order_index, description, typical_duration_days, color_code, crop_type, stage_name, stage_order, expected_duration_days, milestone_description, optimal_conditions)
        VALUES ('Micro Germination', 'germination', 2, 'Initial sprouting phase', 2, '#9333ea', 'microgreens', 'Germination', 2, 2, 'Initial sprouting phase', '{"temperature": {"min": 20, "max": 24}, "humidity": {"min": 85, "max": 95}}');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM grow_stages WHERE crop_type = 'microgreens' AND stage_name = 'Growth') THEN
        INSERT INTO grow_stages (name, stage_type, order_index, description, typical_duration_days, color_code, crop_type, stage_name, stage_order, expected_duration_days, milestone_description, optimal_conditions)
        VALUES ('Micro Growth', 'vegetative', 3, 'Cotyledon development', 5, '#7c3aed', 'microgreens', 'Growth', 3, 5, 'Cotyledon development', '{"temperature": {"min": 18, "max": 22}, "humidity": {"min": 70, "max": 85}, "light_hours": 12}');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM grow_stages WHERE crop_type = 'microgreens' AND stage_name = 'Harvest') THEN
        INSERT INTO grow_stages (name, stage_type, order_index, description, typical_duration_days, color_code, crop_type, stage_name, stage_order, expected_duration_days, milestone_description, optimal_conditions)
        VALUES ('Micro Harvest', 'harvest', 4, 'Ready for harvest at 1-2 inches', 2, '#6d28d9', 'microgreens', 'Harvest', 4, 2, 'Ready for harvest at 1-2 inches', '{"temperature": {"min": 16, "max": 20}, "humidity": {"min": 60, "max": 75}}');
    END IF;
END $$;

-- Insert default monitoring thresholds (individual inserts to prevent primary key violations)
-- Leafy Greens thresholds
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM monitoring_thresholds WHERE crop_type = 'leafy_greens' AND metric_type = 'temperature') THEN
        INSERT INTO monitoring_thresholds (crop_type, metric_type, min_value, max_value, optimal_min, optimal_max, severity, unit)
        VALUES ('leafy_greens', 'temperature', 10.0, 30.0, 16.0, 22.0, 'medium', 'celsius');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM monitoring_thresholds WHERE crop_type = 'leafy_greens' AND metric_type = 'humidity') THEN
        INSERT INTO monitoring_thresholds (crop_type, metric_type, min_value, max_value, optimal_min, optimal_max, severity, unit)
        VALUES ('leafy_greens', 'humidity', 40.0, 95.0, 60.0, 80.0, 'medium', 'percentage');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM monitoring_thresholds WHERE crop_type = 'leafy_greens' AND metric_type = 'light_intensity') THEN
        INSERT INTO monitoring_thresholds (crop_type, metric_type, min_value, max_value, optimal_min, optimal_max, severity, unit)
        VALUES ('leafy_greens', 'light_intensity', 100.0, 800.0, 200.0, 400.0, 'medium', 'ppfd');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM monitoring_thresholds WHERE crop_type = 'leafy_greens' AND metric_type = 'ph') THEN
        INSERT INTO monitoring_thresholds (crop_type, metric_type, min_value, max_value, optimal_min, optimal_max, severity, unit)
        VALUES ('leafy_greens', 'ph', 5.0, 7.5, 5.5, 6.5, 'high', 'ph');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM monitoring_thresholds WHERE crop_type = 'leafy_greens' AND metric_type = 'ec') THEN
        INSERT INTO monitoring_thresholds (crop_type, metric_type, min_value, max_value, optimal_min, optimal_max, severity, unit)
        VALUES ('leafy_greens', 'ec', 0.5, 3.0, 1.2, 2.0, 'high', 'ms/cm');
    END IF;
END $$;

-- Herbs thresholds
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM monitoring_thresholds WHERE crop_type = 'herbs' AND metric_type = 'temperature') THEN
        INSERT INTO monitoring_thresholds (crop_type, metric_type, min_value, max_value, optimal_min, optimal_max, severity, unit)
        VALUES ('herbs', 'temperature', 12.0, 32.0, 18.0, 24.0, 'medium', 'celsius');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM monitoring_thresholds WHERE crop_type = 'herbs' AND metric_type = 'humidity') THEN
        INSERT INTO monitoring_thresholds (crop_type, metric_type, min_value, max_value, optimal_min, optimal_max, severity, unit)
        VALUES ('herbs', 'humidity', 40.0, 95.0, 60.0, 75.0, 'medium', 'percentage');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM monitoring_thresholds WHERE crop_type = 'herbs' AND metric_type = 'light_intensity') THEN
        INSERT INTO monitoring_thresholds (crop_type, metric_type, min_value, max_value, optimal_min, optimal_max, severity, unit)
        VALUES ('herbs', 'light_intensity', 150.0, 900.0, 300.0, 600.0, 'medium', 'ppfd');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM monitoring_thresholds WHERE crop_type = 'herbs' AND metric_type = 'ph') THEN
        INSERT INTO monitoring_thresholds (crop_type, metric_type, min_value, max_value, optimal_min, optimal_max, severity, unit)
        VALUES ('herbs', 'ph', 5.0, 7.5, 5.8, 6.8, 'high', 'ph');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM monitoring_thresholds WHERE crop_type = 'herbs' AND metric_type = 'ec') THEN
        INSERT INTO monitoring_thresholds (crop_type, metric_type, min_value, max_value, optimal_min, optimal_max, severity, unit)
        VALUES ('herbs', 'ec', 0.8, 3.5, 1.4, 2.2, 'high', 'ms/cm');
    END IF;
END $$;

-- Microgreens thresholds
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM monitoring_thresholds WHERE crop_type = 'microgreens' AND metric_type = 'temperature') THEN
        INSERT INTO monitoring_thresholds (crop_type, metric_type, min_value, max_value, optimal_min, optimal_max, severity, unit)
        VALUES ('microgreens', 'temperature', 15.0, 28.0, 18.0, 22.0, 'medium', 'celsius');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM monitoring_thresholds WHERE crop_type = 'microgreens' AND metric_type = 'humidity') THEN
        INSERT INTO monitoring_thresholds (crop_type, metric_type, min_value, max_value, optimal_min, optimal_max, severity, unit)
        VALUES ('microgreens', 'humidity', 60.0, 98.0, 70.0, 90.0, 'medium', 'percentage');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM monitoring_thresholds WHERE crop_type = 'microgreens' AND metric_type = 'light_intensity') THEN
        INSERT INTO monitoring_thresholds (crop_type, metric_type, min_value, max_value, optimal_min, optimal_max, severity, unit)
        VALUES ('microgreens', 'light_intensity', 50.0, 400.0, 100.0, 250.0, 'medium', 'ppfd');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM monitoring_thresholds WHERE crop_type = 'microgreens' AND metric_type = 'ph') THEN
        INSERT INTO monitoring_thresholds (crop_type, metric_type, min_value, max_value, optimal_min, optimal_max, severity, unit)
        VALUES ('microgreens', 'ph', 5.5, 7.0, 5.8, 6.5, 'high', 'ph');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM monitoring_thresholds WHERE crop_type = 'microgreens' AND metric_type = 'ec') THEN
        INSERT INTO monitoring_thresholds (crop_type, metric_type, min_value, max_value, optimal_min, optimal_max, severity, unit)
        VALUES ('microgreens', 'ec', 0.3, 2.0, 0.8, 1.5, 'high', 'ms/cm');
    END IF;
END $$;;

-- =============================================
-- COMMENTS
-- =============================================

COMMENT ON TABLE grow_monitoring_metrics IS 'Time-series storage for environmental and sensor metrics';
COMMENT ON TABLE grow_stages IS 'Reference data defining growth stages for different crop types';
COMMENT ON TABLE grow_progress IS 'Tracks current growth stage and milestone progress for each grow';
COMMENT ON TABLE grow_alerts IS 'Alert management system with configurable severity levels';
COMMENT ON TABLE grow_observations IS 'Manual observations and notes recorded by users';
COMMENT ON TABLE monitoring_thresholds IS 'Configurable alert thresholds per crop type and growth stage';

COMMENT ON FUNCTION get_latest_grow_metrics IS 'Returns latest metric values for a grow within specified time window';
COMMENT ON FUNCTION calculate_grow_health_score IS 'Calculates comprehensive health score based on multiple factors'; 