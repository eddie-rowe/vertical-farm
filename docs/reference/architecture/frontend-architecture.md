# Frontend Architecture

## Overview

The VerticalFarm OS frontend is a sophisticated Next.js 15 application leveraging React 19's latest features, TypeScript for type safety, and modern UI frameworks. This document details the architecture, patterns, and best practices for frontend development.

## Technology Stack

### Core Technologies
- **Next.js 15** - React framework with App Router
- **React 19** - Latest React with concurrent features
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - High-quality component library
- **Supabase Client** - Database and auth client

### Supporting Libraries
- **Radix UI** - Headless UI primitives
- **Lucide Icons** - Icon library
- **Class Variance Authority** - Variant styling
- **React Hook Form** - Form management
- **Zod** - Schema validation

## Application Structure

### Directory Organization

```
frontend/src/
├── app/                        # Next.js App Router
│   ├── (auth)/                # Public authentication routes
│   │   ├── login/
│   │   ├── signup/
│   │   └── reset-password/
│   ├── (app)/                 # Protected application routes
│   │   ├── dashboard/
│   │   ├── farms/
│   │   ├── devices/
│   │   └── settings/
│   ├── api/                   # API routes
│   ├── layout.tsx             # Root layout
│   └── globals.css            # Global styles
├── components/
│   ├── features/              # Domain-specific components
│   │   ├── agriculture/       # Farm management
│   │   ├── automation/        # Automation controls
│   │   ├── monitoring/        # Sensor displays
│   │   └── business/          # Analytics
│   ├── ui/                    # Reusable UI components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   └── ...
│   ├── layout/               # Layout components
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── Footer.tsx
│   └── overlays/             # Layer overlay components
│       ├── DeviceOverlay.tsx
│       ├── MonitoringOverlay.tsx
│       └── AutomationOverlay.tsx
├── services/                  # Service layer (CRITICAL)
│   ├── core/
│   │   ├── BaseService.ts
│   │   ├── AuthService.ts
│   │   └── ErrorService.ts
│   └── domain/
│       ├── farm/
│       ├── device/
│       └── automation/
├── hooks/                     # Custom React hooks
│   ├── useAuth.ts
│   ├── useFarms.ts
│   ├── useRealtime.ts
│   └── useOptimistic.ts
├── contexts/                  # React Context providers
│   ├── AuthContext.tsx
│   ├── ThemeContext.tsx
│   ├── LayerContext.tsx
│   └── NotificationContext.tsx
├── types/                     # TypeScript definitions
│   ├── database.types.ts     # Generated from Supabase
│   ├── api.types.ts
│   └── app.types.ts
├── utils/                     # Utility functions
│   ├── supabase/
│   │   ├── client.ts
│   │   └── server.ts
│   ├── formatting.ts
│   └── validation.ts
└── styles/                    # Additional styles
    └── animations.css
```

## Component Architecture

### Component Categories

#### 1. **Page Components** (Server Components by default)
```tsx
// app/(app)/farms/page.tsx
export default async function FarmsPage() {
  // Server-side data fetching
  const session = await getServerSession()
  const initialFarms = await getFarmsByUser(session.user.id)
  
  return (
    <FarmPageClient 
      initialFarms={initialFarms}
      userId={session.user.id}
    />
  )
}
```

#### 2. **Client Components** (Interactive UI)
```tsx
'use client'

export function FarmPageClient({ initialFarms, userId }) {
  const [farms, setFarms] = useState(initialFarms)
  const farmService = FarmService.getInstance()
  
  // Real-time subscriptions
  useEffect(() => {
    const subscription = subscribeToFarmUpdates(userId, (update) => {
      setFarms(prev => updateFarmInList(prev, update))
    })
    
    return () => subscription.unsubscribe()
  }, [userId])
  
  return <FarmList farms={farms} />
}
```

#### 3. **Feature Components** (Business logic)
```tsx
// components/features/agriculture/FarmManager.tsx
export function FarmManager({ farm }: { farm: Farm }) {
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  
  const handleUpdate = async (updates: Partial<Farm>) => {
    try {
      await farmService.updateFarm(farm.id, updates)
      toast.success('Farm updated successfully')
    } catch (error) {
      toast.error('Failed to update farm')
    }
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{farm.name}</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Farm management UI */}
      </CardContent>
    </Card>
  )
}
```

#### 4. **UI Components** (Reusable primitives)
```tsx
// components/ui/button.tsx
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export function Button({ className, variant, size, ...props }) {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}
```

## State Management

### 1. **Server State** (From database)
```tsx
// Using React Query with service layer
export function useFarms(userId: string) {
  const farmService = FarmService.getInstance()
  
  return useQuery({
    queryKey: ['farms', userId],
    queryFn: () => farmService.getFarmsByUser(userId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
```

### 2. **Client State** (UI state)
```tsx
// Local component state
const [isOpen, setIsOpen] = useState(false)
const [selectedItem, setSelectedItem] = useState<Item | null>(null)
```

### 3. **Global State** (Context API)
```tsx
// contexts/AuthContext.tsx
export function AuthProvider({ children }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  
  useEffect(() => {
    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
      }
    )
    
    return () => subscription.unsubscribe()
  }, [])
  
  return (
    <AuthContext.Provider value={{ user, session }}>
      {children}
    </AuthContext.Provider>
  )
}
```

### 4. **Optimistic Updates** (React 19)
```tsx
export function DeviceControl({ device }) {
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(
    device.status,
    (currentStatus, newStatus) => newStatus
  )
  
  const toggleDevice = async () => {
    const newStatus = !optimisticStatus
    
    // Update UI immediately
    setOptimisticStatus(newStatus)
    
    try {
      // Update backend
      await deviceService.updateStatus(device.id, newStatus)
    } catch (error) {
      // Revert on error
      setOptimisticStatus(!newStatus)
      toast.error('Failed to update device')
    }
  }
  
  return (
    <Switch
      checked={optimisticStatus}
      onCheckedChange={toggleDevice}
    />
  )
}
```

## Routing Architecture

### App Router Structure
```
app/
├── (auth)/                    # Auth group - public routes
│   ├── layout.tsx            # Auth-specific layout
│   ├── login/page.tsx
│   └── signup/page.tsx
├── (app)/                     # App group - protected routes
│   ├── layout.tsx            # App layout with sidebar
│   ├── dashboard/page.tsx
│   └── farms/
│       ├── page.tsx          # Farm list
│       └── [id]/
│           ├── page.tsx      # Farm details
│           └── edit/page.tsx # Farm editor
└── api/                       # API routes
    └── webhooks/
        └── stripe/route.ts
```

### Route Protection
```tsx
// app/(app)/layout.tsx
export default async function AppLayout({ children }) {
  const session = await getServerSession()
  
  if (!session) {
    redirect('/login')
  }
  
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
```

### Dynamic Routes
```tsx
// app/(app)/farms/[id]/page.tsx
export default async function FarmPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  const farm = await farmService.getFarmById(params.id)
  
  if (!farm) {
    notFound()
  }
  
  return <FarmDetails farm={farm} />
}
```

## Data Fetching Patterns

### 1. **Server-Side Fetching** (Recommended)
```tsx
// Server Component
export default async function Page() {
  const data = await fetchData() // Direct database call
  return <ClientComponent initialData={data} />
}
```

### 2. **Client-Side Fetching** (When needed)
```tsx
'use client'

export function ClientComponent() {
  const { data, error, isLoading } = useSWR(
    '/api/data',
    fetcher
  )
  
  if (isLoading) return <Skeleton />
  if (error) return <Error />
  
  return <DataDisplay data={data} />
}
```

### 3. **Real-Time Subscriptions**
```tsx
export function useRealtimeData(channel: string) {
  const [data, setData] = useState([])
  
  useEffect(() => {
    const subscription = supabase
      .channel(channel)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'sensor_readings'
      }, (payload) => {
        setData(prev => [...prev, payload.new])
      })
      .subscribe()
    
    return () => {
      subscription.unsubscribe()
    }
  }, [channel])
  
  return data
}
```

### 4. **Parallel Data Loading**
```tsx
export default async function DashboardPage() {
  // Load data in parallel
  const [farms, devices, alerts] = await Promise.all([
    farmService.getFarms(),
    deviceService.getDevices(),
    alertService.getActiveAlerts()
  ])
  
  return (
    <Dashboard
      farms={farms}
      devices={devices}
      alerts={alerts}
    />
  )
}
```

## Performance Optimization

### 1. **React 19 Features**
```tsx
// Use cache directive
import { cache } from 'react'

const getCachedFarmData = cache(async (farmId: string) => {
  'use cache'
  return await farmService.getFarmById(farmId)
})

// Suspense boundaries
export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <AsyncComponent />
    </Suspense>
  )
}
```

### 2. **Code Splitting**
```tsx
// Dynamic imports
const HeavyComponent = dynamic(
  () => import('./HeavyComponent'),
  { 
    loading: () => <Skeleton />,
    ssr: false 
  }
)
```

### 3. **Image Optimization**
```tsx
import Image from 'next/image'

export function OptimizedImage() {
  return (
    <Image
      src="/farm-image.jpg"
      alt="Farm"
      width={800}
      height={600}
      priority
      placeholder="blur"
      blurDataURL={blurDataUrl}
    />
  )
}
```

### 4. **Bundle Optimization**
```javascript
// next.config.js
module.exports = {
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', '@radix-ui/react-*']
  },
  webpack: (config) => {
    config.optimization.splitChunks = {
      chunks: 'all',
      cacheGroups: {
        default: false,
        vendors: false,
        vendor: {
          name: 'vendor',
          chunks: 'all',
          test: /node_modules/
        }
      }
    }
    return config
  }
}
```

## Styling Architecture

### Tailwind CSS Configuration
```javascript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        // ... more custom colors
      },
      animation: {
        'slide-in': 'slideIn 0.2s ease-out',
        'fade-in': 'fadeIn 0.3s ease-in',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
```

### CSS Variables for Theming
```css
/* globals.css */
:root {
  --primary: 142.1 76.2% 36.3%;
  --primary-foreground: 355.7 100% 97.3%;
  --secondary: 240 4.8% 95.9%;
  --secondary-foreground: 240 5.9% 10%;
  /* ... more variables */
}

.dark {
  --primary: 142.1 70.6% 45.3%;
  --primary-foreground: 144.9 80.4% 10%;
  /* ... dark mode variables */
}
```

### Component Styling Patterns
```tsx
// Using cn utility for conditional classes
import { cn } from '@/lib/utils'

export function Card({ className, ...props }) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-card text-card-foreground shadow-sm",
        className
      )}
      {...props}
    />
  )
}
```

## Error Handling

### Error Boundaries
```tsx
// components/ErrorBoundary.tsx
export class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null }
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  
  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
    // Send to error tracking service
    errorService.logError(error, errorInfo)
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />
    }
    
    return this.props.children
  }
}
```

### Service Layer Error Handling
```tsx
// Centralized error handling in services
try {
  const result = await farmService.createFarm(data)
  toast.success('Farm created successfully')
  return result
} catch (error) {
  if (error instanceof ValidationError) {
    toast.error(error.message)
  } else if (error instanceof NetworkError) {
    toast.error('Network error. Please try again.')
  } else {
    toast.error('An unexpected error occurred')
    errorService.logError(error)
  }
  throw error
}
```

## Testing Strategy

### Component Testing
```tsx
// __tests__/FarmCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { FarmCard } from '@/components/FarmCard'

describe('FarmCard', () => {
  const mockFarm = {
    id: '1',
    name: 'Test Farm',
    location: 'Test Location'
  }
  
  it('renders farm information', () => {
    render(<FarmCard farm={mockFarm} />)
    
    expect(screen.getByText('Test Farm')).toBeInTheDocument()
    expect(screen.getByText('Test Location')).toBeInTheDocument()
  })
  
  it('handles click events', () => {
    const handleClick = jest.fn()
    render(<FarmCard farm={mockFarm} onClick={handleClick} />)
    
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledWith(mockFarm)
  })
})
```

### Integration Testing
```tsx
// __tests__/integration/FarmCreation.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FarmCreationFlow } from '@/components/FarmCreationFlow'

describe('Farm Creation Flow', () => {
  it('creates a new farm successfully', async () => {
    const user = userEvent.setup()
    render(<FarmCreationFlow />)
    
    // Fill form
    await user.type(screen.getByLabelText('Farm Name'), 'New Farm')
    await user.type(screen.getByLabelText('Location'), 'New York')
    
    // Submit
    await user.click(screen.getByRole('button', { name: 'Create Farm' }))
    
    // Verify success
    await waitFor(() => {
      expect(screen.getByText('Farm created successfully')).toBeInTheDocument()
    })
  })
})
```

## Accessibility

### ARIA Attributes
```tsx
export function AccessibleForm() {
  return (
    <form aria-label="Create farm form">
      <label htmlFor="farm-name">
        Farm Name
        <span aria-label="required">*</span>
      </label>
      <input
        id="farm-name"
        aria-required="true"
        aria-invalid={errors.name ? 'true' : 'false'}
        aria-describedby="name-error"
      />
      {errors.name && (
        <span id="name-error" role="alert">
          {errors.name.message}
        </span>
      )}
    </form>
  )
}
```

### Keyboard Navigation
```tsx
export function KeyboardNavigableList({ items }) {
  const [focusedIndex, setFocusedIndex] = useState(0)
  
  const handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        setFocusedIndex(prev => 
          Math.min(prev + 1, items.length - 1)
        )
        break
      case 'ArrowUp':
        setFocusedIndex(prev => Math.max(prev - 1, 0))
        break
      case 'Enter':
        handleSelect(items[focusedIndex])
        break
    }
  }
  
  return (
    <ul role="listbox" onKeyDown={handleKeyDown}>
      {items.map((item, index) => (
        <li
          key={item.id}
          role="option"
          tabIndex={index === focusedIndex ? 0 : -1}
          aria-selected={index === focusedIndex}
        >
          {item.name}
        </li>
      ))}
    </ul>
  )
}
```

## Development Best Practices

### 1. **Component Guidelines**
- Prefer Server Components for pages
- Use Client Components only when needed
- Keep components focused and single-purpose
- Extract reusable logic into hooks
- Use TypeScript for all components

### 2. **Performance Guidelines**
- Lazy load heavy components
- Use Suspense boundaries appropriately
- Optimize images with Next.js Image
- Minimize client-side JavaScript
- Cache expensive operations

### 3. **Code Organization**
- Group related components together
- Use barrel exports for cleaner imports
- Keep files under 200 lines when possible
- Separate concerns (UI, logic, types)
- Document complex components

### 4. **Testing Guidelines**
- Test user interactions, not implementation
- Use integration tests for flows
- Mock external services
- Maintain > 80% coverage for critical paths
- Use snapshot tests sparingly

## Summary

The frontend architecture is designed for:
- **Performance** - Fast initial loads and interactions
- **Scalability** - Clean component organization
- **Maintainability** - Clear patterns and conventions
- **Developer Experience** - Modern tooling and practices
- **User Experience** - Responsive, accessible, and intuitive

Follow these patterns and guidelines to maintain consistency and quality across the frontend codebase.

---

*For frontend-specific questions or architectural decisions, consult the frontend team lead or submit proposals for review.*