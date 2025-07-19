"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Layers,
  Settings,
  Eye,
  EyeOff,
  Monitor,
  Zap,
  Sprout,
  AlertTriangle,
  Cpu,
  Palette,
  RotateCcw,
} from "lucide-react";
import { OverlayConfig } from "../configurations/types";

interface LayerOverlayModalProps {
  isOpen: boolean;
  onClose: () => void;
  overlays: OverlayConfig[];
  onUpdateOverlays: (overlays: OverlayConfig[]) => void;
  activeOverlayIds: string[];
}

interface LayerPreset {
  id: string;
  name: string;
  description: string;
  overlays: Partial<OverlayConfig>[];
}

const LAYER_TYPES = [
  {
    value: "devices",
    label: "Devices",
    icon: Cpu,
    description: "Show device status and controls",
  },
  {
    value: "monitoring",
    label: "Monitoring",
    icon: Monitor,
    description: "Environmental sensors and alerts",
  },
  {
    value: "automation",
    label: "Automation",
    icon: Zap,
    description: "Automated systems and schedules",
  },
  {
    value: "grows",
    label: "Grows",
    icon: Sprout,
    description: "Active grow cycles and stages",
  },
  {
    value: "alerts",
    label: "Alerts",
    icon: AlertTriangle,
    description: "System alerts and notifications",
  },
  {
    value: "custom",
    label: "Custom",
    icon: Settings,
    description: "Custom overlay layers",
  },
];

const BLEND_MODES = [
  { value: "normal", label: "Normal" },
  { value: "multiply", label: "Multiply" },
  { value: "overlay", label: "Overlay" },
  { value: "soft-light", label: "Soft Light" },
];

const LAYER_PRESETS: LayerPreset[] = [
  {
    id: "operational",
    name: "Operational View",
    description: "Essential layers for daily operations",
    overlays: [
      { layer: "devices", enabled: true, defaultVisible: true, opacity: 1 },
      {
        layer: "monitoring",
        enabled: true,
        defaultVisible: true,
        opacity: 0.8,
      },
      { layer: "alerts", enabled: true, defaultVisible: true, opacity: 1 },
    ],
  },
  {
    id: "maintenance",
    name: "Maintenance Mode",
    description: "Focus on system status and alerts",
    overlays: [
      { layer: "devices", enabled: true, defaultVisible: true, opacity: 1 },
      {
        layer: "automation",
        enabled: true,
        defaultVisible: false,
        opacity: 0.6,
      },
      { layer: "alerts", enabled: true, defaultVisible: true, opacity: 1 },
    ],
  },
  {
    id: "growing",
    name: "Grow Management",
    description: "Optimized for grow cycle management",
    overlays: [
      { layer: "grows", enabled: true, defaultVisible: true, opacity: 1 },
      {
        layer: "monitoring",
        enabled: true,
        defaultVisible: true,
        opacity: 0.7,
      },
      {
        layer: "automation",
        enabled: true,
        defaultVisible: false,
        opacity: 0.5,
      },
    ],
  },
];

export const LayerOverlayModal: React.FC<LayerOverlayModalProps> = ({
  isOpen,
  onClose,
  overlays,
  onUpdateOverlays,
  activeOverlayIds,
}) => {
  const [editingOverlays, setEditingOverlays] = useState<OverlayConfig[]>([]);
  const [selectedLayer, setSelectedLayer] = useState<string>("");
  const [activeTab, setActiveTab] = useState("layers");

  useEffect(() => {
    if (isOpen) {
      setEditingOverlays([...overlays]);
    }
  }, [isOpen, overlays]);

  const getLayerIcon = (layer: string) => {
    const layerType = LAYER_TYPES.find((type) => type.value === layer);
    return layerType ? layerType.icon : Settings;
  };

  const getLayerDescription = (layer: string) => {
    const layerType = LAYER_TYPES.find((type) => type.value === layer);
    return layerType?.description || "Custom layer configuration";
  };

  const updateOverlay = (id: string, updates: Partial<OverlayConfig>) => {
    setEditingOverlays((prev) =>
      prev.map((overlay) =>
        overlay.id === id ? { ...overlay, ...updates } : overlay,
      ),
    );
  };

  const addNewOverlay = () => {
    if (!selectedLayer) return;

    const layerType = LAYER_TYPES.find((type) => type.value === selectedLayer);
    const newOverlay: OverlayConfig = {
      id: `${selectedLayer}_${Date.now()}`,
      name: layerType?.label || "New Layer",
      enabled: true,
      defaultVisible: false,
      layer: selectedLayer as any,
      opacity: 1,
      zIndex: 10,
    };

    setEditingOverlays((prev) => [...prev, newOverlay]);
    setSelectedLayer("");
  };

  const removeOverlay = (id: string) => {
    setEditingOverlays((prev) => prev.filter((overlay) => overlay.id !== id));
  };

  const applyPreset = (preset: LayerPreset) => {
    const newOverlays = preset.overlays.map(
      (overlayTemplate, index) =>
        ({
          id: `${overlayTemplate.layer}_preset_${Date.now()}_${index}`,
          name:
            LAYER_TYPES.find((type) => type.value === overlayTemplate.layer)
              ?.label || "Layer",
          enabled: true,
          defaultVisible: false,
          opacity: 1,
          zIndex: 10,
          ...overlayTemplate,
        }) as OverlayConfig,
    );

    setEditingOverlays(newOverlays);
  };

  const handleSave = () => {
    onUpdateOverlays(editingOverlays);
    onClose();
  };

  const handleCancel = () => {
    setEditingOverlays([...overlays]);
    onClose();
  };

  const resetToDefaults = () => {
    setEditingOverlays([]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="w-5 h-5" />
            Layer Overlay Configuration
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="layers">Layers</TabsTrigger>
            <TabsTrigger value="presets">Presets</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <div className="max-h-[60vh] overflow-y-auto">
            <TabsContent value="layers" className="space-y-4">
              {/* Add New Layer */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Add New Layer</CardTitle>
                  <CardDescription>
                    Create a new overlay layer for your farm visualization
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex gap-2">
                  <Select
                    value={selectedLayer}
                    onValueChange={setSelectedLayer}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select layer type" />
                    </SelectTrigger>
                    <SelectContent>
                      {LAYER_TYPES.map((type) => {
                        const Icon = type.icon;
                        return (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <Icon className="w-4 h-4" />
                              {type.label}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={addNewOverlay}
                    disabled={!selectedLayer}
                    className="shrink-0"
                  >
                    Add Layer
                  </Button>
                </CardContent>
              </Card>

              {/* Existing Layers */}
              <div className="space-y-3">
                {editingOverlays.map((overlay) => {
                  const Icon = getLayerIcon(overlay.layer);
                  const isActive = activeOverlayIds.includes(overlay.id);

                  return (
                    <Card key={overlay.id} className="relative">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="flex items-center gap-3 flex-1">
                            <Icon className="w-5 h-5 text-muted-foreground" />
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center gap-2">
                                <Input
                                  value={overlay.name}
                                  onChange={(e) =>
                                    updateOverlay(overlay.id, {
                                      name: e.target.value,
                                    })
                                  }
                                  className="font-medium"
                                />
                                {isActive && (
                                  <Badge variant="default" className="shrink-0">
                                    <Eye className="w-3 h-3 mr-1" />
                                    Active
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {getLayerDescription(overlay.layer)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 shrink-0">
                            <div className="flex items-center gap-2">
                              <Label
                                htmlFor={`enabled-${overlay.id}`}
                                className="text-sm"
                              >
                                Enabled
                              </Label>
                              <Switch
                                id={`enabled-${overlay.id}`}
                                checked={overlay.enabled}
                                onCheckedChange={(enabled) =>
                                  updateOverlay(overlay.id, { enabled })
                                }
                              />
                            </div>

                            <div className="flex items-center gap-2">
                              <Label
                                htmlFor={`visible-${overlay.id}`}
                                className="text-sm"
                              >
                                Default Visible
                              </Label>
                              <Switch
                                id={`visible-${overlay.id}`}
                                checked={overlay.defaultVisible}
                                onCheckedChange={(defaultVisible) =>
                                  updateOverlay(overlay.id, { defaultVisible })
                                }
                              />
                            </div>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeOverlay(overlay.id)}
                            >
                              Remove
                            </Button>
                          </div>
                        </div>

                        <Separator className="my-3" />

                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label>
                              Opacity: {Math.round(overlay.opacity * 100)}%
                            </Label>
                            <Slider
                              value={[overlay.opacity]}
                              min={0}
                              max={1}
                              step={0.1}
                              onValueChange={([opacity]) =>
                                updateOverlay(overlay.id, { opacity })
                              }
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Z-Index</Label>
                            <Input
                              type="number"
                              value={overlay.zIndex}
                              onChange={(e) =>
                                updateOverlay(overlay.id, {
                                  zIndex: parseInt(e.target.value) || 10,
                                })
                              }
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Blend Mode</Label>
                            <Select
                              value={overlay.blendMode || "normal"}
                              onValueChange={(blendMode) =>
                                updateOverlay(overlay.id, {
                                  blendMode: blendMode as any,
                                })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {BLEND_MODES.map((mode) => (
                                  <SelectItem
                                    key={mode.value}
                                    value={mode.value}
                                  >
                                    {mode.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

                {editingOverlays.length === 0 && (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Layers className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-semibold mb-2">
                        No layers configured
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        Add overlay layers to enhance your farm visualization
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="presets" className="space-y-4">
              <div className="grid gap-4">
                {LAYER_PRESETS.map((preset) => (
                  <Card
                    key={preset.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{preset.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {preset.description}
                          </p>
                          <div className="flex gap-1 mt-2">
                            {preset.overlays.map((overlay, index) => {
                              const Icon = getLayerIcon(
                                overlay.layer || "custom",
                              );
                              return (
                                <Badge
                                  key={index}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  <Icon className="w-3 h-3 mr-1" />
                                  {
                                    LAYER_TYPES.find(
                                      (type) => type.value === overlay.layer,
                                    )?.label
                                  }
                                </Badge>
                              );
                            })}
                          </div>
                        </div>
                        <Button onClick={() => applyPreset(preset)}>
                          Apply Preset
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Advanced Configuration
                  </CardTitle>
                  <CardDescription>
                    Advanced settings for layer management and performance
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="font-medium mb-3">Quick Actions</h4>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={resetToDefaults}>
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Reset All Layers
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium mb-3">Layer Statistics</h4>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <Label>Total Layers</Label>
                        <p className="font-medium">{editingOverlays.length}</p>
                      </div>
                      <div>
                        <Label>Enabled Layers</Label>
                        <p className="font-medium">
                          {editingOverlays.filter((o) => o.enabled).length}
                        </p>
                      </div>
                      <div>
                        <Label>Visible by Default</Label>
                        <p className="font-medium">
                          {
                            editingOverlays.filter((o) => o.defaultVisible)
                              .length
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Configuration</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LayerOverlayModal;
