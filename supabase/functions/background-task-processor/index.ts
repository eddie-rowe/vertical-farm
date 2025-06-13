import { createClient } from 'jsr:@supabase/supabase-js@2'

// Types for our task system
interface TaskMessage {
  id: string
  type: string
  priority: 'critical' | 'high' | 'normal' | 'low'
  payload: any
  metadata: {
    created_at: string
    retry_count: number
    max_retries: number
    user_id?: string
  }
}

interface TaskResult {
  success: boolean
  result?: any
  error?: string
  execution_time: number
}

// Initialize Supabase client for queue operations
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  { db: { schema: 'pgmq_public' } }
)

// Initialize regular Supabase client for database operations
const supabaseDb = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

// Task processors
const taskProcessors = {
  'home_assistant.device_discovery': processDeviceDiscovery,
  'home_assistant.state_sync': processStateSync,
  'home_assistant.health_check': processHealthCheck,
  'home_assistant.bulk_control': processBulkControl,
  'home_assistant.scheduled_action': processScheduledAction,
  'home_assistant.data_collection': processDataCollection,
}

// Main Edge Function handler
Deno.serve(async (req) => {
  const startTime = Date.now()
  
  try {
    console.log('🔄 Background task processor started')
    
    // Process tasks from different priority queues
    const queues = ['critical_tasks', 'high_tasks', 'normal_tasks', 'low_tasks']
    let totalProcessed = 0
    
    for (const queueName of queues) {
      const processed = await processQueue(queueName)
      totalProcessed += processed
      
      // Break if we've processed enough tasks in this run
      if (totalProcessed >= 10) break
    }
    
    const executionTime = Date.now() - startTime
    console.log(`✅ Processed ${totalProcessed} tasks in ${executionTime}ms`)
    
    return new Response(JSON.stringify({
      success: true,
      processed: totalProcessed,
      execution_time: executionTime
    }), {
      headers: { 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error('❌ Background processor error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})

async function processQueue(queueName: string): Promise<number> {
  try {
    // Read messages from queue
    const { data: messages, error } = await supabase.rpc('read', {
      queue_name: queueName,
      sleep_seconds: 30, // Mark invisible for 30 seconds
      n: 5 // Process up to 5 messages at a time
    })
    
    if (error) {
      console.error(`Error reading from queue ${queueName}:`, error)
      return 0
    }
    
    if (!messages || messages.length === 0) {
      return 0
    }
    
    console.log(`📥 Processing ${messages.length} messages from ${queueName}`)
    
    let processed = 0
    for (const message of messages) {
      try {
        const task: TaskMessage = message.message
        const result = await processTask(task)
        
        if (result.success) {
          // Delete successful task from queue
          await supabase.rpc('delete', {
            queue_name: queueName,
            message_id: message.msg_id
          })
          
          // Log success
          await logTaskResult(task, result)
          processed++
          
        } else {
          // Handle failed task
          await handleFailedTask(queueName, message, task, result)
        }
        
      } catch (error) {
        console.error('Error processing message:', error)
        // Let the message become visible again for retry
      }
    }
    
    return processed
    
  } catch (error) {
    console.error(`Error processing queue ${queueName}:`, error)
    return 0
  }
}

async function processTask(task: TaskMessage): Promise<TaskResult> {
  const startTime = Date.now()
  
  try {
    console.log(`🔧 Processing task: ${task.type}`)
    
    const processor = taskProcessors[task.type]
    if (!processor) {
      throw new Error(`Unknown task type: ${task.type}`)
    }
    
    const result = await processor(task.payload)
    const executionTime = Date.now() - startTime
    
    return {
      success: true,
      result,
      execution_time: executionTime
    }
    
  } catch (error) {
    const executionTime = Date.now() - startTime
    console.error(`❌ Task failed: ${task.type}`, error)
    
    return {
      success: false,
      error: error.message,
      execution_time: executionTime
    }
  }
}

async function handleFailedTask(
  queueName: string, 
  message: any, 
  task: TaskMessage, 
  result: TaskResult
) {
  const retryCount = task.metadata.retry_count + 1
  const maxRetries = task.metadata.max_retries || 3
  
  if (retryCount <= maxRetries) {
    // Update retry count and re-queue
    const updatedTask = {
      ...task,
      metadata: {
        ...task.metadata,
        retry_count: retryCount
      }
    }
    
    // Delete original message
    await supabase.rpc('delete', {
      queue_name: queueName,
      message_id: message.msg_id
    })
    
    // Re-queue with updated retry count
    await supabase.rpc('send', {
      queue_name: queueName,
      message: updatedTask
    })
    
    console.log(`🔄 Retrying task ${task.id} (attempt ${retryCount}/${maxRetries})`)
    
  } else {
    // Max retries exceeded, move to dead letter queue
    await supabase.rpc('delete', {
      queue_name: queueName,
      message_id: message.msg_id
    })
    
    await supabase.rpc('send', {
      queue_name: 'failed_tasks',
      message: { ...task, failure_reason: result.error }
    })
    
    console.log(`💀 Task ${task.id} moved to dead letter queue after ${maxRetries} retries`)
  }
  
  // Log failure
  await logTaskResult(task, result)
}

async function logTaskResult(task: TaskMessage, result: TaskResult) {
  try {
    await supabaseDb
      .from('task_logs')
      .insert({
        task_id: task.id,
        task_type: task.type,
        priority: task.priority,
        success: result.success,
        execution_time: result.execution_time,
        error_message: result.error,
        retry_count: task.metadata.retry_count,
        created_at: new Date().toISOString()
      })
  } catch (error) {
    console.error('Failed to log task result:', error)
  }
}

// Home Assistant task processors
async function processDeviceDiscovery(payload: any) {
  console.log('🔍 Processing device discovery')
  
  // Get Home Assistant connection details
  const { data: haConfig } = await supabaseDb
    .from('integrations')
    .select('config')
    .eq('type', 'home_assistant')
    .eq('user_id', payload.user_id)
    .single()
  
  if (!haConfig) {
    throw new Error('Home Assistant not configured')
  }
  
  const config = haConfig.config
  
  // Fetch entities from Home Assistant
  const response = await fetch(`${config.url}/api/states`, {
    headers: {
      'Authorization': `Bearer ${config.access_token}`,
      'Content-Type': 'application/json'
    }
  })
  
  if (!response.ok) {
    throw new Error(`HA API error: ${response.status}`)
  }
  
  const entities = await response.json()
  
  // Filter relevant device types
  const relevantEntities = entities.filter((entity: any) => {
    const domain = entity.entity_id.split('.')[0]
    return ['light', 'switch', 'fan', 'valve'].includes(domain)
  })
  
  // Store discovered devices
  const devices = relevantEntities.map((entity: any) => ({
    entity_id: entity.entity_id,
    name: entity.attributes.friendly_name || entity.entity_id,
    device_type: entity.entity_id.split('.')[0],
    state: entity.state,
    attributes: entity.attributes,
    user_id: payload.user_id,
    last_seen: new Date().toISOString()
  }))
  
  // Upsert devices
  await supabaseDb
    .from('home_assistant_devices')
    .upsert(devices, { onConflict: 'entity_id,user_id' })
  
  return { discovered: devices.length }
}

async function processStateSync(payload: any) {
  console.log('🔄 Processing state sync')
  
  // Get devices to sync
  const { data: devices } = await supabaseDb
    .from('home_assistant_devices')
    .select('*')
    .eq('user_id', payload.user_id)
  
  if (!devices || devices.length === 0) {
    return { synced: 0 }
  }
  
  // Get HA config
  const { data: haConfig } = await supabaseDb
    .from('integrations')
    .select('config')
    .eq('type', 'home_assistant')
    .eq('user_id', payload.user_id)
    .single()
  
  const config = haConfig.config
  let synced = 0
  
  // Sync each device state
  for (const device of devices) {
    try {
      const response = await fetch(`${config.url}/api/states/${device.entity_id}`, {
        headers: {
          'Authorization': `Bearer ${config.access_token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const state = await response.json()
        
        await supabaseDb
          .from('home_assistant_devices')
          .update({
            state: state.state,
            attributes: state.attributes,
            last_seen: new Date().toISOString()
          })
          .eq('entity_id', device.entity_id)
          .eq('user_id', payload.user_id)
        
        synced++
      }
    } catch (error) {
      console.error(`Failed to sync ${device.entity_id}:`, error)
    }
  }
  
  return { synced }
}

async function processHealthCheck(payload: any) {
  console.log('🏥 Processing health check')
  
  const { data: haConfig } = await supabaseDb
    .from('integrations')
    .select('config')
    .eq('type', 'home_assistant')
    .eq('user_id', payload.user_id)
    .single()
  
  if (!haConfig) {
    throw new Error('Home Assistant not configured')
  }
  
  const config = haConfig.config
  const startTime = Date.now()
  
  try {
    const response = await fetch(`${config.url}/api/`, {
      headers: {
        'Authorization': `Bearer ${config.access_token}`,
        'Content-Type': 'application/json'
      }
    })
    
    const responseTime = Date.now() - startTime
    const isHealthy = response.ok
    
    // Update integration health status
    await supabaseDb
      .from('integrations')
      .update({
        health_status: isHealthy ? 'healthy' : 'unhealthy',
        last_health_check: new Date().toISOString(),
        response_time: responseTime
      })
      .eq('type', 'home_assistant')
      .eq('user_id', payload.user_id)
    
    return { 
      healthy: isHealthy, 
      response_time: responseTime,
      status: response.status
    }
    
  } catch (error) {
    await supabaseDb
      .from('integrations')
      .update({
        health_status: 'unhealthy',
        last_health_check: new Date().toISOString(),
        response_time: null
      })
      .eq('type', 'home_assistant')
      .eq('user_id', payload.user_id)
    
    throw error
  }
}

async function processBulkControl(payload: any) {
  console.log('🎛️ Processing bulk control')
  
  const { entity_ids, action, value, user_id } = payload
  
  const { data: haConfig } = await supabaseDb
    .from('integrations')
    .select('config')
    .eq('type', 'home_assistant')
    .eq('user_id', user_id)
    .single()
  
  const config = haConfig.config
  let controlled = 0
  
  for (const entityId of entity_ids) {
    try {
      const domain = entityId.split('.')[0]
      let service = ''
      let serviceData: any = { entity_id: entityId }
      
      // Determine service based on action and domain
      if (action === 'turn_on') {
        service = `${domain}/turn_on`
        if (value !== undefined && domain === 'light') {
          serviceData.brightness_pct = value
        }
      } else if (action === 'turn_off') {
        service = `${domain}/turn_off`
      }
      
      const response = await fetch(`${config.url}/api/services/${service}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(serviceData)
      })
      
      if (response.ok) {
        controlled++
      }
      
    } catch (error) {
      console.error(`Failed to control ${entityId}:`, error)
    }
  }
  
  return { controlled }
}

async function processScheduledAction(payload: any) {
  console.log('⏰ Processing scheduled action')
  
  const { schedule_id, user_id } = payload
  
  // Get schedule details
  const { data: schedule } = await supabaseDb
    .from('device_schedules')
    .select('*')
    .eq('id', schedule_id)
    .eq('user_id', user_id)
    .single()
  
  if (!schedule || !schedule.is_active) {
    return { executed: false, reason: 'Schedule not found or inactive' }
  }
  
  // Execute the scheduled action
  const result = await processBulkControl({
    entity_ids: schedule.entity_ids,
    action: schedule.action,
    value: schedule.value,
    user_id
  })
  
  // Update last execution time
  await supabaseDb
    .from('device_schedules')
    .update({ last_executed: new Date().toISOString() })
    .eq('id', schedule_id)
  
  return { executed: true, ...result }
}

async function processDataCollection(payload: any) {
  console.log('📊 Processing data collection')
  
  const { entity_ids, user_id, time_range } = payload
  
  const { data: haConfig } = await supabaseDb
    .from('integrations')
    .select('config')
    .eq('type', 'home_assistant')
    .eq('user_id', user_id)
    .single()
  
  const config = haConfig.config
  let collected = 0
  
  for (const entityId of entity_ids) {
    try {
      const endTime = new Date()
      const startTime = new Date(endTime.getTime() - (time_range || 3600) * 1000)
      
      const response = await fetch(
        `${config.url}/api/history/period/${startTime.toISOString()}?filter_entity_id=${entityId}&end_time=${endTime.toISOString()}`,
        {
          headers: {
            'Authorization': `Bearer ${config.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      )
      
      if (response.ok) {
        const history = await response.json()
        
        // Store historical data
        if (history[0] && history[0].length > 0) {
          const dataPoints = history[0].map((point: any) => ({
            entity_id: entityId,
            state: point.state,
            attributes: point.attributes,
            recorded_at: point.last_changed,
            user_id
          }))
          
          await supabaseDb
            .from('device_history')
            .insert(dataPoints)
          
          collected += dataPoints.length
        }
      }
      
    } catch (error) {
      console.error(`Failed to collect data for ${entityId}:`, error)
    }
  }
  
  return { collected }
} 