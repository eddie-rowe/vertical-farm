"use client";

import toast from "react-hot-toast";

import { supabase } from "@/lib/supabaseClient";

// Re-export all types from canonical location for backward compatibility
export type {
  HADevice,
  HAConfig,
  HAConnectionStatus,
  DeviceControlRequest,
  DeviceAssignment,
  ImportedDevice,
  ImportDevicesRequest,
  ImportDevicesResponse,
  HomeAssistantEntity,
  WebSocketMessage,
} from "@/types/integrations/homeassistant";

// Import types for internal use
import type {
  HADevice,
  HAConfig,
  HAConnectionStatus,
  DeviceControlRequest,
  DeviceAssignment,
  ImportedDevice,
  ImportDevicesRequest,
  ImportDevicesResponse,
  HomeAssistantEntity,
  WebSocketMessage,
} from "@/types/integrations/homeassistant";

// Home Assistant API service for frontend
const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/v1/home-assistant`;

class HomeAssistantService {
  private baseUrl = API_BASE_URL;
  private wsConnection: WebSocket | null = null;
  private subscriptions = new Map<string, (device: HADevice) => void>();
  private eventListeners: Map<string, (entity: HomeAssistantEntity) => void> =
    new Map();
  private messageId = 1;
  private isAuthenticated = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 5000;
  private connectionRetryCount = 0;
  private maxRetries = 5;
  private retryDelay = 1000; // Start with 1 second

  private async getAuthHeaders(): Promise<HeadersInit> {
    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();

    if (sessionError || !sessionData.session) {
      // User is not authenticated or session expired
      throw new Error("Authentication required. Please log in to continue.");
    }

    return {
      Authorization: `Bearer ${sessionData.session.access_token}`,
      "Content-Type": "application/json",
    };
  }

  private async handleApiError(
    response: Response,
    operation: string,
  ): Promise<void> {
    if (response.status === 401) {
      toast.error("Session expired. Please sign in again.");
      // Trigger sign out to clear invalid session
      await supabase.auth.signOut();
      throw new Error("Authentication failed");
    }

    if (!response.ok) {
      const errorText = await response.text();
      // Operation failed
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
        if (response.status === 500) {
          // Server error - don't sign out user, just return null
          // Home Assistant config service error
          return null;
        }
        await this.handleApiError(response, "Get configuration");
      }

      const backendConfigs = await response.json();

      // If no configurations exist, return null
      if (!backendConfigs || backendConfigs.length === 0) {
        return null;
      }

      // Find the default configuration or use the first one
      const defaultConfig =
        backendConfigs.find((config: any) => config.is_default) ||
        backendConfigs[0];

      // Transform backend response to frontend format
      return {
        url: defaultConfig.url,
        token: "", // Backend doesn't return the token for security
        enabled: defaultConfig.is_default,
        cloudflare_client_id: "", // Backend doesn't return credentials for security
        cloudflare_client_secret: "",
        name: defaultConfig.name,
        local_url: defaultConfig.local_url,
      };
    } catch (error) {
      // Failed to get HA configuration
      // Return null instead of throwing to prevent logout
      return null;
    }
  }

  async getAllConfigs(): Promise<
    Array<HAConfig & { id: string; created_at: string; updated_at: string }>
  > {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}/config`, { headers });

      if (!response.ok) {
        if (response.status === 404) {
          return [];
        }
        await this.handleApiError(response, "Get all configurations");
      }

      const backendConfigs = await response.json();

      // Transform backend response to frontend format
      return backendConfigs.map((config: any) => ({
        id: config.id,
        url: config.url,
        token: "", // Backend doesn't return the token for security
        enabled: config.is_default,
        cloudflare_client_id: "", // Backend doesn't return credentials for security
        cloudflare_client_secret: "",
        name: config.name,
        local_url: config.local_url,
        created_at: config.created_at,
        updated_at: config.updated_at,
      }));
    } catch (error) {
      // Failed to get all HA configurations
      throw error;
    }
  }

  async deleteConfig(configId: string): Promise<void> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}/config/${configId}`, {
        method: "DELETE",
        headers,
      });

      await this.handleApiError(response, "Delete configuration");
      toast.success("Configuration deleted successfully");
    } catch (error) {
      // Failed to delete HA configuration
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
      // Failed to save HA configuration
      throw error;
    }
  }

  private async createConfig(config: HAConfig): Promise<HAConfig> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}/config`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          name: config.name,
          url: config.url,
          access_token: config.token,
          cloudflare_enabled: !!(
            config.cloudflare_client_id && config.cloudflare_client_secret
          ),
          cloudflare_client_id: config.cloudflare_client_id,
          cloudflare_client_secret: config.cloudflare_client_secret,
          is_default: config.enabled,
          local_url: config.local_url,
        }),
      });

      await this.handleApiError(response, "Create configuration");
      const result = await response.json();
      toast.success("Configuration created successfully");

      return {
        ...config,
        id: result.id,
        created_at: result.created_at,
        updated_at: result.updated_at,
      };
    } catch (error) {
      // Failed to create HA configuration
      throw error;
    }
  }

  private async updateConfig(
    configId: string,
    config: HAConfig,
  ): Promise<HAConfig> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}/config/${configId}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          name: config.name,
          url: config.url,
          access_token: config.token,
          cloudflare_enabled: !!(
            config.cloudflare_client_id && config.cloudflare_client_secret
          ),
          cloudflare_client_id: config.cloudflare_client_id,
          cloudflare_client_secret: config.cloudflare_client_secret,
          is_default: config.enabled,
          local_url: config.local_url,
        }),
      });

      await this.handleApiError(response, "Update configuration");
      const result = await response.json();
      toast.success("Configuration updated successfully");

      return {
        ...config,
        id: result.id,
        created_at: result.created_at,
        updated_at: result.updated_at,
      };
    } catch (error) {
      // Failed to update HA configuration
      throw error;
    }
  }

  async testConnection(
    url: string,
    token: string,
    options?: {
      cloudflare_client_id?: string;
      cloudflare_client_secret?: string;
    },
  ): Promise<HAConnectionStatus> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}/test-connection`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          url,
          access_token: token,
          cloudflare_enabled: !!(
            options?.cloudflare_client_id && options?.cloudflare_client_secret
          ),
          cloudflare_client_id: options?.cloudflare_client_id,
          cloudflare_client_secret: options?.cloudflare_client_secret,
        }),
      });

      await this.handleApiError(response, "Test connection");
      const result = await response.json();

      if (result.success) {
        toast.success("Connection test successful");
      } else {
        toast.error(`Connection test failed: ${result.message}`);
      }

      return {
        connected: result.success,
        version: result.version,
        error: result.success ? undefined : result.message,
      };
    } catch (error) {
      // Connection test failed
      toast.error("Connection test failed");
      return {
        connected: false,
        error: "Connection test failed",
      };
    }
  }

  async getStatus(): Promise<HAConnectionStatus> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}/status`, { headers });

      // Handle specific status codes more gracefully for status endpoint
      if (response.status === 404) {
        // No configuration found - this is normal for new users
        return {
          connected: false,
          version: undefined,
          device_count: 0,
          last_updated: undefined,
          error: "No Home Assistant configuration found",
        };
      }

      if (response.status === 500) {
        // Server error - don't sign out user, just return disconnected status
        // Home Assistant service error
        return {
          connected: false,
          version: undefined,
          device_count: 0,
          last_updated: undefined,
          error: "Home Assistant service unavailable",
        };
      }

      if (response.status === 401) {
        // For status checks, don't auto-logout on 401 - just return disconnected status
        // Home Assistant status check failed - user not authenticated for this integration
        return {
          connected: false,
          version: undefined,
          device_count: 0,
          last_updated: undefined,
          error: "Authentication required for Home Assistant integration",
        };
      }

      // Only call handleApiError for other errors (not 401)
      await this.handleApiError(response, "Get status");
      const result = await response.json();

      return {
        connected: result.connected,
        version: result.version,
        device_count: result.device_count,
        last_updated: result.last_updated,
        error: result.error,
      };
    } catch (error) {
      // Failed to get HA status
      // Return a safe default instead of throwing
      return {
        connected: false,
        version: undefined,
        device_count: 0,
        last_updated: undefined,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async discoverDevices(): Promise<HADevice[]> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}/discover`, {
        method: "POST",
        headers,
      });

      await this.handleApiError(response, "Discover devices");
      const result = await response.json();

      // Extract devices array from DeviceListResponse
      return result.devices || [];
    } catch (error) {
      // Failed to discover HA devices
      throw error;
    }
  }

  async getDevices(): Promise<HADevice[]> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}/devices`, { headers });

      await this.handleApiError(response, "Get devices");
      const result = await response.json();

      // Extract devices array from DeviceListResponse
      return result.devices || [];
    } catch (error) {
      // Failed to get HA devices
      throw error;
    }
  }

  async getDevice(entityId: string): Promise<HADevice> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}/devices/${entityId}`, {
        headers,
      });

      await this.handleApiError(response, "Get device");
      const result = await response.json();

      // Extract device from DeviceDetailsResponse
      return result.device || null;
    } catch (error) {
      // Failed to get HA device
      throw error;
    }
  }

  async controlDevice(request: DeviceControlRequest): Promise<void> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(
        `${this.baseUrl}/devices/${request.entity_id}/control`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            action: request.action,
            options: request.options,
            duration: request.duration,
          }),
        },
      );

      await this.handleApiError(response, "Control device");
      toast.success(`Device ${request.action} successful`);
    } catch (error) {
      // Failed to control HA device
      toast.error("Failed to control device");
      throw error;
    }
  }

  async controlLight(
    entityId: string,
    action: "turn_on" | "turn_off" | "toggle",
    options?: { brightness?: number; color?: string },
  ): Promise<void> {
    return this.controlDevice({
      entity_id: entityId,
      action,
      options,
    });
  }

  async controlIrrigation(
    entityId: string,
    action: "open" | "close" | "pulse",
    duration?: number,
  ): Promise<void> {
    const actionMap = {
      open: "turn_on",
      close: "turn_off",
      pulse: "toggle",
    } as const;
    return this.controlDevice({
      entity_id: entityId,
      action: actionMap[action],
      duration,
    });
  }

  async getAssignments(): Promise<DeviceAssignment[]> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}/devices/assignments`, {
        headers,
      });

      // Handle the case where no Home Assistant configuration exists
      if (response.status === 404) {
        return []; // Return empty array instead of throwing error
      }

      await this.handleApiError(response, "Get assignments");
      const result = await response.json();
      return result.assignments || []; // Backend returns {assignments: [...], count: N}
    } catch (error) {
      // Failed to get device assignments
      throw error;
    }
  }

  async saveAssignment(
    assignment: DeviceAssignment,
  ): Promise<DeviceAssignment> {
    try {
      const headers = await this.getAuthHeaders();

      // Prepare the request body to match backend DeviceAssignmentRequest model
      const requestBody = {
        shelf_id: assignment.shelf_id || null,
        rack_id: assignment.rack_id || null,
        row_id: assignment.row_id || null,
        farm_id: assignment.farm_id || null,
        friendly_name: assignment.friendly_name || null,
        assigned_by: assignment.assigned_by || null,
      };

      const response = await fetch(
        `${this.baseUrl}/devices/${assignment.entity_id}/assign`,
        {
          method: "POST",
          headers,
          body: JSON.stringify(requestBody),
        },
      );

      await this.handleApiError(response, "Save assignment");
      const result = await response.json();
      toast.success("Device assignment saved successfully");

      // Backend returns { success: true, message: "...", assignment: {...} }
      return result.assignment || result;
    } catch (error) {
      // Failed to save device assignment
      throw error;
    }
  }

  async removeAssignment(entityId: string): Promise<void> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(
        `${this.baseUrl}/devices/${entityId}/assignment`,
        {
          method: "DELETE",
          headers,
        },
      );

      await this.handleApiError(response, "Remove assignment");
      toast.success("Device assignment removed successfully");
    } catch (error) {
      // Failed to remove device assignment
      throw error;
    }
  }

  // Device Import Methods
  async importDevices(
    request: ImportDevicesRequest,
  ): Promise<ImportDevicesResponse> {
    try {
      const headers = await this.getAuthHeaders();
      // Importing devices request

      const response = await fetch(`${this.baseUrl}/devices/import`, {
        method: "POST",
        headers,
        body: JSON.stringify(request),
      });

      await this.handleApiError(response, "Import devices");
      const result = await response.json();
      // Import devices response

      if (result.success) {
        toast.success(
          `Successfully imported ${result.imported_count} device(s)`,
        );
      } else if (result.errors?.length > 0) {
        toast.error(
          `Import completed with errors: ${result.errors.join(", ")}`,
        );
      }

      return result;
    } catch (error) {
      // Failed to import devices
      toast.error("Failed to import devices");
      throw error;
    }
  }

  async getImportedDevices(
    deviceType?: string,
    assigned?: boolean,
  ): Promise<ImportedDevice[]> {
    try {
      const headers = await this.getAuthHeaders();
      const params = new URLSearchParams();
      if (deviceType) params.append("device_type", deviceType);
      if (assigned !== undefined)
        params.append("assigned", assigned.toString());

      const url = `${this.baseUrl}/devices/imported${params.toString() ? "?" + params.toString() : ""}`;
      // Calling getImportedDevices URL

      const response = await fetch(url, { headers });

      await this.handleApiError(response, "Get imported devices");
      const data = await response.json();
      // Raw getImportedDevices response

      return data.devices || [];
    } catch (error) {
      // Error in getImportedDevices
      throw error;
    }
  }

  async updateImportedDevice(
    entityId: string,
    updates: { name?: string; device_type?: string },
  ): Promise<ImportedDevice> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(
        `${this.baseUrl}/devices/imported/${entityId}`,
        {
          method: "PUT",
          headers,
          body: JSON.stringify(updates),
        },
      );

      await this.handleApiError(response, "Update imported device");
      const result = await response.json();
      toast.success("Device updated successfully");
      return result;
    } catch (error) {
      // Failed to update imported device
      toast.error("Failed to update device");
      throw error;
    }
  }

  async removeImportedDevice(entityId: string): Promise<void> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(
        `${this.baseUrl}/devices/imported/${entityId}`,
        {
          method: "DELETE",
          headers,
        },
      );

      await this.handleApiError(response, "Remove imported device");
      toast.success("Device removed from library");
    } catch (error) {
      // Failed to remove imported device
      toast.error("Failed to remove device");
      throw error;
    }
  }

  createDeviceSubscription(
    entityId: string,
    callback: (device: HADevice) => void,
  ): () => void {
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
        domain: entity.entity_id.split(".")[0],
        device_class: entity.attributes.device_class,
        unit_of_measurement: entity.attributes.unit_of_measurement,
        area: entity.attributes.area,
      };
      callback(device);
    });

    return () => {
      this.subscriptions.delete(entityId);
      this.eventListeners.delete(entityId);
    };
  }

  private async initializeWebSocket(): Promise<void> {
    if (
      !this.wsConnection ||
      this.wsConnection.readyState === WebSocket.CLOSED
    ) {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("No valid session for WebSocket connection");
      }

      const wsUrl = `${this.baseUrl.replace("http", "ws")}/ws?token=${session.access_token}`;
      this.wsConnection = new WebSocket(wsUrl);

      this.wsConnection.onopen = () => {
        // WebSocket connected
        this.isAuthenticated = false;
        this.reconnectAttempts = 0;
        this.sendMessage({ type: "auth", access_token: session.access_token });
        toast.success("Connected to Home Assistant");
      };

      this.wsConnection.onmessage = (event) => {
        const message: WebSocketMessage = JSON.parse(event.data);
        this.handleWebSocketMessage(message);
      };

      this.wsConnection.onclose = (event) => {
        // WebSocket disconnected
        this.isAuthenticated = false;

        if (event.code === 1008 || event.code === 4001) {
          toast.error("WebSocket authentication failed. Please sign in again.");
          supabase.auth.signOut();
          return;
        }

        if (
          event.code !== 1000 &&
          this.reconnectAttempts < this.maxReconnectAttempts
        ) {
          this.scheduleReconnect();
        } else if (event.code !== 1000) {
          toast.error("WebSocket connection lost. Maximum retries exceeded.");
        }
      };

      this.wsConnection.onerror = (error) => {
        // WebSocket error
        toast.error("WebSocket connection error");
      };
    }
  }

  private async handleWebSocketMessage(
    message: WebSocketMessage,
  ): Promise<void> {
    switch (message.type) {
      case "auth_required":
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.access_token) {
          this.sendMessage({
            type: "auth",
            access_token: session.access_token,
          });
        }
        break;

      case "auth_ok":
        this.isAuthenticated = true;
        // WebSocket authenticated
        // Subscribe to state changes
        this.sendMessage({
          type: "subscribe_events",
          id: this.messageId++,
          event_type: "state_changed",
        });
        break;

      case "auth_invalid":
        // WebSocket authentication failed
        toast.error("WebSocket authentication failed");
        this.wsConnection?.close();
        break;

      case "result":
        if (message.success) {
          // Successfully subscribed to events
        }
        break;

      case "event":
        if (message.event?.event_type === "state_changed") {
          const { entity_id, new_state } = message.event.data;
          const listener = this.eventListeners.get(entity_id);
          if (listener) {
            listener(new_state);
          }
        }
        break;

      case "error":
        // WebSocket error
        toast.error(`Home Assistant error: ${message.error?.message}`);
        break;
    }
  }

  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    // Scheduling WebSocket reconnect attempt

    setTimeout(() => {
      this.initializeWebSocket().catch((error) => {
        // WebSocket reconnection failed
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
  subscribeToEntity(
    entityId: string,
    callback: (entity: HomeAssistantEntity) => void,
  ): void {
    this.eventListeners.set(entityId, callback);
  }

  // Unsubscribe from entity state changes
  unsubscribeFromEntity(entityId: string): void {
    this.eventListeners.delete(entityId);
  }

  disconnectWebSocket(): void {
    if (this.wsConnection) {
      this.wsConnection.close(1000, "Deliberate disconnect");
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
    return (
      this.wsConnection?.readyState === WebSocket.OPEN && this.isAuthenticated
    );
  }

  // Initialize connection with authentication awareness
  async connect(): Promise<void> {
    try {
      await this.initializeWebSocket();
    } catch (error) {
      // Failed to connect WebSocket
      toast.error("Failed to connect to Home Assistant");
      throw error;
    }
  }
}

// Export singleton instance
export const homeAssistantService = new HomeAssistantService();
export default homeAssistantService;
