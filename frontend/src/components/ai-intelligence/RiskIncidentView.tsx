"use client"

import React, { useState } from 'react'
import { Card } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Input } from '../ui/input'
import { FaExclamationTriangle, FaClock, FaEye, FaBolt, FaLeaf, FaThermometerHalf, FaTint, FaShieldAlt, FaRobot, FaSearch, FaFilter, FaMapMarkerAlt, FaTools } from 'react-icons/fa'

interface RiskAlert {
  id: string
  type: 'critical' | 'high' | 'medium' | 'low'
  category: 'environmental' | 'equipment' | 'crop' | 'security' | 'operational'
  title: string
  description: string
  location: string
  timestamp: string
  status: 'active' | 'investigating' | 'resolved' | 'dismissed'
  aiConfidence: number
  affectedSystems: string[]
  recommendations: string[]
}

const mockRiskAlerts: RiskAlert[] = [
  {
    id: '1',
    type: 'critical',
    category: 'environmental',
    title: 'Temperature Anomaly Detected',
    description: 'Rack B-2 temperature exceeded safe limits for lettuce cultivation',
    location: 'Rack B-2, Greenhouse Zone A',
    timestamp: '2025-01-21 14:23:45',
    status: 'active',
    aiConfidence: 98,
    affectedSystems: ['HVAC System', 'Rack B-2 Sensors'],
    recommendations: [
      'Immediately reduce heating in Zone A',
      'Check HVAC system functionality',
      'Monitor crop stress indicators'
    ]
  },
  {
    id: '2',
    type: 'high',
    category: 'crop',
    title: 'Pest Detection Alert',
    description: 'Computer vision detected potential aphid presence on basil plants',
    location: 'Rack C-1, Shelf 2-4',
    timestamp: '2025-01-21 13:45:12',
    status: 'investigating',
    aiConfidence: 85,
    affectedSystems: ['Camera System', 'Crop Monitoring'],
    recommendations: [
      'Manual inspection required',
      'Isolate affected plants if confirmed',
      'Prepare organic treatment protocol'
    ]
  },
  {
    id: '3',
    type: 'medium',
    category: 'equipment',
    title: 'Pump Performance Degradation',
    description: 'Nutrient pump #3 showing signs of decreased efficiency',
    location: 'Pump Station 1',
    timestamp: '2025-01-21 12:15:30',
    status: 'active',
    aiConfidence: 92,
    affectedSystems: ['Nutrient Delivery', 'Pump #3'],
    recommendations: [
      'Schedule maintenance within 48 hours',
      'Monitor nutrient delivery rates',
      'Prepare backup pump activation'
    ]
  },
  {
    id: '4',
    type: 'high',
    category: 'security',
    title: 'Unauthorized Access Attempt',
    description: 'Multiple failed login attempts detected from external IP',
    location: 'System Access Logs',
    timestamp: '2025-01-21 11:30:22',
    status: 'resolved',
    aiConfidence: 100,
    affectedSystems: ['Security System', 'User Authentication'],
    recommendations: [
      'IP has been blocked automatically',
      'Review security protocols',
      'Update firewall rules'
    ]
  }
]

interface PredictiveRisk {
  id: string
  riskType: string
  probability: number
  impact: 'low' | 'medium' | 'high' | 'critical'
  timeframe: string
  description: string
  preventiveActions: string[]
  icon: React.ReactNode
}

const mockPredictiveRisks: PredictiveRisk[] = [
  {
    id: '1',
    riskType: 'Equipment Failure',
    probability: 78,
    impact: 'high',
    timeframe: '3-5 days',
    description: 'LED lighting system in Rack A may fail based on usage patterns',
    preventiveActions: [
      'Schedule preventive maintenance',
      'Order replacement components',
      'Prepare backup lighting'
    ],
    icon: <FaBolt className="text-yellow-500" />
  },
  {
    id: '2',
    riskType: 'Crop Disease',
    probability: 45,
    impact: 'medium',
    timeframe: '7-10 days',
    description: 'High humidity may lead to fungal issues in spinach crops',
    preventiveActions: [
      'Increase ventilation',
      'Reduce irrigation frequency',
      'Apply preventive fungicide'
    ],
    icon: <FaLeaf className="text-green-500" />
  },
  {
    id: '3',
    riskType: 'Power Outage Impact',
    probability: 23,
    impact: 'critical',
    timeframe: '1-2 weeks',
    description: 'Weather patterns suggest potential power grid instability',
    preventiveActions: [
      'Test backup generator',
      'Ensure fuel reserves',
      'Update emergency protocols'
    ],
    icon: <FaBolt className="text-red-500" />
  }
]

interface SystemHealth {
  system: string
  status: 'healthy' | 'warning' | 'critical'
  uptime: number
  lastCheck: string
  issues: number
  icon: React.ReactNode
}

const mockSystemHealth: SystemHealth[] = [
  {
    system: 'Environmental Control',
    status: 'warning',
    uptime: 99.2,
    lastCheck: '2 min ago',
    issues: 1,
    icon: <FaThermometerHalf className="text-orange-500" />
  },
  {
    system: 'Irrigation System',
    status: 'healthy',
    uptime: 99.8,
    lastCheck: '1 min ago',
    issues: 0,
    icon: <FaTint className="text-blue-500" />
  },
  {
    system: 'Lighting Controls',
    status: 'healthy',
    uptime: 100,
    lastCheck: '30 sec ago',
    issues: 0,
    icon: <FaBolt className="text-yellow-500" />
  },
  {
    system: 'Security System',
    status: 'healthy',
    uptime: 99.9,
    lastCheck: '5 min ago',
    issues: 0,
    icon: <FaShieldAlt className="text-green-500" />
  },
  {
    system: 'Crop Monitoring',
    status: 'warning',
    uptime: 98.5,
    lastCheck: '3 min ago',
    issues: 2,
    icon: <FaLeaf className="text-green-500" />
  }
]

export default function RiskIncidentView() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-red-100 text-red-800'
      case 'investigating': return 'bg-yellow-100 text-yellow-800'
      case 'resolved': return 'bg-green-100 text-green-800'
      case 'dismissed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getSystemStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100'
      case 'warning': return 'text-yellow-600 bg-yellow-100'
      case 'critical': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'critical': return 'text-red-600'
      case 'high': return 'text-orange-600'
      case 'medium': return 'text-yellow-600'
      case 'low': return 'text-green-600'
      default: return 'text-gray-600'
    }
  }

  const filteredAlerts = mockRiskAlerts.filter(alert => {
    const matchesSearch = alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alert.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = selectedStatus === 'all' || alert.status === selectedStatus
    const matchesCategory = selectedCategory === 'all' || alert.category === selectedCategory
    return matchesSearch && matchesStatus && matchesCategory
  })

  return (
    <div className="space-y-6">
      {/* Risk Overview Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <FaExclamationTriangle className="text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">3</p>
              <p className="text-sm text-gray-600">Active Alerts</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <FaShieldAlt className="text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">99.1%</p>
              <p className="text-sm text-gray-600">System Uptime</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <FaRobot className="text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">94%</p>
              <p className="text-sm text-gray-600">AI Accuracy</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FaClock className="text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">2.3min</p>
              <p className="text-sm text-gray-600">Avg Response Time</p>
            </div>
          </div>
        </Card>
      </div>

      {/* System Health Monitoring */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FaShieldAlt className="text-green-600" />
          System Health Monitoring
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {mockSystemHealth.map((system, index) => (
            <div key={index} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {system.icon}
                  <span className="font-medium text-sm">{system.system}</span>
                </div>
                <Badge className={getSystemStatusColor(system.status)}>
                  {system.status}
                </Badge>
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Uptime</span>
                  <span className="font-medium">{system.uptime}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1">
                  <div 
                    className={`h-1 rounded-full ${
                      system.uptime >= 99 ? 'bg-green-500' :
                      system.uptime >= 95 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${system.uptime}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Last check: {system.lastCheck}</span>
                  <span>{system.issues} issues</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Active Alerts */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FaExclamationTriangle className="text-orange-600" />
            Active Risk Alerts
          </h3>
          
          <div className="flex gap-2">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search alerts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Button variant="outline" size="sm">
              <FaFilter className="mr-1" />
              Filter
            </Button>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2 mb-4">
          <div className="flex gap-1">
            {['all', 'active', 'investigating', 'resolved'].map((status) => (
              <Button
                key={status}
                variant={selectedStatus === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedStatus(status)}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Button>
            ))}
          </div>
          <div className="border-l mx-2"></div>
          <div className="flex gap-1">
            {['all', 'environmental', 'equipment', 'crop', 'security'].map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {filteredAlerts.map((alert) => (
            <div key={alert.id} className={`border rounded-lg p-4 ${getAlertColor(alert.type)}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="bg-white">
                      {alert.type.toUpperCase()}
                    </Badge>
                    <Badge className={getStatusColor(alert.status)}>
                      {alert.status}
                    </Badge>
                    <span className="text-sm text-gray-600">
                      AI Confidence: {alert.aiConfidence}%
                    </span>
                  </div>
                  
                  <h4 className="font-semibold text-lg">{alert.title}</h4>
                  <p className="text-gray-700 mb-2">{alert.description}</p>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                    <span className="flex items-center gap-1">
                      <FaMapMarkerAlt />
                      {alert.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <FaClock />
                      {alert.timestamp}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <h5 className="font-medium text-sm mb-1">Affected Systems:</h5>
                      <div className="flex gap-1 flex-wrap">
                        {alert.affectedSystems.map((system, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {system}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h5 className="font-medium text-sm mb-1 flex items-center gap-1">
                        <FaRobot className="text-purple-600" />
                        AI Recommendations:
                      </h5>
                      <ul className="text-sm space-y-1">
                        {alert.recommendations.map((rec, index) => (
                          <li key={index} className="flex items-start gap-1">
                            <span className="text-purple-600 mt-1">•</span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  <Button size="sm" variant="outline">
                    <FaEye />
                  </Button>
                  <Button size="sm" variant="outline">
                    <FaTools />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Predictive Risk Analytics */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <FaRobot className="text-purple-600" />
          Predictive Risk Analytics
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {mockPredictiveRisks.map((risk) => (
            <div key={risk.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                {risk.icon}
                <div>
                  <h4 className="font-semibold">{risk.riskType}</h4>
                  <p className="text-xs text-gray-600">In {risk.timeframe}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Probability</span>
                    <span className="font-medium">{risk.probability}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        risk.probability >= 70 ? 'bg-red-500' :
                        risk.probability >= 40 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${risk.probability}%` }}
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm">Impact Level</span>
                  <Badge className={`${getImpactColor(risk.impact)} bg-white border`}>
                    {risk.impact.toUpperCase()}
                  </Badge>
                </div>

                <p className="text-sm text-gray-700">{risk.description}</p>

                <div>
                  <h5 className="font-medium text-sm mb-2">Preventive Actions:</h5>
                  <ul className="text-xs space-y-1">
                    {risk.preventiveActions.map((action, index) => (
                      <li key={index} className="flex items-start gap-1">
                        <span className="text-blue-600 mt-1">•</span>
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>

                <Button size="sm" className="w-full">
                  Create Prevention Plan
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
} 