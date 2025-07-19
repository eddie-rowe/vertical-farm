/**
 * Layer Two: Grow Automation Hook
 * React hook for managing grow automation that bridges with device controls
 */

import { useState, useEffect, useCallback } from "react";
import {
  GrowAutomationRule,
  GrowAutomationSchedule,
  GrowAutomationCondition,
  GrowAutomationExecution,
  AutomationStatus,
  CreateAutomationSchedule,
  CreateAutomationCondition,
  GrowDeviceAssignment,
  DeviceAction,
} from "@/types/grow-automation";

interface UseGrowAutomationOptions {
  growId: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseGrowAutomationReturn {
  // Data
  rules: GrowAutomationRule[];
  schedules: GrowAutomationSchedule[];
  conditions: GrowAutomationCondition[];
  executions: GrowAutomationExecution[];
  deviceAssignments: GrowDeviceAssignment[];
  status: AutomationStatus | null;

  // Loading states
  isLoading: boolean;
  isInitializing: boolean;
  isExecuting: boolean;

  // Error handling
  error: string | null;

  // Actions
  initializeAutomation: () => Promise<boolean>;
  toggleAutomation: (enabled: boolean) => Promise<boolean>;
  createSchedule: (scheduleData: CreateAutomationSchedule) => Promise<boolean>;
  updateSchedule: (
    scheduleId: string,
    scheduleData: Partial<CreateAutomationSchedule>,
  ) => Promise<boolean>;
  deleteSchedule: (scheduleId: string) => Promise<boolean>;
  createCondition: (
    conditionData: CreateAutomationCondition,
  ) => Promise<boolean>;
  updateCondition: (
    conditionId: string,
    conditionData: Partial<CreateAutomationCondition>,
  ) => Promise<boolean>;
  deleteCondition: (conditionId: string) => Promise<boolean>;
  manualExecute: (
    deviceAssignmentId: string,
    action: DeviceAction,
    reason?: string,
  ) => Promise<boolean>;
  refreshData: () => Promise<void>;

  // Utilities
  getSchedulesByDevice: (
    deviceAssignmentId: string,
  ) => GrowAutomationSchedule[];
  getConditionsByDevice: (
    deviceAssignmentId: string,
  ) => GrowAutomationCondition[];
  getRecentExecutions: (limit?: number) => GrowAutomationExecution[];
  isDeviceAutomated: (deviceAssignmentId: string) => boolean;
}

export function useGrowAutomation({
  growId,
  autoRefresh = true,
  refreshInterval = 30000,
}: UseGrowAutomationOptions): UseGrowAutomationReturn {
  // State management
  const [rules, setRules] = useState<GrowAutomationRule[]>([]);
  const [schedules, setSchedules] = useState<GrowAutomationSchedule[]>([]);
  const [conditions, setConditions] = useState<GrowAutomationCondition[]>([]);
  const [executions, setExecutions] = useState<GrowAutomationExecution[]>([]);
  const [deviceAssignments, setDeviceAssignments] = useState<
    GrowDeviceAssignment[]
  >([]);
  const [status, setStatus] = useState<AutomationStatus | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // API base URL
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // Get authentication token
  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem("supabase.auth.token");
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  }, []);

  // Fetch all automation data
  const fetchAutomationData = useCallback(async () => {
    if (!growId) return;

    setIsLoading(true);
    setError(null);

    try {
      const headers = getAuthHeaders();

      // Fetch main automation data
      const automationResponse = await fetch(
        `${API_BASE}/api/v1/grow-automation/grows/${growId}/automation`,
        { headers },
      );

      if (!automationResponse.ok) {
        throw new Error(
          `Failed to fetch automation data: ${automationResponse.statusText}`,
        );
      }

      const automationData = await automationResponse.json();

      // Update state
      setRules(automationData.rules || []);
      setSchedules(automationData.schedules || []);
      setConditions(automationData.conditions || []);
      setExecutions(automationData.executions || []);
      setDeviceAssignments(automationData.device_assignments || []);
      setStatus(automationData.status || null);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch automation data";
      setError(errorMessage);
      console.error("Error fetching automation data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [growId, API_BASE, getAuthHeaders]);

  // Initialize automation for grow
  const initializeAutomation = useCallback(async (): Promise<boolean> => {
    if (!growId) return false;

    setIsInitializing(true);
    setError(null);

    try {
      const headers = getAuthHeaders();

      const response = await fetch(
        `${API_BASE}/api/v1/grow-automation/grows/${growId}/automation/initialize`,
        {
          method: "POST",
          headers,
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to initialize automation");
      }

      const result = await response.json();

      if (result.success) {
        await fetchAutomationData(); // Refresh data
        return true;
      } else {
        throw new Error(result.error || "Initialization failed");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to initialize automation";
      setError(errorMessage);
      console.error("Error initializing automation:", err);
      return false;
    } finally {
      setIsInitializing(false);
    }
  }, [growId, API_BASE, getAuthHeaders, fetchAutomationData]);

  // Toggle automation on/off
  const toggleAutomation = useCallback(
    async (enabled: boolean): Promise<boolean> => {
      if (!growId) return false;

      setError(null);

      try {
        const headers = getAuthHeaders();

        const response = await fetch(
          `${API_BASE}/api/v1/grow-automation/grows/${growId}/automation/toggle?enabled=${enabled}`,
          {
            method: "POST",
            headers,
          },
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || "Failed to toggle automation");
        }

        const result = await response.json();

        if (result.success) {
          await fetchAutomationData(); // Refresh data
          return true;
        } else {
          throw new Error(result.error || "Toggle failed");
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to toggle automation";
        setError(errorMessage);
        console.error("Error toggling automation:", err);
        return false;
      }
    },
    [growId, API_BASE, getAuthHeaders, fetchAutomationData],
  );

  // Create automation schedule
  const createSchedule = useCallback(
    async (scheduleData: CreateAutomationSchedule): Promise<boolean> => {
      if (!growId) return false;

      setError(null);

      try {
        const headers = getAuthHeaders();

        const response = await fetch(
          `${API_BASE}/api/v1/grow-automation/grows/${growId}/automation/schedules`,
          {
            method: "POST",
            headers,
            body: JSON.stringify(scheduleData),
          },
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || "Failed to create schedule");
        }

        const result = await response.json();

        if (result.success) {
          await fetchAutomationData(); // Refresh data
          return true;
        } else {
          throw new Error("Schedule creation failed");
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to create schedule";
        setError(errorMessage);
        console.error("Error creating schedule:", err);
        return false;
      }
    },
    [growId, API_BASE, getAuthHeaders, fetchAutomationData],
  );

  // Update automation schedule
  const updateSchedule = useCallback(
    async (
      scheduleId: string,
      scheduleData: Partial<CreateAutomationSchedule>,
    ): Promise<boolean> => {
      setError(null);

      try {
        const headers = getAuthHeaders();

        const response = await fetch(
          `${API_BASE}/api/v1/grow-automation/automation/schedules/${scheduleId}`,
          {
            method: "PUT",
            headers,
            body: JSON.stringify(scheduleData),
          },
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || "Failed to update schedule");
        }

        const result = await response.json();

        if (result.success) {
          await fetchAutomationData(); // Refresh data
          return true;
        } else {
          throw new Error("Schedule update failed");
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update schedule";
        setError(errorMessage);
        console.error("Error updating schedule:", err);
        return false;
      }
    },
    [API_BASE, getAuthHeaders, fetchAutomationData],
  );

  // Delete automation schedule
  const deleteSchedule = useCallback(
    async (scheduleId: string): Promise<boolean> => {
      setError(null);

      try {
        const headers = getAuthHeaders();

        const response = await fetch(
          `${API_BASE}/api/v1/grow-automation/automation/schedules/${scheduleId}`,
          {
            method: "DELETE",
            headers,
          },
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || "Failed to delete schedule");
        }

        const result = await response.json();

        if (result.success) {
          await fetchAutomationData(); // Refresh data
          return true;
        } else {
          throw new Error("Schedule deletion failed");
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to delete schedule";
        setError(errorMessage);
        console.error("Error deleting schedule:", err);
        return false;
      }
    },
    [API_BASE, getAuthHeaders, fetchAutomationData],
  );

  // Create automation condition
  const createCondition = useCallback(
    async (conditionData: CreateAutomationCondition): Promise<boolean> => {
      if (!growId) return false;

      setError(null);

      try {
        const headers = getAuthHeaders();

        const response = await fetch(
          `${API_BASE}/api/v1/grow-automation/grows/${growId}/automation/conditions`,
          {
            method: "POST",
            headers,
            body: JSON.stringify(conditionData),
          },
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || "Failed to create condition");
        }

        const result = await response.json();

        if (result.success) {
          await fetchAutomationData(); // Refresh data
          return true;
        } else {
          throw new Error("Condition creation failed");
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to create condition";
        setError(errorMessage);
        console.error("Error creating condition:", err);
        return false;
      }
    },
    [growId, API_BASE, getAuthHeaders, fetchAutomationData],
  );

  // Update automation condition
  const updateCondition = useCallback(
    async (
      conditionId: string,
      conditionData: Partial<CreateAutomationCondition>,
    ): Promise<boolean> => {
      setError(null);

      try {
        const headers = getAuthHeaders();

        const response = await fetch(
          `${API_BASE}/api/v1/grow-automation/automation/conditions/${conditionId}`,
          {
            method: "PUT",
            headers,
            body: JSON.stringify(conditionData),
          },
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || "Failed to update condition");
        }

        const result = await response.json();

        if (result.success) {
          await fetchAutomationData(); // Refresh data
          return true;
        } else {
          throw new Error("Condition update failed");
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update condition";
        setError(errorMessage);
        console.error("Error updating condition:", err);
        return false;
      }
    },
    [API_BASE, getAuthHeaders, fetchAutomationData],
  );

  // Delete automation condition
  const deleteCondition = useCallback(
    async (conditionId: string): Promise<boolean> => {
      setError(null);

      try {
        const headers = getAuthHeaders();

        const response = await fetch(
          `${API_BASE}/api/v1/grow-automation/automation/conditions/${conditionId}`,
          {
            method: "DELETE",
            headers,
          },
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || "Failed to delete condition");
        }

        const result = await response.json();

        if (result.success) {
          await fetchAutomationData(); // Refresh data
          return true;
        } else {
          throw new Error("Condition deletion failed");
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to delete condition";
        setError(errorMessage);
        console.error("Error deleting condition:", err);
        return false;
      }
    },
    [API_BASE, getAuthHeaders, fetchAutomationData],
  );

  // Manually execute automation action
  const manualExecute = useCallback(
    async (
      deviceAssignmentId: string,
      action: DeviceAction,
      reason?: string,
    ): Promise<boolean> => {
      if (!growId) return false;

      setIsExecuting(true);
      setError(null);

      try {
        const headers = getAuthHeaders();

        const response = await fetch(
          `${API_BASE}/api/v1/grow-automation/grows/${growId}/automation/manual-execute`,
          {
            method: "POST",
            headers,
            body: JSON.stringify({
              device_assignment_id: deviceAssignmentId,
              action,
              reason,
            }),
          },
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || "Failed to execute action");
        }

        const result = await response.json();

        if (result.success) {
          await fetchAutomationData(); // Refresh data to get new execution
          return true;
        } else {
          throw new Error(result.message || "Manual execution failed");
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to execute action manually";
        setError(errorMessage);
        console.error("Error executing manual action:", err);
        return false;
      } finally {
        setIsExecuting(false);
      }
    },
    [growId, API_BASE, getAuthHeaders, fetchAutomationData],
  );

  // Refresh automation data
  const refreshData = useCallback(async () => {
    await fetchAutomationData();
  }, [fetchAutomationData]);

  // Utility functions
  const getSchedulesByDevice = useCallback(
    (deviceAssignmentId: string): GrowAutomationSchedule[] => {
      return schedules.filter(
        (schedule) => schedule.device_assignment_id === deviceAssignmentId,
      );
    },
    [schedules],
  );

  const getConditionsByDevice = useCallback(
    (deviceAssignmentId: string): GrowAutomationCondition[] => {
      return conditions.filter(
        (condition) => condition.device_assignment_id === deviceAssignmentId,
      );
    },
    [conditions],
  );

  const getRecentExecutions = useCallback(
    (limit: number = 10): GrowAutomationExecution[] => {
      return executions
        .sort(
          (a, b) =>
            new Date(b.executed_at).getTime() -
            new Date(a.executed_at).getTime(),
        )
        .slice(0, limit);
    },
    [executions],
  );

  const isDeviceAutomated = useCallback(
    (deviceAssignmentId: string): boolean => {
      const hasSchedules = schedules.some(
        (s) => s.device_assignment_id === deviceAssignmentId && s.is_active,
      );
      const hasConditions = conditions.some(
        (c) => c.device_assignment_id === deviceAssignmentId && c.is_active,
      );
      const hasRules = rules.some(
        (r) => r.device_assignment_id === deviceAssignmentId && r.is_active,
      );

      return hasSchedules || hasConditions || hasRules;
    },
    [schedules, conditions, rules],
  );

  // Effects
  useEffect(() => {
    if (growId) {
      fetchAutomationData();
    }
  }, [growId, fetchAutomationData]);

  useEffect(() => {
    if (!autoRefresh || !growId) return;

    const interval = setInterval(() => {
      fetchAutomationData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, growId, fetchAutomationData]);

  return {
    // Data
    rules,
    schedules,
    conditions,
    executions,
    deviceAssignments,
    status,

    // Loading states
    isLoading,
    isInitializing,
    isExecuting,

    // Error handling
    error,

    // Actions
    initializeAutomation,
    toggleAutomation,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    createCondition,
    updateCondition,
    deleteCondition,
    manualExecute,
    refreshData,

    // Utilities
    getSchedulesByDevice,
    getConditionsByDevice,
    getRecentExecutions,
    isDeviceAutomated,
  };
}
