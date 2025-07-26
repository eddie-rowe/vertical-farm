import React from "react";
import {
  FaDollarSign,
  FaChartLine,
  FaTasks,
  FaCalendarAlt,
} from "react-icons/fa";

import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";

interface HeroMetric {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  value: string;
  change: string;
  trend: "up" | "down" | "stable";
  description: string;
}

const heroMetrics: HeroMetric[] = [
  {
    icon: FaDollarSign,
    title: "Weekly Revenue",
    value: "$1,920",
    change: "-9.4%",
    trend: "down",
    description: "vs 4-week average",
  },
  {
    icon: FaChartLine,
    title: "Cost per Tray",
    value: "$2.87",
    change: "+8.3%",
    trend: "up",
    description: "vs target $2.50",
  },
  {
    icon: FaTasks,
    title: "Today's Tasks",
    value: "6h",
    change: "-0.5h",
    trend: "down",
    description: "total labor hours",
  },
  {
    icon: FaCalendarAlt,
    title: "Active Grows",
    value: "12",
    change: "0%",
    trend: "stable",
    description: "across all farms",
  },
];

export const HeroMetrics = () => {
  const getTrendColor = (trend: "up" | "down" | "stable") => {
    switch (trend) {
      case "up":
        return "text-red-500 dark:text-red-400";
      case "down":
        return "text-green-500 dark:text-green-400";
      case "stable":
        return "text-content-secondary";
      default:
        return "text-content-secondary";
    }
  };

  // Helper function to map trend to StatusBadge status type
  const getTrendStatus = (trend: "up" | "down" | "stable") => {
    switch (trend) {
      case "up":
        return "warning"; // Up trends might indicate higher costs
      case "down":
        return "success"; // Down trends might indicate cost savings
      case "stable":
        return "info";
      default:
        return "info";
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {heroMetrics.map((metric, index) => (
        <Card key={index} className="p-6">
          <CardContent className="p-0">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <metric.icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-content-secondary">
                    {metric.title}
                  </h3>
                  <p className="text-2xl font-bold text-content">
                    {metric.value}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <StatusBadge status={getTrendStatus(metric.trend)} size="sm">
                {metric.change}
              </StatusBadge>
              <span className="text-xs text-content-secondary">
                {metric.description}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
