"use client";

import { useState, useMemo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Calendar,
  Clock,
  User,
  MapPin,
  Edit,
  Eye,
  RotateCcw,
} from "lucide-react";
import { FarmSearchAndFilter } from "@/components/ui/farm-search-and-filter";
import { useFarmSearch, useFarmFilters } from "@/hooks";
import type { FilterDefinition } from "@/components/ui/farm-search-and-filter";

// Mock data for team schedules
const scheduleData = {
  summary: {
    totalEmployees: 8,
    activeShifts: 12,
    weeklyHours: 320,
    overtimeHours: 24,
  },
  shifts: [
    {
      id: "SH001",
      employee: "Sarah Johnson",
      role: "Farm Manager",
      date: "2024-01-15",
      startTime: "06:00",
      endTime: "14:00",
      hours: 8,
      location: "General Supervision",
      status: "scheduled",
      type: "regular",
      notes: "Weekly team coordination",
    },
    {
      id: "SH002",
      employee: "Mike Chen",
      role: "Growth Technician",
      date: "2024-01-15",
      startTime: "07:00",
      endTime: "15:00",
      hours: 8,
      location: "Growth Towers 1-4",
      status: "active",
      type: "regular",
      notes: "Nutrient system maintenance",
    },
    {
      id: "SH003",
      employee: "Emily Davis",
      role: "Harvest Specialist",
      date: "2024-01-15",
      startTime: "05:00",
      endTime: "13:00",
      hours: 8,
      location: "Harvest Area",
      status: "completed",
      type: "regular",
      notes: "Morning harvest operations",
    },
    {
      id: "SH004",
      employee: "James Wilson",
      role: "Maintenance Tech",
      date: "2024-01-15",
      startTime: "14:00",
      endTime: "22:00",
      hours: 8,
      location: "Equipment Bay",
      status: "scheduled",
      type: "regular",
      notes: "Evening equipment maintenance",
    },
    {
      id: "SH005",
      employee: "Alex Rodriguez",
      role: "Growth Technician",
      date: "2024-01-16",
      startTime: "05:00",
      endTime: "15:00",
      hours: 10,
      location: "Growth Towers 5-8",
      status: "scheduled",
      type: "overtime",
      notes: "Extended maintenance window",
    },
  ],
  upcomingShifts: [
    {
      id: "SH006",
      employee: "Lisa Park",
      role: "Quality Controller",
      date: "2024-01-17",
      startTime: "08:00",
      endTime: "16:00",
      hours: 8,
      location: "Quality Lab",
      status: "scheduled",
      type: "regular",
      notes: "Product quality assessments",
    },
  ],
};

type Shift = (typeof scheduleData.shifts)[0];

export default function ScheduleView() {
  // Standardized search and filter hooks
  const {
    searchTerm,
    setSearchTerm,
    clearSearch,
    hasSearch,
    filterItems: searchFilterItems,
  } = useFarmSearch<Shift>({
    searchFields: ["employee", "role", "location", "notes"],
    caseSensitive: false,
  });

  const {
    filters,
    setFilter,
    removeFilter,
    clearAllFilters,
    getActiveFilterChips,
    filterItems: filterFilterItems,
    hasActiveFilters,
  } = useFarmFilters<Shift>();

  // Filter definitions
  const filterDefinitions: FilterDefinition[] = [
    {
      id: "status",
      label: "Shift Status",
      placeholder: "Filter by status...",
      options: [
        { value: "scheduled", label: "Scheduled" },
        { value: "active", label: "Active" },
        { value: "completed", label: "Completed" },
      ],
    },
    {
      id: "type",
      label: "Shift Type",
      placeholder: "Filter by type...",
      options: [
        { value: "regular", label: "Regular" },
        { value: "overtime", label: "Overtime" },
        { value: "early", label: "Early Start" },
      ],
    },
  ];

  // Filter change handlers
  const handleFilterChange = useCallback(
    (filterId: string, value: string) => {
      setFilter(filterId, value);
    },
    [setFilter],
  );

  const handleRemoveFilter = useCallback(
    (filterId: string) => {
      removeFilter(filterId);
    },
    [removeFilter],
  );

  // Combined all shifts
  const allShifts = [...scheduleData.shifts, ...scheduleData.upcomingShifts];

  // Combined filtering
  const filteredShifts = useMemo(() => {
    let result = allShifts;

    // Apply search filter
    if (hasSearch) {
      result = searchFilterItems(result);
    }

    // Apply other filters
    if (hasActiveFilters) {
      result = filterFilterItems(result);
    }

    return result;
  }, [
    allShifts,
    hasSearch,
    searchFilterItems,
    hasActiveFilters,
    filterFilterItems,
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "completed":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "overtime":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "early":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "regular":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total Employees
                </p>
                <p className="text-2xl font-bold">
                  {scheduleData.summary.totalEmployees}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Active Shifts
                </p>
                <p className="text-2xl font-bold">
                  {scheduleData.summary.activeShifts}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Weekly Hours
                </p>
                <p className="text-2xl font-bold">
                  {scheduleData.summary.weeklyHours}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Overtime Hours
                </p>
                <p className="text-2xl font-bold">
                  {scheduleData.summary.overtimeHours}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions Bar */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Team Schedule</h3>
        <div className="flex gap-2">
          <Button variant="outline">
            <RotateCcw className="h-4 w-4 mr-2" />
            Auto Schedule
          </Button>
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            View Calendar
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Shift
          </Button>
        </div>
      </div>

      {/* Standardized Search and Filters */}
      <FarmSearchAndFilter
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search employees, roles, or locations..."
        filters={filterDefinitions}
        activeFilters={getActiveFilterChips(filterDefinitions)}
        onFilterChange={handleFilterChange}
        onRemoveFilter={handleRemoveFilter}
        onClearAllFilters={clearAllFilters}
      />

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
        <span>
          Showing {filteredShifts.length} of {allShifts.length} shifts
        </span>
        {(hasSearch || hasActiveFilters) && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              clearSearch();
              clearAllFilters();
            }}
          >
            Clear all filters
          </Button>
        )}
      </div>

      {/* Today's Schedule */}
      <div className="space-y-4">
        {filteredShifts.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
                No Shifts Found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {allShifts.length === 0
                  ? "No shifts scheduled."
                  : "No shifts match your current search and filters."}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredShifts.map((shift) => (
            <Card key={shift.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-lg font-semibold">
                        {shift.employee}
                      </h3>
                      <Badge className={getStatusColor(shift.status)}>
                        {shift.status}
                      </Badge>
                      <Badge className={getTypeColor(shift.type)}>
                        {shift.type}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Role</p>
                        <p className="font-medium">{shift.role}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Date</p>
                        <p className="font-medium">
                          {new Date(shift.date).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Time</p>
                        <p className="font-medium">
                          {shift.startTime} - {shift.endTime}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">
                          Location
                        </p>
                        <p className="font-medium">{shift.location}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">
                          Hours
                        </p>
                        <p className="font-medium">{shift.hours}h</p>
                      </div>
                    </div>

                    {shift.notes && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          Notes
                        </p>
                        <p className="text-sm">{shift.notes}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
