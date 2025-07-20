"use client";

import { Grid3X3, Layers, Sprout, Leaf } from "lucide-react";
import React from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Row, Rack, Shelf, AreaType } from "@/types/farm";

import DeviceRenderer from "../../farm-core/UnifiedFarmView/components/DeviceRenderer";
import { useAreaConfiguration } from "../providers/FarmAreaProvider";

interface ContentLayerProps {
  children: React.ReactNode;
}

export function ContentLayer({ children }: ContentLayerProps) {
  return <>{children}</>;
}

// ===== Row Content Renderer =====

interface RowContentProps {
  row: Row;
  areaType: AreaType;
  className?: string;
}

export function RowContent({ row, areaType, className }: RowContentProps) {
  const configuration = useAreaConfiguration();
  const { content } = configuration;

  const getAreaIcon = () => {
    switch (areaType) {
      case "grow_area":
        return <Leaf className="w-5 h-5 text-green-600" />;
      case "germination_tent":
        return <Sprout className="w-5 h-5 text-emerald-600" />;
      default:
        return <Grid3X3 className="w-5 h-5 text-gray-600" />;
    }
  };

  const getAreaTypeLabel = () => {
    switch (areaType) {
      case "grow_area":
        return "Growing Area";
      case "germination_tent":
        return "Germination";
      default:
        return "Farm Area";
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Row Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {getAreaIcon()}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {row.name}
            </h3>
            <Badge variant="secondary" className="text-xs">
              {getAreaTypeLabel()}
            </Badge>
          </div>
        </div>

        {content.showMetrics && (
          <div className="flex space-x-4 text-sm text-gray-600 dark:text-gray-400">
            <span>Racks: {row.racks?.length || 0}</span>
            <span>
              Total Shelves:{" "}
              {row.racks?.reduce(
                (acc, rack) => acc + (rack.shelves?.length || 0),
                0,
              ) || 0}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ===== Rack Content Renderer =====

interface RackContentProps {
  rack: Rack;
  areaType: AreaType;
  className?: string;
}

export function RackContent({ rack, areaType, className }: RackContentProps) {
  const configuration = useAreaConfiguration();
  const { content } = configuration;

  const getRackStatusColor = () => {
    // This would come from rack status in real implementation
    return "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800";
  };

  const getShelfCount = () => rack.shelves?.length || 0;
  const getOccupiedShelves = () => {
    // This would be calculated from actual device/plant data
    return Math.floor(getShelfCount() * 0.7); // Mock 70% occupancy
  };

  return (
    <div
      className={cn(
        "bg-white dark:bg-gray-900 rounded-lg border shadow-sm",
        getRackStatusColor(),
        className,
      )}
    >
      {/* Rack Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {rack.name}
            </span>
          </div>

          {content.showStatus && (
            <Badge variant="outline" className="text-xs">
              Active
            </Badge>
          )}
        </div>

        {content.showMetrics && (
          <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
            <span>
              {getOccupiedShelves()}/{getShelfCount()} shelves occupied
            </span>
          </div>
        )}
      </div>

      {/* Shelf Content */}
      <div className="p-2">
        {rack.shelves && rack.shelves.length > 0 ? (
          <div className="space-y-2">
            {rack.shelves.map((shelf, index) => (
              <ShelfContent
                key={shelf.id}
                shelf={shelf}
                areaType={areaType}
                shelfIndex={index}
              />
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-20 text-xs text-gray-500 dark:text-gray-400">
            No shelves configured
          </div>
        )}
      </div>
    </div>
  );
}

// ===== Shelf Content Renderer =====

interface ShelfContentProps {
  shelf: Shelf;
  areaType: AreaType;
  shelfIndex: number;
  className?: string;
}

export function ShelfContent({
  shelf,
  areaType,
  shelfIndex,
  className,
}: ShelfContentProps) {
  const configuration = useAreaConfiguration();
  const { content } = configuration;

  const getShelfContent = () => {
    if (areaType === "germination_tent") {
      return <GerminationShelfContent shelf={shelf} />;
    } else {
      return <GrowingShelfContent shelf={shelf} />;
    }
  };

  const getShelfStatusColor = () => {
    // Mock status - in real implementation this would come from shelf data
    const statuses = [
      "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-700",
      "bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-700",
      "bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-700",
    ];
    return statuses[shelfIndex % statuses.length];
  };

  return (
    <div
      className={cn(
        "border rounded p-2 transition-all duration-200",
        getShelfStatusColor(),
        className,
      )}
    >
      {/* Shelf Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
          Shelf {shelfIndex + 1}
        </span>
        {content.showStatus && (
          <Badge variant="outline" className="text-xs py-0 px-1">
            Active
          </Badge>
        )}
      </div>

      {/* Shelf Content */}
      {getShelfContent()}
    </div>
  );
}

// ===== Germination-Specific Content =====

interface GerminationShelfContentProps {
  shelf: Shelf;
}

function GerminationShelfContent({ shelf }: GerminationShelfContentProps) {
  const configuration = useAreaConfiguration();
  const { content } = configuration;

  // Mock germination data - in real implementation this would come from shelf data
  const mockGerminationData = {
    seedType: "Lettuce",
    planted: "2024-01-15",
    expectedGermination: "2024-01-20",
    currentStage: "sprouting",
    readyForTransplant: Math.random() > 0.7,
  };

  return (
    <div className="space-y-2">
      {/* Seed Information */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center space-x-1">
          <Sprout className="w-3 h-3 text-green-600" />
          <span className="text-gray-700 dark:text-gray-300">
            {mockGerminationData.seedType}
          </span>
        </div>
        {mockGerminationData.readyForTransplant && (
          <Badge
            variant="outline"
            className="text-xs py-0 px-1 border-green-500 text-green-700 dark:text-green-400"
          >
            Ready
          </Badge>
        )}
      </div>

      {/* Growth Stage */}
      <div className="text-xs text-gray-600 dark:text-gray-400">
        Stage: {mockGerminationData.currentStage}
      </div>

      {/* Devices (if enabled) */}
      {content.showDevices && shelf.devices && shelf.devices.length > 0 && (
        <div className="flex space-x-1">
          {shelf.devices.map((device) => (
            <div key={device.id} className="scale-75">
              <DeviceRenderer device={device} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ===== Growing Area-Specific Content =====

interface GrowingShelfContentProps {
  shelf: Shelf;
}

function GrowingShelfContent({ shelf }: GrowingShelfContentProps) {
  const configuration = useAreaConfiguration();
  const { content } = configuration;

  // Mock growing data - in real implementation this would come from shelf data
  const mockPlantData = {
    plantType: "Basil",
    plantedDate: "2024-01-01",
    harvestDate: "2024-02-15",
    growthStage: "mature",
    health: "excellent",
  };

  return (
    <div className="space-y-2">
      {/* Plant Information */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center space-x-1">
          <Leaf className="w-3 h-3 text-green-600" />
          <span className="text-gray-700 dark:text-gray-300">
            {mockPlantData.plantType}
          </span>
        </div>
        <Badge
          variant="outline"
          className={cn(
            "text-xs py-0 px-1",
            mockPlantData.health === "excellent" &&
              "border-green-500 text-green-700 dark:text-green-400",
          )}
        >
          {mockPlantData.health}
        </Badge>
      </div>

      {/* Growth Information */}
      <div className="text-xs text-gray-600 dark:text-gray-400">
        Stage: {mockPlantData.growthStage}
      </div>

      {/* Devices (if enabled) */}
      {content.showDevices && shelf.devices && shelf.devices.length > 0 && (
        <div className="flex space-x-1">
          {shelf.devices.map((device) => (
            <div key={device.id} className="scale-75">
              <DeviceRenderer device={device} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ===== Content Configuration Utilities =====

export function useContentConfig() {
  const configuration = useAreaConfiguration();
  return configuration.content;
}

export function getContentStyleClasses(
  style: "minimal" | "standard" | "detailed",
) {
  switch (style) {
    case "minimal":
      return "text-xs space-y-1";
    case "standard":
      return "text-sm space-y-2";
    case "detailed":
      return "text-sm space-y-3";
    default:
      return "text-sm space-y-2";
  }
}
