"use client";

import { BaseRealtimeService } from "../../core/base/BaseRealtimeService";

export interface HomeAssistantConfig {
  url: string;
  token: string;
  port?: number;
  ssl?: boolean;
}

export interface HomeAssistantMessage {
  type: string;
  data?: any;
  timestamp: string;
}

export interface DeviceStateUpdate {
  entity_id: string;
  state: string;
  attributes?: Record<string, any>;
  last_changed: string;
  last_updated: string;
}

export class HomeAssistantWebSocketService extends BaseRealtimeService {
  private static instance: HomeAssistantWebSocketService;
  private config: HomeAssistantConfig | null = null;
  private messageHandlers: Map<string, (data: any) => void> = new Map();
  private messageId = 1;
  private isAuthenticated = false;

  private constructor() {
    super();
  }

  static getInstance(): HomeAssistantWebSocketService {
    if (!HomeAssistantWebSocketService.instance) {
      HomeAssistantWebSocketService.instance =
        new HomeAssistantWebSocketService();
    }
    return HomeAssistantWebSocketService.instance;
  }

  async initialize(config: HomeAssistantConfig): Promise<void> {
    this.config = config;

    return this.executeWithAuth(async () => {
      await this.connect({
        url: this.getWebSocketUrl(),
        reconnectInterval: 5000,
        maxReconnectAttempts: 10,
      });
    }, "Initialize Home Assistant WebSocket");
  }

  protected getWebSocketUrl(): string {
    if (!this.config) {
      throw new Error("Home Assistant config not set");
    }

    const protocol = this.config.ssl ? "wss" : "ws";
    const port = this.config.port || (this.config.ssl ? 8123 : 8123);

    return `${protocol}://${this.config.url}:${port}/api/websocket`;
  }

  protected async getAuthHeaders(): Promise<Record<string, string>> {
    if (!this.config) {
      throw new Error("Home Assistant config not set");
    }

    return {
      Authorization: `Bearer ${this.config.token}`,
    };
  }

  protected onConnectionOpen(): void {
    this.logOperation("Home Assistant WebSocket connected");
    // Home Assistant requires authentication after connection
    this.authenticateWebSocket();
  }

  protected onConnectionClose(event: CloseEvent): void {
    this.logOperation("Home Assistant WebSocket disconnected", {
      code: event.code,
    });
    this.isAuthenticated = false;
  }

  protected onConnectionError(error: Event): void {
    this.logOperation("Home Assistant WebSocket error", error);
    this.isAuthenticated = false;
  }

  protected processMessage(data: any): void {
    this.logOperation("Home Assistant message received", data);

    // Handle authentication response
    if (data.type === "auth_required") {
      this.authenticateWebSocket();
      return;
    }

    if (data.type === "auth_ok") {
      this.isAuthenticated = true;
      this.logOperation("Home Assistant authentication successful");
      this.initializeStateSubscription();
      return;
    }

    if (data.type === "auth_invalid") {
      this.logOperation("Home Assistant authentication failed");
      this.isAuthenticated = false;
      return;
    }

    // Handle state changes
    if (data.type === "event" && data.event?.event_type === "state_changed") {
      this.handleStateChange(data.event.data);
      return;
    }

    // Handle custom message types
    const handler = this.messageHandlers.get(data.type);
    if (handler) {
      handler(data);
    }
  }

  private authenticateWebSocket(): void {
    if (!this.config) {
      throw new Error("Home Assistant config not set");
    }

    this.send({
      type: "auth",
      access_token: this.config.token,
    });
  }

  private initializeStateSubscription(): void {
    this.send({
      id: this.messageId++,
      type: "subscribe_events",
      event_type: "state_changed",
    });
  }

  private handleStateChange(data: any): void {
    const stateUpdate: DeviceStateUpdate = {
      entity_id: data.entity_id,
      state: data.new_state?.state || "",
      attributes: data.new_state?.attributes || {},
      last_changed: data.new_state?.last_changed || new Date().toISOString(),
      last_updated: data.new_state?.last_updated || new Date().toISOString(),
    };

    // Notify all subscriptions listening for state changes
    this.subscriptions.forEach((subscription) => {
      if (subscription.channel === "state_changed") {
        subscription.callback(stateUpdate);
      }
    });
  }

  subscribeToStateChanges(
    callback: (update: DeviceStateUpdate) => void,
  ): string {
    const subscriptionId = `state_${Date.now()}`;
    this.subscribe(subscriptionId, "state_changed", callback);
    return subscriptionId;
  }

  async callService(
    domain: string,
    service: string,
    serviceData?: any,
  ): Promise<any> {
    if (!this.isAuthenticated) {
      throw new Error("Not authenticated with Home Assistant");
    }

    return new Promise((resolve, reject) => {
      const messageId = this.messageId++;

      const handler = (data: any) => {
        if (data.id === messageId) {
          this.messageHandlers.delete(`result_${messageId}`);

          if (data.success) {
            resolve(data.result);
          } else {
            reject(new Error(data.error?.message || "Service call failed"));
          }
        }
      };

      this.messageHandlers.set(`result_${messageId}`, handler);

      this.send({
        id: messageId,
        type: "call_service",
        domain,
        service,
        service_data: serviceData,
      });

      // Timeout after 30 seconds
      setTimeout(() => {
        this.messageHandlers.delete(`result_${messageId}`);
        reject(new Error("Service call timeout"));
      }, 30000);
    });
  }

  async getStates(): Promise<any[]> {
    if (!this.isAuthenticated) {
      throw new Error("Not authenticated with Home Assistant");
    }

    return new Promise((resolve, reject) => {
      const messageId = this.messageId++;

      const handler = (data: any) => {
        if (data.id === messageId) {
          this.messageHandlers.delete(`result_${messageId}`);

          if (data.success !== false) {
            resolve(data.result || []);
          } else {
            reject(new Error(data.error?.message || "Get states failed"));
          }
        }
      };

      this.messageHandlers.set(`result_${messageId}`, handler);

      this.send({
        id: messageId,
        type: "get_states",
      });

      // Timeout after 30 seconds
      setTimeout(() => {
        this.messageHandlers.delete(`result_${messageId}`);
        reject(new Error("Get states timeout"));
      }, 30000);
    });
  }

  getConfig(): HomeAssistantConfig | null {
    return this.config;
  }

  isWebSocketAuthenticated(): boolean {
    return this.isAuthenticated;
  }
}
