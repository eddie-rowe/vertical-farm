"use client";

import React from 'react';
import { FarmPageData, Row, Rack, Shelf } from '@/types/farm-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { 
  Settings, 
  Clock, 
  Thermometer,
  Droplets,
  Lightbulb,
  Timer,
  Target,
  Play,
  Pause,
  AlertCircle
} from 'lucide-react';

interface AutomationOverlayProps {
  farmData: FarmPageData | null;
  selectedRow?: Row | null;
  selectedRack?: Rack | null;
  selectedShelf?: Shelf | null;
}

interface AutomationRuleIndicatorProps {
  ruleId: string;
  ruleName: string;
  ruleType: 'schedule' | 'condition' | 'sensor';
  status: 'active' | 'inactive' | 'triggered';
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  nextExecution?: string;
}

const getRuleIcon = (type: string, status: string) => {
  const iconProps = { className: "w-4 h-4" };
  
  switch (type) {
    case 'schedule':
      return <Clock {...iconProps} className={`w-4 h-4 ${status === 'active' ? 'text-blue-500' : 'text-gray-400'}`} />;
    case 'condition':
      return <Target {...iconProps} className={`w-4 h-4 ${status === 'triggered' ? 'text-orange-500' : status === 'active' ? 'text-green-500' : 'text-gray-400'}`} />;
    case 'sensor':
      return <Thermometer {...iconProps} className={`w-4 h-4 ${status === 'triggered' ? 'text-red-500' : status === 'active' ? 'text-green-500' : 'text-gray-400'}`} />;
    default:
      return <Settings {...iconProps} className={`w-4 h-4 ${status === 'active' ? 'text-green-500' : 'text-gray-400'}`} />;
  }
};

const AutomationRuleIndicator: React.FC<AutomationRuleIndicatorProps> = ({ 
  ruleId, 
  ruleName, 
  ruleType, 
  status, 
  position,
  nextExecution
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
              "absolute z-10 p-1.5 rounded-md shadow-sm border transition-all duration-200",
              "bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm",
              "border-gray-200 dark:border-gray-600",
              "hover:scale-110 cursor-pointer",
              positionClasses[position],
              status === 'active' && "ring-2 ring-green-400/50",
              status === 'triggered' && "ring-2 ring-orange-400/50 animate-pulse"
            )}
          >
            {getRuleIcon(ruleType, status)}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-sm">
            <div className="font-medium">{ruleName}</div>
            <div className="text-xs text-gray-500 capitalize">
              {ruleType} • {status}
            </div>
            {nextExecution && (
              <div className="text-xs text-blue-500 mt-1">
                Next: {nextExecution}
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

interface ShelfAutomationOverlayProps {
  shelf: Shelf;
  automationRules?: any[];
}

const ShelfAutomationOverlay: React.FC<ShelfAutomationOverlayProps> = ({ shelf, automationRules = [] }) => {
  if (automationRules.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {automationRules.slice(0, 4).map((rule, index) => {
        const positions: AutomationRuleIndicatorProps['position'][] = [
          'top-left', 'top-right', 'bottom-left', 'bottom-right'
        ];
        
        return (
          <div key={rule.id} className="pointer-events-auto">
            <AutomationRuleIndicator
              ruleId={rule.id}
              ruleName={rule.name}
              ruleType={rule.type || 'schedule'}
              status={rule.is_active ? 'active' : 'inactive'}
              position={positions[index]}
              nextExecution={rule.next_execution}
            />
          </div>
        );
      })}
      
      {automationRules.length > 4 && (
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 pointer-events-auto">
          <Badge variant="secondary" className="text-xs bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
            +{automationRules.length - 4} rules
          </Badge>
        </div>
      )}
    </div>
  );
};

interface RackAutomationOverlayProps {
  rack: Rack;
}

const RackAutomationOverlay: React.FC<RackAutomationOverlayProps> = ({ rack }) => {
  // Mock automation data - in real implementation, this would come from API
  const automationRules = [
    { id: '1', name: 'Light Schedule', type: 'schedule', is_active: true },
    { id: '2', name: 'Temperature Control', type: 'condition', is_active: true }
  ];
  
  if (automationRules.length === 0) return null;

  const activeRules = automationRules.filter(rule => rule.is_active).length;

  return (
    <div className="absolute top-2 left-2 z-10 pointer-events-auto">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-6 px-2 text-xs bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-blue-200 dark:border-blue-600"
            >
              <Settings className="w-3 h-3 mr-1" />
              {activeRules}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-sm">
              <div className="font-medium">{activeRules} automation rules active</div>
              <div className="text-xs text-gray-500">Click to manage automation</div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

interface RowAutomationOverlayProps {
  row: Row;
}

const RowAutomationOverlay: React.FC<RowAutomationOverlayProps> = ({ row }) => {
  // Mock automation data - in real implementation, this would come from API
  const totalRules = 12; // Total automation rules for this row
  const activeRules = 8;   // Active automation rules
  const triggeredRules = 2; // Recently triggered rules
  
  return (
    <div className="absolute top-4 left-4 z-10 pointer-events-auto">
      <div className="flex items-center gap-2">
        <Badge 
          variant="outline" 
          className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300"
        >
          <Settings className="w-3 h-3 mr-1" />
          {activeRules}/{totalRules} rules
        </Badge>
        
        {triggeredRules > 0 && (
          <Badge 
            variant="outline" 
            className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-orange-300 dark:border-orange-600 text-orange-700 dark:text-orange-300 animate-pulse"
          >
            <AlertCircle className="w-3 h-3 mr-1" />
            {triggeredRules} active
          </Badge>
        )}
        
        <Button
          variant="outline"
          size="sm"
          className="h-6 px-2 text-xs bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm"
        >
          <Timer className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
};

const AutomationOverlay: React.FC<AutomationOverlayProps> = ({ 
  farmData, 
  selectedRow, 
  selectedRack, 
  selectedShelf 
}) => {
  if (!farmData?.farm?.rows) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-30">
      {farmData.farm.rows.map((row) => (
        <div key={`automation-row-${row.id}`} className="relative">
          <RowAutomationOverlay row={row} />
          
          {row.racks?.map((rack) => (
            <div key={`automation-rack-${rack.id}`} className="relative">
              <RackAutomationOverlay rack={rack} />
              
              {rack.shelves?.map((shelf) => (
                <div key={`automation-shelf-${shelf.id}`} className="relative">
                  <ShelfAutomationOverlay 
                    shelf={shelf} 
                    automationRules={[]} // Would be loaded from API
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}
      
      {/* Floating Automation Controls Panel */}
      <div className="absolute bottom-20 right-4 pointer-events-auto">
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-gray-600 p-3 shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <Settings className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium">Automation</span>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="text-xs">
                <Play className="w-3 h-3 mr-1" />
                Start All
              </Button>
              <Button size="sm" variant="outline" className="text-xs">
                <Pause className="w-3 h-3 mr-1" />
                Pause All
              </Button>
            </div>
            <Button size="sm" variant="outline" className="text-xs w-full">
              <Timer className="w-3 h-3 mr-1" />
              Schedule Manager
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutomationOverlay; 