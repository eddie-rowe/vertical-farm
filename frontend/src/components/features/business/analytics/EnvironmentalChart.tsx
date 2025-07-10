'use client';

import React from 'react';
import DataChart, { ChartConfig, ChartData } from './DataChart';

export interface EnvironmentalData {
  timestamp: string;
  temperature: number;
  humidity: number;
  co2: number;
  lightLevel: number;
  vpd?: number; // Vapor Pressure Deficit
}

interface EnvironmentalChartProps {
  data: EnvironmentalData[];
  title?: string;
  height?: number;
  timeRange?: '1h' | '24h' | '7d' | '30d';
  className?: string;
  loading?: boolean;
  showAllMetrics?: boolean;
  selectedMetrics?: Array<'temperature' | 'humidity' | 'co2' | 'lightLevel' | 'vpd'>;
}

const METRIC_CONFIGS = {
  temperature: {
    label: 'Temperature',
    color: '#ef4444', // red-500
    formatter: (value: number) => `${value.toFixed(1)}°F`,
    unit: '°F',
  },
  humidity: {
    label: 'Humidity',
    color: '#3b82f6', // blue-500
    formatter: (value: number) => `${value.toFixed(1)}%`,
    unit: '%',
  },
  co2: {
    label: 'CO₂',
    color: '#10b981', // emerald-500
    formatter: (value: number) => `${value.toFixed(0)} ppm`,
    unit: 'ppm',
  },
  lightLevel: {
    label: 'Light Level',
    color: '#f59e0b', // amber-500
    formatter: (value: number) => `${value.toFixed(0)} PPFD`,
    unit: 'PPFD',
  },
  vpd: {
    label: 'VPD',
    color: '#8b5cf6', // violet-500
    formatter: (value: number) => `${value.toFixed(2)} kPa`,
    unit: 'kPa',
  },
};

const DEFAULT_METRICS: Array<keyof typeof METRIC_CONFIGS> = ['temperature', 'humidity', 'co2', 'lightLevel'];

export const EnvironmentalChart: React.FC<EnvironmentalChartProps> = ({
  data,
  title = 'Environmental Conditions',
  height = 350,
  className = '',
  loading = false,
  showAllMetrics = false,
  selectedMetrics = DEFAULT_METRICS,
}) => {
  // Determine which metrics to show
  const metricsToShow = showAllMetrics 
    ? Object.keys(METRIC_CONFIGS) as Array<keyof typeof METRIC_CONFIGS>
    : selectedMetrics;

  // Prepare chart configuration
  const chartConfig: ChartConfig = {
    type: 'line',
    title,
    height,
    showGrid: true,
    showLegend: true,
    animated: true,
    timeScale: false,
    tension: 0.3,
    pointRadius: 2,
    borderWidth: 2,
    xAxisKey: 'timestamp',
    yAxisKeys: metricsToShow,
    colors: metricsToShow.map(metric => METRIC_CONFIGS[metric].color),
    formatters: Object.fromEntries(
      metricsToShow.map(metric => [
        metric,
        METRIC_CONFIGS[metric].formatter
      ])
    ),
  };

  // Transform data for Chart.js format with readable timestamps
  const chartData: ChartData[] = data.map(item => ({
    timestamp: new Date(item.timestamp).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }),
    ...Object.fromEntries(
      metricsToShow.map(metric => [metric, item[metric]])
    ),
  }));

  return (
    <div className={`space-y-4 ${className}`}>
      <DataChart
        data={chartData}
        config={chartConfig}
        loading={loading}
      />
      
      {/* Metrics Legend with Current Values */}
      {data.length > 0 && !loading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          {metricsToShow.map(metric => {
            const latestValue = data[data.length - 1]?.[metric];
            const config = METRIC_CONFIGS[metric];
            
            return (
              <div key={metric} className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: config.color }}
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {config.label}
                  </span>
                </div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {latestValue !== undefined ? config.formatter(latestValue) : 'N/A'}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EnvironmentalChart; 