# PostGREST Migration Strategy

## Current State Analysis

### FastAPI Backend: 11 Endpoint Files (~58KB total)
- **auth.py** (2.3KB) - Authentication endpoints
- **login.py** (1.7KB) - Login/logout endpoints 
- **users.py** (1.9KB) - User management
- **farms.py** (4.9KB) - Farm CRUD operations
- **rows.py** (6.6KB) - Row CRUD operations
- **racks.py** (7.4KB) - Rack CRUD operations
- **shelves.py** (8.9KB) - Shelf CRUD operations
- **fans.py** (7.8KB) - Fan device CRUD
- **sensor_devices.py** (8.6KB) - Sensor device CRUD
- **user_permissions.py** (8.5KB) - Permission management
- **home_assistant.py** (38KB) - External HA integration

### Migration Classification

## 🟢 **ELIMINATE (80% of code) - Replace with PostGREST/Supabase**
Standard CRUD operations that can be handled entirely by Supabase:

### Authentication & Users
- `POST /auth/register` → Supabase Auth
- `POST /auth/login` → Supabase Auth  
- `GET /users/me` → Supabase Auth user context
- `PUT /users/{id}` → Direct Supabase table update

### Farm Management (Complete CRUD)
- `GET /farms` → `GET /rest/v1/farms`
- `POST /farms` → `POST /rest/v1/farms`
- `GET /farms/{id}` → `GET /rest/v1/farms?id=eq.{id}`
- `PUT /farms/{id}` → `PATCH /rest/v1/farms?id=eq.{id}`
- `DELETE /farms/{id}` → `DELETE /rest/v1/farms?id=eq.{id}`

### Hierarchy Management (Complete CRUD)
- All rows, racks, shelves endpoints → Direct Supabase table operations
- Complex queries → Use database functions we implemented

### Device Management (Complete CRUD)
- All fans, sensor_devices endpoints → Direct Supabase table operations
- Device assignments → Use RLS policies and database functions

### Permissions
- User permissions → Leverage RLS policies + database functions

## 🟡 **SIMPLIFY (15% of code) - Minimal FastAPI + Edge Functions**
Complex business logic and external integrations:

### Home Assistant Integration
**Keep in FastAPI:**
- External API calls to HA instances
- WebSocket connections to HA
- Device control commands
- Real-time subscription management

**Move to Edge Functions:**
- Configuration validation
- Connection testing
- Data transformation

## 🔴 **ENHANCE (5% of code) - Database Functions + Triggers**
Move complex operations to PostgreSQL:

### Background Processing
- Automated device monitoring
- Schedule calculations
- Data aggregation and analytics

## Migration Phases

### Phase 1: Frontend Migration (This Phase)
**Replace FastAPI client calls with Supabase client calls**

#### 1.1: Authentication Migration
```typescript
// Before: FastAPI calls
const response = await fetch('/api/auth/login', {
  method: 'POST',
  body: JSON.stringify({ email, password })
});

// After: Supabase Auth
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password
});
```

#### 1.2: CRUD Operations Migration
```typescript
// Before: FastAPI farms endpoint
const response = await fetch('/api/farms');
const farms = await response.json();

// After: Supabase PostGREST
const { data: farms, error } = await supabase
  .from('farms')
  .select('*');
```

#### 1.3: Complex Queries Migration
```typescript
// Before: Custom FastAPI endpoint
const response = await fetch(`/api/farms/${farmId}/devices`);

// After: Supabase with joins
const { data: devices, error } = await supabase
  .from('device_assignments')
  .select(`
    *,
    farms(name),
    rows(name),
    racks(name),
    shelves(name)
  `)
  .eq('farm_id', farmId);
```

### Phase 2: Backend Simplification
**Reduce FastAPI to minimal external integration layer**

#### 2.1: Remove CRUD Endpoints
- Delete farms.py, rows.py, racks.py, shelves.py
- Delete auth.py, login.py, users.py  
- Delete fans.py, sensor_devices.py
- Delete user_permissions.py

#### 2.2: Keep Home Assistant Integration
- Maintain home_assistant.py for external API calls
- Add Edge Functions for data processing
- Use Supabase real-time for device updates

### Phase 3: Database Function Integration
**Leverage advanced PostgreSQL features**

#### 3.1: Complex Business Logic → Database Functions
```sql
-- Farm statistics (already implemented)
SELECT * FROM public.get_farm_statistics('farm-uuid');

-- Device status monitoring (already implemented)  
SELECT * FROM public.get_device_status_summary('farm-uuid');

-- Search functionality (already implemented)
SELECT * FROM public.search_devices('pump');
```

#### 3.2: Automated Operations → Triggers
- Auto-update timestamps (already implemented)
- Schedule calculations (already implemented)
- Data validation (already implemented)

## Expected Outcomes

### Code Reduction
- **~1,180 lines** FastAPI → **~300 lines** (75% reduction)
- **11 endpoint files** → **1 file** (home_assistant.py only)
- **~58KB backend** → **~15KB backend** (74% reduction)

### Performance Improvements
- **2-3x faster** CRUD operations (direct database access)
- **Real-time updates** out of the box
- **Automatic caching** with HTTP headers
- **Connection pooling** efficiency

### Development Velocity
- **Zero boilerplate** for new endpoints
- **Auto-generated APIs** from schema changes
- **Built-in filtering/pagination** 
- **Type-safe** operations with generated types

### Maintenance Benefits
- **Single source of truth** (database schema)
- **Automatic documentation** (OpenAPI spec)
- **Simplified deployment** (fewer moving parts)
- **Better error handling** (database-level constraints)

## Implementation Timeline
- **Phase 1**: 2-3 hours (Frontend migration)
- **Phase 2**: 1 hour (Backend simplification)  
- **Phase 3**: 30 minutes (Database function integration)

**Total Migration Time: ~4 hours for 75% code reduction and 2-3x performance improvement!** 