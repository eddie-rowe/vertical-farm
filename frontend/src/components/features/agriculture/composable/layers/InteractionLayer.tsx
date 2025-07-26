"use client";

import React, { useCallback } from "react";
import { toast } from "react-hot-toast";

import { cn } from "@/lib/utils";
import { Row, Rack, Shelf } from "@/types/farm";

import {
  useAreaInteractions,
  useAreaState,
} from "../providers/FarmAreaProvider";

interface InteractionLayerProps {
  children: React.ReactNode;
  className?: string;
}

export function InteractionLayer({
  children,
  className,
}: InteractionLayerProps) {
  return <div className={cn("relative", className)}>{children}</div>;
}

// ===== Row Interaction Wrapper =====

interface RowInteractionProps {
  row: Row;
  children: React.ReactNode;
  className?: string;
}

export function RowInteraction({
  row,
  children,
  className,
}: RowInteractionProps) {
  const { isDoubleClickEnabled, isSelectionEnabled, actions } =
    useAreaInteractions();
  const { selectedRow } = useAreaState();

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isSelectionEnabled) {
        actions.selectRow(row);
      }
    },
    [row, isSelectionEnabled, actions],
  );

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isDoubleClickEnabled) {
        toast.success(`Edit Row: ${row.name}`);
        // Future: trigger edit modal
      }
    },
    [row, isDoubleClickEnabled],
  );

  const isSelected = selectedRow?.id === row.id;

  return (
    <div
      className={cn(
        "transition-all duration-200 cursor-pointer",
        isSelected && "ring-2 ring-blue-500 ring-opacity-50",
        "hover:shadow-md",
        className,
      )}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      {children}
    </div>
  );
}

// ===== Rack Interaction Wrapper =====

interface RackInteractionProps {
  rack: Rack;
  children: React.ReactNode;
  className?: string;
}

export function RackInteraction({
  rack,
  children,
  className,
}: RackInteractionProps) {
  const { isDoubleClickEnabled, isSelectionEnabled, actions } =
    useAreaInteractions();
  const { selectedRack } = useAreaState();

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isSelectionEnabled) {
        actions.selectRack(rack);
      }
    },
    [rack, isSelectionEnabled, actions],
  );

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isDoubleClickEnabled) {
        toast.success(`Edit Rack: ${rack.name}`);
        // Future: trigger edit modal
      }
    },
    [rack, isDoubleClickEnabled],
  );

  const isSelected = selectedRack?.id === rack.id;

  return (
    <div
      className={cn(
        "transition-all duration-200 cursor-pointer",
        isSelected && "ring-2 ring-green-500 ring-opacity-50",
        "hover:shadow-sm hover:scale-[1.02]",
        className,
      )}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      {children}
    </div>
  );
}

// ===== Shelf Interaction Wrapper =====

interface ShelfInteractionProps {
  shelf: Shelf;
  children: React.ReactNode;
  className?: string;
}

export function ShelfInteraction({
  shelf,
  children,
  className,
}: ShelfInteractionProps) {
  const { isDoubleClickEnabled, isSelectionEnabled, actions } =
    useAreaInteractions();
  const { selectedShelf } = useAreaState();

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isSelectionEnabled) {
        actions.selectShelf(shelf);
      }
    },
    [shelf, isSelectionEnabled, actions],
  );

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isDoubleClickEnabled) {
        toast.success(`Edit Shelf: ${shelf.id}`);
        // Future: trigger edit modal
      }
    },
    [shelf, isDoubleClickEnabled],
  );

  const isSelected = selectedShelf?.id === shelf.id;

  return (
    <div
      className={cn(
        "transition-all duration-200 cursor-pointer",
        isSelected && "ring-2 ring-yellow-500 ring-opacity-50",
        "hover:bg-gray-50 dark:hover:bg-gray-800",
        className,
      )}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      {children}
    </div>
  );
}

// ===== Context Menu Support =====

interface ContextMenuProps {
  children: React.ReactNode;
  items: ContextMenuItem[];
  target: "row" | "rack" | "shelf";
}

interface ContextMenuItem {
  label: string;
  action: () => void;
  icon?: React.ReactNode;
  separator?: boolean;
  disabled?: boolean;
}

export function ContextMenu({ children, items, target }: ContextMenuProps) {
  const { isContextMenuEnabled } = useAreaInteractions();

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      if (isContextMenuEnabled) {
        e.preventDefault();
        e.stopPropagation();

        // For now, show the first few actions as toast
        // Future: implement proper context menu UI
        toast.success(
          `Context menu for ${target} (${items.length} actions available)`,
        );
      }
    },
    [isContextMenuEnabled, target, items],
  );

  return <div onContextMenu={handleContextMenu}>{children}</div>;
}

// ===== Selection Utilities =====

export function useSelectionUtils() {
  const { selectedRow, selectedRack, selectedShelf, selectedElement } =
    useAreaState();
  const { actions } = useAreaInteractions();

  return {
    // Current selections
    selectedRow,
    selectedRack,
    selectedShelf,
    selectedElement,

    // Selection state helpers
    hasSelection: !!(selectedRow || selectedRack || selectedShelf),
    selectionType: selectedElement?.type || null,

    // Selection actions
    clearSelection: () => {
      actions.selectRow(null);
      actions.selectRack(null);
      actions.selectShelf(null);
    },

    // Selection checks
    isRowSelected: (rowId: string) => selectedRow?.id === rowId,
    isRackSelected: (rackId: string) => selectedRack?.id === rackId,
    isShelfSelected: (shelfId: string) => selectedShelf?.id === shelfId,
  };
}

// ===== Keyboard Navigation =====

export function useKeyboardNavigation() {
  const { actions } = useAreaInteractions();

  return {
    handleKeyDown: useCallback(
      (e: React.KeyboardEvent) => {
        switch (e.key) {
          case "Escape":
            actions.selectRow(null);
            actions.selectRack(null);
            actions.selectShelf(null);
            break;
          case "Enter":
            if (e.ctrlKey || e.metaKey) {
              // Future: trigger edit mode
              toast("Edit mode shortcut", { icon: "ℹ️" });
            }
            break;
          case "Delete":
            // Future: trigger delete confirmation
            toast("Delete shortcut", { icon: "⚠️" });
            break;
          default:
            break;
        }
      },
      [actions],
    ),
  };
}

// ===== Touch/Mobile Support =====

export function useTouchInteractions() {
  const [touchStart, setTouchStart] = React.useState<{
    x: number;
    y: number;
  } | null>(null);
  const [longPressTimer, setLongPressTimer] =
    React.useState<NodeJS.Timeout | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });

    // Set up long press detection
    const timer = setTimeout(() => {
      toast("Long press detected", { icon: "👆" });
      // Future: trigger context menu
    }, 500);
    setLongPressTimer(timer);
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        setLongPressTimer(null);
      }
      setTouchStart(null);
    },
    [longPressTimer],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (touchStart && longPressTimer) {
        const touch = e.touches[0];
        const deltaX = Math.abs(touch.clientX - touchStart.x);
        const deltaY = Math.abs(touch.clientY - touchStart.y);

        // Cancel long press if user moves finger too much
        if (deltaX > 10 || deltaY > 10) {
          clearTimeout(longPressTimer);
          setLongPressTimer(null);
        }
      }
    },
    [touchStart, longPressTimer],
  );

  return {
    handleTouchStart,
    handleTouchEnd,
    handleTouchMove,
  };
}
