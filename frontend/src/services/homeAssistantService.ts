'use client';

// Home Assistant API service for frontend
const API_BASE_URL = '/api/v1/home-assistant';

export interface HADevice {
  entity_id: string;
  name: string;
  device_type: string;
  device_class?: string;
  state: string;
  attributes?: Record<string, any>;
  area?: string;
  unit_of_measurement?: string;
  last_updated?: string;
}

export interface HAConfig {
  url: string;
  token: string;
  enabled: boolean;
  cloudflare_client_id?: string;
  cloudflare_client_secret?: string;
  is_default?: boolean;
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

class HomeAssistantService {
  private baseUrl = '/api/v1/home-assistant';
  private wsConnection: WebSocket | null = null;
  private subscriptions = new Map<string, (device: HADevice) => void>();

  async getConfig(): Promise<HAConfig | null> {
    try {
      const response = await fetch(`${this.baseUrl}/config`, {
        credentials: 'include',
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
    const response = await fetch(`${this.baseUrl}/config`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to save configuration');
    }

    return await response.json();
  }

  async testConnection(url: string, token: string): Promise<HAConnectionStatus> {
    const response = await fetch(`${this.baseUrl}/test-connection`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ url, token }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Connection test failed');
    }

    return await response.json();
  }

  async getStatus(): Promise<HAConnectionStatus> {
    const response = await fetch(`${this.baseUrl}/status`, {
      credentials: 'include',
    });

    if (!response.ok) {
      if (response.status === 404) {
        return { connected: false, error: 'Not configured' };
      }
      const error = await response.json();
      throw new Error(error.detail || 'Failed to get status');
    }

    return await response.json();
  }

  async discoverDevices(): Promise<HADevice[]> {
    const response = await fetch(`${this.baseUrl}/devices/discover`, {
      method: 'POST',
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to discover devices');
    }

    return await response.json();
  }

  async getDevices(): Promise<HADevice[]> {
    const response = await fetch(`${this.baseUrl}/devices`, {
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch devices');
    }

    return await response.json();
  }

  async getDevice(entityId: string): Promise<HADevice> {
    try {
      const response = await fetch(`${this.baseUrl}/devices/${encodeURIComponent(entityId)}`);
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
    const response = await fetch(`${this.baseUrl}/devices/${request.entity_id}/control`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
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
    const response = await fetch(`${this.baseUrl}/assignments`, {
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch assignments');
    }

    return await response.json();
  }

  async saveAssignment(assignment: DeviceAssignment): Promise<DeviceAssignment> {
    const response = await fetch(`${this.baseUrl}/assignments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(assignment),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to save assignment');
    }

    return await response.json();
  }

  async removeAssignment(entityId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/assignments/${entityId}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to remove assignment');
    }
  }

  // WebSocket methods (for real-time updates)
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

  private initializeWebSocket(): void {
    // Use the local WebSocket URL for real-time updates
    // This will be configured to use the local Home Assistant URL
    const wsUrl = `ws://${window.location.host}/api/v1/home-assistant/ws`;
    
    try {
      this.wsConnection = new WebSocket(wsUrl);
      
      this.wsConnection.onopen = () => {
        console.log('Home Assistant WebSocket connected');
      };
      
      this.wsConnection.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'device_update' && data.device) {
            const callback = this.subscriptions.get(data.device.entity_id);
            if (callback) {
              callback(data.device);
            }
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      this.wsConnection.onclose = () => {
        console.log('Home Assistant WebSocket disconnected');
        this.wsConnection = null;
        
        // Attempt to reconnect after 5 seconds if there are active subscriptions
        if (this.subscriptions.size > 0) {
          setTimeout(() => {
            this.initializeWebSocket();
          }, 5000);
        }
      };
      
      this.wsConnection.onerror = (error) => {
        console.error('Home Assistant WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
    }
  }
}

export const homeAssistantService = new HomeAssistantService();
export default homeAssistantService; 