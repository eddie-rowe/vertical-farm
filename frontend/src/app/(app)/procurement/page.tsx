"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  FaBoxes,
  FaShoppingCart,
  FaBuilding,
  FaArrowUp,
  FaArrowDown,
  FaCheck,
  FaSearch,
  FaPlus,
  FaEdit,
  FaDollarSign,
  FaCreditCard,
} from "@/lib/icons";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { FarmControlButton } from "@/components/ui/farm-control-button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FarmInput } from "@/components/ui/farm-input";
import { PageHeader } from "@/components/ui/PageHeader";
import { FarmSearchAndFilter } from "@/components/ui/farm-search-and-filter";
import { useFarmSearch, useFarmFilters } from "@/hooks";
import type { FilterDefinition } from "@/components/ui/farm-search-and-filter";

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  unit: string;
  unitCost: number;
  totalValue: number;
  status: "in-stock" | "low-stock" | "out-of-stock" | "overstock";
  lastOrdered: string;
  supplier: string;
}

interface Vendor {
  id: string;
  name: string;
  category: string;
  rating: number;
  totalOrders: number;
  totalSpent: number;
  avgDeliveryDays: number;
  status: "active" | "inactive" | "preferred";
  contact: string;
  lastOrder: string;
}

interface PriceIntelligence {
  item: string;
  currentPrice: number;
  marketAverage: number;
  trend: "up" | "down" | "stable";
  savings: number;
  recommendation: string;
  sources: number;
}

interface PurchaseOrder {
  id: string;
  vendor: string;
  items: number;
  total: number;
  status: "pending" | "ordered" | "shipped" | "delivered" | "cancelled";
  orderDate: string;
  expectedDelivery: string;
}

export default function ProcurementPage() {
  const [loading, setLoading] = useState(true);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [priceIntelligence, setPriceIntelligence] = useState<
    PriceIntelligence[]
  >([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);

  // Standardized search and filter hooks for inventory
  const {
    searchTerm,
    setSearchTerm,
    clearSearch,
    hasSearch,
    filterItems: searchFilterItems,
  } = useFarmSearch<InventoryItem>();
  const {
    filters,
    setFilter,
    removeFilter,
    clearAllFilters,
    getActiveFilterChips,
    filterItems: filterFilterItems,
    hasActiveFilters,
  } = useFarmFilters<InventoryItem>();

  // Search hooks for vendors
  const {
    searchTerm: vendorSearchTerm,
    setSearchTerm: setVendorSearchTerm,
    clearSearch: clearVendorSearch,
    hasSearch: hasVendorSearch,
    filterItems: searchFilterVendors,
  } = useFarmSearch<Vendor>({
    searchFields: ["name", "category", "contact"],
    caseSensitive: false,
  });

  // Search hooks for orders
  const {
    searchTerm: orderSearchTerm,
    setSearchTerm: setOrderSearchTerm,
    clearSearch: clearOrderSearch,
    hasSearch: hasOrderSearch,
    filterItems: searchFilterOrders,
  } = useFarmSearch<PurchaseOrder>({
    searchFields: ["id", "vendor"],
    caseSensitive: false,
  });

  // Filter hooks for vendors
  const {
    filters: vendorFilters,
    setFilter: setVendorFilter,
    removeFilter: removeVendorFilter,
    clearAllFilters: clearVendorFilters,
    getActiveFilterChips: getVendorFilterChips,
    filterItems: filterVendors,
    hasActiveFilters: hasVendorFilters,
  } = useFarmFilters<Vendor>();

  // Filter hooks for orders
  const {
    filters: orderFilters,
    setFilter: setOrderFilter,
    removeFilter: removeOrderFilter,
    clearAllFilters: clearOrderFilters,
    getActiveFilterChips: getOrderFilterChips,
    filterItems: filterOrders,
    hasActiveFilters: hasOrderFilters,
  } = useFarmFilters<PurchaseOrder>();

  useEffect(() => {
    loadProcurementData();
  }, []);

  // Filter definitions for FarmSearchAndFilter
  const inventoryFilterDefinitions: FilterDefinition[] = useMemo(
    () => [
      {
        id: "category",
        label: "Category",
        placeholder: "Filter by category",
        options: [
          { value: "all", label: "All Categories" },
          { value: "Seeds", label: "Seeds" },
          { value: "Nutrients", label: "Nutrients" },
          { value: "Growing Media", label: "Growing Media" },
          { value: "pH Control", label: "pH Control" },
          { value: "Packaging", label: "Packaging" },
        ],
        defaultValue: "all",
      },
      {
        id: "status",
        label: "Stock Status",
        placeholder: "Filter by status",
        options: [
          { value: "all", label: "All Status" },
          { value: "in-stock", label: "In Stock" },
          { value: "low-stock", label: "Low Stock" },
          { value: "out-of-stock", label: "Out of Stock" },
          { value: "overstock", label: "Overstock" },
        ],
        defaultValue: "all",
      },
    ],
    [],
  );

  const vendorFilterDefinitions: FilterDefinition[] = useMemo(
    () => [
      {
        id: "category",
        label: "Category",
        placeholder: "Filter by category",
        options: [
          { value: "all", label: "All Categories" },
          { value: "Seeds & Plants", label: "Seeds & Plants" },
          { value: "Nutrients & Solutions", label: "Nutrients & Solutions" },
          { value: "Growing Media", label: "Growing Media" },
          { value: "Packaging & Containers", label: "Packaging & Containers" },
        ],
        defaultValue: "all",
      },
      {
        id: "status",
        label: "Status",
        placeholder: "Filter by status",
        options: [
          { value: "all", label: "All Status" },
          { value: "preferred", label: "Preferred" },
          { value: "active", label: "Active" },
          { value: "inactive", label: "Inactive" },
        ],
        defaultValue: "all",
      },
    ],
    [],
  );

  const orderFilterDefinitions: FilterDefinition[] = useMemo(
    () => [
      {
        id: "status",
        label: "Order Status",
        placeholder: "Filter by status",
        options: [
          { value: "all", label: "All Status" },
          { value: "pending", label: "Pending" },
          { value: "ordered", label: "Ordered" },
          { value: "shipped", label: "Shipped" },
          { value: "delivered", label: "Delivered" },
          { value: "cancelled", label: "Cancelled" },
        ],
        defaultValue: "all",
      },
    ],
    [],
  );

  // Handle filter changes for inventory
  const handleFilterChange = useCallback(
    (filterId: string, value: string) => {
      if (value === "all") {
        removeFilter(filterId);
      } else {
        setFilter(filterId, value);
      }
    },
    [setFilter, removeFilter],
  );

  const handleRemoveFilter = useCallback(
    (filterId: string) => {
      removeFilter(filterId);
    },
    [removeFilter],
  );

  // Handle filter changes for vendors
  const handleVendorFilterChange = useCallback(
    (filterId: string, value: string) => {
      if (value === "all") {
        removeVendorFilter(filterId);
      } else {
        setVendorFilter(filterId, value);
      }
    },
    [setVendorFilter, removeVendorFilter],
  );

  const handleRemoveVendorFilter = useCallback(
    (filterId: string) => {
      removeVendorFilter(filterId);
    },
    [removeVendorFilter],
  );

  // Handle filter changes for orders
  const handleOrderFilterChange = useCallback(
    (filterId: string, value: string) => {
      if (value === "all") {
        removeOrderFilter(filterId);
      } else {
        setOrderFilter(filterId, value);
      }
    },
    [setOrderFilter, removeOrderFilter],
  );

  const handleRemoveOrderFilter = useCallback(
    (filterId: string) => {
      removeOrderFilter(filterId);
    },
    [removeOrderFilter],
  );

  const loadProcurementData = async () => {
    try {
      setLoading(true);

      // Mock data - replace with actual API calls
      const inventoryData: InventoryItem[] = [
        {
          id: "seeds-lettuce",
          name: "Lettuce Seeds - Buttercrunch",
          category: "Seeds",
          currentStock: 45,
          minStock: 20,
          maxStock: 100,
          unit: "packets",
          unitCost: 3.5,
          totalValue: 157.5,
          status: "in-stock",
          lastOrdered: "2024-01-15",
          supplier: "Johnny's Seeds",
        },
        {
          id: "nutrient-solution",
          name: "Hydroponic Nutrient Solution",
          category: "Nutrients",
          currentStock: 8,
          minStock: 15,
          maxStock: 50,
          unit: "gallons",
          unitCost: 24.99,
          totalValue: 199.92,
          status: "low-stock",
          lastOrdered: "2024-01-10",
          supplier: "General Hydroponics",
        },
        {
          id: "growing-medium",
          name: "Rockwool Growing Medium",
          category: "Growing Media",
          currentStock: 0,
          minStock: 10,
          maxStock: 25,
          unit: "slabs",
          unitCost: 12.75,
          totalValue: 0,
          status: "out-of-stock",
          lastOrdered: "2024-01-05",
          supplier: "Grodan",
        },
        {
          id: "ph-solution",
          name: "pH Up Solution",
          category: "pH Control",
          currentStock: 6,
          minStock: 3,
          maxStock: 12,
          unit: "bottles",
          unitCost: 15.99,
          totalValue: 95.94,
          status: "in-stock",
          lastOrdered: "2024-01-12",
          supplier: "General Hydroponics",
        },
        {
          id: "containers",
          name: "Harvest Containers - 1lb",
          category: "Packaging",
          currentStock: 250,
          minStock: 100,
          maxStock: 200,
          unit: "containers",
          unitCost: 0.45,
          totalValue: 112.5,
          status: "overstock",
          lastOrdered: "2024-01-08",
          supplier: "Packaging Solutions Inc",
        },
      ];

      const vendorData: Vendor[] = [
        {
          id: "johnnys-seeds",
          name: "Johnny's Seeds",
          category: "Seeds & Plants",
          rating: 4.8,
          totalOrders: 24,
          totalSpent: 2450.0,
          avgDeliveryDays: 3,
          status: "preferred",
          contact: "orders@johnnyseeds.com",
          lastOrder: "2024-01-15",
        },
        {
          id: "general-hydro",
          name: "General Hydroponics",
          category: "Nutrients & Solutions",
          rating: 4.5,
          totalOrders: 18,
          totalSpent: 1890.0,
          avgDeliveryDays: 2,
          status: "active",
          contact: "sales@generalhydroponics.com",
          lastOrder: "2024-01-12",
        },
        {
          id: "grodan",
          name: "Grodan",
          category: "Growing Media",
          rating: 4.7,
          totalOrders: 12,
          totalSpent: 980.0,
          avgDeliveryDays: 5,
          status: "active",
          contact: "info@grodan.com",
          lastOrder: "2024-01-05",
        },
        {
          id: "packaging-solutions",
          name: "Packaging Solutions Inc",
          category: "Packaging & Containers",
          rating: 4.2,
          totalOrders: 8,
          totalSpent: 560.0,
          avgDeliveryDays: 4,
          status: "active",
          contact: "sales@packagingsolutions.com",
          lastOrder: "2024-01-08",
        },
      ];

      const priceData: PriceIntelligence[] = [
        {
          item: "Lettuce Seeds - Buttercrunch",
          currentPrice: 3.5,
          marketAverage: 4.2,
          trend: "stable",
          savings: 0.7,
          recommendation: "Good price, consider bulk order",
          sources: 8,
        },
        {
          item: "Hydroponic Nutrient Solution",
          currentPrice: 24.99,
          marketAverage: 23.5,
          trend: "up",
          savings: -1.49,
          recommendation: "Price above market, research alternatives",
          sources: 12,
        },
        {
          item: "Rockwool Growing Medium",
          currentPrice: 12.75,
          marketAverage: 14.0,
          trend: "down",
          savings: 1.25,
          recommendation: "Excellent price, reorder immediately",
          sources: 6,
        },
      ];

      const orderData: PurchaseOrder[] = [
        {
          id: "PO-2024-001",
          vendor: "Johnny's Seeds",
          items: 5,
          total: 287.5,
          status: "delivered",
          orderDate: "2024-01-15",
          expectedDelivery: "2024-01-18",
        },
        {
          id: "PO-2024-002",
          vendor: "General Hydroponics",
          items: 3,
          total: 124.97,
          status: "shipped",
          orderDate: "2024-01-16",
          expectedDelivery: "2024-01-19",
        },
        {
          id: "PO-2024-003",
          vendor: "Grodan",
          items: 2,
          total: 255.0,
          status: "pending",
          orderDate: "2024-01-17",
          expectedDelivery: "2024-01-22",
        },
      ];

      setInventory(inventoryData);
      setVendors(vendorData);
      setPriceIntelligence(priceData);
      setPurchaseOrders(orderData);
    } catch (error) {
      console.error("Error loading procurement data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStockStatusType = (
    status: InventoryItem["status"],
  ): "success" | "warning" | "error" | "info" => {
    switch (status) {
      case "in-stock":
        return "success";
      case "low-stock":
        return "warning";
      case "out-of-stock":
        return "error";
      case "overstock":
        return "info";
      default:
        return "warning";
    }
  };

  const getVendorStatusType = (
    status: Vendor["status"],
  ): "success" | "info" | "offline" => {
    switch (status) {
      case "preferred":
        return "success";
      case "active":
        return "info";
      case "inactive":
        return "offline";
      default:
        return "offline";
    }
  };

  const getOrderStatusType = (
    status: PurchaseOrder["status"],
  ): "success" | "info" | "warning" | "error" => {
    switch (status) {
      case "delivered":
        return "success";
      case "shipped":
        return "info";
      case "ordered":
        return "warning";
      case "pending":
        return "warning";
      case "cancelled":
        return "error";
      default:
        return "warning";
    }
  };

  // Compatibility helpers for existing Badge usages
  const getVendorStatusColor = (status: Vendor["status"]) => {
    switch (status) {
      case "preferred":
        return "bg-green-100 text-green-800";
      case "active":
        return "bg-blue-100 text-blue-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getOrderStatusColor = (status: PurchaseOrder["status"]) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-800";
      case "shipped":
        return "bg-blue-100 text-blue-800";
      case "ordered":
        return "bg-yellow-100 text-yellow-800";
      case "pending":
        return "bg-orange-100 text-orange-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTrendIcon = (trend: "up" | "down" | "stable") => {
    switch (trend) {
      case "up":
        return <FaArrowUp className="text-red-500" />;
      case "down":
        return <FaArrowDown className="text-green-500" />;
      case "stable":
        return <FaCheck className="text-gray-500" />;
    }
  };

  // Apply combined filtering
  const filteredInventory = useMemo(() => {
    let result = inventory;

    // Apply search filtering
    result = searchFilterItems(result);

    // Apply standard filters
    result = filterFilterItems(result);

    return result;
  }, [inventory, searchFilterItems, filterFilterItems]);

  const filteredVendors = useMemo(() => {
    let result = vendors;

    // Apply search filtering
    result = searchFilterVendors(result);

    // Apply standard filters
    result = filterVendors(result);

    return result;
  }, [vendors, searchFilterVendors, filterVendors]);

  const filteredOrders = useMemo(() => {
    let result = purchaseOrders;

    // Apply search filtering
    result = searchFilterOrders(result);

    // Apply standard filters
    result = filterOrders(result);

    return result;
  }, [purchaseOrders, searchFilterOrders, filterOrders]);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader
        title="Procurement"
        description="Manage inventory, vendors, and supply chain operations"
      >
        <div className="flex space-x-2">
          <FarmControlButton variant="default">
            <FaSearch className="mr-2" />
            Price Scout
          </FarmControlButton>
          <FarmControlButton variant="primary">
            <FaPlus className="mr-2" />
            New Order
          </FarmControlButton>
        </div>
      </PageHeader>

      <Tabs defaultValue="inventory" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="inventory" className="flex items-center gap-2">
            <FaBoxes className="h-4 w-4" />
            Inventory
          </TabsTrigger>
          <TabsTrigger value="vendors" className="flex items-center gap-2">
            <FaBuilding className="h-4 w-4" />
            Vendors
          </TabsTrigger>
          <TabsTrigger value="pricing" className="flex items-center gap-2">
            <FaDollarSign className="h-4 w-4" />
            Price Intelligence
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <FaCreditCard className="h-4 w-4" />
            Purchase Orders
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-6">
          {/* Standardized Search and Filter Component */}
          <Card className="mb-6">
            <CardContent className="pt-4">
              <FarmSearchAndFilter
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                searchContext="inventory items, categories, suppliers"
                searchPlaceholder="Search inventory items, categories, suppliers..."
                filters={inventoryFilterDefinitions}
                activeFilters={getActiveFilterChips(inventoryFilterDefinitions)}
                onFilterChange={handleFilterChange}
                onRemoveFilter={handleRemoveFilter}
                onClearAllFilters={clearAllFilters}
                orientation="horizontal"
                showFilterChips={true}
              />

              {/* Results summary and actions */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Showing {filteredInventory.length} of {inventory.length}{" "}
                  inventory items
                </p>
                <div className="flex space-x-2">
                  <FarmControlButton variant="default" size="sm">
                    <FaBoxes className="mr-2" />
                    Bulk Actions
                  </FarmControlButton>
                  {(hasSearch || hasActiveFilters) && (
                    <FarmControlButton
                      size="sm"
                      variant="default"
                      onClick={() => {
                        clearSearch();
                        clearAllFilters();
                      }}
                    >
                      Clear all filters
                    </FarmControlButton>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredInventory.map((item) => (
              <Card
                key={item.id}
                className="hover:shadow-lg transition-shadow card-shadow"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <StatusBadge status={getStockStatusType(item.status)}>
                      {item.status.replace("-", " ")}
                    </StatusBadge>
                    <FarmControlButton variant="default" size="sm">
                      <FaEdit className="text-gray-400" />
                    </FarmControlButton>
                  </div>
                  <CardTitle className="text-sm font-medium">
                    {item.name}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {item.category}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-control-label">Stock:</span>
                    <span className="font-semibold">
                      {item.currentStock} {item.unit}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        item.currentStock <= item.minStock
                          ? "bg-red-500"
                          : item.currentStock >= item.maxStock
                            ? "bg-blue-500"
                            : "bg-green-500"
                      }`}
                      style={{
                        width: `${Math.min((item.currentStock / item.maxStock) * 100, 100)}%`,
                      }}
                    ></div>
                  </div>
                  <div className="flex justify-between items-center text-xs text-control-label opacity-70">
                    <span>Min: {item.minStock}</span>
                    <span>Max: {item.maxStock}</span>
                  </div>
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-control-label">Value:</span>
                      <span className="font-semibold">
                        ${item.totalValue.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-control-label opacity-70">
                        @ ${item.unitCost}/{item.unit}
                      </span>
                      <span className="text-control-label opacity-70">
                        {item.supplier}
                      </span>
                    </div>
                  </div>
                  {item.status === "low-stock" ||
                  item.status === "out-of-stock" ? (
                    <FarmControlButton
                      size="sm"
                      className="w-full mt-2"
                      variant="primary"
                    >
                      <FaShoppingCart className="mr-2" />
                      Reorder
                    </FarmControlButton>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="vendors" className="space-y-6">
          {/* Standardized Search and Filter Component for Vendors */}
          <Card className="mb-6">
            <CardContent className="pt-4">
              <FarmSearchAndFilter
                searchValue={vendorSearchTerm}
                onSearchChange={setVendorSearchTerm}
                searchContext="vendors by name, category, contact"
                searchPlaceholder="Search vendors by name, category, contact..."
                filters={vendorFilterDefinitions}
                activeFilters={getVendorFilterChips(vendorFilterDefinitions)}
                onFilterChange={handleVendorFilterChange}
                onRemoveFilter={handleRemoveVendorFilter}
                onClearAllFilters={clearVendorFilters}
                orientation="horizontal"
                showFilterChips={true}
              />

              {/* Results summary and actions */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Showing {filteredVendors.length} of {vendors.length} vendors
                </p>
                <div className="flex space-x-2">
                  <FarmControlButton variant="default" size="sm">
                    <FaPlus className="mr-2" />
                    Add Vendor
                  </FarmControlButton>
                  {(hasVendorSearch || hasVendorFilters) && (
                    <FarmControlButton
                      size="sm"
                      variant="default"
                      onClick={() => {
                        clearVendorSearch();
                        clearVendorFilters();
                      }}
                    >
                      Clear all filters
                    </FarmControlButton>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredVendors.map((vendor) => (
              <Card
                key={vendor.id}
                className="hover:shadow-lg transition-shadow card-shadow"
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <FaBuilding className="text-blue-600" />
                      <div>
                        <CardTitle className="text-lg text-farm-title">
                          {vendor.name}
                        </CardTitle>
                        <CardDescription className="text-control-label">
                          {vendor.category}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge className={getVendorStatusColor(vendor.status)}>
                      {vendor.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-control-label">Rating</p>
                      <div className="flex items-center space-x-1">
                        <span className="font-semibold">{vendor.rating}</span>
                        <span className="text-yellow-500">★</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-control-label">Orders</p>
                      <p className="font-semibold">{vendor.totalOrders}</p>
                    </div>
                    <div>
                      <p className="text-sm text-control-label">Total Spent</p>
                      <p className="font-semibold">
                        ${vendor.totalSpent.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-control-label">Avg Delivery</p>
                      <p className="font-semibold">
                        {vendor.avgDeliveryDays} days
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-control-label">Contact</p>
                    <p className="text-sm">{vendor.contact}</p>
                    <p className="text-xs text-control-label opacity-70 mt-1">
                      Last order:{" "}
                      {new Date(vendor.lastOrder).toLocaleDateString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="pricing" className="space-y-6">
          <Card className="card-shadow">
            <CardHeader>
              <CardTitle className="text-farm-title">
                Price Intelligence Dashboard
              </CardTitle>
              <CardDescription className="text-control-label">
                Market price analysis and procurement recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {priceIntelligence.map((item, index) => (
                  <div
                    key={index}
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-farm-title">
                        {item.item}
                      </h4>
                      <div className="flex items-center space-x-2">
                        {getTrendIcon(item.trend)}
                        <span className="text-sm text-control-label">
                          {item.sources} sources
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-control-label">Your Price</p>
                        <p className="text-lg font-semibold">
                          ${item.currentPrice.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-control-label">
                          Market Average
                        </p>
                        <p className="text-lg font-semibold">
                          ${item.marketAverage.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-control-label">Savings</p>
                        <p
                          className={`text-lg font-semibold ${item.savings >= 0 ? "state-growing" : "state-offline"}`}
                        >
                          {item.savings >= 0 ? "+" : ""}$
                          {item.savings.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-control-label">
                          Recommendation
                        </p>
                        <p className="text-sm">{item.recommendation}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-6">
          {/* Standardized Search and Filter Component for Orders */}
          <Card className="mb-6">
            <CardContent className="pt-4">
              <FarmSearchAndFilter
                searchValue={orderSearchTerm}
                onSearchChange={setOrderSearchTerm}
                searchContext="orders by ID or vendor"
                searchPlaceholder="Search orders by ID or vendor..."
                filters={orderFilterDefinitions}
                activeFilters={getOrderFilterChips(orderFilterDefinitions)}
                onFilterChange={handleOrderFilterChange}
                onRemoveFilter={handleRemoveOrderFilter}
                onClearAllFilters={clearOrderFilters}
                orientation="horizontal"
                showFilterChips={true}
              />

              {/* Results summary and actions */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Showing {filteredOrders.length} of {purchaseOrders.length}{" "}
                  orders
                </p>
                <div className="flex space-x-2">
                  <FarmControlButton variant="default" size="sm">
                    <FaPlus className="mr-2" />
                    Create Order
                  </FarmControlButton>
                  {(hasOrderSearch || hasOrderFilters) && (
                    <FarmControlButton
                      size="sm"
                      variant="default"
                      onClick={() => {
                        clearOrderSearch();
                        clearOrderFilters();
                      }}
                    >
                      Clear all filters
                    </FarmControlButton>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <Card
                key={order.id}
                className="hover:shadow-lg transition-shadow card-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div>
                        <h4 className="font-semibold text-farm-title">
                          {order.id}
                        </h4>
                        <p className="text-sm text-control-label">
                          {order.vendor}
                        </p>
                      </div>
                      <Badge className={getOrderStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${order.total.toFixed(2)}</p>
                      <p className="text-sm text-control-label">
                        {order.items} items
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-control-label">Order Date</p>
                      <p>{new Date(order.orderDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-control-label">Expected Delivery</p>
                      <p>
                        {new Date(order.expectedDelivery).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
