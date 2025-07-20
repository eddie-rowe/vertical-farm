"use client";

import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const plantCardVariants = cva(
  "plant-card", // Uses our new @utility plant-card
  {
    variants: {
      status: {
        healthy: "state-active",
        growing: "state-growing",
        maintenance: "state-maintenance",
        issue: "state-offline",
      },
      size: {
        sm: "p-3",
        default: "", // Uses CSS custom property --spacing-plant
        lg: "p-6",
      },
    },
    defaultVariants: {
      status: "healthy",
      size: "default",
    },
  },
);

export interface PlantCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof plantCardVariants> {
  plantName?: string;
  variety?: string;
  plantedDate?: string;
  stage?: string;
  health?: number;
  icon?: React.ReactNode;
}

const PlantCard = React.forwardRef<HTMLDivElement, PlantCardProps>(
  (
    {
      className,
      status,
      size,
      plantName,
      variety,
      plantedDate,
      stage,
      health,
      icon,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <div
        className={cn(plantCardVariants({ status, size, className }))}
        ref={ref}
        {...props}
      >
        {/* Header with icon and name */}
        <div className="flex items-center gap-2 mb-2">
          {icon && (
            <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
              {icon}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-farm-title truncate">{plantName}</h3>
            {variety && <p className="text-plant-label truncate">{variety}</p>}
          </div>
        </div>

        {/* Plant details */}
        <div className="space-y-1">
          {stage && (
            <div className="flex justify-between items-center">
              <span className="text-control-label">Stage:</span>
              <span className="text-sensor-value text-sm">{stage}</span>
            </div>
          )}

          {plantedDate && (
            <div className="flex justify-between items-center">
              <span className="text-control-label">Planted:</span>
              <span className="text-plant-label">{plantedDate}</span>
            </div>
          )}

          {health !== undefined && (
            <div className="flex justify-between items-center">
              <span className="text-control-label">Health:</span>
              <span
                className={cn(
                  "text-sensor-value text-sm",
                  health >= 80
                    ? "text-green-600 dark:text-green-400"
                    : health >= 60
                      ? "text-yellow-600 dark:text-yellow-400"
                      : "text-red-600 dark:text-red-400",
                )}
              >
                {health}%
              </span>
            </div>
          )}
        </div>

        {/* Custom content */}
        {children && (
          <div className="mt-3 pt-3 border-t border-border">{children}</div>
        )}
      </div>
    );
  },
);
PlantCard.displayName = "PlantCard";

export { PlantCard, plantCardVariants };
