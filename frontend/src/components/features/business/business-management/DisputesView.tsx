"use client";

import {
  AlertTriangle,
  DollarSign,
  AlertCircle,
  Clock,
  RefreshCw,
  Loader2,
  Eye,
} from "lucide-react";
import { useState, useEffect, useMemo, useCallback } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FarmSearchAndFilter } from "@/components/ui/farm-search-and-filter";
import type { FilterDefinition } from "@/components/ui/farm-search-and-filter";
import { useFarmSearch, useFarmFilters } from "@/hooks";
import {
  businessManagementService,
  BusinessDispute,
} from "@/services/businessManagementService";

export default function DisputesView() {
  const [disputes, setDisputes] = useState<BusinessDispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Standardized search and filter hooks
  const {
    searchTerm,
    setSearchTerm,
    clearSearch,
    hasSearch,
    filterItems: searchFilterItems,
  } = useFarmSearch<BusinessDispute>({
    searchFields: ["id", "customer", "reason"],
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
  } = useFarmFilters<BusinessDispute>();

  // Filter definitions
  const filterDefinitions: FilterDefinition[] = [
    {
      id: "status",
      label: "Dispute Status",
      placeholder: "Filter by status...",
      options: [
        { value: "under_review", label: "Under Review" },
        { value: "won", label: "Won" },
        { value: "lost", label: "Lost" },
        { value: "accepted", label: "Accepted" },
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
  const filteredDisputes = useMemo(() => {
    let result = disputes;

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
    disputes,
    hasSearch,
    searchFilterItems,
    hasActiveFilters,
    filterFilterItems,
  ]);

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedDisputes = await businessManagementService.getDisputes(10);
      setDisputes(fetchedDisputes);
    } catch (err) {
      console.error("Failed to fetch disputes:", err);
      setError(
        "Failed to load disputes from Square. Please check your Square integration.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "under_review":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "won":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "lost":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "accepted":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "under_review":
        return <Clock className="h-4 w-4" />;
      case "won":
        return <AlertTriangle className="h-4 w-4" />;
      case "lost":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const totalDisputes = disputes.reduce(
    (sum, dispute) => sum + dispute.amount,
    0,
  );
  const activeDisputes = disputes.filter(
    (d) => d.status.toLowerCase() === "under_review",
  ).length;
  const wonDisputes = disputes.filter(
    (d) => d.status.toLowerCase() === "won",
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Dispute Management
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Track and manage payment disputes from Square ({disputes.length}{" "}
            disputes loaded)
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={fetchDisputes}
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
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total Disputes
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {disputes.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total Amount
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  ${totalDisputes.toLocaleString()}
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
                  Active
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {activeDisputes}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Won</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {wonDisputes}
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
        searchPlaceholder="Search disputes by ID, customer, or reason..."
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
            Showing {filteredDisputes.length} of {disputes.length} disputes
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
              Loading disputes from Square...
            </p>
          </CardContent>
        </Card>
      )}

      {/* Disputes List */}
      {!loading && filteredDisputes.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
              No Disputes Found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {disputes.length === 0
                ? "No disputes available in your Square account."
                : "No disputes match your current filters."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Disputes List */}
      {!loading && filteredDisputes.length > 0 && (
        <div className="space-y-4">
          {filteredDisputes.map((dispute) => (
            <Card
              key={dispute.id}
              className="hover:shadow-lg transition-shadow"
            >
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{dispute.id}</h3>
                      <Badge className={getStatusColor(dispute.status)}>
                        {getStatusIcon(dispute.status)}
                        <span className="ml-1">{dispute.status}</span>
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">
                          Customer
                        </p>
                        <p className="font-medium">{dispute.customer}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">
                          Reason
                        </p>
                        <p className="font-medium">{dispute.reason}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Date</p>
                        <p className="font-medium">
                          {new Date(dispute.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">
                          Amount
                        </p>
                        <p className="font-semibold text-lg text-red-600">
                          ${dispute.amount.toLocaleString()}
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
