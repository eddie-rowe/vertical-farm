import React, { useState, useMemo, useEffect } from 'react';
import { 
  FaBrain, 
  FaLightbulb, 
  FaExclamationTriangle, 
  FaInfoCircle, 
  FaCheckCircle,
  FaThumbsUp,
  FaThumbsDown,
  FaClock,
  FaLeaf,
  FaBolt,
  FaTint,
  FaThermometerHalf,
  FaEye,
  FaChartLine,
  FaCog,
  FaStar,
  FaHistory
} from 'react-icons/fa';

interface SmartInsight {
  id: string;
  type: 'optimization' | 'prediction' | 'anomaly' | 'recommendation' | 'alert';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number; // 0-100
  category: 'yield' | 'efficiency' | 'environmental' | 'energy' | 'maintenance';
  data: {
    metrics?: Record<string, number>;
    trends?: string[];
    timeframe?: string;
    affectedAreas?: string[];
  };
  actionItems?: {
    id: string;
    title: string;
    description: string;
    effort: 'low' | 'medium' | 'high';
    expectedImpact: string;
  }[];
  timestamp: number;
  status: 'new' | 'acknowledged' | 'in-progress' | 'completed' | 'dismissed';
  priority: number; // 1-10
}

interface PredictiveModel {
  id: string;
  name: string;
  type: 'yield' | 'energy' | 'growth' | 'maintenance';
  accuracy: number;
  lastUpdated: number;
  predictions: {
    timeframe: string;
    value: number;
    confidence: number;
    factors: string[];
  }[];
}

interface SmartInsightsProps {
  farmId?: string;
  showPredictions?: boolean;
  showRecommendations?: boolean;
  showAnomalies?: boolean;
  maxInsights?: number;
  className?: string;
}

// Mock data generators
const generateSmartInsights = (): SmartInsight[] => [
  {
    id: 'opt-001',
    type: 'optimization',
    title: 'Lighting Schedule Optimization Opportunity',
    description: 'AI analysis shows 15% energy savings possible by adjusting LED schedules in Zone A during low-growth periods.',
    impact: 'high',
    confidence: 92,
    category: 'energy',
    data: {
      metrics: { energySavings: 15, costReduction: 250 },
      trends: ['Decreasing energy efficiency', 'Stable growth rates'],
      timeframe: 'Next 30 days',
      affectedAreas: ['Zone A - Racks 1-4']
    },
    actionItems: [
      {
        id: 'action-1',
        title: 'Implement Smart Schedule',
        description: 'Deploy AI-optimized lighting schedule',
        effort: 'low',
        expectedImpact: '15% energy reduction'
      },
      {
        id: 'action-2',
        title: 'Monitor Growth Response',
        description: 'Track plant growth metrics for 2 weeks',
        effort: 'low',
        expectedImpact: 'Maintain yield quality'
      }
    ],
    timestamp: Date.now() - 1800000,
    status: 'new',
    priority: 8
  },
  {
    id: 'pred-001',
    type: 'prediction',
    title: 'Yield Forecast Shows 12% Increase',
    description: 'Machine learning models predict significant yield improvement in upcoming harvest cycle based on current environmental conditions.',
    impact: 'high',
    confidence: 87,
    category: 'yield',
    data: {
      metrics: { yieldIncrease: 12, confidenceLevel: 87 },
      trends: ['Optimal temperature control', 'Improved nutrient delivery'],
      timeframe: 'Next harvest (3 weeks)',
      affectedAreas: ['All zones']
    },
    timestamp: Date.now() - 3600000,
    status: 'acknowledged',
    priority: 7
  },
  {
    id: 'anom-001',
    type: 'anomaly',
    title: 'Unusual Humidity Pattern Detected',
    description: 'Zone B showing atypical humidity fluctuations. Pattern analysis suggests potential HVAC system inefficiency.',
    impact: 'medium',
    confidence: 94,
    category: 'environmental',
    data: {
      metrics: { humidityVariance: 23, normalRange: 65-75 },
      trends: ['Increasing variability', 'Energy consumption spike'],
      timeframe: 'Last 48 hours',
      affectedAreas: ['Zone B']
    },
    actionItems: [
      {
        id: 'action-3',
        title: 'Inspect HVAC System',
        description: 'Check Zone B HVAC for maintenance needs',
        effort: 'medium',
        expectedImpact: 'Restore stability'
      }
    ],
    timestamp: Date.now() - 7200000,
    status: 'in-progress',
    priority: 6
  },
  {
    id: 'rec-001',
    type: 'recommendation',
    title: 'Nutrient Delivery Optimization',
    description: 'Analysis suggests adjusting nutrient concentration by 8% during early growth phases to improve overall plant health.',
    impact: 'medium',
    confidence: 79,
    category: 'yield',
    data: {
      metrics: { healthImprovement: 8, growthAcceleration: 5 },
      trends: ['Slower initial growth', 'Normal later development'],
      timeframe: 'Next planting cycle',
      affectedAreas: ['Zones C, D']
    },
    actionItems: [
      {
        id: 'action-4',
        title: 'Update Nutrient Protocol',
        description: 'Modify early-stage nutrient concentrations',
        effort: 'low',
        expectedImpact: '8% health improvement'
      }
    ],
    timestamp: Date.now() - 10800000,
    status: 'new',
    priority: 5
  },
  {
    id: 'alert-001',
    type: 'alert',
    title: 'Predictive Maintenance Alert',
    description: 'Water pump system showing early signs of wear. Recommend proactive maintenance within 2 weeks.',
    impact: 'high',
    confidence: 85,
    category: 'maintenance',
    data: {
      metrics: { wearLevel: 73, normalThreshold: 65 },
      trends: ['Increasing vibration', 'Slight flow reduction'],
      timeframe: 'Next 2 weeks',
      affectedAreas: ['Primary Water System']
    },
    actionItems: [
      {
        id: 'action-5',
        title: 'Schedule Maintenance',
        description: 'Book preventive maintenance for water pump',
        effort: 'high',
        expectedImpact: 'Prevent system failure'
      }
    ],
    timestamp: Date.now() - 14400000,
    status: 'new',
    priority: 9
  }
];

const generatePredictiveModels = (): PredictiveModel[] => [
  {
    id: 'yield-model',
    name: 'Yield Prediction Model',
    type: 'yield',
    accuracy: 89.3,
    lastUpdated: Date.now() - 86400000,
    predictions: [
      { timeframe: '1 week', value: 156, confidence: 92, factors: ['Temperature', 'Light intensity', 'Nutrient levels'] },
      { timeframe: '2 weeks', value: 312, confidence: 87, factors: ['Environmental stability', 'Growth rate'] },
      { timeframe: '1 month', value: 645, confidence: 81, factors: ['Seasonal factors', 'System efficiency'] }
    ]
  },
  {
    id: 'energy-model',
    name: 'Energy Consumption Predictor',
    type: 'energy',
    accuracy: 94.7,
    lastUpdated: Date.now() - 43200000,
    predictions: [
      { timeframe: '24 hours', value: 1250, confidence: 96, factors: ['Lighting schedule', 'HVAC demand'] },
      { timeframe: '7 days', value: 8750, confidence: 92, factors: ['Weather patterns', 'Crop stage'] },
      { timeframe: '30 days', value: 37500, confidence: 85, factors: ['Seasonal demand', 'System efficiency'] }
    ]
  }
];

export const SmartInsights: React.FC<SmartInsightsProps> = ({
  farmId,
  showPredictions = true,
  showRecommendations = true,
  showAnomalies = true,
  maxInsights = 10,
  className = ''
}) => {
  const [insights, setInsights] = useState<SmartInsight[]>(() => generateSmartInsights());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [feedbackGiven, setFeedbackGiven] = useState<Set<string>>(new Set());

  const models = useMemo(() => generatePredictiveModels(), []);

  // Filter insights based on selections
  const filteredInsights = useMemo(() => {
    let filtered = insights;
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(insight => insight.category === selectedCategory);
    }
    
    if (selectedType !== 'all') {
      filtered = filtered.filter(insight => insight.type === selectedType);
    }
    
    return filtered
      .sort((a, b) => b.priority - a.priority || b.timestamp - a.timestamp)
      .slice(0, maxInsights);
  }, [insights, selectedCategory, selectedType, maxInsights]);

  // Get insight icon
  const getInsightIcon = (type: string, category: string) => {
    if (type === 'optimization') return <FaCog className="h-5 w-5" />;
    if (type === 'prediction') return <FaChartLine className="h-5 w-5" />;
    if (type === 'anomaly') return <FaExclamationTriangle className="h-5 w-5" />;
    if (type === 'recommendation') return <FaLightbulb className="h-5 w-5" />;
    if (type === 'alert') return <FaInfoCircle className="h-5 w-5" />;
    
    // Category fallback
    switch (category) {
      case 'yield': return <FaLeaf className="h-5 w-5" />;
      case 'energy': return <FaBolt className="h-5 w-5" />;
      case 'environmental': return <FaThermometerHalf className="h-5 w-5" />;
      case 'efficiency': return <FaTint className="h-5 w-5" />;
      default: return <FaBrain className="h-5 w-5" />;
    }
  };

  // Get impact color
  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      case 'medium': return 'text-amber-600 bg-amber-50 dark:bg-amber-900/20';
      case 'low': return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'acknowledged': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'in-progress': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'dismissed': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  // Handle status change
  const updateInsightStatus = (insightId: string, newStatus: SmartInsight['status']) => {
    setInsights(prev => 
      prev.map(insight => 
        insight.id === insightId 
          ? { ...insight, status: newStatus }
          : insight
      )
    );
  };

  // Handle feedback
  const giveFeedback = (insightId: string, positive: boolean) => {
    setFeedbackGiven(prev => new Set([...prev, insightId]));
    // In a real app, this would send feedback to the AI system
    console.log(`Feedback for ${insightId}: ${positive ? 'positive' : 'negative'}`);
  };

  const categories = [
    { id: 'all', name: 'All Categories' },
    { id: 'yield', name: 'Yield' },
    { id: 'efficiency', name: 'Efficiency' },
    { id: 'environmental', name: 'Environmental' },
    { id: 'energy', name: 'Energy' },
    { id: 'maintenance', name: 'Maintenance' }
  ];

  const types = [
    { id: 'all', name: 'All Types' },
    { id: 'optimization', name: 'Optimizations' },
    { id: 'prediction', name: 'Predictions' },
    { id: 'anomaly', name: 'Anomalies' },
    { id: 'recommendation', name: 'Recommendations' },
    { id: 'alert', name: 'Alerts' }
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
            <FaBrain className="h-6 w-6 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Smart Insights Engine
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              AI-powered analytics and recommendations
            </p>
          </div>
        </div>
      </div>

      {/* Predictive Models Overview */}
      {showPredictions && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {models.map((model) => (
            <div
              key={model.id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {model.name}
                </h3>
                <div className="flex items-center gap-2">
                  <FaStar className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {model.accuracy}%
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                {model.predictions.slice(0, 2).map((pred, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      {pred.timeframe}:
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {pred.value} {model.type === 'energy' ? 'kWh' : 'kg'}
                      </span>
                      <span className="text-xs px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
                        {pred.confidence}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <span className="text-xs text-gray-500 dark:text-gray-500 flex items-center gap-1">
                  <FaHistory className="h-3 w-3" />
                  Updated {new Date(model.lastUpdated).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex flex-wrap gap-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 self-center">
            Category:
          </span>
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-3 py-1 rounded-md text-sm transition-colors ${
                selectedCategory === category.id
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
        
        <div className="flex flex-wrap gap-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 self-center">
            Type:
          </span>
          {types.map(type => (
            <button
              key={type.id}
              onClick={() => setSelectedType(type.id)}
              className={`px-3 py-1 rounded-md text-sm transition-colors ${
                selectedType === type.id
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {type.name}
            </button>
          ))}
        </div>
      </div>

      {/* Insights List */}
      <div className="space-y-4">
        {filteredInsights.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <FaBrain className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No insights match your current filters</p>
          </div>
        ) : (
          filteredInsights.map((insight) => (
            <div
              key={insight.id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
            >
              {/* Insight Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${getImpactColor(insight.impact)}`}>
                    {getInsightIcon(insight.type, insight.category)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {insight.title}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(insight.status)}`}>
                        {insight.status.replace('-', ' ')}
                      </span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mb-2">
                      {insight.description}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-500">
                      <span className="flex items-center gap-1">
                        <FaClock className="h-3 w-3" />
                        {new Date(insight.timestamp).toLocaleDateString()}
                      </span>
                      <span>Confidence: {insight.confidence}%</span>
                      <span>Priority: {insight.priority}/10</span>
                    </div>
                  </div>
                </div>

                {/* Feedback buttons */}
                {!feedbackGiven.has(insight.id) && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => giveFeedback(insight.id, true)}
                      className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                      title="Helpful insight"
                    >
                      <FaThumbsUp className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => giveFeedback(insight.id, false)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      title="Not helpful"
                    >
                      <FaThumbsDown className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Insight Data */}
              {insight.data && (
                <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    {insight.data.metrics && (
                      <div>
                        <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Key Metrics
                        </h4>
                        {Object.entries(insight.data.metrics).map(([key, value]) => (
                          <div key={key} className="text-gray-600 dark:text-gray-400">
                            {key}: {value}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {insight.data.timeframe && (
                      <div>
                        <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Timeframe
                        </h4>
                        <p className="text-gray-600 dark:text-gray-400">
                          {insight.data.timeframe}
                        </p>
                      </div>
                    )}
                    
                    {insight.data.affectedAreas && (
                      <div>
                        <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Affected Areas
                        </h4>
                        <div className="text-gray-600 dark:text-gray-400">
                          {insight.data.affectedAreas.map((area, idx) => (
                            <div key={idx}>{area}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Items */}
              {insight.actionItems && insight.actionItems.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                    Recommended Actions
                  </h4>
                  <div className="space-y-2">
                    {insight.actionItems.map((action) => (
                      <div
                        key={action.id}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                      >
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900 dark:text-white">
                            {action.title}
                          </h5>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {action.description}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-0.5 text-xs rounded ${
                              action.effort === 'low' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                              action.effort === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                              'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                              {action.effort} effort
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-500">
                              Impact: {action.expectedImpact}
                            </span>
                          </div>
                        </div>
                        <button className="ml-4 px-3 py-1 text-sm bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors">
                          Start
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Status Actions */}
              <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex gap-2">
                  {insight.status === 'new' && (
                    <button
                      onClick={() => updateInsightStatus(insight.id, 'acknowledged')}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Acknowledge
                    </button>
                  )}
                  {insight.status === 'acknowledged' && (
                    <button
                      onClick={() => updateInsightStatus(insight.id, 'in-progress')}
                      className="px-3 py-1 text-sm bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
                    >
                      Start Working
                    </button>
                  )}
                  {insight.status === 'in-progress' && (
                    <button
                      onClick={() => updateInsightStatus(insight.id, 'completed')}
                      className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                    >
                      Mark Complete
                    </button>
                  )}
                  <button
                    onClick={() => updateInsightStatus(insight.id, 'dismissed')}
                    className="px-3 py-1 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                  >
                    Dismiss
                  </button>
                </div>

                <button className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                  <FaEye className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SmartInsights; 