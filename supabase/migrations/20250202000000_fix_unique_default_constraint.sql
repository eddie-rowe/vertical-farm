-- Fix the unique constraint to only apply to default configurations
-- This allows users to have multiple non-default configurations

-- Drop the problematic constraint
ALTER TABLE public.user_home_assistant_configs 
  DROP CONSTRAINT unique_default_per_user;

-- Create a partial unique index that only applies when is_default = true
-- This allows multiple is_default = false but only one is_default = true per user
CREATE UNIQUE INDEX unique_default_config_per_user 
  ON public.user_home_assistant_configs (user_id) 
  WHERE is_default = true;

-- Add a comment explaining the constraint
COMMENT ON INDEX unique_default_config_per_user IS 'Ensures only one default Home Assistant configuration per user'; 