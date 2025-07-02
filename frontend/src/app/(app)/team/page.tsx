"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ScheduleView, 
  TaskAssignmentsView, 
  TimeTrackingView, 
  PayrollView, 
  SkillsView, 
  PerformanceView 
} from "@/components/features/business";

export default function TeamManagement() {
  const [activeTab, setActiveTab] = useState("schedule");

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Team Management</h2>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">
            Manage your vertical farm team efficiently
          </span>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="time">Time Tracking</TabsTrigger>
          <TabsTrigger value="payroll">Payroll</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Work Schedule Management</CardTitle>
            </CardHeader>
            <CardContent>
              <ScheduleView />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Task Assignments & Labor Planning</CardTitle>
            </CardHeader>
            <CardContent>
              <TaskAssignmentsView />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="time" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Time Tracking & Productivity</CardTitle>
            </CardHeader>
            <CardContent>
              <TimeTrackingView />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payroll" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payouts & Compensation</CardTitle>
            </CardHeader>
            <CardContent>
              <PayrollView />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="skills" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Skills & Certifications</CardTitle>
            </CardHeader>
            <CardContent>
              <SkillsView />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Reviews & Goals</CardTitle>
            </CardHeader>
            <CardContent>
              <PerformanceView />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 