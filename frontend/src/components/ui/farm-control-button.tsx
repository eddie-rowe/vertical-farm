"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const farmControlButtonVariants = cva(
  "farm-control-btn", // Uses our new @utility farm-control-btn
  {
    variants: {
      variant: {
        default: "",
        primary: "state-active",
        maintenance: "state-maintenance", 
        offline: "state-offline",
        growing: "state-growing"
      },
      size: {
        default: "",
        sm: "w-8 h-8 text-sm",
        lg: "w-12 h-12 text-lg"
      },
      animation: {
        none: "",
        float: "animate-float",
        pop: "animate-pop"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      animation: "none"
    },
  }
)

export interface FarmControlButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof farmControlButtonVariants> {
  icon?: React.ReactNode
}

const FarmControlButton = React.forwardRef<HTMLButtonElement, FarmControlButtonProps>(
  ({ className, variant, size, animation, icon, children, ...props }, ref) => {
    return (
      <button
        className={cn(farmControlButtonVariants({ variant, size, animation, className }))}
        ref={ref}
        {...props}
      >
        {icon && <span className="flex items-center justify-center">{icon}</span>}
        {children}
      </button>
    )
  }
)
FarmControlButton.displayName = "FarmControlButton"

export { FarmControlButton, farmControlButtonVariants } 