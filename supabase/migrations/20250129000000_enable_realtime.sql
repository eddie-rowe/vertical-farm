-- Enable Real-time for Vertical Farm Platform
-- This migration enables Supabase real-time subscriptions on key tables

-- Enable real-time on user-specific configuration tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_home_assistant_configs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_device_configs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_profiles;

-- Enable real-time on core farm structure tables (for live updates when farm structure changes)
ALTER PUBLICATION supabase_realtime ADD TABLE public.farms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.rows;
ALTER PUBLICATION supabase_realtime ADD TABLE public.racks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.shelves;

-- Enable real-time on device assignments (for live device management)
ALTER PUBLICATION supabase_realtime ADD TABLE public.device_assignments;

-- Enable real-time on schedules and automation (for live grow monitoring)
ALTER PUBLICATION supabase_realtime ADD TABLE public.schedules;
ALTER PUBLICATION supabase_realtime ADD TABLE public.scheduled_actions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.automation_rules;

-- Enable real-time on sensor readings (for live monitoring dashboards)
-- Note: This will generate high-frequency events - consider filtering in the application
ALTER PUBLICATION supabase_realtime ADD TABLE public.sensor_readings;

-- Enable real-time on species and grow recipes (for live configuration updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.species;
ALTER PUBLICATION supabase_realtime ADD TABLE public.grow_recipes;

-- Enable real-time on harvests (for live harvest tracking)
ALTER PUBLICATION supabase_realtime ADD TABLE public.harvests;

-- Create a function to notify about important real-time events
-- This can be used to trigger additional logic when certain events occur
CREATE OR REPLACE FUNCTION notify_important_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify when devices are assigned/unassigned
  IF TG_TABLE_NAME = 'device_assignments' THEN
    PERFORM pg_notify(
      'device_assignment_change', 
      json_build_object(
        'operation', TG_OP,
        'device_id', COALESCE(NEW.id, OLD.id),
        'entity_id', COALESCE(NEW.entity_id, OLD.entity_id),
        'farm_id', COALESCE(NEW.farm_id, OLD.farm_id)
      )::text
    );
  END IF;

  -- Notify when automation rules are activated/deactivated
  IF TG_TABLE_NAME = 'automation_rules' THEN
    -- Only notify if is_active status changed
    IF (TG_OP = 'UPDATE' AND OLD.is_active != NEW.is_active) OR TG_OP = 'INSERT' THEN
      PERFORM pg_notify(
        'automation_rule_change',
        json_build_object(
          'operation', TG_OP,
          'rule_id', NEW.id,
          'rule_name', NEW.name,
          'is_active', NEW.is_active,
          'farm_id', NEW.farm_id
        )::text
      );
    END IF;
  END IF;

  -- Notify when schedules status changes
  IF TG_TABLE_NAME = 'schedules' THEN
    IF (TG_OP = 'UPDATE' AND OLD.status != NEW.status) OR TG_OP = 'INSERT' THEN
      PERFORM pg_notify(
        'schedule_status_change',
        json_build_object(
          'operation', TG_OP,
          'schedule_id', NEW.id,
          'status', NEW.status,
          'shelf_id', NEW.shelf_id
        )::text
      );
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers for important notifications
CREATE TRIGGER device_assignment_notify
  AFTER INSERT OR UPDATE OR DELETE ON public.device_assignments
  FOR EACH ROW
  EXECUTE FUNCTION notify_important_changes();

CREATE TRIGGER automation_rule_notify
  AFTER INSERT OR UPDATE OR DELETE ON public.automation_rules
  FOR EACH ROW
  EXECUTE FUNCTION notify_important_changes();

CREATE TRIGGER schedule_notify
  AFTER INSERT OR UPDATE OR DELETE ON public.schedules
  FOR EACH ROW
  EXECUTE FUNCTION notify_important_changes();

-- Add comments to document real-time usage
COMMENT ON TABLE public.user_home_assistant_configs IS 'Real-time enabled: Live updates for Home Assistant integration changes';
COMMENT ON TABLE public.user_device_configs IS 'Real-time enabled: Live updates for device configuration changes';
COMMENT ON TABLE public.device_assignments IS 'Real-time enabled: Live updates for device assignment changes';
COMMENT ON TABLE public.sensor_readings IS 'Real-time enabled: Live sensor data updates (high frequency)';
COMMENT ON TABLE public.schedules IS 'Real-time enabled: Live updates for grow schedule changes';
COMMENT ON TABLE public.automation_rules IS 'Real-time enabled: Live updates for automation rule changes';

-- Create a view for real-time connection status monitoring
CREATE OR REPLACE VIEW public.realtime_status AS
SELECT 
  'user_home_assistant_configs' as table_name,
  'Live HA integration updates' as description,
  true as enabled
UNION ALL
SELECT 
  'user_device_configs' as table_name,
  'Live device configuration updates' as description,
  true as enabled
UNION ALL
SELECT 
  'device_assignments' as table_name,
  'Live device assignment updates' as description,
  true as enabled
UNION ALL
SELECT 
  'sensor_readings' as table_name,
  'Live sensor data (high frequency)' as description,
  true as enabled
UNION ALL
SELECT 
  'schedules' as table_name,
  'Live grow schedule updates' as description,
  true as enabled
UNION ALL
SELECT 
  'automation_rules' as table_name,
  'Live automation rule updates' as description,
  true as enabled;

-- Grant access to the realtime status view
GRANT SELECT ON public.realtime_status TO authenticated; 