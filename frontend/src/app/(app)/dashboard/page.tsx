"use client";
import { useAuth } from "@/context/AuthContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FaThermometerHalf, 
  FaTint, 
  FaLightbulb, 
  FaFan, 
  FaSeedling, 
  FaDollarSign,
  FaBolt,
  FaExclamationTriangle,
  FaCheckCircle,
  FaClock,
  FaArrowUp,
  FaArrowDown,
  FaStop,
  FaCog,
  FaLeaf
} from "react-icons/fa";
import { useState, useEffect } from "react";

// Define proper types for button variants
type ButtonVariant = "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";

export default function DashboardPage() {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">Loading user data...</div>;
  }

  // Mock real-time farm data
  const environmentData = [
    { 
      location: "Row 1", 
      temperature: 22.5, 
      humidity: 65, 
      ph: 6.2, 
      nutrients: 850,
      status: "optimal"
    },
    { 
      location: "Row 2", 
      temperature: 23.1, 
      humidity: 68, 
      ph: 6.1, 
      nutrients: 780,
      status: "warning"
    }
  ];

  const systemStatus = [
    { name: "Water Pumps", status: "running", icon: FaTint, count: "3/3" },
    { name: "LED Lights", status: "running", icon: FaLightbulb, count: "12/12" },
    { name: "Ventilation", status: "running", icon: FaFan, count: "4/4" },
    { name: "Sensors", status: "running", icon: FaThermometerHalf, count: "8/8" }
  ];

  const performanceMetrics = [
    { 
      title: "Growth Progress", 
      value: 78, 
      unit: "%", 
      trend: "up",
      description: "Overall crop maturity",
      icon: FaSeedling
    },
    { 
      title: "Energy Efficiency", 
      value: 92, 
      unit: "%", 
      trend: "up",
      description: "vs. target consumption",
      icon: FaBolt
    },
    { 
      title: "Yield Forecast", 
      value: 145, 
      unit: "kg", 
      trend: "up",
      description: "Expected this cycle",
      icon: FaLeaf
    },
    { 
      title: "Cost Efficiency", 
      value: 87, 
      unit: "%", 
      trend: "down",
      description: "vs. last cycle",
      icon: FaDollarSign
    }
  ];

  const alerts = [
    { 
      id: 1, 
      type: "warning", 
      message: "Row 2 nutrient levels below optimal", 
      time: "5 min ago",
      action: "Check nutrient reservoir"
    },
    { 
      id: 2, 
      type: "info", 
      message: "Harvest ready in Row 1, Rack 2", 
      time: "15 min ago",
      action: "Schedule harvest"
    },
    { 
      id: 3, 
      type: "success", 
      message: "Weekly yield target achieved", 
      time: "1 hour ago",
      action: "View report"
    }
  ];

  const recentActivity = [
    { time: "14:23", action: "Irrigation cycle completed - Row 1", user: "System" },
    { time: "13:45", action: "Manual light adjustment - Row 2", user: "Admin" },
    { time: "12:30", action: "Nutrient refill - Main reservoir", user: "John Doe" },
    { time: "11:15", action: "Harvest completed - 12.5kg lettuce", user: "Admin" },
    { time: "10:00", action: "Daily maintenance check completed", user: "System" }
  ];

  const quickActions: Array<{
    label: string;
    icon: any;
    color: ButtonVariant;
    action: () => void;
  }> = [
    { label: "Emergency Stop", icon: FaStop, color: "destructive", action: () => console.log("Emergency stop") },
    { label: "Irrigation Cycle", icon: FaTint, color: "default", action: () => console.log("Start irrigation") },
    { label: "Adjust Lighting", icon: FaLightbulb, color: "default", action: () => console.log("Adjust lighting") },
    { label: "System Settings", icon: FaCog, color: "secondary", action: () => console.log("Open settings") }
  ];

  const getAlertStyle = (type: string) => {
    switch (type) {
      case "warning": return "border-l-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20";
      case "error": return "border-l-4 border-red-500 bg-red-50 dark:bg-red-900/20";
      case "success": return "border-l-4 border-green-500 bg-green-50 dark:bg-green-900/20";
      default: return "border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20";
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <main className="flex-1 p-6 bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 min-h-screen">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-green-900 dark:text-green-100">
              Farm Command Center
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {currentTime.toLocaleDateString()} • {currentTime.toLocaleTimeString()}
            </p>
          </div>
          <div className="flex gap-2">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant={action.color as "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"}
                size="sm"
                onClick={action.action}
                className="flex items-center gap-2"
              >
                <action.icon className="w-4 h-4" />
                {action.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {performanceMetrics.map((metric, index) => (
            <Card key={index} className="animate-pop">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <metric.icon className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{metric.title}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold">{metric.value}</span>
                        <span className="text-sm text-gray-500">{metric.unit}</span>
                        {metric.trend === "up" ? (
                          <FaArrowUp className="w-3 h-3 text-green-500" />
                        ) : (
                          <FaArrowDown className="w-3 h-3 text-red-500" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500">{metric.description}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Environmental Status */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FaThermometerHalf className="w-5 h-5" />
                Environmental Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {environmentData.map((env, index) => (
                  <div key={index} className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-semibold">{env.location}</h4>
                      <Badge 
                        variant={env.status === "optimal" ? "default" : "destructive"}
                        className={env.status === "optimal" ? "text-green-600 dark:text-green-400" : "text-yellow-600 dark:text-yellow-400"}
                      >
                        {env.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <FaThermometerHalf className="w-4 h-4 mx-auto mb-1 text-orange-500" />
                        <p className="text-sm text-gray-600 dark:text-gray-400">Temperature</p>
                        <p className="font-semibold">{env.temperature}°C</p>
                      </div>
                      <div className="text-center">
                        <FaTint className="w-4 h-4 mx-auto mb-1 text-blue-500" />
                        <p className="text-sm text-gray-600 dark:text-gray-400">Humidity</p>
                        <p className="font-semibold">{env.humidity}%</p>
                      </div>
                      <div className="text-center">
                        <FaTint className="w-4 h-4 mx-auto mb-1 text-purple-500" />
                        <p className="text-sm text-gray-600 dark:text-gray-400">pH Level</p>
                        <p className="font-semibold">{env.ph}</p>
                      </div>
                      <div className="text-center">
                        <FaLeaf className="w-4 h-4 mx-auto mb-1 text-green-500" />
                        <p className="text-sm text-gray-600 dark:text-gray-400">Nutrients</p>
                        <p className="font-semibold">{env.nutrients} ppm</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FaCog className="w-5 h-5" />
                System Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {systemStatus.map((system, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                    <div className="flex items-center gap-3">
                      <system.icon className="w-4 h-4 text-green-500" />
                      <span className="font-medium">{system.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{system.count}</span>
                      <FaCheckCircle className="w-4 h-4 text-green-500" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FaExclamationTriangle className="w-5 h-5" />
                Active Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div key={alert.id} className={`p-3 rounded-lg ${getAlertStyle(alert.type)}`}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium">{alert.message}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {alert.action} • {alert.time}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FaClock className="w-5 h-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.action}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {activity.time} • by {activity.user}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
