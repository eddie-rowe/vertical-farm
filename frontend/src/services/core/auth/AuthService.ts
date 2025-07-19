"use client";

import { supabase } from "@/lib/supabaseClient";
import { User, Session } from "@supabase/supabase-js";
import { ErrorHandler } from "../utils/errorHandler";

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

export class AuthService {
  private static instance: AuthService;
  private authState: AuthState = {
    user: null,
    session: null,
    loading: true,
  };

  private constructor() {}

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async initializeAuth(): Promise<void> {
    try {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        throw error;
      }

      this.authState = {
        user: data.session?.user || null,
        session: data.session || null,
        loading: false,
      };
    } catch (error) {
      this.authState = {
        user: null,
        session: null,
        loading: false,
      };
    }
  }

  async getAuthHeaders(): Promise<HeadersInit> {
    return ErrorHandler.withErrorHandling(async () => {
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError || !sessionData.session) {
        throw new Error("Authentication required. Please log in to continue.");
      }

      return {
        Authorization: `Bearer ${sessionData.session.access_token}`,
        "Content-Type": "application/json",
      };
    }, "Get auth headers");
  }

  async requireAuth(): Promise<Session> {
    return ErrorHandler.withErrorHandling(async () => {
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError || !sessionData.session) {
        throw new Error("Authentication required. Please log in to continue.");
      }

      return sessionData.session;
    }, "Require authentication");
  }

  async getCurrentUser(): Promise<User | null> {
    return ErrorHandler.withErrorHandling(async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        throw error;
      }

      return user;
    }, "Get current user");
  }

  async signOut(): Promise<void> {
    return ErrorHandler.withErrorHandling(async () => {
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      this.authState = {
        user: null,
        session: null,
        loading: false,
      };
    }, "Sign out");
  }

  getAuthState(): AuthState {
    return { ...this.authState };
  }

  onAuthStateChange(
    callback: (event: string, session: Session | null) => void,
  ) {
    return supabase.auth.onAuthStateChange((event, session) => {
      this.authState = {
        user: session?.user || null,
        session: session || null,
        loading: false,
      };
      callback(event, session);
    });
  }
}
