"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  FaSeedling,
  FaLeaf,
  FaCalendarAlt,
  FaHeartbeat,
  FaExclamationTriangle,
  FaCheckCircle,
  FaClock,
  FaArrowRight,
  FaPlus,
  FaEye,
  FaTools,
  FaChartLine,
} from "react-icons/fa";

// Mock data for demonstration
const dashboardData = {
  keyMetrics: {
    totalActiveGrows: 24,
    germinationSuccessRate: 94,
    daysToNextHarvest: 3,
    systemHealthScore: 98,
  },
  germinationTents: [
    {
      id: "GT-01",
      name: "Germination Tent 1",
      cropType: "Pea Shoots",
      daysSinceSeeding: 4,
      germinationRate: 96,
      expectedTransplantDate: "2025-01-22",
      status: "healthy",
      temperature: 22.5,
      humidity: 75,
    },
    {
      id: "GT-02",
      name: "Germination Tent 2",
      cropType: "Radish Microgreens",
      daysSinceSeeding: 2,
      germinationRate: 89,
      expectedTransplantDate: "2025-01-25",
      status: "healthy",
      temperature: 21.8,
      humidity: 72,
    },
    {
      id: "GT-03",
      name: "Germination Tent 3",
      cropType: "Sunflower Shoots",
      daysSinceSeeding: 6,
      germinationRate: 92,
      expectedTransplantDate: "2025-01-20",
      status: "ready_for_transplant",
      temperature: 23.1,
      humidity: 78,
    },
    {
      id: "GT-04",
      name: "Germination Tent 4",
      cropType: "Empty",
      daysSinceSeeding: 0,
      germinationRate: 0,
      expectedTransplantDate: null,
      status: "empty",
      temperature: 20.0,
      humidity: 60,
    },
  ],
  growingAreas: [
    {
      id: "GA-A1",
      name: "Growing Area A - Rack 1",
      cropType: "Basil",
      daysSinceTransplant: 12,
      growthStage: "vegetative",
      expectedHarvestDate: "2025-01-23",
      status: "healthy",
      occupancyRate: 100,
    },
    {
      id: "GA-A2",
      name: "Growing Area A - Rack 2",
      cropType: "Lettuce Mix",
      daysSinceTransplant: 8,
      growthStage: "early_vegetative",
      expectedHarvestDate: "2025-01-27",
      status: "healthy",
      occupancyRate: 85,
    },
    {
      id: "GA-B1",
      name: "Growing Area B - Rack 1",
      cropType: "Arugula",
      daysSinceTransplant: 15,
      growthStage: "mature",
      expectedHarvestDate: "2025-01-21",
      status: "ready_for_harvest",
      occupancyRate: 100,
    },
    {
      id: "GA-B2",
      name: "Growing Area B - Rack 2",
      cropType: "Empty",
      daysSinceTransplant: 0,
      growthStage: "empty",
      expectedHarvestDate: null,
      status: "empty",
      occupancyRate: 0,
    },
  ],
  todaysTasks: [
    {
      id: 1,
      task: "Harvest Arugula from GA-B1",
      priority: "high",
      estimatedTime: "2 hours",
      status: "pending",
      dueTime: "10:00 AM",
    },
    {
      id: 2,
      task: "Transplant Sunflower Shoots from GT-03",
      priority: "high",
      estimatedTime: "1.5 hours",
      status: "pending",
      dueTime: "2:00 PM",
    },
    {
      id: 3,
      task: "Seed new batch of Pea Shoots",
      priority: "medium",
      estimatedTime: "45 minutes",
      status: "in_progress",
      dueTime: "4:00 PM",
    },
    {
      id: 4,
      task: "Clean and sanitize GT-04",
      priority: "low",
      estimatedTime: "30 minutes",
      status: "pending",
      dueTime: "End of day",
    },
  ],
  alerts: [
    {
      id: 1,
      type: "system",
      severity: "medium",
      message: "Temperature sensor in GT-02 showing slight variance",
      timestamp: "2 hours ago",
    },
    {
      id: 2,
      type: "crop",
      severity: "low",
      message: "Lettuce Mix in GA-A2 growth rate slightly below average",
      timestamp: "6 hours ago",
    },
  ],
};

// Component for metric cards
const MetricCard = ({
  title,
  value,
  unit,
  icon: Icon,
  trend,
  color = "blue",
}: {
  title: string;
  value: number | string;
  unit?: string;
  icon: any;
  trend?: "up" | "down" | "stable";
  color?: "blue" | "green" | "orange" | "red";
}) => {
  const colorClasses = {
    blue: "text-blue-600 bg-blue-50",
    green: "text-green-600 bg-green-50",
    orange: "text-orange-600 bg-orange-50",
    red: "text-red-600 bg-red-50",
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-gray-900">{value}</span>
              {unit && <span className="text-sm text-gray-500">{unit}</span>}
            </div>
          </div>
          <div className={`p-3 rounded-full ${colorClasses[color]}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Component for status overview cards
const StatusCard = ({
  title,
  items,
  type,
  onViewAll,
}: {
  title: string;
  items: any[];
  type: "germination" | "growing";
  onViewAll: () => void;
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "text-green-600 bg-green-50";
      case "ready_for_transplant":
        return "text-blue-600 bg-blue-50";
      case "ready_for_harvest":
        return "text-purple-600 bg-purple-50";
      case "needs_attention":
        return "text-orange-600 bg-orange-50";
      case "empty":
        return "text-gray-400 bg-gray-50";
      default:
        return "text-gray-400 bg-gray-50";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "healthy":
        return "Healthy";
      case "ready_for_transplant":
        return "Ready to Transplant";
      case "ready_for_harvest":
        return "Ready to Harvest";
      case "needs_attention":
        return "Needs Attention";
      case "empty":
        return "Empty";
      default:
        return status;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{title}</CardTitle>
          <Button variant="outline" size="sm" onClick={onViewAll}>
            <FaEye className="h-4 w-4 mr-2" />
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 rounded-lg border"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">{item.name}</span>
                  <Badge className={`text-xs ${getStatusColor(item.status)}`}>
                    {getStatusText(item.status)}
                  </Badge>
                </div>
                <div className="text-sm text-gray-600">
                  {type === "germination" ? (
                    <>
                      {item.cropType !== "Empty" ? (
                        <>
                          {item.cropType} • Day {item.daysSinceSeeding} •{" "}
                          {item.germinationRate}% germination
                        </>
                      ) : (
                        "Available for seeding"
                      )}
                    </>
                  ) : (
                    <>
                      {item.cropType !== "Empty" ? (
                        <>
                          {item.cropType} • Day {item.daysSinceTransplant} •{" "}
                          {item.growthStage.replace("_", " ")}
                        </>
                      ) : (
                        "Available for transplanting"
                      )}
                    </>
                  )}
                </div>
                {type === "germination" && item.germinationRate > 0 && (
                  <div className="mt-2">
                    <Progress value={item.germinationRate} className="h-2" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Component for tasks
const TasksCard = ({
  tasks,
  onViewAll,
}: {
  tasks: any[];
  onViewAll: () => void;
}) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-600 bg-red-50";
      case "medium":
        return "text-orange-600 bg-orange-50";
      case "low":
        return "text-green-600 bg-green-50";
      default:
        return "text-gray-400 bg-gray-50";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <FaCheckCircle className="h-4 w-4 text-green-600" />;
      case "in_progress":
        return <FaClock className="h-4 w-4 text-blue-600" />;
      case "pending":
        return <FaClock className="h-4 w-4 text-gray-400" />;
      default:
        return <FaClock className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Today's Critical Tasks</CardTitle>
          <Button variant="outline" size="sm" onClick={onViewAll}>
            <FaCalendarAlt className="h-4 w-4 mr-2" />
            View Schedule
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center gap-3 p-3 rounded-lg border"
            >
              {getStatusIcon(task.status)}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">{task.task}</span>
                  <Badge
                    className={`text-xs ${getPriorityColor(task.priority)}`}
                  >
                    {task.priority}
                  </Badge>
                </div>
                <div className="text-sm text-gray-600">
                  {task.estimatedTime} • Due: {task.dueTime}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Component for alerts
const AlertsCard = ({ alerts }: { alerts: any[] }) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "text-red-600 bg-red-50 border-red-200";
      case "medium":
        return "text-orange-600 bg-orange-50 border-orange-200";
      case "low":
        return "text-blue-600 bg-blue-50 border-blue-200";
      default:
        return "text-gray-400 bg-gray-50 border-gray-200";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "system":
        return <FaTools className="h-4 w-4" />;
      case "crop":
        return <FaLeaf className="h-4 w-4" />;
      default:
        return <FaExclamationTriangle className="h-4 w-4" />;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Recent Alerts</CardTitle>
      </CardHeader>
      <CardContent>
        {alerts.length > 0 ? (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`flex items-start gap-3 p-3 rounded-lg border ${getSeverityColor(alert.severity)}`}
              >
                {getTypeIcon(alert.type)}
                <div className="flex-1">
                  <p className="text-sm font-medium">{alert.message}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {alert.timestamp}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <FaCheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <p className="text-sm text-gray-600">No active alerts</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Component for quick actions
const QuickActionsCard = ({
  onNavigateToTab,
}: {
  onNavigateToTab: (tab: string) => void;
}) => {
  const actions = [
    {
      title: "Start New Grow",
      description: "Set up a new growing cycle",
      icon: FaPlus,
      color: "bg-green-500 hover:bg-green-600",
      tab: "setup",
    },
    {
      title: "Germination Overview",
      description: "Monitor all germination tents",
      icon: FaSeedling,
      color: "bg-blue-500 hover:bg-blue-600",
      tab: "germination",
    },
    {
      title: "Transplant Manager",
      description: "Manage seedling transplants",
      icon: FaArrowRight,
      color: "bg-purple-500 hover:bg-purple-600",
      tab: "transplant",
    },
    {
      title: "Parameters & Recipes",
      description: "Adjust growing parameters",
      icon: FaChartLine,
      color: "bg-orange-500 hover:bg-orange-600",
      tab: "parameters",
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Quick Actions</CardTitle>
        <CardDescription>Jump to key management areas</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {actions.map((action) => (
            <Button
              key={action.tab}
              variant="outline"
              className="h-auto p-4 flex flex-col items-center gap-2 hover:shadow-md transition-all"
              onClick={() => onNavigateToTab(action.tab)}
            >
              <div className={`p-2 rounded-full text-white ${action.color}`}>
                <action.icon className="h-4 w-4" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">{action.title}</p>
                <p className="text-xs text-gray-500">{action.description}</p>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Main dashboard component
export const GrowOperationsDashboard = ({
  onNavigateToTab,
}: {
  onNavigateToTab: (tab: string) => void;
}) => {
  const { keyMetrics, germinationTents, growingAreas, todaysTasks, alerts } =
    dashboardData;

  const handleViewGermination = () => onNavigateToTab("germination");
  const handleViewGrowing = () => onNavigateToTab("parameters");
  const handleViewTasks = () => onNavigateToTab("setup"); // Could be a dedicated tasks tab in the future

  return (
    <div className="space-y-6">
      {/* Key Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Active Grows"
          value={keyMetrics.totalActiveGrows}
          icon={FaLeaf}
          color="green"
        />
        <MetricCard
          title="Germination Success"
          value={keyMetrics.germinationSuccessRate}
          unit="%"
          icon={FaSeedling}
          color="blue"
        />
        <MetricCard
          title="Next Harvest"
          value={keyMetrics.daysToNextHarvest}
          unit="days"
          icon={FaCalendarAlt}
          color="orange"
        />
        <MetricCard
          title="System Health"
          value={keyMetrics.systemHealthScore}
          unit="%"
          icon={FaHeartbeat}
          color="green"
        />
      </div>

      {/* Status Overview Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StatusCard
          title="Germination Tents"
          items={germinationTents}
          type="germination"
          onViewAll={handleViewGermination}
        />
        <StatusCard
          title="Growing Areas"
          items={growingAreas}
          type="growing"
          onViewAll={handleViewGrowing}
        />
      </div>

      {/* Tasks and Alerts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TasksCard tasks={todaysTasks} onViewAll={handleViewTasks} />
        <AlertsCard alerts={alerts} />
      </div>

      {/* Quick Actions Row */}
      <QuickActionsCard onNavigateToTab={onNavigateToTab} />
    </div>
  );
};
