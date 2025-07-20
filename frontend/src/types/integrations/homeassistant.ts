
// Core Home Assistant Device Interface (consolidated)
export interface HADevice {
  entity_id: string;
  friendly_name?: string;
  state: string;
  domain: string;
  last_updated?: string;
  last_changed?: string;
  attributes?: Record<string, any>;
  device_class?: string;
  unit_of_measurement?: string;
  area?: string;
  icon?: string;
  supported_features?: number;
}

// Home Assistant Configuration
export interface HAConfig {
  name: string;
  url: string;
  token: string;
  webhook_url?: string;
  enabled: boolean;
  cloudflare_client_id?: string;
  cloudflare_client_secret?: string;
  is_default?: boolean;
  local_url?: string;
  id?: string;
  created_at?: string;
  updated_at?: string;
}

// Home Assistant Connection Status
export interface HAStatus {
  connected: boolean;
  last_updated?: string;
  home_assistant_version?: string;
  message?: string;
}

// Device Assignment in Farm Context
export interface HAAssignment {
  entity_id: string;
  farm_id: string;
  row_id: string;
  rack_id: string;
  shelf_id: string;
  friendly_name?: string;
  entity_type?: string;
  farm_name?: string;
  row_name?: string;
  rack_name?: string;
  shelf_name?: string;
}

// Imported Device Tracking
export interface HAImportedDevice {
  entity_id: string;
  friendly_name?: string;
  entity_type?: string;
  imported_at?: string;
}

// Connection States
export type ConnectionState =
  | "not-configured"
  | "connecting"
  | "connected"
  | "error";

// UI Filter Components
export interface FilterChip {
  id: string;
  label: string;
  type: "status" | "type" | "assignment";
  value: string;
}

// Setup Workflow Steps
export type SetupStep = "connection" | "test" | "discovery" | "complete";

// UI View Types
export type ViewType = "grid" | "list" | "farm";

// Device Statistics
export interface DeviceStats {
  total: number;
  assigned: number;
  active: number;
  unassigned: number;
}

// Assignment Form Data
export interface AssignmentForm {
  farm_id: string;
  row_id: string;
  rack_id: string;
  shelf_id: string;
}

// Device Control Actions
export interface DeviceControlAction {
  action: "turn_on" | "turn_off" | "toggle";
  entity_id: string;
}

// Device Filter Settings
export interface DeviceFilterSettings {
  status: string;
  type: string;
  assignment: string;
  searchTerm: string;
}

// React Context Interface for Home Assistant
export interface HAContextType {
  devices: HADevice[];
  config: HAConfig;
  status: HAStatus;
  assignments: HAAssignment[];
  importedDevices: HAImportedDevice[];
  connectionState: ConnectionState;
  loading: boolean;
  error: string | null;

  // Actions
  loadDevices: () => Promise<void>;
  testConnection: () => Promise<void>;
  saveConfiguration: (config: HAConfig) => Promise<void>;
  discoverDevices: () => Promise<void>;
  importDevice: (device: HADevice) => Promise<void>;
  controlDevice: (
    device: HADevice,
    action: DeviceControlAction["action"],
  ) => Promise<void>;
  assignDevice: (entityId: string, assignment: AssignmentForm) => Promise<void>;
  setConnectionState: (state: ConnectionState) => void;
}

// Legacy interfaces for backwards compatibility with existing device-assignment.ts
export interface DeviceAssignment {
  id: string;
  entity_id: string;
  friendly_name?: string;
  entity_type: string;
  farm_id?: string;
  row_id?: string;
  rack_id?: string;
  shelf_id?: string;
  user_id?: string;
  assigned_by?: string;
  integration_id?: string;
  device_class?: string;
  area?: string;
  manual_url?: string;
  installation_photos?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface DeviceFilter {
  type?: string;
  domain?: string;
  area?: string;
  status?: "online" | "offline" | "unavailable";
  assigned?: boolean;
}

export interface DeviceAssignmentRequest {
  entity_id: string;
  friendly_name?: string;
  entity_type: string;
  device_class?: string;
  area?: string;
  farm_id?: string;
  row_id?: string;
  rack_id?: string;
  shelf_id?: string;
}

export interface DeviceBrowserState {
  searchTerm: string;
  selectedFilters: DeviceFilter;
  showOnlyUnassigned: boolean;
  sortBy: "name" | "type" | "status" | "area";
  sortOrder: "asc" | "desc";
}

export type ElementType = "farm" | "row" | "rack" | "shelf";

export interface AssignmentTarget {
  type: ElementType;
  id: string;
  name: string;
}
