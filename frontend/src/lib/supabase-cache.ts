/**
 * Enhanced Supabase Client with Query Caching
 *
 * Implements multiple caching strategies:
 * - In-memory caching for fast repeated queries
 * - Browser localStorage for persistence across sessions
 * - Stale-while-revalidate for optimal UX
 * - Real-time updates with cache invalidation
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  staleTime: number; // Time before data is considered stale
  strategy: "cache-first" | "cache-and-network" | "network-only";
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  key: string;
}

export class SupabaseWithCache {
  private client: SupabaseClient;
  private memoryCache = new Map<string, CacheEntry<any>>();
  private defaultConfig: CacheConfig = {
    ttl: 5 * 60 * 1000, // 5 minutes
    staleTime: 30 * 1000, // 30 seconds
    strategy: "cache-first",
  };

  constructor(url: string, key: string) {
    this.client = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });

    // Set up real-time subscriptions for cache invalidation
    this.setupRealtimeInvalidation();
  }

  /**
   * Enhanced query method with caching
   */
  async cachedQuery<T>(
    queryKey: string,
    queryFn: () => Promise<T>,
    config?: Partial<CacheConfig>,
  ): Promise<T> {
    const cacheConfig = { ...this.defaultConfig, ...config };
    const cacheKey = this.generateCacheKey(queryKey);

    // Check memory cache first
    if (cacheConfig.strategy === "cache-first") {
      const cached = this.getFromCache<T>(cacheKey);
      if (cached && !this.isStale(cached, cacheConfig.staleTime)) {
        // Return cached data and optionally revalidate in background
        if (this.shouldRevalidate(cached, cacheConfig.staleTime)) {
          this.revalidateInBackground(queryKey, queryFn, cacheConfig);
        }
        return cached.data;
      }
    }

    // Fetch fresh data
    try {
      const data = await queryFn();
      this.setCache(cacheKey, data, cacheConfig.ttl);
      this.persistToLocalStorage(cacheKey, data, cacheConfig.ttl);
      return data;
    } catch (error) {
      // Fallback to stale cache if network fails
      const staleCache = this.getFromCache<T>(cacheKey);
      if (staleCache && cacheConfig.strategy === "cache-first") {
        console.warn("Network failed, returning stale cache:", error);
        return staleCache.data;
      }
      throw error;
    }
  }

  /**
   * Cache frequently accessed farm data
   */
  async getFarmsWithCache(userId?: string) {
    return this.cachedQuery(
      `farms:${userId || "all"}`,
      async () => {
        const { data, error } = await this.client
          .from("farms")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        return data;
      },
      { ttl: 10 * 60 * 1000, staleTime: 60 * 1000 }, // 10min cache, 1min stale time
    );
  }

  /**
   * Cache farm hierarchy with longer TTL
   */
  async getFarmHierarchyWithCache(farmId: string) {
    return this.cachedQuery(
      `farm-hierarchy:${farmId}`,
      async () => {
        const { data, error } = await this.client
          .from("farms")
          .select(
            `
            *,
            rows (
              *,
              racks (
                *,
                shelves (*)
              )
            )
          `,
          )
          .eq("id", farmId)
          .single();

        if (error) throw error;
        return data;
      },
      { ttl: 15 * 60 * 1000, staleTime: 2 * 60 * 1000 }, // 15min cache, 2min stale
    );
  }

  /**
   * Cache device assignments with real-time invalidation
   */
  async getDeviceAssignmentsWithCache(farmId: string) {
    return this.cachedQuery(
      `device-assignments:${farmId}`,
      async () => {
        const { data, error } = await this.client
          .from("device_assignments")
          .select("*")
          .eq("farm_id", farmId);

        if (error) throw error;
        return data;
      },
      { ttl: 5 * 60 * 1000, staleTime: 30 * 1000 }, // 5min cache, 30s stale
    );
  }

  /**
   * Invalidate cache entries by pattern
   */
  invalidateCache(pattern: string) {
    const keysToDelete: string[] = [];

    for (const key of this.memoryCache.keys()) {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => {
      this.memoryCache.delete(key);
      localStorage.removeItem(`supabase-cache:${key}`);
    });

    console.log(
      `Invalidated ${keysToDelete.length} cache entries for pattern: ${pattern}`,
    );
  }

  /**
   * Set up real-time subscriptions for automatic cache invalidation
   */
  private setupRealtimeInvalidation() {
    // Invalidate farm caches when farms table changes
    this.client
      .channel("farms-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "farms" },
        (payload) => {
          this.invalidateCache("farms:");
          const recordId = (payload.new as any)?.id || (payload.old as any)?.id;
          this.invalidateCache(`farm-hierarchy:${recordId}`);
        },
      )
      .subscribe();

    // Invalidate device assignment caches
    this.client
      .channel("device-assignments-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "device_assignments" },
        (payload) => {
          const farmId =
            (payload.new as any)?.farm_id || (payload.old as any)?.farm_id;
          if (farmId) {
            this.invalidateCache(`device-assignments:${farmId}`);
          }
        },
      )
      .subscribe();

    // Invalidate hierarchy caches when structure changes
    ["rows", "racks", "shelves"].forEach((table) => {
      this.client
        .channel(`${table}-changes`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table },
          (payload) => {
            // Find farm_id through the hierarchy
            this.invalidateHierarchyCache(payload);
          },
        )
        .subscribe();
    });
  }

  private generateCacheKey(queryKey: string): string {
    return `query:${queryKey}`;
  }

  private getFromCache<T>(key: string): CacheEntry<T> | null {
    // Check memory cache first
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry && !this.isExpired(memoryEntry)) {
      return memoryEntry;
    }

    // Check localStorage
    const storageEntry = this.getFromLocalStorage<T>(key);
    if (storageEntry && !this.isExpired(storageEntry)) {
      // Promote to memory cache
      this.memoryCache.set(key, storageEntry);
      return storageEntry;
    }

    return null;
  }

  private setCache<T>(key: string, data: T, ttl: number) {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      key,
    };

    this.memoryCache.set(key, entry);

    // Limit memory cache size
    if (this.memoryCache.size > 100) {
      const oldestKey = Array.from(this.memoryCache.keys())[0];
      this.memoryCache.delete(oldestKey);
    }
  }

  private persistToLocalStorage<T>(key: string, data: T, ttl: number) {
    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl,
        key,
      };

      localStorage.setItem(`supabase-cache:${key}`, JSON.stringify(entry));
    } catch (error) {
      console.warn("Failed to persist to localStorage:", error);
    }
  }

  private getFromLocalStorage<T>(key: string): CacheEntry<T> | null {
    try {
      const item = localStorage.getItem(`supabase-cache:${key}`);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.warn("Failed to read from localStorage:", error);
      return null;
    }
  }

  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  private isStale(entry: CacheEntry<any>, staleTime: number): boolean {
    return Date.now() - entry.timestamp > staleTime;
  }

  private shouldRevalidate(entry: CacheEntry<any>, staleTime: number): boolean {
    return this.isStale(entry, staleTime) && !this.isExpired(entry);
  }

  private async revalidateInBackground<T>(
    queryKey: string,
    queryFn: () => Promise<T>,
    config: CacheConfig,
  ) {
    try {
      const data = await queryFn();
      const cacheKey = this.generateCacheKey(queryKey);
      this.setCache(cacheKey, data, config.ttl);
      this.persistToLocalStorage(cacheKey, data, config.ttl);
    } catch (error) {
      console.warn("Background revalidation failed:", error);
    }
  }

  private invalidateHierarchyCache(payload: any) {
    // This would need to be implemented based on your specific hierarchy relationships
    // For now, invalidate all hierarchy caches
    this.invalidateCache("farm-hierarchy:");
  }

  // Expose the original client for non-cached operations
  get raw() {
    return this.client;
  }
}

// Export singleton instance
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabaseWithCache = new SupabaseWithCache(
  supabaseUrl,
  supabaseKey,
);
