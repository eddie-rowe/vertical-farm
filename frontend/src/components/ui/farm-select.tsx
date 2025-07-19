"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

const farmSelectVariants = cva("farm-input appearance-none cursor-pointer", {
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
});

export interface FarmSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface FarmSelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size">,
    VariantProps<typeof farmSelectVariants> {
  label?: string;
  helpText?: string;
  errorText?: string;
  options: FarmSelectOption[];
  placeholder?: string;
}

const FarmSelect = React.forwardRef<HTMLSelectElement, FarmSelectProps>(
  (
    {
      className,
      inputSize,
      validation,
      label,
      helpText,
      errorText,
      options,
      placeholder,
      ...props
    },
    ref,
  ) => {
    const selectId = React.useId();
    const helpId = React.useId();
    const errorId = React.useId();

    // Determine validation state based on error
    const actualValidation = errorText ? "error" : validation;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="form-label">
            {label}
          </label>
        )}

        <div className="relative">
          <select
            id={selectId}
            className={cn(
              farmSelectVariants({ inputSize, validation: actualValidation }),
              "pr-10",
              className,
            )}
            ref={ref}
            aria-describedby={cn(helpText && helpId, errorText && errorId)}
            aria-invalid={errorText ? "true" : undefined}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>

          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none">
            <ChevronDown className="h-4 w-4" />
          </div>
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
  },
);

FarmSelect.displayName = "FarmSelect";

export { FarmSelect, farmSelectVariants };
