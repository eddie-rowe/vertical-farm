"use client";

import { Plus, Leaf, Sprout, Grid3X3, Archive, Layers } from "lucide-react";
import React, { useState, useCallback } from "react";
import { toast } from "react-hot-toast";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Row, Rack, Shelf, AreaType } from "@/types/farm";

// Reusable components from UnifiedFarmView
import DeviceRenderer from "../farm-core/UnifiedFarmView/components/DeviceRenderer";

interface FarmAreaGridProps {
  rows: Row[];
  areaType: AreaType;
  selectedRow: Row | null;
  selectedRack: Rack | null;
  selectedShelf: Shelf | null;
  onRowSelect: (row: Row) => void;
  onRackSelect: (rack: Rack) => void;
  onShelfSelect: (shelf: Shelf) => void;
  onDataRefresh?: () => void;
  onAddRow?: () => void;
  onAddRack?: () => void;
  onAddShelf?: () => void;
}

const FarmAreaGrid: React.FC<FarmAreaGridProps> = ({
  rows,
  areaType,
  selectedRow,
  selectedRack,
  selectedShelf,
  onRowSelect,
  onRackSelect,
  onShelfSelect,
  onDataRefresh,
  onAddRow,
  onAddRack,
  onAddShelf,
}) => {
  const [hoveredElements, setHoveredElements] = useState<{
    row?: string;
    rack?: string;
    shelf?: string;
  }>({});

  // Filter rows by area type
  const filteredRows = rows.filter((row) => row.area_type === areaType);

  // Area type specific configurations
  const areaConfig = {
    grow_area: {
      title: "Growing Areas",
      icon: Sprout,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-900/20",
      borderColor: "border-green-200 dark:border-green-700",
      hoverBg: "hover:bg-green-100 dark:hover:bg-green-800/30",
      selectedBg: "bg-green-100 dark:bg-green-800/40",
    },
    germination_tent: {
      title: "Germination Tents",
      icon: Leaf,
      color: "text-yellow-600 dark:text-yellow-400",
      bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
      borderColor: "border-yellow-200 dark:border-yellow-700",
      hoverBg: "hover:bg-yellow-100 dark:hover:bg-yellow-800/30",
      selectedBg: "bg-yellow-100 dark:bg-yellow-800/40",
    },
  };

  const config = areaConfig[areaType];
  const IconComponent = config.icon;

  // Handle double-click events for editing
  const handleDoubleClick = useCallback(
    (element: Row | Rack | Shelf, elementType: "row" | "rack" | "shelf") => {
      // Mock detail modal functionality - in real implementation this would open a detail modal
      console.log(`Double-clicked ${elementType}:`, element);
      toast.success(
        `Opening ${elementType} details: ${element.name || element.id}`,
      );
    },
    [],
  );

  // Germination-specific shelf rendering
  const renderGerminationShelfContent = (shelf: Shelf) => {
    const germinationData = shelf.germination_data;

    if (!germinationData?.seed_type) {
      return (
        <div className="text-xs text-gray-400 dark:text-gray-500 text-center">
          <div>Empty</div>
          <Button size="sm" variant="outline" className="mt-1 h-6 text-xs">
            Plant Seeds
          </Button>
        </div>
      );
    }

    const daysSincePlanting = germinationData.planting_date
      ? Math.floor(
          (Date.now() - new Date(germinationData.planting_date).getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : 0;

    return (
      <div className="space-y-1">
        <div className="text-xs font-medium text-gray-800 dark:text-gray-200">
          {germinationData.seed_type}
        </div>
        {germinationData.variety && (
          <div className="text-xs text-gray-600 dark:text-gray-300">
            {germinationData.variety}
          </div>
        )}
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Day {daysSincePlanting}
        </div>
        {germinationData.is_transplant_ready && (
          <Badge
            variant="default"
            className="text-xs bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200"
          >
            Ready
          </Badge>
        )}
        {germinationData.germination_rate && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {germinationData.germination_rate}% germ.
          </div>
        )}
      </div>
    );
  };

  // Generic shelf rendering that adapts to area type
  const renderShelf = (shelf: Shelf) => {
    const isSelected = selectedShelf?.id === shelf.id;
    const isHovered = hoveredElements.shelf === shelf.id;

    return (
      <TooltipProvider key={shelf.id}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                "group relative p-3 rounded-lg border transition-all duration-200 cursor-pointer min-h-[80px]",
                "bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 border-slate-200 dark:border-slate-600",
                "hover:from-slate-100 hover:to-slate-150 dark:hover:from-slate-700 dark:hover:to-slate-600 hover:border-slate-300 dark:hover:border-slate-500 hover:shadow-md",
                isSelected &&
                  "ring-2 ring-blue-500 border-blue-300 dark:border-blue-600 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30",
                isHovered && "scale-[1.02]",
              )}
              onClick={(e) => {
                e.stopPropagation();
                onShelfSelect(shelf);
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                handleDoubleClick(shelf, "shelf");
              }}
              onMouseEnter={() =>
                setHoveredElements((prev) => ({ ...prev, shelf: shelf.id }))
              }
              onMouseLeave={() =>
                setHoveredElements((prev) => ({ ...prev, shelf: undefined }))
              }
            >
              {/* Shelf header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Grid3X3 className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                  <span className="font-medium text-slate-800 dark:text-slate-100">
                    {shelf.name || `Shelf ${shelf.id.slice(-4)}`}
                  </span>
                </div>
                <IconComponent className={cn("h-4 w-4", config.color)} />
              </div>

              {/* Area-specific content */}
              {areaType === "germination_tent" ? (
                renderGerminationShelfContent(shelf)
              ) : (
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {/* Grow area specific content */}
                  <div>Grow slot</div>
                </div>
              )}

              {/* Device indicators */}
              {shelf.devices && shelf.devices.length > 0 && (
                <div className="absolute top-2 right-2 flex gap-1">
                  {shelf.devices.slice(0, 2).map((device) => (
                    <DeviceRenderer key={device.id} device={device} />
                  ))}
                  {shelf.devices.length > 2 && (
                    <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 rounded px-1">
                      +{shelf.devices.length - 2}
                    </div>
                  )}
                </div>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <div className="font-medium">{shelf.name}</div>
              <div className="text-sm">
                Devices: {shelf.devices?.length || 0}
              </div>
              {areaType === "germination_tent" && shelf.germination_data && (
                <div className="text-sm border-t pt-1">
                  {shelf.germination_data.seed_type && (
                    <div>Seed: {shelf.germination_data.seed_type}</div>
                  )}
                  {shelf.germination_data.planting_date && (
                    <div>
                      Planted:{" "}
                      {new Date(
                        shelf.germination_data.planting_date,
                      ).toLocaleDateString()}
                    </div>
                  )}
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  // Rack rendering with proper dark mode and layout
  const renderRack = (rack: Rack) => {
    const isSelected = selectedRack?.id === rack.id;
    const isHovered = hoveredElements.rack === rack.id;
    const shelves = rack.shelves || [];
    const totalDevices = shelves.reduce(
      (sum, shelf) => sum + (shelf.devices?.length || 0),
      0,
    );

    return (
      <div
        key={rack.id}
        className={cn(
          "group relative p-5 rounded-xl border transition-all duration-200 cursor-pointer",
          "bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700",
          "hover:from-blue-100 hover:to-blue-150 dark:hover:from-blue-800/30 dark:hover:to-blue-700/30 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-lg",
          isSelected &&
            "ring-2 ring-blue-500 border-blue-400 dark:border-blue-500 bg-gradient-to-r from-blue-100 to-blue-200 dark:from-blue-800/40 dark:to-blue-700/40",
          isHovered && "scale-[1.01]",
        )}
        onClick={(e) => {
          e.stopPropagation();
          onRackSelect(rack);
        }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          handleDoubleClick(rack, "rack");
        }}
        onMouseEnter={() =>
          setHoveredElements((prev) => ({ ...prev, rack: rack.id }))
        }
        onMouseLeave={() =>
          setHoveredElements((prev) => ({ ...prev, rack: undefined }))
        }
      >
        {/* Rack Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <Archive className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <span className="text-xl font-semibold text-blue-800 dark:text-blue-200">
              {rack.name || `Rack ${rack.id}`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="border-blue-300 text-blue-700 dark:border-blue-600 dark:text-blue-300 text-sm px-2 py-1"
            >
              {shelves.length} shelf{shelves.length !== 1 ? "ves" : ""}
            </Badge>
            {totalDevices > 0 && (
              <Badge
                variant="secondary"
                className="text-blue-700 dark:text-blue-300 text-sm px-2 py-1"
              >
                {totalDevices} device{totalDevices !== 1 ? "s" : ""}
              </Badge>
            )}
            {onAddShelf && selectedRack?.id === rack.id && (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddShelf();
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Shelf
              </Button>
            )}
          </div>
        </div>

        {/* Shelves Grid */}
        {shelves.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {shelves.map(renderShelf)}
          </div>
        ) : (
          <div className="text-center py-12 text-blue-500 dark:text-blue-400">
            <Grid3X3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-base mb-3">No shelves in this rack</p>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                if (onAddShelf) onAddShelf();
              }}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
              disabled={selectedRack?.id !== rack.id}
            >
              <Plus className="w-4 h-4" />
              Add Shelf
            </Button>
          </div>
        )}
      </div>
    );
  };

  // Row rendering with proper dark mode and layout
  const renderRow = (row: Row) => {
    const isSelected = selectedRow?.id === row.id;
    const isHovered = hoveredElements.row === row.id;
    const racks = row.racks || [];
    const totalShelves = racks.reduce(
      (sum, rack) => sum + (rack.shelves?.length || 0),
      0,
    );
    const totalDevices = racks.reduce(
      (sum, rack) =>
        sum +
        (rack.shelves?.reduce(
          (shelfSum, shelf) => shelfSum + (shelf.devices?.length || 0),
          0,
        ) || 0),
      0,
    );

    return (
      <div
        key={row.id}
        className={cn(
          "group relative p-6 rounded-2xl border transition-all duration-200 cursor-pointer",
          "bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-700",
          "hover:from-green-100 hover:to-emerald-100 dark:hover:from-green-800/30 dark:hover:to-emerald-800/30 hover:border-green-300 dark:hover:border-green-600 hover:shadow-xl",
          isSelected &&
            "ring-2 ring-green-500 border-green-400 dark:border-green-500 bg-gradient-to-r from-green-100 to-emerald-150 dark:from-green-800/40 dark:to-emerald-800/40",
          isHovered && "scale-[1.005]",
        )}
        onClick={(e) => {
          e.stopPropagation();
          onRowSelect(row);
        }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          handleDoubleClick(row, "row");
        }}
        onMouseEnter={() =>
          setHoveredElements((prev) => ({ ...prev, row: row.id }))
        }
        onMouseLeave={() =>
          setHoveredElements((prev) => ({ ...prev, row: undefined }))
        }
      >
        {/* Row Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Layers className="w-7 h-7 text-green-600 dark:text-green-400" />
            <span className="text-2xl font-bold text-green-800 dark:text-green-200">
              {row.name || `Row ${row.id}`}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Badge
              variant="outline"
              className="border-green-300 text-green-700 dark:border-green-600 dark:text-green-300 text-sm px-3 py-1"
            >
              {racks.length} rack{racks.length !== 1 ? "s" : ""}
            </Badge>
            <Badge
              variant="outline"
              className="border-green-300 text-green-700 dark:border-green-600 dark:text-green-300 text-sm px-3 py-1"
            >
              {totalShelves} shelf{totalShelves !== 1 ? "ves" : ""}
            </Badge>
            {totalDevices > 0 && (
              <Badge
                variant="secondary"
                className="text-green-700 dark:text-green-300 text-sm px-3 py-1"
              >
                {totalDevices} device{totalDevices !== 1 ? "s" : ""}
              </Badge>
            )}
            {onAddRack && selectedRow?.id === row.id && (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddRack();
                }}
                className="bg-green-600 hover:bg-green-700 text-white gap-2"
              >
                <Plus className="h-3 w-3 mr-1" />
                Rack
              </Button>
            )}
          </div>
        </div>

        {/* Racks Grid - Updated to match original layout */}
        {racks.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {racks.map(renderRack)}
          </div>
        ) : (
          <div className="text-center py-12 text-green-500 dark:text-green-400">
            <Archive className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-base mb-3">No racks in this row</p>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                if (onAddRack) onAddRack();
              }}
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white gap-2"
              disabled={selectedRow?.id !== row.id}
            >
              <Plus className="w-4 h-4" />
              Add Rack
            </Button>
          </div>
        )}
      </div>
    );
  };

  if (filteredRows.length === 0) {
    return (
      <div className="text-center py-12">
        <IconComponent
          className={cn("h-12 w-12 mx-auto mb-4", config.color, "opacity-50")}
        />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          No {config.title} Yet
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          Get started by adding your first {areaType.replace("_", " ")}.
        </p>
        {onAddRow && (
          <Button onClick={onAddRow}>
            <Plus className="h-4 w-4 mr-2" />
            Add{" "}
            {areaType === "germination_tent"
              ? "Germination Tent"
              : "Growing Area"}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <IconComponent className={cn("h-6 w-6", config.color)} />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {config.title}
          </h2>
          <Badge
            variant="outline"
            className="dark:border-gray-600 dark:text-gray-300"
          >
            {filteredRows.length} {filteredRows.length === 1 ? "area" : "areas"}
          </Badge>
        </div>
        {onAddRow && (
          <Button
            onClick={onAddRow}
            variant="outline"
            className="dark:border-gray-600 dark:text-gray-300"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add {areaType === "germination_tent" ? "Tent" : "Area"}
          </Button>
        )}
      </div>

      <div className="space-y-6">{filteredRows.map(renderRow)}</div>
    </div>
  );
};

export default FarmAreaGrid;
