"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Receipt, DollarSign, Package, TrendingUp } from "lucide-react";
import CustomersView from "@/components/business-management/CustomersView";
import OrdersInvoicesView from "@/components/business-management/OrdersInvoicesView";
import PaymentsView from "@/components/business-management/PaymentsView";
import InventoryView from "@/components/business-management/InventoryView";
import RevenueAnalyticsView from "@/components/business-management/RevenueAnalyticsView";

export default function BusinessManagementPage() {
  const [activeTab, setActiveTab] = useState("customers");

  return (
    <div className="flex-1 p-8 animate-pop">
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold text-green-900 dark:text-green-100 drop-shadow-lg border-b-2 border-green-200 dark:border-green-800 pb-4">
          Business Management
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 mt-2">
          Manage customers, orders, payments, and business analytics
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="customers" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Customers
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Orders & Invoices
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Payments
          </TabsTrigger>
          <TabsTrigger value="inventory" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Inventory
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Revenue Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="customers" className="mt-6">
          <CustomersView />
        </TabsContent>

        <TabsContent value="orders" className="mt-6">
          <OrdersInvoicesView />
        </TabsContent>

        <TabsContent value="payments" className="mt-6">
          <PaymentsView />
        </TabsContent>

        <TabsContent value="inventory" className="mt-6">
          <InventoryView />
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <RevenueAnalyticsView />
        </TabsContent>
      </Tabs>
    </div>
  );
} 