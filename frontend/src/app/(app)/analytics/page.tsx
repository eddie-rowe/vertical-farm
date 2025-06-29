"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FaChartBar, 
  FaChartLine, 
  FaArrowUp, 
  FaArrowDown, 
  FaDollarSign, 
  FaLeaf, 
  FaUsers, 
  FaCalendarAlt 
} from '@/lib/icons';
import { 
  Calendar, 
  Download, 
  TrendingUp, 
  TrendingDown,
  Award, 
  BarChart3, 
  Search, 
  Filter,
  PieChart,
  Activity 
} from "lucide-react";

interface HistoricalGrow {
  id: string;
  shelf_name: string;
  farm_name: string;
  recipe_name: string;
  species_name: string;
  start_date: string;
  end_date: string;
  status: 'completed' | 'aborted';
  yield_kg?: number;
  duration_days: number;
  target_duration_days: number;
  notes?: string;
}

const AnalyticsPage = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [historicalGrows, setHistoricalGrows] = useState<HistoricalGrow[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [timeRange, setTimeRange] = useState('all');
  const [sortBy, setSortBy] = useState('end_date');
  const [isLoading, setIsLoading] = useState(true);

  // Load historical grow data
  useEffect(() => {
    const mockHistory: HistoricalGrow[] = [
      {
        id: "hist-1",
        shelf_name: "Shelf A1-1-1",
        farm_name: "Greenhouse A",
        recipe_name: "Quick Lettuce",
        species_name: "Lettuce",
        start_date: "2023-12-01",
        end_date: "2024-01-05",
        status: "completed",
        yield_kg: 2.3,
        duration_days: 35,
        target_duration_days: 35,
        notes: "Excellent harvest - exceeded yield expectations"
      },
      {
        id: "hist-2",
        shelf_name: "Shelf A1-1-2",
        farm_name: "Greenhouse A",
        recipe_name: "Premium Basil",
        species_name: "Basil",
        start_date: "2023-11-15",
        end_date: "2024-01-08",
        status: "completed",
        yield_kg: 1.8,
        duration_days: 54,
        target_duration_days: 49,
        notes: "Good quality, slightly longer than expected"
      },
      {
        id: "hist-3",
        shelf_name: "Shelf B1-1-1",
        farm_name: "Greenhouse A",
        recipe_name: "Quick Lettuce",
        species_name: "Lettuce",
        start_date: "2023-11-01",
        end_date: "2023-12-10",
        status: "aborted",
        duration_days: 39,
        target_duration_days: 35,
        notes: "Pest infestation - had to abort"
      },
      {
        id: "hist-4",
        shelf_name: "Shelf A1-2-1",
        farm_name: "Greenhouse A",
        recipe_name: "Premium Basil",
        species_name: "Basil",
        start_date: "2023-10-15",
        end_date: "2023-12-03",
        status: "completed",
        yield_kg: 1.9,
        duration_days: 49,
        target_duration_days: 49,
        notes: "Perfect harvest timing"
      },
      {
        id: "hist-5",
        shelf_name: "Shelf B1-1-2",
        farm_name: "Greenhouse A",
        recipe_name: "Quick Lettuce",
        species_name: "Lettuce",
        start_date: "2023-10-01",
        end_date: "2023-11-08",
        status: "completed",
        yield_kg: 2.1,
        duration_days: 38,
        target_duration_days: 35,
        notes: "Good yield, slightly extended growing period"
      }
    ];

    setHistoricalGrows(mockHistory);
    setIsLoading(false);
  }, []);

  // Calculate analytics from grow data
  const filteredGrows = historicalGrows.filter(grow => {
    const matchesSearch = !searchTerm || 
      grow.species_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      grow.recipe_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      grow.shelf_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      grow.farm_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const sortedGrows = [...filteredGrows].sort((a, b) => {
    switch (sortBy) {
      case 'yield':
        return (b.yield_kg || 0) - (a.yield_kg || 0);
      case 'duration':
        return b.duration_days - a.duration_days;
      case 'species':
        return a.species_name.localeCompare(b.species_name);
      default: // end_date
        return new Date(b.end_date).getTime() - new Date(a.end_date).getTime();
    }
  });

  // Analytics calculations
  const totalGrows = filteredGrows.length;
  const completedGrows = filteredGrows.filter(g => g.status === 'completed');
  const totalYield = completedGrows.reduce((sum, grow) => sum + (grow.yield_kg || 0), 0);
  const averageYield = completedGrows.length > 0 ? totalYield / completedGrows.length : 0;
  const successRate = totalGrows > 0 ? (completedGrows.length / totalGrows) * 100 : 0;

  // Business calculations (enhanced with real data)
  const estimatedRevenue = totalYield * 15; // Assuming $15/kg average price
  const totalCustomers = 573; // This would come from customer data
  const monthlyGrowthRate = 12.5;

  const exportData = () => {
    const csvContent = [
      'Shelf,Farm,Recipe,Species,Start Date,End Date,Status,Yield (kg),Duration (days),Target Duration,Notes',
      ...sortedGrows.map(grow => 
        `${grow.shelf_name},${grow.farm_name},${grow.recipe_name},${grow.species_name},${grow.start_date},${grow.end_date},${grow.status},${grow.yield_kg || ''},${grow.duration_days},${grow.target_duration_days},"${grow.notes || ''}"`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'grow-analytics.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
          <FaChartBar className="text-green-600" />
          Analytics Dashboard
        </h1>
        <Button onClick={exportData} variant="outline" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export Data
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="grows" className="flex items-center gap-2">
            <FaLeaf className="h-4 w-4" />
            Grow Analytics
          </TabsTrigger>
          <TabsTrigger value="business" className="flex items-center gap-2">
            <FaDollarSign className="h-4 w-4" />
            Business Analytics
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Performance
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Grows</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{totalGrows}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">All time</p>
                  </div>
                  <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                    <FaLeaf className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Success Rate</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{successRate.toFixed(1)}%</p>
                    <div className="flex items-center mt-1">
                      <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                      <span className="text-sm text-green-600">+2.1% from last month</span>
                    </div>
                  </div>
                  <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                    <Award className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Yield</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{totalYield.toFixed(1)} kg</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Avg: {averageYield.toFixed(1)} kg/grow</p>
                  </div>
                  <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
                    <BarChart3 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Est. Revenue</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">${estimatedRevenue.toLocaleString()}</p>
                    <div className="flex items-center mt-1">
                      <FaDollarSign className="h-3 w-3 text-orange-600 mr-1" />
                      <span className="text-sm text-orange-600">+{monthlyGrowthRate}% growth</span>
                    </div>
                  </div>
                  <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-full">
                    <FaDollarSign className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Completed Grows</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {completedGrows.slice(0, 5).map((grow) => (
                    <div key={grow.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{grow.species_name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{grow.shelf_name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900 dark:text-gray-100">{grow.yield_kg} kg</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{grow.duration_days} days</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Species Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(
                    completedGrows.reduce((acc, grow) => {
                      if (!acc[grow.species_name]) {
                        acc[grow.species_name] = { count: 0, totalYield: 0 };
                      }
                      acc[grow.species_name].count++;
                      acc[grow.species_name].totalYield += grow.yield_kg || 0;
                      return acc;
                    }, {} as Record<string, { count: number; totalYield: number }>)
                  ).map(([species, data]) => (
                    <div key={species} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{species}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{data.count} grows</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900 dark:text-gray-100">{data.totalYield.toFixed(1)} kg</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Avg: {(data.totalYield / data.count).toFixed(1)} kg</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Grow Analytics Tab */}
        <TabsContent value="grows" className="space-y-6">
          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search grows by species, recipe, shelf..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="end_date">End Date</SelectItem>
                <SelectItem value="yield">Yield</SelectItem>
                <SelectItem value="duration">Duration</SelectItem>
                <SelectItem value="species">Species</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Grow History Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Grow History ({sortedGrows.length} grows)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Shelf</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Species</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Recipe</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Duration</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Yield</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">End Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedGrows.map((grow) => (
                      <tr key={grow.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="py-3 px-4 text-gray-900 dark:text-gray-100">{grow.shelf_name}</td>
                        <td className="py-3 px-4 text-gray-900 dark:text-gray-100">{grow.species_name}</td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{grow.recipe_name}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-900 dark:text-gray-100">{grow.duration_days}d</span>
                            {grow.duration_days > grow.target_duration_days && (
                              <FaArrowUp className="h-3 w-3 text-red-500" />
                            )}
                            {grow.duration_days < grow.target_duration_days && (
                              <FaArrowDown className="h-3 w-3 text-green-500" />
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-900 dark:text-gray-100">
                          {grow.yield_kg ? `${grow.yield_kg} kg` : '-'}
                        </td>
                        <td className="py-3 px-4">
                          <Badge 
                            variant={grow.status === 'completed' ? 'default' : 'destructive'}
                          >
                            {grow.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                          {new Date(grow.end_date).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Business Analytics Tab */}
        <TabsContent value="business" className="space-y-6">
          {/* Business Revenue Analytics Content */}
          <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Business Revenue Analytics</h2>
                <p className="text-gray-600 dark:text-gray-400">Business performance insights and revenue tracking from Square</p>
              </div>
              <div className="flex gap-2">
                <Select defaultValue="30d">
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="90d">Last 90 days</SelectItem>
                    <SelectItem value="1y">Last year</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Export Report
                </Button>
              </div>
            </div>

            {/* Key Business Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">$12,547.50</p>
                      <div className="flex items-center mt-2">
                        <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                        <span className="text-sm text-green-600 font-medium">+8.2% from last month</span>
                      </div>
                    </div>
                    <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                      <FaDollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Average Order Value</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">$145.32</p>
                      <div className="flex items-center mt-2">
                        <TrendingUp className="h-4 w-4 text-blue-600 mr-1" />
                        <span className="text-sm text-blue-600 font-medium">+5.2% from last month</span>
                      </div>
                    </div>
                    <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                      <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Orders</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">86</p>
                      <div className="flex items-center mt-2">
                        <TrendingUp className="h-4 w-4 text-purple-600 mr-1" />
                        <span className="text-sm text-purple-600 font-medium">+12.4% from last month</span>
                      </div>
                    </div>
                    <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
                      <BarChart3 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Customer Growth</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">+12</p>
                      <div className="flex items-center mt-2">
                        <FaUsers className="h-4 w-4 text-orange-600 mr-1" />
                        <span className="text-sm text-orange-600 font-medium">New customers this month</span>
                      </div>
                    </div>
                    <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-full">
                      <FaUsers className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Business Analytics Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Revenue Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { month: "Aug", revenue: 8240, orders: 58 },
                      { month: "Sep", revenue: 9150, orders: 64 },
                      { month: "Oct", revenue: 10420, orders: 71 },
                      { month: "Nov", revenue: 11680, orders: 78 },
                      { month: "Dec", revenue: 12547, orders: 86 }
                    ].map((month) => (
                      <div key={month.month} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400 w-8">
                            {month.month}
                          </span>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <div 
                                className="h-2 bg-green-500 rounded"
                                style={{ 
                                  width: `${(month.revenue / 12547) * 100}%`,
                                  minWidth: '20px'
                                }}
                              />
                              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                ${month.revenue.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {month.orders} orders
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Top Products
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { name: "Organic Lettuce", revenue: 3250.00, orders: 42, growth: 12.5 },
                      { name: "Fresh Basil", revenue: 2180.00, orders: 28, growth: 8.3 },
                      { name: "Microgreens Mix", revenue: 1890.00, orders: 15, growth: 15.2 },
                      { name: "Baby Spinach", revenue: 1420.00, orders: 22, growth: -2.1 },
                      { name: "Fresh Kale", revenue: 1205.00, orders: 18, growth: 6.8 }
                    ].map((product) => (
                      <div key={product.name} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{product.name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{product.orders} orders</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900 dark:text-gray-100">
                            ${product.revenue.toLocaleString()}
                          </p>
                          <div className="flex items-center">
                            {product.growth > 0 ? (
                              <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                            ) : (
                              <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
                            )}
                            <span className={`text-sm ${product.growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {product.growth > 0 ? '+' : ''}{product.growth}%
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          {/* Performance metrics and operational analytics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Efficiency Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Avg Days to Harvest</span>
                    <span className="font-semibold">{(completedGrows.reduce((sum, grow) => sum + grow.duration_days, 0) / completedGrows.length || 0).toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Target Adherence</span>
                    <span className="font-semibold">
                      {((completedGrows.filter(g => g.duration_days <= g.target_duration_days).length / completedGrows.length) * 100 || 0).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Yield per Day</span>
                    <span className="font-semibold">
                      {(totalYield / completedGrows.reduce((sum, grow) => sum + grow.duration_days, 0) || 0).toFixed(2)} kg/day
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quality Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Success Rate</span>
                    <span className="font-semibold text-green-600">{successRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Aborted Grows</span>
                    <span className="font-semibold text-red-600">
                      {filteredGrows.filter(g => g.status === 'aborted').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Avg Yield Quality</span>
                    <span className="font-semibold">High</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resource Utilization</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Shelf Utilization</span>
                    <span className="font-semibold">85%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Energy Efficiency</span>
                    <span className="font-semibold">Good</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Water Usage</span>
                    <span className="font-semibold">Optimal</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsPage;
