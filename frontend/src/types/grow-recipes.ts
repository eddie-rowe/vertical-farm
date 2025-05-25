export type UUID = string;

// Type definitions for grow recipes and species

export interface Species {
  id: UUID;
  name: string;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface GrowRecipe {
  id: UUID;
  species_id: UUID;
  name: string;
  
  // Basic grow parameters
  grow_days?: number | null;
  light_hours_per_day?: number | null;
  watering_frequency_hours?: number | null;
  
  // Environmental parameters
  target_temperature_min?: number | null;
  target_temperature_max?: number | null;
  target_humidity_min?: number | null;
  target_humidity_max?: number | null;
  target_ph_min?: number | null;
  target_ph_max?: number | null;
  target_ec_min?: number | null;
  target_ec_max?: number | null;
  
  // Yield and seeding
  average_yield?: number | null; // maps to avg_tray_yield
  sowing_rate?: number | null; // maps to seed_density_dry
  
  // New grow recipe parameters
  recipe_source?: string | null;
  germination_days?: number | null;
  light_days?: number | null;
  total_grow_days?: number | null;
  top_coat?: string | null;
  pythium_risk?: 'Low' | 'Medium' | 'High' | null;
  water_intake?: number | null; // ml per tray per watering session
  water_frequency?: string | null; // descriptive frequency
  lighting?: LightingSchedule | null; // JSONB field
  fridge_storage_temp?: number | null; // degrees Celsius
  difficulty?: 'Easy' | 'Medium' | 'Hard' | null;
  
  // Metadata
  custom_parameters?: Record<string, any> | null;
  created_at?: string;
  updated_at?: string;
  
  // Populated relationship
  species?: Species;
}

// Interface for the complex lighting schedule stored in JSONB
export interface LightingSchedule {
  photoperiod?: {
    light_hours: number;
    dark_hours: number;
  };
  intensity?: {
    ppfd?: number; // Photosynthetic Photon Flux Density
    percentage?: number; // Percentage of max light
  };
  spectrum?: {
    red?: number;
    blue?: number;
    white?: number;
    far_red?: number;
  };
  phases?: Array<{
    phase_name: string;
    start_day: number;
    end_day: number;
    light_hours: number;
    intensity_percentage: number;
  }>;
}

// Types for form input and API operations
export interface CreateGrowRecipeInput {
  species_id: UUID;
  name: string;
  grow_days?: number;
  light_hours_per_day?: number;
  watering_frequency_hours?: number;
  target_temperature_min?: number;
  target_temperature_max?: number;
  target_humidity_min?: number;
  target_humidity_max?: number;
  target_ph_min?: number;
  target_ph_max?: number;
  target_ec_min?: number;
  target_ec_max?: number;
  average_yield?: number;
  sowing_rate?: number;
  recipe_source?: string;
  germination_days?: number;
  light_days?: number;
  total_grow_days?: number;
  top_coat?: string;
  pythium_risk?: 'Low' | 'Medium' | 'High';
  water_intake?: number;
  water_frequency?: string;
  lighting?: LightingSchedule;
  fridge_storage_temp?: number;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  custom_parameters?: Record<string, any>;
}

export interface UpdateGrowRecipeInput extends Partial<CreateGrowRecipeInput> {
  id: UUID;
}

export interface CreateSpeciesInput {
  name: string;
  description?: string;
}

export interface UpdateSpeciesInput extends Partial<CreateSpeciesInput> {
  id: UUID;
}

// Types for filtering and searching
export interface GrowRecipeFilters {
  species_id?: UUID;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  pythium_risk?: 'Low' | 'Medium' | 'High';
  min_grow_days?: number;
  max_grow_days?: number;
  search?: string; // for searching by name or description
}

// Response types for paginated data
export interface PaginatedGrowRecipes {
  recipes: GrowRecipe[];
  total: number;
  page: number;
  limit: number;
  has_next: boolean;
  has_prev: boolean;
} 