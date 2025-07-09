import { useState, useEffect, useCallback } from 'react';
import { 
  squareService, 
  SquareConfig, 
  SquareConfigCreate,
  SquareConfigUpdate,
  SquareConnectionStatus, 
  SquareLocation
} from '@/services/squareService';
import { 
  SyncStatus, 
  ConnectionHealth, 
  SyncSettings, 
  TestResult 
} from '../types';
import { 
  DEFAULT_SYNC_STATUSES, 
  DEFAULT_CONNECTION_HEALTH, 
  DEFAULT_SYNC_SETTINGS 
} from '../data';

export const useSquareIntegration = () => {
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

  // Integration management state
  const [connectionHealth, setConnectionHealth] = useState<ConnectionHealth>(DEFAULT_CONNECTION_HEALTH);
  const [syncStatuses, setSyncStatuses] = useState<SyncStatus[]>(DEFAULT_SYNC_STATUSES);
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [syncSettings, setSyncSettings] = useState<SyncSettings>(DEFAULT_SYNC_SETTINGS);

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

  // Configuration management functions
  const handleCreateConfiguration = async () => {
    if (!newConfig.name || !newConfig.application_id || !newConfig.access_token) {
      setConnectionError('Please fill in all required fields');
      return;
    }

    setIsSaving(true);
    setConnectionError(null);
    
    try {
      await squareService.createConfig(newConfig);
      await loadConfigs();
      setNewConfig({
        name: '',
        application_id: '',
        access_token: '',
        environment: 'sandbox'
      });
      setShowCreateDialog(false);
      setSaveSuccess('Configuration created successfully');
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
    
    try {
      await squareService.updateConfig(editingConfig.id, editingConfig);
      await loadConfigs();
      setEditingConfig(null);
      setShowEditDialog(false);
      setSaveSuccess('Configuration updated successfully');
    } catch (error) {
      setConnectionError(error instanceof Error ? error.message : 'Failed to update configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfiguration = async (configId: string) => {
    setIsDeleting(configId);
    setConnectionError(null);
    
    try {
      await squareService.deleteConfig(configId);
      await loadConfigs();
      setSaveSuccess('Configuration deleted successfully');
    } catch (error) {
      setConnectionError(error instanceof Error ? error.message : 'Failed to delete configuration');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleTestConnection = async (configId: string) => {
    setIsTesting(true);
    setConnectionError(null);
    setTestResult(null);
    
    try {
      const result = await squareService.testConnection(configId);
      setStatus(result);
      setTestResult({
        type: 'success',
        message: result.connected ? 'Connection successful!' : 'Connection failed'
      });
    } catch (error) {
      setTestResult({
        type: 'error',
        message: error instanceof Error ? error.message : 'Connection test failed'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSetActiveConfig = async (configId: string) => {
    setConnectionError(null);
    
    try {
      await squareService.setActiveConfig(configId);
      await loadConfigs();
      setSaveSuccess('Active configuration updated');
    } catch (error) {
      setConnectionError(error instanceof Error ? error.message : 'Failed to set active configuration');
    }
  };

  const handleEditConfiguration = (config: SquareConfig) => {
    setEditingConfig({
      id: config.id!,
      name: config.name,
      application_id: config.application_id,
      access_token: config.access_token,
      environment: config.environment
    });
    setShowEditDialog(true);
  };

  const checkConnectionHealth = async () => {
    if (!activeConfig?.id) return;
    
    try {
      const result = await squareService.testConnection(activeConfig.id);
      setConnectionHealth(prev => ({
        ...prev,
        status: result.connected ? 'connected' : 'disconnected',
        lastCheck: new Date().toLocaleString(),
        responseTime: Math.floor(Math.random() * 100) + 50 // Mock response time
      }));
    } catch (error) {
      setConnectionHealth(prev => ({
        ...prev,
        status: 'error',
        lastCheck: new Date().toLocaleString()
      }));
    }
  };

  const handleManualSync = async () => {
    if (!activeConfig?.id) return;
    
    setIsManualSyncing(true);
    
    try {
      // Mock sync process
      setSyncStatuses(prev => prev.map(sync => ({ ...sync, status: 'syncing' as const })));
      
      // Simulate sync delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update sync statuses
      setSyncStatuses(prev => prev.map(sync => ({
        ...sync,
        status: 'success' as const,
        lastSync: 'Just now'
      })));
    } catch (error) {
      setSyncStatuses(prev => prev.map(sync => ({ ...sync, status: 'error' as const })));
    } finally {
      setIsManualSyncing(false);
    }
  };

  const handleSaveConfig = async () => {
    if (editingConfig?.id) {
      await handleUpdateConfiguration();
    } else {
      await handleCreateConfiguration();
    }
  };

  // Utility functions
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

  const getStatusBadge = (connected: boolean) => {
    return connected ? 'Connected' : 'Disconnected';
  };

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

  return {
    // Configuration state
    configs,
    activeConfig,
    configsLoading,
    newConfig,
    setNewConfig,
    editingConfig,
    setEditingConfig,
    showCreateDialog,
    setShowCreateDialog,
    showEditDialog,
    setShowEditDialog,
    isSaving,
    isDeleting,
    connectionError,
    setConnectionError,
    saveSuccess,
    setSaveSuccess,

    // Connection state
    status,
    isConnecting,

    // Data state
    locations,

    // UI state
    showSetupGuide,
    setShowSetupGuide,

    // Integration management state
    connectionHealth,
    setConnectionHealth,
    syncStatuses,
    setSyncStatuses,
    isManualSyncing,
    isTesting,
    testResult,
    setTestResult,
    syncSettings,
    setSyncSettings,

    // Functions
    loadConfigs,
    loadSquareData,
    handleCreateConfiguration,
    handleUpdateConfiguration,
    handleDeleteConfiguration,
    handleTestConnection,
    handleSetActiveConfig,
    handleEditConfiguration,
    checkConnectionHealth,
    handleManualSync,
    handleSaveConfig,
    getStatusColor,
    getStatusBadge,
  };
}; 