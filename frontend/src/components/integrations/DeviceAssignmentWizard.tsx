'use client';

import { useState, useEffect } from 'react';
import { FaMapMarkerAlt, FaCheck, FaArrowRight, FaLightbulb, FaPlug, FaFan, FaThermometerHalf } from 'react-icons/fa';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { HADevice, DeviceAssignment, homeAssistantService } from '@/services/homeAssistantService';

interface DeviceAssignmentWizardProps {
  device: HADevice;
  isOpen: boolean;
  onClose: () => void;
  onAssigned: () => void;
  existingAssignment?: DeviceAssignment;
}

interface LocationStep {
  farm_id: string;
  row_id: string;
  rack_id: string;
  shelf_id: string;
}

export default function DeviceAssignmentWizard({
  device,
  isOpen,
  onClose,
  onAssigned,
  existingAssignment
}: DeviceAssignmentWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isAssigning, setIsAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [assignmentData, setAssignmentData] = useState({
    device_role: existingAssignment?.device_role || 'lighting' as 'lighting' | 'irrigation' | 'ventilation' | 'monitoring',
    farm_id: existingAssignment?.farm_id || 'farm_1',
    row_id: existingAssignment?.row_id || '',
    rack_id: existingAssignment?.rack_id || '',
    shelf_id: existingAssignment?.shelf_id || ''
  });

  useEffect(() => {
    if (existingAssignment) {
      setAssignmentData({
        device_role: existingAssignment.device_role,
        farm_id: existingAssignment.farm_id,
        row_id: existingAssignment.row_id || '',
        rack_id: existingAssignment.rack_id || '',
        shelf_id: existingAssignment.shelf_id || ''
      });
    }
  }, [existingAssignment]);

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'light': return <FaLightbulb className="text-yellow-500" />;
      case 'switch': return <FaPlug className="text-blue-500" />;
      case 'fan': return <FaFan className="text-green-500" />;
      case 'sensor': return <FaThermometerHalf className="text-purple-500" />;
      default: return <FaPlug className="text-gray-500" />;
    }
  };

  const getSuggestedRole = (deviceType: string): 'lighting' | 'irrigation' | 'ventilation' | 'monitoring' => {
    switch (deviceType) {
      case 'light': return 'lighting';
      case 'fan': return 'ventilation';
      case 'sensor': return 'monitoring';
      case 'switch': return 'irrigation';
      default: return 'lighting';
    }
  };

  const handleRoleSelect = (role: 'lighting' | 'irrigation' | 'ventilation' | 'monitoring') => {
    setAssignmentData(prev => ({ ...prev, device_role: role }));
    setCurrentStep(2);
  };

  const handleLocationInput = (field: keyof LocationStep, value: string) => {
    setAssignmentData(prev => ({ ...prev, [field]: value }));
  };

  const generateLocationSuggestions = () => {
    const suggestions = [];
    for (let row = 1; row <= 3; row++) {
      for (let rack = 1; rack <= 4; rack++) {
        for (let shelf = 1; shelf <= 6; shelf++) {
          suggestions.push({
            row: `row${row.toString().padStart(3, '0')}`,
            rack: `rack${rack.toString().padStart(3, '0')}`,
            shelf: `shelf${shelf.toString().padStart(3, '0')}`,
            label: `Row ${row}, Rack ${rack}, Shelf ${shelf}`
          });
        }
      }
    }
    return suggestions.slice(0, 8); // Show first 8 suggestions
  };

  const handleQuickAssign = (suggestion: any) => {
    setAssignmentData(prev => ({
      ...prev,
      row_id: suggestion.row,
      rack_id: suggestion.rack,
      shelf_id: suggestion.shelf
    }));
    setCurrentStep(3);
  };

  const handleAssign = async () => {
    setIsAssigning(true);
    setError(null);

    try {
      const assignment: DeviceAssignment = {
        entity_id: device.entity_id,
        farm_id: assignmentData.farm_id,
        row_id: assignmentData.row_id || undefined,
        rack_id: assignmentData.rack_id || undefined,
        shelf_id: assignmentData.shelf_id || undefined,
        device_role: assignmentData.device_role,
      };

      await homeAssistantService.saveAssignment(assignment);
      onAssigned();
      onClose();
      setCurrentStep(1); // Reset for next use
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to assign device');
    } finally {
      setIsAssigning(false);
    }
  };

  const isLocationComplete = assignmentData.row_id && assignmentData.rack_id && assignmentData.shelf_id;

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Select Device Role</h3>
              <p className="text-gray-600">What will this device be used for in your vertical farm?</p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant={assignmentData.device_role === 'lighting' ? 'default' : 'outline'}
                onClick={() => handleRoleSelect('lighting')}
                className="h-16 flex-col space-y-1"
              >
                <FaLightbulb className="text-yellow-500" />
                <span>Lighting</span>
              </Button>
              
              <Button
                variant={assignmentData.device_role === 'irrigation' ? 'default' : 'outline'}
                onClick={() => handleRoleSelect('irrigation')}
                className="h-16 flex-col space-y-1"
              >
                <FaPlug className="text-blue-500" />
                <span>Irrigation</span>
              </Button>
              
              <Button
                variant={assignmentData.device_role === 'ventilation' ? 'default' : 'outline'}
                onClick={() => handleRoleSelect('ventilation')}
                className="h-16 flex-col space-y-1"
              >
                <FaFan className="text-green-500" />
                <span>Ventilation</span>
              </Button>
              
              <Button
                variant={assignmentData.device_role === 'monitoring' ? 'default' : 'outline'}
                onClick={() => handleRoleSelect('monitoring')}
                className="h-16 flex-col space-y-1"
              >
                <FaThermometerHalf className="text-purple-500" />
                <span>Monitoring</span>
              </Button>
            </div>

            {device.domain && (
              <Alert>
                <FaMapMarkerAlt className="h-4 w-4" />
                <AlertDescription>
                  Suggested role based on device type: <strong>{getSuggestedRole(device.domain)}</strong>
                </AlertDescription>
              </Alert>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Choose Location</h3>
              <p className="text-gray-600">Where in your vertical farm will this device be located?</p>
            </div>

            {/* Quick Assignment Options */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Quick Assignment</Label>
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                {generateLocationSuggestions().map((suggestion, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickAssign(suggestion)}
                    className="text-xs justify-start"
                  >
                    {suggestion.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="border-t pt-4">
              <Label className="text-sm font-medium mb-3 block">Manual Entry</Label>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label>Row ID</Label>
                  <Input
                    placeholder="row001"
                    value={assignmentData.row_id}
                    onChange={(e) => handleLocationInput('row_id', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Rack ID</Label>
                  <Input
                    placeholder="rack002"
                    value={assignmentData.rack_id}
                    onChange={(e) => handleLocationInput('rack_id', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Shelf ID</Label>
                  <Input
                    placeholder="shelf003"
                    value={assignmentData.shelf_id}
                    onChange={(e) => handleLocationInput('shelf_id', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setCurrentStep(1)}>
                Back
              </Button>
              <Button 
                onClick={() => setCurrentStep(3)}
                disabled={!isLocationComplete}
              >
                Next <FaArrowRight className="ml-2" />
              </Button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Confirm Assignment</h3>
              <p className="text-gray-600">Review and confirm the device assignment</p>
            </div>

            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    {getDeviceIcon(device.domain)}
                    <div>
                      <div className="font-medium">{device.friendly_name || device.entity_id}</div>
                      <div className="text-sm text-gray-500">{device.entity_id}</div>
                    </div>
                  </div>

                  <div className="border-t pt-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Role:</span>
                      <Badge className="capitalize">{assignmentData.device_role}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Location:</span>
                      <span>{assignmentData.row_id}, {assignmentData.rack_id}, {assignmentData.shelf_id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Farm:</span>
                      <span>{assignmentData.farm_id}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setCurrentStep(2)}>
                Back
              </Button>
              <Button onClick={handleAssign} disabled={isAssigning}>
                {isAssigning ? 'Assigning...' : (
                  <>
                    <FaCheck className="mr-2" />
                    {existingAssignment ? 'Update Assignment' : 'Assign Device'}
                  </>
                )}
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {existingAssignment ? 'Update Device Assignment' : 'Assign Device to Farm'}
          </DialogTitle>
          <DialogDescription>
            Step {currentStep} of 3
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          {renderStep()}
        </div>
      </DialogContent>
    </Dialog>
  );
} 