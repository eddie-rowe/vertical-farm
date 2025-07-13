import React from 'react'
import { 
  StatusBadge, 
  StatusIndicator, 
  DeviceStatus,
  Badge // Legacy badge for comparison
} from '@/components/ui'
import { 
  Lightbulb, 
  Wifi, 
  WifiOff, 
  CheckCircle, 
  AlertTriangle 
} from 'lucide-react'

/**
 * Status Component Examples & Migration Guide
 * 
 * This file demonstrates how to replace scattered status implementations
 * with the new standardized status components.
 */

export function StatusExamples() {
  return (
    <div className="space-y-8 p-6">
      
      {/* Basic Status Badges */}
      <section>
        <h3 className="text-lg font-semibold mb-4">Basic Status Badges</h3>
        <div className="flex flex-wrap gap-4">
          <StatusBadge status="online">Online</StatusBadge>
          <StatusBadge status="offline">Offline</StatusBadge>
          <StatusBadge status="warning">Warning</StatusBadge>
          <StatusBadge status="error">Error</StatusBadge>
          <StatusBadge status="pending">Pending</StatusBadge>
          <StatusBadge status="processing">Processing</StatusBadge>
          <StatusBadge status="success">Success</StatusBadge>
        </div>
      </section>

      {/* Status Badges with Icons */}
      <section>
        <h3 className="text-lg font-semibold mb-4">Status Badges with Icons</h3>
        <div className="flex flex-wrap gap-4">
          <StatusBadge status="connected" icon={<Wifi />}>Connected</StatusBadge>
          <StatusBadge status="disconnected" icon={<WifiOff />}>Disconnected</StatusBadge>
          <StatusBadge status="success" icon={<CheckCircle />}>Success</StatusBadge>
          <StatusBadge status="warning" icon={<AlertTriangle />}>Warning</StatusBadge>
        </div>
      </section>

      {/* Size Variants */}
      <section>
        <h3 className="text-lg font-semibold mb-4">Size Variants</h3>
        <div className="flex items-center gap-4">
          <StatusBadge status="active" size="sm">Small</StatusBadge>
          <StatusBadge status="active" size="md">Medium</StatusBadge>
          <StatusBadge status="active" size="lg">Large</StatusBadge>
        </div>
      </section>

      {/* Status Indicators (Dots) */}
      <section>
        <h3 className="text-lg font-semibold mb-4">Status Indicators</h3>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <StatusIndicator status="online" />
            <span>Online</span>
          </div>
          <div className="flex items-center gap-2">
            <StatusIndicator status="warning" />
            <span>Warning</span>
          </div>
          <div className="flex items-center gap-2">
            <StatusIndicator status="error" />
            <span>Error</span>
          </div>
          <div className="flex items-center gap-2">
            <StatusIndicator status="processing" pulse />
            <span>Processing</span>
          </div>
        </div>
      </section>

      {/* Device Status Examples */}
      <section>
        <h3 className="text-lg font-semibold mb-4">Device Status Components</h3>
        
        {/* Icon variant (matches DeviceOverlay pattern) */}
        <div className="mb-4">
          <h4 className="text-md font-medium mb-2">Icon Variant (for DeviceOverlay)</h4>
          <div className="flex gap-4">
            <DeviceStatus 
              isOnline={true}
              deviceState="on"
              deviceType="light"
              deviceName="LED Light 1"
            />
            <DeviceStatus 
              isOnline={true}
              deviceState="off"
              deviceType="pump"
              deviceName="Water Pump"
            />
            <DeviceStatus 
              isOnline={false}
              deviceState="unavailable"
              deviceType="sensor"
              deviceName="Temperature Sensor"
            />
            <DeviceStatus 
              isOnline={true}
              deviceState="on"
              deviceType="fan"
              deviceName="Exhaust Fan"
            />
          </div>
        </div>

        {/* Badge variant (for device cards) */}
        <div className="mb-4">
          <h4 className="text-md font-medium mb-2">Badge Variant (for Device Cards)</h4>
          <div className="space-y-2">
            <DeviceStatus 
              variant="badge"
              isOnline={true}
              deviceState="on"
              deviceType="light"
              deviceName="LED Light 1"
              showStatusText
            />
            <DeviceStatus 
              variant="badge"
              isOnline={true}
              deviceState="off"
              deviceType="pump"
              deviceName="Water Pump"
              showConnectivityIcon
            />
            <DeviceStatus 
              variant="badge"
              isOnline={false}
              deviceState="unavailable"
              deviceType="sensor"
              deviceName="Temperature Sensor"
              showStatusText
              showConnectivityIcon
            />
          </div>
        </div>

        {/* Compact variant (for lists) */}
        <div>
          <h4 className="text-md font-medium mb-2">Compact Variant (for Lists)</h4>
          <div className="space-y-1">
            <DeviceStatus 
              variant="compact"
              isOnline={true}
              deviceState="on"
              deviceType="light"
              showStatusText
            />
            <DeviceStatus 
              variant="compact"
              isOnline={true}
              deviceState="off"
              deviceType="pump"
              showStatusText
            />
            <DeviceStatus 
              variant="compact"
              isOnline={false}
              deviceState="unavailable"
              deviceType="sensor"
              showStatusText
            />
          </div>
        </div>
      </section>

      {/* Migration Examples */}
      <section>
        <h3 className="text-lg font-semibold mb-4">Migration Examples</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Before: Manual implementation */}
          <div>
            <h4 className="text-md font-medium mb-2 text-red-600">❌ Before (Manual)</h4>
            <div className="p-4 bg-red-50 rounded-lg">
              <Badge className="bg-green-100 text-green-800">Active</Badge>
              <div className="mt-2 flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">Online</span>
              </div>
            </div>
          </div>

          {/* After: Standardized implementation */}
          <div>
            <h4 className="text-md font-medium mb-2 text-green-600">✅ After (Standardized)</h4>
            <div className="p-4 bg-green-50 rounded-lg">
              <StatusBadge status="active">Active</StatusBadge>
              <div className="mt-2 flex items-center gap-2">
                <StatusIndicator status="online" />
                <span className="text-sm">Online</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Outline Variants */}
      <section>
        <h3 className="text-lg font-semibold mb-4">Outline Variants</h3>
        <div className="flex flex-wrap gap-4">
          <StatusBadge status="outline-online">Online</StatusBadge>
          <StatusBadge status="outline-warning">Warning</StatusBadge>
          <StatusBadge status="outline-error">Error</StatusBadge>
          <StatusBadge status="outline-info">Info</StatusBadge>
        </div>
      </section>

    </div>
  )
}

/**
 * Migration Guidelines:
 * 
 * 1. Replace manual Badge implementations:
 *    Old: <Badge className="bg-green-100 text-green-800">Online</Badge>
 *    New: <StatusBadge status="online">Online</StatusBadge>
 * 
 * 2. Replace manual dot indicators:
 *    Old: <div className="w-2 h-2 bg-green-500 rounded-full"></div>
 *    New: <StatusIndicator status="online" />
 * 
 * 3. Replace device status implementations:
 *    Old: Complex DeviceStatusIndicator with manual color logic
 *    New: <DeviceStatus isOnline={true} deviceState="on" deviceType="light" />
 * 
 * 4. Use consistent status values:
 *    - online, offline, active, inactive
 *    - success, warning, error, info
 *    - pending, processing, failed
 *    - connected, disconnected, unavailable
 * 
 * 5. Leverage built-in accessibility:
 *    - All components include proper ARIA labels
 *    - Screen reader support is built-in
 *    - Focus management is handled automatically
 */ 