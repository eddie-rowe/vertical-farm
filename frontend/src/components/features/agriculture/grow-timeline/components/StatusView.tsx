import React from 'react';
import { GrowTimelineItem } from '../types';
import { STATUS_COLORS, STATUS_LABELS, groupGrowsByStatus } from '../data';

interface StatusViewProps {
  grows: GrowTimelineItem[];
  selectedGrows: string[];
  hoveredGrow: string | null;
  onGrowSelect: (growId: string, multi?: boolean) => void;
  onGrowHover: (growId: string | null) => void;
  onGrowAction: (growId: string, action: string) => void;
}

export const StatusView: React.FC<StatusViewProps> = ({
  grows,
  selectedGrows,
  hoveredGrow,
  onGrowSelect,
  onGrowHover,
  onGrowAction,
}) => {
  const statusGroups = groupGrowsByStatus(grows);

  const handleGrowClick = (growId: string, event: React.MouseEvent) => {
    const multi = event.ctrlKey || event.metaKey;
    onGrowSelect(growId, multi);
  };

  const handleGrowContextMenu = (growId: string, event: React.MouseEvent) => {
    event.preventDefault();
    const grow = grows.find(g => g.id === growId);
    if (grow) {
      const actions = ['abort', 'complete', 'restart'];
      const action = prompt(`Action for ${grow.shelfName}:\n${actions.join(', ')}`);
      if (action && actions.includes(action)) {
        onGrowAction(growId, action);
      }
    }
  };

  const getStatusStats = (statusGrows: GrowTimelineItem[]) => {
    const totalProgress = statusGrows.reduce((sum, grow) => sum + grow.progress, 0);
    const avgProgress = statusGrows.length > 0 ? Math.round(totalProgress / statusGrows.length) : 0;
    const criticalAlerts = statusGrows.reduce((sum, grow) => sum + grow.criticalAlerts, 0);
    const automationEnabled = statusGrows.filter(grow => grow.automationEnabled).length;
    
    return { avgProgress, criticalAlerts, automationEnabled };
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
        {Object.entries(statusGroups).map(([status, statusGrows]) => {
          const stats = getStatusStats(statusGrows);
          const statusColor = STATUS_COLORS[status as keyof typeof STATUS_COLORS];
          
          return (
            <div key={status} className="space-y-4">
              {/* Status Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: statusColor }}
                  />
                  <h3 className="text-lg font-semibold text-gray-900">
                    {STATUS_LABELS[status as keyof typeof STATUS_LABELS]}
                  </h3>
                </div>
                <span className="text-sm text-gray-500">
                  {statusGrows.length}
                </span>
              </div>

              {/* Status Stats */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Avg Progress:</span>
                  <span className="font-medium">{stats.avgProgress}%</span>
                </div>
                {stats.criticalAlerts > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Critical Alerts:</span>
                    <span className="font-medium text-red-600">{stats.criticalAlerts}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Automated:</span>
                  <span className="font-medium text-green-600">
                    {stats.automationEnabled}/{statusGrows.length}
                  </span>
                </div>
              </div>

              {/* Grows List */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {statusGrows.map((grow) => {
                  const isSelected = selectedGrows.includes(grow.id);
                  const isHovered = hoveredGrow === grow.id;
                  
                  return (
                    <div
                      key={grow.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' 
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      } ${isHovered ? 'shadow-md scale-102' : 'shadow-sm'}`}
                      onClick={(e) => handleGrowClick(grow.id, e)}
                      onContextMenu={(e) => handleGrowContextMenu(grow.id, e)}
                      onMouseEnter={() => onGrowHover(grow.id)}
                      onMouseLeave={() => onGrowHover(null)}
                    >
                      <div className="space-y-2">
                        {/* Grow Header */}
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-medium text-sm text-gray-900">
                              {grow.shelfName}
                            </div>
                            <div className="text-xs text-gray-600">
                              {grow.farmName} • {grow.rowName} • {grow.rackName}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {grow.criticalAlerts > 0 && (
                              <div className="w-2 h-2 bg-red-500 rounded-full" />
                            )}
                            {grow.automationEnabled && (
                              <div className="w-2 h-2 bg-green-500 rounded-full" />
                            )}
                          </div>
                        </div>

                        {/* Recipe & Species */}
                        <div className="text-xs text-gray-700">
                          <div>{grow.recipeName}</div>
                          <div className="text-gray-500">{grow.speciesName}</div>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-600">Progress</span>
                            <span className="font-medium">{grow.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="h-2 rounded-full transition-all duration-300"
                              style={{
                                width: `${grow.progress}%`,
                                backgroundColor: statusColor,
                              }}
                            />
                          </div>
                        </div>

                        {/* Timeline Info */}
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Day {grow.daysElapsed}</span>
                          <span>
                            {grow.daysRemaining > 0 
                              ? `${grow.daysRemaining} days left`
                              : grow.status === 'completed' 
                                ? 'Completed'
                                : 'Overdue'
                            }
                          </span>
                        </div>

                        {/* Environmental Score */}
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-600">Environmental Score</span>
                          <span className={`font-medium ${
                            grow.environmentalScore >= 80 
                              ? 'text-green-600' 
                              : grow.environmentalScore >= 60 
                                ? 'text-yellow-600' 
                                : 'text-red-600'
                          }`}>
                            {grow.environmentalScore}/100
                          </span>
                        </div>

                        {/* Yield (if completed) */}
                        {grow.yield && (
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-600">Yield</span>
                            <span className="font-medium text-green-600">
                              {grow.yield}g
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Hover tooltip */}
      {hoveredGrow && (
        <div className="fixed z-50 bg-gray-900 text-white p-3 rounded-lg shadow-lg pointer-events-none">
          {(() => {
            const grow = grows.find(g => g.id === hoveredGrow);
            if (!grow) return null;

            return (
              <div className="space-y-1 text-sm">
                <div className="font-medium">{grow.shelfName}</div>
                <div className="text-gray-300">{grow.recipeName} - {grow.speciesName}</div>
                <div className="text-gray-300">
                  Started: {new Date(grow.startDate).toLocaleDateString()}
                </div>
                <div className="text-gray-300">
                  Expected: {new Date(grow.endDate).toLocaleDateString()}
                </div>
                <div className="text-gray-300">
                  Progress: {grow.progress}% ({grow.daysElapsed}/{grow.totalDays} days)
                </div>
                {grow.criticalAlerts > 0 && (
                  <div className="text-red-400">
                    {grow.criticalAlerts} critical alert(s)
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}; 