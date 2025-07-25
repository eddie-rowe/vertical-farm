import {
  Save,
  TestTube,
  AlertCircle,
  CheckCircle,
  Loader2,
  Info,
  ExternalLink,
} from "lucide-react";
import React, { useState } from "react";

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
import { Switch } from "@/components/ui/switch";
import type {
  HAConfig,
  HAConnectionStatus,
} from "@/services/homeAssistantService";

interface ConfigurationTabProps {
  config: HAConfig | null;
  status: HAConnectionStatus;
  isLoading: boolean;
  isTesting: boolean;
  onSaveConfig: (config: HAConfig) => Promise<void>;
  onTestConnection: (url: string, token: string) => Promise<HAConnectionStatus>;
  getStatusColor: (connected: boolean) => string;
}

export const ConfigurationTab: React.FC<ConfigurationTabProps> = ({
  config,
  status,
  isLoading,
  isTesting,
  onSaveConfig,
  onTestConnection,
  getStatusColor,
}) => {
  const [formData, setFormData] = useState<HAConfig>({
    url: config?.url || "",
    token: config?.token || "",
    enabled: config?.enabled ?? true,
    cloudflare_client_id: config?.cloudflare_client_id || "",
    cloudflare_client_secret: config?.cloudflare_client_secret || "",
    name: config?.name || "Home Assistant",
    local_url: config?.local_url || "",
  });

  const [testResult, setTestResult] = useState<HAConnectionStatus | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  const handleInputChange = (
    field: keyof HAConfig,
    value: string | boolean,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear test result when config changes
    setTestResult(null);
  };

  const handleTestConnection = async () => {
    if (!formData.url || !formData.token) {
      setTestResult({
        connected: false,
        error: "URL and access token are required",
      });
      return;
    }

    setIsTestingConnection(true);
    setTestResult(null);

    try {
      const result = await onTestConnection(formData.url, formData.token);
      setTestResult(result);
    } catch (error) {
      setTestResult({
        connected: false,
        error:
          error instanceof Error ? error.message : "Connection test failed",
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleSaveConfig = async () => {
    if (!formData.url || !formData.token) {
      setTestResult({
        connected: false,
        error: "URL and access token are required",
      });
      return;
    }

    setIsSaving(true);
    try {
      await onSaveConfig(formData);
      setTestResult(null); // Clear test result after successful save
    } catch (error) {
      console.error("Failed to save config:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const isFormValid = formData.url && formData.token;
  const hasChanges = JSON.stringify(formData) !== JSON.stringify(config);

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Info className="w-5 h-5" />
            <span>Connection Status</span>
          </CardTitle>
          <CardDescription>
            Current Home Assistant integration status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-3">
              <div
                className={`w-3 h-3 rounded-full ${status.connected ? "bg-green-500" : "bg-red-500"}`}
              ></div>
              <div>
                <p className="font-medium">
                  {status.connected ? "Connected" : "Disconnected"}
                </p>
                <p className="text-sm text-gray-500">
                  {status.connected
                    ? `${status.device_count || 0} devices available`
                    : "No connection established"}
                </p>
              </div>
            </div>
            <Badge className={getStatusColor(status.connected)}>
              {status.connected ? "Online" : "Offline"}
            </Badge>
          </div>

          {status.version && (
            <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <p className="text-sm">
                <span className="font-medium">Home Assistant Version:</span>{" "}
                {status.version}
              </p>
              {status.last_updated && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Last updated: {new Date(status.last_updated).toLocaleString()}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configuration Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Save className="w-5 h-5" />
            <span>Connection Settings</span>
          </CardTitle>
          <CardDescription>
            Configure your Home Assistant connection details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Integration Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Integration Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Home Assistant"
            />
          </div>

          {/* Home Assistant URL */}
          <div className="space-y-2">
            <Label htmlFor="url">Home Assistant URL *</Label>
            <Input
              id="url"
              value={formData.url}
              onChange={(e) => handleInputChange("url", e.target.value)}
              placeholder="https://your-home-assistant.local:8123"
              type="url"
            />
            <p className="text-xs text-gray-500">
              The external URL to access your Home Assistant instance
            </p>
          </div>

          {/* Local URL (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="local_url">Local URL (Optional)</Label>
            <Input
              id="local_url"
              value={formData.local_url}
              onChange={(e) => handleInputChange("local_url", e.target.value)}
              placeholder="http://192.168.1.100:8123"
              type="url"
            />
            <p className="text-xs text-gray-500">
              Local network URL for faster access when on the same network
            </p>
          </div>

          {/* Access Token */}
          <div className="space-y-2">
            <Label htmlFor="token">Long-Lived Access Token *</Label>
            <Input
              id="token"
              type="password"
              value={formData.token}
              onChange={(e) => handleInputChange("token", e.target.value)}
              placeholder="Enter your Home Assistant access token"
            />
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <ExternalLink className="w-3 h-3" />
              <span>
                Generate in Home Assistant: Profile → Security → Long-Lived
                Access Tokens
              </span>
            </div>
          </div>

          {/* Cloudflare Settings (Optional) */}
          <div className="space-y-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <h4 className="font-medium text-sm">
              Cloudflare Tunnel (Optional)
            </h4>
            <p className="text-xs text-gray-500">
              If you're using Cloudflare Access to secure your Home Assistant
              instance
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cloudflare_client_id">Client ID</Label>
                <Input
                  id="cloudflare_client_id"
                  value={formData.cloudflare_client_id}
                  onChange={(e) =>
                    handleInputChange("cloudflare_client_id", e.target.value)
                  }
                  placeholder="Cloudflare client ID"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cloudflare_client_secret">Client Secret</Label>
                <Input
                  id="cloudflare_client_secret"
                  type="password"
                  value={formData.cloudflare_client_secret}
                  onChange={(e) =>
                    handleInputChange(
                      "cloudflare_client_secret",
                      e.target.value,
                    )
                  }
                  placeholder="Cloudflare client secret"
                />
              </div>
            </div>
          </div>

          {/* Enable Integration */}
          <div className="flex items-center space-x-2">
            <Switch
              id="enabled"
              checked={formData.enabled}
              onCheckedChange={(checked) =>
                handleInputChange("enabled", checked)
              }
            />
            <Label htmlFor="enabled">Enable this integration</Label>
          </div>

          {/* Test Result */}
          {testResult && (
            <Alert
              className={
                testResult.connected
                  ? "border-green-200 bg-green-50 dark:bg-green-900/20"
                  : "border-red-200 bg-red-50 dark:bg-red-900/20"
              }
            >
              {testResult.connected ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription
                className={
                  testResult.connected
                    ? "text-green-800 dark:text-green-200"
                    : "text-red-800 dark:text-red-200"
                }
              >
                {testResult.connected
                  ? `Connection successful! Found ${testResult.device_count || 0} devices.`
                  : `Connection failed: ${testResult.error}`}
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex items-center space-x-3 pt-4">
            <Button
              onClick={handleTestConnection}
              disabled={!isFormValid || isTestingConnection}
              variant="outline"
              className="flex items-center space-x-2"
            >
              {isTestingConnection ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <TestTube className="w-4 h-4" />
              )}
              <span>
                {isTestingConnection ? "Testing..." : "Test Connection"}
              </span>
            </Button>

            <Button
              onClick={handleSaveConfig}
              disabled={!isFormValid || !hasChanges || isSaving}
              className="flex items-center space-x-2 bg-orange-600 hover:bg-orange-700"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{isSaving ? "Saving..." : "Save Configuration"}</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
