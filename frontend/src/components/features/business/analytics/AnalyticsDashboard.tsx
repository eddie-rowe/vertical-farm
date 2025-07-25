import React, { useState, useMemo } from "react";
import {
  FaThermometerHalf,
  FaTint,
  FaSun,
  FaLeaf,
  FaExclamationTriangle,
  FaCheckCircle,
  FaExpand,
  FaRedo,
} from "react-icons/fa";

import { DataChart } from "./DataChart";

// Types
interface KPIMetric {
  id: string;
  title: string;
  value: string | number;
  previousValue?: string | number;
  unit?: string;
  trend: "up" | "down" | "stable";
  trendValue: string;
  status: "good" | "warning" | "critical";
  icon: React.ReactNode;
}

interface ChartWidget {
  id: string;
  title: string;
  type: "line" | "bar" | "pie" | "area";
  data: any[];
  config: Record<string, any>;
  size: "small" | "medium" | "large";
  refreshable?: boolean;
}

interface InsightAlert {
  id: string;
  type: "insight" | "recommendation" | "alert";
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  action?: string;
  timestamp: number;
}

interface AnalyticsDashboardProps {
  farmId?: string;
  timeRange?: "1h" | "24h" | "7d" | "30d";
  layout?: "compact" | "standard" | "detailed";
  onWidgetClick?: (widgetId: string) => void;
  className?: string;
}

// Mock data generators
const generateKPIMetrics = (): KPIMetric[] => [
  {
    id: "yield",
    title: "Current Yield",
    value: 847,
    previousValue: 823,
    unit: "kg",
    trend: "up",
    trendValue: "+2.9%",
    status: "good",
    icon: <FaLeaf className="h-5 w-5" />,
  },
  {
    id: "temperature",
    title: "Avg Temperature",
    value: 22.5,
    previousValue: 23.1,
    unit: "°C",
    trend: "down",
    trendValue: "-0.6°C",
    status: "good",
    icon: <FaThermometerHalf className="h-5 w-5" />,
  },
  {
    id: "humidity",
    title: "Humidity Level",
    value: 68,
    previousValue: 72,
    unit: "%",
    trend: "down",
    trendValue: "-4%",
    status: "warning",
    icon: <FaTint className="h-5 w-5" />,
  },
  {
    id: "light",
    title: "Light Intensity",
    value: 35000,
    previousValue: 34500,
    unit: "lux",
    trend: "up",
    trendValue: "+1.4%",
    status: "good",
    icon: <FaSun className="h-5 w-5" />,
  },
  {
    id: "alerts",
    title: "Active Alerts",
    value: 3,
    previousValue: 7,
    unit: "",
    trend: "down",
    trendValue: "-4",
    status: "good",
    icon: <FaExclamationTriangle className="h-5 w-5" />,
  },
  {
    id: "efficiency",
    title: "Farm Efficiency",
    value: 94.2,
    previousValue: 91.8,
    unit: "%",
    trend: "up",
    trendValue: "+2.4%",
    status: "good",
    icon: <FaCheckCircle className="h-5 w-5" />,
  },
];

const generateChartWidgets = (): ChartWidget[] => [
  {
    id: "environmental-trends",
    title: "Environmental Trends (24h)",
    type: "line",
    size: "large",
    refreshable: true,
    data: Array.from({ length: 24 }, (_, i) => ({
      time: `${i}:00`,
      temperature: 22 + Math.sin(i / 4) * 2 + Math.random() * 0.5,
      humidity: 65 + Math.cos(i / 3) * 5 + Math.random() * 2,
      light: 30000 + Math.sin(i / 6) * 10000 + Math.random() * 1000,
    })),
    config: {
      xAxisKey: "time",
      yAxisKeys: ["temperature", "humidity", "light"],
      colors: ["#ef4444", "#3b82f6", "#f59e0b"],
    },
  },
  {
    id: "yield-comparison",
    title: "Yield by Zone",
    type: "bar",
    size: "medium",
    data: [
      { zone: "Zone A", yield: 847, target: 900 },
      { zone: "Zone B", yield: 723, target: 800 },
      { zone: "Zone C", yield: 892, target: 850 },
      { zone: "Zone D", yield: 654, target: 700 },
    ],
    config: {
      xAxisKey: "zone",
      yAxisKeys: ["yield", "target"],
      colors: ["#10b981", "#94a3b8"],
    },
  },
  {
    id: "alert-distribution",
    title: "Alert Categories",
    type: "pie",
    size: "medium",
    data: [
      { name: "Temperature", value: 12, color: "#ef4444" },
      { name: "Humidity", value: 8, color: "#3b82f6" },
      { name: "Device", value: 5, color: "#f59e0b" },
      { name: "Other", value: 3, color: "#6b7280" },
    ],
    config: {
      valueKey: "value",
    },
  },
  {
    id: "growth-rate",
    title: "Growth Rate Trends",
    type: "area",
    size: "large",
    data: Array.from({ length: 30 }, (_, i) => ({
      day: `Day ${i + 1}`,
      lettuce: 2.5 + Math.sin(i / 7) * 0.5 + Math.random() * 0.3,
      tomatoes: 1.8 + Math.cos(i / 5) * 0.3 + Math.random() * 0.2,
      herbs: 3.2 + Math.sin(i / 10) * 0.8 + Math.random() * 0.4,
    })),
    config: {
      xAxisKey: "day",
      yAxisKeys: ["lettuce", "tomatoes", "herbs"],
      colors: ["#10b981", "#ef4444", "#8b5cf6"],
    },
  },
];

const generateInsights = (): InsightAlert[] => [
  {
    id: "insight-1",
    type: "insight",
    title: "Optimal Growth Detected",
    description:
      "Zone A is performing 12% above target yield due to consistent environmental conditions.",
    priority: "low",
    timestamp: Date.now() - 1800000,
  },
  {
    id: "rec-1",
    type: "recommendation",
    title: "Lighting Optimization",
    description:
      "Consider reducing light intensity in Zone D during peak hours to save energy while maintaining growth.",
    priority: "medium",
    action: "Optimize Schedule",
    timestamp: Date.now() - 3600000,
  },
  {
    id: "alert-1",
    type: "alert",
    title: "Temperature Fluctuation",
    description:
      "Zone B temperature variance is 15% higher than optimal. Check HVAC system.",
    priority: "high",
    action: "Check HVAC",
    timestamp: Date.now() - 7200000,
  },
];

// Component
export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  farmId,
  timeRange = "24h",
  layout = "standard",
  onWidgetClick,
  className = "",
}) => {
  const [refreshing, setRefreshing] = useState<string | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange);
  const [visibleWidgets, setVisibleWidgets] = useState<string[]>([
    "environmental-trends",
    "yield-comparison",
    "alert-distribution",
    "growth-rate",
  ]);

  const kpiMetrics = useMemo(() => generateKPIMetrics(), [selectedTimeRange]);
  const chartWidgets = useMemo(
    () => generateChartWidgets(),
    [selectedTimeRange],
  );
  const insights = useMemo(() => generateInsights(), []);

  // Refresh widget data
  const refreshWidget = async (widgetId: string) => {
    setRefreshing(widgetId);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setRefreshing(null);
  };

  // Get KPI status color
  const getKPIStatusColor = (status: string) => {
    switch (status) {
      case "good":
        return "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20";
      case "warning":
        return "text-amber-600 bg-amber-50 dark:bg-amber-900/20";
      case "critical":
        return "text-red-600 bg-red-50 dark:bg-red-900/20";
      default:
        return "text-gray-600 bg-gray-50 dark:bg-gray-900/20";
    }
  };

  // Get trend icon and color
  const getTrendDisplay = (trend: string, trendValue: string) => {
    const isPositive = trend === "up";
    const color = isPositive
      ? "text-emerald-600"
      : trend === "down"
        ? "text-red-600"
        : "text-gray-600";
    const arrow = isPositive ? "↗" : trend === "down" ? "↘" : "→";

    return (
      <span className={`flex items-center gap-1 text-sm font-medium ${color}`}>
        <span>{arrow}</span>
        <span>{trendValue}</span>
      </span>
    );
  };

  // Get insight priority color
  const getInsightColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "border-red-200 bg-red-50 dark:bg-red-900/10";
      case "medium":
        return "border-amber-200 bg-amber-50 dark:bg-amber-900/10";
      case "low":
        return "border-emerald-200 bg-emerald-50 dark:bg-emerald-900/10";
      default:
        return "border-gray-200 bg-gray-50 dark:bg-gray-900/10";
    }
  };

  const timeRangeOptions = [
    { value: "1h", label: "Last Hour" },
    { value: "24h", label: "Last 24 Hours" },
    { value: "7d", label: "Last 7 Days" },
    { value: "30d", label: "Last 30 Days" },
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpiMetrics.map((metric) => (
          <div
            key={metric.id}
            className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between mb-2">
              <div
                className={`p-2 rounded-lg ${getKPIStatusColor(metric.status)}`}
              >
                {metric.icon}
              </div>
              {getTrendDisplay(metric.trend, metric.trendValue)}
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-content">
                {metric.value}
                {metric.unit}
              </p>
              <p className="text-sm text-content-secondary">{metric.title}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {chartWidgets
          .filter((widget) => visibleWidgets.includes(widget.id))
          .map((widget) => (
            <div
              key={widget.id}
              className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 ${
                widget.size === "large" ? "lg:col-span-2" : ""
              }`}
            >
              {/* Widget Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-content">
                  {widget.title}
                </h3>
                <div className="flex items-center gap-2">
                  {widget.refreshable && (
                    <button
                      onClick={() => refreshWidget(widget.id)}
                      disabled={refreshing === widget.id}
                      className="p-1 text-content-secondary hover:text-content transition-colors disabled:opacity-50"
                    >
                      <FaRedo
                        className={`h-4 w-4 ${refreshing === widget.id ? "animate-spin" : ""}`}
                      />
                    </button>
                  )}
                  <button
                    onClick={() => onWidgetClick?.(widget.id)}
                    className="p-1 text-content-secondary hover:text-content transition-colors"
                  >
                    <FaExpand className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Widget Content */}
              <div className="p-4">
                <DataChart
                  data={widget.data}
                  config={{
                    type: widget.type === "area" ? "line" : widget.type,
                    title: "",
                    height: 220,
                    showGrid: true,
                    showLegend: widget.type !== "pie",
                    animated: true,
                    timeScale: false,
                    tension: 0.3,
                    fill: widget.type === "area",
                    pointRadius: widget.type === "line" ? 2 : 0,
                    borderWidth: 2,
                    xAxisKey: widget.config.xAxisKey || "name",
                    yAxisKeys: widget.config.yAxisKeys || ["value"],
                    colors: widget.config.colors || [
                      "#10b981",
                      "#3b82f6",
                      "#f59e0b",
                    ],
                    formatters:
                      widget.type === "pie"
                        ? {}
                        : {
                            temperature: (value: number) =>
                              `${value.toFixed(1)}°C`,
                            humidity: (value: number) => `${value.toFixed(0)}%`,
                            light: (value: number) =>
                              `${(value / 1000).toFixed(0)}k lux`,
                            yield: (value: number) => `${value}kg`,
                            target: (value: number) => `${value}kg`,
                          },
                  }}
                  loading={false}
                />
              </div>
            </div>
          ))}
      </div>

      {/* Insights & Recommendations */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-content">
            AI Insights & Recommendations
          </h3>
          <p className="text-sm text-content-secondary mt-1">
            Automated analysis and optimization suggestions
          </p>
        </div>

        <div className="p-4 space-y-3">
          {insights.map((insight) => (
            <div
              key={insight.id}
              className={`p-4 rounded-lg border ${getInsightColor(insight.priority)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium capitalize text-content-secondary">
                      {insight.type}
                    </span>
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full ${
                        insight.priority === "high"
                          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          : insight.priority === "medium"
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                            : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                      }`}
                    >
                      {insight.priority}
                    </span>
                  </div>
                  <h4 className="font-medium text-content mb-1">
                    {insight.title}
                  </h4>
                  <p className="text-sm text-content-secondary">
                    {insight.description}
                  </p>
                  <p className="text-xs text-content-subtle mt-2">
                    {new Date(insight.timestamp).toLocaleString()}
                  </p>
                </div>

                {insight.action && (
                  <button className="ml-4 px-3 py-1 text-sm bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors">
                    {insight.action}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
