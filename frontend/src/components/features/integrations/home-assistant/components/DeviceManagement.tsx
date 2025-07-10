'use client';

import { FC, useState, useEffect, useRef } from 'react';
import { 
  FaSearch, FaFilter, FaLightbulb, FaToggleOn, FaThermometerHalf, FaCheckCircle, FaCircle,
  FaDownload, FaMapPin, FaPlay, FaStop, FaEye, FaEyeSlash, FaExpandAlt, FaList, FaTh
} from 'react-icons/fa';
import { X, Grid, List, LayoutGrid } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FarmControlButton } from '@/components/ui/farm-control-button';
import { FarmInput } from '@/components/ui/farm-input';
import { Label } from '@/components/ui/label';
import { DeviceCard } from './DeviceCard';
import { 
  HADevice, 
  HAAssignment, 
  HAImportedDevice, 
  FilterChip, 
  ViewType,
  DeviceStats,
  DeviceFilterSettings
} from '@/types/integrations/homeassistant';

interface DeviceManagementProps {
  devices: HADevice[];
  assignments: HAAssignment[];
  importedDevices: HAImportedDevice[];
  loading: boolean;
  onDiscoverDevices: () => void;
  onDeviceControl: (device: HADevice, action: 'turn_on' | 'turn_off' | 'toggle') => void;
  onImportDevice: (device: HADevice) => void;
  onAssignDevice: (device: HADevice) => void;
  onBulkImport: (devices: HADevice[]) => void;
  onBulkControl: (devices: HADevice[], action: 'turn_on' | 'turn_off') => void;
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
  // Filter and search state
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<FilterChip[]>([]);
  const [deviceFilter, setDeviceFilter] = useState<string>('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [viewType, setViewType] = useState<ViewType>('grid');

  // Bulk selection state
  const [selectedDevices, setSelectedDevices] = useState<Set<string>>(new Set());
  const [bulkSelectMode, setBulkSelectMode] = useState(false);

  // Filter menu ref for click outside
  const filterMenuRef = useRef<HTMLDivElement>(null);

  // Filter management
  const addFilter = (filter: FilterChip) => {
    const exists = activeFilters.some(f => f.id === filter.id);
    if (!exists) {
      setActiveFilters(prev => [...prev, filter]);
    }
    setShowFilterMenu(false);
  };

  const removeFilter = (filterId: string) => {
    setActiveFilters(prev => prev.filter(f => f.id !== filterId));
  };

  const clearAllFilters = () => {
    setActiveFilters([]);
    setSearchTerm('');
    setDeviceFilter('all');
  };

  // Device selection management
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
    const filteredDevices = getFilteredDevices(devices);
    setSelectedDevices(new Set(filteredDevices.map(d => d.entity_id)));
  };

  const clearSelection = () => {
    setSelectedDevices(new Set());
    setBulkSelectMode(false);
  };

  // Get filtered devices based on search and filters
  const getFilteredDevices = (devices: HADevice[]) => {
    let filtered = devices;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(device => 
        device.friendly_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.entity_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.domain.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply active filters
    activeFilters.forEach(filter => {
      switch (filter.type) {
        case 'status':
          filtered = filtered.filter(device => device.state === filter.value);
          break;
        case 'type':
          filtered = filtered.filter(device => device.domain === filter.value);
          break;
        case 'assignment':
          if (filter.value === 'assigned') {
            filtered = filtered.filter(device => 
              assignments.some(a => a.entity_id === device.entity_id)
            );
          } else if (filter.value === 'unassigned') {
            filtered = filtered.filter(device => 
              !assignments.some(a => a.entity_id === device.entity_id)
            );
          }
          break;
      }
    });

    return filtered;
  };

  // Get device statistics
  const getDeviceStats = (): DeviceStats => {
    const total = devices.length;
    const assigned = assignments.length;
    const active = devices.filter(d => d.state === 'on').length;
    return { total, assigned, active, unassigned: total - assigned };
  };

  // Bulk operations
  const handleBulkImport = () => {
    const devicesToImport = devices.filter(d => selectedDevices.has(d.entity_id));
    onBulkImport(devicesToImport);
    clearSelection();
  };

  const handleBulkControl = (action: 'turn_on' | 'turn_off') => {
    const devicesToControl = devices.filter(d => selectedDevices.has(d.entity_id));
    onBulkControl(devicesToControl, action);
    clearSelection();
  };

  // Close filter menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterMenuRef.current && !filterMenuRef.current.contains(event.target as Node)) {
        setShowFilterMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredDevices = getFilteredDevices(devices);
  const deviceStats = getDeviceStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Device Management</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Discover, import, and control your Home Assistant devices
          </p>
        </div>
        <FarmControlButton onClick={onDiscoverDevices} disabled={loading}>
          <FaSearch className="h-4 w-4 mr-2" />
          Discover Devices
        </FarmControlButton>
      </div>

      {/* Device Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{deviceStats.total}</div>
            <div className="text-sm text-gray-500">Total Devices</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{deviceStats.active}</div>
            <div className="text-sm text-gray-500">Active</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{deviceStats.assigned}</div>
            <div className="text-sm text-gray-500">Assigned</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-600">{deviceStats.unassigned}</div>
            <div className="text-sm text-gray-500">Unassigned</div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Device filters */}
      <Card>
        <CardContent className="p-4 space-y-4">
          {/* Search and filter controls */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <FarmInput
                  placeholder="Search devices by name, type, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 min-h-[44px]"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              {/* View type toggles */}
              <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                <FarmControlButton
                  variant={viewType === 'grid' ? 'primary' : 'default'}
                  size="sm"
                  className="rounded-none border-0"
                  onClick={() => setViewType('grid')}
                >
                  <LayoutGrid className="h-4 w-4" />
                </FarmControlButton>
                <FarmControlButton
                  variant={viewType === 'list' ? 'primary' : 'default'}
                  size="sm"
                  className="rounded-none border-0"
                  onClick={() => setViewType('list')}
                >
                  <List className="h-4 w-4" />
                </FarmControlButton>
              </div>

              {/* Bulk select toggle */}
              <FarmControlButton
                variant={bulkSelectMode ? 'primary' : 'default'}
                onClick={() => setBulkSelectMode(!bulkSelectMode)}
                className="min-h-[44px] px-4"
              >
                {bulkSelectMode ? <FaEyeSlash className="h-4 w-4" /> : <FaEye className="h-4 w-4" />}
              </FarmControlButton>

              {/* Quick filter dropdown */}
              <div className="relative" ref={filterMenuRef}>
                <FarmControlButton
                  variant="default"
                  onClick={() => setShowFilterMenu(!showFilterMenu)}
                  className="min-h-[44px] px-4"
                >
                  <FaFilter className="h-4 w-4 mr-2" />
                  Filter
                  {activeFilters.length > 0 && (
                    <Badge variant="default" className="ml-2 text-xs">
                      {activeFilters.length}
                    </Badge>
                  )}
                </FarmControlButton>
                
                {/* Filter dropdown menu */}
                {showFilterMenu && (
                  <div className="absolute right-0 top-full mt-1 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                    <div className="p-3 space-y-3">
                      <div>
                        <Label className="text-sm font-medium">Status</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          <FarmControlButton
                            size="sm"
                            variant="default"
                            className="h-7 text-xs"
                            onClick={() => addFilter({
                              id: 'status-on',
                              label: 'Active',
                              type: 'status',
                              value: 'on'
                            })}
                          >
                            Active
                          </FarmControlButton>
                          <FarmControlButton
                            size="sm"
                            variant="default"
                            className="h-7 text-xs"
                            onClick={() => addFilter({
                              id: 'status-off',
                              label: 'Inactive',
                              type: 'status',
                              value: 'off'
                            })}
                          >
                            Inactive
                          </FarmControlButton>
                          <FarmControlButton
                            size="sm"
                            variant="default"
                            className="h-7 text-xs"
                            onClick={() => addFilter({
                              id: 'status-unavailable',
                              label: 'Unavailable',
                              type: 'status',
                              value: 'unavailable'
                            })}
                          >
                            Unavailable
                          </FarmControlButton>
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium">Device Type</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          <FarmControlButton
                            size="sm"
                            variant="default"
                            className="h-7 text-xs"
                            onClick={() => addFilter({
                              id: 'type-light',
                              label: 'Lights',
                              type: 'type',
                              value: 'light'
                            })}
                          >
                            <FaLightbulb className="h-3 w-3 mr-1" />
                            Lights
                          </FarmControlButton>
                          <FarmControlButton
                            size="sm"
                            variant="default"
                            className="h-7 text-xs"
                            onClick={() => addFilter({
                              id: 'type-switch',
                              label: 'Switches',
                              type: 'type',
                              value: 'switch'
                            })}
                          >
                            <FaToggleOn className="h-3 w-3 mr-1" />
                            Switches
                          </FarmControlButton>
                          <FarmControlButton
                            size="sm"
                            variant="default"
                            className="h-7 text-xs"
                            onClick={() => addFilter({
                              id: 'type-sensor',
                              label: 'Sensors',
                              type: 'type',
                              value: 'sensor'
                            })}
                          >
                            <FaThermometerHalf className="h-3 w-3 mr-1" />
                            Sensors
                          </FarmControlButton>
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium">Assignment</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          <FarmControlButton
                            size="sm"
                            variant="default"
                            className="h-7 text-xs"
                            onClick={() => addFilter({
                              id: 'assignment-assigned',
                              label: 'Assigned',
                              type: 'assignment',
                              value: 'assigned'
                            })}
                          >
                            <FaCheckCircle className="h-3 w-3 mr-1" />
                            Assigned
                          </FarmControlButton>
                          <FarmControlButton
                            size="sm"
                            variant="default"
                            className="h-7 text-xs"
                            onClick={() => addFilter({
                              id: 'assignment-unassigned',
                              label: 'Unassigned',
                              type: 'assignment',
                              value: 'unassigned'
                            })}
                          >
                            <FaCircle className="h-3 w-3 mr-1" />
                            Unassigned
                          </FarmControlButton>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Clear filters button */}
              {(activeFilters.length > 0 || searchTerm || deviceFilter !== 'all') && (
                <FarmControlButton
                  variant="default"
                  onClick={clearAllFilters}
                  className="min-h-[44px] px-4"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear
                </FarmControlButton>
              )}
            </div>
          </div>

          {/* Active filter chips */}
          {activeFilters.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400 self-center">
                Active filters:
              </span>
              {activeFilters.map(filter => (
                <Badge
                  key={filter.id}
                  variant="default"
                  className="flex items-center gap-1 cursor-pointer hover:bg-gray-200"
                  onClick={() => removeFilter(filter.id)}
                >
                  {filter.label}
                  <X className="h-3 w-3" />
                </Badge>
              ))}
            </div>
          )}

          {/* Bulk operations */}
          {bulkSelectMode && (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {selectedDevices.size} selected
              </span>
              <FarmControlButton
                size="sm"
                variant="default"
                onClick={selectAllDevices}
              >
                Select All
              </FarmControlButton>
              <FarmControlButton
                size="sm"
                variant="default"
                onClick={clearSelection}
              >
                Clear
              </FarmControlButton>
              {selectedDevices.size > 0 && (
                <>
                  <FarmControlButton
                    size="sm"
                    variant="default"
                    onClick={handleBulkImport}
                  >
                    <FaDownload className="h-3 w-3 mr-1" />
                    Import Selected
                  </FarmControlButton>
                  <FarmControlButton
                    size="sm"
                    variant="default"
                    onClick={() => handleBulkControl('turn_on')}
                  >
                    <FaPlay className="h-3 w-3 mr-1" />
                    Turn On
                  </FarmControlButton>
                  <FarmControlButton
                    size="sm"
                    variant="default"
                    onClick={() => handleBulkControl('turn_off')}
                  >
                    <FaStop className="h-3 w-3 mr-1" />
                    Turn Off
                  </FarmControlButton>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Device Grid */}
      <div className={`grid gap-4 ${viewType === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
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
            <h3 className="font-semibold text-content mb-2">No devices found</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {searchTerm || activeFilters.length > 0
                ? "Try adjusting your search or filters"
                : "Start by discovering devices from your Home Assistant instance"
              }
            </p>
            {(!searchTerm && activeFilters.length === 0) && (
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