"use client";

import {
  ChartOptions,
  ChartData as ChartJSData,
} from "chart.js";
import React, { useMemo } from "react";

import { DynamicChart } from "@/components/shared/charts";

export interface ChartData {
  [key: string]: any;
}

export interface ChartConfig {
  type: "line" | "bar" | "area" | "pie" | "doughnut";
  title: string;
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  animated?: boolean;
  colors?: string[];
  xAxisKey?: string;
  yAxisKeys?: string[];
  formatters?: Record<string, (value: any) => string>;
  timeScale?: boolean;
  stacked?: boolean;
  tension?: number;
  fill?: boolean;
  borderWidth?: number;
  pointRadius?: number;
}

interface DataChartProps {
  data: ChartData[];
  config: ChartConfig;
  className?: string;
  loading?: boolean;
}

const DEFAULT_COLORS = [
  "#10b981", // emerald-500
  "#3b82f6", // blue-500
  "#f59e0b", // amber-500
  "#ef4444", // red-500
  "#8b5cf6", // violet-500
  "#06b6d4", // cyan-500
  "#84cc16", // lime-500
  "#f97316", // orange-500
];

const DARK_MODE_COLORS = {
  grid: "#374151", // gray-700
  text: "#9ca3af", // gray-400
  background: "#1f2937", // gray-800
};

const LIGHT_MODE_COLORS = {
  grid: "#e5e7eb", // gray-200
  text: "#6b7280", // gray-500
  background: "#ffffff",
};

const LoadingSkeleton = ({ height }: { height: number }) => (
  <div className="animate-pulse" style={{ height }}>
    <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-full flex items-center justify-center">
      <div className="text-gray-500 dark:text-gray-400">
        Loading chart data...
      </div>
    </div>
  </div>
);

export const DataChart: React.FC<DataChartProps> = ({
  data,
  config,
  className = "",
  loading = false,
}) => {
  const {
    type,
    title,
    height = 300,
    showGrid = true,
    showLegend = true,
    animated = true,
    colors = DEFAULT_COLORS,
    xAxisKey = "name",
    yAxisKeys = [],
    formatters = {},
    timeScale = false,
    stacked = false,
    tension = 0.1,
    fill = false,
    borderWidth = 2,
    pointRadius = 3,
  } = config;

  const { chartData, chartOptions } = useMemo(() => {
    if (!data || data.length === 0) {
      return { chartData: null, chartOptions: null };
    }

    // Prepare datasets
    const datasets = yAxisKeys.map((key, index) => {
      const color = colors[index % colors.length];

      const baseDataset = {
        label: key,
        data: data.map((item) =>
          timeScale ? { x: item[xAxisKey], y: item[key] } : item[key],
        ),
        borderColor: color,
        backgroundColor: type === "area" || fill ? `${color}20` : color,
        borderWidth,
        pointRadius,
        pointHoverRadius: pointRadius + 2,
        tension: type === "line" || type === "area" ? tension : 0,
        fill: type === "area" || fill,
      };

      return baseDataset;
    });

    // Prepare chart data
    const chartData: ChartJSData = timeScale
      ? {
          datasets,
        }
      : {
          labels: data.map((item) => item[xAxisKey]),
          datasets,
        };

    // Chart options
    const isDarkMode = document.documentElement.classList.contains("dark");
    const themeColors = isDarkMode ? DARK_MODE_COLORS : LIGHT_MODE_COLORS;

    const chartOptions: ChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: animated ? 1000 : 0,
      },
      plugins: {
        title: {
          display: !!title,
          text: title,
          color: themeColors.text,
          font: {
            size: 16,
            weight: "bold",
          },
          padding: {
            bottom: 20,
          },
        },
        legend: {
          display: showLegend,
          labels: {
            color: themeColors.text,
            usePointStyle: true,
            padding: 20,
          },
        },
        tooltip: {
          backgroundColor: themeColors.background,
          titleColor: themeColors.text,
          bodyColor: themeColors.text,
          borderColor: themeColors.grid,
          borderWidth: 1,
          cornerRadius: 8,
          displayColors: true,
          callbacks: {
            label: function (context) {
              const label = context.dataset.label || "";
              const value = context.parsed.y;
              const formatter = formatters[label];
              const formattedValue = formatter ? formatter(value) : value;
              return `${label}: ${formattedValue}`;
            },
          },
        },
      },
      scales: {
        x: {
          type: timeScale ? "time" : "category",
          display: true,
          grid: {
            display: showGrid,
            color: themeColors.grid,
          },
          ticks: {
            color: themeColors.text,
          },
        },
        y: {
          type: "linear",
          display: true,
          stacked,
          grid: {
            display: showGrid,
            color: themeColors.grid,
          },
          ticks: {
            color: themeColors.text,
            callback: function (value) {
              const formatter = formatters["y"];
              return formatter ? formatter(value) : value;
            },
          },
        },
      },
    };

    return { chartData, chartOptions };
  }, [
    data,
    config,
    showGrid,
    showLegend,
    animated,
    colors,
    xAxisKey,
    yAxisKeys,
    formatters,
    timeScale,
    stacked,
    tension,
    fill,
    borderWidth,
    pointRadius,
  ]);

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {title}
        </h3>
        <LoadingSkeleton height={height} />
      </div>
    );
  }

  if (!chartData) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {title}
        </h3>
        <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
          No data available
        </div>
      </div>
    );
  }

  // Map chart types to DynamicChart types
  const chartType =
    type === "area" ? "line" : type === "pie" ? "doughnut" : type;

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg p-6 ${className}`}>
      <div style={{ height }}>
        <DynamicChart
          type={chartType as "line" | "bar" | "doughnut"}
          data={chartData}
          options={chartOptions}
          className="w-full h-full"
        />
      </div>
    </div>
  );
};

export default DataChart;
