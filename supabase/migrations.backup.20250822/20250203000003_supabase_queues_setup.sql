-- Supabase Queues Setup Migration
-- This migration sets up task logging for the official Supabase Queues system

-- Add user_id column to existing task_logs table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'task_logs' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.task_logs ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create indexes for task logs
CREATE INDEX IF NOT EXISTS idx_task_logs_task_id ON public.task_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_task_logs_task_type ON public.task_logs(task_type);
CREATE INDEX IF NOT EXISTS idx_task_logs_created_at ON public.task_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_task_logs_success ON public.task_logs(success);
CREATE INDEX IF NOT EXISTS idx_task_logs_user_id ON public.task_logs(user_id);

-- Enable RLS on task_logs
ALTER TABLE public.task_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for task_logs (users can only access their own logs)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE policyname = 'Users can manage their own task logs' 
        AND tablename = 'task_logs' 
        AND schemaname = 'public'
    ) THEN
        CREATE POLICY "Users can manage their own task logs" ON public.task_logs
            FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;

-- Drop existing function if it exists (to handle return type changes)
DROP FUNCTION IF EXISTS public.log_task_execution(TEXT, TEXT, TEXT, BOOLEAN, INTEGER, TEXT, INTEGER);

-- Create a helper function to log task execution
CREATE FUNCTION public.log_task_execution(
    p_task_id TEXT,
    p_task_type TEXT,
    p_priority TEXT,
    p_success BOOLEAN,
    p_execution_time INTEGER,
    p_error_message TEXT DEFAULT NULL,
    p_retry_count INTEGER DEFAULT 0
) RETURNS BIGINT AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER; 