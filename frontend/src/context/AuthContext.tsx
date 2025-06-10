"use client";
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from "../supabaseClient";
import toast from 'react-hot-toast';

import type { User, SignInWithPasswordCredentials, SignUpWithPasswordCredentials, AuthError, AuthResponse, Session, Subscription } from '@supabase/supabase-js';

// Session health information from backend
interface SessionHealth {
  status: 'healthy' | 'unhealthy';
  user_id?: string;
  session_info?: {
    valid: boolean;
    expires_at?: string;
    issued_at?: string;
    expires_in_minutes?: number;
    requires_refresh: boolean;
    session_age_hours?: number;
  };
  recommendations?: {
    refresh_token: boolean;
    action_required: boolean;
  };
  error?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  sessionHealth: SessionHealth | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, userData?: any) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  checkSessionHealth: () => Promise<SessionHealth>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionHealth, setSessionHealth] = useState<SessionHealth | null>(null);
  
  // Refs for managing timers and preventing multiple refresh attempts
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const healthCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isRefreshingRef = useRef(false);

  // Check session health with backend
  const checkSessionHealth = useCallback(async (): Promise<SessionHealth> => {
    if (!session?.access_token) {
      return {
        status: 'unhealthy',
        error: 'No session available',
        recommendations: { refresh_token: true, action_required: true }
      };
    }

    try {
      const response = await fetch('/api/auth/session-health', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const health: SessionHealth = await response.json();
        setSessionHealth(health);
        return health;
      } else {
        const errorHealth: SessionHealth = {
          status: 'unhealthy',
          error: 'Failed to check session health',
          recommendations: { refresh_token: true, action_required: true }
        };
        setSessionHealth(errorHealth);
        return errorHealth;
      }
    } catch (error) {
      console.error('Session health check failed:', error);
      const errorHealth: SessionHealth = {
        status: 'unhealthy',
        error: 'Session health check failed',
        recommendations: { refresh_token: true, action_required: true }
      };
      setSessionHealth(errorHealth);
      return errorHealth;
    }
  }, [session?.access_token]);

  // Refresh session token
  const refreshSession = useCallback(async () => {
    if (isRefreshingRef.current) {
      console.log('Session refresh already in progress');
      return;
    }

    try {
      isRefreshingRef.current = true;
      console.log('Refreshing session...');
      
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('Session refresh failed:', error);
        toast.error('Session refresh failed. Please sign in again.');
        await signOut();
        return;
      }

      if (data.session) {
        console.log('Session refreshed successfully');
        setSession(data.session);
        setUser(data.user);
        
        // Check health of new session
        setTimeout(() => checkSessionHealth(), 1000);
        
                 toast.success('Session refreshed successfully');
       }
     } catch (error) {
       console.error('Unexpected error during session refresh:', error);
       toast.error('Session refresh failed. Please sign in again.');
      await signOut();
    } finally {
      isRefreshingRef.current = false;
    }
  }, []);

  // Schedule automatic token refresh based on session health
  const scheduleTokenRefresh = useCallback((health: SessionHealth) => {
    // Clear existing timeout
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }

    if (health.session_info?.expires_in_minutes) {
      const expiresInMinutes = health.session_info.expires_in_minutes;
      
      // Schedule refresh when 5 minutes remaining, or immediately if less than 2 minutes
      let refreshInMinutes: number;
      if (expiresInMinutes <= 2) {
        refreshInMinutes = 0.1; // Refresh in 6 seconds
      } else if (expiresInMinutes <= 10) {
        refreshInMinutes = Math.max(0.5, expiresInMinutes - 5); // Refresh 5 minutes before expiry
      } else {
        refreshInMinutes = expiresInMinutes - 10; // Refresh 10 minutes before expiry
      }

      const refreshInMs = refreshInMinutes * 60 * 1000;
      
      console.log(`Scheduling token refresh in ${refreshInMinutes.toFixed(1)} minutes`);
      
      refreshTimeoutRef.current = setTimeout(() => {
        console.log('Automatic token refresh triggered');
        refreshSession();
      }, refreshInMs);
    }
  }, [refreshSession]);

  // Periodic session health monitoring
  const startHealthMonitoring = useCallback(() => {
    // Clear existing interval
    if (healthCheckIntervalRef.current) {
      clearInterval(healthCheckIntervalRef.current);
    }

    // Check health every 2 minutes
    healthCheckIntervalRef.current = setInterval(async () => {
      if (session?.access_token && !isRefreshingRef.current) {
        const health = await checkSessionHealth();
        
        // Schedule refresh if needed
        if (health.recommendations?.refresh_token) {
          scheduleTokenRefresh(health);
        }
        
                 // Show warning if action required
         if (health.recommendations?.action_required && health.status === 'unhealthy') {
           toast.error('Session requires attention. Please refresh or sign in again.');
         }
      }
    }, 2 * 60 * 1000); // Every 2 minutes
  }, [session?.access_token, checkSessionHealth, scheduleTokenRefresh]);

  // Clean up timers
  const cleanupTimers = useCallback(() => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }
    if (healthCheckIntervalRef.current) {
      clearInterval(healthCheckIntervalRef.current);
      healthCheckIntervalRef.current = null;
    }
  }, []);

  // Sign in function
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Invalid email or password');
        }
        throw error;
      }

      if (data.user && data.session) {
        setUser(data.user);
        setSession(data.session);
        
                 // Check initial session health
         setTimeout(() => checkSessionHealth(), 1000);
         
         toast.success('Signed in successfully');
       }
     } catch (error: any) {
       console.error('Sign in error:', error);
       toast.error(error.message || 'Failed to sign in');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [checkSessionHealth]);

  // Sign up function
  const signUp = useCallback(async (email: string, password: string, userData?: any) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData || {}
        }
      });

      if (error) {
        throw error;
      }

             if (data.user) {
         toast.success('Account created successfully! Please check your email to verify your account.');
       }
     } catch (error: any) {
       console.error('Sign up error:', error);
       toast.error(error.message || 'Failed to create account');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Sign out function
  const signOut = useCallback(async () => {
    try {
      cleanupTimers();
      
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
      }
      
             setUser(null);
       setSession(null);
       setSessionHealth(null);
       
       console.log('Signed out successfully');
    } catch (error) {
      console.error('Unexpected sign out error:', error);
    }
  }, [cleanupTimers]);

  // Initialize auth state and set up listeners
  useEffect(() => {
    let mounted = true;

    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (mounted) {
        if (error) {
          console.error('Error getting initial session:', error);
        }
        
        setUser(session?.user ?? null);
        setSession(session);
        setLoading(false);
        
        // If we have a session, start health monitoring
        if (session) {
          setTimeout(() => checkSessionHealth(), 1000);
        }
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      
      console.log('Auth state changed:', event);
      
      setUser(session?.user ?? null);
      setSession(session);
      setLoading(false);

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session) {
          // Check health and start monitoring for new sessions
          setTimeout(() => checkSessionHealth(), 1000);
        }
      } else if (event === 'SIGNED_OUT') {
        cleanupTimers();
        setSessionHealth(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
      cleanupTimers();
    };
  }, [checkSessionHealth, cleanupTimers]);

  // Start health monitoring when session is available
  useEffect(() => {
    if (session?.access_token) {
      startHealthMonitoring();
    } else {
      cleanupTimers();
    }

    return () => cleanupTimers();
  }, [session?.access_token, startHealthMonitoring, cleanupTimers]);

  // Schedule token refresh based on session health
  useEffect(() => {
    if (sessionHealth?.session_info && sessionHealth.status === 'healthy') {
      scheduleTokenRefresh(sessionHealth);
    }
  }, [sessionHealth, scheduleTokenRefresh]);

  const value: AuthContextType = {
    user,
    session,
    loading,
    sessionHealth,
    signIn,
    signUp,
    signOut,
    refreshSession,
    checkSessionHealth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}