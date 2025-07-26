"use client";

import {
  DeliveryScheduleView,
  MaintenanceScheduleView,
  ResourceUsageChart,
} from "@/components/features/business";
import { usePageData } from "@/components/shared/hooks/usePageData";
import { MetricsGrid } from "@/components/shared/metrics";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FarmControlButton } from "@/components/ui/farm-control-button";
import { PageHeader } from "@/components/ui/PageHeader";
import { SkeletonDashboard } from "@/components/ui/skeleton-extended";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FaTachometerAlt,
  FaDollarSign,
  FaClock,
  FaLeaf,
  FaBolt,
  FaTint,
  FaUsers,
  FaArrowUp,
  FaArrowDown,
  FaChartLine,
  FaBoxes,
  FaTools,
} from "@/lib/icons";

interface EfficiencyMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  change: number;
  period: string;
  status: "good" | "warning" | "critical";
  icon: React.ReactNode;
}

interface CostBreakdown {
  category: string;
  amount: number;
  percentage: number;
  trend: "up" | "down" | "stable";
  icon: React.ReactNode;
}

interface PerformanceData {
  metric: string;
  current: number;
  target: number;
  unit: string;
  achievement: number;
}

interface OperationsData {
  efficiencyMetrics: EfficiencyMetric[];
  costBreakdown: CostBreakdown[];
  performanceData: PerformanceData[];
}

// Mock data generation function
const generateMockOperationsData = (): OperationsData => {
  const metrics: EfficiencyMetric[] = [
    {
      id: "yield-efficiency",
      name: "Yield per Sq Ft",
      value: 2.4,
      unit: "lbs/sq ft",
      change: 8.2,
      period: "vs last month",
      status: "good",
      icon: <FaLeaf className="text-green-600" />,
    },
    {
      id: "energy-efficiency",
      name: "Energy Efficiency",
      value: 0.32,
      unit: "kWh/lb",
      change: -5.1,
      period: "vs last month",
      status: "good",
      icon: <FaBolt className="text-yellow-600" />,
    },
    {
      id: "water-efficiency",
      name: "Water Usage",
      value: 1.8,
      unit: "gal/lb",
      change: -12.3,
      period: "vs last month",
      status: "good",
      icon: <FaTint className="text-blue-600" />,
    },
    {
      id: "labor-efficiency",
      name: "Labor Hours/Harvest",
      value: 4.2,
      unit: "hrs/harvest",
      change: 3.7,
      period: "vs last month",
      status: "warning",
      icon: <FaUsers className="text-purple-600" />,
    },
    {
      id: "cost-per-unit",
      name: "Cost per Pound",
      value: 12.45,
      unit: "$/lb",
      change: -2.1,
      period: "vs last month",
      status: "good",
      icon: <FaDollarSign className="text-green-600" />,
    },
    {
      id: "cycle-time",
      name: "Average Cycle Time",
      value: 28,
      unit: "days",
      change: 1.2,
      period: "vs target",
      status: "warning",
      icon: <FaClock className="text-orange-600" />,
    },
  ];

  const costs: CostBreakdown[] = [
    {
      category: "Energy",
      amount: 2840,
      percentage: 35,
      trend: "down",
      icon: <FaBolt className="text-yellow-600" />,
    },
    {
      category: "Labor",
      amount: 2280,
      percentage: 28,
      trend: "up",
      icon: <FaUsers className="text-purple-600" />,
    },
    {
      category: "Seeds & Materials",
      amount: 1620,
      percentage: 20,
      trend: "stable",
      icon: <FaLeaf className="text-green-600" />,
    },
    {
      category: "Water & Nutrients",
      amount: 810,
      percentage: 10,
      trend: "down",
      icon: <FaTint className="text-blue-600" />,
    },
    {
      category: "Maintenance",
      amount: 570,
      percentage: 7,
      trend: "up",
      icon: <FaTachometerAlt className="text-gray-600" />,
    },
  ];

  const performance: PerformanceData[] = [
    {
      metric: "Monthly Yield",
      current: 420,
      target: 450,
      unit: "lbs",
      achievement: 93.3,
    },
    {
      metric: "Energy Usage",
      current: 1240,
      target: 1200,
      unit: "kWh",
      achievement: 96.7,
    },
    {
      metric: "Water Usage",
      current: 890,
      target: 950,
      unit: "gallons",
      achievement: 106.7,
    },
    {
      metric: "Labor Hours",
      current: 168,
      target: 160,
      unit: "hours",
      achievement: 95.2,
    },
    {
      metric: "Waste Reduction",
      current: 8.5,
      target: 10,
      unit: "%",
      achievement: 85.0,
    },
    {
      metric: "Quality Score",
      current: 94,
      target: 95,
      unit: "%",
      achievement: 98.9,
    },
  ];

  return {
    efficiencyMetrics: metrics,
    costBreakdown: costs,
    performanceData: performance,
  };
};

export default function OperationsPage() {
  // Use our standardized data loading hook
  const { data: operationsData, isLoading } = usePageData<OperationsData>({
    storageKey: "operations-integrations-connected",
    mockData: generateMockOperationsData(),
  });

  // Extract data with fallbacks
  const efficiencyMetrics = operationsData?.efficiencyMetrics || [];
  const costBreakdown = operationsData?.costBreakdown || [];
  const performanceData = operationsData?.performanceData || [];

  const getStatusType = (
    status: EfficiencyMetric["status"],
  ): "success" | "warning" | "error" => {
    switch (status) {
      case "good":
        return "success";
      case "warning":
        return "warning";
      case "critical":
        return "error";
      default:
        return "warning";
    }
  };

  // Helper for MetricsGrid compatibility
  const getStatusColor = (status: EfficiencyMetric["status"]) => {
    switch (status) {
      case "good":
        return "state-growing";
      case "warning":
        return "state-maintenance";
      case "critical":
        return "state-offline";
      default:
        return "text-control-label";
    }
  };

  const getTrendIcon = (change: number) => {
    if (change > 0) return <FaArrowUp className="text-green-500" />;
    if (change < 0) return <FaArrowDown className="text-red-500" />;
    return <FaChartLine className="text-gray-500" />;
  };

  const getTrendColor = (trend: "up" | "down" | "stable") => {
    switch (trend) {
      case "up":
        return "state-offline";
      case "down":
        return "state-growing";
      case "stable":
        return "text-control-label";
    }
  };

  if (isLoading) {
    return <SkeletonDashboard metricCards={6} showSidebar={true} />;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader
        title="Operations"
        description="Track efficiency, costs, and performance metrics across your farm operations"
      >
        <div className="flex space-x-2">
          <FarmControlButton variant="default" animation="float">
            Export Report
          </FarmControlButton>
          <FarmControlButton variant="primary" animation="pop">
            Generate Analysis
          </FarmControlButton>
        </div>
      </PageHeader>

      <Tabs defaultValue="efficiency" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="efficiency">Efficiency Metrics</TabsTrigger>
          <TabsTrigger value="costs">Cost Analysis</TabsTrigger>
          <TabsTrigger value="performance">Performance Tracking</TabsTrigger>
          <TabsTrigger value="delivery" className="flex items-center gap-2">
            <FaBoxes className="h-4 w-4" />
            Delivery Schedule
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="flex items-center gap-2">
            <FaTools className="h-4 w-4" />
            Maintenance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="efficiency" className="space-y-6">
          {/* Use standardized MetricsGrid for basic metrics overview */}
          <MetricsGrid
            columns={3}
            metrics={efficiencyMetrics.slice(0, 3).map((metric) => ({
              id: metric.id,
              label: metric.name,
              value: `${metric.value} ${metric.unit}`,
              icon: () => metric.icon,
              stateClass: getStatusColor(metric.status),
            }))}
          />

          {/* Detailed efficiency metrics cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {efficiencyMetrics.map((metric) => (
              <Card
                key={metric.id}
                className="hover:shadow-lg transition-shadow card-shadow"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {metric.icon}
                      <CardTitle className="text-farm-title">
                        {metric.name}
                      </CardTitle>
                    </div>
                    <StatusBadge status={getStatusType(metric.status)}>
                      {metric.status}
                    </StatusBadge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-baseline space-x-2">
                      <span className="text-sensor-value">{metric.value}</span>
                      <span className="text-control-label">{metric.unit}</span>
                    </div>
                    <div className="flex items-center space-x-1 text-control-label">
                      {getTrendIcon(metric.change)}
                      <span
                        className={
                          metric.change >= 0 ? "state-growing" : "state-offline"
                        }
                      >
                        {Math.abs(metric.change)}%
                      </span>
                      <span className="text-control-label">
                        {metric.period}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="costs" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="card-shadow">
              <CardHeader>
                <CardTitle className="text-farm-title">
                  Monthly Cost Breakdown
                </CardTitle>
                <CardDescription className="text-control-label">
                  Operating costs by category for current month
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {costBreakdown.map((cost, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        {cost.icon}
                        <div>
                          <p className="text-control-label font-medium">
                            {cost.category}
                          </p>
                          <p className="text-control-label opacity-70">
                            {cost.percentage}% of total
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sensor-value">${cost.amount}</p>
                        <p
                          className={`text-control-label ${getTrendColor(cost.trend)}`}
                        >
                          {cost.trend === "up"
                            ? "↗"
                            : cost.trend === "down"
                              ? "↘"
                              : "→"}{" "}
                          {cost.trend}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center">
                    <span className="text-farm-title">Total Monthly Cost</span>
                    <span className="text-sensor-value">
                      $
                      {costBreakdown
                        .reduce((sum, cost) => sum + cost.amount, 0)
                        .toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-shadow">
              <CardHeader>
                <CardTitle className="text-farm-title">Cost Trends</CardTitle>
                <CardDescription className="text-control-label">
                  Historical cost analysis and projections
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResourceUsageChart
                  data={[
                    {
                      timestamp: "2024-01-01",
                      waterUsage: 450,
                      electricityUsage: 125,
                      nutrientUsage: 85,
                      co2Usage: 75,
                      totalCost: 1247,
                    },
                    {
                      timestamp: "2024-01-02",
                      waterUsage: 420,
                      electricityUsage: 138,
                      nutrientUsage: 92,
                      co2Usage: 82,
                      totalCost: 1385,
                    },
                    {
                      timestamp: "2024-01-03",
                      waterUsage: 485,
                      electricityUsage: 142,
                      nutrientUsage: 88,
                      co2Usage: 78,
                      totalCost: 1425,
                    },
                    {
                      timestamp: "2024-01-04",
                      waterUsage: 465,
                      electricityUsage: 135,
                      nutrientUsage: 95,
                      co2Usage: 85,
                      totalCost: 1368,
                    },
                    {
                      timestamp: "2024-01-05",
                      waterUsage: 490,
                      electricityUsage: 145,
                      nutrientUsage: 90,
                      co2Usage: 88,
                      totalCost: 1456,
                    },
                    {
                      timestamp: "2024-01-06",
                      waterUsage: 475,
                      electricityUsage: 150,
                      nutrientUsage: 98,
                      co2Usage: 92,
                      totalCost: 1487,
                    },
                    {
                      timestamp: "2024-01-07",
                      waterUsage: 510,
                      electricityUsage: 155,
                      nutrientUsage: 102,
                      co2Usage: 95,
                      totalCost: 1523,
                    },
                  ]}
                  title="Daily Operating Costs"
                  height={250}
                  chartType="area"
                  showCosts={true}
                  timeRange="7d"
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="card-shadow">
              <CardHeader>
                <CardTitle className="text-farm-title">
                  Performance vs Targets
                </CardTitle>
                <CardDescription className="text-control-label">
                  Current month performance against set targets
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {performanceData.map((item, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-control-label font-medium">
                          {item.metric}
                        </span>
                        <span className="text-control-label">
                          {item.current} / {item.target} {item.unit}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${item.achievement >= 100 ? "bg-green-500" : item.achievement >= 90 ? "bg-yellow-500" : "bg-red-500"}`}
                          style={{
                            width: `${Math.min(item.achievement, 100)}%`,
                          }}
                        ></div>
                      </div>
                      <div className="flex justify-between items-center text-control-label">
                        <span
                          className={`font-medium ${item.achievement >= 100 ? "state-growing" : item.achievement >= 90 ? "state-maintenance" : "state-offline"}`}
                        >
                          {item.achievement.toFixed(1)}% of target
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="card-shadow">
              <CardHeader>
                <CardTitle className="text-farm-title">ROI Analysis</CardTitle>
                <CardDescription className="text-control-label">
                  Return on investment and profitability metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg state-growing">
                      <p className="text-control-label">Revenue per sq ft</p>
                      <p className="text-sensor-value">$32.40</p>
                    </div>
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg state-active">
                      <p className="text-control-label">Profit Margin</p>
                      <p className="text-sensor-value">18.5%</p>
                    </div>
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg state-active">
                      <p className="text-control-label">Payback Period</p>
                      <p className="text-sensor-value">14 mo</p>
                    </div>
                    <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg state-maintenance">
                      <p className="text-control-label">Break-even</p>
                      <p className="text-sensor-value">342 lbs</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="delivery">
          <DeliveryScheduleView />
        </TabsContent>

        <TabsContent value="maintenance">
          <MaintenanceScheduleView />
        </TabsContent>
      </Tabs>
    </div>
  );
}
