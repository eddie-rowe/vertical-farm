"use client";

import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Droplets,
  Sun,
  Thermometer,
  Wind,
  Bot,
  Wifi,
  WifiOff,
  RefreshCw,
  Pause,
  Play,
  Settings,
  Bell,
  Maximize2,
} from "lucide-react";
import { useState, useEffect } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface EnvironmentalReading {
  id: string;
  shelfId: string;
  shelfName: string;
  farmName: string;
  temperature: number;
  humidity: number;
  lightLevel: number;
  airflow: number;
  ph: number;
  ec: number;
  lastUpdate: string;
  status: "online" | "offline" | "warning" | "error";
}

interface AutomationStatus {
  id: string;
  shelfId: string;
  shelfName: string;
  isEnabled: boolean;
  nextAction: string;
  nextActionTime: string;
  tasksQueued: number;
  lastError?: string;
  efficiency: number;
}

interface SystemAlert {
  id: string;
  type: "environmental" | "automation" | "system" | "harvest";
  severity: "info" | "warning" | "error" | "critical";
  message: string;
  shelfId?: string;
  shelfName?: string;
  timestamp: string;
  acknowledged: boolean;
}

interface RealTimeMonitoringHubProps {
  selectedGrowId?: string;
  onAlertClick?: (alert: SystemAlert) => void;
  onShelfClick?: (shelfId: string) => void;
  isExpanded?: boolean;
  onExpandToggle?: () => void;
}

export default function RealTimeMonitoringHub({
  selectedGrowId,
  onAlertClick,
  onShelfClick,
  isExpanded = false,
  onExpandToggle,
}: RealTimeMonitoringHubProps) {
  const [environmentalData, setEnvironmentalData] = useState<
    EnvironmentalReading[]
  >([]);
  const [automationStatus, setAutomationStatus] = useState<AutomationStatus[]>(
    [],
  );
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    const fetchData = () => {
      // Mock data - replace with actual WebSocket/API calls
      const mockEnvironmentalData: EnvironmentalReading[] = [
        {
          id: "env-1",
          shelfId: "shelf-1",
          shelfName: "Shelf A1-1-1",
          farmName: "Greenhouse A",
          temperature: 22.5,
          humidity: 68,
          lightLevel: 85,
          airflow: 72,
          ph: 6.2,
          ec: 1.4,
          lastUpdate: new Date().toISOString(),
          status: "online",
        },
        {
          id: "env-2",
          shelfId: "shelf-2",
          shelfName: "Shelf A1-1-2",
          farmName: "Greenhouse A",
          temperature: 23.1,
          humidity: 72,
          lightLevel: 88,
          airflow: 68,
          ph: 6.0,
          ec: 1.6,
          lastUpdate: new Date().toISOString(),
          status: "warning",
        },
        {
          id: "env-3",
          shelfId: "shelf-3",
          shelfName: "Shelf B1-1-1",
          farmName: "Greenhouse A",
          temperature: 21.8,
          humidity: 65,
          lightLevel: 90,
          airflow: 75,
          ph: 6.3,
          ec: 1.3,
          lastUpdate: new Date().toISOString(),
          status: "online",
        },
      ];

      const mockAutomationStatus: AutomationStatus[] = [
        {
          id: "auto-1",
          shelfId: "shelf-1",
          shelfName: "Shelf A1-1-1",
          isEnabled: true,
          nextAction: "Watering cycle",
          nextActionTime: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
          tasksQueued: 2,
          efficiency: 94,
        },
        {
          id: "auto-2",
          shelfId: "shelf-2",
          shelfName: "Shelf A1-1-2",
          isEnabled: true,
          nextAction: "Light adjustment",
          nextActionTime: new Date(Date.now() + 120 * 60 * 1000).toISOString(),
          tasksQueued: 1,
          lastError: "Humidity sensor timeout",
          efficiency: 87,
        },
      ];

      const mockAlerts: SystemAlert[] = [
        {
          id: "alert-1",
          type: "environmental",
          severity: "warning",
          message: "Humidity above target range (72% > 70%)",
          shelfId: "shelf-2",
          shelfName: "Shelf A1-1-2",
          timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          acknowledged: false,
        },
        {
          id: "alert-2",
          type: "automation",
          severity: "error",
          message: "Humidity sensor timeout - manual intervention required",
          shelfId: "shelf-2",
          shelfName: "Shelf A1-1-2",
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          acknowledged: false,
        },
        {
          id: "alert-3",
          type: "harvest",
          severity: "info",
          message: "Lettuce ready for harvest in 2 days",
          shelfId: "shelf-1",
          shelfName: "Shelf A1-1-1",
          timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          acknowledged: true,
        },
      ];

      setEnvironmentalData(mockEnvironmentalData);
      setAutomationStatus(mockAutomationStatus);
      setAlerts(mockAlerts);
      setLastUpdate(new Date());
      setIsLoading(false);
    };

    fetchData();

    // Set up auto-refresh
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const getStatusColor = (status: EnvironmentalReading["status"]) => {
    switch (status) {
      case "online":
        return "text-green-500";
      case "warning":
        return "text-yellow-500";
      case "error":
        return "text-red-500";
      case "offline":
        return "text-gray-500";
      default:
        return "text-gray-500";
    }
  };

  const getStatusIcon = (status: EnvironmentalReading["status"]) => {
    switch (status) {
      case "online":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "error":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "offline":
        return <WifiOff className="h-4 w-4 text-gray-500" />;
      default:
        return <Wifi className="h-4 w-4 text-gray-500" />;
    }
  };

  const getAlertIcon = (type: SystemAlert["type"]) => {
    switch (type) {
      case "environmental":
        return <Thermometer className="h-4 w-4" />;
      case "automation":
        return <Bot className="h-4 w-4" />;
      case "system":
        return <Settings className="h-4 w-4" />;
      case "harvest":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getAlertSeverityColor = (severity: SystemAlert["severity"]) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200";
      case "error":
        return "bg-red-50 text-red-700 border-red-200 dark:bg-red-900 dark:text-red-200";
      case "warning":
        return "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-200";
      case "info":
        return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900 dark:text-blue-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours}h ${minutes % 60}m ago`;
    return `${minutes}m ago`;
  };

  const formatTimeFromNow = (timestamp: string) => {
    const diff = new Date(timestamp).getTime() - Date.now();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `in ${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `in ${minutes}m`;
    return "now";
  };

  const acknowledgeAlert = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((alert) =>
        alert.id === alertId ? { ...alert, acknowledged: true } : alert,
      ),
    );
  };

  const unacknowledgedAlerts = alerts.filter((alert) => !alert.acknowledged);
  const criticalAlerts = unacknowledgedAlerts.filter(
    (alert) => alert.severity === "critical" || alert.severity === "error",
  );

  if (isLoading) {
    return (
      <Card className="h-96">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-lg">Loading monitoring data...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div
      className={`space-y-4 ${isExpanded ? "fixed inset-0 z-50 bg-white dark:bg-gray-900 p-4" : ""}`}
    >
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-green-600" />
                Real-Time Monitoring
              </CardTitle>
              <div className="flex items-center gap-2">
                {isConnected ? (
                  <Badge variant="default" className="text-xs">
                    <Wifi className="h-3 w-3 mr-1" />
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="text-xs">
                    <WifiOff className="h-3 w-3 mr-1" />
                    Disconnected
                  </Badge>
                )}
                {criticalAlerts.length > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {criticalAlerts.length} Critical
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
              >
                {autoRefresh ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              {onExpandToggle && (
                <Button variant="outline" size="sm" onClick={onExpandToggle}>
                  <Maximize2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <div className="text-sm text-gray-600 dark:text-gray-400">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Environmental Monitoring */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Thermometer className="h-4 w-4" />
              Environmental Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {environmentalData.map((reading) => (
                <div
                  key={reading.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                    selectedGrowId === reading.shelfId
                      ? "ring-2 ring-blue-500 shadow-lg"
                      : "hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                  onClick={() => onShelfClick?.(reading.shelfId)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(reading.status)}
                      <span className="font-medium text-sm">
                        {reading.shelfName}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatTimeAgo(reading.lastUpdate)}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Thermometer className="h-3 w-3" />
                      <span>{reading.temperature}°C</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Droplets className="h-3 w-3" />
                      <span>{reading.humidity}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Sun className="h-3 w-3" />
                      <span>{reading.lightLevel}%</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-sm mt-2">
                    <div className="flex items-center gap-2">
                      <Wind className="h-3 w-3" />
                      <span>{reading.airflow}%</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      pH: {reading.ph}
                    </div>
                    <div className="text-xs text-gray-500">
                      EC: {reading.ec} mS/cm
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Alerts Panel */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Bell className="h-4 w-4" />
              System Alerts
              {unacknowledgedAlerts.length > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {unacknowledgedAlerts.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {alerts.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No alerts</p>
                </div>
              ) : (
                alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${getAlertSeverityColor(
                      alert.severity,
                    )} ${alert.acknowledged ? "opacity-60" : ""}`}
                    onClick={() => onAlertClick?.(alert)}
                  >
                    <div className="flex items-start gap-2">
                      {getAlertIcon(alert.type)}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">
                          {alert.message}
                        </div>
                        {alert.shelfName && (
                          <div className="text-xs opacity-75 mt-1">
                            {alert.shelfName}
                          </div>
                        )}
                        <div className="text-xs opacity-75 mt-1">
                          {formatTimeAgo(alert.timestamp)}
                        </div>
                      </div>
                      {!alert.acknowledged && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            acknowledgeAlert(alert.id);
                          }}
                        >
                          <CheckCircle className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Automation Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bot className="h-4 w-4" />
            Automation Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {automationStatus.map((automation) => (
              <div
                key={automation.id}
                className="p-3 rounded-lg border bg-gray-50 dark:bg-gray-900"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">
                    {automation.shelfName}
                  </span>
                  <Badge
                    variant={automation.isEnabled ? "default" : "secondary"}
                  >
                    {automation.isEnabled ? "Active" : "Disabled"}
                  </Badge>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Next Action:
                    </span>
                    <span>{automation.nextAction}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Scheduled:
                    </span>
                    <span>{formatTimeFromNow(automation.nextActionTime)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Efficiency:
                    </span>
                    <span className="font-medium">
                      {automation.efficiency}%
                    </span>
                  </div>
                  {automation.tasksQueued > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Queued:
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {automation.tasksQueued} tasks
                      </Badge>
                    </div>
                  )}
                  {automation.lastError && (
                    <div className="text-xs text-red-600 dark:text-red-400 mt-2">
                      Error: {automation.lastError}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
