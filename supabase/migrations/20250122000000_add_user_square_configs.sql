-- Migration to add user-specific Square configurations
-- This allows each user to configure their own Square account integration

-- Create the updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Table to store user-specific Square configurations
CREATE TABLE public.user_square_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- User-defined name for this config (e.g., "Main Store", "Farmers Market")
  application_id TEXT NOT NULL, -- Square Application ID
  access_token TEXT NOT NULL, -- Square Access Token (encrypted)
  environment TEXT NOT NULL DEFAULT 'sandbox' CHECK (environment IN ('sandbox', 'production')),
  webhook_signature_key TEXT, -- Optional webhook signature key
  is_default BOOLEAN DEFAULT FALSE, -- Whether this is the user's default config
  enabled BOOLEAN DEFAULT TRUE,
  last_tested TIMESTAMP WITH TIME ZONE, -- When connection was last tested
  last_successful_connection TIMESTAMP WITH TIME ZONE, -- When last successful connection occurred
  test_result JSONB, -- Last test results (status, error, merchant_id, etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure user can only have one default config
  CONSTRAINT unique_default_per_user_square UNIQUE (user_id, is_default) DEFERRABLE INITIALLY DEFERRED,
  -- Ensure unique name per user
  CONSTRAINT unique_name_per_user_square UNIQUE (user_id, name)
);

-- Indexes for performance
CREATE INDEX idx_user_square_configs_user_id ON public.user_square_configs(user_id);
CREATE INDEX idx_user_square_configs_enabled ON public.user_square_configs(enabled);
CREATE INDEX idx_user_square_configs_default ON public.user_square_configs(user_id, is_default) WHERE is_default = true;

-- Function to ensure only one default config per user
CREATE OR REPLACE FUNCTION ensure_single_default_square_config()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Trigger to maintain default config constraint
CREATE TRIGGER trigger_ensure_single_default_square_config
  BEFORE INSERT OR UPDATE ON public.user_square_configs
  FOR EACH ROW EXECUTE FUNCTION ensure_single_default_square_config();

-- Updated at trigger
CREATE TRIGGER trigger_updated_at_user_square_configs
  BEFORE UPDATE ON public.user_square_configs
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS on user_square_configs
ALTER TABLE public.user_square_configs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Square configurations
CREATE POLICY "square_configs_select_own" ON public.user_square_configs
  FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "square_configs_insert_own" ON public.user_square_configs
  FOR INSERT 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "square_configs_update_own" ON public.user_square_configs
  FOR UPDATE 
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "square_configs_delete_own" ON public.user_square_configs
  FOR DELETE 
  USING (user_id = auth.uid());

-- Admin access to all Square configs
CREATE POLICY "admins_full_access_square_configs" ON public.user_square_configs
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Add comments for documentation
COMMENT ON TABLE public.user_square_configs IS 'User-specific Square payment integration configurations';
COMMENT ON COLUMN public.user_square_configs.access_token IS 'Encrypted Square access token for API access';
COMMENT ON COLUMN public.user_square_configs.environment IS 'Square environment: sandbox for testing, production for live transactions';
COMMENT ON COLUMN public.user_square_configs.webhook_signature_key IS 'Optional webhook signature key for verifying Square webhook events';
COMMENT ON COLUMN public.user_square_configs.test_result IS 'JSON object containing last connection test results'; 