"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { FarmControlButton } from "@/components/ui/farm-control-button";
import {
  Activity,
  BarChart3,
  Settings,
  Database,
  MapPin,
  RefreshCw,
  TestTube,
  Info,
  Home,
} from "lucide-react";

import { useHomeAssistant } from "../../../../components/features/integrations/home-assistant/hooks/useHomeAssistant";
import {
  OverviewTab,
  ConfigurationTab,
  DeviceManagementTab,
  AssignmentTab,
  SetupWizard,
} from "@/components/features/integrations/home-assistant/components";
import {
  HAConfig,
  SetupStep,
  HADevice,
} from "@/types/integrations/homeassistant";

export default function HomeAssistantIntegration() {
  // Use the centralized hook for all state management
  const {
    config,
    status,
    devices,
    assignments,
    importedDevices,
    isLoading,
    error,
    saveConfig,
    testConnection,
    refreshData,
    discoverDevices,
    controlDevice,
    importDevice,
    assignDevice,
    removeAssignment,
    bulkImportDevices,
    bulkControlDevices,
  } = useHomeAssistant();

  const [isTesting, setIsTesting] = useState(false);
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

  // Setup wizard state
  const [setupStep, setSetupStep] = useState<SetupStep>("connection");
  const [tempConfig, setTempConfig] = useState<HAConfig>({
    name: "",
    url: "",
    token: "",
    enabled: true,
  });
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // Handler functions for tab components
  const handleManualRefresh = async () => {
    setIsManualRefreshing(true);
    try {
      await refreshData();
    } finally {
      setIsManualRefreshing(false);
    }
  };

  const handleTestConnectionStatus = async (url: string, token: string) => {
    setIsTesting(true);
    try {
      const result = await testConnection(url, token);
      return result;
    } finally {
      setIsTesting(false);
    }
  };

  const handleTestConnectionButton = async () => {
    if (!config?.url || !config?.token) return;
    setIsTesting(true);
    try {
      await refreshData();
    } finally {
      setIsTesting(false);
    }
  };

  const handleCreateAssignment = async (assignment: any) => {
    await assignDevice(assignment.entity_id, {
      entity_type: assignment.entity_type,
      friendly_name: assignment.friendly_name,
      farm_id: assignment.farm_id,
      row_id: assignment.row_id,
      rack_id: assignment.rack_id,
      shelf_id: assignment.shelf_id,
    });
  };

  const handleUpdateAssignment = async (assignment: any) => {
    // Remove old assignment and create new one
    await removeAssignment(assignment.entity_id);
    await assignDevice(assignment.entity_id, {
      entity_type: assignment.entity_type,
      friendly_name: assignment.friendly_name,
      farm_id: assignment.farm_id,
      row_id: assignment.row_id,
      rack_id: assignment.rack_id,
      shelf_id: assignment.shelf_id,
    });
  };

  const handleDeleteAssignment = async (entityId: string) => {
    await removeAssignment(entityId);
  };

  const handleImportDevice = async (device: any) => {
    await importDevice(device.entity_id);
  };

  const handleBulkImportDevices = async (devices: any[]) => {
    const entityIds = devices.map((d) => d.entity_id);
    await bulkImportDevices(entityIds);
  };

  // Temporary helper for OverviewTab compatibility
  const getStatusColor = (connected: boolean) => {
    return connected
      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
  };

  // Handler for testing connection from SetupWizard
  const handleTestConnection = async () => {
    if (!tempConfig.url || !tempConfig.token) return;
    setIsTesting(true);
    try {
      await testConnection(tempConfig.url, tempConfig.token);
      setSetupStep("discovery");
    } catch (error) {
      // Error is handled by the hook
    } finally {
      setIsTesting(false);
    }
  };

  // Handler for saving configuration from SetupWizard
  const handleSaveConfiguration = async () => {
    if (!tempConfig.name || !tempConfig.url || !tempConfig.token) return;
    try {
      await saveConfig(tempConfig);
      setSaveSuccess("Configuration saved successfully!");
      setSetupStep("complete");
    } catch (error) {
      // Error is handled by the hook
    }
  };

  // Handler for config changes from SetupWizard
  const handleConfigChange = (newConfig: HAConfig) => {
    setTempConfig(newConfig);
  };

  const handleSaveConfig = async (config: HAConfig) => {
    await saveConfig(config);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header with Connection Status */}
      <div className="bg-farm-white dark:bg-control-surface-dark card-shadow rounded-lg border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-farm-title text-control-content dark:text-control-content-dark">
              Home Assistant Integration
            </h1>
            <div className="flex items-center mt-2 space-x-4">
              <StatusBadge status={status.connected ? "connected" : "offline"}>
                {status.connected ? "Connected" : "Disconnected"}
              </StatusBadge>
              {status.connected && (
                <>
                  <span className="text-sm text-gray-500">
                    Devices: {status.device_count || 0}
                  </span>
                  {status.version && (
                    <span className="text-sm text-gray-500">
                      Version: {status.version}
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <FarmControlButton
              onClick={handleTestConnectionButton}
              variant="default"
              size="sm"
              disabled={isTesting}
            >
              <Activity className="w-4 h-4 mr-2" />
              Test Connection
            </FarmControlButton>
            <FarmControlButton
              onClick={handleManualRefresh}
              disabled={isManualRefreshing}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isManualRefreshing ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              {isManualRefreshing ? "Refreshing..." : "Refresh Data"}
            </FarmControlButton>
          </div>
        </div>

        {/* Device Usage Indicator */}
        {status.connected && (
          <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg card-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Device Overview</span>
              <span className="text-sm text-gray-500">
                {importedDevices.length} imported / {devices.length} total
              </span>
            </div>
            <Progress
              value={
                devices.length > 0
                  ? (importedDevices.length / devices.length) * 100
                  : 0
              }
              className="h-2"
            />
          </div>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <Info className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Modular 4-Tab Structure */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <BarChart3 className="w-4 h-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger
            value="configuration"
            className="flex items-center space-x-2"
          >
            <Settings className="w-4 h-4" />
            <span>Configuration</span>
          </TabsTrigger>
          <TabsTrigger value="devices" className="flex items-center space-x-2">
            <Database className="w-4 h-4" />
            <span>Device Management</span>
          </TabsTrigger>
          <TabsTrigger
            value="assignments"
            className="flex items-center space-x-2"
          >
            <MapPin className="w-4 h-4" />
            <span>Assignments</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <OverviewTab
            config={config}
            status={status}
            devices={devices}
            assignments={assignments}
            importedDevices={importedDevices}
            getStatusColor={getStatusColor}
          />
        </TabsContent>

        {/* Configuration Tab */}
        <TabsContent value="configuration" className="space-y-6">
          {config ? (
            <ConfigurationTab
              config={config}
              status={status}
              isLoading={isLoading}
              isTesting={isTesting}
              onSaveConfig={handleSaveConfig}
              onTestConnection={handleTestConnectionStatus}
              getStatusColor={getStatusColor}
            />
          ) : (
            <SetupWizard
              config={tempConfig}
              setupStep={setupStep}
              isConnecting={isTesting}
              isSaving={isLoading}
              connectionError={error}
              saveSuccess={saveSuccess}
              onConfigChange={handleConfigChange}
              onTestConnection={handleTestConnection}
              onSaveConfiguration={handleSaveConfiguration}
            />
          )}
        </TabsContent>

        {/* Device Management Tab */}
        <TabsContent value="devices" className="space-y-6">
          <DeviceManagementTab
            devices={devices}
            importedDevices={importedDevices}
            isLoading={isLoading}
            onDiscoverDevices={discoverDevices}
            onImportDevice={handleImportDevice}
            onBulkImportDevices={handleBulkImportDevices}
            onControlDevice={controlDevice}
          />
        </TabsContent>

        {/* Assignment Tab */}
        <TabsContent value="assignments" className="space-y-6">
          <AssignmentTab
            assignments={assignments
              .filter((a) => a.farm_id && a.row_id && a.rack_id && a.shelf_id)
              .map((a) => ({
                id: a.entity_id, // Use entity_id as the id
                entity_id: a.entity_id,
                farm_id: a.farm_id!,
                row_id: a.row_id!,
                rack_id: a.rack_id!,
                shelf_id: a.shelf_id!,
                friendly_name: a.friendly_name,
                entity_type: a.entity_type || "unknown",
              }))}
            onRefresh={refreshData}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
