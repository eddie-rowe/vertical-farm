export type UUID = string; // Using string for UUIDs on the frontend for simplicity

// Enums that might be used (if not directly mapping to string literals)
// export type SensorType = 'temperature' | 'humidity' | 'co2' | 'ph' | 'ec' | 'water_level' | 'light_intensity' | 'air_flow' | 'soil_moisture';
// export type ParentType = 'shelf' | 'rack' | 'row' | 'farm';

export interface SensorDevice {
  id: UUID;
  name: string;
  model_number?: string | null;
  sensor_type: 'temperature' | 'humidity' | 'co2' | 'ph' | 'ec' | 'water_level' | 'light_intensity' | 'air_flow' | 'soil_moisture';
  measurement_unit?: string | null;
  data_range_min?: number | null;
  data_range_max?: number | null;
  accuracy?: string | null;
  parent_type: 'shelf' | 'rack' | 'row' | 'farm';
  parent_id: UUID;
  position_x?: number | null;
  position_y?: number | null;
  position_z?: number | null;
  created_at?: string | null; 
  updated_at?: string | null; 
}

export interface Shelf {
  id: UUID;
  name: string;
  rack_id: UUID;
  position_in_rack?: number;
  width?: number;
  depth?: number;
  max_weight?: number | null;
  devices?: SensorDevice[]; 
  created_at?: string | null; 
  updated_at?: string | null; 
}

export interface Rack {
  id: UUID;
  name: string;
  row_id: UUID;
  position_in_row?: number;
  width?: number;
  depth?: number;
  height?: number;
  max_shelves?: number | null;
  shelves?: Shelf[]; 
  created_at?: string | null; 
  updated_at?: string | null; 
}

export interface Row {
  id: UUID;
  name: string;
  farm_id: UUID;
  position_x?: number;
  position_y?: number;
  length?: number;
  orientation: 'horizontal' | 'vertical';
  racks?: Rack[]; 
  created_at?: string | null; 
  updated_at?: string | null; 
}

export interface Farm {
  id: UUID;
  name: string;
  owner_id: UUID; // Assuming owner_id comes from FarmInDBBase
  location?: string | null;
  plan_image_url?: string | null;
  width?: number | null;
  depth?: number | null;
  rows?: Row[];
  created_at?: string | null; 
  updated_at?: string | null; 
}

// Type for the combined farm data structure often used in the frontend
// This will represent the main data object passed to TopDownFarmView
export interface FarmPageData {
  farm: Farm;
  // rows are nested under farm.farmData.rows, etc.
}
