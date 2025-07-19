"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FaMapMarkerAlt,
  FaClock,
  FaCalendarAlt,
  FaUser,
  FaBoxes,
  FaArrowRight,
} from "@/lib/icons";

interface DeliveryRoute {
  id: string;
  routeName: string;
  driver: string;
  status: "scheduled" | "in-progress" | "completed" | "delayed";
  estimatedTime: string;
  actualTime?: string;
  stops: number;
  completedStops: number;
  distance: string;
}

interface DeliveryStop {
  id: string;
  customerName: string;
  address: string;
  orderValue: number;
  timeWindow: string;
  status: "pending" | "delivered" | "failed";
  notes?: string;
}

export default function DeliveryScheduleView() {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  // Mock data - replace with actual API calls
  const deliveryRoutes: DeliveryRoute[] = [
    {
      id: "route-001",
      routeName: "Downtown Route A",
      driver: "John Smith",
      status: "in-progress",
      estimatedTime: "3.5 hrs",
      actualTime: "2.8 hrs",
      stops: 8,
      completedStops: 5,
      distance: "24 miles",
    },
    {
      id: "route-002",
      routeName: "Suburban Route B",
      driver: "Sarah Johnson",
      status: "scheduled",
      estimatedTime: "4.2 hrs",
      stops: 12,
      completedStops: 0,
      distance: "31 miles",
    },
    {
      id: "route-003",
      routeName: "Commercial Route C",
      driver: "Mike Davis",
      status: "completed",
      estimatedTime: "2.8 hrs",
      actualTime: "2.5 hrs",
      stops: 6,
      completedStops: 6,
      distance: "18 miles",
    },
  ];

  const deliveryStops: DeliveryStop[] = [
    {
      id: "stop-001",
      customerName: "Green Leaf Restaurant",
      address: "123 Main St, Downtown",
      orderValue: 145.5,
      timeWindow: "8:00 AM - 10:00 AM",
      status: "delivered",
    },
    {
      id: "stop-002",
      customerName: "Fresh Market Co.",
      address: "456 Oak Ave, Midtown",
      orderValue: 289.75,
      timeWindow: "10:30 AM - 12:00 PM",
      status: "pending",
    },
    {
      id: "stop-003",
      customerName: "Healthy Bites Cafe",
      address: "789 Pine St, Uptown",
      orderValue: 92.25,
      timeWindow: "1:00 PM - 3:00 PM",
      status: "pending",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
      case "delivered":
        return "bg-green-100 text-green-800 border-green-200";
      case "in-progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "scheduled":
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "delayed":
      case "failed":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Delivery Schedule & Routes
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage delivery routes, schedules, and track real-time progress
          </p>
        </div>
        <div className="flex items-center gap-4">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
          <Button className="bg-green-600 hover:bg-green-700">
            <FaArrowRight className="mr-2" />
            Optimize Routes
          </Button>
        </div>
      </div>

      <Tabs defaultValue="routes" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="routes" className="flex items-center gap-2">
            <FaBoxes className="h-4 w-4" />
            Active Routes
          </TabsTrigger>
          <TabsTrigger value="schedule" className="flex items-center gap-2">
            <FaCalendarAlt className="h-4 w-4" />
            Schedule
          </TabsTrigger>
          <TabsTrigger value="map" className="flex items-center gap-2">
            <FaMapMarkerAlt className="h-4 w-4" />
            Route Map
          </TabsTrigger>
        </TabsList>

        <TabsContent value="routes" className="space-y-4">
          <div className="grid gap-4">
            {deliveryRoutes.map((route) => (
              <Card
                key={route.id}
                className="border border-gray-200 dark:border-gray-700"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {route.routeName}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <FaUser className="h-3 w-3" />
                        {route.driver}
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(route.status)}>
                      {route.status.replace("-", " ").toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <FaClock className="h-4 w-4 text-gray-500" />
                      <span>{route.actualTime || route.estimatedTime}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FaMapMarkerAlt className="h-4 w-4 text-gray-500" />
                      <span>
                        {route.completedStops}/{route.stops} stops
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FaArrowRight className="h-4 w-4 text-gray-500" />
                      <span>{route.distance}</span>
                    </div>
                    <div className="flex justify-end">
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <div className="grid gap-4">
            {deliveryStops.map((stop) => (
              <Card
                key={stop.id}
                className="border border-gray-200 dark:border-gray-700"
              >
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                        {stop.customerName}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {stop.address}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <span className="flex items-center gap-1">
                          <FaClock className="h-3 w-3" />
                          {stop.timeWindow}
                        </span>
                        <span className="font-medium">
                          ${stop.orderValue.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <Badge className={getStatusColor(stop.status)}>
                      {stop.status.toUpperCase()}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="map" className="space-y-4">
          <Card className="border border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle>Route Visualization</CardTitle>
              <CardDescription>
                Interactive map showing delivery routes and real-time vehicle
                locations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg h-96 flex items-center justify-center">
                <div className="text-center">
                  <FaMapMarkerAlt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
                    Interactive Map Coming Soon
                  </h3>
                  <p className="text-gray-500 dark:text-gray-500">
                    Real-time route tracking and optimization will be available
                    here
                  </p>
                  <Button className="mt-4" variant="outline">
                    <FaArrowRight className="mr-2" />
                    Configure Map Integration
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
