-- =====================================================
-- FIX FARMS RLS SECURITY VULNERABILITY
-- =====================================================
-- This migration fixes the critical security issue where all users
-- can see all farms due to the "farms_public_read" policy using USING (true)

-- Drop the problematic public read policy
DROP POLICY IF EXISTS "farms_public_read" ON public.farms;

-- Create a proper policy that only allows users to see farms they manage
-- or farms they have explicit permissions for (when farm permissions are implemented)
CREATE POLICY "farms_select_by_manager" ON public.farms
  FOR SELECT 
  USING (
    -- Users can only see farms they manage
    manager_id = auth.uid() OR
    -- Admins can see all farms
    public.is_admin()
  );

-- Update the farms_manager_access policy to be more specific
DROP POLICY IF EXISTS "farms_manager_access" ON public.farms;

-- Create separate policies for different operations
CREATE POLICY "farms_insert_by_authenticated" ON public.farms
  FOR INSERT 
  WITH CHECK (
    -- Only authenticated users can create farms
    auth.uid() IS NOT NULL AND
    -- They become the manager of farms they create
    manager_id = auth.uid()
  );

CREATE POLICY "farms_update_by_manager" ON public.farms
  FOR UPDATE 
  USING (
    manager_id = auth.uid() OR public.is_admin()
  )
  WITH CHECK (
    -- Only allow updates by manager or admin
    manager_id = auth.uid() OR public.is_admin()
  );

CREATE POLICY "farms_delete_by_manager" ON public.farms
  FOR DELETE 
  USING (
    manager_id = auth.uid() OR public.is_admin()
  );

-- Add a comment explaining the security fix
COMMENT ON POLICY "farms_select_by_manager" ON public.farms IS 
  'Security fix: Users can only view farms they manage or if they are admin. Replaces the insecure farms_public_read policy that allowed all users to see all farms.'; 