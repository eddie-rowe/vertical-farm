'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  FaCreditCard, FaCheck, FaExclamationTriangle, FaDownload, FaCog,
  FaCheckCircle, FaCircle, FaWifi, FaPlus, FaEdit,
  FaSync, FaTrash, FaInfoCircle,
  FaTachometerAlt, FaWrench, FaDatabase, FaClock, FaChartLine
} from 'react-icons/fa';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
  CheckCircle, XCircle, Activity, Settings, Zap, BarChart3, Shield, Globe,
  Users, ShoppingCart, CreditCard, Package, RefreshCw, Clock, TrendingUp,
  Database, AlertTriangle, Info, RotateCcw
} from 'lucide-react';

import { Checkbox } from '@/components/ui/checkbox';
import { 
  squareService, 
  SquareConfig, 
  SquareConfigCreate,
  SquareConfigUpdate,
  SquareConnectionStatus, 
  SquareLocation,
  SquareProduct,
  SquareCustomer,
  SquareOrder,
  SquarePayment
} from '@/services/squareService';
import { SquareSetupGuide } from '@/components/features/automation';

interface SyncStatus {
  entity: string;
  icon: React.ComponentType<any>;
  lastSync: string;
  status: 'success' | 'error' | 'syncing' | 'pending';
  recordCount: number;
  errorMessage?: string;
}

interface ConnectionHealth {
  status: 'connected' | 'disconnected' | 'error';
  lastCheck: string;
  responseTime: number;
  apiLimitUsed: number;
  apiLimitTotal: number;
}

export default function SquareIntegrationPage() {
  // Configuration state
  const [configs, setConfigs] = useState<SquareConfig[]>([]);
  const [activeConfig, setActiveConfig] = useState<SquareConfig | null>(null);
  const [configsLoading, setConfigsLoading] = useState(true);
  const [newConfig, setNewConfig] = useState<SquareConfigCreate>({
    name: '',
    application_id: '',
    access_token: '',
    environment: 'sandbox'
  });
  const [editingConfig, setEditingConfig] = useState<SquareConfigUpdate & { id: string } | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // Connection state
  const [status, setStatus] = useState<SquareConnectionStatus>({ connected: false, environment: 'sandbox' });
  const [isConnecting, setIsConnecting] = useState(false);

  // Data state
  const [locations, setLocations] = useState<SquareLocation[]>([]);

  // UI state
  const [showSetupGuide, setShowSetupGuide] = useState(false);

  // New state for integration management
  const [connectionHealth, setConnectionHealth] = useState<ConnectionHealth>({
    status: 'disconnected',
    lastCheck: 'Never',
    responseTime: 0,
    apiLimitUsed: 0,
    apiLimitTotal: 1000
  });

  const [syncStatuses, setSyncStatuses] = useState<SyncStatus[]>([
    {
      entity: 'Customers',
      icon: Users,
      lastSync: '2 minutes ago',
      status: 'success',
      recordCount: 1247,
    },
    {
      entity: 'Orders',
      icon: ShoppingCart,
      lastSync: '5 minutes ago',
      status: 'success',
      recordCount: 456,
    },
    {
      entity: 'Payments',
      icon: CreditCard,
      lastSync: '3 minutes ago',
      status: 'success',
      recordCount: 342,
    },
    {
      entity: 'Inventory',
      icon: Package,
      lastSync: '10 minutes ago',
      status: 'success',
      recordCount: 89,
    }
  ]);

  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{type: 'success' | 'error', message: string} | null>(null);

  // Sync settings
  const [syncSettings, setSyncSettings] = useState({
    autoSync: true,
    syncInterval: '15', // minutes
    syncOnlyBusinessHours: false,
    businessHoursStart: '09:00',
    businessHoursEnd: '17:00',
    enableCustomers: true,
    enableOrders: true,
    enablePayments: true,
    enableInventory: true,
  });

  // Load all configurations
  const loadConfigs = useCallback(async () => {
    try {
      setConfigsLoading(true);
      const configsData = await squareService.getConfigs();
      setConfigs(configsData);
      
      // Set the first active config as the active one, or first config if none active
      const active = configsData.find(c => c.is_active) || configsData[0] || null;
      setActiveConfig(active);
      
      // Load status for active config
      if (active?.id) {
        const statusData = await squareService.testConnection(active.id);
        setStatus(statusData);
      }
    } catch (error) {
      console.error('Error loading Square configs:', error);
      setConnectionError('Failed to load Square configurations');
    } finally {
      setConfigsLoading(false);
    }
  }, []);

  // Load Square data for the active configuration
  const loadSquareData = useCallback(async () => {
    if (!activeConfig?.id) return;
    
    try {
      // Load locations for location filtering in Advanced tab
      const locationsData = await squareService.getLocations(activeConfig.id);
      setLocations(locationsData);
    } catch (error) {
      console.error('Error loading Square data:', error);
      setConnectionError('Failed to load Square data');
    }
  }, [activeConfig?.id]);

  // Initial load
  useEffect(() => {
    loadConfigs();
  }, [loadConfigs]);

  // Load data when active config changes
  useEffect(() => {
    if (activeConfig && !configsLoading) {
      loadSquareData();
    }
  }, [activeConfig, configsLoading, loadSquareData]);

  // Configuration management functions
  const handleCreateConfiguration = async () => {
    if (!newConfig.name || !newConfig.application_id || !newConfig.access_token) {
      setConnectionError('Please fill in all required fields');
      return;
    }

    setIsSaving(true);
    setConnectionError(null);
    setSaveSuccess(null);
    
    try {
      await squareService.createConfig(newConfig);
      await loadConfigs();
      setSaveSuccess('Configuration created successfully!');
      setShowCreateDialog(false);
      setNewConfig({
        name: '',
        application_id: '',
        access_token: '',
        environment: 'sandbox'
      });
      setTimeout(() => setSaveSuccess(null), 3000);
    } catch (error) {
      setConnectionError(error instanceof Error ? error.message : 'Failed to create configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateConfiguration = async () => {
    if (!editingConfig?.id) return;

    setIsSaving(true);
    setConnectionError(null);
    setSaveSuccess(null);
    
    try {
      const { id, ...updateData } = editingConfig;
      await squareService.updateConfig(id, updateData);
      await loadConfigs();
      setSaveSuccess('Configuration updated successfully!');
      setShowEditDialog(false);
      setEditingConfig(null);
      setTimeout(() => setSaveSuccess(null), 3000);
    } catch (error) {
      setConnectionError(error instanceof Error ? error.message : 'Failed to update configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfiguration = async (configId: string) => {
    setIsDeleting(configId);
    setConnectionError(null);
    setSaveSuccess(null);
    
    try {
      await squareService.deleteConfig(configId);
      await loadConfigs();
      setSaveSuccess('Configuration deleted successfully!');
      setTimeout(() => setSaveSuccess(null), 3000);
    } catch (error) {
      setConnectionError(error instanceof Error ? error.message : 'Failed to delete configuration');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleTestConnection = async (configId: string) => {
    setIsConnecting(true);
    setConnectionError(null);
    
    try {
      const result = await squareService.testConnection(configId);
      setStatus(result);
      
      if (result.connected) {
        setSaveSuccess('Connection test successful!');
        setTimeout(() => setSaveSuccess(null), 3000);
      } else {
        setConnectionError(result.error_message || 'Connection test failed');
      }
    } catch (error) {
      setConnectionError(error instanceof Error ? error.message : 'Connection test failed');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSetActiveConfig = async (configId: string) => {
    try {
      // First, set all configs to inactive
      await Promise.all(
        configs.map(config => 
          squareService.updateConfig(config.id!, { is_active: false })
        )
      );
      
      // Then set the selected config as active
      await squareService.updateConfig(configId, { is_active: true });
      
      // Reload configs
      await loadConfigs();
      setSaveSuccess('Active configuration updated!');
      setTimeout(() => setSaveSuccess(null), 3000);
    } catch (error) {
      setConnectionError(error instanceof Error ? error.message : 'Failed to update active configuration');
    }
  };

  const handleEditConfiguration = (config: SquareConfig) => {
    setEditingConfig({
      id: config.id!,
      name: config.name,
      application_id: config.application_id,
      access_token: '', // Don't populate token for security
      environment: config.environment,
      webhook_signature_key: config.webhook_signature_key,
      webhook_url: config.webhook_url,
    });
    setShowEditDialog(true);
  };

  // Helper functions
  const getStatusBadge = (connected: boolean) => {
    return connected ? (
      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <span>Connected</span>
        </div>
      </Badge>
    ) : (
      <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 rounded-full bg-gray-400"></div>
          <span>Not Connected</span>
        </div>
      </Badge>
    );
  };

  const checkConnectionHealth = async () => {
    if (!activeConfig?.id) return;
    
    try {
      const startTime = Date.now();
      // Test connection with a simple API call
      await squareService.getLocations(activeConfig.id);
      const responseTime = Date.now() - startTime;
      
      setConnectionHealth({
        status: 'connected',
        lastCheck: 'Just now',
        responseTime,
        apiLimitUsed: Math.floor(Math.random() * 200), // Mock data
        apiLimitTotal: 1000
      });
    } catch (error) {
      setConnectionHealth(prev => ({
        ...prev,
        status: 'error',
        lastCheck: 'Just now'
      }));
    }
  };

  const handleManualSync = async () => {
    setIsManualSyncing(true);
    
    // Update sync statuses to show syncing state
    setSyncStatuses(prev => prev.map(status => ({
      ...status,
      status: 'syncing' as const
    })));

    try {
      // Simulate sync process
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Update sync statuses to show success
      setSyncStatuses(prev => prev.map(status => ({
        ...status,
        status: 'success' as const,
        lastSync: 'Just now'
      })));
      
      checkConnectionHealth();
    } catch (error) {
      setSyncStatuses(prev => prev.map(status => ({
        ...status,
        status: 'error' as const
      })));
    } finally {
      setIsManualSyncing(false);
    }
  };

  const handleSaveConfig = async () => {
    try {
      if (activeConfig?.id) {
        await squareService.updateConfig(activeConfig.id, newConfig);
      } else {
        await squareService.createConfig(newConfig);
      }
      await loadConfigs();
      setTestResult({
        type: 'success',
        message: 'Configuration saved successfully!'
      });
    } catch (error) {
      setTestResult({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to save configuration'
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
      case 'success':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'syncing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'error':
      case 'disconnected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
      case 'success':
        return <CheckCircle className="w-4 h-4" />;
      case 'syncing':
        return <RefreshCw className="w-4 h-4 animate-spin" />;
      case 'error':
      case 'disconnected':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  if (configsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header with Connection Status */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Square Integration</h1>
            <div className="flex items-center mt-2 space-x-4">
              <Badge className={`${getStatusColor(connectionHealth.status)} border`}>
                {getStatusIcon(connectionHealth.status)}
                <span className="ml-1 capitalize">{connectionHealth.status}</span>
              </Badge>
              {connectionHealth.status === 'connected' && (
                <>
                  <span className="text-sm text-gray-500">
                    Last sync: {syncStatuses[0]?.lastSync || 'Never'}
                  </span>
                  <span className="text-sm text-gray-500">
                    Response time: {connectionHealth.responseTime}ms
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              onClick={checkConnectionHealth}
              variant="outline"
              size="sm"
              disabled={!activeConfig}
            >
              <Activity className="w-4 h-4 mr-2" />
              Test Connection
            </Button>
            <Button
              onClick={handleManualSync}
              disabled={isManualSyncing || !activeConfig}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isManualSyncing ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RotateCcw className="w-4 h-4 mr-2" />
              )}
              {isManualSyncing ? 'Syncing...' : 'Sync Now'}
            </Button>
          </div>
        </div>

        {/* API Usage Indicator */}
        {connectionHealth.status === 'connected' && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">API Usage</span>
              <span className="text-sm text-gray-500">
                {connectionHealth.apiLimitUsed} / {connectionHealth.apiLimitTotal}
              </span>
            </div>
            <Progress 
              value={(connectionHealth.apiLimitUsed / connectionHealth.apiLimitTotal) * 100} 
              className="h-2"
            />
          </div>
        )}
      </div>

      {/* New 4-Tab Structure */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <BarChart3 className="w-4 h-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="configuration" className="flex items-center space-x-2">
            <Settings className="w-4 h-4" />
            <span>Configuration</span>
          </TabsTrigger>
          <TabsTrigger value="sync" className="flex items-center space-x-2">
            <Database className="w-4 h-4" />
            <span>Data Sync</span>
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center space-x-2">
            <Shield className="w-4 h-4" />
            <span>Advanced</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Dashboard Tab */}
        <TabsContent value="overview" className="space-y-6">
          {!activeConfig ? (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                No Square integration configured. Please set up your connection in the Configuration tab.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              {/* Quick Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {syncStatuses.map((sync) => (
                  <Card key={sync.entity}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                            <sync.icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <p className="font-medium">{sync.entity}</p>
                            <p className="text-2xl font-bold">{sync.recordCount.toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={`${getStatusColor(sync.status)} text-xs`}>
                            {getStatusIcon(sync.status)}
                          </Badge>
                          <p className="text-xs text-gray-500 mt-1">{sync.lastSync}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Data Flow Visualization */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5" />
                    <span>Data Flow Status</span>
                  </CardTitle>
                  <CardDescription>
                    Real-time status of data flowing from Square to Business Management
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {syncStatuses.map((sync) => (
                      <div key={sync.entity} className="flex items-center space-x-4 p-4 border rounded-lg">
                        <div className="flex items-center space-x-3 flex-1">
                          <sync.icon className="w-5 h-5 text-gray-600" />
                          <span className="font-medium">{sync.entity}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                          <span className="text-sm text-gray-500">→</span>
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm font-medium">Business Mgmt</span>
                        </div>
                        <Badge className={`${getStatusColor(sync.status)} text-xs`}>
                          {getStatusIcon(sync.status)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Integration Health */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="w-5 h-5" />
                    <span>Integration Health</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-green-600">99.9%</div>
                      <div className="text-sm text-gray-500">Uptime</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{connectionHealth.responseTime}ms</div>
                      <div className="text-sm text-gray-500">Avg Response</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">0</div>
                      <div className="text-sm text-gray-500">Errors (24h)</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Enhanced Configuration Tab */}
        <TabsContent value="configuration" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Square API Configuration</CardTitle>
              <CardDescription>
                Set up your Square integration credentials and environment settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Configuration Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Production Store"
                    value={newConfig.name}
                    onChange={(e) => setNewConfig(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="environment">Environment</Label>
                  <Select
                    value={newConfig.environment}
                    onValueChange={(value: 'sandbox' | 'production') => 
                      setNewConfig(prev => ({ ...prev, environment: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sandbox">Sandbox (Testing)</SelectItem>
                      <SelectItem value="production">Production (Live)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="applicationId">Application ID</Label>
                <Input
                  id="applicationId"
                  placeholder="Enter your Square Application ID"
                  value={newConfig.application_id}
                  onChange={(e) => setNewConfig(prev => ({ ...prev, application_id: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="accessToken">Access Token</Label>
                <Input
                  id="accessToken"
                  type="password"
                  placeholder="Enter your Square Access Token"
                  value={newConfig.access_token}
                  onChange={(e) => setNewConfig(prev => ({ ...prev, access_token: e.target.value }))}
                />
              </div>

              {testResult && (
                <Alert className={testResult.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
                  {testResult.type === 'error' ? (
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  )}
                  <AlertDescription className={testResult.type === 'error' ? 'text-red-800' : 'text-green-800'}>
                    {testResult.message}
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex space-x-3 pt-4">
                <Button
                  onClick={() => activeConfig?.id && handleTestConnection(activeConfig.id)}
                  variant="outline"
                  disabled={isTesting || !activeConfig?.id}
                >
                  {isTesting ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Zap className="w-4 h-4 mr-2" />
                  )}
                  {isTesting ? 'Testing...' : 'Test Connection'}
                </Button>
                <Button
                  onClick={handleSaveConfig}
                  disabled={!newConfig.name || !newConfig.application_id || !newConfig.access_token}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Save Configuration
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Existing Configurations */}
          {configs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Existing Configurations</CardTitle>
                <CardDescription>Manage your saved Square configurations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {configs.map((config) => (
                    <div key={config.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Badge variant={config.is_active ? "default" : "secondary"}>
                          {config.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <div>
                          <p className="font-medium">{config.name}</p>
                          <p className="text-sm text-gray-500 capitalize">{config.environment}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setNewConfig({
                              name: config.name,
                              environment: config.environment,
                              application_id: config.application_id,
                              access_token: config.access_token
                            });
                          }}
                        >
                          Edit
                        </Button>
                        {!config.is_active && (
                          <Button
                            size="sm"
                            onClick={() => handleSetActiveConfig(config.id!)}
                          >
                            Activate
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Data Sync Controls Tab */}
        <TabsContent value="sync" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sync Settings</CardTitle>
              <CardDescription>
                Configure how and when data is synchronized from Square
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Auto Sync Settings */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="autoSync" className="text-base font-medium">Automatic Sync</Label>
                    <p className="text-sm text-gray-500">Enable automatic data synchronization</p>
                  </div>
                  <Switch
                    id="autoSync"
                    checked={syncSettings.autoSync}
                    onCheckedChange={(checked) => 
                      setSyncSettings(prev => ({ ...prev, autoSync: checked }))
                    }
                  />
                </div>

                {syncSettings.autoSync && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6 border-l-2 border-gray-200">
                    <div className="space-y-2">
                      <Label htmlFor="syncInterval">Sync Interval</Label>
                      <Select
                        value={syncSettings.syncInterval}
                        onValueChange={(value) => 
                          setSyncSettings(prev => ({ ...prev, syncInterval: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">Every 5 minutes</SelectItem>
                          <SelectItem value="15">Every 15 minutes</SelectItem>
                          <SelectItem value="30">Every 30 minutes</SelectItem>
                          <SelectItem value="60">Every hour</SelectItem>
                          <SelectItem value="240">Every 4 hours</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="businessHours"
                          checked={syncSettings.syncOnlyBusinessHours}
                          onCheckedChange={(checked) => 
                            setSyncSettings(prev => ({ ...prev, syncOnlyBusinessHours: checked }))
                          }
                        />
                        <Label htmlFor="businessHours">Business hours only</Label>
                      </div>
                      {syncSettings.syncOnlyBusinessHours && (
                        <div className="flex space-x-2">
                          <Input
                            type="time"
                            value={syncSettings.businessHoursStart}
                            onChange={(e) => 
                              setSyncSettings(prev => ({ ...prev, businessHoursStart: e.target.value }))
                            }
                          />
                          <Input
                            type="time"
                            value={syncSettings.businessHoursEnd}
                            onChange={(e) => 
                              setSyncSettings(prev => ({ ...prev, businessHoursEnd: e.target.value }))
                            }
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Data Type Controls */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Data Types</h3>
                <p className="text-sm text-gray-500">Select which data types to sync from Square</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { key: 'enableCustomers', label: 'Customer Data', icon: Users, description: 'Customer profiles and contact information' },
                    { key: 'enableOrders', label: 'Order Data', icon: ShoppingCart, description: 'Sales orders and transaction details' },
                    { key: 'enablePayments', label: 'Payment Data', icon: CreditCard, description: 'Payment transactions and methods' },
                    { key: 'enableInventory', label: 'Inventory Data', icon: Package, description: 'Product catalog and stock levels' }
                  ].map((item) => (
                    <div key={item.key} className="flex items-center space-x-3 p-4 border rounded-lg">
                      <Switch
                        checked={syncSettings[item.key as keyof typeof syncSettings] as boolean}
                        onCheckedChange={(checked) => 
                          setSyncSettings(prev => ({ ...prev, [item.key]: checked }))
                        }
                      />
                      <item.icon className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="font-medium">{item.label}</p>
                        <p className="text-sm text-gray-500">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button>
                  <Settings className="w-4 h-4 mr-2" />
                  Save Sync Settings
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Manual Sync Controls */}
          <Card>
            <CardHeader>
              <CardTitle>Manual Sync</CardTitle>
              <CardDescription>
                Trigger immediate data synchronization for specific data types
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {syncStatuses.map((sync) => (
                  <div key={sync.entity} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <sync.icon className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="font-medium">{sync.entity}</p>
                        <p className="text-sm text-gray-500">Last sync: {sync.lastSync}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isManualSyncing}
                    >
                      {isManualSyncing ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Tab */}
        <TabsContent value="advanced" className="space-y-6">
          {/* API Monitoring */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5" />
                <span>API Monitoring</span>
              </CardTitle>
              <CardDescription>Monitor Square API performance and usage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{connectionHealth.apiLimitUsed}</div>
                  <div className="text-sm text-gray-500">API Calls (24h)</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{connectionHealth.responseTime}ms</div>
                  <div className="text-sm text-gray-500">Avg Response Time</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">99.9%</div>
                  <div className="text-sm text-gray-500">Success Rate</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Debug Tools */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span>Debug & Troubleshooting</span>
              </CardTitle>
              <CardDescription>Tools for debugging integration issues</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" className="justify-start">
                  <Globe className="w-4 h-4 mr-2" />
                  Test API Endpoints
                </Button>
                <Button variant="outline" className="justify-start">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Clear Cache
                </Button>
                <Button variant="outline" className="justify-start">
                  <Database className="w-4 h-4 mr-2" />
                  View Sync Logs
                </Button>
                <Button variant="outline" className="justify-start">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Error Reports
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Integration Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Integration Settings</CardTitle>
              <CardDescription>Advanced configuration options</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Debug Logging</Label>
                    <p className="text-sm text-gray-500">Enable detailed logging for troubleshooting</p>
                  </div>
                  <Switch />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Data Validation</Label>
                    <p className="text-sm text-gray-500">Validate data integrity during sync</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Error Retry</Label>
                    <p className="text-sm text-gray-500">Automatically retry failed API calls</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 