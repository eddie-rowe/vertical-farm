"use client";

import {
  Plus,
  Layers,
  Archive,
  Grid3X3,
  Lightbulb,
  Droplets,
  Wind,
} from "lucide-react";
import React, { useState, useCallback } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { FarmPageData, Row, Rack, Shelf, SensorDevice } from "@/types/farm";

import ElementDetailModal from "./ElementDetailModal";

interface InteractiveFarmVisualizationProps {
  farmData: FarmPageData | null;
  selectedRow: Row | null;
  selectedRack: Rack | null;
  selectedShelf: Shelf | null;
  onRowSelect: (row: Row) => void;
  onRackSelect: (rack: Rack) => void;
  onShelfSelect: (shelf: Shelf) => void;
  editMode?: boolean;
  onDataRefresh?: () => void;
}

type ContextAction = "add-row" | "add-rack" | "add-shelf";

const InteractiveFarmVisualization: React.FC<
  InteractiveFarmVisualizationProps
> = ({
  farmData,
  selectedRow,
  selectedRack,
  selectedShelf,
  onRowSelect,
  onRackSelect,
  onShelfSelect,
  editMode = false,
  onDataRefresh,
}) => {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [hoveredRack, setHoveredRack] = useState<string | null>(null);
  const [hoveredShelf, setHoveredShelf] = useState<string | null>(null);

  // Detail modal state
  const [detailModal, setDetailModal] = useState<{
    isOpen: boolean;
    element: Row | Rack | Shelf | null;
    elementType: "row" | "rack" | "shelf";
  }>({
    isOpen: false,
    element: null,
    elementType: "row",
  });

  // Detail modal handlers
  const openDetailModal = useCallback(
    (element: Row | Rack | Shelf, elementType: "row" | "rack" | "shelf") => {
      setDetailModal({
        isOpen: true,
        element,
        elementType,
      });
    },
    [],
  );

  const closeDetailModal = useCallback(() => {
    setDetailModal({
      isOpen: false,
      element: null,
      elementType: "row",
    });
  }, []);

  // Context action handlers
  const handleContextAction = useCallback(
    async (action: ContextAction) => {
      if (!farmData?.farm) return;

      try {
        const { createRow, createRack, createShelf } = await import(
          "@/services/supabaseService"
        );

        switch (action) {
          case "add-row":
            await createRow({
              farm_id: farmData.farm.id,
              name: `Row ${(farmData.farm.rows?.length || 0) + 1}`,
            });
            break;
          case "add-rack":
            if (selectedRow) {
              await createRack({
                row_id: selectedRow.id,
                name: `Rack ${(selectedRow.racks?.length || 0) + 1}`,
              });
            }
            break;
          case "add-shelf":
            if (selectedRack) {
              await createShelf({
                rack_id: selectedRack.id,
                name: `Shelf ${(selectedRack.shelves?.length || 0) + 1}`,
              });
            }
            break;
        }

        if (onDataRefresh) {
          onDataRefresh();
        }
      } catch (error) {
        console.error("Error creating element:", error);
      }
    },
    [farmData?.farm, selectedRow, selectedRack, onDataRefresh],
  );

  // Device icon mapping
  const getDeviceIcon = (device: SensorDevice) => {
    const type = device.name?.toLowerCase() || "";
    if (type.includes("light")) return <Lightbulb className="w-3 h-3" />;
    if (type.includes("water") || type.includes("pump"))
      return <Droplets className="w-3 h-3" />;
    if (type.includes("fan") || type.includes("air"))
      return <Wind className="w-3 h-3" />;
    return <div className="w-3 h-3 rounded-full bg-slate-400" />;
  };

  // Device rendering
  const renderDevice = (device: SensorDevice) => (
    <TooltipProvider key={device.id}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-800/80 dark:bg-slate-200/80 rounded-md backdrop-blur-sm border border-slate-600/30 dark:border-slate-400/30">
            {getDeviceIcon(device)}
            <span className="text-xs font-medium text-white dark:text-slate-800 truncate max-w-16">
              {device.name || "Device"}
            </span>
            <div className="w-2 h-2 rounded-full bg-green-400" />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p className="font-medium">{device.name || "Unnamed Device"}</p>
            <p className="text-xs text-muted-foreground">
              Type: {device.sensor_type}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  // Shelf rendering
  const renderShelf = (shelf: Shelf) => {
    const isSelected = selectedShelf?.id === shelf.id;
    const isHovered = hoveredShelf === shelf.id;
    const devices = shelf.devices || [];
    const deviceCount = devices.length;

    return (
      <div
        key={shelf.id}
        className={cn(
          "group relative p-3 rounded-lg border transition-all duration-200 cursor-pointer",
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
          openDetailModal(shelf, "shelf");
        }}
        onMouseEnter={() => setHoveredShelf(shelf.id)}
        onMouseLeave={() => setHoveredShelf(null)}
      >
        {/* Shelf Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Grid3X3 className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            <span className="font-medium text-slate-900 dark:text-slate-100">
              {shelf.name || `Shelf ${shelf.id}`}
            </span>
          </div>
          {(isHovered || isSelected) && (
            <Badge variant="secondary" className="text-xs">
              {deviceCount} devices
            </Badge>
          )}
        </div>

        {/* Devices */}
        {devices.length > 0 && (isHovered || isSelected) && (
          <div className="flex flex-wrap gap-1.5">
            {devices.map(renderDevice)}
          </div>
        )}

        {/* Capacity Indicator */}
        {(isHovered || isSelected) && (
          <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-600">
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
              <span>Capacity</span>
              <span>{deviceCount}/8</span>
            </div>
            <div className="mt-1 h-1.5 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-400 to-green-500 transition-all duration-300"
                style={{ width: `${Math.min((deviceCount / 8) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  // Rack rendering
  const renderRack = (rack: Rack) => {
    const isSelected = selectedRack?.id === rack.id;
    const isHovered = hoveredRack === rack.id;
    const shelves = rack.shelves || [];
    const totalDevices = shelves.reduce(
      (sum, shelf) => sum + (shelf.devices?.length || 0),
      0,
    );

    return (
      <div
        key={rack.id}
        className={cn(
          "group relative p-4 rounded-xl border transition-all duration-200 cursor-pointer",
          "bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-700 border-slate-200 dark:border-slate-600 shadow-sm",
          "hover:shadow-lg hover:border-slate-300 dark:hover:border-slate-500 hover:-translate-y-0.5",
          isSelected &&
            "ring-2 ring-blue-500 border-blue-300 dark:border-blue-600 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30",
          isHovered && "scale-[1.01]",
        )}
        onClick={(e) => {
          e.stopPropagation();
          onRackSelect(rack);
        }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          openDetailModal(rack, "rack");
        }}
        onMouseEnter={() => setHoveredRack(rack.id)}
        onMouseLeave={() => setHoveredRack(null)}
      >
        {/* Rack Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Archive className="w-5 h-5 text-slate-700 dark:text-slate-300" />
            <h4 className="font-semibold text-slate-900 dark:text-slate-100">
              {rack.name || `Rack ${rack.id}`}
            </h4>
          </div>
          {(isHovered || isSelected) && (
            <div className="flex gap-2">
              <Badge variant="outline" className="text-xs">
                {shelves.length} shelves
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {totalDevices} devices
              </Badge>
            </div>
          )}
        </div>

        {/* Shelves Grid */}
        <div className="space-y-2">{shelves.map(renderShelf)}</div>

        {/* Capacity Indicator */}
        {(isHovered || isSelected) && (
          <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-600">
            <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-300 mb-1">
              <span>Rack Utilization</span>
              <span>{shelves.length}/6 shelves</span>
            </div>
            <div className="h-2 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-400 to-blue-500 transition-all duration-300"
                style={{
                  width: `${Math.min((shelves.length / 6) * 100, 100)}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  // Row rendering
  const renderRow = (row: Row) => {
    const isSelected = selectedRow?.id === row.id;
    const isHovered = hoveredRow === row.id;
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
          "bg-gradient-to-br from-white via-slate-50 to-slate-100 dark:from-slate-800 dark:via-slate-700 dark:to-slate-600 border-slate-300 dark:border-slate-500 shadow-md",
          "hover:shadow-xl hover:border-slate-400 dark:hover:border-slate-400 hover:-translate-y-1",
          isSelected &&
            "ring-2 ring-blue-500 border-blue-400 dark:border-blue-500 shadow-xl bg-gradient-to-br from-blue-50 via-blue-100 to-blue-150 dark:from-blue-900/40 dark:via-blue-800/40 dark:to-blue-700/40",
          isHovered && "scale-[1.005]",
        )}
        onClick={() => onRowSelect(row)}
        onDoubleClick={(e) => {
          e.stopPropagation();
          openDetailModal(row, "row");
        }}
        onMouseEnter={() => setHoveredRow(row.id)}
        onMouseLeave={() => setHoveredRow(null)}
      >
        {/* Row Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Layers className="w-6 h-6 text-slate-800 dark:text-slate-200" />
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {row.name || `Row ${row.id}`}
            </h3>
          </div>
          {(isHovered || isSelected) && (
            <div className="flex gap-2">
              <Badge variant="outline">{racks.length} racks</Badge>
              <Badge variant="outline">{totalShelves} shelves</Badge>
              <Badge variant="secondary">{totalDevices} devices</Badge>
            </div>
          )}
        </div>

        {/* Racks Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {racks.map(renderRack)}
        </div>

        {/* Row Stats */}
        {(isHovered || isSelected) && (
          <div className="mt-4 pt-4 border-t border-slate-300 dark:border-slate-500">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {racks.length}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-300">
                  Racks
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {totalShelves}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-300">
                  Shelves
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {totalDevices}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-300">
                  Devices
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (!farmData?.farm) {
    return (
      <div className="flex items-center justify-center h-96 bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-600">
        <div className="text-center">
          <Layers className="w-16 h-16 text-slate-400 dark:text-slate-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-600 dark:text-slate-300 mb-2">
            No Farm Data
          </h3>
          <p className="text-slate-500 dark:text-slate-400">
            Unable to load farm visualization data.
          </p>
        </div>
      </div>
    );
  }

  const rows = farmData.farm.rows || [];

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* Main Content */}
      <div className="p-6 h-full overflow-auto">
        {rows.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Layers className="w-20 h-20 text-slate-400 dark:text-slate-500 mx-auto mb-4" />
              <h3 className="text-2xl font-semibold text-slate-600 dark:text-slate-300 mb-2">
                No Rows Found
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mb-4">
                Start by adding your first row to the farm.
              </p>
              {editMode && (
                <Button
                  onClick={() => handleContextAction("add-row")}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add First Row
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">{rows.map(renderRow)}</div>
        )}
      </div>

      {/* Floating Action Buttons */}
      {editMode && (
        <div className="absolute top-6 right-6 flex flex-col gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => handleContextAction("add-row")}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white shadow-lg gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <Layers className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Add Row</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => handleContextAction("add-rack")}
                  disabled={!selectedRow}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white shadow-lg gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <Archive className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {selectedRow
                  ? "Add Rack to Selected Row"
                  : "Select a Row First"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => handleContextAction("add-shelf")}
                  disabled={!selectedRack}
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white shadow-lg gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <Grid3X3 className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {selectedRack
                  ? "Add Shelf to Selected Rack"
                  : "Select a Rack First"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}

      {/* Detail Modal */}
      <ElementDetailModal
        isOpen={detailModal.isOpen}
        onClose={closeDetailModal}
        element={detailModal.element}
        elementType={detailModal.elementType}
        onUpdate={() => {
          if (onDataRefresh) {
            onDataRefresh();
          }
        }}
        onDelete={() => {
          if (onDataRefresh) {
            onDataRefresh();
          }
        }}
      />
    </div>
  );
};

export default InteractiveFarmVisualization;
