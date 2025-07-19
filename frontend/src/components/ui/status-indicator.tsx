import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const statusIndicatorVariants = cva(
  "rounded-full transition-all duration-200 flex-shrink-0",
  {
    variants: {
      status: {
        // Success/Active states - Green
        online:
          "bg-green-500 shadow-[0_0_0_2px_rgba(34,197,94,0.2)] dark:bg-green-400",
        active:
          "bg-green-500 shadow-[0_0_0_2px_rgba(34,197,94,0.2)] dark:bg-green-400",
        success:
          "bg-green-500 shadow-[0_0_0_2px_rgba(34,197,94,0.2)] dark:bg-green-400",
        connected:
          "bg-green-500 shadow-[0_0_0_2px_rgba(34,197,94,0.2)] dark:bg-green-400",

        // Warning states - Amber
        warning:
          "bg-amber-500 shadow-[0_0_0_2px_rgba(245,158,11,0.2)] dark:bg-amber-400",
        maintenance:
          "bg-amber-500 shadow-[0_0_0_2px_rgba(245,158,11,0.2)] dark:bg-amber-400",

        // Error/Offline states - Red
        offline:
          "bg-red-500 shadow-[0_0_0_2px_rgba(239,68,68,0.2)] dark:bg-red-400",
        error:
          "bg-red-500 shadow-[0_0_0_2px_rgba(239,68,68,0.2)] dark:bg-red-400",
        failed:
          "bg-red-500 shadow-[0_0_0_2px_rgba(239,68,68,0.2)] dark:bg-red-400",
        unavailable:
          "bg-red-500 shadow-[0_0_0_2px_rgba(239,68,68,0.2)] dark:bg-red-400",
        disconnected:
          "bg-red-500 shadow-[0_0_0_2px_rgba(239,68,68,0.2)] dark:bg-red-400",

        // Info/Pending states - Blue
        pending:
          "bg-blue-500 shadow-[0_0_0_2px_rgba(59,130,246,0.2)] dark:bg-blue-400",
        processing:
          "bg-blue-500 shadow-[0_0_0_2px_rgba(59,130,246,0.2)] dark:bg-blue-400 animate-pulse",
        info: "bg-blue-500 shadow-[0_0_0_2px_rgba(59,130,246,0.2)] dark:bg-blue-400",

        // Neutral/Unknown states - Gray
        inactive: "bg-gray-400 dark:bg-gray-500",
        unknown: "bg-gray-400 dark:bg-gray-500",
        disabled: "bg-gray-300 dark:bg-gray-600 opacity-60",
      },
      size: {
        xs: "w-1.5 h-1.5",
        sm: "w-2 h-2",
        md: "w-3 h-3",
        lg: "w-4 h-4",
        xl: "w-5 h-5",
      },
      pulse: {
        true: "animate-pulse",
        false: "",
      },
      variant: {
        default: "",
        bordered: "border-2 border-white dark:border-gray-800",
        ring: "ring-2 ring-white dark:ring-gray-800",
      },
    },
    defaultVariants: {
      status: "unknown",
      size: "md",
      pulse: false,
      variant: "default",
    },
  },
);

export interface StatusIndicatorProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statusIndicatorVariants> {
  ariaLabel?: string;
  position?:
    | "top-right"
    | "top-left"
    | "bottom-right"
    | "bottom-left"
    | "inline";
}

function StatusIndicator({
  className,
  status,
  size,
  pulse,
  variant,
  position = "inline",
  ariaLabel,
  ...props
}: StatusIndicatorProps) {
  const positionClasses = {
    "top-right": "absolute -top-0.5 -right-0.5",
    "top-left": "absolute -top-0.5 -left-0.5",
    "bottom-right": "absolute -bottom-0.5 -right-0.5",
    "bottom-left": "absolute -bottom-0.5 -left-0.5",
    inline: "inline-block",
  };

  return (
    <div
      className={cn(
        statusIndicatorVariants({ status, size, pulse, variant }),
        positionClasses[position],
        className,
      )}
      aria-label={ariaLabel || `Status: ${status}`}
      role="status"
      {...props}
    />
  );
}

export { StatusIndicator, statusIndicatorVariants };
