"use client";

import React, { useState } from "react";

import {
  InteractiveGrowTimelineProps,
  ViewMode,
  useGrowTimeline,
  TimelineControls,
  TimelineView,
  SpatialView,
  StatusView,
  ManagementView,
} from "@/components/features/agriculture/grow-timeline";

export default function InteractiveGrowTimeline({
  selectedGrowId,
  onGrowSelect,
  onGrowAction,
  viewMode: initialViewMode = "timeline",
  timeRange = 90,
}: InteractiveGrowTimelineProps) {
  const [currentViewMode, setCurrentViewMode] =
    useState<ViewMode>(initialViewMode);

  const timeline = useGrowTimeline({
    selectedGrowId,
    onGrowSelect,
    onGrowAction,
    viewMode: currentViewMode,
    timeRange,
  });

  const renderCurrentView = () => {
    const commonProps = {
      grows: timeline.filteredGrows,
      selectedGrows: timeline.selectedGrows,
      hoveredGrow: timeline.hoveredGrow,
      onGrowSelect: timeline.selectGrow,
      onGrowHover: timeline.setHoveredGrow,
      onGrowAction: timeline.handleGrowAction,
    };

    switch (currentViewMode) {
      case "timeline":
        return (
          <TimelineView
            {...commonProps}
            zoomLevel={timeline.zoomLevel}
            timeRange={timeRange}
            currentDate={timeline.currentDate}
          />
        );
      case "spatial":
        return <SpatialView {...commonProps} />;
      case "status":
        return <StatusView {...commonProps} />;
      case "management":
        return <ManagementView {...commonProps} />;
      default:
        return (
          <TimelineView
            {...commonProps}
            zoomLevel={timeline.zoomLevel}
            timeRange={timeRange}
            currentDate={timeline.currentDate}
          />
        );
    }
  };

  if (timeline.isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 ${timeline.isFullscreen ? "fixed inset-0 z-50" : ""}`}
    >
      <TimelineControls
        viewMode={currentViewMode}
        searchTerm={timeline.searchTerm}
        statusFilter={timeline.statusFilter}
        sortBy={timeline.sortBy}
        sortOrder={timeline.sortOrder}
        zoomLevel={timeline.zoomLevel}
        isFullscreen={timeline.isFullscreen}
        selectedGrowsCount={timeline.selectedGrows.length}
        totalGrowsCount={timeline.grows.length}
        onViewModeChange={setCurrentViewMode}
        onSearchChange={timeline.setSearchTerm}
        onStatusFilterChange={timeline.setStatusFilter}
        onSortChange={timeline.setSorting}
        onZoomChange={timeline.setZoomLevel}
        onToggleFullscreen={timeline.toggleFullscreen}
        onRefresh={timeline.refreshData}
        onClearSelection={timeline.clearSelection}
      />

      {renderCurrentView()}
    </div>
  );
}
