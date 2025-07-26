"use client";

import React, { useState, useEffect } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  FaArrowRight,
  FaLightbulb,
  FaPlug,
  FaFan,
  FaThermometerHalf,
} from "@/lib/icons";
import deviceAssignmentService from "@/services/deviceAssignmentService";
import { HADevice, DeviceAssignment } from "@/types/device-assignment";

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
  existingAssignment,
}: DeviceAssignmentWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isAssigning, setIsAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [assignmentData, setAssignmentData] = useState({
    farm_id: existingAssignment?.farm_id || "farm_1",
    row_id: existingAssignment?.row_id || "",
    rack_id: existingAssignment?.rack_id || "",
    shelf_id: existingAssignment?.shelf_id || "",
  });

  useEffect(() => {
    if (existingAssignment) {
      setAssignmentData({
        farm_id: existingAssignment.farm_id || "farm_1",
        row_id: existingAssignment.row_id || "",
        rack_id: existingAssignment.rack_id || "",
        shelf_id: existingAssignment.shelf_id || "",
      });
    }
  }, [existingAssignment]);

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case "light":
        return <FaLightbulb className="text-yellow-500" />;
      case "switch":
        return <FaPlug className="text-blue-500" />;
      case "fan":
        return <FaFan className="text-green-500" />;
      case "sensor":
        return <FaThermometerHalf className="text-purple-500" />;
      default:
        return <FaPlug className="text-gray-500" />;
    }
  };

  const getDeviceTypeLabel = (entityType: string): string => {
    switch (entityType) {
      case "light":
        return "Lighting";
      case "fan":
        return "Ventilation";
      case "sensor":
        return "Monitoring";
      case "switch":
        return "Switch/Control";
      case "binary_sensor":
        return "Sensor";
      case "climate":
        return "Climate Control";
      default:
        return entityType
          .replace("_", " ")
          .replace(/\b\w/g, (l) => l.toUpperCase());
    }
  };

  const handleLocationInput = (field: keyof LocationStep, value: string) => {
    setAssignmentData((prev) => ({ ...prev, [field]: value }));
  };

  const generateLocationSuggestions = () => {
    const suggestions = [];
    for (let row = 1; row <= 3; row++) {
      for (let rack = 1; rack <= 4; rack++) {
        for (let shelf = 1; shelf <= 6; shelf++) {
          suggestions.push({
            row: `row${row.toString().padStart(3, "0")}`,
            rack: `rack${rack.toString().padStart(3, "0")}`,
            shelf: `shelf${shelf.toString().padStart(3, "0")}`,
            label: `Row ${row}, Rack ${rack}, Shelf ${shelf}`,
          });
        }
      }
    }
    return suggestions.slice(0, 8); // Show first 8 suggestions
  };

  const handleQuickAssign = (suggestion: any) => {
    setAssignmentData((prev) => ({
      ...prev,
      row_id: suggestion.row,
      rack_id: suggestion.rack,
      shelf_id: suggestion.shelf,
    }));
    setCurrentStep(2);
  };

  const handleAssign = async () => {
    setIsAssigning(true);
    setError(null);

    try {
      // Determine the target level and create assignment target
      let target;
      if (assignmentData.shelf_id) {
        target = {
          type: "shelf" as const,
          id: assignmentData.shelf_id,
          name: `Shelf ${assignmentData.shelf_id}`,
        };
      } else if (assignmentData.rack_id) {
        target = {
          type: "rack" as const,
          id: assignmentData.rack_id,
          name: `Rack ${assignmentData.rack_id}`,
        };
      } else if (assignmentData.row_id) {
        target = {
          type: "row" as const,
          id: assignmentData.row_id,
          name: `Row ${assignmentData.row_id}`,
        };
      } else {
        target = {
          type: "farm" as const,
          id: assignmentData.farm_id,
          name: `Farm ${assignmentData.farm_id}`,
        };
      }

      const deviceData = {
        entity_id: device.entity_id,
        friendly_name: device.friendly_name || device.entity_id,
        entity_type: device.domain || "unknown",
        device_class: device.device_class,
        area: device.area,
      };

      await deviceAssignmentService.assignDevice(deviceData, target);
      onAssigned();
      onClose();
      setCurrentStep(1); // Reset for next use
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to assign device",
      );
    } finally {
      setIsAssigning(false);
    }
  };

  const isLocationComplete =
    assignmentData.row_id && assignmentData.rack_id && assignmentData.shelf_id;

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Choose Location</h3>
              <p className="text-gray-600">
                Where in your vertical farm will this device be located?
              </p>
            </div>

            {/* Device Info */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-3">
                  {getDeviceIcon(device.domain)}
                  <div className="flex-1">
                    <div className="font-medium">
                      {device.friendly_name || device.entity_id}
                    </div>
                    <div className="text-sm text-gray-500">
                      {device.entity_id}
                    </div>
                    <Badge variant="secondary" className="mt-1">
                      {getDeviceTypeLabel(device.domain)}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Assignment Options */}
            <div>
              <Label className="text-sm font-medium mb-2 block">
                Quick Assignment
              </Label>
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
              <Label className="text-sm font-medium mb-3 block">
                Manual Entry
              </Label>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label>Row ID</Label>
                  <Input
                    placeholder="row001"
                    value={assignmentData.row_id}
                    onChange={(e) =>
                      handleLocationInput("row_id", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Rack ID</Label>
                  <Input
                    placeholder="rack002"
                    value={assignmentData.rack_id}
                    onChange={(e) =>
                      handleLocationInput("rack_id", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Shelf ID</Label>
                  <Input
                    placeholder="shelf003"
                    value={assignmentData.shelf_id}
                    onChange={(e) =>
                      handleLocationInput("shelf_id", e.target.value)
                    }
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button
                onClick={() => setCurrentStep(2)}
                disabled={!isLocationComplete}
              >
                Next <FaArrowRight className="ml-2" />
              </Button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Confirm Assignment</h3>
              <p className="text-gray-600">
                Review and confirm the device assignment
              </p>
            </div>

            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    {getDeviceIcon(device.domain)}
                    <div>
                      <div className="font-medium">
                        {device.friendly_name || device.entity_id}
                      </div>
                      <div className="text-sm text-gray-500">
                        {device.entity_id}
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Device Type:</span>
                      <Badge className="capitalize">
                        {getDeviceTypeLabel(device.domain)}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Location:</span>
                      <span>
                        {assignmentData.row_id}, {assignmentData.rack_id},{" "}
                        {assignmentData.shelf_id}
                      </span>
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
              <Button variant="outline" onClick={() => setCurrentStep(1)}>
                Back
              </Button>
              <Button onClick={handleAssign} disabled={isAssigning}>
                {isAssigning ? "Assigning..." : "Assign Device"}
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
            {existingAssignment
              ? "Update Device Assignment"
              : "Assign Device to Farm"}
          </DialogTitle>
          <DialogDescription>Step {currentStep} of 2</DialogDescription>
        </DialogHeader>

        <div className="py-4">{renderStep()}</div>
      </DialogContent>
    </Dialog>
  );
}
