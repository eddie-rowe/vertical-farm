"use client"

import React, { useState, useEffect } from 'react'
import { Card } from "@/components/ui/card"
import { FaBrain, FaLeaf, FaBuilding, FaExclamationTriangle, FaChartLine, FaMapMarkedAlt } from '@/lib/icons'
import { 
  CropEnvironmentView, 
  OperationalBusinessView, 
  RiskIncidentView, 
  DashboardsForecastingView, 
  HeatmapsView 
} from '@/components/features/intelligence';
import { BeakerIcon, ChartBarIcon, EyeIcon, BoltIcon } from '@heroicons/react/24/outline'
import { EmptyStateWithIntegrations, IntegrationHint } from '@/components/features/automation';
import { AI_INTEGRATIONS, INTEGRATION_MESSAGES, INTEGRATION_CONTEXTS } from '@/lib/integrations/constants'
import { PageHeader } from '@/components/ui/PageHeader'

const tabs = [
  {
    id: 'crop-environment',
    label: 'Crop & Environment Intelligence',
    icon: <FaLeaf className="text-green-600" />,
    component: CropEnvironmentView
  },
  {
    id: 'operational-business',
    label: 'Operational & Business Intelligence',
    icon: <FaBuilding className="text-blue-600" />,
    component: OperationalBusinessView
  },
  {
    id: 'risk-incident',
    label: 'Risk & Incident Detection',
    icon: <FaExclamationTriangle className="text-red-600" />,
    component: RiskIncidentView
  },
  {
    id: 'dashboards-forecasting',
    label: 'Dashboards & Forecasting',
    icon: <FaChartLine className="text-purple-600" />,
    component: DashboardsForecastingView
  },
  {
    id: 'heatmaps',
    label: 'Operations Heatmaps',
    icon: <FaMapMarkedAlt className="text-orange-600" />,
    component: HeatmapsView
  }
]

// Mock data to simulate existing AI data
interface AIData {
  analysisRuns: number;
  predictions: number;
  insights: number;
  hasData: boolean;
}

const AIPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('crop-environment')
  const [aiData, setAIData] = useState<AIData>({
    analysisRuns: 0,
    predictions: 0,
    insights: 0,
    hasData: false
  });
  const [isLoading, setIsLoading] = useState(true);

  const activeTabData = tabs.find(tab => tab.id === activeTab)
  const ActiveComponent = activeTabData?.component

  useEffect(() => {
    // Simulate loading AI data
    const loadAIData = async () => {
      setIsLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if user has connected AI integrations
      const hasConnectedAI = localStorage.getItem('ai-integrations-connected');
      
      if (hasConnectedAI) {
        setAIData({
          analysisRuns: 24,
          predictions: 12,
          insights: 6,
          hasData: true
        });
      } else {
        setAIData({
          analysisRuns: 0,
          predictions: 0,
          insights: 0,
          hasData: false
        });
      }
      
      setIsLoading(false);
    };

    loadAIData();
  }, []);

  const handleConnectIntegration = (integrationName: string) => {
    console.log(`Connecting to ${integrationName}...`);
    // This would typically redirect to integration setup
    window.location.href = `/integrations/${integrationName.toLowerCase().replace(/\s+/g, '-')}`;
  };

  const aiIntegrationsWithHandlers = AI_INTEGRATIONS.map(integration => ({
    ...integration,
    onConnect: () => handleConnectIntegration(integration.name)
  }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show empty state if no AI data
  if (!aiData.hasData) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="AI Insights & Analytics"
          description="Leverage artificial intelligence for crop analysis, yield predictions, and growth optimization."
        />

        <EmptyStateWithIntegrations
          pageType="ai"
          title="Unlock AI-Powered Farming"
          description="Connect AI platforms to enable intelligent crop analysis, predictive insights, and automated recommendations for optimal growth."
          integrations={aiIntegrationsWithHandlers}
        />
      </div>
    );
  }

  // Show dashboard with integration hints
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="AI Insights & Analytics"
        description="Leverage artificial intelligence for crop analysis, yield predictions, and growth optimization."
      />

      {/* Integration Hint */}
      <IntegrationHint
        message={INTEGRATION_MESSAGES.ai}
        integrations={['OpenAI', 'Anthropic Claude', 'Google AI', 'Perplexity AI']}
        pageContext={INTEGRATION_CONTEXTS.ai}
        variant="info"
      />

      {/* AI Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BeakerIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Analysis Runs</dt>
                  <dd className="text-lg font-medium text-gray-900">{aiData.analysisRuns}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Predictions Generated</dt>
                  <dd className="text-lg font-medium text-gray-900">{aiData.predictions}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <EyeIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Actionable Insights</dt>
                  <dd className="text-lg font-medium text-gray-900">{aiData.insights}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Crop Analysis */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Crop Health Analysis</h3>
            <EyeIcon className="h-5 w-5 text-blue-500" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <span className="text-sm text-gray-900">Zone A - Lettuce</span>
              <span className="text-sm font-medium text-green-600">Healthy</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <span className="text-sm text-gray-900">Zone B - Tomatoes</span>
              <span className="text-sm font-medium text-yellow-600">Attention Needed</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <span className="text-sm text-gray-900">Zone C - Herbs</span>
              <span className="text-sm font-medium text-green-600">Thriving</span>
            </div>
          </div>
        </div>

        {/* Yield Predictions */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Yield Predictions</h3>
            <ChartBarIcon className="h-5 w-5 text-purple-500" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <span className="text-sm font-medium text-gray-900">Next Harvest</span>
                <p className="text-xs text-gray-600">Expected in 5 days</p>
              </div>
              <span className="text-sm font-medium text-gray-900">24.5 lbs</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <span className="text-sm font-medium text-gray-900">Weekly Yield</span>
                <p className="text-xs text-gray-600">Projected average</p>
              </div>
              <span className="text-sm font-medium text-gray-900">18.2 lbs</span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Recommendations */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">AI Recommendations</h3>
          <BoltIcon className="h-5 w-5 text-yellow-500" />
        </div>
        <div className="space-y-4">
          <div className="border-l-4 border-blue-500 pl-4">
            <h4 className="text-sm font-medium text-gray-900 mb-1">Optimize Light Schedule</h4>
            <p className="text-sm text-gray-600">
              Increase LED intensity by 15% during morning hours (6-10 AM) to boost photosynthesis in Zone A lettuce. 
              Expected yield increase: 8-12%.
            </p>
            <div className="mt-2">
              <button className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200 transition-colors">
                Apply Recommendation
              </button>
            </div>
          </div>
          
          <div className="border-l-4 border-green-500 pl-4">
            <h4 className="text-sm font-medium text-gray-900 mb-1">Nutrient Adjustment</h4>
            <p className="text-sm text-gray-600">
              Reduce nitrogen levels by 10% in Zone B hydroponic solution. Current levels are optimal for vegetative growth 
              but may delay flowering in tomatoes.
            </p>
            <div className="mt-2">
              <button className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded hover:bg-green-200 transition-colors">
                Apply Recommendation
              </button>
            </div>
          </div>

          <div className="border-l-4 border-yellow-500 pl-4">
            <h4 className="text-sm font-medium text-gray-900 mb-1">Harvest Timing</h4>
            <p className="text-sm text-gray-600">
              Zone C herbs are approaching peak flavor compounds. Harvest within 48 hours for maximum market value and 
              customer satisfaction.
            </p>
            <div className="mt-2">
              <button className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded hover:bg-yellow-200 transition-colors">
                Schedule Harvest
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Recent AI Activity */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent AI Activity</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <span className="text-sm font-medium text-gray-900">Computer Vision Analysis</span>
              <p className="text-xs text-gray-600">Analyzed 156 plant images for health assessment</p>
            </div>
            <span className="text-xs text-gray-500">2 hours ago</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <span className="text-sm font-medium text-gray-900">Growth Pattern Analysis</span>
              <p className="text-xs text-gray-600">Generated yield predictions for next 14 days</p>
            </div>
            <span className="text-xs text-gray-500">4 hours ago</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <span className="text-sm font-medium text-gray-900">Environmental Optimization</span>
              <p className="text-xs text-gray-600">Analyzed temperature and humidity patterns</p>
            </div>
            <span className="text-xs text-gray-500">6 hours ago</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AIPage 