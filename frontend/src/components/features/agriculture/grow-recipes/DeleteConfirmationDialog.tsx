"use client";

import { AlertTriangle } from "lucide-react";
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

import { GrowRecipe } from "@/types/grow-recipes";

interface DeleteConfirmationDialogProps {
  recipe: GrowRecipe | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteConfirmationDialog({
  recipe,
  onConfirm,
  onCancel,
}: DeleteConfirmationDialogProps) {
  return (
    <AlertDialog open={!!recipe} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Delete Grow Recipe
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete &quot;{recipe?.name}&quot;? This
            action cannot be undone.
            {recipe?.species?.name && (
              <span className="block mt-2 text-sm text-gray-600">
                Species: {recipe.species.name}
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            Delete Recipe
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
