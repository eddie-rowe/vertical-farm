"use client";

import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  ShoppingCart,
  BarChart3,
  Download,
  Target,
  Award,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function RevenueAnalyticsView() {
  const [timeRange, setTimeRange] = useState("30d");

  // Mock analytics data
  const revenueData = {
    totalRevenue: 12547.5,
    monthlyGrowth: 8.2,
    averageOrderValue: 145.32,
    totalOrders: 86,
    newCustomers: 12,
    returningCustomers: 18,
    topProducts: [
      { name: "Organic Lettuce", revenue: 3250.0, orders: 42, growth: 12.5 },
      { name: "Fresh Basil", revenue: 2180.0, orders: 28, growth: 8.3 },
      { name: "Microgreens Mix", revenue: 1890.0, orders: 15, growth: 15.2 },
      { name: "Baby Spinach", revenue: 1420.0, orders: 22, growth: -2.1 },
      { name: "Fresh Kale", revenue: 1205.0, orders: 18, growth: 6.8 },
    ],
    customerSegments: [
      { segment: "Restaurants", revenue: 5420.0, orders: 32, percentage: 43.2 },
      { segment: "Wholesale", revenue: 4125.0, orders: 24, percentage: 32.9 },
      { segment: "CSA", revenue: 1890.0, orders: 18, percentage: 15.1 },
      { segment: "Retail", revenue: 1112.5, orders: 12, percentage: 8.8 },
    ],
    monthlyTrends: [
      { month: "Aug", revenue: 8240, orders: 58 },
      { month: "Sep", revenue: 9150, orders: 64 },
      { month: "Oct", revenue: 10420, orders: 71 },
      { month: "Nov", revenue: 11680, orders: 78 },
      { month: "Dec", revenue: 12547, orders: 86 },
    ],
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Revenue Analytics
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Business performance insights and revenue tracking
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Revenue
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {formatCurrency(revenueData.totalRevenue)}
                </p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                  <span className="text-sm text-green-600 font-medium">
                    {formatPercentage(revenueData.monthlyGrowth)} from last
                    month
                  </span>
                </div>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Average Order Value
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {formatCurrency(revenueData.averageOrderValue)}
                </p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-4 w-4 text-blue-600 mr-1" />
                  <span className="text-sm text-blue-600 font-medium">
                    +5.2% from last month
                  </span>
                </div>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                <ShoppingCart className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Orders
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {revenueData.totalOrders.toLocaleString()}
                </p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-4 w-4 text-purple-600 mr-1" />
                  <span className="text-sm text-purple-600 font-medium">
                    +12.4% from last month
                  </span>
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
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Customer Growth
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  +{revenueData.newCustomers}
                </p>
                <div className="flex items-center mt-2">
                  <Users className="h-4 w-4 text-orange-600 mr-1" />
                  <span className="text-sm text-orange-600 font-medium">
                    New customers this month
                  </span>
                </div>
              </div>
              <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-full">
                <Users className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Revenue Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {revenueData.monthlyTrends.map((month) => (
                <div
                  key={month.month}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400 w-8">
                      {month.month}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2 bg-green-500 rounded"
                          style={{
                            width: `${(month.revenue / Math.max(...revenueData.monthlyTrends.map((m) => m.revenue))) * 100}%`,
                            minWidth: "20px",
                          }}
                        />
                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {formatCurrency(month.revenue)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {month.orders} orders
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Customer Segments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Revenue by Customer Segment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {revenueData.customerSegments.map((segment) => (
                <div key={segment.segment} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {segment.segment}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {segment.percentage}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="h-2 bg-blue-500 rounded-full"
                        style={{ width: `${segment.percentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 min-w-[80px] text-right">
                      {formatCurrency(segment.revenue)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {segment.orders} orders
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Products */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Top Performing Products
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {revenueData.topProducts.map((product, index) => (
              <div
                key={product.name}
                className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full">
                    <span className="text-sm font-bold text-gray-600 dark:text-gray-400">
                      #{index + 1}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                      {product.name}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {product.orders} orders
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      {formatCurrency(product.revenue)}
                    </p>
                    <div className="flex items-center gap-1">
                      {product.growth > 0 ? (
                        <TrendingUp className="h-3 w-3 text-green-600" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-red-600" />
                      )}
                      <span
                        className={`text-xs font-medium ${
                          product.growth > 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {formatPercentage(product.growth)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Goals & Targets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Monthly Goals & Targets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Revenue Goal
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  84%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="h-2 bg-green-500 rounded-full"
                  style={{ width: "84%" }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>${revenueData.totalRevenue.toLocaleString()}</span>
                <span>Target: $15,000</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  New Customers
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  60%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="h-2 bg-blue-500 rounded-full"
                  style={{ width: "60%" }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>{revenueData.newCustomers}</span>
                <span>Target: 20</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Orders
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  86%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="h-2 bg-purple-500 rounded-full"
                  style={{ width: "86%" }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>{revenueData.totalOrders}</span>
                <span>Target: 100</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
