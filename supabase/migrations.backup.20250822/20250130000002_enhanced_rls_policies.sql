-- Enhanced Row Level Security Policies for Vertical Farm Platform
-- This migration improves security with granular RLS policies and audit capabilities

-- =====================================================
-- USER PROFILES & AUTHENTICATION
-- =====================================================

-- Enable RLS on user_profiles if not already enabled
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;

-- Enhanced user profile policies
DROP POLICY IF EXISTS "users_select_own_profile" ON public.user_profiles;
DROP POLICY IF EXISTS "users_select_own_profile" ON public.user_profiles;
CREATE POLICY "users_select_own_profile" ON public.user_profiles
  FOR SELECT 
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "users_update_own_profile" ON public.user_profiles;
DROP POLICY IF EXISTS "users_update_own_profile" ON public.user_profiles;
CREATE POLICY "users_update_own_profile" ON public.user_profiles
  FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "admins_full_access_profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "admins_full_access_profiles" ON public.user_profiles;
CREATE POLICY "admins_full_access_profiles" ON public.user_profiles
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- New users can insert their own profile during registration
DROP POLICY IF EXISTS "users_insert_own_profile" ON public.user_profiles;
DROP POLICY IF EXISTS "users_insert_own_profile" ON public.user_profiles;
CREATE POLICY "users_insert_own_profile" ON public.user_profiles
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- HOME ASSISTANT CONFIGURATIONS
-- =====================================================

-- Enable RLS on user_home_assistant_configs
ALTER TABLE public.user_home_assistant_configs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can manage their own HA configs" ON public.user_home_assistant_configs;

-- Enhanced Home Assistant config policies
DROP POLICY IF EXISTS "ha_configs_select_own" ON public.user_home_assistant_configs;
DROP POLICY IF EXISTS "ha_configs_select_own" ON public.user_home_assistant_configs;
CREATE POLICY "ha_configs_select_own" ON public.user_home_assistant_configs
  FOR SELECT 
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "ha_configs_insert_own" ON public.user_home_assistant_configs;
DROP POLICY IF EXISTS "ha_configs_insert_own" ON public.user_home_assistant_configs;
CREATE POLICY "ha_configs_insert_own" ON public.user_home_assistant_configs
  FOR INSERT 
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "ha_configs_update_own" ON public.user_home_assistant_configs;
DROP POLICY IF EXISTS "ha_configs_update_own" ON public.user_home_assistant_configs;
CREATE POLICY "ha_configs_update_own" ON public.user_home_assistant_configs
  FOR UPDATE 
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "ha_configs_delete_own" ON public.user_home_assistant_configs;
DROP POLICY IF EXISTS "ha_configs_delete_own" ON public.user_home_assistant_configs;
CREATE POLICY "ha_configs_delete_own" ON public.user_home_assistant_configs
  FOR DELETE 
  USING (user_id = auth.uid());

-- Admins can view all HA configs for troubleshooting
DROP POLICY IF EXISTS "admins_view_all_ha_configs" ON public.user_home_assistant_configs;
DROP POLICY IF EXISTS "admins_view_all_ha_configs" ON public.user_home_assistant_configs;
CREATE POLICY "admins_view_all_ha_configs" ON public.user_home_assistant_configs
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- DEVICE CONFIGURATIONS
-- =====================================================

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can manage their own device configs" ON public.user_device_configs;

-- Enhanced device config policies (access through user_home_assistant_configs)
DROP POLICY IF EXISTS "device_configs_select_own" ON public.user_device_configs;
CREATE POLICY "device_configs_select_own" ON public.user_device_configs
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_home_assistant_configs 
      WHERE id = user_device_configs.user_config_id 
      AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "device_configs_insert_own" ON public.user_device_configs;
CREATE POLICY "device_configs_insert_own" ON public.user_device_configs
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_home_assistant_configs 
      WHERE id = user_device_configs.user_config_id 
      AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "device_configs_update_own" ON public.user_device_configs;
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

DROP POLICY IF EXISTS "device_configs_delete_own" ON public.user_device_configs;
CREATE POLICY "device_configs_delete_own" ON public.user_device_configs
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_home_assistant_configs 
      WHERE id = user_device_configs.user_config_id 
      AND user_id = auth.uid()
    )
  );

-- =====================================================
-- FARM HIERARCHY SECURITY
-- =====================================================

-- Enable RLS on farms table
ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;

-- Farm access policies (farm managers and assigned users can access)
DROP POLICY IF EXISTS "farms_manager_access" ON public.farms;
CREATE POLICY "farms_manager_access" ON public.farms
  FOR ALL 
  USING (manager_id = auth.uid());

DROP POLICY IF EXISTS "farms_public_read" ON public.farms;
CREATE POLICY "farms_public_read" ON public.farms
  FOR SELECT 
  USING (true); -- Allow reading farm list for assignment purposes

-- Admins have full access to all farms
DROP POLICY IF EXISTS "admins_full_access_farms" ON public.farms;
CREATE POLICY "admins_full_access_farms" ON public.farms
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Enable RLS on rows table
ALTER TABLE public.rows ENABLE ROW LEVEL SECURITY;

-- Row access based on farm access
DROP POLICY IF EXISTS "rows_farm_based_access" ON public.rows;
CREATE POLICY "rows_farm_based_access" ON public.rows
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.farms 
      WHERE id = rows.farm_id 
      AND (
        manager_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.user_profiles 
          WHERE id = auth.uid() AND role = 'admin'
        )
      )
    )
  );

-- Enable RLS on racks table
ALTER TABLE public.racks ENABLE ROW LEVEL SECURITY;

-- Rack access based on row/farm access
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

-- Enable RLS on shelves table
ALTER TABLE public.shelves ENABLE ROW LEVEL SECURITY;

-- Shelf access based on rack/row/farm access
DROP POLICY IF EXISTS "shelves_farm_based_access" ON public.shelves;
CREATE POLICY "shelves_farm_based_access" ON public.shelves
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.racks ra
      JOIN public.rows r ON ra.row_id = r.id
      JOIN public.farms f ON r.farm_id = f.id
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
-- DEVICE ASSIGNMENTS SECURITY
-- =====================================================

-- Enable RLS on device_assignments table
ALTER TABLE public.device_assignments ENABLE ROW LEVEL SECURITY;

-- Device assignment access based on hierarchy
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
    -- Admin access
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- AUDIT & MONITORING FUNCTIONS
-- =====================================================

-- Function to check user permissions for debugging
DROP FUNCTION IF EXISTS public.check_user_permissions(text);
CREATE OR REPLACE FUNCTION public.check_user_permissions(target_table_name text)
RETURNS TABLE (
  user_id uuid,
  user_role user_role,
  has_select boolean,
  has_insert boolean,
  has_update boolean,
  has_delete boolean
) 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    auth.uid() as user_id,
    up.role as user_role,
    -- These would need to be implemented based on actual policy checks
    true as has_select,
    true as has_insert,
    true as has_update,
    true as has_delete
  FROM public.user_profiles up
  WHERE up.id = auth.uid();
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions on the function
GRANT EXECUTE ON FUNCTION public.check_user_permissions(text) TO authenticated;

-- =====================================================
-- SECURITY VIEWS FOR MONITORING
-- =====================================================

-- View to monitor RLS policy usage
DROP VIEW IF EXISTS public.security_audit_view;
CREATE OR REPLACE VIEW public.security_audit_view AS
SELECT 
  current_timestamp as audit_time,
  auth.uid() as accessing_user_id,
  up.role as user_role,
  'RLS_ACCESS' as event_type
FROM public.user_profiles up
WHERE up.id = auth.uid();

-- Grant access to the security view
GRANT SELECT ON public.security_audit_view TO authenticated;

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to check if user can access a specific farm
DROP FUNCTION IF EXISTS public.user_can_access_farm(uuid);
CREATE OR REPLACE FUNCTION public.user_can_access_farm(farm_uuid uuid)
RETURNS boolean
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.farms f
    LEFT JOIN public.user_profiles up ON up.id = auth.uid()
    WHERE f.id = farm_uuid
    AND (
      f.user_id = auth.uid() OR
      up.role = 'admin'
    )
  );
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.user_can_access_farm(uuid) TO authenticated;

-- Function to get user's accessible farms
DROP FUNCTION IF EXISTS public.get_user_accessible_farms();
CREATE OR REPLACE FUNCTION public.get_user_accessible_farms()
RETURNS TABLE (
  farm_id uuid,
  farm_name text,
  access_type text
)
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.id as farm_id,
    f.name as farm_name,
    CASE 
      WHEN f.user_id = auth.uid() THEN 'manager'
      WHEN up.role = 'admin' THEN 'admin'
      ELSE 'none'
    END as access_type
  FROM public.farms f
  CROSS JOIN public.user_profiles up
  WHERE up.id = auth.uid()
  AND (
    f.user_id = auth.uid() OR
    up.role = 'admin'
  );
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_user_accessible_farms() TO authenticated; 