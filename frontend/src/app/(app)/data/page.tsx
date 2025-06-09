"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, BarChart3, Plus } from "lucide-react";
import NewGrowSetup from "@/components/grow-management/NewGrowSetup";
import CurrentGrowsView from "@/components/grow-management/CurrentGrowsView";
import GrowHistoryView from "@/components/grow-management/GrowHistoryView";

export default function GrowManagementPage() {
  const [activeTab, setActiveTab] = useState("current");

  return (
    <div className="flex-1 p-8 animate-pop">
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold text-green-900 dark:text-green-100 drop-shadow-lg border-b-2 border-green-200 dark:border-green-800 pb-4">
          Grow Management
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 mt-2">
          Manage your vertical farm grows from seed to harvest
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="current" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Current Grows
          </TabsTrigger>
          <TabsTrigger value="new" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Grow Setup
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            History & Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="mt-6">
          <CurrentGrowsView searchTerm="" statusFilter="all" />
        </TabsContent>

        <TabsContent value="new" className="mt-6">
          <NewGrowSetup />
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <GrowHistoryView searchTerm="" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
