import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { badgeVariants } from "./badge"

const statusBadgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      status: {
        // Success/Active states - Green
        online: "border-transparent bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30",
        active: "border-transparent bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30",
        success: "border-transparent bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30",
        connected: "border-transparent bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30",
        
        // Warning states - Amber
        warning: "border-transparent bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:hover:bg-amber-900/30",
        maintenance: "border-transparent bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:hover:bg-amber-900/30",
        
        // Error/Offline states - Red
        offline: "border-transparent bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30",
        error: "border-transparent bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30",
        failed: "border-transparent bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30",
        unavailable: "border-transparent bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30",
        disconnected: "border-transparent bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30",
        
        // Info/Pending states - Blue
        pending: "border-transparent bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30",
        processing: "border-transparent bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30 animate-pulse",
        info: "border-transparent bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30",
        
        // Neutral/Unknown states - Gray
        inactive: "border-transparent bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700",
        unknown: "border-transparent bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700",
        disabled: "border-transparent bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500 opacity-60",
        
        // Outline variants
        "outline-online": "text-green-700 border-green-200 hover:bg-green-50 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-900/10",
        "outline-warning": "text-amber-700 border-amber-200 hover:bg-amber-50 dark:text-amber-400 dark:border-amber-800 dark:hover:bg-amber-900/10",
        "outline-error": "text-red-700 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/10",
        "outline-info": "text-blue-700 border-blue-200 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-900/10",
      },
      size: {
        sm: "h-5 px-2 py-0.5 text-xs",
        md: "h-6 px-2.5 py-0.5 text-xs",
        lg: "h-7 px-3 py-1 text-sm",
      },
      pulse: {
        true: "animate-pulse",
        false: "",
      },
    },
    defaultVariants: {
      status: "unknown",
      size: "md",
      pulse: false,
    },
  }
)

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statusBadgeVariants> {
  icon?: React.ReactNode
  hideText?: boolean
  ariaLabel?: string
}

function StatusBadge({ 
  className, 
  status, 
  size, 
  pulse, 
  icon, 
  hideText = false,
  ariaLabel,
  children,
  ...props 
}: StatusBadgeProps) {
  return (
    <div 
      className={cn(statusBadgeVariants({ status, size, pulse }), className)} 
      aria-label={ariaLabel || (typeof children === 'string' ? children : undefined)}
      role="status"
      {...props}
    >
      {icon && (
        <span className={cn(
          "flex-shrink-0",
          !hideText && children && "mr-1",
          size === "sm" && "w-3 h-3",
          size === "md" && "w-3.5 h-3.5", 
          size === "lg" && "w-4 h-4"
        )}>
          {icon}
        </span>
      )}
      {!hideText && children}
    </div>
  )
}

export { StatusBadge, statusBadgeVariants } 