import React, { useState, useMemo } from "react";
import {
  FaLeaf,
  FaTint,
  FaBolt,
  FaClock,
  FaThermometerHalf,
  FaEye,
  FaArrowUp,
  FaArrowDown,
  FaMinus,
  FaFlag,
  FaCalendarAlt,
  FaChartLine,
} from "react-icons/fa";

interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  target: number;
  previousValue?: number;
  trend: "up" | "down" | "stable";
  trendPercentage: number;
  category: "yield" | "efficiency" | "environmental" | "energy";
  icon: React.ReactNode;
  status: "excellent" | "good" | "warning" | "critical";
  description: string;
  timeframe: "1h" | "24h" | "7d" | "30d";
}

interface GoalProgress {
  id: string;
  title: string;
  current: number;
  target: number;
  unit: string;
  deadline: string;
  progress: number;
  status: "on-track" | "at-risk" | "behind";
  category: string;
}

interface PerformanceMetricsProps {
  farmId?: string;
  timeframe?: "1h" | "24h" | "7d" | "30d";
  showGoals?: boolean;
  showTrends?: boolean;
  className?: string;
}

// Mock data generators
const generatePerformanceMetrics = (timeframe: string): PerformanceMetric[] => [
  {
    id: "yield-efficiency",
    name: "Yield Efficiency",
    value: 94.2,
    unit: "%",
    target: 95,
    previousValue: 91.8,
    trend: "up",
    trendPercentage: 2.6,
    category: "yield",
    icon: <FaLeaf className="h-5 w-5" />,
    status: "good",
    description: "Overall yield performance compared to optimal conditions",
    timeframe: timeframe as any,
  },
  {
    id: "water-efficiency",
    name: "Water Efficiency",
    value: 87.5,
    unit: "%",
    target: 90,
    previousValue: 86.2,
    trend: "up",
    trendPercentage: 1.5,
    category: "efficiency",
    icon: <FaTint className="h-5 w-5" />,
    status: "warning",
    description: "Water usage optimization and conservation metrics",
    timeframe: timeframe as any,
  },
  {
    id: "energy-efficiency",
    name: "Energy Efficiency",
    value: 91.3,
    unit: "%",
    target: 88,
    previousValue: 89.7,
    trend: "up",
    trendPercentage: 1.8,
    category: "energy",
    icon: <FaBolt className="h-5 w-5" />,
    status: "excellent",
    description: "Energy consumption per unit of yield produced",
    timeframe: timeframe as any,
  },
  {
    id: "growth-rate",
    name: "Growth Rate",
    value: 3.2,
    unit: "cm/day",
    target: 3.0,
    previousValue: 2.9,
    trend: "up",
    trendPercentage: 10.3,
    category: "yield",
    icon: <FaChartLine className="h-5 w-5" />,
    status: "excellent",
    description: "Average plant growth rate across all crops",
    timeframe: timeframe as any,
  },
  {
    id: "temperature-stability",
    name: "Temperature Stability",
    value: 96.8,
    unit: "%",
    target: 95,
    previousValue: 94.2,
    trend: "up",
    trendPercentage: 2.8,
    category: "environmental",
    icon: <FaThermometerHalf className="h-5 w-5" />,
    status: "excellent",
    description: "Consistency of temperature control across zones",
    timeframe: timeframe as any,
  },
  {
    id: "cycle-time",
    name: "Harvest Cycle Time",
    value: 28.5,
    unit: "days",
    target: 30,
    previousValue: 29.2,
    trend: "down",
    trendPercentage: -2.4,
    category: "efficiency",
    icon: <FaClock className="h-5 w-5" />,
    status: "excellent",
    description: "Average time from planting to harvest",
    timeframe: timeframe as any,
  },
];

const generateGoalProgress = (): GoalProgress[] => [
  {
    id: "q4-yield",
    title: "Q4 Yield Target",
    current: 2850,
    target: 3200,
    unit: "kg",
    deadline: "2024-12-31",
    progress: 89.1,
    status: "on-track",
    category: "Production",
  },
  {
    id: "energy-reduction",
    title: "Energy Reduction Goal",
    current: 12.5,
    target: 15,
    unit: "%",
    deadline: "2024-11-30",
    progress: 83.3,
    status: "at-risk",
    category: "Sustainability",
  },
  {
    id: "automation-coverage",
    title: "Automation Coverage",
    current: 78,
    target: 85,
    unit: "%",
    deadline: "2024-12-15",
    progress: 91.8,
    status: "on-track",
    category: "Technology",
  },
];

export const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({
  farmId,
  timeframe = "24h",
  showGoals = true,
  showTrends = true,
  className = "",
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedTimeframe, setSelectedTimeframe] = useState(timeframe);

  const metrics = useMemo(
    () => generatePerformanceMetrics(selectedTimeframe),
    [selectedTimeframe],
  );
  const goals = useMemo(() => generateGoalProgress(), []);

  const filteredMetrics = useMemo(() => {
    if (selectedCategory === "all") return metrics;
    return metrics.filter((metric) => metric.category === selectedCategory);
  }, [metrics, selectedCategory]);

  const categories = [
    { id: "all", name: "All Metrics", count: metrics.length },
    {
      id: "yield",
      name: "Yield",
      count: metrics.filter((m) => m.category === "yield").length,
    },
    {
      id: "efficiency",
      name: "Efficiency",
      count: metrics.filter((m) => m.category === "efficiency").length,
    },
    {
      id: "environmental",
      name: "Environmental",
      count: metrics.filter((m) => m.category === "environmental").length,
    },
    {
      id: "energy",
      name: "Energy",
      count: metrics.filter((m) => m.category === "energy").length,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "excellent":
        return "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400";
      case "good":
        return "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400";
      case "warning":
        return "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400";
      case "critical":
        return "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400";
      default:
        return "bg-gray-50 border-gray-200 text-gray-800 dark:bg-gray-900/20 dark:border-gray-800 dark:text-gray-400";
    }
  };

  const getGoalStatusColor = (status: string) => {
    switch (status) {
      case "on-track":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400";
      case "at-risk":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
      case "behind":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <FaArrowUp className="h-4 w-4 text-emerald-600" />;
      case "down":
        return <FaArrowDown className="h-4 w-4 text-red-600" />;
      case "stable":
        return <FaMinus className="h-4 w-4 text-gray-600" />;
      default:
        return null;
    }
  };

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-content">
            Performance Metrics
          </h2>
          <p className="text-content-secondary">
            Key performance indicators and goal tracking
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Timeframe Selector */}
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-content focus:ring-2 focus:ring-emerald-500"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedCategory === category.id
                ? "bg-emerald-600 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            {category.name}
            <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-white bg-opacity-20">
              {category.count}
            </span>
          </button>
        ))}
      </div>

      {/* Performance Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMetrics.map((metric) => (
          <div
            key={metric.id}
            className={`p-6 rounded-lg border-2 ${getStatusColor(metric.status)}`}
          >
            {/* Metric Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                  {metric.icon}
                </div>
                <div>
                  <h3 className="font-semibold">{metric.name}</h3>
                  <p className="text-xs opacity-75">{metric.description}</p>
                </div>
              </div>
              {showTrends && getTrendIcon(metric.trend)}
            </div>

            {/* Value and Target */}
            <div className="space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-bold">
                  {metric.value}
                  {metric.unit}
                </span>
                {showTrends && (
                  <span
                    className={`text-sm font-medium ${
                      metric.trend === "up"
                        ? "text-emerald-600"
                        : metric.trend === "down"
                          ? "text-red-600"
                          : "text-gray-600"
                    }`}
                  >
                    {metric.trend === "up"
                      ? "+"
                      : metric.trend === "down"
                        ? ""
                        : "±"}
                    {metric.trendPercentage}%
                  </span>
                )}
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Progress to Target</span>
                  <span>
                    Target: {metric.target}
                    {metric.unit}
                  </span>
                </div>
                <div className="w-full bg-white bg-opacity-30 rounded-full h-2">
                  <div
                    className="bg-current h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${getProgressPercentage(metric.value, metric.target)}%`,
                    }}
                  />
                </div>
                <div className="text-xs text-right opacity-75">
                  {getProgressPercentage(metric.value, metric.target).toFixed(
                    1,
                  )}
                  % of target
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wide opacity-75">
                  {metric.status}
                </span>
                <span className="text-xs opacity-75">
                  {metric.timeframe} timeframe
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Goals Progress Section */}
      {showGoals && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <FaFlag className="h-5 w-5 text-emerald-600" />
              <h3 className="text-lg font-semibold text-content">
                Goal Progress
              </h3>
            </div>
            <p className="text-sm text-content-secondary mt-1">
              Track progress toward strategic objectives
            </p>
          </div>

          <div className="p-6 space-y-4">
            {goals.map((goal) => (
              <div
                key={goal.id}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-medium text-content">{goal.title}</h4>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getGoalStatusColor(goal.status)}`}
                    >
                      {goal.status.replace("-", " ")}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-content-secondary">
                    <span>
                      {goal.current} / {goal.target} {goal.unit}
                    </span>
                    <span className="flex items-center gap-1">
                      <FaCalendarAlt className="h-3 w-3" />
                      Due: {new Date(goal.deadline).toLocaleDateString()}
                    </span>
                    <span className="px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded text-xs">
                      {goal.category}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          goal.status === "on-track"
                            ? "bg-emerald-500"
                            : goal.status === "at-risk"
                              ? "bg-amber-500"
                              : "bg-red-500"
                        }`}
                        style={{ width: `${goal.progress}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {goal.progress.toFixed(1)}% complete
                    </div>
                  </div>
                </div>

                <div className="ml-4">
                  <button className="p-2 text-content-secondary hover:text-content transition-colors">
                    <FaEye className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceMetrics;
