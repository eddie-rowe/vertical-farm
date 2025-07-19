import React from "react";
import { cn } from "@/lib/utils";
import { MetricCard, MetricCardProps } from "./MetricCard";

/**
 * Metric data interface for grid display
 */
export interface MetricData {
  /** Unique identifier for the metric */
  id: string;
  /** Icon component to display */
  icon: React.ComponentType<{ className?: string }>;
  /** Label text for the metric */
  label: string;
  /** Value to display (can be string or number) */
  value: string | number;
  /** Optional CSS state class */
  stateClass?: string;
  /** Optional custom icon color class */
  iconColor?: string;
  /** Optional value formatter function */
  valueFormatter?: (value: string | number) => string;
}

/**
 * Props for the MetricsGrid component
 */
export interface MetricsGridProps {
  /** Array of metric data to display */
  metrics: MetricData[];
  /** Number of columns in the grid */
  columns?: 2 | 3 | 4;
  /** Additional CSS classes for the grid container */
  className?: string;
  /** Whether to apply responsive breakpoints */
  responsive?: boolean;
}

/**
 * Flexible grid component for displaying metric cards
 *
 * This component provides consistent grid layouts for metrics
 * with responsive behavior and customizable column counts.
 */
export const MetricsGrid: React.FC<MetricsGridProps> = ({
  metrics,
  columns = 3,
  className,
  responsive = true,
}) => {
  // Generate grid column classes based on column count and responsiveness
  const getGridClasses = () => {
    const baseClasses = "grid gap-6";

    if (!responsive) {
      return cn(baseClasses, {
        "grid-cols-2": columns === 2,
        "grid-cols-3": columns === 3,
        "grid-cols-4": columns === 4,
      });
    }

    // Responsive grid classes
    switch (columns) {
      case 2:
        return cn(baseClasses, "grid-cols-1 md:grid-cols-2");
      case 3:
        return cn(baseClasses, "grid-cols-1 md:grid-cols-3");
      case 4:
        return cn(baseClasses, "grid-cols-1 md:grid-cols-2 lg:grid-cols-4");
      default:
        return cn(baseClasses, "grid-cols-1 md:grid-cols-3");
    }
  };

  return (
    <div className={cn(getGridClasses(), className)}>
      {metrics.map((metric) => (
        <MetricCard
          key={metric.id}
          icon={metric.icon}
          label={metric.label}
          value={metric.value}
          stateClass={metric.stateClass}
          iconColor={metric.iconColor}
          valueFormatter={metric.valueFormatter}
        />
      ))}
    </div>
  );
};

/**
 * Utility function to create metric data objects
 */
export const createMetric = (
  id: string,
  icon: React.ComponentType<{ className?: string }>,
  label: string,
  value: string | number,
  options?: Partial<
    Pick<MetricData, "stateClass" | "iconColor" | "valueFormatter">
  >,
): MetricData => ({
  id,
  icon,
  label,
  value,
  ...options,
});

/**
 * Common metric formatters
 */
export const MetricFormatters = {
  currency: (value: string | number) =>
    typeof value === "number" ? `$${value.toLocaleString()}` : value,

  percentage: (value: string | number) =>
    typeof value === "number" ? `${value}%` : value,

  count: (value: string | number) =>
    typeof value === "number" ? value.toLocaleString() : value,

  status: (value: string | number) => String(value).toUpperCase(),
} as const;
