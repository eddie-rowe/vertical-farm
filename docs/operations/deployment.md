# Cloudflare Configuration Guide

Complete setup and configuration guide for Cloudflare CDN, caching, security, and performance optimization for the Vertical Farm platform.

## Overview

Cloudflare provides multiple layers of protection and performance enhancement:
- **CDN** - Global content delivery network
- **Caching** - Edge caching for static and dynamic content
- **Security** - DDoS protection, WAF, bot management
- **Performance** - Optimization, minification, compression

## Initial Setup

### Step 1: Add Your Domain

1. Log into Cloudflare Dashboard
2. Click **Add a Site**
3. Enter your domain: `yourdomain.com`
4. Select plan (Pro recommended for production)
5. Update nameservers at your registrar

### Step 2: DNS Configuration

```yaml
# Required DNS Records
A     @            YOUR_SERVER_IP        Proxied
A     www          YOUR_SERVER_IP        Proxied
CNAME api          api.render.com        Proxied
CNAME app          app.render.com        Proxied
TXT   _dmarc       v=DMARC1; p=none      DNS only
MX    @            mail.yourdomain.com   DNS only
```

### Step 3: SSL/TLS Configuration

1. Navigate to **SSL/TLS** > **Overview**
2. Set encryption mode: **Full (Strict)**
3. Enable **Always Use HTTPS**
4. Enable **Automatic HTTPS Rewrites**

```yaml
# SSL/TLS Settings
Encryption Mode: Full (Strict)
Minimum TLS Version: TLS 1.2
Opportunistic Encryption: On
TLS 1.3: On
Automatic HTTPS Rewrites: On
```

## Caching Configuration

### Page Rules (Priority Order)

```yaml
# 1. Bypass health checks
URL: *yourdomain.com/health*
Settings:
  - Cache Level: Bypass
  - Security Level: Essentially Off

# 2. Static assets - aggressive caching
URL: *yourdomain.com/static/*
Settings:
  - Cache Level: Cache Everything
  - Edge Cache TTL: 1 year
  - Browser Cache TTL: 1 year

# 3. API endpoints - smart caching
URL: *yourdomain.com/api/*
Settings:
  - Cache Level: Standard
  - Edge Cache TTL: 5 minutes
  - Origin Cache Control: On
  - Cache Deception Armor: On

# 4. Frontend - standard caching
URL: *yourdomain.com/*
Settings:
  - Cache Level: Standard
  - Browser Cache TTL: 4 hours
  - Origin Cache Control: On
```

### Cache Rules (New Method)

```typescript
// Modern cache rules configuration
{
  "rules": [
    {
      "expression": "(http.request.uri.path contains \"/static/\")",
      "action": "cache",
      "action_parameters": {
        "edge_ttl": 31536000,
        "browser_ttl": 31536000,
        "cache_key": {
          "custom_key": {
            "query_string": { "exclude": ["timestamp"] }
          }
        }
      }
    },
    {
      "expression": "(http.request.uri.path contains \"/api/\")",
      "action": "cache",
      "action_parameters": {
        "edge_ttl": 300,
        "respect_origin": true,
        "cache_key": {
          "custom_key": {
            "header": ["Authorization"],
            "query_string": { "include": ["*"] }
          }
        }
      }
    }
  ]
}
```

### Cache API Configuration

```javascript
// Cloudflare Worker for advanced caching
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const cache = caches.default
  const cacheKey = new Request(request.url, request)
  
  // Check cache
  let response = await cache.match(cacheKey)
  
  if (!response) {
    // Cache miss - fetch from origin
    response = await fetch(request)
    
    // Cache successful responses
    if (response.status === 200) {
      const headers = new Headers(response.headers)
      headers.set('Cache-Control', 'public, max-age=300')
      
      response = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: headers
      })
      
      // Store in cache
      event.waitUntil(cache.put(cacheKey, response.clone()))
    }
  }
  
  return response
}
```

## Security Configuration

### WAF (Web Application Firewall)

1. Navigate to **Security** > **WAF**
2. Enable **Managed Rules**
3. Configure custom rules:

```yaml
# Custom WAF Rules
- Name: Block SQL Injection
  Expression: (http.request.uri.query contains "union select") or 
              (http.request.uri.query contains "drop table")
  Action: Block

- Name: Rate Limiting - API
  Expression: (http.request.uri.path contains "/api/")
  Action: Challenge
  Rate: 100 requests per minute per IP

- Name: Block Bad Bots
  Expression: (cf.client.bot) and not (cf.verified_bot)
  Action: Block

- Name: Geo-blocking (if required)
  Expression: (ip.geoip.country in {"CN" "RU" "KP"})
  Action: Challenge
```

### DDoS Protection

```yaml
# DDoS Settings
DDoS Protection: On
Sensitivity Level: High

# Advanced DDoS
HTTP DDoS attack protection:
  Sensitivity: High
  Action: Block
  
Network-layer DDoS attack protection:
  Sensitivity: High
  Action: Block
```

### Bot Management

```yaml
# Bot Fight Mode
Bot Fight Mode: On
Verified Bots: Allow
JavaScript Detections: On
  
# Super Bot Fight Mode (Pro)
Definitely Automated: Block
Likely Automated: Challenge
Verified Bots: Allow
Static Resources: Allow
```

### Security Headers

```yaml
# Transform Rules - Response Headers
Set Headers:
  X-Content-Type-Options: nosniff
  X-Frame-Options: SAMEORIGIN
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(), microphone=(), camera=()
  
Content-Security-Policy: >
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  font-src 'self' data:;
  connect-src 'self' https://api.yourdomain.com wss://yourdomain.com;
```

## Performance Optimization

### Speed Settings

```yaml
# Speed > Optimization
Auto Minify:
  JavaScript: On
  CSS: On
  HTML: On

Brotli: On
Rocket Loader: Off (can break React apps)
Mirage: On
Polish: Lossy
WebP: On
Early Hints: On
HTTP/2: On
HTTP/3 (QUIC): On
0-RTT Connection Resumption: On
```

### Image Optimization

```yaml
# Images > Polish
Polish: Lossy
WebP: On

# Resize images on-the-fly
Image Resizing: On
Variants:
  thumbnail: width=150,height=150,fit=cover
  mobile: width=640,quality=85
  desktop: width=1920,quality=90
```

### Mobile Optimization

```yaml
# Speed > Optimization > Mobile
Accelerated Mobile Pages (AMP): On
Mobile Redirect: Off
```

## Analytics & Monitoring

### Web Analytics Setup

1. Navigate to **Analytics** > **Web Analytics**
2. Add your site
3. Install tracking script (automatic with proxy)

### Performance Monitoring

```yaml
# Key Metrics to Monitor
- Cache Hit Ratio: Target > 90%
- Bandwidth Saved: Track monthly
- Threats Blocked: Security effectiveness
- Response Time: Edge vs Origin
- Error Rate: 4xx and 5xx responses
```

### Real User Monitoring (RUM)

```javascript
// Add to your frontend
<script defer src="https://static.cloudflareinsights.com/beacon.min.js" 
        data-cf-beacon='{"token": "YOUR_RUM_TOKEN"}'></script>
```

## Workers Configuration

### Deploy Edge Functions

```javascript
// wrangler.toml
name = "vertical-farm-worker"
main = "src/index.js"
compatibility_date = "2024-01-01"

[env.production]
route = "yourdomain.com/api/*"
zone_id = "YOUR_ZONE_ID"

[env.production.vars]
API_KEY = "YOUR_API_KEY"
```

### Example Worker - API Rate Limiting

```javascript
// Rate limiting worker
const RATE_LIMIT = 100; // requests per minute
const cache = caches.default;

async function handleRequest(request) {
  const ip = request.headers.get('CF-Connecting-IP');
  const key = `rate-limit:${ip}`;
  
  // Check rate limit
  const count = await getCount(key);
  
  if (count > RATE_LIMIT) {
    return new Response('Rate limit exceeded', { status: 429 });
  }
  
  // Increment counter
  await incrementCount(key);
  
  // Forward request
  return fetch(request);
}

async function getCount(key) {
  const response = await cache.match(key);
  if (!response) return 0;
  return parseInt(await response.text());
}

async function incrementCount(key) {
  const count = await getCount(key) + 1;
  const response = new Response(count.toString(), {
    headers: { 'Cache-Control': 'max-age=60' }
  });
  await cache.put(key, response);
}
```

## Zero Trust Configuration

### Access Policies

```yaml
# Protect admin routes
Application: Admin Panel
Domain: admin.yourdomain.com
Policy:
  - Name: Require Authentication
    Action: Allow
    Include:
      - Email ends with @yourdomain.com
      - Country = US
    Require:
      - Purpose = admin
      - Valid TOTP
```

### Service Tokens

```bash
# Create service token for API access
cf access service-token create \
  --name "Vertical Farm API" \
  --duration 8760h
```

## Load Balancing

### Configure Load Balancer

```yaml
# Load Balancing > Create Pool
Pool Name: vertical-farm-backend
Origins:
  - Address: backend1.yourdomain.com:443
    Weight: 1
    Enabled: true
  - Address: backend2.yourdomain.com:443
    Weight: 1
    Enabled: true

Health Check:
  Type: HTTPS
  Path: /health
  Interval: 60 seconds
  Timeout: 5 seconds
  Retries: 2

Load Balancer:
  Name: vertical-farm-lb
  Default Pool: vertical-farm-backend
  Fallback Pool: vertical-farm-backup
  Session Affinity: Cookie
  Steering Policy: Dynamic
```

## Argo Smart Routing

### Enable Argo

1. Navigate to **Traffic** > **Argo**
2. Enable Argo Smart Routing
3. Enable Tiered Caching

Benefits:
- 30% faster on average
- Reduced origin load
- Improved reliability
- Real-time traffic routing

## Troubleshooting

### Common Issues

**Cache Not Working**
```bash
# Check cache headers
curl -I https://yourdomain.com/api/test
# Look for CF-Cache-Status header

# Purge cache
curl -X POST "https://api.cloudflare.com/client/v4/zones/ZONE_ID/purge_cache" \
  -H "Authorization: Bearer API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}'
```

**SSL Issues**
- Verify SSL mode is Full (Strict)
- Check origin certificate validity
- Ensure CAA records allow Cloudflare

**Performance Issues**
- Review Analytics for slow endpoints
- Check origin response times
- Verify caching rules
- Monitor bandwidth usage

### Debugging Tools

```bash
# Test from Cloudflare edge
curl -H "CF-Connecting-IP: TEST" https://yourdomain.com/api/test

# Check security events
# Dashboard > Security > Events

# View cache analytics
# Dashboard > Analytics > Cache
```

## Monitoring & Alerts

### Setup Notifications

1. Navigate to **Notifications**
2. Configure alerts for:
   - DDoS attacks
   - Origin errors
   - SSL certificate expiration
   - Usage spikes
   - Security events

### API Monitoring

```python
# Monitor Cloudflare metrics
import requests

headers = {
    'Authorization': f'Bearer {API_TOKEN}',
    'Content-Type': 'application/json'
}

# Get zone analytics
response = requests.get(
    f'https://api.cloudflare.com/client/v4/zones/{ZONE_ID}/analytics/dashboard',
    headers=headers,
    params={'since': '-1440', 'until': '0'}
)

data = response.json()
print(f"Requests: {data['result']['totals']['requests']}")
print(f"Cache hit ratio: {data['result']['totals']['cached_ratio']}%")
```

## Cost Optimization

### Bandwidth Management
- Enable Polish for image compression
- Use Cloudflare Images for transformations
- Implement aggressive caching
- Enable Argo Tiered Cache

### Feature Recommendations

**Essential (Free/Pro)**
- CDN & Caching
- SSL/TLS
- DDoS Protection
- Basic WAF

**Advanced (Business/Enterprise)**
- Advanced DDoS
- Custom WAF rules
- Image optimization
- Load balancing
- Argo routing

## Best Practices

1. **Always proxy DNS records** for protection
2. **Use Full (Strict) SSL** mode
3. **Implement rate limiting** on APIs
4. **Monitor cache hit ratios** regularly
5. **Purge cache** after deployments
6. **Backup DNS** records externally
7. **Test rules** in Log mode first
8. **Document** all custom configurations

## Related Documentation

- [Docker Guide](../development/docker.md)
- [Cloudflare Documentation](https://developers.cloudflare.com/)
- [CLAUDE.md](/CLAUDE.md) - Architecture standards

---

*For support, check [Cloudflare Status](https://www.cloudflarestatus.com/) | For API reference, see [Cloudflare API Docs](https://api.cloudflare.com/)*