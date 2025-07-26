"use client";

import { Search, X } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

import { Button } from "./button";
import { FarmInput, type FarmInputProps } from "./farm-input";

export interface FarmSearchInputProps
  extends Omit<FarmInputProps, "icon" | "iconPosition"> {
  /** Search value */
  value: string;
  /** Search change handler */
  onSearchChange: (value: string) => void;
  /** Debounce delay in milliseconds */
  debounceMs?: number;
  /** Show clear button when there's text */
  showClearButton?: boolean;
  /** Search placeholder pattern - will be prefixed with "Search" */
  searchContext?: string;
  /** Override the full placeholder text */
  placeholder?: string;
  /** Called when search is cleared */
  onClear?: () => void;
}

export const FarmSearchInput = React.forwardRef<
  HTMLInputElement,
  FarmSearchInputProps
>(
  (
    {
      value,
      onSearchChange,
      debounceMs = 300,
      showClearButton = true,
      searchContext,
      placeholder: customPlaceholder,
      onClear,
      className,
      ...props
    },
    ref,
  ) => {
    const [internalValue, setInternalValue] = React.useState(value);
    const debounceTimer = React.useRef<NodeJS.Timeout | null>(null);

    // Generate consistent placeholder text
    const placeholder =
      customPlaceholder ||
      (searchContext ? `Search ${searchContext}...` : "Search...");

    // Sync external value changes
    React.useEffect(() => {
      setInternalValue(value);
    }, [value]);

    // Debounced search handler
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setInternalValue(newValue);

      // Clear existing timer
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      // Set new timer
      debounceTimer.current = setTimeout(() => {
        onSearchChange(newValue);
      }, debounceMs);
    };

    // Clear search handler
    const handleClear = () => {
      setInternalValue("");
      onSearchChange("");
      onClear?.();
    };

    // Cleanup timer on unmount
    React.useEffect(() => {
      return () => {
        if (debounceTimer.current) {
          clearTimeout(debounceTimer.current);
        }
      };
    }, []);

    return (
      <div className="relative">
        <FarmInput
          ref={ref}
          value={internalValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          icon={<Search className="h-4 w-4" />}
          iconPosition="left"
          className={cn(showClearButton && internalValue && "pr-10", className)}
          {...props}
        />

        {showClearButton && internalValue && (
          <Button
            type="button"
            variant="ghost"
            size="control-icon"
            onClick={handleClear}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 hover:bg-muted"
          >
            <X className="h-3 w-3" />
            <span className="sr-only">Clear search</span>
          </Button>
        )}
      </div>
    );
  },
);

FarmSearchInput.displayName = "FarmSearchInput";
