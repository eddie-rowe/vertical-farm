import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from "lucide-react";
import React, {
  useState,
  useEffect,
  createContext,
  useContext,
  useCallback,
} from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  persistent?: boolean;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
  clearAllToasts: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

const ToastIcon: React.FC<{ type: ToastType }> = ({ type }) => {
  const iconClass = "w-5 h-5 shrink-0";

  switch (type) {
    case "success":
      return <CheckCircle className={cn(iconClass, "text-green-500")} />;
    case "error":
      return <AlertCircle className={cn(iconClass, "text-red-500")} />;
    case "warning":
      return <AlertTriangle className={cn(iconClass, "text-yellow-500")} />;
    case "info":
      return <Info className={cn(iconClass, "text-blue-500")} />;
  }
};

const ToastItem: React.FC<{
  toast: Toast;
  onRemove: (id: string) => void;
}> = ({ toast, onRemove }) => {
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    if (!toast.persistent && toast.duration !== 0) {
      const timer = setTimeout(() => {
        setIsLeaving(true);
        setTimeout(() => onRemove(toast.id), 300);
      }, toast.duration || 5000);

      return () => clearTimeout(timer);
    }
  }, [toast.id, toast.duration, toast.persistent, onRemove]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => onRemove(toast.id), 300);
  };

  return (
    <div
      className={cn(
        "group relative flex items-start gap-3 p-4 rounded-lg border shadow-lg transition-all duration-300 ease-in-out transform",
        "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700",
        !isLeaving && "animate-in slide-in-from-right-full",
        isLeaving && "animate-out slide-out-to-right-full opacity-0",
        "hover:shadow-xl hover:scale-[1.02]",
        toast.type === "success" && "border-l-4 border-l-green-500",
        toast.type === "error" && "border-l-4 border-l-red-500",
        toast.type === "warning" && "border-l-4 border-l-yellow-500",
        toast.type === "info" && "border-l-4 border-l-blue-500",
      )}
    >
      <ToastIcon type={toast.type} />

      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">
          {toast.title}
        </div>

        {toast.message && (
          <div className="text-sm text-slate-600 dark:text-slate-300 break-words">
            {toast.message}
          </div>
        )}

        {toast.action && (
          <div className="mt-3">
            <Button
              onClick={toast.action.onClick}
              size="sm"
              variant="outline"
              className="h-7 text-xs"
            >
              {toast.action.label}
            </Button>
          </div>
        )}
      </div>

      <button
        onClick={handleClose}
        className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-700 transition-colors"
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

const ToastContainer: React.FC<{
  toasts: Toast[];
  onRemove: (id: string) => void;
}> = ({ toasts, onRemove }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 w-96 max-w-[calc(100vw-2rem)] space-y-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider
      value={{ toasts, addToast, removeToast, clearAllToasts }}
    >
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
};

// Utility functions for common toast types
export const useToastHelpers = () => {
  const { addToast } = useToast();

  const showSuccess = useCallback(
    (title: string, message?: string, action?: Toast["action"]) => {
      addToast({ type: "success", title, message, action });
    },
    [addToast],
  );

  const showError = useCallback(
    (title: string, message?: string, action?: Toast["action"]) => {
      addToast({ type: "error", title, message, action, persistent: true });
    },
    [addToast],
  );

  const showWarning = useCallback(
    (title: string, message?: string, action?: Toast["action"]) => {
      addToast({ type: "warning", title, message, action, duration: 8000 });
    },
    [addToast],
  );

  const showInfo = useCallback(
    (title: string, message?: string, action?: Toast["action"]) => {
      addToast({ type: "info", title, message, action });
    },
    [addToast],
  );

  const showDeviceAlert = useCallback(
    (
      deviceName: string,
      alertType: "connected" | "disconnected" | "battery_low" | "sensor_error",
    ) => {
      const alerts = {
        connected: {
          type: "success" as ToastType,
          title: "Device Connected",
          message: `${deviceName} is now online and reporting data`,
        },
        disconnected: {
          type: "error" as ToastType,
          title: "Device Disconnected",
          message: `${deviceName} has lost connection. Check network or device status.`,
          action: {
            label: "View Details",
            onClick: () => console.log("Navigate to device details"),
          },
        },
        battery_low: {
          type: "warning" as ToastType,
          title: "Low Battery",
          message: `${deviceName} battery is below 20%. Consider charging or replacing.`,
        },
        sensor_error: {
          type: "error" as ToastType,
          title: "Sensor Error",
          message: `${deviceName} is reporting sensor malfunction. Maintenance required.`,
          action: {
            label: "Schedule Maintenance",
            onClick: () => console.log("Schedule maintenance"),
          },
        },
      };

      const alert = alerts[alertType];
      addToast(alert);
    },
    [addToast],
  );

  const showEnvironmentalAlert = useCallback(
    (
      location: string,
      metric: string,
      value: string,
      severity: "warning" | "critical",
    ) => {
      const type = severity === "critical" ? "error" : "warning";
      addToast({
        type,
        title: `${metric} Alert`,
        message: `${location} ${metric.toLowerCase()} is ${value}. Immediate attention required.`,
        persistent: severity === "critical",
        action: {
          label: "View Details",
          onClick: () => console.log("Navigate to environmental monitoring"),
        },
      });
    },
    [addToast],
  );

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showDeviceAlert,
    showEnvironmentalAlert,
  };
};
