-- Standardize user reference columns to use user_id consistently
-- This migration renames manager_id to user_id in the farms table for consistency

-- Rename manager_id to user_id in farms table
ALTER TABLE public.farms RENAME COLUMN manager_id TO user_id;

-- Update any existing RLS policies on farms table to use user_id
DROP POLICY IF EXISTS "Users can view their own farms" ON public.farms;
DROP POLICY IF EXISTS "Users can manage their own farms" ON public.farms;

CREATE POLICY "Users can view their own farms" ON public.farms
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own farms" ON public.farms
  FOR ALL USING (user_id = auth.uid());

-- Update any indexes that reference the old column name
DROP INDEX IF EXISTS idx_farms_manager_id;
CREATE INDEX IF NOT EXISTS idx_farms_user_id ON public.farms(user_id);

-- Add comment for clarity
COMMENT ON COLUMN public.farms.user_id IS 'References the user who owns/manages this farm'; 