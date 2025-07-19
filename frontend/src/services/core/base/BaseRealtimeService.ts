"use client";

import { BaseService } from "./BaseService";
import { ErrorHandler } from "../utils/errorHandler";

export interface RealtimeSubscription {
  id: string;
  channel: string;
  callback: (data: any) => void;
  cleanup?: () => void;
}

export interface WebSocketConnectionConfig {
  url: string;
  protocols?: string[];
  headers?: Record<string, string>;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export abstract class BaseRealtimeService extends BaseService {
  protected websocket: WebSocket | null = null;
  protected subscriptions: Map<string, RealtimeSubscription> = new Map();
  protected connectionConfig: WebSocketConnectionConfig | null = null;
  protected reconnectAttempts = 0;
  protected reconnectTimer: NodeJS.Timeout | null = null;
  protected isConnecting = false;

  constructor() {
    super();
    this.setupCleanup();
  }

  protected abstract getWebSocketUrl(): string;
  protected abstract getAuthHeaders(): Promise<Record<string, string>>;

  async connect(config?: Partial<WebSocketConnectionConfig>): Promise<void> {
    if (this.isConnecting || this.websocket?.readyState === WebSocket.OPEN) {
      return;
    }

    this.isConnecting = true;

    try {
      const url = this.getWebSocketUrl();
      const headers = await this.getAuthHeaders();

      this.connectionConfig = {
        url,
        protocols: [],
        headers,
        reconnectInterval: 5000,
        maxReconnectAttempts: 5,
        ...config,
      };

      await this.createWebSocketConnection();
    } catch (error) {
      this.isConnecting = false;
      return ErrorHandler.handle(error, "WebSocket connection");
    }
  }

  protected async createWebSocketConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.connectionConfig) {
        reject(new Error("No connection configuration"));
        return;
      }

      this.websocket = new WebSocket(
        this.connectionConfig.url,
        this.connectionConfig.protocols,
      );

      this.websocket.onopen = () => {
        this.logOperation("WebSocket connected");
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.onConnectionOpen();
        resolve();
      };

      this.websocket.onmessage = (event) => {
        this.handleMessage(event);
      };

      this.websocket.onclose = (event) => {
        this.logOperation("WebSocket closed", {
          code: event.code,
          reason: event.reason,
        });
        this.isConnecting = false;
        this.onConnectionClose(event);
        this.attemptReconnect();
      };

      this.websocket.onerror = (error) => {
        this.logOperation("WebSocket error", error);
        this.isConnecting = false;
        this.onConnectionError(error);
        reject(error);
      };
    });
  }

  protected handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);
      this.processMessage(data);
    } catch (error) {
      console.error("Error parsing WebSocket message:", error);
    }
  }

  protected processMessage(data: any): void {
    // Override in subclasses to handle specific message types
    this.logOperation("Received message", data);
  }

  protected onConnectionOpen(): void {
    // Override in subclasses
  }

  protected onConnectionClose(event: CloseEvent): void {
    // Override in subclasses
  }

  protected onConnectionError(error: Event): void {
    // Override in subclasses
  }

  protected attemptReconnect(): void {
    if (!this.connectionConfig) return;

    if (this.reconnectAttempts >= this.connectionConfig.maxReconnectAttempts!) {
      this.logOperation("Max reconnect attempts reached");
      return;
    }

    this.reconnectAttempts++;
    this.logOperation(
      `Attempting reconnect ${this.reconnectAttempts}/${this.connectionConfig.maxReconnectAttempts}`,
    );

    this.reconnectTimer = setTimeout(() => {
      this.createWebSocketConnection().catch((error) => {
        console.error("Reconnect failed:", error);
      });
    }, this.connectionConfig.reconnectInterval!);
  }

  subscribe(id: string, channel: string, callback: (data: any) => void): void {
    const subscription: RealtimeSubscription = {
      id,
      channel,
      callback,
    };

    this.subscriptions.set(id, subscription);
    this.logOperation("Subscribed to channel", { id, channel });
  }

  unsubscribe(id: string): void {
    const subscription = this.subscriptions.get(id);
    if (subscription) {
      subscription.cleanup?.();
      this.subscriptions.delete(id);
      this.logOperation("Unsubscribed from channel", {
        id,
        channel: subscription.channel,
      });
    }
  }

  protected send(data: any): void {
    if (this.websocket?.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify(data));
    } else {
      console.warn("WebSocket not connected, cannot send message");
    }
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }

    this.subscriptions.clear();
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.logOperation("Disconnected from WebSocket");
  }

  protected setupCleanup(): void {
    if (typeof window !== "undefined") {
      window.addEventListener("beforeunload", () => {
        this.disconnect();
      });

      window.addEventListener("online", () => {
        if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
          this.connect().catch((error) => {
            console.error("Failed to reconnect on online event:", error);
          });
        }
      });
    }
  }

  isConnected(): boolean {
    return this.websocket?.readyState === WebSocket.OPEN;
  }

  getConnectionState(): string {
    if (!this.websocket) return "DISCONNECTED";

    switch (this.websocket.readyState) {
      case WebSocket.CONNECTING:
        return "CONNECTING";
      case WebSocket.OPEN:
        return "CONNECTED";
      case WebSocket.CLOSING:
        return "CLOSING";
      case WebSocket.CLOSED:
        return "CLOSED";
      default:
        return "UNKNOWN";
    }
  }
}
