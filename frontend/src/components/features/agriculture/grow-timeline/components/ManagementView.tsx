import React, { useState } from "react";
import { GrowTimelineItem } from "../types";
import { STATUS_COLORS, STATUS_LABELS } from "../data";

interface ManagementViewProps {
  grows: GrowTimelineItem[];
  selectedGrows: string[];
  onGrowSelect: (growId: string, multi?: boolean) => void;
  onGrowAction: (growId: string, action: string) => void;
  onBulkAction?: (growIds: string[], action: string) => void;
}

export const ManagementView: React.FC<ManagementViewProps> = ({
  grows,
  selectedGrows,
  onGrowSelect,
  onGrowAction,
  onBulkAction,
}) => {
  const [sortBy, setSortBy] = useState<
    "startDate" | "progress" | "daysRemaining" | "environmentalScore"
  >("startDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Filter and sort grows
  const processedGrows = grows
    .filter((grow) => filterStatus === "all" || grow.status === filterStatus)
    .sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];

      let comparison = 0;
      if (typeof aValue === "string" && typeof bValue === "string") {
        comparison = aValue.localeCompare(bValue);
      } else if (typeof aValue === "number" && typeof bValue === "number") {
        comparison = aValue - bValue;
      }

      return sortOrder === "desc" ? -comparison : comparison;
    });

  const handleSelectAll = () => {
    if (selectedGrows.length === processedGrows.length) {
      // Deselect all
      processedGrows.forEach((grow) => onGrowSelect(grow.id, true));
    } else {
      // Select all
      processedGrows.forEach((grow) => {
        if (!selectedGrows.includes(grow.id)) {
          onGrowSelect(grow.id, true);
        }
      });
    }
  };

  const handleBulkAction = (action: string) => {
    if (selectedGrows.length === 0) {
      alert("Please select grows first");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to ${action} ${selectedGrows.length} selected grow(s)?`,
    );

    if (confirmed) {
      if (onBulkAction) {
        onBulkAction(selectedGrows, action);
      } else {
        // Fallback to individual actions
        selectedGrows.forEach((growId) => onGrowAction(growId, action));
      }
    }
  };

  const getStatusCounts = () => {
    const counts = { planned: 0, active: 0, completed: 0, aborted: 0 };
    grows.forEach((grow) => counts[grow.status]++);
    return counts;
  };

  const statusCounts = getStatusCounts();

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Management Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Grow Management
            </h2>
            <p className="text-sm text-gray-600">
              Manage and perform bulk operations on grows
            </p>
          </div>

          {/* Status Overview */}
          <div className="flex flex-wrap gap-4">
            {Object.entries(statusCounts).map(([status, count]) => (
              <div key={status} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded"
                  style={{
                    backgroundColor:
                      STATUS_COLORS[status as keyof typeof STATUS_COLORS],
                  }}
                />
                <span className="text-sm text-gray-700">
                  {STATUS_LABELS[status as keyof typeof STATUS_LABELS]}: {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="p-6 border-b border-gray-200 bg-gray-50">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Filters and Sorting */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">
                Status:
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value="all">All</option>
                <option value="planned">Planned</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="aborted">Aborted</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">
                Sort by:
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value="startDate">Start Date</option>
                <option value="progress">Progress</option>
                <option value="daysRemaining">Days Remaining</option>
                <option value="environmentalScore">Environmental Score</option>
              </select>
              <button
                onClick={() =>
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                }
                className="text-sm px-2 py-1 border border-gray-300 rounded hover:bg-gray-100"
              >
                {sortOrder === "asc" ? "↑" : "↓"}
              </button>
            </div>
          </div>

          {/* Bulk Actions */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {selectedGrows.length} selected
            </span>
            <button
              onClick={handleSelectAll}
              className="text-sm px-3 py-1 border border-gray-300 rounded hover:bg-gray-100"
            >
              {selectedGrows.length === processedGrows.length
                ? "Deselect All"
                : "Select All"}
            </button>
            <button
              onClick={() => handleBulkAction("abort")}
              disabled={selectedGrows.length === 0}
              className="text-sm px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Abort Selected
            </button>
            <button
              onClick={() => handleBulkAction("complete")}
              disabled={selectedGrows.length === 0}
              className="text-sm px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Complete Selected
            </button>
          </div>
        </div>
      </div>

      {/* Grows Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={
                    selectedGrows.length === processedGrows.length &&
                    processedGrows.length > 0
                  }
                  onChange={handleSelectAll}
                  className="rounded border-gray-300"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Shelf
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Location
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Recipe
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Progress
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Timeline
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Env Score
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {processedGrows.map((grow) => {
              const isSelected = selectedGrows.includes(grow.id);

              return (
                <tr
                  key={grow.id}
                  className={`hover:bg-gray-50 ${isSelected ? "bg-blue-50" : ""}`}
                >
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onGrowSelect(grow.id, true)}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {grow.shelfName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{grow.farmName}</div>
                    <div className="text-sm text-gray-500">
                      {grow.rowName} • {grow.rackName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {grow.recipeName}
                    </div>
                    <div className="text-sm text-gray-500">
                      {grow.speciesName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: STATUS_COLORS[grow.status] }}
                    >
                      {STATUS_LABELS[grow.status]}
                    </span>
                    {grow.criticalAlerts > 0 && (
                      <div className="mt-1 flex items-center">
                        <div className="w-2 h-2 bg-red-500 rounded-full mr-1" />
                        <span className="text-xs text-red-600">
                          {grow.criticalAlerts} alert(s)
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div
                          className="h-2 rounded-full"
                          style={{
                            width: `${grow.progress}%`,
                            backgroundColor: STATUS_COLORS[grow.status],
                          }}
                        />
                      </div>
                      <span className="text-sm text-gray-900">
                        {grow.progress}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      Day {grow.daysElapsed} of {grow.totalDays}
                    </div>
                    <div className="text-xs text-gray-500">
                      {grow.daysRemaining > 0
                        ? `${grow.daysRemaining} days left`
                        : "Completed"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`text-sm font-medium ${
                        grow.environmentalScore >= 80
                          ? "text-green-600"
                          : grow.environmentalScore >= 60
                            ? "text-yellow-600"
                            : "text-red-600"
                      }`}
                    >
                      {grow.environmentalScore}/100
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      {grow.status === "active" && (
                        <>
                          <button
                            onClick={() => onGrowAction(grow.id, "complete")}
                            className="text-green-600 hover:text-green-900"
                          >
                            Complete
                          </button>
                          <button
                            onClick={() => onGrowAction(grow.id, "abort")}
                            className="text-red-600 hover:text-red-900"
                          >
                            Abort
                          </button>
                        </>
                      )}
                      {grow.status === "planned" && (
                        <button
                          onClick={() => onGrowAction(grow.id, "start")}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Start
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {processedGrows.length === 0 && (
        <div className="p-8 text-center text-gray-500">
          No grows found matching the current filters.
        </div>
      )}
    </div>
  );
};
