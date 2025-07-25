import React from "react";

import { STATUS_COLORS, groupGrowsByFarm } from "../data";
import { GrowTimelineItem } from "../types";

interface SpatialViewProps {
  grows: GrowTimelineItem[];
  selectedGrows: string[];
  hoveredGrow: string | null;
  onGrowSelect: (growId: string, multi?: boolean) => void;
  onGrowHover: (growId: string | null) => void;
  onGrowAction: (growId: string, action: string) => void;
}

export const SpatialView: React.FC<SpatialViewProps> = ({
  grows,
  selectedGrows,
  hoveredGrow,
  onGrowSelect,
  onGrowHover,
  onGrowAction,
}) => {
  const farmGroups = groupGrowsByFarm(grows);

  const handleGrowClick = (growId: string, event: React.MouseEvent) => {
    const multi = event.ctrlKey || event.metaKey;
    onGrowSelect(growId, multi);
  };

  const handleGrowContextMenu = (growId: string, event: React.MouseEvent) => {
    event.preventDefault();
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
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="space-y-8">
        {Object.entries(farmGroups).map(([farmName, rows]) => (
          <div key={farmName} className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
              {farmName}
            </h3>

            <div className="space-y-6">
              {Object.entries(rows).map(([rowName, racks]) => (
                <div key={rowName} className="space-y-3">
                  <h4 className="text-md font-medium text-gray-700">
                    {rowName}
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(racks).map(([rackName, rackGrows]) => (
                      <div
                        key={rackName}
                        className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                      >
                        <h5 className="text-sm font-medium text-gray-600 mb-3">
                          {rackName}
                        </h5>

                        <div className="grid grid-cols-2 gap-2">
                          {rackGrows.map((grow) => {
                            const isSelected = selectedGrows.includes(grow.id);
                            const isHovered = hoveredGrow === grow.id;

                            return (
                              <div
                                key={grow.id}
                                className={`relative p-3 rounded-md cursor-pointer transition-all duration-200 ${
                                  isSelected
                                    ? "ring-2 ring-blue-500 ring-offset-1"
                                    : ""
                                } ${isHovered ? "shadow-lg scale-105" : "shadow-sm"}`}
                                style={{
                                  backgroundColor: STATUS_COLORS[grow.status],
                                }}
                                onClick={(e) => handleGrowClick(grow.id, e)}
                                onContextMenu={(e) =>
                                  handleGrowContextMenu(grow.id, e)
                                }
                                onMouseEnter={() => onGrowHover(grow.id)}
                                onMouseLeave={() => onGrowHover(null)}
                              >
                                <div className="text-white">
                                  <div className="text-xs font-medium truncate">
                                    {grow.shelfName}
                                  </div>
                                  <div className="text-xs opacity-90 truncate">
                                    {grow.recipeName}
                                  </div>
                                  <div className="text-xs opacity-75 mt-1">
                                    {grow.progress}%
                                  </div>
                                </div>

                                {/* Status indicators */}
                                <div className="absolute top-1 right-1 flex space-x-1">
                                  {grow.criticalAlerts > 0 && (
                                    <div className="w-2 h-2 bg-red-400 rounded-full" />
                                  )}
                                  {grow.automationEnabled && (
                                    <div className="w-2 h-2 bg-green-400 rounded-full" />
                                  )}
                                </div>

                                {/* Progress bar */}
                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white bg-opacity-20 rounded-b-md">
                                  <div
                                    className="h-full bg-white bg-opacity-40 rounded-b-md transition-all duration-300"
                                    style={{ width: `${grow.progress}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Rack summary */}
                        <div className="mt-3 pt-3 border-t border-gray-300">
                          <div className="flex justify-between text-xs text-gray-600">
                            <span>{rackGrows.length} shelves</span>
                            <span>
                              Avg:{" "}
                              {Math.round(
                                rackGrows.reduce(
                                  (sum, g) => sum + g.progress,
                                  0,
                                ) / rackGrows.length,
                              )}
                              %
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Hover tooltip */}
      {hoveredGrow && (
        <div className="fixed z-50 bg-gray-900 text-white p-3 rounded-lg shadow-lg pointer-events-none">
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
                  Day {grow.daysElapsed} of {grow.totalDays}
                </div>
                <div className="text-gray-300">Progress: {grow.progress}%</div>
                <div className="text-gray-300">
                  Environmental Score: {grow.environmentalScore}/100
                </div>
                {grow.criticalAlerts > 0 && (
                  <div className="text-red-400">
                    {grow.criticalAlerts} critical alert(s)
                  </div>
                )}
                {grow.automationEnabled && (
                  <div className="text-green-400">Automation enabled</div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* Legend */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <span className="text-gray-600 font-medium">Status:</span>
          {Object.entries(STATUS_COLORS).map(([status, color]) => (
            <div key={status} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded"
                style={{ backgroundColor: color }}
              />
              <span className="text-gray-700 capitalize">{status}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 text-sm mt-2">
          <span className="text-gray-600 font-medium">Indicators:</span>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-400 rounded-full" />
            <span className="text-gray-700">Critical alerts</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full" />
            <span className="text-gray-700">Automation enabled</span>
          </div>
        </div>
      </div>
    </div>
  );
};
