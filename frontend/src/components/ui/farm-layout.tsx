"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const farmLayoutVariants = cva(
  "farm-grid", // Uses our new @utility farm-grid
  {
    variants: {
      layout: {
        grid: "", // Default farm-grid
        rack: "rack-layout", // Uses our @utility rack-layout
        row: "flex flex-col gap-4",
        compact: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3"
      },
      spacing: {
        tight: "[--spacing-row:1rem]",
        default: "", // Uses CSS custom property --spacing-row
        loose: "[--spacing-row:3rem]"
      }
    },
    defaultVariants: {
      layout: "grid",
      spacing: "default"
    },
  }
)

export interface FarmLayoutProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof farmLayoutVariants> {
  title?: string
  subtitle?: string
  headerActions?: React.ReactNode
}

const FarmLayout = React.forwardRef<HTMLDivElement, FarmLayoutProps>(
  ({ 
    className, 
    layout, 
    spacing, 
    title,
    subtitle,
    headerActions,
    children,
    ...props 
  }, ref) => {
    return (
      <div className="space-y-6" ref={ref} {...props}>
        {/* Header Section */}
        {(title || subtitle || headerActions) && (
          <div className="flex items-center justify-between">
            <div>
              {title && (
                <h2 className="text-farm-title">{title}</h2>
              )}
              {subtitle && (
                <p className="text-control-label mt-1">{subtitle}</p>
              )}
            </div>
            {headerActions && (
              <div className="flex items-center gap-2">
                {headerActions}
              </div>
            )}
          </div>
        )}

        {/* Content Layout */}
        <div className={cn(farmLayoutVariants({ layout, spacing, className }))}>
          {children}
        </div>
      </div>
    )
  }
)
FarmLayout.displayName = "FarmLayout"

// Specialized layout components for different farm sections
const RackSection = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { rackName?: string }
>(({ className, rackName, children, ...props }, ref) => {
  return (
    <div
      className={cn("gradient-rack rack-layout", className)}
      ref={ref}
      {...props}
    >
      {rackName && (
        <div className="text-farm-title text-center mb-4">
          {rackName}
        </div>
      )}
      {children}
    </div>
  )
})
RackSection.displayName = "RackSection"

const ShelfRow = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { shelfNumber?: number }
>(({ className, shelfNumber, children, ...props }, ref) => {
  return (
    <div
      className={cn(
        "gradient-shelf p-4 rounded-lg flex items-center gap-4 min-h-[80px]",
        className
      )}
      ref={ref}
      {...props}
    >
      {shelfNumber && (
        <div className="text-control-label font-semibold min-w-[60px]">
          Shelf {shelfNumber}
        </div>
      )}
      <div className="flex-1 flex items-center gap-3 flex-wrap">
        {children}
      </div>
    </div>
  )
})
ShelfRow.displayName = "ShelfRow"

export { 
  FarmLayout, 
  RackSection,
  ShelfRow,
  farmLayoutVariants 
} 