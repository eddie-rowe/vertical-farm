# Dark Mode Best Practices Guide

## Overview

This vertical farming app uses **Tailwind CSS v4** with a modern class-based dark mode approach. All components should use semantic design tokens instead of hardcoded colors.

## Quick Reference

### ✅ **USE THESE (Semantic Tokens)**

```tsx
// Text Colors
className="text-farm-title"           // Main headings
className="text-control-label"        // Form labels, secondary text
className="text-control-content"      // Body text
className="text-control-secondary"    // Subtle text
className="text-sensor-value"         // Important metrics/values

// Backgrounds
className="bg-farm-white"            // Main backgrounds
className="bg-farm-muted"            // Subtle backgrounds
className="bg-farm-card"             // Card backgrounds
className="surface-card"             // Complete card styling
className="surface-elevated"         // Elevated surfaces

// Borders
className="border-farm-border"       // Default borders
className="border-subtle"            // Subtle borders
className="border-emphasis"          // Emphasized borders

// State Patterns
className="state-active"             // Active/healthy state
className="state-growing"            // Growing/positive state  
className="state-maintenance"        // Warning/maintenance state
className="state-offline"            // Error/offline state
```

### ❌ **AVOID THESE (Hardcoded Colors)**

```tsx
// Don't use hardcoded colors
className="bg-white dark:bg-gray-800"        // ❌
className="text-gray-900 dark:text-white"    // ❌ 
className="border-gray-200"                  // ❌

// Use semantic tokens instead
className="bg-farm-white"                    // ✅
className="text-farm-title"                  // ✅
className="border-farm-border"               // ✅
```

## Component Patterns

### Card Components
```tsx
// ✅ Recommended
<div className="surface-card">
  <h3 className="text-farm-title mb-2">Card Title</h3>
  <p className="text-control-content">Card content</p>
</div>

// ❌ Avoid
<div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
  <h3 className="text-gray-900 dark:text-white">Card Title</h3>
  <p className="text-gray-600 dark:text-gray-300">Card content</p>
</div>
```

### Interactive Elements
```tsx
// ✅ Recommended
<button className="farm-control-btn">
  <Icon className="gradient-icon" />
</button>

// ✅ State patterns
<div className="state-active">Active sensor</div>
<div className="state-growing">Growing plants</div>
<div className="state-maintenance">Needs attention</div>
```

### Form Components
```tsx
// ✅ Recommended - Use farm form components
<FarmInput />
<FarmSelect />
<FarmCheckbox />

// ✅ Custom forms with proper tokens
<input className="farm-input" />
<label className="form-label">Label text</label>
<span className="form-help">Help text</span>
<span className="form-error">Error message</span>
```

## Theme Context Usage

```tsx
import { useTheme } from '@/context/ThemeContext';

function MyComponent() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <button onClick={toggleTheme}>
      {theme === 'light' ? '🌞' : '🌙'}
    </button>
  );
}
```

## Design Token Hierarchy

### Text Hierarchy
- `text-farm-title` - Main headings (24px, bold)
- `text-control-label` - Labels and secondary headings (14px, medium)
- `text-control-content` - Body text (14px, regular)
- `text-control-secondary` - Subtle text (12px, regular)
- `text-sensor-value` - Metrics and values (18px, semibold, tabular)

### Background Hierarchy
- `bg-farm-white` - Primary backgrounds
- `bg-farm-muted` - Secondary backgrounds  
- `bg-farm-card` - Card/elevated backgrounds

### State Colors
- `state-active` - Green ring/background (healthy, online)
- `state-growing` - Green with pulse animation (growing, positive)
- `state-maintenance` - Yellow ring/background (warning, attention needed)
- `state-offline` - Red ring/background (error, offline, critical)

## Troubleshooting

### Common Issues

1. **White flash on theme toggle**
   - Make sure `suppressHydrationWarning` is on `<html>` tag
   - Use `surface-card` instead of hardcoded backgrounds

2. **Inconsistent colors across components**
   - Replace hardcoded colors with semantic tokens
   - Use farm-specific design tokens consistently

3. **Missing dark mode variants**
   - All custom utilities automatically include dark mode support
   - Use semantic tokens instead of adding manual `dark:` variants

### Migration Checklist

- [ ] Replace `text-gray-900 dark:text-white` with `text-farm-title`
- [ ] Replace `bg-white dark:bg-gray-800` with `bg-farm-white` 
- [ ] Replace hardcoded borders with `border-farm-border`
- [ ] Use farm state patterns instead of manual color classes
- [ ] Test all interactive states in both light and dark mode

## 🎯 **Semantic Tokens Ready for Integration**

### **New Comprehensive Token System**
The following semantic tokens are already implemented and ready to use:

```tsx
// ✅ PREFERRED - Use these semantic tokens
className="text-content"              // Main text color
className="text-content-secondary"    // Secondary text  
className="text-content-subtle"       // Subtle text with opacity
className="text-emphasis"             // Emphasized text
className="text-control-content"      // Form control text
className="text-control-secondary"    // Secondary form text

className="bg-surface"               // Main background
className="bg-surface-elevated"      // Card backgrounds
className="bg-surface-overlay"       // Popover/modal backgrounds  
className="surface-card"             // Complete card styling
className="surface-elevated"         // Elevated surfaces

className="border-subtle"            // Subtle borders
className="border-emphasis"          // Emphasized borders
className="interactive-hover"        // Transition properties
className="interactive-hover-state"  // Hover state colors
```

### **Migration Strategy**
To improve consistency, migrate hardcoded colors to semantic tokens:

1. **Replace** `text-gray-900 dark:text-white` → `text-content`
2. **Replace** `bg-white dark:bg-gray-800` → `bg-surface-elevated`
3. **Replace** card styling → `surface-card`
4. **Replace** border classes → `border-subtle`

See [SEMANTIC-TOKEN-MIGRATION.md](./SEMANTIC-TOKEN-MIGRATION.md) for detailed migration guide.

## Resources

- [Tailwind CSS Dark Mode Docs](https://tailwindcss.com/docs/dark-mode)
- [Farm Design Tokens](./src/app/globals.css) - View all available tokens
- [Component Library](./src/components/ui/) - Pre-built dark mode components
- [Semantic Token Migration Guide](./SEMANTIC-TOKEN-MIGRATION.md) - Migration strategy 