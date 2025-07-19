import { useState, useCallback, useMemo } from "react";
import type { FilterChip } from "@/components/ui/farm-filter-chips";

export interface FilterValue {
  id: string;
  value: string;
}

export interface UseFiltersOptions<T> {
  /** Initial filter values */
  initialFilters?: FilterValue[];
  /** Filter function that takes an item, filters, and returns boolean */
  filterFunction?: (item: T, filters: FilterValue[]) => boolean;
}

export interface UseFiltersResult<T> {
  /** Current filter values */
  filters: FilterValue[];
  /** Set a specific filter value */
  setFilter: (filterId: string, value: string) => void;
  /** Remove a specific filter */
  removeFilter: (filterId: string) => void;
  /** Clear all filters */
  clearAllFilters: () => void;
  /** Get active filter chips for display */
  getActiveFilterChips: (filterDefinitions: FilterDefinition[]) => FilterChip[];
  /** Filter items based on current filter state */
  filterItems: (items: T[]) => T[];
  /** Whether any filters are active */
  hasActiveFilters: boolean;
}

export interface FilterDefinition {
  id: string;
  label: string;
  options: Array<{ value: string; label: string }>;
  defaultValue?: string;
}

/**
 * Default filter function - checks if item properties match filter values
 */
const defaultFilterFunction = <T>(item: T, filters: FilterValue[]): boolean => {
  return filters.every((filter) => {
    // Skip "all" values and empty filters
    if (!filter.value || filter.value === "all" || filter.value === "") {
      return true;
    }

    // Check if item has the property matching filter id
    const itemValue = (item as any)[filter.id];
    if (itemValue === undefined) return true;

    // Handle different comparison types
    if (typeof itemValue === "string") {
      return itemValue.toLowerCase() === filter.value.toLowerCase();
    }

    return itemValue === filter.value;
  });
};

/**
 * Hook for managing filter state and operations
 */
export const useFarmFilters = <T>(
  options: UseFiltersOptions<T> = {},
): UseFiltersResult<T> => {
  const { initialFilters = [], filterFunction = defaultFilterFunction } =
    options;

  const [filters, setFilters] = useState<FilterValue[]>(initialFilters);

  const setFilter = useCallback((filterId: string, value: string) => {
    setFilters((prev) => {
      const existing = prev.find((f) => f.id === filterId);
      if (existing) {
        return prev.map((f) => (f.id === filterId ? { ...f, value } : f));
      } else {
        return [...prev, { id: filterId, value }];
      }
    });
  }, []);

  const removeFilter = useCallback((filterId: string) => {
    setFilters((prev) => prev.filter((f) => f.id !== filterId));
  }, []);

  const clearAllFilters = useCallback(() => {
    setFilters([]);
  }, []);

  const getActiveFilterChips = useCallback(
    (filterDefinitions: FilterDefinition[]): FilterChip[] => {
      return filters
        .filter(
          (filter) =>
            filter.value && filter.value !== "all" && filter.value !== "",
        )
        .map((filter) => {
          const definition = filterDefinitions.find((d) => d.id === filter.id);
          const option = definition?.options.find(
            (o) => o.value === filter.value,
          );

          return {
            id: filter.id,
            label: option?.label || filter.value,
            value: filter.value,
            type: filter.id,
            removable: true,
          };
        });
    },
    [filters],
  );

  const filterItems = useCallback(
    (items: T[]): T[] => {
      if (filters.length === 0) return items;

      return items.filter((item) => filterFunction(item, filters));
    },
    [filters, filterFunction],
  );

  const hasActiveFilters = useMemo(() => {
    return filters.some(
      (filter) => filter.value && filter.value !== "all" && filter.value !== "",
    );
  }, [filters]);

  return {
    filters,
    setFilter,
    removeFilter,
    clearAllFilters,
    getActiveFilterChips,
    filterItems,
    hasActiveFilters,
  };
};
