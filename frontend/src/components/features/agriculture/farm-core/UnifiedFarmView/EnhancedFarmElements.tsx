import React from 'react'
import { Row, Rack, Shelf } from '@/types/farm-layout'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Grid3X3, 
  Archive, 
  Layers3, 
  Plus,
  Thermometer,
  Droplets,
  Sun,
  Activity
} from 'lucide-react'

// Import new Phase 2 components
import { RippleButton } from '@/components/ui/RippleButton'
import { AdvancedTooltip } from '@/components/ui/AdvancedTooltip'
import { 
  ContextualMenu, 
  getShelfActions, 
  getRackActions, 
  getRowActions 
} from '@/components/ui/ContextualMenu'

interface HoveredElements {
  row: string | null
  rack: string | null
  shelf: string | null
}

interface EnhancedElementProps {
  selectedRow: Row | null
  selectedRack: Rack | null
  selectedShelf: Shelf | null
  hoveredElements: HoveredElements
  setHoveredElement: (type: 'row' | 'rack' | 'shelf', id: string) => void
  clearHoveredElement: (type: 'row' | 'rack' | 'shelf') => void
  onRowSelect: (row: Row) => void
  onRackSelect: (rack: Rack) => void
  onShelfSelect: (shelf: Shelf) => void
  openDetailModal: (element: Row | Rack | Shelf, type: 'row' | 'rack' | 'shelf') => void
  isDevicesLayerActive: boolean
  isMonitoringLayerActive: boolean
  isAutomationLayerActive: boolean
  isGrowsLayerActive: boolean
}

// Mock data generators for Phase 2 features
const generateMockEnvironmentalData = (elementId: string) => {
  const seed = parseInt(elementId) || 1
  const tempVariation = (seed % 3) * 2 - 2 // -2, 0, or 2
  const humidityVariation = (seed % 4) * 5 - 10 // -10, -5, 0, or 5
  
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
  const connectivityStates = ['connected', 'disconnected', 'poor'] as const
  
  return {
    connectivity: connectivityStates[seed % 3],
    lastUpdate: new Date(Date.now() - (seed % 10) * 60000).toISOString(),
    batteryLevel: seed % 4 === 0 ? 15 : 85 // Some low battery devices
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

export const EnhancedShelf: React.FC<EnhancedElementProps & { shelf: Shelf }> = ({
  shelf,
  selectedShelf,
  hoveredElements,
  setHoveredElement,
  clearHoveredElement,
  onShelfSelect,
  openDetailModal,
  isDevicesLayerActive,
  isMonitoringLayerActive,
  isAutomationLayerActive,
  isGrowsLayerActive
}) => {
  const isSelectedByParent = selectedShelf?.id === shelf.id
  const isHovered = hoveredElements.shelf === shelf.id
  const devices = shelf.devices || []

  // Mock data for enhanced features
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
    () => console.log('Start new grow on shelf', shelf.id),
    () => console.log('View grow details for shelf', shelf.id),
    () => console.log('Pause grow on shelf', shelf.id),
    () => console.log('Resume grow on shelf', shelf.id),
    () => console.log('Harvest from shelf', shelf.id),
    false // hasActiveGrow - for demo purposes
  )

  const getShelfContent = () => {
    if (isDevicesLayerActive && devices.length > 0) {
      return (
        <div className="grid grid-cols-2 gap-1">
          {devices.slice(0, 4).map((device) => (
            <div
              key={device.id}
              className="flex items-center gap-1 p-1 bg-white dark:bg-slate-700 rounded text-xs border"
            >
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="truncate">{device.name}</span>
            </div>
          ))}
          {devices.length > 4 && (
            <div className="text-xs text-slate-500 dark:text-slate-400 text-center col-span-2">
              +{devices.length - 4} more
            </div>
          )}
        </div>
      )
    }

    if (isMonitoringLayerActive) {
      return (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600 dark:text-slate-300">Temperature</span>
            <span className={cn(
              environmentalData.temperature.status === 'optimal' ? 'text-green-600 dark:text-green-400' :
              environmentalData.temperature.status === 'warning' ? 'text-yellow-600 dark:text-yellow-400' :
              'text-red-600 dark:text-red-400'
            )}>
              {environmentalData.temperature.current}°{environmentalData.temperature.unit}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600 dark:text-slate-300">Humidity</span>
            <span className={cn(
              environmentalData.humidity.status === 'optimal' ? 'text-green-600 dark:text-green-400' :
              'text-yellow-600 dark:text-yellow-400'
            )}>
              {environmentalData.humidity.current}%
            </span>
          </div>
        </div>
      )
    }

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

export const EnhancedRack: React.FC<EnhancedElementProps & { rack: Rack }> = ({
  rack,
  selectedRow,
  selectedRack,
  selectedShelf,
  hoveredElements,
  setHoveredElement,
  clearHoveredElement,
  onRowSelect,
  onRackSelect,
  onShelfSelect,
  openDetailModal,
  isDevicesLayerActive,
  isMonitoringLayerActive,
  isAutomationLayerActive,
  isGrowsLayerActive
}) => {
  const isSelectedByParent = selectedRack?.id === rack.id
  const isHovered = hoveredElements.rack === rack.id
  const shelves = rack.shelves || []
  const totalDevices = shelves.reduce((sum, shelf) => sum + (shelf.devices?.length || 0), 0)

  // Mock data for enhanced features
  const environmentalData = generateMockEnvironmentalData(rack.id)
  const deviceStatus = generateMockDeviceStatus(rack.id)
  const alerts = generateMockAlerts(rack.id)

  // Context menu actions
  const contextActions = getRackActions(
    () => console.log('Edit rack', rack.id),
    () => openDetailModal(rack, 'rack'),
    () => console.log('Add shelf to rack', rack.id),
    () => console.log('Clone rack', rack.id),
    () => console.log('Delete rack', rack.id),
    () => console.log('View metrics', rack.id)
  )

  return (
    <AdvancedTooltip
      title={rack.name || `Rack ${rack.id}`}
      elementType="rack"
      environmentalData={environmentalData}
      deviceStatus={deviceStatus}
      deviceCount={totalDevices}
      alerts={alerts}
      side="left"
    >
      <ContextualMenu
        trigger={
          <RippleButton
            className={cn(
              "group relative p-5 rounded-xl border transition-all duration-200 cursor-pointer w-full",
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
            rippleColor="rgba(59, 130, 246, 0.4)"
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
                {alerts.length > 0 && (
                  <Badge variant="destructive" className="text-xs animate-pulse">
                    {alerts.length}
                  </Badge>
                )}
              </div>
            </div>

            {/* Shelves Grid */}
            {shelves.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {shelves.map(shelf => (
                  <EnhancedShelf
                    key={shelf.id}
                    shelf={shelf}
                    selectedRow={selectedRow}
                    selectedRack={selectedRack}
                    selectedShelf={selectedShelf}
                    hoveredElements={hoveredElements}
                    setHoveredElement={setHoveredElement}
                    clearHoveredElement={clearHoveredElement}
                    onRowSelect={onRowSelect}
                    onRackSelect={onRackSelect}
                    onShelfSelect={onShelfSelect}
                    openDetailModal={openDetailModal}
                    isDevicesLayerActive={isDevicesLayerActive}
                    isMonitoringLayerActive={isMonitoringLayerActive}
                    isAutomationLayerActive={isAutomationLayerActive}
                    isGrowsLayerActive={isGrowsLayerActive}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-blue-500 dark:text-blue-400">
                <Grid3X3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-base mb-3">No shelves in this rack</p>
                <Button
                  onClick={(e) => {
                    e.stopPropagation()
                    console.log('Add shelf to rack', rack.id)
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
          </RippleButton>
        }
        actions={contextActions}
        elementType="rack"
        elementName={rack.name || `Rack ${rack.id}`}
      />
    </AdvancedTooltip>
  )
}

export const EnhancedRow: React.FC<EnhancedElementProps & { row: Row }> = ({
  row,
  selectedRow,
  selectedRack,
  selectedShelf,
  hoveredElements,
  setHoveredElement,
  clearHoveredElement,
  onRowSelect,
  onRackSelect,
  onShelfSelect,
  openDetailModal,
  isDevicesLayerActive,
  isMonitoringLayerActive,
  isAutomationLayerActive,
  isGrowsLayerActive
}) => {
  const isSelectedByParent = selectedRow?.id === row.id
  const isHovered = hoveredElements.row === row.id
  const racks = row.racks || []
  const totalShelves = racks.reduce((sum, rack) => sum + (rack.shelves?.length || 0), 0)
  const totalDevices = racks.reduce((sum, rack) => 
    sum + (rack.shelves?.reduce((shelfSum, shelf) => shelfSum + (shelf.devices?.length || 0), 0) || 0), 0
  )

  // Mock data for enhanced features
  const environmentalData = generateMockEnvironmentalData(row.id)
  const deviceStatus = generateMockDeviceStatus(row.id)
  const alerts = generateMockAlerts(row.id)

  // Context menu actions
  const contextActions = getRowActions(
    () => console.log('Edit row', row.id),
    () => openDetailModal(row, 'row'),
    () => console.log('Add rack to row', row.id),
    () => console.log('Clone row', row.id),
    () => console.log('Delete row', row.id),
    () => console.log('View metrics', row.id)
  )

  return (
    <AdvancedTooltip
      title={row.name || `Row ${row.id}`}
      elementType="row"
      environmentalData={environmentalData}
      deviceStatus={deviceStatus}
      deviceCount={totalDevices}
      alerts={alerts}
      side="top"
    >
      <ContextualMenu
        trigger={
          <RippleButton
            className={cn(
              "group relative p-6 rounded-2xl border transition-all duration-200 cursor-pointer w-full",
              "bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 border-emerald-200 dark:border-emerald-700",
              "hover:from-emerald-100 hover:to-emerald-150 dark:hover:from-emerald-800/30 dark:hover:to-emerald-700/30 hover:border-emerald-300 dark:hover:border-emerald-600 hover:shadow-xl",
              isSelectedByParent && "ring-2 ring-emerald-500 border-emerald-400 dark:border-emerald-500",
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
            rippleColor="rgba(16, 185, 129, 0.3)"
          >
            {/* Row Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <Layers3 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                <span className="text-2xl font-bold text-emerald-800 dark:text-emerald-200">
                  {row.name || `Row ${row.id}`}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="border-emerald-300 text-emerald-700 dark:border-emerald-600 dark:text-emerald-300 text-sm px-3 py-1">
                  {racks.length} rack{racks.length !== 1 ? 's' : ''}
                </Badge>
                <Badge variant="secondary" className="text-emerald-700 dark:text-emerald-300 text-sm px-3 py-1">
                  {totalShelves} shelf{totalShelves !== 1 ? 'ves' : ''}
                </Badge>
                {totalDevices > 0 && (
                  <Badge variant="secondary" className="text-emerald-700 dark:text-emerald-300 text-sm px-3 py-1">
                    {totalDevices} device{totalDevices !== 1 ? 's' : ''}
                  </Badge>
                )}
                {alerts.length > 0 && (
                  <Badge variant="destructive" className="text-xs animate-pulse">
                    {alerts.length}
                  </Badge>
                )}
              </div>
            </div>

            {/* Racks Grid */}
            {racks.length > 0 ? (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {racks.map(rack => (
                  <EnhancedRack
                    key={rack.id}
                    rack={rack}
                    selectedRow={selectedRow}
                    selectedRack={selectedRack}
                    selectedShelf={selectedShelf}
                    hoveredElements={hoveredElements}
                    setHoveredElement={setHoveredElement}
                    clearHoveredElement={clearHoveredElement}
                    onRowSelect={onRowSelect}
                    onRackSelect={onRackSelect}
                    onShelfSelect={onShelfSelect}
                    openDetailModal={openDetailModal}
                    isDevicesLayerActive={isDevicesLayerActive}
                    isMonitoringLayerActive={isMonitoringLayerActive}
                    isAutomationLayerActive={isAutomationLayerActive}
                    isGrowsLayerActive={isGrowsLayerActive}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-emerald-500 dark:text-emerald-400">
                <Archive className="w-20 h-20 mx-auto mb-6 opacity-50" />
                <p className="text-lg mb-4">No racks in this row</p>
                <Button
                  onClick={(e) => {
                    e.stopPropagation()
                    console.log('Add rack to row', row.id)
                  }}
                  size="default"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                  disabled={selectedRow?.id !== row.id}
                >
                  <Plus className="w-5 h-5" />
                  Add Rack
                </Button>
              </div>
            )}
          </RippleButton>
        }
        actions={contextActions}
        elementType="row"
        elementName={row.name || `Row ${row.id}`}
      />
    </AdvancedTooltip>
  )
} 