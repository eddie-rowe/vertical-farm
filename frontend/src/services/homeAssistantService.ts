'use client';

import { supabase } from '../supabaseClient';

// Home Assistant API service for frontend
const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/home-assistant`;

export interface HADevice {
  entity_id: string;
  friendly_name?: string;
  state: string;
  attributes: Record<string, any>;
  last_changed?: string;
  last_updated?: string;
  domain: string;
  device_class?: string;
  unit_of_measurement?: string;
  area?: string;
}

export interface HAConfig {
  url: string;
  token: string;
  enabled: boolean;
  cloudflare_client_id?: string;
  cloudflare_client_secret?: string;
  is_default?: boolean;
  name?: string;
  local_url?: string;
}

export interface HAConnectionStatus {
  connected: boolean;
  version?: string;
  device_count?: number;
  last_updated?: string;
  error?: string;
}

export interface DeviceControlRequest {
  entity_id: string;
  action: 'turn_on' | 'turn_off' | 'toggle';
  options?: Record<string, any>;
  duration?: number;
}

export interface DeviceAssignment {
  entity_id: string;
  farm_id: string;
  row_id?: string;
  rack_id?: string;
  shelf_id?: string;
  device_role: 'lighting' | 'irrigation' | 'ventilation' | 'monitoring';
}

interface WebSocketMessage {
  id?: number;
  type: string;
  [key: string]: any;
}

class HomeAssistantService {
  private baseUrl = API_BASE_URL;
  private wsConnection: WebSocket | null = null;
  private subscriptions = new Map<string, (device: HADevice) => void>();
  private messageId = 1;
  private isAuthenticated = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 5000;

  private async getAuthHeaders(): Promise<HeadersInit> {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !sessionData.session) {
      console.error('User is not authenticated or session expired.', { sessionError, hasSession: !!sessionData?.session });
      throw new Error('Authentication required. Please log in to continue.');
    }

    return {
      'Authorization': `Bearer ${sessionData.session.access_token}`,
      'Content-Type': 'application/json',
    };
  }

  async getConfig(): Promise<HAConfig | null> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}/config`, {
        headers,
      });
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('Error fetching config:', error);
      return null;
    }
  }

  async saveConfig(config: HAConfig): Promise<HAConfig> {
    const headers = await this.getAuthHeaders();
    
    // Check if user has any existing configurations
    let isFirstConfig = false;
    try {
      const existingConfigsResponse = await fetch(`${this.baseUrl}/config`, {
        headers,
      });
      if (existingConfigsResponse.ok) {
        const existingConfigs = await existingConfigsResponse.json();
        isFirstConfig = !existingConfigs || existingConfigs.length === 0;
      }
    } catch (e) {
      // If we can't check, assume it's not the first config to be safe
      isFirstConfig = false;
    }
    
    // Transform frontend config format to backend API format
    const backendConfig = {
      name: config.name || 'Default Configuration',
      url: config.url,
      access_token: config.token,
      local_url: config.local_url,
      cloudflare_enabled: !!(config.cloudflare_client_id && config.cloudflare_client_secret),
      cloudflare_client_id: config.cloudflare_client_id,
      cloudflare_client_secret: config.cloudflare_client_secret,
      is_default: isFirstConfig // Only set as default if it's the first config
    };
    
    const response = await fetch(`${this.baseUrl}/config`, {
      method: 'POST',
      headers,
      body: JSON.stringify(backendConfig),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to save configuration');
    }

    const savedConfig = await response.json();
    
    // Transform backend response back to frontend format
    return {
      url: savedConfig.url,
      token: config.token, // Backend doesn't return the token for security
      enabled: savedConfig.is_default,
      cloudflare_client_id: config.cloudflare_client_id,
      cloudflare_client_secret: config.cloudflare_client_secret,
      name: savedConfig.name,
      local_url: savedConfig.local_url
    };
  }

  async testConnection(
    url: string, 
    token: string, 
    options?: { cloudflare_client_id?: string; cloudflare_client_secret?: string }
  ): Promise<HAConnectionStatus> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseUrl}/test-connection`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ 
        url, 
        access_token: token,
        cloudflare_enabled: !!(options?.cloudflare_client_id && options?.cloudflare_client_secret),
        cloudflare_client_id: options?.cloudflare_client_id,
        cloudflare_client_secret: options?.cloudflare_client_secret
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Connection test failed');
    }

    const backendResponse = await response.json();
    
    // Convert backend response format to frontend format
    return {
      connected: backendResponse.success,
      version: backendResponse.home_assistant_version,
      device_count: backendResponse.device_count,
      last_updated: backendResponse.test_timestamp,
      error: backendResponse.error_details
    };
  }

  async getStatus(): Promise<HAConnectionStatus> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseUrl}/status`, {
      headers,
    });

    if (!response.ok) {
      if (response.status === 404) {
        return { connected: false, error: 'Not configured' };
      }
      const error = await response.json();
      throw new Error(error.detail || 'Failed to get status');
    }

    const backendResponse = await response.json();
    
    // Convert backend response format to frontend format
    return {
      connected: backendResponse.enabled && backendResponse.healthy,
      version: undefined, // Status endpoint doesn't include version
      device_count: undefined, // Status endpoint doesn't include device count
      last_updated: undefined,
      error: backendResponse.error
    };
  }

  async discoverDevices(): Promise<HADevice[]> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseUrl}/devices`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to discover devices');
    }

    const data = await response.json();
    // Backend returns { devices: [], total_count: number, device_type: string | null }
    return data.devices || [];
  }

  async getDevices(): Promise<HADevice[]> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseUrl}/devices`, {
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch devices');
    }

    const data = await response.json();
    // Backend returns { devices: [], total_count: number, device_type: string | null }
    return data.devices || [];
  }

  async getDevice(entityId: string): Promise<HADevice> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}/devices/${encodeURIComponent(entityId)}`, {
        headers,
      });
      if (!response.ok) {
        throw new Error(`Failed to get device: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error getting device:', error);
      throw error;
    }
  }

  async controlDevice(request: DeviceControlRequest): Promise<void> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseUrl}/devices/${request.entity_id}/control`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        action: request.action,
        options: request.options,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to control device');
    }
  }

  async controlLight(
    entityId: string, 
    action: 'turn_on' | 'turn_off' | 'toggle', 
    options?: { brightness?: number; color?: string }
  ): Promise<void> {
    return this.controlDevice({
      entity_id: entityId,
      action,
      options,
    });
  }

  async controlIrrigation(entityId: string, action: 'open' | 'close' | 'pulse', duration?: number): Promise<void> {
    const actionMap = { open: 'turn_on', close: 'turn_off', pulse: 'turn_on' } as const;
    return this.controlDevice({
      entity_id: entityId,
      action: actionMap[action],
      duration,
    });
  }

  async getAssignments(): Promise<DeviceAssignment[]> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseUrl}/assignments`, {
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch assignments');
    }

    return await response.json();
  }

  async saveAssignment(assignment: DeviceAssignment): Promise<DeviceAssignment> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseUrl}/assignments`, {
      method: 'POST',
      headers,
      body: JSON.stringify(assignment),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to save assignment');
    }

    return await response.json();
  }

  async removeAssignment(entityId: string): Promise<void> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseUrl}/assignments/${entityId}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to remove assignment');
    }
  }

  // WebSocket methods (for real-time updates) - Official HA Protocol
  createDeviceSubscription(entityId: string, callback: (device: HADevice) => void): () => void {
    this.subscriptions.set(entityId, callback);
    
    // Initialize WebSocket connection if not already connected
    if (!this.wsConnection) {
      this.initializeWebSocket();
    }

    // Return cleanup function
    return () => {
      this.subscriptions.delete(entityId);
      if (this.subscriptions.size === 0 && this.wsConnection) {
        this.wsConnection.close();
        this.wsConnection = null;
      }
    };
  }

  private async initializeWebSocket(): Promise<void> {
    try {
      // Get the Home Assistant configuration first
      const config = await this.getConfig();
      if (!config || !config.url || !config.token) {
        console.warn('Home Assistant not configured - WebSocket connection skipped');
        return;
      }

      // Convert HTTP URL to WebSocket URL
      const wsUrl = config.url.replace('http://', 'ws://').replace('https://', 'wss://') + '/api/websocket';
      
      console.log('Connecting to Home Assistant WebSocket:', wsUrl);
      
      // Prepare headers for Cloudflare Access if configured
      const headers: Record<string, string> = {};
      if (config.cloudflare_client_id && config.cloudflare_client_secret) {
        headers['CF-Access-Client-Id'] = config.cloudflare_client_id;
        headers['CF-Access-Client-Secret'] = config.cloudflare_client_secret;
      }

      this.wsConnection = new WebSocket(wsUrl);
      
      this.wsConnection.onopen = async () => {
        console.log('Home Assistant WebSocket connected');
        this.reconnectAttempts = 0;
      };
      
      this.wsConnection.onmessage = async (event) => {
        try {
          const data: WebSocketMessage = JSON.parse(event.data);
          await this.handleWebSocketMessage(data, config.token);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      this.wsConnection.onclose = () => {
        console.log('Home Assistant WebSocket disconnected');
        this.wsConnection = null;
        this.isAuthenticated = false;
        
        // Attempt to reconnect if there are active subscriptions
        if (this.subscriptions.size > 0 && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
          setTimeout(() => {
            this.initializeWebSocket();
          }, this.reconnectDelay);
        }
      };
      
      this.wsConnection.onerror = (error) => {
        console.error('Home Assistant WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
    }
  }

  private async handleWebSocketMessage(data: WebSocketMessage, token: string): Promise<void> {
    switch (data.type) {
      case 'auth_required':
        console.log('Authentication required');
        this.sendMessage({
          type: 'auth',
          access_token: token
        });
        break;
        
      case 'auth_ok':
        console.log('WebSocket authenticated successfully');
        this.isAuthenticated = true;
        // Subscribe to state changes
        this.sendMessage({
          id: this.messageId++,
          type: 'subscribe_events',
          event_type: 'state_changed'
        });
        break;
        
      case 'auth_invalid':
        console.error('WebSocket authentication failed');
        this.wsConnection?.close();
        break;
        
      case 'event':
        if (data.event?.event_type === 'state_changed') {
          this.handleStateChange(data.event.data);
        }
        break;
        
      case 'result':
        if (data.success) {
          console.log('WebSocket command successful:', data.id);
        } else {
          console.error('WebSocket command failed:', data.error);
        }
        break;
        
      default:
        console.log('Unhandled WebSocket message type:', data.type);
    }
  }

  private handleStateChange(data: any): void {
    const entityId = data.entity_id;
    const newState = data.new_state;
    
    if (entityId && newState && this.subscriptions.has(entityId)) {
      // Convert HA state to our HADevice format
      const device: HADevice = {
        entity_id: entityId,
        friendly_name: newState.attributes?.friendly_name || entityId,
        domain: entityId.split('.')[0],
        device_class: newState.attributes?.device_class,
        state: newState.state,
        attributes: newState.attributes,
        unit_of_measurement: newState.attributes?.unit_of_measurement,
        last_updated: newState.last_updated
      };
      
      const callback = this.subscriptions.get(entityId);
      if (callback) {
        callback(device);
      }
    }
  }

  private sendMessage(message: WebSocketMessage): void {
    if (this.wsConnection && this.wsConnection.readyState === WebSocket.OPEN) {
      this.wsConnection.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, cannot send message:', message);
    }
  }

  // Public method to disconnect WebSocket
  disconnectWebSocket(): void {
    if (this.wsConnection) {
      this.wsConnection.close();
      this.wsConnection = null;
      this.isAuthenticated = false;
      this.subscriptions.clear();
    }
  }
}

export const homeAssistantService = new HomeAssistantService();
export default homeAssistantService; 