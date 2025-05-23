-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enum for user roles
CREATE TYPE user_role AS ENUM ('farm_manager', 'operator', 'ha_power_user', 'admin');

-- Table for user profiles, linking to Supabase auth.users
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'operator',
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for user_profiles
CREATE INDEX idx_user_profiles_role ON public.user_profiles(role);

-- RLS Policies for user_profiles (enable after table creation)
-- ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users can view their own profile" ON public.user_profiles FOR SELECT USING (auth.uid() = id);
-- CREATE POLICY "Admins can manage all profiles" ON public.user_profiles FOR ALL USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin'));


-- Farm Hierarchy Tables
CREATE TABLE public.farms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  location TEXT,
  manager_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  width NUMERIC, -- Added
  depth NUMERIC, -- Added
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_farms_manager_id ON public.farms(manager_id);


CREATE TABLE public.rows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  position INTEGER NOT NULL, -- Order of the row within the farm
  position_x NUMERIC, -- Added for layout
  position_y NUMERIC, -- Added for layout
  length NUMERIC, -- Added for layout (can represent width or depth depending on orientation)
  depth NUMERIC, -- Added for layout (if different from length/width based on orientation)
  orientation TEXT, -- Added ('horizontal', 'vertical')
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (farm_id, name),
  UNIQUE (farm_id, position)
);
CREATE INDEX idx_rows_farm_id ON public.rows(farm_id);


CREATE TABLE public.racks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  row_id UUID NOT NULL REFERENCES public.rows(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  position_in_row INTEGER NOT NULL, -- Renamed from 'position' for clarity
  width NUMERIC, -- Added
  depth NUMERIC, -- Added
  height NUMERIC, -- Added
  max_shelves INTEGER, -- Added
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (row_id, name),
  UNIQUE (row_id, position_in_row)
);
CREATE INDEX idx_racks_row_id ON public.racks(row_id);


CREATE TABLE public.shelves (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rack_id UUID NOT NULL REFERENCES public.racks(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  position_in_rack INTEGER NOT NULL, -- Renamed from 'position' for clarity
  width NUMERIC, -- Added
  depth NUMERIC, -- Added
  max_weight NUMERIC, -- Added
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (rack_id, name),
  UNIQUE (rack_id, position_in_rack)
);
CREATE INDEX idx_shelves_rack_id ON public.shelves(rack_id);


-- Device Assignment
CREATE TABLE public.device_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shelf_id UUID REFERENCES public.shelves(id) ON DELETE CASCADE, -- Can be NULL if device is at rack/row/farm level
  rack_id UUID REFERENCES public.racks(id) ON DELETE CASCADE,    -- Link to rack if not on a shelf
  row_id UUID REFERENCES public.rows(id) ON DELETE CASCADE,      -- Link to row if not on a rack
  farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE,    -- Link to farm if not in a row
  entity_id TEXT NOT NULL, -- ID from Home Assistant or other source
  entity_type TEXT NOT NULL, -- e.g., 'sensor', 'switch', 'light'
  friendly_name TEXT,
  assigned_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Constraint to ensure it's assigned to one level of hierarchy
  CONSTRAINT chk_device_assignment_level
    CHECK (
      (shelf_id IS NOT NULL AND rack_id IS NULL AND row_id IS NULL AND farm_id IS NULL) OR
      (shelf_id IS NULL AND rack_id IS NOT NULL AND row_id IS NULL AND farm_id IS NULL) OR
      (shelf_id IS NULL AND rack_id IS NULL AND row_id IS NOT NULL AND farm_id IS NULL) OR
      (shelf_id IS NULL AND rack_id IS NULL AND row_id IS NULL AND farm_id IS NOT NULL)
    )
);
CREATE INDEX idx_device_assignments_shelf_id ON public.device_assignments(shelf_id);
CREATE INDEX idx_device_assignments_rack_id ON public.device_assignments(rack_id);
CREATE INDEX idx_device_assignments_row_id ON public.device_assignments(row_id);
CREATE INDEX idx_device_assignments_farm_id ON public.device_assignments(farm_id);
CREATE INDEX idx_device_assignments_entity_id ON public.device_assignments(entity_id);


-- Species (for plants/crops)
CREATE TABLE public.species (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- Grow Recipes
CREATE TABLE public.grow_recipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  species_id UUID NOT NULL REFERENCES public.species(id) ON DELETE RESTRICT, -- Don't delete species if recipes exist
  name TEXT NOT NULL,
  grow_days INTEGER,
  light_hours_per_day NUMERIC, -- Renamed for clarity
  watering_frequency_hours NUMERIC,
  target_temperature_min NUMERIC, -- Added
  target_temperature_max NUMERIC, -- Added
  target_humidity_min NUMERIC,    -- Added
  target_humidity_max NUMERIC,    -- Added
  target_ph_min NUMERIC,          -- Added
  target_ph_max NUMERIC,          -- Added
  target_ec_min NUMERIC,          -- Added (Electrical Conductivity)
  target_ec_max NUMERIC,          -- Added
  average_yield NUMERIC,
  sowing_rate NUMERIC, -- e.g., seeds per unit area or per cell
  custom_parameters JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (species_id, name)
);
CREATE INDEX idx_grow_recipes_species_id ON public.grow_recipes(species_id);


-- Schedules (for what's growing on a shelf)
CREATE TYPE schedule_status AS ENUM ('planned', 'active', 'completed', 'aborted'); -- Added

CREATE TABLE public.schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shelf_id UUID NOT NULL REFERENCES public.shelves(id) ON DELETE CASCADE,
  grow_recipe_id UUID NOT NULL REFERENCES public.grow_recipes(id) ON DELETE RESTRICT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  estimated_end_date TIMESTAMP WITH TIME ZONE, -- Calculated from start_date + grow_days
  actual_end_date TIMESTAMP WITH TIME ZONE,
  status schedule_status NOT NULL DEFAULT 'planned',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_schedules_shelf_id ON public.schedules(shelf_id);
CREATE INDEX idx_schedules_grow_recipe_id ON public.schedules(grow_recipe_id);
CREATE INDEX idx_schedules_status ON public.schedules(status);


-- Scheduled Actions (for automation)
CREATE TYPE action_type AS ENUM ('light_on', 'light_off', 'water_pump_on', 'water_pump_off', 'nutrient_dose', 'fan_on', 'fan_off', 'alert'); -- Added
CREATE TYPE action_status AS ENUM ('pending', 'executed', 'failed', 'skipped', 'cancelled'); -- Added

CREATE TABLE public.scheduled_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  schedule_id UUID REFERENCES public.schedules(id) ON DELETE CASCADE, -- Can be null if action is not tied to a specific grow schedule
  device_assignment_id UUID REFERENCES public.device_assignments(id) ON DELETE CASCADE, -- Target device for the action
  action_type action_type NOT NULL,
  parameters JSONB, -- e.g., duration for pump, light intensity
  execution_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status action_status NOT NULL DEFAULT 'pending',
  executed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_scheduled_actions_schedule_id ON public.scheduled_actions(schedule_id);
CREATE INDEX idx_scheduled_actions_device_assignment_id ON public.scheduled_actions(device_assignment_id);
CREATE INDEX idx_scheduled_actions_execution_time ON public.scheduled_actions(execution_time);
CREATE INDEX idx_scheduled_actions_status ON public.scheduled_actions(status);


-- Sensor History
CREATE TABLE public.sensor_readings ( -- Renamed from sensor_history for clarity
  id BIGSERIAL PRIMARY KEY, -- Using BIGSERIAL for high-frequency data
  device_assignment_id UUID NOT NULL REFERENCES public.device_assignments(id) ON DELETE CASCADE,
  reading_type TEXT NOT NULL, -- e.g., 'temperature', 'humidity', 'ph', 'ec'
  value NUMERIC NOT NULL,
  unit TEXT, -- e.g., 'C', '%', 'ppm'
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_sensor_readings_device_assignment_id_timestamp ON public.sensor_readings(device_assignment_id, timestamp DESC);
CREATE INDEX idx_sensor_readings_timestamp ON public.sensor_readings(timestamp DESC);
-- Consider TimescaleDB for sensor_readings if volume is very high:
-- SELECT create_hypertable('sensor_readings', 'timestamp');


-- Harvests
CREATE TABLE public.harvests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  schedule_id UUID NOT NULL REFERENCES public.schedules(id) ON DELETE RESTRICT, -- A harvest is tied to a schedule
  shelf_id UUID NOT NULL REFERENCES public.shelves(id) ON DELETE RESTRICT, -- Redundant? schedule already has shelf_id. Consider removing.
  yield_amount NUMERIC NOT NULL,
  yield_unit TEXT NOT NULL, -- e.g., 'grams', 'kg', 'heads'
  harvest_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_harvests_schedule_id ON public.harvests(schedule_id);
CREATE INDEX idx_harvests_shelf_id ON public.harvests(shelf_id);


-- Automation Rules (Example - can be expanded significantly)
CREATE TABLE public.automation_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE, -- Rule can be farm-specific or global if NULL
    trigger_source_device_id UUID REFERENCES public.device_assignments(id) ON DELETE CASCADE,
    trigger_reading_type TEXT, -- e.g., 'temperature'
    trigger_condition TEXT, -- e.g., '>', '<', '='
    trigger_value NUMERIC,
    action_target_device_id UUID REFERENCES public.device_assignments(id) ON DELETE CASCADE,
    action_type action_type, -- Reuse from scheduled_actions
    action_parameters JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_automation_rules_farm_id ON public.automation_rules(farm_id);
CREATE INDEX idx_automation_rules_is_active ON public.automation_rules(is_active);

-- Add RLS policies as a separate step/migration or after confirming table structures.
-- Example:
-- ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users can view farms they manage or are operators in" ON public.farms
--  FOR SELECT
--  USING (
--    manager_id = auth.uid() OR
--    EXISTS (
--      SELECT 1 FROM public.user_profiles up
--      WHERE up.id = auth.uid() AND up.role IN ('operator', 'admin')
--      -- Potentially add a farm_operators link table if operators are assigned to specific farms
--    )
--  );
-- CREATE POLICY "Farm managers can update their farms" ON public.farms
--  FOR UPDATE
--  USING (manager_id = auth.uid())
--  WITH CHECK (manager_id = auth.uid());
