"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Lightbulb, 
  Waves, 
  Fan, 
  Thermometer, 
  Droplets, 
  Zap, 
  Power, 
  Settings, 
  Search,
  MoreVertical,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';
import { FarmPageData } from "@/types/farm-layout";

interface DevicesControlsViewProps {
  farmPageData: FarmPageData | null;
}

// Mock device data - replace with actual data fetching
const mockDevices = [
  {
    id: '1',
    name: 'LED Light Panel A1',
    type: 'lighting',
    status: 'online',
    value: '85%',
    location: 'Row 1, Rack A',
    lastUpdated: '2 min ago',
    automation: true,
    schedule: 'Growth Cycle A'
  },
  {
    id: '2',
    name: 'Water Pump 1',
    type: 'irrigation',
    status: 'online',
    value: '45 L/h',
    location: 'Row 1, Rack A',
    lastUpdated: '1 min ago',
    automation: true,
    schedule: 'Irrigation Cycle 1'
  },
  {
    id: '3',
    name: 'Exhaust Fan E1',
    type: 'ventilation',
    status: 'online',
    value: '1200 RPM',
    location: 'Row 1',
    lastUpdated: '30 sec ago',
    automation: false,
    schedule: null
  },
  {
    id: '4',
    name: 'Temp Sensor T1',
    type: 'sensors',
    status: 'online',
    value: '24.5°C',
    location: 'Row 1, Rack A',
    lastUpdated: '10 sec ago',
    automation: false,
    schedule: null
  },
  {
    id: '5',
    name: 'Humidity Sensor H1',
    type: 'sensors',
    status: 'online',
    value: '68%',
    location: 'Row 1, Rack A',
    lastUpdated: '15 sec ago',
    automation: false,
    schedule: null
  },
  {
    id: '6',
    name: 'LED Light Panel B2',
    type: 'lighting',
    status: 'offline',
    value: '0%',
    location: 'Row 2, Rack B',
    lastUpdated: '5 min ago',
    automation: true,
    schedule: 'Growth Cycle B'
  }
];

const deviceTypeConfig = {
  lighting: { icon: Lightbulb, color: 'yellow', bgColor: 'bg-yellow-50 dark:bg-yellow-900/20' },
  irrigation: { icon: Waves, color: 'blue', bgColor: 'bg-blue-50 dark:bg-blue-900/20' },
  ventilation: { icon: Fan, color: 'green', bgColor: 'bg-green-50 dark:bg-green-900/20' },
  sensors: { icon: Thermometer, color: 'purple', bgColor: 'bg-purple-50 dark:bg-purple-900/20' }
};

export default function DevicesControlsView({ farmPageData }: DevicesControlsViewProps) {
  const [devices] = useState(mockDevices);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Filter devices based on search and filters
  const filteredDevices = devices.filter(device => {
    const matchesSearch = device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         device.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || device.type === filterType;
    const matchesStatus = filterStatus === 'all' || device.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  // Device statistics
  const deviceStats = {
    total: devices.length,
    online: devices.filter(d => d.status === 'online').length,
    offline: devices.filter(d => d.status === 'offline').length,
    automated: devices.filter(d => d.automation).length
  };

  const getDeviceIcon = (type: string) => {
    const config = deviceTypeConfig[type as keyof typeof deviceTypeConfig];
    return config ? config.icon : Zap;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100';
      case 'offline': return 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100';
      case 'warning': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
    }
  };

  if (!farmPageData) {
    return (
      <div className="text-center py-10 text-gray-600 dark:text-gray-400">
        <div className="max-w-md mx-auto">
          <Zap className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl font-semibold mb-4">No Farm Selected</h2>
          <p className="mb-6">Select a farm to view and control its devices.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Device Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="animate-pop bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-700 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300 flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Total Devices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{deviceStats.total}</div>
            <Badge variant="secondary" className="mt-1 bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
              Registered
            </Badge>
          </CardContent>
        </Card>

        <Card className="animate-pop bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-700 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300 flex items-center gap-2">
              <Power className="h-4 w-4" />
              Online
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900 dark:text-green-100">{deviceStats.online}</div>
            <div className="text-xs text-green-600 dark:text-green-400">
              {Math.round((deviceStats.online / deviceStats.total) * 100)}% availability
            </div>
          </CardContent>
        </Card>

        <Card className="animate-pop bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 border-red-200 dark:border-red-700 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-700 dark:text-red-300 flex items-center gap-2">
              <Power className="h-4 w-4" />
              Offline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900 dark:text-red-100">{deviceStats.offline}</div>
            <Badge variant="destructive" className="mt-1">
              Needs Attention
            </Badge>
          </CardContent>
        </Card>

        <Card className="animate-pop bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-purple-200 dark:border-purple-700 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300 flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Automated
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">{deviceStats.automated}</div>
            <Badge variant="secondary" className="mt-1 bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100">
              Active Schedules
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Device Controls */}
      <Card className="shadow-lg">
        <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Zap className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <CardTitle className="text-lg">Device Management & Control</CardTitle>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <RotateCcw className="h-4 w-4 mr-2" />
                Refresh All
              </Button>
              <Button size="sm">
                <Play className="h-4 w-4 mr-2" />
                Start Automation
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search devices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Device Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="lighting">Lighting</SelectItem>
                <SelectItem value="irrigation">Irrigation</SelectItem>
                <SelectItem value="ventilation">Ventilation</SelectItem>
                <SelectItem value="sensors">Sensors</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Device List */}
          <div className="space-y-4">
            {filteredDevices.map((device) => {
              const DeviceIcon = getDeviceIcon(device.type);
              const typeConfig = deviceTypeConfig[device.type as keyof typeof deviceTypeConfig];
              
              return (
                <Card key={device.id} className={`border ${typeConfig?.bgColor} hover:shadow-md transition-shadow`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`p-2 rounded-full bg-${typeConfig?.color}-100 dark:bg-${typeConfig?.color}-900/20`}>
                          <DeviceIcon className={`h-5 w-5 text-${typeConfig?.color}-600 dark:text-${typeConfig?.color}-400`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100">{device.name}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{device.location}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={getStatusColor(device.status)}>
                              {device.status}
                            </Badge>
                            {device.automation && (
                              <Badge variant="outline" className="text-xs">
                                Auto: {device.schedule}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">{device.value}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{device.lastUpdated}</div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {device.status === 'online' ? (
                            <>
                              <Button variant="outline" size="sm">
                                <Pause className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="sm">
                                <Settings className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <Button variant="outline" size="sm">
                              <Play className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            
            {filteredDevices.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No devices found matching your criteria.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 