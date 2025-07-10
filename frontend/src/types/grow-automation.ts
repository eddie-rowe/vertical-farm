// Layer Two: Grow Automation Types
// TypeScript interfaces for bridging grow management with device controls

export interface GrowAutomationRule {
  id: string;
  grow_id: string;
  device_assignment_id: string;
  rule_type: 'schedule' | 'condition' | 'event_trigger';
  rule_config: Record<string, any>;
  is_active: boolean;
  priority: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface GrowAutomationSchedule {
  id: string;
  grow_id: string;
  device_assignment_id: string;
  schedule_name: string;
  schedule_type: 'daily' | 'weekly' | 'stage_based' | 'custom';
  cron_expression?: string;
  device_action: DeviceAction;
  is_active: boolean;
  starts_at?: string;
  ends_at?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface GrowAutomationCondition {
  id: string;
  grow_id: string;
  device_assignment_id: string;
  condition_name: string;
  sensor_entity_id: string;
  condition_type: 'above' | 'below' | 'between' | 'equals';
  threshold_value?: number;
  threshold_min?: number;
  threshold_max?: number;
  device_action: DeviceAction;
  cooldown_minutes: number;
  is_active: boolean;
  last_triggered_at?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface GrowAutomationExecution {
  id: string;
  grow_id: string;
  automation_type: 'rule' | 'schedule' | 'condition' | 'manual';
  automation_id?: string;
  device_assignment_id: string;
  action_taken: DeviceAction;
  execution_status: 'pending' | 'success' | 'failed' | 'skipped';
  execution_result?: Record<string, any>;
  error_message?: string;
  executed_at: string;
  completed_at?: string;
}

export interface GrowDeviceProfile {
  id: string;
  profile_name: string;
  crop_id?: string;
  grow_stage_id?: string;
  device_type: DeviceType;
  profile_config: Record<string, any>;
  description?: string;
  is_template: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

// Device action types from device layer
export interface DeviceAction {
  action_type: 'turn_on' | 'turn_off' | 'set_brightness' | 'set_temperature' | 'set_speed' | 'set_value';
  parameters?: Record<string, any>;
  duration_seconds?: number;
  delay_seconds?: number;
}

// Device types from device layer
export type DeviceType = 'light' | 'pump' | 'fan' | 'sensor' | 'actuator' | 'switch';

// Enhanced grow data with automation
export interface GrowWithAutomation {
  id: string;
  name: string;
  automation_enabled: boolean;
  device_profile_id?: string;
  status: 'planned' | 'active' | 'harvested' | 'failed' | 'paused';
  automation_rules?: GrowAutomationRule[];
  automation_schedules?: GrowAutomationSchedule[];
  automation_conditions?: GrowAutomationCondition[];
  recent_executions?: GrowAutomationExecution[];
  device_assignments?: GrowDeviceAssignment[];
}

// Device assignments for a grow
export interface GrowDeviceAssignment {
  assignment_id: string;
  entity_id: string;
  device_type: DeviceType;
  location_id: string;
  location_name: string;
  device_capabilities?: DeviceCapabilities;
  current_state?: DeviceState;
}

// Device capabilities and states from device layer
export interface DeviceCapabilities {
  actions: string[];
  min_value?: number;
  max_value?: number;
  step?: number;
  unit?: string;
}

export interface DeviceState {
  entity_id: string;
  state: string;
  attributes: Record<string, any>;
  last_updated: string;
}

// Automation configuration for the new grow setup
export interface GrowAutomationConfig {
  enabled: boolean;
  use_device_profile: boolean;
  device_profile_id?: string;
  custom_schedules: CreateAutomationSchedule[];
  custom_conditions: CreateAutomationCondition[];
  custom_rules: CreateAutomationRule[];
}

// Create/Update DTOs
export interface CreateAutomationRule {
  grow_id: string;
  device_assignment_id: string;
  rule_type: 'schedule' | 'condition' | 'event_trigger';
  rule_config: Record<string, any>;
  priority?: number;
  is_active?: boolean;
}

export interface CreateAutomationSchedule {
  grow_id: string;
  device_assignment_id: string;
  schedule_name: string;
  schedule_type: 'daily' | 'weekly' | 'stage_based' | 'custom';
  device_action: DeviceAction;
  cron_expression?: string;
  starts_at?: string;
  ends_at?: string;
  is_active?: boolean;
}

export interface CreateAutomationCondition {
  grow_id: string;
  device_assignment_id: string;
  condition_name: string;
  sensor_entity_id: string;
  condition_type: 'above' | 'below' | 'between' | 'equals';
  threshold_value?: number;
  threshold_min?: number;
  threshold_max?: number;
  device_action: DeviceAction;
  cooldown_minutes?: number;
  is_active?: boolean;
}

export interface UpdateAutomationRule extends Partial<CreateAutomationRule> {
  id: string;
}

export interface UpdateAutomationSchedule extends Partial<CreateAutomationSchedule> {
  id: string;
}

export interface UpdateAutomationCondition extends Partial<CreateAutomationCondition> {
  id: string;
}

// Automation templates for quick setup
export interface AutomationTemplate {
  id: string;
  name: string;
  description: string;
  device_type: DeviceType;
  crop_types?: string[];
  template_schedules: Omit<CreateAutomationSchedule, 'grow_id' | 'device_assignment_id'>[];
  template_conditions: Omit<CreateAutomationCondition, 'grow_id' | 'device_assignment_id'>[];
  template_rules: Omit<CreateAutomationRule, 'grow_id' | 'device_assignment_id'>[];
}

// Automation status and monitoring
export interface AutomationStatus {
  grow_id: string;
  is_enabled: boolean;
  active_schedules: number;
  active_conditions: number;
  active_rules: number;
  last_execution?: GrowAutomationExecution;
  next_scheduled_action?: {
    schedule_id: string;
    device_assignment_id: string;
    action: DeviceAction;
    scheduled_time: string;
  };
  recent_errors: {
    execution_id: string;
    error_message: string;
    occurred_at: string;
  }[];
  efficiency_score: number; // 0-100
}

// WebSocket messages for real-time automation updates
export interface AutomationWebSocketMessage {
  type: 'automation_execution' | 'automation_status' | 'automation_error' | 'schedule_updated';
  grow_id: string;
  data: GrowAutomationExecution | AutomationStatus | { error: string } | GrowAutomationSchedule;
  timestamp: string;
}

// API Response types
export interface GetGrowAutomationResponse {
  rules: GrowAutomationRule[];
  schedules: GrowAutomationSchedule[];
  conditions: GrowAutomationCondition[];
  executions: GrowAutomationExecution[];
  device_assignments: GrowDeviceAssignment[];
  status: AutomationStatus;
}

export interface CreateGrowAutomationResponse {
  success: boolean;
  created_rules: GrowAutomationRule[];
  created_schedules: GrowAutomationSchedule[];
  created_conditions: GrowAutomationCondition[];
  errors?: string[];
}

// Predefined automation patterns
export const AUTOMATION_PATTERNS = {
  LIGHT_SCHEDULE: {
    name: 'Light Schedule',
    description: 'Daily light cycle for plants',
    device_type: 'light' as DeviceType,
    template_schedules: [
      {
        schedule_name: 'Light On',
        schedule_type: 'daily' as const,
        device_action: { action_type: 'turn_on' as const },
        cron_expression: '0 6 * * *' // 6 AM daily
      },
      {
        schedule_name: 'Light Off',
        schedule_type: 'daily' as const,
        device_action: { action_type: 'turn_off' as const },
        cron_expression: '0 22 * * *' // 10 PM daily
      }
    ]
  },
  WATERING_SCHEDULE: {
    name: 'Watering Schedule',
    description: 'Regular watering intervals',
    device_type: 'pump' as DeviceType,
    template_schedules: [
      {
        schedule_name: 'Daily Watering',
        schedule_type: 'daily' as const,
        device_action: { 
          action_type: 'turn_on' as const, 
          duration_seconds: 30 
        },
        cron_expression: '0 8 * * *' // 8 AM daily
      }
    ]
  },
  TEMPERATURE_CONTROL: {
    name: 'Temperature Control',
    description: 'Maintain optimal temperature range',
    device_type: 'fan' as DeviceType,
    template_conditions: [
      {
        condition_name: 'High Temperature',
        sensor_entity_id: 'sensor.temperature',
        condition_type: 'above' as const,
        threshold_value: 26,
        device_action: { action_type: 'turn_on' as const },
        cooldown_minutes: 10
      },
      {
        condition_name: 'Low Temperature',
        sensor_entity_id: 'sensor.temperature',
        condition_type: 'below' as const,
        threshold_value: 18,
        device_action: { action_type: 'turn_off' as const },
        cooldown_minutes: 10
      }
    ]
  }
} as const;

// Validation functions
export function validateAutomationSchedule(schedule: CreateAutomationSchedule): string[] {
  const errors: string[] = [];
  
  if (!schedule.schedule_name?.trim()) {
    errors.push('Schedule name is required');
  }
  
  if (!schedule.device_action?.action_type) {
    errors.push('Device action type is required');
  }
  
  if (schedule.schedule_type === 'custom' && !schedule.cron_expression) {
    errors.push('Cron expression is required for custom schedules');
  }
  
  return errors;
}

export function validateAutomationCondition(condition: CreateAutomationCondition): string[] {
  const errors: string[] = [];
  
  if (!condition.condition_name?.trim()) {
    errors.push('Condition name is required');
  }
  
  if (!condition.sensor_entity_id?.trim()) {
    errors.push('Sensor entity ID is required');
  }
  
  if (!condition.device_action?.action_type) {
    errors.push('Device action type is required');
  }
  
  if (['above', 'below', 'equals'].includes(condition.condition_type) && 
      condition.threshold_value === undefined) {
    errors.push('Threshold value is required for this condition type');
  }
  
  if (condition.condition_type === 'between' && 
      (condition.threshold_min === undefined || condition.threshold_max === undefined)) {
    errors.push('Both min and max thresholds are required for between conditions');
  }
  
  return errors;
} 