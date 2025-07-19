import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  Activity,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Eye,
  Settings,
  TrendingUp,
  TrendingDown,
  Thermometer,
  Droplets,
  Lightbulb,
  TestTube,
  X,
} from "lucide-react";

interface MonitoringMetric {
  id: string;
  type: "temperature" | "humidity" | "ph" | "light";
  value: number;
  unit: string;
  status: "optimal" | "warning" | "critical";
  trend: "up" | "down" | "stable";
  target?: number;
  range?: { min: number; max: number };
}

interface MonitoringDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  overallHealth: number;
  totalAlerts: number;
  criticalAlerts: number;
  metrics: MonitoringMetric[];
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  size?: "compact" | "expanded";
  className?: string;
}

export const MonitoringDashboard: React.FC<MonitoringDashboardProps> = ({
  isOpen,
  onClose,
  overallHealth,
  totalAlerts,
  criticalAlerts,
  metrics,
  position = "bottom-right",
  size = "compact",
  className,
}) => {
  const [isExpanded, setIsExpanded] = useState(size === "expanded");
  const [selectedMetricType, setSelectedMetricType] = useState<string | null>(
    null,
  );

  if (!isOpen) return null;

  const getHealthColor = (health: number) => {
    if (health >= 8) return "text-green-600 dark:text-green-400";
    if (health >= 6) return "text-amber-600 dark:text-amber-400";
    return "text-red-600 dark:text-red-400";
  };

  const getMetricIcon = (type: string) => {
    switch (type) {
      case "temperature":
        return <Thermometer className="w-4 h-4" />;
      case "humidity":
        return <Droplets className="w-4 h-4" />;
      case "light":
        return <Lightbulb className="w-4 h-4" />;
      case "ph":
        return <TestTube className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getMetricColor = (status: string) => {
    switch (status) {
      case "optimal":
        return "text-green-600 dark:text-green-400";
      case "warning":
        return "text-amber-600 dark:text-amber-400";
      case "critical":
        return "text-red-600 dark:text-red-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="w-3 h-3 text-green-500" />;
      case "down":
        return <TrendingDown className="w-3 h-3 text-red-500" />;
      default:
        return null;
    }
  };

  const positionClasses = {
    "bottom-right": "bottom-4 right-4",
    "bottom-left": "bottom-4 left-4",
    "top-right": "top-4 right-4",
    "top-left": "top-4 left-4",
  };

  const warningAlerts = totalAlerts - criticalAlerts;

  return (
    <div
      className={cn(
        "fixed z-50 pointer-events-auto",
        positionClasses[position],
        className,
      )}
    >
      <Card
        className={cn(
          "bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-xl border transition-all duration-300",
          isExpanded ? "w-80" : "w-64",
        )}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" />
              Live Monitoring
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-6 w-6 p-0"
              >
                {isExpanded ? (
                  <ChevronUp className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-6 w-6 p-0"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Overall Health Summary */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Overall Health</span>
              <Badge
                variant="outline"
                className={cn("text-xs", getHealthColor(overallHealth))}
              >
                {overallHealth.toFixed(1)}/10
              </Badge>
            </div>

            {totalAlerts > 0 && (
              <Badge
                variant="outline"
                className={cn(
                  "text-xs",
                  criticalAlerts > 0
                    ? "text-red-600 border-red-400 animate-pulse"
                    : "text-amber-600 border-amber-400",
                )}
              >
                <AlertTriangle className="w-3 h-3 mr-1" />
                {totalAlerts}
              </Badge>
            )}
          </div>

          <Separator />

          {/* Quick Metrics Overview */}
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
              Environment
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {metrics.slice(0, 4).map((metric) => (
                <div
                  key={metric.id}
                  className={cn(
                    "p-2 rounded-md border cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-gray-800",
                    selectedMetricType === metric.type
                      ? "bg-blue-50 dark:bg-blue-900/20 border-blue-300"
                      : "bg-gray-50/50 dark:bg-gray-800/50",
                  )}
                  onClick={() =>
                    setSelectedMetricType(
                      selectedMetricType === metric.type ? null : metric.type,
                    )
                  }
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      {getMetricIcon(metric.type)}
                      <span className="text-xs font-medium capitalize">
                        {metric.type}
                      </span>
                    </div>
                    {getTrendIcon(metric.trend)}
                  </div>
                  <div className="mt-1">
                    <span
                      className={cn(
                        "text-sm font-semibold",
                        getMetricColor(metric.status),
                      )}
                    >
                      {metric.value}
                      {metric.unit}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Expanded Metric Details */}
          {isExpanded && selectedMetricType && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                  {selectedMetricType} Details
                </h4>
                {metrics
                  .filter((m) => m.type === selectedMetricType)
                  .map((metric) => (
                    <div
                      key={metric.id}
                      className="p-2 bg-gray-50 dark:bg-gray-800 rounded-md"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          Current
                        </span>
                        <span
                          className={cn(
                            "text-sm font-semibold",
                            getMetricColor(metric.status),
                          )}
                        >
                          {metric.value}
                          {metric.unit}
                        </span>
                      </div>
                      {metric.target && (
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            Target
                          </span>
                          <span className="text-sm">
                            {metric.target}
                            {metric.unit}
                          </span>
                        </div>
                      )}
                      {metric.range && (
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            Range
                          </span>
                          <span className="text-sm">
                            {metric.range.min}-{metric.range.max}
                            {metric.unit}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </>
          )}

          {/* Alert Summary */}
          {totalAlerts > 0 && isExpanded && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                  Active Alerts
                </h4>
                <div className="space-y-1">
                  {criticalAlerts > 0 && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-red-600 dark:text-red-400">
                        Critical
                      </span>
                      <Badge
                        variant="outline"
                        className="text-red-600 border-red-400 animate-pulse"
                      >
                        {criticalAlerts}
                      </Badge>
                    </div>
                  )}
                  {warningAlerts > 0 && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-amber-600 dark:text-amber-400">
                        Warning
                      </span>
                      <Badge
                        variant="outline"
                        className="text-amber-600 border-amber-400"
                      >
                        {warningAlerts}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button size="sm" variant="outline" className="flex-1 text-xs">
              <Eye className="w-3 h-3 mr-1" />
              Dashboard
            </Button>
            {isExpanded && (
              <Button size="sm" variant="outline" className="text-xs">
                <Settings className="w-3 h-3" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
