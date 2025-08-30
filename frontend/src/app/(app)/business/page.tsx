"use client";

import {
  CurrencyDollarIcon,
  ChartBarIcon,
  UsersIcon,
  ShoppingCartIcon,
} from "@heroicons/react/24/outline";
import {
  Package,
  Receipt,
  CreditCard,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import React, { useState, useEffect } from "react";

// Import view components

// Import standardized components and hooks

// Import empty state component
import { EmptyStateWithIntegrations } from "@/components/features/automation";
import { DataChart } from "@/components/features/business";
import {
  CustomersView,
  OrdersInvoicesView,
  PaymentsView,
  TeamMembersView,
  DisputesView,
  RefundsView,
  PayoutsView,
} from "@/components/features/business";
import {
  usePageData,
  createIntegrationStorageKey,
  MetricsGrid,
  createMetric,
  MetricFormatters,
} from "@/components/shared";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { FarmControlButton } from "@/components/ui/farm-control-button";

// Import Square service

// Import loading components
import { LoadingCard } from "@/components/ui/loading";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { squareService, SquareConfig } from "@/services/squareService";

// Business data interface
interface BusinessData {
  revenue: number;
  customers: number;
  orders: number;
  hasData: boolean;
}

// Mock data for connected state
const mockBusinessData: BusinessData = {
  revenue: 12450,
  customers: 89,
  orders: 156,
  hasData: true,
};

// Placeholder components for features not yet implemented
const _SubscriptionsView = () => (
  <div className="space-y-6">
    <div className="text-center py-8">
      <Package className="mx-auto h-12 w-12 text-control-label mb-4" />
      <p className="text-control-label">Subscriptions view coming soon...</p>
    </div>
  </div>
);

const _InvoicesView = () => (
  <div className="space-y-6">
    <div className="text-center py-8">
      <Receipt className="mx-auto h-12 w-12 text-control-label mb-4" />
      <p className="text-control-label">Invoices view coming soon...</p>
    </div>
  </div>
);

const BusinessPage: React.FC = () => {
  // Square configuration state
  const [squareConfig, setSquareConfig] = useState<SquareConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [configError, setConfigError] = useState<string | null>(null);

  // Use standardized hooks for business data
  const {
    data: businessData,
    isLoading: _isLoading,
    hasData: _hasData,
  } = usePageData<BusinessData>({
    storageKey: createIntegrationStorageKey("business"),
    mockData: mockBusinessData,
    hasDataCheck: (data) => data.hasData,
  });

  // Load Square configuration on mount
  useEffect(() => {
    const loadSquareConfig = async () => {
      try {
        setConfigLoading(true);
        setConfigError(null);
        const activeConfig = await squareService.getActiveConfig();
        setSquareConfig(activeConfig);

        if (activeConfig) {
          // Test the connection to make sure it's working
          const status = await squareService.getStatus(activeConfig.id!);
          if (!status.connected) {
            setConfigError(
              "Square integration is configured but not connected. Please check your configuration.",
            );
          }
        }
      } catch {
        // Error loading Square configuration
        setConfigError("Failed to load Square configuration");
      } finally {
        setConfigLoading(false);
      }
    };

    loadSquareConfig();
  }, []);

  // Create metrics data
  const metrics = [
    createMetric(
      "revenue",
      CurrencyDollarIcon,
      "Total Revenue",
      businessData.revenue,
      {
        stateClass: "state-growing",
        iconColor: "text-sensor-value gradient-icon",
        valueFormatter: MetricFormatters.currency,
      },
    ),
    createMetric("customers", UsersIcon, "Customers", businessData.customers, {
      stateClass: "state-active",
      iconColor: "text-sensor-value gradient-icon",
    }),
    createMetric("orders", ShoppingCartIcon, "Orders", businessData.orders, {
      stateClass: "state-growing",
      iconColor: "text-sensor-value gradient-icon",
    }),
  ];

  // Show loading state while checking configuration
  if (configLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <PageHeader
          title="Business Management"
          description="Track sales, manage customers, and grow your vertical farming business."
        />
        <LoadingCard message="Loading Square configuration..." />
      </div>
    );
  }

  // Show empty state when Square is not configured
  if (!squareConfig) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <PageHeader
          title="Business Management"
          description="Track sales, manage customers, and grow your vertical farming business."
        />

        <EmptyStateWithIntegrations
          pageType="business"
          title="Connect Square to Get Started"
          description="To access your business data, connect your Square account. This will sync your customers, orders, payments, and inventory automatically."
          customIcon={CreditCard}
          integrations={[
            {
              name: "Square POS",
              icon: "square",
              benefit: "Sync customers, orders, and payments",
              setupTime: "5 minutes",
              status: "available" as const,
              difficulty: "easy" as const,
              onConnect: () => {
                window.location.href = "/integrations/square";
              },
            },
            {
              name: "Square Dashboard",
              icon: "chart",
              benefit: "View detailed analytics and reports",
              setupTime: "Instant",
              status: "available" as const,
              difficulty: "easy" as const,
              onConnect: () => {
                window.open("https://squareup.com/dashboard", "_blank");
              },
            },
            {
              name: "Square Inventory",
              icon: "inventory",
              benefit: "Track product stock levels",
              setupTime: "Included",
              status: "available" as const,
              difficulty: "easy" as const,
              onConnect: () => {
                window.location.href = "/integrations/square";
              },
            },
          ]}
        />

        {/* Quick Setup Card */}
        <Card className="bg-farm-white card-shadow state-active">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-farm-title mb-2">
                  Ready to Connect Square?
                </h3>
                <p className="text-control-content">
                  Set up your Square integration in just a few steps to start
                  tracking your business performance.
                </p>
              </div>
              <Link href="/integrations/square">
                <FarmControlButton className="flex items-center gap-2">
                  Setup Square Integration
                  <ExternalLink className="w-4 h-4" />
                </FarmControlButton>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Show error state if there's a configuration error
  if (configError) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <PageHeader
          title="Business Management"
          description="Track sales, manage customers, and grow your vertical farming business."
        />

        <Alert className="bg-control-secondary/10 border-control-secondary">
          <AlertTriangle className="h-4 w-4 text-control-secondary" />
          <AlertDescription className="text-control-secondary">
            {configError}
            <Link
              href="/integrations/square"
              className="ml-2 underline font-medium"
            >
              Check Square Configuration
            </Link>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Show full business management interface when Square is properly configured
  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader
        title="Business Management"
        description="Track sales, manage customers, and grow your vertical farming business."
      />

      {/* Business Management Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
          <TabsTrigger value="refunds">Refunds</TabsTrigger>
          <TabsTrigger value="disputes">Disputes</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Configuration Status */}
          <div className="bg-farm-white card-shadow rounded-lg p-4 state-growing">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-sensor-value" />
                <div>
                  <p className="text-sm font-medium text-farm-title">
                    Square Integration
                  </p>
                  <p className="text-xs text-control-content">
                    Connected • {squareConfig.environment}
                  </p>
                </div>
              </div>
              <Badge className="bg-sensor-bg text-sensor-value border-sensor-value">
                Active
              </Badge>
            </div>
          </div>

          {/* Business Metrics */}
          <MetricsGrid metrics={metrics} columns={3} />

          {/* Revenue Chart */}
          <div className="bg-farm-white card-shadow rounded-lg p-6 state-active">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-farm-title">
                Revenue Trends
              </h3>
              <ChartBarIcon className="h-5 w-5 text-control-label gradient-icon" />
            </div>
            <DataChart
              data={[
                {
                  date: "2024-01-01",
                  revenue: 18000,
                  orders: 45,
                  avgOrderValue: 400,
                },
                {
                  date: "2024-01-02",
                  revenue: 21750,
                  orders: 52,
                  avgOrderValue: 418,
                },
                {
                  date: "2024-01-03",
                  revenue: 14700,
                  orders: 38,
                  avgOrderValue: 387,
                },
                {
                  date: "2024-01-04",
                  revenue: 24750,
                  orders: 61,
                  avgOrderValue: 405,
                },
                {
                  date: "2024-01-05",
                  revenue: 19800,
                  orders: 49,
                  avgOrderValue: 404,
                },
                {
                  date: "2024-01-06",
                  revenue: 26700,
                  orders: 68,
                  avgOrderValue: 393,
                },
                {
                  date: "2024-01-07",
                  revenue: 28350,
                  orders: 72,
                  avgOrderValue: 394,
                },
              ]}
              config={{
                type: "line",
                title: "Revenue & Sales Performance",
                height: 280,
                timeScale: false,
                xAxisKey: "date",
                yAxisKeys: ["revenue", "orders"],
                colors: ["#10b981", "#3b82f6"],
                formatters: {
                  revenue: (value: number) => `$${value.toLocaleString()}`,
                  orders: (value: number) => `${value} orders`,
                },
              }}
            />
          </div>

          {/* Recent Orders */}
          <div className="bg-farm-white card-shadow rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-lg font-medium text-farm-title">
                Recent Orders
              </h3>
              <StatusBadge status="success" size="sm">
                Active
              </StatusBadge>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-farm-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-control-label">
                    Mixed Greens Box - Sarah Johnson
                  </span>
                  <StatusBadge status="processing" size="sm">
                    Processing
                  </StatusBadge>
                </div>
                <span className="text-sm font-medium text-sensor-value">
                  $24.99
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-farm-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-control-label">
                    Microgreens Variety Pack - Mike Chen
                  </span>
                  <StatusBadge status="processing" size="sm">
                    Processing
                  </StatusBadge>
                </div>
                <span className="text-sm font-medium text-sensor-value">
                  $18.50
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-farm-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-control-label">
                    Fresh Herbs Bundle - Lisa Rodriguez
                  </span>
                  <StatusBadge status="processing" size="sm">
                    Processing
                  </StatusBadge>
                </div>
                <span className="text-sm font-medium text-sensor-value">
                  $15.75
                </span>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="customers" className="space-y-6">
          <CustomersView />
        </TabsContent>

        <TabsContent value="orders" className="space-y-6">
          <OrdersInvoicesView />
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <PaymentsView />
        </TabsContent>

        <TabsContent value="payouts" className="space-y-6">
          <PayoutsView />
        </TabsContent>

        <TabsContent value="refunds" className="space-y-6">
          <RefundsView />
        </TabsContent>

        <TabsContent value="disputes" className="space-y-6">
          <DisputesView />
        </TabsContent>

        <TabsContent value="team" className="space-y-6">
          <TeamMembersView />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BusinessPage;
