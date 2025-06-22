/**
 * Accessibility utilities for improved UX and WCAG compliance
 */

import { useEffect, useRef, useState } from 'react'

// Focus management utilities
export const useFocusManagement = () => {
  const previousFocusRef = useRef<HTMLElement | null>(null)

  const saveFocus = () => {
    previousFocusRef.current = document.activeElement as HTMLElement
  }

  const restoreFocus = () => {
    if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
      previousFocusRef.current.focus()
    }
  }

  const focusFirst = (container: HTMLElement) => {
    const focusable = getFocusableElements(container)
    if (focusable.length > 0) {
      focusable[0].focus()
    }
  }

  const focusLast = (container: HTMLElement) => {
    const focusable = getFocusableElements(container)
    if (focusable.length > 0) {
      focusable[focusable.length - 1].focus()
    }
  }

  return {
    saveFocus,
    restoreFocus,
    focusFirst,
    focusLast,
  }
}

// Get all focusable elements within a container
export const getFocusableElements = (container: HTMLElement): HTMLElement[] => {
  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]'
  ].join(',')

  return Array.from(container.querySelectorAll(focusableSelectors))
    .filter(element => {
      const htmlElement = element as HTMLElement
      return htmlElement.offsetWidth > 0 && 
             htmlElement.offsetHeight > 0 && 
             !htmlElement.hidden
    }) as HTMLElement[]
}

// Trap focus within a container (for modals, dropdowns, etc.)
export const useFocusTrap = (isActive: boolean = false) => {
  const containerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!isActive || !containerRef.current) return

    const container = containerRef.current
    const focusableElements = getFocusableElements(container)
    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return

      if (event.shiftKey) {
        // Shift + Tab: Focus previous element
        if (document.activeElement === firstElement) {
          event.preventDefault()
          lastElement?.focus()
        }
      } else {
        // Tab: Focus next element
        if (document.activeElement === lastElement) {
          event.preventDefault()
          firstElement?.focus()
        }
      }
    }

    container.addEventListener('keydown', handleKeyDown)
    
    // Focus first element when trap activates
    firstElement?.focus()

    return () => {
      container.removeEventListener('keydown', handleKeyDown)
    }
  }, [isActive])

  return containerRef
}

// Announce content to screen readers
export const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
  const announcer = document.createElement('div')
  announcer.setAttribute('aria-live', priority)
  announcer.setAttribute('aria-atomic', 'true')
  announcer.className = 'sr-only'
  announcer.textContent = message

  document.body.appendChild(announcer)

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcer)
  }, 1000)
}

// Skip link utilities
export const useSkipLink = (targetId: string) => {
  const skipToTarget = () => {
    const target = document.getElementById(targetId)
    if (target) {
      target.focus()
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return { skipToTarget }
}

// Keyboard navigation utilities
export const useKeyboardNavigation = () => {
  const handleArrowNavigation = (
    event: KeyboardEvent,
    items: HTMLElement[],
    currentIndex: number,
    onNavigate: (newIndex: number) => void
  ) => {
    let newIndex = currentIndex

    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        event.preventDefault()
        newIndex = (currentIndex + 1) % items.length
        break
      case 'ArrowUp':
      case 'ArrowLeft':
        event.preventDefault()
        newIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1
        break
      case 'Home':
        event.preventDefault()
        newIndex = 0
        break
      case 'End':
        event.preventDefault()
        newIndex = items.length - 1
        break
      default:
        return
    }

    onNavigate(newIndex)
    items[newIndex]?.focus()
  }

  return { handleArrowNavigation }
}

// Reduced motion detection
export const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return prefersReducedMotion
}

// ARIA attribute helpers
export const generateAriaAttributes = (options: {
  id?: string
  label?: string
  labelledBy?: string
  describedBy?: string
  expanded?: boolean
  selected?: boolean
  disabled?: boolean
  required?: boolean
  invalid?: boolean
  live?: 'polite' | 'assertive' | 'off'
  atomic?: boolean
}) => {
  const attributes: Record<string, any> = {}

  if (options.id) attributes.id = options.id
  if (options.label) attributes['aria-label'] = options.label
  if (options.labelledBy) attributes['aria-labelledby'] = options.labelledBy
  if (options.describedBy) attributes['aria-describedby'] = options.describedBy
  if (options.expanded !== undefined) attributes['aria-expanded'] = options.expanded
  if (options.selected !== undefined) attributes['aria-selected'] = options.selected
  if (options.disabled !== undefined) attributes['aria-disabled'] = options.disabled
  if (options.required !== undefined) attributes['aria-required'] = options.required
  if (options.invalid !== undefined) attributes['aria-invalid'] = options.invalid
  if (options.live) attributes['aria-live'] = options.live
  if (options.atomic !== undefined) attributes['aria-atomic'] = options.atomic

  return attributes
}

// Color contrast utilities
export const getContrastRatio = (color1: string, color2: string): number => {
  const getLuminance = (color: string): number => {
    // Convert hex to RGB
    const hex = color.replace('#', '')
    const r = parseInt(hex.substr(0, 2), 16) / 255
    const g = parseInt(hex.substr(2, 2), 16) / 255
    const b = parseInt(hex.substr(4, 2), 16) / 255

    // Calculate relative luminance
    const getRGB = (c: number) => {
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    }

    return 0.2126 * getRGB(r) + 0.7152 * getRGB(g) + 0.0722 * getRGB(b)
  }

  const l1 = getLuminance(color1)
  const l2 = getLuminance(color2)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)

  return (lighter + 0.05) / (darker + 0.05)
}

export const hasGoodContrast = (foreground: string, background: string, level: 'AA' | 'AAA' = 'AA'): boolean => {
  const ratio = getContrastRatio(foreground, background)
  return level === 'AA' ? ratio >= 4.5 : ratio >= 7
}

// Screen reader utilities - moved to separate component file
export const getScreenReaderOnlyProps = () => ({
  className: 'sr-only'
})

// Accessibility context for global settings
interface AccessibilityContextType {
  reducedMotion: boolean
  highContrast: boolean
  fontSize: 'normal' | 'large' | 'extra-large'
  announcements: boolean
}

export const defaultAccessibilityContext: AccessibilityContextType = {
  reducedMotion: false,
  highContrast: false,
  fontSize: 'normal',
  announcements: true,
} 