'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FaTools, FaCalendarAlt, FaClock, FaCheckCircle, FaExclamationTriangle, FaUser } from '@/lib/icons';

interface MaintenanceTask {
  id: string;
  title: string;
  description: string;
  type: 'cleaning' | 'equipment' | 'inspection' | 'calibration';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'scheduled' | 'in-progress' | 'completed' | 'overdue';
  assignedTo: string;
  scheduledDate: string;
  estimatedDuration: string;
  lastCompleted?: string;
  frequency: string;
  location: string;
}

interface MaintenanceCategory {
  name: string;
  icon: React.ReactNode;
  color: string;
  tasks: number;
  overdue: number;
}

export default function MaintenanceScheduleView() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // Mock data - replace with actual API calls
  const maintenanceTasks: MaintenanceTask[] = [
    {
      id: 'task-001',
      title: 'Clean Growing Trays - Section A',
      description: 'Deep clean all growing trays in section A, sanitize and inspect for damage',
      type: 'cleaning',
      priority: 'high',
      status: 'scheduled',
      assignedTo: 'John Smith',
      scheduledDate: '2024-01-25',
      estimatedDuration: '2 hours',
      lastCompleted: '2024-01-18',
      frequency: 'Weekly',
      location: 'Growing Section A'
    },
    {
      id: 'task-002',
      title: 'LED Light Calibration',
      description: 'Check and calibrate LED light intensity and spectrum settings',
      type: 'calibration',
      priority: 'medium',
      status: 'in-progress',
      assignedTo: 'Sarah Johnson',
      scheduledDate: '2024-01-24',
      estimatedDuration: '1.5 hours',
      lastCompleted: '2024-01-10',
      frequency: 'Bi-weekly',
      location: 'Lighting Control Room'
    },
    {
      id: 'task-003',
      title: 'Water Pump Inspection',
      description: 'Inspect water pumps for wear, check flow rates and pressure',
      type: 'inspection',
      priority: 'critical',
      status: 'overdue',
      assignedTo: 'Mike Davis',
      scheduledDate: '2024-01-22',
      estimatedDuration: '3 hours',
      lastCompleted: '2024-01-08',
      frequency: 'Monthly',
      location: 'Pump Room'
    },
    {
      id: 'task-004',
      title: 'Nutrient System Cleaning',
      description: 'Clean nutrient tanks, replace filters, and test pH sensors',
      type: 'equipment',
      priority: 'high',
      status: 'completed',
      assignedTo: 'Lisa Chen',
      scheduledDate: '2024-01-23',
      estimatedDuration: '2.5 hours',
      lastCompleted: '2024-01-23',
      frequency: 'Weekly',
      location: 'Nutrient Mixing Station'
    }
  ];

  const maintenanceCategories: MaintenanceCategory[] = [
    {
      name: 'Cleaning',
      icon: <FaTools className="h-5 w-5" />,
      color: 'bg-blue-500',
      tasks: 8,
      overdue: 1
    },
    {
      name: 'Equipment',
      icon: <FaTools className="h-5 w-5" />,
      color: 'bg-green-500',
      tasks: 12,
      overdue: 2
    },
    {
      name: 'Inspection',
      icon: <FaCheckCircle className="h-5 w-5" />,
      color: 'bg-yellow-500',
      tasks: 6,
      overdue: 1
    },
    {
      name: 'Calibration',
      icon: <FaTools className="h-5 w-5" />,
      color: 'bg-purple-500',
      tasks: 4,
      overdue: 0
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'scheduled':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const filteredTasks = filterStatus === 'all' 
    ? maintenanceTasks 
    : maintenanceTasks.filter(task => task.status === filterStatus);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Maintenance Schedule
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage equipment maintenance, cleaning schedules, and facility upkeep
          </p>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="all">All Tasks</option>
            <option value="scheduled">Scheduled</option>
            <option value="in-progress">In Progress</option>
            <option value="overdue">Overdue</option>
            <option value="completed">Completed</option>
          </select>
          <Button className="bg-green-600 hover:bg-green-700">
            <FaCalendarAlt className="mr-2" />
            Schedule Task
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <FaTools className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="schedule" className="flex items-center gap-2">
            <FaCalendarAlt className="h-4 w-4" />
            Schedule
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <FaClock className="h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Category Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {maintenanceCategories.map((category) => (
              <Card key={category.name} className="border border-gray-200 dark:border-gray-700">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${category.color} text-white`}>
                        {category.icon}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                          {category.name}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {category.tasks} tasks
                        </p>
                      </div>
                    </div>
                    {category.overdue > 0 && (
                      <Badge className="bg-red-100 text-red-800 border-red-200">
                        {category.overdue} overdue
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Recent Tasks */}
          <Card className="border border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle>Recent & Upcoming Tasks</CardTitle>
              <CardDescription>
                Tasks requiring immediate attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredTasks.slice(0, 5).map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${getPriorityColor(task.priority)}`}></div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                          {task.title}
                        </h4>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-600 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <FaUser className="h-3 w-3" />
                            {task.assignedTo}
                          </span>
                          <span className="flex items-center gap-1">
                            <FaClock className="h-3 w-3" />
                            {task.estimatedDuration}
                          </span>
                          <span>{task.location}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {task.scheduledDate}
                      </span>
                      <Badge className={getStatusColor(task.status)}>
                        {task.status.replace('-', ' ').toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <div className="grid gap-4">
            {filteredTasks.map((task) => (
              <Card key={task.id} className="border border-gray-200 dark:border-gray-700">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-3 h-3 rounded-full ${getPriorityColor(task.priority)}`}></div>
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                          {task.title}
                        </h4>
                        <Badge variant="outline" className="text-xs">
                          {task.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {task.description}
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Assigned:</span>
                          <p className="font-medium">{task.assignedTo}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Duration:</span>
                          <p className="font-medium">{task.estimatedDuration}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Frequency:</span>
                          <p className="font-medium">{task.frequency}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Location:</span>
                          <p className="font-medium">{task.location}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge className={getStatusColor(task.status)}>
                        {task.status.replace('-', ' ').toUpperCase()}
                      </Badge>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {task.scheduledDate}
                      </span>
                      <Button variant="outline" size="sm">
                        Edit Task
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card className="border border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle>Maintenance History</CardTitle>
              <CardDescription>
                Completed maintenance tasks and performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg h-64 flex items-center justify-center">
                <div className="text-center">
                  <FaClock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
                    Maintenance History Coming Soon
                  </h3>
                  <p className="text-gray-500 dark:text-gray-500">
                    Detailed maintenance logs and performance analytics will be available here
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 