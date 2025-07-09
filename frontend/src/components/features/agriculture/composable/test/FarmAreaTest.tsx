"use client"

import React, { useState } from 'react'
import { FarmAreaRenderer, createFarmAreaConfig } from '../FarmAreaRenderer'
import { Row, AreaType } from '@/types/farm'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

// Mock data for testing
const mockGrowingAreaRows: Row[] = [
  {
    id: 'row_1',
    name: 'Row A1',
    farm_id: 'farm_1',
    orientation: 'horizontal',
    area_type: 'grow_area',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    racks: [
      {
        id: 'rack_1',
        name: 'Rack A1-1',
        row_id: 'row_1',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        shelves: [
          {
            id: 'shelf_1',
            name: 'Shelf A1-1-1',
            rack_id: 'rack_1',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            devices: [
                            {
                id: 'led_1',
                name: 'LED Light',
                sensor_type: 'light_intensity',
                parent_type: 'shelf',
                parent_id: 'shelf_1',
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-01T00:00:00Z'
              }
            ]
          },
          {
            id: 'shelf_2',
            name: 'Shelf A1-1-2',
            rack_id: 'rack_1',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            devices: [
              { 
                id: 'sensor_1', 
                name: 'Temperature Sensor', 
                sensor_type: 'temperature', 
                parent_type: 'shelf', 
                parent_id: 'shelf_2',
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-01T00:00:00Z'
              }
            ]
          }
        ]
      },
      {
        id: 'rack_2',
        name: 'Rack A1-2',
        row_id: 'row_1',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        shelves: [
          {
            id: 'shelf_3',
            name: 'Shelf A1-2-1',
            rack_id: 'rack_2',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            devices: []
          }
        ]
      }
    ]
  },
  {
    id: 'row_2',
    name: 'Row A2',
    farm_id: 'farm_1',
    orientation: 'horizontal',
    area_type: 'grow_area',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    racks: [
      {
        id: 'rack_3',
        name: 'Rack A2-1',
        row_id: 'row_2',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        shelves: [
          {
            id: 'shelf_4',
            name: 'Shelf A2-1-1',
            rack_id: 'rack_3',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            devices: [
                            {
                id: 'pump_1',
                name: 'Water Pump',
                sensor_type: 'water_level',
                parent_type: 'shelf',
                parent_id: 'shelf_4',
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-01T00:00:00Z'
              }
            ]
          }
        ]
      }
    ]
  }
]

const mockGerminationRows: Row[] = [
  {
    id: 'tent_1',
    name: 'Germination Tent 1',
    farm_id: 'farm_1',
    orientation: 'horizontal',
    area_type: 'germination_tent',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    racks: [
      {
        id: 'grack_1',
        name: 'Germination Rack 1',
        row_id: 'tent_1',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        shelves: [
          {
            id: 'gshelf_1',
            name: 'Seed Tray 1',
            rack_id: 'grack_1',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            germination_data: {
              seed_type: 'lettuce',
              planting_date: new Date().toISOString(),
              expected_germination_days: 7,
              germination_rate: 85
            },
            devices: [
              { 
                id: 'heat_mat_1', 
                name: 'Heat Mat', 
                sensor_type: 'temperature', 
                parent_type: 'shelf', 
                parent_id: 'gshelf_1',
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-01T00:00:00Z'
              }
            ]
          }
        ]
      }
    ]
  }
]

interface FarmAreaTestProps {
  areaType: AreaType
  preset?: string
}

export function FarmAreaTest({ areaType, preset = 'standard' }: FarmAreaTestProps) {
  const [selectedPreset, setSelectedPreset] = useState(preset)
  const configuration = createFarmAreaConfig(areaType, selectedPreset)
  const rows = areaType === 'grow_area' ? mockGrowingAreaRows : mockGerminationRows
  
  const handleRowSelect = (row: Row | null) => {
    console.log('Row selected:', row)
  }
  
  const handleRackSelect = (rack: any | null) => {
    console.log('Rack selected:', rack)
  }
  
  const handleShelfSelect = (shelf: any | null) => {
    console.log('Shelf selected:', shelf)
  }
  
  const handleDoubleClick = (element: any, type: 'row' | 'rack' | 'shelf') => {
    console.log('Double click:', type, element)
  }
  
  const presets = areaType === 'grow_area' 
    ? ['standard', 'simple', 'commercial', 'research']
    : ['standard', 'compact', 'research', 'production', 'hobby']
  
  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Badge variant="outline">
              {areaType === 'grow_area' ? 'Growing Area' : 'Germination Tent'}
            </Badge>
            Farm Area Renderer Test
          </CardTitle>
          <CardDescription>
            Testing the configurable farm area architecture with {configuration.name}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Preset Selection */}
          <div className="flex gap-2">
            <span className="text-sm font-medium">Presets:</span>
            {presets.map((p) => (
              <Button
                key={p}
                variant={selectedPreset === p ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPreset(p)}
              >
                {p}
              </Button>
            ))}
          </div>
          
          {/* Configuration Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Configuration:</span>
              <p className="text-muted-foreground">{configuration.description}</p>
            </div>
            <div>
              <span className="font-medium">Features:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {configuration.interactions.enableDoubleClick && (
                  <Badge variant="secondary" className="text-xs">Double Click</Badge>
                )}
                {configuration.interactions.enableContextMenu && (
                  <Badge variant="secondary" className="text-xs">Context Menu</Badge>
                )}
                {configuration.interactions.enableDragDrop && (
                  <Badge variant="secondary" className="text-xs">Drag & Drop</Badge>
                )}
                {configuration.interactions.enableKeyboardNav && (
                  <Badge variant="secondary" className="text-xs">Keyboard Nav</Badge>
                )}
              </div>
            </div>
            <div>
              <span className="font-medium">Overlays:</span>
              <p className="text-muted-foreground">{configuration.overlays.length} configured</p>
            </div>
            <div>
              <span className="font-medium">Modals:</span>
              <p className="text-muted-foreground">{configuration.modals.length} available</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Farm Area Renderer */}
      <Card>
        <CardHeader>
          <CardTitle>Interactive Farm Layout</CardTitle>
          <CardDescription>
            Double-click racks/shelves, right-click for context menu, or use keyboard navigation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FarmAreaRenderer
            rows={rows}
            areaType={areaType}
            configuration={configuration}
            onRowSelect={handleRowSelect}
            onRackSelect={handleRackSelect}
            onShelfSelect={handleShelfSelect}
            onDoubleClick={handleDoubleClick}
            className="min-h-[400px]"
          />
        </CardContent>
      </Card>
    </div>
  )
}

// Test page component for both area types
export function FarmAreaTestPage() {
  const [activeAreaType, setActiveAreaType] = useState<AreaType>('grow_area')
  
  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Farm Area Renderer Test</h1>
        <p className="text-muted-foreground mb-4">
          Testing the new configurable farm area architecture with different area types and presets
        </p>
        
        <div className="flex gap-2">
          <Button
            variant={activeAreaType === 'grow_area' ? 'default' : 'outline'}
            onClick={() => setActiveAreaType('grow_area')}
          >
            Growing Areas
          </Button>
          <Button
            variant={activeAreaType === 'germination_tent' ? 'default' : 'outline'}
            onClick={() => setActiveAreaType('germination_tent')}
          >
            Germination Tents
          </Button>
        </div>
      </div>
      
      <FarmAreaTest areaType={activeAreaType} />
    </div>
  )
}

export default FarmAreaTest 