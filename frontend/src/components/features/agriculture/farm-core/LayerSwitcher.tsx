"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useLayer, LayerType } from '@/contexts/LayerContext';
import { cn } from '@/lib/utils';
import { 
  Monitor,
  Cog,
  Activity,
  Sprout,
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff
} from 'lucide-react';

interface LayerSwitcherProps {
  className?: string;
  orientation?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center' | 'inline';
}

export function LayerSwitcher({
  className,
  orientation = 'horizontal',
  size = 'md',
  showLabels = true,
  position = 'top-right'
}: LayerSwitcherProps) {
  const { layers, toggleLayer, getActiveLayer, clearAllLayers } = useLayer();

  const getLayerIcon = (layer: LayerType) => {
    const iconClass = size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5';
    
    switch (layer) {
      case 'devices': return <Monitor className={iconClass} />;
      case 'automation': return <Cog className={iconClass} />;
      case 'monitoring': return <Activity className={iconClass} />;
      case 'grows': return <Sprout className={iconClass} />;
    }
  };

  const getLayerLabel = (layer: LayerType) => {
    switch (layer) {
      case 'devices': return 'Devices';
      case 'automation': return 'Automation';
      case 'monitoring': return 'Monitoring';
      case 'grows': return 'Grows';
    }
  };

  const getLayerDescription = (layer: LayerType) => {
    switch (layer) {
      case 'devices': return 'View device assignments and status';
      case 'automation': return 'Automation rules and schedules';
      case 'monitoring': return 'Real-time environmental monitoring';
      case 'grows': return 'Current grow cycles and progress';
    }
  };

  const getButtonSize = () => {
    switch (size) {
      case 'sm': return showLabels ? 'sm' : 'sm';
      case 'md': return showLabels ? 'default' : 'sm';
      case 'lg': return showLabels ? 'lg' : 'default';
    }
  };

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'center': 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2',
    'inline': ''
  };

  const activeLayer = getActiveLayer();

  const isInline = position === 'inline';

  if (isInline) {
    return (
      <div className={cn(
        "flex gap-1",
        orientation === 'vertical' ? 'flex-col' : 'flex-row',
        className
      )}>
        {/* Layer Toggle Buttons */}
        {(Object.keys(layers) as LayerType[]).map((layer) => {
          const isActive = layers[layer].isActive;
          const alertCount = layers[layer].alertCount;
          const hasAlerts = alertCount > 0;

          return (
            <div key={layer} className="relative">
              <Button
                variant={isActive ? 'default' : 'ghost'}
                size={getButtonSize()}
                onClick={() => toggleLayer(layer)}
                className={cn(
                  "transition-all duration-200 relative",
                  isActive 
                    ? "bg-blue-600 text-white hover:bg-blue-700 shadow-sm" 
                    : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800",
                  hasAlerts && !isActive && "border-amber-300 dark:border-amber-600",
                  "px-2 h-8"
                )}
                title={`${getLayerLabel(layer)} - ${getLayerDescription(layer)}`}
              >
                                 <div className="flex items-center gap-1">
                   {getLayerIcon(layer)}
                   {showLabels && <span className="text-xs">{getLayerLabel(layer)}</span>}
                 </div>
               </Button>

               {/* Alert Badge */}
               {hasAlerts && (
                 <Badge 
                   variant="outline"
                   className={cn(
                     "absolute -top-1 -right-1 h-3 w-3 p-0 flex items-center justify-center text-xs transition-all",
                     alertCount >= 5 
                       ? "bg-red-500 border-red-500 text-white animate-pulse" 
                       : "bg-amber-500 border-amber-500 text-white"
                   )}
                 >
                   <AlertTriangle className="w-2 h-2" />
                 </Badge>
               )}
             </div>
            );
        })}
      </div>
    );
  }

  return (
    <div className={cn(
      "fixed z-40 pointer-events-auto",
      positionClasses[position],
      className
    )}>
      <Card className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-lg border">
        <div className={cn(
          "p-2 flex gap-2",
          orientation === 'vertical' ? 'flex-col' : 'flex-row'
        )}>
          {/* Clear All Button */}
          {activeLayer && (
            <Button
              variant="ghost"
              size={getButtonSize()}
              onClick={clearAllLayers}
              className={cn(
                "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200",
                !showLabels && "px-2"
              )}
              title="Clear all overlays"
            >
              <EyeOff className={size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5'} />
              {showLabels && <span className="ml-2">Clear</span>}
            </Button>
          )}

          {/* Layer Toggle Buttons */}
          {(Object.keys(layers) as LayerType[]).map((layer) => {
            const isActive = layers[layer].isActive;
            const alertCount = layers[layer].alertCount;
            const hasAlerts = alertCount > 0;

            return (
              <div key={layer} className="relative">
                <Button
                  variant={isActive ? 'default' : 'ghost'}
                  size={getButtonSize()}
                  onClick={() => toggleLayer(layer)}
                  className={cn(
                    "transition-all duration-200 relative",
                    isActive 
                      ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md" 
                      : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800",
                    hasAlerts && !isActive && "border-amber-300 dark:border-amber-600",
                    !showLabels && "px-2"
                  )}
                  title={`${getLayerLabel(layer)} - ${getLayerDescription(layer)}`}
                >
                  <div className="flex items-center gap-2">
                    {getLayerIcon(layer)}
                    {showLabels && <span>{getLayerLabel(layer)}</span>}
                  </div>

                  {/* Active Indicator */}
                  {isActive && (
                    <div className="absolute -top-1 -right-1">
                      <CheckCircle className="w-3 h-3 text-green-400 bg-white rounded-full" />
                    </div>
                  )}
                </Button>

                {/* Alert Badge */}
                {hasAlerts && (
                  <Badge 
                    variant="outline"
                    className={cn(
                      "absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs transition-all",
                      alertCount >= 5 
                        ? "bg-red-500 border-red-500 text-white animate-pulse" 
                        : "bg-amber-500 border-amber-500 text-white"
                    )}
                  >
                    <AlertTriangle className="w-2 h-2" />
                  </Badge>
                )}
              </div>
            );
          })}

          {/* Status Indicator */}
          <div className={cn(
            "flex items-center gap-2 px-2 py-1 rounded-md",
            "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
          )}>
            <Eye className="w-3 h-3" />
            {showLabels && (
              <span className="text-xs font-medium">
                {activeLayer ? `${getLayerLabel(activeLayer)} Active` : 'No Active Layer'}
              </span>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
} 