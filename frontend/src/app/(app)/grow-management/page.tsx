"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Sprout, ArrowRight } from "lucide-react";

import { NewGrowSetup, GrowParametersView } from "@/components/features/agriculture";
import { GrowOperationsDashboard } from "@/components/features/agriculture/GrowOperationsDashboard";

export default function GrowManagementPage() {

  const [activeTab, setActiveTab] = useState("dashboard");

  const handleNavigateToTab = (tab: string) => {
    setActiveTab(tab);
  };

  return (
    <div className="container mx-auto p-6">
      <PageHeader 
        title="Grow Management"
        description="Manage your complete growing operations, from germination to harvest."
        size="md"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard">Live Dashboard</TabsTrigger>
          <TabsTrigger value="setup">New Grow Setup</TabsTrigger>
          <TabsTrigger value="parameters">Parameters & Recipes</TabsTrigger>
          <TabsTrigger value="germination">Germination Overview</TabsTrigger>
          <TabsTrigger value="transplant">Transplant Manager</TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard" className="space-y-4">
          <GrowOperationsDashboard onNavigateToTab={handleNavigateToTab} />
        </TabsContent>
        
        <TabsContent value="setup" className="space-y-4">
          <NewGrowSetup />
        </TabsContent>
        
        <TabsContent value="parameters" className="space-y-4">
          <GrowParametersView />
        </TabsContent>

        <TabsContent value="germination" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sprout className="h-5 w-5 text-green-600" />
                Germination Overview
              </CardTitle>
              <CardDescription>
                Monitor germination progress across all tents and track seedling development
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Sprout className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Germination Management</h3>
                <p className="text-gray-500 mb-4">
                  This section will contain all germination management functionality previously located in the standalone germination management page.
                </p>
                <p className="text-sm text-gray-400">
                  Functionality will be implemented in the next phase.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transplant" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowRight className="h-5 w-5 text-blue-600" />
                Transplant Manager
              </CardTitle>
              <CardDescription>
                Track seedlings ready for transplantation and manage the transition to growing areas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <ArrowRight className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Transplant Management</h3>
                <p className="text-gray-500 mb-4">
                  This section will contain transplant management functionality for tracking seedlings ready for transplantation.
                </p>
                <p className="text-sm text-gray-400">
                  Functionality will be implemented in the next phase.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}