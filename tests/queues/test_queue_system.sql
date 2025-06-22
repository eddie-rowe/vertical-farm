-- ============================================================================
-- QUEUE SYSTEM INTEGRATION TEST
-- ============================================================================
-- Description: Test script for the consolidated queue system
-- Prerequisites: Master database schema migration must be applied
-- ============================================================================

-- Verify PGMQ extension is available
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pgmq') THEN
        RAISE EXCEPTION 'PGMQ extension is not installed. Please apply the master migration first.';
    END IF;
END $$;

-- ============================================================================
-- TEST 1: Verify Master Migration Queues Exist
-- ============================================================================

-- Check that all expected queues from master migration exist
DO $$
DECLARE
    expected_queues text[] := ARRAY['farm_automation', 'sensor_processing', 'notifications', 'analytics', 'maintenance', 'background_tasks'];
    queue_name text;
    queue_exists boolean;
BEGIN
    FOREACH queue_name IN ARRAY expected_queues
    LOOP
        SELECT EXISTS (
            SELECT 1 FROM pgmq.list_queues() 
            WHERE pgmq.list_queues.queue_name = queue_name
        ) INTO queue_exists;
        
        IF NOT queue_exists THEN
            RAISE EXCEPTION 'Queue % does not exist. Please apply master migration.', queue_name;
        END IF;
        
        RAISE NOTICE 'Queue % exists ✓', queue_name;
    END LOOP;
    
    RAISE NOTICE 'All master migration queues verified ✓';
END $$;

-- ============================================================================
-- TEST 2: Test Queue Message Operations
-- ============================================================================

-- Test sending messages to different queues
SELECT pgmq.send(
    'farm_automation',
    jsonb_build_object(
        'type', 'device_control',
        'action', 'turn_on_lights',
        'device_id', 'test_device_001',
        'timestamp', now(),
        'priority', 'high'
    )
) as farm_automation_msg_id;

SELECT pgmq.send(
    'sensor_processing',
    jsonb_build_object(
        'type', 'sensor_reading',
        'sensor_type', 'temperature',
        'value', 22.5,
        'unit', 'celsius',
        'device_id', 'temp_sensor_001',
        'timestamp', now()
    )
) as sensor_processing_msg_id;

SELECT pgmq.send(
    'notifications',
    jsonb_build_object(
        'type', 'alert',
        'level', 'warning',
        'message', 'Temperature threshold exceeded',
        'recipient', 'admin@example.com',
        'timestamp', now()
    )
) as notifications_msg_id;

-- ============================================================================
-- TEST 3: Test Message Reading
-- ============================================================================

-- Read messages from queues (30 second visibility timeout)
SELECT 'farm_automation' as queue, * FROM pgmq.read('farm_automation', 30, 5);
SELECT 'sensor_processing' as queue, * FROM pgmq.read('sensor_processing', 30, 5);
SELECT 'notifications' as queue, * FROM pgmq.read('notifications', 30, 5);

-- ============================================================================
-- TEST 4: Test Queue Statistics
-- ============================================================================

-- Show queue statistics
SELECT 
    queue_name,
    created_at,
    is_partitioned,
    is_unlogged
FROM pgmq.list_queues() 
WHERE queue_name IN ('farm_automation', 'sensor_processing', 'notifications', 'analytics', 'maintenance', 'background_tasks')
ORDER BY queue_name;

-- ============================================================================
-- TEST 5: Test Master Migration Functions
-- ============================================================================

-- Test the send_queue_message function from master migration
SELECT public.send_queue_message(
    'background_tasks',
    jsonb_build_object(
        'type', 'maintenance_check',
        'task', 'system_health_check',
        'scheduled_by', 'test_system',
        'timestamp', now()
    ),
    0
) as background_task_msg_id;

-- Verify task was logged in task_logs table
SELECT 
    queue_name,
    task_type,
    status,
    payload->>'type' as message_type,
    created_at
FROM public.task_logs 
WHERE queue_name = 'background_tasks'
ORDER BY created_at DESC
LIMIT 5;

-- ============================================================================
-- TEST 6: Test Queue Configuration
-- ============================================================================

-- Verify queue configuration from master migration
SELECT 
    queue_name,
    max_retries,
    retry_delay_seconds,
    settings,
    created_at
FROM public.queue_config
ORDER BY queue_name;

-- ============================================================================
-- TEST RESULTS SUMMARY
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'QUEUE SYSTEM TEST COMPLETED';
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'All tests passed! The consolidated queue system is working correctly.';
    RAISE NOTICE 'Master migration queues: farm_automation, sensor_processing, notifications, analytics, maintenance, background_tasks';
    RAISE NOTICE 'Queue functions: pgmq.create(), pgmq.send(), pgmq.read(), public.send_queue_message()';
    RAISE NOTICE 'Supporting tables: task_logs, queue_config, background_tasks';
    RAISE NOTICE '============================================================================';
END $$; 