"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { toast } from "react-hot-toast";

import {
  DeviceLayerState,
  DeviceData,
  DeviceAction,
  DeviceWebSocketMessage,
} from "@/types/device-layer";

import { useAuth } from "./AuthContext";

// Device Layer Actions
type DeviceLayerAction =
  | { type: "SET_ENABLED"; enabled: boolean }
  | { type: "SET_LOADING"; loading: boolean }
  | { type: "SET_ERROR"; error?: string }
  | {
      type: "SET_CONNECTION_STATUS";
      status: "connected" | "disconnected" | "connecting";
    }
  | { type: "UPDATE_DEVICE"; device: DeviceData }
  | { type: "UPDATE_DEVICES"; devices: DeviceData[] }
  | {
      type: "UPDATE_LOCATION_DEVICES";
      locationId: string;
      devices: DeviceData[];
    }
  | { type: "SET_SELECTED_DEVICE"; entityId?: string }
  | { type: "SET_CONTROL_PANEL_OPEN"; open: boolean }
  | { type: "REMOVE_DEVICE"; entityId: string };

// Initial state
const initialState: DeviceLayerState = {
  enabled: false,
  loading: false,
  connectionStatus: "disconnected",
  devices: {},
  locationDevices: {},
  controlPanelOpen: false,
};

// Reducer
function deviceLayerReducer(
  state: DeviceLayerState,
  action: DeviceLayerAction,
): DeviceLayerState {
  switch (action.type) {
    case "SET_ENABLED":
      return { ...state, enabled: action.enabled };

    case "SET_LOADING":
      return { ...state, loading: action.loading };

    case "SET_ERROR":
      return { ...state, error: action.error };

    case "SET_CONNECTION_STATUS":
      return { ...state, connectionStatus: action.status };

    case "UPDATE_DEVICE":
      return {
        ...state,
        devices: {
          ...state.devices,
          [action.device.home_assistant_entity_id]: action.device,
        },
      };

    case "UPDATE_DEVICES":
      const devicesById = action.devices.reduce(
        (acc, device) => {
          acc[device.home_assistant_entity_id] = device;
          return acc;
        },
        {} as Record<string, DeviceData>,
      );

      return {
        ...state,
        devices: { ...state.devices, ...devicesById },
      };

    case "UPDATE_LOCATION_DEVICES":
      return {
        ...state,
        locationDevices: {
          ...state.locationDevices,
          [action.locationId]: {
            location_id: action.locationId,
            devices: action.devices,
            last_updated: new Date().toISOString(),
          },
        },
      };

    case "SET_SELECTED_DEVICE":
      return { ...state, selectedDevice: action.entityId };

    case "SET_CONTROL_PANEL_OPEN":
      return { ...state, controlPanelOpen: action.open };

    case "REMOVE_DEVICE":
      const { [action.entityId]: removed, ...remainingDevices } = state.devices;
      return { ...state, devices: remainingDevices };

    default:
      return state;
  }
}

// Context
interface DeviceContextType extends DeviceLayerState {
  // Actions
  toggleLayer: () => void;
  connectWebSocket: () => Promise<void>;
  disconnectWebSocket: () => void;

  // Device Management
  loadLocationDevices: (locationId: string) => Promise<void>;
  controlDevice: (entityId: string, action: DeviceAction) => Promise<void>;

  // UI Actions
  selectDevice: (entityId?: string) => void;
  openControlPanel: () => void;
  closeControlPanel: () => void;

  // Utilities
  getDevicesByLocation: (locationId: string) => DeviceData[];
  getDeviceByEntityId: (entityId: string) => DeviceData | undefined;
  isDeviceOnline: (entityId: string) => boolean;
}

const DeviceContext = createContext<DeviceContextType | undefined>(undefined);

// Provider Component
interface DeviceProviderProps {
  children: React.ReactNode;
}

export function DeviceProvider({ children }: DeviceProviderProps) {
  const [state, dispatch] = useReducer(deviceLayerReducer, initialState);
  const { user, session } = useAuth();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // WebSocket connection management
  const connectWebSocket = useCallback(async () => {
    if (!user || !session?.access_token) {
      console.warn("No user or session available for WebSocket connection");
      return;
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log("WebSocket already connected");
      return;
    }

    dispatch({ type: "SET_CONNECTION_STATUS", status: "connecting" });
    dispatch({ type: "SET_ERROR" });

    try {
      const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000"}/api/v1/devices/ws?token=${session.access_token}`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log("WebSocket connected");
        dispatch({ type: "SET_CONNECTION_STATUS", status: "connected" });

        // Send ping to maintain connection
        const pingInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "ping" }));
          } else {
            clearInterval(pingInterval);
          }
        }, 30000);
      };

      ws.onmessage = (event) => {
        try {
          const message: DeviceWebSocketMessage = JSON.parse(event.data);
          handleWebSocketMessage(message);
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      ws.onclose = (event) => {
        console.log("WebSocket disconnected:", event.code, event.reason);
        dispatch({ type: "SET_CONNECTION_STATUS", status: "disconnected" });

        // Attempt to reconnect if not intentionally closed
        if (event.code !== 1000 && state.enabled) {
          scheduleReconnect();
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        dispatch({ type: "SET_ERROR", error: "WebSocket connection failed" });
      };

      wsRef.current = ws;
    } catch (error) {
      console.error("Error connecting WebSocket:", error);
      dispatch({ type: "SET_CONNECTION_STATUS", status: "disconnected" });
      dispatch({
        type: "SET_ERROR",
        error: "Failed to connect to device service",
      });
    }
  }, [user, session, state.enabled]);

  const disconnectWebSocket = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close(1000, "User disconnected");
      wsRef.current = null;
    }

    dispatch({ type: "SET_CONNECTION_STATUS", status: "disconnected" });
  }, []);

  const scheduleReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) return;

    reconnectTimeoutRef.current = setTimeout(() => {
      reconnectTimeoutRef.current = null;
      if (state.enabled) {
        console.log("Attempting to reconnect WebSocket...");
        connectWebSocket();
      }
    }, 5000); // Reconnect after 5 seconds
  }, [connectWebSocket, state.enabled]);

  const handleWebSocketMessage = useCallback(
    (message: DeviceWebSocketMessage) => {
      switch (message.type) {
        case "device_state_update":
          const { entity_id, state: deviceState, attributes } = message.data;

          // Update device in state
          dispatch({
            type: "UPDATE_DEVICE",
            device: {
              ...state.devices[entity_id],
              current_state: deviceState,
              attributes,
              last_updated: message.data.last_updated,
              is_online: deviceState !== "unavailable",
            } as DeviceData,
          });
          break;

        case "device_control_response":
          const { success, error } = message.data;
          if (success) {
            toast.success("Device control successful");
          } else {
            toast.error(`Device control failed: ${error}`);
          }
          break;

        case "connection_status":
          console.log("Connection status:", message.data);
          break;

        default:
          console.log("Unknown WebSocket message type:", message.type);
      }
    },
    [state.devices],
  );

  // API calls
  const loadLocationDevices = useCallback(
    async (locationId: string) => {
      if (!session?.access_token) return;

      dispatch({ type: "SET_LOADING", loading: true });

      try {
        const response = await fetch(`/api/v1/devices/location/${locationId}`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        dispatch({
          type: "UPDATE_LOCATION_DEVICES",
          locationId,
          devices: data.devices,
        });
        dispatch({ type: "UPDATE_DEVICES", devices: data.devices });
      } catch (error) {
        console.error("Error loading location devices:", error);
        dispatch({ type: "SET_ERROR", error: "Failed to load devices" });
        toast.error("Failed to load devices");
      } finally {
        dispatch({ type: "SET_LOADING", loading: false });
      }
    },
    [session],
  );

  const controlDevice = useCallback(
    async (entityId: string, action: DeviceAction) => {
      if (!session?.access_token) return;

      try {
        const response = await fetch("/api/v1/devices/control", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            entity_id: entityId,
            action,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || "Device control failed");
        }

        // Optimistically update local state
        if (result.new_state) {
          dispatch({
            type: "UPDATE_DEVICE",
            device: {
              ...state.devices[entityId],
              current_state: result.new_state,
              last_updated: new Date().toISOString(),
            } as DeviceData,
          });
        }
      } catch (error) {
        console.error("Error controlling device:", error);
        toast.error(
          `Device control failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
        throw error;
      }
    },
    [session, state.devices],
  );

  // Layer management
  const toggleLayer = useCallback(() => {
    const newEnabled = !state.enabled;
    dispatch({ type: "SET_ENABLED", enabled: newEnabled });

    if (newEnabled) {
      connectWebSocket();
    } else {
      disconnectWebSocket();
    }
  }, [state.enabled, connectWebSocket, disconnectWebSocket]);

  // UI actions
  const selectDevice = useCallback((entityId?: string) => {
    dispatch({ type: "SET_SELECTED_DEVICE", entityId });
  }, []);

  const openControlPanel = useCallback(() => {
    dispatch({ type: "SET_CONTROL_PANEL_OPEN", open: true });
  }, []);

  const closeControlPanel = useCallback(() => {
    dispatch({ type: "SET_CONTROL_PANEL_OPEN", open: false });
    dispatch({ type: "SET_SELECTED_DEVICE", entityId: undefined });
  }, []);

  // Utilities
  const getDevicesByLocation = useCallback(
    (locationId: string): DeviceData[] => {
      return state.locationDevices[locationId]?.devices || [];
    },
    [state.locationDevices],
  );

  const getDeviceByEntityId = useCallback(
    (entityId: string): DeviceData | undefined => {
      return state.devices[entityId];
    },
    [state.devices],
  );

  const isDeviceOnline = useCallback(
    (entityId: string): boolean => {
      const device = state.devices[entityId];
      return device?.is_online ?? false;
    },
    [state.devices],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnectWebSocket();
    };
  }, [disconnectWebSocket]);

  // Auto-connect when layer is enabled
  useEffect(() => {
    if (
      state.enabled &&
      state.connectionStatus === "disconnected" &&
      user &&
      session
    ) {
      connectWebSocket();
    }
  }, [state.enabled, state.connectionStatus, user, session, connectWebSocket]);

  const contextValue: DeviceContextType = {
    ...state,
    toggleLayer,
    connectWebSocket,
    disconnectWebSocket,
    loadLocationDevices,
    controlDevice,
    selectDevice,
    openControlPanel,
    closeControlPanel,
    getDevicesByLocation,
    getDeviceByEntityId,
    isDeviceOnline,
  };

  return (
    <DeviceContext.Provider value={contextValue}>
      {children}
    </DeviceContext.Provider>
  );
}

// Hook to use the Device Context
export function useDevice() {
  const context = useContext(DeviceContext);
  if (context === undefined) {
    throw new Error("useDevice must be used within a DeviceProvider");
  }
  return context;
}
