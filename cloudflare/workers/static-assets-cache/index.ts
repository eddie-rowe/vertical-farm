/**
 * Static Assets Cache Worker for Vertical Farm
 * Optimized for Next.js frontend static files with long-term caching
 * and efficient cache invalidation strategies
 */

// Cloudflare Worker types
declare global {
  interface KVNamespace {
    get(key: string, options?: { type?: 'text' | 'json' | 'arrayBuffer' | 'stream' }): Promise<any>;
    put(key: string, value: string | ArrayBuffer, options?: { expirationTtl?: number }): Promise<void>;
    delete(key: string): Promise<void>;
  }
}

interface Env {
  ASSETS_KV: KVNamespace;
  ORIGIN_URL: string;
  STATIC_TTL: string;
  IMMUTABLE_TTL: string;
  HTML_TTL: string;
}

interface AssetConfig {
  ttl: number;
  cacheKey: string;
  shouldCache: boolean;
  isImmutable: boolean;
  contentType?: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return handleCORS();
    }
    
    const assetConfig = getAssetConfig(url, request, env);
    
    // Skip caching for non-cacheable requests
    if (!assetConfig.shouldCache) {
      return fetchFromOrigin(request, env);
    }
    
    // Try to get from cache first
    const cachedResponse = await getCachedAsset(assetConfig.cacheKey, env);
    if (cachedResponse) {
      return addAssetHeaders(cachedResponse, 'HIT', assetConfig);
    }
    
    // Fetch from origin and cache the response
    const originResponse = await fetchFromOrigin(request, env);
    
    if (originResponse.ok) {
      await cacheAsset(assetConfig, originResponse.clone(), env);
    }
    
    return addAssetHeaders(originResponse, 'MISS', assetConfig);
  },
};

function getAssetConfig(url: URL, request: Request, env: Env): AssetConfig {
  const pathname = url.pathname;
  const method = request.method;
  
  // Only cache GET requests
  if (method !== 'GET') {
    return { ttl: 0, cacheKey: '', shouldCache: false, isImmutable: false };
  }
  
  // Next.js static assets with hashes (immutable)
  if (pathname.includes('/_next/static/') || 
      pathname.match(/\.(js|css|woff2?|ttf|eot|ico|png|jpg|jpeg|gif|svg|webp)$/)) {
    
    const isHashed = pathname.includes('/_next/static/') || 
                     !!pathname.match(/\.[a-f0-9]{8,}\.(js|css|png|jpg|jpeg|gif|svg|webp)$/);
    
    return {
      ttl: isHashed ? parseInt(env.IMMUTABLE_TTL) || 31536000 : parseInt(env.STATIC_TTL) || 86400, // 1 year vs 1 day
      cacheKey: `asset:${pathname}`,
      shouldCache: true,
      isImmutable: isHashed,
      contentType: getContentType(pathname)
    };
  }
  
  // HTML pages - short cache
  if (pathname.endsWith('.html') || pathname === '/' || !pathname.includes('.')) {
    return {
      ttl: parseInt(env.HTML_TTL) || 300, // 5 minutes
      cacheKey: `html:${pathname}`,
      shouldCache: true,
      isImmutable: false,
      contentType: 'text/html'
    };
  }
  
  // API routes - don't cache here (handled by API cache worker)
  if (pathname.startsWith('/api/')) {
    return { ttl: 0, cacheKey: '', shouldCache: false, isImmutable: false };
  }
  
  // Other static files
  if (pathname.match(/\.(txt|xml|json|pdf|zip|tar|gz)$/)) {
    return {
      ttl: parseInt(env.STATIC_TTL) || 86400, // 1 day
      cacheKey: `static:${pathname}`,
      shouldCache: true,
      isImmutable: false,
      contentType: getContentType(pathname)
    };
  }
  
  // Don't cache other requests
  return { ttl: 0, cacheKey: '', shouldCache: false, isImmutable: false };
}

function getContentType(pathname: string): string {
  const ext = pathname.split('.').pop()?.toLowerCase();
  
  const contentTypes: Record<string, string> = {
    'js': 'application/javascript',
    'css': 'text/css',
    'html': 'text/html',
    'json': 'application/json',
    'xml': 'application/xml',
    'txt': 'text/plain',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'webp': 'image/webp',
    'ico': 'image/x-icon',
    'woff': 'font/woff',
    'woff2': 'font/woff2',
    'ttf': 'font/ttf',
    'eot': 'application/vnd.ms-fontobject',
    'pdf': 'application/pdf',
    'zip': 'application/zip',
    'tar': 'application/x-tar',
    'gz': 'application/gzip'
  };
  
  return contentTypes[ext || ''] || 'application/octet-stream';
}

async function getCachedAsset(cacheKey: string, env: Env): Promise<Response | null> {
  try {
    const cached = await env.ASSETS_KV.get(cacheKey, { type: 'json' });
    if (!cached) return null;
    
    const { body, headers, status, timestamp, ttl } = cached;
    
    // Check if cache is still valid
    if (Date.now() - timestamp > ttl * 1000) {
      await env.ASSETS_KV.delete(cacheKey);
      return null;
    }
    
    // Handle binary content
    let responseBody;
    if (typeof body === 'string' && body.startsWith('data:')) {
      // Base64 encoded binary data
      const base64Data = body.split(',')[1];
      responseBody = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    } else {
      responseBody = body;
    }
    
    return new Response(responseBody, {
      status,
      headers: new Headers(headers)
    });
  } catch (error) {
    console.error('Error retrieving asset from cache:', error);
    return null;
  }
}

async function cacheAsset(config: AssetConfig, response: Response, env: Env): Promise<void> {
  try {
    const headers: Record<string, string> = {};
    
    // Store relevant headers
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });
    
    // Handle binary content
    let body;
    const contentType = response.headers.get('content-type') || '';
    
    if (contentType.startsWith('image/') || 
        contentType.startsWith('font/') || 
        contentType.includes('application/octet-stream')) {
      // Binary content - encode as base64
      const arrayBuffer = await response.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      body = `data:${contentType};base64,${base64}`;
    } else {
      // Text content
      body = await response.text();
    }
    
    const cacheData = {
      body,
      headers,
      status: response.status,
      timestamp: Date.now(),
      ttl: config.ttl
    };
    
    // Store in KV with TTL
    await env.ASSETS_KV.put(
      config.cacheKey,
      JSON.stringify(cacheData),
      { expirationTtl: config.ttl + 3600 } // Add 1 hour buffer
    );
  } catch (error) {
    console.error('Error caching asset:', error);
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
    console.error('Error fetching asset from origin:', error);
    return new Response('Asset not found', { status: 404 });
  }
}

function addAssetHeaders(
  response: Response, 
  cacheStatus: 'HIT' | 'MISS', 
  config: AssetConfig
): Response {
  const newResponse = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers
  });
  
  // Add cache headers
  newResponse.headers.set('X-Cache', cacheStatus);
  newResponse.headers.set('X-Cache-Worker', 'static-assets-cache');
  newResponse.headers.set('CF-Cache-Status', cacheStatus);
  
  // Set appropriate cache control headers
  if (config.isImmutable) {
    newResponse.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  } else if (config.ttl > 86400) {
    newResponse.headers.set('Cache-Control', `public, max-age=${config.ttl}`);
  } else {
    newResponse.headers.set('Cache-Control', `public, max-age=${config.ttl}, must-revalidate`);
  }
  
  // Set content type if specified
  if (config.contentType) {
    newResponse.headers.set('Content-Type', config.contentType);
  }
  
  // Add CORS headers for assets
  newResponse.headers.set('Access-Control-Allow-Origin', '*');
  newResponse.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  newResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  
  return newResponse;
}

function handleCORS(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    }
  });
} 