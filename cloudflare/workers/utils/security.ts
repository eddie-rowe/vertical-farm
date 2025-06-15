/**
 * Security utilities for Cloudflare Workers
 * Provides rate limiting, security headers, and input validation
 */

import type { RateLimitConfig, RateLimitResult, SecurityHeaders } from '../types/worker';

/**
 * Rate limiting using KV storage
 */
export class RateLimiter {
  private kv: KVNamespace;
  private config: RateLimitConfig;

  constructor(kv: KVNamespace, config: RateLimitConfig) {
    this.kv = kv;
    this.config = config;
  }

  async checkLimit(identifier: string): Promise<RateLimitResult> {
    const key = `rate_limit:${this.config.key}:${identifier}`;
    const now = Math.floor(Date.now() / 1000);
    const windowStart = now - this.config.window;

    try {
      // Get current request count
      const current = await this.kv.get(key, { type: 'json' });
      const requests = current?.requests || [];

      // Filter out old requests
      const validRequests = requests.filter((timestamp: number) => timestamp > windowStart);

      // Check if limit exceeded
      if (validRequests.length >= this.config.requests) {
        return {
          allowed: false,
          remaining: 0,
          resetTime: validRequests[0] + this.config.window,
        };
      }

      // Add current request
      validRequests.push(now);

      // Store updated requests
      await this.kv.put(
        key,
        JSON.stringify({ requests: validRequests }),
        { expirationTtl: this.config.window + 60 }
      );

      return {
        allowed: true,
        remaining: this.config.requests - validRequests.length,
        resetTime: now + this.config.window,
      };
    } catch (error) {
      console.error('Rate limiting error:', error);
      // Fail open - allow request if rate limiting fails
      return {
        allowed: true,
        remaining: this.config.requests,
        resetTime: now + this.config.window,
      };
    }
  }
}

/**
 * Generate security headers for responses
 */
export function getSecurityHeaders(customHeaders?: Partial<SecurityHeaders>): SecurityHeaders {
  const defaultHeaders: SecurityHeaders = {
    'Content-Security-Policy':
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none';",
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy':
      'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  };

  return { ...defaultHeaders, ...customHeaders };
}

/**
 * Add security headers to a response
 */
export function addSecurityHeaders(
  response: Response,
  customHeaders?: Partial<SecurityHeaders>
): Response {
  const headers = new Headers(response.headers);
  const securityHeaders = getSecurityHeaders(customHeaders);

  Object.entries(securityHeaders).forEach(([key, value]) => {
    if (value) {
      headers.set(key, value);
    }
  });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * Validate and sanitize input data
 */
export class InputValidator {
  /**
   * Validate sensor data input
   */
  static validateSensorData(data: any): boolean {
    if (!data || typeof data !== 'object') return false;
    
    // Required fields
    if (!data.device_id || !data.sensor_type || data.value === undefined) {
      return false;
    }

    // Type validation
    if (typeof data.device_id !== 'string' || typeof data.sensor_type !== 'string') {
      return false;
    }

    if (typeof data.value !== 'number' || !isFinite(data.value)) {
      return false;
    }

    // Sensor type validation
    const validSensorTypes = ['temperature', 'humidity', 'ph', 'light', 'water_level', 'ec'];
    if (!validSensorTypes.includes(data.sensor_type)) {
      return false;
    }

    return true;
  }

  /**
   * Sanitize string input to prevent XSS
   */
  static sanitizeString(input: string): string {
    return input
      .replace(/[<>\"']/g, '') // Remove potential HTML/script characters
      .trim()
      .slice(0, 1000); // Limit length
  }

  /**
   * Validate device ID format
   */
  static validateDeviceId(deviceId: string): boolean {
    // Allow alphanumeric, hyphens, and underscores, 3-50 characters
    return /^[a-zA-Z0-9_-]{3,50}$/.test(deviceId);
  }

  /**
   * Validate sensor value ranges
   */
  static validateSensorValue(sensorType: string, value: number): boolean {
    const ranges: Record<string, { min: number; max: number }> = {
      temperature: { min: -50, max: 100 },
      humidity: { min: 0, max: 100 },
      ph: { min: 0, max: 14 },
      light: { min: 0, max: 100000 },
      water_level: { min: 0, max: 100 },
      ec: { min: 0, max: 5000 },
    };

    const range = ranges[sensorType];
    if (!range) return false;

    return value >= range.min && value <= range.max;
  }
}

/**
 * Generate a secure hash for caching keys
 */
export async function generateSecureHash(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Create a rate limit response
 */
export function createRateLimitResponse(resetTime: number): Response {
  return new Response(
    JSON.stringify({
      error: 'Rate limit exceeded',
      message: 'Too many requests. Please try again later.',
      resetTime,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': Math.ceil(resetTime - Date.now() / 1000).toString(),
        ...getSecurityHeaders(),
      },
    }
  );
}

/**
 * Create an error response with security headers
 */
export function createErrorResponse(
  message: string,
  status: number = 400,
  details?: any
): Response {
  return new Response(
    JSON.stringify({
      error: true,
      message,
      details,
      timestamp: new Date().toISOString(),
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...getSecurityHeaders(),
      },
    }
  );
} 