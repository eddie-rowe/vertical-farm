"use client";

import {
  Edit,
  Trash2,
  Copy,
  Settings,
  Info,
  Plus,
  Eye,
  Move,
} from "lucide-react";
import { useEffect, useRef } from "react";

import { Card, CardContent } from "@/components/ui/card";

interface ContextMenuProps {
  visible: boolean;
  position: { x: number; y: number };
  element: {
    type: "farm" | "row" | "rack" | "shelf" | "device";
    id: string;
    data: any;
  } | null;
  onClose: () => void;
  onAction: (action: string, element: any) => void;
}

export default function ContextMenu({
  visible,
  position,
  element,
  onClose,
  onAction,
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (visible) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [visible, onClose]);

  if (!visible || !element) return null;

  const handleAction = (action: string) => {
    onAction(action, element);
    onClose();
  };

  const getMenuItems = (): Array<
    | { icon: any; label: string; action: string; destructive?: boolean }
    | { divider: true }
  > => {
    const { type } = element;

    const commonItems = [
      { icon: Info, label: "View Details", action: "view-details" },
      { icon: Edit, label: "Edit", action: "edit" },
      { icon: Copy, label: "Duplicate", action: "duplicate" },
      { icon: Move, label: "Move", action: "move" },
    ];

    const typeSpecificItems: Record<
      string,
      Array<{ icon: any; label: string; action: string; destructive?: boolean }>
    > = {
      farm: [
        { icon: Plus, label: "Add Row", action: "add-row" },
        { icon: Settings, label: "Farm Settings", action: "settings" },
      ],
      row: [
        { icon: Plus, label: "Add Rack", action: "add-rack" },
        {
          icon: Trash2,
          label: "Delete Row",
          action: "delete",
          destructive: true,
        },
      ],
      rack: [
        { icon: Plus, label: "Add Shelf", action: "add-shelf" },
        {
          icon: Trash2,
          label: "Delete Rack",
          action: "delete",
          destructive: true,
        },
      ],
      shelf: [
        { icon: Plus, label: "Add Device", action: "add-device" },
        {
          icon: Trash2,
          label: "Delete Shelf",
          action: "delete",
          destructive: true,
        },
      ],
      device: [
        { icon: Settings, label: "Configure", action: "configure" },
        { icon: Eye, label: "Show Data", action: "show-data" },
        {
          icon: Trash2,
          label: "Remove Device",
          action: "delete",
          destructive: true,
        },
      ],
    };

    return [
      ...commonItems,
      { divider: true },
      ...(typeSpecificItems[type] || []),
    ];
  };

  // Adjust menu position to stay within viewport
  const adjustedPosition = { ...position };
  if (menuRef.current) {
    const rect = menuRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (position.x + 200 > viewportWidth) {
      adjustedPosition.x = position.x - 200;
    }

    if (position.y + 300 > viewportHeight) {
      adjustedPosition.y = position.y - 300;
    }
  }

  return (
    <div
      ref={menuRef}
      className="fixed z-50"
      style={{
        left: `${adjustedPosition.x}px`,
        top: `${adjustedPosition.y}px`,
      }}
    >
      <Card className="shadow-lg border bg-white dark:bg-gray-900 min-w-[180px]">
        <CardContent className="p-1">
          {getMenuItems().map((item, index) => {
            if ("divider" in item) {
              return (
                <div
                  key={index}
                  className="border-t border-gray-200 dark:border-gray-700 my-1"
                />
              );
            }

            const Icon = item.icon;
            return (
              <button
                key={index}
                onClick={() => handleAction(item.action)}
                className={`w-full flex items-center space-x-2 px-3 py-2 text-sm rounded-md transition-colors ${
                  item.destructive
                    ? "hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                } text-left`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
