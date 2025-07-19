"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Settings,
  Zap,
  Activity,
  Grid3X3,
  Layers,
  Archive,
  Edit2,
  Eye,
  Trash2,
  Plus,
  Save,
  RotateCcw,
  Info,
  AlertCircle,
  CheckCircle,
  Home,
  Thermometer,
  Droplets,
  Sun,
  Wind,
} from "lucide-react";
import { FarmPageData, UUID } from "@/types/farm";

interface SelectedElement {
  type: "farm" | "row" | "rack" | "shelf" | "device" | null;
  id: string | null;
  data?: any;
}

interface ContextualControlPanelProps {
  selectedElement: SelectedElement;
  farmPageData: FarmPageData | null;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onFarmPageDataChange: (newData: FarmPageData) => void;
  onElementSelection: (
    elementType: "farm" | "row" | "rack" | "shelf" | "device",
    elementId: string,
    elementData?: any,
  ) => void;
}

export default function ContextualControlPanel({
  selectedElement,
  farmPageData,
  activeTab,
  onTabChange,
  onFarmPageDataChange,
  onElementSelection,
}: ContextualControlPanelProps) {
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev: Record<string, any>) => ({ ...prev, [field]: value }));
  };

  const getElementIcon = () => {
    switch (selectedElement.type) {
      case "farm":
        return <Home className="h-4 w-4" />;
      case "row":
        return <Grid3X3 className="h-4 w-4" />;
      case "rack":
        return <Archive className="h-4 w-4" />;
      case "shelf":
        return <Layers className="h-4 w-4" />;
      case "device":
        return <Zap className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getElementTitle = () => {
    if (!selectedElement.type || !selectedElement.data)
      return "Select an element";

    switch (selectedElement.type) {
      case "farm":
        return selectedElement.data.name || "Unnamed Farm";
      case "row":
        return `Row ${selectedElement.data.id}`;
      case "rack":
        return `Rack ${selectedElement.data.id}`;
      case "shelf":
        return `Shelf ${selectedElement.data.id}`;
      case "device":
        return selectedElement.data.name || `Device ${selectedElement.data.id}`;
      default:
        return "Unknown Element";
    }
  };

  const renderElementDetails = () => {
    if (!selectedElement.type || !selectedElement.data) {
      return (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <Info className="h-12 w-12 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No Selection</h3>
          <p className="text-sm">
            Click on farm elements to view and edit their properties
          </p>
        </div>
      );
    }

    const { type, data } = selectedElement;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getElementIcon()}
            <h3 className="text-lg font-semibold">{getElementTitle()}</h3>
          </div>
          <Badge variant={editMode ? "default" : "secondary"}>
            {editMode ? "Editing" : "Viewing"}
          </Badge>
        </div>

        <div className="space-y-3">
          {type === "farm" && (
            <>
              <div>
                <Label>Farm Name</Label>
                <Input
                  value={formData.name || data.name || ""}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  disabled={!editMode}
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.description || data.description || ""}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  disabled={!editMode}
                  rows={3}
                />
              </div>
              <div>
                <Label>Location</Label>
                <Input
                  value={formData.location || data.location || ""}
                  onChange={(e) =>
                    handleInputChange("location", e.target.value)
                  }
                  disabled={!editMode}
                />
              </div>
            </>
          )}

          {type === "row" && (
            <>
              <div>
                <Label>Row ID</Label>
                <Input value={data.id || ""} disabled />
              </div>
              <div>
                <Label>Row Width (cm)</Label>
                <Input
                  type="number"
                  value={formData.width || data.width || ""}
                  onChange={(e) => handleInputChange("width", e.target.value)}
                  disabled={!editMode}
                />
              </div>
              <div>
                <Label>Row Length (cm)</Label>
                <Input
                  type="number"
                  value={formData.length || data.length || ""}
                  onChange={(e) => handleInputChange("length", e.target.value)}
                  disabled={!editMode}
                />
              </div>
            </>
          )}

          {type === "rack" && (
            <>
              <div>
                <Label>Rack ID</Label>
                <Input value={data.id || ""} disabled />
              </div>
              <div>
                <Label>Height (cm)</Label>
                <Input
                  type="number"
                  value={formData.height || data.height || ""}
                  onChange={(e) => handleInputChange("height", e.target.value)}
                  disabled={!editMode}
                />
              </div>
              <div>
                <Label>Number of Shelves</Label>
                <Input
                  type="number"
                  value={formData.shelveCount || data.shelves?.length || 0}
                  onChange={(e) =>
                    handleInputChange("shelveCount", e.target.value)
                  }
                  disabled={!editMode}
                />
              </div>
            </>
          )}

          {type === "device" && (
            <>
              <div>
                <Label>Device Name</Label>
                <Input
                  value={formData.name || data.name || ""}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  disabled={!editMode}
                />
              </div>
              <div>
                <Label>Device Type</Label>
                <Input value={data.type || "Unknown"} disabled />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.active || data.active || false}
                  onCheckedChange={(checked) =>
                    handleInputChange("active", checked)
                  }
                  disabled={!editMode}
                />
                <Label>Active</Label>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  const renderQuickActions = () => {
    if (!selectedElement.type) return null;

    return (
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
          Quick Actions
        </h4>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditMode(!editMode)}
          >
            {editMode ? (
              <Eye className="h-3 w-3 mr-1" />
            ) : (
              <Edit2 className="h-3 w-3 mr-1" />
            )}
            {editMode ? "View" : "Edit"}
          </Button>

          {selectedElement.type !== "farm" && (
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Delete
            </Button>
          )}

          <Button variant="outline" size="sm">
            <Plus className="h-3 w-3 mr-1" />
            Add Child
          </Button>

          <Button variant="outline" size="sm">
            <RotateCcw className="h-3 w-3 mr-1" />
            Reset
          </Button>
        </div>

        {editMode && (
          <div className="flex space-x-2 pt-2">
            <Button size="sm" className="flex-1">
              <Save className="h-3 w-3 mr-1" />
              Save
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditMode(false)}
            >
              Cancel
            </Button>
          </div>
        )}
      </div>
    );
  };

  const renderEnvironmentalControls = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Thermometer className="h-4 w-4 text-red-500" />
              Temperature
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">22.5°C</div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Target: 22-24°C
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Droplets className="h-4 w-4 text-blue-500" />
              Humidity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">65%</div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Target: 60-70%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sun className="h-4 w-4 text-yellow-500" />
              Light
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">450</div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              PPFD μmol/m²/s
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Wind className="h-4 w-4 text-gray-500" />
              Airflow
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Normal</div>
            <p className="text-xs text-gray-500 dark:text-gray-400">0.2 m/s</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Control Panel
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Manage your farm configuration and operations
        </p>
      </div>

      {/* Tabs */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger
              value="layout"
              className="flex items-center gap-1 text-xs"
            >
              <Settings className="h-3 w-3" />
              Layout
            </TabsTrigger>
            <TabsTrigger
              value="devices"
              className="flex items-center gap-1 text-xs"
            >
              <Zap className="h-3 w-3" />
              Devices
            </TabsTrigger>
            <TabsTrigger
              value="environment"
              className="flex items-center gap-1 text-xs"
            >
              <Activity className="h-3 w-3" />
              Environment
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <Tabs value={activeTab} onValueChange={onTabChange}>
          <TabsContent value="layout" className="space-y-6 mt-0">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Selected Element</CardTitle>
              </CardHeader>
              <CardContent>{renderElementDetails()}</CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Actions</CardTitle>
              </CardHeader>
              <CardContent>{renderQuickActions()}</CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="devices" className="space-y-6 mt-0">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Device Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">LED Arrays</span>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">12/12 Active</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Water Pumps</span>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">4/4 Active</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Sensors</span>
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm">6/7 Active</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Device Controls</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Master Power</Label>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Auto Mode</Label>
                    <Switch defaultChecked />
                  </div>
                  <Button className="w-full" size="sm">
                    Emergency Stop
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="environment" className="space-y-6 mt-0">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">
                  Environmental Conditions
                </CardTitle>
              </CardHeader>
              <CardContent>{renderEnvironmentalControls()}</CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">
                  Alerts & Notifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm">
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                    <span>Humidity sensor #3 offline</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>All systems nominal</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
