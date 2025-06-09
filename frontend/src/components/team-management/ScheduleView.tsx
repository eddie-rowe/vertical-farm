"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Plus, 
  Calendar, 
  Clock, 
  User, 
  MapPin,
  Edit,
  Eye,
  RotateCcw
} from "lucide-react";

// Mock data for team schedules
const scheduleData = {
  summary: {
    totalEmployees: 8,
    activeShifts: 12,
    weeklyHours: 320,
    overtimeHours: 24
  },
  shifts: [
    {
      id: "SH001",
      employee: "Sarah Johnson",
      role: "Farm Manager",
      date: "2024-01-15",
      startTime: "06:00",
      endTime: "14:00",
      hours: 8,
      location: "General Supervision",
      status: "scheduled",
      type: "regular",
      notes: "Weekly team coordination"
    },
    {
      id: "SH002",
      employee: "Mike Chen",
      role: "Growth Technician",
      date: "2024-01-15",
      startTime: "07:00",
      endTime: "15:00",
      hours: 8,
      location: "Growth Towers 1-4",
      status: "active",
      type: "regular",
      notes: "Nutrient system maintenance"
    },
    {
      id: "SH003",
      employee: "Emily Davis",
      role: "Harvest Specialist",
      date: "2024-01-15",
      startTime: "05:00",
      endTime: "13:00",
      hours: 8,
      location: "Harvest Area",
      status: "completed",
      type: "regular",
      notes: "Morning harvest operations"
    },
    {
      id: "SH004",
      employee: "James Wilson",
      role: "Maintenance Tech",
      date: "2024-01-15",
      startTime: "14:00",
      endTime: "22:00",
      hours: 8,
      location: "Equipment Bay",
      status: "scheduled",
      type: "regular",
      notes: "Evening equipment maintenance"
    },
    {
      id: "SH005",
      employee: "Alex Rodriguez",
      role: "Data Analyst",
      date: "2024-01-15",
      startTime: "09:00",
      endTime: "17:00",
      hours: 8,
      location: "Control Room",
      status: "active",
      type: "regular",
      notes: "Weekly data analysis"
    },
    {
      id: "SH006",
      employee: "Lisa Chen",
      role: "Growth Technician",
      date: "2024-01-15",
      startTime: "15:00",
      endTime: "23:00",
      hours: 8,
      location: "Growth Towers 5-8",
      status: "scheduled",
      type: "regular",
      notes: "Evening system monitoring"
    },
    {
      id: "SH007",
      employee: "David Kim",
      role: "Quality Control",
      date: "2024-01-15",
      startTime: "08:00",
      endTime: "16:00",
      hours: 8,
      location: "Processing Area",
      status: "active",
      type: "regular",
      notes: "Quality inspections"
    },
    {
      id: "SH008",
      employee: "Maria Lopez",
      role: "Packaging Specialist",
      date: "2024-01-15",
      startTime: "10:00",
      endTime: "18:00",
      hours: 8,
      location: "Packaging Area",
      status: "scheduled",
      type: "regular",
      notes: "Order fulfillment"
    }
  ],
  upcomingShifts: [
    {
      id: "SH009",
      employee: "Mike Chen",
      role: "Growth Technician",
      date: "2024-01-16",
      startTime: "07:00",
      endTime: "17:00",
      hours: 10,
      location: "Growth Towers 1-4",
      status: "scheduled",
      type: "overtime",
      notes: "Deep system calibration - overtime approved"
    },
    {
      id: "SH010",
      employee: "Emily Davis",
      role: "Harvest Specialist",
      date: "2024-01-16",
      startTime: "04:00",
      endTime: "12:00",
      hours: 8,
      location: "Harvest Area",
      status: "scheduled",
      type: "early",
      notes: "Special order harvest - early start"
    }
  ]
};

export default function ScheduleView() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "active": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "completed": return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "overtime": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "early": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "regular": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const allShifts = [...scheduleData.shifts, ...scheduleData.upcomingShifts];

  const filteredShifts = allShifts.filter(shift => {
    const matchesSearch = shift.employee.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         shift.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         shift.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || shift.status === statusFilter;
    const matchesType = typeFilter === "all" || shift.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Employees</p>
                <p className="text-2xl font-bold">{scheduleData.summary.totalEmployees}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Shifts</p>
                <p className="text-2xl font-bold">{scheduleData.summary.activeShifts}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Weekly Hours</p>
                <p className="text-2xl font-bold">{scheduleData.summary.weeklyHours}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Overtime Hours</p>
                <p className="text-2xl font-bold">{scheduleData.summary.overtimeHours}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions Bar */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Team Schedule</h3>
        <div className="flex gap-2">
          <Button variant="outline">
            <RotateCcw className="h-4 w-4 mr-2" />
            Auto Schedule
          </Button>
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            View Calendar
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Shift
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search employees, roles, or locations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border rounded-md bg-background"
        >
          <option value="all">All Status</option>
          <option value="scheduled">Scheduled</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 border rounded-md bg-background"
        >
          <option value="all">All Types</option>
          <option value="regular">Regular</option>
          <option value="overtime">Overtime</option>
          <option value="early">Early Start</option>
        </select>
      </div>

      {/* Today's Schedule */}
      <Card>
        <CardContent className="p-6">
          <h4 className="font-semibold text-lg mb-4">Today's Schedule - {new Date().toLocaleDateString()}</h4>
          <div className="grid gap-3">
            {scheduleData.shifts.map((shift) => (
              <div key={shift.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="text-sm">
                    <Badge className={getStatusColor(shift.status)}>
                      {shift.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="font-medium">{shift.employee}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{shift.role}</p>
                  </div>
                  <div className="text-sm">
                    <p className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {shift.startTime} - {shift.endTime}
                    </p>
                    <p className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                      <MapPin className="h-4 w-4" />
                      {shift.location}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">{shift.hours}h</p>
                  <Badge className={getTypeColor(shift.type)} variant="secondary">
                    {shift.type}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* All Shifts Grid */}
      <div className="grid gap-4">
        {filteredShifts.map((shift) => (
          <Card key={shift.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <h4 className="font-semibold text-lg">{shift.employee}</h4>
                    <Badge variant="outline">{shift.role}</Badge>
                    <Badge className={getStatusColor(shift.status)}>
                      {shift.status}
                    </Badge>
                    <Badge className={getTypeColor(shift.type)}>
                      {shift.type}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400">{shift.notes}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(shift.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{shift.startTime} - {shift.endTime}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{shift.hours} hours</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{shift.location}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Upcoming Special Shifts */}
      {scheduleData.upcomingShifts.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h4 className="font-semibold text-lg mb-4">Upcoming Special Shifts</h4>
            <div className="space-y-3">
              {scheduleData.upcomingShifts.map((shift) => (
                <div key={shift.id} className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-center gap-4">
                    <Badge className={getTypeColor(shift.type)}>
                      {shift.type}
                    </Badge>
                    <div>
                      <p className="font-medium">{shift.employee}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{shift.role}</p>
                    </div>
                    <div className="text-sm">
                      <p className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(shift.date).toLocaleDateString()}
                      </p>
                      <p className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {shift.startTime} - {shift.endTime}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{shift.hours}h</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{shift.location}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 