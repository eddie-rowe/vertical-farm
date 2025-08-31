import React from "react";

import { Loader2 } from "@/lib/icons";
import { cn } from "@/lib/utils";

// =============================================================================
// Loading Spinner Components
// =============================================================================

interface LoadingSpinnerProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  variant?: "default" | "primary" | "secondary" | "accent";
  className?: string;
}

export function LoadingSpinner({
  size = "md",
  variant = "default",
  className,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    xs: "w-3 h-3",
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
    xl: "w-12 h-12",
  };

  const variantClasses = {
    default: "text-muted-foreground",
    primary: "text-primary",
    secondary: "text-secondary",
    accent: "text-farm-accent",
  };

  return (
    <Loader2
      className={cn(
        "animate-spin",
        sizeClasses[size],
        variantClasses[variant],
        className,
      )}
      aria-hidden="true"
    />
  );
}

// =============================================================================
// Loading Container Components
// =============================================================================

interface LoadingCardProps {
  children?: React.ReactNode;
  message?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingCard({
  children,
  message,
  size = "md",
  className,
}: LoadingCardProps) {
  const sizeClasses = {
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  const spinnerSize = size === "sm" ? "sm" : size === "lg" ? "lg" : "md";

  return (
    <div
      className={cn(
        "flex items-center justify-center",
        sizeClasses[size],
        className,
      )}
      role="status"
      aria-label={message || "Loading content"}
    >
      <div className="flex flex-col items-center gap-3 text-center">
        <LoadingSpinner size={spinnerSize} variant="primary" />
        {(message || children) && (
          <div className="space-y-1">
            {message && (
              <p className="text-sm font-medium text-foreground">{message}</p>
            )}
            {children && (
              <div className="text-xs text-muted-foreground">{children}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface LoadingOverlayProps {
  message?: string;
  description?: string;
  backdrop?: boolean;
  className?: string;
}

export function LoadingOverlay({
  message = "Loading...",
  description,
  backdrop = true,
  className,
}: LoadingOverlayProps) {
  return (
    <div
      className={cn(
        "absolute inset-0 flex items-center justify-center z-50",
        backdrop && "bg-background/80 backdrop-blur-sm",
        className,
      )}
      role="status"
      aria-label={message}
    >
      <div className="bg-card border rounded-xl shadow-lg p-6 text-center space-y-3 max-w-md mx-4">
        <LoadingSpinner size="lg" variant="primary" />
        <div className="space-y-1">
          <h3 className="font-medium text-foreground">{message}</h3>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
}

interface LoadingPageProps {
  title?: string;
  description?: string;
  progress?: boolean;
  className?: string;
}

export function LoadingPage({
  title = "Loading Vertical Farm",
  description = "Preparing your dashboard...",
  progress = true,
  className,
}: LoadingPageProps) {
  return (
    <div
      className={cn(
        "min-h-screen bg-background flex items-center justify-center",
        className,
      )}
      role="status"
      aria-label={title}
    >
      <div className="text-center space-y-6 max-w-md mx-4">
        <LoadingSpinner size="xl" variant="primary" />

        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>

        {progress && (
          <div className="w-64 mx-auto">
            <div className="h-1 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary animate-pulse rounded-full"></div>
            </div>
          </div>
        )}
      </div>

      <span className="sr-only">
        {title}. {description}
      </span>
    </div>
  );
}

// =============================================================================
// Loading List/Table Components
// =============================================================================

interface LoadingListProps {
  count?: number;
  message?: string;
  className?: string;
}

export function LoadingList({
  message = "Loading data...",
  className,
}: LoadingListProps) {
  return (
    <div
      className={cn("space-y-3", className)}
      role="status"
      aria-label={message}
    >
      <div className="flex items-center justify-center py-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <LoadingSpinner size="sm" />
          <span className="text-sm">{message}</span>
        </div>
      </div>
      <span className="sr-only">{message}</span>
    </div>
  );
}

// =============================================================================
// Loading State Hook Integration
// =============================================================================

interface LoadingStateProps {
  isLoading: boolean;
  error?: string | null;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  children: React.ReactNode;
}

export function LoadingStateWrapper({
  isLoading,
  error,
  loadingComponent,
  errorComponent,
  children,
}: LoadingStateProps) {
  if (isLoading) {
    return loadingComponent || <LoadingCard message="Loading..." />;
  }

  if (error) {
    return (
      errorComponent || (
        <div className="flex items-center justify-center p-8">
          <div className="text-center space-y-2">
            <p className="text-sm font-medium text-destructive">Error</p>
            <p className="text-xs text-muted-foreground">{error}</p>
          </div>
        </div>
      )
    );
  }

  return <>{children}</>;
}

// =============================================================================
// Legacy Support (for gradual migration)
// =============================================================================

/**
 * @deprecated Use LoadingSpinner instead
 * Kept for backwards compatibility during migration
 */
export function LegacySpinner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-spin rounded-full h-6 w-6 border-b-2 border-farm-accent",
        className,
      )}
    />
  );
}
