# Coding Standards & Style Guide

This document defines the coding standards, design system, and style guidelines for the Vertical Farm project.

## 🎨 Design System Overview

Our design system provides consistency across the entire application through:
- **Design Tokens**: Standardized spacing, colors, typography
- **Utility Classes**: Reusable styling patterns
- **Component Library**: Type-safe, accessible components
- **Mobile-First**: Responsive design approach

## 📐 Design Tokens

### Core Tokens

Located in `frontend/src/app/globals.css`:

```css
/* Farm-specific Design Tokens */
--spacing-plant: 0.75rem;      /* Plant-level spacing */
--spacing-row: 1.5rem;          /* Row-level spacing */
--spacing-rack: 2rem;           /* Rack-level spacing */
--spacing-shelf: 1rem;          /* Shelf-level spacing */
--spacing-sensor: 0.5rem;       /* Sensor spacing */

/* Component Sizes */
--size-plant-icon: 1.5rem;
--size-sensor-icon: 1.25rem;
--size-control-btn: 2.5rem;
--size-status-indicator: 0.5rem;

/* Animation Timing */
--duration-fast: 150ms;
--duration-normal: 250ms;
--duration-slow: 350ms;
--duration-pulse: 2s;

/* Easing Functions */
--ease-farm: cubic-bezier(0.4, 0, 0.2, 1);
--ease-gentle: cubic-bezier(0.25, 0.46, 0.45, 0.94);
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);

/* Typography */
--font-size-plant-label: 0.75rem;
--font-size-sensor-value: 1.125rem;
--font-size-farm-title: 1.5rem;
--font-size-control-label: 0.875rem;

/* Z-Index Layers */
--z-index-farm-overlay: 10;
--z-index-sensor-popup: 20;
--z-index-control-panel: 30;
--z-index-modal: 40;

/* Form & Input Tokens */
--input-height-sm: 2rem;
--input-height-md: 2.5rem;
--input-height-lg: 3rem;
--validation-success: #10b981;
--validation-warning: #f59e0b;
--validation-error: #ef4444;

/* Mobile Touch Targets */
--touch-target-min: 44px;
--touch-spacing: 12px;
```

## 🎯 Frontend Standards (Next.js 15 / React 19)

### Component Architecture

#### Server vs Client Components

```typescript
// DEFAULT: Server Component (no 'use client')
export default async function FarmDashboard({ farmId }: Props) {
  // Can fetch data directly
  const farms = await farmService.getFarmsByUser(userId)
  return <FarmList farms={farms} />
}

// Client Component (interactive features)
'use client'
export function FarmControls({ farm }: Props) {
  const [optimisticState, setOptimisticState] = useOptimistic(farm.state)
  // Handle user interactions
}
```

#### Component Organization

```
components/
├── features/                  # Domain-specific components
│   ├── agriculture/          # Farm management
│   │   ├── FarmCard.tsx
│   │   ├── PlantMonitor.tsx
│   │   └── HarvestSchedule.tsx
│   ├── automation/           # Device control
│   │   ├── DeviceControl.tsx
│   │   ├── SensorPanel.tsx
│   │   └── AutomationRules.tsx
│   └── business/             # Analytics
│       ├── YieldChart.tsx
│       └── CostAnalysis.tsx
├── ui/                       # Reusable UI components
│   ├── Button.tsx
│   ├── Card.tsx
│   └── Modal.tsx
└── layout/                   # Layout components
    ├── Header.tsx
    ├── Sidebar.tsx
    └── Footer.tsx
```

### Styling Patterns

#### Utility Classes

```tsx
// Farm Hierarchy Gradients
<div className="gradient-farm">     {/* Blue gradient for farms */}
<div className="gradient-row">      {/* Green gradient for rows */}
<div className="gradient-rack">     {/* Yellow gradient for racks */}
<div className="gradient-shelf">    {/* Purple gradient for shelves */}

// Typography Utilities
<h1 className="text-farm-title">Farm Dashboard</h1>
<span className="text-sensor-value">24.5°C</span>
<label className="text-control-label">Enable Automation</label>
<small className="text-plant-label">Planted: 2024-01-15</small>

// State Patterns
<div className="state-active">      {/* Green ring, active state */}
<div className="state-maintenance"> {/* Amber ring, maintenance */}
<div className="state-offline">     {/* Red ring, offline */}
<div className="state-growing">     {/* Pulsing animation */}

// Component Utilities
<button className="farm-control-btn">Control</button>
<div className="plant-card">Plant Information</div>
<div className="sensor-panel">Sensor Data</div>
<div className="farm-grid">Grid Layout</div>
<div className="rack-layout">Rack Structure</div>
```

#### Component Styling with CVA

```typescript
import { cva, type VariantProps } from 'class-variance-authority'

const buttonVariants = cva(
  'farm-control-btn transition-all duration-normal ease-farm',
  {
    variants: {
      variant: {
        default: 'bg-white text-gray-900',
        primary: 'gradient-farm text-white',
        maintenance: 'state-maintenance',
        offline: 'state-offline',
        growing: 'state-growing animate-pulse-slow'
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        default: 'h-10 px-4',
        lg: 'h-12 px-6 text-lg touch-target'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
)

export interface ButtonProps 
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  icon?: React.ReactNode
}

export const FarmControlButton = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, icon, children, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        {icon && <span className="mr-2">{icon}</span>}
        {children}
      </button>
    )
  }
)
```

### Form Components

#### Input Component

```typescript
<FarmInput
  label="Plant Name"
  placeholder="Enter plant name..."
  icon={<Leaf className="h-4 w-4" />}
  helpText="Unique identifier for this plant"
  errorText="This field is required"
  validation="error"
  inputSize="lg"
/>
```

#### Select Component

```typescript
<FarmSelect
  label="Plant Species"
  options={[
    { value: "lettuce", label: "Lettuce (Lactuca sativa)" },
    { value: "spinach", label: "Spinach (Spinacia oleracea)" }
  ]}
  placeholder="Select species..."
  helpText="Choose from available plant species"
/>
```

#### Range Slider

```typescript
<FarmRangeSlider
  label="pH Level"
  min={5.0}
  max={7.0}
  step={0.1}
  value={6.2}
  unit=""
  markPoints={[
    { value: 5.5, label: "5.5" },
    { value: 6.0, label: "6.0" },
    { value: 6.5, label: "6.5" }
  ]}
  helpText="Optimal pH for nutrient uptake"
/>
```

### Performance Optimization

```typescript
// Use React 19's "use cache" directive
import { cache } from 'react'

const getCachedFarmData = cache(async (farmId: string) => {
  'use cache'
  cacheLife: 3600 // Cache for 1 hour
  
  const farms = await farmService.getFarmById(farmId)
  return farms
})

// Optimistic updates with useOptimistic
function DeviceToggle({ device }) {
  const [optimisticState, setOptimisticState] = useOptimistic(
    device.isOn,
    (currentState, newState) => newState
  )
  
  async function toggle() {
    setOptimisticState(!optimisticState)
    await deviceService.toggle(device.id)
  }
}
```

## 🐍 Backend Standards (FastAPI / Python 3.13)

### Project Structure

```
backend/app/
├── api/v1/              # API endpoints
│   ├── farms.py
│   ├── devices.py
│   └── analytics.py
├── core/                # Core functionality
│   ├── config.py
│   ├── security.py
│   └── exceptions.py
├── crud/                # Database operations
│   ├── base.py
│   └── farm.py
├── models/              # SQLAlchemy models
│   └── farm.py
├── schemas/             # Pydantic schemas
│   └── farm.py
├── services/            # Business logic
│   ├── base.py
│   └── farm_service.py
└── tests/               # Test files
    ├── unit/
    └── integration/
```

### Code Style

#### Type Hints (Required)

```python
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID

async def get_farm_by_id(
    farm_id: UUID,
    user_id: UUID,
    include_devices: bool = False
) -> Optional[Farm]:
    """
    Retrieve a farm by ID with optional device information.
    
    Args:
        farm_id: The unique identifier of the farm
        user_id: The ID of the requesting user
        include_devices: Whether to include device data
        
    Returns:
        Farm object if found and user has access, None otherwise
        
    Raises:
        PermissionError: If user lacks access to the farm
    """
    pass
```

#### Async Patterns

```python
# Always use async/await for I/O operations
async def create_farm(farm_data: FarmCreate) -> Farm:
    async with get_db() as db:
        farm = Farm(**farm_data.dict())
        db.add(farm)
        await db.commit()
        await db.refresh(farm)
        return farm

# Use asyncio for concurrent operations
async def process_sensor_data(sensor_ids: List[UUID]):
    tasks = [
        fetch_sensor_data(sensor_id) 
        for sensor_id in sensor_ids
    ]
    results = await asyncio.gather(*tasks)
    return results
```

#### Error Handling

```python
from fastapi import HTTPException, status

class FarmService:
    async def update_farm(
        self,
        farm_id: UUID,
        farm_update: FarmUpdate,
        user_id: UUID
    ) -> Farm:
        try:
            farm = await self.get_farm(farm_id, user_id)
            if not farm:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Farm {farm_id} not found"
                )
            
            # Update logic
            return updated_farm
            
        except IntegrityError as e:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Farm name already exists"
            )
        except Exception as e:
            logger.error(f"Error updating farm {farm_id}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update farm"
            )
```

#### Pydantic Models

```python
from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime

class FarmBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    location: Optional[str] = Field(None, max_length=200)
    size_sqm: float = Field(..., gt=0, le=10000)
    
    @validator('name')
    def validate_name(cls, v):
        if not v.strip():
            raise ValueError('Farm name cannot be empty')
        return v.strip()

class FarmCreate(FarmBase):
    pass

class Farm(FarmBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True  # Python 3.13 Pydantic v2
```

### API Design

```python
from fastapi import APIRouter, Depends, Query
from typing import List, Optional

router = APIRouter(prefix="/api/v1/farms", tags=["farms"])

@router.get("/", response_model=List[FarmResponse])
async def list_farms(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    search: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> List[Farm]:
    """
    List all farms accessible to the current user.
    
    - **skip**: Number of records to skip (pagination)
    - **limit**: Maximum number of records to return
    - **search**: Optional search term for farm name
    """
    service = FarmService(db)
    return await service.list_user_farms(
        user_id=current_user.id,
        skip=skip,
        limit=limit,
        search=search
    )
```

## 🗄️ Database Standards (Supabase/PostgreSQL)

### Migration Naming

```sql
-- Format: YYYYMMDDHHMMSS_descriptive_name.sql
-- Example: 20240115143000_add_sensor_calibration_table.sql

-- Always include up and down migrations
-- UP Migration
CREATE TABLE sensor_calibration (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sensor_id UUID NOT NULL REFERENCES sensors(id) ON DELETE CASCADE,
    calibrated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    calibration_data JSONB NOT NULL,
    created_by UUID NOT NULL REFERENCES auth.users(id)
);

-- Create indexes for foreign keys
CREATE INDEX idx_sensor_calibration_sensor_id ON sensor_calibration(sensor_id);
CREATE INDEX idx_sensor_calibration_created_by ON sensor_calibration(created_by);

-- DOWN Migration (commented)
-- DROP TABLE IF EXISTS sensor_calibration;
```

### Row Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE farms ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own farms
CREATE POLICY "Users can view own farms" ON farms
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Policy: Users can create farms for themselves
CREATE POLICY "Users can create own farms" ON farms
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Policy: Users can update their own farms
CREATE POLICY "Users can update own farms" ON farms
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Policy: Users can delete their own farms
CREATE POLICY "Users can delete own farms" ON farms
    FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());
```

## 📱 Mobile-First Design

### Responsive Utilities

```css
/* Mobile-first breakpoints */
/* Default: Mobile (<640px) */
/* sm: 640px+ */
/* md: 768px+ */
/* lg: 1024px+ */
/* xl: 1280px+ */

/* Mobile container with appropriate padding */
.mobile-container {
  padding: var(--spacing-plant);
  max-width: 100%;
}

/* Touch-friendly targets */
.touch-target {
  min-height: var(--touch-target-min);
  min-width: var(--touch-target-min);
  padding: var(--touch-spacing);
}

/* Mobile stack layout */
.mobile-stack {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-row);
}

/* Responsive grid */
.mobile-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-plant);
}

@media (min-width: 640px) {
  .mobile-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .mobile-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

### Touch Optimization

```typescript
// Large touch targets for mobile
<FarmControlButton 
  size="lg"  // Uses touch-target class
  variant="primary"
  onClick={handleAction}
>
  Control Device
</FarmControlButton>

// Mobile-optimized forms
<form className="mobile-stack">
  <FarmInput 
    inputSize="lg"
    label="Temperature"
    type="number"
    inputMode="decimal"  // Mobile keyboard optimization
  />
  <FarmSelect 
    inputSize="lg"
    options={options}
  />
  <FarmControlButton size="lg" type="submit">
    Save Settings
  </FarmControlButton>
</form>
```

## ✅ Code Review Checklist

### Frontend
- [ ] Server Components used by default
- [ ] Service layer pattern followed (no direct Supabase calls)
- [ ] Proper error handling with user-friendly messages
- [ ] TypeScript types for all props and returns
- [ ] Accessibility: ARIA labels, keyboard navigation
- [ ] Mobile responsive design tested
- [ ] Performance: No unnecessary re-renders
- [ ] Design tokens used instead of hardcoded values

### Backend
- [ ] Type hints on all functions
- [ ] Async/await used consistently
- [ ] Proper error handling with appropriate HTTP status codes
- [ ] Pydantic models for request/response validation
- [ ] Database queries optimized with proper indexes
- [ ] RLS policies implemented for new tables
- [ ] API documentation updated
- [ ] Unit tests for business logic

### General
- [ ] No sensitive data in code
- [ ] Environment variables used for configuration
- [ ] Code follows established patterns
- [ ] Tests written and passing
- [ ] Documentation updated
- [ ] No console.log or print statements
- [ ] Imports properly organized

## 🚀 Performance Guidelines

### Frontend Performance
- Lighthouse score >90 for all metrics
- First Contentful Paint <1.5s
- Time to Interactive <3.5s
- Bundle size monitored and optimized
- Images optimized with Next.js Image component
- Code splitting with dynamic imports

### Backend Performance
- API response time <200ms (p95)
- Database queries <50ms for indexed queries
- Proper caching strategy implemented
- Connection pooling configured
- Background tasks for heavy operations
- Rate limiting on public endpoints

### Database Performance
- Indexes on all foreign keys
- Composite indexes for common query patterns
- EXPLAIN ANALYZE on complex queries
- Vacuum and analyze scheduled regularly
- Connection pooling via Supavisor
- Query result caching where appropriate

---

*This style guide is a living document. Propose changes via pull request with justification for the modification.*