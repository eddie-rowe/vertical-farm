/**
 * Farm Compatibility Service
 * 
 * This service handles the transformation between Supabase types and existing
 * frontend types to ensure a smooth PostGREST migration without breaking
 * existing components.
 */

import {
  Farm as SupabaseFarm,
  FarmWithHierarchy as SupabaseFarmWithHierarchy,
  Row as SupabaseRow,
  Rack as SupabaseRack,
  Shelf as SupabaseShelf,
  CreateFarmData,
  getFarms as getSupabaseFarms,
  getFarmDetails as getSupabaseFarmDetails,
  createFarm as createSupabaseFarm
} from './supabaseService';

import {
  Farm as FrontendFarm,
  FarmPageData,
  Row as FrontendRow,
  Rack as FrontendRack,
  Shelf as FrontendShelf,
  UUID
} from '@/types/farm-layout';

// =====================================================
// TYPE TRANSFORMATIONS
// =====================================================

/**
 * Transform Supabase Shelf to Frontend Shelf
 */
const transformShelf = (supabaseShelf: SupabaseShelf): FrontendShelf => ({
  id: supabaseShelf.id,
  name: supabaseShelf.name,
  rack_id: supabaseShelf.rack_id,
  position_in_rack: supabaseShelf.position || 0,
  width: supabaseShelf.width || 100,
  depth: supabaseShelf.depth || 50,
  created_at: supabaseShelf.created_at,
  updated_at: supabaseShelf.updated_at
});

/**
 * Transform Supabase Rack to Frontend Rack
 */
const transformRack = (supabaseRack: SupabaseRack): FrontendRack => ({
  id: supabaseRack.id,
  name: supabaseRack.name,
  row_id: supabaseRack.row_id,
  position_in_row: supabaseRack.position || 0,
  width: 200, // Default width
  depth: 100, // Default depth
  height: 180, // Default height
  shelves: supabaseRack.shelves?.map(transformShelf) || [],
  created_at: supabaseRack.created_at,
  updated_at: supabaseRack.updated_at
});

/**
 * Transform Supabase Row to Frontend Row
 */
const transformRow = (supabaseRow: SupabaseRow): FrontendRow => ({
  id: supabaseRow.id,
  name: supabaseRow.name,
  farm_id: supabaseRow.farm_id,
  position_x: supabaseRow.position || 0,
  position_y: 0, // Default Y position
  length: 500, // Default length
  orientation: 'horizontal' as const,
  racks: supabaseRow.racks?.map(transformRack) || [],
  created_at: supabaseRow.created_at,
  updated_at: supabaseRow.updated_at
});

/**
 * Transform Supabase Farm to Frontend Farm
 */
const transformFarm = (supabaseFarm: SupabaseFarm): FrontendFarm => ({
  id: supabaseFarm.id,
  name: supabaseFarm.name,
  owner_id: supabaseFarm.manager_id || supabaseFarm.id,
  location: supabaseFarm.location,
  plan_image_url: supabaseFarm.plan_image_url,
  width: supabaseFarm.width,
  depth: supabaseFarm.depth,
  created_at: supabaseFarm.created_at,
  updated_at: supabaseFarm.updated_at
});

/**
 * Transform Supabase Farm with Hierarchy to Frontend FarmPageData
 */
const transformFarmWithHierarchy = (supabaseFarmWithHierarchy: SupabaseFarmWithHierarchy): FarmPageData => ({
  farm: {
    ...transformFarm(supabaseFarmWithHierarchy),
    rows: supabaseFarmWithHierarchy.rows?.map(transformRow) || []
  }
});

// =====================================================
// COMPATIBILITY API FUNCTIONS
// =====================================================

/**
 * Get farms list compatible with existing frontend expectations
 * Replaces: getFarmsList() from apiClient
 */
export const getFarmsList = async () => {
  const response = await getSupabaseFarms();
  return {
    farms: response.farms.map(farm => ({
      id: farm.id,
      name: farm.name
    })),
    total: response.total
  };
};

/**
 * Get farm details compatible with existing frontend expectations
 * Replaces: getFarmDetails() from apiClient
 */
export const getFarmDetails = async (farmId: UUID): Promise<FarmPageData> => {
  const supabaseFarmData = await getSupabaseFarmDetails(farmId);
  return transformFarmWithHierarchy(supabaseFarmData);
};

/**
 * Create farm compatible with existing frontend expectations
 * Replaces: createFarm() from apiClient
 */
export const createFarm = async (farmData: CreateFarmData): Promise<FrontendFarm> => {
  const supabaseFarm = await createSupabaseFarm(farmData);
  return transformFarm(supabaseFarm);
};

// =====================================================
// ADDITIONAL COMPATIBILITY TYPES
// =====================================================

export interface FarmBasicInfo {
  id: UUID;
  name: string;
}

export interface FarmBasicListResponse {
  farms: FarmBasicInfo[];
  total: number;
}

export type FarmResponse = FrontendFarm;

// =====================================================
// RE-EXPORTS FOR EASY MIGRATION
// =====================================================

// Export the same interface names that apiClient used
export type { CreateFarmData };
export { transformFarm, transformFarmWithHierarchy };

/**
 * Backwards compatibility wrapper
 * This allows existing code to work without changes
 */
export const farmCompatibilityService = {
  getFarmsList,
  getFarmDetails,
  createFarm,
  
  // Direct access to transformers for advanced use cases
  transforms: {
    farm: transformFarm,
    farmWithHierarchy: transformFarmWithHierarchy,
    row: transformRow,
    rack: transformRack,
    shelf: transformShelf
  }
}; 