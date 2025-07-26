import { useState, useCallback } from "react";

interface HoveredElements {
  row: string | null;
  rack: string | null;
  shelf: string | null;
}

type ElementType = "row" | "rack" | "shelf";

export const useFarmState = () => {
  const [hoveredElements, setHoveredElements] = useState<HoveredElements>({
    row: null,
    rack: null,
    shelf: null,
  });

  const setHoveredElement = useCallback((type: ElementType, id: string) => {
    setHoveredElements((prev) => ({
      ...prev,
      [type]: id,
    }));
  }, []);

  const clearHoveredElement = useCallback((type: ElementType) => {
    setHoveredElements((prev) => ({
      ...prev,
      [type]: null,
    }));
  }, []);

  const clearAllHoveredElements = useCallback(() => {
    setHoveredElements({
      row: null,
      rack: null,
      shelf: null,
    });
  }, []);

  return {
    hoveredElements,
    setHoveredElement,
    clearHoveredElement,
    clearAllHoveredElements,
  };
};
