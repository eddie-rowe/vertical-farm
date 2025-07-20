"use client";

import React from "react";

import DataChart, { ChartConfig, ChartData } from "./DataChart";

export interface GrowthData {
  timestamp: string;
  daysSinceSeeding: number;
  height: number; // cm
  leafCount: number;
  biomass?: number; // grams
  leafArea?: number; // cm²
  rootLength?: number; // cm
  chlorophyllContent?: number; // SPAD units
}

interface GrowthTrackingChartProps {
  data: GrowthData[];
  title?: string;
  height?: number;
  className?: string;
  loading?: boolean;
  cropType?: string;
  expectedHarvestDay?: number;
  showProjections?: boolean;
  selectedMetrics?: Array<
    | "height"
    | "leafCount"
    | "biomass"
    | "leafArea"
    | "rootLength"
    | "chlorophyllContent"
  >;
}

const GROWTH_METRIC_CONFIGS = {
  height: {
    label: "Height",
    color: "#10b981", // emerald-500
    formatter: (value: number) => `${value.toFixed(1)} cm`,
    unit: "cm",
    icon: "📏",
  },
  leafCount: {
    label: "Leaf Count",
    color: "#22c55e", // green-500
    formatter: (value: number) => `${Math.round(value)} leaves`,
    unit: "leaves",
    icon: "🍃",
  },
  biomass: {
    label: "Biomass",
    color: "#3b82f6", // blue-500
    formatter: (value: number) => `${value.toFixed(1)} g`,
    unit: "g",
    icon: "⚖️",
  },
  leafArea: {
    label: "Leaf Area",
    color: "#84cc16", // lime-500
    formatter: (value: number) => `${value.toFixed(1)} cm²`,
    unit: "cm²",
    icon: "🌿",
  },
  rootLength: {
    label: "Root Length",
    color: "#a855f7", // purple-500
    formatter: (value: number) => `${value.toFixed(1)} cm`,
    unit: "cm",
    icon: "🌱",
  },
  chlorophyllContent: {
    label: "Chlorophyll",
    color: "#059669", // emerald-600
    formatter: (value: number) => `${value.toFixed(1)} SPAD`,
    unit: "SPAD",
    icon: "🟢",
  },
};

const DEFAULT_GROWTH_METRICS: Array<keyof typeof GROWTH_METRIC_CONFIGS> = [
  "height",
  "leafCount",
];

export const GrowthTrackingChart: React.FC<GrowthTrackingChartProps> = ({
  data,
  title = "Growth Progress",
  height = 400,
  className = "",
  loading = false,
  cropType = "Lettuce",
  expectedHarvestDay,
  showProjections = false,
  selectedMetrics = DEFAULT_GROWTH_METRICS,
}) => {
  // Prepare chart configuration
  const chartConfig: ChartConfig = {
    type: "line",
    title: `${title} - ${cropType}`,
    height,
    showGrid: true,
    showLegend: true,
    animated: true,
    timeScale: false, // Use days since seeding instead of timestamps
    tension: 0.2,
    pointRadius: 4,
    borderWidth: 3,
    xAxisKey: "daysSinceSeeding",
    yAxisKeys: selectedMetrics,
    colors: selectedMetrics.map(
      (metric) => GROWTH_METRIC_CONFIGS[metric].color,
    ),
    formatters: {
      ...Object.fromEntries(
        selectedMetrics.map((metric) => [
          metric,
          GROWTH_METRIC_CONFIGS[metric].formatter,
        ]),
      ),
      daysSinceSeeding: (value: number) => `Day ${value}`,
    },
  };

  // Transform data for Chart.js format
  const chartData: ChartData[] = data.map((item) => ({
    ...item,
    daysSinceSeeding: item.daysSinceSeeding,
    ...Object.fromEntries(
      selectedMetrics.map((metric) => [metric, item[metric] || 0]),
    ),
  }));

  // Calculate growth rate for the latest period
  const getGrowthRate = (metric: keyof typeof GROWTH_METRIC_CONFIGS) => {
    if (data.length < 2) return null;

    const latest = data[data.length - 1];
    const previous = data[data.length - 2];
    const rate =
      ((latest[metric] || 0) - (previous[metric] || 0)) /
      (latest.daysSinceSeeding - previous.daysSinceSeeding);

    return rate;
  };

  // Growth stage determination
  const getCurrentGrowthStage = () => {
    const currentDay = data[data.length - 1]?.daysSinceSeeding || 0;

    if (currentDay <= 7)
      return { stage: "Germination", color: "text-yellow-600" };
    if (currentDay <= 14) return { stage: "Seedling", color: "text-green-500" };
    if (currentDay <= 21)
      return { stage: "Vegetative", color: "text-green-600" };
    if (currentDay <= 28)
      return { stage: "Pre-harvest", color: "text-blue-600" };
    return { stage: "Harvest Ready", color: "text-purple-600" };
  };

  const currentStage = getCurrentGrowthStage();

  return (
    <div className={`space-y-6 ${className}`}>
      <DataChart data={chartData} config={chartConfig} loading={loading} />

      {/* Growth Status Panel */}
      {data.length > 0 && !loading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Current Metrics */}
          <div className="lg:col-span-2">
            <h4 className="text-lg font-semibold text-content mb-3">
              Current Measurements
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {selectedMetrics.map((metric) => {
                const latestValue = data[data.length - 1]?.[metric];
                const config = GROWTH_METRIC_CONFIGS[metric];
                const growthRate = getGrowthRate(metric);

                return (
                  <div
                    key={metric}
                    className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{config.icon}</span>
                      <span className="text-sm font-medium text-content-secondary">
                        {config.label}
                      </span>
                    </div>
                    <div className="text-xl font-bold text-content">
                      {latestValue !== undefined
                        ? config.formatter(latestValue)
                        : "N/A"}
                    </div>
                    {growthRate !== null && (
                      <div
                        className={`text-sm ${growthRate >= 0 ? "text-green-600" : "text-red-600"}`}
                      >
                        {growthRate >= 0 ? "+" : ""}
                        {growthRate.toFixed(2)} {config.unit}/day
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Growth Stage & Timeline */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <h4 className="text-lg font-semibold text-content mb-3">
                Growth Stage
              </h4>
              <div className="space-y-2">
                <div className={`text-xl font-bold ${currentStage.color}`}>
                  {currentStage.stage}
                </div>
                <div className="text-sm text-content-secondary">
                  Day {data[data.length - 1]?.daysSinceSeeding || 0} of cycle
                </div>
                {expectedHarvestDay && (
                  <div className="text-sm text-content-secondary">
                    {expectedHarvestDay -
                      (data[data.length - 1]?.daysSinceSeeding || 0)}{" "}
                    days to harvest
                  </div>
                )}
              </div>
            </div>

            {/* Growth Timeline */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-semibold text-content-secondary mb-3">
                Growth Timeline
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span>Germination</span>
                  <span className="text-content-subtle">0-7 days</span>
                </div>
                <div className="flex justify-between">
                  <span>Seedling</span>
                  <span className="text-content-subtle">8-14 days</span>
                </div>
                <div className="flex justify-between">
                  <span>Vegetative</span>
                  <span className="text-content-subtle">15-21 days</span>
                </div>
                <div className="flex justify-between">
                  <span>Pre-harvest</span>
                  <span className="text-content-subtle">22-28 days</span>
                </div>
                <div className="flex justify-between">
                  <span>Harvest</span>
                  <span className="text-content-subtle">
                    {expectedHarvestDay || 30}+ days
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GrowthTrackingChart;
