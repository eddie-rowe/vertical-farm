'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  FaHome, FaCheck, FaExclamationTriangle, FaPlug, FaLightbulb, FaFan, 
  FaThermometerHalf, FaDownload, FaFilter, FaSearch, FaCog, FaMapPin,
  FaCheckCircle, FaCircle, FaArrowRight, FaWifi
} from 'react-icons/fa';
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
import { 
  homeAssistantService, 
  HADevice, 
  HAConfig, 
  HAConnectionStatus, 
  DeviceAssignment 
} from '@/services/homeAssistantService';
// TODO: Re-enable real-time features once properly configured
// import { useRealtimeTable } from '@/hooks/useRealtimeTable';
import { useRealtime } from '@/context/RealtimeContext';

export default function HomeAssistantPage() {
  // Real-time connection status
  const { isConnected: realtimeConnected, connectionStatus } = useRealtime();

  // TODO: Re-enable real-time features once properly configured
  // For now, using manual API calls to avoid continuous retry errors
  const [allConfigs, setAllConfigs] = useState<any[]>([]);
  const [configsLoading, setConfigsLoading] = useState(false);
  const [deviceConfigs, setDeviceConfigs] = useState<any[]>([]);
  const [deviceConfigsLoading, setDeviceConfigsLoading] = useState(false);

  /* 
   * REAL-TIME STRATEGY:
   * 
   * ✅ SHOULD use real-time:
   * - device_states: Live device status (on/off, brightness, etc.)
   * - sensor_readings: Live temperature, humidity, pH readings  
   * - device_commands: Immediate feedback for user controls
   * - system_alerts: Critical notifications and alarms
   * 
   * ❌ DON'T need real-time:
   * - user_home_assistant_configs: User settings (changed rarely)
   * - device_assignments: Static device-to-location mappings
   * - user_profiles: User account information
   * - discovery_results: One-time device discovery results
   * 
   * 🔄 HYBRID approach:
   * - Use manual API calls for configuration data
   * - Use real-time only for live operational data
   * - Implement proper fallbacks when real-time fails
   */

  // Connection state
  const [config, setConfig] = useState<HAConfig>({ url: '', token: '', enabled: false });
  const [status, setStatus] = useState<HAConnectionStatus>({ connected: false });
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // Edit configuration state
  const [editingConfig, setEditingConfig] = useState<any | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  // Device state - separated into discovered and imported
  const [discoveredDevices, setDiscoveredDevices] = useState<HADevice[]>([]);
  const [importedDevices, setImportedDevices] = useState<HADevice[]>([]);
  const [assignments, setAssignments] = useState<DeviceAssignment[]>([]);
  const [isLoadingDevices, setIsLoadingDevices] = useState(false);
  const [deviceError, setDeviceError] = useState<string | null>(null);

  // New UX flow state
  const [deviceFilter, setDeviceFilter] = useState<'lights' | 'switches' | 'sensors' | 'all'>('lights');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedForImport, setSelectedForImport] = useState<Set<string>>(new Set());
  const [isImporting, setIsImporting] = useState(false);

  // Assignment modal state
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<HADevice | null>(null);
  const [assignmentForm, setAssignmentForm] = useState({
    farm_id: 'farm_1',
    row_id: '',
    rack_id: '',
    shelf_id: ''
  });

  const loadStatus = useCallback(async () => {
    try {
      const statusData = await homeAssistantService.getStatus();
      setStatus(statusData);
      // Don't auto-load devices - let user click "Discover Devices" when ready
    } catch (error) {
      console.error('Error loading status:', error);
      setStatus({ connected: false });
    }
  }, []);

  const loadConfig = useCallback(async () => {
    try {
      const configData = await homeAssistantService.getConfig();
      if (configData) {
        setConfig(configData);
      }
    } catch (error) {
      console.error('Error loading config:', error);
    }
  }, []);

  // Remove loadAllConfigs since we now use real-time subscriptions
  // Data is automatically loaded and synced via useRealtimeTable

  const loadAssignments = useCallback(async () => {
    try {
      const assignmentsData = await homeAssistantService.getAssignments();
      setAssignments(assignmentsData);
    } catch (error) {
      console.error('Error loading assignments:', error);
    }
  }, []);

  // Load all configurations manually
  const loadAllConfigs = useCallback(async () => {
    setConfigsLoading(true);
    try {
      const configs = await homeAssistantService.getAllConfigs();
      setAllConfigs(configs || []);
    } catch (error) {
      console.error('Error loading configurations:', error);
      setAllConfigs([]);
    } finally {
      setConfigsLoading(false);
    }
  }, []);

  // Manual functions to replace real-time optimistic updates
  const refetchConfigs = useCallback(() => {
    loadAllConfigs();
  }, [loadAllConfigs]);

  useEffect(() => {
    loadConfig();
    loadStatus();
    loadAssignments();
    loadAllConfigs();
  }, [loadConfig, loadStatus, loadAssignments, loadAllConfigs]);

  const handleSaveConfiguration = async () => {
    if (!config.url || !config.token) return;

    setIsSaving(true);
    setConnectionError(null);
    setSaveSuccess(null);
    
    try {
      await homeAssistantService.saveConfig(config);
      setConfig(prev => ({ ...prev, enabled: true }));
      setSaveSuccess('Configuration saved successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSaveSuccess(null), 3000);
      
      // Refresh status to show latest connection state
      await loadStatus();
    } catch (error) {
      setConnectionError(error instanceof Error ? error.message : 'Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!config.url || !config.token) return;

    setIsConnecting(true);
    setConnectionError(null);
    try {
      // Test connection with full config including Cloudflare credentials
      const result = await homeAssistantService.testConnection(config.url, config.token, {
        cloudflare_client_id: config.cloudflare_client_id,
        cloudflare_client_secret: config.cloudflare_client_secret
      });
      setStatus(result);
      if (result.connected) {
        await homeAssistantService.saveConfig(config);
        setConfig(prev => ({ ...prev, enabled: true }));
        // Don't auto-load devices here - let user click "Discover Devices" button
      }
    } catch (error) {
      setConnectionError(error instanceof Error ? error.message : 'Connection test failed');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDiscoverDevices = async () => {
    setIsLoadingDevices(true);
    setDeviceError(null);
    try {
      const newDevices = await homeAssistantService.discoverDevices();
      setDiscoveredDevices(newDevices);
      // Clear any existing imported devices since we're starting fresh
      setImportedDevices([]);
      setSelectedForImport(new Set());
    } catch (error) {
      console.error('Error discovering devices:', error);
      setDeviceError(error instanceof Error ? error.message : 'Failed to discover devices');
    } finally {
      setIsLoadingDevices(false);
    }
  };

  const handleDeviceControl = async (device: HADevice, action: 'turn_on' | 'turn_off' | 'toggle') => {
    try {
      if (device.domain === 'light') {
        await homeAssistantService.controlLight(device.entity_id, action);
      } else {
        await homeAssistantService.controlDevice({
          entity_id: device.entity_id,
          action
        });
      }
      // Refresh device state (update both discovered and imported devices)
      setTimeout(() => {
        // For now, just refresh all discovered devices
        // In a full implementation, we'd refresh specific device states
        handleDiscoverDevices();
      }, 500);
    } catch (error) {
      console.error('Error controlling device:', error);
    }
  };

  const handleAssignDevice = async () => {
    if (!selectedDevice) return;

    try {
      const assignment: DeviceAssignment = {
        entity_id: selectedDevice.entity_id,
        entity_type: selectedDevice.domain || 'unknown', // Use the domain from Home Assistant
        friendly_name: selectedDevice.friendly_name || selectedDevice.entity_id,
        farm_id: assignmentForm.farm_id,
        row_id: assignmentForm.row_id || undefined,
        rack_id: assignmentForm.rack_id || undefined,
        shelf_id: assignmentForm.shelf_id || undefined,
      };

      await homeAssistantService.saveAssignment(assignment);
      await loadAssignments();
      setAssignmentModalOpen(false);
      setSelectedDevice(null);
      setAssignmentForm({
        farm_id: 'farm_1',
        row_id: '',
        rack_id: '',
        shelf_id: ''
      });
    } catch (error) {
      console.error('Error assigning device:', error);
    }
  };

  const handleRemoveAssignment = async (entityId: string) => {
    try {
      await homeAssistantService.removeAssignment(entityId);
      await loadAssignments();
    } catch (error) {
      console.error('Error removing assignment:', error);
    }
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'light': return <FaLightbulb className="text-yellow-500" />;
      case 'switch': return <FaPlug className="text-blue-500" />;
      case 'fan': return <FaFan className="text-green-500" />;
      case 'sensor': return <FaThermometerHalf className="text-purple-500" />;
      default: return <FaPlug className="text-gray-500" />;
    }
  };

  const getAssignment = (entityId: string) => {
    return assignments.find(a => a.entity_id === entityId);
  };

  const getLocationString = (assignment: DeviceAssignment) => {
    const parts = [];
    if (assignment.row_id) parts.push(`Row: ${assignment.row_id}`);
    if (assignment.rack_id) parts.push(`Rack: ${assignment.rack_id}`);
    if (assignment.shelf_id) parts.push(`Shelf: ${assignment.shelf_id}`);
    return parts.length > 0 ? parts.join(', ') : 'Unassigned';
  };

  // New UX flow helper functions
  const getFilteredDevices = (devices: HADevice[]) => {
    let filtered = devices;
    
    // Apply device type filter
    if (deviceFilter !== 'all') {
      filtered = filtered.filter(device => {
        switch (deviceFilter) {
          case 'lights': return device.domain === 'light';
          case 'switches': return device.domain === 'switch';
          case 'sensors': return device.domain === 'sensor';
          default: return true;
        }
      });
    }
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(device => 
        (device.friendly_name || device.entity_id).toLowerCase().includes(term) ||
        device.entity_id.toLowerCase().includes(term) ||
        (device.area && device.area.toLowerCase().includes(term))
      );
    }
    
    return filtered;
  };

  const getDeviceStatusIcon = (device: HADevice) => {
    const isImported = importedDevices.some(d => d.entity_id === device.entity_id);
    const assignment = getAssignment(device.entity_id);
    
    if (assignment) return <FaMapPin className="text-blue-500" title="Assigned" />;
    if (isImported) return <FaCheckCircle className="text-green-500" title="Imported" />;
    return <FaCircle className="text-gray-400" title="Available" />;
  };

  const getDeviceTypeCount = (devices: HADevice[], type: string) => {
    return devices.filter(device => {
      switch (type) {
        case 'lights': return device.domain === 'light';
        case 'switches': return device.domain === 'switch';
        case 'sensors': return device.domain === 'sensor';
        default: return true;
      }
    }).length;
  };

  const handleImportSelected = async () => {
    if (selectedForImport.size === 0) return;
    
    setIsImporting(true);
    try {
      const devicesToImport = discoveredDevices.filter(device => 
        selectedForImport.has(device.entity_id)
      );
      
      // Import devices (add to imported devices list)
      setImportedDevices(prev => {
        const existing = new Set(prev.map(d => d.entity_id));
        const newDevices = devicesToImport.filter(d => !existing.has(d.entity_id));
        return [...prev, ...newDevices];
      });
      
      // Clear selection
      setSelectedForImport(new Set());
      
      // Note: In a real implementation, you'd call an API to persist these imports
      // await homeAssistantService.importDevices(devicesToImport);
      
    } catch (error) {
      console.error('Error importing devices:', error);
    } finally {
      setIsImporting(false);
    }
  };

  const toggleDeviceSelection = (entityId: string) => {
    setSelectedForImport(prev => {
      const newSet = new Set(prev);
      if (newSet.has(entityId)) {
        newSet.delete(entityId);
      } else {
        newSet.add(entityId);
      }
      return newSet;
    });
  };

  const handleDeleteConfiguration = async (configId: string) => {
    setIsDeleting(configId);
    setConnectionError(null);
    setSaveSuccess(null);
    
    try {
      await homeAssistantService.deleteConfig(configId);
      
      // Refresh configurations after deletion
      await Promise.all([
        loadConfig(),
        loadStatus(),
        loadAssignments(),
        loadAllConfigs()
      ]);
      
      setSaveSuccess('Configuration deleted successfully!');
      setTimeout(() => setSaveSuccess(null), 3000);
    } catch (error) {
      setConnectionError(error instanceof Error ? error.message : 'Failed to delete configuration');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleEditConfiguration = (configItem: any) => {
    setEditingConfig({
      ...configItem,
      token: '', // Don't populate token for security
    });
    setShowEditDialog(true);
  };

  const handleSaveEditConfiguration = async () => {
    if (!editingConfig) return;

    setIsSaving(true);
    setConnectionError(null);
    setSaveSuccess(null);
    
    try {
      await homeAssistantService.saveConfig(editingConfig);
      
      // Refresh configurations after saving
      await Promise.all([
        loadConfig(),
        loadStatus(),
        loadAssignments(),
        loadAllConfigs()
      ]);
      
      setSaveSuccess('Configuration updated successfully!');
      setTimeout(() => setSaveSuccess(null), 3000);
      setShowEditDialog(false);
      setEditingConfig(null);
    } catch (error) {
      setConnectionError(error instanceof Error ? error.message : 'Failed to update configuration');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <FaHome className="text-3xl text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Home Assistant Integration</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Connect and manage your Home Assistant devices
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {/* Real-time Connection Status */}
          <Badge 
            variant={realtimeConnected ? "default" : "secondary"}
            className={realtimeConnected ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}
          >
            <FaWifi className="mr-1" />
            Real-time: {connectionStatus}
          </Badge>
          
          {/* HA Connection Status */}
          {status.connected ? (
            <Badge className="bg-green-100 text-green-800">
              <FaCheck className="mr-1" /> Connection: connected
            </Badge>
          ) : (
            <Badge className="bg-gray-100 text-gray-800">
              <FaExclamationTriangle className="mr-1" /> Connection: not connected
            </Badge>
          )}
        </div>
      </div>

      <Tabs defaultValue="setup" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="setup">
            <FaCog className="mr-2" />
            Setup
          </TabsTrigger>
          <TabsTrigger value="devices">
            <FaDownload className="mr-2" />
            Import Devices
          </TabsTrigger>
          <TabsTrigger value="assignments">
            <FaMapPin className="mr-2" />
            Assignments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="setup" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Connection Configuration</CardTitle>
              <CardDescription>
                Configure your Home Assistant connection settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ha-url">Home Assistant URL</Label>
                  <Input
                    id="ha-url"
                    placeholder="http://homeassistant.local:8123"
                    value={config.url}
                    onChange={(e) => setConfig(prev => ({ ...prev, url: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ha-token">Access Token</Label>
                  <Input
                    id="ha-token"
                    type="password"
                    placeholder="Your long-lived access token"
                    value={config.token}
                    onChange={(e) => setConfig(prev => ({ ...prev, token: e.target.value }))}
                  />
                </div>
              </div>

              {/* Cloudflare Access Configuration */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Label className="text-sm font-medium">Cloudflare Access (Optional)</Label>
                  <Badge variant="secondary" className="text-xs">
                    For Cloudflare-protected Home Assistant instances
                  </Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cf-client-id">Service Client ID</Label>
                    <Input
                      id="cf-client-id"
                      placeholder="xxxxxxxx.access"
                      value={config.cloudflare_client_id || ''}
                      onChange={(e) => setConfig(prev => ({ 
                        ...prev, 
                        cloudflare_client_id: e.target.value || undefined 
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cf-client-secret">Service Client Secret</Label>
                    <Input
                      id="cf-client-secret"
                      type="password"
                      placeholder="Your Cloudflare service token"
                      value={config.cloudflare_client_secret || ''}
                      onChange={(e) => setConfig(prev => ({ 
                        ...prev, 
                        cloudflare_client_secret: e.target.value || undefined 
                      }))}
                    />
                  </div>
                </div>
              </div>

              {connectionError && (
                <Alert variant="destructive">
                  <FaExclamationTriangle className="h-4 w-4" />
                  <AlertDescription>{connectionError}</AlertDescription>
                </Alert>
              )}

              {saveSuccess && (
                <Alert>
                  <FaCheckCircle className="h-4 w-4" />
                  <AlertDescription>{saveSuccess}</AlertDescription>
                </Alert>
              )}

              {status.connected && (
                <Alert>
                  <FaCheck className="h-4 w-4" />
                  <AlertDescription>
                    Successfully connected to Home Assistant {status.version && `(${status.version})`}
                    {status.device_count && ` with ${status.device_count} devices`}
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button 
                  onClick={handleSaveConfiguration} 
                  disabled={!config.url || !config.token || isSaving}
                  variant="outline"
                  className="w-full md:w-auto"
                >
                  {isSaving ? 'Saving...' : 'Save Configuration'}
                </Button>
                <Button 
                  onClick={handleTestConnection} 
                  disabled={!config.url || !config.token || isConnecting}
                  className="w-full md:w-auto"
                >
                  {isConnecting ? 'Testing...' : 'Test Connection'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Saved Configurations */}
          {allConfigs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Saved Configurations</span>
                  <Badge variant="secondary">{allConfigs.length} configuration{allConfigs.length !== 1 ? 's' : ''}</Badge>
                </CardTitle>
                <CardDescription>
                  Manage your saved Home Assistant configurations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {allConfigs.map((configItem) => (
                    <div key={configItem.id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {configItem.name || 'Unnamed Configuration'}
                          </h4>
                          {configItem.enabled && (
                            <Badge className="bg-green-100 text-green-800 text-xs">
                              Default
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          <div>{configItem.url}</div>
                          <div className="text-xs text-gray-500">
                            Created: {new Date(configItem.created_at).toLocaleDateString()}
                            {configItem.updated_at !== configItem.created_at && (
                              <span> • Updated: {new Date(configItem.updated_at).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditConfiguration(configItem)}
                          disabled={isDeleting === configItem.id}
                          title="Edit Configuration"
                        >
                          <FaCog className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteConfiguration(configItem.id)}
                          disabled={isDeleting === configItem.id}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          {isDeleting === configItem.id ? (
                            <div className="animate-spin h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full" />
                          ) : (
                            <span>Delete</span>
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="devices" className="space-y-6">
          {/* Header with discovery and stats */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Import Home Assistant Devices</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Discover and import devices from your Home Assistant instance
              </p>
            </div>
            <Button 
              onClick={handleDiscoverDevices} 
              disabled={!status.connected || isLoadingDevices}
              className="flex items-center space-x-2"
            >
              <FaSearch />
              <span>{isLoadingDevices ? 'Discovering...' : 'Discover Devices'}</span>
            </Button>
          </div>

          {/* Connection status and stats */}
          {status.connected && discoveredDevices.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex space-x-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{discoveredDevices.length}</div>
                      <div className="text-sm text-gray-600">Discovered</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{importedDevices.length}</div>
                      <div className="text-sm text-gray-600">Imported</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{assignments.length}</div>
                      <div className="text-sm text-gray-600">Assigned</div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Badge variant="outline">
                      💡 {getDeviceTypeCount(discoveredDevices, 'lights')} Lights
                    </Badge>
                    <Badge variant="outline">
                      🔌 {getDeviceTypeCount(discoveredDevices, 'switches')} Switches
                    </Badge>
                    <Badge variant="outline">
                      🌡️ {getDeviceTypeCount(discoveredDevices, 'sensors')} Sensors
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {deviceError && (
            <Alert>
              <FaExclamationTriangle className="h-4 w-4" />
              <AlertDescription>{deviceError}</AlertDescription>
            </Alert>
          )}

          {!status.connected ? (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <p className="text-gray-500">Please configure and connect to Home Assistant first</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: Available Devices */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      <FaCircle className="text-gray-400" />
                      <span>Available Devices</span>
                    </CardTitle>
                    <Badge variant="secondary">{getFilteredDevices(discoveredDevices).length}</Badge>
                  </div>
                  <CardDescription>
                    Select devices to import into your vertical farm system
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Filters and Search */}
                  <div className="flex space-x-2">
                    <div className="flex-1">
                      <Input
                        placeholder="Search devices..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full"
                      />
                    </div>
                    <Select value={deviceFilter} onValueChange={(value: any) => setDeviceFilter(value)}>
                      <SelectTrigger className="w-[140px]">
                        <FaFilter className="mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lights">💡 Lights</SelectItem>
                        <SelectItem value="switches">🔌 Switches</SelectItem>
                        <SelectItem value="sensors">🌡️ Sensors</SelectItem>
                        <SelectItem value="all">📱 All Types</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Bulk actions */}
                  {selectedForImport.size > 0 && (
                    <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <span className="text-sm text-blue-700 dark:text-blue-300">
                        {selectedForImport.size} devices selected
                      </span>
                      <Button 
                        size="sm" 
                        onClick={handleImportSelected}
                        disabled={isImporting}
                        className="flex items-center space-x-2"
                      >
                        <FaArrowRight />
                        <span>{isImporting ? 'Importing...' : 'Import Selected'}</span>
                      </Button>
                    </div>
                  )}

                  {/* Device list */}
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {getFilteredDevices(discoveredDevices).map((device) => {
                      const isSelected = selectedForImport.has(device.entity_id);
                      const isAlreadyImported = importedDevices.some(d => d.entity_id === device.entity_id);
                      
                      return (
                        <div 
                          key={device.entity_id} 
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            isAlreadyImported 
                              ? 'bg-green-50 border-green-200 dark:bg-green-900/20' 
                              : isSelected 
                                ? 'bg-blue-50 border-blue-300 dark:bg-blue-900/20' 
                                : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                          }`}
                          onClick={() => !isAlreadyImported && toggleDeviceSelection(device.entity_id)}
                        >
                          <div className="flex items-center space-x-3">
                            <Checkbox 
                              checked={isAlreadyImported || isSelected}
                              disabled={isAlreadyImported}
                              onChange={() => !isAlreadyImported && toggleDeviceSelection(device.entity_id)}
                            />
                            {getDeviceIcon(device.domain)}
                            <div className="flex-1">
                              <div className="font-medium">{device.friendly_name || device.entity_id}</div>
                              <div className="text-sm text-gray-500">{device.entity_id}</div>
                              {device.area && (
                                <div className="text-xs text-gray-400">📍 {device.area}</div>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge variant={device.state === 'on' ? 'default' : 'secondary'} className="text-xs">
                                {device.state}
                              </Badge>
                              {getDeviceStatusIcon(device)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    
                    {getFilteredDevices(discoveredDevices).length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        {discoveredDevices.length === 0 
                          ? 'No devices discovered yet. Click "Discover Devices" to start.'
                          : 'No devices match your current filter.'
                        }
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Right Column: Imported Devices */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FaCheckCircle className="text-green-500" />
                    <span>Imported Devices</span>
                    <Badge variant="default">{importedDevices.length}</Badge>
                  </CardTitle>
                  <CardDescription>
                    Devices ready for assignment to farm locations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {importedDevices.map((device) => {
                      const assignment = getAssignment(device.entity_id);
                      return (
                        <div key={device.entity_id} className="p-3 border rounded-lg bg-green-50 dark:bg-green-900/20">
                          <div className="flex items-center space-x-3">
                            {getDeviceIcon(device.domain)}
                            <div className="flex-1">
                              <div className="font-medium">{device.friendly_name || device.entity_id}</div>
                              <div className="text-sm text-gray-500">{device.entity_id}</div>
                              {device.area && !assignment && (
                                <div className="text-xs text-gray-400">📍 {device.area}</div>
                              )}
                              {assignment && (
                                <div className="text-xs text-blue-600 dark:text-blue-400">
                                  📍 {getLocationString(assignment)}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge variant={device.state === 'on' ? 'default' : 'secondary'} className="text-xs">
                                {device.state}
                              </Badge>
                              {assignment ? (
                                <FaMapPin className="text-blue-500" title="Assigned" />
                              ) : (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedDevice(device);
                                    setAssignmentModalOpen(true);
                                  }}
                                >
                                  Assign
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    
                    {importedDevices.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        No devices imported yet. Select devices from the left to import them.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="assignments" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Device Assignments</h2>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Assigned Devices</CardTitle>
              <CardDescription>
                Devices currently assigned to farm locations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {assignments.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Device</TableHead>
                      <TableHead>Entity ID</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>State</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignments.map((assignment) => {
                      const device = [...discoveredDevices, ...importedDevices].find(d => d.entity_id === assignment.entity_id);
                      return (
                        <TableRow key={assignment.entity_id}>
                          <TableCell className="flex items-center space-x-2">
                            {device && getDeviceIcon(device.domain)}
                            <span>{device?.friendly_name || assignment.entity_id}</span>
                          </TableCell>
                          <TableCell className="font-mono text-sm">{assignment.entity_id}</TableCell>
                          <TableCell>{getLocationString(assignment)}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{assignment.entity_type}</Badge>
                          </TableCell>
                          <TableCell>
                            {device && (
                              <Badge variant={device.state === 'on' ? 'default' : 'secondary'}>
                                {device.state}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              {device && (device.domain === 'light' || device.domain === 'switch') && (
                                <Switch
                                  checked={device.state === 'on'}
                                  onCheckedChange={(checked) => 
                                    handleDeviceControl(device, checked ? 'turn_on' : 'turn_off')
                                  }
                                />
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRemoveAssignment(assignment.entity_id)}
                              >
                                Remove
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {assignments.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                          No device assignments yet. Import devices and assign them to farm locations.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No device assignments yet. Import devices and assign them to farm locations.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Configuration Modal */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Configuration</DialogTitle>
            <DialogDescription>
              Update your Home Assistant connection settings
            </DialogDescription>
          </DialogHeader>
          
          {editingConfig && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Configuration Name</Label>
                  <Input
                    id="edit-name"
                    placeholder="My Home Assistant"
                    value={editingConfig.name || ''}
                    onChange={(e) => setEditingConfig((prev: any) => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-url">Home Assistant URL</Label>
                  <Input
                    id="edit-url"
                    placeholder="http://homeassistant.local:8123"
                    value={editingConfig.url}
                    onChange={(e) => setEditingConfig((prev: any) => ({ ...prev, url: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-token">Access Token</Label>
                  <Input
                    id="edit-token"
                    type="password"
                    placeholder="Enter new token to update"
                    value={editingConfig.token || ''}
                    onChange={(e) => setEditingConfig((prev: any) => ({ ...prev, token: e.target.value }))}
                  />
                  <p className="text-xs text-gray-500">Leave empty to keep existing token</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-local-url">Local URL (Optional)</Label>
                  <Input
                    id="edit-local-url"
                    placeholder="http://192.168.1.100:8123"
                    value={editingConfig.local_url || ''}
                    onChange={(e) => setEditingConfig((prev: any) => ({ ...prev, local_url: e.target.value }))}
                  />
                </div>
              </div>

              {/* Cloudflare Settings */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Label className="text-sm font-medium">Cloudflare Access (Optional)</Label>
                  <Badge variant="secondary" className="text-xs">
                    For Cloudflare-protected instances
                  </Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-cf-id">Service Client ID</Label>
                    <Input
                      id="edit-cf-id"
                      placeholder="xxxxxxxx.access"
                      value={editingConfig.cloudflare_client_id || ''}
                      onChange={(e) => setEditingConfig((prev: any) => ({ 
                        ...prev, 
                        cloudflare_client_id: e.target.value || undefined 
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-cf-secret">Service Client Secret</Label>
                    <Input
                      id="edit-cf-secret"
                      type="password"
                      placeholder="Enter new secret to update"
                      value={editingConfig.cloudflare_client_secret || ''}
                      onChange={(e) => setEditingConfig((prev: any) => ({ 
                        ...prev, 
                        cloudflare_client_secret: e.target.value || undefined 
                      }))}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowEditDialog(false);
                    setEditingConfig(null);
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSaveEditConfiguration}
                  disabled={!editingConfig.url || isSaving}
                >
                  {isSaving ? 'Saving...' : 'Update Configuration'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Assignment Modal */}
      <Dialog open={assignmentModalOpen} onOpenChange={setAssignmentModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Device to Farm Location</DialogTitle>
            <DialogDescription>
              Assign {selectedDevice?.friendly_name || selectedDevice?.entity_id} to a specific location in your vertical farm
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-blue-50 p-3 rounded-lg mb-4">
              <p className="text-sm text-blue-700">
                <strong>Device Type:</strong> {selectedDevice?.domain || 'unknown'} 
                <span className="text-blue-600 ml-2">({selectedDevice?.friendly_name})</span>
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Row ID</Label>
                <Input
                  placeholder="row001"
                  value={assignmentForm.row_id}
                  onChange={(e) => 
                    setAssignmentForm(prev => ({ ...prev, row_id: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Rack ID</Label>
                <Input
                  placeholder="rack002"
                  value={assignmentForm.rack_id}
                  onChange={(e) => 
                    setAssignmentForm(prev => ({ ...prev, rack_id: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Shelf ID</Label>
                <Input
                  placeholder="shelf003"
                  value={assignmentForm.shelf_id}
                  onChange={(e) => 
                    setAssignmentForm(prev => ({ ...prev, shelf_id: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setAssignmentModalOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleAssignDevice}>
                Assign Device
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 