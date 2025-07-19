"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const sensorPanelVariants = cva(
  "sensor-panel", // Uses our new @utility sensor-panel
  {
    variants: {
      status: {
        online: "state-active",
        offline: "state-offline",
        maintenance: "state-maintenance",
        warning: "ring-2 ring-yellow-500 bg-yellow-50 dark:bg-yellow-900/20",
      },
      size: {
        sm: "min-w-[100px] p-2",
        default: "", // Uses CSS custom property --spacing-sensor
        lg: "min-w-[160px] p-4",
      },
    },
    defaultVariants: {
      status: "online",
      size: "default",
    },
  },
);

export interface SensorPanelProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof sensorPanelVariants> {
  sensorType?: string;
  value?: string | number;
  unit?: string;
  lastUpdated?: string;
  icon?: React.ReactNode;
  trend?: "up" | "down" | "stable";
}

const SensorPanel = React.forwardRef<HTMLDivElement, SensorPanelProps>(
  (
    {
      className,
      status,
      size,
      sensorType,
      value,
      unit,
      lastUpdated,
      icon,
      trend,
      children,
      ...props
    },
    ref,
  ) => {
    const getTrendIcon = () => {
      switch (trend) {
        case "up":
          return <span className="text-green-500">↗</span>;
        case "down":
          return <span className="text-red-500">↘</span>;
        case "stable":
          return <span className="text-gray-500">→</span>;
        default:
          return null;
      }
    };

    return (
      <div
        className={cn(sensorPanelVariants({ status, size, className }))}
        ref={ref}
        {...props}
      >
        {/* Sensor icon and type */}
        <div className="flex items-center gap-2">
          {icon && (
            <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center text-muted-foreground">
              {icon}
            </div>
          )}
          {sensorType && (
            <span className="text-control-label text-xs uppercase tracking-wide">
              {sensorType}
            </span>
          )}
        </div>

        {/* Sensor value */}
        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-sensor-value">{value ?? "—"}</span>
          {unit && <span className="text-plant-label text-xs">{unit}</span>}
          {trend && getTrendIcon()}
        </div>

        {/* Last updated */}
        {lastUpdated && (
          <div className="text-plant-label text-xs mt-1 opacity-75">
            {lastUpdated}
          </div>
        )}

        {/* Custom content */}
        {children}
      </div>
    );
  },
);
SensorPanel.displayName = "SensorPanel";

export { SensorPanel, sensorPanelVariants };
