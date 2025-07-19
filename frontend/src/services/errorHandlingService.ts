/**
 * Enhanced Error Handling Service for Frontend
 *
 * Provides comprehensive error handling, retry mechanisms, and recovery
 * procedures for the Home Assistant integration with user-friendly feedback.
 */

import { success, error as toastError } from "@/hooks/use-toast";

export enum ErrorType {
  CONNECTION_ERROR = "connection_error",
  AUTHENTICATION_ERROR = "authentication_error",
  RATE_LIMIT_ERROR = "rate_limit_error",
  VALIDATION_ERROR = "validation_error",
  TIMEOUT_ERROR = "timeout_error",
  SERVICE_UNAVAILABLE = "service_unavailable",
  UNKNOWN_ERROR = "unknown_error",
}

export enum CircuitState {
  CLOSED = "closed", // Normal operation
  OPEN = "open", // Failing, blocking requests
  HALF_OPEN = "half_open", // Testing if service recovered
}

export interface ErrorMetrics {
  totalErrors: number;
  errorRate: number;
  lastErrorTime?: Date;
  consecutiveFailures: number;
  errorTypes: Record<ErrorType, number>;
  recoveryAttempts: number;
  lastRecoveryTime?: Date;
}

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  exponentialBase: number;
  jitter: boolean;
  retryableErrors: ErrorType[];
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  recoveryTimeout: number;
  successThreshold: number;
  monitoringWindow: number;
}

export class EnhancedError extends Error {
  public readonly errorType: ErrorType;
  public readonly retryable: boolean;
  public readonly context: Record<string, any>;
  public readonly originalError?: Error;
  public readonly timestamp: Date;

  constructor(
    message: string,
    errorType: ErrorType = ErrorType.UNKNOWN_ERROR,
    retryable: boolean = false,
    context: Record<string, any> = {},
    originalError?: Error,
  ) {
    super(message);
    this.name = "EnhancedError";
    this.errorType = errorType;
    this.retryable = retryable;
    this.context = context;
    this.originalError = originalError;
    this.timestamp = new Date();
  }
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private successCount: number = 0;
  private lastFailureTime?: Date;
  private nextAttemptTime?: Date;

  constructor(
    private name: string,
    private config: CircuitBreakerConfig,
  ) {}

  canExecute(): boolean {
    const now = new Date();

    if (this.state === CircuitState.CLOSED) {
      return true;
    } else if (this.state === CircuitState.OPEN) {
      if (this.nextAttemptTime && now >= this.nextAttemptTime) {
        this.state = CircuitState.HALF_OPEN;
        this.successCount = 0;
        console.log(`Circuit breaker ${this.name} transitioning to HALF_OPEN`);
        return true;
      }
      return false;
    } else if (this.state === CircuitState.HALF_OPEN) {
      return true;
    }

    return false;
  }

  recordSuccess(): void {
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.config.successThreshold) {
        this.state = CircuitState.CLOSED;
        this.failureCount = 0;
        console.log(`Circuit breaker ${this.name} recovered to CLOSED`);
        success(`${this.name} service recovered`);
      }
    } else if (this.state === CircuitState.CLOSED) {
      this.failureCount = 0;
    }
  }

  recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = new Date();

    if (this.state === CircuitState.CLOSED) {
      if (this.failureCount >= this.config.failureThreshold) {
        this.state = CircuitState.OPEN;
        this.nextAttemptTime = new Date(
          Date.now() + this.config.recoveryTimeout * 1000,
        );
        console.warn(
          `Circuit breaker ${this.name} opened due to ${this.failureCount} failures`,
        );
        toastError(`${this.name} service temporarily unavailable`);
      }
    } else if (this.state === CircuitState.HALF_OPEN) {
      this.state = CircuitState.OPEN;
      this.nextAttemptTime = new Date(
        Date.now() + this.config.recoveryTimeout * 1000,
      );
      console.warn(`Circuit breaker ${this.name} reopened after failed test`);
    }
  }

  getState(): CircuitState {
    return this.state;
  }

  getMetrics() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
      nextAttemptTime: this.nextAttemptTime,
    };
  }
}

export class ErrorHandler {
  private metrics: Map<string, ErrorMetrics> = new Map();
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private retryConfigs: Map<string, RetryConfig> = new Map();
  private errorCallbacks: Array<(error: EnhancedError) => void> = [];

  registerService(
    serviceName: string,
    retryConfig?: RetryConfig,
    circuitConfig?: CircuitBreakerConfig,
  ): void {
    this.metrics.set(serviceName, {
      totalErrors: 0,
      errorRate: 0,
      consecutiveFailures: 0,
      errorTypes: {} as Record<ErrorType, number>,
      recoveryAttempts: 0,
    });

    const defaultRetryConfig: RetryConfig = {
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 30000,
      exponentialBase: 2,
      jitter: true,
      retryableErrors: [
        ErrorType.CONNECTION_ERROR,
        ErrorType.TIMEOUT_ERROR,
        ErrorType.SERVICE_UNAVAILABLE,
        ErrorType.RATE_LIMIT_ERROR,
      ],
    };

    const defaultCircuitConfig: CircuitBreakerConfig = {
      failureThreshold: 5,
      recoveryTimeout: 60,
      successThreshold: 3,
      monitoringWindow: 300,
    };

    this.retryConfigs.set(serviceName, retryConfig || defaultRetryConfig);
    this.circuitBreakers.set(
      serviceName,
      new CircuitBreaker(serviceName, circuitConfig || defaultCircuitConfig),
    );
  }

  addErrorCallback(callback: (error: EnhancedError) => void): void {
    this.errorCallbacks.push(callback);
  }

  classifyError(error: Error | Response): ErrorType {
    if (error instanceof Response) {
      if (error.status === 401 || error.status === 403) {
        return ErrorType.AUTHENTICATION_ERROR;
      } else if (error.status === 429) {
        return ErrorType.RATE_LIMIT_ERROR;
      } else if (error.status >= 500) {
        return ErrorType.SERVICE_UNAVAILABLE;
      } else if (error.status >= 400) {
        return ErrorType.VALIDATION_ERROR;
      }
    }

    if (error instanceof TypeError && error.message.includes("fetch")) {
      return ErrorType.CONNECTION_ERROR;
    }

    if (
      error instanceof Error &&
      (error.name === "AbortError" || error.message.includes("timeout"))
    ) {
      return ErrorType.TIMEOUT_ERROR;
    }

    return ErrorType.UNKNOWN_ERROR;
  }

  createEnhancedError(
    error: Error | Response | string,
    context: Record<string, any> = {},
    serviceName?: string,
  ): EnhancedError {
    let message: string;
    let originalError: Error | undefined;

    if (error instanceof Response) {
      message = `HTTP ${error.status}: ${error.statusText}`;
    } else if (error instanceof Error) {
      message = error.message;
      originalError = error;
    } else {
      message = String(error);
    }

    const errorType = this.classifyError(
      error instanceof Error ? error : new Error(message),
    );
    const retryConfig = this.retryConfigs.get(serviceName || "default");
    const retryable = retryConfig
      ? retryConfig.retryableErrors.includes(errorType)
      : false;

    return new EnhancedError(
      message,
      errorType,
      retryable,
      context,
      originalError,
    );
  }

  recordError(serviceName: string, error: EnhancedError): void {
    if (!this.metrics.has(serviceName)) {
      this.registerService(serviceName);
    }

    const metrics = this.metrics.get(serviceName)!;
    metrics.totalErrors++;
    metrics.lastErrorTime = error.timestamp;
    metrics.consecutiveFailures++;

    if (!metrics.errorTypes[error.errorType]) {
      metrics.errorTypes[error.errorType] = 0;
    }
    metrics.errorTypes[error.errorType]++;

    // Update circuit breaker
    const circuitBreaker = this.circuitBreakers.get(serviceName);
    if (circuitBreaker) {
      circuitBreaker.recordFailure();
    }

    // Show user-friendly error message
    this.showUserError(error, serviceName);

    // Notify callbacks
    this.errorCallbacks.forEach((callback) => {
      try {
        callback(error);
      } catch (e) {
        console.error("Error in error callback:", e);
      }
    });
  }

  recordSuccess(serviceName: string): void {
    const metrics = this.metrics.get(serviceName);
    if (metrics) {
      metrics.consecutiveFailures = 0;
    }

    const circuitBreaker = this.circuitBreakers.get(serviceName);
    if (circuitBreaker) {
      circuitBreaker.recordSuccess();
    }
  }

  canExecute(serviceName: string): boolean {
    const circuitBreaker = this.circuitBreakers.get(serviceName);
    return circuitBreaker ? circuitBreaker.canExecute() : true;
  }

  calculateRetryDelay(serviceName: string, attempt: number): number {
    const config = this.retryConfigs.get(serviceName);
    if (!config) return 1000;

    let delay = Math.min(
      config.baseDelay * Math.pow(config.exponentialBase, attempt - 1),
      config.maxDelay,
    );

    if (config.jitter) {
      delay *= 0.5 + Math.random() * 0.5; // Add 0-50% jitter
    }

    return delay;
  }

  shouldRetry(
    serviceName: string,
    error: EnhancedError,
    attempt: number,
  ): boolean {
    const config = this.retryConfigs.get(serviceName);
    if (!config) return false;

    if (attempt >= config.maxAttempts) {
      return false;
    }

    if (!error.retryable) {
      return false;
    }

    if (!this.canExecute(serviceName)) {
      return false;
    }

    return true;
  }

  async executeWithRetry<T>(
    serviceName: string,
    operation: () => Promise<T>,
    context: Record<string, any> = {},
  ): Promise<T> {
    if (!this.canExecute(serviceName)) {
      throw new EnhancedError(
        `Service ${serviceName} is currently unavailable (circuit breaker open)`,
        ErrorType.SERVICE_UNAVAILABLE,
        false,
        context,
      );
    }

    const config = this.retryConfigs.get(serviceName);
    if (!config) {
      this.registerService(serviceName);
    }

    const maxAttempts = config?.maxAttempts || 3;
    let lastError: EnhancedError | null = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const result = await operation();
        this.recordSuccess(serviceName);
        return result;
      } catch (error) {
        const enhancedError = this.createEnhancedError(
          error as Error,
          {
            ...context,
            attempt,
            maxAttempts,
            serviceName,
          },
          serviceName,
        );

        this.recordError(serviceName, enhancedError);
        lastError = enhancedError;

        if (!this.shouldRetry(serviceName, enhancedError, attempt)) {
          break;
        }

        if (attempt < maxAttempts) {
          const delay = this.calculateRetryDelay(serviceName, attempt);
          console.warn(
            `Operation failed for ${serviceName} (attempt ${attempt}/${maxAttempts}). ` +
              `Retrying in ${delay}ms. Error: ${enhancedError.message}`,
          );
          await this.sleep(delay);
        }
      }
    }

    // All retries exhausted
    if (lastError) {
      throw lastError;
    } else {
      throw new EnhancedError(
        `Operation failed for ${serviceName} after ${maxAttempts} attempts`,
        ErrorType.UNKNOWN_ERROR,
        false,
        context,
      );
    }
  }

  private showUserError(error: EnhancedError, serviceName: string): void {
    const userFriendlyMessages: Record<ErrorType, string> = {
      [ErrorType.CONNECTION_ERROR]:
        "Unable to connect to Home Assistant. Please check your connection.",
      [ErrorType.AUTHENTICATION_ERROR]:
        "Authentication failed. Please check your credentials.",
      [ErrorType.RATE_LIMIT_ERROR]:
        "Too many requests. Please wait a moment and try again.",
      [ErrorType.VALIDATION_ERROR]: "Invalid request. Please check your input.",
      [ErrorType.TIMEOUT_ERROR]: "Request timed out. Please try again.",
      [ErrorType.SERVICE_UNAVAILABLE]:
        "Home Assistant service is temporarily unavailable.",
      [ErrorType.UNKNOWN_ERROR]: "An unexpected error occurred.",
    };

    const message = userFriendlyMessages[error.errorType] || error.message;

    // Only show toast for non-retryable errors or final failures
    if (
      !error.retryable ||
      error.context.attempt === error.context.maxAttempts
    ) {
      toastError(`${serviceName}: ${message}`);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  getServiceHealth(serviceName: string): any {
    const metrics = this.metrics.get(serviceName);
    const circuitBreaker = this.circuitBreakers.get(serviceName);

    if (!metrics || !circuitBreaker) {
      return { status: "unknown", message: "Service not registered" };
    }

    return {
      status:
        circuitBreaker.getState() === CircuitState.CLOSED
          ? "healthy"
          : "unhealthy",
      circuitState: circuitBreaker.getState(),
      totalErrors: metrics.totalErrors,
      consecutiveFailures: metrics.consecutiveFailures,
      lastErrorTime: metrics.lastErrorTime?.toISOString(),
      errorTypes: metrics.errorTypes,
      circuitMetrics: circuitBreaker.getMetrics(),
    };
  }

  getOverallHealth(): any {
    const services: Record<string, any> = {};
    let overallHealthy = true;

    for (const serviceName of this.metrics.keys()) {
      const serviceHealth = this.getServiceHealth(serviceName);
      services[serviceName] = serviceHealth;
      if (serviceHealth.status !== "healthy") {
        overallHealthy = false;
      }
    }

    return {
      overallStatus: overallHealthy ? "healthy" : "degraded",
      services,
      timestamp: new Date().toISOString(),
    };
  }

  // Utility method to wrap fetch with error handling
  async enhancedFetch(
    serviceName: string,
    url: string,
    options: RequestInit = {},
  ): Promise<Response> {
    return this.executeWithRetry(
      serviceName,
      async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

        try {
          const response = await fetch(url, {
            ...options,
            signal: controller.signal,
          });

          if (!response.ok) {
            throw response;
          }

          return response;
        } finally {
          clearTimeout(timeoutId);
        }
      },
      { url, method: options.method || "GET" },
    );
  }
}

// Global error handler instance
export const globalErrorHandler = new ErrorHandler();

// Register default services
globalErrorHandler.registerService(
  "home_assistant_api",
  {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    exponentialBase: 2,
    jitter: true,
    retryableErrors: [
      ErrorType.CONNECTION_ERROR,
      ErrorType.TIMEOUT_ERROR,
      ErrorType.SERVICE_UNAVAILABLE,
      ErrorType.RATE_LIMIT_ERROR,
    ],
  },
  {
    failureThreshold: 5,
    recoveryTimeout: 60,
    successThreshold: 3,
    monitoringWindow: 300,
  },
);

globalErrorHandler.registerService(
  "websocket",
  {
    maxAttempts: 5,
    baseDelay: 2000,
    maxDelay: 60000,
    exponentialBase: 2,
    jitter: true,
    retryableErrors: [
      ErrorType.CONNECTION_ERROR,
      ErrorType.TIMEOUT_ERROR,
      ErrorType.SERVICE_UNAVAILABLE,
    ],
  },
  {
    failureThreshold: 3,
    recoveryTimeout: 30,
    successThreshold: 3,
    monitoringWindow: 300,
  },
);

// Add global error callback for logging
globalErrorHandler.addErrorCallback((error: EnhancedError) => {
  console.error(
    `Enhanced Error: ${error.message} ` +
      `(Type: ${error.errorType}, Retryable: ${error.retryable})`,
    error.context,
  );
});

export default globalErrorHandler;
