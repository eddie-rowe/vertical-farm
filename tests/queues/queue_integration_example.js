// Comprehensive Supabase Queues Integration Example
// This demonstrates how to use queues with Edge Functions for vertical farm automation

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config()

const supabaseUrl = 'https://mlyupwrkoxtmywespgzx.supabase.co'
const supabaseKey = process.env.SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

// Queue priority mapping
const QUEUE_PRIORITIES = {
  critical: 'critical_tasks',    // System alerts, failures
  high: 'high_tasks',           // Device control, urgent actions
  normal: 'normal_tasks',       // Regular monitoring, data collection
  low: 'low_tasks'             // Cleanup, optimization, reports
}

class VerticalFarmQueueManager {
  constructor(supabaseClient) {
    this.supabase = supabaseClient
  }

  // Send a task to the appropriate priority queue
  async enqueueTask(taskType, payload, priority = 'normal', delaySeconds = 0) {
    const queueName = QUEUE_PRIORITIES[priority]
    if (!queueName) {
      throw new Error(`Invalid priority: ${priority}`)
    }

    const task = {
      id: `${taskType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: taskType,
      payload,
      priority,
      metadata: {
        created_at: new Date().toISOString(),
        retry_count: 0,
        max_retries: 3
      }
    }

    const { data, error } = await this.supabase
      .schema('pgmq_public')
      .rpc('send', {
        queue_name: queueName,
        message: task,
        sleep_seconds: delaySeconds
      })

    if (error) {
      throw new Error(`Failed to enqueue task: ${error.message}`)
    }

    console.log(`✅ Enqueued ${taskType} task with ID: ${task.id} (Message ID: ${data})`)
    return { taskId: task.id, messageId: data[0] }
  }

  // Process tasks from a specific queue
  async processQueue(priority, maxMessages = 5) {
    const queueName = QUEUE_PRIORITIES[priority]
    if (!queueName) {
      throw new Error(`Invalid priority: ${priority}`)
    }

    console.log(`🔄 Processing ${priority} priority queue...`)

    const { data: messages, error } = await this.supabase
      .schema('pgmq_public')
      .rpc('read', {
        queue_name: queueName,
        sleep_seconds: 30, // 30 second visibility timeout
        n: maxMessages
      })

    if (error) {
      throw new Error(`Failed to read from queue: ${error.message}`)
    }

    if (!messages || messages.length === 0) {
      console.log(`📭 No messages in ${priority} queue`)
      return []
    }

    console.log(`📥 Found ${messages.length} messages in ${priority} queue`)

    const processedTasks = []
    for (const message of messages) {
      try {
        const result = await this.processTask(message)
        processedTasks.push(result)
        
        // Delete the message after successful processing
        await this.supabase
          .schema('pgmq_public')
          .rpc('delete', {
            queue_name: queueName,
            msg_id: message.msg_id
          })
        
        console.log(`✅ Processed and deleted message ${message.msg_id}`)
      } catch (error) {
        console.error(`❌ Failed to process message ${message.msg_id}:`, error.message)
        
        // Handle retry logic
        const task = message.message
        
        // Ensure metadata exists and has required fields
        if (!task.metadata) {
          task.metadata = { retry_count: 0, max_retries: 3 }
        }
        if (typeof task.metadata.retry_count !== 'number') {
          task.metadata.retry_count = 0
        }
        if (typeof task.metadata.max_retries !== 'number') {
          task.metadata.max_retries = 3
        }
        
        if (task.metadata.retry_count < task.metadata.max_retries) {
          task.metadata.retry_count++
          task.metadata.last_error = error.message
          task.metadata.retry_at = new Date().toISOString()
          
          // Re-enqueue with delay
          await this.enqueueTask(task.type, task.payload, task.priority, 60) // 1 minute delay
          console.log(`🔄 Re-enqueued task ${task.id} (retry ${task.metadata.retry_count})`)
        } else {
          console.error(`💀 Task ${task.id} exceeded max retries, moving to dead letter`)
          // In a real implementation, you'd move this to a dead letter queue
        }
      }
    }

    return processedTasks
  }

  // Process individual task based on type
  async processTask(message) {
    const task = message.message
    const startTime = Date.now()

    console.log(`🔧 Processing ${task.type} task: ${task.id}`)

    let success = false
    let result = null

    try {
      switch (task.type) {
        case 'system_alert':
          result = await this.handleSystemAlert(task.payload)
          break
        case 'device_failure':
          result = await this.handleDeviceFailure(task.payload)
          break
        case 'device_discovery':
          result = await this.handleDeviceDiscovery(task.payload)
          break
        case 'sensor_reading':
          result = await this.handleSensorReading(task.payload)
          break
        case 'irrigation_control':
          result = await this.handleIrrigationControl(task.payload)
          break
        case 'lighting_control':
          result = await this.handleLightingControl(task.payload)
          break
        case 'data_backup':
          result = await this.handleDataBackup(task.payload)
          break
        default:
          console.warn(`⚠️  Unknown task type: ${task.type}, treating as generic task`)
          result = await this.handleGenericTask(task.payload)
          break
      }
      
      success = true
    } catch (error) {
      console.error(`Task processing failed: ${error.message}`)
      throw error
    } finally {
      const executionTime = Date.now() - startTime
      
      // Log task execution
      await this.logTaskExecution(
        task.id,
        task.type,
        task.priority,
        success,
        executionTime,
        task.metadata.retry_count
      )
    }

    return { task, result, success }
  }

  // Task handlers for different types
  async handleSystemAlert(payload) {
    console.log(`🚨 System Alert: ${payload.alert}`)
    // In real implementation: send notifications, trigger emergency protocols
    return { status: 'alert_processed', action: 'notification_sent' }
  }

  async handleDeviceFailure(payload) {
    console.log(`⚠️  Device Failure: ${payload.device_id} - ${payload.action}`)
    // In real implementation: call device restart API, update device status
    return { status: 'device_restarted', device_id: payload.device_id }
  }

  async handleDeviceDiscovery(payload) {
    console.log(`🔍 Device Discovery for user: ${payload.user_id}`)
    // In real implementation: scan network, update device registry
    return { status: 'discovery_complete', devices_found: 3 }
  }

  async handleSensorReading(payload) {
    console.log(`📊 Processing sensor reading: ${payload.sensor_id}`)
    // In real implementation: validate data, store in database, trigger alerts
    return { status: 'reading_processed', value: payload.value }
  }

  async handleIrrigationControl(payload) {
    console.log(`💧 Irrigation Control: ${payload.action} for zone ${payload.zone_id}`)
    // In real implementation: control irrigation valves, update schedules
    return { status: 'irrigation_updated', zone_id: payload.zone_id }
  }

  async handleLightingControl(payload) {
    console.log(`💡 Lighting Control: ${payload.action} for zone ${payload.zone_id}`)
    // In real implementation: adjust LED lighting, update schedules
    return { status: 'lighting_updated', zone_id: payload.zone_id }
  }

  async handleDataBackup(payload) {
    console.log(`💾 Data Backup: ${payload.backup_type}`)
    // In real implementation: backup data to cloud storage
    return { status: 'backup_complete', backup_id: `backup_${Date.now()}` }
  }

  async handleGenericTask(payload) {
    console.log(`🔧 Generic Task: Processing unknown task type`)
    // In real implementation: handle unknown tasks gracefully
    return { status: 'generic_task_processed', payload }
  }

  // Log task execution to database
  async logTaskExecution(taskId, taskType, priority, success, executionTime, retryCount) {
    const { data, error } = await this.supabase.rpc('log_task_execution', {
      p_task_id: taskId,
      p_task_type: taskType,
      p_priority: priority,
      p_success: success,
      p_execution_time: executionTime,
      p_retry_count: retryCount
    })

    if (error) {
      console.error('Failed to log task execution:', error)
    } else {
      console.log(`📝 Logged task execution with ID: ${data}`)
    }
  }

  // Trigger Edge Function for background processing
  async triggerBackgroundProcessor() {
    try {
      const { data, error } = await this.supabase.functions.invoke('background-task-processor', {
        body: { action: 'process_all_queues' }
      })

      if (error) {
        console.error('Failed to trigger background processor:', error)
      } else {
        console.log('✅ Background processor triggered:', data)
      }
    } catch (error) {
      console.error('Error triggering background processor:', error)
    }
  }
}

// Example usage and testing
async function demonstrateQueueIntegration() {
  console.log('🌱 Vertical Farm Queue Integration Demo')
  console.log('=====================================\n')

  const queueManager = new VerticalFarmQueueManager(supabase)

  try {
    // 1. Enqueue various types of tasks
    console.log('📤 Enqueuing sample tasks...\n')

    await queueManager.enqueueTask('system_alert', {
      alert: 'Temperature sensor malfunction',
      sensor_id: 'temp_zone_1',
      severity: 'high'
    }, 'critical')

    await queueManager.enqueueTask('irrigation_control', {
      action: 'start_watering',
      zone_id: 'zone_1',
      duration: 300
    }, 'high')

    await queueManager.enqueueTask('sensor_reading', {
      sensor_id: 'humidity_zone_2',
      value: 65.5,
      unit: 'percent'
    }, 'normal')

    await queueManager.enqueueTask('data_backup', {
      backup_type: 'daily_sensor_data',
      date: new Date().toISOString().split('T')[0]
    }, 'low')

    console.log('\n⏱️  Waiting 2 seconds before processing...\n')
    await new Promise(resolve => setTimeout(resolve, 2000))

    // 2. Process queues by priority
    console.log('🔄 Processing queues by priority...\n')

    await queueManager.processQueue('critical', 2)
    await queueManager.processQueue('high', 2)
    await queueManager.processQueue('normal', 2)
    await queueManager.processQueue('low', 2)

    // 3. Trigger background processor
    console.log('\n🤖 Triggering background processor...\n')
    await queueManager.triggerBackgroundProcessor()

    console.log('\n🎉 Queue integration demo completed!')

  } catch (error) {
    console.error('💥 Demo failed:', error)
  }
}

// Run the demonstration
demonstrateQueueIntegration() 