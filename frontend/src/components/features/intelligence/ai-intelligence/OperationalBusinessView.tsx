"use client";

import React, { useState } from "react";
import {
  FaChartLine,
  FaArrowUp,
  FaArrowDown,
  FaDollarSign,
  FaUsers,
  FaBoxes,
  FaTruck,
} from "react-icons/fa";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";


interface OperationalMetric {
  id: string;
  name: string;
  value: string;
  change: number;
  trend: "up" | "down" | "stable";
  category: "production" | "efficiency" | "cost" | "quality";
  aiInsight: string;
}

const mockOperationalMetrics: OperationalMetric[] = [
  {
    id: "1",
    name: "Daily Production",
    value: "145 kg",
    change: 8.2,
    trend: "up",
    category: "production",
    aiInsight: "Production 8.2% above target due to optimized light cycles",
  },
  {
    id: "2",
    name: "Resource Efficiency",
    value: "94.2%",
    change: 2.1,
    trend: "up",
    category: "efficiency",
    aiInsight: "Water usage optimization improved efficiency by 2.1%",
  },
  {
    id: "3",
    name: "Operating Cost/kg",
    value: "$3.42",
    change: -5.8,
    trend: "down",
    category: "cost",
    aiInsight: "Cost reduction achieved through energy optimization",
  },
  {
    id: "4",
    name: "Quality Score",
    value: "96.8%",
    change: 1.2,
    trend: "up",
    category: "quality",
    aiInsight: "Consistent environmental control improved quality metrics",
  },
  {
    id: "5",
    name: "Equipment Uptime",
    value: "99.1%",
    change: 0.3,
    trend: "up",
    category: "efficiency",
    aiInsight: "Predictive maintenance reduced unexpected downtime",
  },
  {
    id: "6",
    name: "Labor Productivity",
    value: "18.2 kg/hr",
    change: 4.7,
    trend: "up",
    category: "efficiency",
    aiInsight: "Task optimization increased worker productivity",
  },
];

interface BusinessKPI {
  name: string;
  current: string;
  target: string;
  progress: number;
  status: "on-track" | "ahead" | "behind";
  timeframe: string;
}

const mockBusinessKPIs: BusinessKPI[] = [
  {
    name: "Monthly Revenue",
    current: "$42,850",
    target: "$45,000",
    progress: 95.2,
    status: "on-track",
    timeframe: "MTD",
  },
  {
    name: "Profit Margin",
    current: "34.2%",
    target: "30%",
    progress: 114.0,
    status: "ahead",
    timeframe: "Current",
  },
  {
    name: "Customer Orders",
    current: "287",
    target: "300",
    progress: 95.7,
    status: "on-track",
    timeframe: "This Month",
  },
  {
    name: "Inventory Turnover",
    current: "12.4x",
    target: "10x",
    progress: 124.0,
    status: "ahead",
    timeframe: "Annual",
  },
];

interface ResourceUsage {
  resource: string;
  current: number;
  optimal: number;
  cost: string;
  trend: "increasing" | "decreasing" | "stable";
  icon: React.ReactNode;
}

const mockResourceUsage: ResourceUsage[] = [
  {
    resource: "Energy Consumption",
    current: 2840,
    optimal: 2650,
    cost: "$340/day",
    trend: "decreasing",
    icon: <FaTruck className="text-yellow-500" />,
  },
  {
    resource: "Water Usage",
    current: 850,
    optimal: 820,
    cost: "$25/day",
    trend: "stable",
    icon: <FaTruck className="text-blue-500" />,
  },
  {
    resource: "Labor Hours",
    current: 48,
    optimal: 45,
    cost: "$720/day",
    trend: "decreasing",
    icon: <FaUsers className="text-green-500" />,
  },
  {
    resource: "Nutrient Solutions",
    current: 125,
    optimal: 120,
    cost: "$45/day",
    trend: "stable",
    icon: <FaBoxes className="text-purple-500" />,
  },
];

export default function OperationalBusinessView() {
  const [selectedTimeframe, setSelectedTimeframe] = useState("24h");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "production":
        return <FaBoxes className="text-blue-600" />;
      case "efficiency":
        return <FaChartLine className="text-green-600" />;
      case "cost":
        return <FaDollarSign className="text-yellow-600" />;
      case "quality":
        return <FaBoxes className="text-purple-600" />;
      default:
        return <FaChartLine className="text-gray-600" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <FaArrowUp className="text-green-500" />;
      case "down":
        return <FaArrowDown className="text-red-500" />;
      default:
        return <div className="w-3 h-3 bg-gray-400 rounded-full"></div>;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ahead":
        return "bg-green-100 text-green-800";
      case "on-track":
        return "bg-blue-100 text-blue-800";
      case "behind":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredMetrics =
    selectedCategory === "all"
      ? mockOperationalMetrics
      : mockOperationalMetrics.filter(
          (metric) => metric.category === selectedCategory,
        );

  return (
    <div className="space-y-6">
      {/* Business KPIs Overview */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FaBoxes className="text-blue-600" />
            Business Performance KPIs
          </h3>
          <div className="flex gap-2">
            {["24h", "7d", "30d", "90d"].map((period) => (
              <Button
                key={period}
                variant={selectedTimeframe === period ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedTimeframe(period)}
              >
                {period}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {mockBusinessKPIs.map((kpi, index) => (
            <div
              key={index}
              className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-sm">{kpi.name}</h4>
                <Badge className={getStatusColor(kpi.status)}>
                  {kpi.status}
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{kpi.current}</span>
                  <span className="text-sm text-gray-600">/ {kpi.target}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      kpi.status === "ahead"
                        ? "bg-green-500"
                        : kpi.status === "on-track"
                          ? "bg-blue-500"
                          : "bg-red-500"
                    }`}
                    style={{ width: `${Math.min(kpi.progress, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-600">
                  {kpi.timeframe} • {kpi.progress.toFixed(1)}%
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Operational Metrics */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FaTruck className="text-purple-600" />
            AI-Driven Operational Metrics
          </h3>
          <div className="flex gap-2">
            {[
              { id: "all", label: "All", icon: <FaChartLine /> },
              { id: "production", label: "Production", icon: <FaBoxes /> },
              { id: "efficiency", label: "Efficiency", icon: <FaChartLine /> },
              { id: "cost", label: "Cost", icon: <FaDollarSign /> },
              { id: "quality", label: "Quality", icon: <FaBoxes /> },
            ].map((category) => (
              <Button
                key={category.id}
                variant={
                  selectedCategory === category.id ? "default" : "outline"
                }
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className="flex items-center gap-1"
              >
                {category.icon}
                <span className="hidden sm:inline">{category.label}</span>
              </Button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMetrics.map((metric) => (
            <div
              key={metric.id}
              className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {getCategoryIcon(metric.category)}
                  <h4 className="font-medium">{metric.name}</h4>
                </div>
                {getTrendIcon(metric.trend)}
              </div>

              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{metric.value}</span>
                  <div className="flex items-center gap-1">
                    {metric.change > 0 ? (
                      <FaArrowUp className="text-green-500 text-xs" />
                    ) : (
                      <FaArrowDown className="text-red-500 text-xs" />
                    )}
                    <span
                      className={`text-sm ${metric.change > 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      {Math.abs(metric.change)}%
                    </span>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-700 rounded p-2">
                  <p className="text-xs text-gray-600 flex items-start gap-1">
                    <FaTruck className="text-purple-500 mt-0.5 flex-shrink-0" />
                    {metric.aiInsight}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Resource Optimization */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <FaTruck className="text-orange-600" />
          Resource Optimization Dashboard
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-medium text-gray-700 dark:text-gray-300">
              Current vs Optimal Usage
            </h4>
            {mockResourceUsage.map((resource, index) => (
              <div
                key={index}
                className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {resource.icon}
                    <span className="font-medium">{resource.resource}</span>
                  </div>
                  <Badge variant="outline">{resource.cost}</Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Current: {resource.current}</span>
                    <span>Optimal: {resource.optimal}</span>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        resource.current <= resource.optimal
                          ? "bg-green-500"
                          : "bg-orange-500"
                      }`}
                      style={{
                        width: `${(resource.current / resource.optimal) * 100}%`,
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span>
                      Efficiency:{" "}
                      {((resource.optimal / resource.current) * 100).toFixed(1)}
                      %
                    </span>
                    <Badge
                      variant={
                        resource.trend === "decreasing"
                          ? "default"
                          : "secondary"
                      }
                      className="text-xs"
                    >
                      {resource.trend}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* AI Recommendations */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-700 dark:text-gray-300">
              AI Optimization Recommendations
            </h4>
            <div className="space-y-3">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <FaTruck className="text-blue-600 mt-1" />
                  <div>
                    <h5 className="font-medium text-blue-800 dark:text-blue-200">
                      Energy Optimization
                    </h5>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                      Adjust lighting schedule to reduce peak-hour consumption
                      by 12%. Estimated savings: $45/day
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <FaTruck className="text-green-600 mt-1" />
                  <div>
                    <h5 className="font-medium text-green-800 dark:text-green-200">
                      Production Scheduling
                    </h5>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                      Optimize harvest timing across racks to reduce labor
                      peaks. Potential 15% improvement in productivity.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <FaTruck className="text-purple-600 mt-1" />
                  <div>
                    <h5 className="font-medium text-purple-800 dark:text-purple-200">
                      Quality Enhancement
                    </h5>
                    <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
                      Fine-tune nutrient delivery timing to improve crop quality
                      scores. Expected 3% increase in premium grade yield.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <FaTruck className="text-orange-600 mt-1" />
                  <div>
                    <h5 className="font-medium text-orange-800 dark:text-orange-200">
                      Predictive Maintenance
                    </h5>
                    <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                      Schedule pump maintenance in 5 days based on performance
                      patterns. Prevent potential 2-day downtime.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Financial Analytics */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <FaDollarSign className="text-green-600" />
          Financial Performance Analytics
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
            <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
              Revenue Metrics
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Daily Revenue</span>
                <span className="font-semibold">$1,428</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Revenue/m²</span>
                <span className="font-semibold">$47.60</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Growth Rate</span>
                <span className="font-semibold text-green-600">+8.2%</span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
              Cost Analysis
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Operating Costs</span>
                <span className="font-semibold">$942</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Cost/kg</span>
                <span className="font-semibold">$3.42</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Reduction</span>
                <span className="font-semibold text-green-600">-5.8%</span>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
            <h4 className="font-medium text-purple-800 dark:text-purple-200 mb-2">
              Profitability
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Gross Profit</span>
                <span className="font-semibold">$486</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Margin</span>
                <span className="font-semibold">34.2%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">ROI</span>
                <span className="font-semibold text-green-600">+12.5%</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
