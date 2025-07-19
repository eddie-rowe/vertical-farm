"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Search,
  Lightbulb,
  Zap,
  Wind,
  Settings,
  Trash2,
  Thermometer,
  Camera,
  Droplets,
  Power,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { supabase } from "@/lib/supabaseClient";
import { Row, Rack, Shelf } from "@/types/farm/layout";
import {
  HADevice,
  DeviceAssignment,
  DeviceFilter,
  AssignmentTarget,
} from "@/types/device-assignment";
import deviceAssignmentService from "@/services/deviceAssignmentService";
import homeAssistantService from "@/services/homeAssistantService";
import { FarmSearchAndFilter } from "@/components/ui/farm-search-and-filter";
import { useFarmSearch, useFarmFilters } from "@/hooks";
import type { FilterDefinition } from "@/components/ui/farm-search-and-filter";

interface Device {
  id: string;
  entity_id: string;
  friendly_name?: string;
  entity_type: string;
  state?: string;
  attributes?: Record<string, any>;
}

interface ElementDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  element: Row | Rack | Shelf | null;
  elementType: "row" | "rack" | "shelf";
  onUpdate?: () => void;
  onDelete?: () => void;
}

const getDeviceIcon = (entityType: string) => {
  switch (entityType.toLowerCase()) {
    case "light":
      return <Lightbulb className="w-4 h-4" />;
    case "switch":
      return <Zap className="w-4 h-4" />;
    case "sensor":
      return <Settings className="w-4 h-4" />;
    case "fan":
      return <Wind className="w-4 h-4" />;
    case "valve":
      return <Droplets className="w-4 h-4" />;
    case "pump":
      return <Power className="w-4 h-4" />;
    case "camera":
      return <Camera className="w-4 h-4" />;
    case "climate":
      return <Thermometer className="w-4 h-4" />;
    default:
      return <Settings className="w-4 h-4" />;
  }
};

const getStatusIcon = (state: string) => {
  const isOnline = state !== "unavailable" && state !== "unknown";
  if (state === "unavailable") {
    return <XCircle className="w-3 h-3 text-red-500" />;
  } else if (isOnline) {
    return <CheckCircle className="w-3 h-3 text-green-500" />;
  } else {
    return <Clock className="w-3 h-3 text-yellow-500" />;
  }
};

const ElementDetailModal: React.FC<ElementDetailModalProps> = ({
  isOpen,
  onClose,
  element,
  elementType,
  onUpdate,
  onDelete,
}) => {
  const [availableDevices, setAvailableDevices] = useState<HADevice[]>([]);
  const [assignedDevices, setAssignedDevices] = useState<DeviceAssignment[]>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Standardized search and filter hooks
  const {
    searchTerm,
    setSearchTerm,
    clearSearch,
    hasSearch,
    filterItems: searchFilterItems,
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

  // Get contextual device types for this element
  const getContextualDeviceTypes = () => {
    return deviceAssignmentService.getContextualDeviceTypes(
      elementType as AssignmentTarget["type"],
    );
  };

  // Get device type options with icons
  const getDeviceTypeOptions = () => {
    const allTypes = deviceAssignmentService.getDeviceTypes();
    const contextualTypes = getContextualDeviceTypes();

    return [
      { value: "all", label: "All Devices", icon: "📱" },
      ...allTypes.filter((type) => contextualTypes.includes(type.value)),
    ];
  };

  // Filter definitions for FarmSearchAndFilter
  const filterDefinitions: FilterDefinition[] = useMemo(
    () => [
      {
        id: "device_type",
        label: "Device Type",
        placeholder: "Filter by device type",
        options: getDeviceTypeOptions().map((option) => ({
          value: option.value,
          label: option.label,
        })),
        defaultValue: "all",
      },
    ],
    [elementType],
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

  const handleRemoveFilter = useCallback(
    (filterId: string) => {
      removeFilter(filterId);
    },
    [removeFilter],
  );

  // Create assignment target for current element
  const getAssignmentTarget = (): AssignmentTarget => {
    if (!element) throw new Error("No element selected");
    return {
      type: elementType as AssignmentTarget["type"],
      id: element.id,
      name: element.name || `${elementType} ${element.id}`,
    };
  };

  // Fetch available devices for assignment
  const fetchAvailableDevices = async () => {
    if (!element) return;

    setLoading(true);
    try {
      const assigned = false; // Only show unassigned devices

      // Get all imported devices and apply filtering client-side for better UX
      const importedDevices = await homeAssistantService.getImportedDevices(
        undefined,
        assigned,
      );

      // Transform ImportedDevice[] to HADevice[] to match component expectations
      const transformedDevices = (importedDevices || []).map((device) => ({
        entity_id: device.entity_id,
        friendly_name: device.name,
        state: device.state || "",
        attributes: device.attributes || {},
        domain: device.device_type,
        last_changed: device.updated_at,
        last_updated: device.updated_at,
      }));

      setAvailableDevices(transformedDevices);
    } catch (error) {
      console.error("Error fetching devices:", error);
      toast.error("Failed to fetch devices");
    } finally {
      setLoading(false);
    }
  };

  // Apply combined filtering to available devices
  const filteredDevices = useMemo(() => {
    let result = availableDevices;

    // Apply search filtering
    result = searchFilterItems(result);

    // Apply standard filters
    result = filterFilterItems(result);

    return result;
  }, [availableDevices, searchFilterItems, filterFilterItems]);

  // Fetch currently assigned devices
  const fetchAssignedDevices = async () => {
    if (!element) return;

    try {
      const target = getAssignmentTarget();
      const assignments =
        await deviceAssignmentService.getAssignedDevices(target);
      setAssignedDevices(assignments || []);
    } catch (error) {
      console.error("Error fetching assigned devices:", error);
    }
  };

  // Assign device to current element
  const assignDevice = async (device: HADevice) => {
    if (!element) return;

    try {
      const target = getAssignmentTarget();

      const deviceData = {
        entity_id: device.entity_id,
        friendly_name: device.friendly_name,
        entity_type: device.domain,
        device_class: device.device_class,
        area: device.area,
      };

      await deviceAssignmentService.assignDevice(deviceData, target);
      toast.success("Device assigned successfully");

      // Refresh data
      await Promise.all([fetchAssignedDevices(), fetchAvailableDevices()]);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Error assigning device:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to assign device";
      toast.error(errorMessage);
    }
  };

  // Remove device assignment
  const removeDeviceAssignment = async (assignmentId: string) => {
    try {
      await deviceAssignmentService.unassignDevice(assignmentId);
      toast.success("Device assignment removed");

      // Refresh data
      await Promise.all([fetchAssignedDevices(), fetchAvailableDevices()]);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Error removing device assignment:", error);
      toast.error("Failed to remove device assignment");
    }
  };

  // Quick assign all devices of a specific type
  const quickAssignDevices = async (deviceType: string) => {
    if (!element) return;

    try {
      const target = getAssignmentTarget();
      const devices = availableDevices.filter(
        (device) => device.domain === deviceType,
      );

      if (devices.length === 0) {
        toast(`No available ${deviceType} devices found`);
        return;
      }

      let successCount = 0;
      for (const device of devices) {
        try {
          const deviceData = {
            entity_id: device.entity_id,
            friendly_name: device.friendly_name,
            entity_type: device.domain,
            device_class: device.device_class,
            area: device.area,
          };
          await deviceAssignmentService.assignDevice(deviceData, target);
          successCount++;
        } catch (error) {
          console.error(`Error assigning device ${device.entity_id}:`, error);
        }
      }

      toast.success(`Assigned ${successCount} ${deviceType} device(s)`);

      // Refresh data
      await Promise.all([fetchAssignedDevices(), fetchAvailableDevices()]);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Error in quick assign:", error);
      toast.error("Failed to assign devices");
    }
  };

  // Handle delete with confirmation
  const handleDeleteClick = () => {
    setShowDeleteConfirmation(true);
  };

  // Perform actual deletion
  const confirmDelete = async () => {
    if (!element) return;

    setIsDeleting(true);
    try {
      switch (elementType) {
        case "row": {
          const rowService = (
            await import("@/services/domain/farm/RowService")
          ).RowService.getInstance();
          await rowService.delete(element.id);
          toast.success("Row deleted successfully");
          break;
        }
        case "rack": {
          const rackService = (
            await import("@/services/domain/farm/RackService")
          ).RackService.getInstance();
          await rackService.delete(element.id);
          toast.success("Rack deleted successfully");
          break;
        }
        case "shelf": {
          const shelfService = (
            await import("@/services/domain/farm/ShelfService")
          ).ShelfService.getInstance();
          await shelfService.delete(element.id);
          toast.success("Shelf deleted successfully");
          break;
        }
      }

      // Close modal and trigger callbacks
      setShowDeleteConfirmation(false);
      onClose();
      if (onDelete) onDelete();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Error deleting element:", error);
      toast.error(`Failed to delete ${elementType}`);
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    if (isOpen && element) {
      fetchAvailableDevices();
      fetchAssignedDevices();
    }
  }, [isOpen, element]);

  if (!element) return null;

  const elementName = element.name || `${elementType} ${element.id}`;
  const deviceTypeOptions = getDeviceTypeOptions();
  const contextualTypes = getContextualDeviceTypes();

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-xl font-semibold">
              Configure {elementName}
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="details" className="flex-1 overflow-hidden">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="devices">Device Assignment</TabsTrigger>
            </TabsList>

            <TabsContent
              value="details"
              className="space-y-6 overflow-y-auto max-h-[65vh] p-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label htmlFor="elementName" className="text-sm font-medium">
                    Name
                  </Label>
                  <Input
                    id="elementName"
                    value={elementName}
                    readOnly
                    className="bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="elementType" className="text-sm font-medium">
                    Type
                  </Label>
                  <Input
                    id="elementType"
                    value={
                      elementType.charAt(0).toUpperCase() + elementType.slice(1)
                    }
                    readOnly
                    className="bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="elementId" className="text-sm font-medium">
                  ID
                </Label>
                <Input
                  id="elementId"
                  value={element.id}
                  readOnly
                  className="bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="space-y-4">
                <Label className="text-base font-medium">
                  Assigned Devices
                </Label>
                <div className="space-y-3">
                  {assignedDevices.length > 0 ? (
                    assignedDevices.map((device) => (
                      <div
                        key={device.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          {getDeviceIcon(device.entity_type)}
                          <div>
                            <span className="font-medium">
                              {device.friendly_name || device.entity_id}
                            </span>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {device.entity_type}
                              </Badge>
                              {device.area && (
                                <Badge variant="secondary" className="text-xs">
                                  {device.area}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removeDeviceAssignment(device.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-500 dark:text-slate-400 py-6 text-center text-sm">
                      No devices assigned
                    </p>
                  )}
                </div>
              </div>

              {/* Delete Button */}
              <Separator />
              <div className="pt-4">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-red-900 dark:text-red-100">
                        Delete{" "}
                        {elementType.charAt(0).toUpperCase() +
                          elementType.slice(1)}
                      </h4>
                      <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                        This action cannot be undone and will remove all
                        associated data.
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      onClick={handleDeleteClick}
                      className="flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="devices" className="space-y-4 overflow-hidden">
              <div className="space-y-4 overflow-y-auto max-h-[65vh] p-4">
                {/* Standardized Search and Filter Component */}
                <FarmSearchAndFilter
                  searchValue={searchTerm}
                  onSearchChange={setSearchTerm}
                  searchContext="devices by name or entity ID"
                  searchPlaceholder="Search for devices..."
                  filters={filterDefinitions}
                  activeFilters={getActiveFilterChips(filterDefinitions)}
                  onFilterChange={handleFilterChange}
                  onRemoveFilter={handleRemoveFilter}
                  onClearAllFilters={clearAllFilters}
                  orientation="horizontal"
                  showFilterChips={true}
                />

                {/* Results summary */}
                {availableDevices.length > 0 && (
                  <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                      Showing {filteredDevices.length} of{" "}
                      {availableDevices.length} devices
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
                        Clear filters
                      </Button>
                    )}
                  </div>
                )}

                <Separator />

                {/* Currently Assigned Devices */}
                {assignedDevices.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-semibold">
                        Currently Assigned
                      </h3>
                      <Badge variant="outline">
                        {assignedDevices.length} device(s)
                      </Badge>
                    </div>
                    <div className="space-y-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      {assignedDevices.map((device) => (
                        <div
                          key={device.id}
                          className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-lg border"
                        >
                          <div className="flex items-center gap-3">
                            {getDeviceIcon(device.entity_type)}
                            <div>
                              <p className="font-medium">
                                {device.friendly_name || device.entity_id}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {device.entity_type}
                                </Badge>
                                {device.area && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {device.area}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                /* TODO: Add device control */
                              }}
                            >
                              Control
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => removeDeviceAssignment(device.id)}
                            >
                              Unassign
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Available Devices */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold">
                      Available Devices
                    </h3>
                  </div>

                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {loading ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                          <p className="text-slate-500">Loading devices...</p>
                        </div>
                      </div>
                    ) : filteredDevices.length > 0 ? (
                      filteredDevices.map((device) => (
                        <div
                          key={device.entity_id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            {getDeviceIcon(device.domain)}
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium">
                                  {device.friendly_name || device.entity_id}
                                </p>
                                {getStatusIcon(device.state)}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {device.domain}
                                </Badge>
                                {device.state && device.state !== "unknown" && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {device.state}
                                  </Badge>
                                )}
                                {device.area && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                                  >
                                    📍 {device.area}
                                  </Badge>
                                )}
                                {contextualTypes.includes(device.domain) && (
                                  <Badge
                                    variant="default"
                                    className="text-xs bg-green-100 text-green-800 border-green-300"
                                  >
                                    ⭐ Recommended
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <Button
                            onClick={() => assignDevice(device)}
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 min-w-[80px]"
                            disabled={device.state === "unavailable"}
                          >
                            Assign
                          </Button>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12">
                        <Filter className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                        <p className="text-slate-500 font-medium">
                          {searchTerm
                            ? "No devices found matching your search"
                            : "No devices available"}
                        </p>
                        <p className="text-slate-400 text-sm mt-2">
                          Try adjusting your filters or search terms
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={showDeleteConfirmation}
        onOpenChange={setShowDeleteConfirmation}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete{" "}
              {elementType.charAt(0).toUpperCase() + elementType.slice(1)}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{elementName}"? This action
              cannot be undone.
              {elementType === "row" &&
                " All racks and shelves in this row will also be deleted."}
              {elementType === "rack" &&
                " All shelves in this rack will also be deleted."}
              {elementType === "shelf" &&
                " All device assignments for this shelf will be removed."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ElementDetailModal;
