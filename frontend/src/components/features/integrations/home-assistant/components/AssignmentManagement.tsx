'use client';

import { FC } from 'react';
import { 
  FaMapPin, FaEdit, FaSearch, FaPlug, FaLightbulb, FaToggleOn, FaThermometerHalf
} from 'react-icons/fa';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FarmControlButton } from '@/components/ui/farm-control-button';
import { HAAssignment } from '@/types/integrations/homeassistant';

interface AssignmentManagementProps {
  assignments: HAAssignment[];
  onDiscoverDevices: () => void;
  onEditAssignment: (assignment: HAAssignment) => void;
}

export const AssignmentManagement: FC<AssignmentManagementProps> = ({
  assignments,
  onDiscoverDevices,
  onEditAssignment,
}) => {
  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'light': return <FaLightbulb className="h-4 w-4 text-yellow-500" />;
      case 'switch': return <FaToggleOn className="h-4 w-4 text-blue-500" />;
      case 'sensor': return <FaThermometerHalf className="h-4 w-4 text-green-500" />;
      default: return <FaPlug className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Device Assignments</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Manage which devices are assigned to specific farm locations
        </p>
      </div>

      {/* Assignment grid */}
      <div className="grid grid-cols-1 gap-4">
        {assignments.map((assignment) => (
          <Card key={assignment.entity_id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getDeviceIcon(assignment.entity_type || 'switch')}
                  <div>
                    <h3 className="font-medium">{assignment.friendly_name || assignment.entity_id}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {assignment.farm_name} → {assignment.row_name} → {assignment.rack_name} → {assignment.shelf_name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="default">
                    {assignment.entity_type}
                  </Badge>
                  <FarmControlButton 
                    size="sm" 
                    variant="default"
                    onClick={() => onEditAssignment(assignment)}
                  >
                    <FaEdit className="h-3 w-3" />
                  </FarmControlButton>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty state */}
      {assignments.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <FaMapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="font-semibold text-content mb-2">No assignments yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Start by discovering devices and assigning them to farm locations
            </p>
            <FarmControlButton onClick={onDiscoverDevices}>
              <FaSearch className="h-4 w-4 mr-2" />
              Discover Devices
            </FarmControlButton>
          </CardContent>
        </Card>
      )}
    </div>
  );
}; 