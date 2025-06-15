-- Check if user_home_assistant_configs table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public'
   AND table_name = 'user_home_assistant_configs'
) as table_exists;

-- If it exists, show the table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'user_home_assistant_configs'
ORDER BY ordinal_position;

-- Check RLS policies for this table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'user_home_assistant_configs'; 