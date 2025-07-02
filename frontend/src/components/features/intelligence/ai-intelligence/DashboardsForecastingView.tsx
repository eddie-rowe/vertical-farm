'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FaArrowRight, FaEye, FaDownload, FaFilter } from 'react-icons/fa';

export default function DashboardsForecastingView() {
  const [selectedTimeframe, setSelectedTimeframe] = useState('7d');

  // Mock data for demonstration
  const forecastData = [
    {
      id: 1,
      metric: 'Yield Prediction',
      currentValue: 2.4,
      predictedValue: 2.8,
      unit: 'kg/m²',
      confidence: 87,
      trend: 'increasing',
      period: '7 days',
      factors: ['Temperature optimization', 'Nutrient adjustment']
    },
    {
      id: 2,
      metric: 'Growth Rate',
      currentValue: 15.2,
      predictedValue: 18.5,
      unit: 'cm/week',
      confidence: 92,
      trend: 'increasing',
      period: '14 days',
      factors: ['Light cycle adjustment', 'CO2 enhancement']
    },
    {
      id: 3,
      metric: 'Resource Usage',
      currentValue: 45.8,
      predictedValue: 42.1,
      unit: 'L/day',
      confidence: 78,
      trend: 'decreasing',
      period: '30 days',
      factors: ['Efficiency improvements', 'System optimization']
    }
  ];

  const insights = [
    {
      id: 1,
      title: 'Optimal Harvest Window',
      description: 'Based on growth patterns, harvest window opens in 12-14 days',
      priority: 'high',
      confidence: 94,
      recommendations: [
        'Monitor trichome development',
        'Adjust lighting schedule',
        'Reduce nutrient concentration'
      ]
    },
    {
      id: 2,
      title: 'Resource Optimization',
      description: 'Water usage can be reduced by 8% without affecting yield',
      priority: 'medium',
      confidence: 82,
      recommendations: [
        'Implement smart irrigation',
        'Monitor soil moisture',
        'Adjust watering schedule'
      ]
    }
  ];

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return '↗️';
      case 'decreasing': return '↘️';
      case 'stable': return '➡️';
      default: return '➡️';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-600';
    if (confidence >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            AI Forecasting Dashboard
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Predictive analytics and intelligent insights for your farming operations
          </p>
        </div>
        <div className="flex gap-2">
          {['24h', '7d', '30d', '90d'].map((timeframe) => (
            <button
              key={timeframe}
              onClick={() => setSelectedTimeframe(timeframe)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                selectedTimeframe === timeframe
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              {timeframe}
            </button>
          ))}
        </div>
      </div>

      {/* Forecast Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {forecastData.map((forecast) => (
          <Card key={forecast.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                  {forecast.metric}
                </CardTitle>
                <div className="text-2xl">{getTrendIcon(forecast.trend)}</div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Current vs Predicted */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Current</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {forecast.currentValue} {forecast.unit}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Predicted</span>
                  <span className="font-bold text-blue-600">
                    {forecast.predictedValue} {forecast.unit}
                  </span>
                </div>
              </div>

              {/* Confidence */}
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Confidence</span>
                <span className={`font-medium ${getConfidenceColor(forecast.confidence)}`}>
                  {forecast.confidence}%
                </span>
              </div>

              {/* Factors */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Key Factors
                </h4>
                <div className="space-y-1">
                  {forecast.factors.map((factor, index) => (
                    <div key={index} className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                      <span className="w-1 h-1 bg-blue-500 rounded-full"></span>
                      {factor}
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800">
                  <FaEye />
                  View Details
                </button>
                <button className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-800">
                  <FaDownload />
                  Export
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* AI Insights */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            AI-Generated Insights
          </h3>
          <button className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800">
            <FaFilter />
            Filter Insights
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {insights.map((insight) => (
            <Card key={insight.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-semibold text-lg text-gray-900 dark:text-white">
                      {insight.title}
                    </h4>
                    <Badge className={getPriorityColor(insight.priority)}>
                      {insight.priority} priority
                    </Badge>
                  </div>
                  <span className={`text-sm font-medium ${getConfidenceColor(insight.confidence)}`}>
                    {insight.confidence}% confident
                  </span>
                </div>

                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {insight.description}
                </p>

                <div>
                  <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Recommendations
                  </h5>
                  <ul className="space-y-1">
                    {insight.recommendations.map((rec, index) => (
                      <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                        <FaArrowRight className="text-xs text-blue-500" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
            Forecasting Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">94.2%</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Average Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">87.5%</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Prediction Confidence</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">156</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Insights Generated</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 