"use client"

import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { FaMapMarkedAlt, FaThermometerHalf, FaTint, FaBolt, FaLeaf, FaUsers, FaDollarSign, FaBoxes, FaFilter, FaSearch, FaDownload, FaEye, FaCog, FaChartLine, FaRobot } from 'react-icons/fa'

interface HeatmapData {
  id: string
  x: number
  y: number
  value: number
  label: string
  details: string
}

interface Zone {
  id: string
  name: string
  type: 'greenhouse' | 'growth_tower' | 'processing' | 'storage'
  metrics: {
    productivity: number
    efficiency: number
    quality: number
    utilization: number
  }
  environmental: {
    temperature: number
    humidity: number
    co2: number
    lightLevel: number
  }
  business: {
    revenue: number
    costs: number
    profit: number
    roi: number
  }
}

const mockZones: Zone[] = [
  {
    id: 'gh-a',
    name: 'Greenhouse A',
    type: 'greenhouse',
    metrics: { productivity: 94, efficiency: 92, quality: 96, utilization: 89 },
    environmental: { temperature: 22.5, humidity: 65, co2: 1200, lightLevel: 850 },
    business: { revenue: 12500, costs: 8200, profit: 4300, roi: 34.4 }
  },
  {
    id: 'gh-b',
    name: 'Greenhouse B',
    type: 'greenhouse',
    metrics: { productivity: 88, efficiency: 85, quality: 91, utilization: 92 },
    environmental: { temperature: 23.1, humidity: 68, co2: 1150, lightLevel: 820 },
    business: { revenue: 11200, costs: 7800, profit: 3400, roi: 30.4 }
  },
  {
    id: 'tower-1',
    name: 'Growth Tower 1',
    type: 'growth_tower',
    metrics: { productivity: 96, efficiency: 94, quality: 98, utilization: 95 },
    environmental: { temperature: 21.8, humidity: 62, co2: 1300, lightLevel: 900 },
    business: { revenue: 15200, costs: 9500, profit: 5700, roi: 37.5 }
  },
  {
    id: 'tower-2',
    name: 'Growth Tower 2',
    type: 'growth_tower',
    metrics: { productivity: 91, efficiency: 89, quality: 94, utilization: 88 },
    environmental: { temperature: 22.2, humidity: 64, co2: 1250, lightLevel: 875 },
    business: { revenue: 13800, costs: 8900, profit: 4900, roi: 35.5 }
  },
  {
    id: 'proc-1',
    name: 'Processing Area',
    type: 'processing',
    metrics: { productivity: 87, efficiency: 91, quality: 89, utilization: 84 },
    environmental: { temperature: 18.5, humidity: 55, co2: 400, lightLevel: 650 },
    business: { revenue: 8500, costs: 6200, profit: 2300, roi: 27.1 }
  },
  {
    id: 'storage-1',
    name: 'Cold Storage',
    type: 'storage',
    metrics: { productivity: 85, efficiency: 88, quality: 95, utilization: 78 },
    environmental: { temperature: 4.2, humidity: 85, co2: 350, lightLevel: 200 },
    business: { revenue: 5200, costs: 4100, profit: 1100, roi: 21.2 }
  }
]

const generateHeatmapData = (zones: Zone[], metric: string): HeatmapData[] => {
  return zones.map((zone, index) => {
    let value = 0
    switch (metric) {
      case 'productivity':
        value = zone.metrics.productivity
        break
      case 'efficiency':
        value = zone.metrics.efficiency
        break
      case 'temperature':
        value = zone.environmental.temperature
        break
      case 'revenue':
        value = zone.business.revenue / 1000 // Convert to thousands
        break
      case 'roi':
        value = zone.business.roi
        break
      default:
        value = Math.random() * 100
    }

    return {
      id: zone.id,
      x: (index % 3) * 200 + 50,
      y: Math.floor(index / 3) * 150 + 50,
      value,
      label: zone.name,
      details: `${metric}: ${value.toFixed(1)}`
    }
  })
}

export default function HeatmapsView() {
  const [selectedHeatmap, setSelectedHeatmap] = useState('productivity')
  const [selectedTimeframe, setSelectedTimeframe] = useState('24h')
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null)

  const heatmapOptions = [
    { id: 'productivity', label: 'Productivity', category: 'operations', icon: <FaChartLine /> },
    { id: 'efficiency', label: 'Efficiency', category: 'operations', icon: <FaBolt /> },
    { id: 'quality', label: 'Quality Score', category: 'operations', icon: <FaLeaf /> },
    { id: 'temperature', label: 'Temperature', category: 'environmental', icon: <FaThermometerHalf /> },
    { id: 'humidity', label: 'Humidity', category: 'environmental', icon: <FaTint /> },
    { id: 'revenue', label: 'Revenue (K)', category: 'business', icon: <FaDollarSign /> },
    { id: 'roi', label: 'ROI %', category: 'business', icon: <FaBoxes /> },
    { id: 'utilization', label: 'Utilization', category: 'operations', icon: <FaUsers /> }
  ]

  const currentHeatmapData = generateHeatmapData(mockZones, selectedHeatmap)

  const getHeatmapColor = (value: number, metric: string) => {
    let intensity = 0
    switch (metric) {
      case 'temperature':
        intensity = value > 25 ? 0.8 : value > 20 ? 0.6 : value > 15 ? 0.4 : 0.2
        return `rgba(255, 87, 34, ${intensity})`
      case 'humidity':
        intensity = value > 70 ? 0.8 : value > 60 ? 0.6 : value > 50 ? 0.4 : 0.2
        return `rgba(33, 150, 243, ${intensity})`
      case 'revenue':
        intensity = value > 12 ? 0.8 : value > 10 ? 0.6 : value > 8 ? 0.4 : 0.2
        return `rgba(76, 175, 80, ${intensity})`
      default:
        intensity = value > 90 ? 0.8 : value > 75 ? 0.6 : value > 60 ? 0.4 : 0.2
        return `rgba(156, 39, 176, ${intensity})`
    }
  }

  const getCurrentOption = () => heatmapOptions.find(opt => opt.id === selectedHeatmap)

  return (
    <div className="space-y-6">
      {/* Heatmap Controls */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FaMapMarkedAlt className="text-blue-600" />
            Operations Heatmaps
          </h3>
          
          <div className="flex gap-2">
            <div className="flex gap-1">
              {['24h', '7d', '30d'].map((period) => (
                <Button
                  key={period}
                  variant={selectedTimeframe === period ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedTimeframe(period)}
                >
                  {period}
                </Button>
              ))}
            </div>
            <Button variant="outline" size="sm">
              <FaDownload className="mr-1" />
              Export
            </Button>
            <Button variant="outline" size="sm">
              <FaCog className="mr-1" />
              Configure
            </Button>
          </div>
        </div>

        {/* Heatmap Type Selection */}
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Operations Heatmaps</h4>
            <div className="flex gap-2 flex-wrap">
              {heatmapOptions.filter(opt => opt.category === 'operations').map((option) => (
                <Button
                  key={option.id}
                  variant={selectedHeatmap === option.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedHeatmap(option.id)}
                  className="flex items-center gap-1"
                >
                  {option.icon}
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">Environmental Heatmaps</h4>
            <div className="flex gap-2 flex-wrap">
              {heatmapOptions.filter(opt => opt.category === 'environmental').map((option) => (
                <Button
                  key={option.id}
                  variant={selectedHeatmap === option.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedHeatmap(option.id)}
                  className="flex items-center gap-1"
                >
                  {option.icon}
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">Business Heatmaps</h4>
            <div className="flex gap-2 flex-wrap">
              {heatmapOptions.filter(opt => opt.category === 'business').map((option) => (
                <Button
                  key={option.id}
                  variant={selectedHeatmap === option.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedHeatmap(option.id)}
                  className="flex items-center gap-1"
                >
                  {option.icon}
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Main Heatmap Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                {getCurrentOption()?.icon}
                {getCurrentOption()?.label} Heatmap
              </h3>
              <Badge variant="outline">
                {selectedTimeframe} view
              </Badge>
            </div>

            {/* Heatmap Visualization */}
            <div className="relative bg-gray-100 dark:bg-gray-800 rounded-lg p-4 min-h-[400px]">
              <svg width="100%" height="400" viewBox="0 0 600 400">
                {/* Grid Background */}
                <defs>
                  <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                    <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#e0e0e0" strokeWidth="1"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />

                {/* Heatmap Data Points */}
                {currentHeatmapData.map((point) => (
                  <g key={point.id}>
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r="30"
                      fill={getHeatmapColor(point.value, selectedHeatmap)}
                      stroke="#fff"
                      strokeWidth="2"
                      className="cursor-pointer transition-all hover:r-35"
                      onClick={() => setSelectedZone(mockZones.find(z => z.id === point.id) || null)}
                    />
                    <text
                      x={point.x}
                      y={point.y - 35}
                      textAnchor="middle"
                      className="text-xs font-medium"
                      fill="currentColor"
                    >
                      {point.label}
                    </text>
                    <text
                      x={point.x}
                      y={point.y + 5}
                      textAnchor="middle"
                      className="text-xs font-bold"
                      fill="white"
                    >
                      {point.value.toFixed(1)}
                    </text>
                  </g>
                ))}

                {/* Legend */}
                <g transform="translate(450, 300)">
                  <text x="0" y="0" className="text-xs font-medium" fill="currentColor">
                    {getCurrentOption()?.label} Scale
                  </text>
                  {[0.2, 0.4, 0.6, 0.8].map((intensity, index) => (
                    <g key={index} transform={`translate(0, ${(index + 1) * 20})`}>
                      <circle
                        cx="10"
                        cy="0"
                        r="8"
                        fill={getHeatmapColor(25 + index * 25, selectedHeatmap)}
                      />
                      <text x="25" y="4" className="text-xs" fill="currentColor">
                        {25 + index * 25}
                      </text>
                    </g>
                  ))}
                </g>
              </svg>
            </div>

            {/* AI Insights */}
            <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <FaRobot className="text-blue-600" />
                AI-Generated Insights
              </h4>
              <div className="space-y-2 text-sm">
                <p className="text-blue-800 dark:text-blue-200">
                  • Growth Tower 1 shows 15% higher {selectedHeatmap} compared to average
                </p>
                <p className="text-blue-800 dark:text-blue-200">
                  • Greenhouse B could benefit from optimization to match Tower performance
                </p>
                <p className="text-blue-800 dark:text-blue-200">
                  • {getCurrentOption()?.label} patterns suggest potential for 8% overall improvement
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Zone Details Panel */}
        <div>
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Zone Details</h3>
            
            {selectedZone ? (
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-lg">{selectedZone.name}</h4>
                  <Badge 
                    className={`mt-1 ${
                      selectedZone.type === 'greenhouse' ? 'bg-green-100 text-green-800' :
                      selectedZone.type === 'growth_tower' ? 'bg-blue-100 text-blue-800' :
                      selectedZone.type === 'processing' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {selectedZone.type.replace('_', ' ')}
                  </Badge>
                </div>

                <div>
                  <h5 className="font-medium mb-2">Operational Metrics</h5>
                  <div className="space-y-2">
                    {Object.entries(selectedZone.metrics).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-center">
                        <span className="text-sm capitalize">{key}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="h-2 bg-blue-500 rounded-full"
                              style={{ width: `${value}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium w-10">{value}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h5 className="font-medium mb-2">Environmental Data</h5>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Temperature</span>
                      <span className="font-medium">{selectedZone.environmental.temperature}°C</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Humidity</span>
                      <span className="font-medium">{selectedZone.environmental.humidity}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>CO₂ Level</span>
                      <span className="font-medium">{selectedZone.environmental.co2} ppm</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Light Level</span>
                      <span className="font-medium">{selectedZone.environmental.lightLevel} μmol</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h5 className="font-medium mb-2">Business Performance</h5>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Revenue</span>
                      <span className="font-medium">${selectedZone.business.revenue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Costs</span>
                      <span className="font-medium">${selectedZone.business.costs.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Profit</span>
                      <span className="font-medium text-green-600">${selectedZone.business.profit.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>ROI</span>
                      <span className="font-medium">{selectedZone.business.roi}%</span>
                    </div>
                  </div>
                </div>

                <Button className="w-full" size="sm">
                  <FaEye className="mr-1" />
                  View Detailed Analytics
                </Button>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <FaMapMarkedAlt className="mx-auto mb-2 text-2xl" />
                <p>Click on a zone in the heatmap to view detailed information</p>
              </div>
            )}
          </Card>

          {/* Quick Stats */}
          <Card className="p-6 mt-4">
            <h3 className="text-lg font-semibold mb-4">Overall Statistics</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Avg {getCurrentOption()?.label}</span>
                <span className="font-bold">
                  {(currentHeatmapData.reduce((sum, point) => sum + point.value, 0) / currentHeatmapData.length).toFixed(1)}
                  {selectedHeatmap === 'revenue' ? 'K' : selectedHeatmap === 'temperature' ? '°C' : selectedHeatmap.includes('roi') || selectedHeatmap.includes('humidity') ? '%' : ''}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm">Best Performing</span>
                <span className="font-bold text-green-600">
                  {currentHeatmapData.reduce((best, current) => 
                    current.value > best.value ? current : best
                  ).label}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm">Improvement Potential</span>
                <span className="font-bold text-blue-600">
                  {(Math.max(...currentHeatmapData.map(p => p.value)) - 
                    Math.min(...currentHeatmapData.map(p => p.value))).toFixed(1)}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Comparison View */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FaChartLine className="text-purple-600" />
          Zone Performance Comparison
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Zone</th>
                <th className="text-left p-2">Type</th>
                <th className="text-center p-2">Productivity</th>
                <th className="text-center p-2">Efficiency</th>
                <th className="text-center p-2">Quality</th>
                <th className="text-center p-2">Revenue</th>
                <th className="text-center p-2">ROI</th>
              </tr>
            </thead>
            <tbody>
              {mockZones.map((zone) => (
                <tr key={zone.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="p-2 font-medium">{zone.name}</td>
                  <td className="p-2">
                    <Badge variant="outline" className="text-xs">
                      {zone.type.replace('_', ' ')}
                    </Badge>
                  </td>
                  <td className="p-2 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <div className="w-8 bg-gray-200 rounded-full h-1">
                        <div 
                          className="h-1 bg-blue-500 rounded-full"
                          style={{ width: `${zone.metrics.productivity}%` }}
                        />
                      </div>
                      <span className="text-xs">{zone.metrics.productivity}%</span>
                    </div>
                  </td>
                  <td className="p-2 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <div className="w-8 bg-gray-200 rounded-full h-1">
                        <div 
                          className="h-1 bg-green-500 rounded-full"
                          style={{ width: `${zone.metrics.efficiency}%` }}
                        />
                      </div>
                      <span className="text-xs">{zone.metrics.efficiency}%</span>
                    </div>
                  </td>
                  <td className="p-2 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <div className="w-8 bg-gray-200 rounded-full h-1">
                        <div 
                          className="h-1 bg-purple-500 rounded-full"
                          style={{ width: `${zone.metrics.quality}%` }}
                        />
                      </div>
                      <span className="text-xs">{zone.metrics.quality}%</span>
                    </div>
                  </td>
                  <td className="p-2 text-center font-medium">
                    ${zone.business.revenue.toLocaleString()}
                  </td>
                  <td className="p-2 text-center font-medium">
                    {zone.business.roi}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
} 