import {
  Shield,
  Settings,
  AlertTriangle,
  FileText,
  TestTube,
  Eye,
  AlertCircle,
} from "lucide-react";
import React from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { SquareLocation } from "@/services/squareService";

import { DEBUG_ACTIONS } from "../data";

interface AdvancedTabProps {
  activeConfig: any;
  locations: SquareLocation[];
  connectionError: string | null;
  showSetupGuide: boolean;
  setShowSetupGuide: (show: boolean) => void;
}

export const AdvancedTab: React.FC<AdvancedTabProps> = ({
  activeConfig,
  locations,
  connectionError,
  showSetupGuide,
  setShowSetupGuide,
}) => {
  const [webhookUrl, setWebhookUrl] = React.useState("");
  const [selectedLocation, setSelectedLocation] = React.useState<string>("");
  const [logLevel, setLogLevel] = React.useState<string>("info");
  const [enableVerboseLogging, setEnableVerboseLogging] = React.useState(false);
  const [enableWebhooks, setEnableWebhooks] = React.useState(false);

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
      {/* Advanced Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5" />
            <span>Advanced Settings</span>
          </CardTitle>
          <CardDescription>
            Configure advanced options for your Square integration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Location Filtering */}
          <div className="space-y-2">
            <Label htmlFor="location-filter">Location Filter</Label>
            <Select
              value={selectedLocation}
              onValueChange={setSelectedLocation}
            >
              <SelectTrigger>
                <SelectValue placeholder="All locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All locations</SelectItem>
                {locations.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-500">
              Filter synced data to specific Square locations
            </p>
          </div>

          {/* Webhook Configuration */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="enable-webhooks">Enable Webhooks</Label>
                <p className="text-sm text-gray-500">
                  Receive real-time notifications from Square
                </p>
              </div>
              <Switch
                id="enable-webhooks"
                checked={enableWebhooks}
                onCheckedChange={setEnableWebhooks}
              />
            </div>

            {enableWebhooks && (
              <div className="space-y-2">
                <Label htmlFor="webhook-url">Webhook URL</Label>
                <Input
                  id="webhook-url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://your-domain.com/webhooks/square"
                />
                <p className="text-sm text-gray-500">
                  Square will send notifications to this URL
                </p>
              </div>
            )}
          </div>

          {/* Logging Configuration */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="log-level">Log Level</Label>
              <Select value={logLevel} onValueChange={setLogLevel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="warn">Warning</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="debug">Debug</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="verbose-logging">Verbose Logging</Label>
                <p className="text-sm text-gray-500">
                  Log detailed API requests and responses
                </p>
              </div>
              <Switch
                id="verbose-logging"
                checked={enableVerboseLogging}
                onCheckedChange={setEnableVerboseLogging}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Debug Tools */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TestTube className="w-5 h-5" />
            <span>Debug Tools</span>
          </CardTitle>
          <CardDescription>
            Tools for debugging and troubleshooting your Square integration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {DEBUG_ACTIONS.map((action) => (
              <Button
                key={action.id}
                variant="outline"
                className="flex items-center justify-center space-x-2 p-6"
                onClick={action.action}
              >
                <action.icon className="w-5 h-5" />
                <span>{action.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Error Handling */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5" />
            <span>Error Handling</span>
          </CardTitle>
          <CardDescription>
            Configure how errors are handled and reported
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="retry-failed">Retry Failed Requests</Label>
              <p className="text-sm text-gray-500">
                Automatically retry failed API requests
              </p>
            </div>
            <Switch id="retry-failed" defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="error-notifications">Error Notifications</Label>
              <p className="text-sm text-gray-500">
                Send notifications when errors occur
              </p>
            </div>
            <Switch id="error-notifications" defaultChecked />
          </div>

          <div className="space-y-2">
            <Label htmlFor="error-email">Notification Email</Label>
            <Input
              id="error-email"
              type="email"
              placeholder="admin@yourcompany.com"
            />
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>Security Settings</span>
          </CardTitle>
          <CardDescription>
            Configure security options for your Square integration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="encrypt-tokens">Encrypt Stored Tokens</Label>
              <p className="text-sm text-gray-500">
                Encrypt access tokens in the database
              </p>
            </div>
            <Switch id="encrypt-tokens" defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="rotate-tokens">Auto-rotate Tokens</Label>
              <p className="text-sm text-gray-500">
                Automatically rotate access tokens periodically
              </p>
            </div>
            <Switch id="rotate-tokens" />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="audit-logs">Audit Logging</Label>
              <p className="text-sm text-gray-500">
                Log all API calls for security auditing
              </p>
            </div>
            <Switch id="audit-logs" defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* Setup Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Setup Guide</span>
          </CardTitle>
          <CardDescription>
            Need help setting up your Square integration?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={() => setShowSetupGuide(true)}
            className="w-full"
          >
            <Eye className="w-4 h-4 mr-2" />
            View Setup Guide
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
