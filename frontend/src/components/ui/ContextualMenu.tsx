import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  Plus,
  Settings,
  BarChart3,
  Calendar,
  AlertTriangle,
  Copy,
  Trash2,
  Edit,
  Eye,
  Zap,
  Activity,
  Leaf,
  Play,
  Pause,
  Square,
  Scissors,
} from "lucide-react";

interface MenuAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  shortcut?: string;
  danger?: boolean;
  disabled?: boolean;
  submenu?: MenuAction[];
  onClick?: () => void;
}

interface ContextualMenuProps {
  trigger: React.ReactNode;
  actions: MenuAction[];
  elementType: "shelf" | "rack" | "row";
  elementName: string;
}

export const ContextualMenu: React.FC<ContextualMenuProps> = ({
  trigger,
  actions,
  elementType,
  elementName,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [submenuOpen, setSubmenuOpen] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    setPosition({ x: event.clientX, y: event.clientY });
    setIsOpen(true);
  };

  const handleClick = (action: MenuAction) => {
    if (action.submenu) {
      setSubmenuOpen(submenuOpen === action.id ? null : action.id);
    } else {
      action.onClick?.();
      setIsOpen(false);
      setSubmenuOpen(null);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSubmenuOpen(null);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const handleEscape = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      setIsOpen(false);
      setSubmenuOpen(null);
    }
  };

  const adjustPosition = (x: number, y: number) => {
    const menuWidth = 240;
    const menuHeight = actions.length * 40 + 20;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let adjustedX = x;
    let adjustedY = y;

    // Adjust horizontal position
    if (x + menuWidth > viewportWidth) {
      adjustedX = viewportWidth - menuWidth - 10;
    }

    // Adjust vertical position
    if (y + menuHeight > viewportHeight) {
      adjustedY = viewportHeight - menuHeight - 10;
    }

    return { x: Math.max(10, adjustedX), y: Math.max(10, adjustedY) };
  };

  const renderMenuItem = (action: MenuAction, isSubmenu = false) => (
    <div
      key={action.id}
      className={cn(
        "group relative flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-colors",
        !action.disabled && "hover:bg-slate-100 dark:hover:bg-slate-700",
        action.disabled && "opacity-50 cursor-not-allowed",
        action.danger &&
          !action.disabled &&
          "hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400",
        isSubmenu && "text-sm",
      )}
      onClick={() => !action.disabled && handleClick(action)}
    >
      <div className="flex items-center justify-center w-4 h-4 text-slate-500 dark:text-slate-400 group-hover:text-inherit">
        {action.icon}
      </div>

      <span className="flex-1 text-slate-700 dark:text-slate-300 group-hover:text-inherit">
        {action.label}
      </span>

      {action.shortcut && (
        <span className="text-xs text-slate-400 dark:text-slate-500">
          {action.shortcut}
        </span>
      )}

      {action.submenu && (
        <div className="w-3 h-3 text-slate-400 dark:text-slate-500">▶</div>
      )}
    </div>
  );

  const adjustedPosition = adjustPosition(position.x, position.y);

  return (
    <>
      <div
        ref={triggerRef}
        onContextMenu={handleContextMenu}
        className="w-full h-full"
      >
        {trigger}
      </div>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-50" />

          {/* Menu */}
          <div
            ref={menuRef}
            className="fixed z-50 w-60 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl py-2"
            style={{
              left: adjustedPosition.x,
              top: adjustedPosition.y,
            }}
          >
            {/* Header */}
            <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-700">
              <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                {elementName}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                {elementType} actions
              </div>
            </div>

            {/* Actions */}
            <div className="py-1 space-y-0.5">
              {actions.map((action) => renderMenuItem(action))}
            </div>
          </div>
        </>
      )}
    </>
  );
};

// Common action sets for different element types
export const getShelfActions = (
  onEdit: () => void,
  onViewDetails: () => void,
  onAddDevice: () => void,
  onClone: () => void,
  onDelete: () => void,
  onManageDevices: () => void,
  onViewMetrics: () => void,
  onStartNewGrow: () => void,
  onViewGrowDetails: () => void,
  onPauseGrow: () => void,
  onResumeGrow: () => void,
  onHarvestGrow: () => void,
  hasActiveGrow: boolean = false,
): MenuAction[] => [
  {
    id: "view",
    label: "View Details",
    icon: <Eye className="w-4 h-4" />,
    shortcut: "Enter",
    onClick: onViewDetails,
  },
  {
    id: "edit",
    label: "Edit Shelf",
    icon: <Edit className="w-4 h-4" />,
    shortcut: "E",
    onClick: onEdit,
  },
  {
    id: "grow-operations",
    label: "Grow Operations",
    icon: <Leaf className="w-4 h-4" />,
    submenu: hasActiveGrow
      ? [
          {
            id: "view-grow",
            label: "View Grow Details",
            icon: <Eye className="w-4 h-4" />,
            onClick: onViewGrowDetails,
          },
          {
            id: "pause-grow",
            label: "Pause Grow",
            icon: <Pause className="w-4 h-4" />,
            onClick: onPauseGrow,
          },
          {
            id: "resume-grow",
            label: "Resume Grow",
            icon: <Play className="w-4 h-4" />,
            onClick: onResumeGrow,
          },
          {
            id: "harvest-grow",
            label: "Harvest",
            icon: <Scissors className="w-4 h-4" />,
            onClick: onHarvestGrow,
          },
          {
            id: "start-new-grow",
            label: "Start New Grow",
            icon: <Plus className="w-4 h-4" />,
            onClick: onStartNewGrow,
          },
        ]
      : [
          {
            id: "start-new-grow",
            label: "Start New Grow",
            icon: <Plus className="w-4 h-4" />,
            onClick: onStartNewGrow,
          },
        ],
  },
  {
    id: "devices",
    label: "Manage Devices",
    icon: <Zap className="w-4 h-4" />,
    submenu: [
      {
        id: "add-device",
        label: "Add Device",
        icon: <Plus className="w-4 h-4" />,
        onClick: onAddDevice,
      },
      {
        id: "manage-all",
        label: "Manage All",
        icon: <Settings className="w-4 h-4" />,
        onClick: onManageDevices,
      },
    ],
  },
  {
    id: "monitoring",
    label: "View Metrics",
    icon: <BarChart3 className="w-4 h-4" />,
    onClick: onViewMetrics,
  },
  {
    id: "clone",
    label: "Clone Shelf",
    icon: <Copy className="w-4 h-4" />,
    shortcut: "Ctrl+D",
    onClick: onClone,
  },
  {
    id: "delete",
    label: "Delete Shelf",
    icon: <Trash2 className="w-4 h-4" />,
    shortcut: "Del",
    danger: true,
    onClick: onDelete,
  },
];

export const getRackActions = (
  onEdit: () => void,
  onViewDetails: () => void,
  onAddShelf: () => void,
  onClone: () => void,
  onDelete: () => void,
  onViewMetrics: () => void,
): MenuAction[] => [
  {
    id: "view",
    label: "View Details",
    icon: <Eye className="w-4 h-4" />,
    shortcut: "Enter",
    onClick: onViewDetails,
  },
  {
    id: "edit",
    label: "Edit Rack",
    icon: <Edit className="w-4 h-4" />,
    shortcut: "E",
    onClick: onEdit,
  },
  {
    id: "add-shelf",
    label: "Add Shelf",
    icon: <Plus className="w-4 h-4" />,
    shortcut: "A",
    onClick: onAddShelf,
  },
  {
    id: "monitoring",
    label: "View Metrics",
    icon: <BarChart3 className="w-4 h-4" />,
    onClick: onViewMetrics,
  },
  {
    id: "clone",
    label: "Clone Rack",
    icon: <Copy className="w-4 h-4" />,
    shortcut: "Ctrl+D",
    onClick: onClone,
  },
  {
    id: "delete",
    label: "Delete Rack",
    icon: <Trash2 className="w-4 h-4" />,
    shortcut: "Del",
    danger: true,
    onClick: onDelete,
  },
];

export const getRowActions = (
  onEdit: () => void,
  onViewDetails: () => void,
  onAddRack: () => void,
  onClone: () => void,
  onDelete: () => void,
  onViewMetrics: () => void,
): MenuAction[] => [
  {
    id: "view",
    label: "View Details",
    icon: <Eye className="w-4 h-4" />,
    shortcut: "Enter",
    onClick: onViewDetails,
  },
  {
    id: "edit",
    label: "Edit Row",
    icon: <Edit className="w-4 h-4" />,
    shortcut: "E",
    onClick: onEdit,
  },
  {
    id: "add-rack",
    label: "Add Rack",
    icon: <Plus className="w-4 h-4" />,
    shortcut: "A",
    onClick: onAddRack,
  },
  {
    id: "monitoring",
    label: "View Metrics",
    icon: <BarChart3 className="w-4 h-4" />,
    onClick: onViewMetrics,
  },
  {
    id: "clone",
    label: "Clone Row",
    icon: <Copy className="w-4 h-4" />,
    shortcut: "Ctrl+D",
    onClick: onClone,
  },
  {
    id: "delete",
    label: "Delete Row",
    icon: <Trash2 className="w-4 h-4" />,
    shortcut: "Del",
    danger: true,
    onClick: onDelete,
  },
];
