"use client";

import {
  Plus,
  User,
  TrendingUp,
  TrendingDown,
  Target,
  Award,
  Calendar,
  Star,
  BarChart3,
  Download,
} from "lucide-react";
import { useMemo, useCallback } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FarmSearchAndFilter } from "@/components/ui/farm-search-and-filter";
import type { FilterDefinition } from "@/components/ui/farm-search-and-filter";
import { useFarmSearch, useFarmFilters } from "@/hooks";

// Mock data for performance tracking
const performanceData = {
  summary: {
    avgPerformance: 87.5,
    topPerformers: 3,
    needsImprovement: 1,
    completedGoals: 24,
  },
  employees: [
    {
      id: "PF001",
      name: "Sarah Johnson",
      role: "Farm Manager",
      overallScore: 94,
      trend: "up",
      trendValue: 5.2,
      goals: {
        completed: 8,
        total: 10,
        percentage: 80,
      },
      metrics: {
        productivity: 96,
        quality: 92,
        teamwork: 95,
        punctuality: 98,
        initiative: 91,
      },
      achievements: [
        "Employee of the Month",
        "Leadership Excellence",
        "Innovation Award",
      ],
      lastReview: "2024-01-01",
      nextReview: "2024-04-01",
      feedback:
        "Exceptional leadership and team coordination. Consistently exceeds expectations.",
    },
    {
      id: "PF002",
      name: "Mike Chen",
      role: "Growth Technician",
      overallScore: 89,
      trend: "up",
      trendValue: 3.1,
      goals: {
        completed: 7,
        total: 8,
        percentage: 87.5,
      },
      metrics: {
        productivity: 91,
        quality: 95,
        teamwork: 85,
        punctuality: 92,
        initiative: 88,
      },
      achievements: ["Technical Excellence", "Safety Champion"],
      lastReview: "2024-01-01",
      nextReview: "2024-04-01",
      feedback:
        "Strong technical skills and attention to detail. Great problem-solving abilities.",
    },
    {
      id: "PF003",
      name: "Emily Davis",
      role: "Harvest Specialist",
      overallScore: 85,
      trend: "stable",
      trendValue: 0.5,
      goals: {
        completed: 6,
        total: 8,
        percentage: 75,
      },
      metrics: {
        productivity: 88,
        quality: 90,
        teamwork: 80,
        punctuality: 85,
        initiative: 82,
      },
      achievements: ["Quality Specialist"],
      lastReview: "2024-01-01",
      nextReview: "2024-04-01",
      feedback:
        "Consistent performance with high attention to quality standards.",
    },
    {
      id: "PF004",
      name: "James Wilson",
      role: "Maintenance Tech",
      overallScore: 78,
      trend: "down",
      trendValue: -2.1,
      goals: {
        completed: 4,
        total: 8,
        percentage: 50,
      },
      metrics: {
        productivity: 75,
        quality: 82,
        teamwork: 78,
        punctuality: 80,
        initiative: 75,
      },
      achievements: [],
      lastReview: "2024-01-01",
      nextReview: "2024-04-01",
      feedback:
        "Needs improvement in productivity and goal completion. Additional training recommended.",
    },
    {
      id: "PF005",
      name: "Alex Rodriguez",
      role: "Growth Technician",
      overallScore: 91,
      trend: "up",
      trendValue: 4.3,
      goals: {
        completed: 9,
        total: 10,
        percentage: 90,
      },
      metrics: {
        productivity: 93,
        quality: 89,
        teamwork: 92,
        punctuality: 95,
        initiative: 90,
      },
      achievements: ["Top Performer", "Team Player"],
      lastReview: "2024-01-01",
      nextReview: "2024-04-01",
      feedback:
        "Excellent performance across all metrics. Great team contributor.",
    },
  ],
};

type PerformanceEmployee = (typeof performanceData.employees)[0];

export default function PerformanceView() {
  // Standardized search and filter hooks
  const {
    searchTerm,
    setSearchTerm,
    clearSearch,
    hasSearch,
    filterItems: searchFilterItems,
  } = useFarmSearch<PerformanceEmployee>({
    searchFields: ["name", "role", "feedback"],
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
  } = useFarmFilters<PerformanceEmployee>();

  // Filter definitions
  const filterDefinitions: FilterDefinition[] = [
    {
      id: "performance",
      label: "Performance Level",
      placeholder: "Filter by performance...",
      options: [
        { value: "excellent", label: "Excellent (90+)" },
        { value: "good", label: "Good (80-89)" },
        { value: "average", label: "Average (70-79)" },
        { value: "needs-improvement", label: "Needs Improvement (<70)" },
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
  const filteredEmployees = useMemo(() => {
    let result = performanceData.employees;

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

  const getPerformanceColor = (score: number) => {
    if (score >= 90)
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    if (score >= 80)
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    if (score >= 70)
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
  };

  const getPerformanceLabel = (score: number) => {
    if (score >= 90) return "Excellent";
    if (score >= 80) return "Good";
    if (score >= 70) return "Average";
    return "Needs Improvement";
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Target className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Avg Performance
                </p>
                <p className="text-2xl font-bold">
                  {performanceData.summary.avgPerformance}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Top Performers
                </p>
                <p className="text-2xl font-bold">
                  {performanceData.summary.topPerformers}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Needs Improvement
                </p>
                <p className="text-2xl font-bold">
                  {performanceData.summary.needsImprovement}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Completed Goals
                </p>
                <p className="text-2xl font-bold">
                  {performanceData.summary.completedGoals}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions Bar */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Team Performance</h3>
        <div className="flex gap-2">
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Schedule Reviews
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Goal
          </Button>
        </div>
      </div>

      {/* Standardized Search and Filters */}
      <FarmSearchAndFilter
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search employees by name, role, or feedback..."
        filters={filterDefinitions}
        activeFilters={getActiveFilterChips(filterDefinitions)}
        onFilterChange={handleFilterChange}
        onRemoveFilter={handleRemoveFilter}
        onClearAllFilters={clearAllFilters}
      />

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
        <span>
          Showing {filteredEmployees.length} of{" "}
          {performanceData.employees.length} employees
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

      {/* Performance Cards */}
      <div className="space-y-4">
        {filteredEmployees.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
                No Employees Found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {performanceData.employees.length === 0
                  ? "No employee performance data available."
                  : "No employees match your current search and filters."}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredEmployees.map((employee) => (
            <Card
              key={employee.id}
              className="hover:shadow-lg transition-shadow"
            >
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-lg font-semibold">{employee.name}</h3>
                      <Badge
                        className={getPerformanceColor(employee.overallScore)}
                      >
                        {employee.overallScore}% -{" "}
                        {getPerformanceLabel(employee.overallScore)}
                      </Badge>
                      <div className="flex items-center gap-1">
                        {getTrendIcon(employee.trend)}
                        <span
                          className={`text-sm ${
                            employee.trend === "up"
                              ? "text-green-600"
                              : employee.trend === "down"
                                ? "text-red-600"
                                : "text-gray-600"
                          }`}
                        >
                          {employee.trend === "up"
                            ? "+"
                            : employee.trend === "down"
                              ? "-"
                              : ""}
                          {Math.abs(employee.trendValue)}%
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm mb-4">
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Role</p>
                        <p className="font-medium">{employee.role}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">
                          Goals Progress
                        </p>
                        <p className="font-medium">
                          {employee.goals.completed}/{employee.goals.total} (
                          {employee.goals.percentage}%)
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">
                          Last Review
                        </p>
                        <p className="font-medium">
                          {new Date(employee.lastReview).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">
                          Next Review
                        </p>
                        <p className="font-medium">
                          {new Date(employee.nextReview).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Performance Metrics */}
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        Performance Metrics
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {Object.entries(employee.metrics).map(
                          ([metric, score]) => (
                            <div key={metric} className="text-center">
                              <p className="text-xs text-gray-500 capitalize">
                                {metric}
                              </p>
                              <p className="font-semibold text-lg">{score}%</p>
                            </div>
                          ),
                        )}
                      </div>
                    </div>

                    {/* Achievements */}
                    {employee.achievements.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          Achievements
                        </p>
                        <div className="flex gap-1 flex-wrap">
                          {employee.achievements.map((achievement, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="text-xs"
                            >
                              <Award className="h-3 w-3 mr-1" />
                              {achievement}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Feedback */}
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        Latest Feedback
                      </p>
                      <p className="text-sm">{employee.feedback}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <BarChart3 className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Calendar className="h-4 w-4" />
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
