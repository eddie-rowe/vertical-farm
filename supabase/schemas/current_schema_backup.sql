-- ============================================
-- SUPABASE SCHEMA BACKUP
-- Generated on: 2025-01-22
-- Project ID: lvjhhvxwxeeupamyahmr
-- ============================================

-- ============================================
-- CUSTOM ENUM TYPES
-- ============================================

CREATE TYPE public.action_status AS ENUM ('pending', 'executed', 'failed', 'skipped', 'cancelled');
CREATE TYPE public.action_type AS ENUM ('light_on', 'light_off', 'water_pump_on', 'water_pump_off', 'nutrient_dose', 'fan_on', 'fan_off', 'alert');
CREATE TYPE public.grow_stage_type AS ENUM ('planning', 'seeding', 'germination', 'vegetative', 'flowering', 'harvest', 'complete');
CREATE TYPE public.integration_status AS ENUM ('connected', 'disconnected', 'error', 'syncing');
CREATE TYPE public.integration_type AS ENUM ('home_assistant', 'mqtt', 'zigbee', 'zwave');
CREATE TYPE public.schedule_status AS ENUM ('planned', 'active', 'completed', 'aborted');
CREATE TYPE public.user_role AS ENUM ('farm_manager', 'operator', 'ha_power_user', 'admin');

-- ============================================
-- CORE TABLES
-- ============================================

-- User profiles table
CREATE TABLE public.user_profiles (
    id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role public.user_role NOT NULL DEFAULT 'operator',
    name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    profile_image_url TEXT,
    storage_quota_mb INTEGER DEFAULT 100
);

-- Farms table
CREATE TABLE public.farms (
    id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    location TEXT,
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    width NUMERIC,
    depth NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    documentation_folder_path TEXT,
    farm_image_url TEXT
);

-- Rows table
CREATE TABLE public.rows (
    id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    position INTEGER NOT NULL,
    position_x NUMERIC,
    position_y NUMERIC,
    length NUMERIC,
    depth NUMERIC,
    orientation TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Racks table
CREATE TABLE public.racks (
    id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    row_id UUID NOT NULL REFERENCES public.rows(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    position_in_row INTEGER NOT NULL,
    width NUMERIC,
    depth NUMERIC,
    height NUMERIC,
    max_shelves INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shelves table
CREATE TABLE public.shelves (
    id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    rack_id UUID NOT NULL REFERENCES public.racks(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    position_in_rack INTEGER NOT NULL,
    width NUMERIC,
    depth NUMERIC,
    max_weight NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CROP AND GROWING SYSTEM
-- ============================================

-- Crops table
CREATE TABLE public.crops (
    id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    typical_grow_days INTEGER,
    optimal_temp_min NUMERIC(4,1),
    optimal_temp_max NUMERIC(4,1),
    optimal_humidity_min NUMERIC(4,1),
    optimal_humidity_max NUMERIC(4,1),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Species table
CREATE TABLE public.species (
    id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed varieties table
CREATE TABLE public.seed_varieties (
    id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
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
    crop_id UUID REFERENCES public.crops(id),
    notes TEXT
);

-- Grow stages table
CREATE TABLE public.grow_stages (
    id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    stage_type public.grow_stage_type NOT NULL,
    order_index INTEGER NOT NULL,
    description TEXT,
    typical_duration_days INTEGER,
    color_code TEXT DEFAULT '#22c55e',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Grow recipes table
CREATE TABLE public.grow_recipes (
    id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    species_id UUID NOT NULL REFERENCES public.species(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
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
    custom_parameters JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    instruction_document_url TEXT,
    reference_image_url TEXT,
    recipe_source TEXT,
    germination_days INTEGER,
    light_days INTEGER,
    total_grow_days INTEGER,
    top_coat TEXT,
    pythium_risk TEXT,
    water_intake NUMERIC(6,2),
    water_frequency TEXT,
    lighting JSONB,
    fridge_storage_temp NUMERIC(4,1),
    difficulty TEXT,
    crop_id UUID REFERENCES public.crops(id),
    is_template BOOLEAN DEFAULT true,
    created_by UUID REFERENCES public.user_profiles(id),
    success_rate NUMERIC(4,2) DEFAULT 0,
    version INTEGER DEFAULT 1,
    parent_recipe_id UUID REFERENCES public.grow_recipes(id),
    parameters JSONB DEFAULT '{}'
);

-- Recipe stage parameters table
CREATE TABLE public.recipe_stage_parameters (
    id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
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
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- DEVICE AND INTEGRATION SYSTEM
-- ============================================

-- Integrations table
CREATE TABLE public.integrations (
    id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    type public.integration_type NOT NULL,
    name TEXT NOT NULL,
    url TEXT,
    status public.integration_status NOT NULL DEFAULT 'disconnected',
    last_sync TIMESTAMPTZ,
    device_count INTEGER DEFAULT 0,
    version TEXT,
    error_message TEXT,
    configuration JSONB,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES public.user_profiles(id),
    config JSONB DEFAULT '{}',
    health_status TEXT DEFAULT 'unknown',
    last_health_check TIMESTAMPTZ,
    response_time INTEGER,
    is_active BOOLEAN DEFAULT true
);

-- Device assignments table
CREATE TABLE public.device_assignments (
    id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    shelf_id UUID REFERENCES public.shelves(id),
    rack_id UUID REFERENCES public.racks(id),
    row_id UUID REFERENCES public.rows(id),
    farm_id UUID REFERENCES public.farms(id),
    entity_id TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    friendly_name TEXT,
    assigned_by UUID REFERENCES public.user_profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    integration_id UUID REFERENCES public.integrations(id),
    manual_url TEXT,
    installation_photos TEXT[],
    user_id UUID REFERENCES public.user_profiles(id)
);

-- ============================================
-- FUNCTIONS AND TRIGGERS
-- ============================================

-- User creation trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, name, role, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      NEW.email
    ),
    COALESCE(NEW.raw_app_meta_data->>'role', 'operator')::public.user_role,
    NEW.created_at,
    NEW.created_at
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER trigger_updated_at_farms
  BEFORE UPDATE ON public.farms
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_updated_at_user_profiles
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_updated_at_rows
  BEFORE UPDATE ON public.rows
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_updated_at_racks
  BEFORE UPDATE ON public.racks
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_updated_at_shelves
  BEFORE UPDATE ON public.shelves
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_updated_at_crops
  BEFORE UPDATE ON public.crops
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_updated_at_species
  BEFORE UPDATE ON public.species
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_updated_at_seed_varieties
  BEFORE UPDATE ON public.seed_varieties
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_updated_at_grow_recipes
  BEFORE UPDATE ON public.grow_recipes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_updated_at_integrations
  BEFORE UPDATE ON public.integrations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_updated_at_device_assignments
  BEFORE UPDATE ON public.device_assignments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.racks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shelves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.species ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seed_varieties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grow_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grow_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_stage_parameters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_assignments ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY "Users can view their own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Farms policies
CREATE POLICY "Users can view their own farms" ON public.farms
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own farms" ON public.farms
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own farms" ON public.farms
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own farms" ON public.farms
  FOR DELETE USING (auth.uid() = user_id);

-- Rows policies
CREATE POLICY "Users can view rows in their farms" ON public.rows
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.farms f 
      WHERE f.id = farm_id AND f.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create rows in their farms" ON public.rows
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.farms f 
      WHERE f.id = farm_id AND f.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update rows in their farms" ON public.rows
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.farms f 
      WHERE f.id = farm_id AND f.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete rows in their farms" ON public.rows
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.farms f 
      WHERE f.id = farm_id AND f.user_id = auth.uid()
    )
  );

-- Similar policies for racks and shelves (following the ownership chain)
CREATE POLICY "Users can view racks in their farms" ON public.racks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.rows r
      JOIN public.farms f ON r.farm_id = f.id
      WHERE r.id = row_id AND f.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create racks in their farms" ON public.racks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.rows r
      JOIN public.farms f ON r.farm_id = f.id
      WHERE r.id = row_id AND f.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update racks in their farms" ON public.racks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.rows r
      JOIN public.farms f ON r.farm_id = f.id
      WHERE r.id = row_id AND f.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete racks in their farms" ON public.racks
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.rows r
      JOIN public.farms f ON r.farm_id = f.id
      WHERE r.id = row_id AND f.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view shelves in their farms" ON public.shelves
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.racks ra
      JOIN public.rows r ON ra.row_id = r.id
      JOIN public.farms f ON r.farm_id = f.id
      WHERE ra.id = rack_id AND f.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create shelves in their farms" ON public.shelves
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.racks ra
      JOIN public.rows r ON ra.row_id = r.id
      JOIN public.farms f ON r.farm_id = f.id
      WHERE ra.id = rack_id AND f.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update shelves in their farms" ON public.shelves
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.racks ra
      JOIN public.rows r ON ra.row_id = r.id
      JOIN public.farms f ON r.farm_id = f.id
      WHERE ra.id = rack_id AND f.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete shelves in their farms" ON public.shelves
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.racks ra
      JOIN public.rows r ON ra.row_id = r.id
      JOIN public.farms f ON r.farm_id = f.id
      WHERE ra.id = rack_id AND f.user_id = auth.uid()
    )
  );

-- Public read access for reference data
CREATE POLICY "Anyone can view crops" ON public.crops FOR SELECT USING (true);
CREATE POLICY "Anyone can view species" ON public.species FOR SELECT USING (true);
CREATE POLICY "Anyone can view seed varieties" ON public.seed_varieties FOR SELECT USING (true);
CREATE POLICY "Anyone can view grow stages" ON public.grow_stages FOR SELECT USING (true);

-- Recipe policies
CREATE POLICY "Anyone can view template recipes" ON public.grow_recipes
  FOR SELECT USING (is_template = true);

CREATE POLICY "Users can view their own recipes" ON public.grow_recipes
  FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Users can create recipes" ON public.grow_recipes
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own recipes" ON public.grow_recipes
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own recipes" ON public.grow_recipes
  FOR DELETE USING (created_by = auth.uid());

-- Integration policies
CREATE POLICY "Users can view their own integrations" ON public.integrations
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own integrations" ON public.integrations
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own integrations" ON public.integrations
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own integrations" ON public.integrations
  FOR DELETE USING (user_id = auth.uid());

-- Device assignment policies
CREATE POLICY "Users can view device assignments in their farms" ON public.device_assignments
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create device assignments in their farms" ON public.device_assignments
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update device assignments in their farms" ON public.device_assignments
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete device assignments in their farms" ON public.device_assignments
  FOR DELETE USING (user_id = auth.uid());

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Core relationship indexes
CREATE INDEX idx_farms_user_id ON public.farms(user_id);
CREATE INDEX idx_rows_farm_id ON public.rows(farm_id);
CREATE INDEX idx_racks_row_id ON public.racks(row_id);
CREATE INDEX idx_shelves_rack_id ON public.shelves(rack_id);

-- Recipe and growing system indexes
CREATE INDEX idx_seed_varieties_species_id ON public.seed_varieties(species_id);
CREATE INDEX idx_seed_varieties_crop_id ON public.seed_varieties(crop_id);
CREATE INDEX idx_grow_recipes_species_id ON public.grow_recipes(species_id);
CREATE INDEX idx_grow_recipes_crop_id ON public.grow_recipes(crop_id);
CREATE INDEX idx_grow_recipes_created_by ON public.grow_recipes(created_by);
CREATE INDEX idx_recipe_stage_parameters_recipe_id ON public.recipe_stage_parameters(recipe_id);
CREATE INDEX idx_recipe_stage_parameters_stage_id ON public.recipe_stage_parameters(stage_id);

-- Integration and device indexes
CREATE INDEX idx_integrations_user_id ON public.integrations(user_id);
CREATE INDEX idx_device_assignments_user_id ON public.device_assignments(user_id);
CREATE INDEX idx_device_assignments_integration_id ON public.device_assignments(integration_id);
CREATE INDEX idx_device_assignments_shelf_id ON public.device_assignments(shelf_id);
CREATE INDEX idx_device_assignments_entity_id ON public.device_assignments(entity_id);

-- Performance indexes for common queries
CREATE INDEX idx_farms_created_at ON public.farms(created_at);
CREATE INDEX idx_grow_recipes_is_template ON public.grow_recipes(is_template);
CREATE INDEX idx_integrations_status ON public.integrations(status);
CREATE INDEX idx_integrations_enabled ON public.integrations(enabled);

-- ============================================
-- COMPLETION MESSAGE
-- ============================================

-- Schema backup completed successfully
-- This file contains the complete schema definition for the Supabase vertical farm database
-- To restore: Run this entire file against a fresh Supabase database instance 