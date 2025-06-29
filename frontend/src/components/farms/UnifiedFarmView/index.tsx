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

// Custom hooks
import { useFarmState } from './hooks/useFarmState'

// Sub-components
import DeviceRenderer from './components/DeviceRenderer'
import ElementDetailModal from '../ElementDetailModal'
import { InlineEditor } from './components/InlineEditor'

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

  // Enhanced shelf rendering with edit capabilities
  const renderShelf = (shelf: Shelf) => {
    const isSelectedByParent = selectedShelf?.id === shelf.id
    const isHovered = hoveredElements.shelf === shelf.id
    const devices = shelf.devices || []
    const deviceCount = devices.length

    return (
      <div
        key={shelf.id}
        className={cn(
          "group relative p-3 rounded-lg border transition-all duration-200 cursor-pointer",
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
      >
        {/* Shelf Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Grid3X3 className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            <InlineEditor
              value={shelf.name || `Shelf ${shelf.id}`}
                              onSave={async (newName) => {
                  try {
                    const { updateShelf } = await import('@/services/shelfService')
                    await updateShelf(shelf.id, { name: newName })
                    toast.success('Shelf name updated')
                    if (onDataRefresh) onDataRefresh()
                  } catch (error) {
                    console.error('Error updating shelf name:', error)
                    toast.error('Failed to update shelf name')
                    throw error
                  }
                }}
              className="font-medium text-slate-800 dark:text-slate-100"
            />
          </div>
          <div className="flex items-center gap-2">
            {deviceCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {deviceCount} device{deviceCount !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </div>

        {/* Device Display */}
        {devices.length > 0 && (
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
        )}

        {/* Empty State */}
        {devices.length === 0 && (
          <div className="text-center py-2 text-slate-400 dark:text-slate-500 text-sm">
            No devices assigned
          </div>
        )}
      </div>
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
          "group relative p-4 rounded-xl border transition-all duration-200 cursor-pointer",
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
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Archive className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <InlineEditor
              value={rack.name || `Rack ${rack.id}`}
                              onSave={async (newName) => {
                  try {
                    const { updateRack } = await import('@/services/rackService')
                    await updateRack(rack.id, { name: newName })
                    toast.success('Rack name updated')
                    if (onDataRefresh) onDataRefresh()
                  } catch (error) {
                    console.error('Error updating rack name:', error)
                    toast.error('Failed to update rack name')
                    throw error
                  }
                }}
              className="text-lg font-semibold text-blue-800 dark:text-blue-200"
            />
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-blue-300 text-blue-700 dark:border-blue-600 dark:text-blue-300">
              {shelves.length} shelf{shelves.length !== 1 ? 'ves' : ''}
            </Badge>
            {totalDevices > 0 && (
              <Badge variant="secondary" className="text-blue-700 dark:text-blue-300">
                {totalDevices} device{totalDevices !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </div>

        {/* Shelves Grid */}
        {shelves.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {shelves.map(renderShelf)}
          </div>
        ) : (
          <div className="text-center py-8 text-blue-500 dark:text-blue-400">
            <Grid3X3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No shelves in this rack</p>
            <Button
              onClick={(e) => {
                e.stopPropagation()
                handleContextAction('add-shelf')
              }}
              size="sm"
              className="mt-2 bg-blue-600 hover:bg-blue-700 text-white"
              disabled={selectedRack?.id !== rack.id}
            >
              <Plus className="w-4 h-4 mr-1" />
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
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Layers className="w-6 h-6 text-green-600 dark:text-green-400" />
            <InlineEditor
              value={row.name || `Row ${row.id}`}
                              onSave={async (newName) => {
                  try {
                    const { updateRow } = await import('@/services/rowService')
                    await updateRow(row.id, { name: newName })
                    toast.success('Row name updated')
                    if (onDataRefresh) onDataRefresh()
                  } catch (error) {
                    console.error('Error updating row name:', error)
                    toast.error('Failed to update row name')
                    throw error
                  }
                }}
              className="text-xl font-bold text-green-800 dark:text-green-200"
            />
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="border-green-300 text-green-700 dark:border-green-600 dark:text-green-300">
              {racks.length} rack{racks.length !== 1 ? 's' : ''}
            </Badge>
            <Badge variant="outline" className="border-green-300 text-green-700 dark:border-green-600 dark:text-green-300">
              {totalShelves} shelf{totalShelves !== 1 ? 'ves' : ''}
            </Badge>
            {totalDevices > 0 && (
              <Badge variant="secondary" className="text-green-700 dark:text-green-300">
                {totalDevices} device{totalDevices !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </div>

        {/* Racks Grid */}
        {racks.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {racks.map(renderRack)}
          </div>
        ) : (
          <div className="text-center py-12 text-green-500 dark:text-green-400">
            <Archive className="w-16 h-16 mx-auto mb-3 opacity-50" />
            <p className="text-lg mb-2">No racks in this row</p>
            <p className="text-sm opacity-75 mb-4">Add racks to organize your growing space</p>
            <Button
              onClick={(e) => {
                e.stopPropagation()
                handleContextAction('add-rack')
              }}
              size="default"
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={selectedRow?.id !== row.id}
            >
              <Plus className="w-4 h-4 mr-2" />
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
      <div className="p-6 h-full overflow-auto">
        {rows.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Layers className="w-20 h-20 text-slate-400 dark:text-slate-500 mx-auto mb-4" />
              <h3 className="text-2xl font-semibold text-slate-600 dark:text-slate-300 mb-2">No Rows Found</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-4">Start by adding your first row to the farm.</p>
              <Button onClick={() => handleContextAction('add-row')} className="gap-2">
                <Plus className="w-4 h-4" />
                Add First Row
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {rows.map(renderRow)}
          </div>
        )}
      </div>

      {/* Floating Action Buttons */}
      <div className="absolute top-6 right-6 flex flex-col gap-2">
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
    </div>
  )
}

export default UnifiedFarmView 