import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Loading screen with semantic HTML and ARIA labels */}
      <div 
        className="flex items-center justify-center min-h-screen"
        role="status"
        aria-label="Loading application content"
      >
        <div className="text-center space-y-4">
          <div className="animate-spin h-12 w-12 mx-auto">
            <Loader2 className="h-12 w-12 text-primary" aria-hidden="true" />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">
              Loading Vertical Farm
            </h2>
            <p className="text-sm text-muted-foreground">
              Preparing your dashboard...
            </p>
          </div>
          <div className="w-64 mx-auto">
            <div className="h-1 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary animate-pulse rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Screen reader only text */}
      <span className="sr-only">
        Loading vertical farm management system. Please wait while we prepare your dashboard.
      </span>
    </div>
  );
}

// Skeleton loader for dashboard layout
export function DashboardSkeleton() {
  return (
    <div className="p-6 space-y-6" role="status" aria-label="Loading dashboard">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-10 w-24" />
      </div>

      {/* Stats cards skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-4 rounded" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main content skeleton */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>

      <span className="sr-only">Loading dashboard content...</span>
    </div>
  );
}

// Table skeleton loader
export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-4" role="status" aria-label="Loading table data">
      {/* Table header */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-20" />
        ))}
      </div>
      
      {/* Table rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-4 w-full" />
          ))}
        </div>
      ))}

      <span className="sr-only">Loading table data...</span>
    </div>
  );
}

// Form skeleton loader
export function FormSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading form">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      
      <div className="flex gap-4 pt-4">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>

      <span className="sr-only">Loading form...</span>
    </div>
  );
} 