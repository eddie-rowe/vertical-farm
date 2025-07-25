"use client";

import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const farmRangeSliderVariants = cva(
  "relative flex w-full touch-none select-none items-center",
  {
    variants: {
      inputSize: {
        sm: "h-4",
        default: "h-5",
        lg: "h-6 touch-target",
      },
    },
    defaultVariants: {
      inputSize: "default",
    },
  },
);

const farmRangeTrackVariants = cva(
  "relative h-2 w-full grow overflow-hidden rounded-full bg-secondary",
  {
    variants: {
      inputSize: {
        sm: "h-1.5",
        default: "h-2",
        lg: "h-3",
      },
    },
    defaultVariants: {
      inputSize: "default",
    },
  },
);

const farmRangeThumbVariants = cva(
  "block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      inputSize: {
        sm: "h-4 w-4",
        default: "h-5 w-5",
        lg: "h-6 w-6",
      },
    },
    defaultVariants: {
      inputSize: "default",
    },
  },
);

export interface FarmRangeSliderProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size" | "type">,
    VariantProps<typeof farmRangeSliderVariants> {
  label?: string;
  helpText?: string;
  errorText?: string;
  min?: number;
  max?: number;
  step?: number;
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  unit?: string;
  showValue?: boolean;
  markPoints?: Array<{ value: number; label: string }>;
}

const FarmRangeSlider = React.forwardRef<
  HTMLInputElement,
  FarmRangeSliderProps
>(
  (
    {
      className,
      inputSize,
      label,
      helpText,
      errorText,
      min = 0,
      max = 100,
      step = 1,
      value,
      defaultValue,
      onValueChange,
      onChange,
      unit,
      showValue = true,
      markPoints = [],
      ...props
    },
    ref,
  ) => {
    const sliderId = React.useId();
    const helpId = React.useId();
    const errorId = React.useId();

    const [localValue, setLocalValue] = React.useState(
      value ?? defaultValue ?? min,
    );
    const displayValue = value ?? localValue;

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = Number(event.target.value);
      setLocalValue(newValue);
      onChange?.(event);
      onValueChange?.(newValue);
    };

    const percentage = ((displayValue - min) / (max - min)) * 100;

    return (
      <div className="w-full space-y-2">
        <div className="flex items-center justify-between">
          {label && (
            <label htmlFor={sliderId} className="form-label mb-0">
              {label}
            </label>
          )}
          {showValue && (
            <span className="text-sm font-medium text-foreground">
              {displayValue}
              {unit}
            </span>
          )}
        </div>

        <div className={cn(farmRangeSliderVariants({ inputSize }), className)}>
          <div className={cn(farmRangeTrackVariants({ inputSize }))}>
            <div
              className="absolute h-full bg-primary rounded-full"
              style={{ width: `${percentage}%` }}
            />
          </div>

          <input
            type="range"
            id={sliderId}
            min={min}
            max={max}
            step={step}
            value={displayValue}
            onChange={handleChange}
            className={cn(
              "absolute w-full h-full opacity-0 cursor-pointer",
              "[&::-webkit-slider-thumb]:appearance-none",
              "[&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5",
              "[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary",
              "[&::-webkit-slider-thumb]:cursor-pointer",
              "[&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:border-none",
              "[&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5",
              "[&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary",
              "[&::-moz-range-thumb]:cursor-pointer",
              inputSize === "lg" && "touch-target",
            )}
            ref={ref}
            aria-describedby={cn(helpText && helpId, errorText && errorId)}
            aria-invalid={errorText ? "true" : undefined}
            {...props}
          />

          <div
            className={cn(farmRangeThumbVariants({ inputSize }))}
            style={{
              position: "absolute",
              left: `calc(${percentage}% - ${inputSize === "sm" ? "8px" : inputSize === "lg" ? "12px" : "10px"})`,
              pointerEvents: "none",
            }}
          />
        </div>

        {markPoints.length > 0 && (
          <div className="flex justify-between text-xs text-muted-foreground px-1">
            {markPoints.map((mark, index) => (
              <span key={index} className="text-center">
                {mark.label}
              </span>
            ))}
          </div>
        )}

        <div className="flex justify-between text-xs text-muted-foreground">
          <span>
            {min}
            {unit}
          </span>
          <span>
            {max}
            {unit}
          </span>
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

FarmRangeSlider.displayName = "FarmRangeSlider";

export { FarmRangeSlider, farmRangeSliderVariants };
