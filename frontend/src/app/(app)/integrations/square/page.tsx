'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { FarmControlButton } from '@/components/ui/farm-control-button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Activity, 
  BarChart3, 
  Settings, 
  Database, 
  Shield, 
  RefreshCw, 
  RotateCcw,
  Info
} from 'lucide-react';

import { SquareSetupGuide } from '@/components/features/automation';
import { useSquareIntegration } from '@/components/features/integrations/square/hooks/useSquareIntegration';
import { 
  OverviewTab, 
  ConfigurationTab, 
  DataSyncTab, 
  AdvancedTab 
} from '@/components/features/integrations/square/components';

export default function SquareIntegrationPage() {
  // Use the centralized hook for all state management
  const {
    // Configuration state
    configs,
    activeConfig,
    configsLoading,
    newConfig,
    editingConfig,
    showCreateDialog,
    showEditDialog,
    isSaving,
    isDeleting,
    connectionError,
    saveSuccess,
    
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
    syncStatuses,
    isManualSyncing,
    isTesting,
    testResult,
    syncSettings,
    
    // Setters
    setNewConfig,
    setEditingConfig,
    setShowCreateDialog,
    setShowEditDialog,
    setSyncSettings,
    
    // Handlers
    handleCreateConfiguration,
    handleUpdateConfiguration,
    handleDeleteConfiguration,
    handleTestConnection,
    handleSetActiveConfig,
    handleEditConfiguration,
    handleManualSync,
    handleSaveConfig,
    checkConnectionHealth,
    
    // Utils
    getStatusColor,
    getStatusBadge
  } = useSquareIntegration();

  // Clear success message after 3 seconds
  useEffect(() => {
    if (saveSuccess) {
      const timer = setTimeout(() => {
        // We would need to add a clearSuccess function to the hook
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [saveSuccess]);

  return (
    <div className="space-y-6">
      {/* Enhanced Header with Connection Status */}
      <div className="bg-farm-white dark:bg-control-surface-dark card-shadow rounded-lg border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-farm-title text-control-content dark:text-control-content-dark">Square Integration</h1>
            <div className="flex items-center mt-2 space-x-4">
              <Badge className={`${getStatusColor(connectionHealth.status)} border`}>
                <span className="capitalize">{connectionHealth.status}</span>
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
            <FarmControlButton
              onClick={checkConnectionHealth}
              variant="default"
              size="sm"
              disabled={!activeConfig}
            >
              <Activity className="w-4 h-4 mr-2" />
              Test Connection
            </FarmControlButton>
            <FarmControlButton
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
            </FarmControlButton>
          </div>
        </div>

        {/* API Usage Indicator */}
        {connectionHealth.status === 'connected' && (
          <div className="mt-4 p-4 bg-accent-primary/5 dark:bg-accent-primary/10 rounded-lg card-shadow">
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

      {/* Modular 4-Tab Structure */}
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

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <OverviewTab
            activeConfig={activeConfig}
            syncStatuses={syncStatuses}
            connectionHealth={connectionHealth}
            getStatusColor={getStatusColor}
          />
        </TabsContent>

        {/* Configuration Tab */}
        <TabsContent value="configuration" className="space-y-6">
          <ConfigurationTab
            configs={configs}
            activeConfig={activeConfig}
            configsLoading={configsLoading}
            newConfig={newConfig}
            editingConfig={editingConfig}
            showCreateDialog={showCreateDialog}
            showEditDialog={showEditDialog}
            isSaving={isSaving}
            isDeleting={isDeleting}
            isTesting={isTesting}
            testResult={testResult}
            status={status}
            connectionError={connectionError}
            saveSuccess={saveSuccess}
            setNewConfig={setNewConfig}
            setEditingConfig={setEditingConfig}
            setShowCreateDialog={setShowCreateDialog}
            setShowEditDialog={setShowEditDialog}
            handleCreateConfiguration={handleCreateConfiguration}
            handleUpdateConfiguration={handleUpdateConfiguration}
            handleDeleteConfiguration={handleDeleteConfiguration}
            handleTestConnection={handleTestConnection}
            handleSetActiveConfig={handleSetActiveConfig}
            handleEditConfiguration={handleEditConfiguration}
            getStatusBadge={getStatusBadge}
          />
        </TabsContent>

        {/* Data Sync Tab */}
        <TabsContent value="sync" className="space-y-6">
          <DataSyncTab
            activeConfig={activeConfig}
            syncStatuses={syncStatuses}
            syncSettings={syncSettings}
            isManualSyncing={isManualSyncing}
            setSyncSettings={setSyncSettings}
            handleManualSync={handleManualSync}
            handleSaveConfig={handleSaveConfig}
            checkConnectionHealth={checkConnectionHealth}
            getStatusColor={getStatusColor}
          />
        </TabsContent>

        {/* Advanced Tab */}
        <TabsContent value="advanced" className="space-y-6">
          <AdvancedTab
            activeConfig={activeConfig}
            locations={locations}
            connectionError={connectionError}
            showSetupGuide={showSetupGuide}
            setShowSetupGuide={setShowSetupGuide}
          />
        </TabsContent>
      </Tabs>

      {/* Setup Guide Dialog */}
      <Dialog open={showSetupGuide} onOpenChange={setShowSetupGuide}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Square Integration Setup Guide</DialogTitle>
            <DialogDescription>
              Step-by-step guide to set up your Square integration
            </DialogDescription>
          </DialogHeader>
          <SquareSetupGuide />
        </DialogContent>
      </Dialog>
    </div>
  );
} 