import React from "react";
import {
  Plus,
  Settings,
  Edit,
  Trash2,
  Check,
  X,
  AlertCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  SquareConfig,
  SquareConfigCreate,
  SquareConfigUpdate,
  SquareConnectionStatus,
} from "@/services/squareService";
import { TestResult } from "../types";

interface ConfigurationTabProps {
  configs: SquareConfig[];
  activeConfig: SquareConfig | null;
  configsLoading: boolean;
  newConfig: SquareConfigCreate;
  editingConfig: (SquareConfigUpdate & { id: string }) | null;
  showCreateDialog: boolean;
  showEditDialog: boolean;
  isSaving: boolean;
  isDeleting: string | null;
  isTesting: boolean;
  testResult: TestResult | null;
  status: SquareConnectionStatus;
  connectionError: string | null;
  saveSuccess: string | null;
  setNewConfig: (config: SquareConfigCreate) => void;
  setEditingConfig: (
    config: (SquareConfigUpdate & { id: string }) | null,
  ) => void;
  setShowCreateDialog: (show: boolean) => void;
  setShowEditDialog: (show: boolean) => void;
  handleCreateConfiguration: () => Promise<void>;
  handleUpdateConfiguration: () => Promise<void>;
  handleDeleteConfiguration: (configId: string) => Promise<void>;
  handleTestConnection: (configId: string) => Promise<void>;
  handleSetActiveConfig: (configId: string) => Promise<void>;
  handleEditConfiguration: (config: SquareConfig) => void;
  getStatusBadge: (connected: boolean) => React.ReactNode;
}

export const ConfigurationTab: React.FC<ConfigurationTabProps> = ({
  configs,
  activeConfig,
  configsLoading,
  newConfig,
  editingConfig,
  showCreateDialog,
  showEditDialog,
  isSaving,
  isDeleting,
  isTesting,
  testResult,
  status,
  connectionError,
  saveSuccess,
  setNewConfig,
  setEditingConfig,
  setShowCreateDialog,
  setShowEditDialog,
  handleCreateConfiguration,
  handleUpdateConfiguration,
  handleDeleteConfiguration,
  handleTestConnection,
  handleSetActiveConfig,
  handleEditConfiguration,
  getStatusBadge,
}) => {
  return (
    <div className="space-y-6">
      {/* Success/Error Messages */}
      {saveSuccess && (
        <Alert>
          <Check className="h-4 w-4" />
          <AlertDescription>{saveSuccess}</AlertDescription>
        </Alert>
      )}

      {connectionError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{connectionError}</AlertDescription>
        </Alert>
      )}

      {/* Configuration List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="w-5 h-5" />
                <span>Square Configurations</span>
              </CardTitle>
              <CardDescription>
                Manage your Square API configurations and connections
              </CardDescription>
            </div>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Configuration
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Square Configuration</DialogTitle>
                  <DialogDescription>
                    Add a new Square API configuration to connect your Square
                    account
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Configuration Name</Label>
                    <Input
                      id="name"
                      value={newConfig.name}
                      onChange={(e) =>
                        setNewConfig({ ...newConfig, name: e.target.value })
                      }
                      placeholder="My Square Store"
                    />
                  </div>
                  <div>
                    <Label htmlFor="application_id">Application ID</Label>
                    <Input
                      id="application_id"
                      value={newConfig.application_id}
                      onChange={(e) =>
                        setNewConfig({
                          ...newConfig,
                          application_id: e.target.value,
                        })
                      }
                      placeholder="sq0idp-..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="access_token">Access Token</Label>
                    <Input
                      id="access_token"
                      type="password"
                      value={newConfig.access_token}
                      onChange={(e) =>
                        setNewConfig({
                          ...newConfig,
                          access_token: e.target.value,
                        })
                      }
                      placeholder="EAAAl..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="environment">Environment</Label>
                    <Select
                      value={newConfig.environment}
                      onValueChange={(value) =>
                        setNewConfig({
                          ...newConfig,
                          environment: value as "sandbox" | "production",
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sandbox">Sandbox</SelectItem>
                        <SelectItem value="production">Production</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      onClick={handleCreateConfiguration}
                      disabled={isSaving}
                    >
                      {isSaving ? "Creating..." : "Create Configuration"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowCreateDialog(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {configsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading configurations...</p>
            </div>
          ) : configs.length === 0 ? (
            <div className="text-center py-8">
              <Settings className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No Square configurations found</p>
              <p className="text-sm text-gray-400 mt-2">
                Create your first configuration to get started
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {configs.map((config) => (
                <div
                  key={config.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium">{config.name}</h3>
                        {config.is_active && (
                          <Badge variant="secondary" className="text-xs">
                            Active
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {config.environment}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500">
                        App ID: {config.application_id}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(
                        config.is_active ? status.connected : false,
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTestConnection(config.id!)}
                      disabled={isTesting}
                    >
                      {isTesting ? "Testing..." : "Test"}
                    </Button>
                    {!config.is_active && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetActiveConfig(config.id!)}
                      >
                        Set Active
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditConfiguration(config)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteConfiguration(config.id!)}
                      disabled={isDeleting === config.id}
                    >
                      {isDeleting === config.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Square Configuration</DialogTitle>
            <DialogDescription>
              Update your Square API configuration settings
            </DialogDescription>
          </DialogHeader>
          {editingConfig && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Configuration Name</Label>
                <Input
                  id="edit-name"
                  value={editingConfig.name}
                  onChange={(e) =>
                    setEditingConfig({ ...editingConfig, name: e.target.value })
                  }
                  placeholder="My Square Store"
                />
              </div>
              <div>
                <Label htmlFor="edit-application_id">Application ID</Label>
                <Input
                  id="edit-application_id"
                  value={editingConfig.application_id}
                  onChange={(e) =>
                    setEditingConfig({
                      ...editingConfig,
                      application_id: e.target.value,
                    })
                  }
                  placeholder="sq0idp-..."
                />
              </div>
              <div>
                <Label htmlFor="edit-access_token">Access Token</Label>
                <Input
                  id="edit-access_token"
                  type="password"
                  value={editingConfig.access_token}
                  onChange={(e) =>
                    setEditingConfig({
                      ...editingConfig,
                      access_token: e.target.value,
                    })
                  }
                  placeholder="EAAAl..."
                />
              </div>
              <div>
                <Label htmlFor="edit-environment">Environment</Label>
                <Select
                  value={editingConfig.environment}
                  onValueChange={(value) =>
                    setEditingConfig({
                      ...editingConfig,
                      environment: value as "sandbox" | "production",
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sandbox">Sandbox</SelectItem>
                    <SelectItem value="production">Production</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex space-x-2">
                <Button onClick={handleUpdateConfiguration} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowEditDialog(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Test Result */}
      {testResult && (
        <Alert
          variant={testResult.type === "error" ? "destructive" : "default"}
        >
          {testResult.type === "error" ? (
            <X className="h-4 w-4" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          <AlertDescription>{testResult.message}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};
