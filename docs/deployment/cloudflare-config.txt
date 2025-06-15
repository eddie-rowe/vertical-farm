# Cloudflare Configuration for Vertical Farm Application
# Copy these rules to your Cloudflare dashboard

## Page Rules (in order of priority)

### 1. API Health Checks - No Cache
URL: *vertical-farm.goodgoodgreens.org/health*
Settings:
- Cache Level: Bypass
- Browser Cache TTL: Respect Existing Headers

### 2. Static Assets - Aggressive Cache
URL: *vertical-farm.goodgoodgreens.org/static/*
Settings:
- Cache Level: Cache Everything
- Edge Cache TTL: 1 year
- Browser Cache TTL: 1 year

### 3. Images - Long Cache
URL: *vertical-farm.goodgoodgreens.org/images/*
Settings:
- Cache Level: Cache Everything
- Edge Cache TTL: 1 month
- Browser Cache TTL: 1 month

### 4. API Endpoints - Short Cache with Revalidation
URL: *vertical-farm.goodgoodgreens.org/api/*
Settings:
- Cache Level: Cache Everything
- Edge Cache TTL: 5 minutes
- Browser Cache TTL: 5 minutes
- Origin Cache Control: On

### 5. Main Application - Standard Cache
URL: *vertical-farm.goodgoodgreens.org/*
Settings:
- Cache Level: Standard
- Edge Cache TTL: 5 minutes
- Browser Cache TTL: 5 minutes

## Transform Rules - Response Headers

### Security Headers (Apply to all requests)
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy: camera=(), microphone=(), geolocation=()

### Cache Headers for API Endpoints
Match: hostname eq "vertical-farm.goodgoodgreens.org" and starts_with(http.request.uri.path, "/api/")
Headers:
- Vary: Authorization, Accept-Encoding
- Cache-Control: public, max-age=300, must-revalidate

### Cache Headers for Static Assets
Match: hostname eq "vertical-farm.goodgoodgreens.org" and starts_with(http.request.uri.path, "/static/")
Headers:
- Cache-Control: public, max-age=31536000, immutable

## Workers (Optional - for advanced caching logic)

### Edge Cache Worker
```javascript
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  
  // Custom caching logic for different endpoints
  if (url.pathname.startsWith('/api/v1/farms/')) {
    return handleFarmDataRequest(request)
  }
  
  if (url.pathname.startsWith('/api/v1/devices/')) {
    return handleDeviceDataRequest(request)
  }
  
  // Default behavior
  return fetch(request)
}

async function handleFarmDataRequest(request) {
  const cache = caches.default
  const cacheKey = new Request(request.url, request)
  
  // Try cache first
  let response = await cache.match(cacheKey)
  
  if (!response) {
    // Fetch from origin
    response = await fetch(request)
    
    // Cache successful responses for 10 minutes
    if (response.status === 200) {
      const responseToCache = response.clone()
      responseToCache.headers.set('Cache-Control', 'public, max-age=600')
      await cache.put(cacheKey, responseToCache)
    }
  }
  
  return response
}

async function handleDeviceDataRequest(request) {
  const cache = caches.default
  const cacheKey = new Request(request.url, request)
  
  // Try cache first
  let response = await cache.match(cacheKey)
  
  if (!response) {
    // Fetch from origin
    response = await fetch(request)
    
    // Cache for 1 minute due to real-time nature
    if (response.status === 200) {
      const responseToCache = response.clone()
      responseToCache.headers.set('Cache-Control', 'public, max-age=60')
      await cache.put(cacheKey, responseToCache)
    }
  }
  
  return response
}
```

## DNS Settings
- Ensure your domain is proxied through Cloudflare (orange cloud)
- Enable "Always Use HTTPS"
- Set minimum TLS version to 1.2

## SSL/TLS Settings
- SSL/TLS encryption mode: Full (strict)
- Always Use HTTPS: On
- HTTP Strict Transport Security (HSTS): Enable with max-age=31536000

## Speed Optimizations
- Auto Minify: Enable for HTML, CSS, JS
- Brotli: Enable
- Early Hints: Enable
- HTTP/2: Enable
- HTTP/3 (with QUIC): Enable

## Firewall Rules (Optional)
- Rate limiting for API endpoints: 100 requests per minute per IP
- Bot fight mode: Enable
- Security level: Medium 