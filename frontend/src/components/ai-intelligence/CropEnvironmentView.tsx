"use client"

import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { FaLeaf, FaThermometerHalf, FaTint, FaLightbulb, FaChartLine, FaRobot, FaSearch, FaFilter, FaDownload, FaEye } from 'react-icons/fa'

interface CropMetrics {
  id: string
  cropType: string
  location: string
  healthScore: number
  growthStage: string
  expectedHarvest: string
  currentConditions: {
    temperature: number
    humidity: number
    lightLevel: number
    ph: number
  }
  aiRecommendations: string[]
  anomalies: string[]
}

const mockCropData: CropMetrics[] = [
  {
    id: '1',
    cropType: 'Lettuce (Buttercrunch)',
    location: 'Rack A-1, Shelf 3',
    healthScore: 96,
    growthStage: 'Mature',
    expectedHarvest: '2025-01-22',
    currentConditions: {
      temperature: 18.5,
      humidity: 65,
      lightLevel: 240,
      ph: 6.2
    },
    aiRecommendations: [
      'Reduce lighting by 10% to prevent tip burn',
      'Harvest within 48 hours for optimal quality',
      'Monitor calcium levels'
    ],
    anomalies: []
  },
  {
    id: '2',
    cropType: 'Spinach (Baby Leaf)',
    location: 'Rack B-2, Shelf 1',
    healthScore: 88,
    growthStage: 'Vegetative',
    expectedHarvest: '2025-01-28',
    currentConditions: {
      temperature: 16.8,
      humidity: 70,
      lightLevel: 180,
      ph: 6.4
    },
    aiRecommendations: [
      'Increase nutrient concentration by 15%',
      'Extend photoperiod to 16 hours',
      'Check for aphid presence'
    ],
    anomalies: ['Slower than expected growth rate']
  },
  {
    id: '3',
    cropType: 'Basil (Genovese)',
    location: 'Rack C-1, Shelf 2',
    healthScore: 92,
    growthStage: 'Flowering',
    expectedHarvest: '2025-01-25',
    currentConditions: {
      temperature: 22.1,
      humidity: 55,
      lightLevel: 280,
      ph: 6.0
    },
    aiRecommendations: [
      'Pinch flower buds to maintain leaf quality',
      'Reduce humidity to prevent powdery mildew',
      'Harvest upper leaves regularly'
    ],
    anomalies: []
  }
]

interface EnvironmentTrend {
  time: string
  temperature: number
  humidity: number
  lightLevel: number
  co2: number
}

const mockEnvironmentTrends: EnvironmentTrend[] = [
  { time: '00:00', temperature: 18.2, humidity: 68, lightLevel: 0, co2: 420 },
  { time: '06:00', temperature: 18.5, humidity: 65, lightLevel: 150, co2: 450 },
  { time: '12:00', temperature: 19.8, humidity: 62, lightLevel: 280, co2: 480 },
  { time: '18:00', temperature: 19.2, humidity: 64, lightLevel: 200, co2: 460 },
  { time: '24:00', temperature: 18.1, humidity: 67, lightLevel: 0, co2: 430 }
]

export default function CropEnvironmentView() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCrop, setSelectedCrop] = useState<CropMetrics | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const filteredCrops = mockCropData.filter(crop =>
    crop.cropType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    crop.location.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getHealthColor = (score: number) => {
    if (score >= 95) return 'text-green-600 bg-green-100'
    if (score >= 85) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  return (
    <div className="space-y-6">
      {/* AI Insights Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <FaRobot className="text-2xl text-purple-600" />
            <div>
              <p className="text-lg font-semibold">AI Analysis</p>
              <p className="text-sm text-gray-600">Real-time crop monitoring</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <FaLeaf className="text-2xl text-green-600" />
            <div>
              <p className="text-2xl font-bold">94.2%</p>
              <p className="text-sm text-gray-600">Avg Health Score</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <FaChartLine className="text-2xl text-blue-600" />
            <div>
              <p className="text-2xl font-bold">+8.5%</p>
              <p className="text-sm text-gray-600">Growth Rate</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <FaThermometerHalf className="text-2xl text-orange-600" />
            <div>
              <p className="text-2xl font-bold">18.9°C</p>
              <p className="text-sm text-gray-600">Optimal Temp</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search and Controls */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex flex-1 gap-2">
            <div className="relative flex-1 max-w-md">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search crops or locations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="icon">
              <FaFilter />
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <FaDownload className="mr-2" />
              Export
            </Button>
          </div>
        </div>
      </Card>

      {/* Crop Monitoring Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredCrops.map((crop) => (
          <Card key={crop.id} className="p-6">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{crop.cropType}</h3>
                  <p className="text-sm text-gray-600">{crop.location}</p>
                </div>
                <Badge className={`${getHealthColor(crop.healthScore)} px-2 py-1`}>
                  {crop.healthScore}%
                </Badge>
              </div>

              {/* Environmental Conditions */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <FaThermometerHalf className="text-orange-500" />
                  <div>
                    <p className="text-sm font-medium">{crop.currentConditions.temperature}°C</p>
                    <p className="text-xs text-gray-600">Temperature</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <FaTint className="text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">{crop.currentConditions.humidity}%</p>
                    <p className="text-xs text-gray-600">Humidity</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <FaLightbulb className="text-yellow-500" />
                  <div>
                    <p className="text-sm font-medium">{crop.currentConditions.lightLevel} µmol</p>
                    <p className="text-xs text-gray-600">Light Level</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium">pH {crop.currentConditions.ph}</p>
                    <p className="text-xs text-gray-600">Nutrient pH</p>
                  </div>
                </div>
              </div>

              {/* Growth Info */}
              <div className="border-t pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Growth Stage:</span>
                  <span className="font-medium">{crop.growthStage}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-600">Expected Harvest:</span>
                  <span className="font-medium">{crop.expectedHarvest}</span>
                </div>
              </div>

              {/* AI Recommendations */}
              {crop.aiRecommendations.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-purple-700 mb-2 flex items-center gap-1">
                    <FaRobot />
                    AI Recommendations
                  </h4>
                  <ul className="space-y-1">
                    {crop.aiRecommendations.slice(0, 2).map((rec, index) => (
                      <li key={index} className="text-xs text-gray-600 flex items-start gap-1">
                        <span className="text-purple-500 mt-1">•</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Anomalies */}
              {crop.anomalies.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-red-700 mb-2">Detected Anomalies</h4>
                  {crop.anomalies.map((anomaly, index) => (
                    <Badge key={index} variant="destructive" className="text-xs mr-1">
                      {anomaly}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="border-t pt-4 flex gap-2">
                <Button size="sm" variant="outline" className="flex-1">
                  <FaEye className="mr-1" />
                  View Details
                </Button>
                <Button size="sm" variant="outline">
                  <FaChartLine />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Environment Trends Chart */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Environmental Trends (24h)</h3>
        <div className="space-y-4">
          {/* Temperature Trend */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium flex items-center gap-2">
                <FaThermometerHalf className="text-orange-500" />
                Temperature
              </span>
              <span className="text-sm text-gray-600">18.9°C avg</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-400 via-green-400 to-orange-400 w-3/4"></div>
            </div>
          </div>

          {/* Humidity Trend */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium flex items-center gap-2">
                <FaTint className="text-blue-500" />
                Humidity
              </span>
              <span className="text-sm text-gray-600">64% avg</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-yellow-400 via-blue-400 to-blue-600 w-2/3"></div>
            </div>
          </div>

          {/* Light Level Trend */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium flex items-center gap-2">
                <FaLightbulb className="text-yellow-500" />
                Light Level
              </span>
              <span className="text-sm text-gray-600">178 µmol avg</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-gray-400 via-yellow-400 to-gray-400 w-5/6"></div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
} 