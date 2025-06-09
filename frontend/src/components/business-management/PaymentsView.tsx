"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  DollarSign, 
  CreditCard,
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  RefreshCw,
  Download,
  TrendingUp
} from "lucide-react";

// Mock payment data
const payments = [
  {
    id: "PAY-001",
    invoiceId: "INV-001",
    orderId: "ORD-001",
    customer: "Fresh Market Co.",
    amount: 485.00,
    method: "Credit Card",
    status: "Completed",
    date: "2024-01-15",
    squarePaymentId: "sq-payment-123",
    processingFee: 14.55,
    netAmount: 470.45,
    cardType: "Visa",
    lastFour: "4242"
  },
  {
    id: "PAY-002",
    invoiceId: "INV-002",
    orderId: "ORD-002",
    customer: "Garden Bistro",
    amount: 234.00,
    method: "ACH Transfer",
    status: "Pending",
    date: "2024-01-14",
    squarePaymentId: "sq-payment-456",
    processingFee: 1.00,
    netAmount: 233.00,
    expectedDate: "2024-01-17"
  },
  {
    id: "PAY-003",
    invoiceId: "INV-003",
    orderId: "ORD-003",
    customer: "Green Thumb CSA",
    amount: 180.00,
    method: "Credit Card",
    status: "Completed",
    date: "2024-01-12",
    squarePaymentId: "sq-payment-789",
    processingFee: 5.40,
    netAmount: 174.60,
    cardType: "Mastercard",
    lastFour: "8888"
  },
  {
    id: "PAY-004",
    invoiceId: "INV-004",
    orderId: "ORD-004",
    customer: "Urban Eats Store",
    amount: 92.00,
    method: "Credit Card",
    status: "Failed",
    date: "2024-01-16",
    squarePaymentId: "sq-payment-012",
    failureReason: "Card declined",
    retryAttempts: 2
  }
];

export default function PaymentsView() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.invoiceId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || payment.status.toLowerCase() === statusFilter;
    const matchesMethod = methodFilter === "all" || payment.method.toLowerCase() === methodFilter;
    
    return matchesSearch && matchesStatus && matchesMethod;
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "pending": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "failed": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "refunded": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed": return <CheckCircle className="h-4 w-4" />;
      case "pending": return <Clock className="h-4 w-4" />;
      case "failed": return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method.toLowerCase()) {
      case "credit card": return <CreditCard className="h-4 w-4" />;
      case "ach transfer": return <DollarSign className="h-4 w-4" />;
      default: return <DollarSign className="h-4 w-4" />;
    }
  };

  // Calculate summary stats
  const totalPayments = payments.reduce((sum, payment) => 
    payment.status === "Completed" ? sum + payment.amount : sum, 0
  );
  const totalFees = payments.reduce((sum, payment) => 
    payment.status === "Completed" && payment.processingFee ? sum + payment.processingFee : sum, 0
  );
  const netRevenue = payments.reduce((sum, payment) => 
    payment.status === "Completed" && payment.netAmount ? sum + payment.netAmount : sum, 0
  );
  const completedPayments = payments.filter(p => p.status === "Completed").length;
  const pendingPayments = payments.filter(p => p.status === "Pending").length;
  const failedPayments = payments.filter(p => p.status === "Failed").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Payment Management</h2>
          <p className="text-gray-600 dark:text-gray-400">Track payments and financial transactions via Square</p>
        </div>
        <div className="flex gap-2">
                      <Button variant="outline" className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Sync Square
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
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Received</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">${totalPayments.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Net Revenue</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">${netRevenue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Processing Fees</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">${totalFees.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Success Rate</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {Math.round((completedPayments / payments.length) * 100)}%
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
                <p className="text-sm text-green-600 dark:text-green-400">Completed</p>
                <p className="text-xl font-bold text-green-900 dark:text-green-100">{completedPayments}</p>
              </div>
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-yellow-200 dark:border-yellow-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-600 dark:text-yellow-400">Pending</p>
                <p className="text-xl font-bold text-yellow-900 dark:text-yellow-100">{pendingPayments}</p>
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
                <p className="text-xl font-bold text-red-900 dark:text-red-100">{failedPayments}</p>
              </div>
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by payment ID, customer, or invoice..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        >
          <option value="all">All Status</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>
        <select
          value={methodFilter}
          onChange={(e) => setMethodFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        >
          <option value="all">All Methods</option>
          <option value="credit card">Credit Card</option>
          <option value="ach transfer">ACH Transfer</option>
          <option value="cash">Cash</option>
        </select>
      </div>

      {/* Square Integration Status */}
      <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
              <CheckCircle className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">Square Payments Connected</h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Real-time payment processing and automatic reconciliation enabled.
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-blue-600 dark:text-blue-400">Last sync</p>
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">2 minutes ago</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payments List */}
      <div className="space-y-4">
        {filteredPayments.map((payment) => (
          <Card key={payment.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{payment.id}</h3>
                    <Badge className={`${getStatusColor(payment.status)} flex items-center gap-1`}>
                      {getStatusIcon(payment.status)}
                      {payment.status}
                    </Badge>
                    <Badge variant="outline" className="flex items-center gap-1">
                      {getMethodIcon(payment.method)}
                      {payment.method}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Customer</p>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{payment.customer}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Invoice</p>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{payment.invoiceId}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Amount</p>
                      <p className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                        ${payment.amount.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Date</p>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {new Date(payment.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Payment Details */}
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      {payment.status === "Completed" && payment.processingFee && (
                        <>
                          <div>
                            <p className="text-gray-600 dark:text-gray-400">Processing Fee</p>
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              ${payment.processingFee.toFixed(2)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600 dark:text-gray-400">Net Amount</p>
                            <p className="font-medium text-green-600 dark:text-green-400">
                              ${payment.netAmount?.toFixed(2)}
                            </p>
                          </div>
                        </>
                      )}
                      {payment.cardType && payment.lastFour && (
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">Card</p>
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {payment.cardType} ****{payment.lastFour}
                          </p>
                        </div>
                      )}
                      {payment.status === "Failed" && payment.failureReason && (
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">Failure Reason</p>
                          <p className="font-medium text-red-600 dark:text-red-400">
                            {payment.failureReason}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Square Payment ID */}
                  <div className="mt-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Square Payment ID: {payment.squarePaymentId}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 min-w-[100px]">
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                  {payment.status === "Failed" && (
                    <Button variant="outline" size="sm" className="text-blue-600 border-blue-300">
                      Retry Payment
                    </Button>
                  )}
                  {payment.status === "Completed" && (
                    <Button variant="outline" size="sm">
                      Refund
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPayments.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No payments found</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Try adjusting your search terms or filters.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 