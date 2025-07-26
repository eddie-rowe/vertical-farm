import {
  Trash2,
  Copy,
  Move,
  CheckSquare,
  X,
  MoreHorizontal,
  Edit3,
  Archive,
} from "lucide-react";
import React, { useCallback } from "react";
import { toast } from "react-hot-toast";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Row, Rack, Shelf } from "@/types/farm-layout";

type SelectableElement = Row | Rack | Shelf;

interface BulkOperationsToolbarProps {
  selectedElements: SelectableElement[];
  selectionSummary: { row: number; rack: number; shelf: number };
  onBulkDelete: (elements: SelectableElement[]) => void;
  onBulkCopy: (elements: SelectableElement[]) => void;
  onBulkMove: (elements: SelectableElement[]) => void;
  onBulkEdit: (elements: SelectableElement[]) => void;
  onDeselectAll: () => void;
  className?: string;
}

export const BulkOperationsToolbar: React.FC<BulkOperationsToolbarProps> = ({
  selectedElements,
  selectionSummary,
  onBulkDelete,
  onBulkCopy,
  onBulkMove,
  onBulkEdit,
  onDeselectAll,
  className,
}) => {
  const totalSelected = selectedElements.length;

  const handleBulkDelete = useCallback(() => {
    if (totalSelected === 0) return;

    const confirmMessage = `Are you sure you want to delete ${totalSelected} selected ${totalSelected === 1 ? "item" : "items"}?`;

    if (confirm(confirmMessage)) {
      try {
        onBulkDelete(selectedElements);
        toast.success(
          `Deleted ${totalSelected} ${totalSelected === 1 ? "item" : "items"}`,
        );
      } catch (error) {
        toast.error("Failed to delete selected items");
      }
    }
  }, [selectedElements, totalSelected, onBulkDelete]);

  const handleBulkCopy = useCallback(() => {
    if (totalSelected === 0) return;

    try {
      onBulkCopy(selectedElements);
      toast.success(
        `Copied ${totalSelected} ${totalSelected === 1 ? "item" : "items"}`,
      );
    } catch (error) {
      toast.error("Failed to copy selected items");
    }
  }, [selectedElements, totalSelected, onBulkCopy]);

  const handleBulkMove = useCallback(() => {
    if (totalSelected === 0) return;

    try {
      onBulkMove(selectedElements);
      toast.success("Move operation initiated");
    } catch (error) {
      toast.error("Failed to move selected items");
    }
  }, [selectedElements, totalSelected, onBulkMove]);

  const handleBulkEdit = useCallback(() => {
    if (totalSelected === 0) return;

    try {
      onBulkEdit(selectedElements);
    } catch (error) {
      toast.error("Failed to edit selected items");
    }
  }, [selectedElements, totalSelected, onBulkEdit]);

  if (totalSelected === 0) return null;

  return (
    <div
      className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 ${className}`}
    >
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-4">
        <div className="flex items-center gap-4">
          {/* Selection Summary */}
          <div className="flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium">
              {totalSelected} selected
            </span>

            {/* Selection breakdown */}
            <div className="flex gap-1">
              {selectionSummary.row > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {selectionSummary.row} row
                  {selectionSummary.row !== 1 ? "s" : ""}
                </Badge>
              )}
              {selectionSummary.rack > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {selectionSummary.rack} rack
                  {selectionSummary.rack !== 1 ? "s" : ""}
                </Badge>
              )}
              {selectionSummary.shelf > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {selectionSummary.shelf} shelf
                  {selectionSummary.shelf !== 1 ? "ves" : ""}
                </Badge>
              )}
            </div>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Quick Actions */}
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={handleBulkEdit}
              className="gap-2"
            >
              <Edit3 className="w-3 h-3" />
              Edit
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={handleBulkCopy}
              className="gap-2"
            >
              <Copy className="w-3 h-3" />
              Copy
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={handleBulkMove}
              className="gap-2"
            >
              <Move className="w-3 h-3" />
              Move
            </Button>

            <Button
              size="sm"
              variant="destructive"
              onClick={handleBulkDelete}
              className="gap-2"
            >
              <Trash2 className="w-3 h-3" />
              Delete
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* More Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline">
                <MoreHorizontal className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => toast("Archive feature coming soon")}
              >
                <Archive className="w-3 h-3 mr-2" />
                Archive Selected
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => toast("Export feature coming soon")}
              >
                <Copy className="w-3 h-3 mr-2" />
                Export Selection
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => toast("Properties feature coming soon")}
              >
                <Edit3 className="w-3 h-3 mr-2" />
                Bulk Properties
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Separator orientation="vertical" className="h-6" />

          {/* Clear Selection */}
          <Button
            size="sm"
            variant="ghost"
            onClick={onDeselectAll}
            className="gap-2 text-slate-500 hover:text-slate-700"
          >
            <X className="w-3 h-3" />
            Clear
          </Button>
        </div>
      </div>
    </div>
  );
};
