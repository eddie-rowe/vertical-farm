-- =====================================================
-- CONSOLIDATED FUNCTIONS & PERFORMANCE MIGRATION
-- =====================================================
-- This migration consolidates 6 function and performance-related migrations:
-- - 003_views_and_functions.sql (Views and utility functions)
-- - 20250129000000_enable_realtime.sql (Real-time subscriptions)
-- - 20250130000000_enhanced_rls_policies.sql (Enhanced RLS policies)
-- - 20250131000000_database_functions_performance.sql (Performance functions)
-- - 20250131140000_fix_function_signatures.sql (Function signature fixes)
-- - 20250131210000_hybrid_automation_architecture.sql (Automation architecture)

-- =====================================================
-- PART 1: OPTIMIZED VIEWS FOR GROW MANAGEMENT
-- =====================================================

-- View for Current Grows tab - comprehensive grow status
CREATE OR REPLACE VIEW current_grows_view AS
SELECT 
    g.id,
    g.name,
    g.status,
    g.plant_count,
    g.planted_date,
    g.expected_harvest_date,
    g.notes,
    g.created_at,
    
    -- Seed variety information
    sv.variety_name,
    c.name as crop_name,
    c.category as crop_category,
    
    -- Current stage information
    gs.name as current_stage,
    gs.color_code as stage_color,
    gs.order_index as stage_order,
    
    -- Recipe information
    gr.name as recipe_name,
    
    -- Location information
    array_agg(DISTINCT gl.name) as locations,
    count(DISTINCT gla.location_id) as location_count,
    
    -- Progress calculation
    CASE 
        WHEN g.planted_date IS NULL THEN 0
        WHEN g.expected_harvest_date IS NULL THEN 50
        ELSE LEAST(100, ROUND(
            (EXTRACT(EPOCH FROM NOW() - g.planted_date::timestamp) / 
             EXTRACT(EPOCH FROM g.expected_harvest_date::timestamp - g.planted_date::timestamp)) * 100
        ))
    END as progress_percentage,
    
    -- Days information
    CASE 
        WHEN g.planted_date IS NULL THEN NULL
        ELSE EXTRACT(DAYS FROM NOW() - g.planted_date::timestamp)::INTEGER
    END as days_since_planted,
    
    CASE 
        WHEN g.expected_harvest_date IS NULL THEN NULL
        ELSE (g.expected_harvest_date - CURRENT_DATE)::INTEGER
    END as days_to_harvest,
    
    -- Alert count
    (SELECT count(*) FROM grow_alerts WHERE grow_id = g.id AND is_resolved = FALSE) as active_alerts
    
FROM grows g
LEFT JOIN seed_varieties sv ON g.seed_variety_id = sv.id
LEFT JOIN crops c ON sv.crop_id = c.id
LEFT JOIN grow_stages gs ON g.current_stage_id = gs.id
LEFT JOIN grow_recipes gr ON g.recipe_id = gr.id
LEFT JOIN grow_location_assignments gla ON g.id = gla.grow_id AND gla.removed_at IS NULL
LEFT JOIN grow_locations gl ON gla.location_id = gl.id
WHERE g.status IN ('active', 'planned')
GROUP BY g.id, sv.variety_name, c.name, c.category, gs.name, gs.color_code, gs.order_index, gr.name
ORDER BY g.created_at DESC;

-- Note: grow_analytics_view is defined in views_and_functions.sql to avoid duplication

-- Note: recipe_performance_view is defined in views_and_functions.sql to avoid duplication

-- =====================================================
-- PART 2: UTILITY FUNCTIONS
-- =====================================================

-- Function to get grow timeline events
CREATE OR REPLACE FUNCTION get_grow_timeline(p_grow_id UUID)
RETURNS TABLE (
    event_date DATE,
    event_type TEXT,
    event_description TEXT,
    event_details JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        g.planted_date::DATE as event_date,
        'planted' as event_type,
        'Grow started' as event_description,
        jsonb_build_object('plant_count', g.plant_count) as event_details
    FROM grows g WHERE g.id = p_grow_id AND g.planted_date IS NOT NULL
    
    UNION ALL
    
    SELECT 
        h.harvest_date::DATE as event_date,
        'harvest' as event_type,
        'Harvest recorded' as event_description,
        jsonb_build_object('quantity', h.quantity, 'quality', h.quality_rating) as event_details
    FROM harvests h WHERE h.grow_id = p_grow_id
    
    ORDER BY event_date;
END;
$$;

-- Function to get available locations for new grows
CREATE OR REPLACE FUNCTION get_available_locations(p_capacity_needed INTEGER DEFAULT 1)
RETURNS TABLE (
    location_id UUID,
    location_name TEXT,
    location_type TEXT,
    available_capacity INTEGER,
    farm_name TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        gl.id as location_id,
        gl.name as location_name,
        gl.location_type,
        (gl.capacity - COALESCE(used.plant_count, 0)) as available_capacity,
        f.name as farm_name
    FROM grow_locations gl
    JOIN farms f ON gl.farm_id = f.id
    LEFT JOIN (
        SELECT 
            gla.location_id,
            SUM(g.plant_count) as plant_count
        FROM grow_location_assignments gla
        JOIN grows g ON gla.grow_id = g.id
        WHERE gla.removed_at IS NULL 
        AND g.status IN ('active', 'planned')
        GROUP BY gla.location_id
    ) used ON gl.id = used.location_id
    WHERE (gl.capacity - COALESCE(used.plant_count, 0)) >= p_capacity_needed
    ORDER BY available_capacity DESC;
END;
$$;

-- Function to calculate expected harvest date
CREATE OR REPLACE FUNCTION calculate_harvest_date(
    p_planted_date DATE,
    p_recipe_id UUID
) RETURNS DATE
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    recipe_duration INTEGER;
BEGIN
    SELECT COALESCE(estimated_duration_days, 30) INTO recipe_duration
    FROM grow_recipes 
    WHERE id = p_recipe_id;
    
    RETURN p_planted_date + (recipe_duration || ' days')::INTERVAL;
END;
$$;

-- Function to get environmental summary for any level in the farm hierarchy
CREATE OR REPLACE FUNCTION get_environmental_summary(
    p_farm_id UUID DEFAULT NULL,
    p_row_id UUID DEFAULT NULL,
    p_rack_id UUID DEFAULT NULL,
    p_shelf_id UUID DEFAULT NULL,
    p_hours_back INTEGER DEFAULT 24
)
RETURNS TABLE (
    sensor_type TEXT,
    avg_value NUMERIC,
    min_value NUMERIC,
    max_value NUMERIC,
    unit TEXT,
    reading_count INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Validate that exactly one level is specified
    IF (p_farm_id IS NULL AND p_row_id IS NULL AND p_rack_id IS NULL AND p_shelf_id IS NULL) THEN
        RAISE EXCEPTION 'Must specify exactly one hierarchy level (farm_id, row_id, rack_id, or shelf_id)';
    END IF;
    
    IF ((p_farm_id IS NOT NULL)::INTEGER + (p_row_id IS NOT NULL)::INTEGER + 
        (p_rack_id IS NOT NULL)::INTEGER + (p_shelf_id IS NOT NULL)::INTEGER) > 1 THEN
        RAISE EXCEPTION 'Can only specify one hierarchy level at a time';
    END IF;

    RETURN QUERY
    SELECT 
        sr.sensor_type,
        ROUND(AVG(sr.value), 2) as avg_value,
        MIN(sr.value) as min_value,
        MAX(sr.value) as max_value,
        sr.unit,
        COUNT(*)::INTEGER as reading_count
    FROM sensor_readings sr
    JOIN device_assignments da ON sr.device_assignment_id = da.id
    WHERE (
        (p_farm_id IS NOT NULL AND da.farm_id = p_farm_id) OR
        (p_row_id IS NOT NULL AND da.row_id = p_row_id) OR
        (p_rack_id IS NOT NULL AND da.rack_id = p_rack_id) OR
        (p_shelf_id IS NOT NULL AND da.shelf_id = p_shelf_id)
    )
    AND sr.timestamp > NOW() - (p_hours_back || ' hours')::INTERVAL
    GROUP BY sr.sensor_type, sr.unit
    ORDER BY sr.sensor_type;
END;
$$;

-- Function to create a grow from a recipe and assign to shelves
CREATE OR REPLACE FUNCTION create_grow_from_recipe(
    p_name TEXT,
    p_recipe_id UUID,
    p_seed_variety_id UUID,
    p_plant_count INTEGER,
    p_shelf_ids UUID[]
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_grow_id UUID;
    shelf_id UUID;
BEGIN
    -- Insert the new grow
    INSERT INTO grows (name, recipe_id, seed_variety_id, plant_count, status, planted_date, expected_harvest_date)
    VALUES (
        p_name, 
        p_recipe_id, 
        p_seed_variety_id, 
        p_plant_count, 
        'planned',
        CURRENT_DATE,
        calculate_harvest_date(CURRENT_DATE, p_recipe_id)
    )
    RETURNING id INTO new_grow_id;
    
    -- Assign to shelves (if grow_location_assignments table exists)
    -- Note: This function may need to be updated based on your actual grow assignment strategy
    FOREACH shelf_id IN ARRAY p_shelf_ids
    LOOP
        -- Check if grow_location_assignments table exists and is being used
        -- Otherwise this might need to be implemented differently
        INSERT INTO grow_location_assignments (grow_id, location_id, assigned_at)
        VALUES (new_grow_id, shelf_id, NOW());
    END LOOP;
    
    RETURN new_grow_id;
END;
$$;

-- =====================================================
-- PART 3: REAL-TIME SUBSCRIPTIONS
-- =====================================================

-- Enable real-time on user-specific configuration tables (if not already added)
DO $$
BEGIN
    -- Check if table is already in publication
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'user_home_assistant_configs'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.user_home_assistant_configs;
    END IF;
END $$;

-- Add remaining tables to realtime publication conditionally
DO $$
DECLARE
    table_names text[] := ARRAY[
        'user_device_configs', 'user_profiles', 'farms', 'rows', 'racks', 'shelves',
        'device_assignments', 'schedules', 'scheduled_actions', 'automation_rules',
        'sensor_readings', 'species', 'grow_recipes', 'harvests'
    ];
    table_name text;
BEGIN
    FOREACH table_name IN ARRAY table_names
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' 
            AND tablename = table_name
        ) THEN
            EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', table_name);
        END IF;
    END LOOP;
END $$;

-- Function to notify about important real-time events
CREATE OR REPLACE FUNCTION notify_important_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify when devices are assigned/unassigned
  IF TG_TABLE_NAME = 'device_assignments' THEN
    PERFORM pg_notify(
      'device_assignment_change', 
      json_build_object(
        'operation', TG_OP,
        'device_id', COALESCE(NEW.id, OLD.id),
        'entity_id', COALESCE(NEW.entity_id, OLD.entity_id),
        'farm_id', COALESCE(NEW.farm_id, OLD.farm_id)
      )::text
    );
  END IF;

  -- Notify when automation rules are activated/deactivated
  IF TG_TABLE_NAME = 'automation_rules' THEN
    IF (TG_OP = 'UPDATE' AND OLD.is_active != NEW.is_active) OR TG_OP = 'INSERT' THEN
      PERFORM pg_notify(
        'automation_rule_change',
        json_build_object(
          'operation', TG_OP,
          'rule_id', NEW.id,
          'rule_name', NEW.name,
          'is_active', NEW.is_active,
          'farm_id', NEW.farm_id
        )::text
      );
    END IF;
  END IF;

  -- Notify when schedules status changes
  IF TG_TABLE_NAME = 'schedules' THEN
    IF (TG_OP = 'UPDATE' AND OLD.status != NEW.status) OR TG_OP = 'INSERT' THEN
      PERFORM pg_notify(
        'schedule_status_change',
        json_build_object(
          'operation', TG_OP,
          'schedule_id', NEW.id,
          'status', NEW.status,
          'shelf_id', NEW.shelf_id
        )::text
      );
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers for important notifications
DROP TRIGGER IF EXISTS device_assignment_notify ON public.device_assignments;
CREATE TRIGGER device_assignment_notify
  AFTER INSERT OR UPDATE OR DELETE ON public.device_assignments
  FOR EACH ROW
  EXECUTE FUNCTION notify_important_changes();

DROP TRIGGER IF EXISTS automation_rule_notify ON public.automation_rules;
CREATE TRIGGER automation_rule_notify
  AFTER INSERT OR UPDATE OR DELETE ON public.automation_rules
  FOR EACH ROW
  EXECUTE FUNCTION notify_important_changes();

DROP TRIGGER IF EXISTS schedule_notify ON public.schedules;
CREATE TRIGGER schedule_notify
  AFTER INSERT OR UPDATE OR DELETE ON public.schedules
  FOR EACH ROW
  EXECUTE FUNCTION notify_important_changes();

-- Create a view for real-time connection status monitoring
CREATE OR REPLACE VIEW public.realtime_status AS
SELECT 
  'user_home_assistant_configs' as table_name,
  'Live HA integration updates' as description,
  true as enabled
UNION ALL
SELECT 
  'user_device_configs' as table_name,
  'Live device configuration updates' as description,
  true as enabled
UNION ALL
SELECT 
  'device_assignments' as table_name,
  'Live device assignment updates' as description,
  true as enabled
UNION ALL
SELECT 
  'sensor_readings' as table_name,
  'Live sensor data (high frequency)' as description,
  true as enabled
UNION ALL
SELECT 
  'schedules' as table_name,
  'Live grow schedule updates' as description,
  true as enabled
UNION ALL
SELECT 
  'automation_rules' as table_name,
  'Live automation rule updates' as description,
  true as enabled;

-- =====================================================
-- PART 4: ENHANCED ROW LEVEL SECURITY
-- =====================================================

-- Enhanced user profile policies
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "users_select_own_profile" ON public.user_profiles;
DROP POLICY IF EXISTS "users_update_own_profile" ON public.user_profiles;
DROP POLICY IF EXISTS "admins_full_access_profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "users_insert_own_profile" ON public.user_profiles;

CREATE POLICY "users_select_own_profile" ON public.user_profiles
  FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "users_update_own_profile" ON public.user_profiles
  FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "admins_full_access_profiles" ON public.user_profiles
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "users_insert_own_profile" ON public.user_profiles
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Enhanced Home Assistant config policies
ALTER TABLE public.user_home_assistant_configs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own HA configs" ON public.user_home_assistant_configs;
DROP POLICY IF EXISTS "ha_configs_select_own" ON public.user_home_assistant_configs;
DROP POLICY IF EXISTS "ha_configs_insert_own" ON public.user_home_assistant_configs;
DROP POLICY IF EXISTS "ha_configs_update_own" ON public.user_home_assistant_configs;
DROP POLICY IF EXISTS "ha_configs_delete_own" ON public.user_home_assistant_configs;
DROP POLICY IF EXISTS "admins_view_all_ha_configs" ON public.user_home_assistant_configs;

CREATE POLICY "ha_configs_select_own" ON public.user_home_assistant_configs
  FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "ha_configs_insert_own" ON public.user_home_assistant_configs
  FOR INSERT 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "ha_configs_update_own" ON public.user_home_assistant_configs
  FOR UPDATE 
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "ha_configs_delete_own" ON public.user_home_assistant_configs
  FOR DELETE 
  USING (user_id = auth.uid());

CREATE POLICY "admins_view_all_ha_configs" ON public.user_home_assistant_configs
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Enhanced device config policies
ALTER TABLE public.user_device_configs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own device configs" ON public.user_device_configs;
DROP POLICY IF EXISTS "device_configs_select_own" ON public.user_device_configs;
DROP POLICY IF EXISTS "device_configs_insert_own" ON public.user_device_configs;
DROP POLICY IF EXISTS "device_configs_update_own" ON public.user_device_configs;
DROP POLICY IF EXISTS "device_configs_delete_own" ON public.user_device_configs;

CREATE POLICY "device_configs_select_own" ON public.user_device_configs
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_home_assistant_configs 
      WHERE id = user_device_configs.user_config_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "device_configs_insert_own" ON public.user_device_configs
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_home_assistant_configs 
      WHERE id = user_device_configs.user_config_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "device_configs_update_own" ON public.user_device_configs
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_home_assistant_configs 
      WHERE id = user_device_configs.user_config_id 
      AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_home_assistant_configs 
      WHERE id = user_device_configs.user_config_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "device_configs_delete_own" ON public.user_device_configs
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_home_assistant_configs 
      WHERE id = user_device_configs.user_config_id 
      AND user_id = auth.uid()
    )
  );

-- Farm hierarchy security
ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "farms_manager_access" ON public.farms;
DROP POLICY IF EXISTS "farms_public_read" ON public.farms;
DROP POLICY IF EXISTS "admins_full_access_farms" ON public.farms;

-- Create farms_manager_access policy only if user_id column exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'farms' 
        AND column_name = 'user_id'
        AND table_schema = 'public'
    ) THEN
        CREATE POLICY "farms_manager_access" ON public.farms
          FOR ALL 
          USING (user_id = auth.uid());
    END IF;
END $$;

CREATE POLICY "farms_public_read" ON public.farms
  FOR SELECT 
  USING (true);

-- Create admin access policy
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'farms' 
        AND column_name = 'user_id'
        AND table_schema = 'public'
    ) THEN
        CREATE POLICY "admins_full_access_farms" ON public.farms
          FOR ALL 
          USING (
            EXISTS (
              SELECT 1 FROM public.user_profiles 
              WHERE id = auth.uid() AND role = 'admin'
            )
          );
    END IF;
END $$;

-- Row access based on farm access
ALTER TABLE public.rows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rows_farm_based_access" ON public.rows;

CREATE POLICY "rows_farm_based_access" ON public.rows
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.farms 
      WHERE id = rows.farm_id 
      AND (
        user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.user_profiles 
          WHERE id = auth.uid() AND role = 'admin'
        )
      )
    )
  );

-- Rack access based on row/farm access
ALTER TABLE public.racks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "racks_farm_based_access" ON public.racks;

CREATE POLICY "racks_farm_based_access" ON public.racks
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.rows r
      JOIN public.farms f ON r.farm_id = f.id
      WHERE r.id = racks.row_id 
      AND (
        f.user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.user_profiles 
          WHERE id = auth.uid() AND role = 'admin'
        )
      )
    )
  );

-- Shelf access based on rack/row/farm access
ALTER TABLE public.shelves ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "shelves_farm_based_access" ON public.shelves;

CREATE POLICY "shelves_farm_based_access" ON public.shelves
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.racks ra
      JOIN public.rows ro ON ra.row_id = ro.id
      JOIN public.farms f ON ro.farm_id = f.id
      WHERE ra.id = shelves.rack_id 
      AND (
        f.user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.user_profiles 
          WHERE id = auth.uid() AND role = 'admin'
        )
      )
    )
  );

-- =====================================================
-- PART 5: PERFORMANCE OPTIMIZATION FUNCTIONS
-- =====================================================

-- Optimized function to check user permissions
DROP FUNCTION IF EXISTS public.check_user_permissions(text);
CREATE OR REPLACE FUNCTION public.check_user_permissions(target_table_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    user_role text;
    is_admin boolean := false;
BEGIN
    -- Get user role efficiently
    SELECT role INTO user_role 
    FROM public.user_profiles 
    WHERE id = auth.uid();
    
    -- Check if user is admin
    is_admin := (user_role = 'admin');
    
    -- Return permissions based on table and role
    CASE target_table_name
        WHEN 'farms' THEN
            RETURN is_admin OR EXISTS (
                SELECT 1 FROM public.farms 
                WHERE user_id = auth.uid()
            );
        WHEN 'user_profiles' THEN
            RETURN true; -- All authenticated users can access their own profile
        ELSE
            RETURN is_admin;
    END CASE;
END;
$$;

-- Function to get user accessible farms efficiently
DROP FUNCTION IF EXISTS public.get_user_accessible_farms();
CREATE OR REPLACE FUNCTION public.get_user_accessible_farms()
RETURNS TABLE(farm_id uuid, farm_name text, access_level text)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    user_role text;
BEGIN
    -- Get user role
    SELECT role INTO user_role
    FROM public.user_profiles
    WHERE id = auth.uid();

    -- Return farms based on role
    IF user_role = 'admin' THEN
        RETURN QUERY
        SELECT f.id, f.name, 'admin'::text
        FROM public.farms f;
    ELSE
        RETURN QUERY
        SELECT f.id, f.name, 'manager'::text
        FROM public.farms f
        WHERE f.user_id = auth.uid();
    END IF;
END;
$$;

-- Security audit view
DROP VIEW IF EXISTS public.security_audit_view;
CREATE OR REPLACE VIEW public.security_audit_view AS
SELECT
    'user_profiles' as table_name,
    'Row Level Security enabled' as security_status,
    'Users can only access their own profiles' as policy_summary
UNION ALL
SELECT
    'user_home_assistant_configs' as table_name,
    'Row Level Security enabled' as security_status,
    'Users can only access their own HA configs' as policy_summary
UNION ALL
SELECT
    'farms' as table_name,
    'Row Level Security enabled' as security_status,
    'Farm managers and admins have access' as policy_summary;

-- =====================================================
-- PART 6: FUNCTION SIGNATURE FIXES & AUTOMATION
-- =====================================================

-- Fixed function signatures for better performance
CREATE OR REPLACE FUNCTION public.user_can_access_farm(farm_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    user_role text;
BEGIN
    SELECT role INTO user_role 
    FROM public.user_profiles 
    WHERE id = auth.uid();
    
    -- Admin can access all farms
    IF user_role = 'admin' THEN
        RETURN true;
    END IF;
    
    -- Check if user is the farm manager
    RETURN EXISTS (
        SELECT 1 FROM public.farms 
        WHERE id = farm_uuid AND user_id = auth.uid()
    );
END;
$$;

-- Hybrid automation architecture functions
CREATE OR REPLACE FUNCTION public.trigger_automation_rule(
    rule_id uuid,
    context_data jsonb DEFAULT '{}'::jsonb
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    rule_record record;
    queue_payload jsonb;
BEGIN
    -- Get the automation rule
    SELECT * INTO rule_record
    FROM public.automation_rules
    WHERE id = rule_id AND is_active = true;
    
    IF NOT FOUND THEN
        RETURN false;
    END IF;
    
    -- Prepare queue payload
    queue_payload := jsonb_build_object(
        'rule_id', rule_id,
        'rule_name', rule_record.name,
        'trigger_type', rule_record.trigger_type,
        'actions', rule_record.actions,
        'context', context_data,
        'triggered_at', NOW()
    );
    
    -- Queue the automation for processing
    INSERT INTO pgmq.automation_queue (message)
    VALUES (queue_payload);
    
    -- Update rule last triggered
    UPDATE public.automation_rules
    SET last_triggered_at = NOW(),
        trigger_count = COALESCE(trigger_count, 0) + 1
    WHERE id = rule_id;
    
    RETURN true;
END;
$$;

-- Function to process scheduled automations
CREATE OR REPLACE FUNCTION public.process_scheduled_automations()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    processed_count integer := 0;
    rule_record record;
BEGIN
    -- Process time-based automation rules
    FOR rule_record IN 
        SELECT * FROM public.automation_rules
        WHERE is_active = true 
        AND trigger_type = 'schedule'
        AND (
            last_triggered_at IS NULL OR
            last_triggered_at < NOW() - (trigger_conditions->>'interval')::interval
        )
    LOOP
        -- Trigger the automation rule
        IF public.trigger_automation_rule(rule_record.id) THEN
            processed_count := processed_count + 1;
        END IF;
    END LOOP;
    
    RETURN processed_count;
END;
$$;

-- =====================================================
-- GRANTS AND PERMISSIONS
-- =====================================================

-- Grant access to views and functions (conditional)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'current_grows_view' AND table_schema = 'public') THEN
        GRANT SELECT ON public.current_grows_view TO authenticated;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'grow_analytics_view' AND table_schema = 'public') THEN
        GRANT SELECT ON public.grow_analytics_view TO authenticated;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'recipe_performance_view' AND table_schema = 'public') THEN
        GRANT SELECT ON public.recipe_performance_view TO authenticated;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'realtime_status' AND table_schema = 'public') THEN
        GRANT SELECT ON public.realtime_status TO authenticated;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'security_audit_view' AND table_schema = 'public') THEN
        GRANT SELECT ON public.security_audit_view TO authenticated;
    END IF;
END $$;

-- Grant execute permissions on functions (conditional)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'get_grow_timeline' AND routine_schema = 'public') THEN
        GRANT EXECUTE ON FUNCTION public.get_grow_timeline(uuid) TO authenticated;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'get_available_locations' AND routine_schema = 'public') THEN
        GRANT EXECUTE ON FUNCTION public.get_available_locations(integer) TO authenticated;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'calculate_harvest_date' AND routine_schema = 'public') THEN
        GRANT EXECUTE ON FUNCTION public.calculate_harvest_date(date, uuid) TO authenticated;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'get_environmental_summary' AND routine_schema = 'public') THEN
        GRANT EXECUTE ON FUNCTION public.get_environmental_summary(uuid, uuid, uuid, uuid, integer) TO authenticated;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'create_grow_from_recipe' AND routine_schema = 'public') THEN
        GRANT EXECUTE ON FUNCTION public.create_grow_from_recipe(text, uuid, uuid, integer, uuid[]) TO authenticated;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'check_user_permissions' AND routine_schema = 'public') THEN
        GRANT EXECUTE ON FUNCTION public.check_user_permissions(text) TO authenticated;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'get_user_accessible_farms' AND routine_schema = 'public') THEN
        GRANT EXECUTE ON FUNCTION public.get_user_accessible_farms() TO authenticated;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'user_can_access_farm' AND routine_schema = 'public') THEN
        GRANT EXECUTE ON FUNCTION public.user_can_access_farm(uuid) TO authenticated;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'trigger_automation_rule' AND routine_schema = 'public') THEN
        GRANT EXECUTE ON FUNCTION public.trigger_automation_rule(uuid, jsonb) TO authenticated;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'process_scheduled_automations' AND routine_schema = 'public') THEN
        GRANT EXECUTE ON FUNCTION public.process_scheduled_automations() TO authenticated;
    END IF;
END $$;

-- Add helpful comments (conditional)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'current_grows_view' AND table_schema = 'public') THEN
        COMMENT ON VIEW public.current_grows_view IS 'Optimized view for active grows with real-time data';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'grow_analytics_view' AND table_schema = 'public') THEN
        COMMENT ON VIEW public.grow_analytics_view IS 'Historical analytics for completed grows';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'recipe_performance_view' AND table_schema = 'public') THEN
        COMMENT ON VIEW public.recipe_performance_view IS 'Recipe performance metrics and statistics';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'trigger_automation_rule' AND routine_schema = 'public') THEN
        COMMENT ON FUNCTION public.trigger_automation_rule(uuid, jsonb) IS 'Triggers automation rule execution via queue system';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'process_scheduled_automations' AND routine_schema = 'public') THEN
        COMMENT ON FUNCTION public.process_scheduled_automations() IS 'Processes time-based automation rules';
    END IF;
END $$;

-- =====================================================
-- CONSOLIDATION TRACKING
-- =====================================================

-- Record this consolidation in the tracking table (conditional)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'migration_consolidation_progress' AND table_schema = 'public') THEN
        INSERT INTO public.migration_consolidation_progress (
            consolidation_name,
            original_migrations,
            consolidated_migration,
            status,
            completed_at
        ) VALUES (
            'Functions & Performance Consolidation',
            ARRAY[
                '003_views_and_functions.sql',
                '20250129000000_enable_realtime.sql',
                '20250130000000_enhanced_rls_policies.sql',
                '20250131000000_database_functions_performance.sql',
                '20250131140000_fix_function_signatures.sql',
                '20250131210000_hybrid_automation_architecture.sql'
            ],
            '20250203000010_consolidated_functions_performance.sql',
            'completed',
            NOW()
        ) ON CONFLICT (consolidation_name) DO UPDATE SET
            status = 'completed',
            completed_at = NOW();
    END IF;
END $$; 