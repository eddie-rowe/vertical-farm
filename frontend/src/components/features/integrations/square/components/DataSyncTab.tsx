import {
  RefreshCw,
  Database,
  Clock,
  Settings,
  Play,
  AlertCircle,
  Check,
} from "lucide-react";
import React from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

import { DATA_TYPE_CONFIGS, SYNC_INTERVAL_OPTIONS } from "../data";
import { SyncStatus, SyncSettings } from "../types";

interface DataSyncTabProps {
  activeConfig: any;
  syncStatuses: SyncStatus[];
  syncSettings: SyncSettings;
  isManualSyncing: boolean;
  setSyncSettings: (settings: SyncSettings) => void;
  handleManualSync: () => Promise<void>;
  handleSaveConfig: () => Promise<void>;
  checkConnectionHealth: () => Promise<void>;
  getStatusColor: (status: string) => string;
}

const getStatusIcon = (status: string) => {
  // Simple status icon implementation
  return null;
};

export const DataSyncTab: React.FC<DataSyncTabProps> = ({
  activeConfig,
  syncStatuses,
  syncSettings,
  isManualSyncing,
  setSyncSettings,
  handleManualSync,
  handleSaveConfig,
  checkConnectionHealth,
  getStatusColor,
}) => {
  if (!activeConfig) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No Square integration configured. Please set up your connection in the
          Configuration tab.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sync Status Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Database className="w-5 h-5" />
                <span>Data Synchronization</span>
              </CardTitle>
              <CardDescription>
                Monitor and manage data sync between Square and your business
                management system
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={checkConnectionHealth}
                disabled={isManualSyncing}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Check Status
              </Button>
              <Button onClick={handleManualSync} disabled={isManualSyncing}>
                {isManualSyncing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Syncing...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Manual Sync
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {syncStatuses.map((sync) => (
              <div
                key={sync.entity}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <sync.icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-medium">{sync.entity}</h3>
                    <p className="text-sm text-gray-500">
                      {sync.recordCount.toLocaleString()} records
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge
                    className={`${getStatusColor(sync.status)} text-xs mb-1`}
                  >
                    {getStatusIcon(sync.status)}
                    {sync.status}
                  </Badge>
                  <p className="text-xs text-gray-500">{sync.lastSync}</p>
                  {sync.errorMessage && (
                    <p className="text-xs text-red-500 mt-1">
                      {sync.errorMessage}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sync Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5" />
            <span>Sync Settings</span>
          </CardTitle>
          <CardDescription>
            Configure how data is synchronized between Square and your system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Auto Sync Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Settings className="w-5 h-5" />
              <div>
                <Label htmlFor="auto-sync">Automatic Sync</Label>
                <p className="text-sm text-gray-500">
                  Automatically sync data at regular intervals
                </p>
              </div>
            </div>
            <Switch
              id="auto-sync"
              checked={syncSettings.autoSync}
              onCheckedChange={(checked) =>
                setSyncSettings({ ...syncSettings, autoSync: checked })
              }
            />
          </div>

          {/* Sync Interval */}
          {syncSettings.autoSync && (
            <div className="space-y-2">
              <Label htmlFor="sync-interval">Sync Interval</Label>
              <Select
                value={syncSettings.syncInterval}
                onValueChange={(value) =>
                  setSyncSettings({ ...syncSettings, syncInterval: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SYNC_INTERVAL_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Business Hours Sync */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5" />
                <div>
                  <Label htmlFor="business-hours">Business Hours Only</Label>
                  <p className="text-sm text-gray-500">
                    Only sync data during business hours
                  </p>
                </div>
              </div>
              <Switch
                id="business-hours"
                checked={syncSettings.syncOnlyBusinessHours}
                onCheckedChange={(checked) =>
                  setSyncSettings({
                    ...syncSettings,
                    syncOnlyBusinessHours: checked,
                  })
                }
              />
            </div>

            {syncSettings.syncOnlyBusinessHours && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="business-start">Start Time</Label>
                  <Input
                    id="business-start"
                    type="time"
                    value={syncSettings.businessHoursStart}
                    onChange={(e) =>
                      setSyncSettings({
                        ...syncSettings,
                        businessHoursStart: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="business-end">End Time</Label>
                  <Input
                    id="business-end"
                    type="time"
                    value={syncSettings.businessHoursEnd}
                    onChange={(e) =>
                      setSyncSettings({
                        ...syncSettings,
                        businessHoursEnd: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            )}
          </div>

          {/* Data Type Selection */}
          <div className="space-y-4">
            <div>
              <Label>Data Types to Sync</Label>
              <p className="text-sm text-gray-500 mb-4">
                Choose which types of data to synchronize from Square
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {DATA_TYPE_CONFIGS.map((config) => (
                <div
                  key={config.key}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <config.icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <Label htmlFor={config.key}>{config.label}</Label>
                      <p className="text-sm text-gray-500">
                        {config.description}
                      </p>
                    </div>
                  </div>
                  <Switch
                    id={config.key}
                    checked={
                      syncSettings[config.key as keyof SyncSettings] as boolean
                    }
                    onCheckedChange={(checked) =>
                      setSyncSettings({
                        ...syncSettings,
                        [config.key]: checked,
                      })
                    }
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={handleSaveConfig}>
              <Check className="w-4 h-4 mr-2" />
              Save Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
