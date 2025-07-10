export type UUID = string;

// Device Types from Home Assistant
export type DeviceType = 'light' | 'pump' | 'fan' | 'sensor';

// Device States
export type DeviceState = 'on' | 'off' | 'unavailable' | 'unknown';

// Device Actions
export type DeviceAction = 
  | { type: 'turn_on'; data?: Record<string, any> }
  | { type: 'turn_off'; data?: Record<string, any> }
  | { type: 'toggle'; data?: Record<string, any> }
  | { type: 'set_brightness'; brightness: number }
  | { type: 'set_color'; rgb_color: [number, number, number] }
  | { type: 'set_speed'; speed: number };

// Device Assignment from database
export interface DeviceAssignment {
  id: UUID;
  user_id: UUID;
  location_id: string; // Format: 'R1-S3' (Row1-Shelf3)
  home_assistant_entity_id: string;
  device_type: DeviceType;
  device_name?: string;
  capabilities: DeviceCapabilities;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Device Capabilities (varies by device type)
export interface DeviceCapabilities {
  // Light capabilities
  brightness?: boolean;
  color_mode?: boolean;
  rgb_color?: boolean;
  color_temp?: boolean;
  effect?: boolean;
  
  // Pump/Fan capabilities  
  speed_control?: boolean;
  flow_rate?: boolean;
  
  // Sensor capabilities
  measurement_unit?: string;
  precision?: number;
  
  // Common capabilities
  power?: boolean;
  scheduling?: boolean;
}

// Current Device State from cache
export interface DeviceStateData {
  id: UUID;
  user_id: UUID;
  home_assistant_entity_id: string;
  state: DeviceState;
  attributes: DeviceAttributes;
  last_updated: string;
  last_changed: string;
}

// Device Attributes (from Home Assistant)
export interface DeviceAttributes {
  // Common attributes
  friendly_name?: string;
  icon?: string;
  unit_of_measurement?: string;
  
  // Light attributes
  brightness?: number; // 0-255
  rgb_color?: [number, number, number];
  color_temp?: number;
  effect?: string;
  
  // Sensor attributes
  temperature?: number;
  humidity?: number;
  pressure?: number;
  
  // Pump/Fan attributes
  speed?: number;
  flow_rate?: number;
  
  // Device status
  last_seen?: string;
  battery_level?: number;
  signal_strength?: number;
}

// Device Control History
export interface DeviceControlHistory {
  id: UUID;
  user_id: UUID;
  home_assistant_entity_id: string;
  action_type: string;
  previous_state?: string;
  new_state?: string;
  triggered_by: 'manual' | 'automation' | 'schedule';
  success: boolean;
  error_message?: string;
  created_at: string;
}

// Combined Device Data (assignment + current state)
export interface DeviceData extends DeviceAssignment {
  current_state?: DeviceState;
  attributes?: DeviceAttributes;
  last_updated?: string;
  is_online?: boolean;
}

// Location Device Collection
export interface LocationDevices {
  location_id: string;
  devices: DeviceData[];
  last_updated: string;
}

// WebSocket Message Types
export interface DeviceWebSocketMessage {
  type: 'device_state_update' | 'device_control_response' | 'connection_status';
  data: any;
  timestamp: string;
}

export interface DeviceStateUpdate {
  entity_id: string;
  state: DeviceState;
  attributes: DeviceAttributes;
  last_changed: string;
  last_updated: string;
}

export interface DeviceControlResponse {
  entity_id: string;
  action: DeviceAction;
  success: boolean;
  error?: string;
  new_state?: DeviceState;
}

// Device Layer UI States
export interface DeviceLayerState {
  enabled: boolean;
  loading: boolean;
  error?: string;
  connectionStatus: 'connected' | 'disconnected' | 'connecting';
  devices: Record<string, DeviceData>; // keyed by entity_id
  locationDevices: Record<string, LocationDevices>; // keyed by location_id
  selectedDevice?: string; // entity_id of selected device
  controlPanelOpen: boolean;
}

// Device Control Panel Props
export interface DeviceControlPanelProps {
  device: DeviceData;
  onControl: (action: DeviceAction) => Promise<void>;
  onClose: () => void;
  loading?: boolean;
}

// Device Overlay Props
export interface DeviceOverlayProps {
  locationId: string;
  devices: DeviceData[];
  onDeviceClick: (device: DeviceData) => void;
  onQuickControl: (device: DeviceData, action: DeviceAction) => Promise<void>;
  className?: string;
}

// Device Status Indicator Props
export interface DeviceStatusIndicatorProps {
  device: DeviceData;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  interactive?: boolean;
  onClick?: () => void;
}

// API Response Types
export interface GetLocationDevicesResponse {
  assignment_id: UUID;
  entity_id: string;
  device_type: DeviceType;
  device_name?: string;
  capabilities: DeviceCapabilities;
  current_state?: DeviceState;
  attributes?: DeviceAttributes;
  last_updated?: string;
}

export interface ControlDeviceRequest {
  entity_id: string;
  action: DeviceAction;
}

export interface ControlDeviceResponse {
  success: boolean;
  entity_id: string;
  action: DeviceAction;
  new_state?: DeviceState;
  error?: string;
}

// Utility Types
export type DeviceFilter = {
  device_type?: DeviceType;
  state?: DeviceState;
  location_id?: string;
  is_online?: boolean;
};

export type DeviceSortBy = 'name' | 'type' | 'state' | 'last_updated';
export type SortOrder = 'asc' | 'desc';

// Device Assignment Management
export interface CreateDeviceAssignmentRequest {
  location_id: string;
  home_assistant_entity_id: string;
  device_type: DeviceType;
  device_name?: string;
  capabilities?: DeviceCapabilities;
}

export interface UpdateDeviceAssignmentRequest {
  device_name?: string;
  capabilities?: DeviceCapabilities;
  is_active?: boolean;
}

// Emergency Controls
export interface EmergencyControlAction {
  type: 'emergency_stop' | 'emergency_start' | 'reset_all';
  location_ids?: string[]; // If specified, only affect these locations
  device_types?: DeviceType[]; // If specified, only affect these device types
  reason?: string;
} 