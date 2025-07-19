"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Banknote,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw,
  Loader2,
  Eye,
  CreditCard,
  Calendar,
} from "lucide-react";
import {
  businessManagementService,
  BusinessPayout,
} from "@/services/businessManagementService";
import { FarmSearchAndFilter } from "@/components/ui/farm-search-and-filter";
import { useFarmSearch, useFarmFilters } from "@/hooks";
import type { FilterDefinition } from "@/components/ui/farm-search-and-filter";

export default function PayoutsView() {
  const [payouts, setPayouts] = useState<BusinessPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Standardized search and filter hooks
  const {
    searchTerm,
    setSearchTerm,
    clearSearch,
    hasSearch,
    filterItems: searchFilterItems,
  } = useFarmSearch<BusinessPayout>({
    searchFields: ["id", "destination"],
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
  } = useFarmFilters<BusinessPayout>();

  // Filter definitions
  const filterDefinitions: FilterDefinition[] = [
    {
      id: "status",
      label: "Payout Status",
      placeholder: "Filter by status...",
      options: [
        { value: "completed", label: "Completed" },
        { value: "pending", label: "Pending" },
        { value: "processing", label: "Processing" },
        { value: "failed", label: "Failed" },
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
  const filteredPayouts = useMemo(() => {
    let result = payouts;

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
    payouts,
    hasSearch,
    searchFilterItems,
    hasActiveFilters,
    filterFilterItems,
  ]);

  const fetchPayouts = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedPayouts = await businessManagementService.getPayouts(20);
      setPayouts(fetchedPayouts);
    } catch (err) {
      console.error("Failed to fetch payouts:", err);
      setError(
        "Failed to load payouts from Square. Please check your Square integration.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayouts();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "failed":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "processing":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      case "failed":
        return <AlertCircle className="h-4 w-4" />;
      case "processing":
        return <Clock className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const totalPayouts = payouts.reduce((sum, payout) => sum + payout.amount, 0);
  const completedPayouts = payouts.filter(
    (p) => p.status.toLowerCase() === "completed",
  ).length;
  const pendingPayouts = payouts.filter(
    (p) => p.status.toLowerCase() === "pending",
  ).length;
  const totalFees = payouts.reduce(
    (sum, payout) => sum + (payout.fees || 0),
    0,
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Payout Management
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Track payouts and transfers from Square ({payouts.length} payouts
            loaded)
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={fetchPayouts}
            disabled={loading}
            className="flex items-center gap-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {loading ? "Loading..." : "Refresh"}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Banknote className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total Payouts
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {payouts.length}
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
                  Total Amount
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  ${totalPayouts.toLocaleString()}
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
                  Completed
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {completedPayouts}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Pending
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {pendingPayouts}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total Fees
                </p>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  ${totalFees.toLocaleString()}
                </p>
              </div>
              <CreditCard className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Net Amount
                </p>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  ${(totalPayouts - totalFees).toLocaleString()}
                </p>
              </div>
              <Banknote className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Standardized Search and Filters */}
      <FarmSearchAndFilter
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search payouts by ID or destination..."
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
            Showing {filteredPayouts.length} of {payouts.length} payouts
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
        <Card>
          <CardContent className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 dark:text-gray-400">
              Loading payouts from Square...
            </p>
          </CardContent>
        </Card>
      )}

      {/* Payouts List */}
      {!loading && filteredPayouts.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Banknote className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
              No Payouts Found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {payouts.length === 0
                ? "No payouts available in your Square account."
                : "No payouts match your current filters."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Payouts List */}
      {!loading && filteredPayouts.length > 0 && (
        <div className="space-y-4">
          {filteredPayouts.map((payout) => (
            <Card key={payout.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{payout.id}</h3>
                      <Badge className={getStatusColor(payout.status)}>
                        {getStatusIcon(payout.status)}
                        <span className="ml-1">{payout.status}</span>
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">
                          Destination
                        </p>
                        <p className="font-medium">{payout.destination}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">
                          Amount
                        </p>
                        <p className="font-semibold text-lg text-green-600">
                          ${payout.amount.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Fees</p>
                        <p className="font-medium text-red-600">
                          ${(payout.fees || 0).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Net</p>
                        <p className="font-semibold text-lg">
                          $
                          {(
                            payout.amount - (payout.fees || 0)
                          ).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
