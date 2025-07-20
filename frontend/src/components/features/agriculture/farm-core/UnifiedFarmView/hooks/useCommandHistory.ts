import { useState, useCallback, useEffect, useRef } from "react";
import { toast } from "react-hot-toast";

import { CommandHistory, Command } from "../utils/commands";

export const useCommandHistory = (maxHistorySize: number = 50) => {
  const commandHistory = useRef(new CommandHistory(maxHistorySize));
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [undoDescription, setUndoDescription] = useState<string | null>(null);
  const [redoDescription, setRedoDescription] = useState<string | null>(null);

  const updateState = useCallback(() => {
    const history = commandHistory.current;
    setCanUndo(history.canUndo());
    setCanRedo(history.canRedo());
    setUndoDescription(history.getUndoDescription());
    setRedoDescription(history.getRedoDescription());
  }, []);

  const executeCommand = useCallback(
    async (command: Command) => {
      try {
        await commandHistory.current.execute(command);
        updateState();
        toast.success(command.description);
      } catch (error) {
        toast.error(`Failed to execute: ${command.description}`);
        console.error("Command execution failed:", error);
      }
    },
    [updateState],
  );

  const undo = useCallback(async () => {
    const history = commandHistory.current;
    if (!history.canUndo()) return;

    const description = history.getUndoDescription();
    try {
      await history.undo();
      updateState();
      toast.success(`Undid: ${description}`);
    } catch (error) {
      toast.error(`Failed to undo: ${description}`);
      console.error("Undo failed:", error);
    }
  }, [updateState]);

  const redo = useCallback(async () => {
    const history = commandHistory.current;
    if (!history.canRedo()) return;

    const description = history.getRedoDescription();
    try {
      await history.redo();
      updateState();
      toast.success(`Redid: ${description}`);
    } catch (error) {
      toast.error(`Failed to redo: ${description}`);
      console.error("Redo failed:", error);
    }
  }, [updateState]);

  const clearHistory = useCallback(() => {
    commandHistory.current.clear();
    updateState();
    toast.success("Command history cleared");
  }, [updateState]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Ctrl+Z (Undo) or Cmd+Z (Mac)
      if (
        (event.ctrlKey || event.metaKey) &&
        event.key === "z" &&
        !event.shiftKey
      ) {
        event.preventDefault();
        undo();
        return;
      }

      // Check for Ctrl+Y (Redo) or Ctrl+Shift+Z or Cmd+Shift+Z (Mac)
      if (
        ((event.ctrlKey || event.metaKey) && event.key === "y") ||
        ((event.ctrlKey || event.metaKey) &&
          event.shiftKey &&
          event.key === "Z")
      ) {
        event.preventDefault();
        redo();
        return;
      }
    };

    // Only add event listener when component is active
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [undo, redo]);

  // Initialize state
  useEffect(() => {
    updateState();
  }, [updateState]);

  return {
    executeCommand,
    undo,
    redo,
    clearHistory,
    canUndo,
    canRedo,
    undoDescription,
    redoDescription,
    historySize: commandHistory.current.getHistorySize(),
  };
};
