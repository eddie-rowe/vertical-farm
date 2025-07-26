"use client";

import {
  Thermometer,
  Droplets,
  Wind,
  Sun,
  Activity,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  Bell,
  Settings,
} from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { FarmPageData } from "@/types/farm-layout";

interface EnvironmentMonitoringViewProps {
  farmPageData: FarmPageData | null;
}

// Mock environmental data - replace with actual data fetching
const mockEnvironmentalData = {
  temperature: {
    current: 24.5,
    target: 24.0,
    min: 20.0,
    max: 28.0,
    trend: "stable",
    status: "optimal",
  },
  humidity: {
    current: 68,
    target: 70,
    min: 60,
    max: 80,
    trend: "down",
    status: "optimal",
  },
  airflow: {
    current: 1200,
    target: 1150,
    min: 800,
    max: 1500,
    trend: "up",
    status: "optimal",
  },
  lightIntensity: {
    current: 850,
    target: 900,
    min: 600,
    max: 1200,
    trend: "stable",
    status: "optimal",
  },
  co2Level: {
    current: 1200,
    target: 1400,
    min: 800,
    max: 1600,
    trend: "up",
    status: "warning",
  },
  phLevel: {
    current: 6.2,
    target: 6.5,
    min: 5.5,
    max: 7.0,
    trend: "stable",
    status: "optimal",
  },
};

const mockAlerts = [
  {
    id: "1",
    type: "warning",
    message: "CO2 levels below optimal range in Row 2",
    location: "Row 2, Rack B",
    timestamp: "5 min ago",
    priority: "medium",
  },
  {
    id: "2",
    type: "info",
    message: "Scheduled nutrient solution refill due in 2 hours",
    location: "Nutrient System",
    timestamp: "10 min ago",
    priority: "low",
  },
  {
    id: "3",
    type: "success",
    message: "Temperature stabilized after adjustment",
    location: "Row 1, Rack A",
    timestamp: "15 min ago",
    priority: "low",
  },
];

export default function EnvironmentMonitoringView({
  farmPageData,
}: EnvironmentMonitoringViewProps) {
  const [environmentalData] = useState(mockEnvironmentalData);
  const [alerts] = useState(mockAlerts);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      case "stable":
        return <Minus className="h-4 w-4 text-gray-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "optimal":
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
            Optimal
          </Badge>
        );
      case "warning":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100">
            Warning
          </Badge>
        );
      case "critical":
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100">
            Critical
          </Badge>
        );
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case "error":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      default:
        return <Activity className="h-4 w-4 text-blue-600" />;
    }
  };

  const calculateProgress = (current: number, min: number, max: number) => {
    return ((current - min) / (max - min)) * 100;
  };

  if (!farmPageData) {
    return (
      <div className="text-center py-10 text-gray-600 dark:text-gray-400">
        <div className="max-w-md mx-auto">
          <Activity className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl font-semibold mb-4">No Farm Selected</h2>
          <p className="mb-6">
            Select a farm to view environmental monitoring data.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Environmental Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Temperature */}
        <Card className="animate-pop bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-red-200 dark:border-red-700 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-700 dark:text-red-300 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Thermometer className="h-4 w-4" />
                Temperature
              </div>
              {getTrendIcon(environmentalData.temperature.trend)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-end gap-2">
                <span className="text-2xl font-bold text-red-900 dark:text-red-100">
                  {environmentalData.temperature.current}°C
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  / {environmentalData.temperature.target}°C
                </span>
              </div>
              <Progress
                value={calculateProgress(
                  environmentalData.temperature.current,
                  environmentalData.temperature.min,
                  environmentalData.temperature.max,
                )}
                className="h-2"
              />
              <div className="flex justify-between items-center">
                {getStatusBadge(environmentalData.temperature.status)}
                <span className="text-xs text-gray-500">
                  {environmentalData.temperature.min}°C -{" "}
                  {environmentalData.temperature.max}°C
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Humidity */}
        <Card className="animate-pop bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-700 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Droplets className="h-4 w-4" />
                Humidity
              </div>
              {getTrendIcon(environmentalData.humidity.trend)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-end gap-2">
                <span className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {environmentalData.humidity.current}%
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  / {environmentalData.humidity.target}%
                </span>
              </div>
              <Progress
                value={calculateProgress(
                  environmentalData.humidity.current,
                  environmentalData.humidity.min,
                  environmentalData.humidity.max,
                )}
                className="h-2"
              />
              <div className="flex justify-between items-center">
                {getStatusBadge(environmentalData.humidity.status)}
                <span className="text-xs text-gray-500">
                  {environmentalData.humidity.min}% -{" "}
                  {environmentalData.humidity.max}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Airflow */}
        <Card className="animate-pop bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-700 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wind className="h-4 w-4" />
                Airflow
              </div>
              {getTrendIcon(environmentalData.airflow.trend)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-end gap-2">
                <span className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {environmentalData.airflow.current}
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  RPM / {environmentalData.airflow.target}
                </span>
              </div>
              <Progress
                value={calculateProgress(
                  environmentalData.airflow.current,
                  environmentalData.airflow.min,
                  environmentalData.airflow.max,
                )}
                className="h-2"
              />
              <div className="flex justify-between items-center">
                {getStatusBadge(environmentalData.airflow.status)}
                <span className="text-xs text-gray-500">
                  {environmentalData.airflow.min} -{" "}
                  {environmentalData.airflow.max} RPM
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Light Intensity */}
        <Card className="animate-pop bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-yellow-200 dark:border-yellow-700 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-700 dark:text-yellow-300 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sun className="h-4 w-4" />
                Light Intensity
              </div>
              {getTrendIcon(environmentalData.lightIntensity.trend)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-end gap-2">
                <span className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                  {environmentalData.lightIntensity.current}
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  PPFD / {environmentalData.lightIntensity.target}
                </span>
              </div>
              <Progress
                value={calculateProgress(
                  environmentalData.lightIntensity.current,
                  environmentalData.lightIntensity.min,
                  environmentalData.lightIntensity.max,
                )}
                className="h-2"
              />
              <div className="flex justify-between items-center">
                {getStatusBadge(environmentalData.lightIntensity.status)}
                <span className="text-xs text-gray-500">
                  {environmentalData.lightIntensity.min} -{" "}
                  {environmentalData.lightIntensity.max} PPFD
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CO2 Level */}
        <Card className="animate-pop bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-purple-200 dark:border-purple-700 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                CO2 Level
              </div>
              {getTrendIcon(environmentalData.co2Level.trend)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-end gap-2">
                <span className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                  {environmentalData.co2Level.current}
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  ppm / {environmentalData.co2Level.target}
                </span>
              </div>
              <Progress
                value={calculateProgress(
                  environmentalData.co2Level.current,
                  environmentalData.co2Level.min,
                  environmentalData.co2Level.max,
                )}
                className="h-2"
              />
              <div className="flex justify-between items-center">
                {getStatusBadge(environmentalData.co2Level.status)}
                <span className="text-xs text-gray-500">
                  {environmentalData.co2Level.min} -{" "}
                  {environmentalData.co2Level.max} ppm
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* pH Level */}
        <Card className="animate-pop bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 border-teal-200 dark:border-teal-700 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-teal-700 dark:text-teal-300 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Droplets className="h-4 w-4" />
                pH Level
              </div>
              {getTrendIcon(environmentalData.phLevel.trend)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-end gap-2">
                <span className="text-2xl font-bold text-teal-900 dark:text-teal-100">
                  {environmentalData.phLevel.current}
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  / {environmentalData.phLevel.target}
                </span>
              </div>
              <Progress
                value={calculateProgress(
                  environmentalData.phLevel.current,
                  environmentalData.phLevel.min,
                  environmentalData.phLevel.max,
                )}
                className="h-2"
              />
              <div className="flex justify-between items-center">
                {getStatusBadge(environmentalData.phLevel.status)}
                <span className="text-xs text-gray-500">
                  {environmentalData.phLevel.min} -{" "}
                  {environmentalData.phLevel.max}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts & Notifications */}
      <Card className="shadow-lg">
        <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <CardTitle className="text-lg">Alerts & Notifications</CardTitle>
              {alerts.filter((alert) => alert.type !== "success").length >
                0 && (
                <Badge className="bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100">
                  {alerts.filter((alert) => alert.type !== "success").length}{" "}
                  Active
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Configure
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {alerts.map((alert) => (
              <Card
                key={alert.id}
                className="border-l-4 border-l-yellow-400 hover:shadow-sm transition-shadow"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      {getAlertIcon(alert.type)}
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">
                          {alert.message}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {alert.location}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {alert.priority} priority
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {alert.timestamp}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      Dismiss
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {alerts.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>
                  No alerts at this time. All systems are operating normally.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
