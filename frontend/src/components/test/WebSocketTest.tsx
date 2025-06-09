'use client';

import React, { useState, useEffect } from 'react';
import { homeAssistantService, HADevice } from '@/services/homeAssistantService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function WebSocketTest() {
  const [isConnected, setIsConnected] = useState(false);
  const [devices, setDevices] = useState<HADevice[]>([]);
  const [updates, setUpdates] = useState<string[]>([]);
  const [subscriptions, setSubscriptions] = useState<Map<string, () => void>>(new Map());

  useEffect(() => {
    // Check connection status
    const checkStatus = async () => {
      try {
        const status = await homeAssistantService.getStatus();
        setIsConnected(status.connected);
      } catch (error) {
        console.error('Failed to check status:', error);
      }
    };

    checkStatus();
  }, []);

  const loadDevices = async () => {
    try {
      const deviceList = await homeAssistantService.getDevices();
      setDevices(deviceList.slice(0, 5)); // Show first 5 devices for testing
    } catch (error) {
      console.error('Failed to load devices:', error);
    }
  };

  const subscribeToDevice = (device: HADevice) => {
    if (subscriptions.has(device.entity_id)) {
      return; // Already subscribed
    }

    const unsubscribe = homeAssistantService.createDeviceSubscription(
      device.entity_id,
      (updatedDevice: HADevice) => {
        setUpdates(prev => [
          `${new Date().toLocaleTimeString()}: ${updatedDevice.entity_id} → ${updatedDevice.state}`,
          ...prev.slice(0, 9) // Keep last 10 updates
        ]);

        // Update device in list
        setDevices(prev => prev.map(d => 
          d.entity_id === updatedDevice.entity_id ? updatedDevice : d
        ));
      }
    );

    setSubscriptions(prev => new Map(prev).set(device.entity_id, unsubscribe));
  };

  const unsubscribeFromDevice = (entityId: string) => {
    const unsubscribe = subscriptions.get(entityId);
    if (unsubscribe) {
      unsubscribe();
      setSubscriptions(prev => {
        const newMap = new Map(prev);
        newMap.delete(entityId);
        return newMap;
      });
    }
  };

  const disconnectWebSocket = () => {
    homeAssistantService.disconnectWebSocket();
    setSubscriptions(new Map());
    setUpdates([]);
  };

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Home Assistant WebSocket Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <Badge variant={isConnected ? "default" : "secondary"}>
              {isConnected ? "Connected" : "Disconnected"}
            </Badge>
            <Button onClick={loadDevices}>Load Devices</Button>
            <Button onClick={disconnectWebSocket} variant="outline">
              Disconnect WebSocket
            </Button>
          </div>
        </CardContent>
      </Card>

      {devices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Devices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {devices.map((device) => (
                <div key={device.entity_id} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex-1">
                    <div className="font-medium">{device.friendly_name || device.entity_id}</div>
                    <div className="text-sm text-gray-500">{device.entity_id}</div>
                    <Badge variant={device.state === 'on' ? 'default' : 'secondary'}>
                      {device.state}
                    </Badge>
                  </div>
                  <div className="flex space-x-2">
                    {subscriptions.has(device.entity_id) ? (
                      <Button 
                        onClick={() => unsubscribeFromDevice(device.entity_id)}
                        variant="outline"
                        size="sm"
                      >
                        Unsubscribe
                      </Button>
                    ) : (
                      <Button 
                        onClick={() => subscribeToDevice(device)}
                        size="sm"
                      >
                        Subscribe
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {updates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Real-time Updates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {updates.map((update, index) => (
                <div key={index} className="text-sm font-mono p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  {update}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 