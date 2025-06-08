import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps extends React.ComponentProps<"input"> {
  error?: string;
  helperText?: string;
  label?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isLoading?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    type = "text", 
    error, 
    helperText, 
    label, 
    leftIcon, 
    rightIcon, 
    isLoading,
    id,
    "aria-describedby": ariaDescribedBy,
    "aria-invalid": ariaInvalid,
    disabled,
    required,
    ...props 
  }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;
    const helperId = helperText ? `${inputId}-helper` : undefined;
    const errorId = error ? `${inputId}-error` : undefined;
    
    const describedBy = [
      ariaDescribedBy,
      helperId,
      errorId,
    ].filter(Boolean).join(' ') || undefined;

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
            "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
            "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
            leftIcon && "pl-10",
            rightIcon && "pr-10",
            isLoading && "pr-10",
            error && "border-destructive",
            className
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
            className={cn(
              "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
              error && "text-destructive",
              required && "after:content-['*'] after:ml-0.5 after:text-destructive"
            )}
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
                className="text-xs text-muted-foreground"
              >
                {helperText}
              </p>
            )}
            
            {error && (
              <p
                id={errorId}
                className="text-xs text-destructive"
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
  }
)

Input.displayName = "Input"

export { Input }
