import { useState, useEffect, useMemo, useCallback } from "react";

import { generateMockGrows, filterGrows } from "../data";
import {
  TimelineState,
  ViewMode,
  SortField,
  SortOrder,
} from "../types";

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

  // Initialize data
  useEffect(() => {
    const loadData = async () => {
      setState((prev) => ({ ...prev, isLoading: true }));

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      const grows = generateMockGrows(50);
      setState((prev) => ({
        ...prev,
        grows,
        filteredGrows: grows,
        isLoading: false,
      }));
    };

    loadData();
  }, []);

  // Filter and sort grows
  const processedGrows = useMemo(() => {
    const filtered = filterGrows(
      state.grows,
      state.searchTerm,
      state.statusFilter,
    );

    // Sort grows
    filtered.sort((a, b) => {
      const aValue = a[state.sortBy];
      const bValue = b[state.sortBy];

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
    (growId: string, action: string) => {
      if (onGrowAction) {
        onGrowAction(growId, action);
      }

      // Handle built-in actions
      switch (action) {
        case "abort":
          setState((prev) => ({
            ...prev,
            grows: prev.grows.map((grow) =>
              grow.id === growId
                ? { ...grow, status: "aborted" as const }
                : grow,
            ),
          }));
          break;
        case "complete":
          setState((prev) => ({
            ...prev,
            grows: prev.grows.map((grow) =>
              grow.id === growId
                ? { ...grow, status: "completed" as const, progress: 100 }
                : grow,
            ),
          }));
          break;
      }
    },
    [onGrowAction],
  );

  const refreshData = useCallback(() => {
    const grows = generateMockGrows(50);
    setState((prev) => ({
      ...prev,
      grows,
      filteredGrows: grows,
    }));
  }, []);

  return {
    // State
    ...state,
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
