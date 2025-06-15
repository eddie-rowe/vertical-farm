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
  private hitRate = { hits: 0, misses: 0 };
  private readonly DEFAULT_TTL = 300; // 5 minutes
  private readonly CACHE_NAME = 'vertical-farm-cache';
  
  // Fallback memory cache for environments without Cloudflare Cache API
  private memoryCache = new Map<string, { data: any; expires: number }>();

  /**
   * Get data from Cloudflare Cache API (with memory fallback)
   */
  async get<T>(key: string, options: CloudflareCacheOptions = {}): Promise<T | null> {
    try {
      // Check if Cloudflare Cache API is available
      const hasCloudflareCache = typeof (globalThis as any).caches !== 'undefined' || typeof caches !== 'undefined';
      console.log(`🔍 Cloudflare Cache API available: ${hasCloudflareCache}`);
      
      if (hasCloudflareCache) {
        // Use Cloudflare Cache API
        const cache = (globalThis as any).caches?.default || caches.default;
        const cacheKey = this.buildCacheKey(key, options.cacheKey);
        const request = new Request(cacheKey);
        
        const response = await cache.match(request);
        
        if (response) {
          this.recordHit();
          const data = await response.json();
          console.log(`🎯 Cloudflare Cache HIT for key: ${key}`);
          return data as T;
        }
        
        this.recordMiss();
        console.log(`❌ Cloudflare Cache MISS for key: ${key}`);
        return null;
      } else {
        // Fallback to memory cache
        const cached = this.memoryCache.get(key);
        if (cached && cached.expires > Date.now()) {
          this.recordHit();
          console.log(`🎯 Memory Cache HIT for key: ${key}`);
          return cached.data as T;
        }
        
        // Clean up expired entry
        if (cached && cached.expires <= Date.now()) {
          this.memoryCache.delete(key);
        }
        
        this.recordMiss();
        console.log(`❌ Memory Cache MISS for key: ${key}`);
        return null;
      }
      
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      this.recordMiss();
      return null;
    }
  }

  /**
   * Set data in Cloudflare Cache API (with memory fallback)
   */
  async set<T>(key: string, data: T, options: CloudflareCacheOptions = {}): Promise<void> {
    try {
      const ttl = options.ttl || this.DEFAULT_TTL;
      const hasCloudflareCache = typeof (globalThis as any).caches !== 'undefined' || typeof caches !== 'undefined';
      
      if (hasCloudflareCache) {
        // Use Cloudflare Cache API
        const cache = (globalThis as any).caches?.default || caches.default;
        const cacheKey = this.buildCacheKey(key, options.cacheKey);
        
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
        console.log(`💾 Cloudflare Cache SET for key: ${key} (TTL: ${ttl}s)`);
      } else {
        // Fallback to memory cache
        const expires = Date.now() + (ttl * 1000);
        this.memoryCache.set(key, { data, expires });
        console.log(`💾 Memory Cache SET for key: ${key} (TTL: ${ttl}s)`);
      }
      
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
    }
  }

  /**
   * Delete data from cache
   */
  async delete(key: string, options: CloudflareCacheOptions = {}): Promise<boolean> {
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
  async getOrSet<T>(
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
  private buildCacheKey(key: string, customKey?: string): string {
    const baseKey = customKey || key;
    // Use a consistent hostname for cache keys
    const hostname = 'vertical-farm.goodgoodgreens.org';
    return `https://${hostname}/cache/${encodeURIComponent(baseKey)}`;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const total = this.hitRate.hits + this.hitRate.misses;
    const hitRatePercent = total > 0 ? (this.hitRate.hits / total) * 100 : 0;
    
    return {
      hits: this.hitRate.hits,
      misses: this.hitRate.misses,
      totalRequests: total,
      hitRate: hitRatePercent / 100, // Return as decimal for consistency
      cacheHits: this.hitRate.hits,
      isEffective: hitRatePercent >= 30 // 30% threshold
    };
  }

  /**
   * Clear all cache statistics (useful for testing)
   */
  clearStats(): void {
    this.hitRate = { hits: 0, misses: 0 };
  }

  private recordHit(): void {
    this.hitRate.hits++;
  }

  private recordMiss(): void {
    this.hitRate.misses++;
  }
} 