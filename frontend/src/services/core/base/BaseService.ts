"use client";

import { supabase } from "@/lib/supabaseClient";

import { AuthService } from "../auth/AuthService";
import { ErrorHandler } from "../utils/errorHandler";

export abstract class BaseService {
  protected authService: AuthService;

  constructor() {
    this.authService = AuthService.getInstance();
  }

  protected async executeWithAuth<T>(
    operation: () => Promise<T>,
    context: string,
  ): Promise<T> {
    return ErrorHandler.withErrorHandling(async () => {
      await this.authService.requireAuth();
      return await operation();
    }, context);
  }

  protected async executeQuery<T>(
    query: () => Promise<{ data: T; error: any }>,
    context: string,
  ): Promise<T> {
    return ErrorHandler.withErrorHandling(async () => {
      const { data, error } = await query();

      if (error) {
        throw error;
      }

      return data;
    }, context);
  }

  protected logOperation(operation: string, details?: any): void {
    if (process.env.NODE_ENV === "development") {
      console.log(`[${this.constructor.name}] ${operation}`, details);
    }
  }

  protected validateId(id: string, fieldName: string = "id"): void {
    if (!id || typeof id !== "string" || id.trim() === "") {
      throw new Error(`Invalid ${fieldName}: must be a non-empty string`);
    }
  }

  protected validateRequired(value: any, fieldName: string): void {
    if (value === null || value === undefined || value === "") {
      throw new Error(`${fieldName} is required`);
    }
  }

  protected getSupabaseClient() {
    return supabase;
  }
}
