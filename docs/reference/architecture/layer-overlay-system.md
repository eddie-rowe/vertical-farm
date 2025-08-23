# Visual Layer Overlay System

## Overview

The farm management system uses a **visual overlay architecture** that allows multiple information layers to be displayed simultaneously on top of the base farm structure. This approach provides better spatial context and user experience compared to traditional tab-based switching.

## Architecture Concept

### Base Layer (Always Visible)
- **Farm Structure**: Rows, racks, and shelves with their hierarchical layout
- **Navigation**: Farm selection, creation, and basic management tools
- **Core Functionality**: InlineEditor, selection states, context actions

### Information Overlays (Toggleable)
Multiple overlays can be active simultaneously, each showing different aspects of the farm:

1. **Device Layer** (`z-index: 20`)
   - Device indicators positioned on shelves/racks
   - Real-time device states (on/off/unknown)  
   - Quick device controls panel
   - Device assignment visualization

2. **Automation Layer** (`z-index: 30`)
   - Automation rule indicators
   - Schedule and condition status
   - Rule execution history
   - Automation control panel

3. **Monitoring Layer** (`z-index: 40`)
   - Environmental sensor data
   - Health score indicators
   - Alert notifications with animation
   - Live monitoring dashboard

4. **Analytics Layer** (`z-index: 50`)
   - Performance metrics overlay
   - Trend analysis indicators
   - Optimization recommendations
   - Currently shows "Coming Soon" placeholder

## Implementation Details

### Context Management
```typescript
// LayerContext.tsx
interface LayerState {
  isActive: boolean;
  alertCount: number;
}

interface LayerContextType {
  layers: Record<LayerType, LayerState>;
  toggleLayer: (layer: LayerType) => void;
  setLayerAlertCount: (layer: LayerType, count: number) => void;
  getActiveLayerCount: () => number;
  isLayerActive: (layer: LayerType) => boolean;
}
```

### Layer Switcher
- **Desktop**: Checkbox-based panel with 2x2 grid
- **Mobile**: Collapsible dropdown with checkboxes
- **Features**: 
  - Alert count badges
  - Coming soon indicators
  - Real-time active layer count
  - Responsive design

### Overlay Components
Each overlay component follows the same pattern:

```typescript
interface OverlayProps {
  farmData: FarmPageData | null;
  selectedRow?: Row | null;
  selectedRack?: Rack | null;
  selectedShelf?: Shelf | null;
}

// Positioned absolutely with pointer-events-none
// Individual interactive elements use pointer-events-auto
```

### UnifiedFarmView Integration
```typescript
// Overlays are conditionally rendered based on layer state
{isLayerActive('devices') && <DeviceOverlay {...props} />}
{isLayerActive('automation') && <AutomationOverlay {...props} />}
{isLayerActive('monitoring') && <MonitoringOverlay {...props} />}
{isLayerActive('analytics') && <AnalyticsOverlay {...props} />}
```

## Key Benefits

### 1. Spatial Context Preservation
- Farm structure remains visible at all times
- Information is positioned relative to physical locations
- Users never lose their spatial orientation

### 2. Multi-Layer Visualization
- Multiple overlays can be active simultaneously
- Example: Monitor environmental data while viewing automation rules
- Layered information like professional mapping software

### 3. Intuitive Interaction
- Checkbox-based layer controls (like Photoshop/GIS tools)
- Floating control panels don't obscure farm structure
- Tooltips provide detailed information on hover

### 4. Scalable Architecture
- Easy to add new overlay layers
- Each overlay is independent and focused
- Z-index ordering prevents conflicts

### 5. Performance Optimized
- Overlays only render when active
- Efficient pointer event handling
- Smooth animations and transitions

## Usage Examples

### Basic Layer Activation
1. Navigate to `/farms`
2. Select a farm from dropdown
3. Use the Layer Switcher to enable desired overlays:
   - ✅ **Devices**: See device assignments and states
   - ✅ **Monitoring**: View environmental data and alerts
   - ⏳ **Analytics**: Coming soon

### Multi-Layer Analysis
1. Enable **Devices** + **Monitoring** layers
2. Observe correlations between device states and environmental conditions
3. Use floating control panels for quick actions
4. Click indicators for detailed information

### Mobile Experience
1. Tap "Layers" button to open mobile panel
2. Select desired layers with checkboxes
3. Collapse panel to see overlays on farm structure
4. Responsive design adapts overlay density

## File Structure

```
frontend/src/
├── contexts/
│   └── LayerContext.tsx              # Multi-layer state management
├── components/
│   ├── LayerSwitcher.tsx            # Checkbox-based layer controls
│   ├── overlays/                    # Overlay components
│   │   ├── DeviceOverlay.tsx        # Device layer implementation
│   │   ├── AutomationOverlay.tsx    # Automation layer implementation
│   │   ├── MonitoringOverlay.tsx    # Monitoring layer implementation
│   │   └── AnalyticsOverlay.tsx     # Analytics placeholder
│   └── farms/
│       └── UnifiedFarmView/
│           └── index.tsx            # Integrated overlay rendering
└── app/(app)/farms/
    └── page.tsx                     # Layer provider and page layout
```

## Development Guidelines

### Adding New Overlay Layers
1. Create overlay component in `/components/overlays/`
2. Add layer type to `LayerContext.tsx`
3. Update `LayerSwitcher.tsx` with layer definition
4. Integrate overlay in `UnifiedFarmView/index.tsx`
5. Assign appropriate z-index for layering

### Overlay Component Patterns
- Use `absolute inset-0 pointer-events-none` for container
- Enable `pointer-events-auto` for interactive elements
- Position indicators relative to farm structure
- Provide floating control panels in consistent locations
- Include responsive design considerations

### Visual Design Principles
- Use semi-transparent backgrounds with backdrop blur
- Maintain consistent icon library (Lucide React)
- Apply subtle animations for state changes
- Ensure accessibility with proper contrast
- Follow Tailwind CSS design system

## Future Enhancements

### Planned Features
- **Layer Presets**: Save/load common layer combinations
- **Layer Opacity**: Adjust overlay transparency
- **Layer Animation**: Smooth transitions between states
- **Custom Layers**: User-defined overlay configurations
- **Layer Sharing**: Export layer views for collaboration

### Analytics Layer Development
The analytics layer is currently a placeholder. Planned features:
- Yield prediction overlays
- Performance heatmaps
- Resource utilization indicators
- Optimization recommendations
- Historical trend visualizations

## Migration Notes

This system replaces the previous tab-based layer switching with:
- ✅ **Improved UX**: Always visible farm structure
- ✅ **Better Performance**: Conditional overlay rendering  
- ✅ **Enhanced Functionality**: Multi-layer visualization
- ✅ **Mobile Optimized**: Responsive overlay design
- ✅ **Scalable Architecture**: Easy to extend with new layers

The new system maintains all existing functionality while providing a more intuitive and powerful user experience.