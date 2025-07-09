"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Clock, Zap, Calendar, Settings, Play, Pause } from "lucide-react";
import type { Farm } from "@/types/farm";

interface AutomationManagementLayerProps {
  farm?: Farm;
}

export default function AutomationManagementLayer({ farm }: AutomationManagementLayerProps) {
  // Mock automation data for demonstration
  const mockAutomationRules = [
    {
      id: 1,
      name: "Morning Light Cycle",
      type: "schedule",
      status: "active",
      description: "Turn on LED lights at 6:00 AM for 12 hours",
      nextRun: "Tomorrow at 6:00 AM",
      devices: ["LED Strip - Row 1", "LED Strip - Row 2"]
    },
    {
      id: 2,
      name: "Watering Schedule",
      type: "schedule",
      status: "inactive",
      description: "Water plants every 8 hours for 5 minutes",
      nextRun: "Paused",
      devices: ["Water Pump - East", "Water Pump - West"]
    },
    {
      id: 3,
      name: "Temperature Control",
      type: "conditional",
      status: "active",
      description: "Turn on fans when temperature > 28°C",
      nextRun: "Monitoring",
      devices: ["Exhaust Fan", "Intake Fan"]
    }
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'schedule': return <Clock className="h-4 w-4" />;
      case 'conditional': return <Zap className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'inactive': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
      default: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Automation Management
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            {farm ? `Managing automation rules for ${farm.name}` : 'Create and manage automation rules for your farm'}
          </p>
        </div>
        <Button className="bg-green-600 hover:bg-green-700">
          <Zap className="h-4 w-4 mr-2" />
          Create Rule
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Active Rules</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">2</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Scheduled</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">1</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Settings className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Conditional</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">1</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">This Week</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">24</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Automation Rules */}
      <Card>
        <CardHeader>
          <CardTitle>Automation Rules</CardTitle>
          <CardDescription>
            Manage your farm automation rules and schedules
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockAutomationRules.map((rule) => (
              <div key={rule.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    {getTypeIcon(rule.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium text-gray-900 dark:text-gray-100">
                        {rule.name}
                      </h3>
                      <Badge className={getStatusColor(rule.status)}>
                        {rule.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {rule.description}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      Next: {rule.nextRun}
                    </p>
                    <div className="flex items-center space-x-1 mt-2">
                      {rule.devices.map((device, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {device}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Switch 
                    checked={rule.status === 'active'} 
                    className="data-[state=checked]:bg-green-600"
                  />
                  <Button variant="outline" size="sm">
                    {rule.status === 'active' ? (
                      <Pause className="h-3 w-3" />
                    ) : (
                      <Play className="h-3 w-3" />
                    )}
                  </Button>
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Schedule Templates</span>
            </CardTitle>
            <CardDescription>
              Pre-built automation templates for common scenarios
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <span>Daily Light Cycle (12h on/off)</span>
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <span>Watering Schedule (Every 6 hours)</span>
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <span>Night Mode (Reduced lighting)</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5" />
              <span>Recent Activity</span>
            </CardTitle>
            <CardDescription>
              Latest automation executions and events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Morning Light Cycle</span>
                <span className="text-green-600 dark:text-green-400">✓ Executed</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Temperature Control</span>
                <span className="text-blue-600 dark:text-blue-400">○ Monitoring</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Watering Schedule</span>
                <span className="text-gray-600 dark:text-gray-400">⏸ Paused</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 