import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Zap, 
  MousePointer, 
  Menu, 
  Bell, 
  Thermometer,
  Activity,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'
import { useToastHelpers } from '@/components/ui/ToastNotification'
import { RippleButton } from '@/components/ui/RippleButton'
import { AdvancedTooltip } from '@/components/ui/AdvancedTooltip'
import { 
  ContextualMenu, 
  getShelfActions 
} from '@/components/ui/ContextualMenu'

export const Phase2Demo: React.FC = () => {
  const [demoStep, setDemoStep] = useState(0)
  const { 
    showSuccess, 
    showError, 
    showWarning, 
    showInfo,
    showDeviceAlert,
    showEnvironmentalAlert 
  } = useToastHelpers()

  const demoEnvironmentalData = {
    temperature: {
      current: 24,
      target: 22,
      unit: 'C' as const,
      status: 'warning' as const
    },
    humidity: {
      current: 68,
      target: 65,
      status: 'optimal' as const
    },
    lightLevel: {
      current: 750,
      target: 800,
      unit: 'lux' as const,
      status: 'warning' as const
    },
    ph: {
      current: 6.3,
      target: 6.5,
      status: 'optimal' as const
    }
  }

  const demoDeviceStatus = {
    connectivity: 'connected' as const,
    lastUpdate: new Date().toISOString(),
    batteryLevel: 85
  }

  const demoAlerts = [
    {
      id: 'demo-alert-1',
      message: 'Temperature slightly above target range',
      severity: 'medium' as const,
      timestamp: new Date().toISOString()
    },
    {
      id: 'demo-alert-2',
      message: 'Light sensor calibration recommended',
      severity: 'low' as const,
      timestamp: new Date(Date.now() - 3600000).toISOString()
    }
  ]

  const demoActions = getShelfActions(
    () => showInfo('Edit Action', 'Edit functionality would open here'),
    () => showInfo('View Details', 'Detailed shelf information modal would open'),
    () => showSuccess('Device Added', 'New device assignment created'),
    () => showInfo('Clone Shelf', 'Shelf cloning functionality activated'),
    () => showWarning('Delete Shelf', 'Are you sure? This action cannot be undone'),
    () => showInfo('Manage Devices', 'Device management interface would open'),
    () => showInfo('View Metrics', 'Analytics dashboard would open'),
    () => showSuccess('New Grow Started', 'Grow wizard would open here'),
    () => showInfo('Grow Details', 'Current grow status and details would open'),
    () => showWarning('Grow Paused', 'Current grow has been paused'),
    () => showSuccess('Grow Resumed', 'Current grow has been resumed'),
    () => showSuccess('Harvest Complete', 'Grow harvest process initiated'),
    false // hasActiveGrow - demo shelf has no active grow
  )

  const demoFeatures = [
    {
      title: 'Ripple Effects',
      description: 'Click any interactive element to see smooth ripple animations',
      icon: <MousePointer className="w-5 h-5" />,
      action: () => {
        showInfo('Ripple Demo', 'Try clicking the demo elements below to see ripple effects!')
        setDemoStep(1)
      }
    },
    {
      title: 'Advanced Tooltips',
      description: 'Hover over farm elements to see detailed environmental data',
      icon: <Activity className="w-5 h-5" />,
      action: () => {
        showInfo('Tooltip Demo', 'Hover over the demo shelf element below to see rich tooltip data!')
        setDemoStep(2)
      }
    },
    {
      title: 'Contextual Menus',
      description: 'Right-click farm elements for quick action menus',
      icon: <Menu className="w-5 h-5" />,
      action: () => {
        showInfo('Context Menu Demo', 'Right-click the demo element below to see the action menu!')
        setDemoStep(3)
      }
    },
    {
      title: 'Smart Notifications',
      description: 'Real-time alerts and feedback system',
      icon: <Bell className="w-5 h-5" />,
      action: () => {
        showInfo('Toast Demo', 'Demonstrating various notification types!')
        setDemoStep(4)
        
        // Demo different toast types
        setTimeout(() => showSuccess('Success!', 'Operation completed successfully'), 500)
        setTimeout(() => showWarning('Warning', 'Temperature approaching limits'), 1000)
        setTimeout(() => showError('Error', 'Sensor connection lost', {
          label: 'Retry',
          onClick: () => showSuccess('Reconnected', 'Sensor is back online')
        }), 1500)
        setTimeout(() => showDeviceAlert('Humidity Sensor #1', 'connected'), 2000)
        setTimeout(() => showEnvironmentalAlert('Shelf A1', 'Temperature', '28°C', 'warning'), 2500)
      }
    }
  ]

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Zap className="w-6 h-6 text-blue-500" />
            <div>
              <CardTitle>Phase 2: Interactive Farm Elements</CardTitle>
              <CardDescription>
                Enhanced user experience with ripple effects, advanced tooltips, contextual menus, and smart notifications
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {demoFeatures.map((feature, index) => (
              <Card 
                key={feature.title}
                className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                  demoStep === index + 1 ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                      {feature.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">
                        {feature.description}
                      </p>
                      <Button
                        onClick={feature.action}
                        size="sm"
                        variant="outline"
                        className="w-full"
                      >
                        Try It
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Interactive Demo Elements */}
          <div className="border-t pt-6 space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Interactive Demo Elements
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Ripple Demo */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">Ripple Effects</Badge>
                  {demoStep === 1 && <Badge className="text-xs animate-pulse">Active Demo</Badge>}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <RippleButton
                    className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-center"
                    rippleColor="rgba(59, 130, 246, 0.4)"
                  >
                    <div className="text-sm font-medium text-blue-700 dark:text-blue-300">
                      Click Me!
                    </div>
                  </RippleButton>
                  <RippleButton
                    className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-center"
                    rippleColor="rgba(34, 197, 94, 0.4)"
                  >
                    <div className="text-sm font-medium text-green-700 dark:text-green-300">
                      Or Me!
                    </div>
                  </RippleButton>
                </div>
              </div>

              {/* Tooltip Demo */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">Advanced Tooltips</Badge>
                  {demoStep === 2 && <Badge className="text-xs animate-pulse">Active Demo</Badge>}
                </div>
                <AdvancedTooltip
                  title="Demo Shelf A1"
                  elementType="shelf"
                  environmentalData={demoEnvironmentalData}
                  deviceStatus={demoDeviceStatus}
                  deviceCount={3}
                  alerts={demoAlerts}
                  side="top"
                >
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg cursor-help">
                    <div className="flex items-center gap-2 mb-2">
                      <Thermometer className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                      <span className="text-sm font-medium text-slate-800 dark:text-slate-100">
                        Demo Shelf A1
                      </span>
                      <Badge variant="destructive" className="text-xs">
                        2 alerts
                      </Badge>
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-300">
                      Hover for environmental details
                    </div>
                  </div>
                </AdvancedTooltip>
              </div>

              {/* Context Menu Demo */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">Contextual Menus</Badge>
                  {demoStep === 3 && <Badge className="text-xs animate-pulse">Active Demo</Badge>}
                </div>
                <ContextualMenu
                  trigger={
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg cursor-context-menu">
                      <div className="flex items-center gap-2 mb-2">
                        <Menu className="w-4 h-4 text-purple-600 dark:text-purple-300" />
                        <span className="text-sm font-medium text-purple-800 dark:text-purple-100">
                          Demo Element
                        </span>
                      </div>
                      <div className="text-xs text-purple-600 dark:text-purple-300">
                        Right-click for actions
                      </div>
                    </div>
                  }
                  actions={demoActions}
                  elementType="shelf"
                  elementName="Demo Shelf"
                />
              </div>

              {/* Notification Demo */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">Smart Notifications</Badge>
                  {demoStep === 4 && <Badge className="text-xs animate-pulse">Active Demo</Badge>}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => showDeviceAlert('Sensor #42', 'connected')}
                    size="sm"
                    variant="outline"
                    className="text-xs"
                  >
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Device Alert
                  </Button>
                  <Button
                    onClick={() => showEnvironmentalAlert('Test Area', 'pH Level', '7.2', 'critical')}
                    size="sm"
                    variant="outline"
                    className="text-xs"
                  >
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Env Alert
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Implementation Notes */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">
              Implementation Notes
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-slate-800 dark:text-slate-200 mb-2">
                  New Components Added:
                </h4>
                <ul className="space-y-1 text-slate-600 dark:text-slate-300">
                  <li>• RippleButton - Click feedback effects</li>
                  <li>• AdvancedTooltip - Rich environmental data display</li>
                  <li>• ContextualMenu - Right-click action menus</li>
                  <li>• ToastNotification - Smart alert system</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-slate-800 dark:text-slate-200 mb-2">
                  Enhanced Features:
                </h4>
                <ul className="space-y-1 text-slate-600 dark:text-slate-300">
                  <li>• Enhanced hover states with smooth transitions</li>
                  <li>• Real-time environmental data visualization</li>
                  <li>• Alert indicators with priority levels</li>
                  <li>• Accessibility improvements (keyboard nav)</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 