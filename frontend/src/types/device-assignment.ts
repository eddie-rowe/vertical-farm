export interface HADevice {
  entity_id: string;
  friendly_name?: string;
  state: string;
  attributes: Record<string, any>;
  last_changed?: string;
  last_updated?: string;
  domain: string;
  device_class?: string;
  unit_of_measurement?: string;
  area?: string;
  icon?: string;
  supported_features?: number;
}

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
  status?: 'online' | 'offline' | 'unavailable';
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
  sortBy: 'name' | 'type' | 'status' | 'area';
  sortOrder: 'asc' | 'desc';
}

export type ElementType = 'farm' | 'row' | 'rack' | 'shelf';

export interface AssignmentTarget {
  type: ElementType;
  id: string;
  name: string;
} 