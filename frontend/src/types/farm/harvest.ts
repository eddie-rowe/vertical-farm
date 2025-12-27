/**
 * Harvest-related types
 * Types for tracking harvest operations, yield data, and analytics
 */

import type { UUID, BaseEntity } from "../common";

/** Valid yield units for harvest measurements */
export type YieldUnit = "grams" | "g" | "kilograms" | "kg" | "pounds" | "lbs" | "ounces" | "oz";

/**
 * Base harvest entity matching database schema
 */
export interface HarvestEntity extends BaseEntity {
  shelf_id: UUID;
  grow_id: UUID;
  yield_amount: number;
  yield_unit: YieldUnit;
  yield_grams?: number; // Generated column - auto-converted to grams
  harvest_date: string;
  quality_rating?: number; // 1-10 scale
  notes?: string;
  photo_urls?: string[];
  documentation_urls?: string[];
  created_by?: UUID;
}

/**
 * Input type for creating a new harvest
 */
export interface CreateHarvestInput {
  shelf_id: UUID;
  grow_id: UUID;
  yield_amount: number;
  yield_unit: YieldUnit;
  harvest_date?: string; // Defaults to now() in database
  quality_rating?: number;
  notes?: string;
  photo_urls?: string[];
  documentation_urls?: string[];
}

/**
 * Input type for updating an existing harvest
 */
export interface UpdateHarvestInput {
  id: UUID;
  yield_amount?: number;
  yield_unit?: YieldUnit;
  harvest_date?: string;
  quality_rating?: number;
  notes?: string;
  photo_urls?: string[];
  documentation_urls?: string[];
}

/**
 * Harvest entity with related grow and shelf details
 */
export interface HarvestWithDetails extends HarvestEntity {
  grow?: {
    id: UUID;
    name: string;
    status: string;
    start_date: string;
    estimated_harvest_date?: string;
    actual_harvest_date?: string;
    grow_recipe?: {
      id: UUID;
      name: string;
      species_id?: UUID;
      total_grow_days?: number;
      species?: {
        id: UUID;
        name: string;
      };
    };
  };
  shelf?: {
    id: UUID;
    name: string;
    rack_id: UUID;
    rack?: {
      id: UUID;
      name: string;
      row_id: UUID;
      row?: {
        id: UUID;
        name: string;
        farm_id: UUID;
        farm?: {
          id: UUID;
          name: string;
        };
      };
    };
  };
}

/**
 * Filter options for querying harvests
 */
export interface HarvestFilters {
  grow_id?: UUID;
  shelf_id?: UUID;
  farm_id?: UUID;
  harvest_date_from?: string;
  harvest_date_to?: string;
  min_quality?: number;
  max_quality?: number;
  min_yield?: number;
  created_by?: UUID;
  search?: string;
}

/**
 * Analytics summary for harvest data
 */
export interface HarvestAnalytics {
  total_harvests: number;
  total_yield_grams: number;
  average_quality: number;
  average_yield_grams: number;
  best_quality_harvest?: HarvestWithDetails;
  highest_yield_harvest?: HarvestWithDetails;
  harvests_by_month?: Record<string, number>;
  yield_by_species?: Record<string, number>;
}

/**
 * Dashboard summary for harvest overview
 */
export interface HarvestDashboardSummary {
  total_harvests: number;
  total_yield_grams: number;
  average_quality: number;
  recent_harvests: HarvestWithDetails[];
  harvests_this_month: number;
  yield_this_month_grams: number;
  quality_distribution: {
    excellent: number; // 9-10
    good: number; // 7-8
    average: number; // 5-6
    poor: number; // 1-4
  };
}

/**
 * Grow progress tracking data
 */
export interface GrowProgress {
  grow_id: UUID;
  grow_name: string;
  status: string;
  start_date: string;
  estimated_harvest_date?: string;
  days_elapsed: number;
  days_remaining?: number;
  progress_percentage: number;
  is_overdue: boolean;
  shelf_location?: string;
  species_name?: string;
}

/**
 * Harvest status for a specific shelf
 */
export interface ShelfHarvestStatus {
  shelf_id: UUID;
  shelf_name: string;
  current_grow?: {
    id: UUID;
    name: string;
    status: string;
    progress_percentage: number;
    estimated_harvest_date?: string;
  };
  last_harvest?: HarvestWithDetails;
  total_harvests: number;
  total_yield_grams: number;
  average_quality: number;
}

// ==================== Query Result Types ====================
// Used internally by HarvestService to replace `any` types

/**
 * Result type for grow queries with nested shelf/farm relationships
 */
export interface GrowQueryResult {
  id: string;
  name: string;
  status: string;
  start_date: string;
  estimated_harvest_date?: string;
  actual_harvest_date?: string;
  progress_percentage?: number;
  shelf?: {
    id?: string;
    name?: string;
    rack?: {
      row?: {
        farm_id?: string;
        farm?: {
          name?: string;
        };
      };
    };
  };
  grow_recipe?: {
    total_grow_days?: number;
    species?: {
      name?: string;
    };
  };
}

/**
 * Result type for harvest stats queries (yield and quality only)
 */
export interface HarvestStatsRow {
  yield_grams: number | null;
  quality_rating: number | null;
  harvest_date?: string;
}

/**
 * Result type for quality rating queries
 */
export interface QualityRatingRow {
  quality_rating: number;
}
