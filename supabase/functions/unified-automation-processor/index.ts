import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Types for our optimized schema
interface FarmHierarchySummary {
  farm_id: string
  farm_name: string
  shelf_id: string
  shelf_name: string
  full_path: string
  device_count: number
  sensor_count: number
  active_schedule_count: number
}

interface ActiveScheduleSummary {
  schedule_id: string
  shelf_id: string
  recipe_name: string
  species_name: string
  completion_percentage: number
  days_remaining: number
  target_temperature_min: number
  target_temperature_max: number
  target_humidity_min: number
  target_humidity_max: number
  full_path: string
}

interface SensorSummary {
  device_assignment_id: string
  shelf_id: string
  entity_id: string
  latest_temperature: number
  latest_humidity: number
  avg_temp_1h: number
  avg_humidity_1h: number
  readings_last_hour: number
  full_path: string
}

interface ProcessingResult {
  success: boolean
  processed_count: number
  error_count: number
  processing_time_ms: number
  operations: string[]
  errors: string[]
}

// Home Assistant integration types
interface HomeAssistantDevice {
  entity_id: string
  state: string
  attributes: Record<string, any>
  last_changed: string
  last_updated: string
}

interface QueueMessage {
  id: string
  priority: 'critical' | 'high' | 'normal' | 'low'
  task_type: string
  payload: Record<string, any>
  created_at: string
  retry_count: number
}

// Global cache with TTL
const memoryCache = new Map<string, { data: any; expires: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

serve(async (req) => {
  const startTime = performance.now()
  
  try {
    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const { task_type, shelf_ids, force_refresh, queue_process, cache_operation } = await req.json()
    
    let result: ProcessingResult = {
      success: true,
      processed_count: 0,
      error_count: 0,
      processing_time_ms: 0,
      operations: [],
      errors: []
    }

    // Handle queue processing if requested
    if (queue_process) {
      await processQueues(supabase, result)
    }

    // Handle cache operations if requested
    if (cache_operation) {
      await processCacheOperations(supabase, result, cache_operation)
    }

    // Refresh materialized views if requested or if they're stale
    if (force_refresh || await shouldRefreshViews(supabase)) {
      await refreshMaterializedViews(supabase, result)
    }

    // Process based on task type
    switch (task_type) {
      case 'sensor_monitoring':
        await processSensorMonitoring(supabase, result, shelf_ids)
        break
      case 'schedule_automation':
        await processScheduleAutomation(supabase, result, shelf_ids)
        break
      case 'environmental_control':
        await processEnvironmentalControl(supabase, result, shelf_ids)
        break
      case 'home_assistant_sync':
        await processHomeAssistantSync(supabase, result)
        break
      case 'device_discovery':
        await processDeviceDiscovery(supabase, result)
        break
      case 'health_check':
        await processHealthCheck(supabase, result)
        break
      case 'batch_processing':
        await processBatchOperations(supabase, result, shelf_ids)
        break
      case 'queue_cleanup':
        await processQueueCleanup(supabase, result)
        break
      default:
        // Process all task types (comprehensive automation)
        await processQueues(supabase, result)
        await processHomeAssistantSync(supabase, result)
        await processSensorMonitoring(supabase, result, shelf_ids)
        await processScheduleAutomation(supabase, result, shelf_ids)
        await processEnvironmentalControl(supabase, result, shelf_ids)
    }

    result.processing_time_ms = performance.now() - startTime

    // Log performance metrics
    await logPerformanceMetrics(supabase, result)

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error) {
    const processingTime = performance.now() - startTime
    
    console.error('Unified processor error:', error)
    
    return new Response(JSON.stringify({
      success: false,
      processed_count: 0,
      error_count: 1,
      processing_time_ms: processingTime,
      operations: [],
      errors: [error.message]
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    })
  }
})

// Cache utilities
function setCache(key: string, data: any, ttl = CACHE_TTL) {
  memoryCache.set(key, {
    data,
    expires: Date.now() + ttl
  })
}

function getCache(key: string): any {
  const cached = memoryCache.get(key)
  if (!cached) return null
  
  if (Date.now() > cached.expires) {
    memoryCache.delete(key)
    return null
  }
  
  return cached.data
}

async function getCachedWithCloudflare(cacheKey: string, fetcher: () => Promise<any>): Promise<any> {
  // Try memory cache first
  const memoryCached = getCache(cacheKey)
  if (memoryCached) return memoryCached
  
  try {
    // Try Cloudflare Cache API
    const cache = await caches.open('automation-cache')
    const cachedResponse = await cache.match(cacheKey)
    
    if (cachedResponse) {
      const data = await cachedResponse.json()
      setCache(cacheKey, data) // Store in memory for faster access
      return data
    }
  } catch (error) {
    console.warn('Cloudflare cache unavailable, using memory only:', error)
  }
  
  // Fetch fresh data
  const data = await fetcher()
  
  // Store in both caches
  setCache(cacheKey, data)
  
  try {
    const cache = await caches.open('automation-cache')
    const response = new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' }
    })
    await cache.put(cacheKey, response)
  } catch (error) {
    console.warn('Failed to store in Cloudflare cache:', error)
  }
  
  return data
}

// Queue processing from existing queue-scheduler
async function processQueues(supabase: any, result: ProcessingResult) {
  const priorityQueues = ['critical_tasks', 'high_tasks', 'normal_tasks', 'low_tasks']
  
  for (const queueName of priorityQueues) {
    try {
      // Process messages from each priority queue
      const { data: messages, error } = await supabase.rpc('pgmq_read_batch', {
        queue_name: queueName,
        vt: 30, // 30 second visibility timeout
        qty: 10 // Process up to 10 messages per queue per run
      })
      
      if (error) throw error
      
      for (const message of messages || []) {
        await processQueueMessage(supabase, message, result)
      }
      
      result.processed_count += messages?.length || 0
      
    } catch (error) {
      result.error_count++
      result.errors.push(`Queue processing error for ${queueName}: ${error.message}`)
    }
  }
}

// Process individual queue message
async function processQueueMessage(supabase: any, message: any, result: ProcessingResult) {
  try {
    const { msg_id, message: payload } = message
    const task = JSON.parse(payload)
    
    switch (task.type) {
      case 'home_assistant_control':
        await executeHomeAssistantControl(supabase, task, result)
        break
      case 'sensor_reading':
        await processSensorReading(supabase, task, result)
        break
      case 'schedule_check':
        await processScheduleCheck(supabase, task, result)
        break
      case 'device_health_check':
        await processDeviceHealthCheck(supabase, task, result)
        break
      default:
        result.errors.push(`Unknown task type: ${task.type}`)
    }
    
    // Delete processed message
    await supabase.rpc('pgmq_delete', {
      queue_name: task.queue || 'normal_tasks',
      msg_id: msg_id
    })
    
    result.operations.push(`Processed queue message: ${task.type}`)
    
  } catch (error) {
    result.errors.push(`Failed to process queue message: ${error.message}`)
    
    // Move to dead letter queue if retry count exceeded
    if (message.retry_count >= 3) {
      await supabase.rpc('pgmq_send', {
        queue_name: 'dead_letter_queue',
        msg: JSON.stringify({
          original_message: message,
          error: error.message,
          failed_at: new Date().toISOString()
        })
      })
    }
  }
}

// Home Assistant integration
async function processHomeAssistantSync(supabase: any, result: ProcessingResult) {
  try {
    const { data: haConfig } = await supabase
      .from('home_assistant_config')
      .select('base_url, access_token')
      .single()
    
    if (!haConfig?.base_url || !haConfig?.access_token) {
      result.operations.push('Home Assistant not configured, skipping sync')
      return
    }
    
    // Get device states from Home Assistant
    const devices = await getCachedWithCloudflare(
      'ha_device_states',
      () => fetchHomeAssistantStates(haConfig.base_url, haConfig.access_token)
    )
    
    // Update device states in database
    for (const device of devices) {
      await supabase.rpc('update_device_state', {
        entity_id: device.entity_id,
        state: device.state,
        attributes: device.attributes,
        last_updated: device.last_updated
      })
    }
    
    result.processed_count += devices.length
    result.operations.push(`Synced ${devices.length} Home Assistant devices`)
    
  } catch (error) {
    result.error_count++
    result.errors.push(`Home Assistant sync error: ${error.message}`)
  }
}

// Fetch device states from Home Assistant
async function fetchHomeAssistantStates(baseUrl: string, accessToken: string): Promise<HomeAssistantDevice[]> {
  const response = await fetch(`${baseUrl}/api/states`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  })
  
  if (!response.ok) {
    throw new Error(`Home Assistant API error: ${response.status}`)
  }
  
  return await response.json()
}

// Execute Home Assistant device control
async function executeHomeAssistantControl(supabase: any, task: any, result: ProcessingResult) {
  try {
    const { data: haConfig } = await supabase
      .from('home_assistant_config')
      .select('base_url, access_token')
      .single()
    
    if (!haConfig) throw new Error('Home Assistant not configured')
    
    const { entity_id, action, parameters } = task
    
    const response = await fetch(`${haConfig.base_url}/api/services/${action.domain}/${action.service}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${haConfig.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        entity_id,
        ...parameters
      })
    })
    
    if (!response.ok) {
      throw new Error(`Home Assistant control failed: ${response.status}`)
    }
    
    result.operations.push(`Executed Home Assistant control: ${entity_id} ${action.service}`)
    
  } catch (error) {
    result.errors.push(`Home Assistant control error: ${error.message}`)
  }
}

// Device discovery process
async function processDeviceDiscovery(supabase: any, result: ProcessingResult) {
  try {
    const { data: haConfig } = await supabase
      .from('home_assistant_config')
      .select('base_url, access_token')
      .single()
    
    if (!haConfig) {
      result.operations.push('Home Assistant not configured, skipping device discovery')
      return
    }
    
    // Get all entities from Home Assistant
    const entities = await fetchHomeAssistantStates(haConfig.base_url, haConfig.access_token)
    
    // Filter for controllable devices (lights, switches, fans, etc.)
    const controllableDevices = entities.filter(entity => 
      entity.entity_id.startsWith('light.') ||
      entity.entity_id.startsWith('switch.') ||
      entity.entity_id.startsWith('fan.') ||
      entity.entity_id.startsWith('input_boolean.')
    )
    
    // Update discovered devices
    for (const device of controllableDevices) {
      await supabase.rpc('upsert_discovered_device', {
        entity_id: device.entity_id,
        friendly_name: device.attributes.friendly_name || device.entity_id,
        device_type: device.entity_id.split('.')[0],
        capabilities: device.attributes,
        last_seen: new Date().toISOString()
      })
    }
    
    result.processed_count += controllableDevices.length
    result.operations.push(`Discovered ${controllableDevices.length} controllable devices`)
    
  } catch (error) {
    result.error_count++
    result.errors.push(`Device discovery error: ${error.message}`)
  }
}

// Cache performance testing and management
async function processCacheOperations(supabase: any, result: ProcessingResult, operation: string) {
  try {
    switch (operation) {
      case 'performance_test':
        await runCachePerformanceTest(result)
        break
      case 'clear_cache':
        await clearAllCaches(result)
        break
      case 'cache_stats':
        await getCacheStatistics(result)
        break
    }
  } catch (error) {
    result.error_count++
    result.errors.push(`Cache operation error: ${error.message}`)
  }
}

async function runCachePerformanceTest(result: ProcessingResult) {
  const testKey = 'performance_test_key'
  const testData = { test: 'data', timestamp: Date.now() }
  
  // Test memory cache
  const memoryStart = performance.now()
  setCache(testKey, testData)
  getCache(testKey)
  const memoryTime = performance.now() - memoryStart
  
  // Test Cloudflare cache
  let cloudflareTime = 0
  try {
    const cfStart = performance.now()
    const cache = await caches.open('performance-test')
    const response = new Response(JSON.stringify(testData))
    await cache.put(testKey, response.clone())
    await cache.match(testKey)
    cloudflareTime = performance.now() - cfStart
  } catch (error) {
    cloudflareTime = -1 // Indicates failure
  }
  
  result.operations.push(`Cache performance: Memory=${memoryTime.toFixed(2)}ms, Cloudflare=${cloudflareTime >= 0 ? cloudflareTime.toFixed(2) + 'ms' : 'failed'}`)
}

async function clearAllCaches(result: ProcessingResult) {
  // Clear memory cache
  memoryCache.clear()
  
  // Clear Cloudflare caches
  try {
    const cacheNames = await caches.keys()
    for (const name of cacheNames) {
      const cache = await caches.open(name)
      const keys = await cache.keys()
      for (const key of keys) {
        await cache.delete(key)
      }
    }
    result.operations.push(`Cleared ${cacheNames.length} Cloudflare cache stores`)
  } catch (error) {
    result.operations.push('Memory cache cleared, Cloudflare cache clear failed')
  }
}

async function getCacheStatistics(result: ProcessingResult) {
  const memoryStats = {
    size: memoryCache.size,
    keys: Array.from(memoryCache.keys())
  }
  
  result.operations.push(`Cache stats: Memory cache has ${memoryStats.size} entries`)
}

// Queue cleanup (from queue-scheduler)
async function processQueueCleanup(supabase: any, result: ProcessingResult) {
  try {
    // Clean up old completed tasks
    const cutoffDate = new Date(Date.now() - (7 * 24 * 60 * 60 * 1000)) // 7 days ago
    
    const { data: cleanupResult, error } = await supabase.rpc('cleanup_old_queue_messages', {
      cutoff_date: cutoffDate.toISOString()
    })
    
    if (error) throw error
    
    result.operations.push(`Cleaned up ${cleanupResult} old queue messages`)
    
    // Archive old performance logs
    await supabase.rpc('archive_old_performance_logs', {
      cutoff_date: cutoffDate.toISOString()
    })
    
    result.operations.push('Archived old performance logs')
    
  } catch (error) {
    result.error_count++
    result.errors.push(`Queue cleanup error: ${error.message}`)
  }
}

// Helper functions for queue message processing
async function processSensorReading(supabase: any, task: any, result: ProcessingResult) {
  // Process sensor reading task
  result.operations.push(`Processed sensor reading for ${task.entity_id}`)
}

async function processScheduleCheck(supabase: any, task: any, result: ProcessingResult) {
  // Process schedule check task
  result.operations.push(`Processed schedule check for ${task.schedule_id}`)
}

async function processDeviceHealthCheck(supabase: any, task: any, result: ProcessingResult) {
  // Process device health check task
  result.operations.push(`Processed device health check for ${task.device_id}`)
}

// Check if materialized views need refreshing
async function shouldRefreshViews(supabase: any): Promise<boolean> {
  try {
    // Check if views exist and when they were last refreshed
    const { data: viewStats } = await supabase
      .from('pg_stat_user_tables')
      .select('schemaname, relname, n_tup_ins, n_tup_upd, n_tup_del')
      .in('relname', ['farms', 'schedules', 'device_assignments', 'sensor_readings'])

    // Simple heuristic: refresh if there have been significant changes
    const totalChanges = viewStats?.reduce((sum: number, table: any) => 
      sum + table.n_tup_ins + table.n_tup_upd + table.n_tup_del, 0) || 0

    return totalChanges > 100 // Refresh if more than 100 changes since last check
  } catch (error) {
    console.warn('Could not check view freshness:', error)
    return false
  }
}

// Refresh materialized views efficiently
async function refreshMaterializedViews(supabase: any, result: ProcessingResult) {
  try {
    const { data, error } = await supabase.rpc('refresh_all_materialized_views')
    
    if (error) throw error
    
    result.operations.push(`Materialized views refreshed: ${data}`)
    console.log('Materialized views refreshed:', data)
  } catch (error) {
    result.errors.push(`Failed to refresh materialized views: ${error.message}`)
    console.error('Materialized view refresh error:', error)
  }
}

// Optimized sensor monitoring using materialized views
async function processSensorMonitoring(supabase: any, result: ProcessingResult, shelf_ids?: string[]) {
  try {
    // Use the optimized sensor summary view
    let query = supabase
      .from('recent_sensor_summary')
      .select('*')
      .lt('readings_last_hour', 1) // Devices with low data frequency
    
    if (shelf_ids && shelf_ids.length > 0) {
      query = query.in('shelf_id', shelf_ids)
    }

    const { data: staleDevices, error } = await query

    if (error) throw error

    for (const device of staleDevices || []) {
      // Check if device is truly unresponsive
      const { data: isResponding } = await supabase.rpc('is_device_responding', {
        device_assignment_id_param: device.device_assignment_id,
        threshold_minutes: 120
      })

      if (!isResponding) {
        // Create alert for unresponsive device
        await supabase.from('environmental_alerts').insert({
          shelf_id: device.shelf_id,
          alert_type: 'device_offline',
          severity: 'medium',
          message: `Device ${device.entity_id} at ${device.full_path} is not responding`,
          acknowledged: false
        })

        result.operations.push(`Alert created for unresponsive device: ${device.entity_id}`)
      }
    }

    result.processed_count += staleDevices?.length || 0
  } catch (error) {
    result.error_count++
    result.errors.push(`Sensor monitoring error: ${error.message}`)
    console.error('Sensor monitoring error:', error)
  }
}

// Optimized schedule automation using materialized views
async function processScheduleAutomation(supabase: any, result: ProcessingResult, shelf_ids?: string[]) {
  try {
    // Use the optimized active schedules view
    let query = supabase
      .from('active_schedules_summary')
      .select('*')
      .eq('status', 'active')
    
    if (shelf_ids && shelf_ids.length > 0) {
      query = query.in('shelf_id', shelf_ids)
    }

    const { data: activeSchedules, error } = await query

    if (error) throw error

    for (const schedule of activeSchedules || []) {
      // Check for schedules nearing completion
      if (schedule.completion_percentage >= 95) {
        await supabase.from('environmental_alerts').insert({
          schedule_id: schedule.schedule_id,
          shelf_id: schedule.shelf_id,
          alert_type: 'harvest_ready',
          severity: 'low',
          message: `${schedule.species_name} at ${schedule.full_path} is ready for harvest (${schedule.completion_percentage}% complete)`,
          acknowledged: false
        })

        result.operations.push(`Harvest alert created for schedule: ${schedule.schedule_id}`)
      }

      // Check for overdue schedules
      if (schedule.days_remaining < 0) {
        await supabase.from('environmental_alerts').insert({
          schedule_id: schedule.schedule_id,
          shelf_id: schedule.shelf_id,
          alert_type: 'schedule_overdue',
          severity: 'medium',
          message: `${schedule.species_name} at ${schedule.full_path} is ${Math.abs(schedule.days_remaining)} days overdue`,
          acknowledged: false
        })

        result.operations.push(`Overdue alert created for schedule: ${schedule.schedule_id}`)
      }
    }

    result.processed_count += activeSchedules?.length || 0
  } catch (error) {
    result.error_count++
    result.errors.push(`Schedule automation error: ${error.message}`)
    console.error('Schedule automation error:', error)
  }
}

// Optimized environmental control using sensor data
async function processEnvironmentalControl(supabase: any, result: ProcessingResult, shelf_ids?: string[]) {
  try {
    // Get active schedules with their environmental targets
    let scheduleQuery = supabase
      .from('active_schedules_summary')
      .select('*')
      .eq('status', 'active')
    
    if (shelf_ids && shelf_ids.length > 0) {
      scheduleQuery = scheduleQuery.in('shelf_id', shelf_ids)
    }

    const { data: schedules, error: scheduleError } = await scheduleQuery
    if (scheduleError) throw scheduleError

    for (const schedule of schedules || []) {
      // Get current sensor data for this shelf
      const { data: sensorData } = await supabase
        .from('recent_sensor_summary')
        .select('*')
        .eq('shelf_id', schedule.shelf_id)
        .single()

      if (sensorData && sensorData.readings_last_hour > 0) {
        // Check temperature
        if (sensorData.latest_temperature !== null) {
          if (sensorData.latest_temperature < schedule.target_temperature_min) {
            await triggerDeviceControl(supabase, schedule.shelf_id, 'heater', 'turn_on', result)
          } else if (sensorData.latest_temperature > schedule.target_temperature_max) {
            await triggerDeviceControl(supabase, schedule.shelf_id, 'fan', 'turn_on', result)
          }
        }

        // Check humidity
        if (sensorData.latest_humidity !== null) {
          if (sensorData.latest_humidity < schedule.target_humidity_min) {
            await triggerDeviceControl(supabase, schedule.shelf_id, 'humidifier', 'turn_on', result)
          } else if (sensorData.latest_humidity > schedule.target_humidity_max) {
            await triggerDeviceControl(supabase, schedule.shelf_id, 'dehumidifier', 'turn_on', result)
          }
        }
      }
    }

    result.processed_count += schedules?.length || 0
  } catch (error) {
    result.error_count++
    result.errors.push(`Environmental control error: ${error.message}`)
    console.error('Environmental control error:', error)
  }
}

// Trigger device control with error handling
async function triggerDeviceControl(supabase: any, shelf_id: string, device_type: string, action: string, result: ProcessingResult) {
  try {
    const { data: controlId, error } = await supabase.rpc('control_device_immediate', {
      p_shelf_id: shelf_id,
      p_device_type: device_type,
      p_action: action,
      p_parameters: {}
    })

    if (error) throw error

    result.operations.push(`Device control triggered: ${device_type} ${action} for shelf ${shelf_id}`)
  } catch (error) {
    result.errors.push(`Device control failed: ${device_type} ${action} for shelf ${shelf_id} - ${error.message}`)
  }
}

// Health check using performance monitoring
async function processHealthCheck(supabase: any, result: ProcessingResult) {
  try {
    // Check for performance alerts
    const { data: alerts, error } = await supabase.rpc('check_performance_alerts')
    
    if (error) throw error

    for (const alert of alerts || []) {
      if (alert.alert_severity === 'critical') {
        result.errors.push(`Critical performance issue: ${alert.alert_message}`)
      } else {
        result.operations.push(`Performance warning: ${alert.alert_message}`)
      }
    }

    // Check system health metrics
    const { data: metrics } = await supabase
      .from('function_performance_summary')
      .select('*')
      .order('hour_bucket', { ascending: false })
      .limit(1)

    if (metrics && metrics.length > 0) {
      const latestMetrics = metrics[0]
      if (latestMetrics.avg_processing_time_ms > 10000) {
        result.errors.push(`High processing time detected: ${latestMetrics.avg_processing_time_ms}ms`)
      }
    }

    result.operations.push('Health check completed')
  } catch (error) {
    result.error_count++
    result.errors.push(`Health check error: ${error.message}`)
    console.error('Health check error:', error)
  }
}

// Batch processing for efficiency
async function processBatchOperations(supabase: any, result: ProcessingResult, shelf_ids?: string[]) {
  try {
    // Batch process multiple operations efficiently
    const batchSize = 50
    
    // Get all shelves to process
    let query = supabase
      .from('farm_hierarchy_summary')
      .select('shelf_id, full_path, device_count')
      .not('shelf_id', 'is', null)
    
    if (shelf_ids && shelf_ids.length > 0) {
      query = query.in('shelf_id', shelf_ids)
    }

    const { data: shelves, error } = await query.limit(batchSize)
    
    if (error) throw error

    // Process shelves in batches
    for (let i = 0; i < (shelves?.length || 0); i += batchSize) {
      const batch = shelves?.slice(i, i + batchSize) || []
      const batchShelfIds = batch.map(s => s.shelf_id)
      
      // Process this batch
      await processSensorMonitoring(supabase, result, batchShelfIds)
      await processScheduleAutomation(supabase, result, batchShelfIds)
      await processEnvironmentalControl(supabase, result, batchShelfIds)
      
      result.operations.push(`Processed batch of ${batch.length} shelves`)
    }
  } catch (error) {
    result.error_count++
    result.errors.push(`Batch processing error: ${error.message}`)
    console.error('Batch processing error:', error)
  }
}

// Log performance metrics to our monitoring system
async function logPerformanceMetrics(supabase: any, result: ProcessingResult) {
  try {
    await supabase.rpc('log_function_performance', {
      p_function_name: 'unified-automation-processor',
      p_processed_count: result.processed_count,
      p_success_count: result.processed_count - result.error_count,
      p_error_count: result.error_count,
      p_processing_time_ms: result.processing_time_ms,
      p_execution_context: {
        operations: result.operations,
        errors: result.errors,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Failed to log performance metrics:', error)
  }
} 