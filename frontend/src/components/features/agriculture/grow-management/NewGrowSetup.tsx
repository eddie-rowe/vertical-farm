"use client";

import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Check,
  Leaf,
  MapPin,
  Settings,
  Clock,
  Zap,
  Calendar as CalendarIcon,
  Target,
  Users,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useState, useEffect, useMemo, useCallback, useOptimistic, useTransition } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  FarmSearchAndFilter,
  type FilterDefinition,
} from "@/components/ui/farm-search-and-filter";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

// Service imports - MANDATORY service layer pattern
import { useFarmSearch, useFarmFilters } from "@/hooks";
import { AuthService } from "@/services/core/auth/AuthService";
import { FarmService } from "@/services/domain/farm/FarmService";
import { GrowRecipeService } from "@/services/domain/farm/GrowRecipeService";
import { GrowService, type CreateGrowInput } from "@/services/domain/farm/GrowService";
import { SpeciesService } from "@/services/domain/farm/SpeciesService";

// Type imports
import type { Shelf, FarmWithCapacity } from "@/services/domain/farm/types";
import type { Species, GrowRecipe } from "@/types/farm/recipes";

// Hook imports

// Enhanced interfaces with proper status types

interface ShelfWithStatus extends Shelf {
  status?: "available" | "occupied" | "maintenance";
}

interface GrowRecipeWithEstimates extends GrowRecipe {
  yield_estimate?: string;
  profit_estimate?: string;
}

// New wizard step type
type WizardStep = "farm" | "recipe" | "location" | "confirm";

export default function NewGrowSetup() {
  // Wizard state
  const [currentStep, setCurrentStep] = useState<WizardStep>("farm");
  const [selectedFarm, setSelectedFarm] = useState<string>("");
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [selectedRacks, setSelectedRacks] = useState<Set<string>>(new Set());
  const [selectedShelves, setSelectedShelves] = useState<Set<string>>(new Set());
  const [selectedRecipe, setSelectedRecipe] = useState<string>("");
  const [startDate, setStartDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );

  // Data state - using proper types
  const [farms, setFarms] = useState<FarmWithCapacity[]>([]);
  const [species, setSpecies] = useState<Species[]>([]);
  const [growRecipes, setGrowRecipes] = useState<GrowRecipeWithEstimates[]>([]);

  // Loading and error state
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // React 19 features
  const [isPending, startTransition] = useTransition();

  // Optimistic state for instant UI feedback
  const [optimisticGrows, setOptimisticGrows] = useOptimistic<
    CreateGrowInput[], 
    CreateGrowInput[]
  >([], (currentGrows, newGrows) => [...currentGrows, ...newGrows]);

  // Service instances - singleton pattern
  const farmService = useMemo(() => FarmService.getInstance(), []);
  const speciesService = useMemo(() => SpeciesService.getInstance(), []);
  const growRecipeService = useMemo(() => GrowRecipeService.getInstance(), []);
  const growService = useMemo(() => GrowService.getInstance(), []);
  const authService = useMemo(() => AuthService.getInstance(), []);

  // ✅ NEW: Standardized search and filter hooks for recipe selection
  const {
    searchTerm: recipeSearchTerm,
    setSearchTerm: setRecipeSearchTerm,
    clearSearch: clearRecipeSearch,
    filterItems: searchFilterRecipes,
    hasSearch: hasRecipeSearch,
  } = useFarmSearch<GrowRecipe>({
    searchFields: ["name"],
    caseSensitive: false,
  });

  const {
    filters: recipeFilters,
    setFilter: setRecipeFilter,
    removeFilter: removeRecipeFilter,
    clearAllFilters: clearAllRecipeFilters,
    getActiveFilterChips: getActiveRecipeFilterChips,
    filterItems: filterFilterRecipes,
    hasActiveFilters: hasActiveRecipeFilters,
  } = useFarmFilters<GrowRecipe>();

  // ✅ NEW: Filter definitions for recipe selection - using real data
  const recipeFilterDefinitions: FilterDefinition[] = useMemo(
    () => [
      {
        id: "difficulty",
        label: "Difficulty",
        placeholder: "Filter by difficulty",
        options: [
          { value: "all", label: "All Difficulties" },
          { value: "Easy", label: "Easy" },
          { value: "Medium", label: "Medium" },
          { value: "Hard", label: "Hard" },
        ],
        defaultValue: "all",
      },
      {
        id: "species",
        label: "Species",
        placeholder: "Filter by species",
        options: [
          { value: "all", label: "All Species" },
          ...species.map((s) => ({ value: s.id, label: s.name })),
        ],
        defaultValue: "all",
      },
      {
        id: "duration",
        label: "Duration",
        placeholder: "Filter by grow time",
        options: [
          { value: "all", label: "All Durations" },
          { value: "short", label: "Short (< 30 days)" },
          { value: "medium", label: "Medium (30-50 days)" },
          { value: "long", label: "Long (> 50 days)" },
        ],
        defaultValue: "all",
      },
    ],
    [species],
  );

  // ✅ NEW: Handle filter changes
  const handleRecipeFilterChange = useCallback(
    (filterId: string, value: string) => {
      if (value === "all") {
        removeRecipeFilter(filterId);
      } else {
        setRecipeFilter(filterId, value);
      }
    },
    [setRecipeFilter, removeRecipeFilter],
  );

  // ✅ NEW: Handle filter chip removal
  const handleRemoveRecipeFilter = useCallback(
    (filterId: string) => {
      removeRecipeFilter(filterId);
    },
    [removeRecipeFilter],
  );

  // ✅ NEW: Custom filter function for complex logic
  const customRecipeFilterFunction = useCallback(
    (recipe: GrowRecipe, filterValues: any[]) => {
      return filterValues.every((filter) => {
        if (!filter.value || filter.value === "all") return true;

        switch (filter.id) {
          case "difficulty":
            return recipe.difficulty === filter.value;
          case "species":
            return recipe.species_id === filter.value;
          case "duration":
            const totalDays = recipe.total_grow_days || 0;
            if (filter.value === "short") return totalDays < 30;
            if (filter.value === "medium")
              return totalDays >= 30 && totalDays <= 50;
            if (filter.value === "long") return totalDays > 50;
            return true;
          default:
            return true;
        }
      });
    },
    [],
  );

  // ✅ NEW: Filtered and sorted recipes with standardized hooks
  const filteredAndSortedRecipes = useMemo(() => {
    let result = growRecipes;

    // Apply search filtering
    result = searchFilterRecipes(result);

    // Apply custom filter logic
    if (recipeFilters.length > 0) {
      result = result.filter((recipe) =>
        customRecipeFilterFunction(recipe, recipeFilters),
      );
    }

    // Add species data for display
    result = result.map((recipe) => ({
      ...recipe,
      species: species.find((s) => s.id === recipe.species_id),
    }));

    return result;
  }, [
    growRecipes,
    searchFilterRecipes,
    recipeFilters,
    customRecipeFilterFunction,
    species,
  ]);

  // Data loading with service layer - using "use cache" pattern
  const loadInitialData = useCallback(async () => {
    setIsInitialLoading(true);
    setError(null);

    try {
      // Load data in parallel using service layer
      const [farmsData, speciesData, recipesData] = await Promise.all([
        farmService.getAll(),
        speciesService.getActiveSpecies(),
        growRecipeService.getActiveRecipes(),
      ]);

      // Get real farm data with capacity and status
      const user = await authService.getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      const farmsWithCapacity = await farmService.getFarmsWithCapacity(user.id);

      // Get recipes with real estimates
      const recipesWithEstimates = await growRecipeService.getAllRecipesWithEstimates();

      setFarms(farmsWithCapacity);
      setSpecies(speciesData);
      setGrowRecipes(recipesWithEstimates);

    } catch (error) {
      console.error('Error loading initial data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load data');
    } finally {
      setIsInitialLoading(false);
    }
  }, [farmService, speciesService, growRecipeService, authService]);


  // Load initial data on component mount
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const selectedFarmData = farms.find((f) => f.id === selectedFarm);
  const selectedRecipeData = growRecipes.find((r) => r.id === selectedRecipe);
  const selectedSpeciesData = selectedRecipeData
    ? species.find((s) => s.id === selectedRecipeData.species_id)
    : null;

  const steps = [
    {
      key: "farm" as WizardStep,
      title: "Select Farm",
      icon: MapPin,
      description: "Choose your growing facility",
    },
    {
      key: "recipe" as WizardStep,
      title: "Choose Recipe",
      icon: Leaf,
      description: "Pick what to grow",
    },
    {
      key: "location" as WizardStep,
      title: "Select Locations",
      icon: Target,
      description: "Choose growing spots",
    },
    {
      key: "confirm" as WizardStep,
      title: "Confirm Setup",
      icon: Check,
      description: "Review and start",
    },
  ];

  const currentStepIndex = steps.findIndex((step) => step.key === currentStep);
  const progressPercentage = ((currentStepIndex + 1) / steps.length) * 100;

  const canProgress = () => {
    switch (currentStep) {
      case "farm":
        return !!selectedFarm;
      case "recipe":
        return !!selectedRecipe;
      case "location":
        return selectedShelves.size > 0;
      case "confirm":
        return true;
      default:
        return false;
    }
  };

  const nextStep = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length && canProgress()) {
      setCurrentStep(steps[nextIndex].key);
    }
  };

  const prevStep = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].key);
    }
  };

  const handleToggleShelf = (shelfId: string) => {
    const newSelected = new Set(selectedShelves);
    if (newSelected.has(shelfId)) {
      newSelected.delete(shelfId);
    } else {
      newSelected.add(shelfId);
    }
    setSelectedShelves(newSelected);
  };

  const handleStartGrow = async () => {
    if (!selectedRecipe || selectedShelves.size === 0) return;

    setIsLoading(true);
    setError(null);

    // Create grow inputs for each selected shelf
    const selectedShelfIds = Array.from(selectedShelves);
    const growInputs: CreateGrowInput[] = selectedShelfIds.map((shelfId) => ({
      name: `${selectedRecipeData?.name} - ${new Date(startDate).toLocaleDateString()}`,
      grow_recipe_id: selectedRecipe,
      shelf_id: shelfId,
      start_date: startDate,
      estimated_harvest_date: calculateEstimatedHarvestDate(startDate, selectedRecipeData?.total_grow_days ?? undefined),
      notes: `Started via New Grow Setup wizard on ${new Date().toLocaleDateString()}`,
      automation_enabled: true,
    }));

    // Use optimistic updates for instant feedback
    startTransition(() => {
      setOptimisticGrows(growInputs);
    });

    try {
      // Create grows using service layer
      const createdGrows = await growService.startMultipleGrows(growInputs);

      // Reset form on success
      setSelectedShelves(new Set());
      setSelectedRacks(new Set());
      setSelectedRows(new Set());
      setSelectedRecipe("");
      setSelectedFarm("");
      setCurrentStep("farm");

      // Show success message
      console.log(`Successfully started ${createdGrows.length} grows:`, createdGrows);

    } catch (error) {
      console.error("Error starting grows:", error);
      setError(error instanceof Error ? error.message : "Failed to start grows. Please try again.");
      
      // Reset optimistic state on error
      setOptimisticGrows([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to calculate estimated harvest date
  const calculateEstimatedHarvestDate = useCallback((startDate: string, totalGrowDays?: number): string => {
    const start = new Date(startDate);
    const days = totalGrowDays || 30; // Default 30 days if not specified
    const harvestDate = new Date(start.getTime() + days * 24 * 60 * 60 * 1000);
    return harvestDate.toISOString().split('T')[0];
  }, []);

  const getDifficultyColor = (difficulty?: string | null) => {
    switch (difficulty) {
      case "Easy":
      case "beginner":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "Medium":
      case "intermediate":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "Hard":
      case "advanced":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "available":
        return "bg-green-500";
      case "occupied":
        return "bg-red-500";
      case "maintenance":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  // Show loading state during initial data load
  if (isInitialLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="card-shadow">
          <CardContent className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-green-600" />
              <p className="text-lg text-gray-600">Loading grow setup wizard...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setError(null)}
              className="ml-2"
            >
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Optimistic Success Feedback */}
      {optimisticGrows.length > 0 && (
        <Alert>
          <Check className="h-4 w-4" />
          <AlertDescription>
            Starting {optimisticGrows.length} new grows... This will complete shortly.
          </AlertDescription>
        </Alert>
      )}
      {/* Header Card */}
      <Card className="card-shadow">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
                  <Calendar className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                New Grow Setup
              </CardTitle>
              <CardDescription className="mt-2 text-base">
                Set up a new cultivation cycle with our guided wizard
              </CardDescription>
            </div>
            <Badge variant="secondary" className="text-sm px-3 py-1">
              Step {currentStepIndex + 1} of {steps.length}
            </Badge>
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <Progress value={progressPercentage} className="h-2 mb-4" />
            <div className="flex justify-between">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = step.key === currentStep;
                const isCompleted = index < currentStepIndex;
                const isAccessible = index <= currentStepIndex;

                return (
                  <button
                    key={step.key}
                    onClick={() => isAccessible && setCurrentStep(step.key)}
                    disabled={!isAccessible}
                    className={`flex flex-col items-center gap-2 p-2 rounded-lg transition-all ${
                      isActive
                        ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                        : isCompleted
                          ? "text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950"
                          : "text-gray-400 dark:text-gray-600"
                    } ${isAccessible ? "cursor-pointer" : "cursor-not-allowed"}`}
                  >
                    <div
                      className={`p-2 rounded-full ${
                        isActive
                          ? "bg-green-600 text-white"
                          : isCompleted
                            ? "bg-green-100 dark:bg-green-800 text-green-600 dark:text-green-400"
                            : "bg-gray-100 dark:bg-gray-800"
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Icon className="h-4 w-4" />
                      )}
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-sm">{step.title}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {step.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Step Content */}
      <Card className="card-shadow animate-pop">
        <CardContent className="p-6">
          {/* Farm Selection Step */}
          {currentStep === "farm" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-2">Choose Your Farm</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Select the facility where you want to start your grow
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {farms.map((farm) => (
                  <button
                    key={farm.id}
                    onClick={() => farm.id && setSelectedFarm(farm.id)}
                    className={`text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                      selectedFarm === farm.id
                        ? "border-green-500 bg-green-50 dark:bg-green-950 shadow-lg transform scale-105"
                        : "border-gray-200 dark:border-gray-700 hover:border-green-300 hover:shadow-md hover:scale-102"
                    } ${farm.status === "maintenance" ? "opacity-50" : ""}`}
                    disabled={farm.status === "maintenance"}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="text-3xl">🏭</div>
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            farm.status === "online"
                              ? "bg-green-500"
                              : farm.status === "offline"
                                ? "bg-red-500"
                                : "bg-yellow-500"
                          }`}
                        />
                        <Badge
                          variant={
                            farm.status === "online" ? "default" : "secondary"
                          }
                          className="text-xs"
                        >
                          {farm.status}
                        </Badge>
                      </div>
                    </div>

                    <h4 className="font-semibold text-lg mb-1">{farm.name}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {farm.location}
                    </p>

                    {farm.capacity && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Capacity</span>
                          <span>
                            {farm.capacity.used}/{farm.capacity.total} shelves
                          </span>
                        </div>
                        <Progress
                          value={
                            (farm.capacity.used / farm.capacity.total) * 100
                          }
                          className="h-2"
                        />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Recipe Selection Step */}
          {currentStep === "recipe" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-2">
                  Choose Your Recipe
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Select what you want to grow and how you want to grow it
                </p>
              </div>

              {/* ✅ NEW: Standardized Search and Filter Component */}
              <Card>
                <CardContent className="pt-4">
                  <FarmSearchAndFilter
                    searchValue={recipeSearchTerm}
                    onSearchChange={setRecipeSearchTerm}
                    searchContext="recipes"
                    searchPlaceholder="Search recipes by name..."
                    filters={recipeFilterDefinitions}
                    activeFilters={getActiveRecipeFilterChips(
                      recipeFilterDefinitions,
                    )}
                    onFilterChange={handleRecipeFilterChange}
                    onRemoveFilter={handleRemoveRecipeFilter}
                    onClearAllFilters={clearAllRecipeFilters}
                    orientation="horizontal"
                    showFilterChips={true}
                  />

                  {/* Results summary */}
                  {(hasRecipeSearch || hasActiveRecipeFilters) && (
                    <div className="mt-4 flex items-center justify-between">
                      <p className="text-sm text-gray-600">
                        Showing {filteredAndSortedRecipes.length} of{" "}
                        {growRecipes.length} recipes
                      </p>
                      {(hasRecipeSearch || hasActiveRecipeFilters) && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            clearRecipeSearch();
                            clearAllRecipeFilters();
                          }}
                        >
                          Clear all filters
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recipe Grid */}
              {filteredAndSortedRecipes.length === 0 ? (
                <Card>
                  <CardContent className="py-12">
                    <div className="text-center">
                      <Leaf className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-600 mb-2">
                        No recipes found
                      </h3>
                      <p className="text-gray-500 mb-4">
                        {hasRecipeSearch || hasActiveRecipeFilters
                          ? "Try adjusting your search or filters to find recipes."
                          : "No recipes are available at the moment."}
                      </p>
                      {(hasRecipeSearch || hasActiveRecipeFilters) && (
                        <Button
                          variant="outline"
                          onClick={() => {
                            clearRecipeSearch();
                            clearAllRecipeFilters();
                          }}
                        >
                          Clear filters
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredAndSortedRecipes.map((recipe) => {
                    const recipeSpecies = species.find(
                      (s) => s.id === recipe.species_id,
                    );
                    return (
                      <button
                        key={recipe.id}
                        onClick={() => setSelectedRecipe(recipe.id)}
                        className={`text-left p-6 rounded-xl border-2 transition-all duration-200 ${
                          selectedRecipe === recipe.id
                            ? "border-green-500 bg-green-50 dark:bg-green-950 shadow-lg transform scale-105"
                            : "border-gray-200 dark:border-gray-700 hover:border-green-300 hover:shadow-md hover:scale-102"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="text-2xl">
                              🌱
                            </div>
                            <div>
                              <h4 className="font-semibold text-lg">
                                {recipe.name}
                              </h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {recipeSpecies?.name}
                              </p>
                            </div>
                          </div>
                          <Badge
                            className={getDifficultyColor(recipe.difficulty)}
                          >
                            {recipe.difficulty}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-500" />
                            <span>{recipe.total_grow_days} days</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Zap className="h-4 w-4 text-gray-500" />
                            <span>{recipe.light_hours_per_day}h light</span>
                          </div>
                        </div>

                        <Separator className="my-3" />

                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">
                              Expected Yield:
                            </span>
                            <span className="font-medium">
                              {recipe.yield_estimate}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">
                              Profit Estimate:
                            </span>
                            <span className="font-medium text-green-600 dark:text-green-400">
                              {recipe.profit_estimate}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Location Selection Step */}
          {currentStep === "location" && selectedFarmData && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold mb-2">
                    Select Growing Locations
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Choose shelves in {selectedFarmData.name}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Selected
                  </div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {selectedShelves.size}
                  </div>
                </div>
              </div>

              {/* Status Legend */}
              <div className="flex items-center gap-6 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-sm">Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-sm">Occupied</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <span className="text-sm">Maintenance</span>
                </div>
              </div>

              <div className="space-y-4">
                {/* Farm hierarchy disabled - FarmWithCapacity doesn't have rows */}
                {([] as any[])?.map((row: any) => (
                  <Card key={row.id} className="gradient-row">
                    <CardContent className="pt-4">
                      <h4 className="font-semibold mb-4 flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        {row.name}
                        <Badge variant="outline">
                          {row.racks?.length || 0} racks
                        </Badge>
                      </h4>

                      <div className="space-y-3">
                        {row.racks?.map((rack: any) => (
                          <div key={rack.id} className="space-y-2">
                            <div className="font-medium text-sm flex items-center gap-2">
                              <Settings className="h-3 w-3" />
                              {rack.name}
                              <Badge variant="outline" className="text-xs">
                                {rack.shelves?.length || 0} shelves
                              </Badge>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 ml-5">
                              {rack.shelves?.map((shelf: any) => {
                                const shelfStatus = (shelf as ShelfWithStatus).status || "available";
                                const dimensions = shelf.dimensions;
                                const displaySize = dimensions 
                                  ? `${dimensions.width}×${dimensions.depth}m`
                                  : "2×1m"; // Default size
                                
                                return (
                                  <button
                                    key={shelf.id}
                                    onClick={() =>
                                      shelfStatus === "available" &&
                                      handleToggleShelf(shelf.id!)
                                    }
                                    disabled={shelfStatus !== "available"}
                                    className={`p-3 rounded-lg border-2 transition-all text-sm ${
                                      shelfStatus !== "available"
                                        ? "opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-800"
                                        : selectedShelves.has(shelf.id!)
                                          ? "border-green-500 bg-green-100 dark:bg-green-900 shadow-md transform scale-105"
                                          : "border-gray-200 dark:border-gray-700 hover:border-green-300 hover:shadow-sm hover:scale-102 bg-white dark:bg-gray-800"
                                    }`}
                                  >
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="font-medium">
                                        {shelf.name}
                                      </span>
                                      <div
                                        className={`w-2 h-2 rounded-full ${getStatusColor(shelfStatus)}`}
                                      />
                                    </div>
                                    <Badge
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      {displaySize}
                                    </Badge>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Confirmation Step */}
          {currentStep === "confirm" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-2">
                  Confirm Your Setup
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Review your selections and start the grow
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Setup Summary */}
                <Card className="gradient-farm">
                  <CardHeader>
                    <CardTitle className="text-lg">Grow Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Farm:</span>
                      <span>{selectedFarmData?.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Recipe:</span>
                      <span>{selectedRecipeData?.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Species:</span>
                      <span className="flex items-center gap-2">
                        🌱 {selectedSpeciesData?.name}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Shelves:</span>
                      <span>{selectedShelves.size} selected</span>
                    </div>

                    <Separator />

                    <div>
                      <Label htmlFor="confirm-start-date">Start Date</Label>
                      <Input
                        id="confirm-start-date"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Timeline & Estimates */}
                <Card className="gradient-shelf">
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Timeline & Estimates
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedRecipeData && (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Duration:</span>
                          <span>{selectedRecipeData.total_grow_days} days</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Harvest Date:</span>
                          <span>
                            {new Date(
                              new Date(startDate).getTime() +
                                (selectedRecipeData.total_grow_days || 0) *
                                  24 *
                                  60 *
                                  60 *
                                  1000,
                            ).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Expected Yield:</span>
                          <span className="text-green-600 dark:text-green-400">
                            {selectedRecipeData.yield_estimate}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Profit Estimate:</span>
                          <span className="text-green-600 dark:text-green-400 font-semibold">
                            {selectedRecipeData.profit_estimate}
                          </span>
                        </div>

                        <Separator />

                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-2 mb-1">
                            <CalendarIcon className="h-4 w-4" />
                            <span>Total shelves: {selectedShelves.size}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Target className="h-4 w-4" />
                            <span>
                              Estimated total profit: $
                              {selectedShelves.size * 32}-$
                              {selectedShelves.size * 48}
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <Card className="card-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStepIndex === 0}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>

            <div className="text-sm text-gray-600 dark:text-gray-400">
              {currentStep === "farm" && "Select a farm to continue"}
              {currentStep === "recipe" && "Choose a recipe to continue"}
              {currentStep === "location" &&
                "Select at least one shelf to continue"}
              {currentStep === "confirm" && "Ready to start your grow!"}
            </div>

            {currentStepIndex < steps.length - 1 ? (
              <Button
                onClick={nextStep}
                disabled={!canProgress()}
                className="flex items-center gap-2 btn-animated"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleStartGrow}
                disabled={!canProgress() || isLoading || isPending}
                className="flex items-center gap-2 btn-animated bg-green-600 hover:bg-green-700"
              >
                {isLoading || isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    Start {selectedShelves.size} Grows
                    <Check className="h-4 w-4" />
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
