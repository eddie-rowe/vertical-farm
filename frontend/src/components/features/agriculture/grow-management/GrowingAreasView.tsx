"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  FarmSearchAndFilter,
  type FilterDefinition,
} from "@/components/ui/farm-search-and-filter";
import { useFarmSearch, useFarmFilters } from "@/hooks";
import {
  Activity,
  Calendar,
  Clock,
  Thermometer,
  Droplets,
  Sun,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  BarChart3,
  Grid3X3,
  List,
  ChevronDown,
  ChevronUp,
  Power,
  Settings,
  TrendingUp,
  Zap,
  Wifi,
  WifiOff,
} from "lucide-react";

// Use proper service imports following project patterns
import { FarmService } from "@/services/domain/farm/FarmService";

interface GrowingAreaData {
  id: string;
  shelfId: string;
  shelfName: string;
  rackName: string;
  rowName: string;
  farmName: string;
  recipeName: string;
  speciesName: string;
  startDate: string;
  endDate: string;
  status: "planned" | "active" | "completed" | "aborted";
  progress: number;
  daysElapsed: number;
  daysRemaining: number;
  totalDays: number;
  yield?: number;
  automationEnabled: boolean;
  criticalAlerts: number;
  environmentalScore: number;
  notes?: string;
  environmentalData: {
    temperature: number;
    humidity: number;
    lightLevel: number;
    airflow: number;
    ph: number;
    ec: number;
  };
  automationSettings: {
    lightHours: number;
    wateringFrequency: number;
    temperatureMin: number;
    temperatureMax: number;
    humidityTarget: number;
  };
  recentEvents: {
    timestamp: string;
    type: string;
    message: string;
    severity: "info" | "warning" | "error";
  }[];
  lastUpdated: string;
  // Enhanced data for trends
  temperatureTrend: number[]; // Last 24 hours
  humidityTrend: number[];
  isOnline: boolean;
}

interface GrowingAreasViewProps {
  onNavigateToTab: (tab: string) => void;
}

export default function GrowingAreasView({
  onNavigateToTab,
}: GrowingAreasViewProps) {
  const [growingAreas, setGrowingAreas] = useState<GrowingAreaData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<
    "progress" | "harvest" | "alerts" | "environmental"
  >("progress");
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  // Search and filter hooks
  const {
    searchTerm,
    setSearchTerm,
    clearSearch,
    filterItems: searchFilterItems,
    hasSearch,
  } = useFarmSearch<GrowingAreaData>({
    searchFields: ["speciesName", "farmName", "recipeName"],
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
  } = useFarmFilters<GrowingAreaData>();

  // Filter definitions for FarmSearchAndFilter
  const filterDefinitions: FilterDefinition[] = useMemo(
    () => [
      {
        id: "status",
        label: "Status",
        placeholder: "Filter by status",
        options: [
          { value: "all", label: "All Status" },
          { value: "active", label: "Active" },
          { value: "planned", label: "Planned" },
          { value: "completed", label: "Completed" },
          { value: "aborted", label: "Aborted" },
        ],
        defaultValue: "all",
      },
      {
        id: "alerts",
        label: "Alerts",
        placeholder: "Filter by alerts",
        options: [
          { value: "all", label: "All Alerts" },
          { value: "has_alerts", label: "Has Alerts" },
          { value: "no_alerts", label: "No Alerts" },
        ],
        defaultValue: "all",
      },
    ],
    [],
  );

  // Handle filter changes
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

  // Handle filter chip removal
  const handleRemoveFilter = useCallback(
    (filterId: string) => {
      removeFilter(filterId);
    },
    [removeFilter],
  );

  // Custom filter function for complex logic
  const customFilterFunction = useCallback(
    (area: GrowingAreaData, filterValues: any[]) => {
      return filterValues.every((filter) => {
        if (!filter.value || filter.value === "all") return true;

        switch (filter.id) {
          case "status":
            return area.status === filter.value;
          case "alerts":
            if (filter.value === "has_alerts") return area.criticalAlerts > 0;
            if (filter.value === "no_alerts") return area.criticalAlerts === 0;
            return true;
          default:
            return true;
        }
      });
    },
    [],
  );

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      handleRefresh();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Fetch growing areas data using proper service pattern
  const fetchGrowingAreas = useCallback(async () => {
    setIsLoading(true);
    try {
      const farmService = FarmService.getInstance();
      const farms = await farmService.getAll();

      if (!farms || farms.length === 0) {
        setGrowingAreas([]);
        return;
      }

      // For now, create enhanced mock data based on farm structure
      // This will be replaced with real data from schedules and grows
      const mockGrowingAreas: GrowingAreaData[] = farms
        .slice(0, 3)
        .map((farm: any, index: number) => ({
          id: `area-${index + 1}`,
          shelfId: `shelf-${index + 1}`,
          shelfName: `Shelf ${index + 1}`,
          rackName: `Rack ${index + 1}`,
          rowName: `Row A${index + 1}`,
          farmName: farm.name,
          recipeName: ["Lettuce Mix", "Basil Premium", "Spinach Baby"][index],
          speciesName: ["Lettuce", "Basil", "Spinach"][index],
          startDate: new Date(
            Date.now() - (index + 1) * 7 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          endDate: new Date(
            Date.now() + (30 - (index + 1) * 7) * 24 * 60 * 60 * 1000,
          ).toISOString(),
          status: ["active", "active", "planned"][index] as
            | "active"
            | "planned",
          progress: [65, 45, 10][index],
          daysElapsed: [(index + 1) * 7, (index + 1) * 5, index + 1][index],
          daysRemaining: [15, 25, 29][index],
          totalDays: [50, 45, 30][index],
          automationEnabled: true,
          criticalAlerts: [0, 1, 0][index],
          environmentalScore: [92, 87, 95][index],
          isOnline: [true, true, false][index],
          environmentalData: {
            temperature: 22 + index,
            humidity: 65 + index * 2,
            lightLevel: 85 - index * 5,
            airflow: 70 + index,
            ph: 6.2 + index * 0.1,
            ec: 1.8 + index * 0.2,
          },
          automationSettings: {
            lightHours: 16 - index,
            wateringFrequency: 3 + index,
            temperatureMin: 18 + index,
            temperatureMax: 26 + index,
            humidityTarget: 65 + index * 2,
          },
          // Mock trend data for mini charts
          temperatureTrend: Array.from(
            { length: 24 },
            (_, i) => 22 + index + Math.sin(i / 4) * 2 + (Math.random() - 0.5),
          ),
          humidityTrend: Array.from(
            { length: 24 },
            (_, i) =>
              65 + index * 2 + Math.cos(i / 6) * 5 + (Math.random() - 0.5) * 2,
          ),
          recentEvents: [
            {
              timestamp: new Date(
                Date.now() - index * 60 * 60 * 1000,
              ).toISOString(),
              type: ["watering", "light_adjustment", "monitoring"][index],
              message: [
                "Watering cycle completed",
                "Light intensity adjusted",
                "Temperature check",
              ][index],
              severity: "info" as const,
            },
          ],
          lastUpdated: new Date().toISOString(),
        }));

      setGrowingAreas(mockGrowingAreas);
    } catch (error) {
      console.error("Error fetching growing areas:", error);
      setGrowingAreas([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGrowingAreas();
  }, [fetchGrowingAreas]);

  const handleRefresh = async () => {
    setLastRefresh(new Date());
    await fetchGrowingAreas();
  };

  const toggleCardExpansion = (areaId: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(areaId)) {
      newExpanded.delete(areaId);
    } else {
      newExpanded.add(areaId);
    }
    setExpandedCards(newExpanded);
  };

  const getEnvironmentalStatus = (score: number) => {
    if (score >= 90) return { status: "excellent", color: "text-green-600" };
    if (score >= 75) return { status: "good", color: "text-blue-600" };
    if (score >= 60) return { status: "fair", color: "text-yellow-600" };
    return { status: "poor", color: "text-red-600" };
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return "bg-green-500";
    if (progress >= 50) return "bg-blue-500";
    if (progress >= 25) return "bg-yellow-500";
    return "bg-gray-400";
  };

  // Mini trend chart component
  const MiniTrendChart = ({
    data,
    color = "rgb(59, 130, 246)",
  }: {
    data: number[];
    color?: string;
  }) => {
    if (!data || data.length === 0) return null;

    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;

    const points = data
      .map((value, index) => {
        const x = (index / (data.length - 1)) * 48; // 48px width
        const y = 24 - ((value - min) / range) * 20; // 24px height, 20px for the line
        return `${x},${y}`;
      })
      .join(" ");

    return (
      <svg width="48" height="24" className="inline-block">
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          className="opacity-70"
        />
      </svg>
    );
  };

  const StatsSummary = () => {
    const stats = useMemo(() => {
      const total = growingAreas.length;
      const active = growingAreas.filter(
        (area) => area.status === "active",
      ).length;
      const planned = growingAreas.filter(
        (area) => area.status === "planned",
      ).length;
      const online = growingAreas.filter((area) => area.isOnline).length;
      const alerts = growingAreas.reduce(
        (sum, area) => sum + area.criticalAlerts,
        0,
      );
      const avgProgress =
        total > 0
          ? Math.round(
              growingAreas.reduce((sum, area) => sum + area.progress, 0) /
                total,
            )
          : 0;
      const avgEnvironmental =
        total > 0
          ? Math.round(
              growingAreas.reduce(
                (sum, area) => sum + area.environmentalScore,
                0,
              ) / total,
            )
          : 0;

      return {
        total,
        active,
        planned,
        online,
        alerts,
        avgProgress,
        avgEnvironmental,
      };
    }, [growingAreas]);

    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Total Areas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">
              {stats.active}
            </div>
            <p className="text-xs text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-blue-600">
              {stats.planned}
            </div>
            <p className="text-xs text-muted-foreground">Planned</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-emerald-600">
              {stats.online}
            </div>
            <p className="text-xs text-muted-foreground">Online</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-red-600">
              {stats.alerts}
            </div>
            <p className="text-xs text-muted-foreground">Alerts</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.avgProgress}%</div>
            <p className="text-xs text-muted-foreground">Avg Progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">
              {stats.avgEnvironmental}%
            </div>
            <p className="text-xs text-muted-foreground">Env Score</p>
          </CardContent>
        </Card>
      </div>
    );
  };

  const GrowingAreaCard = ({ area }: { area: GrowingAreaData }) => {
    const envStatus = getEnvironmentalStatus(area.environmentalScore);
    const progressColor = getProgressColor(area.progress);
    const isExpanded = expandedCards.has(area.id);

    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              {area.speciesName}
              {area.isOnline ? (
                <Wifi className="w-4 h-4 text-green-500" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-500" />
              )}
            </CardTitle>
            <div className="flex items-center gap-2">
              {area.criticalAlerts > 0 && (
                <Badge variant="destructive" className="text-xs">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  {area.criticalAlerts}
                </Badge>
              )}
              <Badge
                variant={area.status === "active" ? "default" : "secondary"}
                className="text-xs"
              >
                {area.status}
              </Badge>
            </div>
          </div>
          <CardDescription>
            {area.farmName} • {area.rowName} • {area.rackName} •{" "}
            {area.shelfName}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Progress</span>
              <span>{area.progress}%</span>
            </div>
            <Progress value={area.progress} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{area.daysElapsed} days elapsed</span>
              <span>{area.daysRemaining} days remaining</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-red-500" />
              <span>{area.environmentalData.temperature}°C</span>
              <MiniTrendChart
                data={area.temperatureTrend}
                color="rgb(239, 68, 68)"
              />
            </div>
            <div className="flex items-center gap-2">
              <Droplets className="w-4 h-4 text-blue-500" />
              <span>{area.environmentalData.humidity}%</span>
              <MiniTrendChart
                data={area.humidityTrend}
                color="rgb(59, 130, 246)"
              />
            </div>
            <div className="flex items-center gap-2">
              <Sun className="w-4 h-4 text-yellow-500" />
              <span>{area.environmentalData.lightLevel}%</span>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-green-500" />
              <span className={envStatus.color}>
                {area.environmentalScore}%
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>
                Updated {new Date(area.lastUpdated).toLocaleTimeString()}
              </span>
            </div>
            {area.automationEnabled && (
              <div className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-green-500" />
                <span>Automated</span>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1">
              <BarChart3 className="w-4 h-4 mr-1" />
              Details
            </Button>
            <Button variant="outline" size="sm" className="flex-1">
              <Calendar className="w-4 h-4 mr-1" />
              Schedule
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleCardExpansion(area.id)}
              className="px-2"
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* Expanded Details (Progressive Disclosure) */}
          {isExpanded && (
            <div className="space-y-3 pt-3 border-t">
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
                  <Settings className="w-4 h-4" />
                  Automation Settings
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>Light: {area.automationSettings.lightHours}h/day</div>
                  <div>
                    Watering: {area.automationSettings.wateringFrequency}x/day
                  </div>
                  <div>
                    Temp: {area.automationSettings.temperatureMin}-
                    {area.automationSettings.temperatureMax}°C
                  </div>
                  <div>Humidity: {area.automationSettings.humidityTarget}%</div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  Recent Events
                </h4>
                <div className="space-y-1">
                  {area.recentEvents.map((event, index) => (
                    <div
                      key={index}
                      className="text-xs flex items-center gap-2"
                    >
                      <Badge variant="outline" className="text-xs">
                        {event.type}
                      </Badge>
                      <span>{event.message}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  disabled={!area.isOnline}
                >
                  <Power className="w-4 h-4 mr-1" />
                  Controls
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <Zap className="w-4 h-4 mr-1" />
                  Automate
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // Filter and sort areas using standardized filtering
  const filteredAndSortedAreas = useMemo(() => {
    let result = growingAreas;

    // Apply search filtering
    result = searchFilterItems(result);

    // Apply filter chips with custom logic
    if (filters.length > 0) {
      result = result.filter((area) => customFilterFunction(area, filters));
    }

    // Sort areas
    result.sort((a, b) => {
      switch (sortBy) {
        case "progress":
          return b.progress - a.progress;
        case "harvest":
          return a.daysRemaining - b.daysRemaining;
        case "alerts":
          return b.criticalAlerts - a.criticalAlerts;
        case "environmental":
          return b.environmentalScore - a.environmentalScore;
        default:
          return 0;
      }
    });

    return result;
  }, [growingAreas, searchFilterItems, filters, customFilterFunction, sortBy]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
          <p>Loading growing areas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Growing Areas</h2>
          <p className="text-muted-foreground">
            Monitor and manage active grows across all farms
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              checked={autoRefresh}
              onCheckedChange={setAutoRefresh}
              id="auto-refresh"
            />
            <label htmlFor="auto-refresh" className="text-sm">
              Auto-refresh (30s)
            </label>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw
              className={`w-4 h-4 mr-1 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button size="sm" onClick={() => onNavigateToTab("setup")}>
            Start New Grow
          </Button>
        </div>
      </div>

      <StatsSummary />

      {/* Search and Filters - Using Standardized Components */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Filter & Sort</h3>
            <div className="flex items-center gap-2">
              <Select
                value={sortBy}
                onValueChange={(
                  value: "progress" | "harvest" | "alerts" | "environmental",
                ) => setSortBy(value)}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="progress">By Progress</SelectItem>
                  <SelectItem value="harvest">By Harvest Date</SelectItem>
                  <SelectItem value="alerts">By Alerts</SelectItem>
                  <SelectItem value="environmental">By Env Score</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex border rounded-md">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="rounded-r-none"
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="rounded-l-none"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          <FarmSearchAndFilter
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchContext="growing areas"
            searchPlaceholder="Search by species, farm, or recipe..."
            filters={filterDefinitions}
            activeFilters={getActiveFilterChips(filterDefinitions)}
            onFilterChange={handleFilterChange}
            onRemoveFilter={handleRemoveFilter}
            onClearAllFilters={clearAllFilters}
            orientation="horizontal"
            showFilterChips={true}
          />
        </CardContent>
      </Card>

      {/* Results summary */}
      {(hasSearch || hasActiveFilters) && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {filteredAndSortedAreas.length} of {growingAreas.length}{" "}
            growing areas
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

      {/* Growing Areas Grid/List */}
      {filteredAndSortedAreas.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Growing Areas Found
              </h3>
              <p className="text-gray-500 mb-4">
                {growingAreas.length === 0
                  ? "No active grows found. Start your first grow to begin monitoring."
                  : "No areas match your current filters. Try adjusting your search criteria."}
              </p>
              <Button onClick={() => onNavigateToTab("setup")}>
                Start New Grow
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              : "space-y-4"
          }
        >
          {filteredAndSortedAreas.map((area) => (
            <GrowingAreaCard key={area.id} area={area} />
          ))}
        </div>
      )}

      {/* Additional Help Text */}
      {growingAreas.length > 0 && (
        <div className="text-center text-sm text-muted-foreground">
          <p>
            Showing {filteredAndSortedAreas.length} of {growingAreas.length}{" "}
            growing areas. Last updated: {lastRefresh.toLocaleTimeString()}
            {autoRefresh && " • Auto-refreshing every 30 seconds"}
          </p>
        </div>
      )}
    </div>
  );
}
