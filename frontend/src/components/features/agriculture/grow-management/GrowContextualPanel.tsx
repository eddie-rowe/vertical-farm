"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Leaf,
  Calendar,
  Clock,
  Settings,
  Activity,
  AlertTriangle,
  CheckCircle,
  Edit,
  Save,
  X,
  Play,
  Pause,
  RotateCcw,
  Trash2,
  Bot,
  Zap,
  Droplets,
  Sun,
  Thermometer,
  Wind,
  Eye,
  BarChart3,
} from "lucide-react";

interface GrowData {
  id: string;
  shelfId: string;
  shelfName: string;
  rackName: string;
  rowName: string;
  farmName: string;
  recipeName: string;
  speciesName: string;
  startDate: string;
  endDate: string;
  status: "planned" | "active" | "completed" | "aborted";
  progress: number;
  daysElapsed: number;
  daysRemaining: number;
  totalDays: number;
  yield?: number;
  automationEnabled: boolean;
  criticalAlerts: number;
  environmentalScore: number;
  notes?: string;
  environmentalData: {
    temperature: number;
    humidity: number;
    lightLevel: number;
    airflow: number;
    ph: number;
    ec: number;
  };
  automationSettings: {
    lightHours: number;
    wateringFrequency: number;
    temperatureMin: number;
    temperatureMax: number;
    humidityTarget: number;
  };
  recentEvents: {
    timestamp: string;
    type: string;
    message: string;
    severity: "info" | "warning" | "error";
  }[];
}

interface GrowContextualPanelProps {
  selectedGrowId?: string;
  onGrowUpdate?: (growId: string, updates: Partial<GrowData>) => void;
  onGrowAction?: (growId: string, action: string) => void;
  className?: string;
}

export default function GrowContextualPanel({
  selectedGrowId,
  onGrowUpdate,
  onGrowAction,
  className = "",
}: GrowContextualPanelProps) {
  const [growData, setGrowData] = useState<GrowData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedNotes, setEditedNotes] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (selectedGrowId) {
      setIsLoading(true);
      // Mock data - replace with actual API calls
      const mockGrowData: GrowData = {
        id: selectedGrowId,
        shelfId: "shelf-1",
        shelfName: "Shelf A1-1-1",
        rackName: "Rack A1-1",
        rowName: "Row A1",
        farmName: "Greenhouse A",
        recipeName: "Quick Lettuce",
        speciesName: "Lettuce",
        startDate: "2024-01-15",
        endDate: "2024-02-19",
        status: "active",
        progress: 65,
        daysElapsed: 23,
        daysRemaining: 12,
        totalDays: 35,
        automationEnabled: true,
        criticalAlerts: 0,
        environmentalScore: 92,
        notes:
          "Growing well, good color development. Adjusted lighting schedule yesterday.",
        environmentalData: {
          temperature: 22.5,
          humidity: 68,
          lightLevel: 85,
          airflow: 72,
          ph: 6.2,
          ec: 1.4,
        },
        automationSettings: {
          lightHours: 14,
          wateringFrequency: 24,
          temperatureMin: 18,
          temperatureMax: 24,
          humidityTarget: 65,
        },
        recentEvents: [
          {
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            type: "watering",
            message: "Automated watering cycle completed",
            severity: "info",
          },
          {
            timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
            type: "lighting",
            message: "Light cycle adjusted to 14 hours",
            severity: "info",
          },
          {
            timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
            type: "environment",
            message: "Humidity slightly above target range",
            severity: "warning",
          },
        ],
      };

      setTimeout(() => {
        setGrowData(mockGrowData);
        setEditedNotes(mockGrowData.notes || "");
        setIsLoading(false);
      }, 300);
    } else {
      setGrowData(null);
    }
  }, [selectedGrowId]);

  const handleSaveNotes = () => {
    if (growData && onGrowUpdate) {
      onGrowUpdate(growData.id, { notes: editedNotes });
      setGrowData({ ...growData, notes: editedNotes });
    }
    setIsEditing(false);
  };

  const getStatusColor = (status: GrowData["status"]) => {
    switch (status) {
      case "planned":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "completed":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      case "aborted":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getEnvironmentalStatus = (value: number, min: number, max: number) => {
    if (value < min || value > max) return "error";
    if (value < min * 1.1 || value > max * 0.9) return "warning";
    return "good";
  };

  const getEnvironmentalColor = (status: string) => {
    switch (status) {
      case "good":
        return "text-green-600";
      case "warning":
        return "text-yellow-600";
      case "error":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const hours = Math.floor(diff / (60 * 60 * 1000));
    const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));

    if (hours > 0) return `${hours}h ${minutes}m ago`;
    return `${minutes}m ago`;
  };

  if (!selectedGrowId) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <Leaf className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Select a grow to view details</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading || !growData) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Leaf className="h-5 w-5 text-green-600" />
              {growData.shelfName}
            </CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {growData.speciesName} • {growData.recipeName}
            </p>
          </div>
          <Badge className={getStatusColor(growData.status)}>
            {growData.status}
          </Badge>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {growData.progress}%
            </p>
            <p className="text-xs text-gray-500">Progress</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">
              {growData.daysRemaining}
            </p>
            <p className="text-xs text-gray-500">Days left</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">
              {growData.environmentalScore}
            </p>
            <p className="text-xs text-gray-500">Env Score</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="text-xs">
              <Eye className="h-3 w-3 mr-1" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="environment" className="text-xs">
              <Thermometer className="h-3 w-3 mr-1" />
              Environment
            </TabsTrigger>
            <TabsTrigger value="automation" className="text-xs">
              <Bot className="h-3 w-3 mr-1" />
              Automation
            </TabsTrigger>
            <TabsTrigger value="activity" className="text-xs">
              <Activity className="h-3 w-3 mr-1" />
              Activity
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            {/* Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Growth Progress</span>
                <span>{growData.progress}%</span>
              </div>
              <Progress value={growData.progress} className="h-2" />
              <div className="flex justify-between text-xs text-gray-500">
                <span>
                  Day {growData.daysElapsed}/{growData.totalDays}
                </span>
                <span>{growData.daysRemaining} days remaining</span>
              </div>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Location</Label>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                📍 {growData.farmName} › {growData.rowName} ›{" "}
                {growData.rackName} › {growData.shelfName}
              </div>
            </div>

            {/* Timeline */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Timeline</Label>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Started: {new Date(growData.startDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>
                    Harvest: {new Date(growData.endDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Notes</Label>
                {!isEditing && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                )}
              </div>
              {isEditing ? (
                <div className="space-y-2">
                  <Textarea
                    value={editedNotes}
                    onChange={(e) => setEditedNotes(e.target.value)}
                    placeholder="Add notes about this grow..."
                    className="min-h-20"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSaveNotes}>
                      <Save className="h-3 w-3 mr-1" />
                      Save
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(false)}
                    >
                      <X className="h-3 w-3 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 rounded p-2">
                  {growData.notes || "No notes added yet."}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Actions</Label>
              <div className="flex flex-wrap gap-2">
                {growData.status === "active" && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onGrowAction?.(growData.id, "pause")}
                    >
                      <Pause className="h-3 w-3 mr-1" />
                      Pause
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onGrowAction?.(growData.id, "harvest")}
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Harvest
                    </Button>
                  </>
                )}
                {growData.status === "planned" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onGrowAction?.(growData.id, "start")}
                  >
                    <Play className="h-3 w-3 mr-1" />
                    Start
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onGrowAction?.(growData.id, "clone")}
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Clone
                </Button>
                {growData.status !== "completed" && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => onGrowAction?.(growData.id, "abort")}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Abort
                  </Button>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="environment" className="space-y-4 mt-4">
            {/* Environmental Readings */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Thermometer className="h-4 w-4" />
                  <span className="text-sm font-medium">Temperature</span>
                </div>
                <div className="text-lg font-bold">
                  {growData.environmentalData.temperature}°C
                </div>
                <div className="text-xs text-gray-500">
                  Target: {growData.automationSettings.temperatureMin}-
                  {growData.automationSettings.temperatureMax}°C
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Droplets className="h-4 w-4" />
                  <span className="text-sm font-medium">Humidity</span>
                </div>
                <div className="text-lg font-bold">
                  {growData.environmentalData.humidity}%
                </div>
                <div className="text-xs text-gray-500">
                  Target: {growData.automationSettings.humidityTarget}%
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Sun className="h-4 w-4" />
                  <span className="text-sm font-medium">Light Level</span>
                </div>
                <div className="text-lg font-bold">
                  {growData.environmentalData.lightLevel}%
                </div>
                <div className="text-xs text-gray-500">
                  {growData.automationSettings.lightHours}h/day
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Wind className="h-4 w-4" />
                  <span className="text-sm font-medium">Airflow</span>
                </div>
                <div className="text-lg font-bold">
                  {growData.environmentalData.airflow}%
                </div>
                <div className="text-xs text-gray-500">Circulation</div>
              </div>
            </div>

            {/* Water Quality */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Water Quality</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 dark:bg-gray-900 rounded p-2">
                  <div className="text-sm font-medium">pH Level</div>
                  <div className="text-lg font-bold">
                    {growData.environmentalData.ph}
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900 rounded p-2">
                  <div className="text-sm font-medium">EC Level</div>
                  <div className="text-lg font-bold">
                    {growData.environmentalData.ec} mS/cm
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="automation" className="space-y-4 mt-4">
            {/* Automation Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4" />
                <span className="text-sm font-medium">Automation</span>
              </div>
              <Badge
                variant={growData.automationEnabled ? "default" : "secondary"}
              >
                {growData.automationEnabled ? "Enabled" : "Disabled"}
              </Badge>
            </div>

            {/* Automation Settings */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Light Hours/Day</Label>
                  <Input
                    type="number"
                    value={growData.automationSettings.lightHours}
                    className="h-8 text-sm"
                    readOnly
                  />
                </div>
                <div>
                  <Label className="text-xs">Watering Frequency (hrs)</Label>
                  <Input
                    type="number"
                    value={growData.automationSettings.wateringFrequency}
                    className="h-8 text-sm"
                    readOnly
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Min Temperature</Label>
                  <Input
                    type="number"
                    value={growData.automationSettings.temperatureMin}
                    className="h-8 text-sm"
                    readOnly
                  />
                </div>
                <div>
                  <Label className="text-xs">Max Temperature</Label>
                  <Input
                    type="number"
                    value={growData.automationSettings.temperatureMax}
                    className="h-8 text-sm"
                    readOnly
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs">Target Humidity</Label>
                <Input
                  type="number"
                  value={growData.automationSettings.humidityTarget}
                  className="h-8 text-sm"
                  readOnly
                />
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Quick Actions</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm">
                  <Zap className="h-3 w-3 mr-1" />
                  Manual Water
                </Button>
                <Button variant="outline" size="sm">
                  <Sun className="h-3 w-3 mr-1" />
                  Toggle Lights
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4 mt-4">
            {/* Recent Events */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Recent Events</Label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {growData.recentEvents.map((event, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 p-2 bg-gray-50 dark:bg-gray-900 rounded"
                  >
                    <div
                      className={`w-2 h-2 rounded-full mt-2 ${
                        event.severity === "error"
                          ? "bg-red-500"
                          : event.severity === "warning"
                            ? "bg-yellow-500"
                            : "bg-green-500"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm">{event.message}</div>
                      <div className="text-xs text-gray-500">
                        {formatTimeAgo(event.timestamp)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Performance</Label>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-50 dark:bg-gray-900 rounded p-2">
                  <div className="text-xs text-gray-500">Growth Rate</div>
                  <div className="text-sm font-medium">On Track</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900 rounded p-2">
                  <div className="text-xs text-gray-500">Resource Usage</div>
                  <div className="text-sm font-medium">Optimal</div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
