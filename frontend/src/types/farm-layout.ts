export type UUID = string; // Using string for UUIDs on the frontend for simplicity

// Enums that might be used (if not directly mapping to string literals)
// export type SensorType = 'temperature' | 'humidity' | 'co2' | 'ph' | 'ec' | 'water_level' | 'light_intensity' | 'air_flow' | 'soil_moisture';
// export type ParentType = 'shelf' | 'rack' | 'row' | 'farm';

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

export interface Shelf {
  id: UUID;
  name?: string;
  rack_id: UUID;
  devices?: SensorDevice[]; 
  created_at?: string | null; 
  updated_at?: string | null; 
}

export interface Rack {
  id: UUID;
  name?: string;
  row_id: UUID;
  shelves?: Shelf[]; 
  created_at?: string | null; 
  updated_at?: string | null; 
}

export interface Row {
  id: UUID;
  name?: string;
  farm_id: UUID;
  orientation: 'horizontal' | 'vertical';
  racks?: Rack[]; 
  created_at?: string | null; 
  updated_at?: string | null; 
}

export interface Farm {
  id: UUID;
  name: string;
  user_id: UUID; // Farm user ID (changed from manager_id)
  location?: string | null;
  plan_image_url?: string | null;
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
