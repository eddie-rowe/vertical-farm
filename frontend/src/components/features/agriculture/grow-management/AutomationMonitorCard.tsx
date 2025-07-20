"use client";

import {
  Bot,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Zap,
  Droplets,
  Sun,
  Thermometer,
  PlayCircle,
  PauseCircle,
  RefreshCw,
} from "lucide-react";
import { useState, useEffect } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AutomationStatus {
  id: string;
  schedule_id: string;
  automation_enabled: boolean;
  last_automation_check?: string;
  next_automation_action?: string;
  pending_tasks: number;
  processing_tasks: number;
  failed_tasks_today: number;
  recent_device_controls: number;
  active_critical_alerts: number;
  environmental_status: "normal" | "warning" | "critical";
  recent_actions: {
    type: string;
    status: "completed" | "failed" | "pending";
    timestamp: string;
    message?: string;
  }[];
  environmental_alerts: {
    type: string;
    message: string;
    severity: "info" | "warning" | "error";
    timestamp: string;
  }[];
}

interface AutomationMonitorCardProps {
  scheduleId: string;
  shelfName: string;
  recipeName: string;
  className?: string;
}

export default function AutomationMonitorCard({
  scheduleId,
  className = "",
}: AutomationMonitorCardProps) {
  const [automationStatus, setAutomationStatus] =
    useState<AutomationStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Mock data for demonstration - replace with actual API calls
  useEffect(() => {
    const mockStatus: AutomationStatus = {
      id: `automation-${scheduleId}`,
      schedule_id: scheduleId,
      automation_enabled: true,
      last_automation_check: new Date(
        Date.now() - 15 * 60 * 1000,
      ).toISOString(), // 15 minutes ago
      next_automation_action: new Date(
        Date.now() + 45 * 60 * 1000,
      ).toISOString(), // 45 minutes from now
      pending_tasks: 2,
      processing_tasks: 1,
      failed_tasks_today: 0,
      recent_device_controls: 3,
      active_critical_alerts: 1,
      environmental_status: "warning" as const,
      recent_actions: [
        {
          type: "environmental_check",
          status: "completed",
          timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
          message: "All parameters within range",
        },
        {
          type: "lighting_cycle",
          status: "completed",
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          message: "Lights turned on for day cycle",
        },
        {
          type: "watering_cycle",
          status: "pending",
          timestamp: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          message: "Next watering scheduled",
        },
      ],
      environmental_alerts: [
        {
          type: "humidity_high",
          message: "Humidity 78% above target range (60-70%)",
          severity: "warning",
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        },
      ],
    };

    // Simulate API delay
    setTimeout(() => {
      setAutomationStatus(mockStatus);
      setIsLoading(false);
    }, 500);
  }, [scheduleId]);

  const toggleAutomation = async () => {
    if (!automationStatus) return;

    try {
      // TODO: API call to toggle automation
      setAutomationStatus((prev) =>
        prev
          ? {
              ...prev,
              automation_enabled: !prev.automation_enabled,
            }
          : null,
      );
    } catch (error) {
      console.error("Error toggling automation:", error);
    }
  };

  const retryFailedTasks = async () => {
    try {
      // TODO: API call to retry failed tasks
      console.log("Retrying failed tasks for schedule:", scheduleId);
    } catch (error) {
      console.error("Error retrying tasks:", error);
    }
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case "environmental_check":
        return <Thermometer className="h-3 w-3" />;
      case "lighting_cycle":
        return <Sun className="h-3 w-3" />;
      case "watering_cycle":
        return <Droplets className="h-3 w-3" />;
      case "device_control":
        return <Zap className="h-3 w-3" />;
      default:
        return <Bot className="h-3 w-3" />;
    }
  };

  const getActionStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-3 w-3 text-green-500" />;
      case "failed":
        return <XCircle className="h-3 w-3 text-red-500" />;
      case "pending":
        return <Clock className="h-3 w-3 text-yellow-500" />;
      default:
        return <Clock className="h-3 w-3 text-gray-500" />;
    }
  };

  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "info":
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return "Just now";
  };

  const formatTimeFromNow = (timestamp: string) => {
    const diff = new Date(timestamp).getTime() - Date.now();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `in ${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `in ${minutes}m`;
    return "Now";
  };

  if (isLoading) {
    return (
      <Card className={`${className} animate-pulse`}>
        <CardContent className="pt-4">
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!automationStatus) {
    return (
      <Card className={className}>
        <CardContent className="pt-4">
          <div className="text-center text-gray-500 text-sm">
            No automation data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            <CardTitle className="text-sm">Automation</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={
                automationStatus.automation_enabled ? "default" : "secondary"
              }
            >
              {automationStatus.automation_enabled ? "Active" : "Disabled"}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleAutomation}
              className="h-6 w-6 p-0"
            >
              {automationStatus.automation_enabled ? (
                <PauseCircle className="h-3 w-3" />
              ) : (
                <PlayCircle className="h-3 w-3" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Task Status Overview */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="text-center">
            <div className="font-medium text-yellow-600">
              {automationStatus.pending_tasks}
            </div>
            <div className="text-gray-500">Pending</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-blue-600">
              {automationStatus.processing_tasks}
            </div>
            <div className="text-gray-500">Processing</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-red-600">
              {automationStatus.failed_tasks_today}
            </div>
            <div className="text-gray-500">Failed</div>
          </div>
        </div>

        {/* Last Check and Next Action */}
        <div className="space-y-2 text-xs">
          {automationStatus.last_automation_check && (
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Last check:</span>
              <span>
                {formatTimeAgo(automationStatus.last_automation_check)}
              </span>
            </div>
          )}
          {automationStatus.next_automation_action && (
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Next action:</span>
              <span>
                {formatTimeFromNow(automationStatus.next_automation_action)}
              </span>
            </div>
          )}
        </div>

        {/* Recent Actions */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
            Recent Actions
          </div>
          <div className="space-y-1">
            {automationStatus.recent_actions
              .slice(0, 3)
              .map((action, index) => (
                <div key={index} className="flex items-center gap-2 text-xs">
                  {getActionIcon(action.type)}
                  <span className="flex-1 truncate">
                    {action.type.replace("_", " ")}
                  </span>
                  {getActionStatusIcon(action.status)}
                  <span className="text-gray-500">
                    {new Date(action.timestamp) > new Date()
                      ? formatTimeFromNow(action.timestamp)
                      : formatTimeAgo(action.timestamp)}
                  </span>
                </div>
              ))}
          </div>
        </div>

        {/* Environmental Alerts */}
        {automationStatus.environmental_alerts.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
              Alerts
            </div>
            <div className="space-y-1">
              {automationStatus.environmental_alerts
                .slice(0, 2)
                .map((alert, index) => (
                  <div key={index} className="flex items-start gap-2 text-xs">
                    {getAlertIcon(alert.severity)}
                    <div className="flex-1">
                      <div className="text-gray-600 dark:text-gray-400">
                        {alert.message}
                      </div>
                      <div className="text-gray-500">
                        {formatTimeAgo(alert.timestamp)}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {automationStatus.failed_tasks_today > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={retryFailedTasks}
            className="w-full text-xs"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Retry Failed Tasks
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
