import { useState, useEffect } from "react";
import { DashboardView } from "../types";
import { strategicData, executiveSummaryData } from "../data/strategicData";

export const useDashboard = () => {
  const [currentView, setCurrentView] = useState<DashboardView>("executive");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);

  // Update time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const handleCategoryClick = (categoryId: string) => {
    setCurrentView(categoryId as DashboardView);
  };

  const handleBackToExecutive = () => {
    setCurrentView("executive");
  };

  const refreshData = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      // In a real app, this would fetch fresh data
    } catch (error) {
      console.error("Error refreshing dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    currentView,
    currentTime,
    isLoading,
    strategicData,
    executiveSummaryData,
    handleCategoryClick,
    handleBackToExecutive,
    refreshData,
  };
};
