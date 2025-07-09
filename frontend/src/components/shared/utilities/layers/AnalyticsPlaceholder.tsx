"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  TrendingUp, 
  Target, 
  Lightbulb, 
  Settings, 
  Clock,
  Zap,
  CheckCircle2,
  Bell
} from "lucide-react";
import type { Farm } from "@/types/farm";

interface AnalyticsPlaceholderProps {
  farm?: Farm;
}

export default function AnalyticsPlaceholder({ farm }: AnalyticsPlaceholderProps) {
  const upcomingFeatures = [
    {
      icon: <BarChart3 className="h-5 w-5" />,
      title: "Growth Analytics",
      description: "Track plant growth rates, yield predictions, and harvest schedules across your farm",
      status: "In Development"
    },
    {
      icon: <TrendingUp className="h-5 w-5" />,
      title: "Performance Metrics",
      description: "Monitor energy efficiency, water usage, and resource optimization insights",
      status: "Planned"
    },
    {
      icon: <Target className="h-5 w-5" />,
      title: "Yield Optimization",
      description: "AI-powered recommendations to maximize crop yield and minimize resource waste",
      status: "Research Phase"
    },
    {
      icon: <Lightbulb className="h-5 w-5" />,
      title: "Smart Recommendations",
      description: "Machine learning insights for optimal growing conditions and automation rules",
      status: "Research Phase"
    }
  ];

  const mockChartData = [
    { name: "Week 1", yield: 45, efficiency: 78 },
    { name: "Week 2", yield: 52, efficiency: 82 },
    { name: "Week 3", yield: 48, efficiency: 85 },
    { name: "Week 4", yield: 61, efficiency: 88 }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Development': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'Planned': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'Research Phase': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="mb-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
            <BarChart3 className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Analytics & Optimization
          </h2>
          <p className="text-lg text-gray-500 dark:text-gray-400 mt-2">
            Coming Soon - Advanced insights for your vertical farm
          </p>
        </div>
        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 px-4 py-2">
          <Clock className="h-4 w-4 mr-2" />
          Layer Four - In Development
        </Badge>
      </div>

      {/* Feature Preview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {upcomingFeatures.map((feature, index) => (
          <Card key={index} className="relative overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg text-white">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </div>
                <Badge className={getStatusColor(feature.status)} variant="outline">
                  {feature.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm leading-relaxed">
                {feature.description}
              </CardDescription>
            </CardContent>
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-purple-600/10 rounded-full -translate-y-16 translate-x-16"></div>
          </Card>
        ))}
      </div>

      {/* Mock Analytics Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Analytics Preview</span>
          </CardTitle>
          <CardDescription>
            A glimpse of the powerful analytics coming to your farm management platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Mock Chart */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Growth & Efficiency Trends
              </h3>
              <div className="h-32 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center">
                <div className="text-center text-gray-500 dark:text-gray-400">
                  <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Interactive Charts Coming Soon</p>
                </div>
              </div>
            </div>

            {/* Mock Metrics */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Key Performance Indicators
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-xs text-green-600 dark:text-green-400">Yield Rate</p>
                  <p className="text-lg font-bold text-green-700 dark:text-green-300">94.2%</p>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-xs text-blue-600 dark:text-blue-400">Efficiency</p>
                  <p className="text-lg font-bold text-blue-700 dark:text-blue-300">87.5%</p>
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <p className="text-xs text-purple-600 dark:text-purple-400">Energy Use</p>
                  <p className="text-lg font-bold text-purple-700 dark:text-purple-300">-12%</p>
                </div>
                <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                  <p className="text-xs text-orange-600 dark:text-orange-400">Water Save</p>
                  <p className="text-lg font-bold text-orange-700 dark:text-orange-300">23L</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Development Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Development Roadmap</span>
          </CardTitle>
          <CardDescription>
            Track the progress of analytics features coming to your platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div className="flex-1">
                <p className="font-medium text-green-800 dark:text-green-200">Layer Three: Monitoring</p>
                <p className="text-sm text-green-600 dark:text-green-400">Environmental monitoring and alerts system</p>
              </div>
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                Completed
              </Badge>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <Zap className="h-5 w-5 text-blue-600" />
              <div className="flex-1">
                <p className="font-medium text-blue-800 dark:text-blue-200">Layer Four: Analytics</p>
                <p className="text-sm text-blue-600 dark:text-blue-400">Advanced analytics and optimization algorithms</p>
              </div>
              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                In Progress
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Call to Action */}
      <Card className="text-center">
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Stay Tuned for Advanced Analytics
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            We're working hard to bring you powerful insights and optimization tools. 
            In the meantime, explore the monitoring features available in Layer Three.
          </p>
          <div className="flex items-center justify-center space-x-3">
            <Button variant="outline">
              <BarChart3 className="h-4 w-4 mr-2" />
              View Monitoring
            </Button>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <Bell className="h-4 w-4 mr-2" />
              Notify When Ready
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 