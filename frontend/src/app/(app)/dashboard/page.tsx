"use client";

import React from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from '@/components/ui/PageHeader';
import { 
  HeroMetrics, 
  ExecutiveSummary, 
  StrategicCard, 
  ActionButton, 
  ProgressIndicator, 
  CircularProgress 
} from '@/components/features/dashboard/components';
import { useDashboard } from '@/components/features/dashboard/hooks/useDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FaDollarSign,
  FaChartLine,
  FaTasks,
  FaUsers,
  FaBrain,
  FaFlask,
  FaExclamationTriangle,
  FaCheckCircle,
  FaClock,
  FaArrowLeft,
  FaShieldAlt,
  FaRocket,
  FaHome,
  FaEye,
  FaPhone,
  FaClipboardList,
  FaCalendarCheck,
  FaEnvelope,
  FaFileInvoiceDollar
} from "react-icons/fa";

// Navigation Header Component
const NavigationHeader = ({ 
  view, 
  onBackToExecutive,
  currentTime 
}: { 
  view: string;
  onBackToExecutive: () => void;
  currentTime: Date;
}) => {
  const getViewTitle = (view: string) => {
    switch (view) {
      case 'financial': return 'Financial Dashboard';
      case 'operations': return 'Operations Dashboard';
      case 'growth': return 'Growth Dashboard';
      case 'quality': return 'Quality Dashboard';
      case 'risk': return 'Risk Dashboard';
      case 'team': return 'Team Dashboard';
      default: return 'Strategic Dashboard';
    }
  };

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBackToExecutive}
          className="flex items-center space-x-2"
        >
          <FaArrowLeft className="w-4 h-4" />
          <span>Back to Executive</span>
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{getViewTitle(view)}</h1>
      </div>
      <div className="flex items-center space-x-4">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Last updated: {currentTime.toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};

// Detailed View Component
const DetailedView = ({ 
  view,
  onBackToExecutive,
  strategicData,
  currentTime
}: { 
  view: string;
  onBackToExecutive: () => void;
  strategicData: any;
  currentTime: Date;
}) => {
  const renderSectionsForView = (currentView: string) => {
    switch (currentView) {
      case 'financial':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <StrategicCard title="Cost Management" icon={FaDollarSign} priority="high">
              <div className="space-y-4">
                <ProgressIndicator 
                  current={strategicData.costs.currentWeeklyCostPerTray} 
                  target={strategicData.costs.targetCostPerTray} 
                  label="Weekly Cost per Tray"
                  unit="$"
                  inverse={true}
                />
                <div className="space-y-2">
                  {strategicData.costs.suggestions.map((suggestion: any, index: number) => (
                    <ActionButton
                      key={index}
                      action={suggestion.action}
                      impact={`Save $${suggestion.savings}`}
                      urgency={suggestion.urgency}
                    />
                  ))}
                </div>
              </div>
            </StrategicCard>

            <StrategicCard title="Revenue Tracking" icon={FaChartLine} priority="high">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">${strategicData.sales.currentWeeklyRevenue}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">This Week</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">${strategicData.sales.fourWeekAverage}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">4-Week Avg</div>
                  </div>
                </div>
                <div className="space-y-2">
                  {strategicData.sales.suggestions.map((suggestion: any, index: number) => (
                    <ActionButton
                      key={index}
                      action={suggestion.action}
                      impact={suggestion.impact}
                      urgency={suggestion.urgency}
                    />
                  ))}
                </div>
              </div>
            </StrategicCard>
          </div>
        );

      case 'operations':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <StrategicCard title="Today's Tasks" icon={FaTasks} priority="normal">
              <div className="space-y-4">
                <div className="text-center">
                  <CircularProgress value={75} size={100} />
                  <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">Daily Progress</div>
                </div>
                <div className="space-y-2">
                  {strategicData.todaysTasks.tasks.map((task: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">{task.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{task.assigned} • {task.hours}h</div>
                      </div>
                      <Badge variant={task.status === 'completed' ? 'default' : 'secondary'}>
                        {task.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </StrategicCard>

            <StrategicCard title="Upcoming Events" icon={FaCalendarCheck} priority="normal">
              <div className="space-y-4">
                {strategicData.upcomingEvents.map((event: any, index: number) => (
                  <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="font-medium text-gray-900 dark:text-gray-100">{event.name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {event.daysAway} days away • {event.laborRequired}h labor
                    </div>
                    <div className="mt-2 space-y-1">
                      {event.preparations.map((prep: any, prepIndex: number) => (
                        <div key={prepIndex} className="flex items-center space-x-2 text-sm">
                          {prep.status === 'done' ? (
                            <FaCheckCircle className="w-4 h-4 text-green-500 dark:text-green-400" />
                          ) : (
                            <FaClock className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                          )}
                          <span className="text-gray-700 dark:text-gray-300">{prep.task}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </StrategicCard>
          </div>
        );

      case 'risk':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <StrategicCard title="System Alerts" icon={FaExclamationTriangle} priority="urgent">
              <div className="space-y-3">
                {strategicData.systemAlerts.map((alert: any, index: number) => (
                  <div key={index} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-gray-100">{alert.alert}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">{alert.action}</div>
                      </div>
                      <Badge variant={alert.severity === 'high' ? 'destructive' : 'secondary'}>
                        {alert.severity}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </StrategicCard>

            <StrategicCard title="Strategic Notes" icon={FaBrain} priority="normal">
              <div className="space-y-3">
                {strategicData.strategicNotes.map((note: any, index: number) => (
                  <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="font-medium text-gray-900 dark:text-gray-100">{note.note}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">{note.investigation}</div>
                    <div className="flex items-center justify-between mt-2">
                      <Badge variant="outline">{note.impact}</Badge>
                      <Badge variant={note.priority === 'high' ? 'destructive' : 'secondary'}>
                        {note.priority}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </StrategicCard>
          </div>
        );

      default:
        return (
          <div className="text-center py-8">
            <div className="text-gray-500 dark:text-gray-400">Select a category to view detailed information</div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <NavigationHeader 
        view={view} 
        onBackToExecutive={onBackToExecutive}
        currentTime={currentTime}
      />
      {renderSectionsForView(view)}
    </div>
  );
};

// Main Dashboard Page Component
export default function StrategicDashboardPage() {
  const { user } = useAuth();
  const {
    currentView,
    currentTime,
    isLoading,
    strategicData,
    executiveSummaryData,
    handleCategoryClick,
    handleBackToExecutive,
    refreshData
  } = useDashboard();

  if (!user) {
    return <div className="text-content">Please log in to access the dashboard.</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Strategic Dashboard" 
        description="Real-time insights and strategic recommendations"
      />
      
      {currentView === 'executive' ? (
        <div className="space-y-6">
          <HeroMetrics />
          <ExecutiveSummary onCategoryClick={handleCategoryClick} />
        </div>
      ) : (
        <DetailedView 
          view={currentView}
          onBackToExecutive={handleBackToExecutive}
          strategicData={strategicData}
          currentTime={currentTime}
        />
      )}
    </div>
  );
}
