'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Download, Upload, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import toast from 'react-hot-toast';
import { Label } from '@/components/ui/label';

import { GrowRecipe, Species, GrowRecipeFilters } from '@/types/grow-recipes';
import { getGrowRecipes, getSpecies, deleteGrowRecipe } from '@/services/growRecipeService';
import { 
  GrowRecipeForm, 
  GrowRecipeCard, 
  EnhancedGrowRecipeCard, 
  DeleteConfirmationDialog, 
  RecipeStatsDashboard, 
  EnhancedEmptyState 
} from '../grow-recipes';

export default function GrowParametersView() {
  const [recipes, setRecipes] = useState<GrowRecipe[]>([]);
  const [species, setSpecies] = useState<Species[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<GrowRecipeFilters>({});
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<GrowRecipe | null>(null);
  const [deletingRecipe, setDeletingRecipe] = useState<GrowRecipe | null>(null);
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [recipesData, speciesData] = await Promise.all([
        getGrowRecipes(1, 100), // Get first 100 recipes for the initial load
        getSpecies()
      ]);
      setRecipes(recipesData.recipes);
      setSpecies(speciesData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load grow parameters data');
    } finally {
      setLoading(false);
    }
  };

  const loadRecipes = useCallback(async () => {
    try {
      // Extract filter values that match the function signature
      const speciesFilter = filters.species_id === 'all' ? undefined : filters.species_id;
      const recipesData = await getGrowRecipes(1, 50, speciesFilter, filters.difficulty);
      setRecipes(recipesData.recipes);
    } catch (error) {
      console.error('Error loading recipes:', error);
      toast.error('Failed to load recipes');
    }
  }, [filters, searchTerm]);

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
      id: undefined as any
    };
    setEditingRecipe(clonedRecipe);
    setShowCreateDialog(true);
  };

  const handlePreviewRecipe = (recipe: GrowRecipe) => {
    // TODO: Implement recipe preview modal
    toast('Recipe preview coming soon!');
  };

  const handleStartGrow = (recipe: GrowRecipe) => {
    // TODO: Navigate to new grow setup with this recipe pre-selected
    toast('Starting new grow coming soon!');
  };

  const handleUseTemplate = (templateId: string) => {
    // TODO: Create recipe from template
    toast(`Creating recipe from template: ${templateId}`);
    setShowCreateDialog(true);
  };

  const handleImport = () => {
    // TODO: Implement import functionality
    toast('Import functionality coming soon!');
  };

  const confirmDeleteRecipe = async () => {
    if (!deletingRecipe) return;
    
    try {
      await deleteGrowRecipe(deletingRecipe.id);
      toast.success('Recipe deleted successfully');
      setDeletingRecipe(null);
      loadRecipes();
    } catch (error) {
      console.error('Error deleting recipe:', error);
      toast.error('Failed to delete recipe');
    }
  };

  const handleFormSuccess = () => {
    setShowCreateDialog(false);
    setEditingRecipe(null);
    loadRecipes();
  };

  // Filter recipes based on search term (client-side filtering for better UX)
  const filteredRecipes = recipes.filter(recipe => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      recipe.name.toLowerCase().includes(searchLower) ||
      recipe.species?.name.toLowerCase().includes(searchLower) ||
      recipe.recipe_source?.toLowerCase().includes(searchLower)
    );
  });

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
                  {editingRecipe ? 'Edit Grow Recipe' : 'Create New Grow Recipe'}
                </DialogTitle>
                <DialogDescription>
                  {editingRecipe 
                    ? 'Update the grow recipe parameters below.'
                    : 'Fill in the parameters for your new grow recipe.'
                  }
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
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search recipes by name, species, or source..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => setFiltersExpanded(!filtersExpanded)}
                  className={filtersExpanded ? 'bg-muted' : ''}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
              </div>

              {/* Expanded Filters */}
              {filtersExpanded && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div>
                    <Label htmlFor="species-filter">Species</Label>
                    <Select value={filters.species_id || ''} onValueChange={(value) => setFilters({ ...filters, species_id: value || undefined })}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="All species" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Species</SelectItem>
                        {species.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="difficulty-filter">Difficulty Level</Label>
                    <Select value={filters.difficulty || ''} onValueChange={(value) => setFilters({ ...filters, difficulty: (value === '' ? undefined : value) as 'Easy' | 'Medium' | 'Hard' | undefined })}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="All levels" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Levels</SelectItem>
                        <SelectItem value="Easy">Easy</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="Hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="risk-filter">Risk Level</Label>
                    <Select value={filters.pythium_risk || ''} onValueChange={(value) => setFilters({ ...filters, pythium_risk: (value === '' ? undefined : value) as 'Low' | 'Medium' | 'High' | undefined })}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="All risks" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Risks</SelectItem>
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Summary */}
      {recipes.length > 0 && (
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            {filteredRecipes.length} of {recipes.length} recipe{recipes.length !== 1 ? 's' : ''} shown
          </p>
          {(searchTerm || Object.keys(filters).some(key => filters[key as keyof GrowRecipeFilters])) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm('');
                setFilters({});
                setFiltersExpanded(false);
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
              <p className="text-muted-foreground mb-4">No recipes match your search criteria</p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setFilters({});
                  setFiltersExpanded(false);
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