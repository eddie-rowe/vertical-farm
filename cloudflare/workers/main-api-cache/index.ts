/**
 * Main API Cache Worker for Vertical Farm
 * Handles caching for FastAPI backend endpoints with intelligent TTL strategies
 */

// Cloudflare Worker types
declare global {
  interface KVNamespace {
    get(key: string, options?: { type?: 'text' | 'json' | 'arrayBuffer' | 'stream' }): Promise<any>;
    put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
    delete(key: string): Promise<void>;
  }
}

interface Env {
  // KV namespace for caching
  CACHE_KV: KVNamespace;
  
  // Origin server configuration
  ORIGIN_URL: string;
  
  // Cache configuration
  DEFAULT_TTL: string;
  HEALTH_TTL: string;
  STATS_TTL: string;
  QUEUE_TTL: string;
}

interface CacheConfig {
  ttl: number;
  cacheKey: string;
  shouldCache: boolean;
  varyHeaders?: string[];
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const cacheConfig = getCacheConfig(url, request, env);
    
    // Skip caching for non-cacheable requests
    if (!cacheConfig.shouldCache) {
      return fetchFromOrigin(request, env);
    }
    
    // Try to get from cache first
    const cachedResponse = await getCachedResponse(cacheConfig.cacheKey, env);
    if (cachedResponse) {
      return addCacheHeaders(cachedResponse, 'HIT');
    }
    
    // Fetch from origin and cache the response
    const originResponse = await fetchFromOrigin(request, env);
    
    if (originResponse.ok) {
      await cacheResponse(cacheConfig, originResponse.clone(), env);
    }
    
    return addCacheHeaders(originResponse, 'MISS');
  },
};

function getCacheConfig(url: URL, request: Request, env: Env): CacheConfig {
  const pathname = url.pathname;
  const method = request.method;
  
  // Only cache GET requests
  if (method !== 'GET') {
    return { ttl: 0, cacheKey: '', shouldCache: false };
  }
  
  // Health endpoints - cache for 30 seconds
  if (pathname === '/health' || pathname === '/healthz') {
    return {
      ttl: parseInt(env.HEALTH_TTL) || 30,
      cacheKey: `health:${pathname}`,
      shouldCache: true
    };
  }
  
  // Cache endpoints - cache for 60 seconds
  if (pathname.startsWith('/api/v1/cache/')) {
    return {
      ttl: parseInt(env.STATS_TTL) || 60,
      cacheKey: `cache:${pathname}`,
      shouldCache: true
    };
  }
  
  // Background task queue stats - cache for 15 seconds
  if (pathname.startsWith('/api/v1/background-tasks/queues') || 
      pathname.startsWith('/api/v1/background-tasks/status')) {
    return {
      ttl: parseInt(env.QUEUE_TTL) || 15,
      cacheKey: `queue:${pathname}`,
      shouldCache: true
    };
  }
  
  // Home Assistant endpoints - cache for 10 seconds with user context
  if (pathname.startsWith('/api/v1/home-assistant/')) {
    const authHeader = request.headers.get('Authorization');
    // Create a simple hash for user context (synchronous)
    const userHash = authHeader ? simpleHash(authHeader) : 'anonymous';
    
    return {
      ttl: 10,
      cacheKey: `ha:${userHash}:${pathname}:${url.search}`,
      shouldCache: true,
      varyHeaders: ['Authorization']
    };
  }
  
  // CORS test endpoints - cache for 5 minutes
  if (pathname.startsWith('/cors-test')) {
    return {
      ttl: 300,
      cacheKey: `cors:${pathname}`,
      shouldCache: true
    };
  }
  
  // Default caching for other API endpoints
  if (pathname.startsWith('/api/')) {
    return {
      ttl: parseInt(env.DEFAULT_TTL) || 30,
      cacheKey: `api:${pathname}:${url.search}`,
      shouldCache: true
    };
  }
  
  // Don't cache other requests
  return { ttl: 0, cacheKey: '', shouldCache: false };
}

async function getCachedResponse(cacheKey: string, env: Env): Promise<Response | null> {
  try {
    const cached = await env.CACHE_KV.get(cacheKey, { type: 'json' });
    if (!cached) return null;
    
    const { body, headers, status, timestamp, ttl } = cached;
    
    // Check if cache is still valid
    if (Date.now() - timestamp > ttl * 1000) {
      // Cache expired, delete it
      await env.CACHE_KV.delete(cacheKey);
      return null;
    }
    
    return new Response(body, {
      status,
      headers: new Headers(headers)
    });
  } catch (error) {
    console.error('Error retrieving from cache:', error);
    return null;
  }
}

async function cacheResponse(config: CacheConfig, response: Response, env: Env): Promise<void> {
  try {
    const body = await response.text();
    const headers: Record<string, string> = {};
    
    // Store relevant headers
    response.headers.forEach((value, key) => {
      // Don't cache certain headers
      if (!['set-cookie', 'authorization', 'cache-control'].includes(key.toLowerCase())) {
        headers[key] = value;
      }
    });
    
    const cacheData = {
      body,
      headers,
      status: response.status,
      timestamp: Date.now(),
      ttl: config.ttl
    };
    
    // Store in KV with TTL
    await env.CACHE_KV.put(
      config.cacheKey,
      JSON.stringify(cacheData),
      { expirationTtl: config.ttl + 60 } // Add 60 seconds buffer
    );
  } catch (error) {
    console.error('Error caching response:', error);
  }
}

async function fetchFromOrigin(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const originUrl = new URL(env.ORIGIN_URL);
  
  // Replace the host with the origin
  url.hostname = originUrl.hostname;
  url.port = originUrl.port;
  url.protocol = originUrl.protocol;
  
  const modifiedRequest = new Request(url.toString(), {
    method: request.method,
    headers: request.headers,
    body: request.body
  });
  
  try {
    const response = await fetch(modifiedRequest);
    return response;
  } catch (error) {
    console.error('Error fetching from origin:', error);
    return new Response('Origin server error', { status: 502 });
  }
}

function addCacheHeaders(response: Response, cacheStatus: 'HIT' | 'MISS'): Response {
  const newResponse = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers
  });
  
  newResponse.headers.set('X-Cache', cacheStatus);
  newResponse.headers.set('X-Cache-Worker', 'main-api-cache');
  newResponse.headers.set('CF-Cache-Status', cacheStatus);
  
  return newResponse;
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16).substring(0, 8);
}

async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
} 