"use client";

import React, { useState, useMemo, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EventOverlayControls } from "./EventOverlayControls";
import type {
  CalendarEvent,
  EventType,
  CalendarView as CalendarViewType,
  EventOverlay,
} from "@/types/calendar";

// Default overlay configuration
const DEFAULT_OVERLAYS: EventOverlay[] = [
  {
    id: "operations",
    label: "Operations",
    enabled: true,
    color: "#10b981", // green
    icon: "FaSeedling",
    description: "Germination, moving, harvesting, and other farm operations",
  },
  {
    id: "devices",
    label: "Devices",
    enabled: true,
    color: "#3b82f6", // blue
    icon: "FaCog",
    description: "Lights, irrigation, fans, and device automation",
  },
  {
    id: "team",
    label: "Team",
    enabled: true,
    color: "#f59e0b", // amber
    icon: "FaUsers",
    description: "Work schedules, maintenance windows, and team activities",
  },
  {
    id: "customer",
    label: "Customer",
    enabled: true,
    color: "#ef4444", // red
    icon: "FaTruck",
    description: "Delivery windows, pickups, and customer interactions",
  },
];

// Mock data for initial development
const MOCK_EVENTS: CalendarEvent[] = [
  {
    id: "1",
    title: "Lettuce Germination Start",
    description: "Begin germination for 100 lettuce seeds",
    start: new Date(2025, 0, 20, 8, 0),
    end: new Date(2025, 0, 20, 9, 0),
    eventType: "operations",
    priority: "high",
    status: "scheduled",
    createdAt: new Date(),
    updatedAt: new Date(),
    relatedEntityId: "row-1",
  },
  {
    id: "2",
    title: "LED Lights Schedule",
    description: "Turn on grow lights for vegetative growth",
    start: new Date(2025, 0, 20, 6, 0),
    end: new Date(2025, 0, 20, 22, 0),
    eventType: "devices",
    priority: "medium",
    status: "scheduled",
    createdAt: new Date(),
    updatedAt: new Date(),
    relatedEntityId: "device-led-1",
  },
  {
    id: "3",
    title: "Morning Shift - Eddie",
    description: "Daily maintenance and monitoring",
    start: new Date(2025, 0, 20, 8, 0),
    end: new Date(2025, 0, 20, 11, 0),
    eventType: "team",
    priority: "medium",
    status: "scheduled",
    createdAt: new Date(),
    updatedAt: new Date(),
    relatedEntityId: "user-eddie",
  },
  {
    id: "4",
    title: "Restaurant A Delivery",
    description: "Fresh microgreens delivery",
    start: new Date(2025, 0, 21, 14, 0),
    end: new Date(2025, 0, 21, 15, 0),
    eventType: "customer",
    priority: "high",
    status: "scheduled",
    createdAt: new Date(),
    updatedAt: new Date(),
    relatedEntityId: "customer-restaurant-a",
  },
];

export function CalendarView() {
  const [currentView, setCurrentView] = useState<CalendarViewType>("month");
  const [overlays, setOverlays] = useState<EventOverlay[]>(DEFAULT_OVERLAYS);
  const [events] = useState<CalendarEvent[]>(MOCK_EVENTS);

  return (
    <div className="h-full space-y-6">
      <EventOverlayControls
        overlays={overlays}
        onToggle={(overlayId: EventType, enabled: boolean) => {
          setOverlays((prev) =>
            prev.map((overlay) =>
              overlay.id === overlayId ? { ...overlay, enabled } : overlay,
            ),
          );
        }}
      />

      <Card className="flex-1 flex flex-col h-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl font-bold">
            Farm Calendar
            <div className="text-sm font-normal text-muted-foreground mt-1">
              {events.length} events loaded
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="h-full p-4">
          <div className="h-96">
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,timeGridWeek,timeGridDay",
              }}
              height="100%"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
