import { useState, useCallback, useEffect } from "react";

export const useEditMode = (initialEditMode: boolean = false) => {
  const [isEditMode, setIsEditMode] = useState(initialEditMode);

  // Sync with external edit mode prop
  useEffect(() => {
    setIsEditMode(initialEditMode);
  }, [initialEditMode]);

  const toggleEditMode = useCallback(() => {
    setIsEditMode((prev) => !prev);
  }, []);

  const enableEditMode = useCallback(() => {
    setIsEditMode(true);
  }, []);

  const disableEditMode = useCallback(() => {
    setIsEditMode(false);
  }, []);

  return {
    isEditMode,
    toggleEditMode,
    enableEditMode,
    disableEditMode,
  };
};
