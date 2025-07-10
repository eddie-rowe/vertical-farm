"use client";

import React, { useState, useEffect } from 'react';
import { FarmPageData, Row, Rack, Shelf } from '@/types/farm';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { 
  Leaf, 
  Calendar,
  Clock,
  Droplets,
  Sun,
  AlertTriangle,
  CheckCircle,
  Play,
  Pause
} from 'lucide-react';

interface GrowTimelineItem {
  id: string;
  shelfId: string;
  shelfName: string;
  rackName: string;
  rowName: string;
  farmName: string;
  recipeName: string;
  speciesName: string;
  startDate: string;
  endDate: string;
  status: 'planned' | 'active' | 'completed' | 'aborted';
  progress: number;
  daysElapsed: number;
  daysRemaining: number;
  totalDays: number;
  yield?: number;
  automationEnabled: boolean;
  criticalAlerts: number;
  environmentalScore: number;
}

interface GrowsOverlayProps {
  farmData: FarmPageData | null;
  selectedRow?: Row | null;
  selectedRack?: Rack | null;
  selectedShelf?: Shelf | null;
}

const GrowsOverlay: React.FC<GrowsOverlayProps> = ({ 
  farmData, 
  selectedRow, 
  selectedRack, 
  selectedShelf 
}) => {
  const [grows, setGrows] = useState<GrowTimelineItem[]>([]);

  useEffect(() => {
    // Mock data - replace with actual API calls
    const mockGrows: GrowTimelineItem[] = [
      {
        id: "grow-1",
        shelfId: "1", // Assuming shelf IDs are simple numbers
        shelfName: "Shelf A1-1-1",
        rackName: "Rack A1-1",
        rowName: "Row A1",
        farmName: "Greenhouse A",
        recipeName: "Quick Lettuce",
        speciesName: "Lettuce",
        startDate: "2024-01-15",
        endDate: "2024-02-19",
        status: "active",
        progress: 65,
        daysElapsed: 23,
        daysRemaining: 12,
        totalDays: 35,
        automationEnabled: true,
        criticalAlerts: 0,
        environmentalScore: 92
      },
      {
        id: "grow-2",
        shelfId: "2",
        shelfName: "Shelf A1-1-2",
        rackName: "Rack A1-1",
        rowName: "Row A1",
        farmName: "Greenhouse A",
        recipeName: "Premium Basil",
        speciesName: "Basil",
        startDate: "2024-01-20",
        endDate: "2024-03-09",
        status: "active",
        progress: 40,
        daysElapsed: 20,
        daysRemaining: 29,
        totalDays: 49,
        automationEnabled: true,
        criticalAlerts: 1,
        environmentalScore: 87
      },
      {
        id: "grow-3",
        shelfId: "3",
        shelfName: "Shelf B1-1-1",
        rackName: "Rack B1-1",
        rowName: "Row B1",
        farmName: "Greenhouse A",
        recipeName: "Spinach Mix",
        speciesName: "Spinach",
        startDate: "2024-01-25",
        endDate: "2024-03-15",
        status: "active",
        progress: 55,
        daysElapsed: 18,
        daysRemaining: 31,
        totalDays: 49,
        automationEnabled: false,
        criticalAlerts: 2,
        environmentalScore: 78
      },
      {
        id: "grow-4",
        shelfId: "4",
        shelfName: "Shelf A2-1-1",
        rackName: "Rack A2-1",
        rowName: "Row A2",
        farmName: "Greenhouse A",
        recipeName: "Micro Greens",
        speciesName: "Microgreens",
        startDate: "2024-02-10",
        endDate: "2024-02-24",
        status: "planned",
        progress: 0,
        daysElapsed: 0,
        daysRemaining: 14,
        totalDays: 14,
        automationEnabled: true,
        criticalAlerts: 0,
        environmentalScore: 0
      }
    ];
    
    setGrows(mockGrows);
  }, []);

  const getStatusColor = (status: GrowTimelineItem['status']) => {
    switch (status) {
      case 'active': return 'text-green-600 dark:text-green-400';
      case 'planned': return 'text-blue-600 dark:text-blue-400';
      case 'completed': return 'text-gray-600 dark:text-gray-400';
      case 'aborted': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: GrowTimelineItem['status']) => {
    switch (status) {
      case 'active': return <Play className="w-3 h-3" />;
      case 'planned': return <Calendar className="w-3 h-3" />;
      case 'completed': return <CheckCircle className="w-3 h-3" />;
      case 'aborted': return <Pause className="w-3 h-3" />;
      default: return <Clock className="w-3 h-3" />;
    }
  };

  const getGrowForShelf = (shelfId: string | number) => {
    return grows.find(grow => grow.shelfId === String(shelfId));
  };

  if (!farmData?.farm?.rows) return null;

  // Simple informational overlay showing grow summary
  const totalGrows = grows.length;
  const activeGrows = grows.filter(g => g.status === 'active').length;
  const plannedGrows = grows.filter(g => g.status === 'planned').length;
  const criticalAlerts = grows.reduce((sum, g) => sum + g.criticalAlerts, 0);
  
  return (
    <div className="absolute inset-0 pointer-events-none z-40">
      {/* Grow Information Panel */}
      <div className="absolute bottom-4 right-4 pointer-events-auto">
        <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-lg border border-green-200 dark:border-green-600 p-4 shadow-lg max-w-[300px]">
          <div className="flex items-center gap-2 mb-3">
            <Leaf className="w-5 h-5 text-green-600 dark:text-green-400" />
            <span className="text-lg font-semibold text-green-800 dark:text-green-200">
              Active Grows
            </span>
          </div>
          
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center">
              <div className="text-xl font-bold text-green-600 dark:text-green-400">
                {activeGrows}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Active
              </div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                {plannedGrows}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Planned
              </div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-gray-600 dark:text-gray-400">
                {totalGrows}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Total
              </div>
            </div>
          </div>

          {/* Critical Alerts */}
          {criticalAlerts > 0 && (
            <div className="mb-4">
              <Badge variant="destructive" className="w-full justify-center">
                <AlertTriangle className="w-4 h-4 mr-2" />
                {criticalAlerts} Alert{criticalAlerts !== 1 ? 's' : ''} Need Attention
              </Badge>
            </div>
          )}

          {/* Current Grows List */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
              Current Grows
            </h4>
            <div className="max-h-40 overflow-y-auto space-y-2">
              {grows.filter(g => g.status === 'active' || g.status === 'planned').slice(0, 4).map((grow) => (
                <div 
                  key={grow.id}
                  className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-md"
                >
                  <div className="flex items-center gap-2">
                    <div className={cn("flex items-center gap-1", getStatusColor(grow.status))}>
                      {getStatusIcon(grow.status)}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {grow.speciesName}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {grow.shelfName}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    {grow.status === 'active' && (
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {grow.progress}% • {grow.daysRemaining}d
                      </div>
                    )}
                    {grow.status === 'planned' && (
                      <div className="text-xs text-blue-600 dark:text-blue-400">
                        Starts {new Date(grow.startDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {grows.filter(g => g.status === 'active' || g.status === 'planned').length > 4 && (
                <div className="text-center">
                  <Badge variant="outline" className="text-xs">
                    +{grows.filter(g => g.status === 'active' || g.status === 'planned').length - 4} more
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GrowsOverlay; 