export type UUID = string; // Using string for UUIDs on the frontend for simplicity

// Area types for different farm sections
export type AreaType = 'grow_area' | 'germination_tent';

// Germination-specific operational data
export interface GerminationData {
  seed_type?: string;
  variety?: string;
  planting_date?: string;
  expected_germination_days?: number;
  germination_rate?: number; // Percentage 0-100
  transplant_ready_date?: string;
  is_transplant_ready?: boolean;
  notes?: string;
}

// Enums that might be used (if not directly mapping to string literals)
// export type SensorType = 'temperature' | 'humidity' | 'co2' | 'ph' | 'ec' | 'water_level' | 'light_intensity' | 'air_flow' | 'soil_moisture';
// export type ParentType = 'shelf' | 'rack' | 'row' | 'farm';

// Enhanced sensor device with area type context
export interface SensorDevice {
  id: UUID;
  name?: string;
  model_number?: string | null;
  sensor_type: 'temperature' | 'humidity' | 'co2' | 'ph' | 'ec' | 'water_level' | 'light_intensity' | 'air_flow' | 'soil_moisture';
  measurement_unit?: string | null;
  data_range_min?: number | null;
  data_range_max?: number | null;
  accuracy?: string | null;
  parent_type: 'shelf' | 'rack' | 'row' | 'farm';
  parent_id: UUID;
  created_at?: string | null; 
  updated_at?: string | null; 
}

// Enhanced shelf with area type context and operational data
export interface Shelf {
  id: UUID;
  name?: string;
  rack_id: UUID;
  devices?: SensorDevice[]; 
  // Operational data based on area type
  germination_data?: GerminationData;
  created_at?: string | null; 
  updated_at?: string | null; 
}

// Enhanced rack with area type context
export interface Rack {
  id: UUID;
  name?: string;
  row_id: UUID;
  shelves?: Shelf[]; 
  created_at?: string | null; 
  updated_at?: string | null; 
}

// Enhanced row with area type context
export interface Row {
  id: UUID;
  name?: string;
  farm_id: UUID;
  orientation: 'horizontal' | 'vertical';
  area_type: AreaType; // New field to distinguish grow areas from germination tents
  racks?: Rack[]; 
  created_at?: string | null; 
  updated_at?: string | null; 
}

// Farm remains largely the same but now contains both area types
export interface Farm {
  id: UUID;
  name: string;
  user_id?: UUID | null; // Farm user ID (changed from manager_id) - optional to match Supabase type
  location?: string | null;
  farm_image_url?: string | null; // Fixed: Changed from plan_image_url to match database schema
  rows?: Row[];
  created_at?: string; // Align with Supabase type
  updated_at?: string; // Align with Supabase type
}

// Type for the combined farm data structure often used in the frontend
// This will represent the main data object passed to UnifiedFarmView
export interface FarmPageData {
  farm: Farm;
}

// Helper types for filtering by area type
export interface FarmAreaData {
  growAreas: Row[];
  germinationTents: Row[];
}

// Germination management specific types
export interface GerminationSummary {
  total_seeds: number;
  germinated: number;
  ready_for_transplant: number;
  average_germination_time: number;
}

export interface TransplantCandidate {
  shelf_id: UUID;
  shelf_name?: string;
  row_name?: string;
  rack_name?: string;
  germination_data: GerminationData;
  days_since_planting: number;
}
