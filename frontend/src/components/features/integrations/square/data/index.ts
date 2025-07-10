import { 
  Users, 
  ShoppingCart, 
  CreditCard, 
  Package, 
  Globe, 
  RefreshCw, 
  Database, 
  AlertTriangle,
  BarChart3, 
  Settings, 
  Shield 
} from 'lucide-react';
import { 
  SyncStatus, 
  ConnectionHealth, 
  SyncSettings, 
  DataTypeConfig, 
  SquareIntegrationTab, 
  DebugAction 
} from '../types';

export const DEFAULT_SYNC_STATUSES: SyncStatus[] = [
  {
    entity: 'Customers',
    icon: Users,
    lastSync: '2 minutes ago',
    status: 'success',
    recordCount: 1247,
  },
  {
    entity: 'Orders',
    icon: ShoppingCart,
    lastSync: '5 minutes ago',
    status: 'success',
    recordCount: 456,
  },
  {
    entity: 'Payments',
    icon: CreditCard,
    lastSync: '3 minutes ago',
    status: 'success',
    recordCount: 342,
  },
  {
    entity: 'Inventory',
    icon: Package,
    lastSync: '10 minutes ago',
    status: 'success',
    recordCount: 89,
  }
];

export const DEFAULT_CONNECTION_HEALTH: ConnectionHealth = {
  status: 'disconnected',
  lastCheck: 'Never',
  responseTime: 0,
  apiLimitUsed: 0,
  apiLimitTotal: 1000
};

export const DEFAULT_SYNC_SETTINGS: SyncSettings = {
  autoSync: true,
  syncInterval: '15',
  syncOnlyBusinessHours: false,
  businessHoursStart: '09:00',
  businessHoursEnd: '17:00',
  enableCustomers: true,
  enableOrders: true,
  enablePayments: true,
  enableInventory: true,
};

export const DATA_TYPE_CONFIGS: DataTypeConfig[] = [
  { 
    key: 'enableCustomers', 
    label: 'Customer Data', 
    icon: Users, 
    description: 'Customer profiles and contact information' 
  },
  { 
    key: 'enableOrders', 
    label: 'Order Data', 
    icon: ShoppingCart, 
    description: 'Sales orders and transaction details' 
  },
  { 
    key: 'enablePayments', 
    label: 'Payment Data', 
    icon: CreditCard, 
    description: 'Payment transactions and methods' 
  },
  { 
    key: 'enableInventory', 
    label: 'Inventory Data', 
    icon: Package, 
    description: 'Product catalog and stock levels' 
  }
];

export const INTEGRATION_TABS: SquareIntegrationTab[] = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'configuration', label: 'Configuration', icon: Settings },
  { id: 'sync', label: 'Data Sync', icon: Database },
  { id: 'advanced', label: 'Advanced', icon: Shield }
];

export const SYNC_INTERVAL_OPTIONS = [
  { value: '5', label: 'Every 5 minutes' },
  { value: '15', label: 'Every 15 minutes' },
  { value: '30', label: 'Every 30 minutes' },
  { value: '60', label: 'Every hour' },
  { value: '240', label: 'Every 4 hours' }
];

export const DEBUG_ACTIONS: DebugAction[] = [
  { id: 'test-endpoints', label: 'Test API Endpoints', icon: Globe, action: () => {} },
  { id: 'clear-cache', label: 'Clear Cache', icon: RefreshCw, action: () => {} },
  { id: 'view-logs', label: 'View Sync Logs', icon: Database, action: () => {} },
  { id: 'error-reports', label: 'Error Reports', icon: AlertTriangle, action: () => {} }
]; 