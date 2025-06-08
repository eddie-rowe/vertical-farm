'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Download, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'react-hot-toast';
import { Label } from '@/components/ui/label';

import { GrowRecipe, Species, GrowRecipeFilters } from '@/types/grow-recipes';
import { getGrowRecipes, getSpecies, deleteGrowRecipe } from '@/services/growRecipeService';
import { GrowRecipeForm } from '@/components/grow-recipes/GrowRecipeForm';
import { GrowRecipeCard } from '@/components/grow-recipes/GrowRecipeCard';
import { DeleteConfirmationDialog } from '@/components/grow-recipes/DeleteConfirmationDialog';

export default function GrowParametersPage() {
  const [recipes, setRecipes] = useState<GrowRecipe[]>([]);
  const [species, setSpecies] = useState<Species[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<GrowRecipeFilters>({});
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<GrowRecipe | null>(null);
  const [deletingRecipe, setDeletingRecipe] = useState<GrowRecipe | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [recipesData, speciesData] = await Promise.all([
        getGrowRecipes(),
        getSpecies()
      ]);
      setRecipes(recipesData);
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
      const currentFilters: GrowRecipeFilters = {
        ...filters,
        search: searchTerm || undefined
      };
      const recipesData = await getGrowRecipes(currentFilters);
      setRecipes(recipesData);
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



  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading grow parameters...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Grow Parameters</h1>
          <p className="text-gray-600 mt-2">
            Manage grow recipes for different species with detailed parameters
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
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

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search recipes by name or species..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              <div>
                <Label htmlFor="species-filter">Species</Label>
                <Select value={filters.species_id || ''} onValueChange={(value) => setFilters({ ...filters, species_id: value || undefined })}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select species" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Species</SelectItem>
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
                <Select value={filters.difficulty || ''} onValueChange={(value) => setFilters({ ...filters, difficulty: (value === 'all' ? undefined : value) as 'Easy' | 'Medium' | 'Hard' | undefined })}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="Easy">Easy</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="risk-filter">Risk Level</Label>
                <Select value={filters.pythium_risk || ''} onValueChange={(value) => setFilters({ ...filters, pythium_risk: (value === 'all' ? undefined : value) as 'Low' | 'Medium' | 'High' | undefined })}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select risk level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Risks</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-gray-600">
          {recipes.length} recipe{recipes.length !== 1 ? 's' : ''} found
        </p>
        {(searchTerm || Object.keys(filters).some(key => filters[key as keyof GrowRecipeFilters])) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchTerm('');
              setFilters({});
            }}
          >
            Clear filters
          </Button>
        )}
      </div>

      {/* Recipe Grid */}
      {recipes.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No grow recipes found</p>
              <Button onClick={handleCreateRecipe}>
                <Plus className="h-4 w-4 mr-2" />
                Create your first recipe
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map((recipe) => (
            <GrowRecipeCard
              key={recipe.id}
              recipe={recipe}
              onEdit={handleEditRecipe}
              onDelete={handleDeleteRecipe}
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