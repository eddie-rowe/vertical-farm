import { useState, useCallback } from "react";
import { Row, Rack, Shelf } from "@/types/farm-layout";

interface PropertyPanelState {
  isOpen: boolean;
  element: Row | Rack | Shelf | null;
  elementType: "row" | "rack" | "shelf";
}

export const usePropertyPanel = () => {
  const [propertyPanel, setPropertyPanel] = useState<PropertyPanelState>({
    isOpen: false,
    element: null,
    elementType: "row",
  });

  const openPropertyPanel = useCallback(
    (element: Row | Rack | Shelf, elementType: "row" | "rack" | "shelf") => {
      setPropertyPanel({
        isOpen: true,
        element: { ...element }, // Create a copy for editing
        elementType,
      });
    },
    [],
  );

  const closePropertyPanel = useCallback(() => {
    setPropertyPanel({
      isOpen: false,
      element: null,
      elementType: "row",
    });
  }, []);

  const updateElementProperty = useCallback((property: string, value: any) => {
    setPropertyPanel((prev) => {
      if (!prev.element) return prev;

      return {
        ...prev,
        element: {
          ...prev.element,
          [property]: value,
        },
      };
    });
  }, []);

  const resetPropertyPanel = useCallback(() => {
    setPropertyPanel({
      isOpen: false,
      element: null,
      elementType: "row",
    });
  }, []);

  return {
    propertyPanel,
    openPropertyPanel,
    closePropertyPanel,
    updateElementProperty,
    resetPropertyPanel,
  };
};
