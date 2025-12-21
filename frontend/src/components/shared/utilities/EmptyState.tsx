import { LucideIcon } from "lucide-react";
import React from "react";

import { Button } from "@/components/ui/button";

export interface EmptyStateProps {
  /** Lucide icon component to display */
  icon: LucideIcon;
  /** Main heading text */
  title: string;
  /** Descriptive text explaining the empty state */
  description: string;
  /** Optional call-to-action button label */
  actionLabel?: string;
  /** Optional callback when action button is clicked */
  onAction?: () => void;
  /** Optional secondary action label */
  secondaryActionLabel?: string;
  /** Optional secondary action callback */
  onSecondaryAction?: () => void;
  /** Optional custom className for container */
  className?: string;
  /** Optional icon background color class (default: bg-green-100) */
  iconBgColor?: string;
  /** Optional icon color class (default: text-green-600) */
  iconColor?: string;
}

/**
 * EmptyState - A reusable component for displaying empty state messages
 * 
 * Used when there's no data to display, guiding users on what to do next.
 * 
 * @example
 * ```tsx
 * <EmptyState
 *   icon={Warehouse}
 *   title="No farms yet"
 *   description="Get started by creating your first farm."
 *   actionLabel="Create Your First Farm"
 *   onAction={() => setShowCreateDialog(true)}
 * />
 * ```
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className = "",
  iconBgColor = "bg-gradient-to-br from-green-400 to-green-600",
  iconColor = "text-white",
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}
    >
      <div className="max-w-md mx-auto">
        {/* Icon */}
        <div
          className={`p-4 rounded-full ${iconBgColor} w-16 h-16 mx-auto mb-6 flex items-center justify-center`}
        >
          <Icon className={`h-8 w-8 ${iconColor}`} />
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          {title}
        </h3>

        {/* Description */}
        <p className="text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
          {description}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          {actionLabel && onAction && (
            <Button onClick={onAction} variant="default">
              {actionLabel}
            </Button>
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <Button onClick={onSecondaryAction} variant="outline">
              {secondaryActionLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default EmptyState;
