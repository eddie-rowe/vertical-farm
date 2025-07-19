# Configurable Farm Area System

A flexible, composable architecture for rendering farm areas (growing areas and germination tents) with full configuration control over layout, interactions, content, overlays, and modals.

## Overview

This system replaces both `UnifiedFarmView` and `FarmAreaGrid` with a single, configurable `FarmAreaRenderer` that can adapt to any use case through configuration.

## Quick Start

```typescript
import { FarmAreaRenderer, createFarmAreaConfig } from './composable/FarmAreaRenderer'

function MyFarmPage() {
  const rows = [...] // Your row data
  const config = createFarmAreaConfig('grow_area', 'standard')

  return (
    <FarmAreaRenderer
      rows={rows}
      areaType="grow_area"
      configuration={config}
      onRowSelect={(row) => console.log('Selected:', row)}
      onDoubleClick={(element, type) => console.log('Double-clicked:', type, element)}
    />
  )
}
```

## Architecture

### Core Components

1. **FarmAreaRenderer** - Main component that coordinates all layers
2. **FarmAreaProvider** - State management using React Context + useReducer
3. **Layer Components** - Modular rendering layers (Layout, Interaction, Content)
4. **Configuration System** - Type-safe configuration objects for customization

### Layer Architecture

```
FarmAreaRenderer
├── FarmAreaProvider (State Management)
└── InteractionLayer (Event handling, selections, tooltips)
    └── ContentLayer (Visual content rendering)
        └── LayoutLayer (Grid layout, responsive design)
            └── Individual Components (Rows → Racks → Shelves)
```

## Configurations

### Growing Areas

Available presets:

- `standard` - Full-featured with all capabilities
- `simple` - Basic functionality for smaller operations
- `commercial` - High-density layout for commercial farms
- `research` - Enhanced tracking for research environments

```typescript
import { getGrowingAreaConfig } from "./configurations/growingAreaConfig";

const config = getGrowingAreaConfig("commercial");
```

### Germination Tents

Available presets:

- `standard` - Full germination tracking capabilities
- `compact` - Space-efficient for smaller setups
- `research` - Detailed tracking for research
- `production` - Batch tracking for commercial production
- `hobby` - Simplified for hobbyists

```typescript
import { getGerminationAreaConfig } from "./configurations/germinationAreaConfig";

const config = getGerminationAreaConfig("research");
```

## Configuration Structure

Each configuration defines:

```typescript
interface AreaConfiguration {
  areaType: "grow_area" | "germination_tent";
  name: string;
  description: string;

  layout: LayoutConfig; // Grid layout, responsive design
  interactions: InteractionConfig; // Click/drag/keyboard behavior
  content: ContentConfig; // What information to show
  overlays: OverlayConfig[]; // Data overlay layers
  modals: ModalConfig[]; // Modal dialogs and editors
}
```

### Layout Configuration

Controls grid layout, spacing, and responsive behavior:

```typescript
layout: {
  enableRackGrid: true,
  showShelfDetails: true,
  responsive: {
    gridCols: { sm: 1, md: 2, lg: 3, xl: 4, '2xl': 5 },
    adaptiveLayout: true,
    showDetailsBreakpoint: 'md'
  },
  spacing: {
    areaGap: 'gap-6',
    rackGap: 'gap-4',
    shelfGap: 'gap-2',
    containerPadding: 'p-6'
  }
}
```

### Interaction Configuration

Defines user interaction capabilities:

```typescript
interactions: {
  enableDoubleClick: true,
  enableContextMenu: true,
  enableDragDrop: true,
  enableSelection: true,
  selectionMode: 'single', // 'single' | 'multiple' | 'none'
  enableKeyboardNav: true,
  enableTooltips: true,
  clickActions: [
    { target: 'rack', action: 'edit', enabled: true },
    { target: 'shelf', action: 'select', enabled: true }
  ]
}
```

### Content Configuration

Controls what information is displayed:

```typescript
content: {
  showDevices: true,
  showStatus: true,
  showMetrics: true,
  enableDensityView: true,
  contentStyle: 'detailed', // 'minimal' | 'standard' | 'detailed'
  customRenderers: []
}
```

### Overlay Configuration

Defines data overlay layers (devices, monitoring data, etc.):

```typescript
overlays: [
  {
    id: "devices",
    name: "Device Status",
    enabled: true,
    defaultVisible: true,
    layer: "devices",
    opacity: 1.0,
    zIndex: 10,
  },
];
```

### Modal Configuration

Configures modal dialogs and editors:

```typescript
modals: [
  {
    id: "elementDetail",
    name: "Element Detail Editor",
    enabled: true,
    trigger: "double-click",
    target: "rack",
    component: "ElementDetailModal",
    size: "lg",
  },
];
```

## State Management

The system uses React Context + useReducer for predictable state management:

```typescript
// Available in any child component
const { state, actions, configuration } = useFarmArea();

// Available actions
actions.selectRow(row);
actions.selectRack(rack);
actions.selectShelf(shelf);
actions.toggleOverlay("devices");
actions.showModal("elementDetail");
actions.setEditMode(true);
```

## Migration Guide

### From UnifiedFarmView

Replace:

```typescript
<UnifiedFarmView rows={rows} />
```

With:

```typescript
<FarmAreaRenderer
  rows={rows}
  areaType="grow_area"
  configuration={getGrowingAreaConfig('standard')}
/>
```

### From FarmAreaGrid

Replace:

```typescript
<FarmAreaGrid rows={rows} areaType="germination_tent" />
```

With:

```typescript
<FarmAreaRenderer
  rows={rows}
  areaType="germination_tent"
  configuration={getGerminationAreaConfig('standard')}
/>
```

## Advanced Usage

### Custom Configuration

Create custom configurations by extending existing ones:

```typescript
const customConfig: AreaConfiguration = {
  ...getGrowingAreaConfig("standard"),
  name: "Custom Growing Area",
  interactions: {
    ...getGrowingAreaConfig("standard").interactions,
    enableDragDrop: false,
  },
  content: {
    ...getGrowingAreaConfig("standard").content,
    contentStyle: "minimal",
  },
};
```

### Multiple Area Types in One Page

```typescript
function FarmManagementPage() {
  const growingConfig = getGrowingAreaConfig('commercial')
  const germinationConfig = getGerminationAreaConfig('production')

  return (
    <div className="space-y-8">
      <section>
        <h2>Growing Areas</h2>
        <FarmAreaRenderer
          rows={growingRows}
          areaType="grow_area"
          configuration={growingConfig}
        />
      </section>

      <section>
        <h2>Germination Tents</h2>
        <FarmAreaRenderer
          rows={germinationRows}
          areaType="germination_tent"
          configuration={germinationConfig}
        />
      </section>
    </div>
  )
}
```

### Dynamic Configuration Switching

```typescript
function ConfigurableFarmView() {
  const [preset, setPreset] = useState('standard')
  const config = getGrowingAreaConfig(preset)

  return (
    <div>
      <select value={preset} onChange={(e) => setPreset(e.target.value)}>
        <option value="standard">Standard</option>
        <option value="simple">Simple</option>
        <option value="commercial">Commercial</option>
        <option value="research">Research</option>
      </select>

      <FarmAreaRenderer
        rows={rows}
        areaType="grow_area"
        configuration={config}
      />
    </div>
  )
}
```

## Next Steps

To complete the implementation:

1. **Create Layer Components** - Build the actual LayoutLayer, InteractionLayer, and ContentLayer components
2. **Implement Missing Components** - Create the modal components referenced in configurations
3. **Add Advanced Features** - Implement overlay rendering, drag-and-drop, keyboard navigation
4. **Performance Optimization** - Add virtualization, memoization, and other optimizations
5. **Testing** - Add comprehensive tests for all configurations and interactions

## File Structure

```
composable/
├── FarmAreaRenderer.tsx          # Main renderer component
├── providers/
│   └── FarmAreaProvider.tsx      # State management
├── layers/
│   ├── LayoutLayer.tsx           # Grid layout management
│   ├── InteractionLayer.tsx      # Event handling
│   └── ContentLayer.tsx          # Content rendering
├── configurations/
│   ├── types.ts                  # Type definitions
│   ├── growingAreaConfig.ts      # Growing area configurations
│   └── germinationAreaConfig.ts  # Germination configurations
└── README.md                     # This documentation
```

This system provides a solid foundation for flexible, maintainable farm area rendering that can grow with your application's needs while maintaining type safety and consistent user experience.
