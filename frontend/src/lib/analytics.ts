/**
 * Analytics and monitoring utilities for performance tracking and user insights
 */

// Types for analytics events
export interface AnalyticsEvent {
  name: string
  properties?: Record<string, any>
  timestamp?: number
  userId?: string
  sessionId?: string
}

export interface PerformanceMetrics {
  pageLoadTime: number
  timeToFirstByte: number
  firstContentfulPaint: number
  largestContentfulPaint: number
  cumulativeLayoutShift: number
  firstInputDelay?: number
  interactionToNextPaint?: number
}

export interface UserAction {
  type: 'click' | 'scroll' | 'form_submit' | 'navigation' | 'error'
  element?: string
  url?: string
  timestamp: number
  metadata?: Record<string, any>
}

// Analytics configuration
interface AnalyticsConfig {
  apiEndpoint?: string
  apiKey?: string
  userId?: string
  enableDevMode?: boolean
  enableConsoleLogging?: boolean
  batchSize?: number
  flushInterval?: number
}

class Analytics {
  private config: AnalyticsConfig
  private eventQueue: AnalyticsEvent[] = []
  private sessionId: string
  private userId?: string
  private performanceObserver?: PerformanceObserver
  private flushTimer?: NodeJS.Timeout

  constructor(config: AnalyticsConfig = {}) {
    this.config = {
      batchSize: 10,
      flushInterval: 5000,
      enableConsoleLogging: process.env.NODE_ENV === 'development',
      ...config,
    }

    this.sessionId = this.generateSessionId()
    this.userId = config.userId

    if (typeof window !== 'undefined') {
      this.initializePerformanceTracking()
      this.initializeUserActionTracking()
      this.startFlushTimer()
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private initializePerformanceTracking() {
    // Web Vitals tracking
    if ('PerformanceObserver' in window) {
      // Largest Contentful Paint
      this.observePerformanceEntry('largest-contentful-paint', (entries) => {
        const lcpEntry = entries[entries.length - 1]
        this.track('performance_lcp', {
          value: lcpEntry.startTime,
          url: window.location.pathname,
        })
      })

      // First Input Delay
      this.observePerformanceEntry('first-input', (entries) => {
        const fidEntry = entries[0] as any
        this.track('performance_fid', {
          value: fidEntry.processingStart - fidEntry.startTime,
          url: window.location.pathname,
        })
      })

      // Cumulative Layout Shift
      this.observePerformanceEntry('layout-shift', (entries) => {
        let cumulativeScore = 0
        for (const entry of entries) {
          if (!(entry as any).hadRecentInput) {
            cumulativeScore += (entry as any).value
          }
        }
        this.track('performance_cls', {
          value: cumulativeScore,
          url: window.location.pathname,
        })
      })
    }

    // Navigation timing
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
        const paint = performance.getEntriesByType('paint')

        const metrics: PerformanceMetrics = {
          pageLoadTime: navigation.loadEventEnd - navigation.loadEventStart,
          timeToFirstByte: navigation.responseStart - navigation.requestStart,
          firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
          largestContentfulPaint: 0, // Will be updated by observer
          cumulativeLayoutShift: 0, // Will be updated by observer
        }

        this.track('page_performance', {
          metrics,
          url: window.location.pathname,
        })
      }, 0)
    })
  }

  private observePerformanceEntry(type: string, callback: (entries: PerformanceEntry[]) => void) {
    try {
      const observer = new PerformanceObserver((list) => {
        callback(list.getEntries())
      })
      observer.observe({ type, buffered: true })
    } catch (error) {
      console.warn(`Failed to observe ${type}:`, error)
    }
  }

  private initializeUserActionTracking() {
    // Click tracking
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement
      const elementInfo = this.getElementInfo(target)
      
      this.track('user_click', {
        element: elementInfo,
        x: event.clientX,
        y: event.clientY,
        url: window.location.pathname,
      })
    })

    // Form submission tracking
    document.addEventListener('submit', (event) => {
      const form = event.target as HTMLFormElement
      const formInfo = this.getElementInfo(form)
      
      this.track('form_submit', {
        form: formInfo,
        url: window.location.pathname,
      })
    })

    // Error tracking
    window.addEventListener('error', (event) => {
      this.track('javascript_error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        url: window.location.pathname,
      })
    })

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.track('promise_rejection', {
        reason: event.reason?.toString(),
        url: window.location.pathname,
      })
    })

    // Visibility changes
    document.addEventListener('visibilitychange', () => {
      this.track('visibility_change', {
        visible: !document.hidden,
        url: window.location.pathname,
      })
    })
  }

  private getElementInfo(element: HTMLElement) {
    return {
      tagName: element.tagName.toLowerCase(),
      id: element.id || undefined,
      className: element.className || undefined,
      textContent: element.textContent?.slice(0, 100) || undefined,
      href: (element as HTMLAnchorElement).href || undefined,
    }
  }

  private startFlushTimer() {
    this.flushTimer = setInterval(() => {
      this.flush()
    }, this.config.flushInterval)
  }

  // Public methods
  public track(eventName: string, properties: Record<string, any> = {}) {
    const event: AnalyticsEvent = {
      name: eventName,
      properties,
      timestamp: Date.now(),
      userId: this.userId,
      sessionId: this.sessionId,
    }

    this.eventQueue.push(event)

    if (this.config.enableConsoleLogging) {
      console.log('📊 Analytics Event:', event)
    }

    if (this.eventQueue.length >= (this.config.batchSize || 10)) {
      this.flush()
    }
  }

  public identify(userId: string, traits: Record<string, any> = {}) {
    this.userId = userId
    this.track('user_identify', { userId, traits })
  }

  public page(pageName?: string, properties: Record<string, any> = {}) {
    this.track('page_view', {
      page: pageName || window.location.pathname,
      title: document.title,
      referrer: document.referrer,
      url: window.location.href,
      ...properties,
    })
  }

  public flush() {
    if (this.eventQueue.length === 0) return

    const events = [...this.eventQueue]
    this.eventQueue = []

    if (this.config.apiEndpoint) {
      this.sendEvents(events)
    }
  }

  private async sendEvents(events: AnalyticsEvent[]) {
    try {
      await fetch(this.config.apiEndpoint!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` }),
        },
        body: JSON.stringify({ events }),
      })
    } catch (error) {
      console.error('Failed to send analytics events:', error)
      // Re-queue events on failure
      this.eventQueue.unshift(...events)
    }
  }

  public destroy() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
    }
    if (this.performanceObserver) {
      this.performanceObserver.disconnect()
    }
    this.flush() // Send remaining events
  }
}

// Global analytics instance
let analytics: Analytics | null = null

export const initializeAnalytics = (config: AnalyticsConfig = {}) => {
  if (typeof window === 'undefined') return null
  
  analytics = new Analytics(config)
  return analytics
}

export const getAnalytics = () => analytics

// Convenience functions
export const trackEvent = (name: string, properties?: Record<string, any>) => {
  analytics?.track(name, properties)
}

export const trackPageView = (pageName?: string, properties?: Record<string, any>) => {
  analytics?.page(pageName, properties)
}

export const identifyUser = (userId: string, traits?: Record<string, any>) => {
  analytics?.identify(userId, traits)
}

// React hooks for analytics
export const useAnalytics = () => {
  return {
    track: trackEvent,
    page: trackPageView,
    identify: identifyUser,
    analytics: getAnalytics(),
  }
}

// Performance monitoring utilities
export const measureFunction = <T extends (...args: any[]) => any>(
  fn: T,
  name: string
): T => {
  return ((...args: any[]) => {
    const start = performance.now()
    const result = fn(...args)
    const end = performance.now()
    
    trackEvent('function_performance', {
      name,
      duration: end - start,
      args: args.length,
    })
    
    return result
  }) as T
}

export const measureAsyncFunction = <T extends (...args: any[]) => Promise<any>>(
  fn: T,
  name: string
): T => {
  return (async (...args: any[]) => {
    const start = performance.now()
    try {
      const result = await fn(...args)
      const end = performance.now()
      
      trackEvent('async_function_performance', {
        name,
        duration: end - start,
        success: true,
        args: args.length,
      })
      
      return result
    } catch (error) {
      const end = performance.now()
      
      trackEvent('async_function_performance', {
        name,
        duration: end - start,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        args: args.length,
      })
      
      throw error
    }
  }) as T
}

// A/B testing utilities
export const getABTestVariant = (testName: string, variants: string[]): string => {
  const currentAnalytics = getAnalytics()
  const userId = currentAnalytics ? (currentAnalytics as any).userId || 'anonymous' : 'anonymous'
  const hash = simpleHash(`${testName}_${userId}`)
  const variantIndex = hash % variants.length
  
  const variant = variants[variantIndex]
  
  trackEvent('ab_test_assignment', {
    test: testName,
    variant,
    userId,
  })
  
  return variant
}

const simpleHash = (str: string): number => {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash)
} 