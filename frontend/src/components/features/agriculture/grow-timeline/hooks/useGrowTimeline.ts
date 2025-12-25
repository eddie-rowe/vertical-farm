"use client";

import { useState, useEffect, useMemo, useCallback } from "react";

import { GrowService } from "@/services/domain/farm/GrowService";

import { filterGrows } from "../data";
import { TimelineState, ViewMode, SortField, SortOrder, GrowTimelineItem } from "../types";
import { adaptGrowsToTimelineItems } from "../utils/growAdapter";

interface UseGrowTimelineProps {
  selectedGrowId?: string;
  onGrowSelect?: (growId: string) => void;
  onGrowAction?: (growId: string, action: string) => void;
  viewMode?: ViewMode;
  timeRange?: number;
}

export const useGrowTimeline = ({
  selectedGrowId,
  onGrowSelect,
  onGrowAction,
  viewMode = "timeline",
  timeRange = 90,
}: UseGrowTimelineProps = {}) => {
  const [state, setState] = useState<TimelineState>({
    grows: [],
    filteredGrows: [],
    isLoading: true,
    zoomLevel: 1,
    currentDate: new Date(),
    hoveredGrow: null,
    isFullscreen: false,
    searchTerm: "",
    statusFilter: "all",
    selectedGrows: selectedGrowId ? [selectedGrowId] : [],
    sortBy: "startDate",
    sortOrder: "asc",
  });
  const [error, setError] = useState<string | null>(null);

  // Load real data from GrowService
  const loadData = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));
    setError(null);

    try {
      const growService = GrowService.getInstance();
      const growsWithDetails = await growService.getFilteredGrows({
        is_active: true,
      });

      // Convert service data to timeline format
      const timelineItems = adaptGrowsToTimelineItems(growsWithDetails);

      setState((prev) => ({
        ...prev,
        grows: timelineItems,
        filteredGrows: timelineItems,
        isLoading: false,
      }));
    } catch (err) {
      console.error("Failed to load grows:", err);
      setError(err instanceof Error ? err.message : "Failed to load grow data");
      setState((prev) => ({
        ...prev,
        grows: [],
        filteredGrows: [],
        isLoading: false,
      }));
    }
  }, []);

  // Initialize data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter and sort grows
  const processedGrows = useMemo(() => {
    const filtered = filterGrows(
      state.grows,
      state.searchTerm,
      state.statusFilter,
    );

    // Sort grows
    filtered.sort((a, b) => {
      const aValue = a[state.sortBy as keyof GrowTimelineItem];
      const bValue = b[state.sortBy as keyof GrowTimelineItem];

      let comparison = 0;
      if (typeof aValue === "string" && typeof bValue === "string") {
        comparison = aValue.localeCompare(bValue);
      } else if (typeof aValue === "number" && typeof bValue === "number") {
        comparison = aValue - bValue;
      }

      return state.sortOrder === "desc" ? -comparison : comparison;
    });

    return filtered;
  }, [
    state.grows,
    state.searchTerm,
    state.statusFilter,
    state.sortBy,
    state.sortOrder,
  ]);

  // Update filtered grows when processed grows change
  useEffect(() => {
    setState((prev) => ({ ...prev, filteredGrows: processedGrows }));
  }, [processedGrows]);

  // Actions
  const setSearchTerm = useCallback((searchTerm: string) => {
    setState((prev) => ({ ...prev, searchTerm }));
  }, []);

  const setStatusFilter = useCallback((statusFilter: string) => {
    setState((prev) => ({ ...prev, statusFilter }));
  }, []);

  const setSorting = useCallback((sortBy: SortField, sortOrder: SortOrder) => {
    setState((prev) => ({ ...prev, sortBy, sortOrder }));
  }, []);

  const setZoomLevel = useCallback((zoomLevel: number) => {
    setState((prev) => ({ ...prev, zoomLevel }));
  }, []);

  const setHoveredGrow = useCallback((growId: string | null) => {
    setState((prev) => ({ ...prev, hoveredGrow: growId }));
  }, []);

  const toggleFullscreen = useCallback(() => {
    setState((prev) => ({ ...prev, isFullscreen: !prev.isFullscreen }));
  }, []);

  const selectGrow = useCallback(
    (growId: string, multi = false) => {
      setState((prev) => {
        let newSelected: string[];

        if (multi) {
          newSelected = prev.selectedGrows.includes(growId)
            ? prev.selectedGrows.filter((id) => id !== growId)
            : [...prev.selectedGrows, growId];
        } else {
          newSelected = [growId];
        }

        return { ...prev, selectedGrows: newSelected };
      });

      if (onGrowSelect && !multi) {
        onGrowSelect(growId);
      }
    },
    [onGrowSelect],
  );

  const clearSelection = useCallback(() => {
    setState((prev) => ({ ...prev, selectedGrows: [] }));
  }, []);

  const handleGrowAction = useCallback(
    async (growId: string, action: string) => {
      if (onGrowAction) {
        onGrowAction(growId, action);
      }

      // Handle built-in actions by calling the real service
      try {
        const growService = GrowService.getInstance();

        switch (action) {
          case "abort":
            await growService.updateGrowStatus(growId, "failed");
            break;
          case "complete":
            await growService.updateGrowStatus(growId, "harvested");
            break;
        }

        // Refresh data after action
        await loadData();
      } catch (err) {
        console.error(`Failed to ${action} grow:`, err);
        setError(err instanceof Error ? err.message : `Failed to ${action} grow`);
      }
    },
    [onGrowAction, loadData],
  );

  const refreshData = useCallback(() => {
    loadData();
  }, [loadData]);

  return {
    // State
    ...state,
    error,
    viewMode,
    timeRange,

    // Computed
    selectedGrow:
      state.selectedGrows.length === 1
        ? state.grows.find((g) => g.id === state.selectedGrows[0])
        : null,

    // Actions
    setSearchTerm,
    setStatusFilter,
    setSorting,
    setZoomLevel,
    setHoveredGrow,
    toggleFullscreen,
    selectGrow,
    clearSelection,
    handleGrowAction,
    refreshData,
  };
};
