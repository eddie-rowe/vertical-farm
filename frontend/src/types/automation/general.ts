/**
 * General automation types
 * Base automation types used across the system
 */

import { UUID, BaseEntity, ExecutionStatus, Priority } from '../common';

/** Types of automation tasks that can be executed */
export type AutomationTaskType = 
  | 'schedule_progression'
  | 'environmental_check'
  | 'watering_cycle'
  | 'lighting_cycle'
  | 'harvest_readiness'
  | 'recipe_application'
  | 'alert_generation'
  | 'sensor_aggregation'
  | 'device_control';

/** Status of task execution */
export type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

/** Alert severity levels */
export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical';

/** Types of automation triggers */
export type TriggerType = 'time_based' | 'sensor_based' | 'event_based' | 'schedule_based';

/** Schedule status types */
export type ScheduleStatus = 'planned' | 'active' | 'completed' | 'aborted' | 'paused';

/**
 * Task execution log
 * Records all automation task executions
 */
export interface TaskExecutionLog extends BaseEntity {
  /** ID of the task being executed */
  task_id: string;
  /** Type of task */
  task_type: string;
  /** Queue name where task was processed */
  queue_name: string;
  /** Current status of the task */
  status: TaskStatus;
  /** Input data for the task */
  payload: Record<string, unknown>;
  /** Output data from the task */
  result?: Record<string, unknown>;
  /** Error message if task failed */
  error_message?: string;
  /** Associated schedule ID */
  schedule_id?: UUID;
  /** Associated shelf ID */
  shelf_id?: UUID;
  /** Type of automation task */
  automation_task_type?: AutomationTaskType;
  /** When task execution started */
  started_at?: string;
  /** When task execution completed */
  completed_at?: string;
  /** Task priority */
  priority?: Priority;
  /** Task timeout in seconds */
  timeout_seconds?: number;
  /** Number of retry attempts */
  retry_count?: number;
  /** Maximum retry attempts */
  max_retries?: number;
}

/**
 * Automation trigger
 * Defines what triggers an automation to run
 */
export interface AutomationTrigger extends BaseEntity {
  /** Display name for the trigger */
  name: string;
  /** Type of trigger */
  trigger_type: TriggerType;
  /** Conditions that must be met */
  conditions: Record<string, unknown>;
  /** Actions to execute when triggered */
  actions: Record<string, unknown>;
  /** Farm this trigger belongs to */
  farm_id: UUID;
  /** Whether the trigger is currently active */
  is_active: boolean;
  /** When the trigger was last activated */
  last_triggered_at?: string;
  /** Next scheduled trigger time */
  next_trigger_at?: string;
  /** Trigger description */
  description?: string;
  /** Trigger priority */
  priority?: Priority;
  /** Cooldown period in minutes */
  cooldown_minutes?: number;
}

/**
 * Enhanced schedule with automation
 * Schedule with automation-specific fields
 */
export interface ScheduleWithAutomation extends BaseEntity {
  /** Shelf this schedule is for */
  shelf_id: UUID;
  /** Grow recipe being followed */
  grow_recipe_id: UUID;
  /** Schedule start date */
  start_date: string;
  /** Estimated completion date */
  estimated_end_date?: string;
  /** Actual completion date */
  actual_end_date?: string;
  /** Current status of the schedule */
  status: ScheduleStatus;
  /** Additional notes */
  notes?: string;
  /** Whether automation is enabled */
  automation_enabled: boolean;
  /** Last automation check timestamp */
  last_automation_check?: string;
  /** Next scheduled automation action */
  next_automation_action?: string;
  /** Schedule priority */
  priority?: Priority;
  /** Progress percentage (0-100) */
  progress_percentage?: number;
}

/**
 * Automation dashboard summary
 * Overview of automation system status
 */
export interface AutomationDashboard {
  /** Farm ID */
  farm_id: UUID;
  /** Farm name */
  farm_name: string;
  /** Total number of active schedules */
  total_active_schedules: number;
  /** Number of pending tasks */
  pending_tasks: number;
  /** Number of processing tasks */
  processing_tasks: number;
  /** Number of failed tasks today */
  failed_tasks_today: number;
  /** Average task execution time */
  avg_task_duration_seconds?: number;
  /** When the last task was created */
  last_task_created?: string;
  /** System health score (0-100) */
  system_health_score?: number;
  /** Number of active triggers */
  active_triggers: number;
  /** Number of alerts today */
  alerts_today: number;
}

/**
 * Recent automation action
 * Record of recently executed automation actions
 */
export interface RecentAction {
  /** Type of action */
  type: AutomationTaskType;
  /** Action status */
  status: TaskStatus;
  /** When the action occurred */
  timestamp: string;
  /** Action description */
  message?: string;
  /** Associated schedule ID */
  schedule_id?: UUID;
  /** Associated shelf ID */
  shelf_id?: UUID;
  /** Execution duration in seconds */
  duration_seconds?: number;
  /** Action priority */
  priority?: Priority;
}

/**
 * Environmental alert
 * Alert about environmental conditions
 */
export interface EnvironmentalAlert {
  /** Alert type */
  type: string;
  /** Alert message */
  message: string;
  /** Alert severity */
  severity: AlertSeverity;
  /** When the alert occurred */
  timestamp: string;
  /** Associated schedule ID */
  schedule_id?: UUID;
  /** Associated shelf ID */
  shelf_id?: UUID;
  /** Whether the alert has been acknowledged */
  acknowledged?: boolean;
  /** Who acknowledged the alert */
  acknowledged_by?: string;
  /** When the alert was acknowledged */
  acknowledged_at?: string;
  /** Alert ID for tracking */
  alert_id?: string;
}

/**
 * Queue statistics
 * Statistics about task queues
 */
export interface QueueStats {
  /** Name of the queue */
  queue_name: string;
  /** Total number of messages in queue */
  total_messages: number;
  /** Age of oldest message */
  oldest_message_age?: string;
  /** Age of newest message */
  newest_message_age?: string;
  /** Average processing time */
  avg_processing_time?: number;
  /** Success rate percentage */
  success_rate?: number;
  /** Error rate percentage */
  error_rate?: number;
}

/**
 * Queue task request
 * Request to add a task to the queue
 */
export interface QueueTaskRequest {
  /** Type of task to queue */
  task_type: AutomationTaskType;
  /** Associated schedule ID */
  schedule_id?: UUID;
  /** Associated shelf ID */
  shelf_id?: UUID;
  /** Task payload data */
  payload?: Record<string, unknown>;
  /** Delay before execution (seconds) */
  delay_seconds?: number;
  /** Task priority */
  priority?: Priority;
  /** Task timeout in seconds */
  timeout_seconds?: number;
  /** Maximum retry attempts */
  max_retries?: number;
}

/**
 * Queue task response
 * Response from queueing a task
 */
export interface QueueTaskResponse {
  /** Generated task ID */
  task_id: UUID;
  /** Response message */
  message: string;
  /** Estimated execution time */
  estimated_execution_time?: string;
  /** Queue position */
  queue_position?: number;
}

/**
 * Automation system status
 * Overall status of the automation system
 */
export interface AutomationStatus {
  /** Status ID */
  id: string;
  /** Associated schedule ID */
  schedule_id: UUID;
  /** Whether automation is enabled */
  automation_enabled: boolean;
  /** Last automation check */
  last_automation_check?: string;
  /** Next automation action */
  next_automation_action?: string;
  /** Number of pending tasks */
  pending_tasks: number;
  /** Number of processing tasks */
  processing_tasks: number;
  /** Number of failed tasks today */
  failed_tasks_today: number;
  /** Recent actions */
  recent_actions: RecentAction[];
  /** Environmental alerts */
  environmental_alerts: EnvironmentalAlert[];
  /** System uptime in seconds */
  uptime_seconds?: number;
  /** Last system restart */
  last_restart?: string;
} 