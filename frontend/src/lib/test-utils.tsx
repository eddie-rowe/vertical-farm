/**
 * Testing utilities for React components and hooks
 */

import React, { ReactElement } from 'react'
import { render, RenderOptions, RenderResult } from '@testing-library/react'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/toaster'

// Mock Next.js router
export const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  prefetch: jest.fn(),
  pathname: '/',
  route: '/',
  query: {},
  asPath: '/',
  isFallback: false,
  basePath: '',
  locale: 'en',
  locales: ['en'],
  defaultLocale: 'en',
  isReady: true,
  isPreview: false,
}

// Mock window.matchMedia for responsive tests
export const mockMatchMedia = (query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: jest.fn(),
  removeListener: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
})

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  theme?: 'light' | 'dark' | 'system'
  preloadedState?: any
}

export function renderWithProviders(
  ui: ReactElement,
  options: CustomRenderOptions = {}
): RenderResult {
  const {
    theme = 'light',
    ...renderOptions
  } = options

  const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
    return (
      <div data-theme={theme}>
        <TooltipProvider>
          {children}
          <Toaster />
        </TooltipProvider>
      </div>
    )
  }

  return render(ui, { wrapper: AllTheProviders, ...renderOptions })
}

// Test data generators
export const createMockUser = (overrides = {}) => ({
  id: '1',
  email: 'test@example.com',
  name: 'Test User',
  avatar: '/avatars/test.jpg',
  role: 'user',
  createdAt: new Date().toISOString(),
  ...overrides,
})

export const createMockPlant = (overrides = {}) => ({
  id: '1',
  name: 'Test Plant',
  species: 'Test Species',
  zone: 'A1',
  status: 'healthy',
  plantedDate: new Date().toISOString(),
  lastWatered: new Date().toISOString(),
  sensors: {
    temperature: 22.5,
    humidity: 65,
    soilMoisture: 45,
    lightLevel: 800,
  },
  ...overrides,
})

export const createMockSensorData = (overrides = {}) => ({
  id: '1',
  plantId: '1',
  timestamp: new Date().toISOString(),
  temperature: 22.5,
  humidity: 65,
  soilMoisture: 45,
  lightLevel: 800,
  ph: 6.5,
  nutrients: {
    nitrogen: 120,
    phosphorus: 80,
    potassium: 150,
  },
  ...overrides,
})

// Mock API responses
export const mockApiResponses = {
  plants: {
    success: {
      data: [createMockPlant(), createMockPlant({ id: '2', name: 'Plant 2' })],
      meta: { total: 2, page: 1, limit: 10 },
    },
    error: {
      error: 'Failed to fetch plants',
      status: 500,
    },
  },
  
  sensors: {
    success: {
      data: [createMockSensorData(), createMockSensorData({ id: '2' })],
      meta: { total: 2, page: 1, limit: 10 },
    },
    error: {
      error: 'Failed to fetch sensor data',
      status: 500,
    },
  },

  user: {
    success: { data: createMockUser() },
    error: { error: 'Unauthorized', status: 401 },
  },
}

// Custom hooks for testing
export const useTestUser = () => createMockUser()

// Test utilities for async operations
export const waitForElementToBeRemoved = async (element: HTMLElement) => {
  return new Promise<void>((resolve) => {
    const observer = new MutationObserver(() => {
      if (!document.contains(element)) {
        observer.disconnect()
        resolve()
      }
    })
    observer.observe(document.body, { childList: true, subtree: true })
  })
}

// Mock fetch for API testing
export const createMockFetch = (responses: Record<string, any>) => {
  return jest.fn().mockImplementation((url: string, options?: RequestInit) => {
    const method = options?.method || 'GET'
    const key = `${method} ${url}`
    
    if (responses[key]) {
      return Promise.resolve({
        ok: responses[key].ok !== false,
        status: responses[key].status || 200,
        json: () => Promise.resolve(responses[key]),
      })
    }
    
    return Promise.reject(new Error(`No mock response for ${key}`))
  })
}

// Setup global test environment
export const setupTestEnvironment = () => {
  // Mock window.matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: mockMatchMedia,
  })

  // Mock IntersectionObserver
  global.IntersectionObserver = class IntersectionObserver {
    constructor() {}
    observe() {}
    disconnect() {}
    unobserve() {}
  } as any

  // Mock ResizeObserver
  global.ResizeObserver = class ResizeObserver {
    constructor() {}
    observe() {}
    disconnect() {}
    unobserve() {}
  } as any

  // Mock scrollTo
  window.scrollTo = jest.fn()

  // Mock location
  delete (window as any).location
  window.location = { href: 'http://localhost:3000' } as any
}

// Custom Jest matchers
// Note: These matchers are defined below but types are handled by jest-dom

// Add custom matchers
expect.extend({
  toBeVisible(received: HTMLElement) {
    const pass = received.offsetParent !== null
    return {
      message: () =>
        pass
          ? `Expected element not to be visible`
          : `Expected element to be visible`,
      pass,
    }
  },

  toHaveAttribute(received: HTMLElement, attribute: string, value?: string) {
    const hasAttribute = received.hasAttribute(attribute)
    const actualValue = received.getAttribute(attribute)
    
    if (value !== undefined) {
      const pass = hasAttribute && actualValue === value
      return {
        message: () =>
          pass
            ? `Expected element not to have attribute ${attribute} with value ${value}`
            : `Expected element to have attribute ${attribute} with value ${value}, but got ${actualValue}`,
        pass,
      }
    }

    return {
      message: () =>
        hasAttribute
          ? `Expected element not to have attribute ${attribute}`
          : `Expected element to have attribute ${attribute}`,
      pass: hasAttribute,
    }
  },
})

// Performance testing utilities
export const measureRenderTime = async (renderFn: () => void) => {
  const start = performance.now()
  renderFn()
  const end = performance.now()
  return end - start
}

// Accessibility testing utilities
export const checkAccessibility = async (container: HTMLElement) => {
  // Simple accessibility checks without axe-core dependency
  const checks = {
    hasLabels: container.querySelectorAll('input:not([aria-label]):not([aria-labelledby])').length === 0,
    hasAltText: container.querySelectorAll('img:not([alt])').length === 0,
    hasHeadings: container.querySelectorAll('h1, h2, h3, h4, h5, h6').length > 0,
    hasSkipLinks: container.querySelectorAll('a[href="#main"], a[href="#content"]').length > 0,
  }

  return {
    violations: Object.entries(checks)
      .filter(([, passed]) => !passed)
      .map(([rule]) => ({ id: rule, description: `Accessibility rule ${rule} failed` })),
    passes: Object.entries(checks)
      .filter(([, passed]) => passed)
      .map(([rule]) => ({ id: rule, description: `Accessibility rule ${rule} passed` })),
  }
}

// Export everything for easy testing
export * from '@testing-library/react'

// Note: If you need user-event, install @testing-library/user-event
// export { default as userEvent } from '@testing-library/user-event' 