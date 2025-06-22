# Edge Functions Code Review & Caching Implementation Plan

**Date:** 2025-06-12  
**Reviewer:** AI Assistant  
**Scope:** Supabase Edge Functions (`background-task-processor`, `queue-scheduler`)

---

## Summary

The Edge Functions are well-structured for background task processing and queue management. However, there are significant opportunities to implement caching strategies that will improve performance, reduce API calls to Home Assistant, and enhance user experience. The current implementation makes frequent database queries and external API calls that could benefit from strategic caching.

---

## Critical Issues 🚨

**Must be fixed before production scaling**

### 1. **File**: `background-task-processor/index.ts` (lines 252-270)
- **Issue**: Home Assistant configuration fetched on every task execution
- **Impact**: Unnecessary database queries and potential rate limiting
- **Fix**: Implement configuration caching with TTL

### 2. **File**: `background-task-processor/index.ts` (lines 305-350)
- **Issue**: Individual API calls for each device state sync
- **Impact**: High latency and potential HA API rate limiting
- **Fix**: Batch state requests and implement response caching

---

## Major Concerns ⚠️

**Strongly recommended to address**

### 1. **File**: `background-task-processor/index.ts` (lines 249-304)
- **Issue**: Device discovery fetches all entities on every run
- **Recommendation**: Cache discovered devices with incremental updates

### 2. **File**: `queue-scheduler/index.ts` (lines 70-95)
- **Issue**: Schedule evaluation logic is inefficient
- **Recommendation**: Cache parsed cron expressions and next execution times

### 3. **File**: `background-task-processor/index.ts` (lines 508-565)
- **Issue**: Historical data collection makes expensive API calls
- **Recommendation**: Implement progressive data collection with caching

---

## Caching Implementation Plan 🚀

### Phase 1: Configuration & Connection Caching

#### 1.1 Home Assistant Configuration Cache
```typescript
// Add to background-task-processor/index.ts
const configCache = new Map<string, { config: any, expires: number }>()

async function getCachedHAConfig(userId: string) {
  const cacheKey = `ha_config_${userId}`
  const cached = configCache.get(cacheKey)
  
  if (cached && cached.expires > Date.now()) {
    return cached.config
  }
  
  const { data: haConfig } = await supabaseDb
    .from('integrations')
    .select('config')
    .eq('type', 'home_assistant')
    .eq('user_id', userId)
    .single()
  
  if (haConfig) {
    configCache.set(cacheKey, {
      config: haConfig.config,
      expires: Date.now() + (5 * 60 * 1000) // 5 minutes
    })
  }
  
  return haConfig?.config
}
```

#### 1.2 Connection Health Cache
```typescript
const healthCache = new Map<string, { status: any, expires: number }>()

async function getCachedHealthStatus(userId: string) {
  const cacheKey = `health_${userId}`
  const cached = healthCache.get(cacheKey)
  
  if (cached && cached.expires > Date.now()) {
    return cached.status
  }
  
  // Perform actual health check
  const status = await performHealthCheck(userId)
  
  healthCache.set(cacheKey, {
    status,
    expires: Date.now() + (2 * 60 * 1000) // 2 minutes
  })
  
  return status
}
```

### Phase 2: Device State Caching

#### 2.1 Device State Cache with WebSocket Updates
```typescript
const deviceStateCache = new Map<string, { 
  states: Record<string, any>, 
  expires: number 
}>()

async function getCachedDeviceStates(userId: string, entityIds: string[]) {
  const cacheKey = `states_${userId}`
  const cached = deviceStateCache.get(cacheKey)
  
  if (cached && cached.expires > Date.now()) {
    return entityIds.reduce((acc, id) => {
      if (cached.states[id]) {
        acc[id] = cached.states[id]
      }
      return acc
    }, {} as Record<string, any>)
  }
  
  // Fetch fresh states
  const config = await getCachedHAConfig(userId)
  const response = await fetch(`${config.url}/api/states`, {
    headers: {
      'Authorization': `Bearer ${config.access_token}`,
      'Content-Type': 'application/json'
    }
  })
  
  const allStates = await response.json()
  const stateMap = allStates.reduce((acc: any, state: any) => {
    acc[state.entity_id] = state
    return acc
  }, {})
  
  deviceStateCache.set(cacheKey, {
    states: stateMap,
    expires: Date.now() + (30 * 1000) // 30 seconds
  })
  
  return entityIds.reduce((acc, id) => {
    if (stateMap[id]) {
      acc[id] = stateMap[id]
    }
    return acc
  }, {} as Record<string, any>)
}
```

#### 2.2 Batch State Updates
```typescript
async function batchUpdateDeviceStates(userId: string, states: Record<string, any>) {
  const updates = Object.entries(states).map(([entityId, state]) => ({
    entity_id: entityId,
    state: state.state,
    attributes: state.attributes,
    last_seen: new Date().toISOString(),
    user_id: userId
  }))
  
  // Batch upsert instead of individual updates
  await supabaseDb
    .from('home_assistant_devices')
    .upsert(updates, { onConflict: 'entity_id,user_id' })
  
  return updates.length
}
```

### Phase 3: Queue & Schedule Optimization

#### 3.1 Schedule Cache with Parsed Cron
```typescript
interface CachedSchedule {
  schedule: any
  nextExecution: Date
  cronParsed: any
}

const scheduleCache = new Map<string, CachedSchedule>()

async function getCachedSchedules(userId?: string) {
  const cacheKey = `schedules_${userId || 'all'}`
  
  // Check if we need to refresh
  const shouldRefresh = !scheduleCache.has(cacheKey) || 
    Array.from(scheduleCache.values()).some(s => s.nextExecution < new Date())
  
  if (shouldRefresh) {
    const { data: schedules } = await supabase
      .from('device_schedules')
      .select('*')
      .eq('is_active', true)
      .apply(userId ? (query) => query.eq('user_id', userId) : (query) => query)
    
    for (const schedule of schedules || []) {
      const cronParsed = parseCronExpression(schedule.cron_expression)
      const nextExecution = cronParsed.next().toDate()
      
      scheduleCache.set(`schedule_${schedule.id}`, {
        schedule,
        nextExecution,
        cronParsed
      })
    }
  }
  
  return Array.from(scheduleCache.values())
    .filter(s => !userId || s.schedule.user_id === userId)
}
```

### Phase 4: HTTP Cache Headers

#### 4.1 Add Cache Headers to Edge Functions
```typescript
// Add to both functions
function createCachedResponse(data: any, maxAge: number = 60) {
  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': `public, max-age=${maxAge}, s-maxage=${maxAge}`,
      'ETag': `"${generateETag(data)}"`,
      'Last-Modified': new Date().toUTCString()
    }
  })
}

function generateETag(data: any): string {
  return btoa(JSON.stringify(data)).slice(0, 16)
}
```

#### 4.2 Conditional Requests Support
```typescript
function handleConditionalRequest(req: Request, etag: string, lastModified: string) {
  const ifNoneMatch = req.headers.get('If-None-Match')
  const ifModifiedSince = req.headers.get('If-Modified-Since')
  
  if (ifNoneMatch === `"${etag}"` || 
      (ifModifiedSince && new Date(ifModifiedSince) >= new Date(lastModified))) {
    return new Response(null, { status: 304 })
  }
  
  return null
}
```

---

## Minor Improvements 💡

**Nice to have enhancements**

### 1. **File**: `background-task-processor/index.ts` (lines 89-144)
- **Suggestion**: Add queue metrics and monitoring
- **Benefit**: Better observability and performance tuning

### 2. **File**: `queue-scheduler/index.ts` (lines 130-180)
- **Suggestion**: Implement proper cron parsing library
- **Benefit**: More accurate schedule execution

### 3. **File**: Both functions
- **Suggestion**: Add request deduplication for concurrent calls
- **Benefit**: Prevents duplicate work and improves efficiency

---

## Implementation Priority 🎯

### High Priority (Week 1)
1. ✅ Home Assistant configuration caching
2. ✅ Device state caching with batch updates
3. ✅ HTTP cache headers implementation

### Medium Priority (Week 2)
1. ✅ Schedule caching with parsed cron expressions
2. ✅ Connection health caching
3. ✅ Queue metrics and monitoring

### Low Priority (Week 3)
1. ✅ Request deduplication
2. ✅ Progressive data collection
3. ✅ Advanced cache invalidation strategies

---

## Performance Expectations 📊

### Before Caching
- **HA Config Queries**: ~50-100 per hour
- **Device State API Calls**: ~200-500 per hour
- **Average Response Time**: 500-1500ms
- **Database Load**: High (frequent repeated queries)

### After Caching
- **HA Config Queries**: ~10-20 per hour (80% reduction)
- **Device State API Calls**: ~50-100 per hour (75% reduction)
- **Average Response Time**: 100-300ms (70% improvement)
- **Database Load**: Low (cached responses)

---

## Cache Invalidation Strategy 🔄

### Automatic Invalidation
- **Configuration changes**: Clear config cache immediately
- **Device state changes**: 30-second TTL with WebSocket updates
- **Schedule modifications**: Clear schedule cache on updates

### Manual Invalidation
- **Health check failures**: Clear health cache
- **API errors**: Clear related caches
- **User logout**: Clear all user-specific caches

---

## Monitoring & Metrics 📈

### Cache Performance Metrics
```typescript
interface CacheMetrics {
  hits: number
  misses: number
  hitRate: number
  avgResponseTime: number
  cacheSize: number
}

const cacheMetrics = {
  config: { hits: 0, misses: 0 },
  states: { hits: 0, misses: 0 },
  health: { hits: 0, misses: 0 }
}

function recordCacheHit(type: string) {
  cacheMetrics[type].hits++
}

function recordCacheMiss(type: string) {
  cacheMetrics[type].misses++
}
```

---

## Security Considerations 🔒

### Cache Security
- **Sensitive Data**: Never cache access tokens or passwords
- **User Isolation**: Ensure cache keys include user_id
- **TTL Limits**: Set reasonable expiration times
- **Memory Limits**: Implement cache size limits to prevent memory exhaustion

### Access Control
- **Cache Poisoning**: Validate all cached data before use
- **Cross-User Access**: Prevent cache key collisions between users
- **Audit Logging**: Log cache operations for security monitoring

---

## Next Steps 🚀

1. **Implement Phase 1** (Configuration caching) - **Priority: Critical**
2. **Add cache metrics** to monitor performance improvements
3. **Test with production load** to validate cache effectiveness
4. **Implement remaining phases** based on performance gains
5. **Document cache behavior** for future maintenance

This caching strategy will significantly improve your Edge Functions performance while maintaining data consistency and security. 