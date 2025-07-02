"use client";

import React, { useState, useCallback } from 'react'
import { FarmPageData, Row, Rack, Shelf } from '@/types/farm-layout'
import { Plus, Layers, Archive, Grid3X3, Save, Edit3 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { toast } from 'react-hot-toast'

// Phase 2 Components
import { RippleButton } from '@/components/ui/RippleButton'
import { AdvancedTooltip } from '@/components/ui/AdvancedTooltip'
import { 
  ContextualMenu, 
  getShelfActions, 
  getRackActions, 
  getRowActions 
} from '@/components/ui/ContextualMenu'

// Grow Management Components
import { GrowWizardModal } from '../../grow-workflows';

// Custom hooks
import { useFarmState } from './hooks/useFarmState'
import { useLayer } from '@/contexts/LayerContext'

// Sub-components
import DeviceRenderer from './components/DeviceRenderer'
import ElementDetailModal from '../ElementDetailModal'

// Overlay components

import { AutomationOverlay, GrowsOverlay, MonitoringOverlay } from '@/components/shared/overlays';

interface UnifiedFarmViewProps {
  farmData: FarmPageData | null
  selectedRow: Row | null
  selectedRack: Rack | null
  selectedShelf: Shelf | null
  onRowSelect: (row: Row) => void
  onRackSelect: (rack: Rack) => void
  onShelfSelect: (shelf: Shelf) => void
  onDataRefresh?: () => void
}

type ContextAction = 'add-row' | 'add-rack' | 'add-shelf'

const UnifiedFarmView: React.FC<UnifiedFarmViewProps> = ({
  farmData,
  selectedRow,
  selectedRack,
  selectedShelf,
  onRowSelect,
  onRackSelect,
  onShelfSelect,
  onDataRefresh
}) => {
  // State management
  const { hoveredElements, setHoveredElement, clearHoveredElement } = useFarmState()
  const { layers, isLayerActive } = useLayer()

  // Detail modal state
  const [detailModal, setDetailModal] = useState<{
    isOpen: boolean
    element: Row | Rack | Shelf | null
    elementType: 'row' | 'rack' | 'shelf'
  }>({
    isOpen: false,
    element: null,
    elementType: 'row'
  })

  // Grow wizard modal state
  const [growWizard, setGrowWizard] = useState<{
    isOpen: boolean
    shelfId: string | null
    shelfName: string | null
  }>({
    isOpen: false,
    shelfId: null,
    shelfName: null
  })

  // Detail modal handlers
  const openDetailModal = useCallback((element: Row | Rack | Shelf, elementType: 'row' | 'rack' | 'shelf') => {
    setDetailModal({
      isOpen: true,
      element,
      elementType
    })
  }, [])

  const closeDetailModal = useCallback(() => {
    setDetailModal({
      isOpen: false,
      element: null,
      elementType: 'row'
    })
  }, [])

  // Grow wizard handlers
  const openGrowWizard = useCallback((shelfId: string, shelfName: string) => {
    setGrowWizard({
      isOpen: true,
      shelfId,
      shelfName
    })
  }, [])

  const closeGrowWizard = useCallback(() => {
    setGrowWizard({
      isOpen: false,
      shelfId: null,
      shelfName: null
    })
  }, [])

  const handleGrowSetup = useCallback(async (growData: any) => {
    // TODO: Implement grow creation API call
    console.log('Creating new grow:', growData)
    toast.success(`Started new ${growData.cropType} grow!`)
    
    if (onDataRefresh) {
      onDataRefresh()
    }
  }, [onDataRefresh])

  // Helper function to check if shelf has active grow
  const hasActiveGrow = useCallback((shelfId: string) => {
    // TODO: Implement grow status check
    // For now, return false - this will be connected to actual grow data later
    return false
  }, [])

  // Context action handlers
  const handleContextAction = useCallback(async (action: ContextAction, element?: Row | Rack | Shelf) => {
    if (!farmData?.farm) return

    try {
      switch (action) {
        case 'add-row': {
          const { createRow, generateUniqueRowName } = await import('@/services/rowService')
          const uniqueName = await generateUniqueRowName(farmData.farm.id)
          
          await createRow({
            farm_id: farmData.farm.id,
            name: uniqueName
          })
          toast.success('Row added successfully')
          break
        }
        case 'add-rack':
          if (selectedRow) {
            const { createRack } = await import('@/services/rackService')
            await createRack({
              row_id: selectedRow.id,
              name: `Rack ${(selectedRow.racks?.length || 0) + 1}`
            })
            toast.success('Rack added successfully')
          }
          break
        case 'add-shelf':
          if (selectedRack) {
            const { createShelf } = await import('@/services/shelfService')
            await createShelf({
              rack_id: selectedRack.id,
              name: `Shelf ${(selectedRack.shelves?.length || 0) + 1}`
            })
            toast.success('Shelf added successfully')
          }
          break
      }

      if (onDataRefresh) {
        onDataRefresh()
      }
    } catch (error) {
      console.error('Error performing action:', error)
      toast.error('Failed to perform action')
    }
  }, [farmData?.farm, selectedRow, selectedRack, onDataRefresh])

  // Helper function to determine element type
  const getElementType = (element: Row | Rack | Shelf): 'row' | 'rack' | 'shelf' => {
    if ('racks' in element) return 'row'
    if ('shelves' in element) return 'rack'
    return 'shelf'
  }

  // Enhanced shelf rendering with improved device detection
  const renderShelf = (shelf: Shelf) => {
    const isSelectedByParent = selectedShelf?.id === shelf.id
    const isHovered = hoveredElements.shelf === shelf.id
    const devices = shelf.devices || []
    const deviceCount = devices.length

    // Get active layers to determine what content to show
    const isDeviceLayerActive = isLayerActive('devices')
    const isMonitoringLayerActive = isLayerActive('monitoring')
    const isAutomationLayerActive = isLayerActive('automation')
    const isGrowsLayerActive = isLayerActive('grows')
    const hasAnyActiveLayer = isDeviceLayerActive || isMonitoringLayerActive || isAutomationLayerActive || isGrowsLayerActive

    // Debug info for shelf identification
    console.log(`Rendering shelf: ${shelf.name}, ID: ${shelf.id}, devices:`, devices)

    // Determine what content to show in the shelf body
    const getShelfContent = () => {
      // If no overlay is active, show minimal content (clean base layer)
      if (!hasAnyActiveLayer) {
        return null
      }

      // Device overlay active - show device information
      if (isDeviceLayerActive) {
        if (devices.length > 0) {
          return (
            <div className="space-y-1">
              {devices.slice(0, 3).map((device) => (
                <DeviceRenderer
                  key={device.id}
                  device={device}
                />
              ))}
              {devices.length > 3 && (
                <div className="text-xs text-slate-500 dark:text-slate-400 text-center py-1">
                  +{devices.length - 3} more devices
                </div>
              )}
            </div>
          )
        } else {
          return (
            <div className="text-center py-2 text-slate-400 dark:text-slate-500 text-sm">
              No devices assigned
            </div>
          )
        }
      }

      // Monitoring overlay active - show monitoring info placeholder
      if (isMonitoringLayerActive) {
        return (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-300">Temperature</span>
              <span className="text-green-600 dark:text-green-400">22°C</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-300">Humidity</span>
              <span className="text-blue-600 dark:text-blue-400">65%</span>
            </div>
          </div>
        )
      }

      // Automation overlay active - show automation info placeholder
      if (isAutomationLayerActive) {
        return (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-300">Schedule</span>
              <span className="text-purple-600 dark:text-purple-400">12h cycle</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-300">Next action</span>
              <span className="text-orange-600 dark:text-orange-400">2h 15m</span>
            </div>
          </div>
        )
      }

      // Grows overlay active - show grow info placeholder
      if (isGrowsLayerActive) {
        return (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-300">Crop</span>
              <span className="text-green-600 dark:text-green-400">Lettuce</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-300">Progress</span>
              <span className="text-blue-600 dark:text-blue-400">65%</span>
            </div>
          </div>
        )
      }

      return null
    }

    // Mock data for Phase 2 features
    const generateMockEnvironmentalData = (elementId: string) => {
      const seed = parseInt(elementId) || 1
      const tempVariation = (seed % 3) * 2 - 2
      const humidityVariation = (seed % 4) * 5 - 10
      
      return {
        temperature: {
          current: 22 + tempVariation,
          target: 22,
          unit: 'C' as const,
          status: Math.abs(tempVariation) > 1 ? 'warning' as const : 'optimal' as const
        },
        humidity: {
          current: 65 + humidityVariation,
          target: 65,
          status: Math.abs(humidityVariation) > 5 ? 'warning' as const : 'optimal' as const
        },
        lightLevel: {
          current: seed % 2 === 0 ? 800 : 750,
          target: 800,
          unit: 'lux' as const,
          status: seed % 2 === 0 ? 'optimal' as const : 'warning' as const
        },
        ph: {
          current: 6.5 + (seed % 3) * 0.2 - 0.2,
          target: 6.5,
          status: 'optimal' as const
        }
      }
    }

    const generateMockDeviceStatus = (elementId: string) => {
      const seed = parseInt(elementId) || 1
      return {
        connectivity: (['connected', 'disconnected', 'poor'] as const)[seed % 3],
        lastUpdate: new Date(Date.now() - (seed % 10) * 60000).toISOString(),
        batteryLevel: seed % 4 === 0 ? 15 : 85
      }
    }

    const generateMockAlerts = (elementId: string) => {
      const seed = parseInt(elementId) || 1
      const alerts = []
      
      if (seed % 3 === 0) {
        alerts.push({
          id: `alert-${elementId}-1`,
          message: 'Temperature approaching critical threshold',
          severity: 'medium' as const,
          timestamp: new Date(Date.now() - 30000).toISOString()
        })
      }
      
      if (seed % 5 === 0) {
        alerts.push({
          id: `alert-${elementId}-2`,
          message: 'Sensor calibration required',
          severity: 'low' as const,
          timestamp: new Date(Date.now() - 3600000).toISOString()
        })
      }
      
      return alerts
    }

    // Phase 2 data
    const environmentalData = generateMockEnvironmentalData(shelf.id)
    const deviceStatus = generateMockDeviceStatus(shelf.id)
    const alerts = generateMockAlerts(shelf.id)

    // Context menu actions
    const contextActions = getShelfActions(
      () => console.log('Edit shelf', shelf.id),
      () => openDetailModal(shelf, 'shelf'),
      () => console.log('Add device to shelf', shelf.id),
      () => console.log('Clone shelf', shelf.id),
      () => console.log('Delete shelf', shelf.id),
      () => console.log('Manage devices', shelf.id),
      () => console.log('View metrics', shelf.id),
      // Grow-related handlers
      () => openGrowWizard(shelf.id, shelf.name || `Shelf ${shelf.id}`),
      () => console.log('View grow details', shelf.id),
      () => console.log('Pause grow', shelf.id),
      () => console.log('Resume grow', shelf.id),
      () => console.log('Harvest grow', shelf.id),
      hasActiveGrow(shelf.id)
    )

    return (
      <AdvancedTooltip
        title={shelf.name || `Shelf ${shelf.id}`}
        elementType="shelf"
        environmentalData={environmentalData}
        deviceStatus={deviceStatus}
        deviceCount={devices.length}
        alerts={alerts}
        side="top"
      >
        <ContextualMenu
          trigger={
            <RippleButton
              className={cn(
                "group relative p-3 rounded-lg border transition-all duration-200 cursor-pointer w-full",
                "bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 border-slate-200 dark:border-slate-600",
                "hover:from-slate-100 hover:to-slate-150 dark:hover:from-slate-700 dark:hover:to-slate-600 hover:border-slate-300 dark:hover:border-slate-500 hover:shadow-md",
                isSelectedByParent && "ring-2 ring-blue-500 border-blue-300 dark:border-blue-600 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30",
                isHovered && "scale-[1.02]"
              )}
              onClick={(e) => {
                e.stopPropagation()
                onShelfSelect(shelf)
              }}
              onDoubleClick={(e) => {
                e.stopPropagation()
                openDetailModal(shelf, 'shelf')
              }}
              onMouseEnter={() => setHoveredElement('shelf', shelf.id)}
              onMouseLeave={() => clearHoveredElement('shelf')}
              rippleColor="rgba(59, 130, 246, 0.3)"
            >
              {/* Shelf Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Grid3X3 className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                  <span className="font-medium text-slate-800 dark:text-slate-100">
                    {shelf.name || `Shelf ${shelf.id}`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {/* Show layer-specific badges */}
                  {isMonitoringLayerActive && (
                    <Badge variant="outline" className="text-xs border-green-300 text-green-700 dark:border-green-600 dark:text-green-300">
                      Monitored
                    </Badge>
                  )}
                  {isAutomationLayerActive && (
                    <Badge variant="outline" className="text-xs border-purple-300 text-purple-700 dark:border-purple-600 dark:text-purple-300">
                      Automated
                    </Badge>
                  )}
                  {isGrowsLayerActive && (
                    <Badge variant="outline" className="text-xs border-green-300 text-green-700 dark:border-green-600 dark:text-green-300">
                      Growing
                    </Badge>
                  )}
                  {/* Alert indicator */}
                  {alerts.length > 0 && (
                    <Badge variant="destructive" className="text-xs animate-pulse">
                      {alerts.length}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Dynamic Content Based on Active Layer */}
              {getShelfContent()}
            </RippleButton>
          }
          actions={contextActions}
          elementType="shelf"
          elementName={shelf.name || `Shelf ${shelf.id}`}
        />
      </AdvancedTooltip>
    )
  }

  // Enhanced rack rendering
  const renderRack = (rack: Rack) => {
    const isSelectedByParent = selectedRack?.id === rack.id
    const isHovered = hoveredElements.rack === rack.id
    const shelves = rack.shelves || []
    const totalDevices = shelves.reduce((sum, shelf) => sum + (shelf.devices?.length || 0), 0)

    return (
      <div
        key={rack.id}
        className={cn(
          "group relative p-5 rounded-xl border transition-all duration-200 cursor-pointer",
          "bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700",
          "hover:from-blue-100 hover:to-blue-150 dark:hover:from-blue-800/30 dark:hover:to-blue-700/30 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-lg",
          isSelectedByParent && "ring-2 ring-blue-500 border-blue-400 dark:border-blue-500 bg-gradient-to-r from-blue-100 to-blue-200 dark:from-blue-800/40 dark:to-blue-700/40",
          isHovered && "scale-[1.01]"
        )}
        onClick={(e) => {
          e.stopPropagation()
          onRackSelect(rack)
        }}
        onDoubleClick={(e) => {
          e.stopPropagation()
          openDetailModal(rack, 'rack')
        }}
        onMouseEnter={() => setHoveredElement('rack', rack.id)}
        onMouseLeave={() => clearHoveredElement('rack')}
      >
        {/* Rack Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <Archive className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <span className="text-xl font-semibold text-blue-800 dark:text-blue-200">
              {rack.name || `Rack ${rack.id}`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-blue-300 text-blue-700 dark:border-blue-600 dark:text-blue-300 text-sm px-2 py-1">
              {shelves.length} shelf{shelves.length !== 1 ? 'ves' : ''}
            </Badge>
            {totalDevices > 0 && (
              <Badge variant="secondary" className="text-blue-700 dark:text-blue-300 text-sm px-2 py-1">
                {totalDevices} device{totalDevices !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </div>

        {/* Shelves Grid */}
        {shelves.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {shelves.map(renderShelf)}
          </div>
        ) : (
          <div className="text-center py-12 text-blue-500 dark:text-blue-400">
            <Grid3X3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-base mb-3">No shelves in this rack</p>
            <Button
              onClick={(e) => {
                e.stopPropagation()
                handleContextAction('add-shelf')
              }}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
              disabled={selectedRack?.id !== rack.id}
            >
              <Plus className="w-4 h-4" />
              Add Shelf
            </Button>
          </div>
        )}
      </div>
    )
  }

  // Enhanced row rendering
  const renderRow = (row: Row) => {
    const isSelectedByParent = selectedRow?.id === row.id
    const isHovered = hoveredElements.row === row.id
    const racks = row.racks || []
    const totalShelves = racks.reduce((sum, rack) => sum + (rack.shelves?.length || 0), 0)
    const totalDevices = racks.reduce((sum, rack) => 
      sum + (rack.shelves?.reduce((shelfSum, shelf) => shelfSum + (shelf.devices?.length || 0), 0) || 0), 0
    )

    return (
      <div
        key={row.id}
        className={cn(
          "group relative p-6 rounded-2xl border transition-all duration-200 cursor-pointer",
          "bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-700",
          "hover:from-green-100 hover:to-emerald-100 dark:hover:from-green-800/30 dark:hover:to-emerald-800/30 hover:border-green-300 dark:hover:border-green-600 hover:shadow-xl",
          isSelectedByParent && "ring-2 ring-green-500 border-green-400 dark:border-green-500 bg-gradient-to-r from-green-100 to-emerald-150 dark:from-green-800/40 dark:to-emerald-800/40",
          isHovered && "scale-[1.005]"
        )}
        onClick={(e) => {
          e.stopPropagation()
          onRowSelect(row)
        }}
        onDoubleClick={(e) => {
          e.stopPropagation()
          openDetailModal(row, 'row')
        }}
        onMouseEnter={() => setHoveredElement('row', row.id)}
        onMouseLeave={() => clearHoveredElement('row')}
      >
        {/* Row Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Layers className="w-7 h-7 text-green-600 dark:text-green-400" />
            <span className="text-2xl font-bold text-green-800 dark:text-green-200">
              {row.name || `Row ${row.id}`}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="border-green-300 text-green-700 dark:border-green-600 dark:text-green-300 text-sm px-3 py-1">
              {racks.length} rack{racks.length !== 1 ? 's' : ''}
            </Badge>
            <Badge variant="outline" className="border-green-300 text-green-700 dark:border-green-600 dark:text-green-300 text-sm px-3 py-1">
              {totalShelves} shelf{totalShelves !== 1 ? 'ves' : ''}
            </Badge>
            {totalDevices > 0 && (
              <Badge variant="secondary" className="text-green-700 dark:text-green-300 text-sm px-3 py-1">
                {totalDevices} device{totalDevices !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </div>

        {/* Racks Grid */}
        {racks.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {racks.map(renderRack)}
          </div>
        ) : (
          <div className="text-center py-16 text-green-500 dark:text-green-400">
            <Archive className="w-20 h-20 mx-auto mb-6 opacity-50" />
            <p className="text-xl mb-3">No racks in this row</p>
            <p className="text-base opacity-75 mb-6">Add racks to organize your growing space</p>
            <Button
              onClick={(e) => {
                e.stopPropagation()
                handleContextAction('add-rack')
              }}
              size="default"
              className="bg-green-600 hover:bg-green-700 text-white gap-2"
              disabled={selectedRow?.id !== row.id}
            >
              <Plus className="w-4 h-4" />
              Add First Rack
            </Button>
          </div>
        )}
      </div>
    )
  }

  // Get rows from farm data
  const rows = farmData?.farm?.rows || []

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* Main Content */}
      <div className="p-8 h-full overflow-auto">
        {rows.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Layers className="w-20 h-20 text-slate-400 dark:text-slate-500 mx-auto mb-6" />
              <h3 className="text-2xl font-semibold text-slate-600 dark:text-slate-300 mb-3">No Rows Found</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6">Start by adding your first row to the farm.</p>
              <Button onClick={() => handleContextAction('add-row')} className="gap-2">
                <Plus className="w-4 h-4" />
                Add First Row
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-8 pr-20">
            {rows.map(renderRow)}
          </div>
        )}
      </div>

      {/* Floating Action Buttons */}
      <div className="absolute top-8 right-8 flex flex-col gap-3">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() => handleContextAction('add-row')}
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white shadow-lg gap-2"
              >
                <Plus className="w-4 h-4" />
                <Layers className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Add Row</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() => handleContextAction('add-rack')}
                disabled={!selectedRow}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white shadow-lg gap-2"
              >
                <Plus className="w-4 h-4" />
                <Archive className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {selectedRow ? 'Add Rack to Selected Row' : 'Select a Row First'}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() => handleContextAction('add-shelf')}
                disabled={!selectedRack}
                size="sm"
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white shadow-lg gap-2"
              >
                <Plus className="w-4 h-4" />
                <Grid3X3 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {selectedRack ? 'Add Shelf to Selected Rack' : 'Select a Rack First'}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Detail Modal */}
      <ElementDetailModal
        isOpen={detailModal.isOpen}
        onClose={closeDetailModal}
        element={detailModal.element}
        elementType={detailModal.elementType}
        onUpdate={() => {
          if (onDataRefresh) {
            onDataRefresh()
          }
        }}
        onDelete={() => {
          if (onDataRefresh) {
            onDataRefresh()
          }
        }}
      />

      {/* Layer Overlays */}
      
      {isLayerActive('automation') && farmData && (
        <AutomationOverlay
          farmData={farmData}
          selectedRow={selectedRow}
          selectedRack={selectedRack}
          selectedShelf={selectedShelf}
        />
      )}
      
      {isLayerActive('monitoring') && farmData && (
        <MonitoringOverlay
          farmData={farmData}
          selectedRow={selectedRow?.id || null}
          selectedRack={selectedRack?.id || null}
          selectedShelf={selectedShelf?.id || null}
        />
      )}
      
      {isLayerActive('grows') && farmData && (
        <GrowsOverlay
          farmData={farmData}
          selectedRow={selectedRow}
          selectedRack={selectedRack}
          selectedShelf={selectedShelf}
        />
      )}

      {/* Grow Wizard Modal */}
      <GrowWizardModal
        isOpen={growWizard.isOpen}
        onClose={closeGrowWizard}
        shelfId={growWizard.shelfId || ''}
        shelfName={growWizard.shelfName || ''}
        onSubmit={handleGrowSetup}
      />
    </div>
  )
}

export default UnifiedFarmView 