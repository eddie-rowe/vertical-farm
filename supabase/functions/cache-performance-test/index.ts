import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { CloudflareCache } from "./cloudflare-cache-utils.ts";

interface TaskPayload {
  task_type: string;
  user_id: string;
  device_id?: string;
  parameters?: Record<string, any>;
}

interface TestResponse {
  success: boolean;
  task_id: string;
  execution_time_ms: number;
  cache_hit: boolean;
  cache_key: string;
  cache_stats: {
    total_requests: number;
    cache_hits: number;
    hit_rate_percent: number;
  };
  result?: any;
  error?: string;
}

// Initialize cache with performance tracking
const cache = new CloudflareCache();

Deno.serve(async (req: Request) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed. Use POST.' }),
      { 
        status: 405, 
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  const startTime = performance.now();
  
  try {
    // Parse request body
    const taskPayload: TaskPayload = await req.json();
    
    // Validate required fields
    if (!taskPayload.task_type || !taskPayload.user_id) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields: task_type and user_id' 
        }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Generate unique task ID for this test execution
    const taskId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Execute task with caching
    const result = await executeTaskWithCache(taskId, taskPayload);
    
    const executionTime = performance.now() - startTime;
    
    // Get current cache statistics
    const cacheStats = cache.getStats();
    
    const response: TestResponse = {
      success: true,
      task_id: taskId,
      execution_time_ms: Math.round(executionTime * 100) / 100,
      cache_hit: result.fromCache,
      cache_key: result.cacheKey,
      cache_stats: {
        total_requests: cacheStats.totalRequests,
        cache_hits: cacheStats.cacheHits,
        hit_rate_percent: Math.round(cacheStats.hitRate * 10000) / 100
      },
      result: result.data
    };

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      }
    );

  } catch (error) {
    const executionTime = performance.now() - startTime;
    
    console.error('Cache performance test error:', error);
    
    const errorResponse: TestResponse = {
      success: false,
      task_id: 'error',
      execution_time_ms: Math.round(executionTime * 100) / 100,
      cache_hit: false,
      cache_key: '',
      cache_stats: cache.getStats(),
      error: error.message
    };

    return new Response(
      JSON.stringify(errorResponse),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
});

async function executeTaskWithCache(taskId: string, payload: TaskPayload) {
  const cacheKey = `task:${payload.task_type}:${payload.user_id}:${payload.device_id || 'global'}`;
  
  // Try to get from cache first
  const cached = await cache.get(cacheKey);
  if (cached) {
    console.log(`Cache HIT for key: ${cacheKey}`);
    return {
      data: cached,
      fromCache: true,
      cacheKey
    };
  }

  console.log(`Cache MISS for key: ${cacheKey}`);
  
  // Simulate task execution based on task type
  const result = await simulateTaskExecution(taskId, payload);
  
  // Cache the result with appropriate TTL
  const ttl = getTTLForTaskType(payload.task_type);
  await cache.set(cacheKey, result, ttl);
  
  return {
    data: result,
    fromCache: false,
    cacheKey
  };
}

async function simulateTaskExecution(taskId: string, payload: TaskPayload): Promise<any> {
  // Simulate different execution times and results based on task type
  const simulationDelay = getSimulationDelay(payload.task_type);
  
  // Add realistic delay
  await new Promise(resolve => setTimeout(resolve, simulationDelay));
  
  // Create deterministic seed based on cache key for consistent results
  const cacheKey = `${payload.task_type}:${payload.user_id}:${payload.device_id || 'global'}`;
  const seed = hashCode(cacheKey);
  
  // Generate task-specific result with deterministic data for caching
  switch (payload.task_type) {
    case 'device_discovery':
      return {
        task_id: taskId,
        discovered_devices: [
          { id: 'light_001', type: 'light', status: 'online' },
          { id: 'pump_001', type: 'pump', status: 'online' },
          { id: 'sensor_001', type: 'sensor', status: 'online' }
        ],
        cache_key: cacheKey,
        execution_type: 'simulated'
      };
      
    case 'state_sync':
      return {
        task_id: taskId,
        device_id: payload.device_id,
        current_state: {
          power: (seed % 2) === 0,
          brightness: (seed % 100),
          temperature: 20 + (seed % 10)
        },
        cache_key: cacheKey,
        execution_type: 'simulated'
      };
      
    case 'health_check':
      return {
        task_id: taskId,
        system_status: 'healthy',
        checks: {
          database: 'ok',
          cache: 'ok',
          external_apis: 'ok'
        },
        response_time_ms: simulationDelay,
        cache_key: cacheKey,
        execution_type: 'simulated'
      };
      
    case 'bulk_control':
      return {
        task_id: taskId,
        affected_devices: payload.parameters?.device_ids || ['device_001', 'device_002'],
        action: payload.parameters?.action || 'toggle',
        results: {
          successful: 2,
          failed: 0,
          total: 2
        },
        cache_key: cacheKey,
        execution_type: 'simulated'
      };
      
    default:
      return {
        task_id: taskId,
        task_type: payload.task_type,
        status: 'completed',
        message: 'Generic task execution completed',
        cache_key: cacheKey,
        execution_type: 'simulated'
      };
  }
}

// Simple hash function for deterministic seeding
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

function getSimulationDelay(taskType: string): number {
  // Simulate realistic execution times for different task types
  switch (taskType) {
    case 'device_discovery': return 150 + Math.random() * 100; // 150-250ms
    case 'state_sync': return 50 + Math.random() * 50;        // 50-100ms
    case 'health_check': return 25 + Math.random() * 25;      // 25-50ms
    case 'bulk_control': return 200 + Math.random() * 200;    // 200-400ms
    default: return 75 + Math.random() * 75;                  // 75-150ms
  }
}

function getTTLForTaskType(taskType: string): number {
  // Set appropriate cache TTL based on task type
  switch (taskType) {
    case 'device_discovery': return 300; // 5 minutes - devices don't change often
    case 'state_sync': return 30;        // 30 seconds - state changes frequently
    case 'health_check': return 60;      // 1 minute - health status is fairly stable
    case 'bulk_control': return 10;      // 10 seconds - control actions are time-sensitive
    default: return 120;                 // 2 minutes - default for unknown types
  }
} 