import React from "react";
import { CategoryCard } from "./CategoryCard";
import { ExecutiveSummaryProps } from "../types";
import { executiveSummaryData } from "../data/strategicData";

export const ExecutiveSummary: React.FC<ExecutiveSummaryProps> = ({
  onCategoryClick,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Executive Summary
        </h2>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-xs text-gray-600 dark:text-gray-300">
              Critical
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <span className="text-xs text-gray-600 dark:text-gray-300">
              High
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="text-xs text-gray-600 dark:text-gray-300">
              Medium
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-xs text-gray-600 dark:text-gray-300">
              Low
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {executiveSummaryData.categories.map((category) => (
          <CategoryCard
            key={category.id}
            category={category}
            onClick={() => onCategoryClick(category.id)}
          />
        ))}
      </div>
    </div>
  );
};
