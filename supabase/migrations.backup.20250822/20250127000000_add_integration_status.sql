-- Migration to add integration status tracking
-- This complements the existing device_assignments table

CREATE TYPE integration_type AS ENUM ('home_assistant', 'mqtt', 'zigbee', 'zwave');
CREATE TYPE integration_status AS ENUM ('connected', 'disconnected', 'error', 'syncing');

-- Table to track integration connection status and metadata
CREATE TABLE public.integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type integration_type NOT NULL,
  name TEXT NOT NULL,
  url TEXT, -- Connection URL (e.g., Home Assistant URL)
  status integration_status NOT NULL DEFAULT 'disconnected',
  last_sync TIMESTAMP WITH TIME ZONE,
  device_count INTEGER DEFAULT 0,
  version TEXT, -- Integration version (e.g., HA version)
  error_message TEXT,
  configuration JSONB, -- Additional config parameters
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (type, name) -- Prevent duplicate integrations of same type
);

-- Index for querying active integrations
CREATE INDEX idx_integrations_type_status ON public.integrations(type, status);
CREATE INDEX idx_integrations_enabled ON public.integrations(enabled);

-- Add integration_id to device_assignments to link devices to their source
ALTER TABLE public.device_assignments 
ADD COLUMN integration_id UUID REFERENCES public.integrations(id) ON DELETE CASCADE;

-- Index for the new foreign key
CREATE INDEX idx_device_assignments_integration_id ON public.device_assignments(integration_id);

-- Table for tracking integration sync history and events
CREATE TABLE public.integration_sync_log (
  id BIGSERIAL PRIMARY KEY,
  integration_id UUID NOT NULL REFERENCES public.integrations(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'sync_start', 'sync_complete', 'device_discovered', 'error'
  message TEXT,
  device_count INTEGER,
  duration_ms INTEGER, -- Sync duration in milliseconds
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for querying recent sync events
CREATE INDEX idx_integration_sync_log_integration_timestamp ON public.integration_sync_log(integration_id, timestamp DESC);
CREATE INDEX idx_integration_sync_log_event_type ON public.integration_sync_log(event_type);

-- Add helpful comments
COMMENT ON TABLE public.integrations IS 'Tracks external integrations like Home Assistant, MQTT brokers, etc.';
COMMENT ON TABLE public.integration_sync_log IS 'Logs integration events and sync history for monitoring and debugging';
COMMENT ON COLUMN public.device_assignments.integration_id IS 'Links device to its source integration (e.g., Home Assistant)'; 