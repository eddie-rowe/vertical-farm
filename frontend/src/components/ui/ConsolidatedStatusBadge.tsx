import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import React from "react";

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface ConsolidatedStatusBadgeProps {
  overallHealth: number; // 0-10 scale
  criticalAlerts: number;
  warningCount: number;
  placement:
    | "top-left"
    | "top-right"
    | "top-center"
    | "bottom-left"
    | "bottom-right"
    | "bottom-center";
  size?: "sm" | "md" | "lg";
  showTrend?: boolean;
  trend?: "up" | "down" | "stable";
  className?: string;
}

export const ConsolidatedStatusBadge: React.FC<
  ConsolidatedStatusBadgeProps
> = ({
  overallHealth,
  criticalAlerts,
  warningCount,
  placement,
  size = "md",
  showTrend = false,
  trend = "stable",
  className,
}) => {
  // Consistent color system
  const getHealthColor = (health: number) => {
    if (health >= 8)
      return "text-green-600 border-green-400 bg-green-50/90 dark:bg-green-900/20 dark:text-green-400 dark:border-green-600";
    if (health >= 6)
      return "text-amber-600 border-amber-400 bg-amber-50/90 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-600";
    return "text-red-600 border-red-400 bg-red-50/90 dark:bg-red-900/20 dark:text-red-400 dark:border-red-600";
  };

  const getAlertColor = () => {
    if (criticalAlerts > 0)
      return "text-red-600 border-red-400 bg-red-50/90 dark:bg-red-900/20 dark:text-red-400 dark:border-red-600 animate-pulse";
    if (warningCount > 0)
      return "text-amber-600 border-amber-400 bg-amber-50/90 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-600";
    return "text-green-600 border-green-400 bg-green-50/90 dark:bg-green-900/20 dark:text-green-400 dark:border-green-600";
  };

  const getHealthIcon = (health: number) => {
    if (health >= 8) return <CheckCircle className="w-3 h-3" />;
    if (health >= 6) return <AlertTriangle className="w-3 h-3" />;
    return <XCircle className="w-3 h-3" />;
  };

  const getTrendIcon = () => {
    if (!showTrend) return null;
    switch (trend) {
      case "up":
        return <TrendingUp className="w-2 h-2 text-green-500" />;
      case "down":
        return <TrendingDown className="w-2 h-2 text-red-500" />;
      default:
        return <Minus className="w-2 h-2 text-gray-400" />;
    }
  };

  const positionClasses = {
    "top-left": "top-2 left-2",
    "top-right": "top-2 right-2",
    "top-center": "top-2 left-1/2 transform -translate-x-1/2",
    "bottom-left": "bottom-2 left-2",
    "bottom-right": "bottom-2 right-2",
    "bottom-center": "bottom-2 left-1/2 transform -translate-x-1/2",
  };

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5 h-5",
    md: "text-xs px-2 py-1 h-6",
    lg: "text-sm px-3 py-1.5 h-8",
  };

  const totalAlerts = criticalAlerts + warningCount;
  const showAlerts = totalAlerts > 0;

  return (
    <div
      className={cn(
        "absolute z-10 pointer-events-auto",
        positionClasses[placement],
        className,
      )}
    >
      <div className="flex items-center gap-1">
        {/* Health Score Badge */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="outline"
                className={cn(
                  "backdrop-blur-sm transition-all duration-200 hover:scale-105 cursor-pointer",
                  getHealthColor(overallHealth),
                  sizeClasses[size],
                )}
              >
                <div className="flex items-center gap-1">
                  {getHealthIcon(overallHealth)}
                  <span className="font-medium">
                    {overallHealth.toFixed(1)}
                  </span>
                  {getTrendIcon()}
                </div>
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-sm">
                <div className="font-medium">
                  Health Score: {overallHealth.toFixed(1)}/10
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Status:{" "}
                  {overallHealth >= 8
                    ? "Optimal"
                    : overallHealth >= 6
                      ? "Warning"
                      : "Critical"}
                  {showTrend && trend !== "stable" && (
                    <span className="ml-1">• Trend: {trend}</span>
                  )}
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Alert Badge */}
        {showAlerts && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge
                  variant="outline"
                  className={cn(
                    "backdrop-blur-sm transition-all duration-200 hover:scale-105 cursor-pointer",
                    getAlertColor(),
                    sizeClasses[size],
                  )}
                >
                  <div className="flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    <span className="font-medium">{totalAlerts}</span>
                  </div>
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-sm">
                  <div className="font-medium">
                    {totalAlerts} Active Alert{totalAlerts !== 1 ? "s" : ""}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {criticalAlerts > 0 && (
                      <div className="text-red-500">
                        • {criticalAlerts} Critical
                      </div>
                    )}
                    {warningCount > 0 && (
                      <div className="text-amber-500">
                        • {warningCount} Warning{warningCount !== 1 ? "s" : ""}
                      </div>
                    )}
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  );
};
