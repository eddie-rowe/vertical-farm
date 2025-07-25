"use client";

import { Settings, AlertTriangle } from "lucide-react";
import React, { useState, useMemo, useCallback } from "react";

import { EmptyStateWithIntegrations } from "@/components/features/automation";
import { AllDevicesTab } from "@/components/features/devices/all/AllDevicesTab";
import { ActiveIntegrationsTab } from "@/components/features/devices/integrations/ActiveIntegrationsTab";
import { usePageData } from "@/components/shared/hooks/usePageData";
import { MetricsGrid } from "@/components/shared/metrics";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { FarmControlButton } from "@/components/ui/farm-control-button";
import {
  FarmSearchAndFilter,
  type FilterDefinition,
} from "@/components/ui/farm-search-and-filter";
import { PageHeader } from "@/components/ui/PageHeader";
import { Separator } from "@/components/ui/separator";
import { SkeletonDevicePage } from "@/components/ui/skeleton-extended";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFarmSearch, useFarmFilters } from "@/hooks";
import {
  FaHome,
  FaCog,
  FaWifi,
  FaLightbulb,
  FaFan,
  FaTint,
  FaThermometerHalf,
  FaPlus,
  FaCheckCircle,
  Layers,
  FaBuilding,
} from "@/lib/icons";
import { DEVICE_INTEGRATIONS } from "@/lib/integrations/constants";

// ✅ NEW: Import standardized search/filter components and hooks

const tabs = [
  {
    id: "overview",
    label: "Overview",
    icon: <Layers className="text-sensor-value gradient-icon" />,
    description: "Device status and health dashboard",
  },
  {
    id: "all-devices",
    label: "All Devices",
    icon: <FaCog className="text-control-label gradient-icon" />,
    description: "Unified device management and control",
  },
  {
    id: "integrations",
    label: "Integrations",
    icon: <FaWifi className="text-control-secondary gradient-icon" />,
    description: "Manage connection sources and health",
  },
  {
    id: "settings",
    label: "Settings",
    icon: <FaBuilding className="text-control-secondary gradient-icon" />,
    description: "Global device management configuration",
  },
];

// Mock data interface to simulate device management data
interface DeviceData {
  totalDevices: number;
  onlineDevices: number;
  integrationCount: number;
  hasData: boolean;
}

// Mock integration data for filtering
interface IntegrationData {
  id: string;
  name: string;
  deviceCount: number;
  status: "connected" | "disconnected";
  lastSync: string;
}

const mockIntegrations: IntegrationData[] = [
  {
    id: "home-assistant",
    name: "Home Assistant",
    deviceCount: 24,
    status: "connected",
    lastSync: "2 minutes ago",
  },
  {
    id: "arduino-cloud",
    name: "Arduino Cloud",
    deviceCount: 12,
    status: "connected",
    lastSync: "5 minutes ago",
  },
  {
    id: "smartthings",
    name: "SmartThings",
    deviceCount: 11,
    status: "connected",
    lastSync: "1 minute ago",
  },
];

const DeviceManagementPage = () => {
  const [activeTab, setActiveTab] = useState("overview");

  // ✅ NEW: Replace manual search state with standardized hooks
  const {
    searchTerm,
    setSearchTerm,
    clearSearch,
    filterItems: searchFilterItems,
    hasSearch,
  } = useFarmSearch<IntegrationData>({
    searchFields: ["name"],
    caseSensitive: false,
  });

  const {
    filters,
    setFilter,
    removeFilter,
    clearAllFilters,
    getActiveFilterChips,
    filterItems: filterFilterItems,
    hasActiveFilters,
  } = useFarmFilters<IntegrationData>();

  // ✅ NEW: Filter definitions for FarmSearchAndFilter
  const filterDefinitions: FilterDefinition[] = useMemo(
    () => [
      {
        id: "integration",
        label: "Integration",
        placeholder: "Filter by integration",
        options: [
          { value: "all", label: "All Integrations" },
          { value: "home-assistant", label: "Home Assistant" },
          { value: "smartthings", label: "SmartThings" },
          { value: "arduino-cloud", label: "Arduino Cloud" },
        ],
        defaultValue: "all",
      },
      {
        id: "deviceType",
        label: "Device Type",
        placeholder: "Filter by device type",
        options: [
          { value: "all", label: "All Device Types" },
          { value: "lights", label: "Lights" },
          { value: "sensors", label: "Sensors" },
          { value: "pumps", label: "Pumps & Valves" },
          { value: "fans", label: "Fans & Climate" },
        ],
        defaultValue: "all",
      },
    ],
    [],
  );

  // ✅ NEW: Handle filter changes
  const handleFilterChange = useCallback(
    (filterId: string, value: string) => {
      if (value === "all") {
        removeFilter(filterId);
      } else {
        setFilter(filterId, value);
      }
    },
    [setFilter, removeFilter],
  );

  const handleRemoveFilter = useCallback(
    (filterId: string) => {
      removeFilter(filterId);
    },
    [removeFilter],
  );

  // ✅ NEW: Apply combined filtering (for integrations list)
  const filteredIntegrations = useMemo(() => {
    let result = mockIntegrations;

    // Apply search filtering
    result = searchFilterItems(result);

    // Apply standard filters
    result = filterFilterItems(result);

    return result;
  }, [searchFilterItems, filterFilterItems]);

  // Use our standardized data loading hook
  const { data: deviceData, isLoading } = usePageData<DeviceData>({
    storageKey: "device-integrations-connected",
    mockData: {
      totalDevices: 47,
      onlineDevices: 43,
      integrationCount: 3,
      hasData: true,
    },
  });

  const activeTabData = tabs.find((tab) => tab.id === activeTab);

  const handleConnectIntegration = (integrationName: string) => {
    console.log(`Connecting to ${integrationName}...`);
    // This would typically redirect to integration setup
    const integrationSlug = integrationName.toLowerCase().replace(/\s+/g, "-");
    window.location.href = `/integrations/${integrationSlug}`;
  };

  const deviceIntegrationsWithHandlers = DEVICE_INTEGRATIONS.map(
    (integration) => ({
      ...integration,
      onConnect: () => handleConnectIntegration(integration.name),
    }),
  );

  if (isLoading) {
    return <SkeletonDevicePage />;
  }

  // Show empty state if no device data
  if (!deviceData?.hasData) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Device Management"
          description="Monitor, control, and configure all connected devices across your farm"
        />

        <EmptyStateWithIntegrations
          pageType="devices"
          title="Connect Your Farm Devices"
          description="Integrate with smart home platforms, IoT systems, and hardware controllers to manage lights, pumps, sensors, and automation throughout your vertical farm."
          integrations={deviceIntegrationsWithHandlers}
        />
      </div>
    );
  }

  // Full dashboard view when data exists
  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader
        title="Device Management"
        description="Monitor, control, and configure all connected devices across your farm"
      />

      {/* Quick Actions */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
        <div className="flex items-center gap-2">
          <FarmControlButton size="sm" className="state-active">
            <FaPlus className="h-4 w-4 mr-2" />
            Add Integration
          </FarmControlButton>
          <FarmControlButton variant="default" size="sm">
            <FaWifi className="h-4 w-4 mr-2" />
            Refresh All
          </FarmControlButton>
          <FarmControlButton variant="default" size="sm">
            <FaCog className="h-4 w-4 mr-2" />
            Settings
          </FarmControlButton>
        </div>
      </div>

      {/* Quick Metrics */}
      <MetricsGrid
        columns={4}
        metrics={[
          {
            id: "total-devices",
            label: "Total Devices",
            value: deviceData?.totalDevices?.toString() || "0",
            icon: () => <FaCog className="text-farm-accent" />,
            stateClass: "state-active",
          },
          {
            id: "online-devices",
            label: "Online Devices",
            value: deviceData?.onlineDevices?.toString() || "0",
            icon: () => <FaCheckCircle className="text-green-600" />,
            stateClass: "state-growing",
          },
          {
            id: "integrations",
            label: "Integrations",
            value: deviceData?.integrationCount?.toString() || "0",
            icon: () => <FaWifi className="text-blue-600" />,
            stateClass: "state-active",
          },
          {
            id: "alerts",
            label: "Active Alerts",
            value: "2",
            icon: () => <AlertTriangle className="text-orange-600" />,
            stateClass: "state-maintenance",
          },
        ]}
      />

      {/* Main Tab Navigation */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-4">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="flex items-center gap-2"
            >
              {tab.icon}
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* ✅ NEW: Standardized Search and Filter Controls */}
          <Card className="card-shadow">
            <CardContent className="p-6">
              <FarmSearchAndFilter
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                searchContext="devices, locations, integrations"
                searchPlaceholder="Search devices, locations, integrations..."
                filters={filterDefinitions}
                activeFilters={getActiveFilterChips(filterDefinitions)}
                onFilterChange={handleFilterChange}
                onRemoveFilter={handleRemoveFilter}
                onClearAllFilters={clearAllFilters}
                orientation="horizontal"
                showFilterChips={true}
              />

              {/* Results summary */}
              {(hasSearch || hasActiveFilters) && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    Showing {filteredIntegrations.length} of{" "}
                    {mockIntegrations.length} integrations
                  </p>
                  {(hasSearch || hasActiveFilters) && (
                    <FarmControlButton
                      size="sm"
                      variant="default"
                      onClick={() => {
                        clearSearch();
                        clearAllFilters();
                      }}
                    >
                      Clear all filters
                    </FarmControlButton>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Integration Health Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="card-shadow">
              <CardHeader>
                <CardTitle className="text-farm-title flex items-center gap-2">
                  <FaHome className="text-orange-600" />
                  Home Assistant
                </CardTitle>
                <CardDescription className="text-control-label">
                  Smart home automation platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-control-label">Status</span>
                    <StatusBadge status="connected">Connected</StatusBadge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-control-label">Devices</span>
                    <span className="text-sensor-value">24</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-control-label">Last Sync</span>
                    <span className="text-control-label opacity-70">
                      2 minutes ago
                    </span>
                  </div>
                  <Separator />
                  <FarmControlButton
                    size="sm"
                    variant="default"
                    className="w-full"
                  >
                    <FaCog className="h-4 w-4 mr-2" />
                    Manage
                  </FarmControlButton>
                </div>
              </CardContent>
            </Card>

            <Card className="card-shadow">
              <CardHeader>
                <CardTitle className="text-farm-title flex items-center gap-2">
                  <FaWifi className="text-blue-600" />
                  Arduino Cloud
                </CardTitle>
                <CardDescription className="text-control-label">
                  Custom sensor platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-control-label">Status</span>
                    <StatusBadge status="connected">Connected</StatusBadge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-control-label">Devices</span>
                    <span className="text-sensor-value">12</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-control-label">Last Sync</span>
                    <span className="text-control-label opacity-70">
                      5 minutes ago
                    </span>
                  </div>
                  <Separator />
                  <FarmControlButton
                    size="sm"
                    variant="default"
                    className="w-full"
                  >
                    <FaCog className="h-4 w-4 mr-2" />
                    Manage
                  </FarmControlButton>
                </div>
              </CardContent>
            </Card>

            <Card className="card-shadow">
              <CardHeader>
                <CardTitle className="text-farm-title flex items-center gap-2">
                  <FaWifi className="text-purple-600" />
                  SmartThings
                </CardTitle>
                <CardDescription className="text-control-label">
                  Samsung IoT platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-control-label">Status</span>
                    <StatusBadge status="connected">Connected</StatusBadge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-control-label">Devices</span>
                    <span className="text-sensor-value">11</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-control-label">Last Sync</span>
                    <span className="text-control-label opacity-70">
                      1 minute ago
                    </span>
                  </div>
                  <Separator />
                  <FarmControlButton
                    size="sm"
                    variant="default"
                    className="w-full"
                  >
                    <FaCog className="h-4 w-4 mr-2" />
                    Manage
                  </FarmControlButton>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card className="card-shadow">
            <CardHeader>
              <CardTitle className="text-farm-title">
                Recent Device Activity
              </CardTitle>
              <CardDescription className="text-control-label">
                Latest device state changes and events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    device: "Row A Rack 1 LED Array",
                    action: "Turned ON",
                    time: "2 minutes ago",
                    integration: "Home Assistant",
                    icon: FaLightbulb,
                    color: "text-yellow-600",
                  },
                  {
                    device: "Nutrient Pump #3",
                    action: "Cycle completed",
                    time: "8 minutes ago",
                    integration: "Arduino Cloud",
                    icon: FaTint,
                    color: "text-blue-600",
                  },
                  {
                    device: "Exhaust Fan System",
                    action: "Speed adjusted to 75%",
                    time: "12 minutes ago",
                    integration: "SmartThings",
                    icon: FaFan,
                    color: "text-green-600",
                  },
                  {
                    device: "Temperature Sensor B2",
                    action: "Reading: 74.2°F",
                    time: "15 minutes ago",
                    integration: "Home Assistant",
                    icon: FaThermometerHalf,
                    color: "text-orange-600",
                  },
                ].map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <activity.icon className={`${activity.color}`} />
                      <div>
                        <p className="text-control-label font-medium">
                          {activity.device}
                        </p>
                        <p className="text-control-label opacity-70">
                          {activity.action}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-control-label opacity-70">
                        {activity.time}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {activity.integration}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all-devices" className="space-y-6">
          <AllDevicesTab />
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <ActiveIntegrationsTab />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card className="card-shadow">
            <CardHeader>
              <CardTitle className="text-farm-title">
                Global Device Settings
              </CardTitle>
              <CardDescription className="text-control-label">
                Configure device management preferences and defaults
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-farm-title font-semibold mb-2">
                  System Configuration
                </h3>
                <p className="text-control-label">
                  Device settings and configuration options will be available
                  here.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DeviceManagementPage;
