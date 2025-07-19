/**
 * Farm-related types
 * Exports all types related to farm structure, layout, and grow recipes
 */

// Re-export common types used by farm components
export type { UUID, BaseEntity, Coordinates, Dimensions } from "../common";

// Farm layout and structure types
export * from "./layout";

// Grow recipes and species types
export * from "./recipes";
