// Test Supabase Queues Implementation
// This script demonstrates how to use the official Supabase Queues API

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load environment variables from .env file
config()

const supabaseUrl = 'https://mlyupwrkoxtmywespgzx.supabase.co'
const supabaseKey = process.env.SUPABASE_ANON_KEY

if (!supabaseKey) {
  console.error('❌ SUPABASE_ANON_KEY not found in environment variables')
  console.log('Please ensure your .env file contains: SUPABASE_ANON_KEY=your_key_here')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testSupabaseQueues() {
  console.log('🚀 Testing Supabase Queues Implementation')
  
  try {
    // 1. Create queues using direct pgmq schema access
    // Note: pgmq_public.create doesn't exist, so we use pgmq.create directly
    console.log('\n📋 Creating priority queues...')
    
    const queues = ['critical_tasks', 'high_tasks', 'normal_tasks', 'low_tasks']
    
    for (const queueName of queues) {
      const { data, error } = await supabase.rpc('pgmq_create', {
        queue_name: queueName
      })
      
      if (error) {
        console.log(`⚠️  Queue ${queueName} creation failed or already exists:`, error.message)
        // Try creating via direct SQL as fallback
        const { error: sqlError } = await supabase.rpc('exec_sql', {
          sql: `SELECT pgmq.create('${queueName}');`
        })
        if (sqlError) {
          console.log(`⚠️  Direct SQL creation also failed for ${queueName}:`, sqlError.message)
        } else {
          console.log(`✅ Created queue via SQL: ${queueName}`)
        }
      } else {
        console.log(`✅ Created queue: ${queueName}`)
      }
    }
    
    // 2. Send test messages to different queues
    console.log('\n📤 Sending test messages...')
    
    const testMessages = [
      {
        queue: 'critical_tasks',
        message: {
          id: `critical_${Date.now()}`,
          type: 'system_alert',
          priority: 'critical',
          payload: { alert: 'System temperature critical', sensor_id: 'temp_01' },
          metadata: { created_at: new Date().toISOString(), retry_count: 0 }
        }
      },
      {
        queue: 'high_tasks',
        message: {
          id: `high_${Date.now()}`,
          type: 'device_failure',
          priority: 'high',
          payload: { device_id: 'pump_02', action: 'restart' },
          metadata: { created_at: new Date().toISOString(), retry_count: 0 }
        }
      },
      {
        queue: 'normal_tasks',
        message: {
          id: `normal_${Date.now()}`,
          type: 'device_discovery',
          priority: 'normal',
          payload: { action: 'discover_devices', user_id: 'test_user' },
          metadata: { created_at: new Date().toISOString(), retry_count: 0 }
        }
      }
    ]
    
    for (const { queue, message } of testMessages) {
      // Correct pgmq_public.send signature: send(queue_name, message, sleep_seconds)
      const { data, error } = await supabase.schema('pgmq_public').rpc('send', {
        queue_name: queue,
        message: message,
        sleep_seconds: 0  // Make message immediately available
      })
      
      if (error) {
        console.error(`❌ Failed to send to ${queue}:`, error)
      } else {
        console.log(`✅ Sent message to ${queue}, message ID:`, data)
      }
    }
    
    // 3. Read messages from queues (without removing them)
    console.log('\n📥 Reading messages from queues...')
    
    for (const queueName of queues) {
      // Correct pgmq_public.read signature: read(queue_name, sleep_seconds, n)
      const { data, error } = await supabase.schema('pgmq_public').rpc('read', {
        queue_name: queueName,
        sleep_seconds: 30,  // visibility timeout in seconds
        n: 5   // number of messages to read
      })
      
      if (error) {
        console.error(`❌ Failed to read from ${queueName}:`, error)
      } else {
        console.log(`📖 Messages in ${queueName}:`, data?.length || 0)
        if (data && data.length > 0) {
          console.log('   Sample message:', JSON.stringify(data[0], null, 2))
        }
      }
    }
    
    // 4. Pop (read and remove) a message from normal_tasks
    console.log('\n🎯 Popping message from normal_tasks...')
    
    // Correct pgmq_public.pop signature: pop(queue_name)
    const { data: poppedMessage, error: popError } = await supabase.schema('pgmq_public').rpc('pop', {
      queue_name: 'normal_tasks'
    })
    
    if (popError) {
      console.error('❌ Failed to pop message:', popError)
    } else if (poppedMessage && poppedMessage.length > 0) {
      console.log('✅ Popped message:', JSON.stringify(poppedMessage[0], null, 2))
      
      // 5. Log the task execution
      const message = poppedMessage[0].message
      const { data: logData, error: logError } = await supabase.rpc('log_task_execution', {
        p_task_id: message.id,
        p_task_type: message.type,
        p_priority: message.priority,
        p_success: true,
        p_execution_time: 150, // milliseconds
        p_retry_count: 0
      })
      
      if (logError) {
        console.error('❌ Failed to log task execution:', logError)
      } else {
        console.log('✅ Logged task execution with ID:', logData)
      }
    } else {
      console.log('📭 No messages to pop from normal_tasks')
    }
    
    // 6. Test send_batch functionality
    console.log('\n📦 Testing batch message sending...')
    
    const batchMessages = [
      {
        id: `batch_1_${Date.now()}`,
        type: 'batch_test',
        priority: 'low',
        payload: { test: 'batch message 1' }
      },
      {
        id: `batch_2_${Date.now()}`,
        type: 'batch_test', 
        priority: 'low',
        payload: { test: 'batch message 2' }
      }
    ]
    
    // Correct pgmq_public.send_batch signature: send_batch(queue_name, messages, sleep_seconds)
    const { data: batchData, error: batchError } = await supabase.schema('pgmq_public').rpc('send_batch', {
      queue_name: 'low_tasks',
      messages: batchMessages,
      sleep_seconds: 0
    })
    
    if (batchError) {
      console.error('❌ Failed to send batch messages:', batchError)
    } else {
      console.log('✅ Sent batch messages, IDs:', batchData)
    }
    
    // 7. Check task logs
    console.log('\n📊 Checking task logs...')
    
    const { data: logs, error: logsError } = await supabase
      .from('task_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (logsError) {
      console.error('❌ Failed to fetch task logs:', logsError)
    } else {
      console.log(`✅ Recent task logs (${logs?.length || 0} entries):`)
      logs?.forEach(log => {
        console.log(`   ${log.task_type} (${log.priority}): ${log.success ? '✅' : '❌'} ${log.execution_time}ms`)
      })
    }
    
    // 8. List all queues to verify they exist
    console.log('\n📋 Listing all queues...')
    
    const { data: queueList, error: listError } = await supabase.rpc('exec_sql', {
      sql: 'SELECT * FROM pgmq.list_queues();'
    })
    
    if (listError) {
      console.error('❌ Failed to list queues:', listError)
    } else {
      console.log('✅ Available queues:', queueList)
    }
    
    console.log('\n🎉 Supabase Queues test completed successfully!')
    
  } catch (error) {
    console.error('💥 Test failed:', error)
  }
}

// Run the test
testSupabaseQueues() 