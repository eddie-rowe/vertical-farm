"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

const farmCheckboxVariants = cva(
  "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground transition-all duration-150",
  {
    variants: {
      inputSize: {
        sm: "h-3 w-3",
        default: "h-4 w-4",
        lg: "h-5 w-5 touch-target",
      },
      validation: {
        default: "",
        success:
          "border-[--validation-success] data-[state=checked]:bg-[--validation-success]",
        warning:
          "border-[--validation-warning] data-[state=checked]:bg-[--validation-warning]",
        error:
          "border-[--validation-error] data-[state=checked]:bg-[--validation-error]",
        info: "border-[--validation-info] data-[state=checked]:bg-[--validation-info]",
      },
    },
    defaultVariants: {
      inputSize: "default",
      validation: "default",
    },
  },
);

export interface FarmCheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size" | "type">,
    VariantProps<typeof farmCheckboxVariants> {
  label?: string;
  description?: string;
  errorText?: string;
  onCheckedChange?: (checked: boolean) => void;
}

const FarmCheckbox = React.forwardRef<HTMLInputElement, FarmCheckboxProps>(
  (
    {
      className,
      inputSize,
      validation,
      label,
      description,
      errorText,
      onCheckedChange,
      onChange,
      ...props
    },
    ref,
  ) => {
    const checkboxId = React.useId();
    const descId = React.useId();
    const errorId = React.useId();

    // Determine validation state based on error
    const actualValidation = errorText ? "error" : validation;

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(event);
      onCheckedChange?.(event.target.checked);
    };

    return (
      <div className="flex items-start space-x-3">
        <div className="relative flex items-center">
          <input
            type="checkbox"
            id={checkboxId}
            className={cn(
              farmCheckboxVariants({ inputSize, validation: actualValidation }),
              "absolute opacity-0",
              className,
            )}
            ref={ref}
            onChange={handleChange}
            aria-describedby={cn(description && descId, errorText && errorId)}
            aria-invalid={errorText ? "true" : undefined}
            {...props}
          />
          <div
            className={cn(
              farmCheckboxVariants({ inputSize, validation: actualValidation }),
              "flex items-center justify-center",
            )}
          >
            <Check
              className={cn(
                "text-current opacity-0 transition-opacity duration-150",
                inputSize === "sm" && "h-2 w-2",
                inputSize === "default" && "h-3 w-3",
                inputSize === "lg" && "h-4 w-4",
              )}
              style={{
                opacity: props.checked || props.defaultChecked ? 1 : 0,
              }}
            />
          </div>
        </div>

        <div className="flex-1 space-y-1">
          {label && (
            <label
              htmlFor={checkboxId}
              className="form-label mb-0 cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {label}
            </label>
          )}

          {description && !errorText && (
            <p id={descId} className="form-help">
              {description}
            </p>
          )}

          {errorText && (
            <p id={errorId} className="form-error">
              {errorText}
            </p>
          )}
        </div>
      </div>
    );
  },
);

FarmCheckbox.displayName = "FarmCheckbox";

export { FarmCheckbox, farmCheckboxVariants };
