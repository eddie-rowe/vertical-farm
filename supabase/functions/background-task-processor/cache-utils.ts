/**
 * Cache Utilities for Edge Functions
 * 
 * Provides in-memory caching with TTL (Time To Live) support
 * for improving performance of frequently accessed data.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class MemoryCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private cleanupTimeout: number | null = null;
  private hitRate = { hits: 0, misses: 0 };
  private hitRateThreshold = 0.3; // 30% minimum hit rate for cache to be effective

  constructor() {
    // Start adaptive cleanup
    this.startAdaptiveCleanup();
  }

  /**
   * Set a value in the cache with TTL
   */
  set<T>(key: string, value: T, ttlMs: number = 300000): void { // Default 5 minutes
    const entry: CacheEntry<T> = {
      data: value,
      timestamp: Date.now(),
      ttl: ttlMs
    };
    
    this.cache.set(key, entry);
  }

  /**
   * Get a value from the cache with smart bypass
   * Returns null if not found, expired, or cache hit rate is too low
   */
  get<T>(key: string): T | null {
    // Smart bypass: if hit rate is too low, don't use cache
    if (this.getHitRate() < this.hitRateThreshold && this.getTotalRequests() > 10) {
      this.recordMiss();
      return null;
    }

    const entry = this.cache.get(key);
    
    if (!entry) {
      this.recordMiss();
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.recordMiss();
      return null;
    }

    this.recordHit();
    return entry.data as T;
  }

  /**
   * Check if a key exists and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Delete a specific key
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.hitRate = { hits: 0, misses: 0 };
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const now = Date.now();
    let expired = 0;
    let active = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        expired++;
      } else {
        active++;
      }
    }

    return {
      totalEntries: this.cache.size,
      activeEntries: active,
      expiredEntries: expired,
      hitRate: this.getHitRate(),
      totalRequests: this.getTotalRequests(),
      isEffective: this.getHitRate() >= this.hitRateThreshold
    };
  }

  private getHitRate() {
    const total = this.hitRate.hits + this.hitRate.misses;
    return total > 0 ? (this.hitRate.hits / total) * 100 : 0;
  }

  private getTotalRequests() {
    return this.hitRate.hits + this.hitRate.misses;
  }

  /**
   * Record cache hit
   */
  recordHit(): void {
    this.hitRate.hits++;
  }

  /**
   * Record cache miss
   */
  recordMiss(): void {
    this.hitRate.misses++;
  }

  /**
   * Start adaptive cleanup based on cache size and activity
   */
  private startAdaptiveCleanup(): void {
    const scheduleNextCleanup = () => {
      const size = this.cache.size;
      const hitRate = this.getHitRate();
      
      // Adaptive cleanup intervals based on cache size and effectiveness
      let interval: number;
      if (size === 0) {
        interval = 600000; // 10 minutes for empty cache
      } else if (size < 10) {
        interval = 300000; // 5 minutes for small cache
      } else if (size < 50) {
        interval = 120000; // 2 minutes for medium cache
      } else {
        interval = 60000; // 1 minute for large cache
      }

      // Increase cleanup frequency if hit rate is low
      if (hitRate < this.hitRateThreshold && size > 0) {
        interval = Math.max(interval / 2, 30000); // More frequent cleanup, min 30s
      }

      this.cleanupTimeout = setTimeout(() => {
        this.performCleanup();
        scheduleNextCleanup();
      }, interval) as any;
    };

    scheduleNextCleanup();
  }

  /**
   * Perform cleanup of expired entries
   */
  private performCleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
    
    // Reset hit rate if cache becomes empty to allow fresh start
    if (this.cache.size === 0) {
      this.hitRate = { hits: 0, misses: 0 };
    }
  }

  /**
   * Stop cleanup (useful for testing)
   */
  stopCleanup(): void {
    if (this.cleanupTimeout) {
      clearTimeout(this.cleanupTimeout);
      this.cleanupTimeout = null;
    }
  }
}

// Global cache instance
const globalCache = new MemoryCache();

/**
 * Request deduplication to prevent duplicate API calls
 */
class RequestDeduplicator {
  private pending = new Map<string, Promise<any>>();

  async dedupe<T>(key: string, fn: () => Promise<T>): Promise<T> {
    if (this.pending.has(key)) {
      return this.pending.get(key);
    }

    const promise = fn();
    this.pending.set(key, promise);

    try {
      const result = await promise;
      return result;
    } finally {
      this.pending.delete(key);
    }
  }
}

const requestDeduplicator = new RequestDeduplicator();

/**
 * Home Assistant specific cache utilities with conditional caching
 */
export class HomeAssistantCache {
  private static readonly CONFIG_TTL = 5 * 60 * 1000; // 5 minutes
  private static readonly DEVICE_STATE_TTL = 30 * 1000; // 30 seconds
  private static readonly ENTITY_LIST_TTL = 10 * 60 * 1000; // 10 minutes
  private static accessCounts = new Map<string, number>();
  private static cacheThreshold = 2; // Cache after 2 accesses

  /**
   * Track access and conditionally cache
   */
  private static shouldCache(key: string): boolean {
    const count = this.accessCounts.get(key) || 0;
    this.accessCounts.set(key, count + 1);
    return count >= this.cacheThreshold;
  }

  /**
   * Cache Home Assistant configuration
   */
  static setConfig(config: any, userId: string): void {
    const key = `ha:config:${userId}`;
    if (this.shouldCache(key)) {
      globalCache.set(key, config, this.CONFIG_TTL);
    }
  }

  /**
   * Get cached Home Assistant configuration
   */
  static getConfig(userId: string): any | null {
    const key = `ha:config:${userId}`;
    return globalCache.get(key);
  }

  /**
   * Cache device states (batch) with conditional caching
   */
  static setDeviceStates(deviceStates: Record<string, any>, userId: string): void {
    const batchKey = `ha:device_states:batch:${userId}`;
    
    if (this.shouldCache(batchKey)) {
      // Cache individual device states
      Object.entries(deviceStates).forEach(([deviceId, state]) => {
        const deviceKey = `ha:device:${deviceId}:${userId}`;
        if (this.shouldCache(deviceKey)) {
          globalCache.set(deviceKey, state, this.DEVICE_STATE_TTL);
        }
      });

      // Cache the batch result
      globalCache.set(batchKey, deviceStates, this.DEVICE_STATE_TTL);
    }
  }

  /**
   * Get cached device state
   */
  static getDeviceState(deviceId: string, userId: string): any | null {
    const key = `ha:device:${deviceId}:${userId}`;
    return globalCache.get(key);
  }

  /**
   * Get cached device states (batch)
   */
  static getDeviceStatesBatch(userId: string): Record<string, any> | null {
    const key = `ha:device_states:batch:${userId}`;
    return globalCache.get(key);
  }

  /**
   * Cache entity list
   */
  static setEntityList(entities: any[], userId: string): void {
    const key = `ha:entities:${userId}`;
    if (this.shouldCache(key)) {
      globalCache.set(key, entities, this.ENTITY_LIST_TTL);
    }
  }

  /**
   * Get cached entity list
   */
  static getEntityList(userId: string): any[] | null {
    const key = `ha:entities:${userId}`;
    return globalCache.get<any[]>(key);
  }

  /**
   * Invalidate specific cache entries
   */
  static invalidateConfig(userId: string): void {
    globalCache.delete(`ha:config:${userId}`);
  }

  static invalidateDeviceState(deviceId: string, userId: string): void {
    globalCache.delete(`ha:device:${deviceId}:${userId}`);
  }

  static invalidateAllDeviceStates(userId: string): void {
    // Clear batch cache
    globalCache.delete(`ha:device_states:batch:${userId}`);
    
    // Clear individual device caches (this is expensive, use sparingly)
    for (const key of globalCache['cache'].keys()) {
      if (key.startsWith(`ha:device:`) && key.endsWith(`:${userId}`)) {
        globalCache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  static getStats() {
    return {
      ...globalCache.getStats(),
      accessCounts: this.accessCounts.size,
      cacheThreshold: this.cacheThreshold
    };
  }

  /**
   * Check if cache should be used based on effectiveness
   */
  static async shouldUseCache(userId: string): Promise<boolean> {
    const stats = globalCache.getStats()
    
    // Don't use cache if it's not effective
    if (stats.totalRequests > 10 && !stats.isEffective) {
      return false
    }
    
    // For new caches, give it a chance
    if (stats.totalRequests <= 10) {
      return true
    }
    
    return stats.isEffective
  }
}

/**
 * Generic cache decorator for functions with deduplication
 */
export function cached<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  keyGenerator: (...args: Parameters<T>) => string,
  ttlMs: number = 300000
): T {
  return (async (...args: Parameters<T>) => {
    const cacheKey = keyGenerator(...args);
    
    // Use request deduplication to prevent duplicate calls
    return requestDeduplicator.dedupe(cacheKey, async () => {
      // Try to get from cache first
      const cached = globalCache.get(cacheKey);
      if (cached !== null) {
        return cached;
      }

      // Cache miss - execute function
      const result = await fn(...args);
      
      // Store in cache (conditional caching is handled by individual cache methods)
      globalCache.set(cacheKey, result, ttlMs);
      
      return result;
    });
  }) as T;
}

/**
 * Response caching utilities for Edge Functions
 */
export class ResponseCache {
  /**
   * Generate cache headers for HTTP responses
   */
  static getCacheHeaders(maxAge: number = 300): Record<string, string> {
    return {
      'Cache-Control': `public, max-age=${maxAge}, s-maxage=${maxAge}`,
      'ETag': `"${Date.now()}-${Math.random().toString(36).substr(2, 9)}"`,
      'Last-Modified': new Date().toUTCString(),
      'Vary': 'Accept-Encoding'
    };
  }

  /**
   * Create a cached response
   */
  static createCachedResponse(data: any, maxAge: number = 300): Response {
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...this.getCacheHeaders(maxAge)
      }
    });
  }
}

export { globalCache };
export default MemoryCache; 