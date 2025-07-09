# Semantic Token Migration Guide

## 🎯 **Objective**
Replace hardcoded colors with semantic tokens across all pages for better dark mode consistency and maintainability.

## 📊 **Current State**
- ✅ Semantic tokens implemented in `globals.css`
- ❌ 26+ instances of `text-gray-900 dark:text-white` 
- ❌ 5+ instances of `bg-white/80 dark:bg-gray-700/80`
- ❌ Zero usage of semantic tokens in components

## 🔄 **Migration Mapping**

### Text Color Replacements
```tsx
// ❌ BEFORE: Hardcoded colors
className="text-gray-900 dark:text-white"
className="text-lg font-semibold text-gray-900 dark:text-white"

// ✅ AFTER: Semantic tokens
className="text-content"
className="text-lg font-semibold text-content"
```

### Background Replacements
```tsx
// ❌ BEFORE: Hardcoded backgrounds
className="bg-white/80 dark:bg-gray-700/80"

// ✅ AFTER: Semantic tokens
className="bg-surface-elevated/80"
```

### Card/Surface Replacements
```tsx
// ❌ BEFORE: Multiple classes
className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"

// ✅ AFTER: Single semantic utility
className="surface-card"
```

## 📁 **Files Requiring Migration**

### **High Priority** (Analytics & Dashboard)
- `src/components/features/business/analytics/AnalyticsDashboard.tsx` (4 instances)
- `src/components/features/business/analytics/SmartInsights.tsx` (6 instances)
- `src/components/features/business/analytics/PerformanceMetrics.tsx` (4 instances)
- `src/app/(app)/dashboard/page.tsx` (needs review)

### **Medium Priority** (Intelligence & Features)
- `src/components/features/intelligence/ai-intelligence/DashboardsForecastingView.tsx` (8 instances)
- `src/components/features/intelligence/ai-intelligence/CropEnvironmentView.tsx` (8 instances)
- `src/components/features/business/analytics/DataChart.tsx` (2 instances)

### **Lower Priority** (Auth & UI Components)
- `src/app/(auth)/login/page.tsx` (2 instances)
- `src/app/(auth)/signup/page.tsx` (3 instances)
- `src/components/ui/PageHeader.tsx` (1 instance)

## 🛠 **Implementation Strategy**

### **Phase 1: Core Components (Immediate)**
1. **PageHeader.tsx** - Used across all pages
2. **Dashboard page** - High-visibility main page
3. **Auth pages** - User-facing entry points

### **Phase 2: Analytics Components**
1. **AnalyticsDashboard.tsx**
2. **SmartInsights.tsx** 
3. **PerformanceMetrics.tsx**

### **Phase 3: Intelligence Components**
1. **DashboardsForecastingView.tsx**
2. **CropEnvironmentView.tsx**
3. **Remaining chart components**

## 📝 **Sample Migration Examples**

### Text Content Migration
```tsx
// File: PageHeader.tsx
// BEFORE
<h1 className="font-bold text-gray-900 dark:text-white mb-2">

// AFTER  
<h1 className="font-bold text-content mb-2">
```

### Complex Card Migration
```tsx
// File: AnalyticsDashboard.tsx
// BEFORE
<div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
    Revenue Trends
  </h3>
  <p className="text-gray-600 dark:text-gray-300">Monthly performance</p>
</div>

// AFTER
<div className="surface-card p-6">
  <h3 className="text-lg font-semibold text-content">
    Revenue Trends
  </h3>
  <p className="text-content-secondary">Monthly performance</p>
</div>
```

### Form Input Migration
```tsx
// File: GlobalSearch.tsx  
// BEFORE
className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"

// AFTER
className="bg-surface text-content border-subtle"
```

## ✅ **Migration Checklist**

### Per Component:
- [ ] Replace `text-gray-900 dark:text-white` with `text-content`
- [ ] Replace `text-gray-600 dark:text-gray-300` with `text-content-secondary`
- [ ] Replace `bg-white dark:bg-gray-800` with `bg-surface-elevated`
- [ ] Replace card styling with `surface-card`
- [ ] Replace border classes with `border-subtle`
- [ ] Test dark mode toggle
- [ ] Verify visual consistency

### Global Verification:
- [ ] All hardcoded colors removed
- [ ] Dark mode functions correctly
- [ ] No visual regressions
- [ ] Consistent appearance across pages

## 🧪 **Testing Strategy**

1. **Visual Testing**: Toggle dark mode on each migrated page
2. **Consistency Check**: Compare styling across similar components
3. **Regression Testing**: Ensure no broken layouts
4. **Cross-browser Testing**: Verify in different browsers

## 📈 **Benefits After Migration**

- ✅ **Consistent dark mode** across all pages
- ✅ **Easier maintenance** - change tokens, not individual classes
- ✅ **Better accessibility** with proper contrast ratios
- ✅ **Reduced CSS bundle size** through utility reuse
- ✅ **Faster development** with established patterns

## 🔧 **Next Steps**

1. Start with **PageHeader.tsx** (affects all pages)
2. Migrate **Dashboard page** (high visibility)
3. Work through analytics components systematically
4. Update **DARK-MODE-GUIDE.md** with new examples
5. Document patterns for future development

---

**Estimated Time**: 4-6 hours for complete migration
**Impact**: High - affects all user-facing pages
**Risk**: Low - semantic tokens already tested and working 