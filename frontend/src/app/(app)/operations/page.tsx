'use client';

import { useState, useEffect } from 'react';
import { FaTachometerAlt, FaDollarSign, FaClock, FaLeaf, FaBolt, FaTint, FaUsers, FaArrowUp, FaArrowDown, FaChartLine, FaBoxes, FaTools } from '@/lib/icons';
import { DeliveryScheduleView, MaintenanceScheduleView, ResourceUsageChart } from '@/components/features/business';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface EfficiencyMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  change: number;
  period: string;
  status: 'good' | 'warning' | 'critical';
  icon: React.ReactNode;
}

interface CostBreakdown {
  category: string;
  amount: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
  icon: React.ReactNode;
}

interface PerformanceData {
  metric: string;
  current: number;
  target: number;
  unit: string;
  achievement: number;
}

export default function OperationsPage() {
  const [loading, setLoading] = useState(true);
  const [efficiencyMetrics, setEfficiencyMetrics] = useState<EfficiencyMetric[]>([]);
  const [costBreakdown, setCostBreakdown] = useState<CostBreakdown[]>([]);
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);

  useEffect(() => {
    loadOperationsData();
  }, []);

  const loadOperationsData = async () => {
    try {
      setLoading(true);
      
      // Mock data - replace with actual API calls
      const metrics: EfficiencyMetric[] = [
        {
          id: 'yield-efficiency',
          name: 'Yield per Sq Ft',
          value: 2.4,
          unit: 'lbs/sq ft',
          change: 8.2,
          period: 'vs last month',
          status: 'good',
          icon: <FaLeaf className="text-green-600" />
        },
        {
          id: 'energy-efficiency',
          name: 'Energy Efficiency',
          value: 0.32,
          unit: 'kWh/lb',
          change: -5.1,
          period: 'vs last month',
          status: 'good',
          icon: <FaBolt className="text-yellow-600" />
        },
        {
          id: 'water-efficiency',
          name: 'Water Usage',
          value: 1.8,
          unit: 'gal/lb',
          change: -12.3,
          period: 'vs last month',
          status: 'good',
          icon: <FaTint className="text-blue-600" />
        },
        {
          id: 'labor-efficiency',
          name: 'Labor Hours/Harvest',
          value: 4.2,
          unit: 'hrs/harvest',
          change: 3.7,
          period: 'vs last month',
          status: 'warning',
          icon: <FaUsers className="text-purple-600" />
        },
        {
          id: 'cost-per-unit',
          name: 'Cost per Pound',
          value: 12.45,
          unit: '$/lb',
          change: -2.1,
          period: 'vs last month',
          status: 'good',
          icon: <FaDollarSign className="text-green-600" />
        },
        {
          id: 'cycle-time',
          name: 'Average Cycle Time',
          value: 28,
          unit: 'days',
          change: 1.2,
          period: 'vs target',
          status: 'warning',
          icon: <FaClock className="text-orange-600" />
        }
      ];

      const costs: CostBreakdown[] = [
        {
          category: 'Energy',
          amount: 2840,
          percentage: 35,
          trend: 'down',
          icon: <FaBolt className="text-yellow-600" />
        },
        {
          category: 'Labor',
          amount: 2280,
          percentage: 28,
          trend: 'up',
          icon: <FaUsers className="text-purple-600" />
        },
        {
          category: 'Seeds & Materials',
          amount: 1620,
          percentage: 20,
          trend: 'stable',
          icon: <FaLeaf className="text-green-600" />
        },
        {
          category: 'Water & Nutrients',
          amount: 810,
          percentage: 10,
          trend: 'down',
          icon: <FaTint className="text-blue-600" />
        },
        {
          category: 'Maintenance',
          amount: 570,
          percentage: 7,
          trend: 'up',
          icon: <FaTachometerAlt className="text-gray-600" />
        }
      ];

      const performance: PerformanceData[] = [
        { metric: 'Monthly Yield', current: 420, target: 450, unit: 'lbs', achievement: 93.3 },
        { metric: 'Energy Usage', current: 1240, target: 1200, unit: 'kWh', achievement: 96.7 },
        { metric: 'Water Usage', current: 890, target: 950, unit: 'gallons', achievement: 106.7 },
        { metric: 'Labor Hours', current: 168, target: 160, unit: 'hours', achievement: 95.2 },
        { metric: 'Waste Reduction', current: 8.5, target: 10, unit: '%', achievement: 85.0 },
        { metric: 'Quality Score', current: 94, target: 95, unit: '%', achievement: 98.9 }
      ];

      setEfficiencyMetrics(metrics);
      setCostBreakdown(costs);
      setPerformanceData(performance);
    } catch (error) {
      console.error('Error loading operations data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: EfficiencyMetric['status']) => {
    switch (status) {
      case 'good': return 'text-green-600 bg-green-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'critical': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getTrendIcon = (change: number) => {
    if (change > 0) return <FaArrowUp className="text-green-500" />;
    if (change < 0) return <FaArrowDown className="text-red-500" />;
    return <FaChartLine className="text-gray-500" />;
  };

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return 'text-red-600';
      case 'down': return 'text-green-600';
      case 'stable': return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Operations</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Track efficiency, costs, and performance metrics across your farm operations
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">Export Report</Button>
          <Button>Generate Analysis</Button>
        </div>
      </div>

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {efficiencyMetrics.map((metric) => (
              <Card key={metric.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {metric.icon}
                      <CardTitle className="text-lg">{metric.name}</CardTitle>
                    </div>
                    <Badge className={getStatusColor(metric.status)}>
                      {metric.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-baseline space-x-2">
                      <span className="text-2xl font-bold text-gray-900 dark:text-white">
                        {metric.value}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {metric.unit}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1 text-sm">
                      {getTrendIcon(metric.change)}
                      <span className={metric.change >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {Math.abs(metric.change)}%
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">
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
            <Card>
              <CardHeader>
                <CardTitle>Monthly Cost Breakdown</CardTitle>
                <CardDescription>Operating costs by category for current month</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {costBreakdown.map((cost, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {cost.icon}
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{cost.category}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{cost.percentage}% of total</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900 dark:text-white">${cost.amount}</p>
                        <p className={`text-sm ${getTrendColor(cost.trend)}`}>
                          {cost.trend === 'up' ? '↗' : cost.trend === 'down' ? '↘' : '→'} {cost.trend}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-900 dark:text-white">Total Monthly Cost</span>
                    <span className="text-xl font-bold text-gray-900 dark:text-white">
                      ${costBreakdown.reduce((sum, cost) => sum + cost.amount, 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cost Trends</CardTitle>
                <CardDescription>Historical cost analysis and projections</CardDescription>
              </CardHeader>
              <CardContent>
                <ResourceUsageChart
                  data={[
                    { timestamp: '2024-01-01', waterUsage: 450, electricityUsage: 125, nutrientUsage: 85, co2Usage: 75, totalCost: 1247 },
                    { timestamp: '2024-01-02', waterUsage: 420, electricityUsage: 138, nutrientUsage: 92, co2Usage: 82, totalCost: 1385 },
                    { timestamp: '2024-01-03', waterUsage: 485, electricityUsage: 142, nutrientUsage: 88, co2Usage: 78, totalCost: 1425 },
                    { timestamp: '2024-01-04', waterUsage: 465, electricityUsage: 135, nutrientUsage: 95, co2Usage: 85, totalCost: 1368 },
                    { timestamp: '2024-01-05', waterUsage: 490, electricityUsage: 145, nutrientUsage: 90, co2Usage: 88, totalCost: 1456 },
                    { timestamp: '2024-01-06', waterUsage: 475, electricityUsage: 150, nutrientUsage: 98, co2Usage: 92, totalCost: 1487 },
                    { timestamp: '2024-01-07', waterUsage: 510, electricityUsage: 155, nutrientUsage: 102, co2Usage: 95, totalCost: 1523 }
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
            <Card>
              <CardHeader>
                <CardTitle>Performance vs Targets</CardTitle>
                <CardDescription>Current month performance against set targets</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {performanceData.map((item, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-900 dark:text-white">{item.metric}</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {item.current} / {item.target} {item.unit}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${item.achievement >= 100 ? 'bg-green-500' : item.achievement >= 90 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${Math.min(item.achievement, 100)}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className={`font-medium ${item.achievement >= 100 ? 'text-green-600' : item.achievement >= 90 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {item.achievement.toFixed(1)}% of target
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>ROI Analysis</CardTitle>
                <CardDescription>Return on investment and profitability metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <p className="text-sm text-green-600 dark:text-green-400">Revenue per sq ft</p>
                      <p className="text-2xl font-bold text-green-800 dark:text-green-300">$32.40</p>
                    </div>
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-sm text-blue-600 dark:text-blue-400">Profit Margin</p>
                      <p className="text-2xl font-bold text-blue-800 dark:text-blue-300">18.5%</p>
                    </div>
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <p className="text-sm text-purple-600 dark:text-purple-400">Payback Period</p>
                      <p className="text-2xl font-bold text-purple-800 dark:text-purple-300">14 mo</p>
                    </div>
                    <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                      <p className="text-sm text-orange-600 dark:text-orange-400">Break-even</p>
                      <p className="text-2xl font-bold text-orange-800 dark:text-orange-300">342 lbs</p>
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