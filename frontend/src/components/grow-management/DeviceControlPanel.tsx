import { useState } from 'react';
import { supabase } from '@/supabaseClient';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { 
  Power, 
  Droplets, 
  Sun, 
  Wind, 
  Thermometer,
  Loader2,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface DeviceControlPanelProps {
  scheduleId: string;
  shelfId: string;
  shelfName: string;
}

interface DeviceControl {
  type: string;
  id: string;
  name: string;
  icon: React.ReactNode;
  actions: Array<{
    name: string;
    action: string;
    variant?: 'default' | 'destructive' | 'outline' | 'secondary';
  }>;
}

const deviceTypes: DeviceControl[] = [
  {
    type: 'light',
    id: 'main',
    name: 'Grow Lights',
    icon: <Sun className="h-4 w-4" />,
    actions: [
      { name: 'Turn On', action: 'turn_on' },
      { name: 'Turn Off', action: 'turn_off', variant: 'outline' },
      { name: 'Dim', action: 'dim', variant: 'secondary' }
    ]
  },
  {
    type: 'pump',
    id: 'main',
    name: 'Water Pump',
    icon: <Droplets className="h-4 w-4" />,
    actions: [
      { name: 'Start Watering', action: 'turn_on' },
      { name: 'Stop', action: 'turn_off', variant: 'destructive' }
    ]
  },
  {
    type: 'fan',
    id: 'main',
    name: 'Ventilation Fan',
    icon: <Wind className="h-4 w-4" />,
    actions: [
      { name: 'Turn On', action: 'turn_on' },
      { name: 'Turn Off', action: 'turn_off', variant: 'outline' }
    ]
  },
  {
    type: 'heater',
    id: 'main',
    name: 'Heater',
    icon: <Thermometer className="h-4 w-4" />,
    actions: [
      { name: 'Turn On', action: 'turn_on' },
      { name: 'Turn Off', action: 'turn_off', variant: 'outline' }
    ]
  }
];

export function DeviceControlPanel({ scheduleId, shelfId, shelfName }: DeviceControlPanelProps) {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [lastActions, setLastActions] = useState<Record<string, { action: string; status: 'success' | 'error'; timestamp: Date }>>({});

  const controlDevice = async (deviceType: string, deviceId: string, action: string) => {
    const controlKey = `${deviceType}-${deviceId}-${action}`;
    setLoadingStates(prev => ({ ...prev, [controlKey]: true }));

    try {
      // Call the immediate device control function
      const { data, error } = await supabase.rpc('control_device_immediate', {
        p_schedule_id: scheduleId,
        p_shelf_id: shelfId,
        p_device_type: deviceType,
        p_device_id: deviceId,
        p_action: action,
        p_parameters: {}
      });

      if (error) throw error;

      setLastActions(prev => ({
        ...prev,
        [deviceType]: {
          action: action,
          status: 'success',
          timestamp: new Date()
        }
      }));

      console.log(`Device control initiated: ${deviceType} ${action}`, data);
    } catch (error) {
      console.error('Device control error:', error);
      setLastActions(prev => ({
        ...prev,
        [deviceType]: {
          action: action,
          status: 'error',
          timestamp: new Date()
        }
      }));
    } finally {
      setLoadingStates(prev => ({ ...prev, [controlKey]: false }));
    }
  };

  const getLastActionStatus = (deviceType: string) => {
    const lastAction = lastActions[deviceType];
    if (!lastAction) return null;

    const isRecent = Date.now() - lastAction.timestamp.getTime() < 30000; // 30 seconds
    if (!isRecent) return null;

    return (
      <div className="flex items-center gap-1 text-xs">
        {lastAction.status === 'success' ? (
          <CheckCircle className="h-3 w-3 text-green-500" />
        ) : (
          <XCircle className="h-3 w-3 text-red-500" />
        )}
        <span className={lastAction.status === 'success' ? 'text-green-600' : 'text-red-600'}>
          {lastAction.action} {lastAction.status === 'success' ? 'sent' : 'failed'}
        </span>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Power className="h-5 w-5" />
          Device Control - {shelfName}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Immediate control of devices for this shelf
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {deviceTypes.map((device) => (
            <div key={`${device.type}-${device.id}`} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {device.icon}
                  <span className="font-medium">{device.name}</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {device.type}
                </Badge>
              </div>
              
              {getLastActionStatus(device.type)}
              
              <div className="flex flex-wrap gap-2 mt-3">
                {device.actions.map((actionConfig) => {
                  const controlKey = `${device.type}-${device.id}-${actionConfig.action}`;
                  const isLoading = loadingStates[controlKey];
                  
                  return (
                    <Button
                      key={actionConfig.action}
                      variant={actionConfig.variant || 'default'}
                      size="sm"
                      disabled={isLoading}
                      onClick={() => controlDevice(device.type, device.id, actionConfig.action)}
                      className="flex items-center gap-1"
                    >
                      {isLoading && <Loader2 className="h-3 w-3 animate-spin" />}
                      {actionConfig.name}
                    </Button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Real-time Control:</strong> Device commands are sent immediately to Home Assistant. 
            Environmental conditions are monitored automatically and devices may be controlled 
            automatically based on your grow recipe parameters.
          </p>
        </div>
      </CardContent>
    </Card>
  );
} 