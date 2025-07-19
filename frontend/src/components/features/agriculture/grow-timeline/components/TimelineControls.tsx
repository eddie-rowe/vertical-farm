import React from "react";
import { ViewMode, SortField, SortOrder } from "../types";
import { SORT_OPTIONS, ZOOM_LEVELS, STATUS_LABELS } from "../data";

interface TimelineControlsProps {
  viewMode: ViewMode;
  searchTerm: string;
  statusFilter: string;
  sortBy: SortField;
  sortOrder: SortOrder;
  zoomLevel: number;
  isFullscreen: boolean;
  selectedGrowsCount: number;
  totalGrowsCount: number;
  onViewModeChange: (mode: ViewMode) => void;
  onSearchChange: (term: string) => void;
  onStatusFilterChange: (status: string) => void;
  onSortChange: (sortBy: SortField, sortOrder: SortOrder) => void;
  onZoomChange: (level: number) => void;
  onToggleFullscreen: () => void;
  onRefresh: () => void;
  onClearSelection: () => void;
}

export const TimelineControls: React.FC<TimelineControlsProps> = ({
  viewMode,
  searchTerm,
  statusFilter,
  sortBy,
  sortOrder,
  zoomLevel,
  isFullscreen,
  selectedGrowsCount,
  totalGrowsCount,
  onViewModeChange,
  onSearchChange,
  onStatusFilterChange,
  onSortChange,
  onZoomChange,
  onToggleFullscreen,
  onRefresh,
  onClearSelection,
}) => {
  const handleSortChange = (newSortBy: SortField) => {
    if (newSortBy === sortBy) {
      // Toggle order if same field
      onSortChange(sortBy, sortOrder === "asc" ? "desc" : "asc");
    } else {
      // New field, default to ascending
      onSortChange(newSortBy, "asc");
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 p-4 space-y-4">
      {/* Top Row: View Mode Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex space-x-1">
          {(["timeline", "spatial", "status", "management"] as ViewMode[]).map(
            (mode) => (
              <button
                key={mode}
                onClick={() => onViewModeChange(mode)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  viewMode === mode
                    ? "bg-blue-100 text-blue-700 border border-blue-200"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ),
          )}
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onToggleFullscreen}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
            title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {isFullscreen ? (
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                />
              </svg>
            )}
          </button>

          <button
            onClick={onRefresh}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
            title="Refresh data"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Second Row: Search and Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="h-4 w-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search grows..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
              Status:
            </label>
            <select
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All</option>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
              Sort by:
            </label>
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value as SortField)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              onClick={() =>
                onSortChange(sortBy, sortOrder === "asc" ? "desc" : "asc")
              }
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              title={`Sort ${sortOrder === "asc" ? "descending" : "ascending"}`}
            >
              {sortOrder === "asc" ? (
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 15l7-7 7 7"
                  />
                </svg>
              ) : (
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Right Side: Zoom and Stats */}
        <div className="flex items-center gap-4">
          {/* Zoom (only for timeline view) */}
          {viewMode === "timeline" && (
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                Zoom:
              </label>
              <select
                value={zoomLevel}
                onChange={(e) => onZoomChange(Number(e.target.value))}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {ZOOM_LEVELS.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Selection Stats */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            {selectedGrowsCount > 0 && (
              <>
                <span>
                  {selectedGrowsCount} of {totalGrowsCount} selected
                </span>
                <button
                  onClick={onClearSelection}
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  Clear
                </button>
              </>
            )}
            {selectedGrowsCount === 0 && <span>{totalGrowsCount} grows</span>}
          </div>
        </div>
      </div>

      {/* Quick Filters (Status badges) */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-gray-700">
          Quick filters:
        </span>
        {Object.entries(STATUS_LABELS).map(([value, label]) => (
          <button
            key={value}
            onClick={() =>
              onStatusFilterChange(statusFilter === value ? "all" : value)
            }
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
              statusFilter === value
                ? "bg-blue-100 text-blue-800 border border-blue-200"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
};
