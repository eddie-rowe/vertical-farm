-- Quick query to check which tables exist in the database
-- Run this in Supabase SQL Editor to see current state

SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'user_home_assistant_configs',
    'user_device_configs', 
    'farms',
    'user_profiles'
  )
ORDER BY table_name;

-- Also check if specific Home Assistant table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'user_home_assistant_configs'
) as "user_home_assistant_configs_exists"; 