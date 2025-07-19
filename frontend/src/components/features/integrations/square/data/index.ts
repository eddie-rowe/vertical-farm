// Square Integration Data - Data utilities and mock data for Square integration

import {
  RefreshCw,
  Download,
  Upload,
  Bug,
  Trash2,
  TestTube,
  Users,
  ShoppingCart,
  CreditCard,
  Package,
} from "lucide-react";

// Debug actions for the Advanced Tab
export const DEBUG_ACTIONS = [
  {
    id: "test-connection",
    label: "Test Connection",
    icon: RefreshCw,
    action: () => {
      console.log("Testing Square connection...");
      // Add actual connection test logic here
    },
  },
  {
    id: "export-logs",
    label: "Export Logs",
    icon: Download,
    action: () => {
      console.log("Exporting Square integration logs...");
      // Add log export logic here
    },
  },
  {
    id: "sync-data",
    label: "Force Sync",
    icon: Upload,
    action: () => {
      console.log("Forcing Square data sync...");
      // Add force sync logic here
    },
  },
  {
    id: "clear-cache",
    label: "Clear Cache",
    icon: Trash2,
    action: () => {
      console.log("Clearing Square integration cache...");
      // Add cache clearing logic here
    },
  },
  {
    id: "run-diagnostics",
    label: "Run Diagnostics",
    icon: Bug,
    action: () => {
      console.log("Running Square integration diagnostics...");
      // Add diagnostics logic here
    },
  },
  {
    id: "test-webhook",
    label: "Test Webhook",
    icon: TestTube,
    action: () => {
      console.log("Testing Square webhook...");
      // Add webhook test logic here
    },
  },
];

// Data type configurations for sync settings
export const DATA_TYPE_CONFIGS = [
  {
    key: "enableCustomers",
    label: "Customers",
    icon: Users,
    description: "Sync customer information and profiles",
  },
  {
    key: "enableOrders",
    label: "Orders",
    icon: ShoppingCart,
    description: "Sync order history and transaction data",
  },
  {
    key: "enablePayments",
    label: "Payments",
    icon: CreditCard,
    description: "Sync payment transactions and methods",
  },
  {
    key: "enableInventory",
    label: "Inventory",
    icon: Package,
    description: "Sync product inventory and stock levels",
  },
];

// Sync interval options for the sync settings
export const SYNC_INTERVAL_OPTIONS = [
  {
    value: "5min",
    label: "Every 5 minutes",
  },
  {
    value: "15min",
    label: "Every 15 minutes",
  },
  {
    value: "30min",
    label: "Every 30 minutes",
  },
  {
    value: "1hour",
    label: "Every hour",
  },
  {
    value: "4hours",
    label: "Every 4 hours",
  },
  {
    value: "8hours",
    label: "Every 8 hours",
  },
  {
    value: "24hours",
    label: "Once daily",
  },
  {
    value: "manual",
    label: "Manual only",
  },
];

// Default sync statuses for initialization
export const DEFAULT_SYNC_STATUSES = [
  {
    entity: "Customers",
    icon: Users,
    lastSync: "Never",
    status: "pending" as const,
    recordCount: 0,
  },
  {
    entity: "Orders",
    icon: ShoppingCart,
    lastSync: "Never",
    status: "pending" as const,
    recordCount: 0,
  },
  {
    entity: "Payments",
    icon: CreditCard,
    lastSync: "Never",
    status: "pending" as const,
    recordCount: 0,
  },
  {
    entity: "Inventory",
    icon: Package,
    lastSync: "Never",
    status: "pending" as const,
    recordCount: 0,
  },
];

// Default connection health for initialization
export const DEFAULT_CONNECTION_HEALTH = {
  status: "disconnected" as const,
  lastCheck: "Never",
  responseTime: 0,
  apiLimitUsed: 0,
  apiLimitTotal: 1000,
};

// Default sync settings for initialization
export const DEFAULT_SYNC_SETTINGS = {
  autoSync: false,
  syncInterval: "manual",
  syncOnlyBusinessHours: false,
  businessHoursStart: "09:00",
  businessHoursEnd: "17:00",
  enableCustomers: true,
  enableOrders: true,
  enablePayments: true,
  enableInventory: true,
};
