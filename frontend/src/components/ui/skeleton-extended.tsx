import React from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

// =============================================================================
// Card Skeletons
// =============================================================================

interface SkeletonCardProps {
  showImage?: boolean;
  showHeader?: boolean;
  lines?: number;
  className?: string;
}

export function SkeletonCard({ 
  showImage = false, 
  showHeader = true, 
  lines = 3, 
  className 
}: SkeletonCardProps) {
  return (
    <div className={cn('rounded-lg border bg-card p-4 space-y-3', className)}>
      {/* Card Header */}
      {showHeader && (
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-8 w-16" />
        </div>
      )}
      
      {/* Card Image */}
      {showImage && <Skeleton className="h-32 w-full rounded" />}
      
      {/* Card Content */}
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton 
            key={i} 
            className={cn(
              'h-3',
              i === lines - 1 ? 'w-2/3' : 'w-full'
            )}
          />
        ))}
      </div>
    </div>
  );
}

interface SkeletonMetricCardProps {
  showTrend?: boolean;
  showIcon?: boolean;
  className?: string;
}

export function SkeletonMetricCard({ 
  showTrend = true, 
  showIcon = true, 
  className 
}: SkeletonMetricCardProps) {
  return (
    <div className={cn('rounded-lg border bg-card p-4', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {showIcon && <Skeleton className="w-10 h-10 rounded-lg" />}
          <div className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-12" />
              {showTrend && (
                <>
                  <Skeleton className="h-3 w-6" />
                  <Skeleton className="w-3 h-3 rounded-full" />
                </>
              )}
            </div>
            <Skeleton className="h-2 w-24" />
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Table Skeletons
// =============================================================================

interface SkeletonTableProps {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
  className?: string;
}

export function SkeletonTable({ 
  rows = 5, 
  columns = 4, 
  showHeader = true, 
  className 
}: SkeletonTableProps) {
  return (
    <div className={cn('space-y-4', className)} role="status" aria-label="Loading table data">
      {/* Table Header */}
      {showHeader && (
        <div 
          className="grid gap-4 pb-2 border-b" 
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-20" />
          ))}
        </div>
      )}
      
      {/* Table Rows */}
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div 
            key={rowIndex} 
            className="grid gap-4 py-2" 
            style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
          >
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton 
                key={colIndex} 
                className={cn(
                  'h-4',
                  colIndex === 0 ? 'w-3/4' : 'w-full'
                )}
              />
            ))}
          </div>
        ))}
      </div>

      <span className="sr-only">Loading table data...</span>
    </div>
  );
}

// =============================================================================
// List Skeletons
// =============================================================================

interface SkeletonListProps {
  items?: number;
  showAvatar?: boolean;
  showActions?: boolean;
  showMeta?: boolean;
  className?: string;
}

export function SkeletonList({ 
  items = 5, 
  showAvatar = true, 
  showActions = false,
  showMeta = true,
  className 
}: SkeletonListProps) {
  return (
    <div className={cn('space-y-4', className)} role="status" aria-label="Loading list data">
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="flex items-center space-x-4 p-2 rounded-lg">
          {showAvatar && <Skeleton className="h-12 w-12 rounded-full" />}
          
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-full" />
            {showMeta && <Skeleton className="h-3 w-2/3" />}
          </div>
          
          {showActions && (
            <div className="flex gap-2">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-8" />
            </div>
          )}
        </div>
      ))}
      
      <span className="sr-only">Loading list data...</span>
    </div>
  );
}

// =============================================================================
// Form Skeletons
// =============================================================================

interface SkeletonFormProps {
  fields?: number;
  showTitle?: boolean;
  showActions?: boolean;
  className?: string;
}

export function SkeletonForm({ 
  fields = 4, 
  showTitle = true, 
  showActions = true, 
  className 
}: SkeletonFormProps) {
  return (
    <div className={cn('space-y-6', className)} role="status" aria-label="Loading form">
      {/* Form Title */}
      {showTitle && (
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      )}
      
      {/* Form Fields */}
      <div className="space-y-4">
        {Array.from({ length: fields }).map((_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
      
      {/* Form Actions */}
      {showActions && (
        <div className="flex gap-3 pt-4">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-20" />
        </div>
      )}
      
      <span className="sr-only">Loading form...</span>
    </div>
  );
}

// =============================================================================
// Chart/Graph Skeletons
// =============================================================================

interface SkeletonChartProps {
  height?: string;
  showLegend?: boolean;
  showTitle?: boolean;
  className?: string;
}

export function SkeletonChart({ 
  height = 'h-64', 
  showLegend = true, 
  showTitle = true, 
  className 
}: SkeletonChartProps) {
  return (
    <div className={cn('space-y-4', className)} role="status" aria-label="Loading chart">
      {/* Chart Title */}
      {showTitle && (
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
      )}
      
      {/* Chart Area */}
      <Skeleton className={cn('w-full rounded', height)} />
      
      {/* Chart Legend */}
      {showLegend && (
        <div className="flex gap-4 justify-center">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="w-3 h-3 rounded-full" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
      )}
      
      <span className="sr-only">Loading chart...</span>
    </div>
  );
}

// =============================================================================
// Dashboard Skeletons
// =============================================================================

interface SkeletonDashboardProps {
  showHeader?: boolean;
  metricCards?: number;
  showSidebar?: boolean;
  className?: string;
}

export function SkeletonDashboard({ 
  showHeader = true, 
  metricCards = 4, 
  showSidebar = false,
  className 
}: SkeletonDashboardProps) {
  return (
    <div className={cn('space-y-6', className)} role="status" aria-label="Loading dashboard">
      {/* Dashboard Header */}
      {showHeader && (
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
      )}

      {/* Metric Cards */}
      <div className={cn(
        'grid gap-4',
        metricCards <= 2 ? 'grid-cols-1 md:grid-cols-2' :
        metricCards === 3 ? 'grid-cols-1 md:grid-cols-3' :
        'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
      )}>
        {Array.from({ length: metricCards }).map((_, i) => (
          <SkeletonMetricCard key={i} />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className={cn(
        'grid gap-6',
        showSidebar ? 'lg:grid-cols-3' : 'lg:grid-cols-2'
      )}>
        {/* Main Chart */}
        <div className={showSidebar ? 'lg:col-span-2' : ''}>
          <div className="rounded-lg border bg-card p-6">
            <SkeletonChart />
          </div>
        </div>

        {/* Sidebar/Secondary Content */}
        <div className="space-y-6">
          <div className="rounded-lg border bg-card p-6">
            <SkeletonList items={4} showAvatar={false} />
          </div>
          
          {!showSidebar && (
            <div className="rounded-lg border bg-card p-6">
              <SkeletonChart height="h-48" showLegend={false} />
            </div>
          )}
        </div>
      </div>

      <span className="sr-only">Loading dashboard content...</span>
    </div>
  );
}

// =============================================================================
// Page-Specific Skeletons
// =============================================================================

export function SkeletonDevicePage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Device Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} showImage />
        ))}
      </div>
    </div>
  );
}

export function SkeletonIntegrationsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80" />
      </div>

      {/* Integration Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-lg border bg-card p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="w-12 h-12 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
} 