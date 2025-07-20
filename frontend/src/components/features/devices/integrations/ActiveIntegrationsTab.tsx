"use client";

import Link from "next/link";
import React from "react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { FarmControlButton } from "@/components/ui/farm-control-button";
import { Separator } from "@/components/ui/separator";
import { FaHome, FaCog, FaWifi, FaPlus } from "@/lib/icons";

interface ActiveIntegration {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  status: "connected" | "disconnected" | "error";
  deviceCount: number;
  lastSync: string;
  manageUrl: string;
}

// Mock data - in a real app, this would come from a service or API
const mockActiveIntegrations: ActiveIntegration[] = [
  {
    id: "home-assistant",
    name: "Home Assistant",
    description: "Smart home automation platform",
    icon: <FaHome className="text-2xl text-orange-600" />,
    status: "connected",
    deviceCount: 24,
    lastSync: "2 minutes ago",
    manageUrl: "/integrations/home-assistant",
  },
  {
    id: "arduino-cloud",
    name: "Arduino Cloud",
    description: "Custom sensor platform",
    icon: <FaWifi className="text-2xl text-blue-600" />,
    status: "connected",
    deviceCount: 12,
    lastSync: "5 minutes ago",
    manageUrl: "/integrations/arduino-cloud",
  },
  {
    id: "smartthings",
    name: "SmartThings",
    description: "Samsung IoT platform",
    icon: <FaWifi className="text-2xl text-purple-600" />,
    status: "connected",
    deviceCount: 11,
    lastSync: "1 minute ago",
    manageUrl: "/integrations/smartthings",
  },
];

const getStatusBadge = (status: ActiveIntegration["status"]) => {
  switch (status) {
    case "connected":
      return (
        <Badge className="bg-sensor-bg text-sensor-value border-sensor-value">
          Connected
        </Badge>
      );
    case "error":
      return (
        <Badge className="bg-control-secondary/10 text-control-secondary border-control-secondary">
          Error
        </Badge>
      );
    default:
      return (
        <Badge className="bg-farm-muted text-control-tertiary border-control-tertiary">
          Disconnected
        </Badge>
      );
  }
};

const getStatusIndicator = (status: ActiveIntegration["status"]) => {
  const color =
    status === "connected"
      ? "bg-green-500"
      : status === "error"
        ? "bg-red-500"
        : "bg-gray-400";

  return <div className={`w-2 h-2 ${color} rounded-full`}></div>;
};

export function ActiveIntegrationsTab() {
  return (
    <Card className="card-shadow">
      <CardHeader>
        <CardTitle className="text-farm-title">Active Integrations</CardTitle>
        <CardDescription className="text-control-label">
          Manage your connected device integration sources
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockActiveIntegrations.map((integration) => (
            <Card
              key={integration.id}
              className="bg-farm-white card-shadow hover:card-shadow-lg transition-shadow state-growing"
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {integration.icon}
                    <div>
                      <CardTitle className="text-control-label text-lg">
                        {integration.name}
                      </CardTitle>
                      <CardDescription className="text-control-secondary">
                        {integration.description}
                      </CardDescription>
                    </div>
                  </div>
                  {getStatusBadge(integration.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-control-label">Devices</span>
                    <span className="text-sensor-value font-medium">
                      {integration.deviceCount}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-control-label">Last Sync</span>
                    <span className="text-control-label opacity-70">
                      {integration.lastSync}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-control-label">Status</span>
                    <div className="flex items-center gap-2">
                      {getStatusIndicator(integration.status)}
                      <span className="text-control-label opacity-70">
                        {integration.status === "connected"
                          ? "Online"
                          : "Offline"}
                      </span>
                    </div>
                  </div>
                  <Separator />
                  <Link href={integration.manageUrl} className="block">
                    <FarmControlButton
                      size="sm"
                      variant="default"
                      className="w-full"
                    >
                      <FaCog className="h-4 w-4 mr-2" />
                      Manage Integration
                    </FarmControlButton>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions for Integration Management */}
        <div className="mt-6 pt-6 border-t border-farm-border">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-control-label font-medium">
                Integration Actions
              </h3>
              <p className="text-control-secondary text-sm">
                Manage all integrations or add new ones
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/integrations">
                <FarmControlButton size="sm" variant="default">
                  <FaCog className="h-4 w-4 mr-2" />
                  Manage All Integrations
                </FarmControlButton>
              </Link>
              <Link href="/integrations">
                <FarmControlButton size="sm" className="state-active">
                  <FaPlus className="h-4 w-4 mr-2" />
                  Add Integration
                </FarmControlButton>
              </Link>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
