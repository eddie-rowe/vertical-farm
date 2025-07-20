"use client";

import {
  DollarSign,
  CreditCard,
  CheckCircle,
  AlertTriangle,
  Clock,
  RefreshCw,
  Download,
  TrendingUp,
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
  BusinessPayment,
} from "@/services/businessManagementService";

export default function PaymentsView() {
  const [payments, setPayments] = useState<BusinessPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Standardized search and filter hooks
  const {
    searchTerm,
    setSearchTerm,
    clearSearch,
    hasSearch,
    filterItems: searchFilterItems,
  } = useFarmSearch<BusinessPayment>({
    searchFields: ["id", "customer", "invoiceId"],
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
  } = useFarmFilters<BusinessPayment>();

  // Filter definitions
  const filterDefinitions: FilterDefinition[] = [
    {
      id: "status",
      label: "Payment Status",
      placeholder: "Filter by status...",
      options: [
        { value: "completed", label: "Completed" },
        { value: "pending", label: "Pending" },
        { value: "failed", label: "Failed" },
        { value: "refunded", label: "Refunded" },
      ],
    },
    {
      id: "method",
      label: "Payment Method",
      placeholder: "Filter by method...",
      options: [
        { value: "credit card", label: "Credit Card" },
        { value: "ach transfer", label: "ACH Transfer" },
        { value: "cash", label: "Cash" },
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
  const filteredPayments = useMemo(() => {
    let result = payments;

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
    payments,
    hasSearch,
    searchFilterItems,
    hasActiveFilters,
    filterFilterItems,
  ]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedPayments = await businessManagementService.getPayments(100);
      setPayments(fetchedPayments);
    } catch (err) {
      console.error("Failed to fetch payments:", err);
      setError(
        "Failed to load payments from Square. Please check your Square integration.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "failed":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "refunded":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "failed":
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method.toLowerCase()) {
      case "credit card":
        return <CreditCard className="h-4 w-4" />;
      case "ach transfer":
        return <DollarSign className="h-4 w-4" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  // Calculate summary stats
  const totalPayments = payments.reduce(
    (sum, payment) =>
      payment.status === "Completed" ? sum + payment.amount : sum,
    0,
  );
  const totalFees = payments.reduce(
    (sum, payment) =>
      payment.status === "Completed" && payment.processingFee
        ? sum + payment.processingFee
        : sum,
    0,
  );
  const netRevenue = payments.reduce(
    (sum, payment) =>
      payment.status === "Completed" && payment.netAmount
        ? sum + payment.netAmount
        : sum,
    0,
  );
  const completedPayments = payments.filter(
    (p) => p.status === "Completed",
  ).length;
  const pendingPayments = payments.filter((p) => p.status === "Pending").length;
  const failedPayments = payments.filter((p) => p.status === "Failed").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Payment Management
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Track payments and financial transactions via Square (
            {payments.length} payments loaded)
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={fetchPayments}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total Received
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  ${totalPayments.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Net Revenue
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  ${netRevenue.toLocaleString()}
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
                  Processing Fees
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  ${totalFees.toLocaleString()}
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
                  Success Rate
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {payments.length > 0
                    ? Math.round((completedPayments / payments.length) * 100)
                    : 0}
                  %
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-green-200 dark:border-green-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 dark:text-green-400">
                  Completed
                </p>
                <p className="text-xl font-bold text-green-900 dark:text-green-100">
                  {completedPayments}
                </p>
              </div>
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-yellow-200 dark:border-yellow-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                  Pending
                </p>
                <p className="text-xl font-bold text-yellow-900 dark:text-yellow-100">
                  {pendingPayments}
                </p>
              </div>
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-200 dark:border-red-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 dark:text-red-400">Failed</p>
                <p className="text-xl font-bold text-red-900 dark:text-red-100">
                  {failedPayments}
                </p>
              </div>
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Standardized Search and Filters */}
      <FarmSearchAndFilter
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search by payment ID, customer, or invoice..."
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
            Showing {filteredPayments.length} of {payments.length} payments
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

      {/* Square Integration Status */}
      <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
              <CheckCircle className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                Square Payments Connected
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Real-time payment processing and automatic reconciliation
                enabled.
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-blue-600 dark:text-blue-400">
                Last sync
              </p>
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                2 minutes ago
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
              <AlertTriangle className="h-5 w-5" />
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <LoadingCard message="Loading payments from Square..." size="lg" />
      )}

      {/* Payments List */}
      {!loading && (
        <div className="space-y-4">
          {filteredPayments.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  No Payments Found
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {payments.length === 0
                    ? "No payments available in your Square account."
                    : "No payments match your current filters."}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredPayments.map((payment) => (
              <Card
                key={payment.id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {payment.id}
                        </h3>
                        <Badge
                          className={`${getStatusColor(payment.status)} flex items-center gap-1`}
                        >
                          {getStatusIcon(payment.status)}
                          {payment.status}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="flex items-center gap-1"
                        >
                          {getMethodIcon(payment.method)}
                          {payment.method}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">
                            Customer
                          </p>
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {payment.customer}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">
                            Invoice
                          </p>
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {payment.invoiceId}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">
                            Amount
                          </p>
                          <p className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                            ${payment.amount.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">
                            Date
                          </p>
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {new Date(payment.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {/* Payment Details */}
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                          {payment.status === "Completed" &&
                            payment.processingFee && (
                              <>
                                <div>
                                  <p className="text-gray-600 dark:text-gray-400">
                                    Processing Fee
                                  </p>
                                  <p className="font-medium text-gray-900 dark:text-gray-100">
                                    ${payment.processingFee.toFixed(2)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-gray-600 dark:text-gray-400">
                                    Net Amount
                                  </p>
                                  <p className="font-medium text-green-600 dark:text-green-400">
                                    ${payment.netAmount?.toFixed(2)}
                                  </p>
                                </div>
                              </>
                            )}
                          {payment.cardType && payment.lastFour && (
                            <div>
                              <p className="text-gray-600 dark:text-gray-400">
                                Card
                              </p>
                              <p className="font-medium text-gray-900 dark:text-gray-100">
                                {payment.cardType} ****{payment.lastFour}
                              </p>
                            </div>
                          )}
                          {payment.status === "Failed" &&
                            payment.failureReason && (
                              <div>
                                <p className="text-gray-600 dark:text-gray-400">
                                  Failure Reason
                                </p>
                                <p className="font-medium text-red-600 dark:text-red-400">
                                  {payment.failureReason}
                                </p>
                              </div>
                            )}
                        </div>
                      </div>
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
