"use client";

import {
  Leaf,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  Play,
  Pause,
  Loader2,
} from "lucide-react";
import React, { useState, useEffect, useCallback } from "react";

import { Badge } from "@/components/ui/badge";
import { GrowTimelineItem } from "@/components/features/agriculture/grow-timeline/types";
import { adaptGrowsToTimelineItems } from "@/components/features/agriculture/grow-timeline/utils/growAdapter";
import { cn } from "@/lib/utils";
import { GrowService } from "@/services/domain/farm/GrowService";
import { FarmPageData, Row, Rack, Shelf } from "@/types/farm";

interface GrowsOverlayProps {
  farmData: FarmPageData | null;
  selectedRow?: Row | null;
  selectedRack?: Rack | null;
  selectedShelf?: Shelf | null;
}

const GrowsOverlay: React.FC<GrowsOverlayProps> = ({
  farmData,
  selectedRow,
  selectedRack,
  selectedShelf,
}) => {
  const [grows, setGrows] = useState<GrowTimelineItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadGrows = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const growService = GrowService.getInstance();
      const growsWithDetails = await growService.getActiveGrows();

      // Convert service data to timeline format
      const timelineItems = adaptGrowsToTimelineItems(growsWithDetails);
      setGrows(timelineItems);
    } catch (err) {
      console.error("Failed to load grows for overlay:", err);
      setError(err instanceof Error ? err.message : "Failed to load grows");
      setGrows([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGrows();
  }, [loadGrows]);

  const getStatusColor = (status: GrowTimelineItem["status"]) => {
    switch (status) {
      case "active":
        return "text-green-600 dark:text-green-400";
      case "planned":
        return "text-blue-600 dark:text-blue-400";
      case "completed":
        return "text-gray-600 dark:text-gray-400";
      case "aborted":
        return "text-red-600 dark:text-red-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  const getStatusIcon = (status: GrowTimelineItem["status"]) => {
    switch (status) {
      case "active":
        return <Play className="w-3 h-3" />;
      case "planned":
        return <Calendar className="w-3 h-3" />;
      case "completed":
        return <CheckCircle className="w-3 h-3" />;
      case "aborted":
        return <Pause className="w-3 h-3" />;
      default:
        return <Clock className="w-3 h-3" />;
    }
  };

  // Filter grows based on selection context
  const filteredGrows = grows.filter((grow) => {
    if (selectedShelf) {
      return grow.shelfId === selectedShelf.id;
    }
    if (selectedRack) {
      return grow.rackName === selectedRack.name;
    }
    if (selectedRow) {
      return grow.rowName === selectedRow.name;
    }
    // If farm data is provided, filter by farm name
    if (farmData?.farm) {
      return grow.farmName === farmData.farm.name;
    }
    return true;
  });

  if (!farmData?.farm?.rows) return null;

  // Summary stats based on filtered grows
  const totalGrows = filteredGrows.length;
  const activeGrows = filteredGrows.filter((g) => g.status === "active").length;
  const plannedGrows = filteredGrows.filter((g) => g.status === "planned").length;
  const criticalAlerts = filteredGrows.reduce((sum, g) => sum + g.criticalAlerts, 0);

  return (
    <div className="absolute inset-0 pointer-events-none z-40">
      {/* Grow Information Panel */}
      <div className="absolute bottom-4 right-4 pointer-events-auto">
        <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-lg border border-green-200 dark:border-green-600 p-4 shadow-lg max-w-[300px]">
          <div className="flex items-center gap-2 mb-3">
            <Leaf className="w-5 h-5 text-green-600 dark:text-green-400" />
            <span className="text-lg font-semibold text-green-800 dark:text-green-200">
              Active Grows
            </span>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-green-600" />
            </div>
          ) : error ? (
            <div className="text-sm text-red-600 dark:text-red-400 py-2">
              {error}
            </div>
          ) : (
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center">
                  <div className="text-xl font-bold text-green-600 dark:text-green-400">
                    {activeGrows}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Active
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    {plannedGrows}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Planned
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-gray-600 dark:text-gray-400">
                    {totalGrows}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Total
                  </div>
                </div>
              </div>

              {/* Critical Alerts */}
              {criticalAlerts > 0 && (
                <div className="mb-4">
                  <Badge variant="destructive" className="w-full justify-center">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    {criticalAlerts} Alert{criticalAlerts !== 1 ? "s" : ""} Need
                    Attention
                  </Badge>
                </div>
              )}

              {/* Current Grows List */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Current Grows
                </h4>
                {filteredGrows.length === 0 ? (
                  <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
                    No active grows
                  </div>
                ) : (
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {filteredGrows
                      .filter((g) => g.status === "active" || g.status === "planned")
                      .slice(0, 4)
                      .map((grow) => (
                        <div
                          key={grow.id}
                          className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-md"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={cn(
                                "flex items-center gap-1",
                                getStatusColor(grow.status),
                              )}
                            >
                              {getStatusIcon(grow.status)}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {grow.speciesName}
                              </div>
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                {grow.shelfName}
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            {grow.status === "active" && (
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                {grow.progress}% • {grow.daysRemaining}d
                              </div>
                            )}
                            {grow.status === "planned" && (
                              <div className="text-xs text-blue-600 dark:text-blue-400">
                                Starts {new Date(grow.startDate).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}

                    {filteredGrows.filter(
                      (g) => g.status === "active" || g.status === "planned",
                    ).length > 4 && (
                      <div className="text-center">
                        <Badge variant="outline" className="text-xs">
                          +
                          {filteredGrows.filter(
                            (g) => g.status === "active" || g.status === "planned",
                          ).length - 4}{" "}
                          more
                        </Badge>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default GrowsOverlay;
