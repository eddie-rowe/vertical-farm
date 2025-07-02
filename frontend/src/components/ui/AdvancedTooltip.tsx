import React from 'react'
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger 
} from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import { 
  Thermometer, 
  Droplets, 
  Sun, 
  Activity,
  Wifi,
  WifiOff,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface EnvironmentalData {
  temperature?: {
    current: number
    target: number
    unit: 'C' | 'F'
    status: 'optimal' | 'warning' | 'critical'
  }
  humidity?: {
    current: number
    target: number
    status: 'optimal' | 'warning' | 'critical'
  }
  lightLevel?: {
    current: number
    target: number
    unit: 'lux' | '%'
    status: 'optimal' | 'warning' | 'critical'
  }
  ph?: {
    current: number
    target: number
    status: 'optimal' | 'warning' | 'critical'
  }
}

interface DeviceStatus {
  connectivity: 'connected' | 'disconnected' | 'poor'
  lastUpdate: string
  batteryLevel?: number
}

interface AdvancedTooltipProps {
  children: React.ReactNode
  title: string
  elementType: 'shelf' | 'rack' | 'row'
  environmentalData?: EnvironmentalData
  deviceStatus?: DeviceStatus
  deviceCount?: number
  alerts?: Array<{
    id: string
    message: string
    severity: 'low' | 'medium' | 'high'
    timestamp: string
  }>
  side?: 'top' | 'right' | 'bottom' | 'left'
}

const StatusIcon: React.FC<{ status: 'optimal' | 'warning' | 'critical' }> = ({ status }) => {
  switch (status) {
    case 'optimal':
      return <CheckCircle className="w-3 h-3 text-green-500" />
    case 'warning':
      return <AlertTriangle className="w-3 h-3 text-yellow-500" />
    case 'critical':
      return <AlertTriangle className="w-3 h-3 text-red-500" />
  }
}

const ConnectivityIcon: React.FC<{ connectivity: 'connected' | 'disconnected' | 'poor' }> = ({ connectivity }) => {
  switch (connectivity) {
    case 'connected':
      return <Wifi className="w-3 h-3 text-green-500" />
    case 'poor':
      return <Wifi className="w-3 h-3 text-yellow-500" />
    case 'disconnected':
      return <WifiOff className="w-3 h-3 text-red-500" />
  }
}

export const AdvancedTooltip: React.FC<AdvancedTooltipProps> = ({
  children,
  title,
  elementType,
  environmentalData,
  deviceStatus,
  deviceCount = 0,
  alerts = [],
  side = 'top'
}) => {
  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffMs = now.getTime() - time.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d ago`
  }

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent 
          side={side}
          className="w-80 p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl"
        >
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                {title}
              </h4>
              <Badge variant="outline" className="text-xs">
                {elementType}
              </Badge>
            </div>

            {/* Device Status */}
            {deviceStatus && (
              <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-900 rounded-lg">
                <div className="flex items-center gap-2">
                  <ConnectivityIcon connectivity={deviceStatus.connectivity} />
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    {deviceCount} device{deviceCount !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                  <Clock className="w-3 h-3" />
                  {formatTimeAgo(deviceStatus.lastUpdate)}
                </div>
              </div>
            )}

            {/* Environmental Data */}
            {environmentalData && (
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Environmental Conditions
                </h5>
                
                {environmentalData.temperature && (
                  <div className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-900/20 rounded">
                    <div className="flex items-center gap-2">
                      <Thermometer className="w-4 h-4 text-red-500" />
                      <span className="text-sm">Temperature</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono">
                        {environmentalData.temperature.current}°{environmentalData.temperature.unit}
                      </span>
                      <StatusIcon status={environmentalData.temperature.status} />
                    </div>
                  </div>
                )}

                {environmentalData.humidity && (
                  <div className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                    <div className="flex items-center gap-2">
                      <Droplets className="w-4 h-4 text-blue-500" />
                      <span className="text-sm">Humidity</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono">
                        {environmentalData.humidity.current}%
                      </span>
                      <StatusIcon status={environmentalData.humidity.status} />
                    </div>
                  </div>
                )}

                {environmentalData.lightLevel && (
                  <div className="flex items-center justify-between p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                    <div className="flex items-center gap-2">
                      <Sun className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm">Light Level</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono">
                        {environmentalData.lightLevel.current}{environmentalData.lightLevel.unit}
                      </span>
                      <StatusIcon status={environmentalData.lightLevel.status} />
                    </div>
                  </div>
                )}

                {environmentalData.ph && (
                  <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-green-500" />
                      <span className="text-sm">pH Level</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono">
                        {environmentalData.ph.current}
                      </span>
                      <StatusIcon status={environmentalData.ph.status} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Alerts */}
            {alerts.length > 0 && (
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Active Alerts ({alerts.length})
                </h5>
                <div className="space-y-1 max-h-20 overflow-y-auto">
                  {alerts.slice(0, 3).map((alert) => (
                    <div
                      key={alert.id}
                      className={cn(
                        "flex items-center gap-2 p-2 rounded text-xs",
                        alert.severity === 'high' && "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300",
                        alert.severity === 'medium' && "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300",
                        alert.severity === 'low' && "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                      )}
                    >
                      <AlertTriangle className="w-3 h-3 shrink-0" />
                      <span className="truncate">{alert.message}</span>
                    </div>
                  ))}
                  {alerts.length > 3 && (
                    <div className="text-xs text-slate-500 dark:text-slate-400 text-center">
                      +{alerts.length - 3} more alerts
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
} 