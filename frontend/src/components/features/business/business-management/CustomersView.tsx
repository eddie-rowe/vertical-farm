"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { businessManagementService, BusinessCustomer } from "@/services/businessManagementService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Plus, 
  Mail, 
  Phone, 
  MapPin, 
  User, 
  DollarSign,
  Package,
  Edit,
  Eye,
  AlertTriangle,
  ExternalLink
} from "lucide-react";
import Link from "next/link";
import { FarmSearchAndFilter } from '@/components/ui/farm-search-and-filter';
import { useFarmSearch, useFarmFilters } from '@/hooks';
import type { FilterDefinition } from '@/components/ui/farm-search-and-filter';
import { LoadingCard } from '@/components/ui/loading';

export default function CustomersView() {
  const [customers, setCustomers] = useState<BusinessCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Standardized search and filter hooks
  const { searchTerm, setSearchTerm, clearSearch, hasSearch, filterItems: searchFilterItems } = useFarmSearch<BusinessCustomer>({
    searchFields: ['name', 'email'],
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
  } = useFarmFilters<BusinessCustomer>();

  // Filter definitions for FarmSearchAndFilter
  const filterDefinitions: FilterDefinition[] = useMemo(() => [
    {
      id: 'status',
      label: 'Status',
      placeholder: 'Filter by status',
      options: [
        { value: 'all', label: 'All Status' },
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' }
      ],
      defaultValue: 'all'
    },
    {
      id: 'type',
      label: 'Type',
      placeholder: 'Filter by type',
      options: [
        { value: 'all', label: 'All Types' },
        { value: 'wholesale', label: 'Wholesale' },
        { value: 'restaurant', label: 'Restaurant' },
        { value: 'retail', label: 'Retail' },
        { value: 'csa', label: 'CSA' }
      ],
      defaultValue: 'all'
    }
  ], []);

  // Handle filter changes
  const handleFilterChange = useCallback((filterId: string, value: string) => {
    if (value === 'all') {
      removeFilter(filterId);
    } else {
      setFilter(filterId, value);
    }
  }, [setFilter, removeFilter]);

  const handleRemoveFilter = useCallback((filterId: string) => {
    removeFilter(filterId);
  }, [removeFilter]);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await businessManagementService.getCustomers(50);
      setCustomers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load customers');
      console.error('Error loading customers:', err);
    } finally {
      setLoading(false);
    }
  };

  // Apply combined filtering
  const filteredCustomers = useMemo(() => {
    let result = customers;
    
    // Apply search filtering
    result = searchFilterItems(result);
    
    // Apply standard filters
    result = filterFilterItems(result);
    
    return result;
  }, [customers, searchFilterItems, filterFilterItems]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "inactive": return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
      default: return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "wholesale": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      case "restaurant": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
      case "retail": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "csa": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  return (
    <div className="space-y-6">
      {/* Error State */}
      {error && (
        <Card className="bg-control-secondary/10 border-control-secondary">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-control-secondary" />
              <div>
                <h3 className="font-medium text-control-secondary">Cannot Load Customer Data</h3>
                <p className="text-sm text-control-secondary mt-1">{error}</p>
                {error.includes('Square integration not configured') && (
                  <div className="mt-3">
                    <Link href="/integrations/square">
                      <Button variant="outline" size="sm" className="flex items-center gap-2">
                        Setup Square Integration
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && !error && (
        <LoadingCard message="Loading customer data..." size="lg" />
      )}

      {/* Customer Data */}
      {!loading && !error && (
        <>
          {/* Header with Actions */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Customer Management</h2>
              <p className="text-gray-600 dark:text-gray-400">Manage your customer relationships and contacts</p>
            </div>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Customer
            </Button>
          </div>

          {/* Standardized Search and Filter Component */}
          <Card className="mb-6">
            <CardContent className="pt-4">
              <FarmSearchAndFilter
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                searchContext="customers by name or email"
                searchPlaceholder="Search customers by name or email..."
                filters={filterDefinitions}
                activeFilters={getActiveFilterChips(filterDefinitions)}
                onFilterChange={handleFilterChange}
                onRemoveFilter={handleRemoveFilter}
                onClearAllFilters={clearAllFilters}
                orientation="horizontal"
                showFilterChips={true}
              />
              
              {/* Results summary */}
              {(hasSearch || hasActiveFilters) && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    Showing {filteredCustomers.length} of {customers.length} customers
                  </p>
                  {(hasSearch || hasActiveFilters) && (
                    <Button size="sm" variant="outline" onClick={() => { clearSearch(); clearAllFilters(); }}>
                      Clear all filters
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Customer Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Customers</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{customers.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Active Customers</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {customers.filter(c => c.status === "Active").length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      ${customers.reduce((sum, c) => sum + c.totalSpent, 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Orders</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {customers.reduce((sum, c) => sum + c.totalOrders, 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Customer List */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredCustomers.map((customer) => (
              <Card key={customer.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{customer.name}</CardTitle>
                      <div className="flex gap-2 mt-2">
                        <Badge className={getStatusColor(customer.status)}>{customer.status}</Badge>
                        <Badge className={getTypeColor(customer.type)}>{customer.type}</Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Mail className="h-4 w-4" />
                    <span>{customer.email || 'No email provided'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Phone className="h-4 w-4" />
                    <span>{customer.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <MapPin className="h-4 w-4" />
                    <span className="truncate">{customer.address}</span>
                  </div>
                  
                  <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Orders</p>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">{customer.totalOrders}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Total Spent</p>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">${customer.totalSpent.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="mt-2">
                      <p className="text-gray-600 dark:text-gray-400 text-sm">Last Order</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {customer.lastOrder ? new Date(customer.lastOrder).toLocaleDateString() : 'No orders yet'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="pt-2">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Preferred Products:</p>
                    <div className="flex flex-wrap gap-1">
                      {customer.preferredProducts.map((product, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {product}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredCustomers.length === 0 && !loading && !error && (
            <Card>
              <CardContent className="p-8 text-center">
                <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No customers found</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Try adjusting your search terms or filters.
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
} 