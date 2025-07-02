"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FaChartBar, 
  FaChartLine, 
  FaArrowUp, 
  FaArrowDown, 
  FaDollarSign, 
  FaLeaf, 
  FaUsers, 
  FaCalendarAlt,
  FaSearch, 
  FaBrain, 
  FaBullseye,
  FaCog,
  FaDownload,
  FaExpand,
  FaFilter
} from '@/lib/icons';
import { 
  Calendar, 
  Download, 
  TrendingUp, 
  TrendingDown,
  Award, 
  BarChart3, 
  Search, 
  Filter,
  PieChart,
  Activity 
} from "lucide-react";

import { 
  AnalyticsDashboard, 
  PerformanceMetrics, 
  SmartInsights,
  EnvironmentalChart 
} from '@/components/features/business';
import { GlobalSearch } from '@/components/shared';
import { SearchResult } from '@/components/shared';

interface HistoricalGrow {
  id: string;
  shelf_name: string;
  farm_name: string;
  recipe_name: string;
  species_name: string;
  start_date: string;
  end_date: string;
  status: 'completed' | 'aborted';
  yield_kg?: number;
  duration_days: number;
  target_duration_days: number;
  notes?: string;
}

const AnalyticsPage = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [historicalGrows, setHistoricalGrows] = useState<HistoricalGrow[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [sortBy, setSortBy] = useState('end_date');
  const [isLoading, setIsLoading] = useState(true);
  const [activeView, setActiveView] = useState<'dashboard' | 'performance' | 'insights'>('dashboard');
  const [selectedFarm, setSelectedFarm] = useState<string>('all');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Load historical grow data
  useEffect(() => {
    const mockHistory: HistoricalGrow[] = [
      {
        id: "hist-1",
        shelf_name: "Shelf A1-1-1",
        farm_name: "Greenhouse A",
        recipe_name: "Quick Lettuce",
        species_name: "Lettuce",
        start_date: "2023-12-01",
        end_date: "2024-01-05",
        status: "completed",
        yield_kg: 2.3,
        duration_days: 35,
        target_duration_days: 35,
        notes: "Excellent harvest - exceeded yield expectations"
      },
      {
        id: "hist-2",
        shelf_name: "Shelf A1-1-2",
        farm_name: "Greenhouse A",
        recipe_name: "Premium Basil",
        species_name: "Basil",
        start_date: "2023-11-15",
        end_date: "2024-01-08",
        status: "completed",
        yield_kg: 1.8,
        duration_days: 54,
        target_duration_days: 49,
        notes: "Good quality, slightly longer than expected"
      },
      {
        id: "hist-3",
        shelf_name: "Shelf B1-1-1",
        farm_name: "Greenhouse A",
        recipe_name: "Quick Lettuce",
        species_name: "Lettuce",
        start_date: "2023-11-01",
        end_date: "2023-12-10",
        status: "aborted",
        duration_days: 39,
        target_duration_days: 35,
        notes: "Pest infestation - had to abort"
      },
      {
        id: "hist-4",
        shelf_name: "Shelf A1-2-1",
        farm_name: "Greenhouse A",
        recipe_name: "Premium Basil",
        species_name: "Basil",
        start_date: "2023-10-15",
        end_date: "2023-12-03",
        status: "completed",
        yield_kg: 1.9,
        duration_days: 49,
        target_duration_days: 49,
        notes: "Perfect harvest timing"
      },
      {
        id: "hist-5",
        shelf_name: "Shelf B1-1-2",
        farm_name: "Greenhouse A",
        recipe_name: "Quick Lettuce",
        species_name: "Lettuce",
        start_date: "2023-10-01",
        end_date: "2023-11-08",
        status: "completed",
        yield_kg: 2.1,
        duration_days: 38,
        target_duration_days: 35,
        notes: "Good yield, slightly extended growing period"
      }
    ];

    setHistoricalGrows(mockHistory);
    setIsLoading(false);
  }, []);

  // Calculate analytics from grow data
  const filteredGrows = historicalGrows.filter(grow => {
    const matchesSearch = !searchTerm || 
      grow.species_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      grow.recipe_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      grow.shelf_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      grow.farm_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const sortedGrows = [...filteredGrows].sort((a, b) => {
    switch (sortBy) {
      case 'yield':
        return (b.yield_kg || 0) - (a.yield_kg || 0);
      case 'duration':
        return b.duration_days - a.duration_days;
      case 'species':
        return a.species_name.localeCompare(b.species_name);
      default: // end_date
        return new Date(b.end_date).getTime() - new Date(a.end_date).getTime();
    }
  });

  // Analytics calculations
  const totalGrows = filteredGrows.length;
  const completedGrows = filteredGrows.filter(g => g.status === 'completed');
  const totalYield = completedGrows.reduce((sum, grow) => sum + (grow.yield_kg || 0), 0);
  const averageYield = completedGrows.length > 0 ? totalYield / completedGrows.length : 0;
  const successRate = totalGrows > 0 ? (completedGrows.length / totalGrows) * 100 : 0;

  // Business calculations (enhanced with real data)
  const estimatedRevenue = totalYield * 15; // Assuming $15/kg average price
  const totalCustomers = 573; // This would come from customer data
  const monthlyGrowthRate = 12.5;

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
    // Navigate to the result or filter data based on selection
    if (result.type === 'farm') {
      setSelectedFarm(result.id);
    }
  };

  // Handle widget click from dashboard
  const handleWidgetClick = (widgetId: string) => {
    console.log('Widget clicked:', widgetId);
    // Could navigate to detailed view or expand widget
  };

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Export data functionality
  const exportData = () => {
    // In a real app, this would trigger data export
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
                  onSearchChange={setSearchTerm}
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
                onChange={(e) => setTimeRange(e.target.value as any)}
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
            onSearchChange={setSearchTerm}
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
          <div className="space-y-8">
            <AnalyticsDashboard
              farmId={selectedFarm === 'all' ? undefined : selectedFarm}
              timeRange={timeRange}
              onWidgetClick={handleWidgetClick}
              className="space-y-8"
            />
            
            {/* Environmental Monitoring */}
            <EnvironmentalChart
              data={[
                { timestamp: '2024-01-01T08:00:00Z', temperature: 72.5, humidity: 65, lightLevel: 350, co2: 420, vpd: 1.2 },
                { timestamp: '2024-01-01T12:00:00Z', temperature: 75.4, humidity: 68, lightLevel: 420, co2: 415, vpd: 1.4 },
                { timestamp: '2024-01-01T16:00:00Z', temperature: 74.8, humidity: 70, lightLevel: 380, co2: 410, vpd: 1.3 },
                { timestamp: '2024-01-01T20:00:00Z', temperature: 72.0, humidity: 72, lightLevel: 150, co2: 425, vpd: 1.1 },
                { timestamp: '2024-01-02T00:00:00Z', temperature: 71.2, humidity: 75, lightLevel: 50, co2: 440, vpd: 0.9 },
                { timestamp: '2024-01-02T04:00:00Z', temperature: 70.7, humidity: 78, lightLevel: 20, co2: 450, vpd: 0.8 },
                { timestamp: '2024-01-02T08:00:00Z', temperature: 72.1, humidity: 76, lightLevel: 360, co2: 420, vpd: 1.0 }
              ]}
              title="Environmental Conditions (Last 24h)"
              height={350}
              selectedMetrics={['temperature', 'humidity', 'lightLevel']}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-lg"
            />
          </div>
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
};

export default AnalyticsPage;
