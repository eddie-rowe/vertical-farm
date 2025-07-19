"use client";

import React from "react";
import { useRealtime } from "@/contexts/RealtimeContext";
import { useRealtimeTable } from "@/hooks/useRealtimeTable";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FaWifi, FaCircle } from "@/lib/icons";

export function RealtimeDemo() {
  const {
    isConnected: realtimeConnected,
    connectionStatus,
    eventCount,
    lastEventTime,
    subscriptionCount,
  } = useRealtime();

  // Subscribe to real-time updates from user configurations
  const {
    data: configs,
    loading: configsLoading,
    error: configsError,
  } = useRealtimeTable("user_home_assistant_configs", {
    showToasts: true,
    toastMessages: {
      insert: "New Home Assistant configuration added",
      update: "Home Assistant configuration updated",
      delete: "Home Assistant configuration removed",
    },
  });

  // Subscribe to device configurations
  const {
    data: deviceConfigs,
    loading: deviceConfigsLoading,
    error: deviceConfigsError,
  } = useRealtimeTable("user_device_configs", {
    showToasts: true,
    toastMessages: {
      insert: "New device configuration added",
      update: "Device configuration updated",
      delete: "Device configuration removed",
    },
  });

  const getStatusIcon = (connected: boolean) => {
    return connected ? (
      <FaWifi className="text-green-500" />
    ) : (
      <FaWifi className="text-red-500 opacity-50" />
    );
  };

  // formatTimestamp function removed as it was not being used

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon(realtimeConnected)}
            Real-time Connection Status
          </CardTitle>
          <CardDescription>
            Live connection status and subscription health
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span>Connection Status:</span>
            <Badge
              variant={realtimeConnected ? "default" : "destructive"}
              className={
                realtimeConnected
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }
            >
              {connectionStatus}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span>Last Activity:</span>
            <span className="text-sm text-gray-600">
              {lastEventTime ? lastEventTime.toLocaleTimeString() : "Never"}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span>Events Received:</span>
            <span className="font-mono text-sm">{eventCount}</span>
          </div>

          <div className="flex items-center justify-between">
            <span>Active Subscriptions:</span>
            <span className="font-mono text-sm">{subscriptionCount}</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Home Assistant Configs</CardTitle>
            <CardDescription>
              Real-time subscription to user_home_assistant_configs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Status:</span>
                <div className="flex items-center gap-1">
                  <FaCircle
                    className={`text-xs ${
                      configsLoading
                        ? "text-yellow-500"
                        : configsError
                          ? "text-red-500"
                          : "text-green-500"
                    }`}
                  />
                  {configsLoading
                    ? "Loading"
                    : configsError
                      ? "Error"
                      : "Connected"}
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span>Records:</span>
                <span className="font-mono">{configs?.length || 0}</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span>Last Update:</span>
                <span className="text-xs">
                  {lastEventTime ? lastEventTime.toLocaleTimeString() : "Never"}
                </span>
              </div>

              {configsError && (
                <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                  Error: {configsError}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Device Configs</CardTitle>
            <CardDescription>
              Real-time subscription to user_device_configs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Status:</span>
                <div className="flex items-center gap-1">
                  <FaCircle
                    className={`text-xs ${
                      deviceConfigsLoading
                        ? "text-yellow-500"
                        : deviceConfigsError
                          ? "text-red-500"
                          : "text-green-500"
                    }`}
                  />
                  {deviceConfigsLoading
                    ? "Loading"
                    : deviceConfigsError
                      ? "Error"
                      : "Connected"}
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span>Records:</span>
                <span className="font-mono">{deviceConfigs?.length || 0}</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span>Last Update:</span>
                <span className="text-xs">
                  {lastEventTime ? lastEventTime.toLocaleTimeString() : "Never"}
                </span>
              </div>

              {deviceConfigsError && (
                <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                  Error: {deviceConfigsError}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Data Preview */}
      {configs && configs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Configurations</CardTitle>
            <CardDescription>
              Latest Home Assistant configurations (live data)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {configs.slice(0, 5).map((config, index) => (
                <div
                  key={config.id || index}
                  className="text-xs bg-gray-50 dark:bg-gray-800 p-2 rounded font-mono"
                >
                  <div className="font-semibold">
                    {config.name || "Unnamed Config"}
                  </div>
                  <div className="text-gray-600">
                    URL: {config.url || "No URL"} | Enabled:{" "}
                    {config.enabled ? "Yes" : "No"}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
