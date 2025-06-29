"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  DollarSign, 
  Package, 
  TrendingUp, 
  Receipt, 
  RotateCcw,
  AlertTriangle,
  UserCheck,
  Banknote,
  Search,
  Eye,
  Calendar,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';

// Import view components
import CustomersView from '@/components/business-management/CustomersView';
import OrdersInvoicesView from '@/components/business-management/OrdersInvoicesView';
import PaymentsView from '@/components/business-management/PaymentsView';
import InventoryView from '@/components/business-management/InventoryView';
// import TeamMembersView from '@/components/business-management/TeamMembersView';
// import DisputesView from '@/components/business-management/DisputesView';
// import RefundsView from '@/components/business-management/RefundsView';
// import PayoutsView from '@/components/business-management/PayoutsView';

// Create placeholder components for the new tabs
const TeamMembersView = () => (
  <div className="space-y-6">
    <div className="text-center py-8">
      <UserCheck className="mx-auto h-12 w-12 text-gray-400 mb-4" />
      <p className="text-gray-500">Team Members view with Square data loading...</p>
    </div>
  </div>
);

const DisputesView = () => (
  <div className="space-y-6">
    <div className="text-center py-8">
      <AlertTriangle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
      <p className="text-gray-500">Disputes view with Square data loading...</p>
    </div>
  </div>
);

const RefundsView = () => (
  <div className="space-y-6">
    <div className="text-center py-8">
      <RotateCcw className="mx-auto h-12 w-12 text-gray-400 mb-4" />
      <p className="text-gray-500">Refunds view with Square data loading...</p>
    </div>
  </div>
);

const PayoutsView = () => (
  <div className="space-y-6">
    <div className="text-center py-8">
      <Banknote className="mx-auto h-12 w-12 text-gray-400 mb-4" />
      <p className="text-gray-500">Payouts view with Square data loading...</p>
    </div>
  </div>
);

const SubscriptionsView = () => (
  <div className="space-y-6">
    <div className="text-center py-8">
      <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
      <p className="text-gray-500">Subscriptions view coming soon...</p>
    </div>
  </div>
);

const InvoicesView = () => (
  <div className="space-y-6">
    <div className="text-center py-8">
      <Receipt className="mx-auto h-12 w-12 text-gray-400 mb-4" />
      <p className="text-gray-500">Invoices view coming soon...</p>
    </div>
  </div>
);

export default function BusinessManagementPage() {
  const [activeTab, setActiveTab] = useState("customers");

  return (
    <div className="flex-1 p-8 animate-pop">
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold text-green-900 dark:text-green-100 drop-shadow-lg border-b-2 border-green-200 dark:border-green-800 pb-4">
          Business Management
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 mt-2">
          Manage customers, orders, payments, team, and business analytics with live Square data
        </p>
      </div>

      <Tabs defaultValue="customers" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 lg:grid-cols-10">
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="refunds">Refunds</TabsTrigger>
          <TabsTrigger value="disputes">Disputes</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
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

        <TabsContent value="refunds" className="mt-6">
          <RefundsView />
        </TabsContent>

        <TabsContent value="disputes" className="mt-6">
          <DisputesView />
        </TabsContent>

        <TabsContent value="team" className="mt-6">
          <TeamMembersView />
        </TabsContent>

        <TabsContent value="payouts" className="mt-6">
          <PayoutsView />
        </TabsContent>

        <TabsContent value="inventory" className="mt-6">
          <InventoryView />
        </TabsContent>

        <TabsContent value="subscriptions" className="mt-6">
          <SubscriptionsView />
        </TabsContent>

        <TabsContent value="invoices" className="mt-6">
          <InvoicesView />
        </TabsContent>
      </Tabs>
    </div>
  );
} 