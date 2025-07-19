"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { FarmPageData } from "@/types/farm-layout";
import { FeedbackMessage } from "@/components/features/agriculture/farm-core/ActionFeedback";

export interface StateAction {
  type: string;
  payload: any;
  timestamp: number;
  description: string;
  undoable?: boolean;
}

export interface StateSnapshot {
  farmData: FarmPageData;
  timestamp: number;
  actionDescription: string;
}

interface StateManagerState {
  current: FarmPageData;
  history: StateSnapshot[];
  future: StateSnapshot[];
  maxHistorySize: number;
  isLoading: boolean;
  error: string | null;
  lastSaved: number | null;
  isDirty: boolean;
}

type StateManagerAction =
  | { type: "SET_FARM_DATA"; payload: FarmPageData; description?: string }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "MARK_SAVED" }
  | { type: "CLEAR_HISTORY" }
  | { type: "RESTORE_FROM_STORAGE"; payload: FarmPageData };

function stateManagerReducer(
  state: StateManagerState,
  action: StateManagerAction,
): StateManagerState {
  switch (action.type) {
    case "SET_FARM_DATA": {
      const newSnapshot: StateSnapshot = {
        farmData: state.current,
        timestamp: Date.now(),
        actionDescription: action.description || "Farm data updated",
      };

      // Add current state to history if it's different
      const newHistory =
        JSON.stringify(state.current) !== JSON.stringify(action.payload)
          ? [...state.history, newSnapshot].slice(-state.maxHistorySize)
          : state.history;

      return {
        ...state,
        current: action.payload,
        history: newHistory,
        future: [], // Clear future when new action is performed
        isDirty: true,
        error: null,
      };
    }

    case "UNDO": {
      if (state.history.length === 0) return state;

      const previousSnapshot = state.history[state.history.length - 1];
      const newHistory = state.history.slice(0, -1);

      const currentSnapshot: StateSnapshot = {
        farmData: state.current,
        timestamp: Date.now(),
        actionDescription: "Undo operation",
      };

      return {
        ...state,
        current: previousSnapshot.farmData,
        history: newHistory,
        future: [currentSnapshot, ...state.future].slice(
          0,
          state.maxHistorySize,
        ),
        isDirty: true,
      };
    }

    case "REDO": {
      if (state.future.length === 0) return state;

      const nextSnapshot = state.future[0];
      const newFuture = state.future.slice(1);

      const currentSnapshot: StateSnapshot = {
        farmData: state.current,
        timestamp: Date.now(),
        actionDescription: "Redo operation",
      };

      return {
        ...state,
        current: nextSnapshot.farmData,
        history: [...state.history, currentSnapshot].slice(
          -state.maxHistorySize,
        ),
        future: newFuture,
        isDirty: true,
      };
    }

    case "SET_LOADING":
      return { ...state, isLoading: action.payload };

    case "SET_ERROR":
      return { ...state, error: action.payload, isLoading: false };

    case "MARK_SAVED":
      return { ...state, lastSaved: Date.now(), isDirty: false };

    case "CLEAR_HISTORY":
      return { ...state, history: [], future: [] };

    case "RESTORE_FROM_STORAGE":
      return {
        ...state,
        current: action.payload,
        isDirty: false,
        error: null,
      };

    default:
      return state;
  }
}

export interface UseAdvancedStateManagerOptions {
  maxHistorySize?: number;
  autoSaveInterval?: number;
  persistKey?: string;
  onSave?: (data: FarmPageData) => Promise<void>;
  onError?: (error: string) => void;
  enableOptimisticUpdates?: boolean;
}

export const useAdvancedStateManager = (
  initialData: FarmPageData,
  options: UseAdvancedStateManagerOptions = {},
) => {
  const {
    maxHistorySize = 50,
    autoSaveInterval = 30000, // 30 seconds
    persistKey = "farmData",
    onSave,
    onError,
    enableOptimisticUpdates = true,
  } = options;

  const [state, dispatch] = useReducer(stateManagerReducer, {
    current: initialData,
    history: [],
    future: [],
    maxHistorySize,
    isLoading: false,
    error: null,
    lastSaved: null,
    isDirty: false,
  });

  const [feedbackMessages, setFeedbackMessages] = useState<FeedbackMessage[]>(
    [],
  );
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const optimisticUpdatesRef = useRef<Map<string, any>>(new Map());

  // Add feedback message
  const addFeedback = useCallback((message: FeedbackMessage) => {
    setFeedbackMessages((prev) => [...prev, message]);
  }, []);

  // Remove feedback message
  const removeFeedback = useCallback((id: string) => {
    setFeedbackMessages((prev) => prev.filter((msg) => msg.id !== id));
  }, []);

  // Save current state
  const save = useCallback(async () => {
    if (!onSave) return;

    dispatch({ type: "SET_LOADING", payload: true });

    const saveId = Date.now().toString();
    addFeedback({
      id: saveId,
      type: "loading",
      title: "Saving changes...",
      persistent: true,
    });

    try {
      await onSave(state.current);
      dispatch({ type: "MARK_SAVED" });

      removeFeedback(saveId);
      addFeedback({
        id: Date.now().toString(),
        type: "success",
        title: "Changes saved",
        message: "All changes have been successfully saved",
      });
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload: error instanceof Error ? error.message : "Save failed",
      });

      removeFeedback(saveId);
      addFeedback({
        id: Date.now().toString(),
        type: "error",
        title: "Save failed",
        message:
          error instanceof Error
            ? error.message
            : "An error occurred while saving",
      });

      onError?.(error instanceof Error ? error.message : "Save failed");
    }
  }, [onSave, state.current, onError, addFeedback, removeFeedback]);

  // Auto-save functionality
  useEffect(() => {
    if (!state.isDirty || !onSave) return;

    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      save();
    }, autoSaveInterval);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [state.isDirty, autoSaveInterval, save]);

  // Persistence to localStorage
  useEffect(() => {
    if (persistKey && state.isDirty) {
      try {
        localStorage.setItem(persistKey, JSON.stringify(state.current));
      } catch (error) {
        console.error("Failed to persist to localStorage:", error);
      }
    }
  }, [state.current, persistKey, state.isDirty]);

  // Load from localStorage on mount
  useEffect(() => {
    if (persistKey) {
      try {
        const stored = localStorage.getItem(persistKey);
        if (stored) {
          const parsedData = JSON.parse(stored);
          dispatch({ type: "RESTORE_FROM_STORAGE", payload: parsedData });
        }
      } catch (error) {
        console.error("Failed to load from localStorage:", error);
      }
    }
  }, [persistKey]);

  // Update farm data with optional description
  const updateFarmData = useCallback(
    (newData: FarmPageData, description?: string, optimistic = false) => {
      if (optimistic && enableOptimisticUpdates) {
        // Store optimistic update
        const updateId = Date.now().toString();
        optimisticUpdatesRef.current.set(updateId, {
          previous: state.current,
          description: description || "Optimistic update",
        });

        // Apply optimistic update immediately
        dispatch({
          type: "SET_FARM_DATA",
          payload: newData,
          description: `${description || "Update"} (optimistic)`,
        });

        return updateId;
      } else {
        dispatch({ type: "SET_FARM_DATA", payload: newData, description });
        return null;
      }
    },
    [state.current, enableOptimisticUpdates],
  );

  // Confirm optimistic update
  const confirmOptimisticUpdate = useCallback(
    (updateId: string) => {
      optimisticUpdatesRef.current.delete(updateId);
      addFeedback({
        id: Date.now().toString(),
        type: "success",
        title: "Update confirmed",
        message: "Changes have been successfully applied",
      });
    },
    [addFeedback],
  );

  // Rollback optimistic update
  const rollbackOptimisticUpdate = useCallback(
    (updateId: string) => {
      const update = optimisticUpdatesRef.current.get(updateId);
      if (update) {
        dispatch({
          type: "SET_FARM_DATA",
          payload: update.previous,
          description: `Rollback: ${update.description}`,
        });
        optimisticUpdatesRef.current.delete(updateId);

        addFeedback({
          id: Date.now().toString(),
          type: "warning",
          title: "Update rolled back",
          message: "Changes have been reverted due to an error",
        });
      }
    },
    [addFeedback],
  );

  // Undo last action
  const undo = useCallback(() => {
    if (state.history.length > 0) {
      dispatch({ type: "UNDO" });
      addFeedback({
        id: Date.now().toString(),
        type: "info",
        title: "Action undone",
        message: state.history[state.history.length - 1].actionDescription,
      });
    }
  }, [state.history, addFeedback]);

  // Redo last undone action
  const redo = useCallback(() => {
    if (state.future.length > 0) {
      dispatch({ type: "REDO" });
      addFeedback({
        id: Date.now().toString(),
        type: "info",
        title: "Action redone",
        message: state.future[0].actionDescription,
      });
    }
  }, [state.future, addFeedback]);

  // Clear all feedback
  const clearFeedback = useCallback(() => {
    setFeedbackMessages([]);
  }, []);

  // Get state info
  const getStateInfo = useCallback(() => {
    return {
      canUndo: state.history.length > 0,
      canRedo: state.future.length > 0,
      isDirty: state.isDirty,
      isLoading: state.isLoading,
      error: state.error,
      lastSaved: state.lastSaved,
      historyLength: state.history.length,
      futureLength: state.future.length,
      hasOptimisticUpdates: optimisticUpdatesRef.current.size > 0,
    };
  }, [state]);

  return {
    // Current state
    farmData: state.current,

    // State management
    updateFarmData,
    undo,
    redo,
    save,

    // Optimistic updates
    confirmOptimisticUpdate,
    rollbackOptimisticUpdate,

    // Feedback system
    feedbackMessages,
    addFeedback,
    removeFeedback,
    clearFeedback,

    // State info
    ...getStateInfo(),

    // Raw state for debugging
    _state: state,
  };
};
