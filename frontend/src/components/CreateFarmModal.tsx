"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from "@/components/ui/dialog";
import { createFarm, CreateFarmData, Farm } from "@/services/supabaseService";
import toast from 'react-hot-toast';
import { Plus, Loader2 } from 'lucide-react';

interface CreateFarmModalProps {
  onFarmCreated: (farm: Farm) => void;
  trigger?: React.ReactNode;
}

interface FormErrors {
  name?: string;
  location?: string;
  plan_image_url?: string;
  width?: string;
  depth?: string;
}

export default function CreateFarmModal({ onFarmCreated, trigger }: CreateFarmModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CreateFarmData>({
    name: '',
    location: '',
    plan_image_url: '',
    width: undefined,
    depth: undefined,
  });

  const [errors, setErrors] = useState<FormErrors>({});

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Name validation (required, 3-50 chars)
    if (!formData.name.trim()) {
      newErrors.name = 'Farm name is required';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Farm name must be at least 3 characters';
    } else if (formData.name.trim().length > 50) {
      newErrors.name = 'Farm name must be less than 50 characters';
    }

    // Location validation (optional, but if provided must be 3-100 chars)
    if (formData.location && formData.location.trim()) {
      if (formData.location.trim().length < 3) {
        newErrors.location = 'Location must be at least 3 characters';
      } else if (formData.location.trim().length > 100) {
        newErrors.location = 'Location must be less than 100 characters';
      }
    }

    // URL validation (optional, but if provided must be valid URL)
    if (formData.plan_image_url && formData.plan_image_url.trim()) {
      const urlPattern = /^https?:\/\/[\w\d.-]+\.[a-z]{2,}(?:\/[^\s]*)?$/;
      if (!urlPattern.test(formData.plan_image_url.trim())) {
        newErrors.plan_image_url = 'Please enter a valid URL';
      }
    }

    // Width validation (optional, but if provided must be > 0)
    if (formData.width !== undefined && formData.width <= 0) {
      newErrors.width = 'Width must be greater than 0';
    }

    // Depth validation (optional, but if provided must be > 0)
    if (formData.depth !== undefined && formData.depth <= 0) {
      newErrors.depth = 'Depth must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      // Clean up the form data (remove empty strings, undefined values)
      const cleanedData: CreateFarmData = {
        name: formData.name.trim(),
      };

      if (formData.location && formData.location.trim()) {
        cleanedData.location = formData.location.trim();
      }

      if (formData.plan_image_url && formData.plan_image_url.trim()) {
        cleanedData.plan_image_url = formData.plan_image_url.trim();
      }

      if (typeof formData.width === 'number' && formData.width > 0) {
        cleanedData.width = formData.width;
      }

      if (typeof formData.depth === 'number' && formData.depth > 0) {
        cleanedData.depth = formData.depth;
      }

      const newFarm = await createFarm(cleanedData);
      toast.success(`Farm "${newFarm.name}" created successfully!`);
      
      // Reset form
      setFormData({
        name: '',
        location: '',
        plan_image_url: '',
        width: undefined,
        depth: undefined,
      });
      setErrors({});
      setIsOpen(false);
      
      // Notify parent component
      onFarmCreated(newFarm);
    } catch (error: any) {
      console.error('Failed to create farm:', error);
      toast.error(error.message || 'Failed to create farm');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof CreateFarmData, value: string | number | undefined) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Farm
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Farm</DialogTitle>
          <DialogDescription>
            Set up a new farm to start managing your vertical farming operation.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Farm Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter farm name"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location || ''}
              onChange={(e) => handleInputChange('location', e.target.value)}
              placeholder="Enter farm location"
              className={errors.location ? 'border-red-500' : ''}
            />
            {errors.location && <p className="text-sm text-red-500">{errors.location}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="plan_image_url">Plan Image URL</Label>
            <Input
              id="plan_image_url"
              value={formData.plan_image_url || ''}
              onChange={(e) => handleInputChange('plan_image_url', e.target.value)}
              placeholder="https://example.com/farm-plan.jpg"
              className={errors.plan_image_url ? 'border-red-500' : ''}
            />
            {errors.plan_image_url && <p className="text-sm text-red-500">{errors.plan_image_url}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="width">Width (m)</Label>
              <Input
                id="width"
                type="number"
                min="0"
                step="0.1"
                value={formData.width || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  handleInputChange('width', value ? parseFloat(value) : undefined);
                }}
                placeholder="10.5"
                className={errors.width ? 'border-red-500' : ''}
              />
              {errors.width && <p className="text-sm text-red-500">{errors.width}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="depth">Depth (m)</Label>
              <Input
                id="depth"
                type="number"
                min="0"
                step="0.1"
                value={formData.depth || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  handleInputChange('depth', value ? parseFloat(value) : undefined);
                }}
                placeholder="8.0"
                className={errors.depth ? 'border-red-500' : ''}
              />
              {errors.depth && <p className="text-sm text-red-500">{errors.depth}</p>}
            </div>
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Farm'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 