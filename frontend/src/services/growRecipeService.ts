"use client";
import { supabase } from "@/lib/supabaseClient";
import { UUID } from "@/types/farm-layout";

import { Species, PaginatedGrowRecipes } from "../types/grow-recipes";

// =====================================================
// TYPES
// =====================================================

export interface CreateSpeciesData {
  name: string;
  scientific_name?: string;
  description?: string;
  optimal_temp_min?: number;
  optimal_temp_max?: number;
  optimal_humidity_min?: number;
  optimal_humidity_max?: number;
  growth_cycle_days?: number;
}

export interface GrowRecipe {
  id: UUID;
  name: string;
  description?: string;
  species_id: UUID;
  growth_stage: string;
  duration_days: number;
  light_hours_per_day?: number;
  water_frequency_hours?: number;
  nutrient_concentration?: number;
  ph_target?: number;
  ec_target?: number;
  created_at?: string;
  updated_at?: string;
  species?: Species;
}

export interface CreateGrowRecipeData {
  name: string;
  description?: string;
  species_id: UUID;
  growth_stage: string;
  duration_days: number;
  light_hours_per_day?: number;
  water_frequency_hours?: number;
  nutrient_concentration?: number;
  ph_target?: number;
  ec_target?: number;
}

export interface UpdateGrowRecipeData {
  name?: string;
  description?: string;
  species_id?: UUID;
  growth_stage?: string;
  duration_days?: number;
  light_hours_per_day?: number;
  water_frequency_hours?: number;
  nutrient_concentration?: number;
  ph_target?: number;
  ec_target?: number;
}

// =====================================================
// AUTHENTICATION HELPER
// =====================================================

const requireAuth = async () => {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error) throw error;
  if (!user) throw new Error("User not authenticated");
  return user;
};

// =====================================================
// SPECIES OPERATIONS
// =====================================================

/**
 * Create a new species
 * Replaces: POST /api/v1/species/
 */
export const createSpecies = async (
  speciesData: CreateSpeciesData,
): Promise<Species> => {
  await requireAuth();

  const { data, error } = await supabase
    .from("species")
    .insert([speciesData])
    .select()
    .single();

  if (error) {
    console.error("Error creating species:", error);
    throw error;
  }

  return data;
};

/**
 * Get all species
 * Replaces: GET /api/v1/species/
 */
export const getSpecies = async (): Promise<Species[]> => {
  await requireAuth();

  const { data, error } = await supabase
    .from("species")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching species:", error);
    throw error;
  }

  return data || [];
};

/**
 * Get a single species by ID
 * Replaces: GET /api/v1/species/{id}
 */
export const getSpeciesById = async (id: UUID): Promise<Species> => {
  await requireAuth();

  const { data, error } = await supabase
    .from("species")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error(`Error fetching species ${id}:`, error);
    throw error;
  }

  return data;
};

/**
 * Delete a species
 * Replaces: DELETE /api/v1/species/{id}
 */
export const deleteSpecies = async (id: UUID): Promise<void> => {
  await requireAuth();

  const { error } = await supabase.from("species").delete().eq("id", id);

  if (error) {
    console.error(`Error deleting species ${id}:`, error);
    throw error;
  }
};

// =====================================================
// GROW RECIPE OPERATIONS
// =====================================================

/**
 * Get grow recipes with pagination and filtering
 * Replaces: GET /api/v1/grow-recipes/
 */
export const getGrowRecipes = async (
  page: number = 1,
  size: number = 10,
  species?: string,
  growth_stage?: string,
): Promise<PaginatedGrowRecipes> => {
  await requireAuth();

  let query = supabase.from("grow_recipes").select(
    `
      *,
      species:species_id(*)
    `,
    { count: "exact" },
  );

  // Apply filters
  if (species) {
    query = query.ilike("species.name", `%${species}%`);
  }

  if (growth_stage) {
    query = query.eq("growth_stage", growth_stage);
  }

  // Apply pagination
  const offset = (page - 1) * size;
  query = query.range(offset, offset + size - 1);

  // Order by name
  query = query.order("name", { ascending: true });

  const { data, error, count } = await query;

  if (error) {
    console.error("Error fetching grow recipes:", error);
    throw error;
  }

  const total = count || 0;
  const pages = Math.ceil(total / size);

  return {
    recipes: data || [],
    total,
    page,
    limit: size,
    has_next: page < pages,
    has_prev: page > 1,
  };
};

/**
 * Create a new grow recipe
 * Replaces: POST /api/v1/grow-recipes/
 */
export const createGrowRecipe = async (
  recipeData: CreateGrowRecipeData,
): Promise<GrowRecipe> => {
  await requireAuth();

  const { data, error } = await supabase
    .from("grow_recipes")
    .insert([recipeData])
    .select(
      `
      *,
      species:species_id(*)
    `,
    )
    .single();

  if (error) {
    console.error("Error creating grow recipe:", error);
    throw error;
  }

  return data;
};

/**
 * Update an existing grow recipe
 * Replaces: PUT /api/v1/grow-recipes/{id}
 */
export const updateGrowRecipe = async (
  id: UUID,
  recipeData: UpdateGrowRecipeData,
): Promise<GrowRecipe> => {
  await requireAuth();

  const { data, error } = await supabase
    .from("grow_recipes")
    .update(recipeData)
    .eq("id", id)
    .select(
      `
      *,
      species:species_id(*)
    `,
    )
    .single();

  if (error) {
    console.error(`Error updating grow recipe ${id}:`, error);
    throw error;
  }

  return data;
};

/**
 * Delete a grow recipe
 * Replaces: DELETE /api/v1/grow-recipes/{id}
 */
export const deleteGrowRecipe = async (id: UUID): Promise<void> => {
  await requireAuth();

  const { error } = await supabase.from("grow_recipes").delete().eq("id", id);

  if (error) {
    console.error(`Error deleting grow recipe ${id}:`, error);
    throw error;
  }
};

/**
 * Duplicate a grow recipe
 * Replaces: POST /api/v1/grow-recipes/{id}/duplicate
 */
export const duplicateGrowRecipe = async (id: UUID): Promise<GrowRecipe> => {
  await requireAuth();

  // First, get the original recipe
  const { data: original, error: fetchError } = await supabase
    .from("grow_recipes")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError) {
    console.error(`Error fetching original recipe ${id}:`, fetchError);
    throw fetchError;
  }

  // Create a copy with modified name
  const {
    id: _originalId,
    created_at: _createdAt,
    updated_at: _updatedAt,
    ...recipeData
  } = original;
  const duplicatedData = {
    ...recipeData,
    name: `${original.name} (Copy)`,
  };

  const { data, error } = await supabase
    .from("grow_recipes")
    .insert([duplicatedData])
    .select(
      `
      *,
      species:species_id(*)
    `,
    )
    .single();

  if (error) {
    console.error(`Error duplicating grow recipe ${id}:`, error);
    throw error;
  }

  return data;
};

/**
 * Get compatible grow recipes for a shelf
 * Replaces: GET /api/v1/grow-recipes/compatible/{shelf_id}
 *
 * For now, returns all recipes. In the future, this could be enhanced
 * with shelf-specific compatibility logic.
 */
export const getCompatibleGrowRecipes = async (
  shelfId: UUID,
): Promise<GrowRecipe[]> => {
  await requireAuth();

  // For now, just return all recipes
  // In the future, this could include compatibility logic based on:
  // - Shelf dimensions vs recipe space requirements
  // - Environmental capabilities of the shelf location
  // - Equipment availability (lights, pumps, sensors)

  const { data, error } = await supabase
    .from("grow_recipes")
    .select(
      `
      *,
      species:species_id(*)
    `,
    )
    .order("name", { ascending: true });

  if (error) {
    console.error(
      `Error fetching compatible recipes for shelf ${shelfId}:`,
      error,
    );
    throw error;
  }

  return data || [];
};

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Get growth stages (static list for now)
 */
export const getGrowthStages = (): string[] => {
  return ["seedling", "vegetative", "flowering", "fruiting", "harvest"];
};

/**
 * Get recipe statistics
 */
export const getRecipeStatistics = async () => {
  await requireAuth();

  const { data: recipeCount, error: recipeError } = await supabase
    .from("grow_recipes")
    .select("*", { count: "exact", head: true });

  const { data: speciesCount, error: speciesError } = await supabase
    .from("species")
    .select("*", { count: "exact", head: true });

  if (recipeError || speciesError) {
    console.error(
      "Error fetching recipe statistics:",
      recipeError || speciesError,
    );
    throw recipeError || speciesError;
  }

  return {
    total_recipes: recipeCount || 0,
    total_species: speciesCount || 0,
  };
};

// =====================================================
// BACKWARDS COMPATIBILITY
// =====================================================

// Export aliases for any existing code that might use different names
export { getSpecies as getAllSpecies };
export { createGrowRecipe as addGrowRecipe };
export { deleteGrowRecipe as removeGrowRecipe };
