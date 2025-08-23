# Farm Management Guide

Complete guide to creating, organizing, and managing farms and grow sites in the Vertical Farm Management Platform.

## Overview

The farm management system allows you to organize your agricultural operations hierarchically, from organizations down to individual grow sites. This guide covers all aspects of farm setup and management.

## Prerequisites

- Active user account with appropriate permissions
- Understanding of your farm's organizational structure
- Device information if adding IoT devices

## Farm Hierarchy

The platform uses a four-level hierarchy:

```
Organization
  └── Farm
      └── Section
          └── Zone
```

### Understanding Each Level

**Organization**: Top-level entity, typically your company or cooperative
- Contains multiple farms
- Manages billing and subscriptions
- Controls user access across farms

**Farm**: Physical location or facility
- Has a unique address and coordinates
- Contains growing sections
- Manages farm-specific settings

**Section**: Distinct area within a farm
- Could be a greenhouse, building, or field
- Contains multiple growing zones
- Groups related growing areas

**Zone**: Specific growing area
- Individual grow room, rack, or plot
- Where devices are installed
- Where crops are actually grown

## Creating a Farm

### Step 1: Access Farm Management

1. Log into the platform
2. Navigate to **Farms** in the main menu
3. Click **Create New Farm** button

### Step 2: Enter Farm Details

```typescript
// Required Information
{
  name: "Main Greenhouse Facility",
  address: "123 Farm Road, Agriculture City, AC 12345",
  coordinates: { lat: 40.7128, lng: -74.0060 },
  type: "greenhouse", // greenhouse, vertical, outdoor, hybrid
  size: 5000, // square feet
  description: "Primary production facility"
}
```

### Step 3: Configure Farm Settings

1. **Operating Hours**
   - Set daily operating schedule
   - Configure automated lighting schedules
   - Define maintenance windows

2. **Climate Zones**
   - Define temperature ranges
   - Set humidity parameters
   - Configure CO2 levels

3. **Access Control**
   - Assign farm managers
   - Set team permissions
   - Configure visitor access

### Step 4: Save and Verify

1. Review all entered information
2. Click **Create Farm**
3. Verify farm appears in your dashboard

## Managing Sections

### Creating Sections

1. Select your farm from the dashboard
2. Click **Add Section**
3. Enter section details:
   ```typescript
   {
     name: "Greenhouse A",
     type: "production",
     area: 1200, // square feet
     height: 12, // feet
     climate_controlled: true
   }
   ```

### Section Types

- **Production**: Active growing areas
- **Nursery**: Seedling and propagation areas
- **Processing**: Harvest and packaging areas
- **Storage**: Cold storage and inventory areas
- **Research**: Experimental growing areas

### Section Configuration

For each section, configure:
- Default environmental parameters
- Lighting schedules
- Irrigation zones
- Access restrictions

## Managing Zones

### Creating Zones

1. Navigate to the desired section
2. Click **Add Zone**
3. Configure zone properties:
   ```typescript
   {
     name: "Rack A1",
     type: "vertical_rack",
     levels: 5,
     growing_area: 200, // square feet
     irrigation_zone: "Zone_A1",
     lighting_zone: "Light_A1"
   }
   ```

### Zone Types

- **Vertical Rack**: Multi-level growing systems
- **Bench**: Traditional greenhouse benches
- **NFT Channel**: Nutrient film technique systems
- **DWC System**: Deep water culture setups
- **Soil Bed**: Traditional soil growing areas

### Assigning Devices to Zones

1. Select the zone
2. Click **Manage Devices**
3. Either:
   - Select existing devices from the list
   - Add new devices using device ID
   - Auto-discover nearby devices

## Device Management

### Adding Devices

1. Navigate to the target zone
2. Click **Add Device**
3. Enter device information:
   ```typescript
   {
     device_id: "SENS-001",
     type: "temperature_sensor",
     manufacturer: "SensorCo",
     model: "TH-100",
     location: "Upper canopy"
   }
   ```

### Device Types

**Sensors**:
- Temperature/Humidity
- CO2
- Light (PAR, lux)
- pH/EC
- Water level
- Flow rate

**Controllers**:
- Lighting systems
- HVAC units
- Irrigation valves
- Nutrient dosers
- Fans/vents

### Device Configuration

For each device:
1. Set operating parameters
2. Configure alert thresholds
3. Define automation rules
4. Set maintenance schedules

## Bulk Operations

### Import Multiple Farms

1. Prepare CSV file with farm data
2. Navigate to **Settings** > **Import**
3. Upload CSV file
4. Map columns to farm fields
5. Review and confirm import

### CSV Format Example
```csv
name,address,type,size,section_count
"Farm 1","123 Main St","greenhouse",5000,3
"Farm 2","456 Oak Ave","vertical",3000,2
```

### Bulk Device Assignment

1. Select multiple devices using checkboxes
2. Choose **Bulk Actions** > **Assign to Zone**
3. Select target zone
4. Confirm assignment

## Farm Templates

### Using Templates

1. When creating a farm, select **Use Template**
2. Choose from:
   - Small Greenhouse (1,000-5,000 sq ft)
   - Medium Vertical Farm (5,000-20,000 sq ft)
   - Large Commercial (20,000+ sq ft)
   - Research Facility
   - Custom Template

### Creating Custom Templates

1. Configure a farm completely
2. Navigate to **Settings** > **Save as Template**
3. Name your template
4. Select which settings to include
5. Save for future use

## Access Management

### Permission Levels

**Farm Owner**: Full control
- Create/delete farms
- Manage billing
- Assign permissions

**Farm Manager**: Operational control
- Modify farm settings
- Manage devices
- Create reports

**Operator**: Daily operations
- Control devices
- View data
- Create tasks

**Viewer**: Read-only access
- View dashboards
- Generate reports
- No control actions

### Assigning Permissions

1. Navigate to **Farm Settings** > **Team**
2. Click **Add Team Member**
3. Enter email address
4. Select permission level
5. Choose specific farms/sections for access

## Best Practices

### Naming Conventions

Use consistent, descriptive names:
- Farms: `[Location] - [Type]` (e.g., "Downtown - Vertical")
- Sections: `[Building/Area] [Identifier]` (e.g., "Greenhouse A")
- Zones: `[Section]-[Row]-[Position]` (e.g., "A-1-01")
- Devices: `[Type]-[Location]-[Number]` (e.g., "TEMP-A1-001")

### Organization Tips

1. **Logical Grouping**: Group similar growing areas together
2. **Clear Hierarchy**: Maintain consistent parent-child relationships
3. **Documentation**: Add descriptions to all entities
4. **Regular Review**: Audit structure quarterly
5. **Template Usage**: Use templates for consistency

### Maintenance

Regular maintenance tasks:
- Weekly: Review device status
- Monthly: Audit user access
- Quarterly: Update farm documentation
- Annually: Review and optimize structure

## Common Issues

### Farm Not Appearing

**Problem**: Created farm doesn't show in dashboard
**Solution**: 
1. Check filters in dashboard
2. Verify permissions
3. Refresh browser cache
4. Check organization assignment

### Devices Offline

**Problem**: Devices show as offline
**Solution**:
1. Check network connectivity
2. Verify device power
3. Review device logs
4. Check zone assignment

### Permission Errors

**Problem**: Users can't access farms
**Solution**:
1. Verify user role assignment
2. Check farm-specific permissions
3. Review organization membership
4. Clear user session cache

## Advanced Features

### Farm Cloning

Quickly replicate farm configurations:
1. Select source farm
2. Choose **Actions** > **Clone Farm**
3. Modify name and location
4. Adjust settings as needed
5. Save new farm

### Environmental Profiles

Create reusable environment settings:
1. Navigate to **Settings** > **Profiles**
2. Create new profile with:
   - Temperature ranges
   - Humidity levels
   - Lighting schedules
   - CO2 targets
3. Apply to multiple zones

### Automation Rules

Set up automated responses:
```typescript
// Example automation rule
{
  trigger: "temperature > 85°F",
  condition: "time between 10:00-16:00",
  action: "turn_on_cooling",
  notification: "send_alert"
}
```

## Integration with Other Features

### Analytics Integration

Farm structure enables:
- Hierarchical reporting
- Comparative analysis
- Performance benchmarking
- Resource optimization

### Home Assistant Integration

Connect farms to Home Assistant:
1. Enable integration in farm settings
2. Configure device mappings
3. Set up automation rules
4. Test connectivity

### Mobile Access

Access farms on mobile:
- View real-time data
- Control devices remotely
- Receive push notifications
- Offline data caching

## Related Guides

- [Device Control Guide](./device-control.md)
- [Analytics & Reporting](./analytics-reporting.md)
- [User Management](./user-management.md)
- [Home Assistant Setup](../integrations/home-assistant.md)

## Next Steps

After setting up your farms:
1. [Add and configure devices](./device-control.md)
2. [Set up automation rules](../integrations/home-assistant.md)
3. [Configure alerts](../integrations/push-notifications.md)
4. [Create custom reports](./analytics-reporting.md)

---

*Need help? Check our [Troubleshooting Guide](../troubleshooting/common-issues.md) or contact support.*