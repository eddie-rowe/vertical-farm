"use client";

import { Plus, Download, Upload } from "lucide-react";
import { useState, useEffect, useCallback, useMemo } from "react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FarmSearchAndFilter } from "@/components/ui/farm-search-and-filter";
import type { FilterDefinition } from "@/components/ui/farm-search-and-filter";
import { useFarmSearch, useFarmFilters } from "@/hooks";
import {
  getGrowRecipes,
  getSpecies,
  deleteGrowRecipe,
} from "@/services/growRecipeService";
import { GrowRecipe, Species } from "@/types/grow-recipes";

import {
  GrowRecipeForm,
  EnhancedGrowRecipeCard,
  DeleteConfirmationDialog,
  RecipeStatsDashboard,
  EnhancedEmptyState,
} from "../grow-recipes";

export default function GrowParametersView() {
  const [recipes, setRecipes] = useState<GrowRecipe[]>([]);
  const [species, setSpecies] = useState<Species[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<GrowRecipe | null>(null);
  const [deletingRecipe, setDeletingRecipe] = useState<GrowRecipe | null>(null);

  // Standardized search and filter hooks
  const {
    searchTerm,
    setSearchTerm,
    clearSearch,
    hasSearch,
    filterItems: searchFilterItems,
  } = useFarmSearch<GrowRecipe>({
    searchFields: ["name", "recipe_source"],
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
  } = useFarmFilters<GrowRecipe>();

  // Filter definitions for FarmSearchAndFilter
  const filterDefinitions: FilterDefinition[] = useMemo(
    () => [
      {
        id: "species_id",
        label: "Species",
        placeholder: "Filter by species",
        options: [
          { value: "all", label: "All Species" },
          ...species.map((s) => ({
            value: s.id,
            label: s.name,
          })),
        ],
        defaultValue: "all",
      },
      {
        id: "difficulty",
        label: "Difficulty Level",
        placeholder: "Filter by difficulty",
        options: [
          { value: "all", label: "All Levels" },
          { value: "Easy", label: "Easy" },
          { value: "Medium", label: "Medium" },
          { value: "Hard", label: "Hard" },
        ],
        defaultValue: "all",
      },
      {
        id: "pythium_risk",
        label: "Risk Level",
        placeholder: "Filter by risk",
        options: [
          { value: "all", label: "All Risks" },
          { value: "Low", label: "Low" },
          { value: "Medium", label: "Medium" },
          { value: "High", label: "High" },
        ],
        defaultValue: "all",
      },
    ],
    [species],
  );

  // Handle filter changes
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

  const loadData = async () => {
    try {
      setLoading(true);
      const [recipesData, speciesData] = await Promise.all([
        getGrowRecipes(1, 100), // Get first 100 recipes for the initial load
        getSpecies(),
      ]);
      setRecipes(recipesData.recipes);
      setSpecies(speciesData);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load grow parameters data");
    } finally {
      setLoading(false);
    }
  };

  const loadRecipes = useCallback(async () => {
    try {
      // Get first 100 recipes and apply filtering client-side for better UX
      const recipesData = await getGrowRecipes(1, 100);
      setRecipes(recipesData.recipes);
    } catch (error) {
      console.error("Error loading recipes:", error);
      toast.error("Failed to load recipes");
    }
  }, []);

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  // Filter recipes when search term or filters change
  useEffect(() => {
    loadRecipes();
  }, [loadRecipes]);

  const handleCreateRecipe = () => {
    setEditingRecipe(null);
    setShowCreateDialog(true);
  };

  const handleEditRecipe = (recipe: GrowRecipe) => {
    setEditingRecipe(recipe);
    setShowCreateDialog(true);
  };

  const handleDeleteRecipe = (recipe: GrowRecipe) => {
    setDeletingRecipe(recipe);
  };

  const handleCloneRecipe = (recipe: GrowRecipe) => {
    // Create a clone without the id
    const clonedRecipe = {
      ...recipe,
      name: `${recipe.name} (Copy)`,
      // Remove id to create new recipe
      id: undefined as any,
    };
    setEditingRecipe(clonedRecipe);
    setShowCreateDialog(true);
  };

  const handlePreviewRecipe = (recipe: GrowRecipe) => {
    // TODO: Implement recipe preview modal
    toast("Recipe preview coming soon!");
  };

  const handleStartGrow = (recipe: GrowRecipe) => {
    // TODO: Navigate to new grow setup with this recipe pre-selected
    toast("Starting new grow coming soon!");
  };

  const handleUseTemplate = (templateId: string) => {
    // TODO: Create recipe from template
    toast(`Creating recipe from template: ${templateId}`);
    setShowCreateDialog(true);
  };

  const handleImport = () => {
    // TODO: Implement import functionality
    toast("Import functionality coming soon!");
  };

  const confirmDeleteRecipe = async () => {
    if (!deletingRecipe) return;

    try {
      await deleteGrowRecipe(deletingRecipe.id);
      toast.success("Recipe deleted successfully");
      setDeletingRecipe(null);
      loadRecipes();
    } catch (error) {
      console.error("Error deleting recipe:", error);
      toast.error("Failed to delete recipe");
    }
  };

  const handleFormSuccess = () => {
    setShowCreateDialog(false);
    setEditingRecipe(null);
    loadRecipes();
  };

  // Apply combined filtering using standardized hooks
  const filteredRecipes = useMemo(() => {
    let result = recipes;

    // Apply search filtering
    result = searchFilterItems(result);

    // Apply standard filters
    result = filterFilterItems(result);

    // Add species data for display
    result = result.map((recipe) => ({
      ...recipe,
      species: species.find((s) => s.id === recipe.species_id),
    }));

    return result;
  }, [recipes, searchFilterItems, filterFilterItems, species]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading grow parameters...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Grow Parameters & Recipes</h2>
          <p className="text-muted-foreground mt-1">
            Manage grow recipes for different species with detailed parameters
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={handleImport}>
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button onClick={handleCreateRecipe}>
                <Plus className="h-4 w-4 mr-2" />
                Add Recipe
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingRecipe
                    ? "Edit Grow Recipe"
                    : "Create New Grow Recipe"}
                </DialogTitle>
                <DialogDescription>
                  {editingRecipe
                    ? "Update the grow recipe parameters below."
                    : "Fill in the parameters for your new grow recipe."}
                </DialogDescription>
              </DialogHeader>
              <GrowRecipeForm
                recipe={editingRecipe}
                species={species}
                onSuccess={handleFormSuccess}
                onCancel={() => setShowCreateDialog(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Dashboard - Only show when there are recipes */}
      {recipes.length > 0 && (
        <RecipeStatsDashboard recipes={recipes} isLoading={loading} />
      )}

      {/* Search and Filters */}
      {recipes.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            {/* Standardized Search and Filter Component */}
            <FarmSearchAndFilter
              searchValue={searchTerm}
              onSearchChange={setSearchTerm}
              searchContext="recipes by name, species, or source"
              searchPlaceholder="Search recipes by name, species, or source..."
              filters={filterDefinitions}
              activeFilters={getActiveFilterChips(filterDefinitions)}
              onFilterChange={handleFilterChange}
              onRemoveFilter={handleRemoveFilter}
              onClearAllFilters={clearAllFilters}
              orientation="horizontal"
              showFilterChips={true}
            />
          </CardContent>
        </Card>
      )}

      {/* Results Summary */}
      {recipes.length > 0 && (
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            {filteredRecipes.length} of {recipes.length} recipe
            {recipes.length !== 1 ? "s" : ""} shown
          </p>
          {(hasSearch || hasActiveFilters) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                clearSearch();
                clearAllFilters();
              }}
            >
              Clear all filters
            </Button>
          )}
        </div>
      )}

      {/* Recipe Grid or Empty State */}
      {filteredRecipes.length === 0 && recipes.length === 0 ? (
        <EnhancedEmptyState
          onCreateNew={handleCreateRecipe}
          onImport={handleImport}
          onUseTemplate={handleUseTemplate}
        />
      ) : filteredRecipes.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                No recipes match your search criteria
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  clearSearch();
                  clearAllFilters();
                }}
              >
                Clear filters
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecipes.map((recipe) => (
            <EnhancedGrowRecipeCard
              key={recipe.id}
              recipe={recipe}
              onEdit={handleEditRecipe}
              onDelete={handleDeleteRecipe}
              onClone={handleCloneRecipe}
              onPreview={handlePreviewRecipe}
              onStartGrow={handleStartGrow}
              isActive={Math.random() > 0.8} // Mock active state
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        recipe={deletingRecipe}
        onConfirm={confirmDeleteRecipe}
        onCancel={() => setDeletingRecipe(null)}
      />
    </div>
  );
}
