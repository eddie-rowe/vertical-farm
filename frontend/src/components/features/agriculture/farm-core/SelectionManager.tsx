"use client";

import React, { useCallback, useEffect, useState } from "react";

import { Row, Rack, Shelf, SensorDevice } from "@/types/farm-layout";

export type SelectableElement = {
  id: string;
  type: "row" | "rack" | "shelf" | "device";
  element: Row | Rack | Shelf | SensorDevice;
  parentId?: string;
};

export interface SelectionState {
  selectedElements: Map<string, SelectableElement>;
  lastSelected?: string;
  selectionMode: "single" | "multi";
}

interface SelectionManagerProps {
  onSelectionChange: (selection: SelectionState) => void;
  children: (selectionProps: {
    selectedElements: Map<string, SelectableElement>;
    isSelected: (id: string) => boolean;
    isMultiSelected: () => boolean;
    handleElementClick: (
      element: SelectableElement,
      event: React.MouseEvent,
    ) => void;
    handleClearSelection: () => void;
    handleSelectAll: (elements: SelectableElement[]) => void;
    selectionCount: number;
    getSelectionInfo: () => string;
  }) => React.ReactNode;
}

const SelectionManager: React.FC<SelectionManagerProps> = ({
  onSelectionChange,
  children,
}) => {
  const [selectionState, setSelectionState] = useState<SelectionState>({
    selectedElements: new Map(),
    selectionMode: "single",
  });

  // Update selection mode based on modifier keys
  const updateSelectionMode = useCallback((event: React.MouseEvent) => {
    const newMode =
      event.ctrlKey || event.metaKey || event.shiftKey ? "multi" : "single";
    setSelectionState((prev) => ({ ...prev, selectionMode: newMode }));
  }, []);

  // Handle element selection
  const handleElementClick = useCallback(
    (element: SelectableElement, event: React.MouseEvent) => {
      event.stopPropagation();
      updateSelectionMode(event);

      setSelectionState((prev) => {
        const newSelection = new Map(prev.selectedElements);
        const isCurrentlySelected = newSelection.has(element.id);

        if (prev.selectionMode === "single") {
          // Single selection mode - replace current selection
          newSelection.clear();
          if (!isCurrentlySelected) {
            newSelection.set(element.id, element);
          }
        } else {
          // Multi selection mode
          if (event.shiftKey && prev.lastSelected) {
            // Range selection (if we have a previous selection)
            // For now, just add to selection - range logic would need element ordering
            if (!isCurrentlySelected) {
              newSelection.set(element.id, element);
            }
          } else if (event.ctrlKey || event.metaKey) {
            // Toggle selection
            if (isCurrentlySelected) {
              newSelection.delete(element.id);
            } else {
              newSelection.set(element.id, element);
            }
          } else {
            // Add to selection
            newSelection.set(element.id, element);
          }
        }

        const newState = {
          selectedElements: newSelection,
          lastSelected: newSelection.size > 0 ? element.id : undefined,
          selectionMode: prev.selectionMode,
        };

        return newState;
      });
    },
    [updateSelectionMode],
  );

  // Clear all selections
  const handleClearSelection = useCallback(() => {
    setSelectionState((prev) => ({
      ...prev,
      selectedElements: new Map(),
      lastSelected: undefined,
    }));
  }, []);

  // Select all elements
  const handleSelectAll = useCallback((elements: SelectableElement[]) => {
    const newSelection = new Map<string, SelectableElement>();
    elements.forEach((element) => {
      newSelection.set(element.id, element);
    });

    setSelectionState((prev) => ({
      ...prev,
      selectedElements: newSelection,
      selectionMode: "multi",
    }));
  }, []);

  // Utility functions
  const isSelected = useCallback(
    (id: string) => {
      return selectionState.selectedElements.has(id);
    },
    [selectionState.selectedElements],
  );

  const isMultiSelected = useCallback(() => {
    return selectionState.selectedElements.size > 1;
  }, [selectionState.selectedElements.size]);

  const getSelectionInfo = useCallback(() => {
    const count = selectionState.selectedElements.size;
    if (count === 0) return "No selection";
    if (count === 1) {
      const element = Array.from(selectionState.selectedElements.values())[0];
      return `Selected: ${element.type} ${element.id}`;
    }

    // Group by type for multi-selection
    const typeGroups = new Map<string, number>();
    selectionState.selectedElements.forEach((element) => {
      typeGroups.set(element.type, (typeGroups.get(element.type) || 0) + 1);
    });

    const groupStrings = Array.from(typeGroups.entries())
      .map(([type, count]) => `${count} ${type}${count > 1 ? "s" : ""}`)
      .join(", ");

    return `Selected: ${groupStrings}`;
  }, [selectionState.selectedElements]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Escape to clear selection
      if (event.key === "Escape") {
        handleClearSelection();
      }

      // Ctrl+A to select all (would need all elements passed in)
      if ((event.ctrlKey || event.metaKey) && event.key === "a") {
        event.preventDefault();
        // This would need to be implemented by the parent component
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleClearSelection]);

  // Notify parent of selection changes
  useEffect(() => {
    onSelectionChange(selectionState);
  }, [selectionState, onSelectionChange]);

  return (
    <>
      {children({
        selectedElements: selectionState.selectedElements,
        isSelected,
        isMultiSelected,
        handleElementClick,
        handleClearSelection,
        handleSelectAll,
        selectionCount: selectionState.selectedElements.size,
        getSelectionInfo,
      })}
    </>
  );
};

// Selection indicator component
export const SelectionIndicator: React.FC<{
  isSelected: boolean;
  isHovered: boolean;
  elementType: "row" | "rack" | "shelf" | "device";
  size?: "small" | "medium" | "large";
}> = ({ isSelected, isHovered, elementType, size = "medium" }) => {
  const getSize = () => {
    switch (size) {
      case "small":
        return "w-2 h-2";
      case "medium":
        return "w-3 h-3";
      case "large":
        return "w-4 h-4";
      default:
        return "w-3 h-3";
    }
  };

  const getColor = () => {
    if (isSelected) return "bg-blue-500 border-blue-600";
    if (isHovered)
      return "bg-blue-200 border-blue-300 dark:bg-blue-800 dark:border-blue-700";
    return "bg-gray-300 border-gray-400 dark:bg-gray-600 dark:border-gray-500";
  };

  if (!isSelected && !isHovered) return null;

  return (
    <div
      className={`
        absolute -top-1 -right-1 ${getSize()} 
        rounded-full border-2 ${getColor()}
        transform transition-all duration-200 ease-in-out
        ${isSelected ? "scale-110" : "scale-100"}
        shadow-sm
      `}
      aria-label={`${elementType} ${isSelected ? "selected" : "hovered"}`}
    >
      {isSelected && (
        <div className="w-full h-full rounded-full bg-white dark:bg-gray-900 flex items-center justify-center">
          <div className="w-1 h-1 rounded-full bg-blue-500"></div>
        </div>
      )}
    </div>
  );
};

// Multi-selection toolbar component
export const SelectionToolbar: React.FC<{
  selectionCount: number;
  selectionInfo: string;
  onClearSelection: () => void;
  onBulkAction?: (action: string) => void;
  availableActions?: string[];
}> = ({
  selectionCount,
  selectionInfo,
  onClearSelection,
  onBulkAction,
  availableActions = ["delete", "duplicate", "move"],
}) => {
  if (selectionCount === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-40">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg px-4 py-2 flex items-center gap-4">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {selectionInfo}
        </span>

        <div className="flex items-center gap-2">
          {onBulkAction &&
            availableActions.map((action) => (
              <button
                key={action}
                onClick={() => onBulkAction(action)}
                className="px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              >
                {action.charAt(0).toUpperCase() + action.slice(1)}
              </button>
            ))}

          <button
            onClick={onClearSelection}
            className="px-2 py-1 text-xs font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
};

export default SelectionManager;
