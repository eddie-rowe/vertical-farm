"use client";

// Base classes
export { BaseService } from "./base/BaseService";
export {
  BaseCRUDService,
  type BaseEntity,
  type CRUDOperations,
} from "./base/BaseCRUDService";
export {
  BaseRealtimeService,
  type RealtimeSubscription,
  type WebSocketConnectionConfig,
} from "./base/BaseRealtimeService";

// Auth
export { AuthService, type AuthState } from "./auth/AuthService";

// Utilities
export { ErrorHandler, ServiceError } from "./utils/errorHandler";
