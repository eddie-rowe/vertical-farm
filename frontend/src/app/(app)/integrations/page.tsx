'use client';

import { useState, useEffect } from 'react';
import { FaHome, FaPlug, FaCheck, FaExclamationTriangle, FaCog } from 'react-icons/fa';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { homeAssistantService, HAConnectionStatus } from '@/lib/services/homeAssistantService';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  status: 'connected' | 'disconnected' | 'error';
  deviceCount?: number;
  configuredAt?: string;
  setupUrl: string;
}

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    try {
      setLoading(true);
      
      // Check Home Assistant status
      let haStatus: HAConnectionStatus = { connected: false };
      try {
        haStatus = await homeAssistantService.getStatus();
      } catch (error) {
        console.log('Home Assistant not configured or not available');
      }

      const integrationsList: Integration[] = [
        {
          id: 'home-assistant',
          name: 'Home Assistant',
          description: 'Connect to Home Assistant for device control and automation',
          icon: <FaHome className="text-blue-600" />,
          status: haStatus.connected ? 'connected' : 'disconnected',
          deviceCount: haStatus.device_count,
          configuredAt: haStatus.last_updated,
          setupUrl: '/integrations/home-assistant',
        },
        // Future integrations can be added here
        {
          id: 'mqtt',
          name: 'MQTT Broker',
          description: 'Direct IoT device communication via MQTT protocol',
          icon: <FaPlug className="text-orange-600" />,
          status: 'disconnected',
          setupUrl: '/integrations/mqtt',
        },
        {
          id: 'modbus',
          name: 'Modbus TCP/RTU',
          description: 'Industrial device communication via Modbus protocol',
          icon: <FaCog className="text-gray-600" />,
          status: 'disconnected',
          setupUrl: '/integrations/modbus',
        },
      ];

      setIntegrations(integrationsList);
    } catch (error) {
      console.error('Error loading integrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: Integration['status']) => {
    switch (status) {
      case 'connected':
        return <FaCheck className="text-green-600" />;
      case 'error':
        return <FaExclamationTriangle className="text-red-600" />;
      default:
        return <FaPlug className="text-gray-400" />;
    }
  };

  const getStatusBadge = (status: Integration['status']) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-100 text-green-800">Connected</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800">Error</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Not Connected</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Integrations</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Connect your vertical farm to external systems and devices
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {integrations.map((integration) => (
          <Card key={integration.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{integration.icon}</div>
                  <div>
                    <CardTitle className="text-lg">{integration.name}</CardTitle>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(integration.status)}
                  {getStatusBadge(integration.status)}
                </div>
              </div>
              <CardDescription className="mt-2">
                {integration.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {integration.status === 'connected' && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {integration.deviceCount && (
                      <p>{integration.deviceCount} devices connected</p>
                    )}
                    {integration.configuredAt && (
                      <p>Last updated: {new Date(integration.configuredAt).toLocaleDateString()}</p>
                    )}
                  </div>
                )}
                
                <div className="pt-2">
                  <Button asChild className="w-full">
                    <Link href={integration.setupUrl}>
                      {integration.status === 'connected' ? 'Manage' : 'Setup'}
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <div className="flex items-start space-x-3">
          <FaPlug className="text-blue-600 mt-1" />
          <div>
            <h3 className="font-semibold text-blue-900 dark:text-blue-100">More Integrations Coming Soon</h3>
            <p className="text-blue-700 dark:text-blue-300 mt-1">
              We're working on additional integrations including Zigbee, Z-Wave, and direct sensor protocols. 
              Have a specific integration request? Let us know!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 