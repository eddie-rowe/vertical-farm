"use client";

import { Settings, ChevronRight, Wifi } from "lucide-react";
import { FC } from "react";
import { FaHome, FaCheck, FaExclamationTriangle } from "react-icons/fa";

import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FarmControlButton } from "@/components/ui/farm-control-button";
import { FarmInput } from "@/components/ui/farm-input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { HAConfig, SetupStep } from "@/types/integrations/homeassistant";

interface SetupWizardProps {
  config: HAConfig;
  setupStep: SetupStep;
  isConnecting: boolean;
  isSaving: boolean;
  connectionError: string | null;
  saveSuccess: string | null;
  onConfigChange: (config: HAConfig) => void;
  onTestConnection: () => void;
  onSaveConfiguration: () => void;
}

export const SetupWizard: FC<SetupWizardProps> = ({
  config,
  setupStep,
  isConnecting,
  isSaving,
  connectionError,
  saveSuccess,
  onConfigChange,
  onTestConnection,
  onSaveConfiguration,
}) => {
  const getStepProgress = () => {
    const steps = ["connection", "test", "discovery", "complete"];
    return (steps.indexOf(setupStep) + 1) * 25;
  };

  const isStepActive = (step: SetupStep) => setupStep === step;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center">
          <div className="bg-accent-primary/10 dark:bg-accent-primary/20 p-4 rounded-full">
            <FaHome className="text-4xl text-accent-primary" />
          </div>
        </div>
        <h1 className="text-farm-title text-control-content dark:text-control-content-dark">
          Connect to Home Assistant
        </h1>
        <p className="text-control-secondary max-w-2xl mx-auto">
          Integrate your Home Assistant instance to control lights, switches,
          and sensors directly from your vertical farming dashboard.
        </p>
      </div>

      {/* Setup Wizard */}
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Setup Configuration
            </CardTitle>
            <CardDescription>
              Enter your Home Assistant connection details to get started.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Progress indicator */}
            <div className="flex items-center justify-between text-sm">
              <span
                className={
                  isStepActive("connection")
                    ? "text-blue-600 font-medium"
                    : "text-gray-500"
                }
              >
                Connection
              </span>
              <ChevronRight className="h-4 w-4 text-gray-400" />
              <span
                className={
                  isStepActive("test")
                    ? "text-blue-600 font-medium"
                    : "text-gray-500"
                }
              >
                Test
              </span>
              <ChevronRight className="h-4 w-4 text-gray-400" />
              <span
                className={
                  isStepActive("discovery")
                    ? "text-blue-600 font-medium"
                    : "text-gray-500"
                }
              >
                Discovery
              </span>
              <ChevronRight className="h-4 w-4 text-gray-400" />
              <span
                className={
                  isStepActive("complete")
                    ? "text-blue-600 font-medium"
                    : "text-gray-500"
                }
              >
                Complete
              </span>
            </div>

            <Progress value={getStepProgress()} className="h-2" />

            {/* Connection form */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Configuration Name</Label>
                <FarmInput
                  id="name"
                  placeholder="e.g., Main Home Assistant"
                  value={config.name}
                  onChange={(e) =>
                    onConfigChange({
                      ...config,
                      name: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <Label htmlFor="url">Home Assistant URL</Label>
                <FarmInput
                  id="url"
                  placeholder="https://your-home-assistant.local:8123"
                  value={config.url}
                  onChange={(e) =>
                    onConfigChange({
                      ...config,
                      url: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <Label htmlFor="token">Long-Lived Access Token</Label>
                <FarmInput
                  id="token"
                  type="password"
                  placeholder="Enter your Home Assistant access token"
                  value={config.token}
                  onChange={(e) =>
                    onConfigChange({
                      ...config,
                      token: e.target.value,
                    })
                  }
                />
                <p className="text-sm text-gray-500 mt-1">
                  Create a token in Home Assistant: Profile → Security →
                  Long-Lived Access Tokens
                </p>
              </div>
            </div>

            {/* Error display */}
            {connectionError && (
              <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20">
                <FaExclamationTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800 dark:text-red-200">
                  {connectionError}
                </AlertDescription>
              </Alert>
            )}

            {/* Success display */}
            {saveSuccess && (
              <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
                <FaCheck className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  {saveSuccess}
                </AlertDescription>
              </Alert>
            )}

            {/* Action buttons */}
            <div className="flex gap-3">
              <FarmControlButton
                onClick={onTestConnection}
                disabled={!config.url || !config.token}
                loading={isConnecting}
                loadingText="Testing Connection..."
                icon={<Wifi className="h-4 w-4" />}
                className="flex-1"
              >
                Test Connection
              </FarmControlButton>

              {setupStep === "discovery" && (
                <FarmControlButton
                  onClick={onSaveConfiguration}
                  disabled={!config.name || !config.url || !config.token}
                  loading={isSaving}
                  loadingText="Saving..."
                  icon={<FaCheck className="h-4 w-4" />}
                  variant="default"
                  className="flex-1"
                >
                  Save & Continue
                </FarmControlButton>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
