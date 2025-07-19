"use client";

import React, { useState, useEffect } from "react";
import {
  FaHome,
  FaPlug,
  FaCheck,
  FaExclamationTriangle,
  FaCog,
  FaCreditCard,
  FaTable,
  FaCalendarAlt,
} from "@/lib/icons";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FarmControlButton } from "@/components/ui/farm-control-button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/ui/PageHeader";
import Link from "next/link";
import {
  homeAssistantService,
  HAConnectionStatus,
} from "@/services/homeAssistantService";
import {
  squareService,
  SquareConnectionStatus,
} from "@/services/squareService";
import { LoadingCard } from "@/components/ui/loading";
import { SkeletonIntegrationsPage } from "@/components/ui/skeleton-extended";

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  status: "connected" | "disconnected" | "error";
  deviceCount?: number;
  configuredAt?: string;
  setupUrl: string;
}

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    try {
      setLoading(true);

      // Check Home Assistant status using the proper backend API
      let haStatus: HAConnectionStatus = { connected: false };
      try {
        haStatus = await homeAssistantService.getStatus();
        console.log("Home Assistant status:", haStatus);
      } catch (error) {
        console.log("Home Assistant not configured or not available:", error);
        // Don't let HA status errors break the integrations page
        haStatus = { connected: false };
      }

      // Check Square status safely
      let squareStatus: SquareConnectionStatus = {
        connected: false,
        environment: "sandbox",
      };
      let squareConfiguredAt: string | undefined;
      try {
        // First check if user has any active Square configurations
        const activeConfig = await squareService.getActiveConfig();
        if (activeConfig) {
          squareStatus = await squareService.getStatus(activeConfig.id!);
          squareConfiguredAt =
            activeConfig.updated_at || activeConfig.created_at;
          console.log("Square status:", squareStatus);
        }
      } catch (error) {
        console.log("Square not configured or not available:", error);
        // Don't let Square status errors break the integrations page
        squareStatus = { connected: false, environment: "sandbox" };
      }

      const integrationsList: Integration[] = [
        {
          id: "home-assistant",
          name: "Home Assistant",
          description:
            "Connect to Home Assistant for device control and automation",
          icon: <FaHome className="text-farm-accent gradient-icon" />,
          status: haStatus.connected ? "connected" : "disconnected",
          deviceCount: haStatus.device_count,
          configuredAt: haStatus.last_updated,
          setupUrl: "/integrations/home-assistant",
        },
        // Future integrations can be added here
        {
          id: "mqtt",
          name: "MQTT Broker",
          description: "Direct IoT device communication via MQTT protocol",
          icon: <FaPlug className="text-control-secondary gradient-icon" />,
          status: "disconnected",
          setupUrl: "/integrations/mqtt",
        },
        {
          id: "modbus",
          name: "Modbus TCP/RTU",
          description: "Industrial device communication via Modbus protocol",
          icon: <FaCog className="text-control-label gradient-icon" />,
          status: "disconnected",
          setupUrl: "/integrations/modbus",
        },
        // Square integration with dynamic status
        {
          id: "square",
          name: "Square",
          description:
            "Connect Square for payment processing and sales tracking",
          icon: <FaCreditCard className="text-sensor-value gradient-icon" />,
          status: squareStatus.connected ? "connected" : "disconnected",
          configuredAt: squareConfiguredAt,
          setupUrl: "/integrations/square",
        },
        {
          id: "google-sheets",
          name: "Google Sheets",
          description: "Sync farm data and reports with Google Sheets",
          icon: <FaTable className="text-sensor-value gradient-icon" />,
          status: "disconnected",
          setupUrl: "/integrations/google-sheets",
        },
        {
          id: "google-calendar",
          name: "Google Calendar",
          description: "Schedule farm tasks and maintenance in Google Calendar",
          icon: <FaCalendarAlt className="text-farm-accent gradient-icon" />,
          status: "disconnected",
          setupUrl: "/integrations/google-calendar",
        },
      ];

      setIntegrations(integrationsList);
    } catch (error) {
      console.error("Error loading integrations:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: Integration["status"]) => {
    switch (status) {
      case "connected":
        return <FaCheck className="text-sensor-value gradient-icon" />;
      case "error":
        return (
          <FaExclamationTriangle className="text-control-secondary gradient-icon" />
        );
      default:
        return <FaPlug className="text-control-tertiary" />;
    }
  };

  const getStatusType = (
    status: Integration["status"],
  ): "online" | "offline" | "warning" | "error" => {
    switch (status) {
      case "connected":
        return "online";
      case "error":
        return "error";
      default:
        return "offline";
    }
  };

  if (loading) {
    return <SkeletonIntegrationsPage />;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader
        title="Integrations"
        description="Connect your vertical farm to external systems and devices"
        size="md"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {integrations.map((integration) => (
          <Card
            key={integration.id}
            className={`bg-farm-white card-shadow hover:card-shadow-lg transition-shadow ${
              integration.status === "connected"
                ? "state-growing"
                : integration.status === "error"
                  ? "state-maintenance"
                  : "state-offline"
            }`}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{integration.icon}</div>
                  <div>
                    <CardTitle className="text-control-label text-lg">
                      {integration.name}
                    </CardTitle>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(integration.status)}
                  <StatusBadge status={getStatusType(integration.status)}>
                    {integration.status === "connected"
                      ? "Connected"
                      : integration.status === "error"
                        ? "Error"
                        : "Not Connected"}
                  </StatusBadge>
                </div>
              </div>
              <CardDescription className="mt-2 text-control-secondary">
                {integration.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {integration.status === "connected" && (
                  <div className="text-sm text-control-secondary">
                    {integration.deviceCount && (
                      <p className="text-sensor-value font-medium">
                        {integration.deviceCount} devices connected
                      </p>
                    )}
                    {integration.configuredAt && (
                      <p>
                        Last updated:{" "}
                        {new Date(
                          integration.configuredAt,
                        ).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )}

                <div className="pt-2">
                  <Link href={integration.setupUrl} className="block">
                    <FarmControlButton
                      variant={
                        integration.status === "connected"
                          ? "growing"
                          : "primary"
                      }
                      className="w-full"
                    >
                      {integration.status === "connected" ? "Manage" : "Setup"}
                    </FarmControlButton>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 p-6 bg-farm-muted rounded-lg state-active">
        <div className="flex items-start space-x-3">
          <FaPlug className="text-farm-accent gradient-icon mt-1" />
          <div>
            <h3 className="font-semibold text-farm-title">
              More Integrations Coming Soon
            </h3>
            <p className="text-control-secondary mt-1">
              We&apos;re working on additional integrations including Zigbee,
              Z-Wave, and direct sensor protocols. Have a specific integration
              request? Let us know!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
