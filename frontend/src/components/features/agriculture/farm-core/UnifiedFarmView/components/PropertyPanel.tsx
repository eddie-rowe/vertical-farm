import { Settings, Save, Trash2, Info, Edit3, Tag, MapPin } from "lucide-react";
import React, { useState, useCallback } from "react";
import { toast } from "react-hot-toast";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Row, Rack, Shelf } from "@/types/farm-layout";

interface PropertyPanelProps {
  isOpen: boolean;
  element: Row | Rack | Shelf | null;
  elementType: "row" | "rack" | "shelf";
  onClose: () => void;
  onSave: (element: Row | Rack | Shelf) => void;
  onDelete?: (element: Row | Rack | Shelf) => void;
}

export const PropertyPanel: React.FC<PropertyPanelProps> = ({
  isOpen,
  element,
  elementType,
  onClose,
  onSave,
  onDelete,
}) => {
  const [editedElement, setEditedElement] = useState<Row | Rack | Shelf | null>(
    element,
  );
  const [hasChanges, setHasChanges] = useState(false);

  React.useEffect(() => {
    setEditedElement(element ? { ...element } : null);
    setHasChanges(false);
  }, [element]);

  const updateProperty = useCallback(
    (property: string, value: any) => {
      if (!editedElement) return;

      setEditedElement((prev) => ({
        ...prev!,
        [property]: value,
      }));
      setHasChanges(true);
    },
    [editedElement],
  );

  const handleSave = useCallback(() => {
    if (!editedElement || !hasChanges) {
      onClose();
      return;
    }

    try {
      onSave(editedElement);
      toast.success(`${elementType} updated successfully`);
      setHasChanges(false);
      onClose();
    } catch (error) {
      toast.error(`Failed to update ${elementType}`);
    }
  }, [editedElement, hasChanges, onSave, elementType, onClose]);

  const handleDelete = useCallback(() => {
    if (!editedElement || !onDelete) return;

    if (confirm(`Are you sure you want to delete this ${elementType}?`)) {
      try {
        onDelete(editedElement);
        toast.success(`${elementType} deleted successfully`);
        onClose();
      } catch (error) {
        toast.error(`Failed to delete ${elementType}`);
      }
    }
  }, [editedElement, onDelete, elementType, onClose]);

  const getElementStats = () => {
    if (!editedElement) return null;

    switch (elementType) {
      case "row":
        const row = editedElement as Row;
        return {
          racks: row.racks?.length || 0,
          shelves:
            row.racks?.reduce(
              (acc, rack) => acc + (rack.shelves?.length || 0),
              0,
            ) || 0,
          devices:
            row.racks?.reduce(
              (acc, rack) =>
                acc +
                (rack.shelves?.reduce(
                  (shelfAcc, shelf) => shelfAcc + (shelf.devices?.length || 0),
                  0,
                ) || 0),
              0,
            ) || 0,
        };
      case "rack":
        const rack = editedElement as Rack;
        return {
          shelves: rack.shelves?.length || 0,
          devices:
            rack.shelves?.reduce(
              (acc, shelf) => acc + (shelf.devices?.length || 0),
              0,
            ) || 0,
        };
      case "shelf":
        const shelf = editedElement as Shelf;
        return {
          devices: shelf.devices?.length || 0,
        };
      default:
        return null;
    }
  };

  const stats = getElementStats();

  if (!editedElement) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-96 sm:w-[480px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Edit {elementType.charAt(0).toUpperCase() + elementType.slice(1)}
          </SheetTitle>
          <SheetDescription>
            Modify properties and settings for this {elementType}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-500" />
              <h3 className="font-medium">Basic Information</h3>
            </div>

            <div className="space-y-3">
              <div>
                <Label htmlFor="element-name">Name</Label>
                <Input
                  id="element-name"
                  value={editedElement.name || ""}
                  onChange={(e) => updateProperty("name", e.target.value)}
                  placeholder={`Enter ${elementType} name`}
                />
              </div>

              <div>
                <Label htmlFor="element-description">Description</Label>
                <Textarea
                  id="element-description"
                  value={(editedElement as any).description || ""}
                  onChange={(e) =>
                    updateProperty("description", e.target.value)
                  }
                  placeholder={`Enter ${elementType} description`}
                  rows={3}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Statistics */}
          {stats && (
            <>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-green-500" />
                  <h3 className="font-medium">Statistics</h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {elementType === "row" && (
                    <>
                      <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {stats.racks}
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-300">
                          Racks
                        </div>
                      </div>
                      <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {stats.shelves}
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-300">
                          Shelves
                        </div>
                      </div>
                    </>
                  )}
                  {(elementType === "row" || elementType === "rack") && (
                    <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {stats.devices}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-300">
                        Devices
                      </div>
                    </div>
                  )}
                  {elementType === "shelf" && (
                    <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {stats.devices}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-300">
                        Devices
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Separator />
            </>
          )}

          {/* Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-orange-500" />
              <h3 className="font-medium">Settings</h3>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Active</Label>
                  <p className="text-sm text-slate-500">
                    Enable this {elementType} for operations
                  </p>
                </div>
                <Switch
                  checked={(editedElement as any).active ?? true}
                  onCheckedChange={(checked) =>
                    updateProperty("active", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Monitoring</Label>
                  <p className="text-sm text-slate-500">
                    Enable monitoring and alerts
                  </p>
                </div>
                <Switch
                  checked={(editedElement as any).monitoring ?? false}
                  onCheckedChange={(checked) =>
                    updateProperty("monitoring", checked)
                  }
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Metadata */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-purple-500" />
              <h3 className="font-medium">Metadata</h3>
            </div>

            <div className="space-y-3">
              <div>
                <Label>Tags</Label>
                <Input
                  value={(editedElement as any).tags?.join(", ") || ""}
                  onChange={(e) =>
                    updateProperty(
                      "tags",
                      e.target.value
                        .split(",")
                        .map((tag) => tag.trim())
                        .filter(Boolean),
                    )
                  }
                  placeholder="Enter tags separated by commas"
                />
              </div>

              <div>
                <Label>Notes</Label>
                <Textarea
                  value={(editedElement as any).notes || ""}
                  onChange={(e) => updateProperty("notes", e.target.value)}
                  placeholder="Enter additional notes"
                  rows={2}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 pt-6 border-t flex gap-2">
          <Button
            onClick={handleSave}
            disabled={!hasChanges}
            className="flex-1"
          >
            <Save className="w-4 h-4 mr-2" />
            {hasChanges ? "Save Changes" : "No Changes"}
          </Button>

          {onDelete && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="px-4"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}

          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>

        {/* Change Indicator */}
        {hasChanges && (
          <div className="mt-2">
            <Badge variant="secondary" className="w-full justify-center">
              <Edit3 className="w-3 h-3 mr-1" />
              Unsaved changes
            </Badge>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
