"use client";

import React, { useState, useMemo } from 'react';
import { FarmPageData, Row, Rack, Shelf } from '@/types/farm';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { 
  Activity, 
  Thermometer,
  Droplets,
  Eye,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Gauge,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import { useLayer } from '@/contexts/LayerContext';
import { ConsolidatedStatusBadge } from '@/components/ui/ConsolidatedStatusBadge';
import { MonitoringDashboard } from '@/components/features/monitoring/monitoring/MonitoringDashboard';

interface MonitoringData {
  elementId: string;
  elementType: 'row' | 'rack' | 'shelf';
  environmentalData: {
    temperature: number;
    humidity: number;
    ph: number;
    light: number;
  };
  healthScore: number;
  alerts: {
    critical: number;
    warnings: number;
  };
  trends: {
    temperature: 'up' | 'down' | 'stable';
    humidity: 'up' | 'down' | 'stable';
    ph: 'up' | 'down' | 'stable';
    light: 'up' | 'down' | 'stable';
  };
}

interface MonitoringOverlayProps {
  farmData: FarmPageData;
  selectedRow?: string | null;
  selectedRack?: string | null;
  selectedShelf?: string | null;
}

interface EnvironmentalIndicatorProps {
  metricType: 'temperature' | 'humidity' | 'ph' | 'light';
  value: number;
  unit: string;
  status: 'optimal' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

const getMetricIcon = (type: string, status: string) => {
  const iconProps = { className: "w-4 h-4" };
  
  switch (type) {
    case 'temperature':
      return <Thermometer {...iconProps} className={`w-4 h-4 ${
        status === 'optimal' ? 'text-green-500' : 
        status === 'warning' ? 'text-yellow-500' : 'text-red-500'
      }`} />;
    case 'humidity':
      return <Droplets {...iconProps} className={`w-4 h-4 ${
        status === 'optimal' ? 'text-blue-500' : 
        status === 'warning' ? 'text-yellow-500' : 'text-red-500'
      }`} />;
    case 'ph':
      return <Gauge {...iconProps} className={`w-4 h-4 ${
        status === 'optimal' ? 'text-green-500' : 
        status === 'warning' ? 'text-yellow-500' : 'text-red-500'
      }`} />;
    case 'light':
      return <Activity {...iconProps} className={`w-4 h-4 ${
        status === 'optimal' ? 'text-yellow-500' : 
        status === 'warning' ? 'text-orange-500' : 'text-red-500'
      }`} />;
    default:
      return <Activity {...iconProps} className="w-4 h-4 text-gray-400" />;
  }
};

const getTrendIcon = (trend: string) => {
  switch (trend) {
    case 'up':
      return <TrendingUp className="w-3 h-3 text-green-500" />;
    case 'down':
      return <TrendingDown className="w-3 h-3 text-red-500" />;
    default:
      return <Minus className="w-3 h-3 text-gray-400" />;
  }
};

const EnvironmentalIndicator: React.FC<EnvironmentalIndicatorProps> = ({ 
  metricType, 
  value, 
  unit, 
  status, 
  trend, 
  position 
}) => {
  const positionClasses = {
    'top-left': 'top-2 left-2',
    'top-right': 'top-2 right-2',
    'bottom-left': 'bottom-2 left-2',
    'bottom-right': 'bottom-2 right-2'
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "absolute z-10 p-2 rounded-md shadow-sm border transition-all duration-200",
              "bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm",
              "border-gray-200 dark:border-gray-600",
              "hover:scale-110 cursor-pointer",
              positionClasses[position],
              status === 'optimal' && "ring-2 ring-green-400/50",
              status === 'warning' && "ring-2 ring-yellow-400/50",
              status === 'critical' && "ring-2 ring-red-400/50 animate-pulse"
            )}
          >
            <div className="flex items-center gap-1">
              {getMetricIcon(metricType, status)}
              <span className="text-xs font-medium">{value}{unit}</span>
              {getTrendIcon(trend)}
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-sm">
            <div className="font-medium capitalize">{metricType}: {value}{unit}</div>
            <div className="text-xs text-gray-500 capitalize">
              Status: {status} • Trend: {trend}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

interface HealthScoreIndicatorProps {
  score: number;
  factors: string[];
  position: 'center' | 'top-center' | 'bottom-center';
}

const HealthScoreIndicator: React.FC<HealthScoreIndicatorProps> = ({ 
  score, 
  factors, 
  position 
}) => {
  const positionClasses = {
    'center': 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2',
    'top-center': 'top-2 left-1/2 transform -translate-x-1/2',
    'bottom-center': 'bottom-2 left-1/2 transform -translate-x-1/2'
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-500 border-green-400';
    if (score >= 6) return 'text-yellow-500 border-yellow-400';
    return 'text-red-500 border-red-400';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 8) return <CheckCircle className="w-4 h-4" />;
    if (score >= 6) return <AlertTriangle className="w-4 h-4" />;
    return <XCircle className="w-4 h-4" />;
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "absolute z-10 p-2 rounded-full shadow-sm border-2 transition-all duration-200",
              "bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm",
              "hover:scale-110 cursor-pointer",
              positionClasses[position],
              getScoreColor(score)
            )}
          >
            <div className="flex items-center gap-1">
              {getScoreIcon(score)}
              <span className="text-sm font-bold">{score.toFixed(1)}</span>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-sm">
            <div className="font-medium">Health Score: {score.toFixed(1)}/10</div>
            <div className="text-xs text-gray-500 mt-1">
              Factors: {factors.join(', ')}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

interface ShelfMonitoringOverlayProps {
  shelf: Shelf;
  metrics?: any[];
}

const ShelfMonitoringOverlay: React.FC<ShelfMonitoringOverlayProps> = ({ shelf, metrics = [] }) => {
  // Mock data - in real implementation, this would come from API
  const mockMetrics = [
    { type: 'temperature', value: 24.5, unit: '°C', status: 'optimal', trend: 'stable' },
    { type: 'humidity', value: 65, unit: '%', status: 'optimal', trend: 'up' },
    { type: 'ph', value: 6.2, unit: '', status: 'warning', trend: 'down' },
    { type: 'light', value: 850, unit: 'lux', status: 'optimal', trend: 'stable' }
  ];

  const healthScore = 8.2;
  const healthFactors = ['temp', 'humidity', 'ph'];

  return (
    <div className="absolute inset-0 pointer-events-none">
      {mockMetrics.slice(0, 4).map((metric, index) => {
        const positions: EnvironmentalIndicatorProps['position'][] = [
          'top-left', 'top-right', 'bottom-left', 'bottom-right'
        ];
        
        return (
          <div key={`${metric.type}-${index}`} className="pointer-events-auto">
            <EnvironmentalIndicator
              metricType={metric.type as any}
              value={metric.value}
              unit={metric.unit}
              status={metric.status as any}
              trend={metric.trend as any}
              position={positions[index]}
            />
          </div>
        );
      })}
      
      <div className="pointer-events-auto">
        <HealthScoreIndicator
          score={healthScore}
          factors={healthFactors}
          position="center"
        />
      </div>
    </div>
  );
};

interface RackMonitoringOverlayProps {
  rack: Rack;
}

const RackMonitoringOverlay: React.FC<RackMonitoringOverlayProps> = ({ rack }) => {
  const avgHealthScore = 7.8;
  const alertCount = 2;
  
  return (
    <div className="absolute top-2 right-12 z-10 pointer-events-auto">
      <div className="flex items-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge 
                variant="outline" 
                className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-green-300 dark:border-green-600 text-green-700 dark:text-green-300"
              >
                <Activity className="w-3 h-3 mr-1" />
                {avgHealthScore.toFixed(1)}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-sm">
                <div className="font-medium">Average Health Score</div>
                <div className="text-xs text-gray-500">Based on all shelves in rack</div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        {alertCount > 0 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge 
                  variant="outline" 
                  className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-yellow-300 dark:border-yellow-600 text-yellow-700 dark:text-yellow-300 animate-pulse"
                >
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  {alertCount}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-sm">
                  <div className="font-medium">{alertCount} active alerts</div>
                  <div className="text-xs text-gray-500">Click to view details</div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  );
};

interface RowMonitoringOverlayProps {
  row: Row;
}

const RowMonitoringOverlay: React.FC<RowMonitoringOverlayProps> = ({ row }) => {
  const avgHealthScore = 8.1;
  const totalAlerts = 5;
  const criticalAlerts = 1;
  
  return (
    <div className="absolute top-16 right-4 z-10 pointer-events-auto">
      <div className="flex items-center gap-2">
        <Badge 
          variant="outline" 
          className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-green-300 dark:border-green-600 text-green-700 dark:text-green-300"
        >
          <Activity className="w-3 h-3 mr-1" />
          Health: {avgHealthScore.toFixed(1)}
        </Badge>
        
        {totalAlerts > 0 && (
          <Badge 
            variant="outline" 
            className={cn(
              "bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm",
              criticalAlerts > 0 
                ? "border-red-300 dark:border-red-600 text-red-700 dark:text-red-300 animate-pulse"
                : "border-yellow-300 dark:border-yellow-600 text-yellow-700 dark:text-yellow-300"
            )}
          >
            <AlertTriangle className="w-3 h-3 mr-1" />
            {totalAlerts} alerts
          </Badge>
        )}
        
        <Button
          variant="outline"
          size="sm"
          className="h-6 px-2 text-xs bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm"
        >
          <Eye className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
};

// Mock data generator for demonstration
const generateMockMonitoringData = (elementId: string, elementType: 'row' | 'rack' | 'shelf'): MonitoringData => {
  // Create deterministic but varied data based on element ID
  const seed = elementId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const random = (min: number, max: number) => {
    const x = Math.sin(seed * 9999) * 10000;
    return (x - Math.floor(x)) * (max - min) + min;
  };

  return {
    elementId,
    elementType,
    environmentalData: {
      temperature: 22 + random(0, 6), // 22-28°C
      humidity: 60 + random(0, 20),   // 60-80%
      ph: 6.0 + random(0, 1.5),       // 6.0-7.5
      light: 80 + random(0, 20)       // 80-100%
    },
    healthScore: 6 + random(0, 4),    // 6-10 scale
    alerts: {
      critical: random(0, 1) > 0.8 ? Math.floor(random(0, 3)) : 0,
      warnings: random(0, 1) > 0.5 ? Math.floor(random(0, 5)) : 0
    },
    trends: {
      temperature: ['up', 'down', 'stable'][Math.floor(random(0, 3))] as any,
      humidity: ['up', 'down', 'stable'][Math.floor(random(0, 3))] as any,
      ph: ['up', 'down', 'stable'][Math.floor(random(0, 3))] as any,
      light: ['up', 'down', 'stable'][Math.floor(random(0, 3))] as any
    }
  };
};

export function MonitoringOverlay({ 
  farmData, 
  selectedRow, 
  selectedRack, 
  selectedShelf 
}: MonitoringOverlayProps) {
  const { isLayerActive } = useLayer();
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  
  // Generate mock data for all elements
  const monitoringData = useMemo(() => {
    const data: Record<string, MonitoringData> = {};
    
    farmData?.farm?.rows?.forEach(row => {
      data[row.id] = generateMockMonitoringData(row.id, 'row');
      
      row.racks?.forEach(rack => {
        data[rack.id] = generateMockMonitoringData(rack.id, 'rack');
        
        rack.shelves?.forEach(shelf => {
          data[shelf.id] = generateMockMonitoringData(shelf.id, 'shelf');
        });
      });
    });
    
    return data;
  }, [farmData?.farm?.rows]);

  // Early returns must come after all hooks
  if (!isLayerActive('monitoring') || !farmData?.farm?.rows) {
    return null;
  }

  // Calculate overall farm metrics for dashboard
  const allData = Object.values(monitoringData);
  const overallHealth = allData.length > 0 
    ? allData.reduce((sum, data) => sum + data.healthScore, 0) / allData.length 
    : 0;
  const totalCriticalAlerts = allData.reduce((sum, data) => sum + data.alerts.critical, 0);
  const totalWarnings = allData.reduce((sum, data) => sum + data.alerts.warnings, 0);

  // Create metrics array for dashboard
  const dashboardMetrics = allData.length > 0 ? [
    {
      id: 'temp-avg',
      type: 'temperature' as const,
      value: allData.reduce((sum, data) => sum + data.environmentalData.temperature, 0) / allData.length,
      unit: '°C',
      status: 'optimal' as const,
      trend: 'stable' as const,
      target: 24,
      range: { min: 20, max: 28 }
    },
    {
      id: 'humidity-avg',
      type: 'humidity' as const,
      value: allData.reduce((sum, data) => sum + data.environmentalData.humidity, 0) / allData.length,
      unit: '%',
      status: 'optimal' as const,
      trend: 'stable' as const,
      target: 70,
      range: { min: 60, max: 80 }
    },
    {
      id: 'ph-avg',
      type: 'ph' as const,
      value: allData.reduce((sum, data) => sum + data.environmentalData.ph, 0) / allData.length,
      unit: '',
      status: 'warning' as const,
      trend: 'down' as const,
      target: 6.5,
      range: { min: 6.0, max: 7.0 }
    },
    {
      id: 'light-avg',
      type: 'light' as const,
      value: allData.reduce((sum, data) => sum + data.environmentalData.light, 0) / allData.length,
      unit: '%',
      status: 'optimal' as const,
      trend: 'up' as const,
      target: 85,
      range: { min: 80, max: 100 }
    }
  ] : [];

  const handleElementClick = (elementId: string) => {
    if (selectedElement === elementId) {
      setSelectedElement(null);
      setDashboardOpen(false);
    } else {
      setSelectedElement(elementId);
      setDashboardOpen(true);
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Row-level monitoring indicators */}
      {farmData?.farm?.rows?.map((row, rowIndex) => {
        const rowData = monitoringData[row.id];
        if (!rowData) return null;

        return (
          <div key={row.id}>
            {/* Row status badge */}
            <div
              style={{
                position: 'absolute',
                left: `${10 + rowIndex * 120}px`,
                top: '20px',
                pointerEvents: 'auto'
              }}
              onClick={() => handleElementClick(row.id)}
            >
              <ConsolidatedStatusBadge
                overallHealth={rowData.healthScore}
                criticalAlerts={rowData.alerts.critical}
                warningCount={rowData.alerts.warnings}
                placement="top-right"
                size="md"
                showTrend={true}
                trend={rowData.trends.temperature}
                className={`cursor-pointer hover:scale-110 transition-transform ${
                  selectedElement === row.id ? 'ring-2 ring-blue-400 ring-offset-2' : ''
                }`}
              />
            </div>

            {/* Rack-level monitoring indicators */}
            {row.racks?.map((rack, rackIndex) => {
              const rackData = monitoringData[rack.id];
              if (!rackData) return null;

              return (
                <div key={rack.id}>
                  <div
                    style={{
                      position: 'absolute',
                      left: `${30 + rowIndex * 120 + rackIndex * 80}px`,
                      top: '60px',
                      pointerEvents: 'auto'
                    }}
                    onClick={() => handleElementClick(rack.id)}
                  >
                    <ConsolidatedStatusBadge
                      overallHealth={rackData.healthScore}
                      criticalAlerts={rackData.alerts.critical}
                      warningCount={rackData.alerts.warnings}
                      placement="top-left"
                      size="sm"
                      showTrend={false}
                      className={`cursor-pointer hover:scale-110 transition-transform ${
                        selectedElement === rack.id ? 'ring-2 ring-blue-400 ring-offset-1' : ''
                      }`}
                    />
                  </div>

                  {/* Shelf-level monitoring indicators */}
                  {rack.shelves?.map((shelf, shelfIndex) => {
                    const shelfData = monitoringData[shelf.id];
                    if (!shelfData) return null;

                    return (
                      <div
                        key={shelf.id}
                        style={{
                          position: 'absolute',
                          left: `${50 + rowIndex * 120 + rackIndex * 80 + shelfIndex * 60}px`,
                          top: '100px',
                          pointerEvents: 'auto'
                        }}
                        onClick={() => handleElementClick(shelf.id)}
                      >
                        <ConsolidatedStatusBadge
                          overallHealth={shelfData.healthScore}
                          criticalAlerts={shelfData.alerts.critical}
                          warningCount={shelfData.alerts.warnings}
                          placement="bottom-right"
                          size="sm"
                          showTrend={false}
                          className={`cursor-pointer hover:scale-110 transition-transform ${
                            selectedElement === shelf.id ? 'ring-2 ring-blue-400 ring-offset-1' : ''
                          }`}
                        />
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        );
      })}

      {/* Monitoring Dashboard */}
      <MonitoringDashboard
        isOpen={dashboardOpen}
        onClose={() => {
          setDashboardOpen(false);
          setSelectedElement(null);
        }}
        overallHealth={overallHealth}
        totalAlerts={totalCriticalAlerts + totalWarnings}
        criticalAlerts={totalCriticalAlerts}
        metrics={dashboardMetrics}
        position="bottom-right"
        size="compact"
      />
    </div>
  );
}

export default MonitoringOverlay; 