"use client";

import React, { useState, useEffect } from 'react';
import { CurrencyDollarIcon, ChartBarIcon, UsersIcon, ShoppingCartIcon } from '@heroicons/react/24/outline';
import { EmptyStateWithIntegrations, IntegrationHint } from '@/components/features/automation';
import { BUSINESS_INTEGRATIONS, INTEGRATION_MESSAGES, INTEGRATION_CONTEXTS } from '@/lib/integrations/constants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataChart } from '@/components/features/business';

// Mock data to simulate existing business data
interface BusinessData {
  revenue: number;
  customers: number;
  orders: number;
  hasData: boolean;
}
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
import { CustomersView, OrdersInvoicesView, PaymentsView, InventoryView } from '@/components/features/business';
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

const BusinessPage: React.FC = () => {
  const [businessData, setBusinessData] = useState<BusinessData>({
    revenue: 0,
    customers: 0,
    orders: 0,
    hasData: false
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading business data
    const loadBusinessData = async () => {
      setIsLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if user has connected business integrations
      const hasConnectedIntegrations = localStorage.getItem('business-integrations-connected');
      
      if (hasConnectedIntegrations) {
        setBusinessData({
          revenue: 12450,
          customers: 89,
          orders: 156,
          hasData: true
        });
      } else {
        setBusinessData({
          revenue: 0,
          customers: 0,
          orders: 0,
          hasData: false
        });
      }
      
      setIsLoading(false);
    };

    loadBusinessData();
  }, []);

  const handleConnectIntegration = (integrationName: string) => {
    console.log(`Connecting to ${integrationName}...`);
    // This would typically redirect to integration setup
    window.location.href = `/integrations/${integrationName.toLowerCase().replace(/\s+/g, '-')}`;
  };

  const businessIntegrationsWithHandlers = BUSINESS_INTEGRATIONS.map(integration => ({
    ...integration,
    onConnect: () => handleConnectIntegration(integration.name)
  }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show empty state if no business data
  if (!businessData.hasData) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Business Management"
          description="Track sales, manage customers, and grow your vertical farming business."
        />

        <EmptyStateWithIntegrations
          pageType="business"
          title="Track Your Farm Revenue"
          description="Connect your payment processor to see revenue, trends, and customer data automatically synced to your dashboard."
          integrations={businessIntegrationsWithHandlers}
        />
      </div>
    );
  }

  // Show dashboard with integration hints
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Business Management"
        description="Track sales, manage customers, and grow your vertical farming business."
      />

      {/* Integration Hint */}
      <IntegrationHint
        message={INTEGRATION_MESSAGES.business}
        integrations={['Square', 'Stripe', 'QuickBooks', 'HubSpot']}
        pageContext={INTEGRATION_CONTEXTS.business}
        variant="info"
      />

      {/* Business Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CurrencyDollarIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                  <dd className="text-lg font-medium text-gray-900">${businessData.revenue.toLocaleString()}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UsersIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Customers</dt>
                  <dd className="text-lg font-medium text-gray-900">{businessData.customers}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ShoppingCartIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Orders</dt>
                  <dd className="text-lg font-medium text-gray-900">{businessData.orders}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Revenue Trends</h3>
          <ChartBarIcon className="h-5 w-5 text-gray-400" />
        </div>
        <DataChart
          data={[
            { date: '2024-01-01', revenue: 18000, orders: 45, avgOrderValue: 400 },
            { date: '2024-01-02', revenue: 21750, orders: 52, avgOrderValue: 418 },
            { date: '2024-01-03', revenue: 14700, orders: 38, avgOrderValue: 387 },
            { date: '2024-01-04', revenue: 24750, orders: 61, avgOrderValue: 405 },
            { date: '2024-01-05', revenue: 19800, orders: 49, avgOrderValue: 404 },
            { date: '2024-01-06', revenue: 26700, orders: 68, avgOrderValue: 393 },
            { date: '2024-01-07', revenue: 28350, orders: 72, avgOrderValue: 394 }
          ]}
          config={{
            type: 'line',
            title: 'Revenue & Sales Performance',
            height: 280,
            timeScale: false,
            xAxisKey: 'date',
            yAxisKeys: ['revenue', 'orders'],
            colors: ['#10b981', '#3b82f6'],
            formatters: {
              revenue: (value: number) => `$${value.toLocaleString()}`,
              orders: (value: number) => `${value} orders`
            }
          }}
        />
      </div>

      {/* Recent Orders */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Orders</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-900">Mixed Greens Box - Sarah Johnson</span>
            <span className="text-sm font-medium text-green-600">$24.99</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-900">Microgreens Variety Pack - Mike Chen</span>
            <span className="text-sm font-medium text-green-600">$18.50</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-900">Fresh Herbs Bundle - Lisa Rodriguez</span>
            <span className="text-sm font-medium text-green-600">$15.75</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessPage; 