"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  ChevronUp, 
  ChevronDown, 
  Activity, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  Info,
  Thermometer,
  Droplets,
  Sun,
  Wind,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

interface ActivityItem {
  id: string;
  type: 'alert' | 'info' | 'success' | 'warning';
  message: string;
  timestamp: string;
  elementType?: string;
  elementId?: string;
}

interface MetricItem {
  label: string;
  value: string;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  status?: 'good' | 'warning' | 'critical';
  icon?: React.ReactNode;
}

interface DetailsPanelProps {
  selectedElement: {
    type: 'farm' | 'row' | 'rack' | 'shelf' | 'device' | null;
    id: string | null;
    data?: any;
  };
  isExpanded: boolean;
  onToggleExpanded: () => void;
  recentActivity?: ActivityItem[];
  metrics?: MetricItem[];
}

export default function DetailsPanel({ 
  selectedElement, 
  isExpanded, 
  onToggleExpanded,
  recentActivity = [],
  metrics = []
}: DetailsPanelProps) {
  const [activeTab, setActiveTab] = useState<'activity' | 'metrics' | 'details'>('activity');

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'alert': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default: return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return null;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'good': return 'text-green-600 dark:text-green-400';
      case 'warning': return 'text-yellow-600 dark:text-yellow-400';
      case 'critical': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const defaultMetrics: MetricItem[] = [
    {
      label: 'Temperature',
      value: '22.5',
      unit: '°C',
      trend: 'stable',
      status: 'good',
      icon: <Thermometer className="h-4 w-4" />
    },
    {
      label: 'Humidity',
      value: '65',
      unit: '%',
      trend: 'up',
      status: 'good',
      icon: <Droplets className="h-4 w-4" />
    },
    {
      label: 'Light Intensity',
      value: '850',
      unit: 'lux',
      trend: 'down',
      status: 'warning',
      icon: <Sun className="h-4 w-4" />
    },
    {
      label: 'Air Flow',
      value: '2.3',
      unit: 'm/s',
      trend: 'stable',
      status: 'good',
      icon: <Wind className="h-4 w-4" />
    }
  ];

  const defaultActivity: ActivityItem[] = [
    {
      id: '1',
      type: 'info',
      message: 'Temperature sensor calibrated successfully',
      timestamp: '2 minutes ago',
      elementType: 'device',
      elementId: 'temp-001'
    },
    {
      id: '2',
      type: 'warning',
      message: 'Light intensity below optimal range',
      timestamp: '5 minutes ago',
      elementType: 'shelf',
      elementId: 'shelf-A1'
    },
    {
      id: '3',
      type: 'success',
      message: 'Irrigation cycle completed',
      timestamp: '12 minutes ago',
      elementType: 'row',
      elementId: 'row-1'
    },
    {
      id: '4',
      type: 'alert',
      message: 'High humidity detected in Rack B2',
      timestamp: '18 minutes ago',
      elementType: 'rack',
      elementId: 'rack-B2'
    }
  ];

  const currentMetrics = metrics.length > 0 ? metrics : defaultMetrics;
  const currentActivity = recentActivity.length > 0 ? recentActivity : defaultActivity;

  const renderActivityTab = () => (
    <div className="space-y-3">
      {currentActivity.map((item) => (
        <div key={item.id} className="flex items-start space-x-3 p-3 rounded-lg border border-gray-100 dark:border-gray-800">
          {getActivityIcon(item.type)}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-900 dark:text-gray-100">
              {item.message}
            </p>
            <div className="flex items-center space-x-2 mt-1">
              <Clock className="h-3 w-3 text-gray-400" />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {item.timestamp}
              </span>
              {item.elementType && (
                <Badge variant="outline" className="text-xs">
                  {item.elementType}
                </Badge>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderMetricsTab = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {currentMetrics.map((metric, index) => (
        <div key={index} className="p-4 rounded-lg border border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              {metric.icon}
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {metric.label}
              </span>
            </div>
            {getTrendIcon(metric.trend)}
          </div>
          <div className="flex items-baseline space-x-1">
            <span className={`text-2xl font-bold ${getStatusColor(metric.status)}`}>
              {metric.value}
            </span>
            {metric.unit && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {metric.unit}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  const renderDetailsTab = () => {
    if (!selectedElement.type || !selectedElement.data) {
      return (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <Info className="h-12 w-12 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No Selection</h3>
          <p className="text-sm">Select a farm element to view detailed information</p>
        </div>
      );
    }

    const { type, data } = selectedElement;

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Basic Information
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Type:</span>
                <span className="font-medium">{type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">ID:</span>
                <span className="font-mono text-xs">{data.id}</span>
              </div>
              {data.name && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Name:</span>
                  <span className="font-medium">{data.name}</span>
                </div>
              )}
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Properties
            </h4>
            <div className="space-y-2 text-sm">
              {type === 'farm' && (
                <>
                  {data.location && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Location:</span>
                      <span>{data.location}</span>
                    </div>
                  )}
                  {data.width && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Width:</span>
                      <span>{data.width}m</span>
                    </div>
                  )}
                </>
              )}
              
              {type === 'row' && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Length:</span>
                    <span>{data.length || 'N/A'}cm</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Orientation:</span>
                    <span>{data.orientation}</span>
                  </div>
                </>
              )}
              
              {type === 'rack' && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Height:</span>
                    <span>{data.height || 'N/A'}cm</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Shelves:</span>
                    <span>{data.shelves?.length || 0}</span>
                  </div>
                </>
              )}
              
              {type === 'device' && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Sensor Type:</span>
                    <span>{data.sensor_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Unit:</span>
                    <span>{data.measurement_unit || 'N/A'}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className={`transition-all duration-300 ${isExpanded ? 'h-80' : 'h-16'}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Details & Activity</span>
            {selectedElement.type && (
              <Badge variant="outline">{selectedElement.type}</Badge>
            )}
          </CardTitle>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleExpanded}
            className="p-2"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </Button>
        </div>
        
        {isExpanded && (
          <div className="flex space-x-1 mt-4">
            <Button
              variant={activeTab === 'activity' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('activity')}
            >
              Activity
            </Button>
            <Button
              variant={activeTab === 'metrics' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('metrics')}
            >
              Metrics
            </Button>
            <Button
              variant={activeTab === 'details' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('details')}
            >
              Details
            </Button>
          </div>
        )}
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="pt-2">
          {activeTab === 'activity' && renderActivityTab()}
          {activeTab === 'metrics' && renderMetricsTab()}
          {activeTab === 'details' && renderDetailsTab()}
        </CardContent>
      )}
    </Card>
  );
} 