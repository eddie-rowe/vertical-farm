"use client";

import { Calendar, Clock, Search, Eye, Trash2, Edit, Bot } from "lucide-react";
import { useState, useEffect } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import AutomationMonitorCard from "./AutomationMonitorCard";

interface CurrentGrow {
  id: string;
  shelf_id: string;
  shelf_name: string;
  rack_name: string;
  row_name: string;
  farm_name: string;
  grow_recipe_id: string;
  recipe_name: string;
  species_name: string;
  start_date: string;
  estimated_end_date: string;
  status: "planned" | "active" | "completed" | "aborted";
  notes?: string;
  progress_percentage: number;
  days_elapsed: number;
  days_remaining: number;
  total_days: number;
  // Additional recipe details for display
  light_hours_per_day?: number;
  target_temperature_min?: number;
  target_temperature_max?: number;
  watering_frequency_hours?: number;
}

interface CurrentGrowsViewProps {
  searchTerm: string;
  statusFilter: string;
}

export default function CurrentGrowsView({
  searchTerm,
  statusFilter,
}: CurrentGrowsViewProps) {
  const [currentGrows, setCurrentGrows] = useState<CurrentGrow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showAutomation, setShowAutomation] = useState(true);

  // Mock data for demonstration - replace with actual API calls
  useEffect(() => {
    const mockGrows: CurrentGrow[] = [
      {
        id: "grow-1",
        shelf_id: "shelf-1",
        shelf_name: "Shelf A1-1-1",
        rack_name: "Rack A1-1",
        row_name: "Row A1",
        farm_name: "Greenhouse A",
        grow_recipe_id: "recipe-1",
        recipe_name: "Quick Lettuce",
        species_name: "Lettuce",
        start_date: "2024-01-15",
        estimated_end_date: "2024-02-19",
        status: "active",
        progress_percentage: 65,
        days_elapsed: 23,
        days_remaining: 12,
        total_days: 35,
        light_hours_per_day: 14,
        target_temperature_min: 18,
        target_temperature_max: 22,
        watering_frequency_hours: 24,
        notes: "Growing well, good color development",
      },
      {
        id: "grow-2",
        shelf_id: "shelf-2",
        shelf_name: "Shelf A1-1-2",
        rack_name: "Rack A1-1",
        row_name: "Row A1",
        farm_name: "Greenhouse A",
        grow_recipe_id: "recipe-2",
        recipe_name: "Premium Basil",
        species_name: "Basil",
        start_date: "2024-01-20",
        estimated_end_date: "2024-03-09",
        status: "active",
        progress_percentage: 40,
        days_elapsed: 20,
        days_remaining: 29,
        total_days: 49,
        light_hours_per_day: 16,
        target_temperature_min: 20,
        target_temperature_max: 26,
        watering_frequency_hours: 12,
        notes: "Strong germination, adjusting lighting schedule",
      },
      {
        id: "grow-3",
        shelf_id: "shelf-3",
        shelf_name: "Shelf B1-1-1",
        rack_name: "Rack B1-1",
        row_name: "Row B1",
        farm_name: "Greenhouse A",
        grow_recipe_id: "recipe-1",
        recipe_name: "Quick Lettuce",
        species_name: "Lettuce",
        start_date: "2024-01-01",
        estimated_end_date: "2024-02-05",
        status: "completed",
        progress_percentage: 100,
        days_elapsed: 35,
        days_remaining: 0,
        total_days: 35,
        light_hours_per_day: 14,
        target_temperature_min: 18,
        target_temperature_max: 22,
        watering_frequency_hours: 24,
        notes: "Harvested successfully - 2.3kg yield",
      },
    ];

    setCurrentGrows(mockGrows);
    setIsLoading(false);
  }, []);

  const filteredGrows = currentGrows.filter((grow) => {
    const matchesSearch =
      !searchTerm ||
      grow.species_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      grow.recipe_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      grow.shelf_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      grow.farm_name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || grow.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: CurrentGrow["status"]) => {
    switch (status) {
      case "planned":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "completed":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      case "aborted":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleViewDetails = (growId: string) => {
    // TODO: Navigate to detailed grow view
    console.log("View details for grow:", growId);
  };

  const handleEditGrow = (growId: string) => {
    // TODO: Open edit modal
    console.log("Edit grow:", growId);
  };

  const handleAbortGrow = async (growId: string) => {
    if (
      !confirm(
        "Are you sure you want to abort this grow? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      // TODO: API call to abort grow
      setCurrentGrows((grows) =>
        grows.map((grow) =>
          grow.id === growId ? { ...grow, status: "aborted" as const } : grow,
        ),
      );
    } catch (error) {
      console.error("Error aborting grow:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading current grows...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search grows by species, recipe, or location..."
                  value={searchTerm}
                  onChange={() => {
                    /* searchTerm is controlled by parent */
                  }}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Select
                value={statusFilter}
                onValueChange={() => {
                  /* statusFilter is controlled by parent */
                }}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="planned">Planned</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="aborted">Aborted</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={() => setShowAutomation(!showAutomation)}
              >
                <Bot className="h-4 w-4 mr-1" />
                {showAutomation ? "Hide" : "Show"} Automation
              </Button>

              <Button
                variant="outline"
                onClick={() =>
                  setViewMode(viewMode === "grid" ? "list" : "grid")
                }
              >
                {viewMode === "grid" ? "List View" : "Grid View"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {currentGrows.filter((g) => g.status === "active").length}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Active Grows
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">
              {currentGrows.filter((g) => g.status === "planned").length}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Planned</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-gray-600">
              {currentGrows.filter((g) => g.status === "completed").length}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Completed
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {Math.round(
                currentGrows
                  .filter((g) => g.status === "active")
                  .reduce((acc, g) => acc + g.progress_percentage, 0) /
                  Math.max(
                    currentGrows.filter((g) => g.status === "active").length,
                    1,
                  ),
              )}
              %
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Avg Progress
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Grows Display */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGrows.map((grow) => (
            <div key={grow.id} className="space-y-4">
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {grow.species_name}
                      </CardTitle>
                      <CardDescription>{grow.recipe_name}</CardDescription>
                    </div>
                    <Badge className={getStatusColor(grow.status)}>
                      {grow.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{grow.progress_percentage}%</span>
                    </div>
                    <Progress
                      value={grow.progress_percentage}
                      className="h-2"
                    />
                    <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                      <span>
                        Day {grow.days_elapsed}/{grow.total_days}
                      </span>
                      <span>{grow.days_remaining} days left</span>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Started:{" "}
                        {new Date(grow.start_date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>
                        Harvest:{" "}
                        {new Date(grow.estimated_end_date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      📍 {grow.farm_name} › {grow.row_name} › {grow.rack_name} ›{" "}
                      {grow.shelf_name}
                    </div>
                  </div>

                  {grow.notes && (
                    <div className="bg-gray-50 dark:bg-gray-900 rounded p-2 text-sm">
                      <strong>Notes:</strong> {grow.notes}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleViewDetails(grow.id)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    {grow.status === "active" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditGrow(grow.id)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleAbortGrow(grow.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Automation Monitor */}
              {showAutomation && grow.status === "active" && (
                <AutomationMonitorCard
                  scheduleId={grow.id}
                  shelfName={grow.shelf_name}
                  recipeName={grow.recipe_name}
                />
              )}
            </div>
          ))}
        </div>
      ) : (
        // List view would go here - simplified for now
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-gray-500">
              List view coming soon...
            </div>
          </CardContent>
        </Card>
      )}

      {filteredGrows.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-gray-500 text-lg">No grows found</p>
              <p className="text-sm text-gray-400 mt-2">
                {searchTerm || statusFilter !== "all"
                  ? "Try adjusting your search or filters"
                  : 'Start your first grow in the "New Grow Setup" tab'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
