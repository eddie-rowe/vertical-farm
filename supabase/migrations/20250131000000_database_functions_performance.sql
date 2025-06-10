-- Database Functions & Performance Optimizations for Vertical Farm Platform
-- This migration adds useful database functions, triggers, and performance improvements

-- =====================================================
-- UTILITY FUNCTIONS
-- =====================================================

-- Function to generate farm hierarchy statistics
CREATE OR REPLACE FUNCTION public.get_farm_statistics(farm_uuid uuid)
RETURNS TABLE (
  farm_id uuid,
  farm_name text,
  total_rows integer,
  total_racks integer,
  total_shelves integer,
  total_devices integer,
  active_schedules integer,
  completion_rate numeric
)
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.id as farm_id,
    f.name as farm_name,
    (SELECT COUNT(*)::integer FROM public.rows WHERE farm_id = f.id) as total_rows,
    (SELECT COUNT(*)::integer FROM public.racks ra 
     JOIN public.rows r ON ra.row_id = r.id 
     WHERE r.farm_id = f.id) as total_racks,
    (SELECT COUNT(*)::integer FROM public.shelves s
     JOIN public.racks ra ON s.rack_id = ra.id
     JOIN public.rows r ON ra.row_id = r.id 
     WHERE r.farm_id = f.id) as total_shelves,
    (SELECT COUNT(*)::integer FROM public.device_assignments da
     WHERE da.farm_id = f.id 
     OR da.row_id IN (SELECT id FROM public.rows WHERE farm_id = f.id)
     OR da.rack_id IN (
       SELECT ra.id FROM public.racks ra 
       JOIN public.rows r ON ra.row_id = r.id 
       WHERE r.farm_id = f.id
     )
     OR da.shelf_id IN (
       SELECT s.id FROM public.shelves s
       JOIN public.racks ra ON s.rack_id = ra.id
       JOIN public.rows r ON ra.row_id = r.id 
       WHERE r.farm_id = f.id
     )) as total_devices,
    (SELECT COUNT(*)::integer FROM public.schedules sc
     JOIN public.shelves s ON sc.shelf_id = s.id
     JOIN public.racks ra ON s.rack_id = ra.id
     JOIN public.rows r ON ra.row_id = r.id 
     WHERE r.farm_id = f.id AND sc.status = 'active') as active_schedules,
    (SELECT 
       CASE 
         WHEN COUNT(*) = 0 THEN 0::numeric
         ELSE ROUND(
           (COUNT(*) FILTER (WHERE status = 'completed'))::numeric / COUNT(*)::numeric * 100, 2
         )
       END
     FROM public.schedules sc
     JOIN public.shelves s ON sc.shelf_id = s.id
     JOIN public.racks ra ON s.rack_id = ra.id
     JOIN public.rows r ON ra.row_id = r.id 
     WHERE r.farm_id = f.id) as completion_rate
  FROM public.farms f
  WHERE f.id = farm_uuid
  AND (
    f.manager_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_farm_statistics(uuid) TO authenticated;

-- Function to get device status summary
CREATE OR REPLACE FUNCTION public.get_device_status_summary(farm_uuid uuid DEFAULT NULL)
RETURNS TABLE (
  device_type text,
  total_count bigint,
  last_update timestamp with time zone
)
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    da.entity_type as device_type,
    COUNT(*) as total_count,
    MAX(da.updated_at) as last_update
  FROM public.device_assignments da
  WHERE (farm_uuid IS NULL OR da.farm_id = farm_uuid)
  AND (
    farm_uuid IS NULL OR
    EXISTS (
      SELECT 1 FROM public.farms f
      WHERE f.id = farm_uuid 
      AND (
        f.manager_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.user_profiles 
          WHERE id = auth.uid() AND role = 'admin'
        )
      )
    )
  )
  GROUP BY da.entity_type
  ORDER BY da.entity_type;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_device_status_summary(uuid) TO authenticated;

-- Function to get active schedules with progress
CREATE OR REPLACE FUNCTION public.get_active_schedules_with_progress(farm_uuid uuid DEFAULT NULL)
RETURNS TABLE (
  schedule_id uuid,
  shelf_name text,
  rack_name text,
  row_name text,
  farm_name text,
  species_name text,
  recipe_name text,
  start_date timestamp with time zone,
  estimated_end_date timestamp with time zone,
  days_elapsed integer,
  days_remaining integer,
  progress_percentage numeric,
  status schedule_status
)
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sc.id as schedule_id,
    s.name as shelf_name,
    ra.name as rack_name,
    r.name as row_name,
    f.name as farm_name,
    sp.name as species_name,
    gr.name as recipe_name,
    sc.start_date,
    sc.estimated_end_date,
    EXTRACT(DAY FROM (NOW() - sc.start_date))::integer as days_elapsed,
    CASE 
      WHEN sc.estimated_end_date IS NOT NULL 
      THEN EXTRACT(DAY FROM (sc.estimated_end_date - NOW()))::integer
      ELSE NULL
    END as days_remaining,
    CASE 
      WHEN sc.estimated_end_date IS NOT NULL 
      THEN ROUND(
        EXTRACT(EPOCH FROM (NOW() - sc.start_date)) / 
        EXTRACT(EPOCH FROM (sc.estimated_end_date - sc.start_date)) * 100, 2
      )
      ELSE NULL
    END as progress_percentage,
    sc.status
  FROM public.schedules sc
  JOIN public.shelves s ON sc.shelf_id = s.id
  JOIN public.racks ra ON s.rack_id = ra.id
  JOIN public.rows r ON ra.row_id = r.id
  JOIN public.farms f ON r.farm_id = f.id
  JOIN public.grow_recipes gr ON sc.grow_recipe_id = gr.id
  JOIN public.species sp ON gr.species_id = sp.id
  WHERE sc.status IN ('planned', 'active')
  AND (farm_uuid IS NULL OR f.id = farm_uuid)
  AND (
    f.manager_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  ORDER BY sc.start_date DESC;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_active_schedules_with_progress(uuid) TO authenticated;

-- =====================================================
-- AUTOMATED TRIGGERS
-- =====================================================

-- Function to automatically update updated_at columns
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to all relevant tables
DO $$ 
DECLARE
  tbl_name text;
BEGIN
  FOR tbl_name IN 
    SELECT tablename FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename IN (
      'user_profiles', 'farms', 'rows', 'racks', 'shelves', 
      'device_assignments', 'schedules', 'grow_recipes', 
      'species', 'scheduled_actions', 'automation_rules',
      'user_home_assistant_configs', 'user_device_configs'
    )
  LOOP
    -- Check if updated_at column exists
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = tbl_name 
      AND column_name = 'updated_at'
    ) THEN
      -- Drop trigger if exists
      EXECUTE format('DROP TRIGGER IF EXISTS update_%s_updated_at ON public.%I', 
                     tbl_name, tbl_name);
      
      -- Create trigger
      EXECUTE format('CREATE TRIGGER update_%s_updated_at 
                      BEFORE UPDATE ON public.%I 
                      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()', 
                     tbl_name, tbl_name);
    END IF;
  END LOOP;
END $$;

-- Function to calculate estimated end date for schedules
CREATE OR REPLACE FUNCTION public.calculate_schedule_end_date()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate estimated end date based on grow recipe days
  IF NEW.estimated_end_date IS NULL AND NEW.start_date IS NOT NULL THEN
    SELECT 
      NEW.start_date + INTERVAL '1 day' * COALESCE(gr.grow_days, 30)
    INTO NEW.estimated_end_date
    FROM public.grow_recipes gr
    WHERE gr.id = NEW.grow_recipe_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate schedule end dates
DROP TRIGGER IF EXISTS calculate_schedule_end_date ON public.schedules;
CREATE TRIGGER calculate_schedule_end_date
  BEFORE INSERT OR UPDATE ON public.schedules
  FOR EACH ROW EXECUTE FUNCTION public.calculate_schedule_end_date();

-- =====================================================
-- SEARCH & INDEXING OPTIMIZATIONS
-- =====================================================

-- Full-text search function for devices
CREATE OR REPLACE FUNCTION public.search_devices(search_term text, farm_uuid uuid DEFAULT NULL)
RETURNS TABLE (
  device_id uuid,
  entity_id text,
  friendly_name text,
  device_type text,
  location_description text,
  farm_name text,
  relevance_score real
)
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    da.id as device_id,
    da.entity_id,
    da.friendly_name,
    da.entity_type as device_type,
    CASE 
      WHEN da.shelf_id IS NOT NULL THEN 
        CONCAT(f.name, ' > ', r.name, ' > ', ra.name, ' > ', s.name)
      WHEN da.rack_id IS NOT NULL THEN 
        CONCAT(f.name, ' > ', r.name, ' > ', ra.name)
      WHEN da.row_id IS NOT NULL THEN 
        CONCAT(f.name, ' > ', r.name)
      WHEN da.farm_id IS NOT NULL THEN 
        f.name
      ELSE 'Unassigned'
    END as location_description,
    f.name as farm_name,
    (
      similarity(COALESCE(da.friendly_name, ''), search_term) +
      similarity(da.entity_id, search_term) +
      similarity(da.entity_type, search_term)
    ) / 3.0 as relevance_score
  FROM public.device_assignments da
  LEFT JOIN public.shelves s ON da.shelf_id = s.id
  LEFT JOIN public.racks ra ON da.rack_id = ra.id OR s.rack_id = ra.id
  LEFT JOIN public.rows r ON da.row_id = r.id OR ra.row_id = r.id
  LEFT JOIN public.farms f ON da.farm_id = f.id OR r.farm_id = f.id
  WHERE (
    COALESCE(da.friendly_name, '') ILIKE '%' || search_term || '%' OR
    da.entity_id ILIKE '%' || search_term || '%' OR
    da.entity_type ILIKE '%' || search_term || '%'
  )
  AND (farm_uuid IS NULL OR f.id = farm_uuid)
  AND (
    f.manager_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  ORDER BY relevance_score DESC, da.friendly_name;
END;
$$ LANGUAGE plpgsql;

-- Enable similarity extension for search (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.search_devices(text, uuid) TO authenticated;

-- =====================================================
-- PERFORMANCE INDEXES
-- =====================================================

-- Composite indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_device_assignments_hierarchy_lookup 
  ON public.device_assignments (farm_id, row_id, rack_id, shelf_id);

CREATE INDEX IF NOT EXISTS idx_schedules_status_dates 
  ON public.schedules (status, start_date, estimated_end_date);

-- Note: Index on sensor_readings for recent data - avoiding NOW() in predicate
CREATE INDEX IF NOT EXISTS idx_sensor_readings_device_timestamp 
  ON public.sensor_readings (device_assignment_id, timestamp DESC);

-- Text search indexes
CREATE INDEX IF NOT EXISTS idx_device_assignments_search 
  ON public.device_assignments USING GIN (
    (COALESCE(friendly_name, '') || ' ' || entity_id || ' ' || entity_type) gin_trgm_ops
  );

-- =====================================================
-- DATA VALIDATION FUNCTIONS
-- =====================================================

-- Function to validate device assignment hierarchy
CREATE OR REPLACE FUNCTION public.validate_device_assignment()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure device is assigned to only one level of hierarchy
  IF (
    (NEW.shelf_id IS NOT NULL)::integer +
    (NEW.rack_id IS NOT NULL)::integer +
    (NEW.row_id IS NOT NULL)::integer +
    (NEW.farm_id IS NOT NULL)::integer
  ) != 1 THEN
    RAISE EXCEPTION 'Device must be assigned to exactly one level of hierarchy';
  END IF;
  
  -- Validate hierarchy consistency
  IF NEW.shelf_id IS NOT NULL THEN
    -- Validate shelf exists and get its hierarchy
    IF NOT EXISTS (
      SELECT 1 FROM public.shelves s
      JOIN public.racks ra ON s.rack_id = ra.id
      JOIN public.rows r ON ra.row_id = r.id
      JOIN public.farms f ON r.farm_id = f.id
      WHERE s.id = NEW.shelf_id
    ) THEN
      RAISE EXCEPTION 'Invalid shelf assignment - hierarchy incomplete';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for device assignment validation
DROP TRIGGER IF EXISTS validate_device_assignment ON public.device_assignments;
CREATE TRIGGER validate_device_assignment
  BEFORE INSERT OR UPDATE ON public.device_assignments
  FOR EACH ROW EXECUTE FUNCTION public.validate_device_assignment();

-- =====================================================
-- ANALYTICS FUNCTIONS
-- =====================================================

-- Function to get harvest analytics
CREATE OR REPLACE FUNCTION public.get_harvest_analytics(
  farm_uuid uuid DEFAULT NULL,
  start_date timestamp with time zone DEFAULT NOW() - INTERVAL '1 year',
  end_date timestamp with time zone DEFAULT NOW()
)
RETURNS TABLE (
  species_name text,
  total_harvests bigint,
  total_yield numeric,
  average_yield numeric,
  best_yield numeric,
  average_grow_days numeric,
  success_rate numeric
)
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sp.name as species_name,
    COUNT(h.id) as total_harvests,
    COALESCE(SUM(h.actual_yield), 0) as total_yield,
    COALESCE(AVG(h.actual_yield), 0) as average_yield,
    COALESCE(MAX(h.actual_yield), 0) as best_yield,
    COALESCE(AVG(EXTRACT(DAY FROM (h.harvest_date - sc.start_date))), 0) as average_grow_days,
    ROUND(
      COUNT(h.id)::numeric / 
      GREATEST(COUNT(sc.id), 1)::numeric * 100, 2
    ) as success_rate
  FROM public.species sp
  JOIN public.grow_recipes gr ON sp.id = gr.species_id
  JOIN public.schedules sc ON gr.id = sc.grow_recipe_id
  LEFT JOIN public.harvests h ON sc.id = h.schedule_id
    AND h.harvest_date BETWEEN start_date AND end_date
  JOIN public.shelves s ON sc.shelf_id = s.id
  JOIN public.racks ra ON s.rack_id = ra.id
  JOIN public.rows r ON ra.row_id = r.id
  JOIN public.farms f ON r.farm_id = f.id
  WHERE (farm_uuid IS NULL OR f.id = farm_uuid)
  AND (
    f.manager_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  AND sc.start_date >= start_date
  GROUP BY sp.id, sp.name
  ORDER BY total_harvests DESC, total_yield DESC;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_harvest_analytics(uuid, timestamp with time zone, timestamp with time zone) TO authenticated;

-- =====================================================
-- CLEANUP & MAINTENANCE
-- =====================================================

-- Function to clean up old sensor readings (keep only last 30 days by default)
CREATE OR REPLACE FUNCTION public.cleanup_old_sensor_readings(
  retention_days integer DEFAULT 30
)
RETURNS integer
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count integer;
BEGIN
  -- Only allow admins to run cleanup
  IF NOT EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only administrators can perform data cleanup';
  END IF;
  
  DELETE FROM public.sensor_readings 
  WHERE timestamp < (NOW() - (retention_days || ' days')::interval);
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.cleanup_old_sensor_readings(integer) TO authenticated; 