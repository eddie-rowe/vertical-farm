"use client";

import { FC, useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  FaSearch,
  FaFilter,
  FaMapPin,
  FaCheckCircle,
  FaCircle,
  FaLightbulb,
  FaToggleOn,
  FaThermometerHalf,
  FaWater,
  FaLeaf,
  FaEye,
  FaEyeSlash,
  FaExpandAlt,
  FaList,
  FaTh,
  FaDownload,
  FaPlay,
  FaStop,
} from "react-icons/fa";
import { LayoutGrid, List, Grid, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { FarmControlButton } from "@/components/ui/farm-control-button";
import { FarmInput } from "@/components/ui/farm-input";

// ✅ NEW: Import standardized search and filter components
import {
  FarmSearchAndFilter,
  type FilterDefinition,
} from "@/components/ui/farm-search-and-filter";
import { useFarmSearch, useFarmFilters } from "@/hooks";

import {
  HADevice,
  HAAssignment,
  HAImportedDevice,
} from "@/types/integrations/homeassistant";
import { DeviceCard } from "./DeviceCard";

// Legacy types for existing functionality
type ViewType = "grid" | "list";
type DeviceStats = {
  total: number;
  assigned: number;
  unassigned: number;
  active: number;
  inactive: number;
};

interface DeviceManagementProps {
  devices: HADevice[];
  assignments: HAAssignment[];
  importedDevices: HAImportedDevice[];
  loading: boolean;
  onDiscoverDevices: () => void;
  onDeviceControl: (
    device: HADevice,
    action: "turn_on" | "turn_off" | "toggle",
  ) => void;
  onImportDevice: (device: HADevice) => void;
  onAssignDevice: (device: HADevice) => void;
  onBulkImport: (devices: HADevice[]) => void;
  onBulkControl: (devices: HADevice[], action: "turn_on" | "turn_off") => void;
}

export const DeviceManagement: FC<DeviceManagementProps> = ({
  devices,
  assignments,
  importedDevices,
  loading,
  onDiscoverDevices,
  onDeviceControl,
  onImportDevice,
  onAssignDevice,
  onBulkImport,
  onBulkControl,
}) => {
  // ✅ NEW: Replace manual search/filter state with standardized hooks
  const {
    searchTerm,
    setSearchTerm,
    clearSearch,
    filterItems: searchFilterItems,
    hasSearch,
  } = useFarmSearch<HADevice>({
    searchFields: ["friendly_name", "entity_id", "device_class"],
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

  // ✅ NEW: Filter definitions for FarmSearchAndFilter
  const filterDefinitions: FilterDefinition[] = useMemo(
    () => [
      {
        id: "status",
        label: "Status",
        placeholder: "Select status",
        options: [
          { label: "Active", value: "on" },
          { label: "Inactive", value: "off" },
          { label: "Unavailable", value: "unavailable" },
        ],
        defaultValue: "",
      },
      {
        id: "device_class",
        label: "Device Type",
        placeholder: "Select type",
        options: [
          { label: "Lights", value: "light" },
          { label: "Switches", value: "switch" },
          { label: "Sensors", value: "sensor" },
          { label: "Climate", value: "climate" },
        ],
        defaultValue: "",
      },
      {
        id: "assignment_status",
        label: "Assignment",
        placeholder: "Select assignment",
        options: [
          { label: "Assigned", value: "assigned" },
          { label: "Unassigned", value: "unassigned" },
        ],
        defaultValue: "",
      },
    ],
    [],
  );

  // ✅ NEW: Filter change handlers
  const handleFilterChange = useCallback(
    (filterId: string, value: string) => {
      setFilter(filterId, value);
    },
    [setFilter],
  );

  const handleRemoveFilter = useCallback(
    (filterId: string) => {
      removeFilter(filterId);
    },
    [removeFilter],
  );

  // Legacy state for UI controls that don't need standardization
  const [viewType, setViewType] = useState<ViewType>("grid");
  const [bulkSelectMode, setBulkSelectMode] = useState(false);
  const [selectedDevices, setSelectedDevices] = useState<Set<string>>(
    new Set(),
  );
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  const filterMenuRef = useRef<HTMLDivElement>(null);

  // ✅ NEW: Apply search and filters using standardized hooks
  const filteredDevices = useMemo(() => {
    let result = devices;

    // Apply search first
    result = searchFilterItems(result);

    // Apply filters with custom logic for assignment status
    result = filterFilterItems(result);

    // Additional filtering for assignment status
    const assignmentFilter = filters.find((f) => f.id === "assignment_status");
    if (assignmentFilter) {
      result = result.filter((device) => {
        const isAssigned = assignments.some(
          (a) => a.entity_id === device.entity_id,
        );
        return assignmentFilter.value === "assigned" ? isAssigned : !isAssigned;
      });
    }

    return result;
  }, [devices, searchFilterItems, filterFilterItems, assignments, filters]);

  const toggleDeviceSelection = (deviceId: string) => {
    const newSelection = new Set(selectedDevices);
    if (newSelection.has(deviceId)) {
      newSelection.delete(deviceId);
    } else {
      newSelection.add(deviceId);
    }
    setSelectedDevices(newSelection);
  };

  const selectAllDevices = () => {
    setSelectedDevices(new Set(filteredDevices.map((d) => d.entity_id)));
  };

  const clearSelection = () => {
    setSelectedDevices(new Set());
  };

  const getDeviceStats = (): DeviceStats => {
    const total = filteredDevices.length;
    const assigned = filteredDevices.filter((d) =>
      assignments.some((a) => a.entity_id === d.entity_id),
    ).length;
    const unassigned = total - assigned;
    const active = filteredDevices.filter((d) => d.state === "on").length;
    const inactive = total - active;

    return { total, assigned, unassigned, active, inactive };
  };

  const handleBulkImport = () => {
    const selectedDeviceObjects = devices.filter((d) =>
      selectedDevices.has(d.entity_id),
    );
    onBulkImport(selectedDeviceObjects);
    clearSelection();
  };

  const handleBulkControl = (action: "turn_on" | "turn_off") => {
    const selectedDeviceObjects = devices.filter((d) =>
      selectedDevices.has(d.entity_id),
    );
    onBulkControl(selectedDeviceObjects, action);
  };

  const stats = getDeviceStats();

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {stats.total}
            </div>
            <div className="text-sm text-gray-500">Total Devices</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {stats.active}
            </div>
            <div className="text-sm text-gray-500">Active</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {stats.assigned}
            </div>
            <div className="text-sm text-gray-500">Assigned</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-600">
              {stats.unassigned}
            </div>
            <div className="text-sm text-gray-500">Unassigned</div>
          </CardContent>
        </Card>
      </div>

      {/* ✅ NEW: Standardized Search and Filter Component */}
      <Card>
        <CardContent className="pt-4">
          <FarmSearchAndFilter
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchContext="devices by name, type, or entity ID"
            searchPlaceholder="Search devices by name, type, or entity ID..."
            filters={filterDefinitions}
            activeFilters={getActiveFilterChips(filterDefinitions)}
            onFilterChange={handleFilterChange}
            onRemoveFilter={handleRemoveFilter}
            onClearAllFilters={clearAllFilters}
            orientation="horizontal"
            showFilterChips={true}
          />

          {/* View controls and bulk actions */}
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
            <div className="flex gap-2">
              {/* View type toggles */}
              <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                <FarmControlButton
                  variant={viewType === "grid" ? "primary" : "default"}
                  size="sm"
                  className="rounded-none border-0"
                  onClick={() => setViewType("grid")}
                >
                  <LayoutGrid className="h-4 w-4" />
                </FarmControlButton>
                <FarmControlButton
                  variant={viewType === "list" ? "primary" : "default"}
                  size="sm"
                  className="rounded-none border-0"
                  onClick={() => setViewType("list")}
                >
                  <List className="h-4 w-4" />
                </FarmControlButton>
              </div>

              {/* Bulk select toggle */}
              <FarmControlButton
                variant={bulkSelectMode ? "primary" : "default"}
                onClick={() => setBulkSelectMode(!bulkSelectMode)}
                className="px-4"
              >
                {bulkSelectMode ? (
                  <FaEyeSlash className="h-4 w-4" />
                ) : (
                  <FaEye className="h-4 w-4" />
                )}
              </FarmControlButton>
            </div>

            {/* Results summary */}
            <div className="text-sm text-gray-600">
              Showing {filteredDevices.length} of {devices.length} devices
              {hasActiveFilters && <span className="ml-2">(filtered)</span>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Device Grid */}
      <div
        className={`grid gap-4 ${viewType === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}
      >
        {filteredDevices.map((device) => (
          <DeviceCard
            key={device.entity_id}
            device={device}
            assignments={assignments}
            importedDevices={importedDevices}
            selectedDevices={selectedDevices}
            bulkSelectMode={bulkSelectMode}
            onToggleSelection={toggleDeviceSelection}
            onDeviceControl={onDeviceControl}
            onImportDevice={onImportDevice}
            onAssignDevice={onAssignDevice}
          />
        ))}
      </div>

      {/* Empty state */}
      {filteredDevices.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <FaSearch className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="font-semibold text-content mb-2">
              No devices found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {searchTerm || hasActiveFilters
                ? "Try adjusting your search or filters"
                : "Start by discovering devices from your Home Assistant instance"}
            </p>
            {!searchTerm && !hasActiveFilters && (
              <FarmControlButton onClick={onDiscoverDevices}>
                <FaSearch className="h-4 w-4 mr-2" />
                Discover Devices
              </FarmControlButton>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
