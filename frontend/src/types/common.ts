/**
 * Common types shared across the application
 * These types are used by multiple domain-specific type files
 */

/** Universally Unique Identifier */
export type UUID = string;

/** Common status types used across different entities */
export type Status =
  | "active"
  | "inactive"
  | "pending"
  | "error"
  | "maintenance";

/** Common priority levels */
export type Priority = "low" | "medium" | "high" | "critical";

/** Common execution status for tasks and automations */
export type ExecutionStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

/** Base interface for entities with timestamps */
export interface BaseEntity {
  id: UUID;
  created_at: string;
  updated_at: string;
}

/** Base interface for entities with names and descriptions */
export interface NamedEntity extends BaseEntity {
  name: string;
  description?: string;
}

/** Common error response structure */
export interface ErrorResponse {
  error: string;
  message: string;
  details?: Record<string, unknown>;
}

/** Common API response wrapper */
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: ErrorResponse;
  success: boolean;
}

/** Common pagination parameters */
export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

/** Common pagination response metadata */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/** Paginated response wrapper */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: PaginationMeta;
}

/** Common timestamp interface for tracking changes */
export interface Timestamped {
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

/** Common coordinate system for positioning */
export interface Coordinates {
  x: number;
  y: number;
  z?: number;
}

/** Common dimensions interface */
export interface Dimensions {
  width: number;
  height: number;
  depth?: number;
}
