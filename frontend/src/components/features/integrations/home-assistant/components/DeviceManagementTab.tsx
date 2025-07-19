import React, { useState, useMemo, useCallback } from "react";
import {
  Search,
  Filter,
  Download,
  Eye,
  EyeOff,
  Zap,
  Home,
  Lightbulb,
  Thermometer,
  Gauge,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  CheckCircle,
  Circle,
  Package,
  Database,
  Info,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { HADevice, ImportedDevice } from "@/services/homeAssistantService";

// ✅ NEW: Import standardized search/filter components and hooks
import {
  FarmSearchAndFilter,
  type FilterDefinition,
} from "@/components/ui/farm-search-and-filter";
import { useFarmSearch, useFarmFilters } from "@/hooks";

interface DeviceManagementTabProps {
  devices: HADevice[];
  importedDevices: ImportedDevice[];
  isLoading: boolean;
  onDiscoverDevices: () => Promise<HADevice[]>;
  onImportDevice: (device: HADevice) => Promise<void>;
  onBulkImportDevices: (devices: HADevice[]) => Promise<void>;
  onControlDevice: (
    device: HADevice,
    action: "turn_on" | "turn_off" | "toggle",
  ) => Promise<void>;
}

export const DeviceManagementTab: React.FC<DeviceManagementTabProps> = ({
  devices,
  importedDevices,
  isLoading,
  onDiscoverDevices,
  onImportDevice,
  onBulkImportDevices,
  onControlDevice,
}) => {
  // ✅ NEW: Replace manual search/filter state with standardized hooks
  const {
    searchTerm,
    setSearchTerm,
    clearSearch,
    filterItems: searchFilterItems,
    hasSearch,
  } = useFarmSearch<HADevice>({
    searchFields: ["friendly_name", "entity_id"],
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
  } = useFarmFilters<HADevice>();

  const [selectedDevices, setSelectedDevices] = useState<Set<string>>(
    new Set(),
  );
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Get unique device types for filter
  const deviceTypes = useMemo(() => {
    const types = new Set(devices.map((d) => d.device_class || "other"));
    return Array.from(types).sort();
  }, [devices]);

  // ✅ NEW: Filter definitions for FarmSearchAndFilter
  const filterDefinitions: FilterDefinition[] = useMemo(
    () => [
      {
        id: "device_class",
        label: "Device Type",
        placeholder: "Filter by type",
        options: [
          { value: "all", label: "All Types" },
          ...deviceTypes.map((type) => ({
            value: type,
            label: type.charAt(0).toUpperCase() + type.slice(1),
          })),
        ],
        defaultValue: "all",
      },
      {
        id: "state",
        label: "State",
        placeholder: "Filter by state",
        options: [
          { value: "all", label: "All States" },
          { value: "on", label: "On" },
          { value: "off", label: "Off" },
          { value: "unavailable", label: "Unavailable" },
        ],
        defaultValue: "all",
      },
      {
        id: "import_status",
        label: "Import Status",
        placeholder: "Filter by import status",
        options: [
          { value: "all", label: "All Devices" },
          { value: "imported", label: "Imported Only" },
          { value: "unimported", label: "Unimported Only" },
        ],
        defaultValue: "all",
      },
    ],
    [deviceTypes],
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

  // ✅ NEW: Custom filter function for import status
  const customFilterFn = useCallback(
    (device: HADevice) => {
      const importStatusFilter = filters.find(
        (f) => f.id === "import_status",
      )?.value;
      if (importStatusFilter) {
        const isImported = importedDevices.some(
          (imported) => imported.entity_id === device.entity_id,
        );
        if (importStatusFilter === "imported" && !isImported) return false;
        if (importStatusFilter === "unimported" && isImported) return false;
      }
      return true;
    },
    [filters, importedDevices],
  );

  // ✅ NEW: Apply search and filters using standardized system
  const filteredDevices = useMemo(() => {
    let result = devices;
    result = searchFilterItems(result);
    result = filterFilterItems(result);
    // Apply custom import status filter
    result = result.filter(customFilterFn);
    return result;
  }, [devices, searchFilterItems, filterFilterItems, customFilterFn]);

  const handleDiscoverDevices = async () => {
    setIsDiscovering(true);
    try {
      await onDiscoverDevices();
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleBulkImport = async () => {
    if (selectedDevices.size === 0) return;

    setIsImporting(true);
    try {
      const devicesToImport = devices.filter((d) =>
        selectedDevices.has(d.entity_id),
      );
      await onBulkImportDevices(devicesToImport);
      setSelectedDevices(new Set()); // Clear selection after import
    } finally {
      setIsImporting(false);
    }
  };

  const handleSelectDevice = (entityId: string, checked: boolean) => {
    const newSelection = new Set(selectedDevices);
    if (checked) {
      newSelection.add(entityId);
    } else {
      newSelection.delete(entityId);
    }
    setSelectedDevices(newSelection);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const unimportedDevices = filteredDevices.filter(
        (device) =>
          !importedDevices.some(
            (imported) => imported.entity_id === device.entity_id,
          ),
      );
      setSelectedDevices(new Set(unimportedDevices.map((d) => d.entity_id)));
    } else {
      setSelectedDevices(new Set());
    }
  };

  const getDeviceIcon = (deviceClass: string) => {
    switch (deviceClass) {
      case "light":
        return Lightbulb;
      case "switch":
        return ToggleLeft;
      case "sensor":
        return Gauge;
      case "binary_sensor":
        return Thermometer;
      default:
        return Home;
    }
  };

  const getStateColor = (state: string) => {
    switch (state) {
      case "on":
        return "text-green-600 dark:text-green-400";
      case "off":
        return "text-gray-500 dark:text-gray-400";
      case "unavailable":
        return "text-red-500 dark:text-red-400";
      default:
        return "text-blue-600 dark:text-blue-400";
    }
  };

  const isDeviceImported = (entityId: string) => {
    return importedDevices.some((imported) => imported.entity_id === entityId);
  };

  return (
    <div className="space-y-6">
      {/* Header with Discovery and Import Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="w-5 h-5" />
            <span>Device Management</span>
          </CardTitle>
          <CardDescription>
            Discover, import, and manage Home Assistant devices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="flex items-center space-x-2">
              <Button
                onClick={handleDiscoverDevices}
                disabled={isDiscovering}
                variant="outline"
                className="flex items-center space-x-2"
              >
                {isDiscovering ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                <span>
                  {isDiscovering ? "Discovering..." : "Discover Devices"}
                </span>
              </Button>

              <Badge
                variant="outline"
                className="text-orange-600 border-orange-200"
              >
                {devices.length} devices found
              </Badge>
            </div>

            {selectedDevices.size > 0 && (
              <Button
                onClick={handleBulkImport}
                disabled={isImporting}
                className="flex items-center space-x-2 bg-orange-600 hover:bg-orange-700"
              >
                {isImporting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span>
                  {isImporting
                    ? "Importing..."
                    : `Import ${selectedDevices.size} Selected`}
                </span>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          {/* ✅ NEW: Standardized Search and Filter Component */}
          <div className="space-y-4">
            <FarmSearchAndFilter
              searchValue={searchTerm}
              onSearchChange={setSearchTerm}
              searchContext="Home Assistant devices"
              searchPlaceholder="Search by name or entity ID..."
              filters={filterDefinitions}
              activeFilters={getActiveFilterChips(filterDefinitions)}
              onFilterChange={handleFilterChange}
              onRemoveFilter={handleRemoveFilter}
              onClearAllFilters={clearAllFilters}
              orientation="horizontal"
              showFilterChips={true}
            />

            {/* ✅ NEW: Results Summary */}
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>
                Showing {filteredDevices.length} of {devices.length} device
                {devices.length !== 1 ? "s" : ""}
                {hasSearch && ` matching "${searchTerm}"`}
                {hasActiveFilters && ` with active filters`}
              </span>

              {(hasSearch || hasActiveFilters) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    clearSearch();
                    clearAllFilters();
                  }}
                  className="text-orange-600 hover:text-orange-700"
                >
                  Clear all
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Device Tabs */}
      <Tabs defaultValue="available" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger
            value="available"
            className="flex items-center space-x-2"
          >
            <Eye className="w-4 h-4" />
            <span>Available Devices ({filteredDevices.length})</span>
          </TabsTrigger>
          <TabsTrigger value="imported" className="flex items-center space-x-2">
            <Database className="w-4 h-4" />
            <span>Imported Devices ({importedDevices.length})</span>
          </TabsTrigger>
        </TabsList>

        {/* Available Devices Tab */}
        <TabsContent value="available" className="space-y-4">
          {filteredDevices.length === 0 ? (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                {devices.length === 0
                  ? 'No devices found. Click "Discover Devices" to scan your Home Assistant instance.'
                  : "No devices match your current filters."}
              </AlertDescription>
            </Alert>
          ) : (
            <>
              {/* Bulk Selection */}
              <div className="flex items-center space-x-2 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <Checkbox
                  id="select-all"
                  checked={
                    selectedDevices.size > 0 &&
                    filteredDevices
                      .filter((d) => !isDeviceImported(d.entity_id))
                      .every((d) => selectedDevices.has(d.entity_id))
                  }
                  onCheckedChange={(checked) =>
                    handleSelectAll(checked === true)
                  }
                />
                <Label htmlFor="select-all" className="text-sm font-medium">
                  Select all unimported devices (
                  {
                    filteredDevices.filter(
                      (d) => !isDeviceImported(d.entity_id),
                    ).length
                  }
                  )
                </Label>
              </div>

              {/* Device Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredDevices.map((device) => {
                  const DeviceIcon = getDeviceIcon(
                    device.device_class || "other",
                  );
                  const imported = isDeviceImported(device.entity_id);
                  const selected = selectedDevices.has(device.entity_id);

                  return (
                    <Card
                      key={device.entity_id}
                      className={`relative ${imported ? "opacity-75" : ""}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3 flex-1">
                            {!imported && (
                              <Checkbox
                                checked={selected}
                                onCheckedChange={(checked) =>
                                  handleSelectDevice(
                                    device.entity_id,
                                    checked === true,
                                  )
                                }
                              />
                            )}
                            <DeviceIcon className="w-5 h-5 text-orange-600" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">
                                {device.friendly_name || device.entity_id}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {device.entity_id}
                              </p>
                            </div>
                          </div>

                          {imported ? (
                            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onImportDevice(device)}
                              className="flex-shrink-0"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          )}
                        </div>

                        <div className="mt-3 flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-xs">
                              {device.device_class || "other"}
                            </Badge>
                            <span
                              className={`text-xs font-medium ${getStateColor(device.state)}`}
                            >
                              {device.state}
                            </span>
                          </div>

                          {imported && (
                            <Badge className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              Imported
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </TabsContent>

        {/* Imported Devices Tab */}
        <TabsContent value="imported" className="space-y-4">
          {importedDevices.length === 0 ? (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                No devices have been imported yet. Import devices from the
                "Available Devices" tab to manage them here.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {importedDevices.map((device) => {
                const DeviceIcon = getDeviceIcon(device.device_type);
                const isAssigned = device.is_assigned;

                return (
                  <Card key={device.entity_id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3 flex-1">
                          <DeviceIcon className="w-5 h-5 text-orange-600" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {device.name}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {device.entity_id}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 flex-shrink-0">
                          {device.state && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                const haDevice = devices.find(
                                  (d) => d.entity_id === device.entity_id,
                                );
                                if (haDevice) {
                                  onControlDevice(
                                    haDevice,
                                    device.state === "on"
                                      ? "turn_off"
                                      : "turn_on",
                                  );
                                }
                              }}
                            >
                              {device.state === "on" ? (
                                <ToggleRight className="w-4 h-4 text-green-600" />
                              ) : (
                                <ToggleLeft className="w-4 h-4 text-gray-400" />
                              )}
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs">
                            {device.device_type}
                          </Badge>
                          {device.state && (
                            <span
                              className={`text-xs font-medium ${getStateColor(device.state)}`}
                            >
                              {device.state}
                            </span>
                          )}
                        </div>

                        <Badge
                          className={`text-xs ${
                            isAssigned
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                          }`}
                        >
                          {isAssigned ? "Assigned" : "Unassigned"}
                        </Badge>
                      </div>

                      <div className="mt-2 text-xs text-gray-500">
                        Last seen: {new Date(device.last_seen).toLocaleString()}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
