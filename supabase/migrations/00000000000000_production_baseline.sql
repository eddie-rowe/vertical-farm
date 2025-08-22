

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";






CREATE SCHEMA IF NOT EXISTS "pgmq";

CREATE SCHEMA IF NOT EXISTS "pgmq_public";


ALTER SCHEMA "pgmq_public" OWNER TO "postgres";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pg_trgm" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgmq" WITH SCHEMA "pgmq";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."action_status" AS ENUM (
    'pending',
    'executed',
    'failed',
    'skipped',
    'cancelled'
);


ALTER TYPE "public"."action_status" OWNER TO "postgres";


CREATE TYPE "public"."action_type" AS ENUM (
    'light_on',
    'light_off',
    'water_pump_on',
    'water_pump_off',
    'nutrient_dose',
    'fan_on',
    'fan_off',
    'alert'
);


ALTER TYPE "public"."action_type" OWNER TO "postgres";


CREATE TYPE "public"."alert_severity" AS ENUM (
    'critical',
    'high',
    'medium',
    'low'
);


ALTER TYPE "public"."alert_severity" OWNER TO "postgres";


CREATE TYPE "public"."alert_type" AS ENUM (
    'environmental',
    'growth',
    'resource',
    'system',
    'automation'
);


ALTER TYPE "public"."alert_type" OWNER TO "postgres";


CREATE TYPE "public"."grow_stage_type" AS ENUM (
    'planning',
    'seeding',
    'germination',
    'vegetative',
    'flowering',
    'harvest',
    'complete'
);


ALTER TYPE "public"."grow_stage_type" OWNER TO "postgres";


CREATE TYPE "public"."integration_status" AS ENUM (
    'connected',
    'disconnected',
    'error',
    'syncing'
);


ALTER TYPE "public"."integration_status" OWNER TO "postgres";


CREATE TYPE "public"."integration_type" AS ENUM (
    'home_assistant',
    'mqtt',
    'zigbee',
    'zwave'
);


ALTER TYPE "public"."integration_type" OWNER TO "postgres";


CREATE TYPE "public"."observation_type" AS ENUM (
    'visual_inspection',
    'measurements',
    'issues',
    'notes',
    'milestone'
);


ALTER TYPE "public"."observation_type" OWNER TO "postgres";


CREATE TYPE "public"."schedule_status" AS ENUM (
    'planned',
    'active',
    'completed',
    'aborted'
);


ALTER TYPE "public"."schedule_status" OWNER TO "postgres";


CREATE TYPE "public"."user_role" AS ENUM (
    'farm_manager',
    'operator',
    'ha_power_user',
    'admin'
);


ALTER TYPE "public"."user_role" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "pgmq_public"."archive"("queue_name" "text", "message_id" bigint) RETURNS boolean
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$ begin return pgmq.archive( queue_name := queue_name, msg_id := message_id ); end; $$;


ALTER FUNCTION "pgmq_public"."archive"("queue_name" "text", "message_id" bigint) OWNER TO "postgres";


COMMENT ON FUNCTION "pgmq_public"."archive"("queue_name" "text", "message_id" bigint) IS 'Archives a message by moving it from the queue to a permanent archive.';



CREATE OR REPLACE FUNCTION "pgmq_public"."delete"("queue_name" "text", "message_id" bigint) RETURNS boolean
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$ begin return pgmq.delete( queue_name := queue_name, msg_id := message_id ); end; $$;


ALTER FUNCTION "pgmq_public"."delete"("queue_name" "text", "message_id" bigint) OWNER TO "postgres";


COMMENT ON FUNCTION "pgmq_public"."delete"("queue_name" "text", "message_id" bigint) IS 'Permanently deletes a message from the specified queue.';



CREATE OR REPLACE FUNCTION "pgmq_public"."pop"("queue_name" "text") RETURNS SETOF "pgmq"."message_record"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$ begin return query select * from pgmq.pop( queue_name := queue_name ); end; $$;


ALTER FUNCTION "pgmq_public"."pop"("queue_name" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "pgmq_public"."pop"("queue_name" "text") IS 'Retrieves and locks the next message from the specified queue.';



CREATE OR REPLACE FUNCTION "pgmq_public"."read"("queue_name" "text", "sleep_seconds" integer, "n" integer) RETURNS SETOF "pgmq"."message_record"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$ begin return query select * from pgmq.read( queue_name := queue_name, vt := sleep_seconds, qty := n ); end; $$;


ALTER FUNCTION "pgmq_public"."read"("queue_name" "text", "sleep_seconds" integer, "n" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "pgmq_public"."read"("queue_name" "text", "sleep_seconds" integer, "n" integer) IS 'Reads up to "n" messages from the specified queue with an optional "sleep_seconds" (visibility timeout).';



CREATE OR REPLACE FUNCTION "pgmq_public"."send"("queue_name" "text", "message" "jsonb", "sleep_seconds" integer DEFAULT 0) RETURNS SETOF bigint
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$ begin return query select * from pgmq.send( queue_name := queue_name, msg := message, delay := sleep_seconds ); end; $$;


ALTER FUNCTION "pgmq_public"."send"("queue_name" "text", "message" "jsonb", "sleep_seconds" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "pgmq_public"."send"("queue_name" "text", "message" "jsonb", "sleep_seconds" integer) IS 'Sends a message to the specified queue, optionally delaying its availability by a number of seconds.';



CREATE OR REPLACE FUNCTION "pgmq_public"."send_batch"("queue_name" "text", "messages" "jsonb"[], "sleep_seconds" integer DEFAULT 0) RETURNS SETOF bigint
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$ begin return query select * from pgmq.send_batch( queue_name := queue_name, msgs := messages, delay := sleep_seconds ); end; $$;


ALTER FUNCTION "pgmq_public"."send_batch"("queue_name" "text", "messages" "jsonb"[], "sleep_seconds" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "pgmq_public"."send_batch"("queue_name" "text", "messages" "jsonb"[], "sleep_seconds" integer) IS 'Sends a batch of messages to the specified queue, optionally delaying their availability by a number of seconds.';



CREATE OR REPLACE FUNCTION "public"."calculate_grow_health_score"("p_grow_id" "uuid") RETURNS TABLE("overall_score" integer, "environmental_score" integer, "growth_score" integer, "alert_score" integer, "last_updated" timestamp with time zone)
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    env_score INTEGER := 100;
    growth_score INTEGER := 100;
    alert_penalty INTEGER := 0;
    critical_alerts INTEGER;
    high_alerts INTEGER;
    medium_alerts INTEGER;
BEGIN
    -- Calculate alert penalty
    SELECT 
        COUNT(*) FILTER (WHERE severity = 'critical'),
        COUNT(*) FILTER (WHERE severity = 'high'),
        COUNT(*) FILTER (WHERE severity = 'medium')
    INTO critical_alerts, high_alerts, medium_alerts
    FROM grow_alerts 
    WHERE grow_id = p_grow_id 
        AND resolved_at IS NULL
        AND created_at >= NOW() - INTERVAL '7 days';
    
    -- Alert scoring penalty
    alert_penalty := (critical_alerts * 30) + (high_alerts * 15) + (medium_alerts * 5);
    alert_penalty := LEAST(alert_penalty, 70); -- Cap at 70 point penalty
    
    -- Environmental scoring (simplified - can be enhanced with actual threshold checking)
    -- TODO: Implement actual metric comparison against thresholds
    
    -- Growth scoring (simplified - based on stage progression)
    -- TODO: Implement actual growth rate analysis
    
    RETURN QUERY
    SELECT 
        GREATEST(0, LEAST(100, (env_score + growth_score) / 2 - alert_penalty)) as overall_score,
        env_score as environmental_score,
        growth_score as growth_score,
        (100 - alert_penalty) as alert_score,
        NOW() as last_updated;
END;
$$;


ALTER FUNCTION "public"."calculate_grow_health_score"("p_grow_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."calculate_grow_health_score"("p_grow_id" "uuid") IS 'Calculates comprehensive health score based on multiple factors';



CREATE OR REPLACE FUNCTION "public"."calculate_harvest_date"("p_planted_date" "date", "p_recipe_id" "uuid" DEFAULT NULL::"uuid") RETURNS "date"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    total_days INTEGER := 60; -- Default grow time
BEGIN
    -- Get total grow days from recipe if provided
    IF p_recipe_id IS NOT NULL THEN
        SELECT COALESCE(total_grow_days, 60) INTO total_days
        FROM grow_recipes
        WHERE id = p_recipe_id;
    END IF;
    
    RETURN p_planted_date + total_days;
END;
$$;


ALTER FUNCTION "public"."calculate_harvest_date"("p_planted_date" "date", "p_recipe_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_schedule_end_date"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Calculate estimated end date based on grow recipe days
  IF NEW.estimated_end_date IS NULL AND NEW.start_date IS NOT NULL THEN
    SELECT 
      NEW.start_date + INTERVAL '1 day' * COALESCE(gr.grow_days, 30)
    INTO NEW.estimated_end_date
    FROM public.grow_recipes gr
    WHERE gr.id = NEW.grow_recipe_id;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."calculate_schedule_end_date"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_total_grow_days"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- If total_grow_days is not set, calculate it from germination_days + light_days
  IF NEW.total_grow_days IS NULL THEN
    NEW.total_grow_days := COALESCE(NEW.germination_days, 0) + COALESCE(NEW.light_days, 0);
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."calculate_total_grow_days"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_user_permissions"("target_table_name" "text") RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    AS $$
DECLARE
    user_role text;
    is_admin boolean := false;
BEGIN
    -- Get user role efficiently
    SELECT role INTO user_role 
    FROM public.user_profiles 
    WHERE id = auth.uid();
    
    -- Check if user is admin
    is_admin := (user_role = 'admin');
    
    -- Return permissions based on table and role
    CASE target_table_name
        WHEN 'farms' THEN
            RETURN is_admin OR EXISTS (
                SELECT 1 FROM public.farms 
                WHERE user_id = auth.uid()
            );
        WHEN 'user_profiles' THEN
            RETURN true; -- All authenticated users can access their own profile
        ELSE
            RETURN is_admin;
    END CASE;
END;
$$;


ALTER FUNCTION "public"."check_user_permissions"("target_table_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_completed_jobs"("p_days_old" integer DEFAULT 7) RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.job_queue
    WHERE status IN ('completed', 'failed', 'cancelled')
    AND completed_at < NOW() - (p_days_old || ' days')::INTERVAL;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Also clean up old task logs
    DELETE FROM public.task_logs
    WHERE created_at < NOW() - (p_days_old || ' days')::INTERVAL;
    
    RETURN deleted_count;
END;
$$;


ALTER FUNCTION "public"."cleanup_completed_jobs"("p_days_old" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_old_sensor_data"("days_to_keep" integer DEFAULT 30) RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  deleted_count integer;
BEGIN
  -- Delete sensor readings older than specified days
  DELETE FROM public.sensor_readings 
  WHERE recorded_at < NOW() - (days_to_keep || ' days')::interval;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Clean up resolved sensor alerts older than 7 days
  DELETE FROM public.sensor_alerts 
  WHERE resolved = TRUE 
  AND resolved_at < NOW() - INTERVAL '7 days';
  
  RETURN deleted_count;
END;
$$;


ALTER FUNCTION "public"."cleanup_old_sensor_data"("days_to_keep" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."cleanup_old_sensor_data"("days_to_keep" integer) IS 'Cleans up old sensor data and resolved alerts';



CREATE OR REPLACE FUNCTION "public"."cleanup_old_sensor_readings"("retention_days" integer DEFAULT 30) RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  deleted_count integer;
BEGIN
  -- Only allow admins to run cleanup
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only administrators can perform data cleanup';
  END IF;
  
  DELETE FROM public.sensor_readings 
  WHERE timestamp < (NOW() - (retention_days || ' days')::interval);
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$;


ALTER FUNCTION "public"."cleanup_old_sensor_readings"("retention_days" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_orphaned_storage_files"() RETURNS TABLE("bucket_id" "text", "file_path" "text", "reason" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'storage'
    AS $$
BEGIN
  -- Only admin can run cleanup
  IF NOT EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only administrators can run storage cleanup';
  END IF;

  RETURN QUERY
  -- Find user upload files for deleted users
  SELECT 
    o.bucket_id,
    o.name as file_path,
    'User profile deleted' as reason
  FROM storage.objects o
  WHERE o.bucket_id = 'user-uploads'
  AND NOT EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.id::text = (storage.foldername(o.name))[1]
  )
  
  UNION ALL
  
  -- Find farm documentation for deleted farms
  SELECT 
    o.bucket_id,
    o.name as file_path,
    'Farm deleted' as reason
  FROM storage.objects o
  WHERE o.bucket_id IN ('farm-documentation', 'harvest-photos')
  AND NOT EXISTS (
    SELECT 1 FROM public.farms f
    WHERE f.id::text = (storage.foldername(o.name))[1]
  )
  
  UNION ALL
  
  -- Find harvest photos without corresponding harvest records
  SELECT 
    o.bucket_id,
    o.name as file_path,
    'Harvest record not found' as reason
  FROM storage.objects o
  WHERE o.bucket_id = 'harvest-photos'
  AND NOT EXISTS (
    SELECT 1 FROM public.harvests h
    WHERE o.name = ANY(h.photo_urls)
  );
END;
$$;


ALTER FUNCTION "public"."cleanup_orphaned_storage_files"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."cleanup_orphaned_storage_files"() IS 'Identifies orphaned storage files that can be safely deleted';



CREATE OR REPLACE FUNCTION "public"."complete_job"("p_job_id" "uuid", "p_status" "text", "p_error_message" "text" DEFAULT NULL::"text", "p_execution_time_ms" integer DEFAULT NULL::integer) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    job_record RECORD;
    log_priority TEXT;
BEGIN
    SELECT * INTO job_record FROM public.job_queue WHERE id = p_job_id;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Update job status
    UPDATE public.job_queue
    SET 
        status = p_status,
        completed_at = NOW(),
        updated_at = NOW(),
        error_message = p_error_message,
        execution_time_ms = COALESCE(p_execution_time_ms, EXTRACT(EPOCH FROM (NOW() - started_at)) * 1000)
    WHERE id = p_job_id;
    
    -- Determine log priority
    log_priority := CASE 
        WHEN p_status = 'failed' THEN 'high'
        WHEN p_status = 'completed' THEN 'normal'
        ELSE 'normal'
    END;
    
    -- Log task execution
    PERFORM public.log_task_execution(
        p_job_id::TEXT,
        job_record.job_type,
        log_priority,
        p_status = 'completed',
        COALESCE(p_execution_time_ms, EXTRACT(EPOCH FROM (NOW() - job_record.started_at)) * 1000)::INTEGER,
        p_error_message,
        job_record.attempts
    );
    
    RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."complete_job"("p_job_id" "uuid", "p_status" "text", "p_error_message" "text", "p_execution_time_ms" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."complete_job"("p_job_id" "uuid", "p_status" "text", "p_error_message" "text", "p_execution_time_ms" integer) IS 'Mark job as completed with enhanced logging and metrics';



CREATE OR REPLACE FUNCTION "public"."create_automation_schedule"("grow_id_param" "uuid", "device_assignment_id_param" "uuid", "schedule_name_param" character varying, "schedule_type_param" character varying, "device_action_param" "jsonb", "cron_expression_param" character varying DEFAULT NULL::character varying, "starts_at_param" timestamp with time zone DEFAULT NULL::timestamp with time zone, "ends_at_param" timestamp with time zone DEFAULT NULL::timestamp with time zone, "created_by_param" "uuid" DEFAULT NULL::"uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    schedule_id UUID;
BEGIN
    INSERT INTO grow_automation_schedules (
        grow_id,
        device_assignment_id,
        schedule_name,
        schedule_type,
        device_action,
        cron_expression,
        starts_at,
        ends_at,
        created_by
    ) VALUES (
        grow_id_param,
        device_assignment_id_param,
        schedule_name_param,
        schedule_type_param,
        device_action_param,
        cron_expression_param,
        COALESCE(starts_at_param, NOW()),
        ends_at_param,
        created_by_param
    ) RETURNING id INTO schedule_id;
    
    RETURN schedule_id;
END;
$$;


ALTER FUNCTION "public"."create_automation_schedule"("grow_id_param" "uuid", "device_assignment_id_param" "uuid", "schedule_name_param" character varying, "schedule_type_param" character varying, "device_action_param" "jsonb", "cron_expression_param" character varying, "starts_at_param" timestamp with time zone, "ends_at_param" timestamp with time zone, "created_by_param" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_grow_from_recipe"("p_name" character varying, "p_recipe_id" "uuid", "p_seed_variety_id" "uuid", "p_location_ids" "uuid"[], "p_plant_count" integer, "p_user_id" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    new_grow_id UUID;
    planted_date DATE := CURRENT_DATE;
    expected_harvest DATE;
    location_id UUID;
BEGIN
    -- Calculate expected harvest date
    expected_harvest := calculate_harvest_date(planted_date, p_recipe_id);
    
    -- Create new grow
    INSERT INTO grows (
        name,
        recipe_id,
        seed_variety_id,
        plant_count,
        planted_date,
        expected_harvest_date,
        status,
        created_by
    ) VALUES (
        p_name,
        p_recipe_id,
        p_seed_variety_id,
        p_plant_count,
        planted_date,
        expected_harvest,
        'planned',
        p_user_id
    ) RETURNING id INTO new_grow_id;
    
    -- Assign locations
    FOREACH location_id IN ARRAY p_location_ids
    LOOP
        INSERT INTO grow_location_assignments (
            grow_id,
            location_id,
            assigned_by
        ) VALUES (
            new_grow_id,
            location_id,
            p_user_id
        );
    END LOOP;
    
    -- Create initial event
    INSERT INTO grow_events (
        grow_id,
        event_type,
        description,
        created_by
    ) VALUES (
        new_grow_id,
        'created',
        'Grow created from recipe',
        p_user_id
    );
    
    RETURN new_grow_id;
END;
$$;


ALTER FUNCTION "public"."create_grow_from_recipe"("p_name" character varying, "p_recipe_id" "uuid", "p_seed_variety_id" "uuid", "p_location_ids" "uuid"[], "p_plant_count" integer, "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_queue_message"("queue_name" "text", "msg_id" bigint) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN pgmq.delete(queue_name, msg_id);
END;
$$;


ALTER FUNCTION "public"."delete_queue_message"("queue_name" "text", "msg_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."enqueue_job"("p_queue_name" "text", "p_job_type" "text", "p_payload" "jsonb" DEFAULT '{}'::"jsonb", "p_priority" integer DEFAULT 0, "p_scheduled_for" timestamp with time zone DEFAULT "now"(), "p_max_attempts" integer DEFAULT 3) RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    job_id UUID;
BEGIN
    INSERT INTO public.job_queue (
        queue_name, job_type, payload, priority, scheduled_for, max_attempts, created_by
    ) VALUES (
        p_queue_name, p_job_type, p_payload, p_priority, p_scheduled_for, p_max_attempts, auth.uid()
    ) RETURNING id INTO job_id;
    
    -- Also send to PGMQ for immediate processing if scheduled for now
    IF p_scheduled_for <= NOW() THEN
        PERFORM pgmq.send(
            p_queue_name, 
            jsonb_build_object(
                'job_id', job_id,
                'job_type', p_job_type,
                'payload', p_payload,
                'priority', p_priority
            )
        );
    END IF;
    
    RETURN job_id;
END;
$$;


ALTER FUNCTION "public"."enqueue_job"("p_queue_name" "text", "p_job_type" "text", "p_payload" "jsonb", "p_priority" integer, "p_scheduled_for" timestamp with time zone, "p_max_attempts" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."enqueue_job"("p_queue_name" "text", "p_job_type" "text", "p_payload" "jsonb", "p_priority" integer, "p_scheduled_for" timestamp with time zone, "p_max_attempts" integer) IS 'Enqueue a new job with PGMQ integration for immediate processing';



CREATE OR REPLACE FUNCTION "public"."ensure_single_default_ha_config"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- If setting a config as default, unset all other defaults for this user
  IF NEW.is_default = TRUE THEN
    UPDATE public.user_home_assistant_configs 
    SET is_default = FALSE, updated_at = NOW()
    WHERE user_id = NEW.user_id AND id != NEW.id AND is_default = TRUE;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."ensure_single_default_ha_config"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."ensure_single_default_square_config"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- If this is being set as default, unset all other defaults for this user
  IF NEW.is_default = true THEN
    UPDATE public.user_square_configs 
    SET is_default = false 
    WHERE user_id = NEW.user_id AND id != NEW.id;
  END IF;
  
  -- If this is the only config for the user, make it default
  IF NOT EXISTS (
    SELECT 1 FROM public.user_square_configs 
    WHERE user_id = NEW.user_id AND is_default = true AND id != NEW.id
  ) THEN
    NEW.is_default = true;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."ensure_single_default_square_config"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_storage_path"("bucket_name" "text", "folder_id" "uuid", "file_name" "text", "user_id" "uuid" DEFAULT "auth"."uid"()) RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $_$
DECLARE
  sanitized_name text;
  timestamp_suffix text;
  file_extension text;
  base_name text;
BEGIN
  -- Extract file extension
  file_extension := COALESCE(
    SUBSTRING(file_name FROM '\.([^.]+)$'), 
    ''
  );
  
  -- Get base name without extension
  base_name := CASE 
    WHEN file_extension != '' THEN 
      SUBSTRING(file_name FROM '^(.+)\.[^.]+$')
    ELSE 
      file_name
  END;
  
  -- Sanitize filename
  sanitized_name := REGEXP_REPLACE(
    LOWER(base_name), 
    '[^a-z0-9_-]', 
    '_', 
    'g'
  );
  
  -- Add timestamp to prevent conflicts
  timestamp_suffix := EXTRACT(EPOCH FROM NOW())::bigint::text;
  
  -- Construct path based on bucket type
  CASE bucket_name
    WHEN 'user-uploads' THEN
      RETURN user_id::text || '/' || sanitized_name || '_' || timestamp_suffix || 
             CASE WHEN file_extension != '' THEN '.' || file_extension ELSE '' END;
    WHEN 'farm-documentation' THEN
      RETURN folder_id::text || '/' || sanitized_name || '_' || timestamp_suffix ||
             CASE WHEN file_extension != '' THEN '.' || file_extension ELSE '' END;
    WHEN 'harvest-photos' THEN
      RETURN folder_id::text || '/harvests/' || sanitized_name || '_' || timestamp_suffix ||
             CASE WHEN file_extension != '' THEN '.' || file_extension ELSE '' END;
    WHEN 'device-manuals' THEN
      RETURN 'manuals/' || sanitized_name || '_' || timestamp_suffix ||
             CASE WHEN file_extension != '' THEN '.' || file_extension ELSE '' END;
    WHEN 'system-backups' THEN
      RETURN 'backups/' || TO_CHAR(NOW(), 'YYYY/MM/DD') || '/' || 
             sanitized_name || '_' || timestamp_suffix ||
             CASE WHEN file_extension != '' THEN '.' || file_extension ELSE '' END;
    ELSE
      RETURN folder_id::text || '/' || sanitized_name || '_' || timestamp_suffix ||
             CASE WHEN file_extension != '' THEN '.' || file_extension ELSE '' END;
  END CASE;
END;
$_$;


ALTER FUNCTION "public"."generate_storage_path"("bucket_name" "text", "folder_id" "uuid", "file_name" "text", "user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."generate_storage_path"("bucket_name" "text", "folder_id" "uuid", "file_name" "text", "user_id" "uuid") IS 'Generates secure, organized file paths for different storage buckets';



CREATE OR REPLACE FUNCTION "public"."get_active_schedules_with_progress"("farm_uuid" "uuid" DEFAULT NULL::"uuid") RETURNS TABLE("schedule_id" "uuid", "shelf_name" "text", "rack_name" "text", "row_name" "text", "farm_name" "text", "species_name" "text", "recipe_name" "text", "start_date" "date", "estimated_end_date" "date", "days_elapsed" integer, "days_remaining" integer, "progress_percentage" numeric, "status" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sc.id as schedule_id,
    s.name as shelf_name,
    ra.name as rack_name,
    r.name as row_name,
    f.name as farm_name,
    sp.name as species_name,
    gr.name as recipe_name,
    sc.start_date,
    sc.estimated_end_date,
    EXTRACT(DAY FROM (NOW() - sc.start_date))::integer as days_elapsed,
    CASE 
      WHEN sc.estimated_end_date IS NOT NULL 
      THEN EXTRACT(DAY FROM (sc.estimated_end_date - NOW()))::integer
      ELSE NULL
    END as days_remaining,
    CASE 
      WHEN sc.estimated_end_date IS NOT NULL 
      THEN ROUND(
        EXTRACT(EPOCH FROM (NOW() - sc.start_date)) / 
        EXTRACT(EPOCH FROM (sc.estimated_end_date - sc.start_date)) * 100, 2
      )
      ELSE NULL
    END as progress_percentage,
    sc.status
  FROM public.schedules sc
  JOIN public.shelves s ON sc.shelf_id = s.id
  JOIN public.racks ra ON s.rack_id = ra.id
  JOIN public.rows r ON ra.row_id = r.id
  JOIN public.farms f ON r.farm_id = f.id
  JOIN public.grow_recipes gr ON sc.grow_recipe_id = gr.id
  JOIN public.species sp ON gr.species_id = sp.id
  WHERE sc.status IN ('planned', 'active')
  AND (farm_uuid IS NULL OR f.id = farm_uuid)
  AND (
    f.user_id = auth.uid() OR
    public.is_admin()
  )
  ORDER BY sc.start_date DESC;
END;
$$;


ALTER FUNCTION "public"."get_active_schedules_with_progress"("farm_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_available_locations"("p_capacity_needed" integer DEFAULT 1) RETURNS TABLE("location_id" "uuid", "location_name" character varying, "location_type" character varying, "total_capacity" integer, "used_capacity" integer, "available_capacity" integer)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        gl.id,
        gl.name,
        gl.location_type,
        gl.capacity,
        COALESCE(usage.used_capacity, 0)::INTEGER,
        (gl.capacity - COALESCE(usage.used_capacity, 0))::INTEGER as available_capacity
    FROM grow_locations gl
    LEFT JOIN (
        SELECT 
            gla.location_id,
            SUM(g.plant_count) as used_capacity
        FROM grow_location_assignments gla
        JOIN grows g ON gla.grow_id = g.id
        WHERE g.status IN ('active', 'planned')
        GROUP BY gla.location_id
    ) usage ON gl.id = usage.location_id
    WHERE (gl.capacity - COALESCE(usage.used_capacity, 0)) >= p_capacity_needed
    ORDER BY available_capacity DESC;
END;
$$;


ALTER FUNCTION "public"."get_available_locations"("p_capacity_needed" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_device_status_summary"("farm_uuid" "uuid" DEFAULT NULL::"uuid") RETURNS TABLE("device_type" "text", "total_count" bigint, "last_update" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    da.entity_type as device_type,
    COUNT(*) as total_count,
    MAX(da.updated_at) as last_update
  FROM public.device_assignments da
  WHERE (farm_uuid IS NULL OR da.farm_id = farm_uuid)
  AND (
    farm_uuid IS NULL OR
    EXISTS (
      SELECT 1 FROM public.farms f
      WHERE f.id = farm_uuid 
      AND (
        f.user_id = auth.uid() OR
        public.is_admin()
      )
    )
  )
  GROUP BY da.entity_type
  ORDER BY da.entity_type;
END;
$$;


ALTER FUNCTION "public"."get_device_status_summary"("farm_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_environmental_summary"("p_grow_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    result JSONB;
BEGIN
    -- Simplified environmental summary - can be enhanced with actual sensor data
    SELECT jsonb_build_object(
        'temperature', jsonb_build_object('current', 22.5, 'target', 23.0, 'unit', '°C'),
        'humidity', jsonb_build_object('current', 65.0, 'target', 70.0, 'unit', '%'),
        'light', jsonb_build_object('current', 'on', 'schedule', '16h/day'),
        'last_updated', NOW()
    ) INTO result;
    
    RETURN result;
END;
$$;


ALTER FUNCTION "public"."get_environmental_summary"("p_grow_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_farm_hierarchy"("farm_uuid" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    result jsonb;
BEGIN
    SELECT jsonb_build_object(
        'farm', to_jsonb(f.*),
        'rows', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'row', to_jsonb(r.*),
                    'racks', (
                        SELECT jsonb_agg(
                            jsonb_build_object(
                                'rack', to_jsonb(ra.*),
                                'shelves', (
                                    SELECT jsonb_agg(to_jsonb(s.*))
                                    FROM public.farm_shelves s
                                    WHERE s.rack_id = ra.id
                                    ORDER BY s.position
                                )
                            )
                        )
                        FROM public.farm_racks ra
                        WHERE ra.row_id = r.id
                        ORDER BY ra.position
                    )
                )
            )
            FROM public.farm_rows r
            WHERE r.farm_id = f.id
            ORDER BY r.position
        )
    ) INTO result
    FROM public.farms f
    WHERE f.id = farm_uuid;
    
    RETURN result;
END;
$$;


ALTER FUNCTION "public"."get_farm_hierarchy"("farm_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_farm_statistics"("farm_uuid" "uuid") RETURNS TABLE("farm_id" "uuid", "farm_name" "text", "total_rows" integer, "total_racks" integer, "total_shelves" integer, "total_devices" integer, "active_schedules" integer, "completion_rate" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.id as farm_id,
    f.name as farm_name,
    (SELECT COUNT(*)::integer FROM public.rows WHERE farm_id = f.id) as total_rows,
    (SELECT COUNT(*)::integer FROM public.racks ra 
     JOIN public.rows r ON ra.row_id = r.id 
     WHERE r.farm_id = f.id) as total_racks,
    (SELECT COUNT(*)::integer FROM public.shelves s
     JOIN public.racks ra ON s.rack_id = ra.id
     JOIN public.rows r ON ra.row_id = r.id 
     WHERE r.farm_id = f.id) as total_shelves,
    (SELECT COUNT(*)::integer FROM public.device_assignments da
     WHERE da.farm_id = f.id 
     OR da.row_id IN (SELECT id FROM public.rows WHERE farm_id = f.id)
     OR da.rack_id IN (
       SELECT ra.id FROM public.racks ra 
       JOIN public.rows r ON ra.row_id = r.id 
       WHERE r.farm_id = f.id
     )
     OR da.shelf_id IN (
       SELECT s.id FROM public.shelves s
       JOIN public.racks ra ON s.rack_id = ra.id
       JOIN public.rows r ON ra.row_id = r.id 
       WHERE r.farm_id = f.id
     )) as total_devices,
    (SELECT COUNT(*)::integer FROM public.schedules sc
     JOIN public.shelves s ON sc.shelf_id = s.id
     JOIN public.racks ra ON s.rack_id = ra.id
     JOIN public.rows r ON ra.row_id = r.id 
     WHERE r.farm_id = f.id AND sc.status = 'active') as active_schedules,
    (SELECT
       CASE 
         WHEN COUNT(*) = 0 THEN 0::numeric
         ELSE ROUND(
           (COUNT(*) FILTER (WHERE status = 'completed'))::numeric / COUNT(*)::numeric * 100, 2
         )
       END
     FROM public.schedules sc
     JOIN public.shelves s ON sc.shelf_id = s.id
     JOIN public.racks ra ON s.rack_id = ra.id
     JOIN public.rows r ON ra.row_id = r.id 
     WHERE r.farm_id = f.id) as completion_rate
  FROM public.farms f
  WHERE f.id = farm_uuid
  AND (
    f.user_id = auth.uid() OR
    public.is_admin()
  );
END;
$$;


ALTER FUNCTION "public"."get_farm_statistics"("farm_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_grow_device_assignments"("grow_id_param" "uuid") RETURNS TABLE("assignment_id" "uuid", "entity_id" character varying, "device_type" character varying, "location_id" "uuid", "location_name" character varying)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        da.id as assignment_id,
        da.home_assistant_entity_id as entity_id,
        da.device_type,
        gla.location_id,
        gl.name as location_name
    FROM device_assignments da
    JOIN grow_location_assignments gla ON da.location_id = gla.location_id
    JOIN grow_locations gl ON gla.location_id = gl.id
    WHERE gla.grow_id = grow_id_param 
    AND gla.removed_at IS NULL
    AND da.is_active = TRUE;
END;
$$;


ALTER FUNCTION "public"."get_grow_device_assignments"("grow_id_param" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_grow_timeline"("p_grow_id" "uuid") RETURNS TABLE("event_date" "date", "event_type" character varying, "description" "text", "metadata" "jsonb", "created_by" "uuid")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ge.created_at::DATE,
        ge.event_type,
        ge.description,
        ge.metadata,
        ge.created_by
    FROM grow_events ge
    WHERE ge.grow_id = p_grow_id
    ORDER BY ge.created_at DESC;
END;
$$;


ALTER FUNCTION "public"."get_grow_timeline"("p_grow_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_harvest_analytics"("farm_uuid" "uuid" DEFAULT NULL::"uuid", "start_date" "date" DEFAULT NULL::"date", "end_date" "date" DEFAULT NULL::"date") RETURNS TABLE("species_name" "text", "total_harvests" bigint, "total_yield" numeric, "average_yield" numeric, "best_yield" numeric, "average_grow_days" numeric, "success_rate" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sp.name as species_name,
    COUNT(h.id) as total_harvests,
    COALESCE(SUM(h.actual_yield), 0) as total_yield,
    COALESCE(AVG(h.actual_yield), 0) as average_yield,
    COALESCE(MAX(h.actual_yield), 0) as best_yield,
    COALESCE(AVG(EXTRACT(DAY FROM (h.harvest_date - sc.start_date))), 0) as average_grow_days,
    ROUND(
      COUNT(h.id)::numeric / 
      GREATEST(COUNT(sc.id), 1)::numeric * 100, 2
    ) as success_rate
  FROM public.species sp
  JOIN public.grow_recipes gr ON sp.id = gr.species_id
  JOIN public.schedules sc ON gr.id = sc.grow_recipe_id
  LEFT JOIN public.harvests h ON sc.id = h.schedule_id
    AND h.harvest_date BETWEEN COALESCE(start_date, '1900-01-01'::date) AND COALESCE(end_date, '2100-12-31'::date)
  JOIN public.shelves s ON sc.shelf_id = s.id
  JOIN public.racks ra ON s.rack_id = ra.id
  JOIN public.rows r ON ra.row_id = r.id
  JOIN public.farms f ON r.farm_id = f.id
  WHERE (farm_uuid IS NULL OR f.id = farm_uuid)
  AND (
    f.user_id = auth.uid() OR
    public.is_admin()
  )
  AND sc.start_date >= COALESCE(start_date, '1900-01-01'::date)
  GROUP BY sp.id, sp.name
  ORDER BY total_harvests DESC, total_yield DESC;
END;
$$;


ALTER FUNCTION "public"."get_harvest_analytics"("farm_uuid" "uuid", "start_date" "date", "end_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_latest_grow_metrics"("p_grow_id" "uuid", "p_hours" integer DEFAULT 24) RETURNS TABLE("metric_type" character varying, "latest_value" numeric, "unit" character varying, "recorded_at" timestamp with time zone, "shelf_name" character varying)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    WITH latest_metrics AS (
        SELECT DISTINCT ON (m.metric_type, m.shelf_id)
            m.metric_type,
            m.value as latest_value,
            m.unit,
            m.recorded_at,
            s.name as shelf_name
        FROM grow_monitoring_metrics m
        LEFT JOIN shelves s ON m.shelf_id = s.id
        WHERE m.grow_id = p_grow_id
            AND m.recorded_at >= NOW() - INTERVAL '%s hours' % p_hours
        ORDER BY m.metric_type, m.shelf_id, m.recorded_at DESC
    )
    SELECT * FROM latest_metrics ORDER BY metric_type, shelf_name NULLS LAST;
END;
$$;


ALTER FUNCTION "public"."get_latest_grow_metrics"("p_grow_id" "uuid", "p_hours" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_latest_grow_metrics"("p_grow_id" "uuid", "p_hours" integer) IS 'Returns latest metric values for a grow within specified time window';



CREATE OR REPLACE FUNCTION "public"."get_location_devices"("p_user_id" "uuid", "p_location_id" "text") RETURNS TABLE("assignment_id" "uuid", "entity_id" "text", "device_type" "text", "device_name" "text", "capabilities" "jsonb", "current_state" "text", "attributes" "jsonb", "last_updated" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        da.id as assignment_id,
        COALESCE(da.home_assistant_entity_id, da.entity_id) as entity_id,
        COALESCE(da.device_type, da.entity_type) as device_type,
        COALESCE(da.device_name, da.friendly_name) as device_name,
        COALESCE(da.capabilities, '{}'::jsonb) as capabilities,
        ds.state as current_state,
        ds.attributes,
        ds.last_updated
    FROM device_assignments da
    LEFT JOIN device_states ds ON ds.user_id = da.user_id AND ds.home_assistant_entity_id = COALESCE(da.home_assistant_entity_id, da.entity_id)
    WHERE da.user_id = p_user_id 
    AND (da.location_id = p_location_id OR (da.location_id IS NULL AND p_location_id IS NULL))
    AND COALESCE(da.is_active, true) = true
    ORDER BY COALESCE(da.device_type, da.entity_type), COALESCE(da.device_name, da.friendly_name);
END;
$$;


ALTER FUNCTION "public"."get_location_devices"("p_user_id" "uuid", "p_location_id" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_location_devices"("p_user_id" "uuid", "p_location_id" "text") IS 'Returns all devices assigned to a specific farm location with current states';



CREATE OR REPLACE FUNCTION "public"."get_next_job"("p_queue_name" "text", "p_worker_id" "text" DEFAULT NULL::"text") RETURNS TABLE("job_id" "uuid", "job_type" "text", "payload" "jsonb", "attempts" integer, "priority" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    UPDATE public.job_queue 
    SET 
        status = 'processing',
        started_at = NOW(),
        updated_at = NOW(),
        attempts = attempts + 1,
        worker_id = p_worker_id
    WHERE id = (
        SELECT jq.id
        FROM public.job_queue jq
        JOIN public.queue_config qc ON jq.queue_name = qc.queue_name
        WHERE jq.queue_name = p_queue_name
        AND jq.status = 'pending'
        AND jq.scheduled_for <= NOW()
        AND qc.is_active = TRUE
        AND jq.attempts < jq.max_attempts
        AND (
            SELECT COUNT(*)
            FROM public.job_queue
            WHERE queue_name = p_queue_name
            AND status = 'processing'
        ) < qc.max_concurrent_jobs
        ORDER BY jq.priority DESC, jq.scheduled_for ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED
    )
    RETURNING job_queue.id, job_queue.job_type, job_queue.payload, job_queue.attempts, job_queue.priority;
END;
$$;


ALTER FUNCTION "public"."get_next_job"("p_queue_name" "text", "p_worker_id" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_next_job"("p_queue_name" "text", "p_worker_id" "text") IS 'Get the next available job from queue with worker assignment';



CREATE OR REPLACE FUNCTION "public"."get_queue_stats"() RETURNS TABLE("queue_name" "text", "queue_length" bigint, "newest_msg_age_sec" integer, "oldest_msg_age_sec" integer, "total_messages" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        q.queue_name::TEXT,
        q.queue_length,
        q.newest_msg_age_sec,
        q.oldest_msg_age_sec,
        q.total_messages
    FROM pgmq.metrics_all() q
    WHERE q.queue_name IN ('critical_tasks', 'high_tasks', 'normal_tasks', 'low_tasks', 'failed_tasks');
END;
$$;


ALTER FUNCTION "public"."get_queue_stats"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_accessible_farms"() RETURNS TABLE("farm_id" "uuid", "farm_name" "text", "access_level" "text")
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    AS $$
DECLARE
    user_role text;
BEGIN
    -- Get user role
    SELECT role INTO user_role
    FROM public.user_profiles
    WHERE id = auth.uid();

    -- Return farms based on role
    IF user_role = 'admin' THEN
        RETURN QUERY
        SELECT f.id, f.name, 'admin'::text
        FROM public.farms f;
    ELSE
        RETURN QUERY
        SELECT f.id, f.name, 'manager'::text
        FROM public.farms f
        WHERE f.user_id = auth.uid();
    END IF;
END;
$$;


ALTER FUNCTION "public"."get_user_accessible_farms"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_storage_usage"("user_uuid" "uuid") RETURNS TABLE("total_files" bigint, "total_size_mb" numeric, "quota_mb" integer, "usage_percentage" numeric, "files_by_bucket" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Verify user can access this information
  IF user_uuid != auth.uid() AND NOT EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Insufficient permissions to view storage usage';
  END IF;

  RETURN QUERY
  WITH user_files AS (
    SELECT 
      o.bucket_id,
      COUNT(*) as file_count,
      COALESCE(SUM(o.metadata->>'size')::bigint, 0) as total_bytes
    FROM storage.objects o
    WHERE (
      (o.bucket_id = 'user-uploads' AND (storage.foldername(o.name))[1] = user_uuid::text) OR
      (o.bucket_id IN ('farm-documentation', 'harvest-photos') AND EXISTS (
        SELECT 1 FROM public.farms f
        WHERE f.id::text = (storage.foldername(o.name))[1]
        AND f.user_id = user_uuid
      ))
    )
    AND o.name IS NOT NULL
    GROUP BY o.bucket_id
  ),
  totals AS (
    SELECT 
      COALESCE(SUM(file_count), 0) as total_files,
      ROUND(COALESCE(SUM(total_bytes), 0) / 1024.0 / 1024.0, 2) as total_size_mb
    FROM user_files
  ),
  user_quota AS (
    SELECT COALESCE(storage_quota_mb, 100) as quota_mb
    FROM public.user_profiles
    WHERE id = user_uuid
  )
  SELECT 
    t.total_files,
    t.total_size_mb,
    uq.quota_mb,
    CASE 
      WHEN uq.quota_mb > 0 THEN ROUND((t.total_size_mb / uq.quota_mb) * 100, 2)
      ELSE 0
    END as usage_percentage,
    COALESCE(
      jsonb_object_agg(uf.bucket_id, jsonb_build_object(
        'files', uf.file_count,
        'size_mb', ROUND(uf.total_bytes / 1024.0 / 1024.0, 2)
      )), 
      '{}'::jsonb
    ) as files_by_bucket
  FROM totals t
  CROSS JOIN user_quota uq
  LEFT JOIN user_files uf ON true
  GROUP BY t.total_files, t.total_size_mb, uq.quota_mb;
END;
$$;


ALTER FUNCTION "public"."get_user_storage_usage"("user_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.user_profiles (id, name, role, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      NEW.email
    ),
    COALESCE(NEW.raw_app_meta_data->>'role', 'operator')::public.user_role,
    NEW.created_at,
    NEW.created_at
  );
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_storage_upload"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  path_parts text[];
BEGIN
  -- Parse the storage path
  path_parts := storage.foldername(NEW.name);
  
  -- Handle different bucket types
  CASE NEW.bucket_id
    WHEN 'user-uploads' THEN
      -- Update user profile image if it's in the right location
      IF path_parts[2] = 'profile-image' THEN
        UPDATE public.user_profiles 
        SET profile_image_url = NEW.name
        WHERE id = path_parts[1]::uuid;
      END IF;
      
    WHEN 'farm-documentation' THEN
      -- Update farm documentation folder path
      UPDATE public.farms 
      SET documentation_folder_path = path_parts[1]
      WHERE id = path_parts[1]::uuid;
      
    ELSE
      -- Do nothing for other buckets
      NULL;
  END CASE;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_storage_upload"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."is_admin"() IS 'Security definer function to check admin status without causing RLS recursion';



CREATE OR REPLACE FUNCTION "public"."log_automation_execution"("grow_id_param" "uuid", "automation_type_param" character varying, "automation_id_param" "uuid", "device_assignment_id_param" "uuid", "action_taken_param" "jsonb", "execution_status_param" character varying DEFAULT 'pending'::character varying, "execution_result_param" "jsonb" DEFAULT NULL::"jsonb", "error_message_param" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    execution_id UUID;
BEGIN
    INSERT INTO grow_automation_executions (
        grow_id,
        automation_type,
        automation_id,
        device_assignment_id,
        action_taken,
        execution_status,
        execution_result,
        error_message,
        completed_at
    ) VALUES (
        grow_id_param,
        automation_type_param,
        automation_id_param,
        device_assignment_id_param,
        action_taken_param,
        execution_status_param,
        execution_result_param,
        error_message_param,
        CASE WHEN execution_status_param != 'pending' THEN NOW() ELSE NULL END
    ) RETURNING id INTO execution_id;
    
    RETURN execution_id;
END;
$$;


ALTER FUNCTION "public"."log_automation_execution"("grow_id_param" "uuid", "automation_type_param" character varying, "automation_id_param" "uuid", "device_assignment_id_param" "uuid", "action_taken_param" "jsonb", "execution_status_param" character varying, "execution_result_param" "jsonb", "error_message_param" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_device_control"("p_user_id" "uuid", "p_entity_id" "text", "p_action_type" "text", "p_previous_state" "text", "p_new_state" "text", "p_triggered_by" "text" DEFAULT 'manual'::"text", "p_success" boolean DEFAULT true, "p_error_message" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    control_id UUID;
BEGIN
    INSERT INTO device_control_history (
        user_id, home_assistant_entity_id, action_type, 
        previous_state, new_state, triggered_by, success, error_message
    )
    VALUES (
        p_user_id, p_entity_id, p_action_type,
        p_previous_state, p_new_state, p_triggered_by, p_success, p_error_message
    )
    RETURNING id INTO control_id;
    
    RETURN control_id;
END;
$$;


ALTER FUNCTION "public"."log_device_control"("p_user_id" "uuid", "p_entity_id" "text", "p_action_type" "text", "p_previous_state" "text", "p_new_state" "text", "p_triggered_by" "text", "p_success" boolean, "p_error_message" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."log_device_control"("p_user_id" "uuid", "p_entity_id" "text", "p_action_type" "text", "p_previous_state" "text", "p_new_state" "text", "p_triggered_by" "text", "p_success" boolean, "p_error_message" "text") IS 'Logs device control actions for audit and debugging';



CREATE OR REPLACE FUNCTION "public"."log_task_execution"("p_task_id" "text", "p_task_type" "text", "p_priority" "text", "p_success" boolean, "p_execution_time" integer, "p_error_message" "text" DEFAULT NULL::"text", "p_retry_count" integer DEFAULT 0) RETURNS bigint
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    log_id BIGINT;
BEGIN
    INSERT INTO public.task_logs (
        task_id,
        task_type,
        priority,
        success,
        execution_time,
        error_message,
        retry_count,
        user_id
    ) VALUES (
        p_task_id,
        p_task_type,
        p_priority,
        p_success,
        p_execution_time,
        p_error_message,
        p_retry_count,
        auth.uid()
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$;


ALTER FUNCTION "public"."log_task_execution"("p_task_id" "text", "p_task_type" "text", "p_priority" "text", "p_success" boolean, "p_execution_time" integer, "p_error_message" "text", "p_retry_count" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_task_execution"("p_task_id" "text", "p_task_type" "text", "p_priority" "text", "p_success" boolean, "p_execution_time_ms" integer, "p_error_message" "text" DEFAULT NULL::"text", "p_retry_count" integer DEFAULT 0, "p_queue_name" "text" DEFAULT NULL::"text", "p_worker_id" "text" DEFAULT NULL::"text") RETURNS bigint
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    log_id BIGINT;
BEGIN
    INSERT INTO public.task_logs (
        task_id, task_type, queue_name, priority, success, execution_time_ms,
        error_message, retry_count, worker_id, user_id
    ) VALUES (
        p_task_id, p_task_type, p_queue_name, p_priority, p_success, p_execution_time_ms,
        p_error_message, p_retry_count, p_worker_id, auth.uid()
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$;


ALTER FUNCTION "public"."log_task_execution"("p_task_id" "text", "p_task_type" "text", "p_priority" "text", "p_success" boolean, "p_execution_time_ms" integer, "p_error_message" "text", "p_retry_count" integer, "p_queue_name" "text", "p_worker_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."move_to_failed_queue"("original_queue" "text", "msg_id" bigint, "error_message" "text" DEFAULT NULL::"text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    message_data JSONB;
    failed_message JSONB;
BEGIN
    -- Get the original message
    SELECT message INTO message_data 
    FROM pgmq.read(original_queue, 1, 1) 
    WHERE msg_id = move_to_failed_queue.msg_id;
    
    IF message_data IS NOT NULL THEN
        -- Add failure information
        failed_message := message_data || jsonb_build_object(
            'failed_at', now(),
            'original_queue', original_queue,
            'error_message', error_message
        );
        
        -- Send to failed queue
        PERFORM pgmq.send('failed_tasks', failed_message);
        
        -- Delete from original queue
        PERFORM pgmq.delete(original_queue, msg_id);
        
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$;


ALTER FUNCTION "public"."move_to_failed_queue"("original_queue" "text", "msg_id" bigint, "error_message" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_important_changes"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."notify_important_changes"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."process_scheduled_automations"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    processed_count integer := 0;
    rule_record record;
BEGIN
    -- Process time-based automation rules
    FOR rule_record IN 
        SELECT * FROM public.automation_rules
        WHERE is_active = true 
        AND trigger_type = 'schedule'
        AND (
            last_triggered_at IS NULL OR
            last_triggered_at < NOW() - (trigger_conditions->>'interval')::interval
        )
    LOOP
        -- Trigger the automation rule
        IF public.trigger_automation_rule(rule_record.id) THEN
            processed_count := processed_count + 1;
        END IF;
    END LOOP;
    
    RETURN processed_count;
END;
$$;


ALTER FUNCTION "public"."process_scheduled_automations"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."process_scheduled_automations"() IS 'Processes time-based automation rules';



CREATE OR REPLACE FUNCTION "public"."queue_background_task"("task_type" "text", "priority" "text" DEFAULT 'normal'::"text", "payload" "jsonb" DEFAULT '{}'::"jsonb", "user_id_param" "uuid" DEFAULT NULL::"uuid") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    task_id TEXT;
    queue_name TEXT;
    task_message JSONB;
BEGIN
    -- Generate unique task ID
    task_id := 'task_' || extract(epoch from now()) || '_' || floor(random() * 1000000);
    
    -- Determine queue based on priority
    queue_name := priority || '_tasks';
    
    -- Create task message
    task_message := jsonb_build_object(
        'task_id', task_id,
        'task_type', task_type,
        'priority', priority,
        'payload', payload,
        'user_id', user_id_param,
        'created_at', now()
    );
    
    -- Send message to appropriate queue
    PERFORM pgmq.send(queue_name, task_message);
    
    RETURN task_id;
END;
$$;


ALTER FUNCTION "public"."queue_background_task"("task_type" "text", "priority" "text", "payload" "jsonb", "user_id_param" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."read_queue_messages"("queue_name" "text", "batch_size" integer DEFAULT 10) RETURNS TABLE("msg_id" bigint, "read_ct" integer, "enqueued_at" timestamp with time zone, "message" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM pgmq.read(queue_name, 30, batch_size); -- 30 second visibility timeout
END;
$$;


ALTER FUNCTION "public"."read_queue_messages"("queue_name" "text", "batch_size" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."resolve_old_alerts"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."resolve_old_alerts"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."retry_failed_job"("p_job_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    job_record RECORD;
    retry_delay INTEGER;
    backoff_multiplier INTEGER := 2;
BEGIN
    SELECT jq.*, qc.retry_delay_seconds
    INTO job_record
    FROM public.job_queue jq
    JOIN public.queue_config qc ON jq.queue_name = qc.queue_name
    WHERE jq.id = p_job_id;
    
    IF NOT FOUND OR job_record.attempts >= job_record.max_attempts THEN
        RETURN FALSE;
    END IF;
    
    -- Calculate exponential backoff delay
    retry_delay := job_record.retry_delay_seconds * POWER(backoff_multiplier, job_record.attempts - 1);
    
    UPDATE public.job_queue
    SET 
        status = 'pending',
        scheduled_for = NOW() + (retry_delay || ' seconds')::INTERVAL,
        started_at = NULL,
        completed_at = NULL,
        error_message = NULL,
        worker_id = NULL,
        updated_at = NOW()
    WHERE id = p_job_id;
    
    RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."retry_failed_job"("p_job_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."schedule_grow_automation_jobs"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    scheduled_count INTEGER := 0;
BEGIN
    -- Schedule stage progression checks for active schedules
    WITH new_jobs AS (
        INSERT INTO public.job_queue (queue_name, job_type, payload, priority, scheduled_for)
        SELECT 
            'farm_automation',
            'check_stage_progression',
            jsonb_build_object(
                'schedule_id', s.id,
                'shelf_id', s.shelf_id,
                'current_stage_id', s.current_stage_id
            ),
            5, -- Medium priority
            NOW() + INTERVAL '1 hour'
        FROM public.schedules s
        WHERE s.status = 'active'
        AND s.id NOT IN (
            SELECT (payload->>'schedule_id')::UUID
            FROM public.job_queue
            WHERE queue_name = 'farm_automation'
            AND job_type = 'check_stage_progression'
            AND status IN ('pending', 'processing')
            AND (payload->>'schedule_id')::UUID = s.id
        )
        RETURNING 1
    )
    SELECT COUNT(*) INTO scheduled_count FROM new_jobs;
    
    -- Schedule harvest readiness checks
    WITH harvest_jobs AS (
        INSERT INTO public.job_queue (queue_name, job_type, payload, priority, scheduled_for)
        SELECT 
            'farm_automation',
            'check_harvest_readiness',
            jsonb_build_object(
                'schedule_id', s.id,
                'shelf_id', s.shelf_id,
                'estimated_end_date', s.estimated_end_date
            ),
            8, -- High priority for harvest checks
            NOW() + INTERVAL '6 hours'
        FROM public.schedules s
        WHERE s.status = 'active'
        AND s.estimated_end_date <= NOW() + INTERVAL '3 days'
        AND s.id NOT IN (
            SELECT (payload->>'schedule_id')::UUID
            FROM public.job_queue
            WHERE queue_name = 'farm_automation'
            AND job_type = 'check_harvest_readiness'
            AND status IN ('pending', 'processing')
            AND (payload->>'schedule_id')::UUID = s.id
        )
        RETURNING 1
    )
    SELECT scheduled_count + COUNT(*) INTO scheduled_count FROM harvest_jobs;
    
    RETURN scheduled_count;
END;
$$;


ALTER FUNCTION "public"."schedule_grow_automation_jobs"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."schedule_grow_automation_jobs"() IS 'Schedule automation jobs for active growing schedules';



CREATE OR REPLACE FUNCTION "public"."schedule_sensor_processing"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    scheduled_count INTEGER := 0;
BEGIN
    -- Process recent sensor readings that haven't been analyzed
    WITH sensor_jobs AS (
        INSERT INTO public.job_queue (queue_name, job_type, payload, priority)
        SELECT DISTINCT
            'sensor_processing',
            'analyze_sensor_data',
            jsonb_build_object(
                'device_assignment_id', sr.device_assignment_id,
                'sensor_type', sr.sensor_type,
                'time_window', '1 hour'
            ),
            3 -- Normal priority
        FROM public.sensor_readings sr
        WHERE sr.timestamp >= NOW() - INTERVAL '1 hour'
        AND sr.processed_at IS NULL
        AND NOT EXISTS (
            SELECT 1 FROM public.job_queue jq
            WHERE jq.queue_name = 'sensor_processing'
            AND jq.job_type = 'analyze_sensor_data'
            AND jq.status IN ('pending', 'processing')
            AND (jq.payload->>'device_assignment_id')::UUID = sr.device_assignment_id
            AND jq.payload->>'sensor_type' = sr.sensor_type
        )
        LIMIT 100 -- Batch processing limit
        RETURNING 1
    )
    SELECT COUNT(*) INTO scheduled_count FROM sensor_jobs;
    
    RETURN scheduled_count;
END;
$$;


ALTER FUNCTION "public"."schedule_sensor_processing"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_devices"("search_term" "text", "farm_uuid" "uuid" DEFAULT NULL::"uuid") RETURNS TABLE("device_id" "uuid", "entity_id" "text", "friendly_name" "text", "device_type" "text", "location_description" "text", "farm_name" "text", "relevance_score" real)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    da.id as device_id,
    da.entity_id,
    da.friendly_name,
    da.entity_type as device_type,
    CASE 
      WHEN da.shelf_id IS NOT NULL THEN 
        CONCAT(f.name, ' > ', r.name, ' > ', ra.name, ' > ', s.name)
      WHEN da.rack_id IS NOT NULL THEN 
        CONCAT(f.name, ' > ', r.name, ' > ', ra.name)
      WHEN da.row_id IS NOT NULL THEN 
        CONCAT(f.name, ' > ', r.name)
      WHEN da.farm_id IS NOT NULL THEN 
        f.name
      ELSE 'Unassigned'
    END as location_description,
    f.name as farm_name,
    (
      similarity(COALESCE(da.friendly_name, ''), search_term) +
      similarity(da.entity_id, search_term) +
      similarity(da.entity_type, search_term)
    ) / 3.0 as relevance_score  -- This naturally returns 'real' type
  FROM public.device_assignments da
  LEFT JOIN public.shelves s ON da.shelf_id = s.id
  LEFT JOIN public.racks ra ON da.rack_id = ra.id OR s.rack_id = ra.id
  LEFT JOIN public.rows r ON da.row_id = r.id OR ra.row_id = r.id
  LEFT JOIN public.farms f ON da.farm_id = f.id OR r.farm_id = f.id
  WHERE (
    COALESCE(da.friendly_name, '') ILIKE '%' || search_term || '%' OR
    da.entity_id ILIKE '%' || search_term || '%' OR
    da.entity_type ILIKE '%' || search_term || '%'
  )
  AND (farm_uuid IS NULL OR f.id = farm_uuid)
  AND (
    f.user_id = auth.uid() OR
    public.is_admin()
  )
  ORDER BY relevance_score DESC, da.friendly_name;
END;
$$;


ALTER FUNCTION "public"."search_devices"("search_term" "text", "farm_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."send_queue_message"("queue_name" "text", "message_data" "jsonb", "delay_seconds" integer DEFAULT 0) RETURNS bigint
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    message_id bigint;
BEGIN
    -- Send message to PGMQ queue
    SELECT pgmq.send(queue_name, message_data, delay_seconds) INTO message_id;
    
    -- Log the task
    INSERT INTO public.task_logs (
        queue_name,
        message_id,
        task_type,
        status,
        payload,
        created_at
    ) VALUES (
        queue_name,
        message_id,
        COALESCE(message_data->>'type', 'unknown'),
        'pending',
        message_data,
        now()
    );
    
    RETURN message_id;
END;
$$;


ALTER FUNCTION "public"."send_queue_message"("queue_name" "text", "message_data" "jsonb", "delay_seconds" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."setup_test_data"() RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    result json;
BEGIN
    -- Confirm test user email
    UPDATE auth.users 
    SET 
        email_confirmed_at = now(),
        updated_at = now()
    WHERE email = 'test@verticalfarm.app';
    
    -- Return success
    result := json_build_object(
        'success', true,
        'message', 'Test data setup completed'
    );
    
    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        result := json_build_object(
            'success', false,
            'error', SQLERRM
        );
        RETURN result;
END;
$$;


ALTER FUNCTION "public"."setup_test_data"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_automation_rule"("rule_id" "uuid", "context_data" "jsonb" DEFAULT '{}'::"jsonb") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    rule_record record;
    queue_payload jsonb;
BEGIN
    -- Get the automation rule
    SELECT * INTO rule_record
    FROM public.automation_rules
    WHERE id = rule_id AND is_active = true;
    
    IF NOT FOUND THEN
        RETURN false;
    END IF;
    
    -- Prepare queue payload
    queue_payload := jsonb_build_object(
        'rule_id', rule_id,
        'rule_name', rule_record.name,
        'trigger_type', rule_record.trigger_type,
        'actions', rule_record.actions,
        'context', context_data,
        'triggered_at', NOW()
    );
    
    -- Queue the automation for processing
    INSERT INTO pgmq.automation_queue (message)
    VALUES (queue_payload);
    
    -- Update rule last triggered
    UPDATE public.automation_rules
    SET last_triggered_at = NOW(),
        trigger_count = COALESCE(trigger_count, 0) + 1
    WHERE id = rule_id;
    
    RETURN true;
END;
$$;


ALTER FUNCTION "public"."trigger_automation_rule"("rule_id" "uuid", "context_data" "jsonb") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."trigger_automation_rule"("rule_id" "uuid", "context_data" "jsonb") IS 'Triggers automation rule execution via queue system';



CREATE OR REPLACE FUNCTION "public"."trigger_schedule_automation"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- When a schedule is created or updated to active, schedule automation jobs
    IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.status = 'active' AND OLD.status != 'active') THEN
        PERFORM public.enqueue_job(
            'farm_automation',
            'initialize_schedule_automation',
            jsonb_build_object(
                'schedule_id', NEW.id,
                'shelf_id', NEW.shelf_id,
                'grow_recipe_id', NEW.grow_recipe_id
            ),
            7 -- High priority for new schedules
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."trigger_schedule_automation"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_sensor_processing"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Queue sensor data for processing if it's a critical reading
    IF NEW.sensor_type IN ('temperature', 'humidity', 'ph', 'ec') THEN
        PERFORM pgmq.send(
            'sensor_processing',
            jsonb_build_object(
                'sensor_reading_id', NEW.id,
                'device_assignment_id', NEW.device_assignment_id,
                'sensor_type', NEW.sensor_type,
                'value', NEW.value,
                'timestamp', NEW.timestamp
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_sensor_processing"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_automation_timestamp"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_automation_timestamp"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_device_state"("p_user_id" "uuid", "p_entity_id" "text", "p_state" "text", "p_attributes" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    INSERT INTO device_states (user_id, home_assistant_entity_id, state, attributes, last_updated, last_changed)
    VALUES (p_user_id, p_entity_id, p_state, p_attributes, NOW(), NOW())
    ON CONFLICT (user_id, home_assistant_entity_id)
    DO UPDATE SET
        state = EXCLUDED.state,
        attributes = EXCLUDED.attributes,
        last_updated = NOW(),
        last_changed = CASE 
            WHEN device_states.state != EXCLUDED.state THEN NOW()
            ELSE device_states.last_changed
        END;
END;
$$;


ALTER FUNCTION "public"."update_device_state"("p_user_id" "uuid", "p_entity_id" "text", "p_state" "text", "p_attributes" "jsonb") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."update_device_state"("p_user_id" "uuid", "p_entity_id" "text", "p_state" "text", "p_attributes" "jsonb") IS 'Updates device state with automatic change tracking';



CREATE OR REPLACE FUNCTION "public"."update_grow_timestamp"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_grow_timestamp"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_sensor_alerts_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_sensor_alerts_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."user_can_access_farm"("farm_uuid" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    AS $$
DECLARE
    user_role text;
BEGIN
    SELECT role INTO user_role 
    FROM public.user_profiles 
    WHERE id = auth.uid();
    
    -- Admin can access all farms
    IF user_role = 'admin' THEN
        RETURN true;
    END IF;
    
    -- Check if user is the farm manager
    RETURN EXISTS (
        SELECT 1 FROM public.farms 
        WHERE id = farm_uuid AND user_id = auth.uid()
    );
END;
$$;


ALTER FUNCTION "public"."user_can_access_farm"("farm_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."uuid_generate_v4"() RETURNS "uuid"
    LANGUAGE "sql" IMMUTABLE PARALLEL SAFE
    AS $$
  SELECT extensions.uuid_generate_v4();
$$;


ALTER FUNCTION "public"."uuid_generate_v4"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_data_integrity"() RETURNS TABLE("table_name" "text", "issue_type" "text", "issue_count" integer, "fixed_count" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  orphaned_count integer;
  fixed_count integer;
BEGIN
  -- Check for orphaned device assignments
  SELECT COUNT(*) INTO orphaned_count
  FROM public.device_assignments da
  WHERE (da.farm_id IS NOT NULL AND da.farm_id NOT IN (SELECT id FROM public.farms))
     OR (da.row_id IS NOT NULL AND da.row_id NOT IN (SELECT id FROM public.rows))
     OR (da.rack_id IS NOT NULL AND da.rack_id NOT IN (SELECT id FROM public.racks))
     OR (da.shelf_id IS NOT NULL AND da.shelf_id NOT IN (SELECT id FROM public.shelves));
  
  RETURN QUERY SELECT 
    'device_assignments'::text,
    'orphaned_references'::text,
    orphaned_count,
    0;

  -- Check for farms without managers
  SELECT COUNT(*) INTO orphaned_count
  FROM public.farms
  WHERE user_id IS NULL;
  
  RETURN QUERY SELECT 
    'farms'::text,
    'missing_manager'::text,
    orphaned_count,
    0;

  -- Check for invalid user roles
  SELECT COUNT(*) INTO orphaned_count
  FROM public.user_profiles
  WHERE role NOT IN ('admin', 'farm_manager', 'operator', 'ha_power_user');
  
  RETURN QUERY SELECT 
    'user_profiles'::text,
    'invalid_role'::text,
    orphaned_count,
    0;
END;
$$;


ALTER FUNCTION "public"."validate_data_integrity"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."validate_data_integrity"() IS 'Validates and reports data integrity issues across the database';



CREATE OR REPLACE FUNCTION "public"."validate_device_assignment"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Ensure device is assigned to only one level of hierarchy
  IF (
    (NEW.shelf_id IS NOT NULL)::integer +
    (NEW.rack_id IS NOT NULL)::integer +
    (NEW.row_id IS NOT NULL)::integer +
    (NEW.farm_id IS NOT NULL)::integer
  ) != 1 THEN
    RAISE EXCEPTION 'Device must be assigned to exactly one level of hierarchy';
  END IF;
  
  -- Validate hierarchy consistency
  IF NEW.shelf_id IS NOT NULL THEN
    -- Validate shelf exists and get its hierarchy
    IF NOT EXISTS (
      SELECT 1 FROM public.shelves s
      JOIN public.racks ra ON s.rack_id = ra.id
      JOIN public.rows r ON ra.row_id = r.id
      JOIN public.farms f ON r.farm_id = f.id
      WHERE s.id = NEW.shelf_id
    ) THEN
      RAISE EXCEPTION 'Invalid shelf assignment - hierarchy incomplete';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."validate_device_assignment"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."device_assignments" (
    "id" "uuid" DEFAULT "public"."uuid_generate_v4"() NOT NULL,
    "shelf_id" "uuid",
    "rack_id" "uuid",
    "row_id" "uuid",
    "farm_id" "uuid",
    "entity_id" "text" NOT NULL,
    "entity_type" "text" NOT NULL,
    "friendly_name" "text",
    "assigned_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "integration_id" "uuid",
    "manual_url" "text",
    "installation_photos" "text"[],
    "user_id" "uuid",
    "location_id" "text",
    "home_assistant_entity_id" "text",
    "device_type" "text",
    "device_name" "text",
    "capabilities" "jsonb" DEFAULT '{}'::"jsonb",
    "is_active" boolean DEFAULT true,
    CONSTRAINT "chk_device_assignment_level" CHECK (((("shelf_id" IS NOT NULL) AND ("rack_id" IS NULL) AND ("row_id" IS NULL) AND ("farm_id" IS NULL)) OR (("shelf_id" IS NULL) AND ("rack_id" IS NOT NULL) AND ("row_id" IS NULL) AND ("farm_id" IS NULL)) OR (("shelf_id" IS NULL) AND ("rack_id" IS NULL) AND ("row_id" IS NOT NULL) AND ("farm_id" IS NULL)) OR (("shelf_id" IS NULL) AND ("rack_id" IS NULL) AND ("row_id" IS NULL) AND ("farm_id" IS NOT NULL)))),
    CONSTRAINT "device_assignments_device_type_check" CHECK (("device_type" = ANY (ARRAY['light'::"text", 'pump'::"text", 'fan'::"text", 'sensor'::"text"])))
);


ALTER TABLE "public"."device_assignments" OWNER TO "postgres";


COMMENT ON TABLE "public"."device_assignments" IS 'Maps Home Assistant entities to farm locations (rows, racks, shelves)';



COMMENT ON COLUMN "public"."device_assignments"."integration_id" IS 'Links device to its source integration (e.g., Home Assistant)';



COMMENT ON COLUMN "public"."device_assignments"."manual_url" IS 'URL to device manual or documentation';



COMMENT ON COLUMN "public"."device_assignments"."installation_photos" IS 'Array of URLs to device installation photos';



CREATE TABLE IF NOT EXISTS "public"."sensor_alert_thresholds" (
    "id" "uuid" DEFAULT "public"."uuid_generate_v4"() NOT NULL,
    "device_assignment_id" "uuid" NOT NULL,
    "sensor_type" "text" NOT NULL,
    "min_value" numeric,
    "max_value" numeric,
    "warning_min" numeric,
    "warning_max" numeric,
    "critical_min" numeric,
    "critical_max" numeric,
    "enabled" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."sensor_alert_thresholds" OWNER TO "postgres";


COMMENT ON TABLE "public"."sensor_alert_thresholds" IS 'Configuration for sensor alert thresholds per device';



CREATE TABLE IF NOT EXISTS "public"."sensor_alerts" (
    "id" "uuid" DEFAULT "public"."uuid_generate_v4"() NOT NULL,
    "device_assignment_id" "uuid" NOT NULL,
    "alert_type" "text" NOT NULL,
    "sensor_type" "text" NOT NULL,
    "current_value" numeric NOT NULL,
    "threshold_value" numeric NOT NULL,
    "severity" "text" NOT NULL,
    "message" "text" NOT NULL,
    "acknowledged" boolean DEFAULT false NOT NULL,
    "acknowledged_by" "uuid",
    "acknowledged_at" timestamp with time zone,
    "resolved" boolean DEFAULT false NOT NULL,
    "resolved_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "sensor_alerts_severity_check" CHECK (("severity" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text", 'critical'::"text"])))
);


ALTER TABLE "public"."sensor_alerts" OWNER TO "postgres";


COMMENT ON TABLE "public"."sensor_alerts" IS 'Real-time enabled: Critical sensor alerts requiring immediate attention';



CREATE OR REPLACE VIEW "public"."active_sensor_alerts" AS
 SELECT "sa"."id",
    "sa"."device_assignment_id",
    "sa"."alert_type",
    "sa"."sensor_type",
    "sa"."current_value",
    "sa"."threshold_value",
    "sa"."severity",
    "sa"."message",
    "sa"."acknowledged",
    "sa"."acknowledged_by",
    "sa"."acknowledged_at",
    "sa"."resolved",
    "sa"."resolved_at",
    "sa"."created_at",
    "sa"."updated_at",
    "da"."entity_id",
    "da"."friendly_name" AS "device_name",
    "da"."entity_type" AS "device_type",
    "sat"."warning_min",
    "sat"."warning_max",
    "sat"."critical_min",
    "sat"."critical_max"
   FROM (("public"."sensor_alerts" "sa"
     JOIN "public"."device_assignments" "da" ON (("sa"."device_assignment_id" = "da"."id")))
     LEFT JOIN "public"."sensor_alert_thresholds" "sat" ON ((("sa"."device_assignment_id" = "sat"."device_assignment_id") AND ("sa"."sensor_type" = "sat"."sensor_type"))))
  WHERE ("sa"."resolved" = false)
  ORDER BY
        CASE "sa"."severity"
            WHEN 'critical'::"text" THEN 1
            WHEN 'high'::"text" THEN 2
            WHEN 'medium'::"text" THEN 3
            WHEN 'low'::"text" THEN 4
            ELSE NULL::integer
        END, "sa"."created_at" DESC;


ALTER VIEW "public"."active_sensor_alerts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."alerts" (
    "id" "uuid" DEFAULT "public"."uuid_generate_v4"() NOT NULL,
    "schedule_id" "uuid",
    "device_assignment_id" "uuid",
    "farm_id" "uuid",
    "alert_type" "text" NOT NULL,
    "severity" "text" DEFAULT 'medium'::"text",
    "title" "text" NOT NULL,
    "message" "text",
    "is_resolved" boolean DEFAULT false,
    "resolved_at" timestamp with time zone,
    "resolved_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "alerts_severity_check" CHECK (("severity" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text", 'critical'::"text"])))
);


ALTER TABLE "public"."alerts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."automation_rules" (
    "id" "uuid" DEFAULT "public"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "farm_id" "uuid",
    "trigger_source_device_id" "uuid",
    "trigger_reading_type" "text",
    "trigger_condition" "text",
    "trigger_value" numeric,
    "action_target_device_id" "uuid",
    "action_type" "public"."action_type",
    "action_parameters" "jsonb",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."automation_rules" OWNER TO "postgres";


COMMENT ON TABLE "public"."automation_rules" IS 'Real-time enabled: Live updates for automation rule changes';



CREATE TABLE IF NOT EXISTS "public"."background_tasks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "task_type" "text" NOT NULL,
    "schedule_id" "uuid",
    "device_assignment_id" "uuid",
    "farm_id" "uuid",
    "payload" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "priority" "text" DEFAULT 'normal'::"text",
    "status" "text" DEFAULT 'pending'::"text",
    "attempts" integer DEFAULT 0,
    "max_attempts" integer DEFAULT 3,
    "scheduled_at" timestamp with time zone DEFAULT "now"(),
    "processed_at" timestamp with time zone,
    "error_message" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "background_tasks_priority_check" CHECK (("priority" = ANY (ARRAY['critical'::"text", 'high'::"text", 'normal'::"text", 'low'::"text"]))),
    CONSTRAINT "background_tasks_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'processing'::"text", 'completed'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."background_tasks" OWNER TO "postgres";


COMMENT ON TABLE "public"."background_tasks" IS 'Background task processing queue integrated with PGMQ';



CREATE TABLE IF NOT EXISTS "public"."crops" (
    "id" "uuid" DEFAULT "public"."uuid_generate_v4"() NOT NULL,
    "name" character varying(100) NOT NULL,
    "category" character varying(50) NOT NULL,
    "description" "text",
    "typical_grow_days" integer,
    "optimal_temp_min" numeric(4,1),
    "optimal_temp_max" numeric(4,1),
    "optimal_humidity_min" numeric(4,1),
    "optimal_humidity_max" numeric(4,1),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."crops" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."grow_alerts" (
    "id" "uuid" DEFAULT "public"."uuid_generate_v4"() NOT NULL,
    "grow_id" "uuid",
    "alert_type" character varying(50) NOT NULL,
    "message" "text" NOT NULL,
    "severity" character varying(20) DEFAULT 'info'::character varying,
    "is_resolved" boolean DEFAULT false,
    "resolved_at" timestamp with time zone,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "grow_alerts_severity_check" CHECK ((("severity")::"text" = ANY (ARRAY[('info'::character varying)::"text", ('warning'::character varying)::"text", ('error'::character varying)::"text", ('critical'::character varying)::"text"])))
);


ALTER TABLE "public"."grow_alerts" OWNER TO "postgres";


COMMENT ON TABLE "public"."grow_alerts" IS 'Alert management system with configurable severity levels';



CREATE TABLE IF NOT EXISTS "public"."grow_location_assignments" (
    "id" "uuid" DEFAULT "public"."uuid_generate_v4"() NOT NULL,
    "grow_id" "uuid",
    "location_id" "uuid",
    "assigned_at" timestamp with time zone DEFAULT "now"(),
    "removed_at" timestamp with time zone,
    "plant_count" integer DEFAULT 1
);


ALTER TABLE "public"."grow_location_assignments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."grow_locations" (
    "id" "uuid" DEFAULT "public"."uuid_generate_v4"() NOT NULL,
    "name" character varying(100) NOT NULL,
    "type" character varying(20) NOT NULL,
    "parent_id" "uuid",
    "capacity" integer DEFAULT 1 NOT NULL,
    "is_active" boolean DEFAULT true,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "grow_locations_type_check" CHECK ((("type")::"text" = ANY (ARRAY[('row'::character varying)::"text", ('rack'::character varying)::"text", ('shelf'::character varying)::"text"])))
);


ALTER TABLE "public"."grow_locations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."grow_recipes" (
    "id" "uuid" DEFAULT "public"."uuid_generate_v4"() NOT NULL,
    "species_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "grow_days" integer,
    "light_hours_per_day" numeric,
    "watering_frequency_hours" numeric,
    "target_temperature_min" numeric,
    "target_temperature_max" numeric,
    "target_humidity_min" numeric,
    "target_humidity_max" numeric,
    "target_ph_min" numeric,
    "target_ph_max" numeric,
    "target_ec_min" numeric,
    "target_ec_max" numeric,
    "average_yield" numeric,
    "sowing_rate" numeric,
    "custom_parameters" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "instruction_document_url" "text",
    "reference_image_url" "text",
    "recipe_source" "text",
    "germination_days" integer,
    "light_days" integer,
    "total_grow_days" integer,
    "top_coat" "text",
    "pythium_risk" "text",
    "water_intake" numeric(6,2),
    "water_frequency" "text",
    "lighting" "jsonb",
    "fridge_storage_temp" numeric(4,1),
    "difficulty" "text",
    "crop_id" "uuid",
    "is_template" boolean DEFAULT true,
    "created_by" "uuid",
    "success_rate" numeric(4,2) DEFAULT 0,
    "version" integer DEFAULT 1,
    "parent_recipe_id" "uuid",
    "parameters" "jsonb" DEFAULT '{}'::"jsonb",
    CONSTRAINT "grow_recipes_difficulty_check" CHECK (("difficulty" = ANY (ARRAY['Easy'::"text", 'Medium'::"text", 'Hard'::"text"]))),
    CONSTRAINT "grow_recipes_pythium_risk_check" CHECK (("pythium_risk" = ANY (ARRAY['Low'::"text", 'Medium'::"text", 'High'::"text"])))
);


ALTER TABLE "public"."grow_recipes" OWNER TO "postgres";


COMMENT ON TABLE "public"."grow_recipes" IS 'Growing recipes and templates for different crops';



COMMENT ON COLUMN "public"."grow_recipes"."average_yield" IS 'Average yield per tray (grams) - maps to avg_tray_yield';



COMMENT ON COLUMN "public"."grow_recipes"."sowing_rate" IS 'Seed density (grams or seeds per tray/area) - maps to seed_density_dry';



COMMENT ON COLUMN "public"."grow_recipes"."instruction_document_url" IS 'URL to detailed growing instructions document';



COMMENT ON COLUMN "public"."grow_recipes"."reference_image_url" IS 'URL to reference image for the recipe';



COMMENT ON COLUMN "public"."grow_recipes"."recipe_source" IS 'Source of the recipe (e.g., "Supplier X", "Internal R&D", "Community Forum")';



COMMENT ON COLUMN "public"."grow_recipes"."germination_days" IS 'Days required for germination phase';



COMMENT ON COLUMN "public"."grow_recipes"."light_days" IS 'Days requiring light exposure after germination';



COMMENT ON COLUMN "public"."grow_recipes"."total_grow_days" IS 'Total grow cycle days (may be calculated or manually set)';



COMMENT ON COLUMN "public"."grow_recipes"."top_coat" IS 'Top coat material used after seeding (e.g., "Vermiculite", "None")';



COMMENT ON COLUMN "public"."grow_recipes"."pythium_risk" IS 'Risk assessment for Pythium infection';



COMMENT ON COLUMN "public"."grow_recipes"."water_intake" IS 'Water consumption per tray per watering session (ml)';



COMMENT ON COLUMN "public"."grow_recipes"."water_frequency" IS 'Descriptive watering frequency pattern';



COMMENT ON COLUMN "public"."grow_recipes"."lighting" IS 'Complex lighting schedule and parameters in JSON format';



COMMENT ON COLUMN "public"."grow_recipes"."fridge_storage_temp" IS 'Optimal post-harvest refrigeration temperature (Celsius)';



COMMENT ON COLUMN "public"."grow_recipes"."difficulty" IS 'Subjective difficulty rating for growing this recipe';



COMMENT ON COLUMN "public"."grow_recipes"."crop_id" IS 'Reference to the crop type this recipe is for';



COMMENT ON COLUMN "public"."grow_recipes"."is_template" IS 'Whether this recipe is a template or an instance';



COMMENT ON COLUMN "public"."grow_recipes"."created_by" IS 'User who created this recipe';



COMMENT ON COLUMN "public"."grow_recipes"."success_rate" IS 'Historical success rate of this recipe (0-100)';



COMMENT ON COLUMN "public"."grow_recipes"."version" IS 'Version number for recipe iterations';



COMMENT ON COLUMN "public"."grow_recipes"."parent_recipe_id" IS 'Reference to parent recipe if this is a variant';



COMMENT ON COLUMN "public"."grow_recipes"."parameters" IS 'Additional flexible parameters in JSON format (complements specific columns)';



CREATE TABLE IF NOT EXISTS "public"."grow_stages" (
    "id" "uuid" DEFAULT "public"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "stage_type" "public"."grow_stage_type" NOT NULL,
    "order_index" integer NOT NULL,
    "description" "text",
    "typical_duration_days" integer,
    "color_code" "text" DEFAULT '#22c55e'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "crop_type" character varying(50),
    "stage_name" character varying(50),
    "stage_order" integer,
    "expected_duration_days" integer,
    "milestone_description" "text",
    "optimal_conditions" "jsonb"
);


ALTER TABLE "public"."grow_stages" OWNER TO "postgres";


COMMENT ON TABLE "public"."grow_stages" IS 'Reference data defining growth stages for different crop types';



CREATE TABLE IF NOT EXISTS "public"."grows" (
    "id" "uuid" DEFAULT "public"."uuid_generate_v4"() NOT NULL,
    "name" character varying(100) NOT NULL,
    "seed_variety_id" "uuid" NOT NULL,
    "recipe_id" "uuid",
    "current_stage_id" "uuid",
    "status" character varying(20) DEFAULT 'planned'::character varying,
    "plant_count" integer DEFAULT 1 NOT NULL,
    "planted_date" "date",
    "expected_harvest_date" "date",
    "actual_harvest_date" "date",
    "notes" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "automation_enabled" boolean DEFAULT true,
    "device_profile_id" "uuid",
    CONSTRAINT "grows_status_check" CHECK ((("status")::"text" = ANY (ARRAY[('planned'::character varying)::"text", ('active'::character varying)::"text", ('harvested'::character varying)::"text", ('failed'::character varying)::"text", ('paused'::character varying)::"text"])))
);


ALTER TABLE "public"."grows" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."seed_varieties" (
    "id" "uuid" DEFAULT "public"."uuid_generate_v4"() NOT NULL,
    "species_id" "uuid" NOT NULL,
    "variety_name" "text" NOT NULL,
    "supplier" "text",
    "days_to_germination" integer,
    "days_to_harvest" integer,
    "yield_per_plant" numeric,
    "sowing_rate" numeric,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "crop_id" "uuid",
    "notes" "text"
);


ALTER TABLE "public"."seed_varieties" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."species" (
    "id" "uuid" DEFAULT "public"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."species" OWNER TO "postgres";


COMMENT ON TABLE "public"."species" IS 'Plant species and crop varieties';



CREATE OR REPLACE VIEW "public"."current_grows_view" AS
 SELECT "g"."id",
    "g"."name",
    "g"."status",
    "g"."plant_count",
    "g"."planted_date",
    "g"."expected_harvest_date",
    "g"."notes",
    "g"."created_at",
    "sv"."variety_name",
    "sp"."name" AS "crop_name",
    "gs"."name" AS "current_stage",
    "gs"."color_code" AS "stage_color",
    "gs"."order_index" AS "stage_order",
    "gr"."name" AS "recipe_name",
    "gl"."location_name",
    "gl"."location_count",
        CASE
            WHEN ("g"."planted_date" IS NULL) THEN (0)::numeric
            WHEN ("g"."expected_harvest_date" IS NULL) THEN (50)::numeric
            ELSE LEAST((100)::numeric, "round"(((EXTRACT(epoch FROM ("now"() - (("g"."planted_date")::timestamp without time zone)::timestamp with time zone)) / EXTRACT(epoch FROM (("g"."expected_harvest_date")::timestamp without time zone - ("g"."planted_date")::timestamp without time zone))) * (100)::numeric)))
        END AS "progress_percentage",
        CASE
            WHEN ("g"."planted_date" IS NULL) THEN NULL::integer
            ELSE (EXTRACT(days FROM ("now"() - (("g"."planted_date")::timestamp without time zone)::timestamp with time zone)))::integer
        END AS "days_since_planted",
        CASE
            WHEN ("g"."expected_harvest_date" IS NULL) THEN NULL::integer
            ELSE ("g"."expected_harvest_date" - CURRENT_DATE)
        END AS "days_to_harvest",
    COALESCE("ga"."alert_count", (0)::bigint) AS "active_alerts",
    NULL::"jsonb" AS "recent_sensor_data"
   FROM (((((("public"."grows" "g"
     LEFT JOIN "public"."seed_varieties" "sv" ON (("g"."seed_variety_id" = "sv"."id")))
     LEFT JOIN "public"."species" "sp" ON (("sv"."species_id" = "sp"."id")))
     LEFT JOIN "public"."grow_stages" "gs" ON (("g"."current_stage_id" = "gs"."id")))
     LEFT JOIN "public"."grow_recipes" "gr" ON (("g"."recipe_id" = "gr"."id")))
     LEFT JOIN ( SELECT "gla"."grow_id",
            "string_agg"(DISTINCT ("gl_1"."name")::"text", ', '::"text") AS "location_name",
            "count"(DISTINCT "gl_1"."id") AS "location_count"
           FROM ("public"."grow_location_assignments" "gla"
             JOIN "public"."grow_locations" "gl_1" ON (("gla"."location_id" = "gl_1"."id")))
          GROUP BY "gla"."grow_id") "gl" ON (("g"."id" = "gl"."grow_id")))
     LEFT JOIN ( SELECT "grow_alerts"."grow_id",
            "count"(*) AS "alert_count"
           FROM "public"."grow_alerts"
          WHERE ("grow_alerts"."is_resolved" = false)
          GROUP BY "grow_alerts"."grow_id") "ga" ON (("g"."id" = "ga"."grow_id")))
  WHERE (("g"."status")::"text" = ANY (ARRAY[('active'::character varying)::"text", ('planned'::character varying)::"text"]))
  ORDER BY "g"."created_at" DESC;


ALTER VIEW "public"."current_grows_view" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."device_control_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "home_assistant_entity_id" "text" NOT NULL,
    "action_type" "text" NOT NULL,
    "previous_state" "text",
    "new_state" "text",
    "triggered_by" "text" DEFAULT 'manual'::"text",
    "success" boolean DEFAULT true,
    "error_message" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."device_control_history" OWNER TO "postgres";


COMMENT ON TABLE "public"."device_control_history" IS 'Audit trail of all device control actions';



CREATE TABLE IF NOT EXISTS "public"."device_history" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "entity_id" "text" NOT NULL,
    "state" "text",
    "attributes" "jsonb",
    "recorded_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."device_history" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."device_history_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."device_history_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."device_history_id_seq" OWNED BY "public"."device_history"."id";



CREATE TABLE IF NOT EXISTS "public"."device_schedules" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "entity_ids" "text"[] NOT NULL,
    "action" "text" NOT NULL,
    "value" integer,
    "cron_expression" "text" NOT NULL,
    "is_active" boolean DEFAULT true,
    "last_executed" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."device_schedules" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."device_schedules_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."device_schedules_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."device_schedules_id_seq" OWNED BY "public"."device_schedules"."id";



CREATE TABLE IF NOT EXISTS "public"."device_states" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "home_assistant_entity_id" "text" NOT NULL,
    "state" "text" NOT NULL,
    "attributes" "jsonb" DEFAULT '{}'::"jsonb",
    "last_updated" timestamp with time zone DEFAULT "now"(),
    "last_changed" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."device_states" OWNER TO "postgres";


COMMENT ON TABLE "public"."device_states" IS 'Cached device states for performance and offline capability';



CREATE TABLE IF NOT EXISTS "public"."farms" (
    "id" "uuid" DEFAULT "public"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "location" "text",
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "documentation_folder_path" "text",
    "farm_image_url" "text"
);


ALTER TABLE "public"."farms" OWNER TO "postgres";


COMMENT ON TABLE "public"."farms" IS 'Top-level farm locations';



COMMENT ON COLUMN "public"."farms"."user_id" IS 'References the user who owns/manages this farm';



COMMENT ON COLUMN "public"."farms"."documentation_folder_path" IS 'Path to farm documentation folder in storage';



COMMENT ON COLUMN "public"."farms"."farm_image_url" IS 'URL to farm overview image';



CREATE TABLE IF NOT EXISTS "public"."harvests" (
    "id" "uuid" DEFAULT "public"."uuid_generate_v4"() NOT NULL,
    "shelf_id" "uuid" NOT NULL,
    "yield_amount" numeric NOT NULL,
    "yield_unit" "text" NOT NULL,
    "harvest_date" timestamp with time zone DEFAULT "now"() NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "photo_urls" "text"[],
    "documentation_urls" "text"[],
    "created_by" "uuid",
    "grow_id" "uuid" NOT NULL,
    "yield_grams" numeric GENERATED ALWAYS AS (
CASE
    WHEN (("yield_unit" = 'grams'::"text") OR ("yield_unit" = 'g'::"text")) THEN "yield_amount"
    WHEN (("yield_unit" = 'kilograms'::"text") OR ("yield_unit" = 'kg'::"text")) THEN ("yield_amount" * (1000)::numeric)
    WHEN (("yield_unit" = 'pounds'::"text") OR ("yield_unit" = 'lbs'::"text")) THEN ("yield_amount" * 453.592)
    WHEN (("yield_unit" = 'ounces'::"text") OR ("yield_unit" = 'oz'::"text")) THEN ("yield_amount" * 28.3495)
    ELSE "yield_amount"
END) STORED,
    "quality_rating" integer DEFAULT 5,
    CONSTRAINT "harvests_quality_rating_check" CHECK ((("quality_rating" >= 1) AND ("quality_rating" <= 10)))
);


ALTER TABLE "public"."harvests" OWNER TO "postgres";


COMMENT ON TABLE "public"."harvests" IS 'Harvest records and yield tracking';



COMMENT ON COLUMN "public"."harvests"."photo_urls" IS 'Array of URLs to harvest photos';



COMMENT ON COLUMN "public"."harvests"."documentation_urls" IS 'Array of URLs to harvest documentation';



CREATE OR REPLACE VIEW "public"."grow_analytics_view" AS
 SELECT "g"."id",
    "g"."name",
    "g"."status",
    "g"."plant_count",
    "g"."planted_date",
    "g"."expected_harvest_date",
    "g"."actual_harvest_date",
    "sp"."name" AS "crop_name",
    "sv"."variety_name",
        CASE
            WHEN (("g"."actual_harvest_date" IS NOT NULL) AND ("g"."planted_date" IS NOT NULL)) THEN ("g"."actual_harvest_date" - "g"."planted_date")
            WHEN ("g"."planted_date" IS NOT NULL) THEN (CURRENT_DATE - "g"."planted_date")
            ELSE NULL::integer
        END AS "total_days",
    COALESCE("h"."total_harvest", (0)::numeric) AS "total_yield",
    COALESCE("h"."harvest_count", (0)::bigint) AS "harvest_sessions",
    COALESCE("h"."avg_quality", (0)::numeric) AS "average_quality",
        CASE
            WHEN (("g"."plant_count" > 0) AND ("h"."total_harvest" > (0)::numeric)) THEN "round"(("h"."total_harvest" / ("g"."plant_count")::numeric), 2)
            ELSE (0)::numeric
        END AS "yield_per_plant",
        CASE
            WHEN (("g"."status")::"text" = 'harvested'::"text") THEN
            CASE
                WHEN ("h"."total_harvest" > (0)::numeric) THEN 100
                ELSE 50
            END
            WHEN (("g"."status")::"text" = 'failed'::"text") THEN 0
            WHEN (("g"."status")::"text" = 'active'::"text") THEN 75
            ELSE 50
        END AS "success_rating",
    "gr"."name" AS "recipe_name",
    "gr"."success_rate" AS "recipe_success_rate",
    "g"."created_at",
    "g"."updated_at"
   FROM (((("public"."grows" "g"
     LEFT JOIN "public"."seed_varieties" "sv" ON (("g"."seed_variety_id" = "sv"."id")))
     LEFT JOIN "public"."species" "sp" ON (("sv"."species_id" = "sp"."id")))
     LEFT JOIN "public"."grow_recipes" "gr" ON (("g"."recipe_id" = "gr"."id")))
     LEFT JOIN ( SELECT "harvests"."grow_id",
            "sum"("harvests"."yield_grams") AS "total_harvest",
            "count"(*) AS "harvest_count",
            "avg"("harvests"."quality_rating") AS "avg_quality"
           FROM "public"."harvests"
          GROUP BY "harvests"."grow_id") "h" ON (("g"."id" = "h"."grow_id")))
  WHERE (("g"."status")::"text" = ANY (ARRAY[('harvested'::character varying)::"text", ('failed'::character varying)::"text"]))
  ORDER BY "g"."updated_at" DESC;


ALTER VIEW "public"."grow_analytics_view" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."grow_automation_conditions" (
    "id" "uuid" DEFAULT "public"."uuid_generate_v4"() NOT NULL,
    "grow_id" "uuid",
    "device_assignment_id" "uuid",
    "condition_name" character varying(100) NOT NULL,
    "sensor_entity_id" character varying(255) NOT NULL,
    "condition_type" character varying(30) NOT NULL,
    "threshold_value" numeric(10,2),
    "threshold_min" numeric(10,2),
    "threshold_max" numeric(10,2),
    "device_action" "jsonb" NOT NULL,
    "cooldown_minutes" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "last_triggered_at" timestamp with time zone,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."grow_automation_conditions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."grow_automation_executions" (
    "id" "uuid" DEFAULT "public"."uuid_generate_v4"() NOT NULL,
    "grow_id" "uuid",
    "automation_type" character varying(50) NOT NULL,
    "automation_id" "uuid",
    "device_assignment_id" "uuid",
    "action_taken" "jsonb" NOT NULL,
    "execution_status" character varying(30) DEFAULT 'pending'::character varying,
    "execution_result" "jsonb",
    "error_message" "text",
    "executed_at" timestamp with time zone DEFAULT "now"(),
    "completed_at" timestamp with time zone
);


ALTER TABLE "public"."grow_automation_executions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."grow_automation_rules" (
    "id" "uuid" DEFAULT "public"."uuid_generate_v4"() NOT NULL,
    "grow_id" "uuid",
    "device_assignment_id" "uuid",
    "rule_type" character varying(50) NOT NULL,
    "rule_config" "jsonb" NOT NULL,
    "is_active" boolean DEFAULT true,
    "priority" integer DEFAULT 0,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."grow_automation_rules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."grow_automation_schedules" (
    "id" "uuid" DEFAULT "public"."uuid_generate_v4"() NOT NULL,
    "grow_id" "uuid",
    "device_assignment_id" "uuid",
    "schedule_name" character varying(100) NOT NULL,
    "schedule_type" character varying(30) NOT NULL,
    "cron_expression" character varying(100),
    "device_action" "jsonb" NOT NULL,
    "is_active" boolean DEFAULT true,
    "starts_at" timestamp with time zone,
    "ends_at" timestamp with time zone,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."grow_automation_schedules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."grow_device_profiles" (
    "id" "uuid" DEFAULT "public"."uuid_generate_v4"() NOT NULL,
    "profile_name" character varying(100) NOT NULL,
    "crop_id" "uuid",
    "grow_stage_id" "uuid",
    "device_type" character varying(50) NOT NULL,
    "profile_config" "jsonb" NOT NULL,
    "description" "text",
    "is_template" boolean DEFAULT true,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."grow_device_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."grow_events" (
    "id" "uuid" DEFAULT "public"."uuid_generate_v4"() NOT NULL,
    "grow_id" "uuid",
    "event_type" character varying(50) NOT NULL,
    "description" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."grow_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."grow_monitoring_metrics" (
    "id" "uuid" DEFAULT "public"."uuid_generate_v4"() NOT NULL,
    "grow_id" "uuid" NOT NULL,
    "shelf_id" "uuid",
    "metric_type" character varying(50) NOT NULL,
    "value" numeric(10,4) NOT NULL,
    "unit" character varying(20) NOT NULL,
    "source_entity_id" character varying(100),
    "source_type" character varying(30) DEFAULT 'sensor'::character varying,
    "recorded_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "valid_metric_value" CHECK (("value" IS NOT NULL))
);


ALTER TABLE "public"."grow_monitoring_metrics" OWNER TO "postgres";


COMMENT ON TABLE "public"."grow_monitoring_metrics" IS 'Time-series storage for environmental and sensor metrics';



CREATE TABLE IF NOT EXISTS "public"."grow_observations" (
    "id" "uuid" DEFAULT "public"."uuid_generate_v4"() NOT NULL,
    "grow_id" "uuid" NOT NULL,
    "observation_type" "public"."observation_type" NOT NULL,
    "title" character varying(200) NOT NULL,
    "notes" "text",
    "images" "text"[] DEFAULT ARRAY[]::"text"[],
    "measurements" "jsonb",
    "tags" "text"[] DEFAULT ARRAY[]::"text"[],
    "shelf_id" "uuid",
    "recorded_by" "uuid" NOT NULL,
    "recorded_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."grow_observations" OWNER TO "postgres";


COMMENT ON TABLE "public"."grow_observations" IS 'Manual observations and notes recorded by users';



CREATE OR REPLACE VIEW "public"."grow_overview" WITH ("security_invoker"='true') AS
 SELECT "g"."id",
    "g"."name",
    "g"."status",
    "g"."plant_count",
    "g"."planted_date",
    "g"."expected_harvest_date",
    "g"."actual_harvest_date",
    "gs"."name" AS "current_stage",
    "gs"."color_code" AS "stage_color",
    "c"."name" AS "crop_name",
    "c"."category" AS "crop_category",
    "sv"."variety_name",
    "gr"."name" AS "recipe_name",
    "gr"."difficulty",
    "gr"."total_grow_days",
    "g"."created_by",
    "g"."created_at",
    "g"."updated_at"
   FROM (((("public"."grows" "g"
     LEFT JOIN "public"."grow_stages" "gs" ON (("g"."current_stage_id" = "gs"."id")))
     LEFT JOIN "public"."seed_varieties" "sv" ON (("g"."seed_variety_id" = "sv"."id")))
     LEFT JOIN "public"."crops" "c" ON (("sv"."crop_id" = "c"."id")))
     LEFT JOIN "public"."grow_recipes" "gr" ON (("g"."recipe_id" = "gr"."id")));


ALTER VIEW "public"."grow_overview" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."grow_parameters" (
    "id" "uuid" DEFAULT "public"."uuid_generate_v4"() NOT NULL,
    "grow_id" "uuid",
    "parameter_type" character varying(50) NOT NULL,
    "value" "jsonb" NOT NULL,
    "unit" character varying(20),
    "effective_from" timestamp with time zone DEFAULT "now"(),
    "effective_until" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."grow_parameters" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."grow_progress" (
    "id" "uuid" DEFAULT "public"."uuid_generate_v4"() NOT NULL,
    "grow_id" "uuid" NOT NULL,
    "current_stage_id" "uuid" NOT NULL,
    "stage_started_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expected_stage_end" timestamp with time zone,
    "milestones_achieved" "jsonb" DEFAULT '[]'::"jsonb",
    "notes" "text",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."grow_progress" OWNER TO "postgres";


COMMENT ON TABLE "public"."grow_progress" IS 'Tracks current growth stage and milestone progress for each grow';



CREATE TABLE IF NOT EXISTS "public"."home_assistant_devices" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "entity_id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "device_type" "text" NOT NULL,
    "state" "text",
    "attributes" "jsonb",
    "farm_location" "jsonb",
    "is_assigned" boolean DEFAULT false,
    "last_seen" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."home_assistant_devices" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."home_assistant_devices_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."home_assistant_devices_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."home_assistant_devices_id_seq" OWNED BY "public"."home_assistant_devices"."id";



CREATE TABLE IF NOT EXISTS "public"."integration_sync_log" (
    "id" bigint NOT NULL,
    "integration_id" "uuid" NOT NULL,
    "event_type" "text" NOT NULL,
    "message" "text",
    "device_count" integer,
    "duration_ms" integer,
    "timestamp" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."integration_sync_log" OWNER TO "postgres";


COMMENT ON TABLE "public"."integration_sync_log" IS 'Logs integration events and sync history for monitoring and debugging';



CREATE SEQUENCE IF NOT EXISTS "public"."integration_sync_log_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."integration_sync_log_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."integration_sync_log_id_seq" OWNED BY "public"."integration_sync_log"."id";



CREATE TABLE IF NOT EXISTS "public"."integrations" (
    "id" "uuid" DEFAULT "public"."uuid_generate_v4"() NOT NULL,
    "type" "public"."integration_type" NOT NULL,
    "name" "text" NOT NULL,
    "url" "text",
    "status" "public"."integration_status" DEFAULT 'disconnected'::"public"."integration_status" NOT NULL,
    "last_sync" timestamp with time zone,
    "device_count" integer DEFAULT 0,
    "version" "text",
    "error_message" "text",
    "configuration" "jsonb",
    "enabled" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "user_id" "uuid",
    "config" "jsonb" DEFAULT '{}'::"jsonb",
    "health_status" "text" DEFAULT 'unknown'::"text",
    "last_health_check" timestamp with time zone,
    "response_time" integer,
    "is_active" boolean DEFAULT true,
    CONSTRAINT "integrations_health_status_check" CHECK (("health_status" = ANY (ARRAY['healthy'::"text", 'unhealthy'::"text", 'unknown'::"text"])))
);


ALTER TABLE "public"."integrations" OWNER TO "postgres";


COMMENT ON TABLE "public"."integrations" IS 'External integrations like Home Assistant, MQTT brokers, etc.';



CREATE TABLE IF NOT EXISTS "public"."job_queue" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "queue_name" "text" NOT NULL,
    "job_type" "text" NOT NULL,
    "payload" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "priority" integer DEFAULT 0,
    "status" "text" DEFAULT 'pending'::"text",
    "attempts" integer DEFAULT 0,
    "max_attempts" integer DEFAULT 3,
    "scheduled_for" timestamp with time zone DEFAULT "now"(),
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "error_message" "text",
    "execution_time_ms" integer,
    "worker_id" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "job_queue_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'processing'::"text", 'completed'::"text", 'failed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."job_queue" OWNER TO "postgres";


COMMENT ON TABLE "public"."job_queue" IS 'Main job queue for complex automation tasks with priority and retry logic';



CREATE TABLE IF NOT EXISTS "public"."monitoring_thresholds" (
    "id" "uuid" DEFAULT "public"."uuid_generate_v4"() NOT NULL,
    "crop_type" character varying(50) NOT NULL,
    "stage_id" "uuid",
    "metric_type" character varying(50) NOT NULL,
    "min_value" numeric(10,4),
    "max_value" numeric(10,4),
    "optimal_min" numeric(10,4),
    "optimal_max" numeric(10,4),
    "severity" "public"."alert_severity" DEFAULT 'medium'::"public"."alert_severity" NOT NULL,
    "unit" character varying(20) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "valid_threshold_range" CHECK (((("min_value" IS NULL) OR ("max_value" IS NULL) OR ("min_value" <= "max_value")) AND (("optimal_min" IS NULL) OR ("optimal_max" IS NULL) OR ("optimal_min" <= "optimal_max"))))
);


ALTER TABLE "public"."monitoring_thresholds" OWNER TO "postgres";


COMMENT ON TABLE "public"."monitoring_thresholds" IS 'Configurable alert thresholds per crop type and growth stage';



CREATE TABLE IF NOT EXISTS "public"."queue_config" (
    "queue_name" "text" NOT NULL,
    "is_active" boolean DEFAULT true,
    "max_concurrent_jobs" integer DEFAULT 5,
    "retry_delay_seconds" integer DEFAULT 300,
    "max_job_runtime_seconds" integer DEFAULT 3600,
    "priority_weight" numeric DEFAULT 1.0,
    "auto_cleanup_days" integer DEFAULT 7,
    "notification_settings" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."queue_config" OWNER TO "postgres";


COMMENT ON TABLE "public"."queue_config" IS 'Configuration settings for different queue types';



CREATE TABLE IF NOT EXISTS "public"."racks" (
    "id" "uuid" DEFAULT "public"."uuid_generate_v4"() NOT NULL,
    "row_id" "uuid" NOT NULL,
    "name" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."racks" OWNER TO "postgres";


COMMENT ON TABLE "public"."racks" IS 'Racks within rows containing multiple shelves';



CREATE OR REPLACE VIEW "public"."realtime_status" AS
 SELECT 'user_home_assistant_configs'::"text" AS "table_name",
    'Live HA integration updates'::"text" AS "description",
    true AS "enabled"
UNION ALL
 SELECT 'user_device_configs'::"text" AS "table_name",
    'Live device configuration updates'::"text" AS "description",
    true AS "enabled"
UNION ALL
 SELECT 'device_assignments'::"text" AS "table_name",
    'Live device assignment updates'::"text" AS "description",
    true AS "enabled"
UNION ALL
 SELECT 'sensor_readings'::"text" AS "table_name",
    'Live sensor data (high frequency)'::"text" AS "description",
    true AS "enabled"
UNION ALL
 SELECT 'schedules'::"text" AS "table_name",
    'Live grow schedule updates'::"text" AS "description",
    true AS "enabled"
UNION ALL
 SELECT 'automation_rules'::"text" AS "table_name",
    'Live automation rule updates'::"text" AS "description",
    true AS "enabled";


ALTER VIEW "public"."realtime_status" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."recipe_performance_view" AS
 SELECT "gr"."id",
    "gr"."name",
    COALESCE("gr"."instruction_document_url", 'No description available'::"text") AS "description",
    COALESCE("gr"."version", 1) AS "version",
    COALESCE("gr"."is_template", false) AS "is_template",
    "sp"."name" AS "crop_name",
    COALESCE("usage"."times_used", (0)::bigint) AS "times_used",
    COALESCE("usage"."successful_grows", (0)::bigint) AS "successful_grows",
    COALESCE("usage"."failed_grows", (0)::bigint) AS "failed_grows",
        CASE
            WHEN (COALESCE("usage"."times_used", (0)::bigint) > 0) THEN "round"((((COALESCE("usage"."successful_grows", (0)::bigint))::numeric / ("usage"."times_used")::numeric) * (100)::numeric), 1)
            ELSE (0)::numeric
        END AS "success_rate",
    COALESCE("usage"."avg_grow_days", (0)::numeric) AS "avg_grow_days",
    COALESCE("usage"."avg_yield_per_plant", (0)::numeric) AS "avg_yield_per_plant",
    "gr"."created_at",
    "gr"."updated_at"
   FROM (("public"."grow_recipes" "gr"
     LEFT JOIN "public"."species" "sp" ON (("gr"."species_id" = "sp"."id")))
     LEFT JOIN ( SELECT "g"."recipe_id",
            "count"(*) AS "times_used",
            "count"(
                CASE
                    WHEN (("g"."status")::"text" = 'harvested'::"text") THEN 1
                    ELSE NULL::integer
                END) AS "successful_grows",
            "count"(
                CASE
                    WHEN (("g"."status")::"text" = 'failed'::"text") THEN 1
                    ELSE NULL::integer
                END) AS "failed_grows",
            "avg"(
                CASE
                    WHEN (("g"."actual_harvest_date" IS NOT NULL) AND ("g"."planted_date" IS NOT NULL)) THEN ("g"."actual_harvest_date" - "g"."planted_date")
                    ELSE NULL::integer
                END) AS "avg_grow_days",
            "avg"(
                CASE
                    WHEN (("h"."total_harvest" > (0)::numeric) AND ("g"."plant_count" > 0)) THEN ("h"."total_harvest" / ("g"."plant_count")::numeric)
                    ELSE NULL::numeric
                END) AS "avg_yield_per_plant"
           FROM ("public"."grows" "g"
             LEFT JOIN ( SELECT "harvests"."grow_id",
                    "sum"("harvests"."yield_grams") AS "total_harvest"
                   FROM "public"."harvests"
                  GROUP BY "harvests"."grow_id") "h" ON (("g"."id" = "h"."grow_id")))
          WHERE ("g"."recipe_id" IS NOT NULL)
          GROUP BY "g"."recipe_id") "usage" ON (("gr"."id" = "usage"."recipe_id")));


ALTER VIEW "public"."recipe_performance_view" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."recipe_stage_parameters" (
    "id" "uuid" DEFAULT "public"."uuid_generate_v4"() NOT NULL,
    "recipe_id" "uuid" NOT NULL,
    "stage_id" "uuid" NOT NULL,
    "duration_days" integer,
    "light_hours_per_day" numeric,
    "target_temperature_min" numeric,
    "target_temperature_max" numeric,
    "target_humidity_min" numeric,
    "target_humidity_max" numeric,
    "watering_frequency_hours" numeric,
    "parameters" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."recipe_stage_parameters" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rows" (
    "id" "uuid" DEFAULT "public"."uuid_generate_v4"() NOT NULL,
    "farm_id" "uuid" NOT NULL,
    "name" "text",
    "orientation" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."rows" OWNER TO "postgres";


COMMENT ON TABLE "public"."rows" IS 'Rows within farms containing multiple racks';



CREATE TABLE IF NOT EXISTS "public"."schedule_events" (
    "id" "uuid" DEFAULT "public"."uuid_generate_v4"() NOT NULL,
    "schedule_id" "uuid" NOT NULL,
    "event_type" "text" NOT NULL,
    "description" "text",
    "stage_id" "uuid",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."schedule_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."scheduled_actions" (
    "id" "uuid" DEFAULT "public"."uuid_generate_v4"() NOT NULL,
    "schedule_id" "uuid",
    "device_assignment_id" "uuid",
    "action_type" "public"."action_type" NOT NULL,
    "parameters" "jsonb",
    "execution_time" timestamp with time zone NOT NULL,
    "status" "public"."action_status" DEFAULT 'pending'::"public"."action_status" NOT NULL,
    "executed_at" timestamp with time zone,
    "error_message" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."scheduled_actions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."schedules" (
    "id" "uuid" DEFAULT "public"."uuid_generate_v4"() NOT NULL,
    "shelf_id" "uuid" NOT NULL,
    "grow_recipe_id" "uuid" NOT NULL,
    "start_date" timestamp with time zone NOT NULL,
    "estimated_end_date" timestamp with time zone,
    "actual_end_date" timestamp with time zone,
    "status" "public"."schedule_status" DEFAULT 'planned'::"public"."schedule_status" NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."schedules" OWNER TO "postgres";


COMMENT ON TABLE "public"."schedules" IS 'Active growing schedules on shelves';



CREATE OR REPLACE VIEW "public"."security_audit_view" AS
 SELECT 'user_profiles'::"text" AS "table_name",
    'Row Level Security enabled'::"text" AS "security_status",
    'Users can only access their own profiles'::"text" AS "policy_summary"
UNION ALL
 SELECT 'user_home_assistant_configs'::"text" AS "table_name",
    'Row Level Security enabled'::"text" AS "security_status",
    'Users can only access their own HA configs'::"text" AS "policy_summary"
UNION ALL
 SELECT 'farms'::"text" AS "table_name",
    'Row Level Security enabled'::"text" AS "security_status",
    'Farm managers and admins have access'::"text" AS "policy_summary";


ALTER VIEW "public"."security_audit_view" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sensor_readings" (
    "id" bigint NOT NULL,
    "device_assignment_id" "uuid" NOT NULL,
    "reading_type" "text" NOT NULL,
    "value" numeric NOT NULL,
    "unit" "text",
    "timestamp" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."sensor_readings" OWNER TO "postgres";


COMMENT ON TABLE "public"."sensor_readings" IS 'Sensor data storage - CACHED (no realtime). Use sensor_alerts for immediate notifications.';



CREATE SEQUENCE IF NOT EXISTS "public"."sensor_readings_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."sensor_readings_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."sensor_readings_id_seq" OWNED BY "public"."sensor_readings"."id";



CREATE TABLE IF NOT EXISTS "public"."shelves" (
    "id" "uuid" DEFAULT "public"."uuid_generate_v4"() NOT NULL,
    "rack_id" "uuid" NOT NULL,
    "name" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."shelves" OWNER TO "postgres";


COMMENT ON TABLE "public"."shelves" IS 'Individual growing shelves where plants are placed';



CREATE TABLE IF NOT EXISTS "public"."task_logs" (
    "id" bigint NOT NULL,
    "task_id" "text" NOT NULL,
    "task_type" "text" NOT NULL,
    "priority" "text" NOT NULL,
    "success" boolean NOT NULL,
    "execution_time_ms" integer NOT NULL,
    "error_message" "text",
    "retry_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "user_id" "uuid",
    "queue_name" "text",
    "worker_id" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    CONSTRAINT "task_logs_priority_check" CHECK (("priority" = ANY (ARRAY['critical'::"text", 'high'::"text", 'normal'::"text", 'low'::"text"])))
);


ALTER TABLE "public"."task_logs" OWNER TO "postgres";


COMMENT ON TABLE "public"."task_logs" IS 'Comprehensive logging for all queue operations and task executions';



CREATE SEQUENCE IF NOT EXISTS "public"."task_logs_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."task_logs_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."task_logs_id_seq" OWNED BY "public"."task_logs"."id";



CREATE TABLE IF NOT EXISTS "public"."user_device_configs" (
    "id" "uuid" DEFAULT "public"."uuid_generate_v4"() NOT NULL,
    "user_config_id" "uuid" NOT NULL,
    "entity_id" "text" NOT NULL,
    "friendly_name" "text",
    "device_type" "text" NOT NULL,
    "room" "text",
    "is_favorite" boolean DEFAULT false,
    "custom_settings" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_device_configs" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_device_configs" IS 'Real-time enabled: Live updates for device configuration changes';



CREATE TABLE IF NOT EXISTS "public"."user_home_assistant_configs" (
    "id" "uuid" DEFAULT "public"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "url" "text" NOT NULL,
    "access_token" "text" NOT NULL,
    "local_url" "text",
    "cloudflare_enabled" boolean DEFAULT false,
    "cloudflare_client_id" "text",
    "cloudflare_client_secret" "text",
    "is_default" boolean DEFAULT false,
    "enabled" boolean DEFAULT true,
    "last_tested" timestamp with time zone,
    "last_successful_connection" timestamp with time zone,
    "test_result" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_home_assistant_configs" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_home_assistant_configs" IS 'Real-time enabled: Live updates for Home Assistant integration changes';



COMMENT ON COLUMN "public"."user_home_assistant_configs"."access_token" IS 'Encrypted Home Assistant long-lived access token';



COMMENT ON COLUMN "public"."user_home_assistant_configs"."cloudflare_client_secret" IS 'Encrypted Cloudflare Access client secret';



CREATE TABLE IF NOT EXISTS "public"."user_profiles" (
    "id" "uuid" NOT NULL,
    "role" "public"."user_role" DEFAULT 'operator'::"public"."user_role" NOT NULL,
    "name" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "profile_image_url" "text",
    "storage_quota_mb" integer DEFAULT 100
);


ALTER TABLE "public"."user_profiles" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_profiles" IS 'User profiles with roles and Home Assistant integration settings';



COMMENT ON COLUMN "public"."user_profiles"."profile_image_url" IS 'URL to user profile image in storage';



COMMENT ON COLUMN "public"."user_profiles"."storage_quota_mb" IS 'User storage quota in megabytes';



CREATE TABLE IF NOT EXISTS "public"."user_square_configs" (
    "id" "uuid" DEFAULT "public"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "application_id" "text" NOT NULL,
    "access_token" "text" NOT NULL,
    "environment" "text" DEFAULT 'sandbox'::"text" NOT NULL,
    "webhook_signature_key" "text",
    "is_default" boolean DEFAULT false,
    "enabled" boolean DEFAULT true,
    "last_tested" timestamp with time zone,
    "last_successful_connection" timestamp with time zone,
    "test_result" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "webhook_url" "text",
    CONSTRAINT "user_square_configs_environment_check" CHECK (("environment" = ANY (ARRAY['sandbox'::"text", 'production'::"text"])))
);


ALTER TABLE "public"."user_square_configs" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_square_configs" IS 'User-specific Square payment integration configurations';



COMMENT ON COLUMN "public"."user_square_configs"."access_token" IS 'Encrypted Square access token for API access';



COMMENT ON COLUMN "public"."user_square_configs"."environment" IS 'Square environment: sandbox for testing, production for live transactions';



COMMENT ON COLUMN "public"."user_square_configs"."webhook_signature_key" IS 'Optional webhook signature key for verifying Square webhook events';



COMMENT ON COLUMN "public"."user_square_configs"."test_result" IS 'JSON object containing last connection test results';



COMMENT ON COLUMN "public"."user_square_configs"."webhook_url" IS 'URL endpoint for receiving Square webhook notifications';



ALTER TABLE ONLY "public"."device_history" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."device_history_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."device_schedules" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."device_schedules_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."home_assistant_devices" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."home_assistant_devices_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."integration_sync_log" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."integration_sync_log_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."sensor_readings" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."sensor_readings_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."task_logs" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."task_logs_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."alerts"
    ADD CONSTRAINT "alerts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."automation_rules"
    ADD CONSTRAINT "automation_rules_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."automation_rules"
    ADD CONSTRAINT "automation_rules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."background_tasks"
    ADD CONSTRAINT "background_tasks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crops"
    ADD CONSTRAINT "crops_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."crops"
    ADD CONSTRAINT "crops_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."device_assignments"
    ADD CONSTRAINT "device_assignments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."device_assignments"
    ADD CONSTRAINT "device_assignments_user_id_entity_id_key" UNIQUE ("user_id", "entity_id");



ALTER TABLE ONLY "public"."device_control_history"
    ADD CONSTRAINT "device_control_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."device_history"
    ADD CONSTRAINT "device_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."device_schedules"
    ADD CONSTRAINT "device_schedules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."device_states"
    ADD CONSTRAINT "device_states_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."device_states"
    ADD CONSTRAINT "device_states_user_id_home_assistant_entity_id_key" UNIQUE ("user_id", "home_assistant_entity_id");



ALTER TABLE ONLY "public"."farms"
    ADD CONSTRAINT "farms_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."farms"
    ADD CONSTRAINT "farms_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."grow_alerts"
    ADD CONSTRAINT "grow_alerts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."grow_automation_conditions"
    ADD CONSTRAINT "grow_automation_conditions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."grow_automation_executions"
    ADD CONSTRAINT "grow_automation_executions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."grow_automation_rules"
    ADD CONSTRAINT "grow_automation_rules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."grow_automation_schedules"
    ADD CONSTRAINT "grow_automation_schedules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."grow_device_profiles"
    ADD CONSTRAINT "grow_device_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."grow_device_profiles"
    ADD CONSTRAINT "grow_device_profiles_profile_name_crop_id_grow_stage_id_dev_key" UNIQUE ("profile_name", "crop_id", "grow_stage_id", "device_type");



ALTER TABLE ONLY "public"."grow_events"
    ADD CONSTRAINT "grow_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."grow_location_assignments"
    ADD CONSTRAINT "grow_location_assignments_grow_id_location_id_removed_at_key" UNIQUE ("grow_id", "location_id", "removed_at");



ALTER TABLE ONLY "public"."grow_location_assignments"
    ADD CONSTRAINT "grow_location_assignments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."grow_locations"
    ADD CONSTRAINT "grow_locations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."grow_monitoring_metrics"
    ADD CONSTRAINT "grow_monitoring_metrics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."grow_observations"
    ADD CONSTRAINT "grow_observations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."grow_parameters"
    ADD CONSTRAINT "grow_parameters_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."grow_progress"
    ADD CONSTRAINT "grow_progress_grow_id_key" UNIQUE ("grow_id");



ALTER TABLE ONLY "public"."grow_progress"
    ADD CONSTRAINT "grow_progress_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."grow_recipes"
    ADD CONSTRAINT "grow_recipes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."grow_recipes"
    ADD CONSTRAINT "grow_recipes_species_id_name_key" UNIQUE ("species_id", "name");



ALTER TABLE ONLY "public"."grow_stages"
    ADD CONSTRAINT "grow_stages_crop_type_stage_name_key" UNIQUE ("crop_type", "stage_name");



ALTER TABLE ONLY "public"."grow_stages"
    ADD CONSTRAINT "grow_stages_crop_type_stage_order_key" UNIQUE ("crop_type", "stage_order");



ALTER TABLE ONLY "public"."grow_stages"
    ADD CONSTRAINT "grow_stages_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."grow_stages"
    ADD CONSTRAINT "grow_stages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."grows"
    ADD CONSTRAINT "grows_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."harvests"
    ADD CONSTRAINT "harvests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."home_assistant_devices"
    ADD CONSTRAINT "home_assistant_devices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."home_assistant_devices"
    ADD CONSTRAINT "home_assistant_devices_user_id_entity_id_key" UNIQUE ("user_id", "entity_id");



ALTER TABLE ONLY "public"."integration_sync_log"
    ADD CONSTRAINT "integration_sync_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."integrations"
    ADD CONSTRAINT "integrations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."integrations"
    ADD CONSTRAINT "integrations_type_name_key" UNIQUE ("type", "name");



ALTER TABLE ONLY "public"."job_queue"
    ADD CONSTRAINT "job_queue_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."monitoring_thresholds"
    ADD CONSTRAINT "monitoring_thresholds_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."queue_config"
    ADD CONSTRAINT "queue_config_pkey" PRIMARY KEY ("queue_name");



ALTER TABLE ONLY "public"."racks"
    ADD CONSTRAINT "racks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."recipe_stage_parameters"
    ADD CONSTRAINT "recipe_stage_parameters_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."recipe_stage_parameters"
    ADD CONSTRAINT "recipe_stage_parameters_recipe_id_stage_id_key" UNIQUE ("recipe_id", "stage_id");



ALTER TABLE ONLY "public"."rows"
    ADD CONSTRAINT "rows_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."schedule_events"
    ADD CONSTRAINT "schedule_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."scheduled_actions"
    ADD CONSTRAINT "scheduled_actions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."schedules"
    ADD CONSTRAINT "schedules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."seed_varieties"
    ADD CONSTRAINT "seed_varieties_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."seed_varieties"
    ADD CONSTRAINT "seed_varieties_species_id_variety_name_key" UNIQUE ("species_id", "variety_name");



ALTER TABLE ONLY "public"."sensor_alert_thresholds"
    ADD CONSTRAINT "sensor_alert_thresholds_device_assignment_id_sensor_type_key" UNIQUE ("device_assignment_id", "sensor_type");



ALTER TABLE ONLY "public"."sensor_alert_thresholds"
    ADD CONSTRAINT "sensor_alert_thresholds_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sensor_alerts"
    ADD CONSTRAINT "sensor_alerts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sensor_readings"
    ADD CONSTRAINT "sensor_readings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shelves"
    ADD CONSTRAINT "shelves_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."species"
    ADD CONSTRAINT "species_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."species"
    ADD CONSTRAINT "species_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."task_logs"
    ADD CONSTRAINT "task_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_square_configs"
    ADD CONSTRAINT "unique_default_per_user_square" UNIQUE ("user_id", "is_default") DEFERRABLE INITIALLY DEFERRED;



ALTER TABLE ONLY "public"."user_device_configs"
    ADD CONSTRAINT "unique_device_per_config" UNIQUE ("user_config_id", "entity_id");



ALTER TABLE ONLY "public"."user_home_assistant_configs"
    ADD CONSTRAINT "unique_name_per_user" UNIQUE ("user_id", "name");



ALTER TABLE ONLY "public"."user_square_configs"
    ADD CONSTRAINT "unique_name_per_user_square" UNIQUE ("user_id", "name");



ALTER TABLE ONLY "public"."user_device_configs"
    ADD CONSTRAINT "user_device_configs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_home_assistant_configs"
    ADD CONSTRAINT "user_home_assistant_configs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_home_assistant_configs"
    ADD CONSTRAINT "user_home_assistant_configs_user_id_name_unique" UNIQUE ("user_id", "name");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_square_configs"
    ADD CONSTRAINT "user_square_configs_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_alerts_farm_id" ON "public"."alerts" USING "btree" ("farm_id");



CREATE INDEX "idx_alerts_schedule_id" ON "public"."alerts" USING "btree" ("schedule_id");



CREATE INDEX "idx_alerts_unresolved" ON "public"."alerts" USING "btree" ("is_resolved", "created_at" DESC) WHERE ("is_resolved" = false);



CREATE INDEX "idx_automation_rules_farm_id" ON "public"."automation_rules" USING "btree" ("farm_id");



CREATE INDEX "idx_automation_rules_is_active" ON "public"."automation_rules" USING "btree" ("is_active");



CREATE INDEX "idx_background_tasks_device_assignment_id" ON "public"."background_tasks" USING "btree" ("device_assignment_id");



CREATE INDEX "idx_background_tasks_schedule_id" ON "public"."background_tasks" USING "btree" ("schedule_id");



CREATE INDEX "idx_background_tasks_status_priority" ON "public"."background_tasks" USING "btree" ("status", "priority", "scheduled_at");



CREATE INDEX "idx_background_tasks_task_type" ON "public"."background_tasks" USING "btree" ("task_type");



CREATE INDEX "idx_device_assignments_entity" ON "public"."device_assignments" USING "btree" ("home_assistant_entity_id");



CREATE INDEX "idx_device_assignments_entity_id" ON "public"."device_assignments" USING "btree" ("entity_id");



CREATE INDEX "idx_device_assignments_entity_type" ON "public"."device_assignments" USING "btree" ("entity_type");



CREATE INDEX "idx_device_assignments_farm_id" ON "public"."device_assignments" USING "btree" ("farm_id");



CREATE INDEX "idx_device_assignments_hierarchy_lookup" ON "public"."device_assignments" USING "btree" ("farm_id", "row_id", "rack_id", "shelf_id");



CREATE INDEX "idx_device_assignments_integration_id" ON "public"."device_assignments" USING "btree" ("integration_id");



CREATE INDEX "idx_device_assignments_rack_id" ON "public"."device_assignments" USING "btree" ("rack_id");



CREATE INDEX "idx_device_assignments_row_id" ON "public"."device_assignments" USING "btree" ("row_id");



CREATE INDEX "idx_device_assignments_search" ON "public"."device_assignments" USING "gin" ((((((COALESCE("friendly_name", ''::"text") || ' '::"text") || "entity_id") || ' '::"text") || "entity_type")) "public"."gin_trgm_ops");



CREATE INDEX "idx_device_assignments_shelf_id" ON "public"."device_assignments" USING "btree" ("shelf_id");



CREATE INDEX "idx_device_assignments_user" ON "public"."device_assignments" USING "btree" ("user_id");



CREATE INDEX "idx_device_assignments_user_id" ON "public"."device_assignments" USING "btree" ("user_id");



CREATE INDEX "idx_device_assignments_user_location" ON "public"."device_assignments" USING "btree" ("user_id", "location_id");



CREATE INDEX "idx_device_control_history_entity" ON "public"."device_control_history" USING "btree" ("home_assistant_entity_id", "created_at");



CREATE INDEX "idx_device_control_history_user" ON "public"."device_control_history" USING "btree" ("user_id", "created_at");



CREATE INDEX "idx_device_history_entity_id" ON "public"."device_history" USING "btree" ("entity_id");



CREATE INDEX "idx_device_history_recorded_at" ON "public"."device_history" USING "btree" ("recorded_at");



CREATE INDEX "idx_device_history_user_id" ON "public"."device_history" USING "btree" ("user_id");



CREATE INDEX "idx_device_schedules_is_active" ON "public"."device_schedules" USING "btree" ("is_active");



CREATE INDEX "idx_device_schedules_last_executed" ON "public"."device_schedules" USING "btree" ("last_executed");



CREATE INDEX "idx_device_schedules_user_id" ON "public"."device_schedules" USING "btree" ("user_id");



CREATE INDEX "idx_device_states_updated" ON "public"."device_states" USING "btree" ("last_updated");



CREATE INDEX "idx_device_states_user_entity" ON "public"."device_states" USING "btree" ("user_id", "home_assistant_entity_id");



CREATE INDEX "idx_farms_user_id" ON "public"."farms" USING "btree" ("user_id");



CREATE INDEX "idx_grow_alerts_grow_id" ON "public"."grow_alerts" USING "btree" ("grow_id");



CREATE INDEX "idx_grow_alerts_severity" ON "public"."grow_alerts" USING "btree" ("severity", "created_at" DESC);



CREATE INDEX "idx_grow_alerts_unresolved" ON "public"."grow_alerts" USING "btree" ("is_resolved", "created_at" DESC) WHERE ("is_resolved" = false);



CREATE INDEX "idx_grow_automation_conditions_grow_id" ON "public"."grow_automation_conditions" USING "btree" ("grow_id");



CREATE INDEX "idx_grow_automation_conditions_sensor" ON "public"."grow_automation_conditions" USING "btree" ("sensor_entity_id", "is_active");



CREATE INDEX "idx_grow_automation_executions_grow_id" ON "public"."grow_automation_executions" USING "btree" ("grow_id");



CREATE INDEX "idx_grow_automation_executions_status" ON "public"."grow_automation_executions" USING "btree" ("execution_status", "executed_at");



CREATE INDEX "idx_grow_automation_rules_active" ON "public"."grow_automation_rules" USING "btree" ("is_active", "grow_id");



CREATE INDEX "idx_grow_automation_rules_device_assignment_id" ON "public"."grow_automation_rules" USING "btree" ("device_assignment_id");



CREATE INDEX "idx_grow_automation_rules_grow_id" ON "public"."grow_automation_rules" USING "btree" ("grow_id");



CREATE INDEX "idx_grow_automation_schedules_active" ON "public"."grow_automation_schedules" USING "btree" ("is_active", "starts_at", "ends_at");



CREATE INDEX "idx_grow_automation_schedules_grow_id" ON "public"."grow_automation_schedules" USING "btree" ("grow_id");



CREATE INDEX "idx_grow_monitoring_metrics_grow_id" ON "public"."grow_monitoring_metrics" USING "btree" ("grow_id");



CREATE INDEX "idx_grow_monitoring_metrics_shelf_time" ON "public"."grow_monitoring_metrics" USING "btree" ("shelf_id", "recorded_at" DESC) WHERE ("shelf_id" IS NOT NULL);



CREATE INDEX "idx_grow_monitoring_metrics_type_time" ON "public"."grow_monitoring_metrics" USING "btree" ("metric_type", "recorded_at" DESC);



CREATE INDEX "idx_grow_observations_grow_id" ON "public"."grow_observations" USING "btree" ("grow_id", "recorded_at" DESC);



CREATE INDEX "idx_grow_observations_type" ON "public"."grow_observations" USING "btree" ("observation_type", "recorded_at" DESC);



CREATE INDEX "idx_grow_recipes_created_by" ON "public"."grow_recipes" USING "btree" ("created_by");



CREATE INDEX "idx_grow_recipes_difficulty" ON "public"."grow_recipes" USING "btree" ("difficulty");



CREATE INDEX "idx_grow_recipes_pythium_risk" ON "public"."grow_recipes" USING "btree" ("pythium_risk");



CREATE INDEX "idx_grow_recipes_species_id" ON "public"."grow_recipes" USING "btree" ("species_id");



CREATE INDEX "idx_grow_recipes_total_grow_days" ON "public"."grow_recipes" USING "btree" ("total_grow_days");



CREATE INDEX "idx_grows_created_by" ON "public"."grows" USING "btree" ("created_by");



CREATE INDEX "idx_grows_status" ON "public"."grows" USING "btree" ("status");



CREATE INDEX "idx_ha_devices_device_type" ON "public"."home_assistant_devices" USING "btree" ("device_type");



CREATE INDEX "idx_ha_devices_entity_id" ON "public"."home_assistant_devices" USING "btree" ("entity_id");



CREATE INDEX "idx_ha_devices_is_assigned" ON "public"."home_assistant_devices" USING "btree" ("is_assigned");



CREATE INDEX "idx_ha_devices_user_id" ON "public"."home_assistant_devices" USING "btree" ("user_id");



CREATE INDEX "idx_harvests_grow_id" ON "public"."harvests" USING "btree" ("grow_id");



CREATE INDEX "idx_harvests_harvest_date" ON "public"."harvests" USING "btree" ("harvest_date" DESC);



CREATE INDEX "idx_harvests_shelf_id" ON "public"."harvests" USING "btree" ("shelf_id");



CREATE INDEX "idx_integration_sync_log_event_type" ON "public"."integration_sync_log" USING "btree" ("event_type");



CREATE INDEX "idx_integration_sync_log_integration_timestamp" ON "public"."integration_sync_log" USING "btree" ("integration_id", "timestamp" DESC);



CREATE INDEX "idx_integrations_enabled" ON "public"."integrations" USING "btree" ("enabled");



CREATE INDEX "idx_integrations_health_status" ON "public"."integrations" USING "btree" ("health_status");



CREATE INDEX "idx_integrations_type" ON "public"."integrations" USING "btree" ("type");



CREATE INDEX "idx_integrations_type_status" ON "public"."integrations" USING "btree" ("type", "status");



CREATE INDEX "idx_integrations_user_id" ON "public"."integrations" USING "btree" ("user_id");



CREATE INDEX "idx_job_queue_created_at" ON "public"."job_queue" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_job_queue_processing" ON "public"."job_queue" USING "btree" ("status", "started_at") WHERE ("status" = 'processing'::"text");



CREATE INDEX "idx_job_queue_scheduled" ON "public"."job_queue" USING "btree" ("scheduled_for") WHERE ("status" = 'pending'::"text");



CREATE INDEX "idx_job_queue_status_priority" ON "public"."job_queue" USING "btree" ("queue_name", "status", "priority" DESC, "scheduled_for");



CREATE INDEX "idx_job_queue_worker_id" ON "public"."job_queue" USING "btree" ("worker_id") WHERE ("worker_id" IS NOT NULL);



CREATE INDEX "idx_monitoring_thresholds_crop_metric" ON "public"."monitoring_thresholds" USING "btree" ("crop_type", "metric_type");



CREATE INDEX "idx_monitoring_thresholds_stage" ON "public"."monitoring_thresholds" USING "btree" ("stage_id") WHERE ("stage_id" IS NOT NULL);



CREATE INDEX "idx_racks_row_id" ON "public"."racks" USING "btree" ("row_id");



CREATE INDEX "idx_recipe_stage_parameters_recipe_id" ON "public"."recipe_stage_parameters" USING "btree" ("recipe_id");



CREATE INDEX "idx_rows_farm_id" ON "public"."rows" USING "btree" ("farm_id");



CREATE INDEX "idx_schedule_events_schedule_id_created_at" ON "public"."schedule_events" USING "btree" ("schedule_id", "created_at" DESC);



CREATE INDEX "idx_scheduled_actions_device_assignment_id" ON "public"."scheduled_actions" USING "btree" ("device_assignment_id");



CREATE INDEX "idx_scheduled_actions_execution_time" ON "public"."scheduled_actions" USING "btree" ("execution_time");



CREATE INDEX "idx_scheduled_actions_schedule_id" ON "public"."scheduled_actions" USING "btree" ("schedule_id");



CREATE INDEX "idx_scheduled_actions_status" ON "public"."scheduled_actions" USING "btree" ("status");



CREATE INDEX "idx_schedules_grow_recipe_id" ON "public"."schedules" USING "btree" ("grow_recipe_id");



CREATE INDEX "idx_schedules_shelf_id" ON "public"."schedules" USING "btree" ("shelf_id");



CREATE INDEX "idx_schedules_status" ON "public"."schedules" USING "btree" ("status");



CREATE INDEX "idx_schedules_status_dates" ON "public"."schedules" USING "btree" ("status", "start_date", "estimated_end_date");



CREATE INDEX "idx_seed_varieties_species_id" ON "public"."seed_varieties" USING "btree" ("species_id");



CREATE INDEX "idx_sensor_alert_thresholds_device_assignment_id" ON "public"."sensor_alert_thresholds" USING "btree" ("device_assignment_id");



CREATE INDEX "idx_sensor_alert_thresholds_enabled" ON "public"."sensor_alert_thresholds" USING "btree" ("enabled");



CREATE INDEX "idx_sensor_alert_thresholds_sensor_type" ON "public"."sensor_alert_thresholds" USING "btree" ("sensor_type");



CREATE INDEX "idx_sensor_alerts_acknowledged" ON "public"."sensor_alerts" USING "btree" ("acknowledged");



CREATE INDEX "idx_sensor_alerts_alert_type" ON "public"."sensor_alerts" USING "btree" ("alert_type");



CREATE INDEX "idx_sensor_alerts_created_at" ON "public"."sensor_alerts" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_sensor_alerts_device_assignment_id" ON "public"."sensor_alerts" USING "btree" ("device_assignment_id");



CREATE INDEX "idx_sensor_alerts_resolved" ON "public"."sensor_alerts" USING "btree" ("resolved");



CREATE INDEX "idx_sensor_alerts_severity" ON "public"."sensor_alerts" USING "btree" ("severity");



CREATE INDEX "idx_sensor_readings_device_assignment_id_timestamp" ON "public"."sensor_readings" USING "btree" ("device_assignment_id", "timestamp" DESC);



CREATE INDEX "idx_sensor_readings_device_timestamp" ON "public"."sensor_readings" USING "btree" ("device_assignment_id", "timestamp" DESC);



CREATE INDEX "idx_sensor_readings_reading_type_timestamp" ON "public"."sensor_readings" USING "btree" ("reading_type", "timestamp" DESC);



CREATE INDEX "idx_sensor_readings_timestamp" ON "public"."sensor_readings" USING "btree" ("timestamp" DESC);



CREATE INDEX "idx_shelves_rack_id" ON "public"."shelves" USING "btree" ("rack_id");



CREATE INDEX "idx_task_logs_created_at" ON "public"."task_logs" USING "btree" ("created_at");



CREATE INDEX "idx_task_logs_queue_name" ON "public"."task_logs" USING "btree" ("queue_name");



CREATE INDEX "idx_task_logs_success" ON "public"."task_logs" USING "btree" ("success");



CREATE INDEX "idx_task_logs_task_id" ON "public"."task_logs" USING "btree" ("task_id");



CREATE INDEX "idx_task_logs_task_type" ON "public"."task_logs" USING "btree" ("task_type");



CREATE INDEX "idx_task_logs_user_id" ON "public"."task_logs" USING "btree" ("user_id");



CREATE INDEX "idx_user_device_configs_device_type" ON "public"."user_device_configs" USING "btree" ("device_type");



CREATE INDEX "idx_user_device_configs_entity_id" ON "public"."user_device_configs" USING "btree" ("entity_id");



CREATE INDEX "idx_user_device_configs_is_favorite" ON "public"."user_device_configs" USING "btree" ("is_favorite") WHERE ("is_favorite" = true);



CREATE INDEX "idx_user_device_configs_user_config_id" ON "public"."user_device_configs" USING "btree" ("user_config_id");



CREATE INDEX "idx_user_ha_configs_default" ON "public"."user_home_assistant_configs" USING "btree" ("user_id", "is_default") WHERE ("is_default" = true);



CREATE INDEX "idx_user_ha_configs_enabled" ON "public"."user_home_assistant_configs" USING "btree" ("enabled");



CREATE INDEX "idx_user_ha_configs_user_id" ON "public"."user_home_assistant_configs" USING "btree" ("user_id");



CREATE INDEX "idx_user_profiles_role" ON "public"."user_profiles" USING "btree" ("role");



CREATE INDEX "idx_user_square_configs_default" ON "public"."user_square_configs" USING "btree" ("user_id", "is_default") WHERE ("is_default" = true);



CREATE INDEX "idx_user_square_configs_enabled" ON "public"."user_square_configs" USING "btree" ("enabled");



CREATE INDEX "idx_user_square_configs_user_id" ON "public"."user_square_configs" USING "btree" ("user_id");



CREATE UNIQUE INDEX "racks_row_id_name_unique" ON "public"."racks" USING "btree" ("row_id", "name") WHERE ("name" IS NOT NULL);



CREATE UNIQUE INDEX "rows_farm_id_name_unique" ON "public"."rows" USING "btree" ("farm_id", "name") WHERE ("name" IS NOT NULL);



CREATE UNIQUE INDEX "shelves_rack_id_name_unique" ON "public"."shelves" USING "btree" ("rack_id", "name") WHERE ("name" IS NOT NULL);



CREATE UNIQUE INDEX "unique_default_config_per_user" ON "public"."user_home_assistant_configs" USING "btree" ("user_id") WHERE ("is_default" = true);



COMMENT ON INDEX "public"."unique_default_config_per_user" IS 'Ensures only one default Home Assistant configuration per user';



CREATE OR REPLACE TRIGGER "automation_rule_notify" AFTER INSERT OR DELETE OR UPDATE ON "public"."automation_rules" FOR EACH ROW EXECUTE FUNCTION "public"."notify_important_changes"();



CREATE OR REPLACE TRIGGER "calculate_schedule_end_date" BEFORE INSERT OR UPDATE ON "public"."schedules" FOR EACH ROW EXECUTE FUNCTION "public"."calculate_schedule_end_date"();



CREATE OR REPLACE TRIGGER "device_assignment_notify" AFTER INSERT OR DELETE OR UPDATE ON "public"."device_assignments" FOR EACH ROW EXECUTE FUNCTION "public"."notify_important_changes"();



CREATE OR REPLACE TRIGGER "schedule_automation_trigger" AFTER INSERT OR UPDATE ON "public"."schedules" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_schedule_automation"();



CREATE OR REPLACE TRIGGER "schedule_notify" AFTER INSERT OR DELETE OR UPDATE ON "public"."schedules" FOR EACH ROW EXECUTE FUNCTION "public"."notify_important_changes"();



CREATE OR REPLACE TRIGGER "sensor_alert_thresholds_updated_at" BEFORE UPDATE ON "public"."sensor_alert_thresholds" FOR EACH ROW EXECUTE FUNCTION "public"."update_sensor_alerts_updated_at"();



CREATE OR REPLACE TRIGGER "sensor_alerts_updated_at" BEFORE UPDATE ON "public"."sensor_alerts" FOR EACH ROW EXECUTE FUNCTION "public"."update_sensor_alerts_updated_at"();



CREATE OR REPLACE TRIGGER "sensor_processing_trigger" AFTER INSERT ON "public"."sensor_readings" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_sensor_processing"();



CREATE OR REPLACE TRIGGER "trigger_calculate_total_grow_days" BEFORE INSERT OR UPDATE ON "public"."grow_recipes" FOR EACH ROW EXECUTE FUNCTION "public"."calculate_total_grow_days"();



CREATE OR REPLACE TRIGGER "trigger_ensure_single_default_ha_config" BEFORE INSERT OR UPDATE ON "public"."user_home_assistant_configs" FOR EACH ROW EXECUTE FUNCTION "public"."ensure_single_default_ha_config"();



CREATE OR REPLACE TRIGGER "trigger_ensure_single_default_square_config" BEFORE INSERT OR UPDATE ON "public"."user_square_configs" FOR EACH ROW EXECUTE FUNCTION "public"."ensure_single_default_square_config"();



CREATE OR REPLACE TRIGGER "trigger_updated_at_user_square_configs" BEFORE UPDATE ON "public"."user_square_configs" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "update_automation_rules_updated_at" BEFORE UPDATE ON "public"."automation_rules" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_device_assignments_updated_at" BEFORE UPDATE ON "public"."device_assignments" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_device_schedules_updated_at" BEFORE UPDATE ON "public"."device_schedules" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_farms_updated_at" BEFORE UPDATE ON "public"."farms" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_grow_automation_conditions_timestamp" BEFORE UPDATE ON "public"."grow_automation_conditions" FOR EACH ROW EXECUTE FUNCTION "public"."update_automation_timestamp"();



CREATE OR REPLACE TRIGGER "update_grow_automation_rules_timestamp" BEFORE UPDATE ON "public"."grow_automation_rules" FOR EACH ROW EXECUTE FUNCTION "public"."update_automation_timestamp"();



CREATE OR REPLACE TRIGGER "update_grow_automation_schedules_timestamp" BEFORE UPDATE ON "public"."grow_automation_schedules" FOR EACH ROW EXECUTE FUNCTION "public"."update_automation_timestamp"();



CREATE OR REPLACE TRIGGER "update_grow_device_profiles_timestamp" BEFORE UPDATE ON "public"."grow_device_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_automation_timestamp"();



CREATE OR REPLACE TRIGGER "update_grow_recipes_timestamp" BEFORE UPDATE ON "public"."grow_recipes" FOR EACH ROW EXECUTE FUNCTION "public"."update_grow_timestamp"();



CREATE OR REPLACE TRIGGER "update_grow_recipes_updated_at" BEFORE UPDATE ON "public"."grow_recipes" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_grows_timestamp" BEFORE UPDATE ON "public"."grows" FOR EACH ROW EXECUTE FUNCTION "public"."update_grow_timestamp"();



CREATE OR REPLACE TRIGGER "update_ha_devices_updated_at" BEFORE UPDATE ON "public"."home_assistant_devices" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_integrations_updated_at" BEFORE UPDATE ON "public"."integrations" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_racks_updated_at" BEFORE UPDATE ON "public"."racks" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_rows_updated_at" BEFORE UPDATE ON "public"."rows" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_scheduled_actions_updated_at" BEFORE UPDATE ON "public"."scheduled_actions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_schedules_updated_at" BEFORE UPDATE ON "public"."schedules" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_shelves_updated_at" BEFORE UPDATE ON "public"."shelves" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_species_updated_at" BEFORE UPDATE ON "public"."species" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_device_configs_updated_at" BEFORE UPDATE ON "public"."user_device_configs" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_home_assistant_configs_updated_at" BEFORE UPDATE ON "public"."user_home_assistant_configs" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_profiles_updated_at" BEFORE UPDATE ON "public"."user_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "validate_device_assignment" BEFORE INSERT OR UPDATE ON "public"."device_assignments" FOR EACH ROW EXECUTE FUNCTION "public"."validate_device_assignment"();



ALTER TABLE ONLY "public"."alerts"
    ADD CONSTRAINT "alerts_device_assignment_id_fkey" FOREIGN KEY ("device_assignment_id") REFERENCES "public"."device_assignments"("id");



ALTER TABLE ONLY "public"."alerts"
    ADD CONSTRAINT "alerts_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id");



ALTER TABLE ONLY "public"."alerts"
    ADD CONSTRAINT "alerts_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "public"."user_profiles"("id");



ALTER TABLE ONLY "public"."alerts"
    ADD CONSTRAINT "alerts_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "public"."schedules"("id");



ALTER TABLE ONLY "public"."automation_rules"
    ADD CONSTRAINT "automation_rules_action_target_device_id_fkey" FOREIGN KEY ("action_target_device_id") REFERENCES "public"."device_assignments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."automation_rules"
    ADD CONSTRAINT "automation_rules_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."automation_rules"
    ADD CONSTRAINT "automation_rules_trigger_source_device_id_fkey" FOREIGN KEY ("trigger_source_device_id") REFERENCES "public"."device_assignments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."background_tasks"
    ADD CONSTRAINT "background_tasks_device_assignment_id_fkey" FOREIGN KEY ("device_assignment_id") REFERENCES "public"."device_assignments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."background_tasks"
    ADD CONSTRAINT "background_tasks_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."background_tasks"
    ADD CONSTRAINT "background_tasks_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "public"."schedules"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."device_assignments"
    ADD CONSTRAINT "device_assignments_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "public"."user_profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."device_assignments"
    ADD CONSTRAINT "device_assignments_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."device_assignments"
    ADD CONSTRAINT "device_assignments_integration_id_fkey" FOREIGN KEY ("integration_id") REFERENCES "public"."integrations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."device_assignments"
    ADD CONSTRAINT "device_assignments_rack_id_fkey" FOREIGN KEY ("rack_id") REFERENCES "public"."racks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."device_assignments"
    ADD CONSTRAINT "device_assignments_row_id_fkey" FOREIGN KEY ("row_id") REFERENCES "public"."rows"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."device_assignments"
    ADD CONSTRAINT "device_assignments_shelf_id_fkey" FOREIGN KEY ("shelf_id") REFERENCES "public"."shelves"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."device_assignments"
    ADD CONSTRAINT "device_assignments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."device_control_history"
    ADD CONSTRAINT "device_control_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."device_history"
    ADD CONSTRAINT "device_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."device_schedules"
    ADD CONSTRAINT "device_schedules_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."device_states"
    ADD CONSTRAINT "device_states_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."farms"
    ADD CONSTRAINT "farms_manager_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."harvests"
    ADD CONSTRAINT "fk_harvests_grow_id" FOREIGN KEY ("grow_id") REFERENCES "public"."grows"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."grow_alerts"
    ADD CONSTRAINT "grow_alerts_grow_id_fkey" FOREIGN KEY ("grow_id") REFERENCES "public"."grows"("id");



ALTER TABLE ONLY "public"."grow_automation_conditions"
    ADD CONSTRAINT "grow_automation_conditions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."grow_automation_conditions"
    ADD CONSTRAINT "grow_automation_conditions_device_assignment_id_fkey" FOREIGN KEY ("device_assignment_id") REFERENCES "public"."device_assignments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."grow_automation_conditions"
    ADD CONSTRAINT "grow_automation_conditions_grow_id_fkey" FOREIGN KEY ("grow_id") REFERENCES "public"."grows"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."grow_automation_executions"
    ADD CONSTRAINT "grow_automation_executions_device_assignment_id_fkey" FOREIGN KEY ("device_assignment_id") REFERENCES "public"."device_assignments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."grow_automation_executions"
    ADD CONSTRAINT "grow_automation_executions_grow_id_fkey" FOREIGN KEY ("grow_id") REFERENCES "public"."grows"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."grow_automation_rules"
    ADD CONSTRAINT "grow_automation_rules_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."grow_automation_rules"
    ADD CONSTRAINT "grow_automation_rules_device_assignment_id_fkey" FOREIGN KEY ("device_assignment_id") REFERENCES "public"."device_assignments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."grow_automation_rules"
    ADD CONSTRAINT "grow_automation_rules_grow_id_fkey" FOREIGN KEY ("grow_id") REFERENCES "public"."grows"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."grow_automation_schedules"
    ADD CONSTRAINT "grow_automation_schedules_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."grow_automation_schedules"
    ADD CONSTRAINT "grow_automation_schedules_device_assignment_id_fkey" FOREIGN KEY ("device_assignment_id") REFERENCES "public"."device_assignments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."grow_automation_schedules"
    ADD CONSTRAINT "grow_automation_schedules_grow_id_fkey" FOREIGN KEY ("grow_id") REFERENCES "public"."grows"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."grow_device_profiles"
    ADD CONSTRAINT "grow_device_profiles_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."grow_device_profiles"
    ADD CONSTRAINT "grow_device_profiles_crop_id_fkey" FOREIGN KEY ("crop_id") REFERENCES "public"."crops"("id");



ALTER TABLE ONLY "public"."grow_device_profiles"
    ADD CONSTRAINT "grow_device_profiles_grow_stage_id_fkey" FOREIGN KEY ("grow_stage_id") REFERENCES "public"."grow_stages"("id");



ALTER TABLE ONLY "public"."grow_events"
    ADD CONSTRAINT "grow_events_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."grow_events"
    ADD CONSTRAINT "grow_events_grow_id_fkey" FOREIGN KEY ("grow_id") REFERENCES "public"."grows"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."grow_location_assignments"
    ADD CONSTRAINT "grow_location_assignments_grow_id_fkey" FOREIGN KEY ("grow_id") REFERENCES "public"."grows"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."grow_location_assignments"
    ADD CONSTRAINT "grow_location_assignments_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."grow_locations"("id");



ALTER TABLE ONLY "public"."grow_locations"
    ADD CONSTRAINT "grow_locations_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."grow_locations"("id");



ALTER TABLE ONLY "public"."grow_monitoring_metrics"
    ADD CONSTRAINT "grow_monitoring_metrics_grow_id_fkey" FOREIGN KEY ("grow_id") REFERENCES "public"."grows"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."grow_monitoring_metrics"
    ADD CONSTRAINT "grow_monitoring_metrics_shelf_id_fkey" FOREIGN KEY ("shelf_id") REFERENCES "public"."shelves"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."grow_observations"
    ADD CONSTRAINT "grow_observations_grow_id_fkey" FOREIGN KEY ("grow_id") REFERENCES "public"."grows"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."grow_observations"
    ADD CONSTRAINT "grow_observations_recorded_by_fkey" FOREIGN KEY ("recorded_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."grow_observations"
    ADD CONSTRAINT "grow_observations_shelf_id_fkey" FOREIGN KEY ("shelf_id") REFERENCES "public"."shelves"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."grow_parameters"
    ADD CONSTRAINT "grow_parameters_grow_id_fkey" FOREIGN KEY ("grow_id") REFERENCES "public"."grows"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."grow_progress"
    ADD CONSTRAINT "grow_progress_current_stage_id_fkey" FOREIGN KEY ("current_stage_id") REFERENCES "public"."grow_stages"("id");



ALTER TABLE ONLY "public"."grow_progress"
    ADD CONSTRAINT "grow_progress_grow_id_fkey" FOREIGN KEY ("grow_id") REFERENCES "public"."grows"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."grow_recipes"
    ADD CONSTRAINT "grow_recipes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."grow_recipes"
    ADD CONSTRAINT "grow_recipes_crop_id_fkey" FOREIGN KEY ("crop_id") REFERENCES "public"."crops"("id");



ALTER TABLE ONLY "public"."grow_recipes"
    ADD CONSTRAINT "grow_recipes_parent_recipe_id_fkey" FOREIGN KEY ("parent_recipe_id") REFERENCES "public"."grow_recipes"("id");



ALTER TABLE ONLY "public"."grow_recipes"
    ADD CONSTRAINT "grow_recipes_species_id_fkey" FOREIGN KEY ("species_id") REFERENCES "public"."species"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."grows"
    ADD CONSTRAINT "grows_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."grows"
    ADD CONSTRAINT "grows_current_stage_id_fkey" FOREIGN KEY ("current_stage_id") REFERENCES "public"."grow_stages"("id");



ALTER TABLE ONLY "public"."grows"
    ADD CONSTRAINT "grows_device_profile_id_fkey" FOREIGN KEY ("device_profile_id") REFERENCES "public"."grow_device_profiles"("id");



ALTER TABLE ONLY "public"."grows"
    ADD CONSTRAINT "grows_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "public"."grow_recipes"("id");



ALTER TABLE ONLY "public"."grows"
    ADD CONSTRAINT "grows_seed_variety_id_fkey" FOREIGN KEY ("seed_variety_id") REFERENCES "public"."seed_varieties"("id");



ALTER TABLE ONLY "public"."harvests"
    ADD CONSTRAINT "harvests_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."harvests"
    ADD CONSTRAINT "harvests_shelf_id_fkey" FOREIGN KEY ("shelf_id") REFERENCES "public"."shelves"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."home_assistant_devices"
    ADD CONSTRAINT "home_assistant_devices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."integration_sync_log"
    ADD CONSTRAINT "integration_sync_log_integration_id_fkey" FOREIGN KEY ("integration_id") REFERENCES "public"."integrations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."integrations"
    ADD CONSTRAINT "integrations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."job_queue"
    ADD CONSTRAINT "job_queue_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."user_profiles"("id");



ALTER TABLE ONLY "public"."monitoring_thresholds"
    ADD CONSTRAINT "monitoring_thresholds_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "public"."grow_stages"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."racks"
    ADD CONSTRAINT "racks_row_id_fkey" FOREIGN KEY ("row_id") REFERENCES "public"."rows"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."recipe_stage_parameters"
    ADD CONSTRAINT "recipe_stage_parameters_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "public"."grow_recipes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."recipe_stage_parameters"
    ADD CONSTRAINT "recipe_stage_parameters_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "public"."grow_stages"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rows"
    ADD CONSTRAINT "rows_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."schedule_events"
    ADD CONSTRAINT "schedule_events_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."user_profiles"("id");



ALTER TABLE ONLY "public"."schedule_events"
    ADD CONSTRAINT "schedule_events_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "public"."schedules"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."schedule_events"
    ADD CONSTRAINT "schedule_events_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "public"."grow_stages"("id");



ALTER TABLE ONLY "public"."scheduled_actions"
    ADD CONSTRAINT "scheduled_actions_device_assignment_id_fkey" FOREIGN KEY ("device_assignment_id") REFERENCES "public"."device_assignments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."scheduled_actions"
    ADD CONSTRAINT "scheduled_actions_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "public"."schedules"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."schedules"
    ADD CONSTRAINT "schedules_grow_recipe_id_fkey" FOREIGN KEY ("grow_recipe_id") REFERENCES "public"."grow_recipes"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."schedules"
    ADD CONSTRAINT "schedules_shelf_id_fkey" FOREIGN KEY ("shelf_id") REFERENCES "public"."shelves"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."seed_varieties"
    ADD CONSTRAINT "seed_varieties_crop_id_fkey" FOREIGN KEY ("crop_id") REFERENCES "public"."crops"("id");



ALTER TABLE ONLY "public"."seed_varieties"
    ADD CONSTRAINT "seed_varieties_species_id_fkey" FOREIGN KEY ("species_id") REFERENCES "public"."species"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sensor_alert_thresholds"
    ADD CONSTRAINT "sensor_alert_thresholds_device_assignment_id_fkey" FOREIGN KEY ("device_assignment_id") REFERENCES "public"."device_assignments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sensor_alerts"
    ADD CONSTRAINT "sensor_alerts_acknowledged_by_fkey" FOREIGN KEY ("acknowledged_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."sensor_alerts"
    ADD CONSTRAINT "sensor_alerts_device_assignment_id_fkey" FOREIGN KEY ("device_assignment_id") REFERENCES "public"."device_assignments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sensor_readings"
    ADD CONSTRAINT "sensor_readings_device_assignment_id_fkey" FOREIGN KEY ("device_assignment_id") REFERENCES "public"."device_assignments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shelves"
    ADD CONSTRAINT "shelves_rack_id_fkey" FOREIGN KEY ("rack_id") REFERENCES "public"."racks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."task_logs"
    ADD CONSTRAINT "task_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_device_configs"
    ADD CONSTRAINT "user_device_configs_user_config_id_fkey" FOREIGN KEY ("user_config_id") REFERENCES "public"."user_home_assistant_configs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_home_assistant_configs"
    ADD CONSTRAINT "user_home_assistant_configs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_square_configs"
    ADD CONSTRAINT "user_square_configs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Everyone can view grow stages" ON "public"."grow_stages" FOR SELECT USING (true);



CREATE POLICY "Everyone can view monitoring thresholds" ON "public"."monitoring_thresholds" FOR SELECT USING (true);



CREATE POLICY "Service can insert automation executions" ON "public"."grow_automation_executions" FOR INSERT WITH CHECK (true);



CREATE POLICY "Users can acknowledge their sensor alerts" ON "public"."sensor_alerts" FOR UPDATE USING (("device_assignment_id" IN ( SELECT "da"."id"
   FROM (((("public"."device_assignments" "da"
     JOIN "public"."shelves" "s" ON (("da"."shelf_id" = "s"."id")))
     JOIN "public"."racks" "r" ON (("s"."rack_id" = "r"."id")))
     JOIN "public"."rows" "ro" ON (("r"."row_id" = "ro"."id")))
     JOIN "public"."farms" "f" ON (("ro"."farm_id" = "f"."id")))
  WHERE ("f"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can create grow events" ON "public"."grow_events" FOR INSERT WITH CHECK (("created_by" = "auth"."uid"()));



CREATE POLICY "Users can create grows" ON "public"."grows" FOR INSERT WITH CHECK (("created_by" = "auth"."uid"()));



CREATE POLICY "Users can create harvests" ON "public"."harvests" FOR INSERT WITH CHECK (("created_by" = "auth"."uid"()));



CREATE POLICY "Users can create recipes" ON "public"."grow_recipes" FOR INSERT WITH CHECK (("created_by" = "auth"."uid"()));



CREATE POLICY "Users can delete their own device assignments" ON "public"."device_assignments" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert metrics for their grows" ON "public"."grow_monitoring_metrics" FOR INSERT WITH CHECK (("grow_id" IN ( SELECT "grows"."id"
   FROM "public"."grows"
  WHERE ("grows"."created_by" = "auth"."uid"()))));



CREATE POLICY "Users can insert their own device assignments" ON "public"."device_assignments" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own device history" ON "public"."device_control_history" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own device states" ON "public"."device_states" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage alerts for their grows" ON "public"."grow_alerts" USING (("grow_id" IN ( SELECT "grows"."id"
   FROM "public"."grows"
  WHERE ("grows"."created_by" = "auth"."uid"()))));



CREATE POLICY "Users can manage jobs they created" ON "public"."job_queue" USING ((("auth"."uid"() = "created_by") OR (EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'farm_manager'::"public"."user_role"])))))));



CREATE POLICY "Users can manage observations for their grows" ON "public"."grow_observations" USING (("grow_id" IN ( SELECT "grows"."id"
   FROM "public"."grows"
  WHERE ("grows"."created_by" = "auth"."uid"()))));



CREATE POLICY "Users can manage progress for their grows" ON "public"."grow_progress" USING (("grow_id" IN ( SELECT "grows"."id"
   FROM "public"."grows"
  WHERE ("grows"."created_by" = "auth"."uid"()))));



CREATE POLICY "Users can manage their own Home Assistant configs" ON "public"."user_home_assistant_configs" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own automation conditions" ON "public"."grow_automation_conditions" USING ((EXISTS ( SELECT 1
   FROM "public"."grows" "g"
  WHERE (("g"."id" = "grow_automation_conditions"."grow_id") AND ("g"."created_by" = "auth"."uid"())))));



CREATE POLICY "Users can manage their own automation rules" ON "public"."grow_automation_rules" USING ((EXISTS ( SELECT 1
   FROM "public"."grows" "g"
  WHERE (("g"."id" = "grow_automation_rules"."grow_id") AND ("g"."created_by" = "auth"."uid"())))));



CREATE POLICY "Users can manage their own automation schedules" ON "public"."grow_automation_schedules" USING ((EXISTS ( SELECT 1
   FROM "public"."grows" "g"
  WHERE (("g"."id" = "grow_automation_schedules"."grow_id") AND ("g"."created_by" = "auth"."uid"())))));



CREATE POLICY "Users can manage their own device profiles" ON "public"."grow_device_profiles" USING ((("created_by" = "auth"."uid"()) OR ("is_template" = true)));



CREATE POLICY "Users can manage their own farms" ON "public"."farms" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can manage their own task logs" ON "public"."task_logs" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their sensor alert thresholds" ON "public"."sensor_alert_thresholds" USING (("device_assignment_id" IN ( SELECT "da"."id"
   FROM (((("public"."device_assignments" "da"
     JOIN "public"."shelves" "s" ON (("da"."shelf_id" = "s"."id")))
     JOIN "public"."racks" "r" ON (("s"."rack_id" = "r"."id")))
     JOIN "public"."rows" "ro" ON (("r"."row_id" = "ro"."id")))
     JOIN "public"."farms" "f" ON (("ro"."farm_id" = "f"."id")))
  WHERE ("f"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can update own grows" ON "public"."grows" FOR UPDATE USING (("created_by" = "auth"."uid"()));



CREATE POLICY "Users can update own recipes" ON "public"."grow_recipes" FOR UPDATE USING (("created_by" = "auth"."uid"()));



CREATE POLICY "Users can update their own device assignments" ON "public"."device_assignments" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own device states" ON "public"."device_states" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view metrics for their grows" ON "public"."grow_monitoring_metrics" FOR SELECT USING (("grow_id" IN ( SELECT "grows"."id"
   FROM "public"."grows"
  WHERE ("grows"."created_by" = "auth"."uid"()))));



CREATE POLICY "Users can view own grow events" ON "public"."grow_events" FOR SELECT USING (("created_by" = "auth"."uid"()));



CREATE POLICY "Users can view own grows" ON "public"."grows" FOR SELECT USING (("created_by" = "auth"."uid"()));



CREATE POLICY "Users can view own harvests" ON "public"."harvests" FOR SELECT USING (("created_by" = "auth"."uid"()));



CREATE POLICY "Users can view own recipes" ON "public"."grow_recipes" FOR SELECT USING ((("created_by" = "auth"."uid"()) OR ("is_template" = true)));



CREATE POLICY "Users can view relevant alerts" ON "public"."grow_alerts" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."grows"
  WHERE (("grows"."id" = "grow_alerts"."grow_id") AND ("grows"."created_by" = "auth"."uid"())))));



CREATE POLICY "Users can view their own automation executions" ON "public"."grow_automation_executions" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."grows" "g"
  WHERE (("g"."id" = "grow_automation_executions"."grow_id") AND ("g"."created_by" = "auth"."uid"())))));



CREATE POLICY "Users can view their own device assignments" ON "public"."device_assignments" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own device history" ON "public"."device_control_history" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own device states" ON "public"."device_states" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own farms" ON "public"."farms" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view their sensor alerts" ON "public"."sensor_alerts" FOR SELECT USING (("device_assignment_id" IN ( SELECT "da"."id"
   FROM (((("public"."device_assignments" "da"
     JOIN "public"."shelves" "s" ON (("da"."shelf_id" = "s"."id")))
     JOIN "public"."racks" "r" ON (("s"."rack_id" = "r"."id")))
     JOIN "public"."rows" "ro" ON (("r"."row_id" = "ro"."id")))
     JOIN "public"."farms" "f" ON (("ro"."farm_id" = "f"."id")))
  WHERE ("f"."user_id" = "auth"."uid"()))));



CREATE POLICY "admins_full_access_farms" ON "public"."farms" USING ("public"."is_admin"());



CREATE POLICY "admins_full_access_profiles" ON "public"."user_profiles" USING ("public"."is_admin"());



CREATE POLICY "admins_full_access_square_configs" ON "public"."user_square_configs" USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "admins_view_all_ha_configs" ON "public"."user_home_assistant_configs" FOR SELECT USING ("public"."is_admin"());



ALTER TABLE "public"."device_assignments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "device_assignments_hierarchy_access" ON "public"."device_assignments" USING (((("farm_id" IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM "public"."farms"
  WHERE (("farms"."id" = "device_assignments"."farm_id") AND ("farms"."user_id" = "auth"."uid"()))))) OR (("row_id" IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM ("public"."rows" "r"
     JOIN "public"."farms" "f" ON (("r"."farm_id" = "f"."id")))
  WHERE (("r"."id" = "device_assignments"."row_id") AND ("f"."user_id" = "auth"."uid"()))))) OR (("rack_id" IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM (("public"."racks" "ra"
     JOIN "public"."rows" "r" ON (("ra"."row_id" = "r"."id")))
     JOIN "public"."farms" "f" ON (("r"."farm_id" = "f"."id")))
  WHERE (("ra"."id" = "device_assignments"."rack_id") AND ("f"."user_id" = "auth"."uid"()))))) OR (("shelf_id" IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM ((("public"."shelves" "s"
     JOIN "public"."racks" "ra" ON (("s"."rack_id" = "ra"."id")))
     JOIN "public"."rows" "r" ON (("ra"."row_id" = "r"."id")))
     JOIN "public"."farms" "f" ON (("r"."farm_id" = "f"."id")))
  WHERE (("s"."id" = "device_assignments"."shelf_id") AND ("f"."user_id" = "auth"."uid"()))))) OR "public"."is_admin"()));



CREATE POLICY "device_assignments_user_access" ON "public"."device_assignments" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "device_configs_delete_own" ON "public"."user_device_configs" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."user_home_assistant_configs"
  WHERE (("user_home_assistant_configs"."id" = "user_device_configs"."user_config_id") AND ("user_home_assistant_configs"."user_id" = "auth"."uid"())))));



CREATE POLICY "device_configs_insert_own" ON "public"."user_device_configs" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_home_assistant_configs"
  WHERE (("user_home_assistant_configs"."id" = "user_device_configs"."user_config_id") AND ("user_home_assistant_configs"."user_id" = "auth"."uid"())))));



CREATE POLICY "device_configs_select_own" ON "public"."user_device_configs" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."user_home_assistant_configs"
  WHERE (("user_home_assistant_configs"."id" = "user_device_configs"."user_config_id") AND ("user_home_assistant_configs"."user_id" = "auth"."uid"())))));



CREATE POLICY "device_configs_update_own" ON "public"."user_device_configs" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."user_home_assistant_configs"
  WHERE (("user_home_assistant_configs"."id" = "user_device_configs"."user_config_id") AND ("user_home_assistant_configs"."user_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_home_assistant_configs"
  WHERE (("user_home_assistant_configs"."id" = "user_device_configs"."user_config_id") AND ("user_home_assistant_configs"."user_id" = "auth"."uid"())))));



ALTER TABLE "public"."device_control_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."device_history" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "device_history_user_access" ON "public"."device_history" USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."device_schedules" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "device_schedules_user_access" ON "public"."device_schedules" USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."device_states" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."farms" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "farms_admin_access" ON "public"."farms" USING ("public"."is_admin"());



CREATE POLICY "farms_delete_by_manager" ON "public"."farms" FOR DELETE USING ((("user_id" = "auth"."uid"()) OR "public"."is_admin"()));



CREATE POLICY "farms_insert_by_authenticated" ON "public"."farms" FOR INSERT WITH CHECK ((("auth"."uid"() IS NOT NULL) AND ("user_id" = "auth"."uid"())));



CREATE POLICY "farms_limited_public_read" ON "public"."farms" FOR SELECT USING (true);



CREATE POLICY "farms_manager_access" ON "public"."farms" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "farms_public_read" ON "public"."farms" FOR SELECT USING (true);



CREATE POLICY "farms_select_by_manager" ON "public"."farms" FOR SELECT USING ((("user_id" = "auth"."uid"()) OR "public"."is_admin"()));



COMMENT ON POLICY "farms_select_by_manager" ON "public"."farms" IS 'Security fix: Users can only view farms they manage or if they are admin. Replaces the insecure farms_public_read policy that allowed all users to see all farms.';



CREATE POLICY "farms_update_by_manager" ON "public"."farms" FOR UPDATE USING ((("user_id" = "auth"."uid"()) OR "public"."is_admin"())) WITH CHECK ((("user_id" = "auth"."uid"()) OR "public"."is_admin"()));



ALTER TABLE "public"."grow_alerts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."grow_automation_conditions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."grow_automation_executions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."grow_automation_rules" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."grow_automation_schedules" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."grow_device_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."grow_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."grow_monitoring_metrics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."grow_observations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."grow_progress" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."grow_recipes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."grow_stages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."grows" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ha_configs_delete_own" ON "public"."user_home_assistant_configs" FOR DELETE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "ha_configs_insert_own" ON "public"."user_home_assistant_configs" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "ha_configs_select_own" ON "public"."user_home_assistant_configs" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "ha_configs_update_own" ON "public"."user_home_assistant_configs" FOR UPDATE USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "ha_devices_user_access" ON "public"."home_assistant_devices" USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."harvests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."home_assistant_devices" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."integrations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "integrations_user_access" ON "public"."integrations" USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."job_queue" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."monitoring_thresholds" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."racks" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "racks_farm_based_access" ON "public"."racks" USING ((EXISTS ( SELECT 1
   FROM ("public"."rows" "r"
     JOIN "public"."farms" "f" ON (("r"."farm_id" = "f"."id")))
  WHERE (("r"."id" = "racks"."row_id") AND (("f"."user_id" = "auth"."uid"()) OR "public"."is_admin"())))));



ALTER TABLE "public"."rows" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "rows_farm_based_access" ON "public"."rows" USING ((EXISTS ( SELECT 1
   FROM "public"."farms"
  WHERE (("farms"."id" = "rows"."farm_id") AND (("farms"."user_id" = "auth"."uid"()) OR "public"."is_admin"())))));



ALTER TABLE "public"."sensor_alert_thresholds" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sensor_alerts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."shelves" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "shelves_farm_based_access" ON "public"."shelves" USING ((EXISTS ( SELECT 1
   FROM (("public"."racks" "ra"
     JOIN "public"."rows" "r" ON (("ra"."row_id" = "r"."id")))
     JOIN "public"."farms" "f" ON (("r"."farm_id" = "f"."id")))
  WHERE (("ra"."id" = "shelves"."rack_id") AND (("f"."user_id" = "auth"."uid"()) OR "public"."is_admin"())))));



CREATE POLICY "square_configs_delete_own" ON "public"."user_square_configs" FOR DELETE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "square_configs_insert_own" ON "public"."user_square_configs" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "square_configs_select_own" ON "public"."user_square_configs" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "square_configs_update_own" ON "public"."user_square_configs" FOR UPDATE USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."task_logs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "task_logs_admin_access" ON "public"."task_logs" USING ((("auth"."jwt"() ->> 'role'::"text") = 'service_role'::"text"));



ALTER TABLE "public"."user_device_configs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_home_assistant_configs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_square_configs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "users_insert_own_profile" ON "public"."user_profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "users_select_own_profile" ON "public"."user_profiles" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "users_update_own_profile" ON "public"."user_profiles" FOR UPDATE USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."automation_rules";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."device_assignments";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."device_states";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."farms";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."grow_alerts";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."grow_automation_conditions";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."grow_automation_executions";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."grow_automation_rules";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."grow_automation_schedules";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."grow_monitoring_metrics";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."grow_observations";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."grow_progress";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."grow_recipes";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."harvests";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."racks";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."rows";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."scheduled_actions";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."schedules";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."sensor_alerts";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."shelves";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."species";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."user_device_configs";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."user_home_assistant_configs";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."user_profiles";






GRANT USAGE ON SCHEMA "pgmq_public" TO "anon";
GRANT USAGE ON SCHEMA "pgmq_public" TO "authenticated";
GRANT USAGE ON SCHEMA "pgmq_public" TO "service_role";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "service_role";


















































































































































































































GRANT ALL ON FUNCTION "pgmq_public"."archive"("queue_name" "text", "message_id" bigint) TO "service_role";
GRANT ALL ON FUNCTION "pgmq_public"."archive"("queue_name" "text", "message_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "pgmq_public"."archive"("queue_name" "text", "message_id" bigint) TO "authenticated";



GRANT ALL ON FUNCTION "pgmq_public"."delete"("queue_name" "text", "message_id" bigint) TO "service_role";
GRANT ALL ON FUNCTION "pgmq_public"."delete"("queue_name" "text", "message_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "pgmq_public"."delete"("queue_name" "text", "message_id" bigint) TO "authenticated";



GRANT ALL ON FUNCTION "pgmq_public"."pop"("queue_name" "text") TO "service_role";
GRANT ALL ON FUNCTION "pgmq_public"."pop"("queue_name" "text") TO "anon";
GRANT ALL ON FUNCTION "pgmq_public"."pop"("queue_name" "text") TO "authenticated";



GRANT ALL ON FUNCTION "pgmq_public"."read"("queue_name" "text", "sleep_seconds" integer, "n" integer) TO "service_role";
GRANT ALL ON FUNCTION "pgmq_public"."read"("queue_name" "text", "sleep_seconds" integer, "n" integer) TO "anon";
GRANT ALL ON FUNCTION "pgmq_public"."read"("queue_name" "text", "sleep_seconds" integer, "n" integer) TO "authenticated";



GRANT ALL ON FUNCTION "pgmq_public"."send"("queue_name" "text", "message" "jsonb", "sleep_seconds" integer) TO "service_role";
GRANT ALL ON FUNCTION "pgmq_public"."send"("queue_name" "text", "message" "jsonb", "sleep_seconds" integer) TO "anon";
GRANT ALL ON FUNCTION "pgmq_public"."send"("queue_name" "text", "message" "jsonb", "sleep_seconds" integer) TO "authenticated";



GRANT ALL ON FUNCTION "pgmq_public"."send_batch"("queue_name" "text", "messages" "jsonb"[], "sleep_seconds" integer) TO "service_role";
GRANT ALL ON FUNCTION "pgmq_public"."send_batch"("queue_name" "text", "messages" "jsonb"[], "sleep_seconds" integer) TO "anon";
GRANT ALL ON FUNCTION "pgmq_public"."send_batch"("queue_name" "text", "messages" "jsonb"[], "sleep_seconds" integer) TO "authenticated";



GRANT ALL ON FUNCTION "public"."calculate_grow_health_score"("p_grow_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_grow_health_score"("p_grow_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_grow_health_score"("p_grow_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_harvest_date"("p_planted_date" "date", "p_recipe_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_harvest_date"("p_planted_date" "date", "p_recipe_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_harvest_date"("p_planted_date" "date", "p_recipe_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_schedule_end_date"() TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_schedule_end_date"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_schedule_end_date"() TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_total_grow_days"() TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_total_grow_days"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_total_grow_days"() TO "service_role";



GRANT ALL ON FUNCTION "public"."check_user_permissions"("target_table_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."check_user_permissions"("target_table_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_user_permissions"("target_table_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_completed_jobs"("p_days_old" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_completed_jobs"("p_days_old" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_completed_jobs"("p_days_old" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_old_sensor_data"("days_to_keep" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_old_sensor_data"("days_to_keep" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_old_sensor_data"("days_to_keep" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_old_sensor_readings"("retention_days" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_old_sensor_readings"("retention_days" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_old_sensor_readings"("retention_days" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_orphaned_storage_files"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_orphaned_storage_files"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_orphaned_storage_files"() TO "service_role";



GRANT ALL ON FUNCTION "public"."complete_job"("p_job_id" "uuid", "p_status" "text", "p_error_message" "text", "p_execution_time_ms" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."complete_job"("p_job_id" "uuid", "p_status" "text", "p_error_message" "text", "p_execution_time_ms" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."complete_job"("p_job_id" "uuid", "p_status" "text", "p_error_message" "text", "p_execution_time_ms" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."create_automation_schedule"("grow_id_param" "uuid", "device_assignment_id_param" "uuid", "schedule_name_param" character varying, "schedule_type_param" character varying, "device_action_param" "jsonb", "cron_expression_param" character varying, "starts_at_param" timestamp with time zone, "ends_at_param" timestamp with time zone, "created_by_param" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."create_automation_schedule"("grow_id_param" "uuid", "device_assignment_id_param" "uuid", "schedule_name_param" character varying, "schedule_type_param" character varying, "device_action_param" "jsonb", "cron_expression_param" character varying, "starts_at_param" timestamp with time zone, "ends_at_param" timestamp with time zone, "created_by_param" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_automation_schedule"("grow_id_param" "uuid", "device_assignment_id_param" "uuid", "schedule_name_param" character varying, "schedule_type_param" character varying, "device_action_param" "jsonb", "cron_expression_param" character varying, "starts_at_param" timestamp with time zone, "ends_at_param" timestamp with time zone, "created_by_param" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_grow_from_recipe"("p_name" character varying, "p_recipe_id" "uuid", "p_seed_variety_id" "uuid", "p_location_ids" "uuid"[], "p_plant_count" integer, "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."create_grow_from_recipe"("p_name" character varying, "p_recipe_id" "uuid", "p_seed_variety_id" "uuid", "p_location_ids" "uuid"[], "p_plant_count" integer, "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_grow_from_recipe"("p_name" character varying, "p_recipe_id" "uuid", "p_seed_variety_id" "uuid", "p_location_ids" "uuid"[], "p_plant_count" integer, "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."delete_queue_message"("queue_name" "text", "msg_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."delete_queue_message"("queue_name" "text", "msg_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_queue_message"("queue_name" "text", "msg_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."enqueue_job"("p_queue_name" "text", "p_job_type" "text", "p_payload" "jsonb", "p_priority" integer, "p_scheduled_for" timestamp with time zone, "p_max_attempts" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."enqueue_job"("p_queue_name" "text", "p_job_type" "text", "p_payload" "jsonb", "p_priority" integer, "p_scheduled_for" timestamp with time zone, "p_max_attempts" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."enqueue_job"("p_queue_name" "text", "p_job_type" "text", "p_payload" "jsonb", "p_priority" integer, "p_scheduled_for" timestamp with time zone, "p_max_attempts" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."ensure_single_default_ha_config"() TO "anon";
GRANT ALL ON FUNCTION "public"."ensure_single_default_ha_config"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."ensure_single_default_ha_config"() TO "service_role";



GRANT ALL ON FUNCTION "public"."ensure_single_default_square_config"() TO "anon";
GRANT ALL ON FUNCTION "public"."ensure_single_default_square_config"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."ensure_single_default_square_config"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_storage_path"("bucket_name" "text", "folder_id" "uuid", "file_name" "text", "user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_storage_path"("bucket_name" "text", "folder_id" "uuid", "file_name" "text", "user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_storage_path"("bucket_name" "text", "folder_id" "uuid", "file_name" "text", "user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_active_schedules_with_progress"("farm_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_active_schedules_with_progress"("farm_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_active_schedules_with_progress"("farm_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_available_locations"("p_capacity_needed" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_available_locations"("p_capacity_needed" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_available_locations"("p_capacity_needed" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_device_status_summary"("farm_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_device_status_summary"("farm_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_device_status_summary"("farm_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_environmental_summary"("p_grow_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_environmental_summary"("p_grow_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_environmental_summary"("p_grow_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_farm_hierarchy"("farm_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_farm_hierarchy"("farm_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_farm_hierarchy"("farm_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_farm_statistics"("farm_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_farm_statistics"("farm_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_farm_statistics"("farm_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_grow_device_assignments"("grow_id_param" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_grow_device_assignments"("grow_id_param" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_grow_device_assignments"("grow_id_param" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_grow_timeline"("p_grow_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_grow_timeline"("p_grow_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_grow_timeline"("p_grow_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_harvest_analytics"("farm_uuid" "uuid", "start_date" "date", "end_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."get_harvest_analytics"("farm_uuid" "uuid", "start_date" "date", "end_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_harvest_analytics"("farm_uuid" "uuid", "start_date" "date", "end_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_latest_grow_metrics"("p_grow_id" "uuid", "p_hours" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_latest_grow_metrics"("p_grow_id" "uuid", "p_hours" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_latest_grow_metrics"("p_grow_id" "uuid", "p_hours" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_location_devices"("p_user_id" "uuid", "p_location_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_location_devices"("p_user_id" "uuid", "p_location_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_location_devices"("p_user_id" "uuid", "p_location_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_next_job"("p_queue_name" "text", "p_worker_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_next_job"("p_queue_name" "text", "p_worker_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_next_job"("p_queue_name" "text", "p_worker_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_queue_stats"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_queue_stats"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_queue_stats"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_accessible_farms"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_accessible_farms"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_accessible_farms"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_storage_usage"("user_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_storage_usage"("user_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_storage_usage"("user_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_storage_upload"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_storage_upload"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_storage_upload"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."log_automation_execution"("grow_id_param" "uuid", "automation_type_param" character varying, "automation_id_param" "uuid", "device_assignment_id_param" "uuid", "action_taken_param" "jsonb", "execution_status_param" character varying, "execution_result_param" "jsonb", "error_message_param" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."log_automation_execution"("grow_id_param" "uuid", "automation_type_param" character varying, "automation_id_param" "uuid", "device_assignment_id_param" "uuid", "action_taken_param" "jsonb", "execution_status_param" character varying, "execution_result_param" "jsonb", "error_message_param" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_automation_execution"("grow_id_param" "uuid", "automation_type_param" character varying, "automation_id_param" "uuid", "device_assignment_id_param" "uuid", "action_taken_param" "jsonb", "execution_status_param" character varying, "execution_result_param" "jsonb", "error_message_param" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."log_device_control"("p_user_id" "uuid", "p_entity_id" "text", "p_action_type" "text", "p_previous_state" "text", "p_new_state" "text", "p_triggered_by" "text", "p_success" boolean, "p_error_message" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."log_device_control"("p_user_id" "uuid", "p_entity_id" "text", "p_action_type" "text", "p_previous_state" "text", "p_new_state" "text", "p_triggered_by" "text", "p_success" boolean, "p_error_message" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_device_control"("p_user_id" "uuid", "p_entity_id" "text", "p_action_type" "text", "p_previous_state" "text", "p_new_state" "text", "p_triggered_by" "text", "p_success" boolean, "p_error_message" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."log_task_execution"("p_task_id" "text", "p_task_type" "text", "p_priority" "text", "p_success" boolean, "p_execution_time" integer, "p_error_message" "text", "p_retry_count" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."log_task_execution"("p_task_id" "text", "p_task_type" "text", "p_priority" "text", "p_success" boolean, "p_execution_time" integer, "p_error_message" "text", "p_retry_count" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_task_execution"("p_task_id" "text", "p_task_type" "text", "p_priority" "text", "p_success" boolean, "p_execution_time" integer, "p_error_message" "text", "p_retry_count" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."log_task_execution"("p_task_id" "text", "p_task_type" "text", "p_priority" "text", "p_success" boolean, "p_execution_time_ms" integer, "p_error_message" "text", "p_retry_count" integer, "p_queue_name" "text", "p_worker_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."log_task_execution"("p_task_id" "text", "p_task_type" "text", "p_priority" "text", "p_success" boolean, "p_execution_time_ms" integer, "p_error_message" "text", "p_retry_count" integer, "p_queue_name" "text", "p_worker_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_task_execution"("p_task_id" "text", "p_task_type" "text", "p_priority" "text", "p_success" boolean, "p_execution_time_ms" integer, "p_error_message" "text", "p_retry_count" integer, "p_queue_name" "text", "p_worker_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."move_to_failed_queue"("original_queue" "text", "msg_id" bigint, "error_message" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."move_to_failed_queue"("original_queue" "text", "msg_id" bigint, "error_message" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."move_to_failed_queue"("original_queue" "text", "msg_id" bigint, "error_message" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_important_changes"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_important_changes"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_important_changes"() TO "service_role";



GRANT ALL ON FUNCTION "public"."process_scheduled_automations"() TO "anon";
GRANT ALL ON FUNCTION "public"."process_scheduled_automations"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_scheduled_automations"() TO "service_role";



GRANT ALL ON FUNCTION "public"."queue_background_task"("task_type" "text", "priority" "text", "payload" "jsonb", "user_id_param" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."queue_background_task"("task_type" "text", "priority" "text", "payload" "jsonb", "user_id_param" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."queue_background_task"("task_type" "text", "priority" "text", "payload" "jsonb", "user_id_param" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."read_queue_messages"("queue_name" "text", "batch_size" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."read_queue_messages"("queue_name" "text", "batch_size" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."read_queue_messages"("queue_name" "text", "batch_size" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."resolve_old_alerts"() TO "anon";
GRANT ALL ON FUNCTION "public"."resolve_old_alerts"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."resolve_old_alerts"() TO "service_role";



GRANT ALL ON FUNCTION "public"."retry_failed_job"("p_job_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."retry_failed_job"("p_job_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."retry_failed_job"("p_job_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."schedule_grow_automation_jobs"() TO "anon";
GRANT ALL ON FUNCTION "public"."schedule_grow_automation_jobs"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."schedule_grow_automation_jobs"() TO "service_role";



GRANT ALL ON FUNCTION "public"."schedule_sensor_processing"() TO "anon";
GRANT ALL ON FUNCTION "public"."schedule_sensor_processing"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."schedule_sensor_processing"() TO "service_role";



GRANT ALL ON FUNCTION "public"."search_devices"("search_term" "text", "farm_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."search_devices"("search_term" "text", "farm_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_devices"("search_term" "text", "farm_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."send_queue_message"("queue_name" "text", "message_data" "jsonb", "delay_seconds" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."send_queue_message"("queue_name" "text", "message_data" "jsonb", "delay_seconds" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."send_queue_message"("queue_name" "text", "message_data" "jsonb", "delay_seconds" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "postgres";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "anon";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "service_role";



GRANT ALL ON FUNCTION "public"."setup_test_data"() TO "anon";
GRANT ALL ON FUNCTION "public"."setup_test_data"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."setup_test_data"() TO "service_role";



GRANT ALL ON FUNCTION "public"."show_limit"() TO "postgres";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "anon";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "service_role";



GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_automation_rule"("rule_id" "uuid", "context_data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_automation_rule"("rule_id" "uuid", "context_data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_automation_rule"("rule_id" "uuid", "context_data" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_schedule_automation"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_schedule_automation"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_schedule_automation"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_sensor_processing"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_sensor_processing"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_sensor_processing"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_automation_timestamp"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_automation_timestamp"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_automation_timestamp"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_device_state"("p_user_id" "uuid", "p_entity_id" "text", "p_state" "text", "p_attributes" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."update_device_state"("p_user_id" "uuid", "p_entity_id" "text", "p_state" "text", "p_attributes" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_device_state"("p_user_id" "uuid", "p_entity_id" "text", "p_state" "text", "p_attributes" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_grow_timestamp"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_grow_timestamp"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_grow_timestamp"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_sensor_alerts_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_sensor_alerts_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_sensor_alerts_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."user_can_access_farm"("farm_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."user_can_access_farm"("farm_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."user_can_access_farm"("farm_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."uuid_generate_v4"() TO "anon";
GRANT ALL ON FUNCTION "public"."uuid_generate_v4"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."uuid_generate_v4"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_data_integrity"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_data_integrity"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_data_integrity"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_device_assignment"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_device_assignment"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_device_assignment"() TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "service_role";



























GRANT ALL ON TABLE "public"."device_assignments" TO "anon";
GRANT ALL ON TABLE "public"."device_assignments" TO "authenticated";
GRANT ALL ON TABLE "public"."device_assignments" TO "service_role";



GRANT ALL ON TABLE "public"."sensor_alert_thresholds" TO "anon";
GRANT ALL ON TABLE "public"."sensor_alert_thresholds" TO "authenticated";
GRANT ALL ON TABLE "public"."sensor_alert_thresholds" TO "service_role";



GRANT ALL ON TABLE "public"."sensor_alerts" TO "anon";
GRANT ALL ON TABLE "public"."sensor_alerts" TO "authenticated";
GRANT ALL ON TABLE "public"."sensor_alerts" TO "service_role";



GRANT ALL ON TABLE "public"."active_sensor_alerts" TO "anon";
GRANT ALL ON TABLE "public"."active_sensor_alerts" TO "authenticated";
GRANT ALL ON TABLE "public"."active_sensor_alerts" TO "service_role";



GRANT ALL ON TABLE "public"."alerts" TO "anon";
GRANT ALL ON TABLE "public"."alerts" TO "authenticated";
GRANT ALL ON TABLE "public"."alerts" TO "service_role";



GRANT ALL ON TABLE "public"."automation_rules" TO "anon";
GRANT ALL ON TABLE "public"."automation_rules" TO "authenticated";
GRANT ALL ON TABLE "public"."automation_rules" TO "service_role";



GRANT ALL ON TABLE "public"."background_tasks" TO "anon";
GRANT ALL ON TABLE "public"."background_tasks" TO "authenticated";
GRANT ALL ON TABLE "public"."background_tasks" TO "service_role";



GRANT ALL ON TABLE "public"."crops" TO "anon";
GRANT ALL ON TABLE "public"."crops" TO "authenticated";
GRANT ALL ON TABLE "public"."crops" TO "service_role";



GRANT ALL ON TABLE "public"."grow_alerts" TO "anon";
GRANT ALL ON TABLE "public"."grow_alerts" TO "authenticated";
GRANT ALL ON TABLE "public"."grow_alerts" TO "service_role";



GRANT ALL ON TABLE "public"."grow_location_assignments" TO "anon";
GRANT ALL ON TABLE "public"."grow_location_assignments" TO "authenticated";
GRANT ALL ON TABLE "public"."grow_location_assignments" TO "service_role";



GRANT ALL ON TABLE "public"."grow_locations" TO "anon";
GRANT ALL ON TABLE "public"."grow_locations" TO "authenticated";
GRANT ALL ON TABLE "public"."grow_locations" TO "service_role";



GRANT ALL ON TABLE "public"."grow_recipes" TO "anon";
GRANT ALL ON TABLE "public"."grow_recipes" TO "authenticated";
GRANT ALL ON TABLE "public"."grow_recipes" TO "service_role";



GRANT ALL ON TABLE "public"."grow_stages" TO "anon";
GRANT ALL ON TABLE "public"."grow_stages" TO "authenticated";
GRANT ALL ON TABLE "public"."grow_stages" TO "service_role";



GRANT ALL ON TABLE "public"."grows" TO "anon";
GRANT ALL ON TABLE "public"."grows" TO "authenticated";
GRANT ALL ON TABLE "public"."grows" TO "service_role";



GRANT ALL ON TABLE "public"."seed_varieties" TO "anon";
GRANT ALL ON TABLE "public"."seed_varieties" TO "authenticated";
GRANT ALL ON TABLE "public"."seed_varieties" TO "service_role";



GRANT ALL ON TABLE "public"."species" TO "anon";
GRANT ALL ON TABLE "public"."species" TO "authenticated";
GRANT ALL ON TABLE "public"."species" TO "service_role";



GRANT ALL ON TABLE "public"."current_grows_view" TO "anon";
GRANT ALL ON TABLE "public"."current_grows_view" TO "authenticated";
GRANT ALL ON TABLE "public"."current_grows_view" TO "service_role";



GRANT ALL ON TABLE "public"."device_control_history" TO "anon";
GRANT ALL ON TABLE "public"."device_control_history" TO "authenticated";
GRANT ALL ON TABLE "public"."device_control_history" TO "service_role";



GRANT ALL ON TABLE "public"."device_history" TO "anon";
GRANT ALL ON TABLE "public"."device_history" TO "authenticated";
GRANT ALL ON TABLE "public"."device_history" TO "service_role";



GRANT ALL ON SEQUENCE "public"."device_history_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."device_history_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."device_history_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."device_schedules" TO "anon";
GRANT ALL ON TABLE "public"."device_schedules" TO "authenticated";
GRANT ALL ON TABLE "public"."device_schedules" TO "service_role";



GRANT ALL ON SEQUENCE "public"."device_schedules_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."device_schedules_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."device_schedules_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."device_states" TO "anon";
GRANT ALL ON TABLE "public"."device_states" TO "authenticated";
GRANT ALL ON TABLE "public"."device_states" TO "service_role";



GRANT ALL ON TABLE "public"."farms" TO "anon";
GRANT ALL ON TABLE "public"."farms" TO "authenticated";
GRANT ALL ON TABLE "public"."farms" TO "service_role";



GRANT ALL ON TABLE "public"."harvests" TO "anon";
GRANT ALL ON TABLE "public"."harvests" TO "authenticated";
GRANT ALL ON TABLE "public"."harvests" TO "service_role";



GRANT ALL ON TABLE "public"."grow_analytics_view" TO "anon";
GRANT ALL ON TABLE "public"."grow_analytics_view" TO "authenticated";
GRANT ALL ON TABLE "public"."grow_analytics_view" TO "service_role";



GRANT ALL ON TABLE "public"."grow_automation_conditions" TO "anon";
GRANT ALL ON TABLE "public"."grow_automation_conditions" TO "authenticated";
GRANT ALL ON TABLE "public"."grow_automation_conditions" TO "service_role";



GRANT ALL ON TABLE "public"."grow_automation_executions" TO "anon";
GRANT ALL ON TABLE "public"."grow_automation_executions" TO "authenticated";
GRANT ALL ON TABLE "public"."grow_automation_executions" TO "service_role";



GRANT ALL ON TABLE "public"."grow_automation_rules" TO "anon";
GRANT ALL ON TABLE "public"."grow_automation_rules" TO "authenticated";
GRANT ALL ON TABLE "public"."grow_automation_rules" TO "service_role";



GRANT ALL ON TABLE "public"."grow_automation_schedules" TO "anon";
GRANT ALL ON TABLE "public"."grow_automation_schedules" TO "authenticated";
GRANT ALL ON TABLE "public"."grow_automation_schedules" TO "service_role";



GRANT ALL ON TABLE "public"."grow_device_profiles" TO "anon";
GRANT ALL ON TABLE "public"."grow_device_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."grow_device_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."grow_events" TO "anon";
GRANT ALL ON TABLE "public"."grow_events" TO "authenticated";
GRANT ALL ON TABLE "public"."grow_events" TO "service_role";



GRANT ALL ON TABLE "public"."grow_monitoring_metrics" TO "anon";
GRANT ALL ON TABLE "public"."grow_monitoring_metrics" TO "authenticated";
GRANT ALL ON TABLE "public"."grow_monitoring_metrics" TO "service_role";



GRANT ALL ON TABLE "public"."grow_observations" TO "anon";
GRANT ALL ON TABLE "public"."grow_observations" TO "authenticated";
GRANT ALL ON TABLE "public"."grow_observations" TO "service_role";



GRANT ALL ON TABLE "public"."grow_overview" TO "anon";
GRANT ALL ON TABLE "public"."grow_overview" TO "authenticated";
GRANT ALL ON TABLE "public"."grow_overview" TO "service_role";



GRANT ALL ON TABLE "public"."grow_parameters" TO "anon";
GRANT ALL ON TABLE "public"."grow_parameters" TO "authenticated";
GRANT ALL ON TABLE "public"."grow_parameters" TO "service_role";



GRANT ALL ON TABLE "public"."grow_progress" TO "anon";
GRANT ALL ON TABLE "public"."grow_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."grow_progress" TO "service_role";



GRANT ALL ON TABLE "public"."home_assistant_devices" TO "anon";
GRANT ALL ON TABLE "public"."home_assistant_devices" TO "authenticated";
GRANT ALL ON TABLE "public"."home_assistant_devices" TO "service_role";



GRANT ALL ON SEQUENCE "public"."home_assistant_devices_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."home_assistant_devices_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."home_assistant_devices_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."integration_sync_log" TO "anon";
GRANT ALL ON TABLE "public"."integration_sync_log" TO "authenticated";
GRANT ALL ON TABLE "public"."integration_sync_log" TO "service_role";



GRANT ALL ON SEQUENCE "public"."integration_sync_log_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."integration_sync_log_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."integration_sync_log_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."integrations" TO "anon";
GRANT ALL ON TABLE "public"."integrations" TO "authenticated";
GRANT ALL ON TABLE "public"."integrations" TO "service_role";



GRANT ALL ON TABLE "public"."job_queue" TO "anon";
GRANT ALL ON TABLE "public"."job_queue" TO "authenticated";
GRANT ALL ON TABLE "public"."job_queue" TO "service_role";



GRANT ALL ON TABLE "public"."monitoring_thresholds" TO "anon";
GRANT ALL ON TABLE "public"."monitoring_thresholds" TO "authenticated";
GRANT ALL ON TABLE "public"."monitoring_thresholds" TO "service_role";



GRANT ALL ON TABLE "public"."queue_config" TO "anon";
GRANT ALL ON TABLE "public"."queue_config" TO "authenticated";
GRANT ALL ON TABLE "public"."queue_config" TO "service_role";



GRANT ALL ON TABLE "public"."racks" TO "anon";
GRANT ALL ON TABLE "public"."racks" TO "authenticated";
GRANT ALL ON TABLE "public"."racks" TO "service_role";



GRANT ALL ON TABLE "public"."realtime_status" TO "anon";
GRANT ALL ON TABLE "public"."realtime_status" TO "authenticated";
GRANT ALL ON TABLE "public"."realtime_status" TO "service_role";



GRANT ALL ON TABLE "public"."recipe_performance_view" TO "anon";
GRANT ALL ON TABLE "public"."recipe_performance_view" TO "authenticated";
GRANT ALL ON TABLE "public"."recipe_performance_view" TO "service_role";



GRANT ALL ON TABLE "public"."recipe_stage_parameters" TO "anon";
GRANT ALL ON TABLE "public"."recipe_stage_parameters" TO "authenticated";
GRANT ALL ON TABLE "public"."recipe_stage_parameters" TO "service_role";



GRANT ALL ON TABLE "public"."rows" TO "anon";
GRANT ALL ON TABLE "public"."rows" TO "authenticated";
GRANT ALL ON TABLE "public"."rows" TO "service_role";



GRANT ALL ON TABLE "public"."schedule_events" TO "anon";
GRANT ALL ON TABLE "public"."schedule_events" TO "authenticated";
GRANT ALL ON TABLE "public"."schedule_events" TO "service_role";



GRANT ALL ON TABLE "public"."scheduled_actions" TO "anon";
GRANT ALL ON TABLE "public"."scheduled_actions" TO "authenticated";
GRANT ALL ON TABLE "public"."scheduled_actions" TO "service_role";



GRANT ALL ON TABLE "public"."schedules" TO "anon";
GRANT ALL ON TABLE "public"."schedules" TO "authenticated";
GRANT ALL ON TABLE "public"."schedules" TO "service_role";



GRANT ALL ON TABLE "public"."security_audit_view" TO "anon";
GRANT ALL ON TABLE "public"."security_audit_view" TO "authenticated";
GRANT ALL ON TABLE "public"."security_audit_view" TO "service_role";



GRANT ALL ON TABLE "public"."sensor_readings" TO "anon";
GRANT ALL ON TABLE "public"."sensor_readings" TO "authenticated";
GRANT ALL ON TABLE "public"."sensor_readings" TO "service_role";



GRANT ALL ON SEQUENCE "public"."sensor_readings_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."sensor_readings_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."sensor_readings_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."shelves" TO "anon";
GRANT ALL ON TABLE "public"."shelves" TO "authenticated";
GRANT ALL ON TABLE "public"."shelves" TO "service_role";



GRANT ALL ON TABLE "public"."task_logs" TO "anon";
GRANT ALL ON TABLE "public"."task_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."task_logs" TO "service_role";



GRANT ALL ON SEQUENCE "public"."task_logs_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."task_logs_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."task_logs_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."user_device_configs" TO "anon";
GRANT ALL ON TABLE "public"."user_device_configs" TO "authenticated";
GRANT ALL ON TABLE "public"."user_device_configs" TO "service_role";



GRANT ALL ON TABLE "public"."user_home_assistant_configs" TO "anon";
GRANT ALL ON TABLE "public"."user_home_assistant_configs" TO "authenticated";
GRANT ALL ON TABLE "public"."user_home_assistant_configs" TO "service_role";



GRANT ALL ON TABLE "public"."user_profiles" TO "anon";
GRANT ALL ON TABLE "public"."user_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."user_square_configs" TO "anon";
GRANT ALL ON TABLE "public"."user_square_configs" TO "authenticated";
GRANT ALL ON TABLE "public"."user_square_configs" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






























RESET ALL;
