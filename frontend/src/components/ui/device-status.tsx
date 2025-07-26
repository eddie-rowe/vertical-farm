import { cva, type VariantProps } from "class-variance-authority";
import {
  Lightbulb,
  ToggleLeft,
  Thermometer,
  Fan,
  Droplets,
  Zap,
} from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

import { StatusBadge } from "./status-badge";
import { StatusIndicator } from "./status-indicator";

const deviceStatusVariants = cva(
  "relative inline-flex items-center justify-center rounded-full transition-all duration-200 cursor-default",
  {
    variants: {
      size: {
        sm: "h-6 w-6",
        md: "h-8 w-8",
        lg: "h-10 w-10",
        xl: "h-12 w-12",
      },
      variant: {
        icon: "",
        badge: "",
        compact: "gap-1",
      },
    },
    defaultVariants: {
      size: "md",
      variant: "icon",
    },
  },
);

export interface DeviceStatusProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof deviceStatusVariants> {
  // Device connectivity
  isOnline: boolean;

  // Device state
  deviceState: "on" | "off" | "unavailable" | "unknown";

  // Device type for icon selection
  deviceType?:
    | "light"
    | "switch"
    | "sensor"
    | "fan"
    | "pump"
    | "valve"
    | "climate"
    | "generic";

  // Display options
  showConnectivityIcon?: boolean;
  showDeviceIcon?: boolean;
  showStatusText?: boolean;
  customIcon?: React.ReactNode;

  // Labels
  deviceName?: string;
  ariaLabel?: string;
}

function DeviceStatus({
  className,
  size,
  variant,
  isOnline,
  deviceState,
  deviceType = "generic",
  showConnectivityIcon = false,
  showDeviceIcon = true,
  showStatusText = false,
  customIcon,
  deviceName,
  ariaLabel,
  ...props
}: DeviceStatusProps) {
  // Get device icon based on type
  const getDeviceIcon = () => {
    if (customIcon) return customIcon;

    const iconProps = {
      className: cn(
        "drop-shadow-sm",
        size === "sm" && "w-3 h-3",
        size === "md" && "w-4 h-4",
        size === "lg" && "w-5 h-5",
        size === "xl" && "w-6 h-6",
      ),
    };

    switch (deviceType) {
      case "light":
        return <Lightbulb {...iconProps} />;
      case "switch":
        return <ToggleLeft {...iconProps} />;
      case "sensor":
        return <Thermometer {...iconProps} />;
      case "fan":
        return <Fan {...iconProps} />;
      case "pump":
      case "valve":
        return <Droplets {...iconProps} />;
      case "climate":
        return <Thermometer {...iconProps} />;
      default:
        return <Zap {...iconProps} />;
    }
  };

  // Get device status color
  const getDeviceStatusColor = () => {
    if (!isOnline) return "bg-gray-400 text-white";

    switch (deviceState) {
      case "on":
        return deviceType === "light"
          ? "bg-yellow-400 text-black"
          : "bg-green-400 text-white";
      case "off":
        return "bg-gray-600 text-white";
      case "unavailable":
        return "bg-red-400 text-white";
      default:
        return "bg-gray-400 text-white";
    }
  };

  // Get status for badges
  const getConnectionStatus = () => {
    return isOnline ? "online" : "offline";
  };

  const getDeviceStatus = () => {
    if (!isOnline) return "offline";

    switch (deviceState) {
      case "on":
        return "active";
      case "off":
        return "inactive";
      case "unavailable":
        return "error";
      default:
        return "unknown";
    }
  };

  const statusText = isOnline
    ? deviceState === "on"
      ? "Active"
      : deviceState === "off"
        ? "Inactive"
        : "Unknown"
    : "Offline";

  const label =
    ariaLabel ||
    `${deviceName || deviceType} - ${statusText}${!isOnline ? " (Disconnected)" : ""}`;

  // Render based on variant
  if (variant === "badge") {
    return (
      <div className={cn("flex items-center gap-2", className)} {...props}>
        <StatusBadge
          status={getDeviceStatus()}
          size={
            size === "sm" ? "sm" : size === "lg" || size === "xl" ? "lg" : "md"
          }
          icon={showDeviceIcon ? getDeviceIcon() : undefined}
          ariaLabel={label}
        >
          {showStatusText ? statusText : deviceName || deviceType}
        </StatusBadge>
        {showConnectivityIcon && (
          <StatusIndicator
            status={getConnectionStatus()}
            size={size === "sm" ? "sm" : "md"}
            ariaLabel={`Connection: ${isOnline ? "Online" : "Offline"}`}
          />
        )}
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className={cn("flex items-center gap-1", className)} {...props}>
        <StatusIndicator
          status={getDeviceStatus()}
          size={
            size === "sm" ? "xs" : size === "lg" || size === "xl" ? "md" : "sm"
          }
        />
        {showDeviceIcon && (
          <span
            className={cn(
              "text-muted-foreground",
              size === "sm" && "w-3 h-3",
              size === "md" && "w-4 h-4",
              size === "lg" && "w-5 h-5",
              size === "xl" && "w-6 h-6",
            )}
          >
            {getDeviceIcon()}
          </span>
        )}
        {showStatusText && (
          <span className="text-xs text-muted-foreground">{statusText}</span>
        )}
      </div>
    );
  }

  // Default icon variant
  return (
    <div
      className={cn(
        deviceStatusVariants({ size, variant }),
        getDeviceStatusColor(),
        "hover:scale-105 hover:shadow-md",
        className,
      )}
      title={label}
      aria-label={label}
      role="status"
      {...props}
    >
      {showDeviceIcon && <div className="text-current">{getDeviceIcon()}</div>}

      {/* Connection status indicator */}
      <StatusIndicator
        status={getConnectionStatus()}
        size={
          size === "sm" ? "xs" : size === "lg" || size === "xl" ? "md" : "sm"
        }
        position="top-right"
        variant="bordered"
        ariaLabel={`Connection: ${isOnline ? "Online" : "Offline"}`}
      />
    </div>
  );
}

export { DeviceStatus, deviceStatusVariants };
