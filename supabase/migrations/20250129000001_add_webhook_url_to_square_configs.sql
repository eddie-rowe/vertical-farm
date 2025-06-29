-- Migration to add webhook_url column to user_square_configs table
-- This column is needed for Square webhook integration

-- Add webhook_url column to user_square_configs table
ALTER TABLE public.user_square_configs 
ADD COLUMN webhook_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.user_square_configs.webhook_url IS 'URL endpoint for receiving Square webhook notifications'; 