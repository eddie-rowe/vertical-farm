You're absolutely right! I should examine the frontend structure and plan the UI components needed for the Home Assistant integration. Let me explore the current frontend architecture to understand how to best implement the "Integrations" feature.
Ran tool
Ran tool
Ran tool
Ran tool
Ran tool
Ran tool
Ran tool
Now let me look at the components directory to understand the current component structure:
Ran tool
Let me also check if there's any existing navigation or settings structure:
Read file: vertical-farm/frontend/src/components/Sidebar.tsx
Let me also check the settings page to see how configuration pages are structured:
Ran tool
Ran tool
Read file: vertical-farm/frontend/src/app/(app)/account/page.tsx
Perfect! Now I have a good understanding of the frontend structure. Let me also check if there are any UI components available:
Ran tool
Now let me update the TaskMaster to properly track our frontend work and then provide a comprehensive plan for the frontend integration:
Ran tool
Now let me add a new subtask specifically for the frontend implementation:
Ran tool
Perfect! Now I have a comprehensive understanding of both the backend and frontend requirements. Let me provide you with a detailed plan for the complete Home Assistant integration including the frontend components.

## Frontend Integration Plan

Based on my analysis of the current frontend architecture, here's what we need to implement:

### 1. **Navigation Updates**
- Add "Integrations" to the sidebar navigation (between "Grow Parameters" and "Notifications")
- Use an appropriate icon like `FaPlug` or `FaHome` for the integrations menu item

### 2. **New Pages Structure**
```
/src/app/(app)/integrations/
├── page.tsx                 # Main integrations dashboard
├── home-assistant/
│   ├── page.tsx            # Home Assistant setup/config
│   ├── devices/
│   │   └── page.tsx        # Device discovery and management
│   └── assignments/
│       └── page.tsx        # Device-to-farm assignments
```

### 3. **Frontend Components Needed**

#### Core Integration Components:
- `IntegrationCard.tsx` - Display available integrations (Home Assistant, future integrations)
- `ConnectionStatus.tsx` - Show connection health and status indicators
- `DeviceCard.tsx` - Display individual device information and controls
- `DeviceAssignmentModal.tsx` - Assign devices to farm locations
- `DeviceControlPanel.tsx` - Manual device controls (switches, sliders)

#### Home Assistant Specific Components:
- `HomeAssistantSetup.tsx` - Initial connection configuration
- `EntityBrowser.tsx` - Browse and filter Home Assistant entities
- `DeviceStateIndicator.tsx` - Real-time status displays
- `AssignmentManager.tsx` - Manage device assignments to rows/racks/shelves

### 4. **Frontend Service Layer**
```typescript
/src/services/
├── homeAssistantService.ts  # API client for HA endpoints
├── websocketService.ts      # WebSocket connection management
└── integrationService.ts    # General integration utilities
```

### 5. **State Management**
Using React Context for:
- Home Assistant connection status
- Device states and assignments
- Real-time WebSocket updates
- Integration settings

### 6. **Key UI Features**

#### Main Integrations Dashboard:
- Card-based layout showing available integrations
- Quick status overview of connected services
- Setup buttons for new integrations

#### Home Assistant Configuration:
- Form to enter HA URL and access token
- Connection testing with feedback
- Save/update connection settings

#### Device Management:
- Grid view of discovered devices with live status
- Filter by device type (lights, switches, sensors)
- Search functionality
- Bulk selection for assignments

#### Assignment Interface:
- Farm layout visualization (similar to existing farm config)
- Drag-and-drop device assignment
- Visual indicators showing assigned devices
- Context menus for device controls

#### Device Controls:
- Toggle switches for on/off devices
- Sliders for dimmable lights
- Status badges showing current state
- Real-time updates via WebSocket

### 7. **Integration with Existing Architecture**

The new integrations feature will follow the established patterns:
- Uses existing UI components (`Switch`, `Card`, `Dialog`, `Select`, etc.)
- Follows the same styling patterns (Tailwind classes, dark mode support)
- Integrates with the existing authentication context
- Uses the same API service patterns

Would you like me to start implementing these frontend components now, or would you prefer to continue with the backend WebSocket implementation first? I can work on both in parallel since the frontend can use mock data initially and then connect to the real backend endpoints as they're completed.