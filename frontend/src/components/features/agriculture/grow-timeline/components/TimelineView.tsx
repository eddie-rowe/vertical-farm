import React from "react";

import { STATUS_COLORS } from "../data";
import { useTimelineCalculations } from "../hooks";
import { GrowTimelineItem } from "../types";

interface TimelineViewProps {
  grows: GrowTimelineItem[];
  selectedGrows: string[];
  hoveredGrow: string | null;
  zoomLevel: number;
  timeRange: number;
  currentDate: Date;
  onGrowSelect: (growId: string, multi?: boolean) => void;
  onGrowHover: (growId: string | null) => void;
  onGrowAction: (growId: string, action: string) => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  grows,
  selectedGrows,
  hoveredGrow,
  zoomLevel,
  timeRange,
  currentDate,
  onGrowSelect,
  onGrowHover,
  onGrowAction,
}) => {
  const { positions, getCurrentTimePosition, generateTimeMarkers } =
    useTimelineCalculations({
      grows,
      zoomLevel,
      timeRange,
      currentDate,
    });

  const timeMarkers = generateTimeMarkers;
  const currentTimePosition = getCurrentTimePosition;

  const handleGrowClick = (growId: string, event: React.MouseEvent) => {
    const multi = event.ctrlKey || event.metaKey;
    onGrowSelect(growId, multi);
  };

  const handleGrowContextMenu = (growId: string, event: React.MouseEvent) => {
    event.preventDefault();
    // Show context menu with actions
    const grow = grows.find((g) => g.id === growId);
    if (grow) {
      const action = window.confirm(`Abort grow ${grow.shelfName}?`)
        ? "abort"
        : null;
      if (action) {
        onGrowAction(growId, action);
      }
    }
  };

  return (
    <div className="relative bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Timeline Header */}
      <div className="relative h-12 bg-gray-50 border-b border-gray-200">
        {timeMarkers.map((marker, index) => (
          <div
            key={index}
            className="absolute top-0 h-full flex items-center"
            style={{ left: `${marker.position}%` }}
          >
            <div className="w-px h-full bg-gray-300" />
            <span className="ml-2 text-xs text-gray-600 font-medium">
              {marker.label}
            </span>
          </div>
        ))}

        {/* Current time indicator */}
        <div
          className="absolute top-0 h-full w-0.5 bg-red-500 z-10"
          style={{ left: `${currentTimePosition}%` }}
        >
          <div className="absolute -top-1 -left-1 w-3 h-3 bg-red-500 rounded-full" />
        </div>
      </div>

      {/* Timeline Body */}
      <div className="relative min-h-96 p-4">
        {grows.map((grow, index) => {
          const position = positions.get(grow.id);
          if (!position) return null;

          const isSelected = selectedGrows.includes(grow.id);
          const isHovered = hoveredGrow === grow.id;

          return (
            <div
              key={grow.id}
              className={`absolute h-8 rounded cursor-pointer transition-all duration-200 ${
                isSelected ? "ring-2 ring-blue-500 ring-offset-1" : ""
              } ${isHovered ? "shadow-lg scale-105" : "shadow-sm"}`}
              style={{
                top: `${index * 36 + 8}px`,
                left: position.left,
                width: position.width,
                backgroundColor: STATUS_COLORS[grow.status],
                minWidth: "20px",
              }}
              onClick={(e) => handleGrowClick(grow.id, e)}
              onContextMenu={(e) => handleGrowContextMenu(grow.id, e)}
              onMouseEnter={() => onGrowHover(grow.id)}
              onMouseLeave={() => onGrowHover(null)}
            >
              <div className="flex items-center h-full px-2 text-white text-xs font-medium">
                <span className="truncate">
                  {grow.shelfName} - {grow.recipeName}
                </span>
                <div className="ml-auto flex items-center space-x-1">
                  {grow.criticalAlerts > 0 && (
                    <span className="w-2 h-2 bg-red-400 rounded-full" />
                  )}
                  <span>{grow.progress}%</span>
                </div>
              </div>

              {/* Progress overlay */}
              <div
                className="absolute top-0 left-0 h-full bg-white bg-opacity-20 rounded"
                style={{ width: `${grow.progress}%` }}
              />
            </div>
          );
        })}

        {/* Hover tooltip */}
        {hoveredGrow && (
          <div className="absolute z-20 bg-gray-900 text-white p-3 rounded-lg shadow-lg pointer-events-none">
            {(() => {
              const grow = grows.find((g) => g.id === hoveredGrow);
              if (!grow) return null;

              return (
                <div className="space-y-1 text-sm">
                  <div className="font-medium">{grow.shelfName}</div>
                  <div className="text-gray-300">
                    {grow.recipeName} - {grow.speciesName}
                  </div>
                  <div className="text-gray-300">
                    {grow.daysElapsed} / {grow.totalDays} days
                  </div>
                  <div className="text-gray-300">
                    Progress: {grow.progress}%
                  </div>
                  {grow.criticalAlerts > 0 && (
                    <div className="text-red-400">
                      {grow.criticalAlerts} critical alert(s)
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Timeline Footer */}
      <div className="h-8 bg-gray-50 border-t border-gray-200 flex items-center px-4">
        <span className="text-xs text-gray-500">
          {grows.length} grows • Zoom: {zoomLevel}x
        </span>
      </div>
    </div>
  );
};
