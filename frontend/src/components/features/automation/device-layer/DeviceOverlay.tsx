"use client";

import {
  LightBulbIcon,
  WrenchScrewdriverIcon,
  ArrowPathIcon,
  CircleStackIcon,
  PowerIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import React, { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useDevice } from "@/contexts/DeviceContext";
import { cn } from "@/lib/utils";
import {
  DeviceOverlayProps,
  DeviceData,
  DeviceAction,
} from "@/types/device-layer";

interface DeviceStatusIndicatorProps {
  device: DeviceData;
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
}

function DeviceStatusIndicator({
  device,
  size = "md",
  onClick,
}: DeviceStatusIndicatorProps) {
  const getDeviceIcon = () => {
    switch (device.device_type) {
      case "light":
        return (
          <LightBulbIcon
            className={cn(
              "h-4 w-4",
              size === "sm" && "h-3 w-3",
              size === "lg" && "h-5 w-5",
            )}
          />
        );
      case "pump":
        return (
          <CircleStackIcon
            className={cn(
              "h-4 w-4",
              size === "sm" && "h-3 w-3",
              size === "lg" && "h-5 w-5",
            )}
          />
        );
      case "fan":
        return (
          <ArrowPathIcon
            className={cn(
              "h-4 w-4",
              size === "sm" && "h-3 w-3",
              size === "lg" && "h-5 w-5",
            )}
          />
        );
      case "sensor":
        return (
          <WrenchScrewdriverIcon
            className={cn(
              "h-4 w-4",
              size === "sm" && "h-3 w-3",
              size === "lg" && "h-5 w-5",
            )}
          />
        );
      default:
        return (
          <PowerIcon
            className={cn(
              "h-4 w-4",
              size === "sm" && "h-3 w-3",
              size === "lg" && "h-5 w-5",
            )}
          />
        );
    }
  };

  const getStatusColor = () => {
    if (!device.is_online) return "bg-gray-400";

    switch (device.current_state) {
      case "on":
        return device.device_type === "light"
          ? "bg-yellow-400"
          : "bg-green-400";
      case "off":
        return "bg-gray-600";
      case "unavailable":
        return "bg-red-400";
      default:
        return "bg-gray-400";
    }
  };

  const getDeviceLabel = () => {
    if (device.device_name) return device.device_name;
    return (
      device.device_type.charAt(0).toUpperCase() + device.device_type.slice(1)
    );
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative inline-flex items-center justify-center rounded-full transition-all duration-200 cursor-pointer",
        "hover:scale-110 hover:shadow-md",
        size === "sm" && "h-6 w-6",
        size === "md" && "h-8 w-8",
        size === "lg" && "h-10 w-10",
        getStatusColor(),
      )}
      title={`${getDeviceLabel()} - ${device.current_state || "unknown"}`}
    >
      <div className="text-white drop-shadow-sm">{getDeviceIcon()}</div>

      {/* Online/Offline indicator */}
      <div
        className={cn(
          "absolute -top-1 -right-1 rounded-full border-2 border-white",
          size === "sm" && "h-2 w-2",
          size === "md" && "h-3 w-3",
          size === "lg" && "h-4 w-4",
          device.is_online ? "bg-green-500" : "bg-red-500",
        )}
      />
    </div>
  );
}

interface QuickControlsProps {
  device: DeviceData;
  onControl: (action: DeviceAction) => Promise<void>;
}

function QuickControls({ device, onControl }: QuickControlsProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleControl = async (action: DeviceAction) => {
    setLoading(action.type);
    try {
      await onControl(action);
    } finally {
      setLoading(null);
    }
  };

  const canControl = device.is_online && device.current_state !== "unavailable";

  return (
    <div className="flex flex-col gap-2">
      <div className="text-sm font-medium">
        {device.device_name || device.device_type}
      </div>
      <div className="text-xs text-muted-foreground">
        Status:{" "}
        <Badge variant={device.is_online ? "default" : "destructive"}>
          {device.current_state || "unknown"}
        </Badge>
      </div>

      {canControl && (
        <div className="flex gap-1">
          {/* Power controls for lights, pumps, fans */}
          {["light", "pump", "fan"].includes(device.device_type) && (
            <>
              <Button
                size="sm"
                variant={device.current_state === "on" ? "default" : "outline"}
                onClick={() => handleControl({ type: "turn_on" })}
                disabled={loading !== null}
                className="h-6 px-2 text-xs"
              >
                {loading === "turn_on" ? "..." : "On"}
              </Button>
              <Button
                size="sm"
                variant={device.current_state === "off" ? "default" : "outline"}
                onClick={() => handleControl({ type: "turn_off" })}
                disabled={loading !== null}
                className="h-6 px-2 text-xs"
              >
                {loading === "turn_off" ? "..." : "Off"}
              </Button>
            </>
          )}

          {/* Brightness control for lights */}
          {device.device_type === "light" &&
            device.capabilities?.brightness && (
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  handleControl({ type: "set_brightness", brightness: 128 })
                }
                disabled={loading !== null}
                className="h-6 px-2 text-xs"
              >
                50%
              </Button>
            )}
        </div>
      )}

      {!canControl && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <ExclamationTriangleIcon className="h-3 w-3" />
          Device unavailable
        </div>
      )}

      {/* Sensor readings */}
      {device.device_type === "sensor" && device.attributes && (
        <div className="text-xs">
          {device.attributes.temperature && (
            <div>Temp: {device.attributes.temperature}°C</div>
          )}
          {device.attributes.humidity && (
            <div>Humidity: {device.attributes.humidity}%</div>
          )}
        </div>
      )}
    </div>
  );
}

export default function DeviceOverlay({
  locationId,
  devices,
  onDeviceClick,
  onQuickControl,
  className,
}: DeviceOverlayProps) {
  const { enabled, loadLocationDevices, getDevicesByLocation } = useDevice();
  const [isVisible, setIsVisible] = useState(false);

  // Load devices for this location when overlay becomes enabled
  useEffect(() => {
    if (enabled && devices.length === 0) {
      loadLocationDevices(locationId);
    }
  }, [enabled, locationId, devices.length, loadLocationDevices]);

  // Fade in animation when layer is enabled
  useEffect(() => {
    if (enabled) {
      const timer = setTimeout(() => setIsVisible(true), 100);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [enabled]);

  if (!enabled || devices.length === 0) {
    return null;
  }

  return (
    <TooltipProvider>
      <div
        className={cn(
          "absolute inset-0 pointer-events-none transition-opacity duration-300",
          isVisible ? "opacity-100" : "opacity-0",
          className,
        )}
      >
        {/* Device indicators positioned around the shelf/rack */}
        <div className="relative h-full w-full">
          {devices.map((device, index) => (
            <div
              key={device.home_assistant_entity_id}
              className={cn(
                "absolute pointer-events-auto",
                // Position devices around the perimeter
                index === 0 && "top-2 left-2",
                index === 1 && "top-2 right-2",
                index === 2 && "bottom-2 left-2",
                index === 3 && "bottom-2 right-2",
                index >= 4 &&
                  "top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2",
              )}
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <DeviceStatusIndicator
                      device={device}
                      onClick={() => onDeviceClick(device)}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" align="start" className="p-3">
                  <QuickControls
                    device={device}
                    onControl={(action) => onQuickControl(device, action)}
                  />
                </TooltipContent>
              </Tooltip>
            </div>
          ))}

          {/* Location summary indicator in center for multiple devices */}
          {devices.length > 1 && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
              <Badge
                variant="secondary"
                className="text-xs px-2 py-1 bg-black/20 backdrop-blur-sm text-white border-white/20"
              >
                {devices.length} devices
              </Badge>
            </div>
          )}

          {/* Alert indicator for any device issues */}
          {devices.some(
            (d) => !d.is_online || d.current_state === "unavailable",
          ) && (
            <div className="absolute top-1 right-1 pointer-events-auto">
              <div
                className="h-3 w-3 bg-red-500 rounded-full animate-pulse"
                title="Some devices offline"
              />
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
