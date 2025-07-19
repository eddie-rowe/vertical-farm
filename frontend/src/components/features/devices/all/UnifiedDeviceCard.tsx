"use client";

import { FC } from "react";
import {
  FaLightbulb,
  FaToggleOn,
  FaThermometerHalf,
  FaPlug,
  FaWifi,
  FaHome,
  FaLeaf,
  FaWater,
  FaCheck,
  FaExclamationTriangle,
  FaCheckCircle,
  FaCircle,
  FaClock,
  FaDownload,
  FaCog,
  FaSun,
  FaMoon,
  FaFan,
  FaTint,
} from "react-icons/fa";
import { MapPin, Clock, Zap, Activity, Radio } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { FarmControlButton } from "@/components/ui/farm-control-button";
import { UnifiedDevice } from "@/services/domain/devices/AllDevicesService";

interface UnifiedDeviceCardProps {
  device: UnifiedDevice;
  selectedDevices: Set<string>;
  bulkSelectMode: boolean;
  onToggleSelection: (deviceId: string) => void;
  onDeviceControl: (
    device: UnifiedDevice,
    action: "turn_on" | "turn_off" | "toggle",
  ) => void;
  onImportDevice: (device: UnifiedDevice) => void;
  onAssignDevice: (device: UnifiedDevice) => void;
}

export const UnifiedDeviceCard: FC<UnifiedDeviceCardProps> = ({
  device,
  selectedDevices,
  bulkSelectMode,
  onToggleSelection,
  onDeviceControl,
  onImportDevice,
  onAssignDevice,
}) => {
  const isActive = device.state === "on";
  const lastActivity = device.last_updated
    ? new Date(device.last_updated)
    : null;
  const isSelected = selectedDevices.has(device.entity_id);

  const getDeviceIcon = (deviceType: string, domain?: string) => {
    // Check domain first, then device type
    const type = domain || deviceType;
    switch (type) {
      case "light":
        return <FaLightbulb className="h-4 w-4 text-yellow-500" />;
      case "switch":
        return <FaToggleOn className="h-4 w-4 text-blue-500" />;
      case "sensor":
        return <FaThermometerHalf className="h-4 w-4 text-green-500" />;
      case "fan":
        return <FaFan className="h-4 w-4 text-cyan-500" />;
      case "pump":
      case "valve":
        return <FaTint className="h-4 w-4 text-blue-600" />;
      case "climate":
        return <FaThermometerHalf className="h-4 w-4 text-orange-500" />;
      default:
        return <FaPlug className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    if (!device.is_online) return "text-red-500 bg-red-50 border-red-200";
    if (device.state === "on")
      return "text-green-500 bg-green-50 border-green-200";
    if (device.state === "off")
      return "text-gray-500 bg-gray-50 border-gray-200";
    if (device.state === "unavailable")
      return "text-red-500 bg-red-50 border-red-200";
    return "text-yellow-500 bg-yellow-50 border-yellow-200";
  };

  const getStatusIcon = () => {
    if (!device.is_online) return <FaExclamationTriangle className="h-3 w-3" />;
    if (device.state === "on") return <FaCheckCircle className="h-3 w-3" />;
    if (device.state === "off") return <FaCircle className="h-3 w-3" />;
    if (device.state === "unavailable")
      return <FaExclamationTriangle className="h-3 w-3" />;
    return <FaClock className="h-3 w-3" />;
  };

  const getIntegrationIcon = (integrationType: string) => {
    switch (integrationType) {
      case "home_assistant":
        return <FaHome className="h-3 w-3" />;
      case "smartthings":
        return <Radio className="h-3 w-3" />;
      case "arduino":
        return <Activity className="h-3 w-3" />;
      case "aws_iot":
        return <FaWifi className="h-3 w-3" />;
      case "raspberry_pi":
        return <Zap className="h-3 w-3" />;
      default:
        return <FaPlug className="h-3 w-3" />;
    }
  };

  const getIntegrationColor = (integrationType: string) => {
    switch (integrationType) {
      case "home_assistant":
        return "text-blue-600 bg-blue-50 border-blue-200";
      case "smartthings":
        return "text-purple-600 bg-purple-50 border-purple-200";
      case "arduino":
        return "text-green-600 bg-green-50 border-green-200";
      case "aws_iot":
        return "text-orange-600 bg-orange-50 border-orange-200";
      case "raspberry_pi":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const formatLastSeen = (timestamp?: string) => {
    if (!timestamp) return "Never";
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60),
    );

    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <Card
      className={`hover:shadow-lg transition-all duration-200 hover:scale-[1.02] ${isSelected ? "ring-2 ring-green-500 bg-green-50/50" : ""}`}
    >
      <CardContent className="p-4">
        {/* Selection checkbox and header */}
        <div className="flex items-start justify-between mb-4">
          {bulkSelectMode && (
            <div className="flex-shrink-0 mr-3 mt-1">
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => onToggleSelection(device.entity_id)}
                className="h-5 w-5"
              />
            </div>
          )}
          <div className="flex items-start justify-between flex-1">
            <div className="flex items-start gap-3 flex-1">
              <div className="flex-shrink-0 mt-1">
                {getDeviceIcon(
                  device.device_type || device.domain,
                  device.domain,
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm leading-tight truncate">
                  {device.friendly_name ||
                    device.device_name ||
                    device.entity_id}
                </h3>
                <p className="text-xs text-gray-500 truncate mt-1">
                  {device.entity_id}
                </p>
                {device.is_assigned && device.assignment_location && (
                  <div className="flex items-center gap-1 mt-1">
                    <MapPin className="h-3 w-3 text-green-600" />
                    <span className="text-xs text-green-600 truncate">
                      {device.assignment_location}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Status indicator */}
            <div
              className={`flex items-center gap-1 px-2 py-1 rounded-full border text-xs font-medium ${getStatusColor()}`}
            >
              {getStatusIcon()}
              <span className="capitalize">{device.state}</span>
            </div>
          </div>
        </div>

        {/* Device info row */}
        <div className="flex items-center justify-between mb-3 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {device.domain || device.device_type}
            </Badge>
            <div
              className={`flex items-center gap-1 px-2 py-1 rounded-full border text-xs ${getIntegrationColor(device.integration_type)}`}
            >
              {getIntegrationIcon(device.integration_type)}
              <span>{device.integration_name}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{formatLastSeen(device.last_updated)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-3">
          {/* Primary controls */}
          <div className="flex gap-2">
            {device.domain === "light" && (
              <FarmControlButton
                size="default"
                variant={isActive ? "default" : "primary"}
                className="flex-1"
                onClick={() =>
                  onDeviceControl(device, isActive ? "turn_off" : "turn_on")
                }
              >
                {isActive ? (
                  <FaSun className="h-4 w-4 mr-2" />
                ) : (
                  <FaMoon className="h-4 w-4 mr-2" />
                )}
                {isActive ? "Turn Off" : "Turn On"}
              </FarmControlButton>
            )}

            {device.domain === "switch" && (
              <div className="flex items-center justify-between w-full">
                <span className="text-sm font-medium">
                  {isActive ? "On" : "Off"}
                </span>
                <Switch
                  checked={isActive}
                  onCheckedChange={(checked) =>
                    onDeviceControl(device, checked ? "turn_on" : "turn_off")
                  }
                  className="scale-125"
                />
              </div>
            )}

            {device.domain !== "light" &&
              device.domain !== "switch" &&
              device.domain !== "sensor" && (
                <FarmControlButton
                  size="default"
                  variant="default"
                  className="flex-1"
                  onClick={() => onDeviceControl(device, "toggle")}
                >
                  <FaToggleOn className="h-4 w-4 mr-2" />
                  Toggle
                </FarmControlButton>
              )}

            {device.domain === "sensor" && (
              <div className="flex items-center justify-center w-full p-2 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium">
                  {device.state} {device.unit_of_measurement || ""}
                </span>
              </div>
            )}
          </div>

          {/* Secondary controls */}
          <div className="flex gap-2">
            {!device.is_assigned ? (
              <FarmControlButton
                size="default"
                variant="default"
                className="flex-1"
                onClick={() => onImportDevice(device)}
              >
                <FaDownload className="h-4 w-4 mr-2" />
                Import
              </FarmControlButton>
            ) : (
              <FarmControlButton
                size="default"
                variant="default"
                className="flex-1"
                onClick={() => onAssignDevice(device)}
              >
                <MapPin className="h-4 w-4 mr-2" />
                {device.is_assigned ? "Reassign" : "Assign"}
              </FarmControlButton>
            )}

            <FarmControlButton
              size="default"
              variant="default"
              className="px-3"
              onClick={() => {
                // Add device details modal or expand functionality
              }}
            >
              <FaCog className="h-4 w-4" />
            </FarmControlButton>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
