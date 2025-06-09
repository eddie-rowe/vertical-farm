"use client"

import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FaBrain, FaLeaf, FaBuilding, FaExclamationTriangle, FaChartLine, FaMapMarkedAlt } from 'react-icons/fa'
import CropEnvironmentView from '@/components/ai-intelligence/CropEnvironmentView'
import OperationalBusinessView from '@/components/ai-intelligence/OperationalBusinessView'
import RiskIncidentView from '@/components/ai-intelligence/RiskIncidentView'
import DashboardsForecastingView from '@/components/ai-intelligence/DashboardsForecastingView'
import HeatmapsView from '@/components/ai-intelligence/HeatmapsView'

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

export default function AIPage() {
  const [activeTab, setActiveTab] = useState('crop-environment')

  const activeTabData = tabs.find(tab => tab.id === activeTab)
  const ActiveComponent = activeTabData?.component

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <FaBrain className="text-3xl text-purple-600" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            AI Intelligence Center
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Advanced AI-powered insights and analytics for optimal vertical farm operations
        </p>
      </div>

      {/* AI Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <FaLeaf className="text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">94%</p>
              <p className="text-sm text-gray-600">Crop Health Score</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FaBuilding className="text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">87%</p>
              <p className="text-sm text-gray-600">Operational Efficiency</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <FaExclamationTriangle className="text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">2</p>
              <p className="text-sm text-gray-600">Active Alerts</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <FaChartLine className="text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">+12%</p>
              <p className="text-sm text-gray-600">Predicted Growth</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tab Navigation */}
      <Card className="mb-6">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-green-500 text-green-600 dark:text-green-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </Card>

      {/* Tab Content */}
      <div className="min-h-[600px]">
        {ActiveComponent && <ActiveComponent />}
      </div>
    </div>
  )
} 