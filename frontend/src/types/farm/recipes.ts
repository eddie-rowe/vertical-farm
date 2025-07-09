/**
 * Grow recipes and species types
 * Defines plant species and their growing requirements/recipes
 */

import { UUID, BaseEntity, NamedEntity, PaginatedResponse, Priority } from '../common';

/** Risk levels for pythium (root rot) */
export type PythiumRisk = 'Low' | 'Medium' | 'High';

/** Difficulty levels for growing */
export type GrowDifficulty = 'Easy' | 'Medium' | 'Hard';

/**
 * Plant species definition
 * Represents different types of plants that can be grown
 */
export interface Species extends Omit<NamedEntity, 'description'> {
  /** Optional detailed description of the species */
  description?: string | null;
  /** Scientific name of the species */
  scientific_name?: string;
  /** Common category (e.g., 'leafy_greens', 'herbs', 'microgreens') */
  category?: string;
  /** Whether this species is currently active for growing */
  is_active?: boolean;
}

/**
 * Lighting spectrum configuration
 * Defines light spectrum ratios for optimal plant growth
 */
export interface LightSpectrum {
  /** Red light percentage (0-100) */
  red?: number;
  /** Blue light percentage (0-100) */
  blue?: number;
  /** White light percentage (0-100) */
  white?: number;
  /** Far red light percentage (0-100) */
  far_red?: number;
}

/**
 * Lighting intensity settings
 * Defines how bright the lights should be
 */
export interface LightIntensity {
  /** Photosynthetic Photon Flux Density (μmol/m²/s) */
  ppfd?: number;
  /** Percentage of maximum light output (0-100) */
  percentage?: number;
}

/**
 * Photoperiod configuration
 * Defines light/dark cycle timing
 */
export interface Photoperiod {
  /** Hours of light per day */
  light_hours: number;
  /** Hours of darkness per day */
  dark_hours: number;
}

/**
 * Growth phase lighting configuration
 * Defines different lighting requirements for growth phases
 */
export interface LightingPhase {
  /** Name of the growth phase */
  phase_name: string;
  /** Day when this phase starts */
  start_day: number;
  /** Day when this phase ends */
  end_day: number;
  /** Hours of light per day for this phase */
  light_hours: number;
  /** Light intensity percentage for this phase */
  intensity_percentage: number;
  /** Optional spectrum configuration for this phase */
  spectrum?: LightSpectrum;
}

/**
 * Complete lighting schedule configuration
 * Stored as JSONB in the database
 */
export interface LightingSchedule {
  /** Default photoperiod settings */
  photoperiod?: Photoperiod;
  /** Default light intensity settings */
  intensity?: LightIntensity;
  /** Default spectrum configuration */
  spectrum?: LightSpectrum;
  /** Phase-specific lighting configurations */
  phases?: LightingPhase[];
}

/**
 * Environmental parameter range
 * Defines min/max values for environmental conditions
 */
export interface EnvironmentalRange {
  /** Minimum acceptable value */
  min?: number | null;
  /** Maximum acceptable value */
  max?: number | null;
  /** Optimal target value */
  target?: number | null;
  /** Unit of measurement */
  unit?: string;
}

/**
 * Complete grow recipe definition
 * Contains all parameters needed to successfully grow a plant species
 */
export interface GrowRecipe extends BaseEntity {
  /** ID of the species this recipe is for */
  species_id: UUID;
  /** Human-readable name for this recipe */
  name: string;
  
  // Basic growth parameters
  /** Total days from seed to harvest */
  grow_days?: number | null;
  /** Default hours of light per day */
  light_hours_per_day?: number | null;
  /** How often to water (in hours) */
  watering_frequency_hours?: number | null;
  
  // Environmental parameters
  /** Target temperature range (°C) */
  target_temperature_min?: number | null;
  target_temperature_max?: number | null;
  /** Target humidity range (%) */
  target_humidity_min?: number | null;
  target_humidity_max?: number | null;
  /** Target pH range */
  target_ph_min?: number | null;
  target_ph_max?: number | null;
  /** Target electrical conductivity range (mS/cm) */
  target_ec_min?: number | null;
  target_ec_max?: number | null;
  
  // Yield and seeding parameters
  /** Average yield per tray/unit */
  average_yield?: number | null;
  /** Seed density for sowing */
  sowing_rate?: number | null;
  
  // Advanced parameters
  /** Source or reference for this recipe */
  recipe_source?: string | null;
  /** Days required for germination */
  germination_days?: number | null;
  /** Days under artificial lighting */
  light_days?: number | null;
  /** Total days including all phases */
  total_grow_days?: number | null;
  /** Top coating material (e.g., vermiculite) */
  top_coat?: string | null;
  /** Risk level for pythium (root rot) */
  pythium_risk?: PythiumRisk | null;
  /** Water amount per watering session (ml) */
  water_intake?: number | null;
  /** Descriptive watering frequency */
  water_frequency?: string | null;
  /** Complex lighting schedule configuration */
  lighting?: LightingSchedule | null;
  /** Storage temperature for harvested produce (°C) */
  fridge_storage_temp?: number | null;
  /** Difficulty level for growing this recipe */
  difficulty?: GrowDifficulty | null;
  
  // Metadata
  /** Custom parameters for specialized requirements */
  custom_parameters?: Record<string, unknown> | null;
  /** Associated species information */
  species?: Species;
  /** Recipe priority/preference */
  priority?: Priority;
  /** Whether this recipe is currently active */
  is_active?: boolean;
}

/**
 * Input type for creating new grow recipes
 * Subset of GrowRecipe fields required for creation
 */
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
  pythium_risk?: PythiumRisk;
  water_intake?: number;
  water_frequency?: string;
  lighting?: LightingSchedule;
  fridge_storage_temp?: number;
  difficulty?: GrowDifficulty;
  custom_parameters?: Record<string, unknown>;
  priority?: Priority;
}

/**
 * Input type for updating grow recipes
 * Partial update with required ID
 */
export interface UpdateGrowRecipeInput extends Partial<CreateGrowRecipeInput> {
  id: UUID;
}

/**
 * Input type for creating new species
 */
export interface CreateSpeciesInput {
  name: string;
  description?: string;
  scientific_name?: string;
  category?: string;
}

/**
 * Input type for updating species
 */
export interface UpdateSpeciesInput extends Partial<CreateSpeciesInput> {
  id: UUID;
}

/**
 * Filter options for searching and filtering grow recipes
 */
export interface GrowRecipeFilters {
  /** Filter by species ID */
  species_id?: UUID;
  /** Filter by difficulty level */
  difficulty?: GrowDifficulty;
  /** Filter by pythium risk level */
  pythium_risk?: PythiumRisk;
  /** Filter by minimum grow days */
  min_grow_days?: number;
  /** Filter by maximum grow days */
  max_grow_days?: number;
  /** Filter by category */
  category?: string;
  /** Search term for name or description */
  search?: string;
  /** Filter by active status */
  is_active?: boolean;
  /** Filter by priority */
  priority?: Priority;
}

/**
 * Paginated response for grow recipes
 */
export interface PaginatedGrowRecipes extends PaginatedResponse<GrowRecipe> {
  /** Summary statistics for the filtered results */
  summary?: {
    total_species: number;
    avg_grow_days: number;
    difficulty_distribution: Record<GrowDifficulty, number>;
  };
}

/**
 * Recipe recommendation based on environmental conditions
 */
export interface RecipeRecommendation {
  /** The recommended recipe */
  recipe: GrowRecipe;
  /** Match score (0-100) */
  match_score: number;
  /** Reasons for recommendation */
  reasons: string[];
  /** Potential issues or warnings */
  warnings?: string[];
} 