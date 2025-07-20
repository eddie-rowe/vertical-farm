"use client";

import React from "react";

import { cn } from "@/lib/utils";
import { Row, Rack, Shelf } from "@/types/farm";

import { useAreaConfiguration } from "../providers/FarmAreaProvider";

interface LayoutLayerProps {
  rows: Row[];
  children: (row: Row, index: number) => React.ReactNode;
  className?: string;
}

export function LayoutLayer({ rows, children, className }: LayoutLayerProps) {
  const configuration = useAreaConfiguration();
  const { layout } = configuration;

  // Generate responsive grid classes based on configuration
  const getGridClasses = () => {
    const { responsive } = layout;
    const baseClasses = "grid gap-6";

    if (!responsive.adaptiveLayout) {
      return `${baseClasses} grid-cols-1`;
    }

    return cn(
      baseClasses,
      `grid-cols-${responsive.gridCols.sm}`,
      `md:grid-cols-${responsive.gridCols.md}`,
      `lg:grid-cols-${responsive.gridCols.lg}`,
      `xl:grid-cols-${responsive.gridCols.xl}`,
      `2xl:grid-cols-${responsive.gridCols["2xl"]}`,
    );
  };

  // Generate spacing classes based on configuration
  const getSpacingClasses = () => {
    return cn(layout.spacing.containerPadding, "space-y-8");
  };

  if (!layout.enableRackGrid) {
    // Simple list layout for minimal configurations
    return (
      <div className={cn(getSpacingClasses(), className)}>
        {rows.map((row, index) => (
          <div key={row.id} className="w-full">
            {children(row, index)}
          </div>
        ))}
      </div>
    );
  }

  // Full grid layout for advanced configurations
  return (
    <div className={cn(getSpacingClasses(), className)}>
      {rows.map((row, index) => (
        <div key={row.id} className="mb-8">
          {/* Row Header */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {row.name}
            </h3>
            {(row as any).description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {(row as any).description}
              </p>
            )}
          </div>

          {/* Rack Grid */}
          <div className={getGridClasses()}>{children(row, index)}</div>
        </div>
      ))}
    </div>
  );
}

// ===== Rack Layout Component =====

interface RackLayoutProps {
  row: Row;
  children: (rack: any, rackIndex: number) => React.ReactNode;
}

export function RackLayout({ row, children }: RackLayoutProps) {
  const configuration = useAreaConfiguration();
  const { layout } = configuration;

  if (!row.racks || row.racks.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
        <p className="text-gray-500 dark:text-gray-400">No racks configured</p>
      </div>
    );
  }

  return (
    <>
      {row.racks.map((rack, rackIndex) => (
        <div key={rack.id} className="relative">
          {children(rack, rackIndex)}
        </div>
      ))}
    </>
  );
}

// ===== Shelf Layout Component =====

interface ShelfLayoutProps {
  rack: Rack;
  children: (shelf: Shelf, shelfIndex: number) => React.ReactNode;
  orientation?: "vertical" | "horizontal";
}

export function ShelfLayout({
  rack,
  children,
  orientation = "vertical",
}: ShelfLayoutProps) {
  const configuration = useAreaConfiguration();
  const { layout } = configuration;

  if (!rack.shelves || rack.shelves.length === 0) {
    return (
      <div className="flex items-center justify-center h-20 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400">No shelves</p>
      </div>
    );
  }

  const containerClasses =
    orientation === "vertical"
      ? "flex flex-col space-y-2"
      : "flex flex-row space-x-2";

  return (
    <div className={containerClasses}>
      {rack.shelves.map((shelf, shelfIndex) => (
        <div key={shelf.id} className="relative">
          {children(shelf, shelfIndex)}
        </div>
      ))}
    </div>
  );
}

// ===== Responsive Utilities =====

export function useResponsiveBreakpoint() {
  const configuration = useAreaConfiguration();
  const { layout } = configuration;

  return {
    showDetails: layout.responsive.showDetailsBreakpoint,
    isAdaptive: layout.responsive.adaptiveLayout,
    gridCols: layout.responsive.gridCols,
  };
}

export function useLayoutConfig() {
  const configuration = useAreaConfiguration();
  return configuration.layout;
}

// ===== Layout Utilities =====

export const LayoutUtils = {
  // Generate dynamic grid classes based on item count
  getOptimalGridCols: (itemCount: number, maxCols: number = 4) => {
    if (itemCount <= 1) return 1;
    if (itemCount <= 2) return 2;
    if (itemCount <= 3) return 3;
    return Math.min(itemCount, maxCols);
  },

  // Calculate optimal aspect ratio for items
  getAspectRatioClass: (ratio: string) => {
    const ratioMap: Record<string, string> = {
      "1:1": "aspect-square",
      "4:3": "aspect-[4/3]",
      "3:2": "aspect-[3/2]",
      "16:9": "aspect-video",
      "2:1": "aspect-[2/1]",
    };
    return ratioMap[ratio] || "aspect-square";
  },

  // Generate responsive padding classes
  getResponsivePadding: (size: "sm" | "md" | "lg") => {
    const paddingMap = {
      sm: "p-2 md:p-3",
      md: "p-3 md:p-4 lg:p-6",
      lg: "p-4 md:p-6 lg:p-8",
    };
    return paddingMap[size];
  },
};
