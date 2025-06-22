-- ============================================================================
-- CONSOLIDATED CORE SCHEMA MIGRATION
-- ============================================================================
-- Description: Consolidated core database schema for vertical farming management
-- Date: 2025-02-03
-- Consolidates: 20250523222420_initial_schema.sql, 001_grow_management_schema.sql,
--               20250127000000_add_integration_status.sql, 20250128000000_add_user_home_assistant_configs.sql,
--               20250524155256_add_grow_recipe_parameters.sql
--
-- This migration creates the complete foundation schema with:
-- - User management and roles
-- - Farm hierarchy (farms -> rows -> racks -> shelves)  
-- - Device assignments and integrations
-- - Species, crops, and grow recipes
-- - Schedules and automation
-- - Sensor data and monitoring
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- ============================================================================
-- ENUMS AND TYPES
-- ============================================================================

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('farm_manager', 'operator', 'ha_power_user', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE integration_type AS ENUM ('home_assistant', 'mqtt', 'zigbee', 'zwave');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE integration_status AS ENUM ('connected', 'disconnected', 'error', 'syncing');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE schedule_status AS ENUM ('planned', 'active', 'completed', 'aborted');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE action_type AS ENUM ('light_on', 'light_off', 'water_pump_on', 'water_pump_off', 'nutrient_dose', 'fan_on', 'fan_off', 'alert');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE action_status AS ENUM ('pending', 'executed', 'failed', 'skipped', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE grow_stage_type AS ENUM ('planning', 'seeding', 'germination', 'vegetative', 'flowering', 'harvest', 'complete');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- USER MANAGEMENT
-- ============================================================================

-- User profiles linking to Supabase auth.users
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'operator',
  name TEXT,
  profile_image_url TEXT,
  storage_quota_mb INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INTEGRATION MANAGEMENT
-- ============================================================================

-- External integrations (Home Assistant, MQTT, etc.)
CREATE TABLE IF NOT EXISTS public.integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type integration_type NOT NULL,
  name TEXT NOT NULL,
  url TEXT,
  status integration_status NOT NULL DEFAULT 'disconnected',
  last_sync TIMESTAMPTZ,
  device_count INTEGER DEFAULT 0,
  version TEXT,
  error_message TEXT,
  configuration JSONB DEFAULT '{}',
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (type, name)
);

-- Integration sync history
CREATE TABLE IF NOT EXISTS public.integration_sync_log (
  id BIGSERIAL PRIMARY KEY,
  integration_id UUID NOT NULL REFERENCES public.integrations(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  message TEXT,
  device_count INTEGER,
  duration_ms INTEGER,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- FARM HIERARCHY
-- ============================================================================

-- Farms (top level)
CREATE TABLE IF NOT EXISTS public.farms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  location TEXT,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  width NUMERIC,
  depth NUMERIC,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rows within farms
CREATE TABLE IF NOT EXISTS public.rows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  position INTEGER NOT NULL,
  position_x NUMERIC,
  position_y NUMERIC,
  length NUMERIC,
  depth NUMERIC,
  orientation TEXT DEFAULT 'horizontal',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (farm_id, name),
  UNIQUE (farm_id, position)
);

-- Racks within rows
CREATE TABLE IF NOT EXISTS public.racks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  row_id UUID NOT NULL REFERENCES public.rows(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  position_in_row INTEGER NOT NULL,
  width NUMERIC,
  depth NUMERIC,
  height NUMERIC,
  max_shelves INTEGER DEFAULT 10,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (row_id, name),
  UNIQUE (row_id, position_in_row)
);

-- Shelves within racks  
CREATE TABLE IF NOT EXISTS public.shelves (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rack_id UUID NOT NULL REFERENCES public.racks(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  position_in_rack INTEGER NOT NULL,
  width NUMERIC,
  depth NUMERIC,
  max_weight NUMERIC,
  capacity INTEGER DEFAULT 1,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (rack_id, name),
  UNIQUE (rack_id, position_in_rack)
);

-- ============================================================================
-- DEVICE MANAGEMENT
-- ============================================================================

-- Device assignments to hierarchy levels
CREATE TABLE IF NOT EXISTS public.device_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shelf_id UUID REFERENCES public.shelves(id) ON DELETE CASCADE,
  rack_id UUID REFERENCES public.racks(id) ON DELETE CASCADE,
  row_id UUID REFERENCES public.rows(id) ON DELETE CASCADE,
  farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE,
  integration_id UUID REFERENCES public.integrations(id) ON DELETE CASCADE,
  entity_id TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  friendly_name TEXT,
  device_class TEXT,
  unit_of_measurement TEXT,
  assigned_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  last_seen TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Ensure device is assigned to exactly one hierarchy level
  CONSTRAINT chk_device_assignment_level CHECK (
    (shelf_id IS NOT NULL AND rack_id IS NULL AND row_id IS NULL AND farm_id IS NULL) OR
    (shelf_id IS NULL AND rack_id IS NOT NULL AND row_id IS NULL AND farm_id IS NULL) OR
    (shelf_id IS NULL AND rack_id IS NULL AND row_id IS NOT NULL AND farm_id IS NULL) OR
    (shelf_id IS NULL AND rack_id IS NULL AND row_id IS NULL AND farm_id IS NOT NULL)
  )
);

-- ============================================================================
-- CROPS AND SPECIES
-- ============================================================================

-- Crop species/varieties
CREATE TABLE IF NOT EXISTS public.species (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  category TEXT, -- leafy_greens, herbs, microgreens, etc.
  description TEXT,
  typical_grow_days INTEGER,
  optimal_temp_min NUMERIC,
  optimal_temp_max NUMERIC,
  optimal_humidity_min NUMERIC,
  optimal_humidity_max NUMERIC,
  optimal_ph_min NUMERIC,
  optimal_ph_max NUMERIC,
  optimal_ec_min NUMERIC,
  optimal_ec_max NUMERIC,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed varieties for species
CREATE TABLE IF NOT EXISTS public.seed_varieties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  species_id UUID NOT NULL REFERENCES public.species(id) ON DELETE CASCADE,
  variety_name TEXT NOT NULL,
  supplier TEXT,
  days_to_germination INTEGER,
  days_to_harvest INTEGER,
  yield_per_plant NUMERIC,
  sowing_rate NUMERIC,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(species_id, variety_name)
);

-- ============================================================================
-- GROW RECIPES AND STAGES
-- ============================================================================

-- Growth stage definitions
CREATE TABLE IF NOT EXISTS public.grow_stages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  stage_type grow_stage_type NOT NULL,
  order_index INTEGER NOT NULL UNIQUE,
  description TEXT,
  typical_duration_days INTEGER,
  color_code TEXT DEFAULT '#22c55e',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Grow recipes
CREATE TABLE IF NOT EXISTS public.grow_recipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  species_id UUID NOT NULL REFERENCES public.species(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  description TEXT,
  grow_days INTEGER,
  light_hours_per_day NUMERIC,
  watering_frequency_hours NUMERIC,
  target_temperature_min NUMERIC,
  target_temperature_max NUMERIC,
  target_humidity_min NUMERIC,
  target_humidity_max NUMERIC,
  target_ph_min NUMERIC,
  target_ph_max NUMERIC,
  target_ec_min NUMERIC,
  target_ec_max NUMERIC,
  average_yield NUMERIC,
  sowing_rate NUMERIC,
  is_template BOOLEAN DEFAULT TRUE,
  version INTEGER DEFAULT 1,
  parent_recipe_id UUID REFERENCES public.grow_recipes(id),
  success_rate NUMERIC DEFAULT 0,
  custom_parameters JSONB DEFAULT '{}',
  created_by UUID REFERENCES public.user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (species_id, name)
);

-- Recipe stage parameters
CREATE TABLE IF NOT EXISTS public.recipe_stage_parameters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id UUID NOT NULL REFERENCES public.grow_recipes(id) ON DELETE CASCADE,
  stage_id UUID NOT NULL REFERENCES public.grow_stages(id) ON DELETE CASCADE,
  duration_days INTEGER,
  light_hours_per_day NUMERIC,
  target_temperature_min NUMERIC,
  target_temperature_max NUMERIC,
  target_humidity_min NUMERIC,
  target_humidity_max NUMERIC,
  watering_frequency_hours NUMERIC,
  parameters JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (recipe_id, stage_id)
);

-- ============================================================================
-- SCHEDULES AND GROWS
-- ============================================================================

-- Growing schedules
CREATE TABLE IF NOT EXISTS public.schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shelf_id UUID NOT NULL REFERENCES public.shelves(id) ON DELETE CASCADE,
  grow_recipe_id UUID NOT NULL REFERENCES public.grow_recipes(id) ON DELETE RESTRICT,
  seed_variety_id UUID REFERENCES public.seed_varieties(id),
  current_stage_id UUID REFERENCES public.grow_stages(id),
  name TEXT,
  plant_count INTEGER DEFAULT 1,
  start_date TIMESTAMPTZ NOT NULL,
  estimated_end_date TIMESTAMPTZ,
  actual_end_date TIMESTAMPTZ,
  status schedule_status NOT NULL DEFAULT 'planned',
  progress_percentage NUMERIC DEFAULT 0,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES public.user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Grow events and timeline
CREATE TABLE IF NOT EXISTS public.grow_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  grow_id UUID NOT NULL REFERENCES public.grows(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- planted, watered, observed, stage_change, harvested, etc.
  description TEXT,
  stage_id UUID REFERENCES public.grow_stages(id),
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES public.user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- AUTOMATION AND ACTIONS
-- ============================================================================

-- Scheduled actions for automation
CREATE TABLE IF NOT EXISTS public.scheduled_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  grow_id UUID REFERENCES public.grows(id) ON DELETE CASCADE,
  device_assignment_id UUID REFERENCES public.device_assignments(id) ON DELETE CASCADE,
  action_type action_type NOT NULL,
  parameters JSONB DEFAULT '{}',
  execution_time TIMESTAMPTZ NOT NULL,
  status action_status NOT NULL DEFAULT 'pending',
  executed_at TIMESTAMPTZ,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Automation rules
CREATE TABLE IF NOT EXISTS public.automation_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE,
  trigger_conditions JSONB NOT NULL,
  actions JSONB NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  priority INTEGER DEFAULT 5,
  created_by UUID REFERENCES public.user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SENSOR DATA AND MONITORING
-- ============================================================================

-- Sensor readings (high-frequency data)
CREATE TABLE IF NOT EXISTS public.sensor_readings (
  id BIGSERIAL PRIMARY KEY,
  device_assignment_id UUID NOT NULL REFERENCES public.device_assignments(id) ON DELETE CASCADE,
  sensor_type TEXT NOT NULL,
  value NUMERIC NOT NULL,
  unit TEXT,
  quality_score NUMERIC DEFAULT 1.0,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'
);

-- Alerts and notifications
CREATE TABLE IF NOT EXISTS public.alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  grow_id UUID REFERENCES public.grows(id),
  device_assignment_id UUID REFERENCES public.device_assignments(id),
  farm_id UUID REFERENCES public.farms(id),
  alert_type TEXT NOT NULL,
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  message TEXT,
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES public.user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- HARVEST AND YIELD TRACKING
-- ============================================================================

-- Harvest records
CREATE TABLE IF NOT EXISTS public.harvests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  grow_id UUID NOT NULL REFERENCES public.grows(id) ON DELETE CASCADE,
  shelf_id UUID NOT NULL REFERENCES public.shelves(id) ON DELETE CASCADE,
  harvest_date TIMESTAMPTZ NOT NULL,
  quantity NUMERIC NOT NULL,
  unit TEXT NOT NULL DEFAULT 'grams',
  quality_rating INTEGER CHECK (quality_rating BETWEEN 1 AND 5),
  waste_quantity NUMERIC DEFAULT 0,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  harvested_by UUID REFERENCES public.user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- User profiles
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);

-- Integrations
CREATE INDEX IF NOT EXISTS idx_integrations_type_status ON public.integrations(type, status);
CREATE INDEX IF NOT EXISTS idx_integrations_enabled ON public.integrations(enabled);
CREATE INDEX IF NOT EXISTS idx_integration_sync_log_integration_timestamp ON public.integration_sync_log(integration_id, timestamp DESC);

-- Farm hierarchy
CREATE INDEX IF NOT EXISTS idx_farms_user_id ON public.farms(user_id);
CREATE INDEX IF NOT EXISTS idx_rows_farm_id ON public.rows(farm_id);
CREATE INDEX IF NOT EXISTS idx_racks_row_id ON public.racks(row_id);
CREATE INDEX IF NOT EXISTS idx_shelves_rack_id ON public.shelves(rack_id);

-- Device assignments
CREATE INDEX IF NOT EXISTS idx_device_assignments_shelf_id ON public.device_assignments(shelf_id);
CREATE INDEX IF NOT EXISTS idx_device_assignments_rack_id ON public.device_assignments(rack_id);
CREATE INDEX IF NOT EXISTS idx_device_assignments_row_id ON public.device_assignments(row_id);
CREATE INDEX IF NOT EXISTS idx_device_assignments_farm_id ON public.device_assignments(farm_id);
CREATE INDEX IF NOT EXISTS idx_device_assignments_integration_id ON public.device_assignments(integration_id);
CREATE INDEX IF NOT EXISTS idx_device_assignments_entity_id ON public.device_assignments(entity_id);
CREATE INDEX IF NOT EXISTS idx_device_assignments_entity_type ON public.device_assignments(entity_type);

-- Species and recipes
CREATE INDEX IF NOT EXISTS idx_seed_varieties_species_id ON public.seed_varieties(species_id);
CREATE INDEX IF NOT EXISTS idx_grow_recipes_species_id ON public.grow_recipes(species_id);
CREATE INDEX IF NOT EXISTS idx_recipe_stage_parameters_recipe_id ON public.recipe_stage_parameters(recipe_id);

-- Schedules
CREATE INDEX IF NOT EXISTS idx_schedules_shelf_id ON public.schedules(shelf_id);
CREATE INDEX IF NOT EXISTS idx_schedules_grow_recipe_id ON public.schedules(grow_recipe_id);
CREATE INDEX IF NOT EXISTS idx_schedules_status ON public.schedules(status);
-- CREATE INDEX IF NOT EXISTS idx_schedules_current_stage_id ON public.schedules(current_stage_id);
-- Note: Index creation commented out - current_stage_id column may not exist in production DB
CREATE INDEX IF NOT EXISTS idx_grow_events_grow_id_created_at ON public.grow_events(grow_id, created_at DESC);

-- Automation
CREATE INDEX IF NOT EXISTS idx_scheduled_actions_grow_id ON public.scheduled_actions(grow_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_actions_device_assignment_id ON public.scheduled_actions(device_assignment_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_actions_execution_time ON public.scheduled_actions(execution_time);
CREATE INDEX IF NOT EXISTS idx_scheduled_actions_status ON public.scheduled_actions(status);
CREATE INDEX IF NOT EXISTS idx_automation_rules_farm_id ON public.automation_rules(farm_id);
CREATE INDEX IF NOT EXISTS idx_automation_rules_is_active ON public.automation_rules(is_active);

-- Sensor data (partitioned by time for performance)
CREATE INDEX IF NOT EXISTS idx_sensor_readings_device_assignment_id_timestamp ON public.sensor_readings(device_assignment_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_sensor_readings_timestamp ON public.sensor_readings(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_sensor_readings_reading_type_timestamp ON public.sensor_readings(reading_type, timestamp DESC);

-- Alerts
CREATE INDEX IF NOT EXISTS idx_alerts_unresolved ON public.alerts(is_resolved, created_at DESC) WHERE is_resolved = FALSE;
CREATE INDEX IF NOT EXISTS idx_alerts_grow_id ON public.alerts(grow_id);
CREATE INDEX IF NOT EXISTS idx_alerts_farm_id ON public.alerts(farm_id);

-- Harvests
CREATE INDEX IF NOT EXISTS idx_harvests_grow_id ON public.harvests(grow_id);
CREATE INDEX IF NOT EXISTS idx_harvests_shelf_id ON public.harvests(shelf_id);
CREATE INDEX IF NOT EXISTS idx_harvests_harvest_date ON public.harvests(harvest_date DESC);

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- Insert default grow stages (skip if already exist)
INSERT INTO public.grow_stages (name, stage_type, order_index, description, typical_duration_days, color_code) VALUES
('Planning', 'planning', 1, 'Planning and preparation phase', 1, '#6b7280'),
('Seeding', 'seeding', 2, 'Seeds planted and germinating', 3, '#f59e0b'),
('Germination', 'germination', 3, 'Seeds sprouting and initial growth', 7, '#10b981'),
('Vegetative', 'vegetative', 4, 'Active vegetative growth phase', 14, '#22c55e'),
('Flowering', 'flowering', 5, 'Flowering and fruit development', 21, '#8b5cf6'),
('Harvest Ready', 'harvest', 6, 'Ready for harvest', 1, '#f97316'),
('Complete', 'complete', 7, 'Harvest completed', 0, '#374151')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- COMMENTS AND DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE public.user_profiles IS 'User profiles with roles and Home Assistant integration settings';
COMMENT ON TABLE public.integrations IS 'External integrations like Home Assistant, MQTT brokers, etc.';
COMMENT ON TABLE public.farms IS 'Top-level farm locations';
COMMENT ON TABLE public.rows IS 'Rows within farms containing multiple racks';
COMMENT ON TABLE public.racks IS 'Racks within rows containing multiple shelves';
COMMENT ON TABLE public.shelves IS 'Individual growing shelves where plants are placed';
COMMENT ON TABLE public.device_assignments IS 'Assignment of devices to specific hierarchy levels';
COMMENT ON TABLE public.species IS 'Plant species and crop varieties';
COMMENT ON TABLE public.grow_recipes IS 'Growing recipes and templates for different crops';
COMMENT ON TABLE public.schedules IS 'Automation schedules and timing rules';
COMMENT ON TABLE public.grows IS 'Active growing cycles with plant cultivation data';
COMMENT ON TABLE public.sensor_readings IS 'High-frequency sensor data from devices';
COMMENT ON TABLE public.harvests IS 'Harvest records and yield tracking';

-- Mark migration as completed in consolidation log
-- UPDATE public.migration_consolidation_log 
-- SET status = 'completed', completed_at = NOW() 
-- WHERE consolidation_phase = 'core_schema';
-- Note: migration_consolidation_log table does not exist in production