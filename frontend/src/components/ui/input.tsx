import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const inputVariants = cva(
  "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex w-full min-w-0 rounded-md border bg-transparent text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
  {
    variants: {
      inputSize: {
        sm: "farm-input h-8 px-3 py-1 text-sm file:h-6",
        default: "farm-input h-9 px-3 py-1 file:h-7",
        lg: "farm-input h-10 px-4 py-2 text-base file:h-8",
      },
      validationState: {
        default:
          "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        success:
          "border-emerald-500 focus-visible:border-emerald-600 focus-visible:ring-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-400",
        warning:
          "border-amber-500 focus-visible:border-amber-600 focus-visible:ring-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-400",
        error:
          "border-red-500 focus-visible:border-red-600 focus-visible:ring-red-500/30 bg-red-50/50 dark:bg-red-950/20 dark:border-red-400",
        info: "border-blue-500 focus-visible:border-blue-600 focus-visible:ring-blue-500/30 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-400",
      },
    },
    defaultVariants: {
      inputSize: "default",
      validationState: "default",
    },
  },
);

const labelVariants = cva(
  "form-label text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
  {
    variants: {
      validationState: {
        default: "text-foreground",
        success: "text-emerald-700 dark:text-emerald-300",
        warning: "text-amber-700 dark:text-amber-300",
        error: "text-red-700 dark:text-red-300",
        info: "text-blue-700 dark:text-blue-300",
      },
      required: {
        true: "after:content-['*'] after:ml-0.5 after:text-red-500",
        false: "",
      },
    },
    defaultVariants: {
      validationState: "default",
      required: false,
    },
  },
);

export interface InputProps
  extends React.ComponentProps<"input">,
    VariantProps<typeof inputVariants> {
  error?: string;
  helperText?: string;
  label?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isLoading?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = "text",
      error,
      helperText,
      label,
      leftIcon,
      rightIcon,
      isLoading,
      inputSize,
      validationState,
      id,
      "aria-describedby": ariaDescribedBy,
      "aria-invalid": ariaInvalid,
      disabled,
      required,
      ...props
    },
    ref,
  ) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;
    const helperId = helperText ? `${inputId}-helper` : undefined;
    const errorId = error ? `${inputId}-error` : undefined;

    const describedBy =
      [ariaDescribedBy, helperId, errorId].filter(Boolean).join(" ") ||
      undefined;

    // Determine validation state based on error
    const currentValidationState = error
      ? "error"
      : validationState || "default";

    const inputElement = (
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
            {leftIcon}
          </div>
        )}

        <input
          type={type}
          id={inputId}
          ref={ref}
          data-slot="input"
          className={cn(
            inputVariants({
              inputSize,
              validationState: currentValidationState,
            }),
            leftIcon && "pl-10",
            rightIcon && "pr-10",
            isLoading && "pr-10",
            className,
          )}
          aria-describedby={describedBy}
          aria-invalid={error ? true : ariaInvalid}
          aria-required={required}
          disabled={disabled || isLoading}
          {...props}
        />

        {(rightIcon || isLoading) && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {isLoading ? (
              <svg
                className="animate-spin h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : (
              rightIcon
            )}
          </div>
        )}
      </div>
    );

    if (!label && !helperText && !error) {
      return inputElement;
    }

    return (
      <div className="space-y-2">
        {label && (
          <label
            htmlFor={inputId}
            className={labelVariants({
              validationState: currentValidationState,
              required: !!required,
            })}
          >
            {label}
          </label>
        )}

        {inputElement}

        {(helperText || error) && (
          <div className="space-y-1">
            {helperText && !error && (
              <p
                id={helperId}
                className="form-help text-xs text-muted-foreground"
              >
                {helperText}
              </p>
            )}

            {error && (
              <p
                id={errorId}
                className="form-error text-xs text-red-600 dark:text-red-400"
                role="alert"
                aria-live="polite"
              >
                {error}
              </p>
            )}
          </div>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";

export { Input, inputVariants, labelVariants };
