"use client"

import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FaChartLine, FaRobot, FaCalendarAlt, FaArrowUp, FaArrowDown, FaArrowRight, FaLeaf, FaDollarSign, FaBoxes, FaUsers, FaBolt, FaEye, FaDownload, FaFilter } from 'react-icons/fa'

interface ForecastMetric {
  id: string
  name: string
  current: number
  predicted: number
  timeframe: string
  confidence: number
  trend: 'up' | 'down' | 'stable'
  unit: string
  accuracy: number
  category: 'production' | 'revenue' | 'resources' | 'quality'
}

const mockForecastMetrics: ForecastMetric[] = [
  {
    id: '1',
    name: 'Weekly Production',
    current: 1015,
    predicted: 1125,
    timeframe: 'Next 7 days',
    confidence: 94,
    trend: 'up',
    unit: 'kg',
    accuracy: 92,
    category: 'production'
  },
  {
    id: '2',
    name: 'Revenue Projection',
    current: 42850,
    predicted: 48200,
    timeframe: 'Next Month',
    confidence: 88,
    trend: 'up',
    unit: '$',
    accuracy: 89,
    category: 'revenue'
  },
  {
    id: '3',
    name: 'Energy Consumption',
    current: 2840,
    predicted: 2650,
    timeframe: 'Next Week',
    confidence: 96,
    trend: 'down',
    unit: 'kWh',
    accuracy: 95,
    category: 'resources'
  },
  {
    id: '4',
    name: 'Quality Score',
    current: 96.8,
    predicted: 97.5,
    timeframe: 'Next 2 weeks',
    confidence: 85,
    trend: 'up',
    unit: '%',
    accuracy: 91,
    category: 'quality'
  },
  {
    id: '5',
    name: 'Labor Hours',
    current: 336,
    predicted: 315,
    timeframe: 'Next Week',
    confidence: 90,
    trend: 'down',
    unit: 'hours',
    accuracy: 87,
    category: 'resources'
  },
  {
    id: '6',
    name: 'Harvest Yield',
    current: 145,
    predicted: 162,
    timeframe: 'Next 10 days',
    confidence: 92,
    trend: 'up',
    unit: 'kg/day',
    accuracy: 93,
    category: 'production'
  }
]

interface TrendAnalysis {
  period: string
  metric: string
  change: number
  significance: 'high' | 'medium' | 'low'
  factors: string[]
  impact: string
}

const mockTrendAnalysis: TrendAnalysis[] = [
  {
    period: '30 Days',
    metric: 'Production Efficiency',
    change: 12.5,
    significance: 'high',
    factors: ['LED optimization', 'Improved nutrient timing', 'Climate control'],
    impact: 'Positive trend likely to continue based on optimization patterns'
  },
  {
    period: '14 Days',
    metric: 'Cost per Unit',
    change: -8.2,
    significance: 'medium',
    factors: ['Energy savings', 'Labor optimization', 'Reduced waste'],
    impact: 'Cost reduction sustainable with current operational changes'
  },
  {
    period: '7 Days',
    metric: 'Customer Demand',
    change: 15.8,
    significance: 'high',
    factors: ['Seasonal increase', 'New restaurant partnerships', 'Quality improvements'],
    impact: 'Strong demand growth expected to persist for 2-3 months'
  }
]

interface AlertForecast {
  type: 'opportunity' | 'warning' | 'critical'
  title: string
  description: string
  timeframe: string
  probability: number
  impact: 'low' | 'medium' | 'high'
  actions: string[]
}

const mockAlertForecasts: AlertForecast[] = [
  {
    type: 'opportunity',
    title: 'Peak Production Window',
    description: 'Optimal growing conditions forecasted for maximum yield',
    timeframe: 'Days 5-12',
    probability: 89,
    impact: 'high',
    actions: [
      'Increase seedling production',
      'Prepare for higher harvest volume',
      'Schedule additional labor'
    ]
  },
  {
    type: 'warning',
    title: 'Equipment Maintenance Due',
    description: 'Predictive models suggest pump maintenance needed',
    timeframe: 'Next 3-5 days',
    probability: 76,
    impact: 'medium',
    actions: [
      'Schedule maintenance window',
      'Order replacement parts',
      'Prepare backup systems'
    ]
  },
  {
    type: 'critical',
    title: 'Demand Surge Expected',
    description: 'Customer orders likely to exceed capacity',
    timeframe: 'Week of Jan 28',
    probability: 82,
    impact: 'high',
    actions: [
      'Accelerate current crop cycles',
      'Contact backup suppliers',
      'Communicate with customers'
    ]
  }
]

export default function DashboardsForecastingView() {
  const [selectedTimeframe, setSelectedTimeframe] = useState('week')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'production': return <FaBoxes className="text-blue-600" />
      case 'revenue': return <FaDollarSign className="text-green-600" />
      case 'resources': return <FaBolt className="text-yellow-600" />
      case 'quality': return <FaLeaf className="text-purple-600" />
      default: return <FaChartLine className="text-gray-600" />
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <FaArrowUp className="text-green-500" />
      case 'down': return <FaArrowDown className="text-red-500" />
      default: return <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
    }
  }

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'opportunity': return 'bg-green-50 border-green-200 text-green-800'
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'critical': return 'bg-red-50 border-red-200 text-red-800'
      default: return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  const filteredMetrics = selectedCategory === 'all' 
    ? mockForecastMetrics 
    : mockForecastMetrics.filter(metric => metric.category === selectedCategory)

  return (
    <div className="space-y-6">
      {/* Forecasting Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FaRobot className="text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">12</p>
              <p className="text-sm text-gray-600">Active Models</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <FaChartLine className="text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">91.2%</p>
              <p className="text-sm text-gray-600">Avg Accuracy</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <FaArrowUp className="text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">7</p>
              <p className="text-sm text-gray-600">Trend Alerts</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <FaCalendarAlt className="text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">14d</p>
              <p className="text-sm text-gray-600">Forecast Range</p>
            </div>
          </div>
        </Card>
      </div>

      {/* AI Forecast Models */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FaRobot className="text-purple-600" />
            AI Forecasting Models
          </h3>
          
          <div className="flex gap-2">
            <div className="flex gap-1">
              {['week', '2week', 'month', 'quarter'].map((period) => (
                <Button
                  key={period}
                  variant={selectedTimeframe === period ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedTimeframe(period)}
                >
                  {period === 'week' ? '1W' : period === '2week' ? '2W' : period === 'month' ? '1M' : 'Q'}
                </Button>
              ))}
            </div>
            <div className="border-l mx-2"></div>
            <div className="flex gap-1">
              {[
                { id: 'all', label: 'All', icon: <FaChartLine /> },
                { id: 'production', label: 'Production', icon: <FaBoxes /> },
                { id: 'revenue', label: 'Revenue', icon: <FaDollarSign /> },
                { id: 'resources', label: 'Resources', icon: <FaBolt /> },
                { id: 'quality', label: 'Quality', icon: <FaLeaf /> }
              ].map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                  className="flex items-center gap-1"
                >
                  {category.icon}
                  <span className="hidden sm:inline">{category.label}</span>
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMetrics.map((metric) => (
            <div key={metric.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {getCategoryIcon(metric.category)}
                  <h4 className="font-medium">{metric.name}</h4>
                </div>
                {getTrendIcon(metric.trend)}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600">Current</p>
                    <p className="text-lg font-bold">
                      {metric.unit === '$' ? '$' : ''}{metric.current.toLocaleString()}
                      {metric.unit !== '$' ? ` ${metric.unit}` : ''}
                    </p>
                  </div>
                  <FaArrowRight className="text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-600">Predicted</p>
                    <p className="text-lg font-bold text-blue-600">
                      {metric.unit === '$' ? '$' : ''}{metric.predicted.toLocaleString()}
                      {metric.unit !== '$' ? ` ${metric.unit}` : ''}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Confidence</span>
                    <span className="font-medium">{metric.confidence}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 bg-blue-500 rounded-full"
                      style={{ width: `${metric.confidence}%` }}
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-600">{metric.timeframe}</span>
                  <Badge variant="outline">
                    {metric.accuracy}% accuracy
                  </Badge>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <span>Change:</span>
                  <span className={`font-medium ${
                    metric.predicted > metric.current ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {metric.predicted > metric.current ? '+' : ''}
                    {((metric.predicted - metric.current) / metric.current * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Trend Analysis */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <FaArrowUp className="text-green-600" />
          Trend Analysis & Insights
        </h3>

        <div className="space-y-4">
          {mockTrendAnalysis.map((trend, index) => (
            <div key={index} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-semibold">{trend.metric}</h4>
                    <Badge 
                      className={`${
                        trend.significance === 'high' ? 'bg-red-100 text-red-800' :
                        trend.significance === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}
                    >
                      {trend.significance} significance
                    </Badge>
                    <Badge variant="outline">{trend.period}</Badge>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-3">
                    {trend.change > 0 ? (
                      <FaArrowUp className="text-green-500" />
                    ) : (
                      <FaArrowDown className="text-red-500" />
                    )}
                    <span className={`font-bold text-lg ${
                      trend.change > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {trend.change > 0 ? '+' : ''}{trend.change}%
                    </span>
                    <span className="text-gray-600">change</span>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <h5 className="font-medium text-sm mb-1">Key Factors:</h5>
                      <div className="flex gap-1 flex-wrap">
                        {trend.factors.map((factor, factorIndex) => (
                          <Badge key={factorIndex} variant="secondary" className="text-xs">
                            {factor}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h5 className="font-medium text-sm mb-1 flex items-center gap-1">
                        <FaRobot className="text-purple-600" />
                        AI Analysis:
                      </h5>
                      <p className="text-sm text-gray-700">{trend.impact}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Forecast Alerts */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <FaCalendarAlt className="text-blue-600" />
          Forecast Alerts & Opportunities
        </h3>

        <div className="space-y-4">
          {mockAlertForecasts.map((alert, index) => (
            <div key={index} className={`border rounded-lg p-4 ${getAlertColor(alert.type)}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge 
                      className={`${
                        alert.type === 'opportunity' ? 'bg-green-600 text-white' :
                        alert.type === 'warning' ? 'bg-yellow-600 text-white' :
                        'bg-red-600 text-white'
                      }`}
                    >
                      {alert.type.toUpperCase()}
                    </Badge>
                    <Badge variant="outline">
                      {alert.probability}% probability
                    </Badge>
                    <Badge variant="outline">
                      {alert.impact} impact
                    </Badge>
                  </div>

                  <h4 className="font-semibold text-lg mb-1">{alert.title}</h4>
                  <p className="mb-2">{alert.description}</p>
                  
                  <div className="flex items-center gap-4 text-sm mb-3">
                    <span className="flex items-center gap-1">
                      <FaCalendarAlt />
                      {alert.timeframe}
                    </span>
                  </div>

                  <div>
                    <h5 className="font-medium text-sm mb-2">Recommended Actions:</h5>
                    <ul className="text-sm space-y-1">
                      {alert.actions.map((action, actionIndex) => (
                        <li key={actionIndex} className="flex items-start gap-1">
                          <span className="text-blue-600 mt-1">•</span>
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  <Button size="sm" variant="outline">
                    <FaEye />
                  </Button>
                  <Button size="sm">
                    Plan
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Model Performance */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <FaChartLine className="text-purple-600" />
          Model Performance & Accuracy
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Production Models</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Yield Prediction</span>
                <span className="font-semibold">93.2%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Growth Rate</span>
                <span className="font-semibold">91.8%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Quality Score</span>
                <span className="font-semibold">89.5%</span>
              </div>
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
            <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">Business Models</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Revenue Forecast</span>
                <span className="font-semibold">88.7%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Demand Prediction</span>
                <span className="font-semibold">92.1%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Cost Analysis</span>
                <span className="font-semibold">90.3%</span>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
            <h4 className="font-medium text-purple-800 dark:text-purple-200 mb-2">Risk Models</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Equipment Failure</span>
                <span className="font-semibold">94.5%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Environmental Risk</span>
                <span className="font-semibold">87.9%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Market Volatility</span>
                <span className="font-semibold">85.2%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Last updated: 2 minutes ago • Next update: 15 minutes
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <FaDownload className="mr-1" />
              Export
            </Button>
            <Button variant="outline" size="sm">
              <FaFilter className="mr-1" />
              Configure
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
} 