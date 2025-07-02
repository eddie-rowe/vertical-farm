"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Thermometer, 
  Droplets, 
  Sun, 
  Wind,
  AlertTriangle,
  CheckCircle,
  Activity,
  TrendingUp,
  Clock,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Farm } from "@/types/farm-layout";

interface MonitoringData {
  temperature: { value: number; unit: string; status: 'optimal' | 'warning' | 'critical' };
  humidity: { value: number; unit: string; status: 'optimal' | 'warning' | 'critical' };
  lightIntensity: { value: number; unit: string; status: 'optimal' | 'warning' | 'critical' };
  ph: { value: number; unit: string; status: 'optimal' | 'warning' | 'critical' };
  ec: { value: number; unit: string; status: 'optimal' | 'warning' | 'critical' };
  lastUpdated: string;
}

interface HealthScore {
  overall: number;
  environmental: number;
  growth: number;
  alerts: number;
}

interface MonitoringOverlayProps {
  farm?: Farm;
  isOpen: boolean;
  onClose: () => void;
}

export default function MonitoringOverlay({ farm, isOpen, onClose }: MonitoringOverlayProps) {
  const [monitoringData, setMonitoringData] = useState<MonitoringData>({
    temperature: { value: 24.5, unit: '°C', status: 'optimal' },
    humidity: { value: 68, unit: '%', status: 'optimal' },
    lightIntensity: { value: 350, unit: 'PPFD', status: 'optimal' },
    ph: { value: 6.2, unit: 'pH', status: 'optimal' },
    ec: { value: 1.8, unit: 'EC', status: 'warning' },
    lastUpdated: new Date().toISOString()
  });

  const [healthScore, setHealthScore] = useState<HealthScore>({
    overall: 87,
    environmental: 92,
    growth: 85,
    alerts: 75
  });

  // Simulate real-time data updates
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setMonitoringData(prev => ({
        ...prev,
        temperature: {
          ...prev.temperature,
          value: 24.5 + (Math.random() - 0.5) * 2
        },
        humidity: {
          ...prev.humidity,
          value: 68 + (Math.random() - 0.5) * 10
        },
        lightIntensity: {
          ...prev.lightIntensity,
          value: 350 + (Math.random() - 0.5) * 50
        },
        lastUpdated: new Date().toISOString()
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, [isOpen]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'optimal': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'optimal': return 'text-green-700 bg-green-50 border-green-200';
      case 'warning': return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'critical': return 'text-red-700 bg-red-50 border-red-200';
      default: return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Environmental Monitoring
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              {farm ? `Real-time data for ${farm.name}` : 'Real-time farm monitoring dashboard'}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Health Score Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Overall Health</p>
                    <p className={cn("text-2xl font-bold", getHealthScoreColor(healthScore.overall))}>
                      {healthScore.overall}%
                    </p>
                  </div>
                  <TrendingUp className={cn("h-8 w-8", getHealthScoreColor(healthScore.overall))} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Environment</p>
                    <p className={cn("text-2xl font-bold", getHealthScoreColor(healthScore.environmental))}>
                      {healthScore.environmental}%
                    </p>
                  </div>
                  <Wind className={cn("h-8 w-8", getHealthScoreColor(healthScore.environmental))} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Growth</p>
                    <p className={cn("text-2xl font-bold", getHealthScoreColor(healthScore.growth))}>
                      {healthScore.growth}%
                    </p>
                  </div>
                  <Activity className={cn("h-8 w-8", getHealthScoreColor(healthScore.growth))} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Alert Score</p>
                    <p className={cn("text-2xl font-bold", getHealthScoreColor(healthScore.alerts))}>
                      {healthScore.alerts}%
                    </p>
                  </div>
                  <AlertTriangle className={cn("h-8 w-8", getHealthScoreColor(healthScore.alerts))} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Environmental Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5" />
                <span>Environmental Conditions</span>
              </CardTitle>
              <CardDescription>
                Live sensor data from your farm • Last updated: {new Date(monitoringData.lastUpdated).toLocaleTimeString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Temperature */}
                <div className={cn("p-4 rounded-lg border", getStatusColor(monitoringData.temperature.status))}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Thermometer className="h-5 w-5" />
                      <div>
                        <p className="font-medium">Temperature</p>
                        <p className="text-2xl font-bold">
                          {monitoringData.temperature.value.toFixed(1)}{monitoringData.temperature.unit}
                        </p>
                      </div>
                    </div>
                    {getStatusIcon(monitoringData.temperature.status)}
                  </div>
                  <Badge variant="outline" className="mt-2">
                    {monitoringData.temperature.status}
                  </Badge>
                </div>

                {/* Humidity */}
                <div className={cn("p-4 rounded-lg border", getStatusColor(monitoringData.humidity.status))}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Droplets className="h-5 w-5" />
                      <div>
                        <p className="font-medium">Humidity</p>
                        <p className="text-2xl font-bold">
                          {monitoringData.humidity.value.toFixed(0)}{monitoringData.humidity.unit}
                        </p>
                      </div>
                    </div>
                    {getStatusIcon(monitoringData.humidity.status)}
                  </div>
                  <Badge variant="outline" className="mt-2">
                    {monitoringData.humidity.status}
                  </Badge>
                </div>

                {/* Light Intensity */}
                <div className={cn("p-4 rounded-lg border", getStatusColor(monitoringData.lightIntensity.status))}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Sun className="h-5 w-5" />
                      <div>
                        <p className="font-medium">Light Intensity</p>
                        <p className="text-2xl font-bold">
                          {monitoringData.lightIntensity.value.toFixed(0)} {monitoringData.lightIntensity.unit}
                        </p>
                      </div>
                    </div>
                    {getStatusIcon(monitoringData.lightIntensity.status)}
                  </div>
                  <Badge variant="outline" className="mt-2">
                    {monitoringData.lightIntensity.status}
                  </Badge>
                </div>

                {/* pH Level */}
                <div className={cn("p-4 rounded-lg border", getStatusColor(monitoringData.ph.status))}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Activity className="h-5 w-5" />
                      <div>
                        <p className="font-medium">pH Level</p>
                        <p className="text-2xl font-bold">
                          {monitoringData.ph.value.toFixed(1)} {monitoringData.ph.unit}
                        </p>
                      </div>
                    </div>
                    {getStatusIcon(monitoringData.ph.status)}
                  </div>
                  <Badge variant="outline" className="mt-2">
                    {monitoringData.ph.status}
                  </Badge>
                </div>

                {/* EC Level */}
                <div className={cn("p-4 rounded-lg border", getStatusColor(monitoringData.ec.status))}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Wind className="h-5 w-5" />
                      <div>
                        <p className="font-medium">EC Level</p>
                        <p className="text-2xl font-bold">
                          {monitoringData.ec.value.toFixed(1)} {monitoringData.ec.unit}
                        </p>
                      </div>
                    </div>
                    {getStatusIcon(monitoringData.ec.status)}
                  </div>
                  <Badge variant="outline" className="mt-2">
                    {monitoringData.ec.status}
                  </Badge>
                </div>

                {/* Status Summary */}
                <div className="p-4 rounded-lg border border-gray-200 bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-gray-600" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">System Status</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        All sensors online
                      </p>
                    </div>
                  </div>
                  <Badge className="mt-2 bg-green-100 text-green-800">
                    Operational
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button>
              View Full Analytics
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 