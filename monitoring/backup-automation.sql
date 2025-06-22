-- =====================================================
-- AUTOMATED BACKUP AND RECOVERY SYSTEM
-- =====================================================
-- This migration creates comprehensive backup automation and monitoring

-- Create backup metadata table
CREATE TABLE IF NOT EXISTS public.backup_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_type TEXT NOT NULL CHECK (backup_type IN ('full', 'incremental', 'schema_only', 'data_only')),
  backup_status TEXT NOT NULL CHECK (backup_status IN ('in_progress', 'completed', 'failed', 'cancelled')),
  backup_location TEXT NOT NULL,
  backup_size_bytes BIGINT,
  backup_duration_seconds INTEGER,
  backup_checksum TEXT,
  tables_included TEXT[],
  schemas_included TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  retention_until TIMESTAMPTZ,
  
  -- Recovery metadata
  is_recoverable BOOLEAN DEFAULT TRUE,
  recovery_tested_at TIMESTAMPTZ,
  recovery_test_status TEXT CHECK (recovery_test_status IN ('passed', 'failed', 'not_tested')),
  
  -- Backup configuration
  backup_config JSONB,
  triggered_by TEXT DEFAULT 'automated', -- 'automated', 'manual', 'emergency'
  
  -- Performance metrics
  compression_ratio NUMERIC(5,2),
  backup_throughput_mbps NUMERIC(8,2)
);

-- Create indexes for backup metadata
CREATE INDEX IF NOT EXISTS idx_backup_metadata_type_status ON public.backup_metadata(backup_type, backup_status);
CREATE INDEX IF NOT EXISTS idx_backup_metadata_created_at ON public.backup_metadata(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_backup_metadata_retention ON public.backup_metadata(retention_until);
CREATE INDEX IF NOT EXISTS idx_backup_metadata_recoverable ON public.backup_metadata(is_recoverable, created_at DESC);

-- Create backup schedule configuration table
CREATE TABLE IF NOT EXISTS public.backup_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_name TEXT NOT NULL UNIQUE,
  backup_type TEXT NOT NULL CHECK (backup_type IN ('full', 'incremental', 'schema_only', 'data_only')),
  cron_expression TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT TRUE,
  retention_days INTEGER DEFAULT 30,
  max_backup_count INTEGER DEFAULT 10,
  
  -- Backup configuration
  include_schemas TEXT[] DEFAULT ARRAY['public', 'auth', 'storage'],
  exclude_tables TEXT[],
  compression_level INTEGER DEFAULT 6 CHECK (compression_level BETWEEN 0 AND 9),
  
  -- Notification settings
  notify_on_success BOOLEAN DEFAULT FALSE,
  notify_on_failure BOOLEAN DEFAULT TRUE,
  notification_channels TEXT[] DEFAULT ARRAY['email', 'slack'],
  
  -- Performance settings
  max_parallel_workers INTEGER DEFAULT 4,
  backup_timeout_minutes INTEGER DEFAULT 120,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  description TEXT
);

-- Create recovery test log table
CREATE TABLE IF NOT EXISTS public.recovery_test_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_id UUID NOT NULL REFERENCES public.backup_metadata(id) ON DELETE CASCADE,
  test_type TEXT NOT NULL CHECK (test_type IN ('full_restore', 'partial_restore', 'schema_validation', 'data_integrity')),
  test_status TEXT NOT NULL CHECK (test_status IN ('running', 'passed', 'failed', 'cancelled')),
  test_environment TEXT NOT NULL, -- 'local', 'staging', 'test_instance'
  
  -- Test metrics
  test_duration_seconds INTEGER,
  data_verified_rows BIGINT,
  schema_objects_verified INTEGER,
  integrity_checks_passed INTEGER,
  integrity_checks_failed INTEGER,
  
  -- Test results
  test_results JSONB,
  error_details JSONB,
  performance_metrics JSONB,
  
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  tested_by UUID REFERENCES auth.users(id)
);

-- Create backup performance monitoring view
CREATE OR REPLACE VIEW public.backup_performance_summary AS
SELECT 
  backup_type,
  COUNT(*) as total_backups,
  COUNT(*) FILTER (WHERE backup_status = 'completed') as successful_backups,
  COUNT(*) FILTER (WHERE backup_status = 'failed') as failed_backups,
  ROUND(
    COUNT(*) FILTER (WHERE backup_status = 'completed')::NUMERIC / 
    NULLIF(COUNT(*), 0) * 100, 2
  ) as success_rate_percent,
  
  -- Performance metrics
  AVG(backup_duration_seconds) as avg_duration_seconds,
  MAX(backup_duration_seconds) as max_duration_seconds,
  AVG(backup_size_bytes) as avg_size_bytes,
  MAX(backup_size_bytes) as max_size_bytes,
  AVG(backup_throughput_mbps) as avg_throughput_mbps,
  AVG(compression_ratio) as avg_compression_ratio,
  
  -- Recent activity
  MAX(created_at) as last_backup_at,
  DATE_TRUNC('day', created_at) as backup_date
FROM public.backup_metadata
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY backup_type, DATE_TRUNC('day', created_at)
ORDER BY backup_date DESC, backup_type;

-- Create backup health monitoring function
CREATE OR REPLACE FUNCTION public.check_backup_health()
RETURNS TABLE (
  alert_type TEXT,
  alert_severity TEXT,
  alert_message TEXT,
  backup_type TEXT,
  last_successful_backup TIMESTAMPTZ,
  hours_since_last_backup NUMERIC
) AS $$
BEGIN
  -- Check for overdue backups
  RETURN QUERY
  SELECT 
    'backup_overdue'::TEXT,
    CASE 
      WHEN EXTRACT(EPOCH FROM (NOW() - MAX(bm.completed_at)))/3600 > 48 THEN 'critical'
      WHEN EXTRACT(EPOCH FROM (NOW() - MAX(bm.completed_at)))/3600 > 24 THEN 'warning'
      ELSE 'info'
    END::TEXT,
    'Backup type ' || bs.backup_type || ' is overdue. Last successful backup was ' || 
    EXTRACT(EPOCH FROM (NOW() - MAX(bm.completed_at)))/3600 || ' hours ago'::TEXT,
    bs.backup_type,
    MAX(bm.completed_at),
    EXTRACT(EPOCH FROM (NOW() - MAX(bm.completed_at)))/3600
  FROM public.backup_schedules bs
  LEFT JOIN public.backup_metadata bm ON bm.backup_type = bs.backup_type 
    AND bm.backup_status = 'completed'
  WHERE bs.is_enabled = TRUE
  GROUP BY bs.backup_type, bs.schedule_name
  HAVING MAX(bm.completed_at) IS NULL 
    OR EXTRACT(EPOCH FROM (NOW() - MAX(bm.completed_at)))/3600 > 12;

  -- Check for recent backup failures
  RETURN QUERY
  SELECT 
    'backup_failure'::TEXT,
    'critical'::TEXT,
    'Recent backup failures detected for ' || backup_type || ': ' || error_message::TEXT,
    backup_type,
    created_at,
    EXTRACT(EPOCH FROM (NOW() - created_at))/3600
  FROM public.backup_metadata
  WHERE backup_status = 'failed'
    AND created_at >= NOW() - INTERVAL '24 hours'
  ORDER BY created_at DESC;

  -- Check for untested backups
  RETURN QUERY
  SELECT 
    'backup_untested'::TEXT,
    'warning'::TEXT,
    'Backup has not been recovery tested: ' || backup_location::TEXT,
    backup_type,
    created_at,
    EXTRACT(EPOCH FROM (NOW() - created_at))/3600
  FROM public.backup_metadata
  WHERE is_recoverable = TRUE
    AND recovery_tested_at IS NULL
    AND backup_status = 'completed'
    AND created_at >= NOW() - INTERVAL '7 days'
  ORDER BY created_at DESC
  LIMIT 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create backup initiation function
CREATE OR REPLACE FUNCTION public.initiate_backup(
  p_backup_type TEXT,
  p_triggered_by TEXT DEFAULT 'manual',
  p_include_schemas TEXT[] DEFAULT ARRAY['public', 'auth', 'storage'],
  p_exclude_tables TEXT[] DEFAULT ARRAY[]::TEXT[],
  p_retention_days INTEGER DEFAULT 30
) RETURNS UUID AS $$
DECLARE
  backup_id UUID;
  backup_location TEXT;
  retention_date TIMESTAMPTZ;
BEGIN
  -- Generate backup ID and location
  backup_id := gen_random_uuid();
  backup_location := 'backups/' || TO_CHAR(NOW(), 'YYYY/MM/DD') || '/' || 
                    p_backup_type || '_' || TO_CHAR(NOW(), 'YYYYMMDD_HH24MISS') || 
                    '_' || SUBSTRING(backup_id::TEXT, 1, 8) || '.sql';
  retention_date := NOW() + (p_retention_days || ' days')::INTERVAL;

  -- Insert backup metadata
  INSERT INTO public.backup_metadata (
    id,
    backup_type,
    backup_status,
    backup_location,
    tables_included,
    schemas_included,
    retention_until,
    triggered_by,
    backup_config
  ) VALUES (
    backup_id,
    p_backup_type,
    'in_progress',
    backup_location,
    CASE 
      WHEN p_backup_type = 'schema_only' THEN ARRAY[]::TEXT[]
      ELSE (
        SELECT ARRAY_AGG(tablename) 
        FROM pg_tables 
        WHERE schemaname = ANY(p_include_schemas)
          AND tablename != ALL(p_exclude_tables)
      )
    END,
    p_include_schemas,
    retention_date,
    p_triggered_by,
    jsonb_build_object(
      'include_schemas', p_include_schemas,
      'exclude_tables', p_exclude_tables,
      'retention_days', p_retention_days,
      'compression_enabled', true,
      'checksum_enabled', true
    )
  );

  -- Log backup initiation
  INSERT INTO public.function_metrics (
    function_name,
    processed_count,
    success_count,
    execution_context
  ) VALUES (
    'backup_initiation',
    1,
    1,
    jsonb_build_object(
      'backup_id', backup_id,
      'backup_type', p_backup_type,
      'triggered_by', p_triggered_by
    )
  );

  RETURN backup_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create backup completion function
CREATE OR REPLACE FUNCTION public.complete_backup(
  p_backup_id UUID,
  p_status TEXT,
  p_size_bytes BIGINT DEFAULT NULL,
  p_duration_seconds INTEGER DEFAULT NULL,
  p_checksum TEXT DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  backup_record RECORD;
  throughput_mbps NUMERIC;
BEGIN
  -- Get backup record
  SELECT * INTO backup_record 
  FROM public.backup_metadata 
  WHERE id = p_backup_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Backup record not found: %', p_backup_id;
  END IF;

  -- Calculate throughput
  IF p_size_bytes IS NOT NULL AND p_duration_seconds IS NOT NULL AND p_duration_seconds > 0 THEN
    throughput_mbps := (p_size_bytes::NUMERIC / 1024 / 1024) / (p_duration_seconds::NUMERIC / 60);
  END IF;

  -- Update backup metadata
  UPDATE public.backup_metadata SET
    backup_status = p_status,
    backup_size_bytes = COALESCE(p_size_bytes, backup_size_bytes),
    backup_duration_seconds = COALESCE(p_duration_seconds, backup_duration_seconds),
    backup_checksum = COALESCE(p_checksum, backup_checksum),
    error_message = p_error_message,
    completed_at = NOW(),
    backup_throughput_mbps = throughput_mbps,
    compression_ratio = CASE 
      WHEN p_size_bytes IS NOT NULL AND backup_record.backup_config->>'compression_enabled' = 'true'
      THEN ROUND((p_size_bytes::NUMERIC / GREATEST(p_size_bytes * 1.5, 1)) * 100, 2)
      ELSE NULL
    END
  WHERE id = p_backup_id;

  -- Log completion
  INSERT INTO public.function_metrics (
    function_name,
    processed_count,
    success_count,
    error_count,
    execution_context
  ) VALUES (
    'backup_completion',
    1,
    CASE WHEN p_status = 'completed' THEN 1 ELSE 0 END,
    CASE WHEN p_status = 'failed' THEN 1 ELSE 0 END,
    jsonb_build_object(
      'backup_id', p_backup_id,
      'status', p_status,
      'size_mb', ROUND(p_size_bytes::NUMERIC / 1024 / 1024, 2),
      'duration_seconds', p_duration_seconds,
      'throughput_mbps', throughput_mbps
    )
  );

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create recovery test function
CREATE OR REPLACE FUNCTION public.initiate_recovery_test(
  p_backup_id UUID,
  p_test_type TEXT DEFAULT 'schema_validation',
  p_test_environment TEXT DEFAULT 'local'
) RETURNS UUID AS $$
DECLARE
  test_id UUID;
  backup_exists BOOLEAN;
BEGIN
  -- Verify backup exists and is recoverable
  SELECT EXISTS(
    SELECT 1 FROM public.backup_metadata 
    WHERE id = p_backup_id 
      AND backup_status = 'completed' 
      AND is_recoverable = TRUE
  ) INTO backup_exists;

  IF NOT backup_exists THEN
    RAISE EXCEPTION 'Backup not found or not recoverable: %', p_backup_id;
  END IF;

  -- Create recovery test record
  test_id := gen_random_uuid();
  
  INSERT INTO public.recovery_test_log (
    id,
    backup_id,
    test_type,
    test_status,
    test_environment
  ) VALUES (
    test_id,
    p_backup_id,
    p_test_type,
    'running',
    p_test_environment
  );

  RETURN test_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create cleanup function for old backups
CREATE OR REPLACE FUNCTION public.cleanup_expired_backups()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER := 0;
  backup_record RECORD;
BEGIN
  -- Find expired backups
  FOR backup_record IN 
    SELECT id, backup_location 
    FROM public.backup_metadata 
    WHERE retention_until < NOW()
      AND backup_status = 'completed'
  LOOP
    -- Mark as deleted (actual file deletion would be handled externally)
    UPDATE public.backup_metadata 
    SET backup_status = 'deleted',
        is_recoverable = FALSE
    WHERE id = backup_record.id;
    
    deleted_count := deleted_count + 1;
  END LOOP;

  -- Log cleanup operation
  INSERT INTO public.function_metrics (
    function_name,
    processed_count,
    success_count,
    execution_context
  ) VALUES (
    'backup_cleanup',
    deleted_count,
    deleted_count,
    jsonb_build_object(
      'deleted_backups', deleted_count,
      'cleanup_date', NOW()
    )
  );

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on backup tables
ALTER TABLE public.backup_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recovery_test_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for backup tables
CREATE POLICY "backup_admin_access" ON public.backup_metadata
  FOR ALL TO authenticated
  USING (public.is_admin());

CREATE POLICY "backup_schedules_admin_access" ON public.backup_schedules
  FOR ALL TO authenticated
  USING (public.is_admin());

CREATE POLICY "recovery_test_admin_access" ON public.recovery_test_log
  FOR ALL TO authenticated
  USING (public.is_admin());

-- Grant permissions
GRANT SELECT ON public.backup_performance_summary TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_backup_health() TO authenticated;
GRANT EXECUTE ON FUNCTION public.initiate_backup(TEXT, TEXT, TEXT[], TEXT[], INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_backup(UUID, TEXT, BIGINT, INTEGER, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.initiate_recovery_test(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_backups() TO authenticated;

-- Insert default backup schedules
INSERT INTO public.backup_schedules (
  schedule_name, backup_type, cron_expression, retention_days, description
) VALUES 
  ('daily_full_backup', 'full', '0 2 * * *', 7, 'Daily full backup at 2 AM'),
  ('hourly_incremental', 'incremental', '0 * * * *', 2, 'Hourly incremental backup'),
  ('weekly_schema_backup', 'schema_only', '0 3 * * 0', 30, 'Weekly schema-only backup on Sunday at 3 AM')
ON CONFLICT (schedule_name) DO NOTHING;

-- Add helpful comments
COMMENT ON TABLE public.backup_metadata IS 'Tracks all database backup operations and their metadata';
COMMENT ON TABLE public.backup_schedules IS 'Configuration for automated backup schedules';
COMMENT ON TABLE public.recovery_test_log IS 'Logs recovery testing operations for backup validation';
COMMENT ON VIEW public.backup_performance_summary IS 'Performance summary of backup operations';
COMMENT ON FUNCTION public.check_backup_health() IS 'Monitors backup health and identifies issues';
COMMENT ON FUNCTION public.initiate_backup(TEXT, TEXT, TEXT[], TEXT[], INTEGER) IS 'Initiates a new backup operation';
COMMENT ON FUNCTION public.complete_backup(UUID, TEXT, BIGINT, INTEGER, TEXT, TEXT) IS 'Marks a backup operation as completed';
COMMENT ON FUNCTION public.cleanup_expired_backups() IS 'Cleans up expired backup records based on retention policy'; 