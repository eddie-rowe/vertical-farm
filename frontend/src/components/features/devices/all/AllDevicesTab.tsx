"use client";

import {
  Lightbulb,
  ToggleLeft,
  Thermometer,
  Download,
  MapPin,
  Grid,
  List,
  RefreshCw,
  Home,
  Wifi,
  Plug,
  Settings,
  Activity,
  Radio,
} from "lucide-react";
import React, { useState, useMemo, useCallback } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  FarmSearchAndFilter,
  type FilterDefinition,
} from "@/components/ui/farm-search-and-filter";
import { LoadingCard } from "@/components/ui/loading";
import { useFarmSearch, useFarmFilters } from "@/hooks";

// Mock interface for demo - replace with actual service when available
interface MockDevice {
  id: string;
  name: string;
  deviceType: string;
  integration: string;
  location: string;
  status: "online" | "offline" | "unknown";
  lastSeen: string;
  isAssigned: boolean;
  assignmentLocation?: string;
}

// Mock data - replace with actual service calls
const mockDevices: MockDevice[] = [
  {
    id: "1",
    name: "LED Light Panel A1",
    deviceType: "Light",
    integration: "Home Assistant",
    location: "Row 1, Rack A",
    status: "online",
    lastSeen: "2023-10-27T10:00:00Z",
    isAssigned: true,
    assignmentLocation: "Row 1, Rack A, Shelf 1",
  },
  {
    id: "2",
    name: "Water Pump B1",
    deviceType: "Switch",
    integration: "Home Assistant",
    location: "Reservoir Area",
    status: "offline",
    lastSeen: "2023-10-27T09:30:00Z",
    isAssigned: false,
  },
  {
    id: "3",
    name: "Temperature Sensor C1",
    deviceType: "Sensor",
    integration: "Arduino Cloud",
    location: "Row 2, Rack B",
    status: "online",
    lastSeen: "2023-10-27T11:00:00Z",
    isAssigned: true,
    assignmentLocation: "Row 2, Rack B, Shelf 2",
  },
  {
    id: "4",
    name: "Ventilation Fan D1",
    deviceType: "Fan",
    integration: "SmartThings",
    location: "Ventilation Area",
    status: "unknown",
    lastSeen: "2023-10-27T10:30:00Z",
    isAssigned: false,
  },
];

type ViewType = "grid" | "list";

export const AllDevicesTab: React.FC = () => {
  // Search and filter hooks
  const {
    searchTerm,
    setSearchTerm,
    clearSearch,
    filterItems: searchFilterItems,
    hasSearch,
  } = useFarmSearch<MockDevice>({
    searchFields: ["name", "deviceType", "integration", "location"],
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
  } = useFarmFilters<MockDevice>();

  // UI state
  const [loading, setLoading] = useState(false);
  const [viewType, setViewType] = useState<ViewType>("grid");
  const [selectedDevices, setSelectedDevices] = useState<Set<string>>(
    new Set(),
  );
  const [bulkSelectMode, setBulkSelectMode] = useState(false);

  // Filter definitions for FarmSearchAndFilter
  const filterDefinitions: FilterDefinition[] = useMemo(
    () => [
      {
        id: "integration",
        label: "Integration",
        placeholder: "Filter by integration",
        options: [
          { value: "all", label: "All Integrations" },
          ...Array.from(new Set(mockDevices.map((d) => d.integration))).map(
            (integration) => ({
              value: integration.toLowerCase().replace(/\s+/g, "_"),
              label: integration,
            }),
          ),
        ],
        defaultValue: "all",
      },
      {
        id: "deviceType",
        label: "Device Type",
        placeholder: "Filter by type",
        options: [
          { value: "all", label: "All Types" },
          ...Array.from(new Set(mockDevices.map((d) => d.deviceType))).map(
            (type) => ({
              value: type.toLowerCase(),
              label: type,
            }),
          ),
        ],
        defaultValue: "all",
      },
      {
        id: "status",
        label: "Status",
        placeholder: "Filter by status",
        options: [
          { value: "all", label: "All Status" },
          { value: "online", label: "Online" },
          { value: "offline", label: "Offline" },
          { value: "unknown", label: "Unknown" },
        ],
        defaultValue: "all",
      },
      {
        id: "assignment",
        label: "Assignment",
        placeholder: "Filter by assignment",
        options: [
          { value: "all", label: "All Devices" },
          { value: "assigned", label: "Assigned" },
          { value: "unassigned", label: "Unassigned" },
        ],
        defaultValue: "all",
      },
    ],
    [],
  );

  // Handle filter changes
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

  // Handle filter chip removal
  const handleRemoveFilter = useCallback(
    (filterId: string) => {
      removeFilter(filterId);
    },
    [removeFilter],
  );

  // Custom filter function for complex logic
  const customFilterFunction = useCallback(
    (device: MockDevice, filterValues: any[]) => {
      return filterValues.every((filter) => {
        if (!filter.value || filter.value === "all") return true;

        switch (filter.id) {
          case "integration":
            return (
              device.integration.toLowerCase().replace(/\s+/g, "_") ===
              filter.value
            );
          case "deviceType":
            return device.deviceType.toLowerCase() === filter.value;
          case "status":
            return device.status === filter.value;
          case "assignment":
            return filter.value === "assigned"
              ? device.isAssigned
              : !device.isAssigned;
          default:
            return true;
        }
      });
    },
    [],
  );

  // Apply combined filtering
  const filteredDevices = useMemo(() => {
    let result = mockDevices;

    // Apply search filtering
    result = searchFilterItems(result);

    // Apply filter chips with custom logic
    if (filters.length > 0) {
      result = result.filter((device) => customFilterFunction(device, filters));
    }

    return result;
  }, [mockDevices, searchFilterItems, filters, customFilterFunction]);

  // Device operations
  const handleImportDevice = (device: MockDevice) => {
    console.log("Import device:", device.name);
  };

  const handleAssignDevice = (device: MockDevice) => {
    console.log("Assign device:", device.name);
  };

  const handleDeviceControl = (device: MockDevice, action: string) => {
    console.log(`${action} device:`, device.name);
  };

  // Stats calculations
  const deviceStats = useMemo(
    () => ({
      total: mockDevices.length,
      online: mockDevices.filter((d) => d.status === "online").length,
      assigned: mockDevices.filter((d) => d.isAssigned).length,
      unassigned: mockDevices.filter((d) => !d.isAssigned).length,
    }),
    [],
  );

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType.toLowerCase()) {
      case "light":
        return <Lightbulb className="h-4 w-4 text-yellow-500" />;
      case "switch":
        return <ToggleLeft className="h-4 w-4 text-blue-500" />;
      case "sensor":
        return <Thermometer className="h-4 w-4 text-green-500" />;
      case "fan":
        return <Activity className="h-4 w-4 text-cyan-500" />;
      default:
        return <Plug className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "text-green-600 bg-green-100";
      case "offline":
        return "text-red-600 bg-red-100";
      case "unknown":
        return "text-yellow-600 bg-yellow-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const DeviceCard = ({ device }: { device: MockDevice }) => (
    <Card className="hover:shadow-lg transition-all duration-200">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-3 flex-1">
            <div className="flex-shrink-0 mt-1">
              {getDeviceIcon(device.deviceType)}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm leading-tight truncate">
                {device.name}
              </h3>
              <p className="text-xs text-gray-500 truncate mt-1">{device.id}</p>
              {device.isAssigned && device.assignmentLocation && (
                <div className="flex items-center gap-1 mt-1">
                  <MapPin className="h-3 w-3 text-green-600" />
                  <span className="text-xs text-green-600 truncate">
                    {device.assignmentLocation}
                  </span>
                </div>
              )}
            </div>
          </div>
          <Badge
            className={`text-xs px-2 py-1 ${getStatusColor(device.status)}`}
          >
            {device.status}
          </Badge>
        </div>

        <div className="flex items-center justify-between mb-3">
          <Badge variant="outline" className="text-xs">
            {device.integration}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {device.deviceType}
          </Badge>
        </div>

        <div className="flex gap-2">
          {!device.isAssigned ? (
            <Button
              size="sm"
              variant="default"
              className="flex-1"
              onClick={() => handleImportDevice(device)}
            >
              <Download className="h-4 w-4 mr-2" />
              Import
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => handleAssignDevice(device)}
            >
              <MapPin className="h-4 w-4 mr-2" />
              Reassign
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            className="px-3"
            onClick={() => handleDeviceControl(device, "configure")}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return <LoadingCard message="Loading devices..." size="lg" />;
  }

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {deviceStats.total}
            </div>
            <div className="text-sm text-gray-500">Total Devices</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {deviceStats.online}
            </div>
            <div className="text-sm text-gray-500">Online</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {deviceStats.assigned}
            </div>
            <div className="text-sm text-gray-500">Assigned</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-600">
              {deviceStats.unassigned}
            </div>
            <div className="text-sm text-gray-500">Unassigned</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters - Using Standardized Components */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Device Management</h3>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setViewType(viewType === "grid" ? "list" : "grid")
                }
              >
                {viewType === "grid" ? (
                  <List className="h-4 w-4" />
                ) : (
                  <Grid className="h-4 w-4" />
                )}
              </Button>
              <Button size="sm" variant="outline">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <FarmSearchAndFilter
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchContext="devices"
            filters={filterDefinitions}
            activeFilters={getActiveFilterChips(filterDefinitions)}
            onFilterChange={handleFilterChange}
            onRemoveFilter={handleRemoveFilter}
            onClearAllFilters={clearAllFilters}
            orientation="horizontal"
            showFilterChips={true}
          />
        </CardContent>
      </Card>

      {/* Results summary */}
      {(hasSearch || hasActiveFilters) && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {filteredDevices.length} of {mockDevices.length} devices
          </p>
          {(hasSearch || hasActiveFilters) && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                clearSearch();
                clearAllFilters();
              }}
            >
              Clear all filters
            </Button>
          )}
        </div>
      )}

      {/* Devices grid */}
      <div
        className={`grid gap-4 ${viewType === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}
      >
        {filteredDevices.map((device) => (
          <DeviceCard key={device.id} device={device} />
        ))}
      </div>

      {/* Empty state */}
      {filteredDevices.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-900 mb-2">
              No devices found
            </h3>
            <p className="text-gray-600 mb-4">
              {hasSearch || hasActiveFilters
                ? "Try adjusting your search or filters"
                : "Connect your first integration to see devices here"}
            </p>
            {!(hasSearch || hasActiveFilters) && (
              <div className="space-y-3">
                <p className="text-sm text-gray-500">Available integrations:</p>
                <div className="flex justify-center gap-2 flex-wrap">
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Home className="h-3 w-3" />
                    Home Assistant
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Radio className="h-3 w-3" />
                    SmartThings
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Activity className="h-3 w-3" />
                    Arduino Cloud
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Wifi className="h-3 w-3" />
                    AWS IoT Core
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
