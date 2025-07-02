'use client';

import React, { useState, useEffect } from 'react';
import { Cog6ToothIcon, LightBulbIcon, BeakerIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { EmptyStateWithIntegrations, IntegrationHint } from '@/components/features/automation';
import { DEVICE_INTEGRATIONS, INTEGRATION_MESSAGES, INTEGRATION_CONTEXTS } from '@/lib/integrations/constants';
import { PageHeader } from '@/components/ui/PageHeader';

// Mock data to simulate existing device data
interface DeviceData {
  connectedDevices: number;
  activeAutomations: number;
  hasData: boolean;
}

const DevicesPage: React.FC = () => {
  const [deviceData, setDeviceData] = useState<DeviceData>({
    connectedDevices: 0,
    activeAutomations: 0,
    hasData: false
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading device data
    const loadDeviceData = async () => {
      setIsLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if user has connected device integrations
      const hasConnectedDevices = localStorage.getItem('device-integrations-connected');
      
      if (hasConnectedDevices) {
        setDeviceData({
          connectedDevices: 8,
          activeAutomations: 5,
          hasData: true
        });
      } else {
        setDeviceData({
          connectedDevices: 0,
          activeAutomations: 0,
          hasData: false
        });
      }
      
      setIsLoading(false);
    };

    loadDeviceData();
  }, []);

  const handleConnectIntegration = (integrationName: string) => {
    console.log(`Connecting to ${integrationName}...`);
    // This would typically redirect to integration setup
    window.location.href = `/integrations/${integrationName.toLowerCase().replace(/\s+/g, '-')}`;
  };

  const deviceIntegrationsWithHandlers = DEVICE_INTEGRATIONS.map(integration => ({
    ...integration,
    onConnect: () => handleConnectIntegration(integration.name)
  }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show empty state if no device data
  if (!deviceData.hasData) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Device Control & Automation"
          description="Monitor and automate your vertical farm devices, sensors, and environmental controls."
        />

        <EmptyStateWithIntegrations
          pageType="devices"
          title="Automate Your Farm Devices"
          description="Connect smart home and IoT platforms to control lights, pumps, fans, and sensors throughout your vertical farm."
          integrations={deviceIntegrationsWithHandlers}
        />
      </div>
    );
  }

  // Show dashboard with integration hints
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Device Control & Automation"
        description="Monitor and automate your vertical farm devices, sensors, and environmental controls."
      />

      {/* Integration Hint */}
      <IntegrationHint
        message={INTEGRATION_MESSAGES.devices}
        integrations={['Home Assistant', 'Arduino Cloud', 'AWS IoT Core', 'SmartThings']}
        pageContext={INTEGRATION_CONTEXTS.devices}
        variant="info"
      />

      {/* Device Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Cog6ToothIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Connected Devices</dt>
                  <dd className="text-lg font-medium text-gray-900">{deviceData.connectedDevices}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BeakerIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Active Automations</dt>
                  <dd className="text-lg font-medium text-gray-900">{deviceData.activeAutomations}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Device Controls Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Lighting Control */}
        <div className="bg-white shadow rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-900">LED Lights</h3>
            <LightBulbIcon className="h-5 w-5 text-yellow-500" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Zone A</span>
              <span className="text-green-600">ON</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Zone B</span>
              <span className="text-green-600">ON</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Zone C</span>
              <span className="text-gray-400">OFF</span>
            </div>
          </div>
        </div>

        {/* Water Pumps */}
        <div className="bg-white shadow rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-900">Water Pumps</h3>
            <BeakerIcon className="h-5 w-5 text-blue-500" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Main Pump</span>
              <span className="text-green-600">ACTIVE</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Backup Pump</span>
              <span className="text-gray-400">STANDBY</span>
            </div>
          </div>
        </div>

        {/* Ventilation */}
        <div className="bg-white shadow rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-900">Ventilation</h3>
            <ArrowPathIcon className="h-5 w-5 text-purple-500" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Intake Fan</span>
              <span className="text-green-600">RUNNING</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Exhaust Fan</span>
              <span className="text-green-600">RUNNING</span>
            </div>
          </div>
        </div>

        {/* Sensors */}
        <div className="bg-white shadow rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-900">Sensors</h3>
            <Cog6ToothIcon className="h-5 w-5 text-green-500" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Temperature</span>
              <span className="text-gray-900">72°F</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Humidity</span>
              <span className="text-gray-900">65%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">pH Level</span>
              <span className="text-gray-900">6.2</span>
            </div>
          </div>
        </div>
      </div>

      {/* Automation Rules */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Active Automation Rules</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <span className="text-sm font-medium text-gray-900">Light Schedule</span>
              <p className="text-xs text-gray-600">Turn on lights at 6 AM, off at 10 PM</p>
            </div>
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Active</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <span className="text-sm font-medium text-gray-900">Watering Cycle</span>
              <p className="text-xs text-gray-600">Water plants every 4 hours for 10 minutes</p>
            </div>
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Active</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <span className="text-sm font-medium text-gray-900">Temperature Control</span>
              <p className="text-xs text-gray-600">Activate fans when temperature &gt; 75°F</p>
            </div>
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DevicesPage; 