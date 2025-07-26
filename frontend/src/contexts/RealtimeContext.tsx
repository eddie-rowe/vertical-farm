"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import toast from "react-hot-toast";

import { supabase } from "@/lib/supabaseClient";

import { useAuth } from "./AuthContext";

// Types for real-time events
interface RealtimeEvent {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  record: any;
  old_record?: any;
  timestamp: string;
}

interface RealtimeContextType {
  // Connection status
  isConnected: boolean;
  connectionStatus: "connecting" | "connected" | "disconnected" | "error";

  // Subscription management
  subscribe: (
    table: string,
    callback: (event: RealtimeEvent) => void,
  ) => () => void;
  unsubscribe: (table: string) => void;

  // Real-time data states
  deviceConfigs: any[];
  homeAssistantConfigs: any[];
  userProfiles: any[];

  // Statistics
  subscriptionCount: number;
  eventCount: number;
  lastEventTime: Date | null;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(
  undefined,
);

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  // Connection state
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "disconnected" | "error"
  >("disconnected");

  // Real-time data
  const [deviceConfigs, setDeviceConfigs] = useState<any[]>([]);
  const [homeAssistantConfigs, setHomeAssistantConfigs] = useState<any[]>([]);
  const [userProfiles, setUserProfiles] = useState<any[]>([]);

  // Statistics
  const [subscriptionCount, setSubscriptionCount] = useState(0);
  const [eventCount, setEventCount] = useState(0);
  const [lastEventTime, setLastEventTime] = useState<Date | null>(null);

  // Store active subscriptions
  const [subscriptions, setSubscriptions] = useState<Map<string, any>>(
    new Map(),
  );
  const [callbacks, setCallbacks] = useState<
    Map<string, ((event: RealtimeEvent) => void)[]>
  >(new Map());

  // Initialize real-time connection
  useEffect(() => {
    if (!user) {
      setConnectionStatus("disconnected");
      setIsConnected(false);
      return;
    }

    setConnectionStatus("connecting");

    // Set up real-time connection status monitoring
    const channel = supabase.realtime.channel("connection_status");

    channel
      .on("presence", { event: "sync" }, () => {
        setIsConnected(true);
        setConnectionStatus("connected");
      })
      .on("presence", { event: "join" }, () => {
        setIsConnected(true);
        setConnectionStatus("connected");
      })
      .on("presence", { event: "leave" }, () => {
        setIsConnected(false);
        setConnectionStatus("disconnected");
      })
      .subscribe();

    // Set up default subscriptions for key tables
    setupDefaultSubscriptions();

    return () => {
      channel.unsubscribe();
      // Clean up all subscriptions
      subscriptions.forEach((subscription, _tableName) => {
        subscription.unsubscribe();
      });
      setSubscriptions(new Map());
      setCallbacks(new Map());
      setSubscriptionCount(0);
    };
  }, [user]);

  // Set up default subscriptions for key application tables
  const setupDefaultSubscriptions = useCallback(() => {
    if (!user) return;

    // Subscribe to user device configs
    subscribe("user_device_configs", (event) => {
      handleDeviceConfigUpdate(event);
    });

    // Subscribe to Home Assistant configs
    subscribe("user_home_assistant_configs", (event) => {
      handleHomeAssistantConfigUpdate(event);
    });

    // Subscribe to user profiles
    subscribe("profiles", (event) => {
      handleUserProfileUpdate(event);
    });
  }, [user]);

  // Generic subscription function
  const subscribe = useCallback(
    (table: string, callback: (event: RealtimeEvent) => void) => {
      if (!user) return () => {};

      // Add callback to the list for this table
      setCallbacks((prev) => {
        const current = prev.get(table) || [];
        const updated = new Map(prev);
        updated.set(table, [...current, callback]);
        return updated;
      });

      // Create subscription if it doesn't exist
      if (!subscriptions.has(table)) {
        const channel = supabase.realtime.channel(`table_${table}`);

        channel
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: table,
              filter: `user_id=eq.${user.id}`, // Only listen to current user's data
            },
            (payload: any) => {
              const event: RealtimeEvent = {
                type: payload.eventType as "INSERT" | "UPDATE" | "DELETE",
                table: table,
                record: payload.new,
                old_record: payload.old,
                timestamp: new Date().toISOString(),
              };

              // Update statistics
              setEventCount((prev) => prev + 1);
              setLastEventTime(new Date());

              // Call all callbacks for this table
              const tableCallbacks = callbacks.get(table) || [];
              tableCallbacks.forEach((cb) => cb(event));
            },
          )
          .subscribe();

        setSubscriptions((prev) => new Map(prev).set(table, channel));
        setSubscriptionCount((prev) => prev + 1);
      }

      // Return unsubscribe function for this specific callback
      return () => {
        setCallbacks((prev) => {
          const current = prev.get(table) || [];
          const updated = new Map(prev);
          const filtered = current.filter((cb) => cb !== callback);

          if (filtered.length === 0) {
            updated.delete(table);
            // Also unsubscribe from the channel if no more callbacks
            const subscription = subscriptions.get(table);
            if (subscription) {
              subscription.unsubscribe();
              setSubscriptions((prev) => {
                const newSubs = new Map(prev);
                newSubs.delete(table);
                return newSubs;
              });
              setSubscriptionCount((prev) => prev - 1);
            }
          } else {
            updated.set(table, filtered);
          }

          return updated;
        });
      };
    },
    [user, subscriptions, callbacks],
  );

  // Unsubscribe from a table
  const unsubscribe = useCallback(
    (table: string) => {
      const subscription = subscriptions.get(table);
      if (subscription) {
        subscription.unsubscribe();
        setSubscriptions((prev) => {
          const updated = new Map(prev);
          updated.delete(table);
          return updated;
        });
        setCallbacks((prev) => {
          const updated = new Map(prev);
          updated.delete(table);
          return updated;
        });
        setSubscriptionCount((prev) => prev - 1);
      }
    },
    [subscriptions],
  );

  // Handle device config updates
  const handleDeviceConfigUpdate = useCallback((event: RealtimeEvent) => {
    setDeviceConfigs((prev) => {
      switch (event.type) {
        case "INSERT":
          return [...prev, event.record];
        case "UPDATE":
          return prev.map((config) =>
            config.id === event.record.id ? event.record : config,
          );
        case "DELETE":
          return prev.filter((config) => config.id !== event.old_record?.id);
        default:
          return prev;
      }
    });

    // Show toast notification for important updates
    if (event.type === "UPDATE") {
      toast.success(`Device "${event.record.name}" updated`, {
        duration: 3000,
        icon: "🔄",
      });
    }
  }, []);

  // Handle Home Assistant config updates
  const handleHomeAssistantConfigUpdate = useCallback(
    (event: RealtimeEvent) => {
      setHomeAssistantConfigs((prev) => {
        switch (event.type) {
          case "INSERT":
            toast.success("Home Assistant integration added", {
              duration: 4000,
              icon: "🏠",
            });
            return [...prev, event.record];
          case "UPDATE":
            toast.success("Home Assistant integration updated", {
              duration: 3000,
              icon: "🔄",
            });
            return prev.map((config) =>
              config.id === event.record.id ? event.record : config,
            );
          case "DELETE":
            toast.error("Home Assistant integration removed", {
              duration: 4000,
              icon: "❌",
            });
            return prev.filter((config) => config.id !== event.old_record?.id);
          default:
            return prev;
        }
      });
    },
    [],
  );

  // Handle user profile updates
  const handleUserProfileUpdate = useCallback((event: RealtimeEvent) => {
    setUserProfiles((prev) => {
      switch (event.type) {
        case "INSERT":
          return [...prev, event.record];
        case "UPDATE":
          return prev.map((profile) =>
            profile.id === event.record.id ? event.record : profile,
          );
        case "DELETE":
          return prev.filter((profile) => profile.id !== event.old_record?.id);
        default:
          return prev;
      }
    });
  }, []);

  // Connection status effects
  useEffect(() => {
    if (connectionStatus === "connected" && !isConnected) {
      toast.success("Real-time connection established", {
        duration: 2000,
        icon: "🔗",
      });
    } else if (connectionStatus === "error") {
      toast.error("Real-time connection failed", {
        duration: 4000,
        icon: "🔌",
      });
    } else if (connectionStatus === "disconnected" && eventCount > 0) {
      toast.error("Real-time connection lost", {
        duration: 4000,
        icon: "📡",
      });
    }
  }, [connectionStatus, isConnected, eventCount]);

  const value: RealtimeContextType = {
    isConnected,
    connectionStatus,
    subscribe,
    unsubscribe,
    deviceConfigs,
    homeAssistantConfigs,
    userProfiles,
    subscriptionCount,
    eventCount,
    lastEventTime,
  };

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  const context = useContext(RealtimeContext);
  if (context === undefined) {
    throw new Error("useRealtime must be used within a RealtimeProvider");
  }
  return context;
}

// Hook for subscribing to specific table updates
export function useRealtimeSubscription(
  table: string,
  callback: (event: RealtimeEvent) => void,
  enabled: boolean = true,
) {
  const { subscribe } = useRealtime();

  useEffect(() => {
    if (!enabled) return;

    const unsubscribe = subscribe(table, callback);
    return unsubscribe;
  }, [table, callback, enabled, subscribe]);
}
