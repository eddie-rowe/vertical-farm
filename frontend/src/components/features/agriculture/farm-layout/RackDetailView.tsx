"use client";

import { useState, useEffect } from "react";
import { Rack, Shelf, UUID } from "@/types/farm"; // Removed SensorDevice
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PencilIcon, TrashIcon, PlusIcon } from "@heroicons/react/24/outline";
import EntityEditModal, { EntityType } from "./EntityEditModal";
import { ShelfSchema, ShelfFormData } from "@/lib/validations/shelfSchemas";
import { DefaultValues, FieldValues, SubmitHandler } from "react-hook-form";
import toast from "react-hot-toast";
import { v4 as uuidv4 } from "uuid";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface RackDetailViewProps {
  rackData: Rack | null;
  editMode: boolean;
  onRackDataChange: (updatedRackData: Rack) => void;
  onBack: () => void;
}

export default function RackDetailView({
  rackData,
  editMode,
  onRackDataChange,
  onBack,
}: RackDetailViewProps) {
  const [internalRackData, setInternalRackData] = useState<Rack | null>(null);
  const [shelfModal, setShelfModal] = useState<{
    entity: Partial<ShelfFormData> | null;
    isNew: boolean;
  }>({ entity: null, isNew: false });
  const [confirmShelfDeleteDialog, setConfirmShelfDeleteDialog] = useState<{
    open: boolean;
    shelfIdToDelete?: UUID;
    shelfName?: string;
  }>({ open: false });

  useEffect(() => {
    // Deep copy rackData to internal state to avoid direct mutation
    setInternalRackData(rackData ? JSON.parse(JSON.stringify(rackData)) : null);
  }, [rackData]);

  const handleShelfUpdate = (updatedShelves: Shelf[]) => {
    if (internalRackData) {
      const newRackData = { ...internalRackData, shelves: updatedShelves };
      setInternalRackData(newRackData);
      onRackDataChange(newRackData); // Propagate changes up
    }
  };

  // Placeholder for opening shelf edit/create modal
  const openShelfModal = (shelf?: Shelf, isNew: boolean = false) => {
    if (!internalRackData) return;
    if (isNew) {
      setShelfModal({
        entity: {
          rack_id: internalRackData.id,
          name: "New Shelf",
        },
        isNew: true,
      });
    } else if (shelf) {
      // Ensure all necessary fields are present for the form
      const shelfFormData: Partial<ShelfFormData> = {
        id: shelf.id,
        rack_id: shelf.rack_id,
        name: shelf.name,
      };
      setShelfModal({ entity: shelfFormData, isNew: false });
    } else {
      toast.error("Cannot open modal: Shelf data is missing for edit.");
    }
  };

  const closeShelfModal = () => {
    setShelfModal({ entity: null, isNew: false });
  };

  const saveShelfModal: SubmitHandler<FieldValues> = (formValues) => {
    if (!internalRackData) {
      toast.error("Cannot save shelf: Rack data is missing.");
      closeShelfModal();
      return;
    }

    const castFormValues = formValues as ShelfFormData;
    let updatedShelves: Shelf[];

    if (shelfModal.isNew) {
      const newShelf: Shelf = {
        ...castFormValues,
        id: uuidv4() as UUID,
        rack_id: internalRackData.id, // Ensure rack_id is correctly assigned
        devices: [], // Initialize with empty devices array
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      updatedShelves = [...(internalRackData.shelves || []), newShelf];
      toast.success("Shelf added successfully!");
    } else if (shelfModal.entity && shelfModal.entity.id) {
      const existingShelfId = shelfModal.entity.id as UUID;
      updatedShelves = (internalRackData.shelves || []).map((s) =>
        s.id === existingShelfId
          ? { ...s, ...castFormValues, id: existingShelfId }
          : s,
      );
      toast.success("Shelf updated successfully!");
    } else {
      toast.error("Could not save shelf: Invalid modal state.");
      closeShelfModal();
      return;
    }
    handleShelfUpdate(updatedShelves);
    closeShelfModal();
  };

  // Placeholder for deleting a shelf
  const requestDeleteShelf = (shelfId: UUID) => {
    if (!internalRackData || !internalRackData.shelves) return;
    const shelfToDelete = internalRackData.shelves.find(
      (s) => s.id === shelfId,
    );
    if (shelfToDelete) {
      setConfirmShelfDeleteDialog({
        open: true,
        shelfIdToDelete: shelfId,
        shelfName: shelfToDelete.name,
      });
    } else {
      toast.error("Shelf not found for deletion.");
    }
  };

  const handleConfirmDeleteShelf = () => {
    if (!internalRackData || !confirmShelfDeleteDialog.shelfIdToDelete) return;
    const updatedShelves = (internalRackData.shelves || []).filter(
      (s) => s.id !== confirmShelfDeleteDialog.shelfIdToDelete,
    );
    handleShelfUpdate(updatedShelves);
    toast.success(`Shelf "${confirmShelfDeleteDialog.shelfName}" deleted.`);
    setConfirmShelfDeleteDialog({ open: false });
  };

  const handleCancelDeleteShelf = () => {
    setConfirmShelfDeleteDialog({ open: false });
  };

  if (!internalRackData) {
    return (
      <div className="text-center py-10">
        <p>No rack data available or rack not found.</p>
        <Button onClick={onBack} variant="outline" className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="gradient-rack-detail card-shadow animate-pop">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-semibold">
            Rack: {internalRackData.name}
          </CardTitle>
          <div className="flex items-center space-x-2">
            {editMode && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => alert("Rack editing UI not yet implemented.")}
              >
                <PencilIcon className="h-5 w-5" />
              </Button>
            )}
            <Button onClick={onBack} variant="outline">
              Back to Farm View
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p>
            <span className="font-medium">ID:</span> {internalRackData.id}
          </p>
          <p>
            <span className="font-medium">Total Shelves:</span>{" "}
            {internalRackData.shelves?.length || 0}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold">Shelves</CardTitle>
          {editMode && (
            <Button
              onClick={() => openShelfModal(undefined, true)}
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <PlusIcon className="h-4 w-4 mr-2" /> Add Shelf
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {internalRackData.shelves && internalRackData.shelves.length > 0 ? (
            <ul className="space-y-3">
              {internalRackData.shelves.map((shelf) => (
                <li
                  key={shelf.id}
                  className="p-3 border rounded-md bg-slate-50 dark:bg-slate-800 shadow-sm"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{shelf.name}</span>
                    {editMode && (
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => openShelfModal(shelf)}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => requestDeleteShelf(shelf.id)}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Shelf ID: {shelf.id}
                  </p>
                  {/* Devices/Sensors display can be added here later */}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500 italic">
              {editMode
                ? "No shelves in this rack. Click 'Add Shelf' to create one."
                : "No shelves configured for this rack."}
            </p>
          )}
        </CardContent>
      </Card>

      {shelfModal.entity && (
        <EntityEditModal
          open={!!shelfModal.entity}
          onClose={closeShelfModal}
          defaultValues={shelfModal.entity as DefaultValues<FieldValues>}
          onSave={saveShelfModal}
          title={`${shelfModal.isNew ? "Create New" : "Edit"} Shelf`}
          entityType={"shelf" as EntityType}
          validationSchema={ShelfSchema}
        />
      )}

      <AlertDialog
        open={confirmShelfDeleteDialog.open}
        onOpenChange={(open) => !open && handleCancelDeleteShelf()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              shelf &quot;{confirmShelfDeleteDialog.shelfName}&quot;. All
              devices and sensors on this shelf will also be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelDeleteShelf}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteShelf}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Shelf
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
