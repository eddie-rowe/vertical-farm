"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Package,
  AlertTriangle,
  TrendingUp,
  Plus,
  Minus,
  Eye,
  Edit
} from "lucide-react";

const inventory = [
  {
    id: "SKU-001",
    product: "Organic Lettuce",
    variety: "Buttercrunch",
    currentStock: 48,
    reserved: 24,
    available: 24,
    unit: "heads",
    pricePerUnit: 3.50,
    harvestDate: "2024-01-14",
    expiryDate: "2024-01-21",
    status: "In Stock",
    growBatch: "LET-024-001"
  },
  {
    id: "SKU-002",
    product: "Fresh Basil",
    variety: "Sweet Basil",
    currentStock: 18,
    reserved: 12,
    available: 6,
    unit: "bunches",
    pricePerUnit: 4.25,
    harvestDate: "2024-01-13",
    expiryDate: "2024-01-20",
    status: "Low Stock",
    growBatch: "BAS-024-003"
  },
  {
    id: "SKU-003",
    product: "Microgreens Mix",
    variety: "Pea Shoots & Radish",
    currentStock: 12,
    reserved: 8,
    available: 4,
    unit: "trays",
    pricePerUnit: 12.00,
    harvestDate: "2024-01-15",
    expiryDate: "2024-01-22",
    status: "Low Stock",
    growBatch: "MIC-024-007"
  },
  {
    id: "SKU-004",
    product: "Baby Spinach",
    variety: "Space Spinach",
    currentStock: 0,
    reserved: 10,
    available: -10,
    unit: "bags",
    pricePerUnit: 6.50,
    harvestDate: "2024-01-10",
    expiryDate: "2024-01-17",
    status: "Out of Stock",
    growBatch: "SPI-024-002"
  },
  {
    id: "SKU-005",
    product: "Fresh Kale",
    variety: "Curly Kale",
    currentStock: 32,
    reserved: 15,
    available: 17,
    unit: "bunches",
    pricePerUnit: 4.75,
    harvestDate: "2024-01-16",
    expiryDate: "2024-01-23",
    status: "In Stock",
    growBatch: "KAL-024-004"
  }
];

export default function InventoryView() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.variety.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || item.status.toLowerCase() === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "in stock": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "low stock": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "out of stock": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "in stock": return <Package className="h-4 w-4" />;
      case "low stock": return <AlertTriangle className="h-4 w-4" />;
      case "out of stock": return <AlertTriangle className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const totalItems = inventory.length;
  const inStockItems = inventory.filter(item => item.status === "In Stock").length;
  const lowStockItems = inventory.filter(item => item.status === "Low Stock").length;
  const outOfStockItems = inventory.filter(item => item.status === "Out of Stock").length;
  const totalValue = inventory.reduce((sum, item) => sum + (item.currentStock * item.pricePerUnit), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Inventory Management</h2>
          <p className="text-gray-600 dark:text-gray-400">Track produce inventory and availability for sales</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Products</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalItems}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">In Stock</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{inStockItems}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Low Stock</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{lowStockItems}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Out of Stock</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{outOfStockItems}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Value</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">${totalValue.toLocaleString()}</p>
              </div>
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
              placeholder="Search by product name, variety, or SKU..."
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
          <option value="in stock">In Stock</option>
          <option value="low stock">Low Stock</option>
          <option value="out of stock">Out of Stock</option>
        </select>
      </div>

      {/* Inventory List */}
      <div className="space-y-4">
        {filteredInventory.map((item) => (
          <Card key={item.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {item.product}
                    </h3>
                                         <Badge className={`${getStatusColor(item.status)} flex items-center gap-1`}>
                       {getStatusIcon(item.status)}
                       {item.status}
                     </Badge>
                    <Badge variant="outline" className="text-xs">
                      {item.id}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    <strong>Variety:</strong> {item.variety} | <strong>Batch:</strong> {item.growBatch}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Current Stock</p>
                      <p className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                        {item.currentStock} {item.unit}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Available</p>
                      <p className={`font-semibold text-lg ${
                        item.available > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {item.available} {item.unit}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Reserved</p>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {item.reserved} {item.unit}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Price per Unit</p>
                      <p className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                        ${item.pricePerUnit}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Harvest Date</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {new Date(item.harvestDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Expiry Date</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {new Date(item.expiryDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Days Until Expiry</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {Math.ceil((new Date(item.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 min-w-[120px]">
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    View Details
                  </Button>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <Edit className="h-4 w-4" />
                    Edit Stock
                  </Button>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Minus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredInventory.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No inventory found</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Try adjusting your search terms or filters.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 