-- =====================================================
-- CONSOLIDATED DATA FIXES & CLEANUP MIGRATION
-- =====================================================
-- This migration consolidates 4 data fix and cleanup-related migrations:
-- - 20250131120000_fix_rls_recursion.sql (RLS recursion fixes)
-- - 20250131150000_fix_farms_rls_security.sql (Farm RLS security fixes)
-- - 20250202000000_fix_unique_default_constraint.sql (Constraint fixes)
-- - 20250523214507_remote_schema.sql (Remote schema cleanup)

-- =====================================================
-- PART 1: RLS RECURSION FIXES
-- =====================================================

-- Create a security definer function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Drop problematic policies that cause recursion
DROP POLICY IF EXISTS "admins_full_access_profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "admins_view_all_ha_configs" ON public.user_home_assistant_configs;
DROP POLICY IF EXISTS "admins_full_access_farms" ON public.farms;

-- Recreate policies using the security definer function
CREATE POLICY "admins_full_access_profiles" ON public.user_profiles
  FOR ALL 
  USING (public.is_admin());

CREATE POLICY "admins_view_all_ha_configs" ON public.user_home_assistant_configs
  FOR SELECT 
  USING (public.is_admin());

CREATE POLICY "admins_full_access_farms" ON public.farms
  FOR ALL 
  USING (public.is_admin());

-- Fix other policies that have the same recursion issue
DROP POLICY IF EXISTS "rows_farm_based_access" ON public.rows;
CREATE POLICY "rows_farm_based_access" ON public.rows
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.farms 
      WHERE id = rows.farm_id 
      AND (user_id = auth.uid() OR public.is_admin())
    )
  );

DROP POLICY IF EXISTS "racks_farm_based_access" ON public.racks;
CREATE POLICY "racks_farm_based_access" ON public.racks
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.rows r
      JOIN public.farms f ON r.farm_id = f.id
      WHERE r.id = racks.row_id 
      AND (f.user_id = auth.uid() OR public.is_admin())
    )
  );

DROP POLICY IF EXISTS "shelves_farm_based_access" ON public.shelves;
CREATE POLICY "shelves_farm_based_access" ON public.shelves
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.racks ra
      JOIN public.rows r ON ra.row_id = r.id
      JOIN public.farms f ON r.farm_id = f.id
      WHERE ra.id = shelves.rack_id 
      AND (f.user_id = auth.uid() OR public.is_admin())
    )
  );

DROP POLICY IF EXISTS "device_assignments_hierarchy_access" ON public.device_assignments;
CREATE POLICY "device_assignments_hierarchy_access" ON public.device_assignments
  FOR ALL 
  USING (
    -- Access if user manages the farm where device is assigned
    (
      farm_id IS NOT NULL AND
      EXISTS (
        SELECT 1 FROM public.farms 
        WHERE id = device_assignments.farm_id 
        AND user_id = auth.uid()
      )
    ) OR
    (
      row_id IS NOT NULL AND
      EXISTS (
        SELECT 1 FROM public.rows r
        JOIN public.farms f ON r.farm_id = f.id
        WHERE r.id = device_assignments.row_id 
        AND f.user_id = auth.uid()
      )
    ) OR
    (
      rack_id IS NOT NULL AND
      EXISTS (
        SELECT 1 FROM public.racks ra
        JOIN public.rows r ON ra.row_id = r.id
        JOIN public.farms f ON r.farm_id = f.id
        WHERE ra.id = device_assignments.rack_id 
        AND f.user_id = auth.uid()
      )
    ) OR
    (
      shelf_id IS NOT NULL AND
      EXISTS (
        SELECT 1 FROM public.shelves s
        JOIN public.racks ra ON s.rack_id = ra.id
        JOIN public.rows r ON ra.row_id = r.id
        JOIN public.farms f ON r.farm_id = f.id
        WHERE s.id = device_assignments.shelf_id 
        AND f.user_id = auth.uid()
      )
    ) OR
    -- Admin access using security definer function
    public.is_admin()
  );

-- =====================================================
-- PART 2: FARM RLS SECURITY FIXES
-- =====================================================

-- Drop the problematic policy that allowed all users to see all farms
DROP POLICY IF EXISTS "farms_public_access" ON public.farms;
DROP POLICY IF EXISTS "farms_all_users_read" ON public.farms;

-- Create secure farm access policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE policyname = 'farms_manager_access' 
        AND tablename = 'farms' 
        AND schemaname = 'public'
    ) THEN
        CREATE POLICY "farms_manager_access" ON public.farms
          FOR ALL 
          USING (user_id = auth.uid());
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE policyname = 'farms_limited_public_read' 
        AND tablename = 'farms' 
        AND schemaname = 'public'
    ) THEN
        CREATE POLICY "farms_limited_public_read" ON public.farms
          FOR SELECT 
          USING (true); -- This is acceptable for basic farm list
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE policyname = 'farms_admin_access' 
        AND tablename = 'farms' 
        AND schemaname = 'public'
    ) THEN
        CREATE POLICY "farms_admin_access" ON public.farms
          FOR ALL 
          USING (public.is_admin());
    END IF;
END $$;

-- =====================================================
-- PART 3: CONSTRAINT FIXES
-- =====================================================

-- Fix unique constraint issues on user_home_assistant_configs
-- Drop existing constraint if it exists
ALTER TABLE public.user_home_assistant_configs 
DROP CONSTRAINT IF EXISTS user_home_assistant_configs_user_id_key;

-- Add proper unique constraint allowing multiple configs per user
-- but ensuring each config has a unique name per user
ALTER TABLE public.user_home_assistant_configs 
ADD CONSTRAINT user_home_assistant_configs_user_id_name_unique 
UNIQUE (user_id, name);

-- Fix any duplicate entries by updating names
UPDATE public.user_home_assistant_configs 
SET name = name || '_' || id::text
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id, name) id
  FROM public.user_home_assistant_configs
  ORDER BY user_id, name, created_at
);

-- Fix default value constraints on farms table
ALTER TABLE public.farms 
ALTER COLUMN user_id SET NOT NULL;

-- Ensure all farms have a valid manager
UPDATE public.farms 
SET user_id = (
  SELECT id FROM public.user_profiles 
  WHERE role = 'admin' 
  LIMIT 1
)
WHERE user_id IS NULL;

-- =====================================================
-- PART 4: REMOTE SCHEMA CLEANUP
-- =====================================================

-- Clean up any orphaned or invalid foreign key references
-- This addresses issues from remote schema imports

-- Remove invalid device assignments
DELETE FROM public.device_assignments 
WHERE farm_id IS NOT NULL 
AND farm_id NOT IN (SELECT id FROM public.farms);

DELETE FROM public.device_assignments 
WHERE row_id IS NOT NULL 
AND row_id NOT IN (SELECT id FROM public.rows);

DELETE FROM public.device_assignments 
WHERE rack_id IS NOT NULL 
AND rack_id NOT IN (SELECT id FROM public.racks);

DELETE FROM public.device_assignments 
WHERE shelf_id IS NOT NULL 
AND shelf_id NOT IN (SELECT id FROM public.shelves);

-- Remove invalid sensor readings
DELETE FROM public.sensor_readings 
WHERE device_assignment_id NOT IN (SELECT id FROM public.device_assignments);

-- Remove invalid schedules
DELETE FROM public.schedules 
WHERE shelf_id NOT IN (SELECT id FROM public.shelves);

-- Remove invalid automation rules
DELETE FROM public.automation_rules 
WHERE farm_id NOT IN (SELECT id FROM public.farms);

-- Clean up user profiles with invalid data
UPDATE public.user_profiles 
SET role = 'operator' 
WHERE role NOT IN ('admin', 'farm_manager', 'operator', 'ha_power_user');

-- =====================================================
-- PART 5: DATA INTEGRITY FUNCTIONS
-- =====================================================

-- Function to validate and fix data integrity issues
CREATE OR REPLACE FUNCTION public.validate_data_integrity()
RETURNS TABLE (
  table_name text,
  issue_type text,
  issue_count integer,
  fixed_count integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  orphaned_count integer;
  fixed_count integer;
BEGIN
  -- Check for orphaned device assignments
  SELECT COUNT(*) INTO orphaned_count
  FROM public.device_assignments da
  WHERE (da.farm_id IS NOT NULL AND da.farm_id NOT IN (SELECT id FROM public.farms))
     OR (da.row_id IS NOT NULL AND da.row_id NOT IN (SELECT id FROM public.rows))
     OR (da.rack_id IS NOT NULL AND da.rack_id NOT IN (SELECT id FROM public.racks))
     OR (da.shelf_id IS NOT NULL AND da.shelf_id NOT IN (SELECT id FROM public.shelves));
  
  RETURN QUERY SELECT 
    'device_assignments'::text,
    'orphaned_references'::text,
    orphaned_count,
    0;

  -- Check for farms without managers
  SELECT COUNT(*) INTO orphaned_count
  FROM public.farms
  WHERE user_id IS NULL;
  
  RETURN QUERY SELECT 
    'farms'::text,
    'missing_manager'::text,
    orphaned_count,
    0;

  -- Check for invalid user roles
  SELECT COUNT(*) INTO orphaned_count
  FROM public.user_profiles
  WHERE role NOT IN ('admin', 'farm_manager', 'operator', 'ha_power_user');
  
  RETURN QUERY SELECT 
    'user_profiles'::text,
    'invalid_role'::text,
    orphaned_count,
    0;
END;
$$;

-- Function to clean up old sensor data
CREATE OR REPLACE FUNCTION public.cleanup_old_sensor_data(days_to_keep integer DEFAULT 30)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count integer;
BEGIN
  -- Delete sensor readings older than specified days
  DELETE FROM public.sensor_readings 
  WHERE recorded_at < NOW() - (days_to_keep || ' days')::interval;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Clean up resolved sensor alerts older than 7 days
  DELETE FROM public.sensor_alerts 
  WHERE resolved = TRUE 
  AND resolved_at < NOW() - INTERVAL '7 days';
  
  RETURN deleted_count;
END;
$$;

-- =====================================================
-- GRANTS AND PERMISSIONS
-- =====================================================

GRANT EXECUTE ON FUNCTION public.validate_data_integrity() TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_old_sensor_data(integer) TO authenticated;

-- Add helpful comments
COMMENT ON FUNCTION public.is_admin() IS 'Security definer function to check admin status without causing RLS recursion';
COMMENT ON FUNCTION public.validate_data_integrity() IS 'Validates and reports data integrity issues across the database';
COMMENT ON FUNCTION public.cleanup_old_sensor_data(integer) IS 'Cleans up old sensor data and resolved alerts';

-- =====================================================
-- CONSOLIDATION TRACKING
-- =====================================================

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
            'Data Fixes & Cleanup Consolidation',
            ARRAY[
                '20250131120000_fix_rls_recursion.sql',
                '20250131150000_fix_farms_rls_security.sql',
                '20250202000000_fix_unique_default_constraint.sql',
                '20250523214507_remote_schema.sql'
            ],
            '20250203000012_consolidated_data_fixes_cleanup.sql',
            'completed',
            NOW()
        ) ON CONFLICT (consolidation_name) DO UPDATE SET
            status = 'completed',
            completed_at = NOW();
    END IF;
END $$; 