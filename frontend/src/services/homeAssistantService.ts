'use client';

import { supabase } from '@/supabaseClient';
import toast from 'react-hot-toast';

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
  id?: string;
  created_at?: string;
  updated_at?: string;
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
  id?: string;                    // UUID from database
  entity_id: string;              // Home Assistant entity ID
  entity_type: string;            // Device type from HA (light, switch, sensor, etc.)
  friendly_name?: string;         // Human-readable name
  shelf_id?: string;              // UUID if assigned to a shelf
  rack_id?: string;               // UUID if assigned to a rack
  row_id?: string;                // UUID if assigned to a row
  farm_id?: string;               // UUID if assigned to a farm
  assigned_by?: string;           // UUID of user who assigned the device
  created_at?: string;            // ISO timestamp
  updated_at?: string;            // ISO timestamp
  // Additional fields from joined queries
  farm_name?: string;             // Name of the farm (from JOIN)
  row_name?: string;              // Name of the row (from JOIN)
  rack_name?: string;             // Name of the rack (from JOIN)
  shelf_name?: string;            // Name of the shelf (from JOIN)
}

export interface HomeAssistantEntity {
  entity_id: string;
  state: string;
  attributes: Record<string, any>;
  last_changed: string;
  last_updated: string;
  friendly_name?: string;
}

export interface WebSocketMessage {
  type: 'auth_required' | 'auth_ok' | 'auth_invalid' | 'event' | 'result' | 'error' | 'auth' | 'subscribe_events';
  id?: number;
  event?: {
    event_type: 'state_changed';
    data: {
      entity_id: string;
      new_state: HomeAssistantEntity;
      old_state: HomeAssistantEntity;
    };
  };
  result?: any;
  error?: {
    code: string;
    message: string;
  };
  success?: boolean;
  access_token?: string;
  event_type?: string;
}

class HomeAssistantService {
  private baseUrl = API_BASE_URL;
  private wsConnection: WebSocket | null = null;
  private subscriptions = new Map<string, (device: HADevice) => void>();
  private eventListeners: Map<string, (entity: HomeAssistantEntity) => void> = new Map();
  private messageId = 1;
  private isAuthenticated = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 5000;
  private connectionRetryCount = 0;
  private maxRetries = 5;
  private retryDelay = 1000; // Start with 1 second

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

  private async handleApiError(response: Response, operation: string): Promise<void> {
    if (response.status === 401) {
      toast.error('Session expired. Please sign in again.');
      // Trigger sign out to clear invalid session
      await supabase.auth.signOut();
      throw new Error('Authentication failed');
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`${operation} failed:`, errorText);
      toast.error(`${operation} failed: ${response.statusText}`);
      throw new Error(`${operation} failed: ${response.statusText}`);
    }
  }

  async getConfig(): Promise<HAConfig | null> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}/config`, { headers });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        await this.handleApiError(response, 'Get configuration');
      }

      const backendConfigs = await response.json();
      
      // If no configurations exist, return null
      if (!backendConfigs || backendConfigs.length === 0) {
        return null;
      }
      
      // Find the default configuration or use the first one
      const defaultConfig = backendConfigs.find((config: any) => config.is_default) || backendConfigs[0];
      
      // Transform backend response to frontend format
      return {
        url: defaultConfig.url,
        token: '', // Backend doesn't return the token for security
        enabled: defaultConfig.is_default,
        cloudflare_client_id: '', // Backend doesn't return credentials for security
        cloudflare_client_secret: '',
        name: defaultConfig.name,
        local_url: defaultConfig.local_url
      };
    } catch (error) {
      console.error('Failed to get HA configuration:', error);
      throw error;
    }
  }

  async getAllConfigs(): Promise<Array<HAConfig & { id: string; created_at: string; updated_at: string }>> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}/config`, { headers });

      if (!response.ok) {
        if (response.status === 404) {
          return [];
        }
        await this.handleApiError(response, 'Get all configurations');
      }

      const backendConfigs = await response.json();
      
      // Transform backend response to frontend format
      return backendConfigs.map((config: any) => ({
        id: config.id,
        url: config.url,
        token: '', // Backend doesn't return the token for security
        enabled: config.is_default,
        cloudflare_client_id: '', // Backend doesn't return credentials for security
        cloudflare_client_secret: '',
        name: config.name,
        local_url: config.local_url,
        created_at: config.created_at,
        updated_at: config.updated_at
      }));
    } catch (error) {
      console.error('Failed to get all HA configurations:', error);
      throw error;
    }
  }

  async deleteConfig(configId: string): Promise<void> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}/config/${configId}`, {
        method: 'DELETE',
        headers,
      });

      await this.handleApiError(response, 'Delete configuration');
      toast.success('Configuration deleted successfully');
    } catch (error) {
      console.error('Failed to delete HA configuration:', error);
      throw error;
    }
  }

  async saveConfig(config: HAConfig): Promise<HAConfig> {
    try {
      if (config.id) {
        return await this.updateConfig(config.id, config);
      } else {
        return await this.createConfig(config);
      }
    } catch (error) {
      console.error('Failed to save HA configuration:', error);
      throw error;
    }
  }

  private async createConfig(config: HAConfig): Promise<HAConfig> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}/config`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: config.name,
          url: config.url,
          access_token: config.token,
          cloudflare_enabled: !!(config.cloudflare_client_id && config.cloudflare_client_secret),
          cloudflare_client_id: config.cloudflare_client_id,
          cloudflare_client_secret: config.cloudflare_client_secret,
          is_default: config.enabled,
          local_url: config.local_url,
        }),
      });

      await this.handleApiError(response, 'Create configuration');
      const result = await response.json();
      toast.success('Configuration created successfully');
      
      return {
        ...config,
        id: result.id,
        created_at: result.created_at,
        updated_at: result.updated_at
      };
    } catch (error) {
      console.error('Failed to create HA configuration:', error);
      throw error;
    }
  }

  private async updateConfig(configId: string, config: HAConfig): Promise<HAConfig> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}/config/${configId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          name: config.name,
          url: config.url,
          access_token: config.token,
          cloudflare_enabled: !!(config.cloudflare_client_id && config.cloudflare_client_secret),
          cloudflare_client_id: config.cloudflare_client_id,
          cloudflare_client_secret: config.cloudflare_client_secret,
          is_default: config.enabled,
          local_url: config.local_url,
        }),
      });

      await this.handleApiError(response, 'Update configuration');
      const result = await response.json();
      toast.success('Configuration updated successfully');
      
      return {
        ...config,
        id: result.id,
        created_at: result.created_at,
        updated_at: result.updated_at
      };
    } catch (error) {
      console.error('Failed to update HA configuration:', error);
      throw error;
    }
  }

  async testConnection(
    url: string, 
    token: string, 
    options?: { cloudflare_client_id?: string; cloudflare_client_secret?: string }
  ): Promise<HAConnectionStatus> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}/test-connection`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          url,
          access_token: token,
          cloudflare_enabled: !!(options?.cloudflare_client_id && options?.cloudflare_client_secret),
          cloudflare_client_id: options?.cloudflare_client_id,
          cloudflare_client_secret: options?.cloudflare_client_secret,
        }),
      });

      await this.handleApiError(response, 'Test connection');
      const result = await response.json();
      
      if (result.success) {
        toast.success('Connection test successful');
      } else {
        toast.error(`Connection test failed: ${result.message}`);
      }
      
      return {
        connected: result.success,
        version: result.version,
        error: result.success ? undefined : result.message
      };
    } catch (error) {
      console.error('Connection test failed:', error);
      toast.error('Connection test failed');
      return { 
        connected: false, 
        error: 'Connection test failed' 
      };
    }
  }

  async getStatus(): Promise<HAConnectionStatus> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}/status`, { headers });

      await this.handleApiError(response, 'Get status');
      const result = await response.json();
      
      return {
        connected: result.connected,
        version: result.version,
        device_count: result.device_count,
        last_updated: result.last_updated,
        error: result.error
      };
    } catch (error) {
      console.error('Failed to get HA status:', error);
      throw error;
    }
  }

  async discoverDevices(): Promise<HADevice[]> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}/discover`, {
        method: 'POST',
        headers,
      });

      await this.handleApiError(response, 'Discover devices');
      const result = await response.json();
      
      // Extract devices array from DeviceListResponse
      return result.devices || [];
    } catch (error) {
      console.error('Failed to discover HA devices:', error);
      throw error;
    }
  }

  async getDevices(): Promise<HADevice[]> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}/devices`, { headers });

      await this.handleApiError(response, 'Get devices');
      const result = await response.json();
      
      // Extract devices array from DeviceListResponse  
      return result.devices || [];
    } catch (error) {
      console.error('Failed to get HA devices:', error);
      throw error;
    }
  }

  async getDevice(entityId: string): Promise<HADevice> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}/devices/${entityId}`, { headers });

      await this.handleApiError(response, 'Get device');
      const result = await response.json();
      
      // Extract device from DeviceDetailsResponse
      return result.device || null;
    } catch (error) {
      console.error('Failed to get HA device:', error);
      throw error;
    }
  }

  async controlDevice(request: DeviceControlRequest): Promise<void> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}/devices/${request.entity_id}/control`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          action: request.action,
          options: request.options,
          duration: request.duration,
        }),
      });

      await this.handleApiError(response, 'Control device');
      toast.success(`Device ${request.action} successful`);
    } catch (error) {
      console.error('Failed to control HA device:', error);
      toast.error('Failed to control device');
      throw error;
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
      options
    });
  }

  async controlIrrigation(entityId: string, action: 'open' | 'close' | 'pulse', duration?: number): Promise<void> {
    const actionMap = { open: 'turn_on', close: 'turn_off', pulse: 'toggle' } as const;
    return this.controlDevice({
      entity_id: entityId,
      action: actionMap[action],
      duration
    });
  }

  async getAssignments(): Promise<DeviceAssignment[]> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}/devices/assignments`, { headers });

      // Handle the case where no Home Assistant configuration exists
      if (response.status === 404) {
        return []; // Return empty array instead of throwing error
      }

      await this.handleApiError(response, 'Get assignments');
      const result = await response.json();
      return result.assignments || []; // Backend returns {assignments: [...], count: N}
    } catch (error) {
      console.error('Failed to get device assignments:', error);
      throw error;
    }
  }

  async saveAssignment(assignment: DeviceAssignment): Promise<DeviceAssignment> {
    try {
      const headers = await this.getAuthHeaders();
      
      // Prepare the request body to match backend DeviceAssignmentRequest model
      const requestBody = {
        shelf_id: assignment.shelf_id || null,
        rack_id: assignment.rack_id || null,
        row_id: assignment.row_id || null,
        farm_id: assignment.farm_id || null,
        friendly_name: assignment.friendly_name || null,
        assigned_by: assignment.assigned_by || null
      };
      
      const response = await fetch(`${this.baseUrl}/devices/${assignment.entity_id}/assign`, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
      });

      await this.handleApiError(response, 'Save assignment');
      const result = await response.json();
      toast.success('Device assignment saved successfully');
      
      // Backend returns { success: true, message: "...", assignment: {...} }
      return result.assignment || result;
    } catch (error) {
      console.error('Failed to save device assignment:', error);
      throw error;
    }
  }

  async removeAssignment(entityId: string): Promise<void> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}/devices/${entityId}/assignment`, {
        method: 'DELETE',
        headers,
      });

      await this.handleApiError(response, 'Remove assignment');
      toast.success('Device assignment removed successfully');
    } catch (error) {
      console.error('Failed to remove device assignment:', error);
      throw error;
    }
  }

  createDeviceSubscription(entityId: string, callback: (device: HADevice) => void): () => void {
    this.subscriptions.set(entityId, callback);
    this.eventListeners.set(entityId, (entity) => {
      // Convert HomeAssistantEntity to HADevice format
      const device: HADevice = {
        entity_id: entity.entity_id,
        state: entity.state,
        attributes: entity.attributes,
        last_changed: entity.last_changed,
        last_updated: entity.last_updated,
        friendly_name: entity.friendly_name || entity.attributes.friendly_name,
        domain: entity.entity_id.split('.')[0],
        device_class: entity.attributes.device_class,
        unit_of_measurement: entity.attributes.unit_of_measurement,
        area: entity.attributes.area
      };
      callback(device);
    });

    return () => {
      this.subscriptions.delete(entityId);
      this.eventListeners.delete(entityId);
    };
  }

  private async initializeWebSocket(): Promise<void> {
    if (!this.wsConnection || this.wsConnection.readyState === WebSocket.CLOSED) {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No valid session for WebSocket connection');
      }

      const wsUrl = `${this.baseUrl.replace('http', 'ws')}/ws?token=${session.access_token}`;
      this.wsConnection = new WebSocket(wsUrl);
      
      this.wsConnection.onopen = () => {
        console.log('WebSocket connected');
        this.isAuthenticated = false;
        this.reconnectAttempts = 0;
        this.sendMessage({ type: 'auth', access_token: session.access_token });
        toast.success('Connected to Home Assistant');
      };

      this.wsConnection.onmessage = (event) => {
        const message: WebSocketMessage = JSON.parse(event.data);
        this.handleWebSocketMessage(message);
      };

      this.wsConnection.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        this.isAuthenticated = false;
        
        if (event.code === 1008 || event.code === 4001) {
          toast.error('WebSocket authentication failed. Please sign in again.');
          supabase.auth.signOut();
          return;
        }
        
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect();
        } else if (event.code !== 1000) {
          toast.error('WebSocket connection lost. Maximum retries exceeded.');
        }
      };

      this.wsConnection.onerror = (error) => {
        console.error('WebSocket error:', error);
        toast.error('WebSocket connection error');
      };
    }
  }

  private async handleWebSocketMessage(message: WebSocketMessage): Promise<void> {
    switch (message.type) {
      case 'auth_required':
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          this.sendMessage({ type: 'auth', access_token: session.access_token });
        }
        break;
        
      case 'auth_ok':
        this.isAuthenticated = true;
        console.log('WebSocket authenticated');
        // Subscribe to state changes
        this.sendMessage({
          type: 'subscribe_events',
          id: this.messageId++,
          event_type: 'state_changed'
        });
        break;
        
      case 'auth_invalid':
        console.error('WebSocket authentication failed');
        toast.error('WebSocket authentication failed');
        this.wsConnection?.close();
        break;
        
      case 'result':
        if (message.success) {
          console.log('Successfully subscribed to events');
        }
        break;
        
      case 'event':
        if (message.event?.event_type === 'state_changed') {
          const { entity_id, new_state } = message.event.data;
          const listener = this.eventListeners.get(entity_id);
          if (listener) {
            listener(new_state);
          }
        }
        break;
        
      case 'error':
        console.error('WebSocket error:', message.error);
        toast.error(`Home Assistant error: ${message.error?.message}`);
        break;
    }
  }

  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    console.log(`Scheduling WebSocket reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${this.reconnectDelay}ms`);
    
    setTimeout(() => {
      this.initializeWebSocket().catch(error => {
        console.error('WebSocket reconnection failed:', error);
      });
    }, this.reconnectDelay);
    
    // Exponential backoff with max delay of 30 seconds
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000);
  }

  private sendMessage(message: WebSocketMessage): void {
    if (this.wsConnection && this.wsConnection.readyState === WebSocket.OPEN) {
      this.wsConnection.send(JSON.stringify(message));
    }
  }

  // Subscribe to entity state changes
  subscribeToEntity(entityId: string, callback: (entity: HomeAssistantEntity) => void): void {
    this.eventListeners.set(entityId, callback);
  }

  // Unsubscribe from entity state changes
  unsubscribeFromEntity(entityId: string): void {
    this.eventListeners.delete(entityId);
  }

  disconnectWebSocket(): void {
    if (this.wsConnection) {
      this.wsConnection.close(1000, 'Deliberate disconnect');
      this.wsConnection = null;
    }
    this.subscriptions.clear();
    this.eventListeners.clear();
    this.isAuthenticated = false;
    this.reconnectAttempts = 0;
    this.reconnectDelay = 5000;
  }

  // Get connection status
  isConnected(): boolean {
    return this.wsConnection?.readyState === WebSocket.OPEN && this.isAuthenticated;
  }

  // Initialize connection with authentication awareness
  async connect(): Promise<void> {
    try {
      await this.initializeWebSocket();
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      toast.error('Failed to connect to Home Assistant');
      throw error;
    }
  }
}

// Export singleton instance
export const homeAssistantService = new HomeAssistantService(); 
export default homeAssistantService; 