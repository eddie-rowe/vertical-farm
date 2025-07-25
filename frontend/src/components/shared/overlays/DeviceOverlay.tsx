"use client";

import {
  Zap,
  ZapOff,
  Lightbulb,
  LightbulbOff,
  Fan,
  Droplets,
  Settings,
} from "lucide-react";
import React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { FarmPageData, Row, Rack, Shelf } from "@/types/farm";

interface DeviceOverlayProps {
  farmData: FarmPageData | null;
  selectedRow?: Row | null;
  selectedRack?: Rack | null;
  selectedShelf?: Shelf | null;
}

interface DeviceIndicatorProps {
  deviceType: "light" | "fan" | "water_fill" | "water_drain";
  state: "on" | "off" | "unknown";
  deviceId: string;
  name?: string;
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right";
}

const getDeviceIcon = (type: string, state: string) => {
  const iconProps = { className: "w-4 h-4" };

  switch (type) {
    case "light":
      return state === "on" ? (
        <Lightbulb {...iconProps} className="w-4 h-4 text-yellow-500" />
      ) : (
        <LightbulbOff {...iconProps} className="w-4 h-4 text-gray-400" />
      );
    case "fan":
      return (
        <Fan
          {...iconProps}
          className={`w-4 h-4 ${state === "on" ? "text-blue-500 animate-spin" : "text-gray-400"}`}
        />
      );
    case "water_fill":
    case "water_drain":
      return (
        <Droplets
          {...iconProps}
          className={`w-4 h-4 ${state === "on" ? "text-blue-500" : "text-gray-400"}`}
        />
      );
    default:
      return state === "on" ? (
        <Zap {...iconProps} className="w-4 h-4 text-green-500" />
      ) : (
        <ZapOff {...iconProps} className="w-4 h-4 text-gray-400" />
      );
  }
};

const DeviceIndicator: React.FC<DeviceIndicatorProps> = ({
  deviceType,
  state,
  deviceId,
  name,
  position,
}) => {
  const positionClasses = {
    "top-left": "top-2 left-2",
    "top-right": "top-2 right-2",
    "bottom-left": "bottom-2 left-2",
    "bottom-right": "bottom-2 right-2",
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "absolute z-10 p-1.5 rounded-md shadow-sm border transition-all duration-200",
              "bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm",
              "border-gray-200 dark:border-gray-600",
              "hover:scale-110 cursor-pointer",
              positionClasses[position],
              state === "on" && "ring-2 ring-green-400/50",
              state === "unknown" && "ring-2 ring-yellow-400/50",
            )}
          >
            {getDeviceIcon(deviceType, state)}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-sm">
            <div className="font-medium">{name || `Device ${deviceId}`}</div>
            <div className="text-xs text-gray-500">
              {deviceType.replace("_", " ")} • {state.toUpperCase()}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

interface ShelfOverlayProps {
  shelf: Shelf;
  devices?: any[];
}

const ShelfOverlay: React.FC<ShelfOverlayProps> = ({ shelf, devices = [] }) => {
  if (devices.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {devices.slice(0, 4).map((device, index) => {
        const positions: DeviceIndicatorProps["position"][] = [
          "top-left",
          "top-right",
          "bottom-left",
          "bottom-right",
        ];

        return (
          <div key={device.id} className="pointer-events-auto">
            <DeviceIndicator
              deviceType={device.type || "unknown"}
              state={device.state || "unknown"}
              deviceId={device.id}
              name={device.name}
              position={positions[index]}
            />
          </div>
        );
      })}

      {devices.length > 4 && (
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 pointer-events-auto">
          <Badge
            variant="secondary"
            className="text-xs bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm"
          >
            +{devices.length - 4} more
          </Badge>
        </div>
      )}
    </div>
  );
};

interface RackOverlayProps {
  rack: Rack;
}

const RackOverlay: React.FC<RackOverlayProps> = ({ rack }) => {
  const shelves = rack.shelves || [];
  const totalDevices = shelves.reduce(
    (sum, shelf) => sum + (shelf.devices?.length || 0),
    0,
  );

  if (totalDevices === 0) return null;

  return (
    <div className="absolute top-2 right-2 z-10 pointer-events-auto">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-6 px-2 text-xs bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-gray-200 dark:border-gray-600"
            >
              <Zap className="w-3 h-3 mr-1" />
              {totalDevices}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-sm">
              <div className="font-medium">{totalDevices} devices in rack</div>
              <div className="text-xs text-gray-500">
                Click to manage devices
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

interface RowOverlayProps {
  row: Row;
}

const RowOverlay: React.FC<RowOverlayProps> = ({ row }) => {
  const racks = row.racks || [];
  const totalDevices = racks.reduce(
    (sum, rack) =>
      sum +
      (rack.shelves?.reduce(
        (shelfSum, shelf) => shelfSum + (shelf.devices?.length || 0),
        0,
      ) || 0),
    0,
  );

  if (totalDevices === 0) return null;

  return (
    <div className="absolute top-4 right-4 z-10 pointer-events-auto">
      <div className="flex items-center gap-2">
        <Badge
          variant="outline"
          className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-green-300 dark:border-green-600 text-green-700 dark:text-green-300"
        >
          <Zap className="w-3 h-3 mr-1" />
          {totalDevices} devices
        </Badge>
        <Button
          variant="outline"
          size="sm"
          className="h-6 px-2 text-xs bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm"
        >
          <Settings className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
};

const DeviceOverlay: React.FC<DeviceOverlayProps> = ({
  farmData,
  selectedRow,
  selectedRack,
  selectedShelf,
}) => {
  if (!farmData?.farm?.rows) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-20">
      {farmData.farm.rows.map((row) => (
        <div key={`device-row-${row.id}`} className="relative">
          <RowOverlay row={row} />

          {row.racks?.map((rack) => (
            <div key={`device-rack-${rack.id}`} className="relative">
              <RackOverlay rack={rack} />

              {rack.shelves?.map((shelf) => (
                <div key={`device-shelf-${shelf.id}`} className="relative">
                  <ShelfOverlay shelf={shelf} devices={shelf.devices || []} />
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default DeviceOverlay;
