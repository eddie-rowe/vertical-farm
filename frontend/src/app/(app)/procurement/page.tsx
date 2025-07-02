'use client';

import { useState, useEffect } from 'react';
import { FaBoxes, FaShoppingCart, FaBuilding, FaArrowUp, FaArrowDown, FaCheck, FaSearch, FaPlus, FaEdit } from '@/lib/icons';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/PageHeader';

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
  status: 'in-stock' | 'low-stock' | 'out-of-stock' | 'overstock';
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
  status: 'active' | 'inactive' | 'preferred';
  contact: string;
  lastOrder: string;
}

interface PriceIntelligence {
  item: string;
  currentPrice: number;
  marketAverage: number;
  trend: 'up' | 'down' | 'stable';
  savings: number;
  recommendation: string;
  sources: number;
}

interface PurchaseOrder {
  id: string;
  vendor: string;
  items: number;
  total: number;
  status: 'pending' | 'ordered' | 'shipped' | 'delivered' | 'cancelled';
  orderDate: string;
  expectedDelivery: string;
}

export default function ProcurementPage() {
  const [loading, setLoading] = useState(true);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [priceIntelligence, setPriceIntelligence] = useState<PriceIntelligence[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadProcurementData();
  }, []);

  const loadProcurementData = async () => {
    try {
      setLoading(true);
      
      // Mock data - replace with actual API calls
      const inventoryData: InventoryItem[] = [
        {
          id: 'seeds-lettuce',
          name: 'Lettuce Seeds - Buttercrunch',
          category: 'Seeds',
          currentStock: 45,
          minStock: 20,
          maxStock: 100,
          unit: 'packets',
          unitCost: 3.50,
          totalValue: 157.50,
          status: 'in-stock',
          lastOrdered: '2024-01-15',
          supplier: 'Johnny\'s Seeds'
        },
        {
          id: 'nutrient-solution',
          name: 'Hydroponic Nutrient Solution',
          category: 'Nutrients',
          currentStock: 8,
          minStock: 15,
          maxStock: 50,
          unit: 'gallons',
          unitCost: 24.99,
          totalValue: 199.92,
          status: 'low-stock',
          lastOrdered: '2024-01-10',
          supplier: 'General Hydroponics'
        },
        {
          id: 'growing-medium',
          name: 'Rockwool Growing Medium',
          category: 'Growing Media',
          currentStock: 0,
          minStock: 10,
          maxStock: 25,
          unit: 'slabs',
          unitCost: 12.75,
          totalValue: 0,
          status: 'out-of-stock',
          lastOrdered: '2024-01-05',
          supplier: 'Grodan'
        },
        {
          id: 'ph-solution',
          name: 'pH Up Solution',
          category: 'pH Control',
          currentStock: 6,
          minStock: 3,
          maxStock: 12,
          unit: 'bottles',
          unitCost: 15.99,
          totalValue: 95.94,
          status: 'in-stock',
          lastOrdered: '2024-01-12',
          supplier: 'General Hydroponics'
        },
        {
          id: 'containers',
          name: 'Harvest Containers - 1lb',
          category: 'Packaging',
          currentStock: 250,
          minStock: 100,
          maxStock: 200,
          unit: 'containers',
          unitCost: 0.45,
          totalValue: 112.50,
          status: 'overstock',
          lastOrdered: '2024-01-08',
          supplier: 'Packaging Solutions Inc'
        }
      ];

      const vendorData: Vendor[] = [
        {
          id: 'johnnys-seeds',
          name: 'Johnny\'s Seeds',
          category: 'Seeds & Plants',
          rating: 4.8,
          totalOrders: 24,
          totalSpent: 2450.00,
          avgDeliveryDays: 3,
          status: 'preferred',
          contact: 'orders@johnnyseeds.com',
          lastOrder: '2024-01-15'
        },
        {
          id: 'general-hydro',
          name: 'General Hydroponics',
          category: 'Nutrients & Solutions',
          rating: 4.5,
          totalOrders: 18,
          totalSpent: 1890.00,
          avgDeliveryDays: 2,
          status: 'active',
          contact: 'sales@generalhydroponics.com',
          lastOrder: '2024-01-12'
        },
        {
          id: 'grodan',
          name: 'Grodan',
          category: 'Growing Media',
          rating: 4.7,
          totalOrders: 12,
          totalSpent: 980.00,
          avgDeliveryDays: 5,
          status: 'active',
          contact: 'info@grodan.com',
          lastOrder: '2024-01-05'
        },
        {
          id: 'packaging-solutions',
          name: 'Packaging Solutions Inc',
          category: 'Packaging & Containers',
          rating: 4.2,
          totalOrders: 8,
          totalSpent: 560.00,
          avgDeliveryDays: 4,
          status: 'active',
          contact: 'sales@packagingsolutions.com',
          lastOrder: '2024-01-08'
        }
      ];

      const priceData: PriceIntelligence[] = [
        {
          item: 'Lettuce Seeds - Buttercrunch',
          currentPrice: 3.50,
          marketAverage: 4.20,
          trend: 'stable',
          savings: 0.70,
          recommendation: 'Good price, consider bulk order',
          sources: 8
        },
        {
          item: 'Hydroponic Nutrient Solution',
          currentPrice: 24.99,
          marketAverage: 23.50,
          trend: 'up',
          savings: -1.49,
          recommendation: 'Price above market, research alternatives',
          sources: 12
        },
        {
          item: 'Rockwool Growing Medium',
          currentPrice: 12.75,
          marketAverage: 14.00,
          trend: 'down',
          savings: 1.25,
          recommendation: 'Excellent price, reorder immediately',
          sources: 6
        }
      ];

      const orderData: PurchaseOrder[] = [
        {
          id: 'PO-2024-001',
          vendor: 'Johnny\'s Seeds',
          items: 5,
          total: 287.50,
          status: 'delivered',
          orderDate: '2024-01-15',
          expectedDelivery: '2024-01-18'
        },
        {
          id: 'PO-2024-002',
          vendor: 'General Hydroponics',
          items: 3,
          total: 124.97,
          status: 'shipped',
          orderDate: '2024-01-16',
          expectedDelivery: '2024-01-19'
        },
        {
          id: 'PO-2024-003',
          vendor: 'Grodan',
          items: 2,
          total: 255.00,
          status: 'pending',
          orderDate: '2024-01-17',
          expectedDelivery: '2024-01-22'
        }
      ];

      setInventory(inventoryData);
      setVendors(vendorData);
      setPriceIntelligence(priceData);
      setPurchaseOrders(orderData);
    } catch (error) {
      console.error('Error loading procurement data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStockStatusColor = (status: InventoryItem['status']) => {
    switch (status) {
      case 'in-stock': return 'bg-green-100 text-green-800';
      case 'low-stock': return 'bg-yellow-100 text-yellow-800';
      case 'out-of-stock': return 'bg-red-100 text-red-800';
      case 'overstock': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getVendorStatusColor = (status: Vendor['status']) => {
    switch (status) {
      case 'preferred': return 'bg-green-100 text-green-800';
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getOrderStatusColor = (status: PurchaseOrder['status']) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'shipped': return 'bg-blue-100 text-blue-800';
      case 'ordered': return 'bg-yellow-100 text-yellow-800';
      case 'pending': return 'bg-orange-100 text-orange-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <FaArrowUp className="text-red-500" />;
      case 'down': return <FaArrowDown className="text-green-500" />;
      case 'stable': return <FaCheck className="text-gray-500" />;
    }
  };

  const filteredInventory = inventory.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        size="lg"
      >
        <div className="flex space-x-2">
          <Button variant="outline">
            <FaSearch className="mr-2" />
            Price Scout
          </Button>
          <Button>
            <FaPlus className="mr-2" />
            New Order
          </Button>
        </div>
      </PageHeader>

      <Tabs defaultValue="inventory" className="space-y-6">
        <TabsList>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="vendors">Vendors</TabsTrigger>
          <TabsTrigger value="pricing">Price Intelligence</TabsTrigger>
          <TabsTrigger value="orders">Purchase Orders</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-md">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search inventory..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <FaBoxes className="mr-2" />
              Bulk Actions
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredInventory.map((item) => (
              <Card key={item.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Badge className={getStockStatusColor(item.status)}>
                      {item.status.replace('-', ' ')}
                    </Badge>
                    <Button variant="ghost" size="sm">
                      <FaEdit className="text-gray-400" />
                    </Button>
                  </div>
                  <CardTitle className="text-sm font-medium">{item.name}</CardTitle>
                  <CardDescription className="text-xs">{item.category}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Stock:</span>
                    <span className="font-semibold">
                      {item.currentStock} {item.unit}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        item.currentStock <= item.minStock ? 'bg-red-500' :
                        item.currentStock >= item.maxStock ? 'bg-blue-500' : 'bg-green-500'
                      }`}
                      style={{ 
                        width: `${Math.min((item.currentStock / item.maxStock) * 100, 100)}%` 
                      }}
                    ></div>
                  </div>
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>Min: {item.minStock}</span>
                    <span>Max: {item.maxStock}</span>
                  </div>
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Value:</span>
                      <span className="font-semibold">${item.totalValue.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500">@ ${item.unitCost}/{item.unit}</span>
                      <span className="text-gray-500">{item.supplier}</span>
                    </div>
                  </div>
                  {item.status === 'low-stock' || item.status === 'out-of-stock' ? (
                    <Button size="sm" className="w-full mt-2">
                      <FaShoppingCart className="mr-2" />
                      Reorder
                    </Button>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="vendors" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {vendors.map((vendor) => (
              <Card key={vendor.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <FaBuilding className="text-blue-600" />
                      <div>
                        <CardTitle className="text-lg">{vendor.name}</CardTitle>
                        <CardDescription>{vendor.category}</CardDescription>
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
                      <p className="text-sm text-gray-600 dark:text-gray-400">Rating</p>
                      <div className="flex items-center space-x-1">
                        <span className="font-semibold">{vendor.rating}</span>
                        <span className="text-yellow-500">★</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Orders</p>
                      <p className="font-semibold">{vendor.totalOrders}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Spent</p>
                      <p className="font-semibold">${vendor.totalSpent.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Avg Delivery</p>
                      <p className="font-semibold">{vendor.avgDeliveryDays} days</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Contact</p>
                    <p className="text-sm">{vendor.contact}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Last order: {new Date(vendor.lastOrder).toLocaleDateString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="pricing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Price Intelligence Dashboard</CardTitle>
              <CardDescription>
                Market price analysis and procurement recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {priceIntelligence.map((item, index) => (
                  <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-900 dark:text-white">{item.item}</h4>
                      <div className="flex items-center space-x-2">
                        {getTrendIcon(item.trend)}
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {item.sources} sources
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Your Price</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          ${item.currentPrice.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Market Average</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          ${item.marketAverage.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Savings</p>
                        <p className={`text-lg font-semibold ${item.savings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {item.savings >= 0 ? '+' : ''}${item.savings.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Recommendation</p>
                        <p className="text-sm text-gray-900 dark:text-white">{item.recommendation}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-6">
          <div className="space-y-4">
            {purchaseOrders.map((order) => (
              <Card key={order.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">{order.id}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{order.vendor}</p>
                      </div>
                      <Badge className={getOrderStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        ${order.total.toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {order.items} items
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Order Date</p>
                      <p className="text-gray-900 dark:text-white">
                        {new Date(order.orderDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Expected Delivery</p>
                      <p className="text-gray-900 dark:text-white">
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