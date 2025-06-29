import React from 'react'
import { SensorDevice } from '@/types/farm-layout'
import { Lightbulb, Droplets, Wind } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface DeviceRendererProps {
  device: SensorDevice
}

const DeviceRenderer: React.FC<DeviceRendererProps> = ({ device }) => {
  // Device icon mapping
  const getDeviceIcon = (device: SensorDevice) => {
    const type = device.name?.toLowerCase() || ''
    if (type.includes('light')) return <Lightbulb className="w-3 h-3" />
    if (type.includes('water') || type.includes('pump')) return <Droplets className="w-3 h-3" />
    if (type.includes('fan') || type.includes('air')) return <Wind className="w-3 h-3" />
    return <div className="w-3 h-3 rounded-full bg-slate-400" />
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-800/80 dark:bg-slate-200/80 rounded-md backdrop-blur-sm border border-slate-600/30 dark:border-slate-400/30">
            {getDeviceIcon(device)}
            <span className="text-xs font-medium text-white dark:text-slate-800 truncate max-w-16">
              {device.name || 'Device'}
            </span>
            <div className="w-2 h-2 rounded-full bg-green-400" />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p className="font-medium">{device.name || 'Unnamed Device'}</p>
            <p className="text-xs text-muted-foreground">
              Type: {device.sensor_type}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export default DeviceRenderer 