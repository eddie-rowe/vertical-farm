# Service Layer Architecture

## 🚨 CRITICAL: This is the Most Important Architecture Pattern

The service layer is the **absolute foundation** of the VerticalFarm OS architecture. **NEVER bypass the service layer for any data operation**. This document explains why this pattern is critical and how to implement it correctly.

## Why Service Layer?

### The Problem Without Service Layer

```typescript
// ❌ ANTI-PATTERN: Direct database calls in components
export function FarmComponent() {
  const [farms, setFarms] = useState([])
  
  useEffect(() => {
    // This is WRONG - Never do this!
    const fetchFarms = async () => {
      const { data, error } = await supabase
        .from('farms')
        .select('*')
        .eq('user_id', userId)
      
      if (error) console.error(error)
      setFarms(data)
    }
    fetchFarms()
  }, [])
}
```

**Problems with this approach:**
- No error handling strategy
- No caching mechanism
- No validation
- No business logic enforcement
- Difficult to test
- Duplicated code across components
- Tight coupling to database structure
- No audit logging
- Security vulnerabilities

### The Solution: Service Layer Pattern

```typescript
// ✅ CORRECT: Using service layer
export function FarmComponent() {
  const [farms, setFarms] = useState([])
  const farmService = FarmService.getInstance()
  
  useEffect(() => {
    const loadFarms = async () => {
      try {
        const userFarms = await farmService.getFarmsByUser(userId)
        setFarms(userFarms)
      } catch (error) {
        handleError(error) // Centralized error handling
      }
    }
    loadFarms()
  }, [])
}
```

## Service Layer Benefits

### 1. **Centralized Business Logic**
All business rules are enforced in one place:
```typescript
class FarmService {
  async createFarm(data: CreateFarmDTO): Promise<Farm> {
    // Validation
    this.validateFarmData(data)
    
    // Business rules
    if (await this.userExceedsFarmLimit(data.userId)) {
      throw new BusinessRuleError('Farm limit exceeded')
    }
    
    // Data transformation
    const farmData = this.transformToDbFormat(data)
    
    // Database operation
    return await this.create(farmData)
  }
}
```

### 2. **Consistent Error Handling**
```typescript
class BaseService {
  protected async handleOperation<T>(
    operation: () => Promise<T>
  ): Promise<T> {
    try {
      return await operation()
    } catch (error) {
      this.logError(error)
      this.notifyMonitoring(error)
      throw this.transformError(error)
    }
  }
}
```

### 3. **Built-in Caching**
```typescript
class CachedService extends BaseService {
  private cache = new Map()
  
  async getWithCache<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    if (this.cache.has(key)) {
      return this.cache.get(key)
    }
    
    const data = await fetcher()
    this.cache.set(key, data)
    return data
  }
}
```

### 4. **Testability**
```typescript
// Easy to test with dependency injection
describe('FarmService', () => {
  it('should enforce farm limits', async () => {
    const mockDb = createMockDatabase()
    const service = new FarmService(mockDb)
    
    await expect(service.createFarm(invalidData))
      .rejects.toThrow('Farm limit exceeded')
  })
})
```

## Service Layer Implementation

### Base Service Classes

```typescript
// BaseService.ts - Foundation for all services
export abstract class BaseService {
  protected supabase: SupabaseClient
  protected logger: Logger
  
  constructor() {
    this.supabase = createClient()
    this.logger = new Logger(this.constructor.name)
  }
  
  protected async executeQuery<T>(
    query: () => Promise<{ data: T; error: any }>
  ): Promise<T> {
    const startTime = Date.now()
    
    try {
      const { data, error } = await query()
      
      if (error) {
        throw new DatabaseError(error.message, error.code)
      }
      
      this.logger.debug('Query executed', {
        duration: Date.now() - startTime
      })
      
      return data
    } catch (error) {
      this.logger.error('Query failed', { error })
      throw this.handleError(error)
    }
  }
  
  protected handleError(error: any): Error {
    if (error instanceof AppError) {
      return error
    }
    
    if (error.code === 'PGRST116') {
      return new NotFoundError('Resource not found')
    }
    
    if (error.code === '23505') {
      return new ConflictError('Resource already exists')
    }
    
    return new InternalError('An unexpected error occurred')
  }
}
```

```typescript
// BaseCRUDService.ts - CRUD operations base
export abstract class BaseCRUDService<T> extends BaseService {
  constructor(protected tableName: string) {
    super()
  }
  
  async findById(id: string): Promise<T | null> {
    return this.executeQuery(async () => {
      return await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single()
    })
  }
  
  async findAll(filters?: Partial<T>): Promise<T[]> {
    return this.executeQuery(async () => {
      let query = this.supabase.from(this.tableName).select('*')
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          query = query.eq(key, value)
        })
      }
      
      return await query
    })
  }
  
  async create(data: Omit<T, 'id' | 'created_at' | 'updated_at'>): Promise<T> {
    return this.executeQuery(async () => {
      return await this.supabase
        .from(this.tableName)
        .insert(data)
        .select()
        .single()
    })
  }
  
  async update(id: string, data: Partial<T>): Promise<T> {
    return this.executeQuery(async () => {
      return await this.supabase
        .from(this.tableName)
        .update(data)
        .eq('id', id)
        .select()
        .single()
    })
  }
  
  async delete(id: string): Promise<void> {
    await this.executeQuery(async () => {
      return await this.supabase
        .from(this.tableName)
        .delete()
        .eq('id', id)
    })
  }
}
```

### Domain Service Implementation

```typescript
// FarmService.ts - Domain-specific service
export class FarmService extends BaseCRUDService<Farm> {
  private static instance: FarmService
  
  private constructor() {
    super('farms')
  }
  
  static getInstance(): FarmService {
    if (!FarmService.instance) {
      FarmService.instance = new FarmService()
    }
    return FarmService.instance
  }
  
  // Domain-specific methods
  async getFarmsByUser(userId: string): Promise<Farm[]> {
    this.logger.info('Fetching farms for user', { userId })
    
    const farms = await this.executeQuery(async () => {
      return await this.supabase
        .from(this.tableName)
        .select(`
          *,
          rows (
            *,
            racks (
              *,
              shelves (*)
            )
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
    })
    
    return this.enrichFarmData(farms)
  }
  
  async getFarmWithDevices(farmId: string): Promise<FarmWithDevices> {
    const farm = await this.findById(farmId)
    
    if (!farm) {
      throw new NotFoundError('Farm not found')
    }
    
    const devices = await this.getDeviceAssignments(farmId)
    
    return {
      ...farm,
      devices,
      stats: await this.calculateFarmStats(farm)
    }
  }
  
  private async enrichFarmData(farms: Farm[]): Promise<Farm[]> {
    // Add calculated fields, latest sensor data, etc.
    return Promise.all(farms.map(async farm => ({
      ...farm,
      deviceCount: await this.getDeviceCount(farm.id),
      lastActivity: await this.getLastActivity(farm.id),
      healthScore: await this.calculateHealthScore(farm.id)
    })))
  }
  
  private async calculateHealthScore(farmId: string): Promise<number> {
    // Complex business logic for health scoring
    const sensorData = await this.getSensorService().getLatestReadings(farmId)
    const alerts = await this.getAlertService().getActiveAlerts(farmId)
    
    // Algorithm to calculate health score
    return this.healthAlgorithm(sensorData, alerts)
  }
}
```

### Service Registry Pattern

```typescript
// ServiceRegistry.ts - Central service management
export class ServiceRegistry {
  private static services = new Map<string, any>()
  
  static register<T>(name: string, service: T): void {
    this.services.set(name, service)
  }
  
  static get<T>(name: string): T {
    if (!this.services.has(name)) {
      throw new Error(`Service ${name} not registered`)
    }
    return this.services.get(name) as T
  }
  
  static initialize(): void {
    // Register all services
    this.register('farm', FarmService.getInstance())
    this.register('device', DeviceService.getInstance())
    this.register('sensor', SensorService.getInstance())
    this.register('automation', AutomationService.getInstance())
    this.register('user', UserService.getInstance())
  }
}

// Usage in components
const farmService = ServiceRegistry.get<FarmService>('farm')
```

## Service Layer Patterns

### 1. **Singleton Pattern**
Each service should be a singleton to maintain state and cache:

```typescript
export class DeviceService extends BaseCRUDService<Device> {
  private static instance: DeviceService
  private cache: Map<string, Device> = new Map()
  
  private constructor() {
    super('device_assignments')
  }
  
  static getInstance(): DeviceService {
    if (!DeviceService.instance) {
      DeviceService.instance = new DeviceService()
    }
    return DeviceService.instance
  }
}
```

### 2. **Composition Pattern**
Services can compose other services:

```typescript
export class AutomationService extends BaseService {
  private farmService = FarmService.getInstance()
  private deviceService = DeviceService.getInstance()
  private sensorService = SensorService.getInstance()
  
  async executeAutomationRule(ruleId: string): Promise<void> {
    const rule = await this.getRule(ruleId)
    const farm = await this.farmService.findById(rule.farmId)
    const device = await this.deviceService.findById(rule.deviceId)
    const sensorData = await this.sensorService.getLatestReading(rule.sensorId)
    
    // Execute automation logic using composed services
    await this.processAutomation(rule, farm, device, sensorData)
  }
}
```

### 3. **Transaction Pattern**
Complex operations that need atomicity:

```typescript
export class ScheduleService extends BaseService {
  async createScheduleWithActions(
    scheduleData: CreateScheduleDTO
  ): Promise<Schedule> {
    // Use database transaction
    return await this.supabase.rpc('create_schedule_with_actions', {
      schedule_data: scheduleData,
      actions: this.generateActions(scheduleData)
    })
  }
}
```

### 4. **Cache Invalidation Pattern**
```typescript
export class CachedFarmService extends FarmService {
  private cache = new Map<string, CacheEntry>()
  
  async getFarmsByUser(userId: string): Promise<Farm[]> {
    const cacheKey = `farms_user_${userId}`
    
    // Check cache
    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey).data
    }
    
    // Fetch fresh data
    const farms = await super.getFarmsByUser(userId)
    
    // Update cache
    this.cache.set(cacheKey, {
      data: farms,
      timestamp: Date.now(),
      ttl: 5 * 60 * 1000 // 5 minutes
    })
    
    return farms
  }
  
  async updateFarm(id: string, data: Partial<Farm>): Promise<Farm> {
    const farm = await super.update(id, data)
    
    // Invalidate related caches
    this.invalidateUserCache(farm.userId)
    
    return farm
  }
  
  private invalidateUserCache(userId: string): void {
    const pattern = new RegExp(`^farms_user_${userId}`)
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key)
      }
    }
  }
}
```

## Service Layer Rules

### ✅ DO's

1. **Always extend base service classes**
   ```typescript
   export class MyService extends BaseCRUDService<MyModel> {
     // Implementation
   }
   ```

2. **Use singleton pattern for services**
   ```typescript
   static getInstance(): MyService {
     // Singleton implementation
   }
   ```

3. **Handle errors at service level**
   ```typescript
   try {
     return await this.executeQuery(...)
   } catch (error) {
     throw this.handleError(error)
   }
   ```

4. **Add logging and monitoring**
   ```typescript
   this.logger.info('Operation started', { context })
   // ... operation
   this.logger.info('Operation completed', { result })
   ```

5. **Validate input data**
   ```typescript
   async createItem(data: CreateItemDTO): Promise<Item> {
     this.validateItemData(data) // Throws if invalid
     return await this.create(data)
   }
   ```

### ❌ DON'Ts

1. **Never access database directly from components**
   ```typescript
   // NEVER do this in a component
   const { data } = await supabase.from('table').select()
   ```

2. **Don't create service instances with `new`**
   ```typescript
   // Wrong
   const service = new FarmService()
   
   // Correct
   const service = FarmService.getInstance()
   ```

3. **Don't expose internal implementation**
   ```typescript
   // Don't expose Supabase client or queries
   export class BadService {
     public supabase = createClient() // NO!
   }
   ```

4. **Don't skip error handling**
   ```typescript
   // Always handle errors properly
   async getData() {
     const { data, error } = await query()
     if (error) throw this.handleError(error) // Don't ignore!
     return data
   }
   ```

## Testing Services

### Unit Testing
```typescript
describe('FarmService', () => {
  let service: FarmService
  let mockSupabase: MockSupabaseClient
  
  beforeEach(() => {
    mockSupabase = createMockSupabaseClient()
    service = new FarmService(mockSupabase)
  })
  
  describe('getFarmsByUser', () => {
    it('should return user farms', async () => {
      const userId = 'test-user-id'
      const expectedFarms = [{ id: '1', name: 'Farm 1' }]
      
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: expectedFarms,
            error: null
          })
        })
      })
      
      const farms = await service.getFarmsByUser(userId)
      
      expect(farms).toEqual(expectedFarms)
      expect(mockSupabase.from).toHaveBeenCalledWith('farms')
    })
    
    it('should handle errors gracefully', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' }
          })
        })
      })
      
      await expect(service.getFarmsByUser('user-id'))
        .rejects.toThrow(DatabaseError)
    })
  })
})
```

### Integration Testing
```typescript
describe('FarmService Integration', () => {
  let service: FarmService
  
  beforeAll(async () => {
    await setupTestDatabase()
    service = FarmService.getInstance()
  })
  
  afterAll(async () => {
    await cleanupTestDatabase()
  })
  
  it('should create and retrieve farm', async () => {
    const farmData = {
      name: 'Test Farm',
      location: 'Test Location',
      userId: 'test-user'
    }
    
    const created = await service.create(farmData)
    expect(created.id).toBeDefined()
    
    const retrieved = await service.findById(created.id)
    expect(retrieved).toMatchObject(farmData)
  })
})
```

## Migration Guide

### Migrating from Direct Database Access

If you have existing code with direct database access, follow these steps:

1. **Identify all direct database calls**
   ```bash
   # Search for direct Supabase usage
   grep -r "supabase.from" src/components
   grep -r "supabase.from" src/app
   ```

2. **Create or use existing service**
   ```typescript
   // Before
   const { data } = await supabase.from('farms').select()
   
   // After
   const farmService = FarmService.getInstance()
   const data = await farmService.findAll()
   ```

3. **Update component to use service**
   ```typescript
   // Old component
   export function OldComponent() {
     useEffect(() => {
       supabase.from('farms').select()...
     }, [])
   }
   
   // New component
   export function NewComponent() {
     const farmService = FarmService.getInstance()
     
     useEffect(() => {
       farmService.findAll()...
     }, [])
   }
   ```

4. **Test thoroughly**
   - Unit test the service
   - Integration test the data flow
   - E2E test the user experience

## Performance Considerations

### Caching Strategy
```typescript
interface CacheConfig {
  ttl: number        // Time to live in ms
  maxSize: number    // Maximum cache entries
  strategy: 'LRU' | 'LFU' | 'FIFO'
}

class OptimizedService extends BaseService {
  private cache = new CacheManager({
    ttl: 5 * 60 * 1000,  // 5 minutes
    maxSize: 100,
    strategy: 'LRU'
  })
}
```

### Query Optimization
```typescript
// Batch operations
async getMultipleFarms(ids: string[]): Promise<Farm[]> {
  return this.executeQuery(async () => {
    return await this.supabase
      .from('farms')
      .select('*')
      .in('id', ids) // Single query instead of N queries
  })
}

// Selective field loading
async getFarmNames(userId: string): Promise<Pick<Farm, 'id' | 'name'>[]> {
  return this.executeQuery(async () => {
    return await this.supabase
      .from('farms')
      .select('id, name') // Only fetch needed fields
      .eq('user_id', userId)
  })
}
```

## Monitoring & Debugging

### Service Metrics
```typescript
class MonitoredService extends BaseService {
  private metrics = new MetricsCollector()
  
  async executeQuery<T>(query: () => Promise<T>): Promise<T> {
    const timer = this.metrics.startTimer('query_duration')
    
    try {
      const result = await super.executeQuery(query)
      this.metrics.increment('query_success')
      return result
    } catch (error) {
      this.metrics.increment('query_error')
      throw error
    } finally {
      timer.end()
    }
  }
}
```

### Debug Logging
```typescript
class DebugService extends BaseService {
  protected logger = new Logger({
    level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
    service: this.constructor.name
  })
  
  async findById(id: string): Promise<any> {
    this.logger.debug('Finding by ID', { id })
    const result = await super.findById(id)
    this.logger.debug('Found result', { id, found: !!result })
    return result
  }
}
```

## Summary

The service layer is the **heart of the application architecture**. It provides:

- **Consistency** - Same patterns everywhere
- **Reliability** - Centralized error handling
- **Performance** - Built-in caching
- **Security** - Validation and authorization
- **Maintainability** - Clean separation of concerns
- **Testability** - Easy to mock and test

**Remember: NEVER bypass the service layer. It's not just a recommendation—it's a critical requirement for maintaining code quality and system integrity.**

---

*For questions about service implementation or architecture decisions, consult the development team. All new features must follow the service layer pattern.*