import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StrategicCardProps } from "../types";

export const StrategicCard: React.FC<StrategicCardProps> = ({
  title,
  icon: Icon,
  children,
  priority = "normal",
  className = "",
}) => {
  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "border-l-red-500";
      case "high":
        return "border-l-orange-500";
      case "low":
        return "border-l-green-500";
      case "normal":
      default:
        return "border-l-gray-300 dark:border-l-gray-600";
    }
  };

  return (
    <Card
      className={`bg-farm-white card-shadow hover:shadow-lg transition-shadow border-l-4 ${getPriorityStyles(priority)} ${className}`}
    >
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
          <Icon className="w-5 h-5" />
          <span>{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">{children}</CardContent>
    </Card>
  );
};
