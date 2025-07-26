import { useState, useCallback, useRef, useEffect } from "react";

import { Row, Rack, Shelf } from "@/types/farm-layout";

type SelectableElement = Row | Rack | Shelf;
type ElementType = "row" | "rack" | "shelf";

interface MultiSelectState {
  selectedElements: Map<string, SelectableElement>;
  selectedElementTypes: Map<string, ElementType>;
  lastSelectedId: string | null;
  selectionMode: "single" | "multi";
}

export const useMultiSelect = () => {
  const [state, setState] = useState<MultiSelectState>({
    selectedElements: new Map(),
    selectedElementTypes: new Map(),
    lastSelectedId: null,
    selectionMode: "single",
  });

  const isMultiKeyPressed = useRef(false);

  // Track Ctrl/Cmd key state
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        isMultiKeyPressed.current = true;
        setState((prev) => ({ ...prev, selectionMode: "multi" }));
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!e.ctrlKey && !e.metaKey) {
        isMultiKeyPressed.current = false;
        setState((prev) => ({ ...prev, selectionMode: "single" }));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  const selectElement = useCallback(
    (
      element: SelectableElement,
      elementType: ElementType,
      event?: React.MouseEvent,
    ) => {
      const id = element.id;
      const isMultiSelect = event
        ? event.ctrlKey || event.metaKey
        : isMultiKeyPressed.current;

      setState((prev) => {
        const newSelectedElements = new Map(prev.selectedElements);
        const newSelectedElementTypes = new Map(prev.selectedElementTypes);

        if (isMultiSelect) {
          // Multi-select mode
          if (newSelectedElements.has(id)) {
            // Deselect if already selected
            newSelectedElements.delete(id);
            newSelectedElementTypes.delete(id);
          } else {
            // Add to selection
            newSelectedElements.set(id, element);
            newSelectedElementTypes.set(id, elementType);
          }
        } else {
          // Single select mode - clear all and select this one
          newSelectedElements.clear();
          newSelectedElementTypes.clear();
          newSelectedElements.set(id, element);
          newSelectedElementTypes.set(id, elementType);
        }

        return {
          ...prev,
          selectedElements: newSelectedElements,
          selectedElementTypes: newSelectedElementTypes,
          lastSelectedId: id,
          selectionMode: isMultiSelect ? "multi" : "single",
        };
      });
    },
    [],
  );

  const selectRange = useCallback(
    (
      fromElement: SelectableElement,
      toElement: SelectableElement,
      allElements: SelectableElement[],
      elementType: ElementType,
    ) => {
      const fromIndex = allElements.findIndex((el) => el.id === fromElement.id);
      const toIndex = allElements.findIndex((el) => el.id === toElement.id);

      if (fromIndex === -1 || toIndex === -1) return;

      const startIndex = Math.min(fromIndex, toIndex);
      const endIndex = Math.max(fromIndex, toIndex);
      const rangeElements = allElements.slice(startIndex, endIndex + 1);

      setState((prev) => {
        const newSelectedElements = new Map(prev.selectedElements);
        const newSelectedElementTypes = new Map(prev.selectedElementTypes);

        rangeElements.forEach((element) => {
          newSelectedElements.set(element.id, element);
          newSelectedElementTypes.set(element.id, elementType);
        });

        return {
          ...prev,
          selectedElements: newSelectedElements,
          selectedElementTypes: newSelectedElementTypes,
          lastSelectedId: toElement.id,
        };
      });
    },
    [],
  );

  const selectAll = useCallback(
    (elements: SelectableElement[], elementType: ElementType) => {
      setState((prev) => {
        const newSelectedElements = new Map();
        const newSelectedElementTypes = new Map();

        elements.forEach((element) => {
          newSelectedElements.set(element.id, element);
          newSelectedElementTypes.set(element.id, elementType);
        });

        return {
          ...prev,
          selectedElements: newSelectedElements,
          selectedElementTypes: newSelectedElementTypes,
          lastSelectedId:
            elements.length > 0 ? elements[elements.length - 1].id : null,
          selectionMode: "multi",
        };
      });
    },
    [],
  );

  const deselectAll = useCallback(() => {
    setState((prev) => ({
      ...prev,
      selectedElements: new Map(),
      selectedElementTypes: new Map(),
      lastSelectedId: null,
      selectionMode: "single",
    }));
  }, []);

  const deselectElement = useCallback((elementId: string) => {
    setState((prev) => {
      const newSelectedElements = new Map(prev.selectedElements);
      const newSelectedElementTypes = new Map(prev.selectedElementTypes);

      newSelectedElements.delete(elementId);
      newSelectedElementTypes.delete(elementId);

      return {
        ...prev,
        selectedElements: newSelectedElements,
        selectedElementTypes: newSelectedElementTypes,
        lastSelectedId:
          prev.lastSelectedId === elementId ? null : prev.lastSelectedId,
      };
    });
  }, []);

  const isSelected = useCallback(
    (elementId: string) => {
      return state.selectedElements.has(elementId);
    },
    [state.selectedElements],
  );

  const getSelectedElements = useCallback(() => {
    return Array.from(state.selectedElements.values());
  }, [state.selectedElements]);

  const getSelectedElementsOfType = useCallback(
    (elementType: ElementType) => {
      const elements: SelectableElement[] = [];
      state.selectedElementTypes.forEach((type, id) => {
        if (type === elementType) {
          const element = state.selectedElements.get(id);
          if (element) elements.push(element);
        }
      });
      return elements;
    },
    [state.selectedElements, state.selectedElementTypes],
  );

  const getSelectionCount = useCallback(() => {
    return state.selectedElements.size;
  }, [state.selectedElements]);

  const getSelectionSummary = useCallback(() => {
    const summary = { row: 0, rack: 0, shelf: 0 };
    state.selectedElementTypes.forEach((type) => {
      summary[type]++;
    });
    return summary;
  }, [state.selectedElementTypes]);

  const hasSelection = useCallback(() => {
    return state.selectedElements.size > 0;
  }, [state.selectedElements]);

  const hasMultipleSelection = useCallback(() => {
    return state.selectedElements.size > 1;
  }, [state.selectedElements]);

  return {
    // State
    selectedElements: state.selectedElements,
    selectedElementTypes: state.selectedElementTypes,
    selectionMode: state.selectionMode,
    lastSelectedId: state.lastSelectedId,

    // Actions
    selectElement,
    selectRange,
    selectAll,
    deselectAll,
    deselectElement,

    // Queries
    isSelected,
    getSelectedElements,
    getSelectedElementsOfType,
    getSelectionCount,
    getSelectionSummary,
    hasSelection,
    hasMultipleSelection,
  };
};
