"use client";

import * as React from "react";
import {
  FarmSearchInput,
  type FarmSearchInputProps,
} from "./farm-search-input";
import { FarmSelect, type FarmSelectOption } from "./farm-select";
import { FarmFilterChips, type FilterChip } from "./farm-filter-chips";
import { cn } from "@/lib/utils";

export interface FilterDefinition {
  id: string;
  label: string;
  placeholder: string;
  options: FarmSelectOption[];
  defaultValue?: string;
}

export interface FarmSearchAndFilterProps {
  /** Search input props */
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchContext?: string;
  searchPlaceholder?: string;

  /** Filter definitions */
  filters?: FilterDefinition[];

  /** Active filter chips */
  activeFilters?: FilterChip[];
  onRemoveFilter?: (filterId: string) => void;
  onClearAllFilters?: () => void;

  /** Filter change handlers */
  onFilterChange?: (filterId: string, value: string) => void;

  /** Layout options */
  orientation?: "horizontal" | "vertical";
  showFilterChips?: boolean;
  className?: string;

  /** Additional search input props */
  searchInputProps?: Partial<FarmSearchInputProps>;
}

export const FarmSearchAndFilter: React.FC<FarmSearchAndFilterProps> = ({
  searchValue,
  onSearchChange,
  searchContext,
  searchPlaceholder,
  filters = [],
  activeFilters = [],
  onRemoveFilter,
  onClearAllFilters,
  onFilterChange,
  orientation = "horizontal",
  showFilterChips = true,
  className,
  searchInputProps = {},
}) => {
  const handleFilterChange =
    (filterId: string) => (event: React.ChangeEvent<HTMLSelectElement>) => {
      onFilterChange?.(filterId, event.target.value);
    };

  const searchComponent = (
    <FarmSearchInput
      value={searchValue}
      onSearchChange={onSearchChange}
      searchContext={searchContext}
      placeholder={searchPlaceholder}
      {...searchInputProps}
    />
  );

  const filterComponents = filters.map((filter) => (
    <FarmSelect
      key={filter.id}
      placeholder={filter.placeholder}
      options={filter.options}
      defaultValue={filter.defaultValue || "all"}
      onChange={handleFilterChange(filter.id)}
      className="min-w-[180px]"
    />
  ));

  const isHorizontal = orientation === "horizontal";

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search and Filters */}
      <div
        className={cn(
          "flex gap-4",
          isHorizontal ? "flex-col lg:flex-row lg:items-center" : "flex-col",
          isHorizontal && "lg:flex-wrap",
        )}
      >
        {/* Search Input */}
        <div className={cn(isHorizontal ? "flex-1 min-w-0" : "w-full")}>
          {searchComponent}
        </div>

        {/* Filter Selects */}
        {filters.length > 0 && (
          <div
            className={cn(
              "flex gap-2",
              isHorizontal ? "flex-wrap" : "flex-col",
            )}
          >
            {filterComponents}
          </div>
        )}
      </div>

      {/* Active Filter Chips */}
      {showFilterChips && activeFilters.length > 0 && (
        <FarmFilterChips
          filters={activeFilters}
          onRemoveFilter={onRemoveFilter || (() => {})}
          onClearAll={onClearAllFilters}
          label="Filters:"
        />
      )}
    </div>
  );
};
