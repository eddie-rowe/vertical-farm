import { MapPin, Plus, Search, Info, Edit, Trash2 } from "lucide-react";
import React, { useState, useMemo, useCallback } from "react";
import { toast } from "react-hot-toast";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { FilterDefinition } from "@/components/ui/farm-search-and-filter";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useFarmSearch, useFarmFilters, useFarmHierarchy } from "@/hooks";
import { DeviceAssignment } from "@/types/device-assignment";

interface AssignmentTabProps {
  assignments: DeviceAssignment[];
  onRefresh: () => void;
}

export const AssignmentTab: React.FC<AssignmentTabProps> = ({
  assignments,
  onRefresh,
}) => {
  // Use real farm hierarchy data from services
  const {
    farms,
    isLoading: isLoadingHierarchy,
    getRowsByFarm,
    getRacksByRow,
    getShelvesByRack,
    getLocationBreadcrumb,
  } = useFarmHierarchy();
  // Standardized search and filter hooks
  const {
    searchTerm,
    setSearchTerm,
    clearSearch,
    hasSearch,
    filterItems: searchFilterItems,
  } = useFarmSearch<DeviceAssignment>({
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
  } = useFarmFilters<DeviceAssignment>();

  // Additional filter states
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [deviceTypeFilter, setDeviceTypeFilter] = useState<string>("all");

  // Dialog and form states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingAssignment, setEditingAssignment] =
    useState<DeviceAssignment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state for creating/editing assignments
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [selectedFarm, setSelectedFarm] = useState<string>("");
  const [selectedRow, setSelectedRow] = useState<string>("");
  const [selectedRack, setSelectedRack] = useState<string>("");
  const [selectedShelf, setSelectedShelf] = useState<string>("");

  // Mock data for devices - in real app this would come from props or API
  const importedDevices = [
    {
      entity_id: "light.grow_light_1",
      name: "Grow Light 1",
      device_type: "light",
    },
    {
      entity_id: "switch.irrigation_pump",
      name: "Irrigation Pump",
      device_type: "switch",
    },
    {
      entity_id: "fan.exhaust_fan_1",
      name: "Exhaust Fan 1",
      device_type: "fan",
    },
  ];

  // Calculate unassigned devices
  const unassignedDevices = useMemo(() => {
    const assignedEntityIds = new Set(assignments.map((a) => a.entity_id));
    return importedDevices.filter(
      (device) => !assignedEntityIds.has(device.entity_id),
    );
  }, [assignments]);

  // Handler functions
  const onCreateAssignment = async (
    assignment: Omit<DeviceAssignment, "id" | "created_at" | "updated_at">,
  ) => {
    try {
      // In real app, call the API service
      // await deviceAssignmentService.createAssignment(assignment);
      toast.success("Assignment created successfully");
      onRefresh();
    } catch (error) {
      toast.error("Failed to create assignment");
      console.error("Create assignment error:", error);
    }
  };

  const onUpdateAssignment = async (assignment: DeviceAssignment) => {
    try {
      // In real app, call the API service
      // await deviceAssignmentService.updateAssignment(assignment);
      toast.success("Assignment updated successfully");
      onRefresh();
    } catch (error) {
      toast.error("Failed to update assignment");
      console.error("Update assignment error:", error);
    }
  };

  const onDeleteAssignment = async (entityId: string) => {
    try {
      // In real app, call the API service
      // await deviceAssignmentService.deleteAssignment(entityId);
      toast.success("Assignment deleted successfully");
      onRefresh();
    } catch (error) {
      toast.error("Failed to delete assignment");
      console.error("Delete assignment error:", error);
    }
  };

  // Get unique device types for filter
  const deviceTypes = useMemo(() => {
    const types = new Set(assignments.map((a) => a.entity_type));
    return Array.from(types).sort();
  }, [assignments]);

  // Filter definitions for FarmSearchAndFilter
  const filterDefinitions: FilterDefinition[] = useMemo(
    () => [
      {
        id: "farm_id",
        label: "Farm Location",
        placeholder: "Filter by farm",
        options: [
          { value: "all", label: "All Farms" },
          ...farms
            .filter((farm) => farm.id)
            .map((farm) => ({
              value: farm.id!,
              label: farm.name,
            })),
        ],
        defaultValue: "all",
      },
      {
        id: "entity_type",
        label: "Device Type",
        placeholder: "Filter by device type",
        options: [
          { value: "all", label: "All Types" },
          ...deviceTypes.map((type) => ({
            value: type,
            label: type.charAt(0).toUpperCase() + type.slice(1),
          })),
        ],
        defaultValue: "all",
      },
    ],
    [farms, deviceTypes],
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

  // Apply combined filtering using standardized hooks
  const filteredAssignments = useMemo(() => {
    let result = assignments;

    // Apply search filtering
    result = searchFilterItems(result);

    // Apply standard filters
    result = filterFilterItems(result);

    return result;
  }, [assignments, searchFilterItems, filterFilterItems]);

  // Get filtered rows based on selected farm
  const availableRows = useMemo(() => {
    return selectedFarm ? getRowsByFarm(selectedFarm) : [];
  }, [selectedFarm, getRowsByFarm]);

  // Get filtered racks based on selected row
  const availableRacks = useMemo(() => {
    return selectedRow ? getRacksByRow(selectedRow) : [];
  }, [selectedRow, getRacksByRow]);

  // Get filtered shelves based on selected rack
  const availableShelves = useMemo(() => {
    return selectedRack ? getShelvesByRack(selectedRack) : [];
  }, [selectedRack, getShelvesByRack]);

  const resetForm = () => {
    setSelectedDevice("");
    setSelectedFarm("");
    setSelectedRow("");
    setSelectedRack("");
    setSelectedShelf("");
    setEditingAssignment(null);
  };

  const handleCreateAssignment = async () => {
    if (!selectedDevice || !selectedFarm) return;

    setIsSubmitting(true);
    try {
      const device = importedDevices.find(
        (d) => d.entity_id === selectedDevice,
      );
      if (!device) return;

      const assignment: Omit<
        DeviceAssignment,
        "id" | "created_at" | "updated_at"
      > = {
        entity_id: device.entity_id,
        entity_type: device.device_type,
        friendly_name: device.name,
        farm_id: selectedFarm,
        row_id: selectedRow || undefined,
        rack_id: selectedRack || undefined,
        shelf_id: selectedShelf || undefined,
      };

      await onCreateAssignment(assignment);
      setShowCreateDialog(false);
      resetForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditAssignment = (assignment: DeviceAssignment) => {
    setEditingAssignment(assignment);
    setSelectedDevice(assignment.entity_id);
    setSelectedFarm(assignment.farm_id || "");
    setSelectedRow(assignment.row_id || "");
    setSelectedRack(assignment.rack_id || "");
    setSelectedShelf(assignment.shelf_id || "");
    setShowCreateDialog(true);
  };

  const handleUpdateAssignment = async () => {
    if (!editingAssignment || !selectedDevice || !selectedFarm) return;

    setIsSubmitting(true);
    try {
      const updatedAssignment: DeviceAssignment = {
        ...editingAssignment,
        farm_id: selectedFarm,
        row_id: selectedRow || undefined,
        rack_id: selectedRack || undefined,
        shelf_id: selectedShelf || undefined,
      };

      await onUpdateAssignment(updatedAssignment);
      setShowCreateDialog(false);
      resetForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Use the hook's getLocationBreadcrumb for assignment display
  const getAssignmentLocationBreadcrumb = useCallback(
    (assignment: DeviceAssignment) => {
      return getLocationBreadcrumb({
        farmId: assignment.farm_id,
        rowId: assignment.row_id,
        rackId: assignment.rack_id,
        shelfId: assignment.shelf_id,
      });
    },
    [getLocationBreadcrumb]
  );

  const getLocationIcon = () => {
    return MapPin;
  };

  return (
    <div className="space-y-6">
      {/* Header with Create Assignment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="w-5 h-5" />
            <span>Device Assignments</span>
          </CardTitle>
          <CardDescription>
            Assign imported devices to specific farm locations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-2">
              <Badge
                variant="outline"
                className="text-orange-600 border-orange-200"
              >
                {assignments.length} assignments
              </Badge>
              <Badge
                variant="outline"
                className="text-gray-600 border-gray-200"
              >
                {unassignedDevices.length} unassigned devices
              </Badge>
            </div>

            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button
                  className="flex items-center space-x-2 bg-orange-600 hover:bg-orange-700"
                  disabled={unassignedDevices.length === 0}
                  onClick={resetForm}
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Assignment</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingAssignment
                      ? "Edit Assignment"
                      : "Create Device Assignment"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingAssignment
                      ? "Update the location assignment for this device"
                      : "Assign an imported device to a farm location"}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  {/* Device Selection */}
                  <div className="space-y-2">
                    <Label>Device</Label>
                    <Select
                      value={selectedDevice}
                      onValueChange={setSelectedDevice}
                      disabled={!!editingAssignment}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a device" />
                      </SelectTrigger>
                      <SelectContent>
                        {(editingAssignment
                          ? importedDevices
                          : unassignedDevices
                        ).map((device) => (
                          <SelectItem
                            key={device.entity_id}
                            value={device.entity_id}
                          >
                            <div className="flex items-center space-x-2">
                              <span>{device.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {device.device_type}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Farm Selection */}
                  <div className="space-y-2">
                    <Label>Farm *</Label>
                    <Select
                      value={selectedFarm}
                      onValueChange={setSelectedFarm}
                      disabled={isLoadingHierarchy}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={isLoadingHierarchy ? "Loading farms..." : farms.length === 0 ? "No farms configured" : "Select a farm"} />
                      </SelectTrigger>
                      <SelectContent>
                        {farms.filter((farm) => farm.id).map((farm) => (
                          <SelectItem key={farm.id} value={farm.id!}>
                            {farm.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {!isLoadingHierarchy && farms.length === 0 && (
                      <p className="text-xs text-muted-foreground">
                        No farms configured. Create a farm first.
                      </p>
                    )}
                  </div>

                  {/* Row Selection */}
                  <div className="space-y-2">
                    <Label>Row (Optional)</Label>
                    <Select
                      value={selectedRow}
                      onValueChange={setSelectedRow}
                      disabled={!selectedFarm}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a row" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {availableRows.filter((row) => row.id).map((row) => (
                          <SelectItem key={row.id} value={row.id!}>
                            {row.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Rack Selection */}
                  <div className="space-y-2">
                    <Label>Rack (Optional)</Label>
                    <Select
                      value={selectedRack}
                      onValueChange={setSelectedRack}
                      disabled={!selectedRow}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a rack" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {availableRacks.filter((rack) => rack.id).map((rack) => (
                          <SelectItem key={rack.id} value={rack.id!}>
                            {rack.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Shelf Selection */}
                  <div className="space-y-2">
                    <Label>Shelf (Optional)</Label>
                    <Select
                      value={selectedShelf}
                      onValueChange={setSelectedShelf}
                      disabled={!selectedRack}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a shelf" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {availableShelves.filter((shelf) => shelf.id).map((shelf) => (
                          <SelectItem key={shelf.id} value={shelf.id!}>
                            {shelf.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowCreateDialog(false);
                        resetForm();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={
                        editingAssignment
                          ? handleUpdateAssignment
                          : handleCreateAssignment
                      }
                      disabled={
                        !selectedDevice || !selectedFarm || isSubmitting
                      }
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      {isSubmitting
                        ? "Saving..."
                        : editingAssignment
                          ? "Update"
                          : "Create"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <Label htmlFor="search">Search Assignments</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by device or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Location Filter */}
            <div className="space-y-2">
              <Label>Farm Location</Label>
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {farms.filter((farm) => farm.id).map((farm) => (
                    <SelectItem key={farm.id} value={farm.id!}>
                      {farm.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Device Type Filter */}
            <div className="space-y-2">
              <Label>Device Type</Label>
              <Select
                value={deviceTypeFilter}
                onValueChange={setDeviceTypeFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {deviceTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assignments Table */}
      <Card>
        <CardContent className="p-0">
          {filteredAssignments.length === 0 ? (
            <div className="p-8 text-center">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  {assignments.length === 0
                    ? "No device assignments created yet. Create an assignment to get started."
                    : "No assignments match your current filters."}
                </AlertDescription>
              </Alert>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Device</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Assigned By</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssignments.map((assignment) => {
                  const LocationIcon = getLocationIcon();

                  return (
                    <TableRow key={assignment.entity_id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {assignment.friendly_name || assignment.entity_id}
                          </p>
                          <p className="text-xs text-gray-500">
                            {assignment.entity_id}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {assignment.entity_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <LocationIcon className="w-4 h-4 text-orange-600" />
                          <span className="text-sm">
                            {getAssignmentLocationBreadcrumb(assignment)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-500">
                          {assignment.assigned_by || "System"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-500">
                          {assignment.created_at
                            ? new Date(
                                assignment.created_at,
                              ).toLocaleDateString()
                            : "Unknown"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditAssignment(assignment)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              onDeleteAssignment(assignment.entity_id)
                            }
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
