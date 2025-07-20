"use client";

import {
  AlertTriangle,
  CheckCircle,
  Filter,
  Download,
  Clock,
  Thermometer,
  Droplets,
  Zap,
  Settings2,
} from "lucide-react";
import { useMemo, useCallback } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// ✅ NEW: Import standardized search/filter components and hooks
import {
  FarmSearchAndFilter,
  type FilterDefinition,
} from "@/components/ui/farm-search-and-filter";
import { PageHeader } from "@/components/ui/PageHeader";
import { useFarmSearch, useFarmFilters } from "@/hooks";

interface AlertRecord {
  id: string;
  title: string;
  description: string;
  type: "critical" | "warning" | "info" | "resolved";
  category:
    | "environmental"
    | "equipment"
    | "growth"
    | "maintenance"
    | "security";
  source: string;
  location: string;
  timestamp: Date;
  resolvedAt?: Date;
  acknowledgedBy?: string;
  actions: string[];
}

// Mock alert history data for agriculture operations
const mockAlertHistory: AlertRecord[] = [
  {
    id: "ALT-2024-001",
    title: "Temperature Critical Alert",
    description:
      "Grow chamber 3 temperature exceeded 32°C for 15 minutes. Cooling system activated.",
    type: "critical",
    category: "environmental",
    source: "Environmental Control System",
    location: "Grow Chamber 3",
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    resolvedAt: new Date(Date.now() - 2 * 60 * 1000),
    acknowledgedBy: "Sarah Chen",
    actions: [
      "Activated backup cooling",
      "Increased ventilation",
      "Monitored crop stress indicators",
    ],
  },
  {
    id: "ALT-2024-002",
    title: "Pump Maintenance Required",
    description:
      "Nutrient pump P-204 flow rate dropped to 85% of normal. Scheduled for maintenance.",
    type: "warning",
    category: "equipment",
    source: "Equipment Monitor",
    location: "Nutrient Station 2",
    timestamp: new Date(Date.now() - 45 * 60 * 1000),
    acknowledgedBy: "Mike Rodriguez",
    actions: [
      "Scheduled maintenance for tomorrow",
      "Activated backup pump",
      "Documented performance data",
    ],
  },
  {
    id: "ALT-2024-003",
    title: "Harvest Window Opening",
    description:
      "Lettuce crop in Zone B reaching optimal harvest maturity in 48 hours.",
    type: "info",
    category: "growth",
    source: "Growth Tracking System",
    location: "Growing Zone B",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    actions: ["Notified harvest team", "Updated production schedule"],
  },
  {
    id: "ALT-2024-004",
    title: "pH Level Fluctuation",
    description:
      "Nutrient solution pH varied outside optimal range (5.5-6.5) for 30 minutes.",
    type: "resolved",
    category: "environmental",
    source: "Nutrient Management",
    location: "Reservoir Tank 1",
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
    resolvedAt: new Date(Date.now() - 3.5 * 60 * 60 * 1000),
    acknowledgedBy: "Lisa Park",
    actions: [
      "Adjusted pH buffer",
      "Calibrated sensors",
      "Increased monitoring frequency",
    ],
  },
  {
    id: "ALT-2024-005",
    title: "Security Door Alert",
    description: "Grow chamber access door left open for over 10 minutes.",
    type: "warning",
    category: "security",
    source: "Security System",
    location: "Grow Chamber 1",
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
    resolvedAt: new Date(Date.now() - 5.8 * 60 * 60 * 1000),
    acknowledgedBy: "David Kim",
    actions: [
      "Secured door",
      "Reviewed access logs",
      "Reminded staff of protocols",
    ],
  },
];

function getAlertIcon(type: AlertRecord["type"]) {
  switch (type) {
    case "critical":
      return <AlertTriangle className="h-4 w-4 text-red-600" />;
    case "warning":
      return <AlertTriangle className="h-4 w-4 text-orange-500" />;
    case "info":
      return <CheckCircle className="h-4 w-4 text-blue-500" />;
    case "resolved":
      return <CheckCircle className="h-4 w-4 text-green-600" />;
  }
}

function getCategoryIcon(category: AlertRecord["category"]) {
  switch (category) {
    case "environmental":
      return <Thermometer className="h-4 w-4" />;
    case "equipment":
      return <Settings2 className="h-4 w-4" />;
    case "growth":
      return <Droplets className="h-4 w-4" />;
    case "maintenance":
      return <Zap className="h-4 w-4" />;
    case "security":
      return <AlertTriangle className="h-4 w-4" />;
  }
}

function getTypeStyles(type: AlertRecord["type"]) {
  switch (type) {
    case "critical":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    case "warning":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
    case "info":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    case "resolved":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
  }
}

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

export default function AlertHistoryPage() {
  // ✅ NEW: Replace manual search/filter state with standardized hooks
  const {
    searchTerm,
    setSearchTerm,
    clearSearch,
    filterItems: searchFilterItems,
    hasSearch,
  } = useFarmSearch<AlertRecord>({
    searchFields: ["title", "description", "location"],
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
  } = useFarmFilters<AlertRecord>();

  // ✅ NEW: Filter definitions for FarmSearchAndFilter
  const filterDefinitions: FilterDefinition[] = useMemo(
    () => [
      {
        id: "type",
        label: "Alert Type",
        placeholder: "Filter by type",
        options: [
          { value: "all", label: "All Types" },
          { value: "critical", label: "Critical" },
          { value: "warning", label: "Warning" },
          { value: "info", label: "Info" },
          { value: "resolved", label: "Resolved" },
        ],
        defaultValue: "all",
      },
      {
        id: "category",
        label: "Category",
        placeholder: "Filter by category",
        options: [
          { value: "all", label: "All Categories" },
          { value: "environmental", label: "Environmental" },
          { value: "equipment", label: "Equipment" },
          { value: "growth", label: "Growth" },
          { value: "maintenance", label: "Maintenance" },
          { value: "security", label: "Security" },
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

  // ✅ NEW: Apply combined filtering
  const filteredAlerts = useMemo(() => {
    let result = mockAlertHistory;

    // Apply search filtering
    result = searchFilterItems(result);

    // Apply standard filters
    result = filterFilterItems(result);

    return result;
  }, [searchFilterItems, filterFilterItems]);

  return (
    <div className="container mx-auto p-6">
      <PageHeader
        title="Alert History"
        description="Operational alert log for compliance, troubleshooting, and system monitoring."
        size="md"
      />

      {/* ✅ NEW: Standardized Search and Filter Component */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FarmSearchAndFilter
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchContext="alerts, locations, descriptions"
            searchPlaceholder="Search alerts, locations, descriptions..."
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
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Showing {filteredAlerts.length} of {mockAlertHistory.length}{" "}
                alerts
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

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total Alerts
                </p>
                <p className="text-2xl font-bold">{filteredAlerts.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Critical
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {filteredAlerts.filter((a) => a.type === "critical").length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Resolved
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {filteredAlerts.filter((a) => a.type === "resolved").length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <Button variant="outline" size="sm" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Export Log
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alert History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Alert Records</CardTitle>
          <CardDescription>
            Showing {filteredAlerts.length} alert
            {filteredAlerts.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {getAlertIcon(alert.type)}
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-gray-100">
                        {alert.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        ID: {alert.id} • {alert.location}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getTypeStyles(alert.type)}>
                      {alert.type.charAt(0).toUpperCase() + alert.type.slice(1)}
                    </Badge>
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <Clock className="h-4 w-4 mr-1" />
                      {formatDateTime(alert.timestamp)}
                    </div>
                  </div>
                </div>

                <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                  {alert.description}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-gray-600 dark:text-gray-400">
                      Source System
                    </p>
                    <p className="flex items-center gap-1">
                      {getCategoryIcon(alert.category)}
                      {alert.source}
                    </p>
                  </div>

                  {alert.acknowledgedBy && (
                    <div>
                      <p className="font-medium text-gray-600 dark:text-gray-400">
                        Acknowledged By
                      </p>
                      <p>{alert.acknowledgedBy}</p>
                    </div>
                  )}

                  {alert.resolvedAt && (
                    <div>
                      <p className="font-medium text-gray-600 dark:text-gray-400">
                        Resolved
                      </p>
                      <p>{formatDateTime(alert.resolvedAt)}</p>
                    </div>
                  )}
                </div>

                {alert.actions.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <p className="font-medium text-gray-600 dark:text-gray-400 mb-2">
                      Actions Taken
                    </p>
                    <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 space-y-1">
                      {alert.actions.map((action, index) => (
                        <li key={index}>{action}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>

          {filteredAlerts.length === 0 && (
            <div className="text-center py-12">
              <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No alerts found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Try adjusting your search criteria or filters.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
