'use client';

import { FC, useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FarmControlButton } from '@/components/ui/farm-control-button';
import { Label } from '@/components/ui/label';
import { HADevice, AssignmentForm } from '@/types/integrations/homeassistant';

interface AssignmentModalProps {
  open: boolean;
  device: HADevice | null;
  onClose: () => void;
  onAssign: (assignment: AssignmentForm) => void;
}

export const AssignmentModal: FC<AssignmentModalProps> = ({
  open,
  device,
  onClose,
  onAssign,
}) => {
  const [assignmentForm, setAssignmentForm] = useState<AssignmentForm>({
    farm_id: '',
    row_id: '',
    rack_id: '',
    shelf_id: '',
  });

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open) {
      setAssignmentForm({
        farm_id: '',
        row_id: '',
        rack_id: '',
        shelf_id: '',
      });
    }
  }, [open]);

  const handleAssign = () => {
    if (assignmentForm.farm_id && assignmentForm.row_id && assignmentForm.rack_id && assignmentForm.shelf_id) {
      onAssign(assignmentForm);
      onClose();
    }
  };

  const isFormValid = assignmentForm.farm_id && assignmentForm.row_id && assignmentForm.rack_id && assignmentForm.shelf_id;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Device to Location</DialogTitle>
          <DialogDescription>
            Choose where to assign {device?.friendly_name || device?.entity_id}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Farm</Label>
            <Select 
              value={assignmentForm.farm_id} 
              onValueChange={(value) => 
                setAssignmentForm(prev => ({ ...prev, farm_id: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select farm" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="farm_1">Greenhouse Alpha</SelectItem>
                <SelectItem value="farm_2">Greenhouse Beta</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>Row</Label>
            <Select 
              value={assignmentForm.row_id} 
              onValueChange={(value) => 
                setAssignmentForm(prev => ({ ...prev, row_id: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select row" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="row_1">Row A1</SelectItem>
                <SelectItem value="row_2">Row A2</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Rack</Label>
            <Select 
              value={assignmentForm.rack_id} 
              onValueChange={(value) => 
                setAssignmentForm(prev => ({ ...prev, rack_id: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select rack" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rack_1">Rack A1-1</SelectItem>
                <SelectItem value="rack_2">Rack A1-2</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Shelf</Label>
            <Select 
              value={assignmentForm.shelf_id} 
              onValueChange={(value) => 
                setAssignmentForm(prev => ({ ...prev, shelf_id: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select shelf" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="shelf_1">Shelf A1-1-1</SelectItem>
                <SelectItem value="shelf_2">Shelf A1-1-2</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-4">
            <FarmControlButton 
              onClick={handleAssign} 
              className="flex-1"
              disabled={!isFormValid}
            >
              Assign Device
            </FarmControlButton>
            <FarmControlButton 
              variant="default" 
              onClick={onClose}
            >
              Cancel
            </FarmControlButton>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 