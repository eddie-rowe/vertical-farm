import { createClient } from 'jsr:@supabase/supabase-js@2'

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

// Queue scheduler - triggered by cron
Deno.serve(async (req) => {
  try {
    console.log('⏰ Queue scheduler triggered')
    
    // Get the request body to determine what to schedule
    const body = await req.json().catch(() => ({}))
    const { action = 'process_queues' } = body
    
    switch (action) {
      case 'process_queues':
        return await processQueues()
      case 'schedule_recurring_tasks':
        return await scheduleRecurringTasks()
      case 'cleanup_old_tasks':
        return await cleanupOldTasks()
      default:
        return new Response(JSON.stringify({
          success: false,
          error: 'Unknown action'
        }), { status: 400 })
    }
    
  } catch (error) {
    console.error('❌ Queue scheduler error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})

async function processQueues() {
  console.log('🔄 Processing queues via scheduler')
  
  try {
    // Call the background task processor
    const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/background-task-processor`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
        'Content-Type': 'application/json'
      }
    })
    
    const result = await response.json()
    
    return new Response(JSON.stringify({
      success: true,
      action: 'process_queues',
      result
    }), {
      headers: { 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error('Failed to process queues:', error)
    throw error
  }
}

async function scheduleRecurringTasks() {
  console.log('📅 Scheduling recurring tasks')
  
  try {
    // Get all active schedules
    const { data: schedules, error } = await supabase
      .from('device_schedules')
      .select('*')
      .eq('is_active', true)
    
    if (error) throw error
    
    let scheduled = 0
    const now = new Date()
    
    for (const schedule of schedules || []) {
      // Check if it's time to execute this schedule
      if (shouldExecuteSchedule(schedule, now)) {
        // Queue the scheduled action
        await queueTask({
          id: `scheduled_${schedule.id}_${Date.now()}`,
          type: 'home_assistant.scheduled_action',
          priority: 'normal',
          payload: {
            schedule_id: schedule.id,
            user_id: schedule.user_id
          },
          metadata: {
            created_at: now.toISOString(),
            retry_count: 0,
            max_retries: 3,
            user_id: schedule.user_id
          }
        })
        
        scheduled++
      }
    }
    
    return new Response(JSON.stringify({
      success: true,
      action: 'schedule_recurring_tasks',
      scheduled
    }), {
      headers: { 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error('Failed to schedule recurring tasks:', error)
    throw error
  }
}

async function cleanupOldTasks() {
  console.log('🧹 Cleaning up old tasks')
  
  try {
    // Clean up old task logs (older than 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const { error: logError } = await supabase
      .from('task_logs')
      .delete()
      .lt('created_at', thirtyDaysAgo.toISOString())
    
    if (logError) throw logError
    
    // Clean up old device history (older than 90 days)
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
    
    const { error: historyError } = await supabase
      .from('device_history')
      .delete()
      .lt('recorded_at', ninetyDaysAgo.toISOString())
    
    if (historyError) throw historyError
    
    return new Response(JSON.stringify({
      success: true,
      action: 'cleanup_old_tasks',
      cleaned: true
    }), {
      headers: { 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error('Failed to cleanup old tasks:', error)
    throw error
  }
}

function shouldExecuteSchedule(schedule: any, now: Date): boolean {
  // Parse cron expression and check if it should run now
  // This is a simplified version - in production you'd use a proper cron parser
  
  const { cron_expression, last_executed } = schedule
  
  // If never executed, check if it should run now
  if (!last_executed) {
    return shouldRunBasedOnCron(cron_expression, now)
  }
  
  // Check if enough time has passed since last execution
  const lastExec = new Date(last_executed)
  const timeDiff = now.getTime() - lastExec.getTime()
  
  // Simple check for common patterns
  if (cron_expression.includes('*/5 * * * *')) { // Every 5 minutes
    return timeDiff >= 5 * 60 * 1000
  } else if (cron_expression.includes('0 * * * *')) { // Every hour
    return timeDiff >= 60 * 60 * 1000
  } else if (cron_expression.includes('0 0 * * *')) { // Daily
    return timeDiff >= 24 * 60 * 60 * 1000
  }
  
  // Default to hourly if we can't parse
  return timeDiff >= 60 * 60 * 1000
}

function shouldRunBasedOnCron(cronExpression: string, now: Date): boolean {
  // Simplified cron evaluation
  // In production, use a proper cron parser library
  
  const minute = now.getMinutes()
  const hour = now.getHours()
  
  // Every 5 minutes
  if (cronExpression.includes('*/5 * * * *')) {
    return minute % 5 === 0
  }
  
  // Every hour
  if (cronExpression.includes('0 * * * *')) {
    return minute === 0
  }
  
  // Daily at midnight
  if (cronExpression.includes('0 0 * * *')) {
    return hour === 0 && minute === 0
  }
  
  return false
}

async function queueTask(task: any) {
  // Determine queue based on priority
  const queueName = `${task.priority}_tasks`
  
  // Initialize queue client
  const queueClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { db: { schema: 'pgmq_public' } }
  )
  
  // Send task to queue
  const { error } = await queueClient.rpc('send', {
    queue_name: queueName,
    message: task
  })
  
  if (error) {
    console.error(`Failed to queue task ${task.id}:`, error)
    throw error
  }
  
  console.log(`✅ Queued task ${task.id} to ${queueName}`)
} 