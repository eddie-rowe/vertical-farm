# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a full-stack vertical farming management platform combining a Next.js 15 frontend with a Python FastAPI backend, using Supabase for database/auth and Cloudflare Workers for edge computing.

**Key Stack:**
- Frontend: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Supabase client
- Backend: FastAPI (Python 3.13), Supabase, PostgreSQL, JWT auth
- Infrastructure: Docker, Cloudflare Workers, GitHub Actions

## CRITICAL ARCHITECTURE PATTERNS

### 🚨 Service Layer - MANDATORY
- **NEVER bypass service layer** - All data operations MUST go through services
- **Singleton pattern REQUIRED** - Use `getInstance()` methods
- **Base class inheritance** - Extend BaseService, BaseCRUDService
- **Error handling** - Services handle all errors, components show UI
- **Validation** - All input validation happens in services

```typescript
// ✅ CORRECT: Always use service layer
const farmService = FarmService.getInstance()
const farms = await farmService.getFarmsByUser(userId)

// ❌ WRONG: Never direct Supabase calls in components
const supabase = createClient()
const { data } = await supabase.from('farms').select('*')  // FORBIDDEN
```

### 🔐 Supabase & Authentication
- **Package**: Use `@supabase/ssr` (NOT `@supabase/auth-helpers-nextjs`)
- **RLS Mandatory**: Every table MUST have Row Level Security enabled
- **Context-aware clients**: Different clients for server vs browser
- **Never expose service keys** to frontend

```typescript
// Client creation patterns
// Browser: createClient() from '@/utils/supabase/client'
// Server: createClient() from '@/utils/supabase/server'

// RLS Policy pattern
CREATE POLICY "Users see own farms" ON farms
FOR SELECT TO authenticated
USING ((SELECT auth.uid()) = user_id);
```

### ⚛️ Next.js 15 & React 19 Patterns
- **Server Components by default** - Add 'use client' only when needed
- **Use "use cache" directive** for expensive operations
- **Suspense boundaries** for loading states
- **useOptimistic** for instant UI feedback
- **Server Actions** for mutations

```typescript
// Server Component with caching
export default async function FarmDashboard({ farmId }: { farmId: string }) {
  const farms = await getCachedFarmData(farmId)  // Uses "use cache"
  return <FarmView farms={farms} />
}

// Client Component with optimistic updates
'use client'
export function DeviceControl({ device }: { device: Device }) {
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(device.status)
  // Handle user interactions
}
```

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
```typescript
// Required import order:
// 1. Node built-ins
import fs from 'fs'

// 2. React/Next.js
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

// 3. External packages
import { createClient } from '@supabase/supabase-js'
import clsx from 'clsx'

// 4. Internal - Services (most important)
import { FarmService } from '@/services/domain/farm/FarmService'

// 5. Internal - Types
import type { Farm } from '@/types/farm'

// 6. Internal - Components
import { Button } from '@/components/ui/Button'

// 7. Relative imports
import { FarmCard } from './FarmCard'
import styles from './Farm.module.css'
```

### Performance Optimization
- **"use cache" directive** for expensive server operations
- **cacheLife configuration** for different data types
- **Dynamic imports** for code splitting
- **useOptimistic** for instant UI updates
- **Image optimization** with Next.js Image component
- **Bundle analysis** with webpack optimizations

## Key Development Rules

1. **NEVER bypass service layer** - All data operations must go through services
2. **Use modern auth patterns** - `@supabase/ssr` for frontend, JWT + RLS for backend
3. **Follow App Router conventions** - Server Components by default, client when needed
4. **Type everything** - TypeScript/Python type hints required
5. **Test critical paths** - Services, authentication, data operations
6. **Handle errors gracefully** - At service layer, display appropriately in UI
7. **Use RLS policies** - All database access respects Row Level Security
8. **Cache aggressively** - Use Next.js 15 caching features
9. **Optimize imports** - Follow import order standards
10. **Component composition** - Build complex UIs from simple, reusable pieces

## Testing Strategy
- **Test Pyramid**: More unit tests, fewer integration tests, minimal E2E
- **Service-focused**: Test business logic in services, not UI implementation
- **Mock external dependencies**: Isolate tests from external systems
- **Coverage goals**: 80% for critical paths, 60% overall

### Frontend Testing
- **Unit**: Vitest for components and hooks
- **E2E**: Playwright for critical user flows
- **Performance**: Web Vitals monitoring

### Backend Testing
- **Unit**: Pytest with async support
- **Integration**: Multi-component tests
- **API**: Endpoint contract testing
- **Performance**: Load tests with markers

## Environment Setup

### Required Environment Variables
- `SUPABASE_URL` and `SUPABASE_ANON_KEY` (both frontend/backend)
- `SUPABASE_SERVICE_KEY` (backend only - NEVER expose to frontend)
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (frontend)

### Development Workflow
1. **Backend changes**: Test with `./run_tests.sh` before committing
2. **Frontend changes**: Run `npm run lint` and `npm test`
3. **Database changes**: Create migration in `supabase/migrations/`
4. **Full stack**: Use `make test-all` to verify everything works
5. **Service changes**: Update both frontend and backend services simultaneously

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