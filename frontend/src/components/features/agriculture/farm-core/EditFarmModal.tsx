"use client";

import { Edit2, Trash2 } from "lucide-react";
import React, { useState } from "react";
import toast from "react-hot-toast";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  updateFarm,
  deleteFarm,
  CreateFarmData,
} from "@/services/supabaseService";
import { Farm } from "@/types/farm";


interface EditFarmModalProps {
  farm: Farm;
  onFarmUpdated: (farm: Farm) => void;
  onFarmDeleted: () => void;
  trigger?: React.ReactNode;
}

interface FormErrors {
  name?: string;
  location?: string;
  farm_image_url?: string;
}

export default function EditFarmModal({
  farm,
  onFarmUpdated,
  onFarmDeleted,
  trigger,
}: EditFarmModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const [formData, setFormData] = useState<CreateFarmData>({
    name: farm.name,
    location: farm.location || "",
    farm_image_url: farm.farm_image_url || "",
  });

  const [errors, setErrors] = useState<FormErrors>({});

  // Reset form data when farm changes or modal opens
  React.useEffect(() => {
    if (isOpen) {
      setFormData({
        name: farm.name,
        location: farm.location || "",
        farm_image_url: farm.farm_image_url || "",
      });
      setErrors({});
    }
  }, [farm, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Name validation (required, 3-50 chars)
    if (!formData.name.trim()) {
      newErrors.name = "Farm name is required";
    } else if (formData.name.trim().length < 3) {
      newErrors.name = "Farm name must be at least 3 characters";
    } else if (formData.name.trim().length > 50) {
      newErrors.name = "Farm name must be less than 50 characters";
    }

    // Location validation (optional, but if provided must be 3-100 chars)
    if (formData.location && formData.location.trim()) {
      if (formData.location.trim().length < 3) {
        newErrors.location = "Location must be at least 3 characters";
      } else if (formData.location.trim().length > 100) {
        newErrors.location = "Location must be less than 100 characters";
      }
    }

    // URL validation (optional, but if provided must be valid URL)
    if (formData.farm_image_url && formData.farm_image_url.trim()) {
      const urlPattern = /^https?:\/\/[\w\d.-]+\.[a-z]{2,}(?:\/[^\s]*)?$/;
      if (!urlPattern.test(formData.farm_image_url.trim())) {
        newErrors.farm_image_url = "Please enter a valid URL";
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
      const cleanedData: Partial<CreateFarmData> = {
        name: formData.name.trim(),
      };

      if (formData.location && formData.location.trim()) {
        cleanedData.location = formData.location.trim();
      }

      if (formData.farm_image_url && formData.farm_image_url.trim()) {
        cleanedData.farm_image_url = formData.farm_image_url.trim();
      }

      const updatedFarm = await updateFarm(farm.id, cleanedData);
      toast.success(`Farm "${updatedFarm.name}" updated successfully!`);

      setIsOpen(false);

      // Notify parent component (cast to match interface expectations)
      onFarmUpdated(updatedFarm as Farm);
    } catch (error: any) {
      console.error("Failed to update farm:", error);
      toast.error(error.message || "Failed to update farm");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (deleteConfirmText !== farm.name) {
      toast.error(
        "Farm name does not match. Please type the exact farm name to confirm deletion.",
      );
      return;
    }

    setIsDeleting(true);
    try {
      await deleteFarm(farm.id);
      toast.success(`Farm "${farm.name}" deleted successfully!`);

      setShowDeleteDialog(false);
      setIsOpen(false);
      setDeleteConfirmText("");

      // Notify parent component
      onFarmDeleted();
    } catch (error: any) {
      console.error("Failed to delete farm:", error);
      toast.error(error.message || "Failed to delete farm");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleInputChange = (
    field: keyof CreateFarmData,
    value: string | undefined,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const isDeleteDisabled = deleteConfirmText !== farm.name || isDeleting;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className="flex items-center gap-2">
            <Edit2 className="h-4 w-4" />
            Edit
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Farm</DialogTitle>
          <DialogDescription>
            Update farm details or delete this farm.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Farm Name *</Label>
            <Input
              id="edit-name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Enter farm name"
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-location">Location</Label>
            <Input
              id="edit-location"
              value={formData.location || ""}
              onChange={(e) => handleInputChange("location", e.target.value)}
              placeholder="Enter farm location"
              className={errors.location ? "border-red-500" : ""}
            />
            {errors.location && (
              <p className="text-sm text-red-500">{errors.location}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-farm_image_url">Farm Image URL</Label>
            <Input
              id="edit-farm_image_url"
              value={formData.farm_image_url || ""}
              onChange={(e) =>
                handleInputChange("farm_image_url", e.target.value)
              }
              placeholder="https://example.com/farm-plan.jpg"
              className={errors.farm_image_url ? "border-red-500" : ""}
            />
            {errors.farm_image_url && (
              <p className="text-sm text-red-500">{errors.farm_image_url}</p>
            )}
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <AlertDialog
              open={showDeleteDialog}
              onOpenChange={setShowDeleteDialog}
            >
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Farm
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Farm</AlertDialogTitle>
                  <AlertDialogDescription className="space-y-3">
                    <p>
                      This action cannot be undone. This will permanently delete
                      the farm{" "}
                      <span className="font-semibold">"{farm.name}"</span> and
                      all associated data including rows, racks, shelves, and
                      device assignments.
                    </p>
                    <div className="space-y-2">
                      <Label htmlFor="delete-confirm">
                        Type{" "}
                        <span className="font-semibold">"{farm.name}"</span> to
                        confirm:
                      </Label>
                      <Input
                        id="delete-confirm"
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        placeholder="Type farm name here"
                      />
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setDeleteConfirmText("")}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={isDeleteDisabled}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {isDeleting ? "Deleting..." : "Delete Farm"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Updating..." : "Update Farm"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
