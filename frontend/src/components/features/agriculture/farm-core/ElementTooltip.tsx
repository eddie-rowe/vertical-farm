"use client";

import {
  Grid3X3,
  Archive,
  Layers,
  Zap,
  Thermometer,
  Droplets,
  Wind,
  Lightbulb,
  Activity,
} from "lucide-react";
import { useState, useEffect } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Row, Rack, Shelf, SensorDevice } from "@/types/farm-layout";

interface ElementTooltipProps {
  element: {
    type: "farm" | "row" | "rack" | "shelf" | "device";
    data: Row | Rack | Shelf | SensorDevice | any;
  } | null;
  position: { x: number; y: number };
  visible: boolean;
}

export default function ElementTooltip({
  element,
  position,
  visible,
}: ElementTooltipProps) {
  const [adjustedPosition, setAdjustedPosition] = useState(position);

  useEffect(() => {
    if (!visible || !element) return;

    // Adjust tooltip position to stay within viewport
    const tooltip = document.getElementById("element-tooltip");
    if (tooltip) {
      const rect = tooltip.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let newX = position.x;
      let newY = position.y;

      // Adjust horizontal position
      if (position.x + rect.width > viewportWidth - 20) {
        newX = position.x - rect.width - 10;
      }

      // Adjust vertical position
      if (position.y + rect.height > viewportHeight - 20) {
        newY = position.y - rect.height - 10;
      }

      setAdjustedPosition({ x: newX, y: newY });
    }
  }, [position, visible, element]);

  if (!visible || !element) return null;

  const getElementIcon = (type: string) => {
    switch (type) {
      case "row":
        return <Grid3X3 className="h-4 w-4" />;
      case "rack":
        return <Archive className="h-4 w-4" />;
      case "shelf":
        return <Layers className="h-4 w-4" />;
      case "device":
        return <Zap className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getDeviceIcon = (sensorType: string) => {
    switch (sensorType) {
      case "temperature":
        return <Thermometer className="h-4 w-4 text-red-500" />;
      case "humidity":
        return <Droplets className="h-4 w-4 text-blue-500" />;
      case "light_intensity":
        return <Lightbulb className="h-4 w-4 text-yellow-500" />;
      case "air_flow":
        return <Wind className="h-4 w-4 text-green-500" />;
      case "water_level":
        return <Droplets className="h-4 w-4 text-blue-600" />;
      case "co2":
        return <Activity className="h-4 w-4 text-purple-500" />;
      case "ph":
        return <Activity className="h-4 w-4 text-orange-500" />;
      default:
        return <Zap className="h-4 w-4" />;
    }
  };

  const renderTooltipContent = () => {
    const { type, data } = element;

    switch (type) {
      case "row":
        const rowData = data as Row;
        return (
          <div>
            <div className="flex items-center space-x-2 mb-2">
              {getElementIcon(type)}
              <span className="font-semibold">Row</span>
              <Badge variant="outline">{rowData.id}</Badge>
            </div>
            <div className="space-y-1 text-sm">
              <div>Name: {rowData.name}</div>

              <div>Orientation: {rowData.orientation}</div>
              <div>Racks: {rowData.racks?.length || 0}</div>
              <div>
                Total Shelves:{" "}
                {rowData.racks?.reduce(
                  (acc, rack) => acc + (rack.shelves?.length || 0),
                  0,
                ) || 0}
              </div>
            </div>
          </div>
        );

      case "rack":
        const rackData = data as Rack;
        return (
          <div>
            <div className="flex items-center space-x-2 mb-2">
              {getElementIcon(type)}
              <span className="font-semibold">Rack</span>
              <Badge variant="outline">{rackData.id}</Badge>
            </div>
            <div className="space-y-1 text-sm">
              <div>Name: {rackData.name}</div>
              <div>Shelves: {rackData.shelves?.length || 0}</div>
            </div>
          </div>
        );

      case "shelf":
        const shelfData = data as Shelf;
        return (
          <div>
            <div className="flex items-center space-x-2 mb-2">
              {getElementIcon(type)}
              <span className="font-semibold">Shelf</span>
              <Badge variant="outline">{shelfData.id}</Badge>
            </div>
            <div className="space-y-1 text-sm">
              <div>Name: {shelfData.name}</div>
              <div>Devices: {shelfData.devices?.length || 0}</div>
              {shelfData.devices && shelfData.devices.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <div className="font-medium mb-1">Devices:</div>
                  {shelfData.devices.map((device, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-1 text-xs"
                    >
                      {getDeviceIcon(device.sensor_type)}
                      <span>{device.name || device.sensor_type}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case "device":
        const deviceData = data as SensorDevice;
        return (
          <div>
            <div className="flex items-center space-x-2 mb-2">
              {getDeviceIcon(deviceData.sensor_type)}
              <span className="font-semibold">Device</span>
              <Badge variant="outline">{deviceData.sensor_type}</Badge>
            </div>
            <div className="space-y-1 text-sm">
              <div>Name: {deviceData.name || "Unnamed"}</div>
              <div>ID: {deviceData.id}</div>
              <div>Type: {deviceData.sensor_type}</div>
              <div>Model: {deviceData.model_number || "N/A"}</div>
              <div>Unit: {deviceData.measurement_unit || "N/A"}</div>
              {deviceData.data_range_min !== undefined &&
                deviceData.data_range_max !== undefined && (
                  <div>
                    Range: {deviceData.data_range_min} -{" "}
                    {deviceData.data_range_max}
                  </div>
                )}
              {deviceData.accuracy && (
                <div>Accuracy: {deviceData.accuracy}</div>
              )}
            </div>
          </div>
        );

      default:
        return (
          <div>
            <div className="flex items-center space-x-2 mb-2">
              {getElementIcon(type)}
              <span className="font-semibold capitalize">{type}</span>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              No additional information available
            </div>
          </div>
        );
    }
  };

  return (
    <div
      id="element-tooltip"
      className="fixed z-50 pointer-events-none"
      style={{
        left: `${adjustedPosition.x + 10}px`,
        top: `${adjustedPosition.y + 10}px`,
      }}
    >
      <Card className="shadow-lg border bg-white dark:bg-gray-900 max-w-xs">
        <CardContent className="p-3">{renderTooltipContent()}</CardContent>
      </Card>
    </div>
  );
}
