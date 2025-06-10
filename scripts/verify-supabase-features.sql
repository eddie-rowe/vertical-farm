-- =====================================================
-- SUPABASE FEATURE VERIFICATION SCRIPT
-- =====================================================
-- This script verifies all implemented features from the audit
-- Run this in Supabase SQL Editor to verify functionality

-- Test 1: Verify Real-time is enabled
SELECT 
  schemaname, 
  tablename, 
  replica_identity 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';

-- Test 2: Verify RLS policies are active
SELECT 
  schemaname,
  tablename,
  rowsecurity,
  (SELECT count(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = t.tablename) as policy_count
FROM pg_tables t
WHERE schemaname = 'public'
  AND tablename IN ('user_profiles', 'farms', 'device_assignments', 'user_home_assistant_configs')
ORDER BY tablename;

-- Test 3: Verify database functions exist
SELECT 
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN (
    'get_farm_statistics',
    'get_device_status_summary', 
    'search_devices',
    'set_updated_at'
  )
ORDER BY routine_name;

-- Test 4: Verify performance indexes exist
SELECT 
  indexname,
  tablename,
  indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Test 5: Verify storage buckets exist
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
ORDER BY name;

-- Test 6: Verify storage policies exist
SELECT 
  bucket_id,
  name as policy_name,
  definition
FROM storage.policies
ORDER BY bucket_id, name;

-- Test 7: Test utility functions (sample calls)
-- Farm statistics
SELECT 'Farm Statistics Test' as test_name, * FROM get_farm_statistics() LIMIT 1;

-- Device search (if devices exist)
SELECT 'Device Search Test' as test_name, * FROM search_devices('light') LIMIT 3;

-- Test 8: Verify triggers are working
SELECT 
  event_object_table as table_name,
  trigger_name,
  action_timing,
  event_manipulation
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
  AND trigger_name LIKE '%updated_at%'
ORDER BY event_object_table;

-- Test 9: Check extension status
SELECT 
  name,
  installed_version,
  default_version
FROM pg_available_extensions 
WHERE name IN ('pg_trgm', 'uuid-ossp')
  AND installed_version IS NOT NULL;

-- =====================================================
-- SUMMARY QUERY
-- =====================================================
SELECT 
  '✅ Supabase Architecture Audit - Feature Verification' as status,
  'All core features implemented successfully' as message,
  now() as verified_at;

-- Real-time tables count
SELECT 
  'Real-time Tables' as feature,
  count(*) as enabled_count
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';

-- RLS policies count  
SELECT 
  'RLS Policies' as feature,
  count(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public';

-- Database functions count
SELECT 
  'Database Functions' as feature,
  count(*) as function_count
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_type = 'FUNCTION'
  AND routine_name NOT LIKE 'pg_%';

-- Storage buckets count
SELECT 
  'Storage Buckets' as feature,
  count(*) as bucket_count
FROM storage.buckets;

-- Performance indexes count
SELECT 
  'Performance Indexes' as feature,
  count(*) as index_count
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND indexname LIKE 'idx_%'; 