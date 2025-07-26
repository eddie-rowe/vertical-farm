"use client";

import {
  TrendingUp,
  TrendingDown,
  Activity,
  Calendar,
  Target,
  AlertTriangle,
  CheckCircle,
  Leaf,
  Zap,
} from "lucide-react";
import { useState, useEffect } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface GrowStats {
  totalActiveGrows: number;
  totalPlannedGrows: number;
  totalCompletedThisMonth: number;
  avgCompletionRate: number;
  totalYieldThisMonth: number;
  avgYieldPerGrow: number;
  automationEfficiency: number;
  criticalAlerts: number;
  environmentalScore: number;
  resourceUtilization: number;
  trends: {
    growsChange: number;
    yieldChange: number;
    efficiencyChange: number;
  };
  upcomingHarvests: number;
  energyUsage: number;
  waterUsage: number;
  avgTemperature: number;
}

interface GrowDashboardStatsProps {
  selectedGrowId?: string;
  timeRange?: "24h" | "7d" | "30d" | "90d";
  onStatClick?: (statType: string) => void;
}

export default function GrowDashboardStats({
  selectedGrowId,
  timeRange = "30d",
  onStatClick,
}: GrowDashboardStatsProps) {
  const [stats, setStats] = useState<GrowStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Mock data - replace with actual API calls
    const mockStats: GrowStats = {
      totalActiveGrows: 24,
      totalPlannedGrows: 8,
      totalCompletedThisMonth: 15,
      avgCompletionRate: 92.5,
      totalYieldThisMonth: 45.8,
      avgYieldPerGrow: 2.1,
      automationEfficiency: 87.3,
      criticalAlerts: 2,
      environmentalScore: 94,
      resourceUtilization: 78.5,
      trends: {
        growsChange: 12.5,
        yieldChange: 8.3,
        efficiencyChange: -2.1,
      },
      upcomingHarvests: 6,
      energyUsage: 1247,
      waterUsage: 892,
      avgTemperature: 22.5,
    };

    setTimeout(() => {
      setStats(mockStats);
      setIsLoading(false);
    }, 500);
  }, [selectedGrowId, timeRange]);

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Activity className="h-4 w-4 text-gray-500" />;
  };

  const getTrendColor = (change: number) => {
    if (change > 0) return "text-green-600";
    if (change < 0) return "text-red-600";
    return "text-gray-600";
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {/* Active Grows */}
      <Card
        className="cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4 border-l-green-500"
        onClick={() => onStatClick?.("active-grows")}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Active Grows
              </p>
              <p className="text-2xl font-bold text-green-600">
                {stats.totalActiveGrows}
              </p>
              <div className="flex items-center gap-1 mt-1">
                {getTrendIcon(stats.trends.growsChange)}
                <span
                  className={`text-xs ${getTrendColor(stats.trends.growsChange)}`}
                >
                  {Math.abs(stats.trends.growsChange)}%
                </span>
              </div>
            </div>
            <Activity className="h-8 w-8 text-green-500 opacity-80" />
          </div>
        </CardContent>
      </Card>

      {/* Completion Rate */}
      <Card
        className="cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500"
        onClick={() => onStatClick?.("completion-rate")}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Success Rate
              </p>
              <p className="text-2xl font-bold text-blue-600">
                {stats.avgCompletionRate}%
              </p>
              <Progress value={stats.avgCompletionRate} className="h-2 mt-2" />
            </div>
            <Target className="h-8 w-8 text-blue-500 opacity-80" />
          </div>
        </CardContent>
      </Card>

      {/* Total Yield */}
      <Card
        className="cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4 border-l-yellow-500"
        onClick={() => onStatClick?.("yield")}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Monthly Yield
              </p>
              <p className="text-2xl font-bold text-yellow-600">
                {stats.totalYieldThisMonth} kg
              </p>
              <div className="flex items-center gap-1 mt-1">
                {getTrendIcon(stats.trends.yieldChange)}
                <span
                  className={`text-xs ${getTrendColor(stats.trends.yieldChange)}`}
                >
                  {Math.abs(stats.trends.yieldChange)}%
                </span>
              </div>
            </div>
            <Leaf className="h-8 w-8 text-yellow-500 opacity-80" />
          </div>
        </CardContent>
      </Card>

      {/* Automation Efficiency */}
      <Card
        className="cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4 border-l-purple-500"
        onClick={() => onStatClick?.("automation")}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Automation
              </p>
              <p className="text-2xl font-bold text-purple-600">
                {stats.automationEfficiency}%
              </p>
              <div className="flex items-center gap-1 mt-1">
                {getTrendIcon(stats.trends.efficiencyChange)}
                <span
                  className={`text-xs ${getTrendColor(stats.trends.efficiencyChange)}`}
                >
                  {Math.abs(stats.trends.efficiencyChange)}%
                </span>
              </div>
            </div>
            <Zap className="h-8 w-8 text-purple-500 opacity-80" />
          </div>
        </CardContent>
      </Card>

      {/* Critical Alerts */}
      <Card
        className={`cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4 ${
          stats.criticalAlerts > 0 ? "border-l-red-500" : "border-l-green-500"
        }`}
        onClick={() => onStatClick?.("alerts")}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Alerts
              </p>
              <p
                className={`text-2xl font-bold ${stats.criticalAlerts > 0 ? "text-red-600" : "text-green-600"}`}
              >
                {stats.criticalAlerts}
              </p>
              <Badge
                variant={stats.criticalAlerts > 0 ? "destructive" : "default"}
                className="text-xs mt-1"
              >
                {stats.criticalAlerts > 0 ? "Critical" : "All Clear"}
              </Badge>
            </div>
            {stats.criticalAlerts > 0 ? (
              <AlertTriangle className="h-8 w-8 text-red-500 opacity-80" />
            ) : (
              <CheckCircle className="h-8 w-8 text-green-500 opacity-80" />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Harvests */}
      <Card
        className="cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4 border-l-orange-500"
        onClick={() => onStatClick?.("harvests")}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Next 7 Days
              </p>
              <p className="text-2xl font-bold text-orange-600">
                {stats.upcomingHarvests}
              </p>
              <p className="text-xs text-gray-500 mt-1">Harvests due</p>
            </div>
            <Calendar className="h-8 w-8 text-orange-500 opacity-80" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
