"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FarmControlButton } from "@/components/ui/farm-control-button";
import { Badge } from "@/components/ui/badge";
import { FarmSelect } from "@/components/ui/farm-select";
import { FarmInput } from "@/components/ui/farm-input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/ui/PageHeader";
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
import { usePageData } from '@/components/shared/hooks/usePageData';
import { MetricsGrid, MetricCard } from '@/components/shared/metrics';

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

interface AnalyticsData {
  activeInsights: number;
  farmEfficiency: number;
  dataPoints: string;
  predictions: number;
}

const AnalyticsPage = () => {
  const [historicalGrows, setHistoricalGrows] = useState<HistoricalGrow[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [sortBy, setSortBy] = useState('end_date');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFarm, setSelectedFarm] = useState<string>('all');

  // Use our standardized data loading hook
  const { data: analyticsData, isLoading: analyticsDataLoading } = usePageData<AnalyticsData>({
    storageKey: 'analytics-integrations-connected',
    mockData: {
      activeInsights: 24,
      farmEfficiency: 94.2,
      dataPoints: "12.8K",
      predictions: 89
    }
  });

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
    { value: 'all', label: 'All Farms' },
    { value: 'greenhouse-alpha', label: 'Greenhouse Alpha' },
    { value: 'hydroponic-bay-2', label: 'Hydroponic Bay 2' },
    { value: 'vertical-tower-1', label: 'Vertical Tower 1' }
  ];

  const timeRangeOptions = [
    { value: '1h', label: 'Last Hour' },
    { value: '24h', label: 'Last 24 Hours' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' }
  ];

  // Handle search result selection
  const handleSearchResult = (result: any) => {
    console.log('Search result:', result);
    if (result.type === 'farm') {
      setSelectedFarm(result.id);
    }
  };

  const handleWidgetClick = (widgetId: string) => {
    console.log('Widget clicked:', widgetId);
    // Add specific widget interaction logic here
  };

  const exportData = () => {
    console.log('Exporting analytics data...');
    // Add export functionality here
  };

  if (isLoading || analyticsDataLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-farm-accent"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader
        title="Analytics & Intelligence"
        description="Advanced analytics for crop insights, yield optimization, and performance monitoring."
      >
        <div className="flex space-x-2">
          <FarmControlButton
            onClick={exportData}
            variant="default"
            animation="float"
          >
            <FaDownload className="h-4 w-4 mr-2" />
            Export Report
          </FarmControlButton>
          <FarmControlButton variant="primary" animation="pop">
            <FaBrain className="h-4 w-4 mr-2" />
            Generate Insights
          </FarmControlButton>
        </div>
      </PageHeader>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <FaChartLine className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <FaBullseye className="h-4 w-4" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <FaBrain className="h-4 w-4" />
            AI Insights
          </TabsTrigger>
          <TabsTrigger value="historical" className="flex items-center gap-2">
            <FaCalendarAlt className="h-4 w-4" />
            Historical Data
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Controls Section */}
          <Card className="card-shadow">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
                {/* Farm Selector */}
                <FarmSelect
                  value={selectedFarm}
                  onChange={(e) => setSelectedFarm(e.target.value)}
                  options={farms}
                  placeholder="Select Farm"
                />

                {/* Time Range Selector */}
                <FarmSelect
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value as '1h' | '24h' | '7d' | '30d')}
                  options={timeRangeOptions}
                  placeholder="Time Range"
                />

                {/* Search */}
                <div className="flex-1 min-w-0">
                  <FarmInput
                    placeholder="Search analytics, metrics, insights..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Use standardized MetricsGrid for basic metrics overview */}
          <MetricsGrid 
            columns={4}
            metrics={[
              {
                id: 'active-insights',
                label: 'Active Insights',
                value: analyticsData?.activeInsights?.toString() || "0",
                icon: () => <FaBrain className="text-farm-accent" />,
                stateClass: 'state-active'
              },
              {
                id: 'farm-efficiency',
                label: 'Farm Efficiency',
                value: `${analyticsData?.farmEfficiency || 0}%`,
                icon: () => <FaBullseye className="text-green-600" />,
                stateClass: 'state-growing'
              },
              {
                id: 'data-points',
                label: 'Data Points',
                value: analyticsData?.dataPoints || "0",
                icon: () => <FaChartLine className="text-blue-600" />,
                stateClass: 'state-active'
              },
              {
                id: 'predictions',
                label: 'Predictions',
                value: `${analyticsData?.predictions || 0}%`,
                icon: () => <FaFilter className="text-purple-600" />,
                stateClass: 'state-maintenance'
              }
            ]}
          />

          {/* Dashboard Content */}
          <div className="space-y-6">
            <AnalyticsDashboard
              farmId={selectedFarm === 'all' ? undefined : selectedFarm}
              timeRange={timeRange}
              onWidgetClick={handleWidgetClick}
              className="space-y-6"
            />
            
            {/* Environmental Monitoring */}
            <Card className="card-shadow">
              <CardHeader>
                <CardTitle className="text-farm-title">Environmental Conditions</CardTitle>
              </CardHeader>
              <CardContent>
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
                  className="bg-farm-white"
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <PerformanceMetrics
            farmId={selectedFarm === 'all' ? undefined : selectedFarm}
            timeframe={timeRange}
            showGoals={true}
            showTrends={true}
            className="space-y-6"
          />
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <SmartInsights
            farmId={selectedFarm === 'all' ? undefined : selectedFarm}
            showPredictions={true}
            showRecommendations={true}
            showAnomalies={true}
            maxInsights={20}
            className="space-y-6"
          />
        </TabsContent>

        <TabsContent value="historical" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="card-shadow">
              <CardHeader>
                <CardTitle className="text-farm-title">Historical Yields</CardTitle>
                <CardDescription className="text-control-label">Completed grows and harvest data</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sortedGrows.slice(0, 5).map((grow) => (
                    <div key={grow.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FaLeaf className="text-green-600" />
                        <div>
                          <p className="text-control-label font-medium">{grow.species_name}</p>
                          <p className="text-control-label opacity-70">{grow.shelf_name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sensor-value">{grow.yield_kg ? `${grow.yield_kg} kg` : 'N/A'}</p>
                        <Badge className={grow.status === 'completed' ? 'state-growing' : 'state-offline'}>
                          {grow.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="card-shadow">
              <CardHeader>
                <CardTitle className="text-farm-title">Performance Summary</CardTitle>
                <CardDescription className="text-control-label">Key performance indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg state-growing">
                      <p className="text-control-label">Success Rate</p>
                      <p className="text-sensor-value">{successRate.toFixed(1)}%</p>
                    </div>
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg state-active">
                      <p className="text-control-label">Avg Yield</p>
                      <p className="text-sensor-value">{averageYield.toFixed(1)} kg</p>
                    </div>
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg state-active">
                      <p className="text-control-label">Total Grows</p>
                      <p className="text-sensor-value">{totalGrows}</p>
                    </div>
                    <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg state-maintenance">
                      <p className="text-control-label">Est. Revenue</p>
                      <p className="text-sensor-value">${estimatedRevenue.toFixed(0)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsPage;
