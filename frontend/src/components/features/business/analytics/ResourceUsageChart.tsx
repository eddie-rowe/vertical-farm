'use client';

import React from 'react';
import DataChart, { ChartConfig, ChartData } from './DataChart';

export interface ResourceUsageData {
  timestamp: string;
  waterUsage: number; // liters
  electricityUsage: number; // kWh
  nutrientUsage: number; // ml or mg
  co2Usage?: number; // grams
  totalCost?: number; // dollars
}

interface ResourceUsageChartProps {
  data: ResourceUsageData[];
  title?: string;
  height?: number;
  className?: string;
  loading?: boolean;
  chartType?: 'line' | 'bar' | 'area';
  showCosts?: boolean;
  timeRange?: '24h' | '7d' | '30d' | '90d';
  selectedResources?: Array<'waterUsage' | 'electricityUsage' | 'nutrientUsage' | 'co2Usage'>;
}

const RESOURCE_CONFIGS = {
  waterUsage: {
    label: 'Water Usage',
    color: '#3b82f6', // blue-500
    formatter: (value: number) => `${value.toFixed(1)} L`,
    unit: 'L',
    icon: '💧',
    costPerUnit: 0.002, // $0.002 per liter
  },
  electricityUsage: {
    label: 'Electricity',
    color: '#f59e0b', // amber-500
    formatter: (value: number) => `${value.toFixed(2)} kWh`,
    unit: 'kWh',
    icon: '⚡',
    costPerUnit: 0.12, // $0.12 per kWh
  },
  nutrientUsage: {
    label: 'Nutrients',
    color: '#10b981', // emerald-500
    formatter: (value: number) => `${value.toFixed(1)} ml`,
    unit: 'ml',
    icon: '🧪',
    costPerUnit: 0.05, // $0.05 per ml
  },
  co2Usage: {
    label: 'CO₂ Usage',
    color: '#8b5cf6', // violet-500
    formatter: (value: number) => `${value.toFixed(0)} g`,
    unit: 'g',
    icon: '🫧',
    costPerUnit: 0.001, // $0.001 per gram
  },
};

const DEFAULT_RESOURCES: Array<keyof typeof RESOURCE_CONFIGS> = ['waterUsage', 'electricityUsage', 'nutrientUsage'];

export const ResourceUsageChart: React.FC<ResourceUsageChartProps> = ({
  data,
  title = 'Resource Usage',
  height = 350,
  className = '',
  loading = false,
  chartType = 'bar',
  showCosts = false,
  timeRange = '7d',
  selectedResources = DEFAULT_RESOURCES,
}) => {
  // Calculate cumulative usage
  const calculateCumulative = (resource: keyof typeof RESOURCE_CONFIGS) => {
    let cumulative = 0;
    return data.map(item => {
      cumulative += item[resource] || 0;
      return cumulative;
    });
  };

  // Prepare chart configuration
  const chartConfig: ChartConfig = {
    type: chartType,
    title,
    height,
    showGrid: true,
    showLegend: true,
    animated: true,
    timeScale: false,
    tension: 0.1,
    pointRadius: chartType === 'line' ? 3 : 0,
    borderWidth: 2,
    stacked: chartType === 'bar',
    fill: chartType === 'area',
    xAxisKey: 'timestamp',
    yAxisKeys: selectedResources,
    colors: selectedResources.map(resource => RESOURCE_CONFIGS[resource].color),
    formatters: Object.fromEntries(
      selectedResources.map(resource => [
        resource,
        RESOURCE_CONFIGS[resource].formatter
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
      selectedResources.map(resource => [resource, item[resource] || 0])
    ),
  }));

  // Calculate totals and costs
  const calculateTotals = () => {
    return selectedResources.map(resource => {
      const total = data.reduce((sum, item) => sum + (item[resource] || 0), 0);
      const cost = total * RESOURCE_CONFIGS[resource].costPerUnit;
      
      return {
        resource,
        total,
        cost,
        config: RESOURCE_CONFIGS[resource],
      };
    });
  };

  const totals = calculateTotals();
  const totalCost = totals.reduce((sum, item) => sum + item.cost, 0);

  // Calculate efficiency metrics
  const getEfficiencyMetrics = () => {
    if (data.length === 0) return null;
    
    const timeSpanDays = (new Date(data[data.length - 1].timestamp).getTime() - new Date(data[0].timestamp).getTime()) / (1000 * 60 * 60 * 24);
    
    return {
      dailyWaterUsage: (totals.find(t => t.resource === 'waterUsage')?.total || 0) / Math.max(timeSpanDays, 1),
      dailyEnergyUsage: (totals.find(t => t.resource === 'electricityUsage')?.total || 0) / Math.max(timeSpanDays, 1),
      dailyCost: totalCost / Math.max(timeSpanDays, 1),
    };
  };

  const efficiency = getEfficiencyMetrics();

  return (
    <div className={`space-y-6 ${className}`}>
      <DataChart
        data={chartData}
        config={chartConfig}
        loading={loading}
      />
      
      {/* Resource Summary */}
      {data.length > 0 && !loading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Usage Totals */}
          <div className="lg:col-span-2">
            <h4 className="text-lg font-semibold text-content mb-3">
              Total Usage ({timeRange})
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {totals.map(({ resource, total, cost, config }) => (
                <div key={resource} className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{config.icon}</span>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {config.label}
                    </span>
                  </div>
                  <div className="text-lg font-bold text-content">
                    {config.formatter(total)}
                  </div>
                  {showCosts && (
                    <div className="text-sm text-content-secondary">
                      ${cost.toFixed(2)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* Efficiency Metrics */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <h4 className="text-lg font-semibold text-content mb-3">
                Daily Averages
              </h4>
              {efficiency && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-content-secondary">Water</span>
                    <span className="font-medium text-content">
                      {efficiency.dailyWaterUsage.toFixed(1)} L/day
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-content-secondary">Energy</span>
                    <span className="font-medium text-content">
                      {efficiency.dailyEnergyUsage.toFixed(2)} kWh/day
                    </span>
                  </div>
                  {showCosts && (
                    <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Daily Cost</span>
                      <span className="font-bold text-content">
                        ${efficiency.dailyCost.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Cost Breakdown */}
            {showCosts && (
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <h4 className="text-lg font-semibold text-content mb-3">
                  Cost Breakdown
                </h4>
                <div className="space-y-2">
                  {totals.map(({ resource, cost, config }) => (
                    <div key={resource} className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: config.color }}
                        />
                        <span className="text-sm text-content-secondary">
                          {config.label}
                        </span>
                      </div>
                      <span className="font-medium text-content">
                        ${cost.toFixed(2)}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Total</span>
                    <span className="font-bold text-lg text-content">
                      ${totalCost.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResourceUsageChart; 