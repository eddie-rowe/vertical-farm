"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Plus, 
  DollarSign, 
  User, 
  Clock,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Calendar,
  Download,
  TrendingUp
} from "lucide-react";

// Mock data for payroll
const payrollData = {
  summary: {
    totalPayroll: 28750.00,
    employeeCount: 8,
    avgSalary: 3593.75,
    pendingPayments: 2
  },
  employees: [
    {
      id: "P001",
      name: "Sarah Johnson",
      role: "Farm Manager",
      employeeId: "EMP001",
      payRate: 28.50,
      hoursWorked: 40.0,
      overtimeHours: 2.5,
      grossPay: 1247.25,
      deductions: 287.86,
      netPay: 959.39,
      payPeriod: "2024-01-01 to 2024-01-14",
      status: "processed",
      lastPaid: "2024-01-15",
      benefits: ["Health Insurance", "401k", "PTO"]
    },
    {
      id: "P002",
      name: "Mike Chen",
      role: "Growth Technician",
      employeeId: "EMP002",
      payRate: 24.00,
      hoursWorked: 38.5,
      overtimeHours: 0,
      grossPay: 924.00,
      deductions: 198.75,
      netPay: 725.25,
      payPeriod: "2024-01-01 to 2024-01-14",
      status: "processed",
      lastPaid: "2024-01-15",
      benefits: ["Health Insurance", "PTO"]
    },
    {
      id: "P003",
      name: "Emily Davis",
      role: "Harvest Specialist",
      employeeId: "EMP003",
      payRate: 22.50,
      hoursWorked: 40.0,
      overtimeHours: 4.0,
      grossPay: 1035.00,
      deductions: 223.54,
      netPay: 811.46,
      payPeriod: "2024-01-01 to 2024-01-14",
      status: "pending",
      lastPaid: "2024-01-01",
      benefits: ["Health Insurance", "PTO"]
    },
    {
      id: "P004",
      name: "James Wilson",
      role: "Maintenance Tech",
      employeeId: "EMP004",
      payRate: 26.75,
      hoursWorked: 42.5,
      overtimeHours: 2.5,
      grossPay: 1237.81,
      deductions: 267.23,
      netPay: 970.58,
      payPeriod: "2024-01-01 to 2024-01-14",
      status: "pending",
      lastPaid: "2024-01-01",
      benefits: ["Health Insurance", "401k", "PTO"]
    },
    {
      id: "P005",
      name: "Alex Rodriguez",
      role: "Data Analyst",
      employeeId: "EMP005",
      payRate: 32.00,
      hoursWorked: 35.0,
      overtimeHours: 0,
      grossPay: 1120.00,
      deductions: 258.40,
      netPay: 861.60,
      payPeriod: "2024-01-01 to 2024-01-14",
      status: "processed",
      lastPaid: "2024-01-15",
      benefits: ["Health Insurance", "401k", "PTO", "Remote Work"]
    }
  ],
  payrollSummary: {
    thisMonth: 28750.00,
    lastMonth: 27980.00,
    ytd: 56730.00,
    avgHoursPerEmployee: 39.2
  }
};

export default function PayrollView() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "processed": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "pending": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "failed": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "processed": return <CheckCircle className="h-4 w-4" />;
      case "pending": return <Clock className="h-4 w-4" />;
      case "failed": return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const filteredEmployees = payrollData.employees.filter(employee => {
    const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || employee.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Payroll</p>
                <p className="text-2xl font-bold">${payrollData.summary.totalPayroll.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Employees</p>
                <p className="text-2xl font-bold">{payrollData.summary.employeeCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Avg Salary</p>
                <p className="text-2xl font-bold">${payrollData.summary.avgSalary.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pending Payments</p>
                <p className="text-2xl font-bold">{payrollData.summary.pendingPayments}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payroll Overview */}
      <Card>
        <CardContent className="p-6">
          <h4 className="font-semibold text-lg mb-4">Payroll Overview</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-600 dark:text-gray-400">This Month</p>
              <p className="text-xl font-bold">${payrollData.payrollSummary.thisMonth.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">Last Month</p>
              <p className="text-xl font-bold">${payrollData.payrollSummary.lastMonth.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">Year to Date</p>
              <p className="text-xl font-bold">${payrollData.payrollSummary.ytd.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">Avg Hours/Employee</p>
              <p className="text-xl font-bold">{payrollData.payrollSummary.avgHoursPerEmployee}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions Bar */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Employee Payroll</h3>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Payroll
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

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border rounded-md bg-background"
        >
          <option value="all">All Status</option>
          <option value="processed">Processed</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {/* Employee Payroll Cards */}
      <div className="grid gap-4">
        {filteredEmployees.map((employee) => (
          <Card key={employee.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <h4 className="font-semibold text-lg">{employee.name}</h4>
                    <Badge variant="outline">{employee.role}</Badge>
                    <Badge className={`${getStatusColor(employee.status)} flex items-center gap-1`}>
                      {getStatusIcon(employee.status)}
                      {employee.status}
                    </Badge>
                    <Badge variant="secondary">{employee.employeeId}</Badge>
                  </div>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Pay Period: {employee.payPeriod}
                  </p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Pay Rate</p>
                      <p className="font-medium">${employee.payRate}/hr</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Hours Worked</p>
                      <p className="font-medium">{employee.hoursWorked}h</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Overtime</p>
                      <p className="font-medium">{employee.overtimeHours}h</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Gross Pay</p>
                      <p className="font-medium">${employee.grossPay.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Deductions</p>
                      <p className="font-medium">-${employee.deductions.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Net Pay</p>
                      <p className="font-bold text-green-600">${employee.netPay.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="mt-3">
                    <p className="text-sm font-medium mb-1">Benefits:</p>
                    <div className="flex flex-wrap gap-1">
                      {employee.benefits.map((benefit, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {benefit}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                    Last Paid: {new Date(employee.lastPaid).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="ghost" size="sm">
                    <Calendar className="h-4 w-4" />
                  </Button>
                  {employee.status === "pending" && (
                    <Button variant="outline" size="sm">
                      <CreditCard className="h-4 w-4 mr-1" />
                      Process
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 