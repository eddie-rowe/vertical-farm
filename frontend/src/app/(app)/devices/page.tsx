"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FarmControlButton } from "@/components/ui/farm-control-button";
import { Badge } from "@/components/ui/badge";
import { FarmSelect } from "@/components/ui/farm-select";
import { FarmInput } from "@/components/ui/farm-input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/ui/PageHeader";
import { 
  FaPlug, 
  FaHome, 
  FaCog, 
  FaWifi, 
  FaLightbulb, 
  FaFan, 
  FaTint, 
  FaThermometerHalf,
  FaSearch, 
  FaPlus,
  FaBook,
  FaQuestionCircle,
  FaCheckCircle,
  FaExclamationTriangle,
  Layers,
  Info,
  FaBuilding
} from '@/lib/icons';
import { 
  Zap,
  Home,
  Settings,
  Wifi,
  Plus,
  BookOpen,
  HelpCircle,
  ChevronRight,
  ExternalLink,
  Download,
  Play,
  Activity,
  Shield,
  MapPin,
  AlertTriangle
} from "lucide-react";
import { EmptyStateWithIntegrations } from '@/components/features/automation';
import { DEVICE_INTEGRATIONS } from '@/lib/integrations/constants';
import { usePageData } from '@/components/shared/hooks/usePageData';
import { MetricsGrid } from '@/components/shared/metrics';

const tabs = [
  {
    id: 'overview',
    label: 'Overview',
    icon: <Layers className="text-sensor-value gradient-icon" />,
    description: 'Device status and health dashboard'
  },
  {
    id: 'all-devices',
    label: 'All Devices',
    icon: <FaCog className="text-control-label gradient-icon" />,
    description: 'Unified device management and control'
  },
  {
    id: 'integrations',
    label: 'Integrations',
    icon: <FaWifi className="text-control-secondary gradient-icon" />,
    description: 'Manage connection sources and health'
  },
  {
    id: 'assignments',
    label: 'Assignments',
    icon: <MapPin className="text-farm-accent gradient-icon" />,
    description: 'Farm layout and device placement'
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: <FaBuilding className="text-control-secondary gradient-icon" />,
    description: 'Global device management configuration'
  }
];

// Mock data interface to simulate device management data
interface DeviceData {
  totalDevices: number;
  onlineDevices: number;
  integrationCount: number;
  hasData: boolean;
}

const DeviceManagementPage = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState("");

  // Use our standardized data loading hook
  const { data: deviceData, isLoading } = usePageData<DeviceData>({
    storageKey: 'device-integrations-connected',
    mockData: {
      totalDevices: 47,
      onlineDevices: 43,
      integrationCount: 3,
      hasData: true
    }
  });

  const activeTabData = tabs.find(tab => tab.id === activeTab);

  const handleConnectIntegration = (integrationName: string) => {
    console.log(`Connecting to ${integrationName}...`);
    // This would typically redirect to integration setup
    const integrationSlug = integrationName.toLowerCase().replace(/\s+/g, '-');
    window.location.href = `/integrations/${integrationSlug}`;
  };

  const deviceIntegrationsWithHandlers = DEVICE_INTEGRATIONS.map(integration => ({
    ...integration,
    onConnect: () => handleConnectIntegration(integration.name)
  }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-farm-accent"></div>
      </div>
    );
  }

  // Show empty state if no device data
  if (!deviceData?.hasData) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Device Management"
          description="Monitor, control, and configure all connected devices across your farm"
        />

        <EmptyStateWithIntegrations
          pageType="devices"
          title="Connect Your Farm Devices"
          description="Integrate with smart home platforms, IoT systems, and hardware controllers to manage lights, pumps, sensors, and automation throughout your vertical farm."
          integrations={deviceIntegrationsWithHandlers}
        />
      </div>
    );
  }

  // Full dashboard view when data exists
  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader
        title="Device Management"
        description="Monitor, control, and configure all connected devices across your farm"
      />

      {/* Quick Actions */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
        <div className="flex items-center gap-2">
          <FarmControlButton size="sm" className="state-active">
            <FaPlus className="h-4 w-4 mr-2" />
            Add Integration
          </FarmControlButton>
                     <FarmControlButton variant="default" size="sm">
             <FaWifi className="h-4 w-4 mr-2" />
             Refresh All
           </FarmControlButton>
           <FarmControlButton variant="default" size="sm">
             <FaCog className="h-4 w-4 mr-2" />
             Settings
           </FarmControlButton>
        </div>
      </div>

      {/* Quick Metrics */}
      <MetricsGrid 
        columns={4}
        metrics={[
          {
            id: 'total-devices',
            label: 'Total Devices',
            value: deviceData?.totalDevices?.toString() || "0",
            icon: () => <FaCog className="text-farm-accent" />,
            stateClass: 'state-active'
          },
          {
            id: 'online-devices',
            label: 'Online Devices',
            value: deviceData?.onlineDevices?.toString() || "0",
            icon: () => <FaCheckCircle className="text-green-600" />,
            stateClass: 'state-growing'
          },
          {
            id: 'integrations',
            label: 'Integrations',
            value: deviceData?.integrationCount?.toString() || "0",
            icon: () => <FaWifi className="text-blue-600" />,
            stateClass: 'state-active'
          },
          {
            id: 'alerts',
            label: 'Active Alerts',
            value: "2",
            icon: () => <AlertTriangle className="text-orange-600" />,
            stateClass: 'state-maintenance'
          }
        ]}
      />

      {/* Main Tab Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
              {tab.icon}
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Controls Section */}
          <Card className="card-shadow">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
                {/* Filter Options */}
                <FarmSelect
                  value="all"
                  onChange={() => {}}
                  options={[
                    { value: 'all', label: 'All Integrations' },
                    { value: 'home-assistant', label: 'Home Assistant' },
                    { value: 'smartthings', label: 'SmartThings' },
                    { value: 'arduino', label: 'Arduino Cloud' }
                  ]}
                  placeholder="Filter by Integration"
                />

                <FarmSelect
                  value="all"
                  onChange={() => {}}
                  options={[
                    { value: 'all', label: 'All Device Types' },
                    { value: 'lights', label: 'Lights' },
                    { value: 'sensors', label: 'Sensors' },
                    { value: 'pumps', label: 'Pumps & Valves' },
                    { value: 'fans', label: 'Fans & Climate' }
                  ]}
                  placeholder="Filter by Type"
                />

                {/* Search */}
                <div className="flex-1 min-w-0">
                  <FarmInput
                    placeholder="Search devices, locations, integrations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Integration Health Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="card-shadow">
              <CardHeader>
                <CardTitle className="text-farm-title flex items-center gap-2">
                  <FaHome className="text-orange-600" />
                  Home Assistant
                </CardTitle>
                <CardDescription className="text-control-label">Smart home automation platform</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-control-label">Status</span>
                    <Badge className="state-growing">Connected</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-control-label">Devices</span>
                    <span className="text-sensor-value">24</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-control-label">Last Sync</span>
                    <span className="text-control-label opacity-70">2 minutes ago</span>
                  </div>
                  <Separator />
                  <FarmControlButton size="sm" variant="default" className="w-full">
                    <FaCog className="h-4 w-4 mr-2" />
                    Manage
                  </FarmControlButton>
                </div>
              </CardContent>
            </Card>

            <Card className="card-shadow">
              <CardHeader>
                <CardTitle className="text-farm-title flex items-center gap-2">
                  <FaWifi className="text-blue-600" />
                  Arduino Cloud
                </CardTitle>
                <CardDescription className="text-control-label">Custom sensor platform</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-control-label">Status</span>
                    <Badge className="state-growing">Connected</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-control-label">Devices</span>
                    <span className="text-sensor-value">12</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-control-label">Last Sync</span>
                    <span className="text-control-label opacity-70">5 minutes ago</span>
                  </div>
                  <Separator />
                  <FarmControlButton size="sm" variant="default" className="w-full">
                    <FaCog className="h-4 w-4 mr-2" />
                    Manage
                  </FarmControlButton>
                </div>
              </CardContent>
            </Card>

            <Card className="card-shadow">
              <CardHeader>
                <CardTitle className="text-farm-title flex items-center gap-2">
                  <FaWifi className="text-purple-600" />
                  SmartThings
                </CardTitle>
                <CardDescription className="text-control-label">Samsung IoT platform</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-control-label">Status</span>
                    <Badge className="state-growing">Connected</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-control-label">Devices</span>
                    <span className="text-sensor-value">11</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-control-label">Last Sync</span>
                    <span className="text-control-label opacity-70">1 minute ago</span>
                  </div>
                  <Separator />
                  <FarmControlButton size="sm" variant="default" className="w-full">
                    <FaCog className="h-4 w-4 mr-2" />
                    Manage
                  </FarmControlButton>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card className="card-shadow">
            <CardHeader>
              <CardTitle className="text-farm-title">Recent Device Activity</CardTitle>
              <CardDescription className="text-control-label">Latest device state changes and events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    device: "Row A Rack 1 LED Array",
                    action: "Turned ON",
                    time: "2 minutes ago",
                    integration: "Home Assistant",
                    icon: FaLightbulb,
                    color: "text-yellow-600"
                  },
                  {
                    device: "Nutrient Pump #3",
                    action: "Cycle completed",
                    time: "8 minutes ago",
                    integration: "Arduino Cloud",
                    icon: FaTint,
                    color: "text-blue-600"
                  },
                  {
                    device: "Exhaust Fan System",
                    action: "Speed adjusted to 75%",
                    time: "12 minutes ago",
                    integration: "SmartThings",
                    icon: FaFan,
                    color: "text-green-600"
                  },
                  {
                    device: "Temperature Sensor B2",
                    action: "Reading: 74.2°F",
                    time: "15 minutes ago",
                    integration: "Home Assistant",
                    icon: FaThermometerHalf,
                    color: "text-orange-600"
                  }
                ].map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <activity.icon className={`${activity.color}`} />
                      <div>
                        <p className="text-control-label font-medium">{activity.device}</p>
                        <p className="text-control-label opacity-70">{activity.action}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-control-label opacity-70">{activity.time}</p>
                      <Badge variant="outline" className="text-xs">
                        {activity.integration}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all-devices" className="space-y-6">
          <Card className="card-shadow">
            <CardHeader>
              <CardTitle className="text-farm-title">All Connected Devices</CardTitle>
              <CardDescription className="text-control-label">Unified view of all devices across integrations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <FaCog className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-farm-title font-semibold mb-2">Device List View</h3>
                <p className="text-control-label">
                  This would show a comprehensive list of all devices with filtering, sorting, and bulk actions.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <Card className="card-shadow">
            <CardHeader>
              <CardTitle className="text-farm-title">Integration Management</CardTitle>
              <CardDescription className="text-control-label">Configure and monitor your device integration sources</CardDescription>
            </CardHeader>
            <CardContent>
                             <div className="text-center py-8">
                 <FaWifi className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                 <h3 className="text-farm-title font-semibold mb-2">Integration Settings</h3>
                <p className="text-control-label">
                  Configure connection settings, sync intervals, and troubleshoot integration issues.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignments" className="space-y-6">
          <Card className="card-shadow">
            <CardHeader>
              <CardTitle className="text-farm-title">Device Farm Assignments</CardTitle>
              <CardDescription className="text-control-label">Assign devices to specific farm locations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-farm-title font-semibold mb-2">Farm Layout Map</h3>
                <p className="text-control-label">
                  Visual farm layout showing device assignments to rows, racks, and shelves.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card className="card-shadow">
            <CardHeader>
              <CardTitle className="text-farm-title">Global Device Settings</CardTitle>
              <CardDescription className="text-control-label">Configure device management preferences and defaults</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-farm-title font-semibold mb-2">System Configuration</h3>
                <p className="text-control-label">
                  Global settings for device discovery, naming conventions, and automation rules.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DeviceManagementPage; 