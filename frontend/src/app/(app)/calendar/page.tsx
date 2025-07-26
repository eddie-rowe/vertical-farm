"use client";

import React from "react";

import { CalendarView } from "@/components/features/calendar/CalendarView";
import { PageHeader } from "@/components/ui/PageHeader";

export default function CalendarPage() {
  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title="Farm Calendar"
        description="Monitor and schedule all farm operations, device automation, team schedules, and customer deliveries"
      />

      <div className="flex-1 p-6">
        <CalendarView />
      </div>
    </div>
  );
}
