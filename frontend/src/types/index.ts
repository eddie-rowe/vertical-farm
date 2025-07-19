/**
 * Main types export file
 * Exports all types from the organized type structure
 */

// Common types used across the application
export * from "./common";

// Farm-related types (layout, recipes, etc.)
export * from "./farm";

// Device-related types (core, assignments, Home Assistant)
export * from "./devices";

// Automation-related types (general and grow-specific)
export * from "./automation";

// Legacy exports for backwards compatibility
// These can be removed once all imports are updated
export type { UUID } from "./common";
export type {
  Farm,
  Row,
  Rack,
  Shelf,
  SensorDevice,
  FarmPageData,
  FarmAreaData,
  GerminationData,
  TransplantCandidate,
} from "./farm/layout";

export type {
  Species,
  GrowRecipe,
  LightingSchedule,
  CreateGrowRecipeInput,
  UpdateGrowRecipeInput,
  CreateSpeciesInput,
  UpdateSpeciesInput,
  GrowRecipeFilters,
  PaginatedGrowRecipes,
} from "./farm/recipes";

export type {
  DeviceType,
  DeviceState,
  DeviceAction,
  DeviceCapabilities,
  DeviceAttributes,
  DeviceFilter,
} from "./devices/core";

export type {
  HADevice,
  HADeviceStateData,
  HAServiceCall,
  HAConfig,
  HAConnectionStatus,
} from "./devices/home-assistant";

export type {
  DeviceAssignment,
  DeviceAssignmentRequest,
  CreateDeviceAssignmentRequest,
  UpdateDeviceAssignmentRequest,
  AssignmentTarget,
  ElementType,
  DeviceBrowserState,
  DeviceData,
  LocationDevices,
} from "./devices/assignments";

// Legacy device layer types (TODO: move to new structure)
export type {
  DeviceLayerState,
  DeviceOverlayProps,
  DeviceWebSocketMessage,
  DeviceStateUpdate,
  DeviceControlResponse,
  DeviceControlPanelProps,
  DeviceStatusIndicatorProps,
  GetLocationDevicesResponse,
  ControlDeviceRequest,
  ControlDeviceResponse,
  DeviceSortBy,
  SortOrder,
  EmergencyControlAction,
} from "./device-layer";

export type {
  AutomationTaskType,
  TaskStatus,
  AlertSeverity,
  TriggerType,
  TaskExecutionLog,
  AutomationTrigger,
  ScheduleWithAutomation,
  AutomationDashboard,
  RecentAction,
  EnvironmentalAlert,
  QueueStats,
  QueueTaskRequest,
  QueueTaskResponse,
  AutomationStatus,
} from "./automation/general";

export type {
  GrowAutomationRule,
  GrowAutomationSchedule,
  GrowAutomationCondition,
  GrowAutomationExecution,
  GrowDeviceProfile,
  GrowWithAutomation,
  GrowDeviceAssignment,
  GrowAutomationConfig,
  CreateGrowAutomationRule,
  CreateGrowAutomationSchedule,
  CreateGrowAutomationCondition,
  UpdateGrowAutomationRule,
  UpdateGrowAutomationSchedule,
  UpdateGrowAutomationCondition,
  AutomationTemplate,
  GrowAutomationStatus,
  AutomationWebSocketMessage,
  GetGrowAutomationResponse,
  CreateGrowAutomationResponse,
} from "./automation/grow";
