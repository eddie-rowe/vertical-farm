-- Fix Sensor Data Caching Conflicts
-- This migration addresses the conflicting pattern of realtime + caching on sensor_readings
-- by separating concerns: cached sensor data vs realtime alerts

-- Remove sensor_readings from realtime publication (only if it exists in the publication)
-- This table will be cached instead of using realtime subscriptions
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

-- Create sensor_alerts table for critical conditions that DO need realtime
CREATE TABLE IF NOT EXISTS public.sensor_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_assignment_id UUID NOT NULL REFERENCES public.device_assignments(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL, -- 'temperature_high', 'temperature_low', 'ph_high', 'ph_low', 'humidity_high', 'humidity_low', etc.
  sensor_type TEXT NOT NULL, -- 'temperature', 'humidity', 'ph', 'ec', 'light', 'water_level'
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

-- Enable realtime for sensor_alerts (this is what actually needs immediate updates)
DO $$
BEGIN
  -- Check if sensor_alerts is not already in the realtime publication before adding it
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
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

-- Insert default alert thresholds for common sensor types
-- These will be inserted when devices are actually assigned with appropriate entity_types
INSERT INTO public.sensor_alert_thresholds (device_assignment_id, sensor_type, min_value, max_value, warning_min, warning_max, critical_min, critical_max)
SELECT 
  da.id,
  'temperature',
  15.0, -- min_value
  35.0, -- max_value  
  18.0, -- warning_min
  30.0, -- warning_max
  10.0, -- critical_min
  40.0  -- critical_max
FROM public.device_assignments da
WHERE da.entity_type ILIKE '%temperature%' OR da.entity_type ILIKE '%temp%'
ON CONFLICT (device_assignment_id, sensor_type) DO NOTHING;

INSERT INTO public.sensor_alert_thresholds (device_assignment_id, sensor_type, min_value, max_value, warning_min, warning_max, critical_min, critical_max)
SELECT 
  da.id,
  'humidity',
  30.0, -- min_value
  90.0, -- max_value
  40.0, -- warning_min
  80.0, -- warning_max
  20.0, -- critical_min
  95.0  -- critical_max
FROM public.device_assignments da
WHERE da.entity_type ILIKE '%humidity%' OR da.entity_type ILIKE '%humid%'
ON CONFLICT (device_assignment_id, sensor_type) DO NOTHING;

INSERT INTO public.sensor_alert_thresholds (device_assignment_id, sensor_type, min_value, max_value, warning_min, warning_max, critical_min, critical_max)
SELECT 
  da.id,
  'ph',
  4.0, -- min_value
  8.5, -- max_value
  5.5, -- warning_min
  7.5, -- warning_max
  4.5, -- critical_min
  8.0  -- critical_max
FROM public.device_assignments da
WHERE da.entity_type ILIKE '%ph%'
ON CONFLICT (device_assignment_id, sensor_type) DO NOTHING;

-- Create function to automatically resolve old alerts
CREATE OR REPLACE FUNCTION resolve_old_alerts()
RETURNS void AS $$
BEGIN
  -- Auto-resolve alerts older than 24 hours that haven't been manually resolved
  UPDATE public.sensor_alerts 
  SET 
    resolved = TRUE,
    resolved_at = NOW(),
    updated_at = NOW()
  WHERE 
    resolved = FALSE 
    AND created_at < NOW() - INTERVAL '24 hours'
    AND severity IN ('low', 'medium');
    
  -- Auto-resolve critical alerts older than 7 days (they should be manually handled)
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

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'sensor_alerts_updated_at'
  ) THEN
    CREATE TRIGGER sensor_alerts_updated_at
      BEFORE UPDATE ON public.sensor_alerts
      FOR EACH ROW
      EXECUTE FUNCTION update_sensor_alerts_updated_at();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'sensor_alert_thresholds_updated_at'
  ) THEN
    CREATE TRIGGER sensor_alert_thresholds_updated_at
      BEFORE UPDATE ON public.sensor_alert_thresholds
      FOR EACH ROW
      EXECUTE FUNCTION update_sensor_alerts_updated_at();
  END IF;
END $$;

-- Create view for active alerts
DROP VIEW IF EXISTS public.active_sensor_alerts;
CREATE VIEW public.active_sensor_alerts AS
SELECT 
  sa.*,
  da.entity_id,
  da.friendly_name as device_name,
  da.entity_type as device_type,
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

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.sensor_alerts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sensor_alert_thresholds TO authenticated;
GRANT SELECT ON public.active_sensor_alerts TO authenticated;

-- Add RLS policies
ALTER TABLE public.sensor_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sensor_alert_thresholds ENABLE ROW LEVEL SECURITY;

-- RLS for sensor_alerts - users can see alerts for their devices
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
    WHERE policyname = 'Users can acknowledge their sensor alerts' 
    AND tablename = 'sensor_alerts' 
    AND schemaname = 'public'
  ) THEN
    CREATE POLICY "Users can acknowledge their sensor alerts" ON public.sensor_alerts
      FOR UPDATE USING (
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

-- RLS for sensor_alert_thresholds - users can manage thresholds for their devices
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

-- Update comments
COMMENT ON TABLE public.sensor_readings IS 'Sensor data storage - CACHED (no realtime). Use sensor_alerts for immediate notifications.';
COMMENT ON TABLE public.sensor_alerts IS 'Real-time enabled: Critical sensor alerts requiring immediate attention';
COMMENT ON TABLE public.sensor_alert_thresholds IS 'Configuration for sensor alert thresholds per device';

-- Create a scheduled job to clean up old resolved alerts (if pg_cron is available)
-- This will be handled by the application if pg_cron is not available
-- SELECT cron.schedule('cleanup-old-sensor-alerts', '0 2 * * *', 'SELECT resolve_old_alerts();'); 