-- Supabase Queues Setup Migration
-- This migration sets up task logging for the official Supabase Queues system

-- Create task logging table for tracking queue processing
CREATE TABLE IF NOT EXISTS public.task_logs (
    id BIGSERIAL PRIMARY KEY,
    task_id TEXT NOT NULL,
    task_type TEXT NOT NULL,
    priority TEXT NOT NULL CHECK (priority IN ('critical', 'high', 'normal', 'low')),
    success BOOLEAN NOT NULL,
    execution_time INTEGER NOT NULL, -- milliseconds
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for task logs
CREATE INDEX IF NOT EXISTS idx_task_logs_task_id ON public.task_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_task_logs_task_type ON public.task_logs(task_type);
CREATE INDEX IF NOT EXISTS idx_task_logs_created_at ON public.task_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_task_logs_success ON public.task_logs(success);
CREATE INDEX IF NOT EXISTS idx_task_logs_user_id ON public.task_logs(user_id);

-- Enable RLS on task_logs
ALTER TABLE public.task_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for task_logs (users can only access their own logs)
CREATE POLICY "Users can manage their own task logs" ON public.task_logs
    FOR ALL USING (auth.uid() = user_id);

-- Create a helper function to log task execution
CREATE OR REPLACE FUNCTION public.log_task_execution(
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