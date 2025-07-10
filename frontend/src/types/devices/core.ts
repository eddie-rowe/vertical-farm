/**
 * Core device types and interfaces
 * Fundamental types used across all device-related functionality
 */

import { UUID, BaseEntity, Status, ExecutionStatus } from '../common';

/** Types of devices supported in the system */
export type DeviceType = 'light' | 'pump' | 'fan' | 'sensor';

/** Current state of a device */
export type DeviceState = 'on' | 'off' | 'unavailable' | 'unknown';

/** Sort options for device lists */
export type DeviceSortBy = 'name' | 'type' | 'state' | 'last_updated';

/** Sort order options */
export type SortOrder = 'asc' | 'desc';

/** Device connection status */
export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting';

/** Who or what triggered a device action */
export type TriggerSource = 'manual' | 'automation' | 'schedule';

/**
 * Device action types
 * Represents different actions that can be performed on devices
 */
export type DeviceAction = 
  | { type: 'turn_on'; data?: Record<string, unknown> }
  | { type: 'turn_off'; data?: Record<string, unknown> }
  | { type: 'toggle'; data?: Record<string, unknown> }
  | { type: 'set_brightness'; brightness: number }
  | { type: 'set_color'; rgb_color: [number, number, number] }
  | { type: 'set_speed'; speed: number };

/**
 * Device capabilities configuration
 * Defines what actions and features a device supports
 */
export interface DeviceCapabilities {
  // Light capabilities
  /** Can control brightness levels */
  brightness?: boolean;
  /** Supports color mode changes */
  color_mode?: boolean;
  /** Supports RGB color control */
  rgb_color?: boolean;
  /** Supports color temperature control */
  color_temp?: boolean;
  /** Supports lighting effects */
  effect?: boolean;
  
  // Pump/Fan capabilities  
  /** Can control speed/flow rate */
  speed_control?: boolean;
  /** Can measure/control flow rate */
  flow_rate?: boolean;
  
  // Sensor capabilities
  /** Unit of measurement for sensor readings */
  measurement_unit?: string;
  /** Precision of sensor measurements */
  precision?: number;
  
  // Common capabilities
  /** Basic power on/off control */
  power?: boolean;
  /** Supports scheduled operations */
  scheduling?: boolean;
}

/**
 * Device attributes from Home Assistant
 * Raw attributes provided by the device
 */
export interface DeviceAttributes {
  // Common attributes
  /** Display name for the device */
  friendly_name?: string;
  /** Icon identifier */
  icon?: string;
  /** Unit of measurement */
  unit_of_measurement?: string;
  
  // Light attributes
  /** Brightness level (0-255) */
  brightness?: number;
  /** RGB color values */
  rgb_color?: [number, number, number];
  /** Color temperature */
  color_temp?: number;
  /** Active lighting effect */
  effect?: string;
  
  // Sensor attributes
  /** Temperature reading */
  temperature?: number;
  /** Humidity reading */
  humidity?: number;
  /** Pressure reading */
  pressure?: number;
  
  // Pump/Fan attributes
  /** Current speed setting */
  speed?: number;
  /** Current flow rate */
  flow_rate?: number;
  
  // Device status
  /** Last time device was seen online */
  last_seen?: string;
  /** Battery level percentage */
  battery_level?: number;
  /** Signal strength indicator */
  signal_strength?: number;
}

/**
 * Device control history record
 * Tracks all actions performed on devices
 */
export interface DeviceControlHistory extends BaseEntity {
  /** ID of the user who performed the action */
  user_id: UUID;
  /** Home Assistant entity ID */
  home_assistant_entity_id: string;
  /** Type of action performed */
  action_type: string;
  /** Device state before the action */
  previous_state?: string;
  /** Device state after the action */
  new_state?: string;
  /** What triggered this action */
  triggered_by: TriggerSource;
  /** Whether the action was successful */
  success: boolean;
  /** Error message if action failed */
  error_message?: string;
}

/**
 * Device filter options
 * Used for filtering device lists
 */
export interface DeviceFilter {
  /** Filter by device type */
  device_type?: DeviceType;
  /** Filter by domain (Home Assistant) */
  domain?: string;
  /** Filter by area assignment */
  area?: string;
  /** Filter by current state */
  state?: DeviceState;
  /** Filter by connection status */
  status?: 'online' | 'offline' | 'unavailable';
  /** Filter by assignment status */
  assigned?: boolean;
  /** Filter by location ID */
  location_id?: string;
  /** Filter by online status */
  is_online?: boolean;
}

/**
 * Emergency control action
 * For emergency stop/start operations
 */
export interface EmergencyControlAction {
  /** Type of emergency action */
  type: 'emergency_stop' | 'emergency_start' | 'reset_all';
  /** Specific locations to affect (optional) */
  location_ids?: string[];
  /** Specific device types to affect (optional) */
  device_types?: DeviceType[];
  /** Reason for emergency action */
  reason?: string;
}

/**
 * Device control request
 * Used for API calls to control devices
 */
export interface ControlDeviceRequest {
  /** Home Assistant entity ID */
  entity_id: string;
  /** Action to perform */
  action: DeviceAction;
}

/**
 * Device control response
 * Response from device control API
 */
export interface ControlDeviceResponse {
  /** Home Assistant entity ID */
  entity_id: string;
  /** Action that was performed */
  action: DeviceAction;
  /** New device state after action */
  new_state?: DeviceState;
  /** Error message if action failed */
  error?: string;
}

/**
 * WebSocket message for device updates
 */
export interface DeviceWebSocketMessage {
  /** Type of message */
  type: 'device_state_update' | 'device_control_response' | 'connection_status';
  /** Message data */
  data: unknown;
  /** Message timestamp */
  timestamp: string;
}

/**
 * Device state update message
 */
export interface DeviceStateUpdate {
  /** Home Assistant entity ID */
  entity_id: string;
  /** New device state */
  state: DeviceState;
  /** Updated device attributes */
  attributes: DeviceAttributes;
  /** When the state last changed */
  last_changed: string;
  /** When the state was last updated */
  last_updated: string;
}

/**
 * Device control response message
 */
export interface DeviceControlResponse {
  /** Home Assistant entity ID */
  entity_id: string;
  /** Action that was performed */
  action: DeviceAction;
  /** Whether the action was successful */
  success: boolean;
  /** Error message if action failed */
  error?: string;
  /** New device state after action */
  new_state?: DeviceState;
} 