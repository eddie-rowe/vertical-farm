"use client";

import { AuthError } from "@supabase/supabase-js";
import toast from "react-hot-toast";

import { supabase } from "@/lib/supabaseClient";

export class ServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public context: any = {},
  ) {
    super(message);
    this.name = "ServiceError";
  }
}

export class ErrorHandler {
  static handle(error: any, context: string): never {
    const errorInfo = {
      context,
      timestamp: new Date().toISOString(),
      error: error.message || error,
      stack: error.stack,
    };

    // Log error for debugging
    console.error("Service Error:", errorInfo);

    // Handle specific error types
    if (error instanceof AuthError || error?.code === "PGRST301") {
      // Authentication/authorization errors
      const message = "Authentication required. Please log in again.";
      toast.error(message);

      // Sign out user to clear invalid session
      supabase.auth.signOut().catch(() => {
        // Ignore errors during signout
      });

      throw new ServiceError(message, "AUTH_ERROR", errorInfo);
    }

    // Handle database errors
    if (error?.code) {
      const userMessage = ErrorHandler.getUserMessage(error);
      toast.error(userMessage);
      throw new ServiceError(userMessage, error.code, errorInfo);
    }

    // Handle network errors
    if (error instanceof TypeError && error.message.includes("fetch")) {
      const message =
        "Network error. Please check your connection and try again.";
      toast.error(message);
      throw new ServiceError(message, "NETWORK_ERROR", errorInfo);
    }

    // Generic error handling
    const message = error.message || "An unexpected error occurred";
    toast.error(message);
    throw new ServiceError(message, "UNKNOWN_ERROR", errorInfo);
  }

  private static getUserMessage(error: any): string {
    // Map technical errors to user-friendly messages
    const errorMap: Record<string, string> = {
      PGRST116: "Record not found",
      PGRST301: "Permission denied",
      "23505": "This record already exists",
      "23503": "Cannot delete: record is referenced by other data",
      "23502": "Required field is missing",
      "23514": "Invalid data provided",
      "42501": "Permission denied",
      "42P01": "Database table not found",
      "42703": "Database column not found",
    };

    return (
      errorMap[error.code] || error.message || "An unexpected error occurred"
    );
  }

  static async withErrorHandling<T>(
    operation: () => Promise<T>,
    context: string,
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      return ErrorHandler.handle(error, context);
    }
  }
}
