"use client";

import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Sprout,
  Bell,
} from "lucide-react";

import { Farm } from "@/types/farm-layout";

interface FarmStats {
  totalRows: number;
  totalRacks: number;
  totalShelves: number;
  capacityUtilization: number;
  activeDevices: number;
  healthScore: number;
}

interface QuickStatsBarProps {
  stats: FarmStats;
  selectedFarm?: Farm;
}

export default function QuickStatsBar({
  stats,
  selectedFarm,
}: QuickStatsBarProps) {
  const getHealthStatus = (score: number) => {
    if (score >= 90)
      return {
        status: "Excellent",
        color: "text-green-600 dark:text-green-400",
        bgColor: "bg-green-50 dark:bg-green-900/20",
        icon: CheckCircle,
      };
    if (score >= 75)
      return {
        status: "Good",
        color: "text-blue-600 dark:text-blue-400",
        bgColor: "bg-blue-50 dark:bg-blue-900/20",
        icon: CheckCircle,
      };
    if (score >= 60)
      return {
        status: "Fair",
        color: "text-yellow-600 dark:text-yellow-400",
        bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
        icon: AlertTriangle,
      };
    return {
      status: "Needs Attention",
      color: "text-red-600 dark:text-red-400",
      bgColor: "bg-red-50 dark:bg-red-900/20",
      icon: AlertTriangle,
    };
  };

  const healthStatus = getHealthStatus(stats.healthScore);
  const HealthIcon = healthStatus.icon;

  // Calculate active growing areas (rows with racks that have shelves)
  const activeGrowingAreas =
    stats.totalRows > 0
      ? Math.min(stats.totalRows, Math.ceil(stats.totalShelves / 3))
      : 0;

  // Mock alert count - in real app this would come from actual alert system
  const alertCount =
    stats.healthScore < 80 ? Math.floor((100 - stats.healthScore) / 10) : 0;

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Farm Identity */}
          <div className="flex items-center space-x-3">
            <Activity className="h-5 w-5 text-green-600 dark:text-green-400" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {selectedFarm?.name || "Unknown Farm"}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Operational Dashboard
              </p>
            </div>
          </div>

          {/* Key Operational Metrics */}
          <div className="flex items-center space-x-8">
            {/* Farm Health Status - Primary Metric */}
            <div
              className={`flex items-center space-x-3 px-4 py-2 rounded-lg ${healthStatus.bgColor}`}
            >
              <HealthIcon className={`h-5 w-5 ${healthStatus.color}`} />
              <div>
                <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {stats.healthScore}%
                </div>
                <div className={`text-sm font-medium ${healthStatus.color}`}>
                  {healthStatus.status}
                </div>
              </div>
            </div>

            {/* Active Growing Areas - Secondary Metric */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Sprout className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {activeGrowingAreas}/{stats.totalRows}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Active Areas
                </div>
              </div>
            </div>

            {/* Alerts - Tertiary Metric */}
            <div className="flex items-center space-x-3">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-lg ${
                  alertCount > 0
                    ? "bg-orange-100 dark:bg-orange-900/30"
                    : "bg-gray-100 dark:bg-gray-800"
                }`}
              >
                <Bell
                  className={`h-5 w-5 ${
                    alertCount > 0
                      ? "text-orange-600 dark:text-orange-400"
                      : "text-gray-400 dark:text-gray-500"
                  }`}
                />
              </div>
              <div>
                <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {alertCount}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {alertCount === 1 ? "Alert" : "Alerts"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
