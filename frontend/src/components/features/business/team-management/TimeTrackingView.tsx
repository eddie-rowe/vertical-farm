"use client";

import { useState, useMemo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  User,
  Clock,
  Play,
  Pause,
  Square,
  TrendingUp,
  Calendar,
  BarChart3,
  Download,
} from "lucide-react";

// ✅ NEW: Import standardized search and filter components
import {
  FarmSearchAndFilter,
  type FilterDefinition,
} from "@/components/ui/farm-search-and-filter";
import { useFarmSearch, useFarmFilters } from "@/hooks";

// ❌ OLD: Manual search and filter imports
// import { Input } from "@/components/ui/input";
// import { Search } from "lucide-react";

// Mock data for time tracking
const timeData = {
  summary: {
    totalHours: 312,
    activeEmployees: 6,
    avgProductivity: 87,
    overtime: 18,
  },
  employees: [
    {
      id: "E001",
      name: "Sarah Johnson",
      role: "Farm Manager",
      todayHours: 7.5,
      weekHours: 38.5,
      productivity: 92,
      status: "working",
      currentTask: "Team Coordination",
      checkIn: "06:00",
      breaks: 2,
      efficiency: "high",
    },
    {
      id: "E002",
      name: "Mike Chen",
      role: "Growth Technician",
      todayHours: 6.2,
      weekHours: 35.8,
      productivity: 89,
      status: "break",
      currentTask: "Nutrient System Check",
      checkIn: "07:00",
      breaks: 3,
      efficiency: "high",
    },
    {
      id: "E003",
      name: "Emily Davis",
      role: "Harvest Specialist",
      todayHours: 8.0,
      weekHours: 40.0,
      productivity: 95,
      status: "completed",
      currentTask: "Morning Harvest Complete",
      checkIn: "05:00",
      breaks: 2,
      efficiency: "excellent",
    },
    {
      id: "E004",
      name: "James Wilson",
      role: "Maintenance Tech",
      todayHours: 4.5,
      weekHours: 42.5,
      productivity: 78,
      status: "working",
      currentTask: "HVAC Maintenance",
      checkIn: "14:00",
      breaks: 1,
      efficiency: "medium",
    },
    {
      id: "E005",
      name: "Alex Rodriguez",
      role: "Data Analyst",
      todayHours: 5.8,
      weekHours: 33.2,
      productivity: 88,
      status: "working",
      currentTask: "Weekly Report Analysis",
      checkIn: "09:00",
      breaks: 2,
      efficiency: "high",
    },
  ],
  timeEntries: [
    {
      id: "TE001",
      employee: "Mike Chen",
      task: "Nutrient System Calibration",
      startTime: "07:30",
      endTime: "11:15",
      duration: 3.75,
      date: "2024-01-15",
      notes: "Completed calibration on towers 1-4",
    },
    {
      id: "TE002",
      employee: "Emily Davis",
      task: "Quality Inspection",
      startTime: "05:00",
      endTime: "07:30",
      duration: 2.5,
      date: "2024-01-15",
      notes: "Inspected lettuce batch 46",
    },
  ],
};

export default function TimeTrackingView() {
  // ✅ NEW: Replace manual search/filter state with standardized hooks
  const {
    searchTerm,
    setSearchTerm,
    clearSearch,
    filterItems: searchFilterItems,
    hasSearch,
  } = useFarmSearch<(typeof timeData.employees)[0]>({
    searchFields: ["name", "role", "currentTask"],
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
  } = useFarmFilters<(typeof timeData.employees)[0]>();

  // ✅ NEW: Filter definitions for FarmSearchAndFilter
  const filterDefinitions: FilterDefinition[] = useMemo(
    () => [
      {
        id: "status",
        label: "Status",
        placeholder: "Filter by status",
        options: [
          { value: "all", label: "All Status" },
          { value: "working", label: "Working" },
          { value: "break", label: "On Break" },
          { value: "completed", label: "Completed" },
        ],
        defaultValue: "all",
      },
    ],
    [],
  );

  // ✅ NEW: Handle filter changes
  const handleFilterChange = useCallback(
    (filterId: string, value: string) => {
      if (value === "all") {
        removeFilter(filterId);
      } else {
        setFilter(filterId, value);
      }
    },
    [setFilter, removeFilter],
  );

  const handleRemoveFilter = useCallback(
    (filterId: string) => {
      removeFilter(filterId);
    },
    [removeFilter],
  );

  // ✅ NEW: Combined filtering using both search and filters
  const filteredEmployees = useMemo(() => {
    let result = timeData.employees;
    result = searchFilterItems(result);
    result = filterFilterItems(result);
    return result;
  }, [timeData.employees, searchFilterItems, filterFilterItems]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "working":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "break":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "completed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getEfficiencyColor = (efficiency: string) => {
    switch (efficiency) {
      case "excellent":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "high":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "low":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "working":
        return <Play className="h-4 w-4" />;
      case "break":
        return <Pause className="h-4 w-4" />;
      case "completed":
        return <Square className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total Hours
                </p>
                <p className="text-2xl font-bold">
                  {timeData.summary.totalHours}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Active Employees
                </p>
                <p className="text-2xl font-bold">
                  {timeData.summary.activeEmployees}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Avg Productivity
                </p>
                <p className="text-2xl font-bold">
                  {timeData.summary.avgProductivity}%
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
                  {timeData.summary.overtime}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions Bar */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Live Time Tracking</h3>
        <div className="flex gap-2">
          <Button variant="outline">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Manual Entry
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      {/* ✅ NEW: Use FarmSearchAndFilter component */}
      {/* ✅ NEW: Standardized Search and Filter Component */}
      <Card>
        <CardContent className="pt-4">
          <FarmSearchAndFilter
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchContext="employees, roles, or tasks"
            searchPlaceholder="Search employees, roles, or tasks..."
            filters={filterDefinitions}
            activeFilters={getActiveFilterChips(filterDefinitions)}
            onFilterChange={handleFilterChange}
            onRemoveFilter={handleRemoveFilter}
            onClearAllFilters={clearAllFilters}
            orientation="horizontal"
            showFilterChips={true}
          />

          {/* Results summary */}
          {(hasSearch || hasActiveFilters) && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-gray-600">
                Showing {filteredEmployees.length} of{" "}
                {timeData.employees.length} employees
              </p>
              {(hasSearch || hasActiveFilters) && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    clearSearch();
                    clearAllFilters();
                  }}
                >
                  Clear all filters
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Employee Time Cards */}
      <div className="grid gap-4">
        {filteredEmployees.map((employee) => (
          <Card key={employee.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <h4 className="font-semibold text-lg">{employee.name}</h4>
                    <Badge variant="outline">{employee.role}</Badge>
                    <Badge
                      className={`${getStatusColor(employee.status)} flex items-center gap-1`}
                    >
                      {getStatusIcon(employee.status)}
                      {employee.status}
                    </Badge>
                    <Badge className={getEfficiencyColor(employee.efficiency)}>
                      {employee.efficiency} efficiency
                    </Badge>
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Current Task:{" "}
                    <span className="font-medium">{employee.currentTask}</span>
                  </p>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">
                        Check-in
                      </p>
                      <p className="font-medium">{employee.checkIn}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Today</p>
                      <p className="font-medium">{employee.todayHours}h</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">
                        This Week
                      </p>
                      <p className="font-medium">{employee.weekHours}h</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">
                        Productivity
                      </p>
                      <p className="font-medium">{employee.productivity}%</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Breaks</p>
                      <p className="font-medium">{employee.breaks}</p>
                    </div>
                  </div>

                  {/* Productivity Bar */}
                  <div className="mt-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Daily Productivity</span>
                      <span>{employee.productivity}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${employee.productivity}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  {employee.status === "working" ? (
                    <Button variant="outline" size="sm">
                      <Pause className="h-4 w-4 mr-1" />
                      Break
                    </Button>
                  ) : employee.status === "break" ? (
                    <Button variant="outline" size="sm">
                      <Play className="h-4 w-4 mr-1" />
                      Resume
                    </Button>
                  ) : null}
                  <Button variant="ghost" size="sm">
                    <Calendar className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Time Entries */}
      <Card>
        <CardContent className="p-6">
          <h4 className="font-semibold text-lg mb-4">Recent Time Entries</h4>
          <div className="space-y-3">
            {timeData.timeEntries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div>
                    <p className="font-medium">{entry.employee}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {entry.task}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">{entry.duration}h</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {entry.startTime} - {entry.endTime}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
