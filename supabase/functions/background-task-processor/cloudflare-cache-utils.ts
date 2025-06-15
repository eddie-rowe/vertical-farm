/**
 * Cloudflare Cache API Utilities for Edge Functions
 * 
 * Replaces memory-based caching with Cloudflare's distributed cache
 * for better performance and reduced latency overhead.
 */

// Type declarations for Cloudflare Workers Cache API
declare global {
  interface CacheStorage {
    default: Cache;
  }
}

interface CloudflareCacheOptions {
  ttl?: number;
  cacheKey?: string;
  headers?: Record<string, string>;
}

export class CloudflareCache {
  private static hitRate = { hits: 0, misses: 0 };
  private static readonly DEFAULT_TTL = 300; // 5 minutes
  private static readonly CACHE_NAME = 'vertical-farm-cache';

  /**
   * Get data from Cloudflare Cache API
   */
  static async get<T>(key: string, options: CloudflareCacheOptions = {}): Promise<T | null> {
    try {
      const cache = (globalThis as any).caches?.default || caches.default;
      const cacheKey = this.buildCacheKey(key, options.cacheKey);
      const request = new Request(cacheKey);
      
      const response = await cache.match(request);
      
      if (response) {
        this.recordHit();
        const data = await response.json();
        console.log(`🎯 Cache HIT for key: ${key}`);
        return data as T;
      }
      
      this.recordMiss();
      console.log(`❌ Cache MISS for key: ${key}`);
      return null;
      
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      this.recordMiss();
      return null;
    }
  }

  /**
   * Set data in Cloudflare Cache API
   */
  static async set<T>(key: string, data: T, options: CloudflareCacheOptions = {}): Promise<void> {
    try {
      const cache = (globalThis as any).caches?.default || caches.default;
      const cacheKey = this.buildCacheKey(key, options.cacheKey);
      const ttl = options.ttl || this.DEFAULT_TTL;
      
      // Create response with proper cache headers
      const headers = new Headers({
        'Content-Type': 'application/json',
        'Cache-Control': `public, max-age=${ttl}`,
        'X-Cache-TTL': ttl.toString(),
        'X-Cache-Key': key,
        'X-Cached-At': new Date().toISOString(),
        ...options.headers
      });

      const response = new Response(JSON.stringify(data), { headers });
      const request = new Request(cacheKey);
      
      await cache.put(request, response);
      console.log(`💾 Cached data for key: ${key} (TTL: ${ttl}s)`);
      
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
    }
  }

  /**
   * Delete data from cache
   */
  static async delete(key: string, options: CloudflareCacheOptions = {}): Promise<boolean> {
    try {
      const cache = (globalThis as any).caches?.default || caches.default;
      const cacheKey = this.buildCacheKey(key, options.cacheKey);
      const request = new Request(cacheKey);
      
      const deleted = await cache.delete(request);
      console.log(`🗑️ Cache delete for key: ${key} - ${deleted ? 'SUCCESS' : 'NOT_FOUND'}`);
      return deleted;
      
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get or set pattern - fetch from cache, or execute function and cache result
   */
  static async getOrSet<T>(
    key: string, 
    fetchFn: () => Promise<T>, 
    options: CloudflareCacheOptions = {}
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key, options);
    if (cached !== null) {
      return cached;
    }

    // Cache miss - execute function and cache result
    try {
      const data = await fetchFn();
      await this.set(key, data, options);
      return data;
    } catch (error) {
      console.error(`Error in getOrSet for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Build cache key with proper URL format for Cloudflare Cache API
   */
  private static buildCacheKey(key: string, customKey?: string): string {
    const baseKey = customKey || key;
    // Use a consistent hostname for cache keys
    const hostname = 'vertical-farm.goodgoodgreens.org';
    return `https://${hostname}/cache/${encodeURIComponent(baseKey)}`;
  }

  /**
   * Get cache statistics
   */
  static getStats() {
    const total = this.hitRate.hits + this.hitRate.misses;
    const hitRatePercent = total > 0 ? (this.hitRate.hits / total) * 100 : 0;
    
    return {
      hits: this.hitRate.hits,
      misses: this.hitRate.misses,
      totalRequests: total,
      hitRate: hitRatePercent,
      isEffective: hitRatePercent >= 30 // 30% threshold
    };
  }

  /**
   * Clear all cache statistics (useful for testing)
   */
  static clearStats(): void {
    this.hitRate = { hits: 0, misses: 0 };
  }

  private static recordHit(): void {
    this.hitRate.hits++;
  }

  private static recordMiss(): void {
    this.hitRate.misses++;
  }
}

/**
 * Home Assistant specific caching with Cloudflare Cache API
 */
export class HomeAssistantCloudflareCache {
  private static readonly CONFIG_TTL = 300; // 5 minutes
  private static readonly DEVICE_STATE_TTL = 30; // 30 seconds
  private static readonly ENTITY_LIST_TTL = 600; // 10 minutes

  static async setConfig(config: any, userId: string): Promise<void> {
    const key = `ha_config_${userId}`;
    await CloudflareCache.set(key, config, { ttl: this.CONFIG_TTL });
  }

  static async getConfig(userId: string): Promise<any | null> {
    const key = `ha_config_${userId}`;
    return await CloudflareCache.get(key);
  }

  static async setDeviceStates(deviceStates: Record<string, any>, userId: string): Promise<void> {
    const key = `ha_device_states_${userId}`;
    await CloudflareCache.set(key, deviceStates, { ttl: this.DEVICE_STATE_TTL });
  }

  static async getDeviceStates(userId: string): Promise<Record<string, any> | null> {
    const key = `ha_device_states_${userId}`;
    return await CloudflareCache.get(key);
  }

  static async getDeviceStatesBatch(userId: string): Promise<Record<string, any> | null> {
    // Alias for getDeviceStates to maintain compatibility
    return await this.getDeviceStates(userId);
  }

  static async setEntityList(entities: any[], userId: string): Promise<void> {
    const key = `ha_entities_${userId}`;
    await CloudflareCache.set(key, entities, { ttl: this.ENTITY_LIST_TTL });
  }

  static async getEntityList(userId: string): Promise<any[] | null> {
    const key = `ha_entities_${userId}`;
    return await CloudflareCache.get(key);
  }

  static async invalidateConfig(userId: string): Promise<void> {
    const key = `ha_config_${userId}`;
    await CloudflareCache.delete(key);
  }

  static async invalidateDeviceStates(userId: string): Promise<void> {
    const key = `ha_device_states_${userId}`;
    await CloudflareCache.delete(key);
  }

  static async shouldUseCache(userId: string): Promise<boolean> {
    // Check cache effectiveness based on hit rate
    const stats = CloudflareCache.getStats();
    
    // Always use cache during warm-up period (first 50 requests)
    // This gives the cache time to build up and show its effectiveness
    if (stats.totalRequests < 50) {
      console.log(`🔥 Cache warm-up: ${stats.totalRequests}/50 requests, hit rate: ${stats.hitRate.toFixed(1)}% - ENABLED`);
      return true;
    }
    
    // After warm-up, use cache if hit rate is above threshold OR
    // if we haven't given it enough time to be effective
    // (some data might have short TTLs and need time to show patterns)
    if (stats.totalRequests < 100) {
      const enabled = stats.hitRate >= 15;
      console.log(`🌡️  Cache extended warm-up: ${stats.totalRequests}/100 requests, hit rate: ${stats.hitRate.toFixed(1)}% - ${enabled ? 'ENABLED' : 'DISABLED'}`);
      return enabled; // Lower threshold during extended warm-up
    }
    
    // After sufficient data, use standard threshold
    const enabled = stats.isEffective;
    console.log(`📊 Cache steady state: ${stats.totalRequests} requests, hit rate: ${stats.hitRate.toFixed(1)}% - ${enabled ? 'ENABLED' : 'DISABLED'}`);
    return enabled; // 30% threshold
  }

  static getStats() {
    return CloudflareCache.getStats();
  }
}

/**
 * Response caching utilities for HTTP responses
 */
export class ResponseCache {
  /**
   * Create response with cache headers optimized for Cloudflare
   */
  static createCachedResponse(data: any, maxAge: number = 300): Response {
    const headers = new Headers({
      'Content-Type': 'application/json',
      'Cache-Control': `public, max-age=${maxAge}, s-maxage=${maxAge}`,
      'CDN-Cache-Control': `public, max-age=${maxAge}`,
      'Cloudflare-CDN-Cache-Control': `public, max-age=${maxAge}`,
      'X-Cache-Status': 'DYNAMIC',
      'X-Cache-TTL': maxAge.toString()
    });

    return new Response(JSON.stringify(data), { 
      status: 200, 
      headers 
    });
  }

  /**
   * Get optimized cache headers for Cloudflare
   */
  static getCacheHeaders(maxAge: number = 300): Record<string, string> {
    return {
      'Cache-Control': `public, max-age=${maxAge}, s-maxage=${maxAge}`,
      'CDN-Cache-Control': `public, max-age=${maxAge}`,
      'Cloudflare-CDN-Cache-Control': `public, max-age=${maxAge}`,
      'Vary': 'Accept-Encoding',
      'X-Cache-TTL': maxAge.toString()
    };
  }
}

/**
 * Cached function decorator for Cloudflare Cache API
 */
export function cloudflareCache<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  keyGenerator: (...args: Parameters<T>) => string,
  ttlSeconds: number = 300
): T {
  return (async (...args: Parameters<T>) => {
    const key = keyGenerator(...args);
    
    return await CloudflareCache.getOrSet(
      key,
      () => fn(...args),
      { ttl: ttlSeconds }
    );
  }) as T;
} 