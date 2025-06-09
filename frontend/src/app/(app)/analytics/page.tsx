"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Bar, Line, Doughnut } from "react-chartjs-2";
import { Chart, CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Tooltip, Legend } from "chart.js";
import { 
  TrendingUp, 
  Activity, 
  Thermometer, 
  Droplets, 
  Zap, 
  Leaf, 
  DollarSign, 
  BarChart3,
  Download,
  Filter
} from "lucide-react";

Chart.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Tooltip, Legend);

// Mock data for grow analytics
const growYieldData = {
  labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"],
  datasets: [
    {
      label: "Lettuce (kg)",
      data: [45, 52, 48, 61, 55, 67, 72, 68],
      backgroundColor: "rgba(34,197,94,0.7)",
      borderColor: "rgba(34,197,94,1)",
      borderWidth: 2,
    },
    {
      label: "Basil (kg)",
      data: [23, 28, 31, 35, 29, 41, 38, 42],
      backgroundColor: "rgba(59,130,246,0.7)",
      borderColor: "rgba(59,130,246,1)",
      borderWidth: 2,
    },
    {
      label: "Kale (kg)",
      data: [15, 18, 22, 19, 24, 28, 31, 29],
      backgroundColor: "rgba(168,85,247,0.7)",
      borderColor: "rgba(168,85,247,1)",
      borderWidth: 2,
    },
  ],
};

const growthRateData = {
  labels: ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Week 6"],
  datasets: [
    {
      label: "Growth Rate (%)",
      data: [15, 28, 45, 62, 78, 95],
      fill: true,
      borderColor: "rgba(34,197,94,1)",
      backgroundColor: "rgba(34,197,94,0.1)",
      tension: 0.4,
    },
  ],
};

// Mock data for environmental sensors
const temperatureData = {
  labels: ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00"],
  datasets: [
    {
      label: "Rack 1",
      data: [22.1, 21.8, 23.5, 24.2, 23.8, 22.9],
      borderColor: "rgba(239,68,68,1)",
      backgroundColor: "rgba(239,68,68,0.1)",
      tension: 0.4,
    },
    {
      label: "Rack 2", 
      data: [21.9, 22.2, 23.1, 24.0, 23.6, 22.7],
      borderColor: "rgba(59,130,246,1)",
      backgroundColor: "rgba(59,130,246,0.1)",
      tension: 0.4,
    },
    {
      label: "Rack 3",
      data: [22.3, 21.6, 23.8, 24.5, 24.1, 23.2],
      borderColor: "rgba(34,197,94,1)",
      backgroundColor: "rgba(34,197,94,0.1)",
      tension: 0.4,
    },
  ],
};

const humidityData = {
  labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  datasets: [
    {
      label: "Humidity (%)",
      data: [65, 68, 70, 67, 72, 69, 71],
      backgroundColor: [
        "rgba(59,130,246,0.7)",
        "rgba(34,197,94,0.7)", 
        "rgba(168,85,247,0.7)",
        "rgba(239,68,68,0.7)",
        "rgba(34,197,94,0.7)",
        "rgba(59,130,246,0.7)",
        "rgba(168,85,247,0.7)",
      ],
      borderWidth: 2,
    },
  ],
};

// Mock data for energy management
const energyConsumptionData = {
  labels: ["Lighting", "HVAC", "Pumps", "Fans", "Controls"],
  datasets: [
    {
      data: [45, 28, 12, 10, 5],
      backgroundColor: [
        "rgba(255,193,7,0.8)",
        "rgba(239,68,68,0.8)",
        "rgba(59,130,246,0.8)",
        "rgba(34,197,94,0.8)",
        "rgba(168,85,247,0.8)",
      ],
      borderWidth: 2,
    },
  ],
};

const dailyUsageData = {
  labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  datasets: [
    {
      label: "kWh",
      data: [85.2, 87.1, 82.8, 89.3, 86.7, 84.5, 88.9],
      fill: true,
      borderColor: "rgba(255,193,7,1)",
      backgroundColor: "rgba(255,193,7,0.1)",
      tension: 0.4,
    },
  ],
};

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState("grows");
  const [timeRange, setTimeRange] = useState("7d");

  return (
    <div className="flex-1 p-8 animate-pop">
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold text-green-900 dark:text-green-100 drop-shadow-lg border-b-2 border-green-200 dark:border-green-800 pb-4">
          📊 Analytics Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Comprehensive insights into your vertical farm performance, environmental conditions, and resource usage
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="grows" className="flex items-center gap-2">
            <Leaf className="w-4 h-4" />
            Grow Analytics
          </TabsTrigger>
          <TabsTrigger value="environmental" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Environmental Data
          </TabsTrigger>
          <TabsTrigger value="energy" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Energy Management
          </TabsTrigger>
        </TabsList>

        {/* Grow Analytics Tab */}
        <TabsContent value="grows" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Crop Performance & Yield Analysis</h2>
            <div className="flex gap-2">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                  <SelectItem value="90d">Last 3 Months</SelectItem>
                  <SelectItem value="1y">Last Year</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Yield</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">324.7 kg</div>
                <p className="text-xs text-green-600">
                  +12.3% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Growth Rate</CardTitle>
                <Activity className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">95.2%</div>
                <p className="text-xs text-blue-600">
                  +5.1% efficiency gain
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Grows</CardTitle>
                <Leaf className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">18</div>
                <p className="text-xs text-purple-600">
                  3 ready for harvest
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$2,847</div>
                <p className="text-xs text-green-600">
                  +18.7% vs target
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Yield by Crop</CardTitle>
                <CardDescription>Harvest volumes across different crop varieties</CardDescription>
              </CardHeader>
              <CardContent>
                <Bar data={growYieldData} options={{ responsive: true }} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Growth Rate Timeline</CardTitle>
                <CardDescription>Average growth progression over 6-week cycle</CardDescription>
              </CardHeader>
              <CardContent>
                <Line data={growthRateData} options={{ responsive: true }} />
              </CardContent>
            </Card>
          </div>

          {/* Current Crops Status */}
          <Card>
            <CardHeader>
              <CardTitle>Current Crop Status</CardTitle>
              <CardDescription>Live progress of active grows</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { name: "Buttercrunch Lettuce", rack: "Rack A-1", progress: 85, daysLeft: 3, status: "Excellent" },
                { name: "Purple Basil", rack: "Rack B-2", progress: 72, daysLeft: 8, status: "Good" },
                { name: "Red Russian Kale", rack: "Rack C-1", progress: 45, daysLeft: 15, status: "On Track" },
                { name: "Arugula", rack: "Rack A-3", progress: 91, daysLeft: 1, status: "Ready" },
              ].map((crop, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                      <Leaf className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">{crop.name}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{crop.rack}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium">{crop.progress}% Complete</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{crop.daysLeft} days left</p>
                    </div>
                    <Progress value={crop.progress} className="w-20" />
                    <Badge variant={crop.status === "Ready" ? "default" : "secondary"}>
                      {crop.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Environmental Data Tab */}
        <TabsContent value="environmental" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Environmental Monitoring</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filter Sensors
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </Button>
            </div>
          </div>

          {/* Environmental Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Temperature</CardTitle>
                <Thermometer className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">23.2°C</div>
                <p className="text-xs text-green-600">
                  Optimal range maintained
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Humidity</CardTitle>
                <Droplets className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">68.5%</div>
                <p className="text-xs text-blue-600">
                  Within target zone
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">CO₂ Level</CardTitle>
                <Activity className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">847 ppm</div>
                <p className="text-xs text-green-600">
                  Enhanced growth zone
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Light Intensity</CardTitle>
                <div className="h-4 w-4 bg-yellow-400 rounded-full" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">485 μmol</div>
                <p className="text-xs text-yellow-600">
                  Peak photosynthesis
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Environmental Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Temperature by Rack (24h)</CardTitle>
                <CardDescription>Real-time temperature monitoring across growing areas</CardDescription>
              </CardHeader>
              <CardContent>
                <Line data={temperatureData} options={{ responsive: true }} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Weekly Humidity Levels</CardTitle>
                <CardDescription>Average daily humidity measurements</CardDescription>
              </CardHeader>
              <CardContent>
                <Bar data={humidityData} options={{ responsive: true }} />
              </CardContent>
            </Card>
          </div>

          {/* Sensor Status Grid */}
          <Card>
            <CardHeader>
              <CardTitle>Sensor Network Status</CardTitle>
              <CardDescription>Live readings from all environmental sensors</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { location: "Rack A-1", temp: "23.1°C", humidity: "67%", co2: "850 ppm", status: "Normal" },
                  { location: "Rack A-2", temp: "22.8°C", humidity: "69%", co2: "845 ppm", status: "Normal" },
                  { location: "Rack B-1", temp: "24.2°C", humidity: "65%", co2: "892 ppm", status: "Warning" },
                  { location: "Rack B-2", temp: "23.5°C", humidity: "71%", co2: "838 ppm", status: "Normal" },
                  { location: "Rack C-1", temp: "22.9°C", humidity: "68%", co2: "856 ppm", status: "Normal" },
                  { location: "Rack C-2", temp: "23.3°C", humidity: "66%", co2: "841 ppm", status: "Normal" },
                ].map((sensor, index) => (
                  <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-medium">{sensor.location}</h4>
                      <Badge variant={sensor.status === "Warning" ? "destructive" : "secondary"}>
                        {sensor.status}
                      </Badge>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Temperature:</span>
                        <span className="font-medium">{sensor.temp}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Humidity:</span>
                        <span className="font-medium">{sensor.humidity}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">CO₂:</span>
                        <span className="font-medium">{sensor.co2}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Energy Management Tab */}
        <TabsContent value="energy" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Energy Consumption & Cost Analysis</h2>
            <div className="flex gap-2">
              <Select defaultValue="month">
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>

          {/* Energy Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Usage</CardTitle>
                <Zap className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1,247 kWh</div>
                <p className="text-xs text-green-600">
                  -8.2% vs last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Energy Cost</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$187.35</div>
                <p className="text-xs text-green-600">
                  $0.15/kWh average
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Efficiency</CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3.84 kg/kWh</div>
                <p className="text-xs text-blue-600">
                  Yield per energy unit
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Peak Demand</CardTitle>
                <BarChart3 className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">7.2 kW</div>
                <p className="text-xs text-red-600">
                  At 2:00 PM yesterday
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Energy Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Energy Consumption by System</CardTitle>
                <CardDescription>Power distribution across farm equipment</CardDescription>
              </CardHeader>
              <CardContent>
                <Doughnut data={energyConsumptionData} options={{ responsive: true }} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Daily Energy Usage (kWh)</CardTitle>
                <CardDescription>Weekly consumption patterns and trends</CardDescription>
              </CardHeader>
              <CardContent>
                <Line data={dailyUsageData} options={{ responsive: true }} />
              </CardContent>
            </Card>
          </div>

          {/* Energy Efficiency Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>Energy Optimization Opportunities</CardTitle>
              <CardDescription>AI-powered recommendations to reduce consumption</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { 
                  title: "LED Dimming Schedule", 
                  description: "Implement 10% dimming during peak hours to reduce lighting costs",
                  savings: "$23/month",
                  impact: "Medium",
                  category: "Lighting"
                },
                { 
                  title: "HVAC Optimization", 
                  description: "Adjust temperature setpoints by 1°C during off-peak periods",
                  savings: "$31/month",
                  impact: "High",
                  category: "Climate"
                },
                { 
                  title: "Pump Scheduling", 
                  description: "Consolidate irrigation cycles to avoid peak demand charges",
                  savings: "$12/month",
                  impact: "Low",
                  category: "Irrigation"
                },
                { 
                  title: "Power Factor Correction", 
                  description: "Install capacitors to improve power factor and reduce reactive power",
                  savings: "$45/month",
                  impact: "High",
                  category: "Infrastructure"
                },
              ].map((recommendation, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center">
                      <Zap className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">{recommendation.title}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{recommendation.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-bold text-green-600">{recommendation.savings}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">potential savings</p>
                    </div>
                    <Badge variant={recommendation.impact === "High" ? "default" : recommendation.impact === "Medium" ? "secondary" : "outline"}>
                      {recommendation.impact} Impact
                    </Badge>
                    <Button size="sm" variant="outline">
                      Implement
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
