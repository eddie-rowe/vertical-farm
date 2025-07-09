"use client";
import { useState } from "react";
import { AlertTriangle, Bell, CheckCircle, Clock, Thermometer, Droplets, Zap, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Alert {
  id: string;
  title: string;
  description: string;
  type: 'critical' | 'warning' | 'info';
  source: string;
  timestamp: Date;
  acknowledged?: boolean;
  actionRequired?: boolean;
}

// Mock agriculture-focused alerts
const mockAlerts: Alert[] = [
  {
    id: "1",
    title: "Temperature Critical Alert",
    description: "Grow chamber 3 temperature exceeded 32°C. Immediate cooling required.",
    type: "critical",
    source: "Environmental Control",
    timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
    actionRequired: true
  },
  {
    id: "2", 
    title: "Pump Maintenance Required",
    description: "Nutrient pump P-204 showing decreased flow rate. Schedule maintenance.",
    type: "warning",
    source: "Equipment Monitor",
    timestamp: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
    actionRequired: true
  },
  {
    id: "3",
    title: "Harvest Window Opening",
    description: "Lettuce crop in Zone B will be ready for harvest in 48 hours.",
    type: "info",
    source: "Growth Tracking",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
  },
  {
    id: "4",
    title: "Humidity Trending High",
    description: "Humidity in grow chamber 1 trending above optimal range (68-72%).",
    type: "warning", 
    source: "Environmental Control",
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
    actionRequired: true
  }
];

function getAlertIcon(type: Alert['type']) {
  switch (type) {
    case 'critical':
      return <AlertTriangle className="h-4 w-4 text-red-600" />;
    case 'warning':
      return <AlertTriangle className="h-4 w-4 text-orange-500" />;
    case 'info':
      return <CheckCircle className="h-4 w-4 text-blue-500" />;
  }
}

function getAlertStyles(type: Alert['type']) {
  switch (type) {
    case 'critical':
      return "border-l-4 border-red-500 bg-red-50 dark:bg-red-950";
    case 'warning':
      return "border-l-4 border-orange-500 bg-orange-50 dark:bg-orange-950";
    case 'info':
      return "border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-950";
  }
}

function formatTime(timestamp: Date): string {
  const now = new Date();
  const diff = now.getTime() - timestamp.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function NotificationCenter() {
  const [open, setOpen] = useState(false);
  
  const criticalCount = mockAlerts.filter(alert => alert.type === 'critical').length;
  const warningCount = mockAlerts.filter(alert => alert.type === 'warning').length;
  const totalUrgent = criticalCount + warningCount;

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(!open)}
        className={`relative p-2 ${totalUrgent > 0 ? 'border-orange-400 dark:border-orange-500' : ''}`}
        aria-label={`Notifications${totalUrgent > 0 ? ` - ${totalUrgent} urgent alerts` : ''}`}
      >
        <Bell className="h-4 w-4" />
        {totalUrgent > 0 && (
          <Badge 
            className={`absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs ${
              criticalCount > 0 
                ? 'bg-red-600 text-white hover:bg-red-700' 
                : 'bg-orange-500 text-white hover:bg-orange-600'
            }`}
          >
            {totalUrgent > 9 ? '9+' : totalUrgent}
          </Badge>
        )}
      </Button>
      
      {open && (
        <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 animate-in slide-in-from-top-2">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                System Alerts
              </h3>
              <div className="flex gap-2">
                {criticalCount > 0 && (
                  <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                    {criticalCount} Critical
                  </Badge>
                )}
                {warningCount > 0 && (
                  <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                    {warningCount} Warning
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {mockAlerts.length > 0 ? (
              <div className="p-2">
                {mockAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-3 mb-2 rounded-lg ${getAlertStyles(alert.type)} hover:shadow-sm transition-shadow`}
                  >
                    <div className="flex items-start gap-3">
                      {getAlertIcon(alert.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {alert.title}
                          </h4>
                          <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap ml-2">
                            {formatTime(alert.timestamp)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-300 mb-2">
                          {alert.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                            {alert.source}
                          </span>
                          {alert.actionRequired && (
                            <Button size="sm" variant="outline" className="h-6 text-xs px-2">
                              View Details
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <p className="text-sm">All systems operating normally</p>
              </div>
            )}
          </div>
          
          <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-b-lg">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => setOpen(false)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Alert Settings
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
