import React from "react";
import {
  Activity,
  TrendingUp,
  Info,
  Home,
  Zap,
  Thermometer,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type {
  HAConfig,
  HAConnectionStatus,
  HADevice,
  DeviceAssignment,
  ImportedDevice,
} from "@/services/homeAssistantService";

interface OverviewTabProps {
  config: HAConfig | null;
  status: HAConnectionStatus;
  devices: HADevice[];
  assignments: DeviceAssignment[];
  importedDevices: ImportedDevice[];
  getStatusColor: (connected: boolean) => string;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  config,
  status,
  devices,
  assignments,
  importedDevices,
  getStatusColor,
}) => {
  if (!config) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          No Home Assistant integration configured. Please set up your
          connection in the Configuration tab.
        </AlertDescription>
      </Alert>
    );
  }

  const devicesByType = devices.reduce(
    (acc, device) => {
      const type = device.device_class || "other";
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const quickMetrics = [
    {
      label: "Total Devices",
      value: devices.length,
      icon: Home,
      description: "Available devices",
    },
    {
      label: "Imported",
      value: importedDevices.length,
      icon: Zap,
      description: "Devices in database",
    },
    {
      label: "Assigned",
      value: assignments.length,
      icon: Thermometer,
      description: "Devices assigned to farms",
    },
    {
      label: "Online",
      value: devices.filter((d) => d.state !== "unavailable").length,
      icon: Activity,
      description: "Responsive devices",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Quick Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickMetrics.map((metric) => (
          <Card key={metric.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                    <metric.icon className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <p className="font-medium">{metric.label}</p>
                    <p className="text-sensor-value text-control-content dark:text-control-content-dark">
                      {metric.value.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">{metric.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Device Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            <span>Device Distribution</span>
          </CardTitle>
          <CardDescription>
            Breakdown of devices by type and status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Object.entries(devicesByType).map(([type, count]) => (
              <div
                key={type}
                className="flex items-center space-x-4 p-4 border rounded-lg"
              >
                <div className="flex items-center space-x-3 flex-1">
                  <Home className="w-5 h-5 text-gray-600" />
                  <span className="font-medium capitalize">
                    {type.replace("_", " ")}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span className="text-sm text-gray-500">→</span>
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium">Farm System</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {count}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Integration Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="w-5 h-5" />
            <span>Integration Health</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div
                className={`text-sensor-value ${status.connected ? "text-green-600" : "text-red-600"}`}
              >
                {status.connected ? "Online" : "Offline"}
              </div>
              <div className="text-sm text-gray-500">Connection Status</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-sensor-value text-accent-primary">
                {status.device_count || 0}
              </div>
              <div className="text-sm text-gray-500">Discovered Devices</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-sensor-value text-accent-primary">
                {Math.round(
                  (importedDevices.length / Math.max(devices.length, 1)) * 100,
                )}
                %
              </div>
              <div className="text-sm text-gray-500">Import Coverage</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
