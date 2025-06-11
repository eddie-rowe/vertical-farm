-- =====================================================
-- FIX RLS INFINITE RECURSION
-- =====================================================
-- This migration fixes the infinite recursion in RLS policies
-- by using a security definer function to check admin status

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

-- Drop the problematic policies
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

-- Fix other policies that have the same issue
-- Update rows policy
DROP POLICY IF EXISTS "rows_farm_based_access" ON public.rows;
CREATE POLICY "rows_farm_based_access" ON public.rows
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.farms 
      WHERE id = rows.farm_id 
      AND (manager_id = auth.uid() OR public.is_admin())
    )
  );

-- Update racks policy
DROP POLICY IF EXISTS "racks_farm_based_access" ON public.racks;
CREATE POLICY "racks_farm_based_access" ON public.racks
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.rows r
      JOIN public.farms f ON r.farm_id = f.id
      WHERE r.id = racks.row_id 
      AND (f.manager_id = auth.uid() OR public.is_admin())
    )
  );

-- Update shelves policy
DROP POLICY IF EXISTS "shelves_farm_based_access" ON public.shelves;
CREATE POLICY "shelves_farm_based_access" ON public.shelves
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.racks ra
      JOIN public.rows r ON ra.row_id = r.id
      JOIN public.farms f ON r.farm_id = f.id
      WHERE ra.id = shelves.rack_id 
      AND (f.manager_id = auth.uid() OR public.is_admin())
    )
  );

-- Update device assignments policy
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
        AND manager_id = auth.uid()
      )
    ) OR
    (
      row_id IS NOT NULL AND
      EXISTS (
        SELECT 1 FROM public.rows r
        JOIN public.farms f ON r.farm_id = f.id
        WHERE r.id = device_assignments.row_id 
        AND f.manager_id = auth.uid()
      )
    ) OR
    (
      rack_id IS NOT NULL AND
      EXISTS (
        SELECT 1 FROM public.racks ra
        JOIN public.rows r ON ra.row_id = r.id
        JOIN public.farms f ON r.farm_id = f.id
        WHERE ra.id = device_assignments.rack_id 
        AND f.manager_id = auth.uid()
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
        AND f.manager_id = auth.uid()
      )
    ) OR
    -- Admin access using security definer function
    public.is_admin()
  );

-- Update storage policies that use the same pattern
CREATE OR REPLACE FUNCTION public.update_storage_policies() 
RETURNS void
SECURITY DEFINER
SET search_path = public, storage
AS $$
BEGIN
  -- Update device manuals policy
  DROP POLICY IF EXISTS "device_manuals_admin_write" ON storage.objects;
  CREATE POLICY "device_manuals_admin_write" ON storage.objects
    FOR ALL USING (
      bucket_id = 'device-manuals' AND public.is_admin()
    )
    WITH CHECK (
      bucket_id = 'device-manuals' AND public.is_admin()
    );

  -- Update system backups policy
  DROP POLICY IF EXISTS "system_backups_admin_only" ON storage.objects;
  CREATE POLICY "system_backups_admin_only" ON storage.objects
    FOR ALL USING (
      bucket_id = 'system-backups' AND public.is_admin()
    )
    WITH CHECK (
      bucket_id = 'system-backups' AND public.is_admin()
    );
END;
$$ LANGUAGE plpgsql;

-- Execute storage policy updates
SELECT public.update_storage_policies();

-- Drop the temporary function
DROP FUNCTION public.update_storage_policies();

-- Add comment for documentation
COMMENT ON FUNCTION public.is_admin() IS 'Security definer function to check admin status without causing RLS recursion'; 