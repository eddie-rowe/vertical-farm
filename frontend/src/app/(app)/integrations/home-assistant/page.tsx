'use client';

import { useState, useEffect, useCallback } from 'react';
import { FaHome, FaCheck, FaExclamationTriangle, FaPlug, FaLightbulb, FaFan, FaThermometerHalf } from 'react-icons/fa';
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
import { 
  homeAssistantService, 
  HADevice, 
  HAConfig, 
  HAConnectionStatus, 
  DeviceAssignment 
} from '@/services/homeAssistantService';

export default function HomeAssistantPage() {
  // Connection state
  const [config, setConfig] = useState<HAConfig>({ url: '', token: '', enabled: false });
  const [status, setStatus] = useState<HAConnectionStatus>({ connected: false });
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Device state
  const [devices, setDevices] = useState<HADevice[]>([]);
  const [assignments, setAssignments] = useState<DeviceAssignment[]>([]);
  const [isLoadingDevices, setIsLoadingDevices] = useState(false);
  const [deviceError, setDeviceError] = useState<string | null>(null);

  // Assignment modal state
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<HADevice | null>(null);
  const [assignmentForm, setAssignmentForm] = useState({
    farm_id: 'farm_1',
    row_id: '',
    rack_id: '',
    shelf_id: '',
    device_role: 'lighting' as 'lighting' | 'irrigation' | 'ventilation' | 'monitoring'
  });

  const loadDevices = useCallback(async () => {
    setIsLoadingDevices(true);
    setDeviceError(null);
    try {
      const devicesData = await homeAssistantService.getDevices();
      setDevices(devicesData);
    } catch (error) {
      console.error('Error loading devices:', error);
      setDeviceError(error instanceof Error ? error.message : 'Failed to load devices');
    } finally {
      setIsLoadingDevices(false);
    }
  }, []);

  const loadStatus = useCallback(async () => {
    try {
      const statusData = await homeAssistantService.getStatus();
      setStatus(statusData);
      if (statusData.connected) {
        loadDevices();
      }
    } catch (error) {
      console.error('Error loading status:', error);
      setStatus({ connected: false });
    }
  }, [loadDevices]);

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

  const loadAssignments = useCallback(async () => {
    try {
      const assignmentsData = await homeAssistantService.getAssignments();
      setAssignments(assignmentsData);
    } catch (error) {
      console.error('Error loading assignments:', error);
    }
  }, []);

  useEffect(() => {
    loadConfig();
    loadStatus();
    loadAssignments();
  }, [loadConfig, loadStatus, loadAssignments]);

  const handleTestConnection = async () => {
    if (!config.url || !config.token) return;

    setIsConnecting(true);
    setConnectionError(null);
    try {
      const result = await homeAssistantService.testConnection(config.url, config.token);
      setStatus(result);
      if (result.connected) {
        await homeAssistantService.saveConfig(config);
        setConfig(prev => ({ ...prev, enabled: true }));
        loadDevices();
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
      setDevices(newDevices);
    } catch (error) {
      console.error('Error discovering devices:', error);
      setDeviceError(error instanceof Error ? error.message : 'Failed to discover devices');
    } finally {
      setIsLoadingDevices(false);
    }
  };

  const handleDeviceControl = async (device: HADevice, action: 'turn_on' | 'turn_off' | 'toggle') => {
    try {
      if (device.device_type === 'light') {
        await homeAssistantService.controlLight(device.entity_id, action);
      } else {
        await homeAssistantService.controlDevice({
          entity_id: device.entity_id,
          action
        });
      }
      // Refresh devices to get updated state
      setTimeout(loadDevices, 500);
    } catch (error) {
      console.error('Error controlling device:', error);
    }
  };

  const handleAssignDevice = async () => {
    if (!selectedDevice) return;

    try {
      const assignment: DeviceAssignment = {
        entity_id: selectedDevice.entity_id,
        farm_id: assignmentForm.farm_id,
        row_id: assignmentForm.row_id || undefined,
        rack_id: assignmentForm.rack_id || undefined,
        shelf_id: assignmentForm.shelf_id || undefined,
        device_role: assignmentForm.device_role,
      };

      await homeAssistantService.saveAssignment(assignment);
      await loadAssignments();
      setAssignmentModalOpen(false);
      setSelectedDevice(null);
      setAssignmentForm({
        farm_id: 'farm_1',
        row_id: '',
        rack_id: '',
        shelf_id: '',
        device_role: 'lighting'
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
          {status.connected ? (
            <Badge className="bg-green-100 text-green-800">
              <FaCheck className="mr-1" /> Connected
            </Badge>
          ) : (
            <Badge className="bg-gray-100 text-gray-800">
              <FaExclamationTriangle className="mr-1" /> Not Connected
            </Badge>
          )}
        </div>
      </div>

      <Tabs defaultValue="setup" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="setup">Setup</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
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

              {connectionError && (
                <Alert>
                  <FaExclamationTriangle className="h-4 w-4" />
                  <AlertDescription>{connectionError}</AlertDescription>
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

              <Button 
                onClick={handleTestConnection} 
                disabled={!config.url || !config.token || isConnecting}
                className="w-full md:w-auto"
              >
                {isConnecting ? 'Testing...' : 'Test Connection'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="devices" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Discovered Devices</h2>
            <Button 
              onClick={handleDiscoverDevices} 
              disabled={!status.connected || isLoadingDevices}
            >
              {isLoadingDevices ? 'Discovering...' : 'Discover Devices'}
            </Button>
          </div>

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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {devices.map((device) => {
                const assignment = getAssignment(device.entity_id);
                return (
                  <Card key={device.entity_id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {getDeviceIcon(device.device_type)}
                          <CardTitle className="text-lg">{device.name}</CardTitle>
                        </div>
                        <Badge variant={device.state === 'on' ? 'default' : 'secondary'}>
                          {device.state}
                        </Badge>
                      </div>
                      <CardDescription>{device.entity_id}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {assignment && (
                        <div className="text-sm text-blue-600 dark:text-blue-400">
                          Assigned: {getLocationString(assignment)}
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-2">
                        {(device.device_type === 'light' || device.device_type === 'switch') && (
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={device.state === 'on'}
                              onCheckedChange={(checked) => 
                                handleDeviceControl(device, checked ? 'turn_on' : 'turn_off')
                              }
                            />
                            <Label>{device.state === 'on' ? 'On' : 'Off'}</Label>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedDevice(device);
                            setAssignmentModalOpen(true);
                          }}
                          className="flex-1"
                        >
                          {assignment ? 'Reassign' : 'Assign'}
                        </Button>
                        {assignment && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRemoveAssignment(device.entity_id)}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="assignments" className="space-y-6">
          <h2 className="text-xl font-semibold">Device Assignments</h2>
          
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Device</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>State</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignments.map((assignment) => {
                    const device = devices.find(d => d.entity_id === assignment.entity_id);
                    return (
                      <TableRow key={assignment.entity_id}>
                        <TableCell className="flex items-center space-x-2">
                          {device && getDeviceIcon(device.device_type)}
                          <span>{device?.name || assignment.entity_id}</span>
                        </TableCell>
                        <TableCell>{device?.device_type || 'Unknown'}</TableCell>
                        <TableCell className="capitalize">{assignment.device_role}</TableCell>
                        <TableCell>{getLocationString(assignment)}</TableCell>
                        <TableCell>
                          {device && (
                            <Badge variant={device.state === 'on' ? 'default' : 'secondary'}>
                              {device.state}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            {device && (device.device_type === 'light' || device.device_type === 'switch') && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeviceControl(device, 'toggle')}
                              >
                                Toggle
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="destructive"
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
                        No device assignments yet. Assign devices from the Devices tab.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Assignment Modal */}
      <Dialog open={assignmentModalOpen} onOpenChange={setAssignmentModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Device to Farm Location</DialogTitle>
            <DialogDescription>
              Assign {selectedDevice?.name} to a specific location in your vertical farm
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Device Role</Label>
              <Select
                value={assignmentForm.device_role}
                onValueChange={(value: 'lighting' | 'irrigation' | 'ventilation' | 'monitoring') => 
                  setAssignmentForm(prev => ({ ...prev, device_role: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lighting">Lighting</SelectItem>
                  <SelectItem value="irrigation">Irrigation</SelectItem>
                  <SelectItem value="ventilation">Ventilation</SelectItem>
                  <SelectItem value="monitoring">Monitoring</SelectItem>
                </SelectContent>
              </Select>
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