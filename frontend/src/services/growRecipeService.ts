'use client';
import { supabase } from '../supabaseClient';
import apiClient from '../lib/apiClient';
import {
  GrowRecipe,
  Species,
  CreateGrowRecipeInput,
  UpdateGrowRecipeInput,
  CreateSpeciesInput,
  UpdateSpeciesInput,
  GrowRecipeFilters,
  PaginatedGrowRecipes
} from '../types/grow-recipes';

// Species Service Functions

/**
 * Fetches all species.
 * Uses Supabase direct query for simple read operations.
 */
export const getSpecies = async (): Promise<Species[]> => {
  const { data, error } = await supabase
    .from('species')
    .select('*')
    .order('name');
  
  if (error) {
    console.error('Error fetching species:', error);
    throw error;
  }
  return data || [];
};

/**
 * Fetches a single species by ID.
 */
export const getSpeciesById = async (id: string): Promise<Species | null> => {
  const { data, error } = await supabase
    .from('species')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error(`Error fetching species ${id}:`, error);
    throw error;
  }
  return data;
};

/**
 * Creates a new species.
 */
export const createSpecies = async (speciesData: CreateSpeciesInput): Promise<Species | null> => {
  try {
    return await apiClient<Species>(`/api/v1/species/`, {
      method: 'POST',
      body: JSON.stringify(speciesData),
    });
  } catch (error) {
    console.error('Error creating species:', error);
    throw error;
  }
};

/**
 * Updates an existing species.
 */
export const updateSpecies = async (id: string, speciesData: Partial<CreateSpeciesInput>): Promise<Species | null> => {
  try {
    return await apiClient<Species>(`/api/v1/species/${id}`, {
      method: 'PUT',
      body: JSON.stringify(speciesData),
    });
  } catch (error) {
    console.error(`Error updating species ${id}:`, error);
    throw error;
  }
};

/**
 * Deletes a species by ID.
 */
export const deleteSpecies = async (id: string): Promise<void> => {
  try {
    await apiClient<void>(`/api/v1/species/${id}`, {
      method: 'DELETE',
    });
  } catch (error) {
    console.error(`Error deleting species ${id}:`, error);
    throw error;
  }
};

// Grow Recipe Service Functions

/**
 * Fetches all grow recipes with optional filtering.
 * Uses Supabase with joins to include species data.
 */
export const getGrowRecipes = async (filters?: GrowRecipeFilters): Promise<GrowRecipe[]> => {
  let query = supabase
    .from('grow_recipes')
    .select(`
      *,
      species (
        id,
        name,
        description
      )
    `)
    .order('name');

  // Apply filters if provided
  if (filters) {
    if (filters.species_id) {
      query = query.eq('species_id', filters.species_id);
    }
    if (filters.difficulty) {
      query = query.eq('difficulty', filters.difficulty);
    }
    if (filters.pythium_risk) {
      query = query.eq('pythium_risk', filters.pythium_risk);
    }
    if (filters.min_grow_days) {
      query = query.gte('total_grow_days', filters.min_grow_days);
    }
    if (filters.max_grow_days) {
      query = query.lte('total_grow_days', filters.max_grow_days);
    }
    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,species.name.ilike.%${filters.search}%`);
    }
  }

  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching grow recipes:', error);
    throw error;
  }
  return data || [];
};

/**
 * Fetches paginated grow recipes with optional filtering.
 */
export const getGrowRecipesPaginated = async (
  page: number = 1,
  limit: number = 20,
  filters?: GrowRecipeFilters
): Promise<PaginatedGrowRecipes> => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(filters && Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v !== undefined && v !== null && v !== '')
      ))
    });

    return await apiClient<PaginatedGrowRecipes>(`/api/v1/grow-recipes/?${params}`, {
      method: 'GET',
    });
  } catch (error) {
    console.error('Error fetching paginated grow recipes:', error);
    throw error;
  }
};

/**
 * Fetches a single grow recipe by ID.
 */
export const getGrowRecipeById = async (id: string): Promise<GrowRecipe | null> => {
  const { data, error } = await supabase
    .from('grow_recipes')
    .select(`
      *,
      species (
        id,
        name,
        description
      )
    `)
    .eq('id', id)
    .single();
  
  if (error) {
    console.error(`Error fetching grow recipe ${id}:`, error);
    throw error;
  }
  return data;
};

/**
 * Creates a new grow recipe.
 */
export const createGrowRecipe = async (recipeData: CreateGrowRecipeInput): Promise<GrowRecipe | null> => {
  try {
    return await apiClient<GrowRecipe>(`/api/v1/grow-recipes/`, {
      method: 'POST',
      body: JSON.stringify(recipeData),
    });
  } catch (error) {
    console.error('Error creating grow recipe:', error);
    throw error;
  }
};

/**
 * Updates an existing grow recipe.
 */
export const updateGrowRecipe = async (id: string, recipeData: Partial<CreateGrowRecipeInput>): Promise<GrowRecipe | null> => {
  try {
    return await apiClient<GrowRecipe>(`/api/v1/grow-recipes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(recipeData),
    });
  } catch (error) {
    console.error(`Error updating grow recipe ${id}:`, error);
    throw error;
  }
};

/**
 * Deletes a grow recipe by ID.
 */
export const deleteGrowRecipe = async (id: string): Promise<void> => {
  try {
    await apiClient<void>(`/api/v1/grow-recipes/${id}`, {
      method: 'DELETE',
    });
  } catch (error) {
    console.error(`Error deleting grow recipe ${id}:`, error);
    throw error;
  }
};

/**
 * Duplicates an existing grow recipe with a new name.
 */
export const duplicateGrowRecipe = async (id: string, newName: string): Promise<GrowRecipe | null> => {
  try {
    return await apiClient<GrowRecipe>(`/api/v1/grow-recipes/${id}/duplicate`, {
      method: 'POST',
      body: JSON.stringify({ name: newName }),
    });
  } catch (error) {
    console.error(`Error duplicating grow recipe ${id}:`, error);
    throw error;
  }
};

/**
 * Fetches grow recipes suitable for a specific shelf/growing environment.
 * This could include compatibility checks based on environmental constraints.
 */
export const getCompatibleGrowRecipes = async (shelfId: string): Promise<GrowRecipe[]> => {
  try {
    return await apiClient<GrowRecipe[]>(`/api/v1/grow-recipes/compatible/${shelfId}`, {
      method: 'GET',
    });
  } catch (error) {
    console.error(`Error fetching compatible grow recipes for shelf ${shelfId}:`, error);
    throw error;
  }
}; 