import React, { useState, useMemo } from 'react';
import { 
  MapPin, 
  Search, 
  Plus, 
  Trash2, 
  Edit, 
  Building, 
  Grid3x3, 
  Layers, 
  Package,
  AlertCircle,
  CheckCircle,
  Info,
  Filter
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { DeviceAssignment, ImportedDevice } from '@/services/homeAssistantService';

interface AssignmentTabProps {
  assignments: DeviceAssignment[];
  importedDevices: ImportedDevice[];
  isLoading: boolean;
  onCreateAssignment: (assignment: Omit<DeviceAssignment, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onUpdateAssignment: (assignment: DeviceAssignment) => Promise<void>;
  onDeleteAssignment: (entityId: string) => Promise<void>;
}

// Mock farm structure data - in real app this would come from props or API
const mockFarms = [
  { id: '1', name: 'Main Greenhouse' },
  { id: '2', name: 'Secondary Greenhouse' },
];

const mockRows = [
  { id: '1', name: 'Row A', farm_id: '1' },
  { id: '2', name: 'Row B', farm_id: '1' },
  { id: '3', name: 'Row A', farm_id: '2' },
];

const mockRacks = [
  { id: '1', name: 'Rack 1', row_id: '1' },
  { id: '2', name: 'Rack 2', row_id: '1' },
  { id: '3', name: 'Rack 1', row_id: '2' },
  { id: '4', name: 'Rack 1', row_id: '3' },
];

const mockShelves = [
  { id: '1', name: 'Shelf A', rack_id: '1' },
  { id: '2', name: 'Shelf B', rack_id: '1' },
  { id: '3', name: 'Shelf A', rack_id: '2' },
  { id: '4', name: 'Shelf A', rack_id: '3' },
  { id: '5', name: 'Shelf A', rack_id: '4' },
];

export const AssignmentTab: React.FC<AssignmentTabProps> = ({
  assignments,
  importedDevices,
  isLoading,
  onCreateAssignment,
  onUpdateAssignment,
  onDeleteAssignment
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [deviceTypeFilter, setDeviceTypeFilter] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<DeviceAssignment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state for creating/editing assignments
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [selectedFarm, setSelectedFarm] = useState<string>('');
  const [selectedRow, setSelectedRow] = useState<string>('');
  const [selectedRack, setSelectedRack] = useState<string>('');
  const [selectedShelf, setSelectedShelf] = useState<string>('');

  // Get unassigned devices for assignment creation
  const unassignedDevices = useMemo(() => {
    const assignedEntityIds = new Set(assignments.map(a => a.entity_id));
    return importedDevices.filter(device => !assignedEntityIds.has(device.entity_id));
  }, [importedDevices, assignments]);

  // Get unique device types for filter
  const deviceTypes = useMemo(() => {
    const types = new Set(assignments.map(a => a.entity_type));
    return Array.from(types).sort();
  }, [assignments]);

  // Filter assignments based on search and filters
  const filteredAssignments = useMemo(() => {
    return assignments.filter(assignment => {
      const matchesSearch = !searchTerm || 
        assignment.friendly_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.entity_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.farm_name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesLocation = locationFilter === 'all' || assignment.farm_id === locationFilter;
      
      const matchesType = deviceTypeFilter === 'all' || assignment.entity_type === deviceTypeFilter;
      
      return matchesSearch && matchesLocation && matchesType;
    });
  }, [assignments, searchTerm, locationFilter, deviceTypeFilter]);

  // Get filtered rows based on selected farm
  const availableRows = useMemo(() => {
    return selectedFarm ? mockRows.filter(row => row.farm_id === selectedFarm) : [];
  }, [selectedFarm]);

  // Get filtered racks based on selected row
  const availableRacks = useMemo(() => {
    return selectedRow ? mockRacks.filter(rack => rack.row_id === selectedRow) : [];
  }, [selectedRow]);

  // Get filtered shelves based on selected rack
  const availableShelves = useMemo(() => {
    return selectedRack ? mockShelves.filter(shelf => shelf.rack_id === selectedRack) : [];
  }, [selectedRack]);

  const resetForm = () => {
    setSelectedDevice('');
    setSelectedFarm('');
    setSelectedRow('');
    setSelectedRack('');
    setSelectedShelf('');
    setEditingAssignment(null);
  };

  const handleCreateAssignment = async () => {
    if (!selectedDevice || !selectedFarm) return;

    setIsSubmitting(true);
    try {
      const device = importedDevices.find(d => d.entity_id === selectedDevice);
      if (!device) return;

      const assignment: Omit<DeviceAssignment, 'id' | 'created_at' | 'updated_at'> = {
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
    setSelectedFarm(assignment.farm_id || '');
    setSelectedRow(assignment.row_id || '');
    setSelectedRack(assignment.rack_id || '');
    setSelectedShelf(assignment.shelf_id || '');
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

  const getLocationBreadcrumb = (assignment: DeviceAssignment) => {
    const parts = [];
    if (assignment.farm_name) parts.push(assignment.farm_name);
    if (assignment.row_name) parts.push(assignment.row_name);
    if (assignment.rack_name) parts.push(assignment.rack_name);
    if (assignment.shelf_name) parts.push(assignment.shelf_name);
    return parts.join(' > ') || 'Unassigned';
  };

  const getLocationIcon = (assignment: DeviceAssignment) => {
    if (assignment.shelf_id) return Package;
    if (assignment.rack_id) return Layers;
    if (assignment.row_id) return Grid3x3;
    if (assignment.farm_id) return Building;
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
              <Badge variant="outline" className="text-orange-600 border-orange-200">
                {assignments.length} assignments
              </Badge>
              <Badge variant="outline" className="text-gray-600 border-gray-200">
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
                    {editingAssignment ? 'Edit Assignment' : 'Create Device Assignment'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingAssignment 
                      ? 'Update the location assignment for this device'
                      : 'Assign an imported device to a farm location'
                    }
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
                        {(editingAssignment ? importedDevices : unassignedDevices).map(device => (
                          <SelectItem key={device.entity_id} value={device.entity_id}>
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
                    <Select value={selectedFarm} onValueChange={setSelectedFarm}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a farm" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockFarms.map(farm => (
                          <SelectItem key={farm.id} value={farm.id}>
                            {farm.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                        {availableRows.map(row => (
                          <SelectItem key={row.id} value={row.id}>
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
                        {availableRacks.map(rack => (
                          <SelectItem key={rack.id} value={rack.id}>
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
                        {availableShelves.map(shelf => (
                          <SelectItem key={shelf.id} value={shelf.id}>
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
                      onClick={editingAssignment ? handleUpdateAssignment : handleCreateAssignment}
                      disabled={!selectedDevice || !selectedFarm || isSubmitting}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      {isSubmitting ? 'Saving...' : (editingAssignment ? 'Update' : 'Create')}
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
                  {mockFarms.map(farm => (
                    <SelectItem key={farm.id} value={farm.id}>
                      {farm.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Device Type Filter */}
            <div className="space-y-2">
              <Label>Device Type</Label>
              <Select value={deviceTypeFilter} onValueChange={setDeviceTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {deviceTypes.map(type => (
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
                    ? 'No device assignments created yet. Create an assignment to get started.'
                    : 'No assignments match your current filters.'
                  }
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
                  const LocationIcon = getLocationIcon(assignment);
                  
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
                            {getLocationBreadcrumb(assignment)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-500">
                          {assignment.assigned_by || 'System'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-500">
                          {assignment.created_at 
                            ? new Date(assignment.created_at).toLocaleDateString()
                            : 'Unknown'
                          }
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
                            onClick={() => onDeleteAssignment(assignment.entity_id)}
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