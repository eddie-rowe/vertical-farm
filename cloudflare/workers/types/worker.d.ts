/**
 * Shared TypeScript definitions for Cloudflare Workers
 */

// Cloudflare Workers Runtime Types
declare global {
  interface KVNamespace {
    get(key: string, options?: { type?: 'text' | 'json' | 'arrayBuffer' | 'stream' }): Promise<any>;
    put(key: string, value: string | ArrayBuffer, options?: { expirationTtl?: number; metadata?: any }): Promise<void>;
    delete(key: string): Promise<void>;
    list(options?: { prefix?: string; limit?: number; cursor?: string }): Promise<{
      keys: Array<{ name: string; metadata?: any }>;
      list_complete: boolean;
      cursor?: string;
    }>;
  }

  interface AnalyticsEngineDataset {
    writeDataPoint(event: {
      blobs?: string[];
      doubles?: number[];
      indexes?: string[];
    }): void;
  }

  interface DurableObjectNamespace {
    get(id: DurableObjectId): DurableObjectStub;
    idFromName(name: string): DurableObjectId;
    idFromString(id: string): DurableObjectId;
    newUniqueId(): DurableObjectId;
  }

  interface DurableObjectId {
    toString(): string;
    equals(other: DurableObjectId): boolean;
  }

  interface DurableObjectStub {
    fetch(request: Request): Promise<Response>;
  }
}

// Common Environment Interface
export interface BaseEnv {
  // KV Namespaces
  CACHE_KV?: KVNamespace;
  DEVICE_CACHE?: KVNamespace;
  ASSETS_KV?: KVNamespace;
  
  // Analytics
  ANALYTICS?: AnalyticsEngineDataset;
  
  // Configuration
  ORIGIN_URL: string;
  DOMAIN: string;
  
  // Secrets
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  
  // Feature Flags
  ENABLE_ANALYTICS?: string;
  ENABLE_RATE_LIMITING?: string;
  ENABLE_SECURITY_HEADERS?: string;
}

// Sensor Data Types
export interface SensorReading {
  device_id: string;
  sensor_type: 'temperature' | 'humidity' | 'ph' | 'light' | 'water_level' | 'ec';
  value: number;
  unit?: string;
  timestamp?: string;
  processed_at?: string;
  edge_processed?: boolean;
  device_assignment_id?: string;
  reading_type?: string;
}

export interface AlertThreshold {
  enabled: boolean;
  critical_min?: number;
  critical_max?: number;
  warning_min?: number;
  warning_max?: number;
}

export interface AlertData {
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  threshold_value: number;
  message: string;
}

// Cache Configuration Types
export interface CacheConfig {
  ttl: number;
  cacheKey: string;
  shouldCache: boolean;
  varyHeaders?: string[];
  isImmutable?: boolean;
  contentType?: string;
}

// Health Status Types
export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  timestamp: number;
  services?: Record<string, any>;
  response_time_ms?: number;
}

// Rate Limiting Types
export interface RateLimitConfig {
  requests: number;
  window: number; // seconds
  key: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
}

// Security Headers Configuration
export interface SecurityHeaders {
  'Content-Security-Policy'?: string;
  'Strict-Transport-Security'?: string;
  'X-Frame-Options'?: string;
  'X-Content-Type-Options'?: string;
  'Referrer-Policy'?: string;
  'Permissions-Policy'?: string;
}

// Worker Response Metadata
export interface WorkerMetadata {
  worker: string;
  version: string;
  cache_status?: 'HIT' | 'MISS' | 'BYPASS';
  edge_processed?: boolean;
  response_time_ms?: number;
  rate_limited?: boolean;
} 