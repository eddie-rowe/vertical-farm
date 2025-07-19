import React from "react";
import { Progress } from "@/components/ui/progress";
import { ProgressIndicatorProps } from "../types";

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  current,
  target,
  label,
  unit = "",
  inverse = false,
}) => {
  const percentage = Math.min((current / target) * 100, 100);
  const isOnTarget = inverse ? current <= target : current >= target;
  const variance = ((current - target) / target) * 100;

  const getProgressColor = () => {
    if (isOnTarget) return "bg-green-500";
    if (Math.abs(variance) <= 10) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getVarianceColor = () => {
    if (isOnTarget) return "text-green-600 dark:text-green-400";
    if (Math.abs(variance) <= 10) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </span>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {current}
            {unit} / {target}
            {unit}
          </span>
          <span className={`text-xs font-medium ${getVarianceColor()}`}>
            {variance > 0 ? "+" : ""}
            {variance.toFixed(1)}%
          </span>
        </div>
      </div>

      <div className="relative">
        <Progress value={percentage} className="h-2" />
        <div
          className={`absolute inset-0 rounded-full ${getProgressColor()}`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>
          Current: {current}
          {unit}
        </span>
        <span>
          Target: {target}
          {unit}
        </span>
      </div>
    </div>
  );
};
