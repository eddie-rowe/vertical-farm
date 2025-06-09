"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Eye
} from "lucide-react";

// Mock customer data
const customers = [
  {
    id: 1,
    name: "Fresh Market Co.",
    email: "orders@freshmarket.com",
    phone: "(555) 123-4567",
    address: "123 Market St, Green Valley, CA 90210",
    type: "Wholesale",
    status: "Active",
    totalOrders: 24,
    totalSpent: 4850.00,
    lastOrder: "2024-01-15",
    preferredProducts: ["Lettuce", "Basil", "Microgreens"],
    notes: "Regular weekly orders, prefers organic certification"
  },
  {
    id: 2,
    name: "Garden Bistro",
    email: "chef@gardenbistro.com",
    phone: "(555) 234-5678",
    address: "456 Culinary Ave, Food City, CA 90211",
    type: "Restaurant",
    status: "Active",
    totalOrders: 18,
    totalSpent: 2340.00,
    lastOrder: "2024-01-14",
    preferredProducts: ["Herbs", "Leafy Greens"],
    notes: "Seasonal menu focus, requests custom herb blends"
  },
  {
    id: 3,
    name: "Green Thumb CSA",
    email: "coordinator@greenthumb.org",
    phone: "(555) 345-6789",
    address: "789 Community Rd, Organic Hills, CA 90212",
    type: "CSA",
    status: "Active",
    totalOrders: 12,
    totalSpent: 1800.00,
    lastOrder: "2024-01-12",
    preferredProducts: ["Mixed Greens", "Herbs"],
    notes: "Community supported agriculture, weekly deliveries"
  },
  {
    id: 4,
    name: "Urban Eats Store",
    email: "purchasing@urbaneats.com",
    phone: "(555) 456-7890",
    address: "321 Urban Blvd, Metro City, CA 90213",
    type: "Retail",
    status: "Inactive",
    totalOrders: 8,
    totalSpent: 920.00,
    lastOrder: "2023-12-20",
    preferredProducts: ["Packaged Salads"],
    notes: "Seasonal customer, typically orders spring through fall"
  }
];

export default function CustomersView() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  // const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || customer.status.toLowerCase() === statusFilter;
    const matchesType = typeFilter === "all" || customer.type.toLowerCase() === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

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

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search customers by name or email..."
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
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        >
          <option value="all">All Types</option>
          <option value="wholesale">Wholesale</option>
          <option value="restaurant">Restaurant</option>
          <option value="retail">Retail</option>
          <option value="csa">CSA</option>
        </select>
      </div>

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
                <span>{customer.email}</span>
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
                    {new Date(customer.lastOrder).toLocaleDateString()}
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

      {filteredCustomers.length === 0 && (
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
    </div>
  );
} 