"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from "@/components/ui/button";
import { Badge } from '@/components/ui/badge';
import { 
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Plus,
  Minus,
  Eye,
  Edit,
  RefreshCw,
  Loader2
} from "lucide-react";
import { businessManagementService, BusinessInventoryItem } from '@/services/businessManagementService';
import { FarmSearchAndFilter } from '@/components/ui/farm-search-and-filter';
import { useFarmSearch, useFarmFilters } from '@/hooks';
import type { FilterDefinition } from '@/components/ui/farm-search-and-filter';

export default function InventoryView() {
  const [inventory, setInventory] = useState<BusinessInventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Standardized search and filter hooks
  const { searchTerm, setSearchTerm, clearSearch, hasSearch, filterItems: searchFilterItems } = useFarmSearch<BusinessInventoryItem>({
    searchFields: ['name', 'sku', 'category'],
    caseSensitive: false
  });
  
  const {
    filters,
    setFilter,
    removeFilter,
    clearAllFilters,
    getActiveFilterChips,
    filterItems: filterFilterItems,
    hasActiveFilters
  } = useFarmFilters<BusinessInventoryItem>();

  // Filter definitions (prepared for future use)
  const filterDefinitions: FilterDefinition[] = [
    {
      id: 'category',
      label: 'Category',
      placeholder: 'Filter by category...',
      options: [
        // These could be populated dynamically from inventory categories
        { value: 'produce', label: 'Produce' },
        { value: 'herbs', label: 'Herbs' },
        { value: 'seeds', label: 'Seeds' },
        { value: 'equipment', label: 'Equipment' }
      ]
    },
    {
      id: 'stock_status',
      label: 'Stock Status',
      placeholder: 'Filter by stock status...',
      options: [
        { value: 'in_stock', label: 'In Stock' },
        { value: 'low_stock', label: 'Low Stock' },
        { value: 'out_of_stock', label: 'Out of Stock' }
      ]
    }
  ];

  // Filter change handlers
  const handleFilterChange = useCallback((filterId: string, value: string) => {
    setFilter(filterId, value);
  }, [setFilter]);

  const handleRemoveFilter = useCallback((filterId: string) => {
    removeFilter(filterId);
  }, [removeFilter]);

  // Combined filtering
  const filteredInventory = useMemo(() => {
    let result = inventory;
    
    // Apply search filter
    if (hasSearch) {
      result = searchFilterItems(result);
    }
    
    // Apply other filters
    if (hasActiveFilters) {
      result = filterFilterItems(result);
    }
    
    return result;
  }, [inventory, hasSearch, searchFilterItems, hasActiveFilters, filterFilterItems]);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await businessManagementService.getInventory(50);
      setInventory(data);
    } catch (err) {
      console.error('Error fetching inventory:', err);
      setError(err instanceof Error ? err.message : 'Failed to load inventory data from Square');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const totalItems = inventory.length;
  const totalQuantity = inventory.reduce((sum, item) => sum + item.quantity, 0);
  const lowStockItems = inventory.filter(item => item.quantity < 10).length;
  const outOfStockItems = inventory.filter(item => item.quantity === 0).length;

  if (loading && inventory.length === 0) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Inventory Management</h2>
            <p className="text-gray-600 dark:text-gray-400">Track Square catalog inventory and availability for sales</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 dark:text-gray-400">Loading inventory from Square...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Inventory Management</h2>
          <p className="text-gray-600 dark:text-gray-400">Track Square catalog inventory and availability for sales</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={fetchInventory}
            disabled={loading}
            variant="outline" 
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
              <AlertTriangle className="h-5 w-5" />
              <div>
                <p className="font-medium">Failed to load inventory data</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Products</p>
                <p className="text-2xl font-bold">{totalItems}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Quantity</p>
                <p className="text-2xl font-bold">{totalQuantity}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold">{lowStockItems}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingDown className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Out of Stock</p>
                <p className="text-2xl font-bold">{outOfStockItems}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Standardized Search and Filters */}
      <FarmSearchAndFilter
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search inventory by name, SKU, or category..."
        filters={filterDefinitions}
        activeFilters={getActiveFilterChips(filterDefinitions)}
        onFilterChange={handleFilterChange}
        onRemoveFilter={handleRemoveFilter}
        onClearAllFilters={clearAllFilters}
      />

      {/* Results Summary */}
      {!loading && (
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>
            Showing {filteredInventory.length} of {inventory.length} items
          </span>
          {(hasSearch || hasActiveFilters) && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                clearSearch();
                clearAllFilters();
              }}
            >
              Clear all filters
            </Button>
          )}
        </div>
      )}

      {/* Inventory List */}
      {loading && inventory.length > 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 dark:text-gray-400">Refreshing inventory from Square...</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredInventory.length === 0 ? (
            <div className="col-span-full">
              <Card>
                <CardContent className="p-8 text-center">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
                    No Inventory Items Found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {inventory.length === 0 
                      ? "No inventory items available in your Square catalog." 
                      : "No items match your current search and filters."}
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : (
            filteredInventory.map((item) => (
              <Card key={item.sku} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{item.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">SKU: {item.sku}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Category: {item.category}</p>
                    </div>
                    <Badge 
                      variant={item.quantity === 0 ? "destructive" : item.quantity < 10 ? "secondary" : "default"}
                    >
                      {item.quantity === 0 ? "Out of Stock" : item.quantity < 10 ? "Low Stock" : "In Stock"}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Quantity:</span>
                      <span className="font-semibold">{item.quantity}</span>
                    </div>
                    {item.price && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Price:</span>
                        <span className="font-semibold">${item.price.toFixed(2)}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      View
                    </Button>
                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                      <Edit className="h-4 w-4" />
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
} 