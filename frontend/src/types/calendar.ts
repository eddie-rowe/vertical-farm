export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  eventType: EventType;
  priority: EventPriority;
  status: EventStatus;
  farmId?: string;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
  relatedEntityId?: string; // Device ID, Team Member ID, Customer ID, etc.
  relatedEntityType?: string;
  metadata?: Record<string, any>;
}

export type EventType = "operations" | "devices" | "team" | "customer";

export type EventPriority = "low" | "medium" | "high" | "critical";

export type EventStatus =
  | "scheduled"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "overdue";

// Operations Events
export interface OperationsEvent extends Omit<CalendarEvent, "eventType"> {
  eventType: "operations";
  operationType: OperationType;
  crops?: string[];
  rowIds?: string[];
  rackIds?: string[];
  shelfIds?: string[];
  expectedDuration?: number; // minutes
  actualDuration?: number; // minutes
  notes?: string;
}

export type OperationType =
  | "germination_start"
  | "move_to_grow"
  | "move_to_harvest"
  | "harvest"
  | "seeding"
  | "transplanting"
  | "pruning"
  | "cleaning"
  | "maintenance";

// Device Events
export interface DeviceEvent extends Omit<CalendarEvent, "eventType"> {
  eventType: "devices";
  deviceType: DeviceType;
  deviceIds: string[];
  action: DeviceAction;
  automationRuleId?: string;
  targetValue?: number;
  currentValue?: number;
  isAutomated: boolean;
}

export type DeviceType =
  | "lights"
  | "irrigation_pump"
  | "fan"
  | "sensor"
  | "heater"
  | "humidifier";

export type DeviceAction =
  | "turn_on"
  | "turn_off"
  | "set_intensity"
  | "start_cycle"
  | "stop_cycle"
  | "maintenance_mode"
  | "calibration";

// Team Events
export interface TeamEvent extends Omit<CalendarEvent, "eventType"> {
  eventType: "team";
  teamEventType: TeamEventType;
  assignedTo: string[];
  shiftType?: ShiftType;
  departmentId?: string;
  skillsRequired?: string[];
  isRecurring?: boolean;
  recurrencePattern?: RecurrencePattern;
}

export type TeamEventType =
  | "work_schedule"
  | "maintenance_window"
  | "training_session"
  | "team_meeting"
  | "break_time"
  | "overtime";

export type ShiftType = "morning" | "afternoon" | "evening" | "night";

// Customer Events
export interface CustomerEvent extends Omit<CalendarEvent, "eventType"> {
  eventType: "customer";
  customerEventType: CustomerEventType;
  customerId: string;
  orderIds?: string[];
  products?: string[];
  quantity?: number;
  deliveryAddress?: string;
  contactPerson?: string;
  contactPhone?: string;
  specialInstructions?: string;
}

export type CustomerEventType =
  | "delivery_window"
  | "pickup_scheduled"
  | "order_deadline"
  | "customer_visit"
  | "quality_check";

// Recurrence Pattern
export interface RecurrencePattern {
  frequency: "daily" | "weekly" | "monthly";
  interval: number; // every N days/weeks/months
  daysOfWeek?: number[]; // 0 = Sunday, 1 = Monday, etc.
  endDate?: Date;
  occurrences?: number;
}

// Calendar View Types - Updated for FullCalendar (migrated from react-big-calendar)
// FullCalendar uses different view names than react-big-calendar:
// - month → dayGridMonth
// - week → timeGridWeek
// - work_week → timeGridWeek (with business hours)
// - day → timeGridDay
// - agenda → listWeek
export type CalendarView = "month" | "week" | "work_week" | "day" | "agenda";

// Event Overlay Configuration
export interface EventOverlay {
  id: EventType;
  label: string;
  enabled: boolean;
  color: string;
  icon: string;
  description: string;
}

// Calendar Filters
export interface CalendarFilters {
  eventTypes: EventType[];
  priorities: EventPriority[];
  statuses: EventStatus[];
  farmIds: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  assignedTo?: string[];
  searchTerm?: string;
}

// Calendar Configuration
export interface CalendarConfig {
  defaultView: CalendarView;
  timeSlotMinutes: number;
  workingHours: {
    start: number; // 0-23
    end: number; // 0-23
  };
  overlays: EventOverlay[];
  autoRefreshInterval: number; // milliseconds
  enableNotifications: boolean;
  showWeekends: boolean;
}

// Event Creation/Update Payload
export interface CreateEventPayload {
  title: string;
  description?: string;
  start: Date;
  end: Date;
  eventType: EventType;
  priority?: EventPriority;
  farmId?: string;
  relatedEntityId?: string;
  metadata?: Record<string, any>;
}

export interface UpdateEventPayload extends Partial<CreateEventPayload> {
  id: string;
  status?: EventStatus;
}

// Calendar API Response Types
export interface CalendarEventsResponse {
  events: CalendarEvent[];
  totalCount: number;
  hasMore: boolean;
  nextCursor?: string;
}

export interface EventConflict {
  conflictingEventId: string;
  conflictType: "time_overlap" | "resource_conflict" | "dependency_conflict";
  message: string;
  severity: "warning" | "error";
}
