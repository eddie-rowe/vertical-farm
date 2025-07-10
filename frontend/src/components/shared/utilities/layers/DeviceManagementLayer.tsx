"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Home, Lightbulb, Fan, Droplets, PlugZap } from "lucide-react";
import type { Farm } from "@/types/farm";

interface DeviceManagementLayerProps {
  farm?: Farm;
}

export default function DeviceManagementLayer({ farm }: DeviceManagementLayerProps) {
  // Mock device data for demonstration
  const mockDevices = [
    {
      id: 1,
      name: "LED Strip - Row 1",
      type: "light",
      status: "connected",
      location: "Row 1, Rack A",
      state: "On"
    },
    {
      id: 2,
      name: "Water Pump - East",
      type: "pump",
      status: "connected", 
      location: "Row 2, Rack B",
      state: "Off"
    },
    {
      id: 3,
      name: "Exhaust Fan",
      type: "fan",
      status: "disconnected",
      location: "Row 1, Rack C",
      state: "Off"
    }
  ];

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'light': return <Lightbulb className="h-4 w-4" />;
      case 'pump': return <Droplets className="h-4 w-4" />;
      case 'fan': return <Fan className="h-4 w-4" />;
      default: return <PlugZap className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'disconnected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Device Management
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            {farm ? `Managing devices for ${farm.name}` : 'Connect and control your farm devices'}
          </p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Home className="h-4 w-4 mr-2" />
          Connect Home Assistant
        </Button>
      </div>

      {/* Integration Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Home className="h-5 w-5" />
            <span>Home Assistant Integration</span>
          </CardTitle>
          <CardDescription>
            Connect your Home Assistant instance to control farm devices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center space-x-3">
              <div className="h-3 w-3 bg-yellow-500 rounded-full animate-pulse"></div>
              <span className="text-yellow-800 dark:text-yellow-300 font-medium">
                Integration Setup Required
              </span>
            </div>
            <Button variant="outline" size="sm">
              Configure
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Device List */}
      <Card>
        <CardHeader>
          <CardTitle>Connected Devices</CardTitle>
          <CardDescription>
            Devices discovered and available for assignment to farm locations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockDevices.map((device) => (
              <div key={device.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    {getDeviceIcon(device.type)}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">
                      {device.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {device.location}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Badge className={getStatusColor(device.status)}>
                    {device.status}
                  </Badge>
                  <Badge variant="outline">
                    {device.state}
                  </Badge>
                  <Button variant="outline" size="sm">
                    Assign
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Device Assignment */}
      <Card>
        <CardHeader>
          <CardTitle>Device Assignments</CardTitle>
          <CardDescription>
            Assign devices to specific rows, racks, and shelves in your farm
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <PlugZap className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No Device Assignments</h3>
            <p className="mb-4">Start by connecting devices and assigning them to farm locations.</p>
            <Button variant="outline">
              Create Assignment
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 