"use client";

import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity,
  Shield,
  RefreshCw,
  TrendingUp,
  Clock,
  Zap,
  AlertCircle,
  Heart,
  BarChart3,
} from "lucide-react";
import React, { useState, useEffect } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

interface ErrorMonitoringData {
  overall_healthy: boolean;
  healthy_services: number;
  total_services: number;
  total_errors: number;
  services: Record<string, ServiceHealth>;
  timestamp: string;
}

interface ServiceHealth {
  status: "healthy" | "degraded" | "unhealthy";
  circuit_state: "closed" | "open" | "half_open";
  health_score: number;
  error_rate_percent: number;
  total_errors: number;
  consecutive_failures: number;
  recovery_count: number;
  circuit_breaker_triggers: number;
  last_error_time?: string;
  error_types: Record<string, number>;
  failure_count: number;
  next_attempt_time?: string;
  health_check_failures: number;
  health_check_successes: number;
}

interface CircuitBreakerInfo {
  circuit_state: string;
  failure_count: number;
  next_attempt_time?: string;
  circuit_breaker_triggers: number;
  status: string;
}

interface ErrorPattern {
  analysis_period_hours: number;
  total_errors: number;
  error_distribution: Record<string, number>;
  service_reliability: Record<string, any>;
  insights: string[];
  overall_system_health: "excellent" | "good" | "needs_attention";
  timestamp: string;
}

const ErrorMonitoringDashboard: React.FC = () => {
  const [healthData, setHealthData] = useState<ErrorMonitoringData | null>(
    null,
  );
  const [circuitBreakerData, setCircuitBreakerData] = useState<Record<
    string,
    CircuitBreakerInfo
  > | null>(null);
  const [errorPatterns, setErrorPatterns] = useState<ErrorPattern | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [testingRecovery, setTestingRecovery] = useState(false);
  const { toast } = useToast();

  const fetchHealthData = async () => {
    try {
      const response = await fetch(
        "/api/v1/home-assistant/error-monitoring/health",
      );
      if (!response.ok) throw new Error("Failed to fetch health data");
      const data = await response.json();
      setHealthData(data);
    } catch (error) {
      console.error("Error fetching health data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch health monitoring data",
        variant: "destructive",
      });
    }
  };

  const fetchCircuitBreakerData = async () => {
    try {
      const response = await fetch(
        "/api/v1/home-assistant/error-monitoring/circuit-breaker-status",
      );
      if (!response.ok) throw new Error("Failed to fetch circuit breaker data");
      const data = await response.json();
      setCircuitBreakerData(data.circuit_breakers);
    } catch (error) {
      console.error("Error fetching circuit breaker data:", error);
    }
  };

  const fetchErrorPatterns = async () => {
    try {
      const response = await fetch(
        "/api/v1/home-assistant/error-monitoring/error-patterns?hours=24",
      );
      if (!response.ok) throw new Error("Failed to fetch error patterns");
      const data = await response.json();
      setErrorPatterns(data);
    } catch (error) {
      console.error("Error fetching error patterns:", error);
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchHealthData(),
      fetchCircuitBreakerData(),
      fetchErrorPatterns(),
    ]);
    setLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
    toast({
      title: "Refreshed",
      description: "Error monitoring data has been updated",
    });
  };

  const handleTestRecovery = async () => {
    setTestingRecovery(true);
    try {
      const response = await fetch(
        "/api/v1/home-assistant/error-monitoring/test-recovery?service_name=user_home_assistant",
        {
          method: "POST",
        },
      );

      if (!response.ok) throw new Error("Failed to test recovery");

      const result = await response.json();
      toast({
        title: "Recovery Test",
        description: result.message,
      });

      // Refresh data after recovery test
      setTimeout(() => fetchAllData(), 2000);
    } catch (error) {
      console.error("Error testing recovery:", error);
      toast({
        title: "Error",
        description: "Failed to test recovery mechanism",
        variant: "destructive",
      });
    } finally {
      setTestingRecovery(false);
    }
  };

  useEffect(() => {
    fetchAllData();

    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchAllData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "degraded":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "unhealthy":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getCircuitBreakerColor = (state: string) => {
    switch (state) {
      case "closed":
        return "bg-green-500";
      case "half_open":
        return "bg-yellow-500";
      case "open":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getReliabilityColor = (tier: string) => {
    switch (tier) {
      case "excellent":
        return "text-green-600";
      case "good":
        return "text-blue-600";
      case "fair":
        return "text-yellow-600";
      case "poor":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading error monitoring data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Error Monitoring
          </h1>
          <p className="text-muted-foreground">
            Monitor Home Assistant integration health and error patterns
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
          <Button
            variant="outline"
            onClick={handleTestRecovery}
            disabled={testingRecovery}
          >
            {testingRecovery ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Shield className="h-4 w-4 mr-2" />
            )}
            Test Recovery
          </Button>
        </div>
      </div>

      {/* System Status Overview */}
      {healthData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                System Health
              </CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                {getStatusIcon(
                  healthData.overall_healthy ? "healthy" : "unhealthy",
                )}
                <div className="text-2xl font-bold">
                  {healthData.overall_healthy ? "Healthy" : "Issues"}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Services</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {healthData.healthy_services}/{healthData.total_services}
              </div>
              <p className="text-xs text-muted-foreground">Healthy services</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Errors
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {healthData.total_errors}
              </div>
              <p className="text-xs text-muted-foreground">
                Across all services
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Last Updated
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm">
                {new Date(healthData.timestamp).toLocaleTimeString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {new Date(healthData.timestamp).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="circuit-breakers">Circuit Breakers</TabsTrigger>
          <TabsTrigger value="patterns">Error Patterns</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          {errorPatterns && (
            <div className="space-y-4">
              {/* System Health Alert */}
              <Alert
                className={
                  errorPatterns.overall_system_health === "excellent"
                    ? "border-green-200 bg-green-50"
                    : errorPatterns.overall_system_health === "good"
                      ? "border-blue-200 bg-blue-50"
                      : "border-yellow-200 bg-yellow-50"
                }
              >
                <TrendingUp className="h-4 w-4" />
                <AlertTitle>
                  System Health:{" "}
                  {errorPatterns.overall_system_health.toUpperCase()}
                </AlertTitle>
                <AlertDescription>
                  {errorPatterns.insights.length > 0 ? (
                    <ul className="list-disc list-inside space-y-1">
                      {errorPatterns.insights.map((insight, index) => (
                        <li key={index}>{insight}</li>
                      ))}
                    </ul>
                  ) : (
                    "No specific insights available"
                  )}
                </AlertDescription>
              </Alert>

              {/* Error Distribution */}
              {Object.keys(errorPatterns.error_distribution).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Error Distribution (24h)</CardTitle>
                    <CardDescription>
                      Breakdown of error types across all services
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(errorPatterns.error_distribution).map(
                        ([errorType, count]) => {
                          const percentage =
                            (count / errorPatterns.total_errors) * 100;
                          return (
                            <div key={errorType} className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span className="capitalize">
                                  {errorType.replace("_", " ")}
                                </span>
                                <span>
                                  {count} ({percentage.toFixed(1)}%)
                                </span>
                              </div>
                              <Progress value={percentage} className="h-2" />
                            </div>
                          );
                        },
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="services">
          {healthData && (
            <div className="grid gap-4">
              {Object.entries(healthData.services).map(
                ([serviceName, health]) => (
                  <Card key={serviceName}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center space-x-2">
                          {getStatusIcon(health.status)}
                          <span>
                            {serviceName.replace("_", " ").toUpperCase()}
                          </span>
                        </CardTitle>
                        <Badge
                          variant={
                            health.status === "healthy"
                              ? "default"
                              : "destructive"
                          }
                        >
                          {health.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <div className="text-sm font-medium">
                            Health Score
                          </div>
                          <div className="text-2xl font-bold">
                            {health.health_score}%
                          </div>
                          <Progress
                            value={health.health_score}
                            className="h-2 mt-1"
                          />
                        </div>
                        <div>
                          <div className="text-sm font-medium">Error Rate</div>
                          <div className="text-2xl font-bold">
                            {health.error_rate_percent.toFixed(2)}%
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium">
                            Total Errors
                          </div>
                          <div className="text-2xl font-bold">
                            {health.total_errors}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium">Recoveries</div>
                          <div className="text-2xl font-bold">
                            {health.recovery_count}
                          </div>
                        </div>
                      </div>

                      {Object.keys(health.error_types).length > 0 && (
                        <div className="mt-4">
                          <div className="text-sm font-medium mb-2">
                            Error Types
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(health.error_types).map(
                              ([type, count]) => (
                                <Badge key={type} variant="outline">
                                  {type.replace("_", " ")}: {count}
                                </Badge>
                              ),
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ),
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="circuit-breakers">
          {circuitBreakerData && (
            <div className="grid gap-4">
              {Object.entries(circuitBreakerData).map(
                ([serviceName, breaker]) => (
                  <Card key={serviceName}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center space-x-2">
                          <Zap className="h-5 w-5" />
                          <span>
                            {serviceName.replace("_", " ").toUpperCase()}
                          </span>
                        </CardTitle>
                        <div className="flex space-x-2">
                          <Badge
                            className={`${getCircuitBreakerColor(breaker.circuit_state)} text-white`}
                          >
                            {breaker.circuit_state
                              .replace("_", " ")
                              .toUpperCase()}
                          </Badge>
                          <Badge
                            variant={
                              breaker.status === "healthy"
                                ? "default"
                                : "destructive"
                            }
                          >
                            {breaker.status}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <div className="text-sm font-medium">
                            Failure Count
                          </div>
                          <div className="text-2xl font-bold">
                            {breaker.failure_count}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium">CB Triggers</div>
                          <div className="text-2xl font-bold">
                            {breaker.circuit_breaker_triggers}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium">State</div>
                          <div className="text-sm font-bold capitalize">
                            {breaker.circuit_state.replace("_", " ")}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium">
                            Next Attempt
                          </div>
                          <div className="text-sm">
                            {breaker.next_attempt_time
                              ? new Date(
                                  breaker.next_attempt_time,
                                ).toLocaleTimeString()
                              : "N/A"}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ),
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="patterns">
          {errorPatterns && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5" />
                    <span>Service Reliability Analysis</span>
                  </CardTitle>
                  <CardDescription>
                    Analysis based on the last{" "}
                    {errorPatterns.analysis_period_hours} hours
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(errorPatterns.service_reliability).map(
                      ([serviceName, stats]) => (
                        <div
                          key={serviceName}
                          className="border rounded-lg p-4"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium">
                              {serviceName.replace("_", " ").toUpperCase()}
                            </h4>
                            <Badge
                              className={getReliabilityColor(
                                stats.reliability_tier,
                              )}
                            >
                              {stats.reliability_tier.toUpperCase()}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            <div>
                              <span className="text-muted-foreground">
                                Health Score:
                              </span>
                              <div className="font-bold">
                                {stats.health_score}%
                              </div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">
                                Error Rate:
                              </span>
                              <div className="font-bold">
                                {stats.error_rate.toFixed(2)}%
                              </div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">
                                Total Errors:
                              </span>
                              <div className="font-bold">
                                {stats.total_errors}
                              </div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">
                                Recoveries:
                              </span>
                              <div className="font-bold">
                                {stats.recovery_count}
                              </div>
                            </div>
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ErrorMonitoringDashboard;
