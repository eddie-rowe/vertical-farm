"use client";

import { useEffect } from "react";

interface KeyboardShortcutsConfig {
  onDelete?: () => void;
  onEscape?: () => void;
  onDuplicate?: () => void;
  onEdit?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onResetView?: () => void;
  onToggleDevices?: () => void;
  onToggleLabels?: () => void;
  onToggleFullscreen?: () => void;
  onSelectAll?: () => void;
  onSave?: () => void;
}

export function useKeyboardShortcuts(config: KeyboardShortcutsConfig) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement ||
        (event.target as HTMLElement)?.contentEditable === "true"
      ) {
        return;
      }

      const { key, ctrlKey, metaKey, shiftKey } = event;
      const isModifierPressed = ctrlKey || metaKey;

      switch (key.toLowerCase()) {
        case "delete":
        case "backspace":
          if (config.onDelete) {
            event.preventDefault();
            config.onDelete();
          }
          break;

        case "escape":
          if (config.onEscape) {
            event.preventDefault();
            config.onEscape();
          }
          break;

        case "d":
          if (isModifierPressed && config.onDuplicate) {
            event.preventDefault();
            config.onDuplicate();
          } else if (!isModifierPressed && config.onToggleDevices) {
            event.preventDefault();
            config.onToggleDevices();
          }
          break;

        case "e":
          if (!isModifierPressed && config.onEdit) {
            event.preventDefault();
            config.onEdit();
          }
          break;

        case "=":
        case "+":
          if (config.onZoomIn) {
            event.preventDefault();
            config.onZoomIn();
          }
          break;

        case "-":
          if (config.onZoomOut) {
            event.preventDefault();
            config.onZoomOut();
          }
          break;

        case "0":
          if (config.onResetView) {
            event.preventDefault();
            config.onResetView();
          }
          break;

        case "l":
          if (!isModifierPressed && config.onToggleLabels) {
            event.preventDefault();
            config.onToggleLabels();
          }
          break;

        case "f":
          if (!isModifierPressed && config.onToggleFullscreen) {
            event.preventDefault();
            config.onToggleFullscreen();
          }
          break;

        case "a":
          if (isModifierPressed && config.onSelectAll) {
            event.preventDefault();
            config.onSelectAll();
          }
          break;

        case "s":
          if (isModifierPressed && config.onSave) {
            event.preventDefault();
            config.onSave();
          }
          break;

        default:
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [config]);

  // Return shortcut information for UI display
  return {
    shortcuts: [
      { key: "Delete/Backspace", description: "Delete selected element" },
      { key: "Escape", description: "Clear selection" },
      { key: "Ctrl+D", description: "Duplicate element" },
      { key: "E", description: "Edit element" },
      { key: "+", description: "Zoom in" },
      { key: "-", description: "Zoom out" },
      { key: "0", description: "Reset view" },
      { key: "D", description: "Toggle devices" },
      { key: "L", description: "Toggle labels" },
      { key: "F", description: "Toggle fullscreen" },
      { key: "Ctrl+A", description: "Select all" },
      { key: "Ctrl+S", description: "Save changes" },
    ],
  };
}
