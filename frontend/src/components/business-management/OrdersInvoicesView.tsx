"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Plus, 
  Download, 
  Send, 
  Eye, 
  DollarSign,
  FileText,
  CheckCircle,
  AlertCircle
} from "lucide-react";

// Mock orders and invoices data
const orders = [
  {
    id: "ORD-001",
    invoiceId: "INV-001",
    customer: "Fresh Market Co.",
    date: "2024-01-15",
    dueDate: "2024-01-29",
    status: "Delivered",
    paymentStatus: "Paid",
    amount: 485.00,
    items: [
      { product: "Organic Lettuce", quantity: 24, unit: "heads", price: 3.50 },
      { product: "Fresh Basil", quantity: 12, unit: "bunches", price: 4.25 }
    ],
    squareInvoiceId: "gVJl-HnwLFUW7-ZNevGkFQ",
    createdAt: "2024-01-10"
  },
  {
    id: "ORD-002",
    invoiceId: "INV-002",
    customer: "Garden Bistro",
    date: "2024-01-14",
    dueDate: "2024-01-28",
    status: "Ready",
    paymentStatus: "Pending",
    amount: 234.00,
    items: [
      { product: "Herb Mix", quantity: 16, unit: "bunches", price: 3.75 }
    ],
    squareInvoiceId: "aVKm-InxMGVX8-AOcvHlGR",
    createdAt: "2024-01-09"
  }
];

export default function OrdersInvoicesView() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status.toLowerCase() === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "ready": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "processing": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "pending": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "overdue": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Orders & Invoices</h2>
          <p className="text-gray-600 dark:text-gray-400">Manage orders and track payments with Square</p>
        </div>
        <div className="flex gap-2">
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
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{orders.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  ${orders.reduce((sum, order) => sum + order.amount, 0).toLocaleString()}
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
                <p className="text-sm text-gray-600 dark:text-gray-400">Paid Invoices</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {orders.filter(order => order.paymentStatus === "Paid").length}
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
                <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {orders.filter(order => order.paymentStatus === "Pending").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search orders..."
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
          <option value="delivered">Delivered</option>
          <option value="ready">Ready</option>
          <option value="processing">Processing</option>
        </select>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.map((order) => (
          <Card key={order.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{order.id}</h3>
                    <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                    <Badge className={getPaymentStatusColor(order.paymentStatus)}>{order.paymentStatus}</Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Customer</p>
                      <p className="font-medium">{order.customer}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Date</p>
                      <p className="font-medium">{new Date(order.date).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Amount</p>
                      <p className="font-semibold text-lg">${order.amount.toLocaleString()}</p>
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
        ))}
      </div>
    </div>
  );
} 