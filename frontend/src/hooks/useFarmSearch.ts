import { useState, useCallback, useMemo } from 'react';

export interface UseSearchOptions<T> {
  /** Initial search term */
  initialSearchTerm?: string;
  /** Debounce delay in milliseconds */
  debounceMs?: number;
  /** Search function that takes an item and search term, returns boolean */
  searchFunction?: (item: T, searchTerm: string) => boolean;
  /** Fields to search in (if using default search function) */
  searchFields?: (keyof T)[];
  /** Case sensitive search */
  caseSensitive?: boolean;
}

export interface UseSearchResult<T> {
  /** Current search term */
  searchTerm: string;
  /** Set search term */
  setSearchTerm: (term: string) => void;
  /** Clear search */
  clearSearch: () => void;
  /** Filter items based on search term */
  filterItems: (items: T[]) => T[];
  /** Whether search is active */
  hasSearch: boolean;
}

/**
 * Default search function that searches through specified fields
 */
const defaultSearchFunction = <T>(
  item: T, 
  searchTerm: string, 
  searchFields: (keyof T)[] = [],
  caseSensitive = false
): boolean => {
  if (!searchTerm.trim()) return true;
  
  const normalizedSearchTerm = caseSensitive ? searchTerm : searchTerm.toLowerCase();
  
  // If no fields specified, search all string properties
  const fieldsToSearch = searchFields.length > 0 
    ? searchFields 
    : Object.keys(item as any).filter(key => typeof (item as any)[key] === 'string') as (keyof T)[];
  
  return fieldsToSearch.some(field => {
    const fieldValue = item[field];
    if (typeof fieldValue === 'string') {
      const normalizedFieldValue = caseSensitive ? fieldValue : fieldValue.toLowerCase();
      return normalizedFieldValue.includes(normalizedSearchTerm);
    }
    return false;
  });
};

/**
 * Hook for managing search functionality with debouncing and filtering
 */
export const useFarmSearch = <T>(
  options: UseSearchOptions<T> = {}
): UseSearchResult<T> => {
  const {
    initialSearchTerm = '',
    searchFunction,
    searchFields = [],
    caseSensitive = false
  } = options;

  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
  }, []);

  const filterItems = useCallback((items: T[]) => {
    if (!searchTerm.trim()) return items;
    
    const searchFn = searchFunction || 
      ((item: T, term: string) => defaultSearchFunction(item, term, searchFields, caseSensitive));
    
    return items.filter(item => searchFn(item, searchTerm));
  }, [searchTerm, searchFunction, searchFields, caseSensitive]);

  const hasSearch = useMemo(() => searchTerm.trim().length > 0, [searchTerm]);

  return {
    searchTerm,
    setSearchTerm,
    clearSearch,
    filterItems,
    hasSearch
  };
}; 