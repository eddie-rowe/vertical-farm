'use client';

import React, { useState } from 'react';
import { 
  FaChartLine, 
  FaSearch, 
  FaBrain, 
  FaBullseye,
  FaCog,
  FaDownload,
  FaExpand,
  FaFilter
} from 'react-icons/fa';

import { 
  AnalyticsDashboard, 
  PerformanceMetrics, 
  SmartInsights 
} from '@/components/features/business';
import { GlobalSearch } from '@/components/shared';
import { SearchResult } from '@/components/shared';

export default function AnalyticsDashboardPage() {
  const [activeView, setActiveView] = useState<'dashboard' | 'performance' | 'insights'>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFarm, setSelectedFarm] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Mock farm data
  const farms = [
    { id: 'all', name: 'All Farms' },
    { id: 'greenhouse-alpha', name: 'Greenhouse Alpha' },
    { id: 'hydroponic-bay-2', name: 'Hydroponic Bay 2' },
    { id: 'vertical-tower-1', name: 'Vertical Tower 1' }
  ];

  const views = [
    {
      id: 'dashboard',
      name: 'Overview Dashboard',
      icon: <FaChartLine className="h-4 w-4" />,
      description: 'Comprehensive analytics overview'
    },
    {
      id: 'performance',
      name: 'Performance Metrics',
      icon: <FaBullseye className="h-4 w-4" />,
      description: 'KPI tracking and goal progress'
    },
    {
      id: 'insights',
      name: 'AI Insights',
      icon: <FaBrain className="h-4 w-4" />,
      description: 'Smart recommendations and predictions'
    }
  ];

  // Handle search result selection
  const handleSearchResult = (result: SearchResult) => {
    console.log('Selected search result:', result);
    if (result.type === 'farm') {
      setSelectedFarm(result.id);
    }
  };

  // Handle widget click from dashboard
  const handleWidgetClick = (widgetId: string) => {
    console.log('Widget clicked:', widgetId);
  };

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Export data functionality
  const exportData = () => {
    console.log('Exporting analytics data...');
  };

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Title and Navigation */}
            <div className="flex items-center space-x-8">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Farm Analytics
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Advanced data insights and performance tracking
                </p>
              </div>
              
              {/* View Navigation */}
              <nav className="hidden md:flex space-x-1">
                {views.map((view) => (
                  <button
                    key={view.id}
                    onClick={() => setActiveView(view.id as any)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeView === view.id
                        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                    title={view.description}
                  >
                    {view.icon}
                    <span className="hidden lg:inline">{view.name}</span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Controls */}
            <div className="flex items-center space-x-4">
              {/* Global Search */}
              <div className="hidden lg:block w-80">
                <GlobalSearch
                  placeholder="Search analytics, metrics, insights..."
                  onResultSelect={handleSearchResult}
                  onSearchChange={setSearchQuery}
                  maxResults={8}
                />
              </div>

              {/* Farm Selector */}
              <select
                value={selectedFarm}
                onChange={(e) => setSelectedFarm(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
              >
                {farms.map(farm => (
                  <option key={farm.id} value={farm.id}>
                    {farm.name}
                  </option>
                ))}
              </select>

              {/* Time Range Selector */}
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as '1h' | '24h' | '7d' | '30d')}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
              >
                <option value="1h">Last Hour</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={exportData}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  title="Export Data"
                >
                  <FaDownload className="h-4 w-4" />
                </button>
                
                <button
                  onClick={toggleFullscreen}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  title="Toggle Fullscreen"
                >
                  <FaExpand className="h-4 w-4" />
                </button>
                
                <button className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                  <FaCog className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile View Navigation */}
      <div className="md:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 py-3">
          <div className="flex space-x-1 overflow-x-auto">
            {views.map((view) => (
              <button
                key={view.id}
                onClick={() => setActiveView(view.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  activeView === view.id
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {view.icon}
                <span>{view.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Search */}
      <div className="lg:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 py-3">
          <GlobalSearch
            placeholder="Search analytics, metrics, insights..."
            onResultSelect={handleSearchResult}
            onSearchChange={setSearchQuery}
            maxResults={6}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className={`${isFullscreen ? 'h-full overflow-auto' : 'max-w-7xl mx-auto'} px-4 sm:px-6 lg:px-8 py-6`}>
        {/* Quick Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Insights</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">24</p>
              </div>
              <FaBrain className="h-8 w-8 text-emerald-600" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Farm Efficiency</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">94.2%</p>
              </div>
              <FaBullseye className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Data Points</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">12.8K</p>
              </div>
              <FaChartLine className="h-8 w-8 text-purple-600" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Predictions</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">89%</p>
              </div>
              <FaFilter className="h-8 w-8 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Dynamic Content Based on Active View */}
        {activeView === 'dashboard' && (
          <AnalyticsDashboard
            farmId={selectedFarm === 'all' ? undefined : selectedFarm}
            timeRange={timeRange}
            onWidgetClick={handleWidgetClick}
            className="space-y-8"
          />
        )}

        {activeView === 'performance' && (
          <PerformanceMetrics
            farmId={selectedFarm === 'all' ? undefined : selectedFarm}
            timeframe={timeRange}
            showGoals={true}
            showTrends={true}
            className="space-y-8"
          />
        )}

        {activeView === 'insights' && (
          <SmartInsights
            farmId={selectedFarm === 'all' ? undefined : selectedFarm}
            showPredictions={true}
            showRecommendations={true}
            showAnomalies={true}
            maxInsights={20}
            className="space-y-8"
          />
        )}
      </div>

      {/* Floating Action Button for Mobile */}
      <div className="lg:hidden fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setActiveView(activeView === 'insights' ? 'dashboard' : 'insights')}
          className="bg-emerald-600 hover:bg-emerald-700 text-white p-4 rounded-full shadow-lg transition-colors"
        >
          {activeView === 'insights' ? (
            <FaChartLine className="h-6 w-6" />
          ) : (
            <FaBrain className="h-6 w-6" />
          )}
        </button>
      </div>
    </div>
  );
} 