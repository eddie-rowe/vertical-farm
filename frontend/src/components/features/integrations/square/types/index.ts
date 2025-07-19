export interface SyncStatus {
  entity: string;
  icon: React.ComponentType<any>;
  lastSync: string;
  status: "success" | "error" | "syncing" | "pending";
  recordCount: number;
  errorMessage?: string;
}

export interface ConnectionHealth {
  status: "connected" | "disconnected" | "error";
  lastCheck: string;
  responseTime: number;
  apiLimitUsed: number;
  apiLimitTotal: number;
}

export interface SyncSettings {
  autoSync: boolean;
  syncInterval: string;
  syncOnlyBusinessHours: boolean;
  businessHoursStart: string;
  businessHoursEnd: string;
  enableCustomers: boolean;
  enableOrders: boolean;
  enablePayments: boolean;
  enableInventory: boolean;
}

export interface TestResult {
  type: "success" | "error";
  message: string;
}

export interface DataTypeConfig {
  key: string;
  label: string;
  icon: React.ComponentType<any>;
  description: string;
}

export interface SquareIntegrationTab {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
}

export interface MetricCard {
  title: string;
  value: string;
  description: string;
  color?: string;
}

export interface DebugAction {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  action: () => void;
}
