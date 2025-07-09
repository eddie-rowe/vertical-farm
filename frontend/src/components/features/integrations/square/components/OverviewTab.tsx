import React from 'react';
import { 
  Activity, 
  TrendingUp, 
  Info
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SyncStatus, ConnectionHealth } from '../types';

interface OverviewTabProps {
  activeConfig: any;
  syncStatuses: SyncStatus[];
  connectionHealth: ConnectionHealth;
  getStatusColor: (status: string) => string;
}

const getStatusIcon = (status: string) => {
  // This will be implemented in the utils or passed as prop
  return <div className="w-4 h-4" />;
};

export const OverviewTab: React.FC<OverviewTabProps> = ({
  activeConfig,
  syncStatuses,
  connectionHealth,
  getStatusColor
}) => {
  if (!activeConfig) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          No Square integration configured. Please set up your connection in the Configuration tab.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {syncStatuses.map((sync) => (
          <Card key={sync.entity}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <sync.icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium">{sync.entity}</p>
                    <p className="text-sensor-value text-control-content dark:text-control-content-dark">
                      {sync.recordCount.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge className={`${getStatusColor(sync.status)} text-xs`}>
                    {getStatusIcon(sync.status)}
                  </Badge>
                  <p className="text-xs text-gray-500 mt-1">{sync.lastSync}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Data Flow Visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            <span>Data Flow Status</span>
          </CardTitle>
          <CardDescription>
            Real-time status of data flowing from Square to Business Management
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {syncStatuses.map((sync) => (
              <div key={sync.entity} className="flex items-center space-x-4 p-4 border rounded-lg">
                <div className="flex items-center space-x-3 flex-1">
                  <sync.icon className="w-5 h-5 text-gray-600" />
                  <span className="font-medium">{sync.entity}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-500">→</span>
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium">Business Mgmt</span>
                </div>
                <Badge className={`${getStatusColor(sync.status)} text-xs`}>
                  {getStatusIcon(sync.status)}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Integration Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="w-5 h-5" />
            <span>Integration Health</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-sensor-value text-accent-primary">99.9%</div>
              <div className="text-sm text-gray-500">Uptime</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-sensor-value text-accent-primary">
                {connectionHealth.responseTime}ms
              </div>
              <div className="text-sm text-gray-500">Avg Response</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-sensor-value text-accent-primary">0</div>
              <div className="text-sm text-gray-500">Errors (24h)</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 