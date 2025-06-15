/**
 * Health Check Cache Worker for Vertical Farm
 * Optimized for health monitoring endpoints with fast response times
 * and intelligent health status aggregation
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
  CACHE_KV: KVNamespace;
  ORIGIN_URL: string;
  HEALTH_TTL: string;
  ENABLE_AGGREGATION: string;
}

interface HealthStatus {
  status: string;
  timestamp: number;
  services?: Record<string, any>;
  response_time_ms?: number;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;
    
    // Only handle health-related endpoints
    if (!isHealthEndpoint(pathname)) {
      return fetchFromOrigin(request, env);
    }
    
    // Check cache first
    const cacheKey = `health:${pathname}`;
    const cachedResponse = await getCachedHealth(cacheKey, env);
    
    if (cachedResponse) {
      return addHealthHeaders(cachedResponse, 'HIT');
    }
    
    // Fetch from origin with timing
    const startTime = Date.now();
    const originResponse = await fetchFromOrigin(request, env);
    const responseTime = Date.now() - startTime;
    
    if (originResponse.ok) {
      await cacheHealthResponse(cacheKey, originResponse.clone(), responseTime, env);
    }
    
    return addHealthHeaders(originResponse, 'MISS', responseTime);
  },
};

function isHealthEndpoint(pathname: string): boolean {
  const healthPaths = [
    '/health',
    '/healthz',
    '/api/v1/cache/health',
    '/api/v1/background-tasks/status'
  ];
  
  return healthPaths.some(path => pathname === path || pathname.startsWith(path));
}

async function getCachedHealth(cacheKey: string, env: Env): Promise<Response | null> {
  try {
    const cached = await env.CACHE_KV.get(cacheKey, { type: 'json' });
    if (!cached) return null;
    
    const { body, headers, status, timestamp, ttl } = cached;
    const ttlSeconds = parseInt(env.HEALTH_TTL) || 30;
    
    // Check if cache is still valid
    if (Date.now() - timestamp > ttlSeconds * 1000) {
      await env.CACHE_KV.delete(cacheKey);
      return null;
    }
    
    return new Response(body, {
      status,
      headers: new Headers(headers)
    });
  } catch (error) {
    console.error('Error retrieving health cache:', error);
    return null;
  }
}

async function cacheHealthResponse(
  cacheKey: string, 
  response: Response, 
  responseTime: number, 
  env: Env
): Promise<void> {
  try {
    const body = await response.text();
    const headers: Record<string, string> = {};
    
    // Store relevant headers
    response.headers.forEach((value, key) => {
      if (!['set-cookie', 'authorization'].includes(key.toLowerCase())) {
        headers[key] = value;
      }
    });
    
    // Add performance metrics to health response
    let healthData: HealthStatus;
    try {
      healthData = JSON.parse(body);
      healthData.response_time_ms = responseTime;
      healthData.timestamp = Date.now();
    } catch {
      // If not JSON, treat as plain text
      healthData = {
        status: response.ok ? 'healthy' : 'unhealthy',
        timestamp: Date.now(),
        response_time_ms: responseTime
      };
    }
    
    const cacheData = {
      body: JSON.stringify(healthData),
      headers,
      status: response.status,
      timestamp: Date.now(),
      ttl: parseInt(env.HEALTH_TTL) || 30
    };
    
    const ttlSeconds = parseInt(env.HEALTH_TTL) || 30;
    await env.CACHE_KV.put(
      cacheKey,
      JSON.stringify(cacheData),
      { expirationTtl: ttlSeconds + 30 }
    );
    
    // Store aggregated health status if enabled
    if (env.ENABLE_AGGREGATION === 'true') {
      await updateAggregatedHealth(healthData, env);
    }
    
  } catch (error) {
    console.error('Error caching health response:', error);
  }
}

async function updateAggregatedHealth(healthData: HealthStatus, env: Env): Promise<void> {
  try {
    const aggregateKey = 'health:aggregate';
    const existing = await env.CACHE_KV.get(aggregateKey, { type: 'json' });
    
    let aggregate = existing || {
      overall_status: 'unknown',
      services: {},
      last_updated: Date.now(),
      response_times: []
    };
    
    // Update aggregate data
    aggregate.last_updated = Date.now();
    aggregate.response_times.push(healthData.response_time_ms);
    
    // Keep only last 10 response times
    if (aggregate.response_times.length > 10) {
      aggregate.response_times = aggregate.response_times.slice(-10);
    }
    
    // Calculate average response time
    const avgResponseTime = aggregate.response_times.reduce((a: number, b: number) => a + b, 0) / aggregate.response_times.length;
    
    // Determine overall status
    if (healthData.status === 'healthy' && avgResponseTime < 1000) {
      aggregate.overall_status = 'healthy';
    } else if (healthData.status === 'degraded' || avgResponseTime > 2000) {
      aggregate.overall_status = 'degraded';
    } else {
      aggregate.overall_status = 'unhealthy';
    }
    
    await env.CACHE_KV.put(
      aggregateKey,
      JSON.stringify(aggregate),
      { expirationTtl: 300 } // 5 minutes
    );
    
  } catch (error) {
    console.error('Error updating aggregated health:', error);
  }
}

async function fetchFromOrigin(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const originUrl = new URL(env.ORIGIN_URL);
  
  url.hostname = originUrl.hostname;
  url.port = originUrl.port;
  url.protocol = originUrl.protocol;
  
  const modifiedRequest = new Request(url.toString(), {
    method: request.method,
    headers: request.headers,
    body: request.body
  });
  
  try {
    // Add timeout for health checks
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(modifiedRequest, {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    console.error('Error fetching health from origin:', error);
    
    // Return a synthetic unhealthy response
    return new Response(JSON.stringify({
      status: 'unhealthy',
      error: 'Origin server unreachable',
      timestamp: Date.now()
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

function addHealthHeaders(
  response: Response, 
  cacheStatus: 'HIT' | 'MISS', 
  responseTime?: number
): Response {
  const newResponse = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers
  });
  
  newResponse.headers.set('X-Cache', cacheStatus);
  newResponse.headers.set('X-Cache-Worker', 'health-check-cache');
  newResponse.headers.set('CF-Cache-Status', cacheStatus);
  
  if (responseTime) {
    newResponse.headers.set('X-Response-Time', `${responseTime}ms`);
  }
  
  // Add CORS headers for monitoring tools
  newResponse.headers.set('Access-Control-Allow-Origin', '*');
  newResponse.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  newResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  
  return newResponse;
} 