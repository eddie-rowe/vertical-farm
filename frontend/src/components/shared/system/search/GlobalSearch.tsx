import React, { useState, useEffect, useRef, useMemo } from 'react';
import { FaSearch, FaTimes, FaFilter, FaHistory, FaStar } from 'react-icons/fa';

export interface SearchResult {
  id: string;
  type: 'farm' | 'device' | 'alert' | 'user' | 'schedule';
  title: string;
  subtitle?: string;
  description?: string;
  url?: string;
  relevance: number;
  metadata?: Record<string, any>;
}

export interface SearchCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  count: number;
  enabled: boolean;
}

interface GlobalSearchProps {
  placeholder?: string;
  maxResults?: number;
  onResultSelect?: (result: SearchResult) => void;
  onSearchChange?: (query: string) => void;
  className?: string;
  showCategories?: boolean;
  showHistory?: boolean;
}

// Mock data generators for demonstration
const generateMockResults = (query: string): SearchResult[] => {
  const allResults: SearchResult[] = [
    // Farms
    {
      id: 'farm-1',
      type: 'farm',
      title: 'Greenhouse Alpha',
      subtitle: 'Zone A',
      description: 'Main production facility with 12 growing towers',
      url: '/farms/greenhouse-alpha',
      relevance: 0.9,
      metadata: { status: 'active', location: 'Zone A' }
    },
    {
      id: 'farm-2',
      type: 'farm',
      title: 'Hydroponic Bay 2',
      subtitle: 'Zone B',
      description: 'Specialized facility for leafy greens',
      url: '/farms/hydroponic-bay-2',
      relevance: 0.8,
      metadata: { status: 'active', location: 'Zone B' }
    },
    // Devices
    {
      id: 'device-1',
      type: 'device',
      title: 'LED Grow Light A1',
      subtitle: 'Rack 1, Shelf 2',
      description: 'Full spectrum LED for optimal plant growth',
      url: '/devices/led-light-a1',
      relevance: 0.85,
      metadata: { status: 'online', type: 'lighting' }
    },
    {
      id: 'device-2',
      type: 'device',
      title: 'Water Pump System',
      subtitle: 'Zone A Primary',
      description: 'Main water circulation and nutrient delivery',
      url: '/devices/water-pump-primary',
      relevance: 0.75,
      metadata: { status: 'online', type: 'irrigation' }
    },
    // Alerts
    {
      id: 'alert-1',
      type: 'alert',
      title: 'High Temperature Alert',
      subtitle: 'Greenhouse Alpha',
      description: 'Temperature exceeded optimal range',
      url: '/alerts/temp-high-001',
      relevance: 0.95,
      metadata: { severity: 'warning', timestamp: Date.now() - 3600000 }
    },
    {
      id: 'alert-2',
      type: 'alert',
      title: 'Low Water Level',
      subtitle: 'Hydroponic Bay 2',
      description: 'Water reservoir below minimum threshold',
      url: '/alerts/water-low-002',
      relevance: 0.7,
      metadata: { severity: 'info', timestamp: Date.now() - 7200000 }
    }
  ];

  if (!query.trim()) return [];

  return allResults
    .filter(result => 
      result.title.toLowerCase().includes(query.toLowerCase()) ||
      result.subtitle?.toLowerCase().includes(query.toLowerCase()) ||
      result.description?.toLowerCase().includes(query.toLowerCase())
    )
    .sort((a, b) => b.relevance - a.relevance);
};

const getCategoryIcon = (type: string) => {
  switch (type) {
    case 'farm': return '🏭';
    case 'device': return '📱';
    case 'alert': return '⚠️';
    case 'user': return '👤';
    case 'schedule': return '📅';
    default: return '📄';
  }
};

export const GlobalSearch: React.FC<GlobalSearchProps> = ({
  placeholder = "Search farms, devices, alerts...",
  maxResults = 10,
  onResultSelect,
  onSearchChange,
  className = '',
  showCategories = true,
  showHistory = true,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Categories for filtering
  const categories = useMemo(() => {
    const categoryCounts = results.reduce((acc, result) => {
      acc[result.type] = (acc[result.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return [
      { id: 'all', name: 'All', icon: '🔍', count: results.length, enabled: true },
      { id: 'farm', name: 'Farms', icon: '🏭', count: categoryCounts.farm || 0, enabled: true },
      { id: 'device', name: 'Devices', icon: '📱', count: categoryCounts.device || 0, enabled: true },
      { id: 'alert', name: 'Alerts', icon: '⚠️', count: categoryCounts.alert || 0, enabled: true },
      { id: 'user', name: 'Users', icon: '👤', count: categoryCounts.user || 0, enabled: true },
    ];
  }, [results]);

  // Search effect with debouncing
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (query.trim()) {
        setLoading(true);
        const searchResults = generateMockResults(query);
        setResults(searchResults.slice(0, maxResults));
        setLoading(false);
        onSearchChange?.(query);
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [query, maxResults, onSearchChange]);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && results[selectedIndex]) {
          handleResultSelect(results[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  const handleResultSelect = (result: SearchResult) => {
    // Add to search history
    if (!searchHistory.includes(query)) {
      setSearchHistory(prev => [query, ...prev.slice(0, 4)]);
    }
    
    onResultSelect?.(result);
    setIsOpen(false);
    setQuery('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setIsOpen(true);
    setSelectedIndex(-1);
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const toggleFavorite = (result: SearchResult) => {
    setFavorites(prev => {
      const exists = prev.find(fav => fav.id === result.id);
      if (exists) {
        return prev.filter(fav => fav.id !== result.id);
      } else {
        return [...prev, result];
      }
    });
  };

  const isFavorite = (result: SearchResult) => {
    return favorites.some(fav => fav.id === result.id);
  };

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <FaSearch className="h-4 w-4 text-gray-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="block w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <FaTimes className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-h-96 overflow-hidden">
          {/* Categories Filter */}
          {showCategories && results.length > 0 && (
            <div className="p-3 border-b border-gray-200 dark:border-gray-700">
              <div className="flex gap-2 flex-wrap">
                {categories.map(category => (
                  <button
                    key={category.id}
                    className="flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    <span>{category.icon}</span>
                    <span>{category.name}</span>
                    {category.count > 0 && (
                      <span className="bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-1 rounded-full text-xs">
                        {category.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search Results */}
          <div className="max-h-64 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                Searching...
              </div>
            ) : results.length > 0 ? (
              results.map((result, index) => (
                <div
                  key={result.id}
                  onClick={() => handleResultSelect(result)}
                  className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${
                    index === selectedIndex
                      ? 'bg-emerald-50 dark:bg-emerald-900/20'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="text-2xl">{getCategoryIcon(result.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {result.title}
                      </h4>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                        {result.type}
                      </span>
                    </div>
                    {result.subtitle && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {result.subtitle}
                      </p>
                    )}
                    {result.description && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-1">
                        {result.description}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(result);
                    }}
                    className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    <FaStar 
                      className={`h-3 w-3 ${
                        isFavorite(result) 
                          ? 'text-yellow-500' 
                          : 'text-gray-400'
                      }`}
                    />
                  </button>
                </div>
              ))
            ) : query.trim() ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                No results found for "{query}"
              </div>
            ) : (
              <div className="p-4">
                {/* Search History */}
                {showHistory && searchHistory.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                      Recent Searches
                    </h4>
                    {searchHistory.map((historyQuery, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setQuery(historyQuery);
                          inputRef.current?.focus();
                        }}
                        className="flex items-center gap-2 w-full p-2 text-left rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <FaHistory className="h-3 w-3 text-gray-400" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {historyQuery}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Favorites */}
                {favorites.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                      Favorites
                    </h4>
                    {favorites.slice(0, 3).map((favorite) => (
                      <button
                        key={favorite.id}
                        onClick={() => handleResultSelect(favorite)}
                        className="flex items-center gap-2 w-full p-2 text-left rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <span className="text-lg">{getCategoryIcon(favorite.type)}</span>
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {favorite.title}
                        </span>
                        <FaStar className="h-3 w-3 text-yellow-500 ml-auto" />
                      </button>
                    ))}
                  </div>
                )}

                {searchHistory.length === 0 && favorites.length === 0 && (
                  <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                    <FaSearch className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Start typing to search</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalSearch; 