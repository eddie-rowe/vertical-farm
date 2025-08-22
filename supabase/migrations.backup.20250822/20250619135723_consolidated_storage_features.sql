-- =====================================================
-- CONSOLIDATED STORAGE & FEATURES MIGRATION
-- =====================================================
-- This migration consolidates 2 storage and feature-related migrations:
-- - 20250201000000_storage_implementation.sql (Storage buckets and policies)
-- - 20250203000002_fix_sensor_caching_conflicts.sql (Sensor alerts and caching)

-- =====================================================
-- PART 1: STORAGE IMPLEMENTATION
-- =====================================================

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('user-uploads', 'user-uploads', false),
  ('farm-documentation', 'farm-documentation', false), 
  ('harvest-photos', 'harvest-photos', false),
  ('device-manuals', 'device-manuals', true),
  ('system-backups', 'system-backups', false)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  public = EXCLUDED.public;

-- User uploads policies (profile images, personal documents)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE policyname = 'user_uploads_own_access' 
        AND tablename = 'objects' 
        AND schemaname = 'storage'
    ) THEN
        CREATE POLICY "user_uploads_own_access" ON storage.objects
          FOR ALL USING (
            bucket_id = 'user-uploads' 
            AND (storage.foldername(name))[1] = auth.uid()::text
          )
          WITH CHECK (
            bucket_id = 'user-uploads' 
            AND (storage.foldername(name))[1] = auth.uid()::text
          );
    END IF;
END $$;

-- Farm documentation policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE policyname = 'farm_documentation_access' 
        AND tablename = 'objects' 
        AND schemaname = 'storage'
    ) THEN
        CREATE POLICY "farm_documentation_access" ON storage.objects
          FOR ALL USING (
            bucket_id = 'farm-documentation' 
            AND (
              EXISTS (
                SELECT 1 FROM public.farms f
                WHERE f.id::text = (storage.foldername(name))[1]
                AND (
                  f.user_id = auth.uid() OR
                  EXISTS (
                    SELECT 1 FROM public.user_profiles up
                    WHERE up.id = auth.uid() 
                    AND up.role IN ('operator', 'admin')
                  )
                )
              )
            )
          );
    END IF;
END $$;

-- Harvest photos policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE policyname = 'harvest_photos_access' 
        AND tablename = 'objects' 
        AND schemaname = 'storage'
    ) THEN
        CREATE POLICY "harvest_photos_access" ON storage.objects
          FOR ALL USING (
            bucket_id = 'harvest-photos' 
            AND (
              EXISTS (
                SELECT 1 FROM public.farms f
                WHERE f.id::text = (storage.foldername(name))[1]
                AND (
                  f.user_id = auth.uid() OR
                  EXISTS (
                    SELECT 1 FROM public.user_profiles up
                    WHERE up.id = auth.uid() 
                    AND up.role IN ('operator', 'admin')
                  )
                )
              )
            )
          );
    END IF;
END $$;

-- Device manuals policies (public read, admin write)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE policyname = 'device_manuals_public_read' 
        AND tablename = 'objects' 
        AND schemaname = 'storage'
    ) THEN
        CREATE POLICY "device_manuals_public_read" ON storage.objects
          FOR SELECT USING (bucket_id = 'device-manuals');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE policyname = 'device_manuals_admin_write' 
        AND tablename = 'objects' 
        AND schemaname = 'storage'
    ) THEN
        CREATE POLICY "device_manuals_admin_write" ON storage.objects
          FOR ALL USING (
            bucket_id = 'device-manuals' 
            AND EXISTS (
              SELECT 1 FROM public.user_profiles 
              WHERE id = auth.uid() AND role = 'admin'
            )
          );
    END IF;
END $$;

-- System backups policies (admin only)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE policyname = 'system_backups_admin_only' 
        AND tablename = 'objects' 
        AND schemaname = 'storage'
    ) THEN
        CREATE POLICY "system_backups_admin_only" ON storage.objects
          FOR ALL USING (
            bucket_id = 'system-backups' 
            AND EXISTS (
              SELECT 1 FROM public.user_profiles 
              WHERE id = auth.uid() AND role = 'admin'
            )
          );
    END IF;
END $$;

-- Add storage-related columns to existing tables
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS profile_image_url text,
ADD COLUMN IF NOT EXISTS storage_quota_mb integer DEFAULT 100;

ALTER TABLE public.farms 
ADD COLUMN IF NOT EXISTS documentation_folder_path text,
ADD COLUMN IF NOT EXISTS farm_image_url text;

ALTER TABLE public.harvests 
ADD COLUMN IF NOT EXISTS photo_urls text[],
ADD COLUMN IF NOT EXISTS documentation_urls text[];

ALTER TABLE public.grow_recipes 
ADD COLUMN IF NOT EXISTS instruction_document_url text,
ADD COLUMN IF NOT EXISTS reference_image_url text;

ALTER TABLE public.device_assignments 
ADD COLUMN IF NOT EXISTS manual_url text,
ADD COLUMN IF NOT EXISTS installation_photos text[];

-- =====================================================
-- PART 2: SENSOR ALERTS & CACHING FIX
-- =====================================================

-- Remove sensor_readings from realtime publication (will be cached instead)
DO $$
BEGIN
  -- Check if sensor_readings is in the realtime publication before trying to remove it
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'sensor_readings'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.sensor_readings;
  END IF;
END $$;

-- Create sensor_alerts table for critical conditions that need realtime
CREATE TABLE IF NOT EXISTS public.sensor_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_assignment_id UUID NOT NULL REFERENCES public.device_assignments(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,
  sensor_type TEXT NOT NULL,
  current_value NUMERIC NOT NULL,
  threshold_value NUMERIC NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  message TEXT NOT NULL,
  acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
  acknowledged_by UUID REFERENCES auth.users(id),
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  resolved BOOLEAN NOT NULL DEFAULT FALSE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for sensor_alerts
CREATE INDEX IF NOT EXISTS idx_sensor_alerts_device_assignment_id ON public.sensor_alerts(device_assignment_id);
CREATE INDEX IF NOT EXISTS idx_sensor_alerts_alert_type ON public.sensor_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_sensor_alerts_severity ON public.sensor_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_sensor_alerts_acknowledged ON public.sensor_alerts(acknowledged);
CREATE INDEX IF NOT EXISTS idx_sensor_alerts_resolved ON public.sensor_alerts(resolved);
CREATE INDEX IF NOT EXISTS idx_sensor_alerts_created_at ON public.sensor_alerts(created_at DESC);

-- Enable realtime for sensor_alerts
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'sensor_alerts'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.sensor_alerts;
    END IF;
END $$;

-- Create alert thresholds configuration table
CREATE TABLE IF NOT EXISTS public.sensor_alert_thresholds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_assignment_id UUID NOT NULL REFERENCES public.device_assignments(id) ON DELETE CASCADE,
  sensor_type TEXT NOT NULL,
  min_value NUMERIC,
  max_value NUMERIC,
  warning_min NUMERIC,
  warning_max NUMERIC,
  critical_min NUMERIC,
  critical_max NUMERIC,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(device_assignment_id, sensor_type)
);

-- Create indexes for alert thresholds
CREATE INDEX IF NOT EXISTS idx_sensor_alert_thresholds_device_assignment_id ON public.sensor_alert_thresholds(device_assignment_id);
CREATE INDEX IF NOT EXISTS idx_sensor_alert_thresholds_sensor_type ON public.sensor_alert_thresholds(sensor_type);
CREATE INDEX IF NOT EXISTS idx_sensor_alert_thresholds_enabled ON public.sensor_alert_thresholds(enabled);

-- Function to automatically resolve old alerts
CREATE OR REPLACE FUNCTION resolve_old_alerts()
RETURNS void AS $$
BEGIN
  -- Auto-resolve alerts older than 24 hours
  UPDATE public.sensor_alerts 
  SET 
    resolved = TRUE,
    resolved_at = NOW(),
    updated_at = NOW()
  WHERE 
    resolved = FALSE 
    AND created_at < NOW() - INTERVAL '24 hours'
    AND severity IN ('low', 'medium');
    
  -- Auto-resolve critical alerts older than 7 days
  UPDATE public.sensor_alerts 
  SET 
    resolved = TRUE,
    resolved_at = NOW(),
    updated_at = NOW()
  WHERE 
    resolved = FALSE 
    AND created_at < NOW() - INTERVAL '7 days'
    AND severity = 'critical';
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_sensor_alerts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sensor_alerts_updated_at ON public.sensor_alerts;
CREATE TRIGGER sensor_alerts_updated_at
  BEFORE UPDATE ON public.sensor_alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_sensor_alerts_updated_at();

DROP TRIGGER IF EXISTS sensor_alert_thresholds_updated_at ON public.sensor_alert_thresholds;
CREATE TRIGGER sensor_alert_thresholds_updated_at
  BEFORE UPDATE ON public.sensor_alert_thresholds
  FOR EACH ROW
  EXECUTE FUNCTION update_sensor_alerts_updated_at();

-- Create view for active alerts
DROP VIEW IF EXISTS public.active_sensor_alerts;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'device_assignments' AND table_schema = 'public') 
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'device_assignments' AND column_name = 'device_class' AND table_schema = 'public') THEN
        CREATE OR REPLACE VIEW public.active_sensor_alerts AS
        SELECT 
          sa.*,
          da.entity_id,
          da.friendly_name as device_name,
          da.device_class,
          sat.warning_min,
          sat.warning_max,
          sat.critical_min,
          sat.critical_max
        FROM public.sensor_alerts sa
        JOIN public.device_assignments da ON sa.device_assignment_id = da.id
        LEFT JOIN public.sensor_alert_thresholds sat ON sa.device_assignment_id = sat.device_assignment_id 
          AND sa.sensor_type = sat.sensor_type
        WHERE sa.resolved = FALSE
        ORDER BY 
          CASE sa.severity 
            WHEN 'critical' THEN 1
            WHEN 'high' THEN 2
            WHEN 'medium' THEN 3
            WHEN 'low' THEN 4
          END,
          sa.created_at DESC;
    ELSE
        -- Create simplified view without device_class if column doesn't exist
        CREATE OR REPLACE VIEW public.active_sensor_alerts AS
        SELECT 
          sa.*,
          da.entity_id,
          da.friendly_name as device_name,
          sat.warning_min,
          sat.warning_max,
          sat.critical_min,
          sat.critical_max
        FROM public.sensor_alerts sa
        JOIN public.device_assignments da ON sa.device_assignment_id = da.id
        LEFT JOIN public.sensor_alert_thresholds sat ON sa.device_assignment_id = sat.device_assignment_id 
          AND sa.sensor_type = sat.sensor_type
        WHERE sa.resolved = FALSE
        ORDER BY 
          CASE sa.severity 
            WHEN 'critical' THEN 1
            WHEN 'high' THEN 2
            WHEN 'medium' THEN 3
            WHEN 'low' THEN 4
          END,
          sa.created_at DESC;
    END IF;
END $$;

-- RLS policies for sensor alerts
ALTER TABLE public.sensor_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sensor_alert_thresholds ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE policyname = 'Users can view their sensor alerts' 
        AND tablename = 'sensor_alerts' 
        AND schemaname = 'public'
    ) THEN
        CREATE POLICY "Users can view their sensor alerts" ON public.sensor_alerts
          FOR SELECT USING (
            device_assignment_id IN (
              SELECT da.id FROM public.device_assignments da
              JOIN public.shelves s ON da.shelf_id = s.id
              JOIN public.racks r ON s.rack_id = r.id
              JOIN public.rows ro ON r.row_id = ro.id
              JOIN public.farms f ON ro.farm_id = f.id
              WHERE f.user_id = auth.uid()
            )
          );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE policyname = 'Users can manage their sensor alert thresholds' 
        AND tablename = 'sensor_alert_thresholds' 
        AND schemaname = 'public'
    ) THEN
        CREATE POLICY "Users can manage their sensor alert thresholds" ON public.sensor_alert_thresholds
          FOR ALL USING (
            device_assignment_id IN (
              SELECT da.id FROM public.device_assignments da
              JOIN public.shelves s ON da.shelf_id = s.id
              JOIN public.racks r ON s.rack_id = r.id
              JOIN public.rows ro ON r.row_id = ro.id
              JOIN public.farms f ON ro.farm_id = f.id
              WHERE f.user_id = auth.uid()
            )
          );
    END IF;
END $$;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.sensor_alerts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sensor_alert_thresholds TO authenticated;
GRANT SELECT ON public.active_sensor_alerts TO authenticated;

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
            'Storage & Features Consolidation',
            ARRAY[
                '20250201000000_storage_implementation.sql',
                '20250203000002_fix_sensor_caching_conflicts.sql'
            ],
            '20250203000011_consolidated_storage_features.sql',
            'completed',
            NOW()
        ) ON CONFLICT (consolidation_name) DO UPDATE SET
            status = 'completed',
            completed_at = NOW();
    END IF;
END $$; 