'use client';

import { useState, useEffect } from 'react';
import { FaLightbulb, FaPlug, FaFan, FaThermometerHalf, FaToggleOn, FaToggleOff } from 'react-icons/fa';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

import { HADevice, homeAssistantService } from '@/lib/services/homeAssistantService';

interface DeviceControlPanelProps {
  device: HADevice;
  onUpdate?: (device: HADevice) => void;
  compact?: boolean;
}

export default function DeviceControlPanel({ device, onUpdate, compact = false }: DeviceControlPanelProps) {
  const [isControlling, setIsControlling] = useState(false);
  const [brightness, setBrightness] = useState(
    device.attributes?.brightness ? Math.round((device.attributes.brightness / 255) * 100) : 100
  );

  useEffect(() => {
    // Set up WebSocket subscription for real-time updates
    const cleanup = homeAssistantService.createDeviceSubscription(device.entity_id, (updatedDevice) => {
      if (onUpdate) {
        onUpdate(updatedDevice);
      }
      // Update brightness if it's a light
      if (updatedDevice.attributes?.brightness) {
        setBrightness(Math.round((updatedDevice.attributes.brightness / 255) * 100));
      }
    });

    return cleanup;
  }, [device.entity_id, onUpdate]);

  const getDeviceIcon = (deviceType: string, isOn: boolean) => {
    const iconClass = `text-2xl ${isOn ? 'text-green-500' : 'text-gray-400'}`;
    switch (deviceType) {
      case 'light': return <FaLightbulb className={iconClass} />;
      case 'switch': return <FaPlug className={iconClass} />;
      case 'fan': return <FaFan className={iconClass} />;
      case 'sensor': return <FaThermometerHalf className={iconClass} />;
      default: return <FaPlug className={iconClass} />;
    }
  };

  const handleToggle = async () => {
    setIsControlling(true);
    try {
      const action = device.state === 'on' ? 'turn_off' : 'turn_on';
      if (device.device_type === 'light') {
        await homeAssistantService.controlLight(device.entity_id, action);
      } else {
        await homeAssistantService.controlDevice({
          entity_id: device.entity_id,
          action
        });
      }
    } catch (error) {
      console.error('Error controlling device:', error);
    } finally {
      setIsControlling(false);
    }
  };

  const handleBrightnessChange = async (value: number[]) => {
    const newBrightness = value[0];
    setBrightness(newBrightness);
    
    // Debounced brightness control
    setIsControlling(true);
    try {
      await homeAssistantService.controlLight(device.entity_id, 'turn_on', {
        brightness: Math.round((newBrightness / 100) * 255)
      });
    } catch (error) {
      console.error('Error setting brightness:', error);
    } finally {
      setIsControlling(false);
    }
  };

  const isOn = device.state === 'on';
  const isControllable = device.device_type === 'light' || device.device_type === 'switch' || device.device_type === 'fan';

  if (compact) {
    return (
      <div className="flex items-center justify-between p-3 border rounded-lg">
        <div className="flex items-center space-x-3">
          {getDeviceIcon(device.device_type, isOn)}
          <div>
            <div className="font-medium">{device.name}</div>
            <div className="text-sm text-gray-500">{device.entity_id}</div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={isOn ? 'default' : 'secondary'}>
            {device.state}
          </Badge>
          {isControllable && (
            <Switch
              checked={isOn}
              onCheckedChange={handleToggle}
              disabled={isControlling}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getDeviceIcon(device.device_type, isOn)}
            <div>
              <CardTitle className="text-lg">{device.name}</CardTitle>
              <CardDescription>{device.entity_id}</CardDescription>
            </div>
          </div>
          <Badge variant={isOn ? 'default' : 'secondary'}>
            {device.state}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Device Information */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <Label className="text-gray-500">Type</Label>
            <div className="capitalize">{device.device_type}</div>
          </div>
          {device.device_class && (
            <div>
              <Label className="text-gray-500">Class</Label>
              <div className="capitalize">{device.device_class}</div>
            </div>
          )}
          {device.area && (
            <div>
              <Label className="text-gray-500">Area</Label>
              <div>{device.area}</div>
            </div>
          )}
          {device.unit_of_measurement && (
            <div>
              <Label className="text-gray-500">Unit</Label>
              <div>{device.unit_of_measurement}</div>
            </div>
          )}
        </div>

        {/* Controls */}
        {isControllable && (
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center justify-between">
              <Label>Power</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={isOn}
                  onCheckedChange={handleToggle}
                  disabled={isControlling}
                />
                <Label>{isOn ? 'On' : 'Off'}</Label>
              </div>
            </div>

            {/* Brightness control for lights - simplified for now */}
            {device.device_type === 'light' && isOn && device.attributes?.brightness && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Brightness</Label>
                  <span className="text-sm text-gray-500">{brightness}%</span>
                </div>
                <div className="text-xs text-gray-500">
                  Current brightness: {Math.round((device.attributes.brightness / 255) * 100)}%
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleToggle()}
                disabled={isControlling}
                className="flex-1"
              >
                {isOn ? (
                  <>
                    <FaToggleOff className="mr-2" />
                    Turn Off
                  </>
                ) : (
                  <>
                    <FaToggleOn className="mr-2" />
                    Turn On
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Sensor Readings */}
        {device.device_type === 'sensor' && (
          <div className="border-t pt-4">
            <Label className="text-gray-500">Current Reading</Label>
            <div className="text-2xl font-bold">
              {device.state} {device.unit_of_measurement}
            </div>
            {device.attributes && Object.keys(device.attributes).length > 0 && (
              <div className="mt-2 space-y-1">
                {Object.entries(device.attributes).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <span className="text-gray-500 capitalize">{key.replace(/_/g, ' ')}:</span>
                    <span>{String(value)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 