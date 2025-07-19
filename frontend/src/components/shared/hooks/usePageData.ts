import { useState, useEffect } from "react";

/**
 * Configuration for usePageData hook
 */
export interface PageDataConfig<T> {
  /** localStorage key to check for connected integrations */
  storageKey: string;
  /** Mock data to return when integrations are connected */
  mockData: T;
  /** Function to determine if the data indicates a connected state */
  hasDataCheck?: (data: T) => boolean;
  /** Simulated loading delay in milliseconds */
  loadingDelay?: number;
}

/**
 * Return type for usePageData hook
 */
export interface PageDataResult<T> {
  /** The current data state */
  data: T;
  /** Whether data is currently loading */
  isLoading: boolean;
  /** Whether the page has meaningful data to display */
  hasData: boolean;
  /** Function to manually refresh the data */
  refetch: () => void;
}

/**
 * Custom hook for standardizing page data loading patterns
 *
 * This hook encapsulates the common pattern of:
 * 1. Loading state management
 * 2. localStorage integration checks
 * 3. Mock data simulation
 * 4. Determining if data should show empty state vs content
 *
 * @param config Configuration object for the hook
 * @returns Object with data, loading state, and utilities
 */
export function usePageData<T>(config: PageDataConfig<T>): PageDataResult<T> {
  const {
    storageKey,
    mockData,
    hasDataCheck = (data: T) => Boolean(data),
    loadingDelay = 1000,
  } = config;

  const [data, setData] = useState<T>(mockData);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, loadingDelay));

    // Check if user has connected integrations
    const hasConnectedIntegrations = localStorage.getItem(storageKey);

    if (hasConnectedIntegrations) {
      setData(mockData);
    } else {
      // Set empty/default data based on the structure of mockData
      const emptyData = Array.isArray(mockData)
        ? ([] as T)
        : typeof mockData === "object" && mockData !== null
          ? ({ ...mockData, hasData: false } as T)
          : mockData;
      setData(emptyData);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [storageKey]);

  const hasData = hasDataCheck(data);

  return {
    data,
    isLoading,
    hasData,
    refetch: loadData,
  };
}
