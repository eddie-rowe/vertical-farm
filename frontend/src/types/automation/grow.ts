/**
 * Grow automation types
 * Types specific to grow automation rules, schedules, and conditions
 */

import { UUID, BaseEntity, Priority } from '../common';
import { DeviceAction, DeviceType, DeviceCapabilities, DeviceState } from '../devices/core';

/** Types of grow automation rules */
export type GrowAutomationRuleType = 'schedule' | 'condition' | 'event_trigger';

/** Types of grow automation schedules */
export type GrowScheduleType = 'daily' | 'weekly' | 'stage_based' | 'custom';

/** Types of grow automation conditions */
export type GrowConditionType = 'above' | 'below' | 'between' | 'equals';

/** Types of grow automation execution */
export type GrowAutomationType = 'rule' | 'schedule' | 'condition' | 'manual';

/** Grow automation execution status */
export type GrowExecutionStatus = 'pending' | 'success' | 'failed' | 'skipped';

/** Grow status types */
export type GrowStatus = 'planned' | 'active' | 'harvested' | 'failed' | 'paused';

/**
 * Grow automation rule
 * Defines automation rules for grow management
 */
export interface GrowAutomationRule extends BaseEntity {
  /** ID of the grow this rule applies to */
  grow_id: string;
  /** ID of the device assignment */
  device_assignment_id: string;
  /** Type of automation rule */
  rule_type: GrowAutomationRuleType;
  /** Rule configuration data */
  rule_config: Record<string, unknown>;
  /** Whether the rule is currently active */
  is_active: boolean;
  /** Rule priority (higher number = higher priority) */
  priority: number;
  /** User who created the rule */
  created_by?: string;
  /** Rule description */
  description?: string;
  /** Number of times rule has been executed */
  execution_count?: number;
  /** Last execution time */
  last_executed?: string;
  /** Next scheduled execution */
  next_execution?: string;
}

/**
 * Grow automation schedule
 * Defines scheduled automation actions for grows
 */
export interface GrowAutomationSchedule extends BaseEntity {
  /** ID of the grow this schedule applies to */
  grow_id: string;
  /** ID of the device assignment */
  device_assignment_id: string;
  /** Human-readable schedule name */
  schedule_name: string;
  /** Type of schedule */
  schedule_type: GrowScheduleType;
  /** Cron expression for custom schedules */
  cron_expression?: string;
  /** Device action to execute */
  device_action: DeviceAction;
  /** Whether the schedule is currently active */
  is_active: boolean;
  /** Schedule start time */
  starts_at?: string;
  /** Schedule end time */
  ends_at?: string;
  /** User who created the schedule */
  created_by?: string;
  /** Schedule description */
  description?: string;
  /** Schedule priority */
  priority?: Priority;
  /** Time zone for schedule */
  timezone?: string;
  /** Number of times schedule has run */
  execution_count?: number;
  /** Last execution time */
  last_executed?: string;
  /** Next scheduled execution */
  next_execution?: string;
}

/**
 * Grow automation condition
 * Defines condition-based automation for grows
 */
export interface GrowAutomationCondition extends BaseEntity {
  /** ID of the grow this condition applies to */
  grow_id: string;
  /** ID of the device assignment */
  device_assignment_id: string;
  /** Human-readable condition name */
  condition_name: string;
  /** Sensor entity ID to monitor */
  sensor_entity_id: string;
  /** Type of condition check */
  condition_type: GrowConditionType;
  /** Threshold value for simple conditions */
  threshold_value?: number;
  /** Minimum value for 'between' conditions */
  threshold_min?: number;
  /** Maximum value for 'between' conditions */
  threshold_max?: number;
  /** Device action to execute when condition is met */
  device_action: DeviceAction;
  /** Cooldown period in minutes */
  cooldown_minutes: number;
  /** Whether the condition is currently active */
  is_active: boolean;
  /** Last time the condition was triggered */
  last_triggered_at?: string;
  /** User who created the condition */
  created_by?: string;
  /** Condition description */
  description?: string;
  /** Condition priority */
  priority?: Priority;
  /** Number of times condition has been triggered */
  trigger_count?: number;
  /** Current sensor value */
  current_sensor_value?: number;
  /** Whether condition is currently met */
  is_condition_met?: boolean;
}

/**
 * Grow automation execution
 * Records of automation actions that have been executed
 */
export interface GrowAutomationExecution extends BaseEntity {
  /** ID of the grow */
  grow_id: string;
  /** Type of automation that was executed */
  automation_type: GrowAutomationType;
  /** ID of the automation (rule, schedule, or condition) */
  automation_id?: string;
  /** ID of the device assignment */
  device_assignment_id: string;
  /** Action that was taken */
  action_taken: DeviceAction;
  /** Status of the execution */
  execution_status: GrowExecutionStatus;
  /** Result data from the execution */
  execution_result?: Record<string, unknown>;
  /** Error message if execution failed */
  error_message?: string;
  /** When execution started */
  executed_at: string;
  /** When execution completed */
  completed_at?: string;
  /** Execution duration in seconds */
  duration_seconds?: number;
  /** User who triggered manual execution */
  triggered_by?: string;
  /** Execution priority */
  priority?: Priority;
}

/**
 * Grow device profile
 * Predefined device configurations for specific crops/stages
 */
export interface GrowDeviceProfile extends BaseEntity {
  /** Profile name */
  profile_name: string;
  /** Associated crop ID */
  crop_id?: string;
  /** Associated grow stage ID */
  grow_stage_id?: string;
  /** Type of device this profile is for */
  device_type: DeviceType;
  /** Profile configuration data */
  profile_config: Record<string, unknown>;
  /** Profile description */
  description?: string;
  /** Whether this is a template profile */
  is_template: boolean;
  /** User who created the profile */
  created_by?: string;
  /** Profile category */
  category?: string;
  /** Profile tags for filtering */
  tags?: string[];
  /** Usage count */
  usage_count?: number;
  /** Rating (1-5) */
  rating?: number;
  /** Whether profile is publicly available */
  is_public?: boolean;
}

/**
 * Grow with automation
 * Grow entity with automation information
 */
export interface GrowWithAutomation {
  /** Grow ID */
  id: string;
  /** Grow name */
  name: string;
  /** Whether automation is enabled */
  automation_enabled: boolean;
  /** Associated device profile ID */
  device_profile_id?: string;
  /** Current grow status */
  status: GrowStatus;
  /** Associated automation rules */
  automation_rules?: GrowAutomationRule[];
  /** Associated automation schedules */
  automation_schedules?: GrowAutomationSchedule[];
  /** Associated automation conditions */
  automation_conditions?: GrowAutomationCondition[];
  /** Recent executions */
  recent_executions?: GrowAutomationExecution[];
  /** Device assignments */
  device_assignments?: GrowDeviceAssignment[];
  /** Grow description */
  description?: string;
  /** Grow start date */
  start_date?: string;
  /** Estimated harvest date */
  estimated_harvest_date?: string;
  /** Current grow stage */
  current_stage?: string;
  /** Progress percentage */
  progress_percentage?: number;
}

/**
 * Grow device assignment
 * Device assignments specific to a grow
 */
export interface GrowDeviceAssignment {
  /** Assignment ID */
  assignment_id: string;
  /** Home Assistant entity ID */
  entity_id: string;
  /** Device type */
  device_type: DeviceType;
  /** Location ID */
  location_id: string;
  /** Location name */
  location_name: string;
  /** Device capabilities */
  device_capabilities?: DeviceCapabilities;
  /** Current device state */
  current_state?: DeviceState;
  /** Device name */
  device_name?: string;
  /** Whether device is online */
  is_online?: boolean;
  /** Last update time */
  last_updated?: string;
}

/**
 * Grow automation configuration
 * Configuration for setting up automation on a new grow
 */
export interface GrowAutomationConfig {
  /** Whether automation is enabled */
  enabled: boolean;
  /** Whether to use a device profile */
  use_device_profile: boolean;
  /** Device profile ID to use */
  device_profile_id?: string;
  /** Custom schedules to create */
  custom_schedules: CreateGrowAutomationSchedule[];
  /** Custom conditions to create */
  custom_conditions: CreateGrowAutomationCondition[];
  /** Custom rules to create */
  custom_rules: CreateGrowAutomationRule[];
  /** Configuration description */
  description?: string;
  /** Configuration priority */
  priority?: Priority;
}

/**
 * Create grow automation rule input
 */
export interface CreateGrowAutomationRule {
  /** ID of the grow */
  grow_id: string;
  /** ID of the device assignment */
  device_assignment_id: string;
  /** Type of rule */
  rule_type: GrowAutomationRuleType;
  /** Rule configuration */
  rule_config: Record<string, unknown>;
  /** Rule priority */
  priority?: number;
  /** Whether rule is active */
  is_active?: boolean;
  /** Rule description */
  description?: string;
}

/**
 * Create grow automation schedule input
 */
export interface CreateGrowAutomationSchedule {
  /** ID of the grow */
  grow_id: string;
  /** ID of the device assignment */
  device_assignment_id: string;
  /** Schedule name */
  schedule_name: string;
  /** Schedule type */
  schedule_type: GrowScheduleType;
  /** Device action to execute */
  device_action: DeviceAction;
  /** Cron expression for custom schedules */
  cron_expression?: string;
  /** Start time */
  starts_at?: string;
  /** End time */
  ends_at?: string;
  /** Whether schedule is active */
  is_active?: boolean;
  /** Schedule description */
  description?: string;
  /** Schedule priority */
  priority?: Priority;
}

/**
 * Create grow automation condition input
 */
export interface CreateGrowAutomationCondition {
  /** ID of the grow */
  grow_id: string;
  /** ID of the device assignment */
  device_assignment_id: string;
  /** Condition name */
  condition_name: string;
  /** Sensor entity ID to monitor */
  sensor_entity_id: string;
  /** Type of condition */
  condition_type: GrowConditionType;
  /** Threshold value */
  threshold_value?: number;
  /** Minimum threshold for 'between' conditions */
  threshold_min?: number;
  /** Maximum threshold for 'between' conditions */
  threshold_max?: number;
  /** Device action to execute */
  device_action: DeviceAction;
  /** Cooldown period in minutes */
  cooldown_minutes?: number;
  /** Whether condition is active */
  is_active?: boolean;
  /** Condition description */
  description?: string;
  /** Condition priority */
  priority?: Priority;
}

/**
 * Update grow automation rule input
 */
export interface UpdateGrowAutomationRule extends Partial<CreateGrowAutomationRule> {
  /** Rule ID */
  id: string;
}

/**
 * Update grow automation schedule input
 */
export interface UpdateGrowAutomationSchedule extends Partial<CreateGrowAutomationSchedule> {
  /** Schedule ID */
  id: string;
}

/**
 * Update grow automation condition input
 */
export interface UpdateGrowAutomationCondition extends Partial<CreateGrowAutomationCondition> {
  /** Condition ID */
  id: string;
}

/**
 * Automation template
 * Template for quickly setting up automation
 */
export interface AutomationTemplate {
  /** Template ID */
  id: string;
  /** Template name */
  name: string;
  /** Template description */
  description: string;
  /** Device type this template is for */
  device_type: DeviceType;
  /** Crop types this template works with */
  crop_types?: string[];
  /** Template schedules */
  template_schedules: Omit<CreateGrowAutomationSchedule, 'grow_id' | 'device_assignment_id'>[];
  /** Template conditions */
  template_conditions: Omit<CreateGrowAutomationCondition, 'grow_id' | 'device_assignment_id'>[];
  /** Template rules */
  template_rules: Omit<CreateGrowAutomationRule, 'grow_id' | 'device_assignment_id'>[];
  /** Template category */
  category?: string;
  /** Template tags */
  tags?: string[];
  /** Template author */
  author?: string;
  /** Template version */
  version?: string;
  /** Whether template is verified */
  is_verified?: boolean;
}

/**
 * Grow automation status
 * Status overview for grow automation
 */
export interface GrowAutomationStatus {
  /** Grow ID */
  grow_id: string;
  /** Whether automation is enabled */
  is_enabled: boolean;
  /** Number of active schedules */
  active_schedules: number;
  /** Number of active conditions */
  active_conditions: number;
  /** Number of active rules */
  active_rules: number;
  /** Last execution */
  last_execution?: GrowAutomationExecution;
  /** Next scheduled action */
  next_scheduled_action?: {
    schedule_id: string;
    device_assignment_id: string;
    action: DeviceAction;
    scheduled_time: string;
  };
  /** Recent errors */
  recent_errors: {
    execution_id: string;
    error_message: string;
    occurred_at: string;
  }[];
  /** Efficiency score (0-100) */
  efficiency_score: number;
  /** System health score (0-100) */
  health_score?: number;
  /** Total executions today */
  executions_today: number;
  /** Success rate percentage */
  success_rate: number;
}

/**
 * Automation WebSocket message
 * WebSocket messages for real-time automation updates
 */
export interface AutomationWebSocketMessage {
  /** Message type */
  type: 'automation_execution' | 'automation_status' | 'automation_error' | 'schedule_updated';
  /** Grow ID */
  grow_id: string;
  /** Message data */
  data: GrowAutomationExecution | GrowAutomationStatus | { error: string } | GrowAutomationSchedule;
  /** Message timestamp */
  timestamp: string;
}

/**
 * Get grow automation response
 * Response from API when fetching grow automation data
 */
export interface GetGrowAutomationResponse {
  /** Automation rules */
  rules: GrowAutomationRule[];
  /** Automation schedules */
  schedules: GrowAutomationSchedule[];
  /** Automation conditions */
  conditions: GrowAutomationCondition[];
  /** Execution history */
  executions: GrowAutomationExecution[];
  /** Device assignments */
  device_assignments: GrowDeviceAssignment[];
  /** Automation status */
  status: GrowAutomationStatus;
}

/**
 * Create grow automation response
 * Response from API when creating grow automation
 */
export interface CreateGrowAutomationResponse {
  /** Whether operation was successful */
  success: boolean;
  /** Created rules */
  created_rules: GrowAutomationRule[];
  /** Created schedules */
  created_schedules: GrowAutomationSchedule[];
  /** Created conditions */
  created_conditions: GrowAutomationCondition[];
  /** Error messages if any */
  errors?: string[];
} 