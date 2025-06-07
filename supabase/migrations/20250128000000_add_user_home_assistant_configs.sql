-- Migration to add user-specific Home Assistant configurations
-- This allows each user to configure their own Home Assistant instance

-- Table to store user-specific Home Assistant configurations
CREATE TABLE public.user_home_assistant_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- User-defined name for this config (e.g., "My Home", "Farm HA")
  url TEXT NOT NULL, -- Home Assistant URL
  access_token TEXT NOT NULL, -- Long-lived access token
  local_url TEXT, -- Optional local URL for WebSocket connections
  cloudflare_enabled BOOLEAN DEFAULT FALSE,
  cloudflare_client_id TEXT, -- Cloudflare Access client ID
  cloudflare_client_secret TEXT, -- Cloudflare Access client secret
  is_default BOOLEAN DEFAULT FALSE, -- Whether this is the user's default config
  enabled BOOLEAN DEFAULT TRUE,
  last_tested TIMESTAMP WITH TIME ZONE, -- When connection was last tested
  last_successful_connection TIMESTAMP WITH TIME ZONE, -- When last successful connection occurred
  test_result JSONB, -- Last test results (status, error, device_count, etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure user can only have one default config
  CONSTRAINT unique_default_per_user UNIQUE (user_id, is_default) DEFERRABLE INITIALLY DEFERRED,
  -- Ensure unique name per user
  CONSTRAINT unique_name_per_user UNIQUE (user_id, name)
);

-- Indexes for performance
CREATE INDEX idx_user_ha_configs_user_id ON public.user_home_assistant_configs(user_id);
CREATE INDEX idx_user_ha_configs_enabled ON public.user_home_assistant_configs(enabled);
CREATE INDEX idx_user_ha_configs_default ON public.user_home_assistant_configs(user_id, is_default) WHERE is_default = true;

-- Function to ensure only one default config per user
CREATE OR REPLACE FUNCTION ensure_single_default_ha_config()
RETURNS TRIGGER AS $$
BEGIN
  -- If setting a config as default, unset all other defaults for this user
  IF NEW.is_default = TRUE THEN
    UPDATE public.user_home_assistant_configs 
    SET is_default = FALSE, updated_at = NOW()
    WHERE user_id = NEW.user_id AND id != NEW.id AND is_default = TRUE;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to maintain default config constraint
CREATE TRIGGER trigger_ensure_single_default_ha_config
  BEFORE INSERT OR UPDATE ON public.user_home_assistant_configs
  FOR EACH ROW EXECUTE FUNCTION ensure_single_default_ha_config();

-- Enable RLS for security
ALTER TABLE public.user_home_assistant_configs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own Home Assistant configs" 
  ON public.user_home_assistant_configs 
  FOR ALL 
  USING (auth.uid() = user_id);

-- Table to track user-specific device associations with their HA configs
CREATE TABLE public.user_device_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_config_id UUID NOT NULL REFERENCES public.user_home_assistant_configs(id) ON DELETE CASCADE,
  entity_id TEXT NOT NULL,
  friendly_name TEXT,
  device_type TEXT NOT NULL, -- light, switch, sensor, etc.
  room TEXT, -- User-defined room/area
  is_favorite BOOLEAN DEFAULT FALSE,
  custom_settings JSONB, -- User-specific device settings
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate device configs per user config
  CONSTRAINT unique_device_per_config UNIQUE (user_config_id, entity_id)
);

-- Indexes
CREATE INDEX idx_user_device_configs_user_config_id ON public.user_device_configs(user_config_id);
CREATE INDEX idx_user_device_configs_entity_id ON public.user_device_configs(entity_id);
CREATE INDEX idx_user_device_configs_device_type ON public.user_device_configs(device_type);
CREATE INDEX idx_user_device_configs_is_favorite ON public.user_device_configs(is_favorite) WHERE is_favorite = true;

-- Enable RLS
ALTER TABLE public.user_device_configs ENABLE ROW LEVEL SECURITY;

-- RLS Policy for user device configs (through their HA config)
CREATE POLICY "Users can manage their own device configs" 
  ON public.user_device_configs 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_home_assistant_configs 
      WHERE id = user_device_configs.user_config_id 
      AND user_id = auth.uid()
    )
  );

-- Comments for documentation
COMMENT ON TABLE public.user_home_assistant_configs IS 'User-specific Home Assistant instance configurations';
COMMENT ON TABLE public.user_device_configs IS 'User-specific device configurations and preferences for their HA instances';
COMMENT ON COLUMN public.user_home_assistant_configs.access_token IS 'Encrypted Home Assistant long-lived access token';
COMMENT ON COLUMN public.user_home_assistant_configs.cloudflare_client_secret IS 'Encrypted Cloudflare Access client secret'; 