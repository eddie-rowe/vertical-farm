"use client";

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'

import { Separator } from '@/components/ui/separator'
import { Search, Lightbulb, Zap, Wind, Settings, Trash2, Thermometer, Camera, Droplets, Power, Filter, CheckCircle, XCircle, Clock } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { supabase } from '@/supabaseClient'
import { Row, Rack, Shelf } from '@/types/farm-layout'
import { HADevice, DeviceAssignment, DeviceFilter, AssignmentTarget } from '@/types/device-assignment'
import deviceAssignmentService from '@/services/deviceAssignmentService'

interface Device {
  id: string
  entity_id: string
  friendly_name?: string
  entity_type: string
  state?: string
  attributes?: Record<string, any>
}

interface ElementDetailModalProps {
  isOpen: boolean
  onClose: () => void
  element: Row | Rack | Shelf | null
  elementType: 'row' | 'rack' | 'shelf'
  onUpdate?: () => void
  onDelete?: () => void
}

const getDeviceIcon = (entityType: string) => {
  switch (entityType.toLowerCase()) {
    case 'light':
      return <Lightbulb className="w-4 h-4" />
    case 'switch':
      return <Zap className="w-4 h-4" />
    case 'sensor':
      return <Settings className="w-4 h-4" />
    case 'fan':
      return <Wind className="w-4 h-4" />
    case 'valve':
      return <Droplets className="w-4 h-4" />
    case 'pump':
      return <Power className="w-4 h-4" />
    case 'camera':
      return <Camera className="w-4 h-4" />
    case 'climate':
      return <Thermometer className="w-4 h-4" />
    default:
      return <Settings className="w-4 h-4" />
  }
}

const getStatusIcon = (state: string) => {
  const isOnline = state !== 'unavailable' && state !== 'unknown';
  if (state === 'unavailable') {
    return <XCircle className="w-3 h-3 text-red-500" />
  } else if (isOnline) {
    return <CheckCircle className="w-3 h-3 text-green-500" />
  } else {
    return <Clock className="w-3 h-3 text-yellow-500" />
  }
}

const ElementDetailModal: React.FC<ElementDetailModalProps> = ({
  isOpen,
  onClose,
  element,
  elementType,
  onUpdate,
  onDelete
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [availableDevices, setAvailableDevices] = useState<HADevice[]>([])
  const [assignedDevices, setAssignedDevices] = useState<DeviceAssignment[]>([])
  const [loading, setLoading] = useState(false)
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [activeFilter, setActiveFilter] = useState<string>('all')
  const [deviceTypeFilter, setDeviceTypeFilter] = useState<string>('')

  // Get contextual device types for this element
  const getContextualDeviceTypes = () => {
    return deviceAssignmentService.getContextualDeviceTypes(elementType as AssignmentTarget['type'])
  }

  // Get device type options with icons
  const getDeviceTypeOptions = () => {
    const allTypes = deviceAssignmentService.getDeviceTypes()
    const contextualTypes = getContextualDeviceTypes()
    
    return [
      { value: 'all', label: 'All Devices', icon: '📱' },
      ...allTypes.filter(type => contextualTypes.includes(type.value))
    ]
  }

  // Create assignment target for current element
  const getAssignmentTarget = (): AssignmentTarget => {
    if (!element) throw new Error('No element selected')
    return {
      type: elementType as AssignmentTarget['type'],
      id: element.id,
      name: element.name || `${elementType} ${element.id}`
    }
  }

  // Fetch available devices for assignment
  const fetchAvailableDevices = async () => {
    if (!element) return
    
    setLoading(true)
    try {
      const filters: DeviceFilter = {
        assigned: false // Only show unassigned devices
      }

      // Apply device type filter if set
      if (deviceTypeFilter && deviceTypeFilter !== 'all') {
        filters.domain = deviceTypeFilter
      }

      const devices = await deviceAssignmentService.searchDevices(searchTerm, filters)
      setAvailableDevices(devices || [])
    } catch (error) {
      console.error('Error fetching devices:', error)
      toast.error('Failed to fetch devices')
    } finally {
      setLoading(false)
    }
  }

  // Fetch currently assigned devices
  const fetchAssignedDevices = async () => {
    if (!element) return
    
    try {
      const target = getAssignmentTarget()
      const assignments = await deviceAssignmentService.getAssignedDevices(target)
      setAssignedDevices(assignments || [])
    } catch (error) {
      console.error('Error fetching assigned devices:', error)
    }
  }

  // Assign device to current element
  const assignDevice = async (device: HADevice) => {
    if (!element) return

    try {
      const target = getAssignmentTarget()
      
      const deviceData = {
        entity_id: device.entity_id,
        friendly_name: device.friendly_name,
        entity_type: device.domain,
        device_class: device.device_class,
        area: device.area
      }

      await deviceAssignmentService.assignDevice(deviceData, target)
      toast.success('Device assigned successfully')
      
      // Refresh data
      await Promise.all([fetchAssignedDevices(), fetchAvailableDevices()])
      if (onUpdate) onUpdate()
    } catch (error) {
      console.error('Error assigning device:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to assign device'
      toast.error(errorMessage)
    }
  }

  // Remove device assignment
  const removeDeviceAssignment = async (assignmentId: string) => {
    try {
      await deviceAssignmentService.unassignDevice(assignmentId)
      toast.success('Device assignment removed')
      
      // Refresh data
      await Promise.all([fetchAssignedDevices(), fetchAvailableDevices()])
      if (onUpdate) onUpdate()
    } catch (error) {
      console.error('Error removing device assignment:', error)
      toast.error('Failed to remove device assignment')
    }
  }

  // Quick assign all devices of a specific type
  const quickAssignDevices = async (deviceType: string) => {
    if (!element) return

    try {
      const target = getAssignmentTarget()
      const devices = availableDevices.filter(device => device.domain === deviceType)
      
      if (devices.length === 0) {
        toast(`No available ${deviceType} devices found`)
        return
      }

      let successCount = 0
      for (const device of devices) {
        try {
          const deviceData = {
            entity_id: device.entity_id,
            friendly_name: device.friendly_name,
            entity_type: device.domain,
            device_class: device.device_class,
            area: device.area
          }
          await deviceAssignmentService.assignDevice(deviceData, target)
          successCount++
        } catch (error) {
          console.error(`Error assigning device ${device.entity_id}:`, error)
        }
      }

      toast.success(`Assigned ${successCount} ${deviceType} device(s)`)
      
      // Refresh data
      await Promise.all([fetchAssignedDevices(), fetchAvailableDevices()])
      if (onUpdate) onUpdate()
    } catch (error) {
      console.error('Error in quick assign:', error)
      toast.error('Failed to assign devices')
    }
  }

  // Handle delete with confirmation
  const handleDeleteClick = () => {
    setShowDeleteConfirmation(true)
  }

  // Perform actual deletion
  const confirmDelete = async () => {
    if (!element) return

    setIsDeleting(true)
    try {
      switch (elementType) {
        case 'row': {
          const { deleteRow } = await import('@/services/rowService')
          await deleteRow(element.id)
          toast.success('Row deleted successfully')
          break
        }
        case 'rack': {
          const { deleteRack } = await import('@/services/rackService')
          await deleteRack(element.id)
          toast.success('Rack deleted successfully')
          break
        }
        case 'shelf': {
          const { deleteShelf } = await import('@/services/shelfService')
          await deleteShelf(element.id)
          toast.success('Shelf deleted successfully')
          break
        }
      }

      // Close modal and trigger callbacks
      setShowDeleteConfirmation(false)
      onClose()
      if (onDelete) onDelete()
      if (onUpdate) onUpdate()
    } catch (error) {
      console.error('Error deleting element:', error)
      toast.error(`Failed to delete ${elementType}`)
    } finally {
      setIsDeleting(false)
    }
  }

  useEffect(() => {
    if (isOpen && element) {
      fetchAvailableDevices()
      fetchAssignedDevices()
    }
  }, [isOpen, element, searchTerm, deviceTypeFilter])

  if (!element) return null

  const elementName = element.name || `${elementType} ${element.id}`
  const deviceTypeOptions = getDeviceTypeOptions()
  const contextualTypes = getContextualDeviceTypes()

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Configure {elementName}</span>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteClick}
                className="flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete {elementType.charAt(0).toUpperCase() + elementType.slice(1)}
              </Button>
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="devices">Device Assignment</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="elementName">Name</Label>
                  <Input
                    id="elementName"
                    value={elementName}
                    readOnly
                    className="bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <Label htmlFor="elementType">Type</Label>
                  <Input
                    id="elementType"
                    value={elementType.charAt(0).toUpperCase() + elementType.slice(1)}
                    readOnly
                    className="bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="elementId">ID</Label>
                <Input
                  id="elementId"
                  value={element.id}
                  readOnly
                  className="bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <Label>Assigned Devices</Label>
                <div className="mt-2 space-y-2">
                  {assignedDevices.length > 0 ? (
                    assignedDevices.map((device) => (
                      <div key={device.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          {getDeviceIcon(device.entity_type)}
                          <div>
                            <span className="font-medium">{device.friendly_name || device.entity_id}</span>
                            <div className="flex items-center gap-1 mt-1">
                              <Badge variant="outline" className="text-xs">{device.entity_type}</Badge>
                              {device.area && (
                                <Badge variant="secondary" className="text-xs">{device.area}</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removeDeviceAssignment(device.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-500 dark:text-slate-400">No devices assigned</p>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="devices" className="space-y-4">
              <div className="space-y-4">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    placeholder="Search for devices..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Device Type Filter Chips */}
                <div className="flex flex-wrap gap-2">
                  {deviceTypeOptions.map((option) => (
                    <Button
                      key={option.value}
                      variant={deviceTypeFilter === option.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setDeviceTypeFilter(option.value)}
                      className="flex items-center gap-1"
                    >
                      <span>{option.icon}</span>
                      <span>{option.label}</span>
                      {option.value !== 'all' && contextualTypes.includes(option.value) && (
                        <Badge variant="secondary" className="ml-1 text-xs">Recommended</Badge>
                      )}
                    </Button>
                  ))}
                </div>

                <Separator />

                {/* Currently Assigned Devices */}
                {assignedDevices.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Currently Assigned</h3>
                      <Badge variant="outline">{assignedDevices.length} device(s)</Badge>
                    </div>
                    <div className="space-y-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      {assignedDevices.map((device) => (
                        <div
                          key={device.id}
                          className="flex items-center justify-between p-2 bg-white dark:bg-slate-800 rounded border"
                        >
                          <div className="flex items-center gap-3">
                            {getDeviceIcon(device.entity_type)}
                            <div>
                              <p className="font-medium">{device.friendly_name || device.entity_id}</p>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">{device.entity_type}</Badge>
                                {device.area && (
                                  <Badge variant="secondary" className="text-xs">{device.area}</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {/* TODO: Add device control */}}
                            >
                              Control
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => removeDeviceAssignment(device.id)}
                            >
                              Unassign
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Available Devices */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Available Devices</h3>
                    {contextualTypes.length > 0 && (
                      <div className="flex gap-2">
                        {contextualTypes.slice(0, 2).map((type) => (
                          <Button
                            key={type}
                            variant="outline"
                            size="sm"
                            onClick={() => quickAssignDevices(type)}
                            className="text-xs"
                          >
                            Assign All {type}s
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="h-[300px] overflow-y-auto">
                    <div className="space-y-2">
                      {loading ? (
                        <div className="flex items-center justify-center h-32">
                          <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                            <p className="text-slate-500">Loading devices...</p>
                          </div>
                        </div>
                      ) : availableDevices.length > 0 ? (
                        availableDevices.map((device) => (
                          <div
                            key={device.entity_id}
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              {getDeviceIcon(device.domain)}
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium">{device.friendly_name || device.entity_id}</p>
                                  {getStatusIcon(device.state)}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="outline" className="text-xs">{device.domain}</Badge>
                                  {device.state && device.state !== 'unknown' && (
                                    <Badge variant="secondary" className="text-xs">{device.state}</Badge>
                                  )}
                                  {device.area && (
                                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                      📍 {device.area}
                                    </Badge>
                                  )}
                                  {contextualTypes.includes(device.domain) && (
                                    <Badge variant="default" className="text-xs bg-green-100 text-green-800 border-green-300">
                                      ⭐ Recommended
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            <Button
                              onClick={() => assignDevice(device)}
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700 min-w-[80px]"
                              disabled={device.state === 'unavailable'}
                            >
                              Assign
                            </Button>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <Filter className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                          <p className="text-slate-500 font-medium">
                            {searchTerm ? 'No devices found matching your search' : 'No devices available'}
                          </p>
                          <p className="text-slate-400 text-sm mt-1">
                            Try adjusting your filters or search terms
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                {availableDevices.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm text-slate-600 dark:text-slate-400">Quick Actions</h4>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => quickAssignDevices('light')}
                          className="text-xs"
                          disabled={!availableDevices.some(d => d.domain === 'light')}
                        >
                          💡 Assign All Lights
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => quickAssignDevices('fan')}
                          className="text-xs"
                          disabled={!availableDevices.some(d => d.domain === 'fan')}
                        >
                          🌪️ Assign All Fans
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => quickAssignDevices('sensor')}
                          className="text-xs"
                          disabled={!availableDevices.some(d => d.domain === 'sensor')}
                        >
                          📊 Assign All Sensors
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirmation} onOpenChange={setShowDeleteConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {elementType.charAt(0).toUpperCase() + elementType.slice(1)}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{elementName}"? This action cannot be undone.
              {elementType === 'row' && ' All racks and shelves in this row will also be deleted.'}
              {elementType === 'rack' && ' All shelves in this rack will also be deleted.'}
              {elementType === 'shelf' && ' All device assignments for this shelf will be removed.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default ElementDetailModal 