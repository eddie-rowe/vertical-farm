import React from "react";
import { FaArrowUp, FaArrowDown, FaChevronRight } from "react-icons/fa";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";

import { CategoryCardProps } from "../types";

export const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  onClick,
}) => {
  const handleQuickAction = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
  };

  // Helper function to map category status to StatusBadge status type
  const getCategoryStatus = (status: typeof category.status) => {
    switch (status) {
      case "good":
        return "success";
      case "warning":
        return "warning";
      case "attention":
        return "warning";
      case "critical":
        return "error";
      default:
        return "info";
    }
  };

  const getPriorityColor = (priority: typeof category.priority) => {
    switch (priority) {
      case "urgent":
        return "border-l-red-500";
      case "high":
        return "border-l-orange-500";
      case "medium":
        return "border-l-yellow-500";
      case "low":
        return "border-l-green-500";
      default:
        return "border-l-gray-300 dark:border-l-gray-600";
    }
  };

  const getTrendIcon = (trend: typeof category.trend) => {
    switch (trend) {
      case "up":
        return (
          <FaArrowUp className="w-3 h-3 text-green-600 dark:text-green-400" />
        );
      case "down":
        return (
          <FaArrowDown className="w-3 h-3 text-red-600 dark:text-red-400" />
        );
      case "stable":
        return (
          <span className="w-3 h-3 bg-gray-400 dark:bg-gray-500 rounded-full" />
        );
      default:
        return null;
    }
  };

  return (
    <Card
      className={`bg-farm-white card-shadow hover:shadow-lg transition-shadow cursor-pointer border-l-4 ${getPriorityColor(category.priority)}`}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {category.title}
          </CardTitle>
          <StatusBadge status={getCategoryStatus(category.status)} size="sm">
            {category.status}
          </StatusBadge>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* Value and Change */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {category.value}
              </span>
              {getTrendIcon(category.trend)}
            </div>
            <span
              className={`text-sm font-medium ${
                category.trend === "up"
                  ? "text-green-600 dark:text-green-400"
                  : category.trend === "down"
                    ? "text-red-600 dark:text-red-400"
                    : "text-gray-600 dark:text-gray-300"
              }`}
            >
              {category.change}
            </span>
          </div>

          {/* Description */}
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
            {category.description}
          </p>

          {/* Quick Actions */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Quick Actions
              </span>
              <FaChevronRight className="w-3 h-3 text-gray-400 dark:text-gray-500" />
            </div>
            <div className="flex flex-wrap gap-2">
              {category.quickActions.map((action, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="text-xs px-3 py-1 h-auto"
                  onClick={(e) => handleQuickAction(e, action.onClick)}
                >
                  {action.text}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
