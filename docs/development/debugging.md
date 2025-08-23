# Debugging Guide

Comprehensive debugging techniques and tools for the Vertical Farm project.

## 🔍 Debugging Philosophy

- **Reproduce First** - Always reproduce the issue before attempting fixes
- **Isolate the Problem** - Narrow down to the smallest possible scope
- **Use the Right Tools** - Different problems require different approaches
- **Document Findings** - Help future developers (including yourself)

## 🛠️ Debugging Tools

### Frontend Debugging

#### Browser DevTools

```javascript
// Console debugging
console.log('Basic output:', variable)
console.table(arrayOfObjects)  // Tabular display
console.time('operation')      // Performance timing
// ... code to measure
console.timeEnd('operation')
console.trace()                // Stack trace

// Conditional breakpoints
if (unexpectedCondition) {
  debugger;  // Pauses execution
}

// Grouped logging
console.group('User Actions')
console.log('Action 1')
console.log('Action 2')
console.groupEnd()
```

#### React DevTools

```typescript
// Component debugging
// Install React DevTools browser extension

// Add display names for better debugging
const FarmCard = React.memo(({ farm }) => {
  // Component logic
})
FarmCard.displayName = 'FarmCard'

// Use React.StrictMode for detecting issues
function App() {
  return (
    <React.StrictMode>
      <YourApp />
    </React.StrictMode>
  )
}

// Debug renders with React DevTools Profiler
// Helps identify unnecessary re-renders
```

#### Next.js Debugging

```javascript
// Debug configuration (.vscode/launch.json)
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev"],
      "cwd": "${workspaceFolder}/frontend",
      "port": 9229,
      "env": {
        "NODE_OPTIONS": "--inspect"
      }
    }
  ]
}

// Server-side debugging
export default async function Page() {
  console.log('Server-side log')  // Appears in terminal
  
  // Debug server components
  const data = await fetchData()
  console.dir(data, { depth: null })  // Deep object inspection
  
  return <Component data={data} />
}
```

#### Service Layer Debugging

```typescript
// Add debug logging to services
class FarmService extends BaseService {
  private debug = process.env.NODE_ENV === 'development'
  
  async getFarmsByUser(userId: string) {
    if (this.debug) {
      console.group(`FarmService.getFarmsByUser`)
      console.log('userId:', userId)
      console.time('Database query')
    }
    
    try {
      const farms = await this.query(/* ... */)
      
      if (this.debug) {
        console.log('Found farms:', farms.length)
        console.timeEnd('Database query')
      }
      
      return farms
    } catch (error) {
      if (this.debug) {
        console.error('Error details:', error)
      }
      throw error
    } finally {
      if (this.debug) {
        console.groupEnd()
      }
    }
  }
}
```

### Backend Debugging

#### Python Debugging with pdb

```python
# Interactive debugging
import pdb

def problematic_function(data):
    # Set breakpoint
    pdb.set_trace()  # Or use breakpoint() in Python 3.7+
    
    # Code continues here
    result = process_data(data)
    return result

# Conditional debugging
if unexpected_condition:
    breakpoint()  # Drops into debugger

# Post-mortem debugging
try:
    risky_operation()
except Exception:
    import pdb
    pdb.post_mortem()  # Debug after exception
```

#### VS Code Python Debugging

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "FastAPI Debug",
      "type": "python",
      "request": "launch",
      "module": "uvicorn",
      "args": [
        "app.main:app",
        "--reload",
        "--port", "8000"
      ],
      "cwd": "${workspaceFolder}/backend",
      "env": {
        "PYTHONPATH": "${workspaceFolder}/backend",
        "DEBUG": "true"
      }
    }
  ]
}
```

#### Logging Configuration

```python
# backend/app/core/logging.py
import logging
import sys
from pathlib import Path

def setup_logging(debug: bool = False):
    """Configure application logging."""
    level = logging.DEBUG if debug else logging.INFO
    
    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(level)
    
    # File handler
    file_handler = logging.FileHandler('app.log')
    file_handler.setLevel(logging.WARNING)
    
    # Formatter
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    console_handler.setFormatter(formatter)
    file_handler.setFormatter(formatter)
    
    # Root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(level)
    root_logger.addHandler(console_handler)
    root_logger.addHandler(file_handler)
    
    # Reduce noise from libraries
    logging.getLogger('uvicorn').setLevel(logging.WARNING)
    logging.getLogger('sqlalchemy').setLevel(logging.WARNING)

# Usage in code
logger = logging.getLogger(__name__)

async def process_sensor_data(sensor_id: str):
    logger.debug(f"Processing sensor {sensor_id}")
    
    try:
        data = await fetch_sensor_data(sensor_id)
        logger.info(f"Retrieved {len(data)} readings")
        
        processed = await process_readings(data)
        logger.debug(f"Processed data: {processed}")
        
        return processed
    except Exception as e:
        logger.error(f"Error processing sensor {sensor_id}: {e}", exc_info=True)
        raise
```

#### FastAPI Request Debugging

```python
# Middleware for request/response logging
from fastapi import Request
import time
import json

@app.middleware("http")
async def debug_middleware(request: Request, call_next):
    # Log request
    start_time = time.time()
    body = await request.body()
    
    logger.debug(f"""
    Request:
    - Method: {request.method}
    - URL: {request.url}
    - Headers: {dict(request.headers)}
    - Body: {body.decode() if body else 'No body'}
    """)
    
    # Process request
    response = await call_next(request)
    
    # Log response
    process_time = time.time() - start_time
    logger.debug(f"""
    Response:
    - Status: {response.status_code}
    - Process Time: {process_time:.3f}s
    """)
    
    response.headers["X-Process-Time"] = str(process_time)
    return response
```

### Database Debugging

#### SQL Query Debugging

```python
# Enable SQLAlchemy query logging
import logging
logging.basicConfig()
logging.getLogger('sqlalchemy.engine').setLevel(logging.INFO)

# Or with echo parameter
from sqlalchemy import create_engine
engine = create_engine('postgresql://...', echo=True)

# Query performance analysis
from sqlalchemy import event
from sqlalchemy.engine import Engine
import time

@event.listens_for(Engine, "before_cursor_execute")
def before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    conn.info.setdefault('query_start_time', []).append(time.time())
    logger.debug("Start Query: %s", statement)

@event.listens_for(Engine, "after_cursor_execute")
def after_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    total = time.time() - conn.info['query_start_time'].pop(-1)
    logger.debug("Query Complete in %.3fs", total)
    if total > 0.5:  # Log slow queries
        logger.warning("Slow query detected (%.3fs): %s", total, statement)
```

#### Supabase Debugging

```sql
-- Check query performance
EXPLAIN ANALYZE
SELECT * FROM farms
WHERE user_id = 'user-123'
AND created_at > NOW() - INTERVAL '30 days';

-- View active queries
SELECT 
    pid,
    now() - pg_stat_activity.query_start AS duration,
    query,
    state
FROM pg_stat_activity
WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes';

-- Check table sizes
SELECT
    schemaname AS table_schema,
    tablename AS table_name,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Debug RLS policies
SELECT * FROM pg_policies WHERE tablename = 'farms';
```

### Network Debugging

#### API Request Debugging

```typescript
// Frontend API debugging
class DebugClient {
  private baseURL: string
  
  constructor(baseURL: string) {
    this.baseURL = baseURL
  }
  
  async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseURL}${endpoint}`
    
    console.group(`API Request: ${options.method || 'GET'} ${endpoint}`)
    console.log('URL:', url)
    console.log('Options:', options)
    console.time('Request duration')
    
    try {
      const response = await fetch(url, options)
      const data = await response.json()
      
      console.log('Status:', response.status)
      console.log('Headers:', Object.fromEntries(response.headers.entries()))
      console.log('Response:', data)
      console.timeEnd('Request duration')
      
      if (!response.ok) {
        console.error('Request failed:', response.statusText)
      }
      
      return data
    } catch (error) {
      console.error('Request error:', error)
      console.timeEnd('Request duration')
      throw error
    } finally {
      console.groupEnd()
    }
  }
}

// Usage
const debug = new DebugClient('http://localhost:8000')
await debug.request('/api/v1/farms', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Test Farm' })
})
```

#### WebSocket Debugging

```typescript
// Debug WebSocket connections
class DebugWebSocket {
  private ws: WebSocket
  private debug: boolean = true
  
  connect(url: string) {
    this.ws = new WebSocket(url)
    
    this.ws.onopen = (event) => {
      if (this.debug) console.log('WebSocket opened:', event)
    }
    
    this.ws.onmessage = (event) => {
      if (this.debug) {
        console.log('WebSocket message:', JSON.parse(event.data))
      }
    }
    
    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error)
    }
    
    this.ws.onclose = (event) => {
      if (this.debug) {
        console.log('WebSocket closed:', event.code, event.reason)
      }
    }
  }
  
  send(data: any) {
    const message = JSON.stringify(data)
    if (this.debug) {
      console.log('Sending:', data)
    }
    this.ws.send(message)
  }
}
```

## 🐛 Common Issues & Solutions

### Frontend Issues

#### Issue: Component Not Re-rendering

```typescript
// Problem: State updates not triggering re-render
const [items, setItems] = useState([])

// ❌ Wrong: Mutating existing array
items.push(newItem)
setItems(items)

// ✅ Correct: Creating new array
setItems([...items, newItem])

// Debug: Check if props/state actually changed
useEffect(() => {
  console.log('Items changed:', items)
}, [items])
```

#### Issue: Infinite Re-renders

```typescript
// Problem: Effect causing infinite loop
useEffect(() => {
  // ❌ Wrong: Updates dependency in effect
  setData(processData(data))
}, [data])

// ✅ Correct: Use callback or memoization
const processedData = useMemo(() => processData(data), [data])

// Debug: Add counter to detect loops
const renderCount = useRef(0)
renderCount.current++
if (renderCount.current > 100) {
  console.error('Possible infinite loop detected!')
}
```

#### Issue: Hydration Mismatch

```typescript
// Problem: Server and client render differently
// Debug: Check for client-only code
const [mounted, setMounted] = useState(false)

useEffect(() => {
  setMounted(true)
}, [])

if (!mounted) {
  return <LoadingState />  // Same on server and client
}

return <ClientOnlyComponent />  // Only after hydration
```

### Backend Issues

#### Issue: Slow API Response

```python
# Debug: Profile the endpoint
import cProfile
import pstats
from io import StringIO

def profile_endpoint():
    pr = cProfile.Profile()
    pr.enable()
    
    # Your slow code here
    result = slow_function()
    
    pr.disable()
    s = StringIO()
    ps = pstats.Stats(pr, stream=s).sort_stats('cumulative')
    ps.print_stats(10)  # Top 10 slow functions
    print(s.getvalue())
    
    return result

# Common solutions:
# 1. Add database indexes
# 2. Implement caching
# 3. Use async operations
# 4. Optimize queries (N+1 problem)
```

#### Issue: Memory Leaks

```python
# Debug: Monitor memory usage
import tracemalloc
import gc

# Start tracing
tracemalloc.start()

# Your code here
result = process_large_dataset()

# Get memory snapshot
snapshot = tracemalloc.take_snapshot()
top_stats = snapshot.statistics('lineno')

print("[ Top 10 memory consumers ]")
for stat in top_stats[:10]:
    print(stat)

# Force garbage collection
gc.collect()

# Common causes:
# 1. Circular references
# 2. Global variables holding large data
# 3. Unclosed connections/files
# 4. Cache without expiration
```

#### Issue: Database Connection Errors

```python
# Debug: Connection pool monitoring
from sqlalchemy.pool import QueuePool
import logging

logging.basicConfig()
logging.getLogger('sqlalchemy.pool').setLevel(logging.DEBUG)

# Create engine with pool logging
engine = create_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_size=5,
    max_overflow=10,
    pool_pre_ping=True,  # Test connections before using
    echo_pool=True  # Log pool checkouts/checkins
)

# Monitor pool status
@app.on_event("startup")
async def startup_event():
    # Log pool status periodically
    async def log_pool_status():
        while True:
            pool = engine.pool
            logger.info(f"""
            Pool Status:
            - Size: {pool.size()}
            - Checked out: {pool.checked_out_connections}
            - Overflow: {pool.overflow}
            - Total: {pool.size() + pool.overflow}
            """)
            await asyncio.sleep(60)
    
    asyncio.create_task(log_pool_status())
```

## 🔬 Advanced Debugging Techniques

### Remote Debugging

```python
# Python remote debugging with debugpy
import debugpy

# Enable debugging on port 5678
debugpy.listen(("0.0.0.0", 5678))
print("Waiting for debugger attach...")
debugpy.wait_for_client()
print("Debugger attached!")

# VS Code configuration for remote debugging
{
  "name": "Python: Remote Attach",
  "type": "python",
  "request": "attach",
  "connect": {
    "host": "localhost",
    "port": 5678
  },
  "pathMappings": [
    {
      "localRoot": "${workspaceFolder}/backend",
      "remoteRoot": "/app"
    }
  ]
}
```

### Production Debugging

```typescript
// Feature flags for debug mode
const DEBUG_MODE = process.env.NEXT_PUBLIC_DEBUG === 'true'

export function debugLog(...args: any[]) {
  if (DEBUG_MODE) {
    console.log('[DEBUG]', new Date().toISOString(), ...args)
  }
}

// Conditional debug UI
export function DebugPanel({ data }: { data: any }) {
  if (!DEBUG_MODE) return null
  
  return (
    <div className="fixed bottom-0 right-0 p-4 bg-black text-white">
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  )
}

// Performance monitoring
export function measurePerformance(name: string, fn: () => void) {
  if (!DEBUG_MODE) return fn()
  
  performance.mark(`${name}-start`)
  const result = fn()
  performance.mark(`${name}-end`)
  performance.measure(name, `${name}-start`, `${name}-end`)
  
  const measure = performance.getEntriesByName(name)[0]
  debugLog(`Performance: ${name} took ${measure.duration}ms`)
  
  return result
}
```

### Docker Debugging

```bash
# Debug running container
docker exec -it <container_id> /bin/bash

# View container logs
docker logs -f --tail 100 <container_id>

# Inspect container configuration
docker inspect <container_id>

# Monitor resource usage
docker stats <container_id>

# Debug networking
docker network inspect bridge

# Debug volumes
docker volume inspect <volume_name>
```

```yaml
# docker-compose.yml debugging configuration
services:
  backend:
    image: backend:latest
    environment:
      - DEBUG=true
      - LOG_LEVEL=debug
    volumes:
      - ./backend:/app  # Mount for hot reload
    ports:
      - "8000:8000"
      - "5678:5678"  # Debug port
    command: python -m debugpy --listen 0.0.0.0:5678 -m uvicorn app.main:app --reload
```

## 📝 Debug Checklist

### Before Debugging
- [ ] Can you reproduce the issue consistently?
- [ ] Have you checked the error messages/logs?
- [ ] Is this a regression? (Did it work before?)
- [ ] Have you isolated the problem area?

### During Debugging
- [ ] Use appropriate debugging tools
- [ ] Add strategic logging/breakpoints
- [ ] Test your hypothesis systematically
- [ ] Document your findings

### After Debugging
- [ ] Remove debug code/console.logs
- [ ] Add test to prevent regression
- [ ] Document the solution
- [ ] Share knowledge with team

## 🚀 Performance Debugging

### Frontend Performance

```typescript
// React DevTools Profiler
// Measures component render performance

// Performance Observer API
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    console.log('LCP:', entry.startTime, entry)
  }
})
observer.observe({ entryTypes: ['largest-contentful-paint'] })

// Custom performance marks
performance.mark('fetch-start')
await fetchData()
performance.mark('fetch-end')
performance.measure('fetch', 'fetch-start', 'fetch-end')
```

### Backend Performance

```python
# Line profiling
from line_profiler import LineProfiler

def profile_function(func):
    lp = LineProfiler()
    lp_wrapper = lp(func)
    lp_wrapper()
    lp.print_stats()

# Memory profiling
from memory_profiler import profile

@profile
def memory_intensive_function():
    # Your code here
    pass

# Async profiling
import asyncio
import time

async def profile_async(coro):
    start = time.perf_counter()
    result = await coro
    elapsed = time.perf_counter() - start
    print(f"Execution time: {elapsed:.3f}s")
    return result
```

---

*Debugging is twice as hard as writing the code in the first place. Therefore, if you write the code as cleverly as possible, you are, by definition, not smart enough to debug it.* - Brian Kernighan