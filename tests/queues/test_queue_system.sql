-- Test Queue System Setup
-- This script creates the necessary tables and tests the queue functionality

-- Enable pgmq extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pgmq;

-- Create the task_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.task_logs (
    id BIGSERIAL PRIMARY KEY,
    task_id TEXT NOT NULL,
    task_type TEXT NOT NULL,
    priority TEXT NOT NULL CHECK (priority IN ('critical', 'high', 'normal', 'low')),
    success BOOLEAN NOT NULL,
    execution_time INTEGER NOT NULL, -- milliseconds
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for task logs
CREATE INDEX IF NOT EXISTS idx_task_logs_task_id ON public.task_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_task_logs_task_type ON public.task_logs(task_type);
CREATE INDEX IF NOT EXISTS idx_task_logs_created_at ON public.task_logs(created_at);

-- Create the message queues
SELECT pgmq.create_queue('critical_tasks');
SELECT pgmq.create_queue('high_tasks');
SELECT pgmq.create_queue('normal_tasks');
SELECT pgmq.create_queue('low_tasks');

-- Add a test task to the normal priority queue
SELECT pgmq.send(
    'normal_tasks',
    jsonb_build_object(
        'id', 'test_task_' || extract(epoch from now()),
        'type', 'device_discovery',
        'priority', 'normal',
        'payload', jsonb_build_object(
            'action', 'discover_devices',
            'user_id', 'test_user'
        ),
        'metadata', jsonb_build_object(
            'created_at', now(),
            'retry_count', 0,
            'max_retries', 3
        )
    )
);

-- Check if the task was added
SELECT * FROM pgmq.read('normal_tasks', 10, 1);

-- Show current queue stats
SELECT 
    'critical_tasks' as queue_name,
    (SELECT count(*) FROM pgmq.read('critical_tasks', 100, 1)) as message_count
UNION ALL
SELECT 
    'high_tasks' as queue_name,
    (SELECT count(*) FROM pgmq.read('high_tasks', 100, 1)) as message_count
UNION ALL
SELECT 
    'normal_tasks' as queue_name,
    (SELECT count(*) FROM pgmq.read('normal_tasks', 100, 1)) as message_count
UNION ALL
SELECT 
    'low_tasks' as queue_name,
    (SELECT count(*) FROM pgmq.read('low_tasks', 100, 1)) as message_count; 