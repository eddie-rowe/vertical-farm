"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const farmInputVariants = cva(
  "farm-input",
  {
    variants: {
      inputSize: {
        sm: "farm-input-sm",
        default: "",
        lg: "farm-input-lg",
      },
      validation: {
        default: "",
        success: "input-success",
        warning: "input-warning",
        error: "input-error",
        info: "input-info",
      },
    },
    defaultVariants: {
      inputSize: "default",
      validation: "default",
    },
  }
);

export interface FarmInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof farmInputVariants> {
  label?: string;
  helpText?: string;
  errorText?: string;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
}

const FarmInput = React.forwardRef<HTMLInputElement, FarmInputProps>(
  ({ 
    className, 
    type = "text", 
    inputSize, 
    validation, 
    label, 
    helpText, 
    errorText, 
    icon, 
    iconPosition = "left",
    ...props 
  }, ref) => {
    const inputId = React.useId();
    const helpId = React.useId();
    const errorId = React.useId();
    
    // Determine validation state based on error
    const actualValidation = errorText ? "error" : validation;
    
    return (
      <div className="w-full">
        {label && (
          <label 
            htmlFor={inputId} 
            className="form-label"
          >
            {label}
          </label>
        )}
        
        <div className="relative">
          {icon && iconPosition === "left" && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
              {icon}
            </div>
          )}
          
          <input
            type={type}
            id={inputId}
            className={cn(
              farmInputVariants({ inputSize, validation: actualValidation }),
              icon && iconPosition === "left" && "pl-10",
              icon && iconPosition === "right" && "pr-10",
              className
            )}
            ref={ref}
            aria-describedby={cn(
              helpText && helpId,
              errorText && errorId
            )}
            aria-invalid={errorText ? "true" : undefined}
            {...props}
          />
          
          {icon && iconPosition === "right" && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
              {icon}
            </div>
          )}
        </div>
        
        {helpText && !errorText && (
          <span id={helpId} className="form-help">
            {helpText}
          </span>
        )}
        
        {errorText && (
          <span id={errorId} className="form-error">
            {errorText}
          </span>
        )}
      </div>
    );
  }
);

FarmInput.displayName = "FarmInput";

export { FarmInput, farmInputVariants }; 