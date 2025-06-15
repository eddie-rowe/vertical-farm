/**
 * Sensor Data Processor Worker
 * Processes IoT sensor data at the edge before sending to Supabase
 * 
 * Features:
 * - TypeScript with strict typing
 * - Rate limiting for sensor data ingestion
 * - Security headers and input validation
 * - Intelligent caching and alert detection
 * - Analytics and monitoring
 */

import type { BaseEnv, SensorReading, AlertThreshold, AlertData } from '../types/worker';
import { RateLimiter, addSecurityHeaders, InputValidator, createErrorResponse, createRateLimitResponse } from '../utils/security';

interface SensorProcessorEnv extends BaseEnv {
  DEVICE_CACHE: KVNamespace;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  ENABLE_RATE_LIMITING?: string;
  SENSOR_RATE_LIMIT?: string; // requests per minute
  ANALYTICS?: AnalyticsEngineDataset;
}

interface ProcessedSensorData extends SensorReading {
  processed_at: string;
  edge_processed: true;
  device_assignment_id: string;
  reading_type: string;
  unit: string;
}

const WORKER_VERSION = '2.0.0';
const SENSOR_UNITS: Record<string, string> = {
  temperature: '°C',
  humidity: '%',
  ph: 'pH',
  light: 'lux',
  water_level: '%',
  ec: 'µS/cm',
};

export default {
  async fetch(request: Request, env: SensorProcessorEnv): Promise<Response> {
    const startTime = Date.now();
    
    try {
      // Only handle POST requests to sensor endpoints
      if (request.method !== 'POST' || !request.url.includes('/api/sensors/')) {
        return fetch(request);
      }

      // Rate limiting
      if (env.ENABLE_RATE_LIMITING === 'true') {
        const rateLimitResult = await checkRateLimit(request, env);
        if (!rateLimitResult.allowed) {
          await recordAnalytics('rate_limited', env, { ip: getClientIP(request) });
          return createRateLimitResponse(rateLimitResult.resetTime);
        }
      }

      // Parse and validate sensor data
      const sensorData = await parseSensorData(request);
      if (!sensorData) {
        await recordAnalytics('invalid_data', env);
        return createErrorResponse('Invalid sensor data format', 400);
      }

      // Process and validate sensor data
      const processedData = await processSensorData(sensorData, env);
      if (!processedData) {
        await recordAnalytics('validation_failed', env, { sensor_type: sensorData.sensor_type });
        return createErrorResponse('Sensor data validation failed', 400);
      }

      // Cache sensor data for dashboard performance
      await cacheSensorData(processedData, env);

      // Check for alert conditions
      await checkAndCreateAlerts(processedData, env);

      // Determine if we should forward to Supabase
      const shouldForward = await shouldForwardToSupabase(processedData, env);
      
      let response: Response;
      
      if (shouldForward) {
        const supabaseResponse = await forwardToSupabase(processedData, env);
        const responseData = await supabaseResponse.json();
        
        response = new Response(JSON.stringify({
          ...responseData,
          edge_processed: true,
          cached: true,
          alerts_checked: true,
          worker_version: WORKER_VERSION,
        }), {
          status: supabaseResponse.status,
          headers: { 'Content-Type': 'application/json' },
        });
        
        await recordAnalytics('forwarded_to_supabase', env, { device_id: processedData.device_id });
      } else {
        response = new Response(JSON.stringify({ 
          status: 'cached',
          message: 'Data processed and cached at edge',
          edge_processed: true,
          cached: true,
          alerts_checked: true,
          worker_version: WORKER_VERSION,
        }), {
          headers: { 'Content-Type': 'application/json' },
        });
        
        await recordAnalytics('cached_only', env, { device_id: processedData.device_id });
      }

      // Add security headers and performance metrics
      const responseTime = Date.now() - startTime;
      const secureResponse = addSecurityHeaders(response);
      secureResponse.headers.set('X-Response-Time', `${responseTime}ms`);
      secureResponse.headers.set('X-Worker-Version', WORKER_VERSION);
      
      await recordAnalytics('request_processed', env, { 
        response_time: responseTime,
        device_id: processedData.device_id,
        sensor_type: processedData.sensor_type,
      });

      return secureResponse;

    } catch (error) {
      console.error('Sensor processing error:', error);
      await recordAnalytics('error', env, { error: (error as Error).message });
      
      // Fallback: forward original request to Supabase
      return fetch(request);
    }
  },
};

/**
 * Parse sensor data from request with error handling
 */
async function parseSensorData(request: Request): Promise<SensorReading | null> {
  try {
    const data = await request.json();
    return InputValidator.validateSensorData(data) ? data : null;
  } catch {
    return null;
  }
}

/**
 * Process and validate sensor data with enhanced validation
 */
async function processSensorData(
  data: SensorReading, 
  env: SensorProcessorEnv
): Promise<ProcessedSensorData | null> {
  // Enhanced validation
  if (!InputValidator.validateDeviceId(data.device_id)) {
    console.warn(`Invalid device ID format: ${data.device_id}`);
    return null;
  }

  if (!InputValidator.validateSensorValue(data.sensor_type, data.value)) {
    console.warn(`Invalid ${data.sensor_type} value: ${data.value}`);
    return null;
  }

  // Create processed data with proper typing
  const processedData: ProcessedSensorData = {
    ...data,
    processed_at: new Date().toISOString(),
    edge_processed: true,
    device_assignment_id: data.device_id,
    reading_type: data.sensor_type,
    unit: SENSOR_UNITS[data.sensor_type] || '',
    timestamp: data.timestamp || new Date().toISOString(),
  };

  return processedData;
}

/**
 * Enhanced caching with better error handling and analytics
 */
async function cacheSensorData(data: ProcessedSensorData, env: SensorProcessorEnv): Promise<void> {
  try {
    const cachePromises = [
      // Latest reading for quick dashboard access
      env.DEVICE_CACHE.put(
        `sensor:${data.device_id}:latest`,
        JSON.stringify(data),
        { expirationTtl: 300 }
      ),
      
      // By sensor type for aggregation queries
      env.DEVICE_CACHE.put(
        `sensor:${data.device_id}:${data.sensor_type}:latest`,
        JSON.stringify(data),
        { expirationTtl: 300 }
      ),
    ];

    // Update history
    cachePromises.push(updateSensorHistory(data, env));

    await Promise.all(cachePromises);
  } catch (error) {
    console.error('Error caching sensor data:', error);
    await recordAnalytics('cache_error', env, { error: (error as Error).message });
  }
}

/**
 * Update sensor history with proper error handling
 */
async function updateSensorHistory(data: ProcessedSensorData, env: SensorProcessorEnv): Promise<void> {
  const historyKey = `sensor:${data.device_id}:${data.sensor_type}:history`;
  
  try {
    const existingHistory = await env.DEVICE_CACHE.get(historyKey, { type: 'json' });
    let history: ProcessedSensorData[] = existingHistory || [];
    
    // Add new reading and keep only last 10
    history.unshift(data);
    history = history.slice(0, 10);
    
    await env.DEVICE_CACHE.put(historyKey, JSON.stringify(history), { 
      expirationTtl: 1800 
    });
  } catch (error) {
    console.error('Error updating sensor history:', error);
  }
}

/**
 * Enhanced alert checking with better error handling
 */
async function checkAndCreateAlerts(data: ProcessedSensorData, env: SensorProcessorEnv): Promise<void> {
  try {
    const thresholds = await getAlertThresholds(data.device_id, data.sensor_type, env);
    
    if (!thresholds?.enabled) {
      return;
    }

    const alerts = generateAlerts(data, thresholds);
    
    for (const alert of alerts) {
      await createAlert(data, alert, env);
    }
    
    if (alerts.length > 0) {
      await recordAnalytics('alerts_generated', env, { 
        device_id: data.device_id,
        alert_count: alerts.length,
        severity: alerts[0]?.severity || 'unknown',
      });
    }
  } catch (error) {
    console.error('Error checking alerts:', error);
    await recordAnalytics('alert_check_error', env, { error: (error as Error).message });
  }
}

/**
 * Generate alerts based on thresholds
 */
function generateAlerts(data: ProcessedSensorData, thresholds: AlertThreshold): AlertData[] {
  const alerts: AlertData[] = [];
  const value = data.value;

  // Check critical thresholds first
  if (thresholds.critical_min !== null && thresholds.critical_min !== undefined && value < thresholds.critical_min) {
    alerts.push({
      alert_type: `${data.sensor_type}_critical_low`,
      severity: 'critical',
      threshold_value: thresholds.critical_min,
      message: `${data.sensor_type} critically low: ${value} < ${thresholds.critical_min}`,
    });
  } else if (thresholds.critical_max !== null && thresholds.critical_max !== undefined && value > thresholds.critical_max) {
    alerts.push({
      alert_type: `${data.sensor_type}_critical_high`,
      severity: 'critical',
      threshold_value: thresholds.critical_max,
      message: `${data.sensor_type} critically high: ${value} > ${thresholds.critical_max}`,
    });
  }
  // Check warning thresholds (only if not already critical)
  else if (thresholds.warning_min !== null && thresholds.warning_min !== undefined && value < thresholds.warning_min) {
    alerts.push({
      alert_type: `${data.sensor_type}_warning_low`,
      severity: 'medium',
      threshold_value: thresholds.warning_min,
      message: `${data.sensor_type} below warning threshold: ${value} < ${thresholds.warning_min}`,
    });
  } else if (thresholds.warning_max !== null && thresholds.warning_max !== undefined && value > thresholds.warning_max) {
    alerts.push({
      alert_type: `${data.sensor_type}_warning_high`,
      severity: 'medium',
      threshold_value: thresholds.warning_max,
      message: `${data.sensor_type} above warning threshold: ${value} > ${thresholds.warning_max}`,
    });
  }

  return alerts;
}

/**
 * Get alert thresholds with caching
 */
async function getAlertThresholds(
  deviceId: string, 
  sensorType: string, 
  env: SensorProcessorEnv
): Promise<AlertThreshold | null> {
  const cacheKey = `thresholds:${deviceId}:${sensorType}`;
  
  try {
    // Try cache first
    const cached = await env.DEVICE_CACHE.get(cacheKey, { type: 'json' });
    if (cached) {
      return cached;
    }

    // Fetch from Supabase
    const response = await fetch(
      `${env.SUPABASE_URL}/rest/v1/alert_thresholds?device_assignment_id=eq.${deviceId}&sensor_type=eq.${sensorType}`,
      {
        headers: {
          'Authorization': `Bearer ${env.SUPABASE_ANON_KEY}`,
          'apikey': env.SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    const thresholds = await response.json();
    const threshold = thresholds[0] || null;

    // Cache for 5 minutes
    if (threshold) {
      await env.DEVICE_CACHE.put(cacheKey, JSON.stringify(threshold), { 
        expirationTtl: 300 
      });
    }

    return threshold;
  } catch (error) {
    console.error('Error fetching alert thresholds:', error);
    return null;
  }
}

/**
 * Create alert with improved error handling
 */
async function createAlert(
  sensorData: ProcessedSensorData, 
  alertData: AlertData, 
  env: SensorProcessorEnv
): Promise<void> {
  try {
    const alertPayload = {
      device_assignment_id: sensorData.device_assignment_id,
      alert_type: alertData.alert_type,
      severity: alertData.severity,
      message: alertData.message,
      sensor_value: sensorData.value,
      threshold_value: alertData.threshold_value,
      sensor_type: sensorData.sensor_type,
      triggered_at: sensorData.timestamp,
      resolved: false,
    };

    const response = await fetch(`${env.SUPABASE_URL}/rest/v1/sensor_alerts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.SUPABASE_ANON_KEY}`,
        'apikey': env.SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify(alertPayload),
    });

    if (!response.ok) {
      throw new Error(`Failed to create alert: ${response.status}`);
    }
  } catch (error) {
    console.error('Error creating alert:', error);
  }
}

/**
 * Enhanced forwarding logic with better error handling
 */
async function shouldForwardToSupabase(data: ProcessedSensorData, env: SensorProcessorEnv): Promise<boolean> {
  try {
    // Always forward critical values
    if (!InputValidator.validateSensorValue(data.sensor_type, data.value)) {
      return true;
    }

    // Check time-based forwarding
    const lastForwardKey = `last_forward:${data.device_id}:${data.sensor_type}`;
    const lastForward = await env.DEVICE_CACHE.get(lastForwardKey);
    
    if (!lastForward) {
      // First reading, forward it
      await env.DEVICE_CACHE.put(lastForwardKey, Date.now().toString(), { 
        expirationTtl: 300 
      });
      return true;
    }

    const timeSinceLastForward = Date.now() - parseInt(lastForward);
    const forwardInterval = 60000; // 1 minute

    if (timeSinceLastForward > forwardInterval) {
      await env.DEVICE_CACHE.put(lastForwardKey, Date.now().toString(), { 
        expirationTtl: 300 
      });
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error checking forward conditions:', error);
    return true; // Fail safe - forward on error
  }
}

/**
 * Forward to Supabase with enhanced error handling
 */
async function forwardToSupabase(data: ProcessedSensorData, env: SensorProcessorEnv): Promise<Response> {
  try {
    const response = await fetch(`${env.SUPABASE_URL}/rest/v1/sensor_readings`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.SUPABASE_ANON_KEY}`,
        'apikey': env.SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify(data),
    });

    return response;
  } catch (error) {
    console.error('Error forwarding to Supabase:', error);
    throw error;
  }
}

/**
 * Rate limiting implementation
 */
async function checkRateLimit(request: Request, env: SensorProcessorEnv): Promise<{ allowed: boolean; resetTime: number }> {
  const rateLimiter = new RateLimiter(env.DEVICE_CACHE, {
    requests: parseInt(env.SENSOR_RATE_LIMIT || '60'),
    window: 60, // 1 minute
    key: 'sensor_ingestion',
  });

  const clientIP = getClientIP(request);
  return await rateLimiter.checkLimit(clientIP);
}

/**
 * Get client IP address
 */
function getClientIP(request: Request): string {
  return request.headers.get('CF-Connecting-IP') || 
         request.headers.get('X-Forwarded-For') || 
         'unknown';
}

/**
 * Record analytics events
 */
async function recordAnalytics(
  event: string, 
  env: SensorProcessorEnv, 
  data?: Record<string, any>
): Promise<void> {
  if (!env.ANALYTICS) return;

  try {
    env.ANALYTICS.writeDataPoint({
      blobs: [event, WORKER_VERSION],
      doubles: [Date.now()],
      indexes: [event],
      ...data,
    });
  } catch (error) {
    console.error('Analytics error:', error);
  }
} 