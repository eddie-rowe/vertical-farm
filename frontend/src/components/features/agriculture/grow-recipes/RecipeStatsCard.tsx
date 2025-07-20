"use client";

import { TrendingUp, Clock, Star, Leaf } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RecipeStatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  icon: React.ComponentType<{ className?: string }>;
  variant?: "default" | "success" | "warning" | "info";
}

export function RecipeStatsCard({
  title,
  value,
  subtitle,
  trend,
  icon: Icon,
  variant = "default",
}: RecipeStatsCardProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case "success":
        return "border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20";
      case "warning":
        return "border-yellow-200 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-950/20";
      case "info":
        return "border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20";
      default:
        return "border-border";
    }
  };

  const getIconColor = () => {
    switch (variant) {
      case "success":
        return "text-green-600 dark:text-green-400";
      case "warning":
        return "text-yellow-600 dark:text-yellow-400";
      case "info":
        return "text-blue-600 dark:text-blue-400";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <Card
      className={`transition-all duration-200 hover:shadow-md ${getVariantStyles()}`}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${getIconColor()}`} />
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline space-x-2">
          <div className="text-2xl font-bold">{value}</div>
          {trend && (
            <Badge
              variant="outline"
              className={`text-xs ${
                trend.isPositive
                  ? "text-green-600 border-green-200 bg-green-50 dark:text-green-400 dark:border-green-800 dark:bg-green-950/20"
                  : "text-red-600 border-red-200 bg-red-50 dark:text-red-400 dark:border-red-800 dark:bg-red-950/20"
              }`}
            >
              <TrendingUp
                className={`h-3 w-3 mr-1 ${trend.isPositive ? "" : "rotate-180"}`}
              />
              {Math.abs(trend.value)}%
            </Badge>
          )}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

// Pre-configured stat card components for common metrics
export function TotalRecipesCard({
  count,
  trend,
}: {
  count: number;
  trend?: { value: number; isPositive: boolean };
}) {
  return (
    <RecipeStatsCard
      title="Total Recipes"
      value={count}
      subtitle="Active grow recipes"
      trend={trend}
      icon={Leaf}
      variant="info"
    />
  );
}

export function AvgSuccessRateCard({
  rate,
  trend,
}: {
  rate: number;
  trend?: { value: number; isPositive: boolean };
}) {
  return (
    <RecipeStatsCard
      title="Avg Success Rate"
      value={`${rate}%`}
      subtitle="Recipe effectiveness"
      trend={trend}
      icon={Star}
      variant="success"
    />
  );
}

export function AvgGrowTimeCard({
  days,
  trend,
}: {
  days: number;
  trend?: { value: number; isPositive: boolean };
}) {
  return (
    <RecipeStatsCard
      title="Avg Grow Time"
      value={`${days}d`}
      subtitle="Average recipe duration"
      trend={trend}
      icon={Clock}
      variant="default"
    />
  );
}
