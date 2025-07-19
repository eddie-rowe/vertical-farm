"use client";

import { useState, useMemo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  User,
  Clock,
  AlertCircle,
  CheckCircle,
  Calendar,
  MapPin,
  Edit,
  Eye,
} from "lucide-react";
import { FarmSearchAndFilter } from "@/components/ui/farm-search-and-filter";
import { useFarmSearch, useFarmFilters } from "@/hooks";
import type { FilterDefinition } from "@/components/ui/farm-search-and-filter";

// Mock data for task assignments
const taskData = {
  summary: {
    totalTasks: 32,
    inProgress: 15,
    completed: 12,
    overdue: 5,
  },
  assignments: [
    {
      id: "TA001",
      taskName: "Weekly Nutrient System Calibration",
      assignedTo: "Mike Chen",
      priority: "high",
      dueDate: "2024-01-15",
      estimatedHours: 4,
      actualHours: 3.5,
      status: "in-progress",
      location: "Growth Towers 1-4",
      description: "Calibrate nutrient delivery systems and test pH levels",
      skills: ["System Maintenance", "Chemistry"],
    },
    {
      id: "TA002",
      taskName: "Harvest Quality Inspection",
      assignedTo: "Emily Davis",
      priority: "medium",
      dueDate: "2024-01-14",
      estimatedHours: 2,
      actualHours: 2.2,
      status: "completed",
      location: "Harvest Area",
      description: "Inspect harvested greens for quality standards",
      skills: ["Quality Control", "Plant Biology"],
    },
    {
      id: "TA003",
      taskName: "Climate Control System Check",
      assignedTo: "James Wilson",
      priority: "high",
      dueDate: "2024-01-13",
      estimatedHours: 3,
      actualHours: 0,
      status: "overdue",
      location: "Greenhouse A",
      description: "Check HVAC systems and sensor calibration",
      skills: ["Mechanical Repair", "Electronics"],
    },
    {
      id: "TA004",
      taskName: "Data Analysis Report",
      assignedTo: "Alex Rodriguez",
      priority: "medium",
      dueDate: "2024-01-16",
      estimatedHours: 6,
      actualHours: 2,
      status: "in-progress",
      location: "Control Room",
      description: "Analyze growth data and generate weekly insights report",
      skills: ["Data Analysis", "Reporting"],
    },
    {
      id: "TA005",
      taskName: "Seed Planting - Batch 47",
      assignedTo: "Sarah Johnson",
      priority: "low",
      dueDate: "2024-01-17",
      estimatedHours: 4,
      actualHours: 0,
      status: "scheduled",
      location: "Germination Area",
      description: "Plant new seed batch for lettuce production",
      skills: ["Planting", "Seed Management"],
    },
  ],
};

type TaskAssignment = (typeof taskData.assignments)[0];

export default function TaskAssignmentsView() {
  // Standardized search and filter hooks
  const {
    searchTerm,
    setSearchTerm,
    clearSearch,
    hasSearch,
    filterItems: searchFilterItems,
  } = useFarmSearch<TaskAssignment>({
    searchFields: ["taskName", "assignedTo", "location", "description"],
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
  } = useFarmFilters<TaskAssignment>();

  // Filter definitions
  const filterDefinitions: FilterDefinition[] = [
    {
      id: "priority",
      label: "Priority",
      placeholder: "Filter by priority...",
      options: [
        { value: "high", label: "High" },
        { value: "medium", label: "Medium" },
        { value: "low", label: "Low" },
      ],
    },
    {
      id: "status",
      label: "Status",
      placeholder: "Filter by status...",
      options: [
        { value: "scheduled", label: "Scheduled" },
        { value: "in-progress", label: "In Progress" },
        { value: "completed", label: "Completed" },
        { value: "overdue", label: "Overdue" },
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

  // Combined filtering
  const filteredAssignments = useMemo(() => {
    let result = taskData.assignments;

    // Apply search filter
    if (hasSearch) {
      result = searchFilterItems(result);
    }

    // Apply other filters
    if (hasActiveFilters) {
      result = filterFilterItems(result);
    }

    return result;
  }, [hasSearch, searchFilterItems, hasActiveFilters, filterFilterItems]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "in-progress":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "overdue":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      case "overdue":
        return <AlertCircle className="h-4 w-4" />;
      case "in-progress":
        return <Clock className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total Tasks
                </p>
                <p className="text-2xl font-bold">
                  {taskData.summary.totalTasks}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  In Progress
                </p>
                <p className="text-2xl font-bold">
                  {taskData.summary.inProgress}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Completed
                </p>
                <p className="text-2xl font-bold">
                  {taskData.summary.completed}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Overdue
                </p>
                <p className="text-2xl font-bold">{taskData.summary.overdue}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions Bar */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Task Assignments</h3>
        <div className="flex gap-2">
          <Button variant="outline">
            <User className="h-4 w-4 mr-2" />
            Assign Tasks
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Button>
        </div>
      </div>

      {/* Standardized Search and Filters */}
      <FarmSearchAndFilter
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search tasks, employees, or locations..."
        filters={filterDefinitions}
        activeFilters={getActiveFilterChips(filterDefinitions)}
        onFilterChange={handleFilterChange}
        onRemoveFilter={handleRemoveFilter}
        onClearAllFilters={clearAllFilters}
      />

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
        <span>
          Showing {filteredAssignments.length} of {taskData.assignments.length}{" "}
          tasks
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

      {/* Tasks Grid */}
      <div className="space-y-4">
        {filteredAssignments.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
                No Tasks Found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {taskData.assignments.length === 0
                  ? "No task assignments available."
                  : "No tasks match your current search and filters."}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredAssignments.map((task) => (
            <Card key={task.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-lg font-semibold">{task.taskName}</h3>
                      <Badge className={getPriorityColor(task.priority)}>
                        {task.priority.toUpperCase()}
                      </Badge>
                      <Badge className={getStatusColor(task.status)}>
                        {getStatusIcon(task.status)}
                        <span className="ml-1">
                          {task.status.replace("-", " ")}
                        </span>
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">
                          Assigned To
                        </p>
                        <p className="font-medium">{task.assignedTo}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">
                          Due Date
                        </p>
                        <p className="font-medium">
                          {new Date(task.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">
                          Location
                        </p>
                        <p className="font-medium">{task.location}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">
                          Progress
                        </p>
                        <p className="font-medium">
                          {task.actualHours}h / {task.estimatedHours}h
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        Description
                      </p>
                      <p className="text-sm">{task.description}</p>

                      {task.skills && task.skills.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                            Required Skills
                          </p>
                          <div className="flex gap-1 flex-wrap">
                            {task.skills.map((skill, index) => (
                              <Badge
                                key={index}
                                variant="outline"
                                className="text-xs"
                              >
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
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
