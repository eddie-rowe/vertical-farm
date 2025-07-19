"use client";

import { FC } from "react";
import { FaTrash, FaWifi } from "react-icons/fa";
import { Wifi } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FarmControlButton } from "@/components/ui/farm-control-button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  HAConfig,
  HAStatus,
  ConnectionState,
} from "@/types/integrations/homeassistant";

interface SettingsProps {
  config: HAConfig;
  status: HAStatus;
  onTestConnection: () => void;
  onResetConfiguration: () => void;
}

export const Settings: FC<SettingsProps> = ({
  config,
  status,
  onTestConnection,
  onResetConfiguration,
}) => {
  return (
    <div className="space-y-6">
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
          <CardDescription>
            Your active Home Assistant connection
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Name</Label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {config.name || "Unnamed"}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium">URL</Label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {config.url}
              </p>
            </div>
          </div>

          <Separator />

          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-medium">Connection Status</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Last checked:{" "}
                {status.last_updated
                  ? new Date(status.last_updated).toLocaleString()
                  : "Never"}
              </p>
            </div>
            <FarmControlButton variant="default" onClick={onTestConnection}>
              <Wifi className="h-4 w-4 mr-2" />
              Test Connection
            </FarmControlButton>
          </div>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible and destructive actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FarmControlButton
            variant="maintenance"
            onClick={onResetConfiguration}
          >
            <FaTrash className="h-4 w-4 mr-2" />
            Reset Configuration
          </FarmControlButton>
        </CardContent>
      </Card>
    </div>
  );
};
