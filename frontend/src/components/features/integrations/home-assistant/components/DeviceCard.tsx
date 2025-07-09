'use client';

import { FC } from 'react';
import { 
  FaLightbulb, FaToggleOn, FaThermometerHalf, FaPlug, FaWifi, FaHome, FaLeaf, FaWater,
  FaCheck, FaExclamationTriangle, FaCheckCircle, FaCircle, FaClock, FaDownload, FaCog, 
  FaSun, FaMoon
} from 'react-icons/fa';
import { MapPin, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { FarmControlButton } from '@/components/ui/farm-control-button';
import { HADevice, HAAssignment, HAImportedDevice } from '@/types/integrations/homeassistant';

interface DeviceCardProps {
  device: HADevice;
  assignments: HAAssignment[];
  importedDevices: HAImportedDevice[];
  selectedDevices: Set<string>;
  bulkSelectMode: boolean;
  onToggleSelection: (deviceId: string) => void;
  onDeviceControl: (device: HADevice, action: 'turn_on' | 'turn_off' | 'toggle') => void;
  onImportDevice: (device: HADevice) => void;
  onAssignDevice: (device: HADevice) => void;
}

export const DeviceCard: FC<DeviceCardProps> = ({
  device,
  assignments,
  importedDevices,
  selectedDevices,
  bulkSelectMode,
  onToggleSelection,
  onDeviceControl,
  onImportDevice,
  onAssignDevice,
}) => {
  const isAssigned = assignments.some(a => a.entity_id === device.entity_id);
  const assignment = assignments.find(a => a.entity_id === device.entity_id);
  const isImported = importedDevices.some(d => d.entity_id === device.entity_id);
  const isActive = device.state === 'on';
  const lastActivity = device.last_updated ? new Date(device.last_updated) : null;
  const isSelected = selectedDevices.has(device.entity_id);

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'light': return <FaLightbulb className="h-4 w-4 text-yellow-500" />;
      case 'switch': return <FaToggleOn className="h-4 w-4 text-blue-500" />;
      case 'sensor': return <FaThermometerHalf className="h-4 w-4 text-green-500" />;
      default: return <FaPlug className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    if (device.state === 'on') return 'text-green-500 bg-green-50 border-green-200';
    if (device.state === 'off') return 'text-gray-500 bg-gray-50 border-gray-200';
    if (device.state === 'unavailable') return 'text-red-500 bg-red-50 border-red-200';
    return 'text-yellow-500 bg-yellow-50 border-yellow-200';
  };

  const getStatusIcon = () => {
    if (device.state === 'on') return <FaCheckCircle className="h-3 w-3" />;
    if (device.state === 'off') return <FaCircle className="h-3 w-3" />;
    if (device.state === 'unavailable') return <FaExclamationTriangle className="h-3 w-3" />;
    return <FaClock className="h-3 w-3" />;
  };

  return (
    <Card className={`hover:shadow-lg transition-all duration-200 hover:scale-[1.02] ${isSelected ? 'ring-2 ring-green-500 bg-green-50/50' : ''}`}>
      <CardContent className="p-4">
        {/* Selection checkbox and header */}
        <div className="flex items-start justify-between mb-4">
          {bulkSelectMode && (
            <div className="flex-shrink-0 mr-3 mt-1">
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => onToggleSelection(device.entity_id)}
                className="h-5 w-5"
              />
            </div>
          )}
          <div className="flex items-start justify-between flex-1">
            <div className="flex items-start gap-3 flex-1">
              <div className="flex-shrink-0 mt-1">
                {getDeviceIcon(device.domain)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm leading-tight truncate">
                  {device.friendly_name || device.entity_id}
                </h3>
                <p className="text-xs text-gray-500 truncate mt-1">{device.entity_id}</p>
                {isAssigned && assignment && (
                  <div className="flex items-center gap-1 mt-1">
                    <MapPin className="h-3 w-3 text-green-600" />
                    <span className="text-xs text-green-600 truncate">
                      {assignment.shelf_name}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Large status indicator */}
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full border text-xs font-medium ${getStatusColor()}`}>
              {getStatusIcon()}
              <span className="capitalize">{device.state}</span>
            </div>
          </div>
        </div>

        {/* Device info row */}
        <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
          <div className="flex items-center gap-1">
            <Badge variant="default" className="text-xs">
              {device.domain}
            </Badge>
            {isImported && (
              <Badge variant="default" className="text-xs">
                Imported
              </Badge>
            )}
            {isAssigned && (
              <Badge variant="default" className="text-xs">
                Assigned
              </Badge>
            )}
          </div>
          {lastActivity && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{lastActivity.toLocaleTimeString()}</span>
            </div>
          )}
        </div>

        {/* Controls section */}
        <div className="space-y-3">
          {/* Primary controls */}
          <div className="flex gap-2">
            {device.domain === 'light' && (
              <FarmControlButton 
                size="sm" 
                variant={isActive ? "default" : "primary"}
                className="flex-1 min-h-[44px]"
                onClick={() => onDeviceControl(device, isActive ? 'turn_off' : 'turn_on')}
              >
                {isActive ? <FaSun className="h-4 w-4 mr-2" /> : <FaMoon className="h-4 w-4 mr-2" />}
                {isActive ? 'Turn Off' : 'Turn On'}
              </FarmControlButton>
            )}
            
            {device.domain === 'switch' && (
              <div className="flex items-center justify-between w-full">
                <span className="text-sm font-medium">
                  {isActive ? 'On' : 'Off'}
                </span>
                <Switch 
                  checked={isActive}
                  onCheckedChange={(checked) => 
                    onDeviceControl(device, checked ? 'turn_on' : 'turn_off')
                  }
                  className="scale-125"
                />
              </div>
            )}

            {(device.domain !== 'light' && device.domain !== 'switch') && (
              <FarmControlButton 
                size="sm" 
                variant="default" 
                className="flex-1 min-h-[44px]"
                onClick={() => onDeviceControl(device, 'toggle')}
              >
                <FaToggleOn className="h-4 w-4 mr-2" />
                Toggle
              </FarmControlButton>
            )}
          </div>

          {/* Secondary controls */}
          <div className="flex gap-2">
            {!isImported ? (
              <FarmControlButton 
                size="sm" 
                variant="default"
                className="flex-1 min-h-[44px]"
                onClick={() => onImportDevice(device)}
              >
                <FaDownload className="h-4 w-4 mr-2" />
                Import
              </FarmControlButton>
            ) : (
              <FarmControlButton 
                size="sm" 
                variant="default"
                className="flex-1 min-h-[44px]"
                onClick={() => onAssignDevice(device)}
              >
                <MapPin className="h-4 w-4 mr-2" />
                {isAssigned ? 'Reassign' : 'Assign'}
              </FarmControlButton>
            )}
            
            <FarmControlButton 
              size="sm" 
              variant="default"
              className="min-h-[44px] px-3"
              onClick={() => {
                // Add device details modal or expand functionality
              }}
            >
              <FaCog className="h-4 w-4" />
            </FarmControlButton>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 