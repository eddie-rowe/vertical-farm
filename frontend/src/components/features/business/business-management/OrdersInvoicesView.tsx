"use client";

import {
  Plus,
  Download,
  Send,
  Eye,
  DollarSign,
  FileText,
  CheckCircle,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { useState, useEffect, useMemo, useCallback } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FarmSearchAndFilter } from "@/components/ui/farm-search-and-filter";
import type { FilterDefinition } from "@/components/ui/farm-search-and-filter";
import { LoadingCard } from "@/components/ui/loading";
import { useFarmSearch, useFarmFilters } from "@/hooks";
import {
  businessManagementService,
  BusinessOrder,
} from "@/services/businessManagementService";

export default function OrdersInvoicesView() {
  const [orders, setOrders] = useState<BusinessOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Standardized search and filter hooks
  const {
    searchTerm,
    setSearchTerm,
    clearSearch,
    hasSearch,
    filterItems: searchFilterItems,
  } = useFarmSearch<BusinessOrder>({
    searchFields: ["id", "customer"],
    caseSensitive: false,
  });

  const {
    filters,
    setFilter,
    removeFilter,
    clearAllFilters,
    getActiveFilterChips,
    filterItems: filterFilterItems,
    hasActiveFilters,
  } = useFarmFilters<BusinessOrder>();

  // Filter definitions
  const filterDefinitions: FilterDefinition[] = [
    {
      id: "status",
      label: "Order Status",
      placeholder: "Filter by status...",
      options: [
        { value: "delivered", label: "Delivered" },
        { value: "ready", label: "Ready" },
        { value: "processing", label: "Processing" },
      ],
    },
    {
      id: "paymentStatus",
      label: "Payment Status",
      placeholder: "Filter by payment status...",
      options: [
        { value: "paid", label: "Paid" },
        { value: "pending", label: "Pending" },
        { value: "overdue", label: "Overdue" },
      ],
    },
  ];

  // Filter change handlers
  const handleFilterChange = useCallback(
    (filterId: string, value: string) => {
      setFilter(filterId, value);
    },
    [setFilter],
  );

  const handleRemoveFilter = useCallback(
    (filterId: string) => {
      removeFilter(filterId);
    },
    [removeFilter],
  );

  // Combined filtering
  const filteredOrders = useMemo(() => {
    let result = orders;

    // Apply search filter
    if (hasSearch) {
      result = searchFilterItems(result);
    }

    // Apply other filters
    if (hasActiveFilters) {
      result = filterFilterItems(result);
    }

    return result;
  }, [
    orders,
    hasSearch,
    searchFilterItems,
    hasActiveFilters,
    filterFilterItems,
  ]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedOrders = await businessManagementService.getOrders(30);
      setOrders(fetchedOrders);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
      setError(
        "Failed to load orders from Square. Please check your Square integration.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "ready":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "processing":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "overdue":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Orders & Invoices
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Manage orders and track payments with Square ({orders.length} orders
            loaded)
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={fetchOrders}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Create Invoice
          </Button>
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Order
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total Orders
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {orders.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total Revenue
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  $
                  {orders
                    .reduce((sum, order) => sum + order.amount, 0)
                    .toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Paid Invoices
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {
                    orders.filter((order) => order.paymentStatus === "Paid")
                      .length
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Pending
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {
                    orders.filter((order) => order.paymentStatus === "Pending")
                      .length
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Standardized Search and Filters */}
      <FarmSearchAndFilter
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search orders by ID or customer..."
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
            Showing {filteredOrders.length} of {orders.length} orders
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

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
              <AlertCircle className="h-5 w-5" />
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <LoadingCard message="Loading orders from Square..." size="lg" />
      )}

      {/* Orders List */}
      {!loading && (
        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  No Orders Found
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {orders.length === 0
                    ? "No orders available in your Square account."
                    : "No orders match your current filters."}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredOrders.map((order) => (
              <Card
                key={order.id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{order.id}</h3>
                        <Badge className={getStatusColor(order.status)}>
                          {order.status}
                        </Badge>
                        <Badge
                          className={getPaymentStatusColor(order.paymentStatus)}
                        >
                          {order.paymentStatus}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">
                            Customer
                          </p>
                          <p className="font-medium">{order.customer}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">
                            Date
                          </p>
                          <p className="font-medium">
                            {new Date(order.date).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">
                            Amount
                          </p>
                          <p className="font-semibold text-lg">
                            ${order.amount.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Send className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
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
