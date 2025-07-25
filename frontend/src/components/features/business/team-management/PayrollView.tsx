"use client";

import {
  Plus,
  DollarSign,
  User,
  Clock,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Calendar,
  Download,
  TrendingUp,
} from "lucide-react";
import { useMemo, useCallback } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FarmSearchAndFilter } from "@/components/ui/farm-search-and-filter";
import type { FilterDefinition } from "@/components/ui/farm-search-and-filter";
import { useFarmSearch, useFarmFilters } from "@/hooks";

// Mock data for payroll
const payrollData = {
  summary: {
    totalPayroll: 28750.0,
    employeeCount: 8,
    avgSalary: 3593.75,
    pendingPayments: 2,
  },
  employees: [
    {
      id: "P001",
      name: "Sarah Johnson",
      role: "Farm Manager",
      employeeId: "EMP001",
      payRate: 28.5,
      hoursWorked: 40.0,
      overtimeHours: 2.5,
      grossPay: 1247.25,
      deductions: 287.86,
      netPay: 959.39,
      payPeriod: "2024-01-01 to 2024-01-14",
      status: "processed",
      lastPaid: "2024-01-15",
      benefits: ["Health Insurance", "401k", "PTO"],
    },
    {
      id: "P002",
      name: "Mike Chen",
      role: "Growth Technician",
      employeeId: "EMP002",
      payRate: 24.0,
      hoursWorked: 38.5,
      overtimeHours: 0,
      grossPay: 924.0,
      deductions: 198.75,
      netPay: 725.25,
      payPeriod: "2024-01-01 to 2024-01-14",
      status: "processed",
      lastPaid: "2024-01-15",
      benefits: ["Health Insurance", "PTO"],
    },
    {
      id: "P003",
      name: "Emily Davis",
      role: "Harvest Specialist",
      employeeId: "EMP003",
      payRate: 22.5,
      hoursWorked: 40.0,
      overtimeHours: 4.0,
      grossPay: 1035.0,
      deductions: 223.54,
      netPay: 811.46,
      payPeriod: "2024-01-01 to 2024-01-14",
      status: "pending",
      lastPaid: "2024-01-01",
      benefits: ["Health Insurance", "PTO"],
    },
    {
      id: "P004",
      name: "James Wilson",
      role: "Maintenance Tech",
      employeeId: "EMP004",
      payRate: 26.0,
      hoursWorked: 42.0,
      overtimeHours: 2.0,
      grossPay: 1144.0,
      deductions: 256.34,
      netPay: 887.66,
      payPeriod: "2024-01-01 to 2024-01-14",
      status: "processed",
      lastPaid: "2024-01-15",
      benefits: ["Health Insurance", "401k"],
    },
    {
      id: "P005",
      name: "Alex Rodriguez",
      role: "Growth Technician",
      employeeId: "EMP005",
      payRate: 23.75,
      hoursWorked: 36.0,
      overtimeHours: 0,
      grossPay: 855.0,
      deductions: 187.5,
      netPay: 667.5,
      payPeriod: "2024-01-01 to 2024-01-14",
      status: "pending",
      lastPaid: "2024-01-01",
      benefits: ["Health Insurance"],
    },
  ],
};

type PayrollEmployee = (typeof payrollData.employees)[0];

export default function PayrollView() {
  // Standardized search and filter hooks
  const {
    searchTerm,
    setSearchTerm,
    clearSearch,
    hasSearch,
    filterItems: searchFilterItems,
  } = useFarmSearch<PayrollEmployee>({
    searchFields: ["name", "role", "employeeId"],
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
  } = useFarmFilters<PayrollEmployee>();

  // Filter definitions
  const filterDefinitions: FilterDefinition[] = [
    {
      id: "status",
      label: "Payment Status",
      placeholder: "Filter by status...",
      options: [
        { value: "processed", label: "Processed" },
        { value: "pending", label: "Pending" },
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
  const filteredEmployees = useMemo(() => {
    let result = payrollData.employees;

    // Apply search filter
    if (hasSearch) {
      result = searchFilterItems(result);
    }

    // Apply other filters
    if (hasActiveFilters) {
      result = filterFilterItems(result);
    }

    return result;
  }, [hasSearch, searchFilterItems, hasActiveFilters, filterFilterItems]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "processed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "failed":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "processed":
        return <CheckCircle className="h-4 w-4" />;
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "failed":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total Payroll
                </p>
                <p className="text-2xl font-bold">
                  ${payrollData.summary.totalPayroll.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Employees
                </p>
                <p className="text-2xl font-bold">
                  {payrollData.summary.employeeCount}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Avg Salary
                </p>
                <p className="text-2xl font-bold">
                  ${payrollData.summary.avgSalary.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Pending
                </p>
                <p className="text-2xl font-bold">
                  {payrollData.summary.pendingPayments}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions Bar */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Payroll Management</h3>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button variant="outline">
            <CreditCard className="h-4 w-4 mr-2" />
            Process Payments
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Employee
          </Button>
        </div>
      </div>

      {/* Standardized Search and Filters */}
      <FarmSearchAndFilter
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search employees by name, role, or employee ID..."
        filters={filterDefinitions}
        activeFilters={getActiveFilterChips(filterDefinitions)}
        onFilterChange={handleFilterChange}
        onRemoveFilter={handleRemoveFilter}
        onClearAllFilters={clearAllFilters}
      />

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
        <span>
          Showing {filteredEmployees.length} of {payrollData.employees.length}{" "}
          employees
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

      {/* Payroll Grid */}
      <div className="space-y-4">
        {filteredEmployees.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
                No Employees Found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {payrollData.employees.length === 0
                  ? "No employees in payroll system."
                  : "No employees match your current search and filters."}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredEmployees.map((employee) => (
            <Card
              key={employee.id}
              className="hover:shadow-lg transition-shadow"
            >
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-lg font-semibold">{employee.name}</h3>
                      <Badge className={getStatusColor(employee.status)}>
                        {getStatusIcon(employee.status)}
                        <span className="ml-1">{employee.status}</span>
                      </Badge>
                      <Badge variant="outline">{employee.role}</Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">
                          Employee ID
                        </p>
                        <p className="font-medium">{employee.employeeId}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">
                          Pay Rate
                        </p>
                        <p className="font-medium">${employee.payRate}/hr</p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">
                          Hours Worked
                        </p>
                        <p className="font-medium">
                          {employee.hoursWorked}h
                          {employee.overtimeHours > 0 && (
                            <span className="text-orange-600">
                              {" "}
                              (+{employee.overtimeHours}h OT)
                            </span>
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">
                          Gross Pay
                        </p>
                        <p className="font-semibold text-lg text-green-600">
                          ${employee.grossPay.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">
                          Net Pay
                        </p>
                        <p className="font-semibold text-lg">
                          ${employee.netPay.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">
                            Pay Period
                          </p>
                          <p className="font-medium">{employee.payPeriod}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">
                            Deductions
                          </p>
                          <p className="font-medium text-red-600">
                            -${employee.deductions.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">
                            Last Paid
                          </p>
                          <p className="font-medium">
                            {new Date(employee.lastPaid).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {employee.benefits && employee.benefits.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            Benefits
                          </p>
                          <div className="flex gap-1 flex-wrap">
                            {employee.benefits.map((benefit, index) => (
                              <Badge
                                key={index}
                                variant="secondary"
                                className="text-xs"
                              >
                                {benefit}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Calendar className="h-4 w-4" />
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
    </div>
  );
}
