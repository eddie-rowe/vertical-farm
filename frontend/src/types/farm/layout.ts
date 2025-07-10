/**
 * Farm layout and structure types
 * Defines the hierarchical structure: Farm -> Row -> Rack -> Shelf
 */

import { UUID, BaseEntity, Coordinates, Dimensions } from '../common';

/** Area types for different farm sections */
export type AreaType = 'grow_area' | 'germination_tent';

/** Row orientation options */
export type RowOrientation = 'horizontal' | 'vertical';

/** Sensor types available in the system */
export type SensorType = 
  | 'temperature' 
  | 'humidity' 
  | 'co2' 
  | 'ph' 
  | 'ec' 
  | 'water_level' 
  | 'light_intensity' 
  | 'air_flow' 
  | 'soil_moisture';

/** Parent entity types for sensor assignments */
export type ParentType = 'shelf' | 'rack' | 'row' | 'farm';

/**
 * Germination-specific operational data
 * Tracks seed germination progress and transplant readiness
 */
export interface GerminationData {
  /** Type of seed being germinated */
  seed_type?: string;
  /** Specific variety of the seed */
  variety?: string;
  /** Date when seeds were planted (ISO string) */
  planting_date?: string;
  /** Expected number of days for germination */
  expected_germination_days?: number;
  /** Germination success rate as percentage (0-100) */
  germination_rate?: number;
  /** Calculated date when transplant will be ready (ISO string) */
  transplant_ready_date?: string;
  /** Whether seeds are ready for transplanting */
  is_transplant_ready?: boolean;
  /** Additional notes about germination process */
  notes?: string;
}

/**
 * Sensor device configuration and metadata
 * Represents physical sensors attached to farm entities
 */
export interface SensorDevice extends BaseEntity {
  /** Human-readable name for the sensor */
  name?: string;
  /** Manufacturer model number */
  model_number?: string | null;
  /** Type of measurement this sensor provides */
  sensor_type: SensorType;
  /** Unit of measurement (e.g., '°C', '%', 'ppm') */
  measurement_unit?: string | null;
  /** Minimum measurable value */
  data_range_min?: number | null;
  /** Maximum measurable value */
  data_range_max?: number | null;
  /** Sensor accuracy specification */
  accuracy?: string | null;
  /** Type of parent entity this sensor is attached to */
  parent_type: ParentType;
  /** ID of the parent entity */
  parent_id: UUID;
  /** Physical position of the sensor */
  position?: Coordinates;
}

/**
 * Individual growing shelf
 * Smallest unit in the farm hierarchy, contains actual growing space
 */
export interface Shelf extends BaseEntity {
  /** Human-readable name for the shelf */
  name?: string;
  /** ID of the rack this shelf belongs to */
  rack_id: UUID;
  /** Physical dimensions of the shelf */
  dimensions?: Dimensions;
  /** Position within the rack */
  position?: Coordinates;
  /** Sensors attached to this shelf */
  devices?: SensorDevice[];
  /** Germination-specific data (for germination area shelves) */
  germination_data?: GerminationData;
  /** Maximum plant capacity */
  capacity?: number;
  /** Current number of plants */
  current_plants?: number;
}

/**
 * Growing rack
 * Contains multiple shelves, typically represents a vertical growing unit
 */
export interface Rack extends BaseEntity {
  /** Human-readable name for the rack */
  name?: string;
  /** ID of the row this rack belongs to */
  row_id: UUID;
  /** Physical dimensions of the rack */
  dimensions?: Dimensions;
  /** Position within the row */
  position?: Coordinates;
  /** Shelves contained in this rack */
  shelves?: Shelf[];
  /** Maximum shelf capacity */
  max_shelves?: number;
}

/**
 * Growing row
 * Contains multiple racks, represents a linear arrangement of growing units
 */
export interface Row extends BaseEntity {
  /** Human-readable name for the row */
  name?: string;
  /** ID of the farm this row belongs to */
  farm_id: UUID;
  /** Physical orientation of the row */
  orientation: RowOrientation;
  /** Area type classification */
  area_type: AreaType;
  /** Physical dimensions of the row */
  dimensions?: Dimensions;
  /** Position within the farm */
  position?: Coordinates;
  /** Racks contained in this row */
  racks?: Rack[];
  /** Maximum rack capacity */
  max_racks?: number;
}

/**
 * Farm entity
 * Top-level container for all growing infrastructure
 */
export interface Farm extends BaseEntity {
  /** Farm name */
  name: string;
  /** ID of the user who owns/manages this farm */
  user_id?: UUID | null;
  /** Physical location or address */
  location?: string | null;
  /** URL to farm layout image or photo */
  farm_image_url?: string | null;
  /** Total farm dimensions */
  dimensions?: Dimensions;
  /** Rows contained in this farm */
  rows?: Row[];
  /** Farm description */
  description?: string;
  /** Whether the farm is currently active */
  is_active?: boolean;
}

/**
 * Combined farm data structure for frontend pages
 * Main data object passed to farm view components
 */
export interface FarmPageData {
  farm: Farm;
}

/**
 * Helper interface for organizing farm areas by type
 * Separates grow areas from germination tents
 */
export interface FarmAreaData {
  /** Rows designated for growing plants */
  growAreas: Row[];
  /** Rows designated for seed germination */
  germinationTents: Row[];
}

/**
 * Germination summary statistics
 * Provides overview of germination progress across the farm
 */
export interface GerminationSummary {
  /** Total number of seeds planted */
  total_seeds: number;
  /** Number of seeds that have germinated */
  germinated: number;
  /** Number of plants ready for transplanting */
  ready_for_transplant: number;
  /** Average time for germination in days */
  average_germination_time: number;
  /** Success rate as percentage */
  success_rate: number;
}

/**
 * Transplant candidate information
 * Represents plants ready to be moved from germination to grow areas
 */
export interface TransplantCandidate {
  /** ID of the shelf containing the candidate */
  shelf_id: UUID;
  /** Name of the shelf */
  shelf_name?: string;
  /** Name of the containing row */
  row_name?: string;
  /** Name of the containing rack */
  rack_name?: string;
  /** Germination data for the candidate */
  germination_data: GerminationData;
  /** Number of days since planting */
  days_since_planting: number;
  /** Estimated transplant readiness score */
  readiness_score?: number;
} 