"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FarmControlButton } from "@/components/ui/farm-control-button";
import { FarmInput } from "@/components/ui/farm-input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  BookOpen,
  Plus,
  Edit,
  Trash2,
  Copy,
  Clock,
  Thermometer,
  Droplets,
  Sun,
  FlaskConical,
  Search,
  Star,
  Leaf,
} from "lucide-react";

// ✅ NEW: Import standardized search/filter components and hooks
import {
  FarmSearchAndFilter,
  type FilterDefinition,
} from "@/components/ui/farm-search-and-filter";
import { useFarmSearch, useFarmFilters } from "@/hooks";

interface Recipe {
  id: string;
  name: string;
  description: string;
  cropType: string;
  variety: string;
  duration: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  isPublic: boolean;
  rating: number;
  usageCount: number;
  stages: RecipeStage[];
  nutrients: NutrientSchedule[];
  creator: string;
  createdAt: Date;
  updatedAt: Date;
}

interface RecipeStage {
  id: string;
  name: string;
  duration: number;
  lightHours: number;
  lightIntensity: number;
  temperature: number;
  humidity: number;
  description: string;
}

interface NutrientSchedule {
  day: number;
  nutrientType: string;
  concentration: number;
  ph: number;
  ec: number;
}

const SAMPLE_RECIPES: Recipe[] = [
  {
    id: "1",
    name: "Basic Lettuce Growth",
    description:
      "A simple and reliable recipe for growing crisp lettuce varieties",
    cropType: "lettuce",
    variety: "Buttercrunch",
    duration: 30,
    difficulty: "beginner",
    isPublic: true,
    rating: 4.8,
    usageCount: 156,
    creator: "FarmBot Admin",
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-12-20"),
    stages: [
      {
        id: "1",
        name: "Germination",
        duration: 7,
        lightHours: 14,
        lightIntensity: 150,
        temperature: 20,
        humidity: 85,
        description: "Initial germination phase with high humidity",
      },
      {
        id: "2",
        name: "Vegetative Growth",
        duration: 18,
        lightHours: 16,
        lightIntensity: 200,
        temperature: 22,
        humidity: 75,
        description: "Main growth phase with increased light",
      },
      {
        id: "3",
        name: "Harvest Ready",
        duration: 5,
        lightHours: 14,
        lightIntensity: 180,
        temperature: 18,
        humidity: 70,
        description: "Final phase before harvest",
      },
    ],
    nutrients: [
      { day: 1, nutrientType: "Starter", concentration: 0.8, ph: 6.0, ec: 1.2 },
      { day: 7, nutrientType: "Growth", concentration: 1.2, ph: 6.2, ec: 1.6 },
      { day: 21, nutrientType: "Finish", concentration: 1.0, ph: 6.0, ec: 1.4 },
    ],
  },
  {
    id: "2",
    name: "High-Yield Basil",
    description:
      "Intensive basil recipe optimized for maximum yield and flavor",
    cropType: "basil",
    variety: "Genovese",
    duration: 35,
    difficulty: "intermediate",
    isPublic: true,
    rating: 4.6,
    usageCount: 89,
    creator: "Chef Gardens",
    createdAt: new Date("2024-02-10"),
    updatedAt: new Date("2024-12-18"),
    stages: [
      {
        id: "1",
        name: "Germination",
        duration: 5,
        lightHours: 16,
        lightIntensity: 180,
        temperature: 24,
        humidity: 80,
        description: "Quick germination with warm conditions",
      },
      {
        id: "2",
        name: "Vegetative",
        duration: 25,
        lightHours: 18,
        lightIntensity: 250,
        temperature: 26,
        humidity: 70,
        description: "Extended growth with high light intensity",
      },
      {
        id: "3",
        name: "Harvest Cycle",
        duration: 5,
        lightHours: 16,
        lightIntensity: 200,
        temperature: 24,
        humidity: 65,
        description: "Continuous harvest phase",
      },
    ],
    nutrients: [
      {
        day: 1,
        nutrientType: "Herb Starter",
        concentration: 0.6,
        ph: 6.3,
        ec: 1.0,
      },
      {
        day: 5,
        nutrientType: "Herb Growth",
        concentration: 1.4,
        ph: 6.5,
        ec: 1.8,
      },
      {
        day: 20,
        nutrientType: "Herb Boost",
        concentration: 1.6,
        ph: 6.4,
        ec: 2.0,
      },
    ],
  },
];

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>(SAMPLE_RECIPES);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  // ✅ NEW: Replace manual search/filter state with standardized hooks
  const {
    searchTerm,
    setSearchTerm,
    clearSearch,
    filterItems: searchFilterItems,
    hasSearch,
  } = useFarmSearch<Recipe>({
    searchFields: ["name", "description", "cropType"],
    caseSensitive: false,
  });

  const {
    filters,
    setFilter,
    removeFilter,
    clearAllFilters,
    getActiveFilterChips,
    filterItems: filterFilterItems,
    hasActiveFilters,
  } = useFarmFilters<Recipe>();

  // Keep sorting separate from search/filter
  const [sortBy, setSortBy] = useState<string>("name");

  // ✅ NEW: Dynamic crop types for filter options
  const cropTypes = useMemo(
    () => [...new Set(recipes.map((r) => r.cropType))],
    [recipes],
  );

  // ✅ NEW: Filter definitions for FarmSearchAndFilter
  const filterDefinitions: FilterDefinition[] = useMemo(
    () => [
      {
        id: "cropType",
        label: "Crop Type",
        placeholder: "Filter by crop type",
        options: [
          { value: "all", label: "All Crops" },
          ...cropTypes.map((crop) => ({
            value: crop,
            label: crop.charAt(0).toUpperCase() + crop.slice(1),
          })),
        ],
        defaultValue: "all",
      },
      {
        id: "difficulty",
        label: "Difficulty",
        placeholder: "Filter by difficulty",
        options: [
          { value: "all", label: "All Levels" },
          { value: "beginner", label: "Beginner" },
          { value: "intermediate", label: "Intermediate" },
          { value: "advanced", label: "Advanced" },
        ],
        defaultValue: "all",
      },
    ],
    [cropTypes],
  );

  // ✅ NEW: Handle filter changes
  const handleFilterChange = useCallback(
    (filterId: string, value: string) => {
      if (value === "all") {
        removeFilter(filterId);
      } else {
        setFilter(filterId, value);
      }
    },
    [setFilter, removeFilter],
  );

  const handleRemoveFilter = useCallback(
    (filterId: string) => {
      removeFilter(filterId);
    },
    [removeFilter],
  );

  // ✅ NEW: Apply combined filtering and sorting
  const filteredRecipes = useMemo(() => {
    let result = recipes;

    // Apply search filtering
    result = searchFilterItems(result);

    // Apply standard filters
    result = filterFilterItems(result);

    // Apply sorting (kept separate from search/filter)
    result = result.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "rating":
          return b.rating - a.rating;
        case "usage":
          return b.usageCount - a.usageCount;
        case "duration":
          return a.duration - b.duration;
        case "created":
          return b.createdAt.getTime() - a.createdAt.getTime();
        default:
          return 0;
      }
    });

    return result;
  }, [recipes, searchFilterItems, filterFilterItems, sortBy]);

  // Helper function to map recipe difficulty to status type
  const getDifficultyStatus = (difficulty: Recipe["difficulty"]) => {
    switch (difficulty) {
      case "beginner":
        return "success";
      case "intermediate":
        return "info";
      case "advanced":
        return "warning";
      default:
        return "info";
    }
  };

  const RecipeCard: React.FC<{ recipe: Recipe }> = ({ recipe }) => (
    <Card
      className="hover:shadow-lg transition-shadow cursor-pointer card-shadow bg-farm-white"
      onClick={() => setSelectedRecipe(recipe)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-control-label flex items-center gap-2">
              <Leaf className="w-5 h-5 text-accent-primary" />
              {recipe.name}
            </CardTitle>
            <CardDescription className="mt-1 text-control-secondary">
              {recipe.description}
            </CardDescription>
          </div>
          <div className="flex items-center gap-1 ml-3">
            <Star className="w-4 h-4 text-accent-primary fill-current" />
            <span className="text-sensor-reading font-medium">
              {recipe.rating}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex flex-wrap gap-2 mb-3">
          <Badge variant="outline" className="capitalize">
            {recipe.cropType} - {recipe.variety}
          </Badge>
          <StatusBadge
            status={getDifficultyStatus(recipe.difficulty)}
            size="sm"
          >
            {recipe.difficulty}
          </StatusBadge>
          {recipe.isPublic && (
            <Badge variant="outline" className="text-blue-600 border-blue-300">
              Public
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4 text-sensor-reading text-control-secondary">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4 text-accent-primary" />
            <span>{recipe.duration} days</span>
          </div>
          <div className="flex items-center gap-1">
            <BookOpen className="w-4 h-4 text-accent-primary" />
            <span>{recipe.stages.length} stages</span>
          </div>
          <div className="flex items-center gap-1">
            <FlaskConical className="w-4 h-4 text-accent-primary" />
            <span>Used {recipe.usageCount}x</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <PageHeader
          title="Recipe Management"
          description="Create, manage, and share growing recipes for optimal crop yields"
          size="lg"
        >
          <FarmControlButton variant="primary" className="gap-2">
            <Plus className="w-4 h-4" />
            Create Recipe
          </FarmControlButton>
        </PageHeader>

        {/* ✅ NEW: Standardized Search and Filter Component */}
        <Card className="bg-accent-primary/5 dark:bg-accent-primary/10 card-shadow">
          <CardContent className="pt-4">
            <FarmSearchAndFilter
              searchValue={searchTerm}
              onSearchChange={setSearchTerm}
              searchContext="recipes, crops, or descriptions"
              searchPlaceholder="Search recipes, crops, or descriptions..."
              filters={filterDefinitions}
              activeFilters={getActiveFilterChips(filterDefinitions)}
              onFilterChange={handleFilterChange}
              onRemoveFilter={handleRemoveFilter}
              onClearAllFilters={clearAllFilters}
              orientation="horizontal"
              showFilterChips={true}
            />

            {/* Keep sorting separate */}
            <div className="flex items-center justify-between mt-4">
              {/* Results summary */}
              {(hasSearch || hasActiveFilters) && (
                <p className="text-sm text-gray-600">
                  Showing {filteredRecipes.length} of {recipes.length} recipes
                </p>
              )}

              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">
                  Sort by:
                </span>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Sort By" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="rating">Rating</SelectItem>
                    <SelectItem value="usage">Usage Count</SelectItem>
                    <SelectItem value="duration">Duration</SelectItem>
                    <SelectItem value="created">Date Created</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recipe Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {filteredRecipes.map((recipe) => (
          <RecipeCard key={recipe.id} recipe={recipe} />
        ))}
      </div>

      {/* Empty State */}
      {filteredRecipes.length === 0 && (
        <div className="text-center py-16">
          <BookOpen className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-sensor-value text-control-secondary mb-2">
            No recipes found
          </h3>
          <p className="text-control-secondary mb-6">
            Try adjusting your search or create a new recipe to get started
          </p>
          <FarmControlButton className="gap-2">
            <Plus className="w-4 h-4" />
            Create Your First Recipe
          </FarmControlButton>
        </div>
      )}

      {/* Recipe Detail Modal - keeping existing implementation */}
      {selectedRecipe && (
        <Dialog
          open={!!selectedRecipe}
          onOpenChange={() => setSelectedRecipe(null)}
        >
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
            <DialogHeader>
              <DialogTitle className="text-farm-title flex items-center gap-2">
                <Leaf className="w-5 h-5 text-accent-primary" />
                {selectedRecipe.name}
              </DialogTitle>
            </DialogHeader>

            <Tabs defaultValue="overview" className="mt-4">
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="stages">Growth Stages</TabsTrigger>
                <TabsTrigger value="nutrients">Nutrients</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-accent-primary/5 dark:bg-accent-primary/10 rounded-lg card-shadow">
                    <Clock className="w-6 h-6 mx-auto mb-2 text-accent-primary" />
                    <div className="text-sensor-value text-control-content">
                      {selectedRecipe.duration} days
                    </div>
                    <div className="text-control-label">Duration</div>
                  </div>
                  <div className="text-center p-3 bg-accent-primary/5 dark:bg-accent-primary/10 rounded-lg card-shadow">
                    <Star className="w-6 h-6 mx-auto mb-2 text-accent-primary" />
                    <div className="text-sensor-value text-control-content">
                      {selectedRecipe.rating}
                    </div>
                    <div className="text-control-label">Rating</div>
                  </div>
                  <div className="text-center p-3 bg-accent-primary/5 dark:bg-accent-primary/10 rounded-lg card-shadow">
                    <FlaskConical className="w-6 h-6 mx-auto mb-2 text-accent-primary" />
                    <div className="text-sensor-value text-control-content">
                      {selectedRecipe.usageCount}
                    </div>
                    <div className="text-control-label">Uses</div>
                  </div>
                  <div className="text-center p-3 bg-accent-primary/5 dark:bg-accent-primary/10 rounded-lg card-shadow">
                    <BookOpen className="w-6 h-6 mx-auto mb-2 text-accent-primary" />
                    <div className="text-sensor-value text-control-content">
                      {selectedRecipe.stages.length}
                    </div>
                    <div className="text-control-label">Stages</div>
                  </div>
                </div>

                <div>
                  <h4 className="text-control-label mb-2">Description</h4>
                  <p className="text-control-secondary">
                    {selectedRecipe.description}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="capitalize">
                    {selectedRecipe.cropType} - {selectedRecipe.variety}
                  </Badge>
                  <Badge
                    variant={
                      selectedRecipe.difficulty === "beginner"
                        ? "secondary"
                        : selectedRecipe.difficulty === "intermediate"
                          ? "default"
                          : "destructive"
                    }
                  >
                    {selectedRecipe.difficulty}
                  </Badge>
                  {selectedRecipe.isPublic && (
                    <Badge
                      variant="outline"
                      className="text-blue-600 border-blue-300"
                    >
                      Public Recipe
                    </Badge>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="stages" className="space-y-4">
                {selectedRecipe.stages.map((stage, index) => (
                  <Card key={stage.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        Stage {index + 1}: {stage.name}
                      </CardTitle>
                      <CardDescription>{stage.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-blue-600" />
                          <span>{stage.duration} days</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Sun className="w-4 h-4 text-yellow-600" />
                          <span>{stage.lightHours}h light</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Sun className="w-4 h-4 text-orange-600" />
                          <span>{stage.lightIntensity} PPFD</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Thermometer className="w-4 h-4 text-red-600" />
                          <span>{stage.temperature}°C</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Droplets className="w-4 h-4 text-blue-600" />
                          <span>{stage.humidity}% RH</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="nutrients" className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Day</th>
                        <th className="text-left p-2">Nutrient Type</th>
                        <th className="text-left p-2">Concentration</th>
                        <th className="text-left p-2">pH</th>
                        <th className="text-left p-2">EC</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedRecipe.nutrients.map((nutrient, index) => (
                        <tr key={index} className="border-b">
                          <td className="p-2">{nutrient.day}</td>
                          <td className="p-2">{nutrient.nutrientType}</td>
                          <td className="p-2">{nutrient.concentration} EC</td>
                          <td className="p-2">{nutrient.ph}</td>
                          <td className="p-2">{nutrient.ec}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>

              <TabsContent value="settings" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Created by</Label>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      {selectedRecipe.creator}
                    </div>
                  </div>
                  <div>
                    <Label>Created on</Label>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      {selectedRecipe.createdAt.toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <Label>Last updated</Label>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      {selectedRecipe.updatedAt.toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <Label>Usage count</Label>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      {selectedRecipe.usageCount} times
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <FarmControlButton variant="default" className="gap-2">
                    <Copy className="w-4 h-4" />
                    Clone Recipe
                  </FarmControlButton>
                  <FarmControlButton variant="default" className="gap-2">
                    <Edit className="w-4 h-4" />
                    Edit Recipe
                  </FarmControlButton>
                  <FarmControlButton variant="maintenance" className="gap-2">
                    <Trash2 className="w-4 h-4" />
                    Delete Recipe
                  </FarmControlButton>
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
