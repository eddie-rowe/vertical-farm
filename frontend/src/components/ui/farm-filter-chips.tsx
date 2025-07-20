"use client";

import { X } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

import { Badge } from "./badge";
import { Button } from "./button";


export interface FilterChip {
  id: string;
  label: string;
  value: string;
  type: string;
  removable?: boolean;
}

export interface FarmFilterChipsProps {
  /** Active filter chips to display */
  filters: FilterChip[];
  /** Called when a filter is removed */
  onRemoveFilter: (filterId: string) => void;
  /** Called when all filters are cleared */
  onClearAll?: () => void;
  /** Show clear all button */
  showClearAll?: boolean;
  /** Label for the filter section */
  label?: string;
  /** Custom className */
  className?: string;
}

export const FarmFilterChips: React.FC<FarmFilterChipsProps> = ({
  filters,
  onRemoveFilter,
  onClearAll,
  showClearAll = true,
  label = "Active Filters:",
  className,
}) => {
  if (filters.length === 0) {
    return null;
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {label && (
        <span className="text-sm font-medium text-muted-foreground">
          {label}
        </span>
      )}

      {filters.map((filter) => (
        <Badge
          key={filter.id}
          variant="secondary"
          className="flex items-center gap-1 pr-1"
        >
          <span>{filter.label}</span>
          {filter.removable !== false && (
            <Button
              type="button"
              variant="ghost"
              size="control-icon"
              onClick={() => onRemoveFilter(filter.id)}
              className="h-4 w-4 p-0 hover:bg-muted-foreground/20"
            >
              <X className="h-3 w-3" />
              <span className="sr-only">Remove {filter.label} filter</span>
            </Button>
          )}
        </Badge>
      ))}

      {showClearAll && filters.length > 1 && onClearAll && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="h-7 px-2 text-xs"
        >
          Clear All
        </Button>
      )}
    </div>
  );
};
