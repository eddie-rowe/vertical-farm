"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

import { CurrentGrowsView, NewGrowSetup, GrowParametersView } from "@/components/features/agriculture";

export default function GrowManagementPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Grow Management
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your growing operations, monitor progress, and configure parameters.
        </p>
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dashboard">Live Dashboard</TabsTrigger>
          <TabsTrigger value="setup">New Grow Setup</TabsTrigger>
          <TabsTrigger value="parameters">Parameters & Recipes</TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Search Active Grows</CardTitle>
              <CardDescription>
                Search by farm, shelf, species, or recipe name
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search grows..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </CardContent>
          </Card>
          <CurrentGrowsView searchTerm={searchTerm} statusFilter={statusFilter} />
        </TabsContent>
        
        <TabsContent value="setup" className="space-y-4">
          <NewGrowSetup />
        </TabsContent>
        
        <TabsContent value="parameters" className="space-y-4">
          <GrowParametersView />
        </TabsContent>
      </Tabs>
    </div>
  );
}