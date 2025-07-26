/**
 * Device assignment types
 * Types for assigning devices to farm locations and managing those assignments
 */

import { UUID, BaseEntity } from "../common";

import {
  DeviceType,
  DeviceCapabilities,
  DeviceState,
  DeviceAttributes,
  DeviceFilter,
} from "./core";

/** Farm hierarchy element types */
export type ElementType = "farm" | "row" | "rack" | "shelf";

/**
 * Device assignment record
 * Links a Home Assistant device to a specific farm location
 */
export interface DeviceAssignment extends BaseEntity {
  /** Home Assistant entity ID */
  entity_id: string;
  /** User-friendly display name */
  friendly_name?: string;
  /** Type of entity in Home Assistant */
  entity_type: string;
  /** Farm ID if assigned to farm level */
  farm_id?: string;
  /** Row ID if assigned to row level */
  row_id?: string;
  /** Rack ID if assigned to rack level */
  rack_id?: string;
  /** Shelf ID if assigned to shelf level */
  shelf_id?: string;
  /** ID of the user who owns this assignment */
  user_id?: string;
  /** ID of the user who made the assignment */
  assigned_by?: string;
  /** Integration ID for the device */
  integration_id?: string;
  /** Home Assistant device class */
  device_class?: string;
  /** Area assignment in Home Assistant */
  area?: string;
  /** URL to device manual or documentation */
  manual_url?: string;
  /** Photos of device installation */
  installation_photos?: string[];
}

/**
 * Database device assignment
 * Device assignment stored in database with additional metadata
 */
export interface DatabaseDeviceAssignment extends BaseEntity {
  /** ID of the user who owns this assignment */
  user_id: UUID;
  /** Location identifier in format 'R1-S3' (Row1-Shelf3) */
  location_id: string;
  /** Home Assistant entity ID */
  home_assistant_entity_id: string;
  /** Type of device */
  device_type: DeviceType;
  /** Optional device name */
  device_name?: string;
  /** Device capabilities configuration */
  capabilities: DeviceCapabilities;
  /** Whether the assignment is currently active */
  is_active: boolean;
}

/**
 * Device assignment target
 * Represents a farm element that can have devices assigned to it
 */
export interface AssignmentTarget {
  /** Type of farm element */
  type: ElementType;
  /** ID of the farm element */
  id: string;
  /** Display name of the farm element */
  name: string;
  /** Parent element information */
  parent?: {
    type: ElementType;
    id: string;
    name: string;
  };
}

/**
 * Device assignment request
 * Data needed to create a new device assignment
 */
export interface DeviceAssignmentRequest {
  /** Home Assistant entity ID */
  entity_id: string;
  /** User-friendly display name */
  friendly_name?: string;
  /** Type of entity in Home Assistant */
  entity_type: string;
  /** Home Assistant device class */
  device_class?: string;
  /** Area assignment in Home Assistant */
  area?: string;
  /** Farm ID if assigning to farm level */
  farm_id?: string;
  /** Row ID if assigning to row level */
  row_id?: string;
  /** Rack ID if assigning to rack level */
  rack_id?: string;
  /** Shelf ID if assigning to shelf level */
  shelf_id?: string;
}

/**
 * Device assignment creation request
 * Request to create a new device assignment
 */
export interface CreateDeviceAssignmentRequest {
  /** Location identifier */
  location_id: string;
  /** Home Assistant entity ID */
  home_assistant_entity_id: string;
  /** Type of device */
  device_type: DeviceType;
  /** Optional device name */
  device_name?: string;
  /** Device capabilities */
  capabilities?: DeviceCapabilities;
}

/**
 * Device assignment update request
 * Request to update an existing device assignment
 */
export interface UpdateDeviceAssignmentRequest {
  /** New device name */
  device_name?: string;
  /** Updated capabilities */
  capabilities?: DeviceCapabilities;
  /** New active status */
  is_active?: boolean;
}

/**
 * Combined device data
 * Device assignment with current state information
 */
export interface DeviceData extends DatabaseDeviceAssignment {
  /** Current device state */
  current_state?: DeviceState;
  /** Current device attributes */
  attributes?: DeviceAttributes;
  /** Last time state was updated */
  last_updated?: string;
  /** Whether device is currently online */
  is_online?: boolean;
}

/**
 * Location devices collection
 * All devices assigned to a specific location
 */
export interface LocationDevices {
  /** Location identifier */
  location_id: string;
  /** Devices assigned to this location */
  devices: DeviceData[];
  /** Last time this collection was updated */
  last_updated: string;
  /** Summary statistics */
  summary?: {
    total: number;
    online: number;
    offline: number;
    by_type: Record<DeviceType, number>;
  };
}

/**
 * Device browser state
 * UI state for device browsing and assignment
 */
export interface DeviceBrowserState {
  /** Search term for filtering devices */
  searchTerm: string;
  /** Active filter settings */
  selectedFilters: DeviceFilter;
  /** Show only unassigned devices */
  showOnlyUnassigned: boolean;
  /** Sort field */
  sortBy: "name" | "type" | "status" | "area";
  /** Sort order */
  sortOrder: "asc" | "desc";
  /** Selected devices for bulk operations */
  selectedDevices: string[];
  /** Current page for pagination */
  currentPage: number;
  /** Items per page */
  itemsPerPage: number;
}

/**
 * Device assignment validation
 * Validation result for device assignment
 */
export interface DeviceAssignmentValidation {
  /** Whether the assignment is valid */
  isValid: boolean;
  /** Error messages if invalid */
  errors: string[];
  /** Warning messages */
  warnings: string[];
  /** Suggested alternatives */
  suggestions?: string[];
}

/**
 * API response for location devices
 * Response from API when fetching devices for a location
 */
export interface GetLocationDevicesResponse {
  /** Assignment ID */
  assignment_id: UUID;
  /** Home Assistant entity ID */
  entity_id: string;
  /** Type of device */
  device_type: DeviceType;
  /** Device name */
  device_name?: string;
  /** Device capabilities */
  capabilities: DeviceCapabilities;
  /** Current device state */
  current_state?: DeviceState;
  /** Current device attributes */
  attributes?: DeviceAttributes;
  /** Last update time */
  last_updated?: string;
}

/**
 * Device assignment summary
 * Summary statistics for device assignments
 */
export interface DeviceAssignmentSummary {
  /** Total number of assignments */
  total_assignments: number;
  /** Number of active assignments */
  active_assignments: number;
  /** Number of inactive assignments */
  inactive_assignments: number;
  /** Assignments by device type */
  by_device_type: Record<DeviceType, number>;
  /** Assignments by location type */
  by_location_type: Record<ElementType, number>;
  /** Most recent assignment */
  latest_assignment?: DeviceAssignment;
}
