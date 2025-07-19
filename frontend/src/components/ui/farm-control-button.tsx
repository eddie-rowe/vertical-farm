"use client";

import * as React from "react";
import { type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Button, ButtonProps } from "./button";

// Legacy variant mapping for FarmControlButton
const farmVariantMap = {
  default: "default" as const,
  primary: "primary" as const,
  maintenance: "maintenance" as const,
  offline: "offline" as const,
  growing: "growing" as const,
};

// Legacy size mapping for FarmControlButton
const farmSizeMap = {
  default: "control" as const, // Use new control size for proper touch targets
  sm: "sm" as const,
  lg: "lg" as const,
};

export interface FarmControlButtonProps
  extends Omit<ButtonProps, "variant" | "size"> {
  variant?: keyof typeof farmVariantMap;
  size?: keyof typeof farmSizeMap;
  icon?: React.ReactNode;
}

const FarmControlButton = React.forwardRef<
  HTMLButtonElement,
  FarmControlButtonProps
>(
  (
    {
      className,
      variant = "default",
      size = "default",
      icon,
      children,
      ...props
    },
    ref,
  ) => {
    // Map legacy props to Button component props
    const buttonVariant = farmVariantMap[variant];
    const buttonSize = farmSizeMap[size];

    return (
      <Button
        ref={ref}
        variant={buttonVariant}
        size={buttonSize}
        className={cn(className)}
        icon={icon}
        iconPosition="left"
        {...props}
      >
        {children}
      </Button>
    );
  },
);
FarmControlButton.displayName = "FarmControlButton";

// Preserve legacy variant types for backward compatibility
export const farmControlButtonVariants = {
  variant: farmVariantMap,
  size: farmSizeMap,
};

export { FarmControlButton };
