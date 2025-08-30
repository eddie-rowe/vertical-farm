# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Vertical Farm** is a comprehensive vertical farming management platform that combines modern web technologies with IoT device control for indoor farming operations. The system handles everything from farm layout visualization to automated environmental control and real-time monitoring.

**Key Stack:**
- Frontend: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS + Custom Design Tokens, shadcn/ui
- Backend: FastAPI (Python 3.13) for integrations only, Supabase PostgREST for most operations
- Database: Supabase/PostgreSQL with mandatory Row Level Security (RLS)
- Infrastructure: Docker, Cloudflare Workers, GitHub Actions

**Domain-Specific Architecture:**
- **Farm Hierarchy**: Farm → Rows → Racks → Shelves → Schedules/Devices
- **Layer Overlay System**: Visual layers for Device, Automation, Monitoring, Analytics
- **Home Assistant Integration**: Major IoT integration for device control
- **Multi-Tenant**: Strict farm data isolation with RLS policies
- **Real-Time**: Sensor monitoring and automation with Supabase subscriptions

## CRITICAL ARCHITECTURE PATTERNS

### 🚨 Service Layer - MANDATORY (Most Important Rule)
- **NEVER bypass service layer** - All data operations MUST go through services
- **Singleton pattern REQUIRED** - Use `getInstance()` methods  
- **Base class inheritance** - Extend BaseService, BaseCRUDService
- **Error handling** - Services handle all errors, components show UI
- **Validation** - All input validation happens in services


### 🏗️ FastAPI vs PostgREST Decision Matrix
**Use FastAPI only for:**
- External integrations (Home Assistant, payment processors, weather APIs)
- Complex background tasks (automation orchestration, data processing)
- Third-party API orchestration (multiple services coordination)
- Custom business logic beyond database constraints

**Use Supabase PostgREST for:**
- Standard CRUD operations (farms, devices, users, grows, crops)
- Database-driven features with RLS policies
- Real-time subscriptions via Supabase channels
- Most core business operations (90% of features)

### 🔐 Supabase & Authentication
- **Package**: Use `@supabase/ssr` (NOT `@supabase/auth-helpers-nextjs`)
- **RLS Mandatory**: Every table MUST have Row Level Security enabled
- **Context-aware clients**: Different clients for server vs browser
- **Never expose service keys** to frontend


### ⚛️ Next.js 15 & React 19 Patterns
- **Server Components by default** - Add 'use client' only when needed
- **Use "use cache" directive** for expensive operations
- **Suspense boundaries** for loading states
- **useOptimistic** for instant UI feedback
- **Server Actions** for mutations


### 🎨 Layer Overlay System (Unique Architecture)
**Visual overlay architecture** - Multiple information layers (device, automation, monitoring, analytics) displayed simultaneously over farm structure. Similar to professional GIS/CAD tools with checkbox-based layer controls.

### 🌱 Farm Domain Hierarchy
**Hierarchical data model**: Farm → Rows → Racks → Shelves → Schedules/Devices. All relationships must be maintained throughout the system.

**Multi-Tenant Security**: All farm data isolated by `user_id` with mandatory RLS policies. Users can only access their own farms and related data.

## Architecture & Code Patterns

### Frontend Structure
```
frontend/src/
├── app/                       # Next.js App Router
│   ├── (auth)/               # Public routes (login, signup)
│   ├── (app)/                # Protected routes (dashboard, farms)
│   └── api/                  # API routes
├── components/
│   ├── features/             # Domain-specific components (by business domain)
│   │   ├── agriculture/      # Farm management features
│   │   ├── automation/       # Device control, scheduling
│   │   └── business/         # Analytics, reports
│   ├── ui/                   # Reusable UI components (shadcn/ui)
│   └── layout/               # Layout components (Header, Sidebar)
├── services/                 # Service layer (MANDATORY for all data)
│   ├── core/                 # Base services, auth, error handling
│   └── domain/               # Business domain services
├── types/                    # TypeScript definitions
├── hooks/                    # Custom React hooks
└── contexts/                 # React Context providers
```

### Backend Structure
```
backend/app/
├── api/v1/                   # API endpoints organized by domain
├── core/                     # Config, security, exceptions
├── crud/                     # Data access layer
├── models/                   # Pydantic models
├── schemas/                  # Request/response schemas
├── services/                 # Business logic (same pattern as frontend)
└── tests/                    # Organized by unit/integration/api/performance
```

### Component Organization
- **Feature-based structure** - Organize by business domain, not technical layers
- **Single responsibility** - Each component does one thing well
- **Composition over inheritance** - Build complex UIs from simple pieces
- **Error boundaries** - Wrap components that can fail
- **Co-located files** - Keep tests, styles, and types near components

### Import Organization
**Standard order required**: Node built-ins → React/Next.js → External packages → Services → Types → Components → Relative imports. Services imports come first in internal imports due to critical dependency.

### 📱 Mobile-First Design System
**Design tokens required** - Use CSS custom properties from `globals.css`, never hardcode colors/spacing. **Touch optimization mandatory** - 44px minimum touch targets, responsive overlays, mobile-first layouts.

### Performance Optimization
- **"use cache" directive** for expensive server operations
- **cacheLife configuration** for different data types  
- **Dynamic imports** for code splitting
- **useOptimistic** for instant UI updates
- **Image optimization** with Next.js Image component
- **Bundle analysis** with webpack optimizations
- **Performance targets**: Lighthouse >90, API <200ms, FCU <1.5s

## Key Development Rules

1. **NEVER bypass service layer** - All data operations must go through services (most critical)
2. **Default to PostgREST** - Only use FastAPI for integrations/complex processing
3. **RLS on everything** - All farm data tables require Row Level Security policies
4. **Use design tokens** - Never hardcode colors/spacing, use CSS custom properties
5. **Server Components first** - Add 'use client' only when interactivity needed
6. **Layer overlay patterns** - Follow established overlay positioning and z-index rules
7. **Farm hierarchy respect** - Maintain Farm → Row → Rack → Shelf relationships
8. **Mobile-first responsive** - Touch targets, responsive grids, mobile overlays
9. **Type everything** - TypeScript/Python type hints required throughout
10. **Test critical paths** - Services, authentication, farm data operations, automation flows
11. **Handle errors gracefully** - At service layer, display appropriately in UI
12. **Cache aggressively** - Use Next.js 15 caching features for farm data
13. **Follow import order** - Services first, then types, then components
14. **Component composition** - Build complex farm UIs from simple, reusable pieces

## Testing Strategy
- **Test Pyramid**: More unit tests, fewer integration tests, minimal E2E
- **Service-focused**: Test business logic in services, not UI implementation
- **Mock external dependencies**: Isolate tests from external systems
- **Coverage goals**: 80% for critical paths, 60% overall
- **NO INTEGRATION TESTS**: Only service unit tests + Playwright E2E tests

### Frontend Testing
- **Service Unit Tests**: Jest for business logic in services (GrowService, SpeciesService, etc.)
- **E2E Tests**: Playwright for all user interaction testing
- **Performance**: Web Vitals monitoring
- **FORBIDDEN**: @testing-library/user-event, complex component integration tests
- **Component Testing**: Use fireEvent only for simple DOM events if absolutely necessary

### Backend Testing
- **Unit**: Pytest with async support
- **Integration**: Multi-component tests
- **API**: Endpoint contract testing
- **Performance**: Load tests with markers

## Important Files & Locations

- **Service layer**: `frontend/src/services/` and `backend/app/services/`
- **Base service classes**: Key to understanding the architecture
- **Main entry points**: `backend/app/main.py`, `frontend/src/app/layout.tsx`
- **Database migrations**: `supabase/migrations/` (sequential, never modify existing)
- **API documentation**: Generated at `/docs` when backend running
- **Cursor AI rules**: `.cursor/rules/` for comprehensive development patterns

## Common Gotchas & Anti-Patterns

### ❌ NEVER DO THESE:
- Use deprecated `@supabase/auth-helpers-nextjs` package
- Bypass service layer for any data operations
- Mix Server and Client Component logic inappropriately
- Expose service keys to frontend
- Create services without extending base classes
- Modify existing database migrations
- Use synchronous operations in async contexts
- Fetch data in Client Components without good reason
- **Add @testing-library/user-event or create component integration tests**
- **Create complex integration tests outside of Playwright E2E**

### ✅ ALWAYS DO THESE:
- Use service layer for ALL data operations
- Extend appropriate base classes for services
- Enable RLS on every database table
- Handle errors at the service layer
- Use TypeScript/Python type hints everywhere
- Test critical business logic thoroughly
- Cache expensive operations appropriately
- Follow the established import order
- Use optimistic updates for better UX

## Performance Considerations
- Server Components are faster than Client Components
- Cache expensive computations with "use cache"
- Use dynamic imports for heavy features
- Optimize images with Next.js Image component
- Monitor Web Vitals and Core Web Vitals
- Minimize JavaScript bundle size
- Use proper Suspense boundaries for loading states