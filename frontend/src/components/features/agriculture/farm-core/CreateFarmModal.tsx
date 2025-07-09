"use client";

import React, { useState } from 'react';
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
import { createFarm, CreateFarmData } from "@/services/supabaseService";
import { Farm } from "@/types/farm";
import toast from 'react-hot-toast';
import { Plus } from 'lucide-react';

interface CreateFarmModalProps {
  onFarmCreated: (farm: Farm) => void;
  trigger?: React.ReactNode;
}

interface FormErrors {
  name?: string;
  location?: string;
  farm_image_url?: string;
}

export default function CreateFarmModal({ onFarmCreated, trigger }: CreateFarmModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CreateFarmData>({
    name: '',
    location: '',
    farm_image_url: '',
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
    if (formData.farm_image_url && formData.farm_image_url.trim()) {
      const urlPattern = /^https?:\/\/[\w\d.-]+\.[a-z]{2,}(?:\/[^\s]*)?$/;
      if (!urlPattern.test(formData.farm_image_url.trim())) {
        newErrors.farm_image_url = 'Please enter a valid URL';
      }
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

      if (formData.farm_image_url && formData.farm_image_url.trim()) {
        cleanedData.farm_image_url = formData.farm_image_url.trim();
      }

      const newFarm = await createFarm(cleanedData);
      toast.success(`Farm "${newFarm.name}" created successfully!`);
      
      // Reset form
      setFormData({
        name: '',
        location: '',
        farm_image_url: '',
      });
      setErrors({});
      setIsOpen(false);
      
      // Notify parent component (cast to match interface expectations)
      onFarmCreated(newFarm as Farm);
    } catch (error: any) {
      console.error('Failed to create farm:', error);
      toast.error(error.message || 'Failed to create farm');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof CreateFarmData, value: string | undefined) => {
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
            <Label htmlFor="farm_image_url">Farm Image URL</Label>
            <Input
              id="farm_image_url"
              value={formData.farm_image_url || ''}
              onChange={(e) => handleInputChange('farm_image_url', e.target.value)}
              placeholder="https://example.com/farm-plan.jpg"
              className={errors.farm_image_url ? 'border-red-500' : ''}
            />
            {errors.farm_image_url && <p className="text-sm text-red-500">{errors.farm_image_url}</p>}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Farm'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 