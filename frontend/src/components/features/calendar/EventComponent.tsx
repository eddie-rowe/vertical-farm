"use client";

import { EventContentArg } from "@fullcalendar/core";
import React from "react";
import {
  FaSeedling,
  FaCog,
  FaUsers,
  FaTruck,
  FaExclamationCircle,
  FaClock,
} from "react-icons/fa";

import { Badge } from "@/components/ui/badge";
import type { EventType, EventPriority, EventStatus } from "@/types/calendar";

const EVENT_TYPE_ICONS = {
  operations: FaSeedling,
  devices: FaCog,
  team: FaUsers,
  customer: FaTruck,
};

const PRIORITY_ICONS = {
  critical: FaExclamationCircle,
  high: FaExclamationCircle,
  medium: FaClock,
  low: FaClock,
};

export function EventComponent({ event, timeText }: EventContentArg) {
  // Access custom properties from FullCalendar event extendedProps
  const eventType =
    (event.extendedProps?.eventType as EventType) || "operations";
  const priority = (event.extendedProps?.priority as EventPriority) || "medium";
  const status = (event.extendedProps?.status as EventStatus) || "scheduled";

  const EventTypeIcon = EVENT_TYPE_ICONS[eventType];
  const PriorityIcon = PRIORITY_ICONS[priority];

  // Determine if this is a short event (less than 1 hour) for compact display
  const startTime = event.start ? new Date(event.start) : new Date();
  const endTime = event.end ? new Date(event.end) : new Date();
  const duration = endTime.getTime() - startTime.getTime();
  const isShortEvent = duration < 60 * 60 * 1000; // 1 hour in milliseconds

  return (
    <div className="h-full w-full flex flex-col justify-center px-1 py-0.5 text-white text-xs overflow-hidden">
      <div className="flex items-center space-x-1 min-w-0">
        {/* Event Type Icon */}
        {EventTypeIcon && (
          <EventTypeIcon className="w-3 h-3 flex-shrink-0 opacity-90" />
        )}

        {/* Event Title */}
        <span
          className="font-medium truncate flex-1 leading-tight"
          title={event.title || ""}
        >
          {event.title || "Untitled Event"}
        </span>

        {/* Priority Indicator for critical/high priority */}
        {(priority === "critical" || priority === "high") && PriorityIcon && (
          <PriorityIcon
            className={`w-2.5 h-2.5 flex-shrink-0 ${
              priority === "critical" ? "text-red-200" : "text-yellow-200"
            }`}
          />
        )}
      </div>

      {/* Status and additional info for longer events */}
      {!isShortEvent && (
        <div className="flex items-center justify-between mt-0.5 text-xs opacity-80">
          <Badge
            variant="secondary"
            className="text-xs px-1 py-0 h-4 bg-white/20 text-white border-white/30"
          >
            {status.replace("_", " ")}
          </Badge>

          {/* Time display - use FullCalendar's timeText if available */}
          <span className="text-xs opacity-75">
            {timeText ||
              startTime.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              })}
          </span>
        </div>
      )}

      {/* Description preview for very long events (all-day or multi-hour) */}
      {duration > 4 * 60 * 60 * 1000 && event.title && (
        <div className="mt-1 text-xs opacity-75 line-clamp-2">
          {/* Show title as description for long events since description might not be available */}
        </div>
      )}
    </div>
  );
}
