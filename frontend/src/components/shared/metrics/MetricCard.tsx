import React from "react";

import { cn } from "@/lib/utils";

/**
 * Props for the MetricCard component
 */
export interface MetricCardProps {
  /** Icon component to display */
  icon: React.ComponentType<{ className?: string }>;
  /** Label text for the metric */
  label: string;
  /** Value to display (can be string or number) */
  value: string | number;
  /** Optional CSS state class (e.g., 'state-active', 'state-growing') */
  stateClass?: string;
  /** Optional custom icon color class */
  iconColor?: string;
  /** Optional value formatter function */
  valueFormatter?: (value: string | number) => string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Standardized metric card component
 *
 * This component provides a consistent design for displaying metrics
 * across all pages, following the established farm theme patterns.
 */
export const MetricCard: React.FC<MetricCardProps> = ({
  icon: IconComponent,
  label,
  value,
  stateClass = "state-active",
  iconColor = "text-control-label gradient-icon",
  valueFormatter,
  className,
}) => {
  const formattedValue = valueFormatter ? valueFormatter(value) : value;

  return (
    <div
      className={cn(
        "bg-farm-white overflow-hidden card-shadow rounded-lg",
        stateClass,
        className,
      )}
    >
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <IconComponent className={cn("h-6 w-6", iconColor)} />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-control-label truncate">
                {label}
              </dt>
              <dd className="text-lg font-medium text-farm-title">
                {formattedValue}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Predefined metric card variants for common use cases
 */
export const MetricCardVariants = {
  revenue: {
    iconColor: "text-sensor-value gradient-icon",
    stateClass: "state-growing",
    valueFormatter: (value: string | number) =>
      typeof value === "number" ? `$${value.toLocaleString()}` : value,
  },
  count: {
    iconColor: "text-control-label gradient-icon",
    stateClass: "state-active",
  },
  active: {
    iconColor: "text-sensor-value gradient-icon",
    stateClass: "state-growing",
  },
  warning: {
    iconColor: "text-sensor-warning gradient-icon",
    stateClass: "state-maintenance",
  },
} as const;
