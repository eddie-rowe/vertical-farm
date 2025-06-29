'use client';

import { useState, useEffect } from 'react';
import { 
  FaHome, FaCheck, FaExclamationTriangle, FaPlug, FaLightbulb, FaFan, 
  FaThermometerHalf, FaDownload, FaFilter, FaSearch, FaCog, FaMapPin,
  FaCheckCircle, FaCircle, FaEdit, FaTrash, FaClock, FaToggleOn, 
  FaSun, FaMoon, FaList, FaTh, FaMap, FaLayerGroup, FaCheckSquare
} from 'react-icons/fa';
import { 
  Activity, Settings, Zap, Users, Clock, Wifi, MapPin, ChevronRight, X
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  homeAssistantService, 
  HADevice, 
  HAConfig, 
  HAConnectionStatus, 
  DeviceAssignment,
  ImportedDevice,
  ImportDevicesRequest 
} from '@/services/homeAssistantService';
import { useRealtime } from '@/context/RealtimeContext';

// Connection states for progressive disclosure
type ConnectionState = 'not-configured' | 'connecting' | 'connected' | 'error';

// Filter types for enhanced filtering
type FilterChip = {
  id: string;
  label: string;
  type: 'status' | 'type' | 'assignment';
  value: string;
};

// View types for device management
type ViewType = 'grid' | 'list' | 'farm';

export default function HomeAssistantPage() {
  // Real-time connection status
  const { isConnected: realtimeConnected } = useRealtime();
  const { toast } = useToast();

  // Core state management
  const [connectionState, setConnectionState] = useState<ConnectionState>('not-configured');
  const [config, setConfig] = useState<HAConfig>({ url: '', token: '', enabled: false, name: '' });
  const [status, setStatus] = useState<HAConnectionStatus>({ connected: false });
  const [loading, setLoading] = useState(true);

  // Device management state
  const [discoveredDevices, setDiscoveredDevices] = useState<HADevice[]>([]);
  const [importedDevices, setImportedDevices] = useState<ImportedDevice[]>([]);
  const [assignments, setAssignments] = useState<DeviceAssignment[]>([]);
  const [deviceFilter, setDeviceFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDevices, setSelectedDevices] = useState<Set<string>>(new Set());

  // Enhanced filtering state
  const [activeFilters, setActiveFilters] = useState<FilterChip[]>([]);
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  // View and bulk operations state
  const [currentView, setCurrentView] = useState<ViewType>('grid');
  const [viewType, setViewType] = useState<'grid' | 'list'>('grid');
  const [bulkSelectMode, setBulkSelectMode] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Setup wizard state
  const [setupStep, setSetupStep] = useState<'connection' | 'test' | 'discovery' | 'complete'>('connection');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // Assignment modal state
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<HADevice | null>(null);
  const [assignmentForm, setAssignmentForm] = useState({
    farm_id: 'farm_1',
    row_id: '',
    rack_id: '',
    shelf_id: ''
  });

  // Tab state management
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Watch for selected devices changes to show/hide bulk actions
  useEffect(() => {
    setShowBulkActions(selectedDevices.size > 0);
  }, [selectedDevices]);

  // Load initial data and determine connection state
  useEffect(() => {
    loadInitialData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Close filter menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showFilterMenu && !(event.target as Element).closest('.relative')) {
        setShowFilterMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFilterMenu]);

  const loadInitialData = async () => {
    try {
      setLoading(true);

      // Load configuration
      const configData = await homeAssistantService.getConfig();
      console.log('Home Assistant config data:', configData);
      
      if (configData && configData.url) {
        // We have a configuration, set it and check connection status
        setConfig(configData);
        
        // Check connection status
        const statusData = await homeAssistantService.getStatus();
        console.log('Home Assistant status data:', statusData);
        setStatus(statusData);
        setConnectionState(statusData.connected ? 'connected' : 'error');

        if (statusData.connected) {
          // Load device data for connected state
          await loadDeviceData();
        }
      } else {
        // No configuration found, show setup wizard
        console.log('No Home Assistant configuration found, showing setup wizard');
        setConnectionState('not-configured');
      }
    } catch (err) {
      console.error('Error loading initial data:', err);
      setConnectionState('error');
    } finally {
      setLoading(false);
    }
  };

  const loadDeviceData = async () => {
    try {
      const [assignmentsData, importedDevicesData] = await Promise.all([
        homeAssistantService.getAssignments(),
        homeAssistantService.getImportedDevices()
      ]);
      setAssignments(assignmentsData);
      setImportedDevices(importedDevicesData);
    } catch (err) {
      console.error('Error loading device data:', err);
    }
  };

  // Setup wizard handlers
  const handleTestConnection = async () => {
    if (!config.url || !config.token) return;

    setIsConnecting(true);
    setConnectionError(null);
    
    try {
      const result = await homeAssistantService.testConnection(config.url, config.token);
      if (result.connected) {
        setSetupStep('discovery');
      } else {
        setConnectionError(result.error || 'Connection test failed');
      }
    } catch (error) {
      setConnectionError(error instanceof Error ? error.message : 'Connection test failed');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSaveConfiguration = async () => {
    if (!config.name || !config.url || !config.token) return;

    setIsSaving(true);
    setConnectionError(null);
    setSaveSuccess(null);
    
    try {
      await homeAssistantService.saveConfig(config);
      setSaveSuccess('Configuration saved successfully!');
      setConnectionState('connected');
      setSetupStep('complete');
      
      // Reload data after successful save
      await loadInitialData();
    } catch (error) {
      setConnectionError(error instanceof Error ? error.message : 'Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscoverDevices = async () => {
    try {
      setLoading(true);
      const devices = await homeAssistantService.discoverDevices();
      setDiscoveredDevices(devices);
      // Switch to devices tab to show the discovered devices
      setActiveTab('devices');
    } catch (error) {
      console.error('Failed to discover devices:', error);
    } finally {
      setLoading(false);
    }
  };

  // Device management handlers
  const handleDeviceControl = async (device: HADevice, action: 'turn_on' | 'turn_off' | 'toggle') => {
    try {
      await homeAssistantService.controlDevice({
        entity_id: device.entity_id,
        action
      });
      // Refresh device state
      await loadDeviceData();
    } catch (error) {
      console.error('Failed to control device:', error);
    }
  };

  const handleImportDevice = async (device: HADevice) => {
    try {
      const request: ImportDevicesRequest = {
        entity_ids: [device.entity_id],
        update_existing: true
      };
      
      const response = await homeAssistantService.importDevices(request);
      await loadDeviceData();
      
      toast({
        title: "Device imported",
        description: `${device.friendly_name || device.entity_id} has been imported successfully`,
      });
    } catch (error) {
      console.error('Failed to import device:', error);
      toast({
        title: "Import failed",
        description: `Failed to import ${device.friendly_name || device.entity_id}`,
        variant: "destructive",
      });
    }
  };

  const handleAssignDevice = async () => {
    if (!selectedDevice || !assignmentForm.shelf_id) return;

    try {
      await homeAssistantService.saveAssignment({
        entity_id: selectedDevice.entity_id,
        entity_type: selectedDevice.domain,
        friendly_name: selectedDevice.friendly_name || selectedDevice.entity_id,
        farm_id: assignmentForm.farm_id,
        row_id: assignmentForm.row_id,
        rack_id: assignmentForm.rack_id,
        shelf_id: assignmentForm.shelf_id
      });
      
      setAssignmentModalOpen(false);
      setSelectedDevice(null);
      setAssignmentForm({ farm_id: 'farm_1', row_id: '', rack_id: '', shelf_id: '' });
      await loadDeviceData();
    } catch (error) {
      console.error('Failed to assign device:', error);
    }
  };

  // Enhanced filtering functions
  const addFilter = (filter: FilterChip) => {
    setActiveFilters(prev => {
      // Remove existing filter of same type
      const filtered = prev.filter(f => f.type !== filter.type || f.value !== filter.value);
      return [...filtered, filter];
    });
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

  // Bulk operations handlers
  const toggleDeviceSelection = (deviceId: string) => {
    const newSelected = new Set(selectedDevices);
    if (newSelected.has(deviceId)) {
      newSelected.delete(deviceId);
    } else {
      newSelected.add(deviceId);
    }
    setSelectedDevices(newSelected);
  };

  const selectAllDevices = () => {
    const filteredDevices = getFilteredDevices(discoveredDevices);
    const allIds = new Set(filteredDevices.map(d => d.entity_id));
    setSelectedDevices(allIds);
  };

  const clearSelection = () => {
    setSelectedDevices(new Set());
    setBulkSelectMode(false);
  };

  const handleBulkImport = async () => {
    if (selectedDevices.size === 0) return;
    
    try {
      const request: ImportDevicesRequest = {
        entity_ids: Array.from(selectedDevices),
        update_existing: true
      };
      
      await homeAssistantService.importDevices(request);
      await loadDeviceData();
      clearSelection();
    } catch (error) {
      console.error('Bulk import failed:', error);
    }
  };

  const handleBulkAssign = () => {
    // Open assignment modal with multiple devices
    if (selectedDevices.size > 0) {
      setAssignmentModalOpen(true);
    }
  };

  const handleBulkControl = async (action: 'turn_on' | 'turn_off') => {
    const selectedDevicesList = discoveredDevices.filter(d => selectedDevices.has(d.entity_id));
    
    try {
      await Promise.all(
        selectedDevicesList.map(device => 
          homeAssistantService.controlDevice({
            entity_id: device.entity_id,
            action
          })
        )
      );
      
      // Refresh device list after bulk action
      await handleDiscoverDevices();
      clearSelection();
    } catch (error) {
      console.error('Bulk control failed:', error);
    }
  };

  // Device utility functions
  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'light': return <FaLightbulb className="h-4 w-4 text-yellow-500" />;
      case 'switch': return <FaToggleOn className="h-4 w-4 text-blue-500" />;
      case 'fan': return <FaFan className="h-4 w-4 text-green-500" />;
      case 'sensor': return <FaThermometerHalf className="h-4 w-4 text-purple-500" />;
      default: return <FaPlug className="h-4 w-4 text-gray-500" />;
    }
  };

  const getFilteredDevices = (devices: HADevice[]) => {
    let filtered = devices;

    // Apply search term
    if (searchTerm) {
      filtered = filtered.filter(device => 
        (device.friendly_name || device.entity_id).toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.entity_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.domain.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply device type filter
    if (deviceFilter !== 'all') {
      filtered = filtered.filter(device => device.domain === deviceFilter.slice(0, -1)); // Remove 's' from 'lights' -> 'light'
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
          filtered = filtered.filter(device => {
            const assigned = assignments.some(a => a.entity_id === device.entity_id);
            return filter.value === 'assigned' ? assigned : !assigned;
          });
          break;
      }
    });

    return filtered;
  };

  const getDeviceStats = () => {
    const total = discoveredDevices.length;
    const assigned = assignments.length;
    const active = discoveredDevices.filter(d => d.state === 'on').length;
    return { total, assigned, active, unassigned: total - assigned };
  };

  // Enhanced device card component
  const DeviceCard = ({ device }: { device: HADevice }) => {
    const isAssigned = assignments.some(a => a.entity_id === device.entity_id);
    const assignment = assignments.find(a => a.entity_id === device.entity_id);
    const isImported = importedDevices.some(d => d.entity_id === device.entity_id);
    const importedDevice = importedDevices.find(d => d.entity_id === device.entity_id);
    const isActive = device.state === 'on';
    const lastActivity = device.last_updated ? new Date(device.last_updated) : null;
    const isSelected = selectedDevices.has(device.entity_id);

    // Get status color and icon
    const getStatusColor = () => {
      if (device.state === 'on') return 'text-green-500 bg-green-50 border-green-200';
      if (device.state === 'off') return 'text-gray-500 bg-gray-50 border-gray-200';
      if (device.state === 'unavailable') return 'text-red-500 bg-red-50 border-red-200';
      return 'text-yellow-500 bg-yellow-50 border-yellow-200';
    };

    const getStatusIcon = () => {
      if (device.state === 'on') return <FaCheckCircle className="h-3 w-3" />;
      if (device.state === 'off') return <FaCircle className="h-3 w-3" />;
      if (device.state === 'unavailable') return <FaExclamationTriangle className="h-3 w-3" />;
      return <FaClock className="h-3 w-3" />;
    };

    return (
      <Card className={`hover:shadow-lg transition-all duration-200 hover:scale-[1.02] ${isSelected ? 'ring-2 ring-green-500 bg-green-50/50' : ''}`}>
        <CardContent className="p-4">
          {/* Selection checkbox and header */}
          <div className="flex items-start justify-between mb-4">
            {bulkSelectMode && (
              <div className="flex-shrink-0 mr-3 mt-1">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => toggleDeviceSelection(device.entity_id)}
                  className="h-5 w-5"
                />
              </div>
            )}
            <div className="flex items-start justify-between flex-1">
              <div className="flex items-start gap-3 flex-1">
              <div className="flex-shrink-0 mt-1">
                {getDeviceIcon(device.domain)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm leading-tight truncate">
                  {device.friendly_name || device.entity_id}
                </h3>
                <p className="text-xs text-gray-500 truncate mt-1">{device.entity_id}</p>
                {isAssigned && assignment && (
                  <div className="flex items-center gap-1 mt-1">
                    <MapPin className="h-3 w-3 text-green-600" />
                    <span className="text-xs text-green-600 truncate">
                      {assignment.shelf_name}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Large status indicator */}
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full border text-xs font-medium ${getStatusColor()}`}>
              {getStatusIcon()}
              <span className="capitalize">{device.state}</span>
            </div>
            </div>
          </div>

          {/* Device info row */}
          <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
            <div className="flex items-center gap-1">
              <Badge variant="outline" className="text-xs">
                {device.domain}
              </Badge>
              {isImported && (
                <Badge variant="secondary" className="text-xs">
                  Imported
                </Badge>
              )}
              {isAssigned && (
                <Badge variant="default" className="text-xs">
                  Assigned
                </Badge>
              )}
            </div>
            {lastActivity && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{lastActivity.toLocaleTimeString()}</span>
              </div>
            )}
          </div>

          {/* Controls section */}
          <div className="space-y-3">
            {/* Primary controls */}
            <div className="flex gap-2">
              {device.domain === 'light' && (
                <>
                  <Button 
                    size="sm" 
                    variant={isActive ? "default" : "outline"}
                    className="flex-1 min-h-[44px]" // Mobile-friendly touch target
                    onClick={() => handleDeviceControl(device, isActive ? 'turn_off' : 'turn_on')}
                  >
                    {isActive ? <FaSun className="h-4 w-4 mr-2" /> : <FaMoon className="h-4 w-4 mr-2" />}
                    {isActive ? 'Turn Off' : 'Turn On'}
                  </Button>
                </>
              )}
              
              {device.domain === 'switch' && (
                <div className="flex items-center justify-between w-full">
                  <span className="text-sm font-medium">
                    {isActive ? 'On' : 'Off'}
                  </span>
                  <Switch 
                    checked={isActive}
                    onCheckedChange={(checked) => 
                      handleDeviceControl(device, checked ? 'turn_on' : 'turn_off')
                    }
                    className="scale-125" // Larger for mobile
                  />
                </div>
              )}

              {(device.domain !== 'light' && device.domain !== 'switch') && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1 min-h-[44px]"
                  onClick={() => handleDeviceControl(device, 'toggle')}
                >
                  <FaToggleOn className="h-4 w-4 mr-2" />
                  Toggle
                </Button>
              )}
            </div>

            {/* Secondary controls */}
            <div className="flex gap-2">
              {!isImported ? (
                <Button 
                  size="sm" 
                  variant="outline"
                  className="flex-1 min-h-[44px]"
                  onClick={() => handleImportDevice(device)}
                >
                  <FaDownload className="h-4 w-4 mr-2" />
                  Import
                </Button>
              ) : (
                <Button 
                  size="sm" 
                  variant="outline"
                  className="flex-1 min-h-[44px]"
                  onClick={() => {
                    setSelectedDevice(device);
                    setAssignmentModalOpen(true);
                  }}
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  {isAssigned ? 'Reassign' : 'Assign'}
                </Button>
              )}
              
              <Button 
                size="sm" 
                variant="outline"
                className="min-h-[44px] px-3"
                onClick={() => {
                  // Add device details modal or expand functionality
                }}
              >
                <FaCog className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading Home Assistant integration...</p>
          </div>
        </div>
      </div>
    );
  }

  // Not configured state - Setup wizard
  if (connectionState === 'not-configured') {
    return (
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center">
            <div className="bg-blue-100 dark:bg-blue-900/20 p-4 rounded-full">
              <FaHome className="text-4xl text-blue-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Connect to Home Assistant
          </h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Integrate your Home Assistant instance to control lights, switches, and sensors 
            directly from your vertical farming dashboard.
          </p>
        </div>

        {/* Setup Wizard */}
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Setup Configuration
              </CardTitle>
              <CardDescription>
                Enter your Home Assistant connection details to get started.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Progress indicator */}
              <div className="flex items-center justify-between text-sm">
                <span className={setupStep === 'connection' ? 'text-blue-600 font-medium' : 'text-gray-500'}>
                  Connection
                </span>
                <ChevronRight className="h-4 w-4 text-gray-400" />
                <span className={setupStep === 'test' ? 'text-blue-600 font-medium' : 'text-gray-500'}>
                  Test
                </span>
                <ChevronRight className="h-4 w-4 text-gray-400" />
                <span className={setupStep === 'discovery' ? 'text-blue-600 font-medium' : 'text-gray-500'}>
                  Discovery
                </span>
                <ChevronRight className="h-4 w-4 text-gray-400" />
                <span className={setupStep === 'complete' ? 'text-blue-600 font-medium' : 'text-gray-500'}>
                  Complete
                </span>
              </div>

              <Progress value={(Object.keys(['connection', 'test', 'discovery', 'complete']).indexOf(setupStep) + 1) * 25} className="h-2" />

              {/* Connection form */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Configuration Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Main Home Assistant"
                    value={config.name}
                    onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="url">Home Assistant URL</Label>
                  <Input
                    id="url"
                    placeholder="https://your-home-assistant.local:8123"
                    value={config.url}
                    onChange={(e) => setConfig(prev => ({ ...prev, url: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="token">Long-Lived Access Token</Label>
                  <Input
                    id="token"
                    type="password"
                    placeholder="Enter your Home Assistant access token"
                    value={config.token}
                    onChange={(e) => setConfig(prev => ({ ...prev, token: e.target.value }))}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Create a token in Home Assistant: Profile → Security → Long-Lived Access Tokens
                  </p>
                </div>
              </div>

              {/* Error display */}
              {connectionError && (
                <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20">
                  <FaExclamationTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800 dark:text-red-200">
                    {connectionError}
                  </AlertDescription>
                </Alert>
              )}

              {/* Success display */}
              {saveSuccess && (
                <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
                  <FaCheck className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800 dark:text-green-200">
                    {saveSuccess}
                  </AlertDescription>
                </Alert>
              )}

              {/* Action buttons */}
              <div className="flex gap-3">
                <Button 
                  onClick={handleTestConnection}
                  disabled={!config.url || !config.token || isConnecting}
                  className="flex-1"
                >
                  {isConnecting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Testing Connection...
                    </>
                  ) : (
                    <>
                      <Wifi className="h-4 w-4 mr-2" />
                      Test Connection
                    </>
                  )}
                </Button>

                {setupStep === 'discovery' && (
                  <Button 
                    onClick={handleSaveConfiguration}
                    disabled={!config.name || !config.url || !config.token || isSaving}
                    variant="default"
                    className="flex-1"
                  >
                    {isSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <FaCheck className="h-4 w-4 mr-2" />
                        Save & Continue
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Connected state - Main dashboard
  const deviceStats = getDeviceStats();

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header with connection status */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <FaHome className="text-blue-600" />
            Home Assistant
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage your connected devices and automate your vertical farm
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={status.connected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
            {status.connected ? (
              <>
                <FaCheckCircle className="h-3 w-3 mr-1" />
                Connected
              </>
            ) : (
              <>
                <FaExclamationTriangle className="h-3 w-3 mr-1" />
                Disconnected
              </>
            )}
          </Badge>
          <Button variant="outline" size="sm" onClick={() => setConnectionState('not-configured')}>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Connection status hero */}
      <Card className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 border-blue-200">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="bg-white dark:bg-gray-800 rounded-full p-3 w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                <Activity className="h-6 w-6 text-blue-600" />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {status.connected ? 'Online' : 'Offline'}
              </p>
            </div>
            <div className="text-center">
              <div className="bg-white dark:bg-gray-800 rounded-full p-3 w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Devices</p>
              <p className="font-semibold text-gray-900 dark:text-white">{deviceStats.total}</p>
            </div>
            <div className="text-center">
              <div className="bg-white dark:bg-gray-800 rounded-full p-3 w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                <FaMapPin className="h-6 w-6 text-purple-600" />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Assigned</p>
              <p className="font-semibold text-gray-900 dark:text-white">{deviceStats.assigned}</p>
            </div>
            <div className="text-center">
              <div className="bg-white dark:bg-gray-800 rounded-full p-3 w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                <Zap className="h-6 w-6 text-yellow-600" />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {deviceStats.active}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main content tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="imported">Imported</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Quick actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={handleDiscoverDevices}>
              <CardContent className="p-6 text-center">
                <FaSearch className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Discover Devices</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Find new devices in your Home Assistant
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab('assignments')}>
              <CardContent className="p-6 text-center">
                <FaMapPin className="h-8 w-8 text-green-600 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Assign Devices</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Map devices to farm locations
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab('assignments')}>
              <CardContent className="p-6 text-center">
                <Activity className="h-8 w-8 text-purple-600 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">View Activity</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Monitor device usage and history
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest device actions and status changes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Placeholder for recent activity */}
                <div className="text-center py-8 text-gray-500">
                  <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No recent activity to display</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="devices" className="space-y-6">
          {/* Device management header */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Device Management</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Discover, import, and control your Home Assistant devices
              </p>
            </div>
            <Button onClick={handleDiscoverDevices} disabled={loading}>
              <FaSearch className="h-4 w-4 mr-2" />
              Discover Devices
            </Button>
          </div>

          {/* Enhanced Device filters */}
          <Card>
            <CardContent className="p-4 space-y-4">
              {/* Search and filter controls */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search devices by name, type, or location..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 min-h-[44px]" // Mobile-friendly
                    />
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {/* Quick filter dropdown */}
                  <div className="relative">
                    <Button
                      variant="outline"
                      onClick={() => setShowFilterMenu(!showFilterMenu)}
                      className="min-h-[44px] px-4"
                    >
                      <FaFilter className="h-4 w-4 mr-2" />
                      Filter
                      {activeFilters.length > 0 && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {activeFilters.length}
                        </Badge>
                      )}
                    </Button>
                    
                    {/* Filter dropdown menu */}
                    {showFilterMenu && (
                      <div className="absolute right-0 top-full mt-1 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                        <div className="p-3 space-y-3">
                          <div>
                            <Label className="text-sm font-medium">Status</Label>
                            <div className="flex flex-wrap gap-1 mt-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs"
                                onClick={() => addFilter({
                                  id: 'status-on',
                                  label: 'Active',
                                  type: 'status',
                                  value: 'on'
                                })}
                              >
                                Active
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs"
                                onClick={() => addFilter({
                                  id: 'status-off',
                                  label: 'Inactive',
                                  type: 'status',
                                  value: 'off'
                                })}
                              >
                                Inactive
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs"
                                onClick={() => addFilter({
                                  id: 'status-unavailable',
                                  label: 'Unavailable',
                                  type: 'status',
                                  value: 'unavailable'
                                })}
                              >
                                Unavailable
                              </Button>
                            </div>
                          </div>
                          
                          <div>
                            <Label className="text-sm font-medium">Device Type</Label>
                            <div className="flex flex-wrap gap-1 mt-1">
                              <Button
                                size="sm"
                                variant="outline"
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
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
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
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
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
                              </Button>
                            </div>
                          </div>
                          
                          <div>
                            <Label className="text-sm font-medium">Assignment</Label>
                            <div className="flex flex-wrap gap-1 mt-1">
                              <Button
                                size="sm"
                                variant="outline"
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
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
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
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Clear filters button */}
                  {(activeFilters.length > 0 || searchTerm || deviceFilter !== 'all') && (
                    <Button
                      variant="outline"
                      onClick={clearAllFilters}
                      className="min-h-[44px] px-4"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Clear
                    </Button>
                  )}
                </div>
              </div>

              {/* Active filter chips */}
              {activeFilters.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400 self-center">
                    Active filters:
                  </span>
                  {activeFilters.map((filter) => (
                    <Badge
                      key={filter.id}
                      variant="secondary"
                      className="flex items-center gap-1 px-2 py-1 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      onClick={() => removeFilter(filter.id)}
                    >
                      <span className="text-xs">{filter.label}</span>
                      <X className="h-3 w-3" />
                    </Badge>
                  ))}
                </div>
              )}

              {/* Results summary */}
              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>
                  Showing {getFilteredDevices(discoveredDevices).length} of {discoveredDevices.length} devices
                </span>
                {(searchTerm || activeFilters.length > 0 || deviceFilter !== 'all') && (
                  <span>
                    Filters applied
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* View Controls and Bulk Actions */}
          <div className="flex flex-col gap-4">
            {/* View Toggle and Bulk Mode Controls */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              {/* View Toggle */}
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium">View:</Label>
                <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                  <Button
                    size="sm"
                    variant={currentView === 'grid' ? 'default' : 'ghost'}
                    className="h-8 px-3"
                    onClick={() => setCurrentView('grid')}
                  >
                    <FaTh className="h-3 w-3 mr-1" />
                    Grid
                  </Button>
                  <Button
                    size="sm"
                    variant={currentView === 'list' ? 'default' : 'ghost'}
                    className="h-8 px-3"
                    onClick={() => setCurrentView('list')}
                  >
                    <FaList className="h-3 w-3 mr-1" />
                    List
                  </Button>
                  <Button
                    size="sm"
                    variant={currentView === 'farm' ? 'default' : 'ghost'}
                    className="h-8 px-3"
                    onClick={() => setCurrentView('farm')}
                  >
                    <FaMap className="h-3 w-3 mr-1" />
                    Farm
                  </Button>
                </div>
              </div>

              {/* Bulk Selection Toggle */}
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant={bulkSelectMode ? 'default' : 'outline'}
                  onClick={() => {
                    setBulkSelectMode(!bulkSelectMode);
                    if (!bulkSelectMode) {
                      clearSelection();
                    }
                  }}
                  className="min-h-[36px]"
                >
                  <FaCheckSquare className="h-3 w-3 mr-2" />
                  {bulkSelectMode ? 'Exit Selection' : 'Select Multiple'}
                </Button>
                
                {bulkSelectMode && discoveredDevices.length > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={selectAllDevices}
                    className="min-h-[36px]"
                  >
                    Select All ({getFilteredDevices(discoveredDevices).length})
                  </Button>
                )}
              </div>
            </div>

            {/* Bulk Actions Toolbar */}
            {showBulkActions && (
              <Card className="border-green-200 bg-green-50/50 dark:bg-green-900/20">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FaCheckCircle className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-green-800 dark:text-green-200">
                        {selectedDevices.size} device{selectedDevices.size !== 1 ? 's' : ''} selected
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleBulkControl('turn_on')}
                        className="min-h-[36px]"
                      >
                        <FaSun className="h-3 w-3 mr-2" />
                        Turn On All
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleBulkControl('turn_off')}
                        className="min-h-[36px]"
                      >
                        <FaMoon className="h-3 w-3 mr-2" />
                        Turn Off All
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleBulkImport}
                        className="min-h-[36px]"
                      >
                        <FaDownload className="h-3 w-3 mr-2" />
                        Import All
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={clearSelection}
                        className="min-h-[36px] text-gray-600"
                      >
                        <X className="h-3 w-3 mr-2" />
                        Clear
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

                     {/* Device Views */}
           {currentView === 'grid' && (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               {getFilteredDevices(discoveredDevices).map((device) => (
                 <DeviceCard key={device.entity_id} device={device} />
               ))}
             </div>
           )}

           {currentView === 'list' && (
             <Card>
               <CardContent className="p-0">
                 <Table>
                   <TableHeader>
                     <TableRow>
                       {bulkSelectMode && <TableHead className="w-12">Select</TableHead>}
                       <TableHead>Device</TableHead>
                       <TableHead>Type</TableHead>
                       <TableHead>Status</TableHead>
                       <TableHead>Assignment</TableHead>
                       <TableHead>Last Activity</TableHead>
                       <TableHead className="text-right">Actions</TableHead>
                     </TableRow>
                   </TableHeader>
                   <TableBody>
                     {getFilteredDevices(discoveredDevices).map((device) => {
                       const isAssigned = assignments.some(a => a.entity_id === device.entity_id);
                       const assignment = assignments.find(a => a.entity_id === device.entity_id);
                       const isImported = importedDevices.some(d => d.entity_id === device.entity_id);
                       const isSelected = selectedDevices.has(device.entity_id);
                       const lastActivity = device.last_updated ? new Date(device.last_updated) : null;
                       
                       return (
                         <TableRow key={device.entity_id} className={isSelected ? 'bg-green-50/50' : ''}>
                           {bulkSelectMode && (
                             <TableCell>
                               <Checkbox
                                 checked={isSelected}
                                 onCheckedChange={() => toggleDeviceSelection(device.entity_id)}
                               />
                             </TableCell>
                           )}
                           <TableCell>
                             <div className="flex items-center gap-3">
                               {getDeviceIcon(device.domain)}
                               <div>
                                 <div className="font-medium text-sm">
                                   {device.friendly_name || device.entity_id}
                                 </div>
                                 <div className="text-xs text-gray-500">{device.entity_id}</div>
                               </div>
                             </div>
                           </TableCell>
                           <TableCell>
                             <Badge variant="outline" className="text-xs">
                               {device.domain}
                             </Badge>
                           </TableCell>
                           <TableCell>
                             <div className="flex items-center gap-2">
                               {device.state === 'on' && <FaCheckCircle className="h-3 w-3 text-green-500" />}
                               {device.state === 'off' && <FaCircle className="h-3 w-3 text-gray-400" />}
                               {device.state === 'unavailable' && <FaExclamationTriangle className="h-3 w-3 text-red-500" />}
                               <span className="text-sm capitalize">{device.state}</span>
                             </div>
                           </TableCell>
                           <TableCell>
                             {isAssigned && assignment ? (
                               <div className="flex items-center gap-1">
                                 <MapPin className="h-3 w-3 text-green-600" />
                                 <span className="text-sm text-green-600">{assignment.shelf_name}</span>
                               </div>
                             ) : (
                               <span className="text-sm text-gray-400">Unassigned</span>
                             )}
                           </TableCell>
                           <TableCell>
                             {lastActivity ? (
                               <span className="text-sm text-gray-500">
                                 {lastActivity.toLocaleTimeString()}
                               </span>
                             ) : (
                               <span className="text-sm text-gray-400">-</span>
                             )}
                           </TableCell>
                           <TableCell className="text-right">
                             <div className="flex items-center gap-1 justify-end">
                               {device.domain === 'light' && (
                                 <Button
                                   size="sm"
                                   variant="ghost"
                                   className="h-8 w-8 p-0"
                                   onClick={() => handleDeviceControl(device, device.state === 'on' ? 'turn_off' : 'turn_on')}
                                 >
                                   {device.state === 'on' ? <FaSun className="h-3 w-3" /> : <FaMoon className="h-3 w-3" />}
                                 </Button>
                               )}
                               {!isImported ? (
                                 <Button
                                   size="sm"
                                   variant="ghost"
                                   className="h-8 w-8 p-0"
                                   onClick={() => handleImportDevice(device)}
                                 >
                                   <FaDownload className="h-3 w-3" />
                                 </Button>
                               ) : (
                                 <Button
                                   size="sm"
                                   variant="ghost"
                                   className="h-8 w-8 p-0"
                                   onClick={() => {
                                     setSelectedDevice(device);
                                     setAssignmentModalOpen(true);
                                   }}
                                 >
                                   <FaMapPin className="h-3 w-3" />
                                 </Button>
                               )}
                             </div>
                           </TableCell>
                         </TableRow>
                       );
                     })}
                   </TableBody>
                 </Table>
               </CardContent>
             </Card>
           )}

           {currentView === 'farm' && (
             <Card>
               <CardHeader>
                 <CardTitle className="flex items-center gap-2">
                   <FaLayerGroup className="h-5 w-5" />
                   Farm Layout View
                 </CardTitle>
                 <CardDescription>
                   Visual representation of your farm with device locations
                 </CardDescription>
               </CardHeader>
               <CardContent className="p-6">
                 <div className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg p-8 min-h-[400px]">
                   {/* Farm layout visualization */}
                   <div className="grid grid-cols-2 gap-8 h-full">
                     {/* Greenhouse Alpha */}
                     <div className="bg-white/80 dark:bg-gray-800/80 rounded-lg p-4 border-2 border-green-200">
                       <h3 className="font-semibold text-green-800 dark:text-green-200 mb-4 flex items-center gap-2">
                         <FaHome className="h-4 w-4" />
                         Greenhouse Alpha
                       </h3>
                       <div className="space-y-3">
                         {/* Row A1 */}
                         <div className="bg-green-100/50 dark:bg-green-900/30 rounded p-3">
                           <div className="text-sm font-medium text-green-700 dark:text-green-300 mb-2">Row A1</div>
                           <div className="grid grid-cols-2 gap-2">
                             {/* Rack A1-1 */}
                             <div className="bg-white dark:bg-gray-700 rounded p-2 border border-green-200">
                               <div className="text-xs font-medium mb-1">Rack A1-1</div>
                               <div className="space-y-1">
                                 {assignments
                                   .filter(a => a.rack_name === 'Rack A1-1')
                                   .slice(0, 2)
                                   .map((assignment) => {
                                     const device = discoveredDevices.find(d => d.entity_id === assignment.entity_id);
                                     return (
                                       <div key={assignment.entity_id} className="flex items-center gap-1 text-xs">
                                         {device && getDeviceIcon(device.domain)}
                                         <span className="truncate">{assignment.friendly_name}</span>
                                         {device && (
                                           <div className={`w-2 h-2 rounded-full ${
                                             device.state === 'on' ? 'bg-green-400' : 
                                             device.state === 'off' ? 'bg-gray-400' : 'bg-red-400'
                                           }`} />
                                         )}
                                       </div>
                                     );
                                   })}
                                 {assignments.filter(a => a.rack_name === 'Rack A1-1').length === 0 && (
                                   <div className="text-xs text-gray-400">No devices</div>
                                 )}
                               </div>
                             </div>
                             {/* Rack A1-2 */}
                             <div className="bg-white dark:bg-gray-700 rounded p-2 border border-green-200">
                               <div className="text-xs font-medium mb-1">Rack A1-2</div>
                               <div className="space-y-1">
                                 {assignments
                                   .filter(a => a.rack_name === 'Rack A1-2')
                                   .slice(0, 2)
                                   .map((assignment) => {
                                     const device = discoveredDevices.find(d => d.entity_id === assignment.entity_id);
                                     return (
                                       <div key={assignment.entity_id} className="flex items-center gap-1 text-xs">
                                         {device && getDeviceIcon(device.domain)}
                                         <span className="truncate">{assignment.friendly_name}</span>
                                         {device && (
                                           <div className={`w-2 h-2 rounded-full ${
                                             device.state === 'on' ? 'bg-green-400' : 
                                             device.state === 'off' ? 'bg-gray-400' : 'bg-red-400'
                                           }`} />
                                         )}
                                       </div>
                                     );
                                   })}
                                 {assignments.filter(a => a.rack_name === 'Rack A1-2').length === 0 && (
                                   <div className="text-xs text-gray-400">No devices</div>
                                 )}
                               </div>
                             </div>
                           </div>
                         </div>
                       </div>
                     </div>

                     {/* Greenhouse Beta */}
                     <div className="bg-white/80 dark:bg-gray-800/80 rounded-lg p-4 border-2 border-blue-200">
                       <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-4 flex items-center gap-2">
                         <FaHome className="h-4 w-4" />
                         Greenhouse Beta
                       </h3>
                       <div className="space-y-3">
                         {/* Row B1 */}
                         <div className="bg-blue-100/50 dark:bg-blue-900/30 rounded p-3">
                           <div className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">Row B1</div>
                           <div className="grid grid-cols-2 gap-2">
                             <div className="bg-white dark:bg-gray-700 rounded p-2 border border-blue-200">
                               <div className="text-xs font-medium mb-1">Rack B1-1</div>
                               <div className="text-xs text-gray-400">No devices</div>
                             </div>
                             <div className="bg-white dark:bg-gray-700 rounded p-2 border border-blue-200">
                               <div className="text-xs font-medium mb-1">Rack B1-2</div>
                               <div className="text-xs text-gray-400">No devices</div>
                             </div>
                           </div>
                         </div>
                       </div>
                     </div>
                   </div>

                   {/* Legend */}
                   <div className="mt-6 flex items-center justify-center gap-6 text-sm">
                     <div className="flex items-center gap-2">
                       <div className="w-3 h-3 rounded-full bg-green-400"></div>
                       <span>Active</span>
                     </div>
                     <div className="flex items-center gap-2">
                       <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                       <span>Inactive</span>
                     </div>
                     <div className="flex items-center gap-2">
                       <div className="w-3 h-3 rounded-full bg-red-400"></div>
                       <span>Unavailable</span>
                     </div>
                   </div>
                 </div>
               </CardContent>
             </Card>
           )}

          {/* Empty state */}
          {getFilteredDevices(discoveredDevices).length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <FaPlug className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">No devices found</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {searchTerm || deviceFilter !== 'all' 
                    ? 'Try adjusting your search or filter criteria' 
                    : 'Click "Discover Devices" to find your Home Assistant devices'
                  }
                </p>
                {!searchTerm && deviceFilter === 'all' && (
                  <Button onClick={handleDiscoverDevices}>
                    <FaSearch className="h-4 w-4 mr-2" />
                    Discover Devices
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="imported" className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold">Imported Devices</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your imported Home Assistant devices that are ready for assignment
            </p>
          </div>

          {/* View controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={viewType === 'grid' ? 'default' : 'outline'}
                onClick={() => setViewType('grid')}
              >
                <FaTh className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant={viewType === 'list' ? 'default' : 'outline'}
                onClick={() => setViewType('list')}
              >
                <FaList className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              {/* Device type filter */}
              <Select value={deviceFilter} onValueChange={setDeviceFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All devices</SelectItem>
                  <SelectItem value="switch">Switches</SelectItem>
                  <SelectItem value="light">Lights</SelectItem>
                  <SelectItem value="sensor">Sensors</SelectItem>
                  <SelectItem value="binary_sensor">Binary Sensors</SelectItem>
                  <SelectItem value="cover">Covers</SelectItem>
                  <SelectItem value="climate">Climate</SelectItem>
                  <SelectItem value="fan">Fans</SelectItem>
                </SelectContent>
              </Select>

              {/* Search */}
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search devices..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-[200px]"
                />
              </div>
            </div>
          </div>

          {/* Grid view */}
          {viewType === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {importedDevices
                .filter(device => {
                  const matchesSearch = !searchTerm || 
                    device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    device.entity_id.toLowerCase().includes(searchTerm.toLowerCase());
                  const matchesFilter = deviceFilter === 'all' || device.device_type === deviceFilter;
                  return matchesSearch && matchesFilter;
                })
                .map((device) => (
                <Card key={device.entity_id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3">
                        {getDeviceIcon(device.device_type)}
                        <div className="min-w-0 flex-1">
                          <h3 className="font-medium truncate">{device.name || device.entity_id}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{device.entity_id}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={device.is_assigned ? "default" : "secondary"} className="text-xs">
                          {device.is_assigned ? 'Assigned' : 'Available'}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Type:</span>
                        <span className="capitalize">{device.device_type}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Imported:</span>
                        <span>{new Date(device.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-4">
                      {!device.is_assigned && (
                        <Button size="sm" className="flex-1" onClick={handleAssignDevice}>
                          <FaMapPin className="h-3 w-3 mr-1" />
                          Assign
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => {}}>
                        <FaEdit className="h-3 w-3" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={async () => {
                          try {
                            await homeAssistantService.removeImportedDevice(device.entity_id);
                            toast({
                              title: "Device removed",
                              description: "Device has been removed from your imported devices",
                            });
                            loadDeviceData();
                          } catch (error) {
                            toast({
                              title: "Error",
                              description: "Failed to remove device",
                              variant: "destructive",
                            });
                          }
                        }}
                      >
                        <FaTrash className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* List view */}
          {viewType === 'list' && (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {importedDevices
                    .filter(device => {
                      const matchesSearch = !searchTerm || 
                        device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        device.entity_id.toLowerCase().includes(searchTerm.toLowerCase());
                      const matchesFilter = deviceFilter === 'all' || device.device_type === deviceFilter;
                      return matchesSearch && matchesFilter;
                    })
                    .map((device) => (
                    <div key={device.entity_id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {getDeviceIcon(device.device_type)}
                        <div className="min-w-0 flex-1">
                          <h3 className="font-medium truncate">{device.name || device.entity_id}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{device.entity_id}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {device.device_type}
                          </Badge>
                          <Badge variant={device.is_assigned ? "default" : "secondary"} className="text-xs">
                            {device.is_assigned ? 'Assigned' : 'Available'}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {!device.is_assigned && (
                          <Button size="sm" onClick={handleAssignDevice}>
                            <FaMapPin className="h-3 w-3 mr-1" />
                            Assign
                          </Button>
                        )}
                        <Button size="sm" variant="outline" onClick={() => {}}>
                          <FaEdit className="h-3 w-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={async () => {
                            try {
                              await homeAssistantService.removeImportedDevice(device.entity_id);
                              toast({
                                title: "Device removed",
                                description: "Device has been removed from your imported devices",
                              });
                              loadDeviceData();
                            } catch (error) {
                              toast({
                                title: "Error",
                                description: "Failed to remove device",
                                variant: "destructive",
                              });
                            }
                          }}
                        >
                          <FaTrash className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Empty state */}
          {importedDevices.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <FaDownload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">No imported devices</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Import devices from the Devices tab to see them here
                </p>
                <Button onClick={() => setActiveTab('devices')}>
                  <FaPlug className="h-4 w-4 mr-2" />
                  Go to Devices
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="assignments" className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold">Device Assignments</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Manage which devices are assigned to specific farm locations
            </p>
          </div>

                     {/* Assignment grid */}
           <div className="grid grid-cols-1 gap-4">
             {assignments.map((assignment) => (
               <Card key={assignment.entity_id}>
                 <CardContent className="p-4">
                   <div className="flex items-center justify-between">
                     <div className="flex items-center gap-3">
                       {getDeviceIcon(assignment.entity_type || 'switch')}
                       <div>
                         <h3 className="font-medium">{assignment.friendly_name || assignment.entity_id}</h3>
                         <p className="text-sm text-gray-600 dark:text-gray-400">
                           {assignment.farm_name} → {assignment.row_name} → {assignment.rack_name} → {assignment.shelf_name}
                         </p>
                       </div>
                     </div>
                     <div className="flex items-center gap-2">
                       <Badge variant="secondary">
                         {assignment.entity_type}
                       </Badge>
                       <Button size="sm" variant="outline">
                         <FaEdit className="h-3 w-3" />
                       </Button>
                     </div>
                   </div>
                 </CardContent>
               </Card>
             ))}
           </div>

          {/* Empty state */}
          {assignments.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <FaMapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">No assignments yet</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Start by discovering devices and assigning them to farm locations
                </p>
                <Button onClick={() => handleDiscoverDevices()}>
                  <FaSearch className="h-4 w-4 mr-2" />
                  Discover Devices
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold">Integration Settings</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your Home Assistant connection and configuration
            </p>
          </div>

          {/* Current configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Current Configuration</CardTitle>
              <CardDescription>Your active Home Assistant connection</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Name</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{config.name || 'Unnamed'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">URL</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{config.url}</p>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-medium">Connection Status</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Last checked: {status.last_updated ? new Date(status.last_updated).toLocaleString() : 'Never'}
                  </p>
                </div>
                <Button variant="outline" onClick={loadInitialData}>
                  <Wifi className="h-4 w-4 mr-2" />
                  Test Connection
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Danger zone */}
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-600">Danger Zone</CardTitle>
              <CardDescription>Irreversible and destructive actions</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" onClick={() => setConnectionState('not-configured')}>
                <FaTrash className="h-4 w-4 mr-2" />
                Reset Configuration
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Assignment Modal */}
      <Dialog open={assignmentModalOpen} onOpenChange={setAssignmentModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Device to Location</DialogTitle>
            <DialogDescription>
              Choose where to assign {selectedDevice?.friendly_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Farm</Label>
              <Select value={assignmentForm.farm_id} onValueChange={(value) => 
                setAssignmentForm(prev => ({ ...prev, farm_id: value }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="Select farm" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="farm_1">Greenhouse Alpha</SelectItem>
                  <SelectItem value="farm_2">Greenhouse Beta</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Row</Label>
              <Select value={assignmentForm.row_id} onValueChange={(value) => 
                setAssignmentForm(prev => ({ ...prev, row_id: value }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="Select row" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="row_1">Row A1</SelectItem>
                  <SelectItem value="row_2">Row A2</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Rack</Label>
              <Select value={assignmentForm.rack_id} onValueChange={(value) => 
                setAssignmentForm(prev => ({ ...prev, rack_id: value }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="Select rack" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rack_1">Rack A1-1</SelectItem>
                  <SelectItem value="rack_2">Rack A1-2</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Shelf</Label>
              <Select value={assignmentForm.shelf_id} onValueChange={(value) => 
                setAssignmentForm(prev => ({ ...prev, shelf_id: value }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="Select shelf" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="shelf_1">Shelf A1-1-1</SelectItem>
                  <SelectItem value="shelf_2">Shelf A1-1-2</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={handleAssignDevice} className="flex-1">
                Assign Device
              </Button>
              <Button variant="outline" onClick={() => setAssignmentModalOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 