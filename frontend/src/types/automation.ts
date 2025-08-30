export type UUID = string;

// Automation task types that match the database enum
export type AutomationTaskType =
  | "schedule_progression"
  | "environmental_check"
  | "watering_cycle"
  | "lighting_cycle"
  | "harvest_readiness"
  | "recipe_application"
  | "alert_generation"
  | "sensor_aggregation"
  | "device_control";

// Task execution status
export type TaskStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled";

// Alert severity levels
export type AlertSeverity = "info" | "warning" | "error";

// Automation trigger types
export type TriggerType =
  | "time_based"
  | "sensor_based"
  | "event_based"
  | "schedule_based";

// Task execution log interface
export interface TaskExecutionLog {
  id: string;
  task_id: string;
  task_type: string;
  queue_name: string;
  status: TaskStatus;
  payload: Record<string, unknown>;
  result?: Record<string, unknown>;
  error_message?: string;
  schedule_id?: UUID;
  shelf_id?: UUID;
  automation_task_type?: AutomationTaskType;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

// Automation trigger interface
export interface AutomationTrigger {
  id: UUID;
  name: string;
  trigger_type: TriggerType;
  conditions: Record<string, unknown>;
  actions: Record<string, unknown>;
  farm_id: UUID;
  is_active: boolean;
  last_triggered_at?: string;
  created_at: string;
  updated_at: string;
}

// Enhanced schedule interface with automation fields
export interface ScheduleWithAutomation {
  id: UUID;
  shelf_id: UUID;
  grow_recipe_id: UUID;
  start_date: string;
  estimated_end_date?: string;
  actual_end_date?: string;
  status: "planned" | "active" | "completed" | "aborted";
  notes?: string;
  automation_enabled: boolean;
  last_automation_check?: string;
  next_automation_action?: string;
  created_at: string;
  updated_at: string;
}

// Automation dashboard summary
export interface AutomationDashboard {
  farm_id: UUID;
  farm_name: string;
  total_active_schedules: number;
  pending_tasks: number;
  processing_tasks: number;
  failed_tasks_today: number;
  avg_task_duration_seconds?: number;
  last_task_created?: string;
}

// Recent automation action
export interface RecentAction {
  type: AutomationTaskType;
  status: TaskStatus;
  timestamp: string;
  message?: string;
  schedule_id?: UUID;
  shelf_id?: UUID;
}

// Environmental alert
export interface EnvironmentalAlert {
  type: string;
  message: string;
  severity: AlertSeverity;
  timestamp: string;
  schedule_id?: UUID;
  shelf_id?: UUID;
}

// Queue management
export interface QueueStats {
  queue_name: string;
  total_messages: number;
  oldest_message_age?: string;
  newest_message_age?: string;
}

// API request/response types
export interface QueueTaskRequest {
  task_type: AutomationTaskType;
  schedule_id?: UUID;
  shelf_id?: UUID;
  payload?: Record<string, unknown>;
  delay_seconds?: number;
}

export interface QueueTaskResponse {
  task_id: UUID;
  message: string;
}

// Automation status for frontend components
export interface AutomationStatus {
  id: string;
  schedule_id: UUID;
  automation_enabled: boolean;
  last_automation_check?: string;
  next_automation_action?: string;
  pending_tasks: number;
  processing_tasks: number;
  failed_tasks_today: number;
  recent_actions: RecentAction[];
  environmental_alerts: EnvironmentalAlert[];
}
