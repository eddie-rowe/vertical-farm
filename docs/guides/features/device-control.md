# Device Control Guide

Comprehensive guide for monitoring and controlling IoT devices, sensors, and automation equipment in your vertical farm.

## Overview

The device control system provides real-time monitoring and control of all connected equipment, from environmental sensors to irrigation systems. This guide covers device setup, monitoring, control, and automation.

## Device Categories

### Sensors (Monitoring)

**Environmental Sensors**
- Temperature sensors
- Humidity sensors
- CO2 monitors
- Light meters (PAR, DLI, lux)
- Air quality sensors

**Water Management Sensors**
- pH meters
- EC/TDS sensors
- Water level sensors
- Flow meters
- Pressure sensors

**Plant Health Sensors**
- Leaf temperature sensors
- Soil moisture sensors
- Weight scales
- Camera systems

### Controllers (Actuation)

**Climate Control**
- HVAC systems
- Fans and vents
- Heaters
- Cooling systems
- Dehumidifiers

**Lighting Systems**
- LED grow lights
- Supplemental lighting
- Photoperiod control
- Spectrum control

**Irrigation Equipment**
- Water pumps
- Solenoid valves
- Nutrient dosers
- Misting systems
- Drainage pumps

## Adding Devices

### Method 1: Manual Addition

1. Navigate to **Devices** > **Add Device**
2. Enter device information:
   ```json
   {
     "device_id": "TH-SENSOR-001",
     "name": "Zone A Temperature",
     "type": "temperature_humidity",
     "manufacturer": "SensorTech",
     "model": "TH-PRO-100",
     "serial_number": "2024-001234",
     "firmware_version": "2.1.0"
   }
   ```
3. Configure connection:
   - Protocol: MQTT, HTTP, Modbus, etc.
   - Connection string/URL
   - Authentication credentials
4. Assign to farm location
5. Test connection

### Method 2: Auto-Discovery

1. Navigate to **Devices** > **Discover**
2. Select discovery method:
   - Network scan (local devices)
   - Bluetooth scan
   - Zigbee network
   - Home Assistant entities
3. Review discovered devices
4. Select devices to add
5. Configure and assign locations

### Method 3: Bulk Import

1. Prepare CSV file:
   ```csv
   device_id,name,type,zone_id,ip_address
   TEMP-001,Greenhouse Temp,temperature,zone-a1,192.168.1.100
   HUMID-001,Greenhouse Humidity,humidity,zone-a1,192.168.1.101
   ```
2. Navigate to **Devices** > **Import**
3. Upload CSV file
4. Map columns to fields
5. Validate and import

## Device Configuration

### Basic Settings

For each device, configure:

1. **Identity**
   - Unique device ID
   - Display name
   - Description
   - Location tags

2. **Connection**
   - Communication protocol
   - Network settings
   - Polling interval
   - Timeout settings

3. **Operational Parameters**
   - Measurement units
   - Calibration offsets
   - Operating ranges
   - Default states

### Advanced Configuration

**Data Processing**
```typescript
{
  averaging_window: 5, // minutes
  outlier_detection: true,
  smoothing_algorithm: "exponential",
  decimation_factor: 10
}
```

**Alert Thresholds**
```typescript
{
  critical_high: 95,
  warning_high: 85,
  normal_range: [65, 75],
  warning_low: 55,
  critical_low: 45,
  hysteresis: 2
}
```

## Real-Time Monitoring

### Dashboard Views

**Device List View**
- Status indicators (online/offline)
- Current readings
- Last update time
- Quick actions

**Grid View**
- Visual layout matching physical arrangement
- Color-coded status
- Trend sparklines
- Batch operations

**Map View**
- Physical device locations
- Heat maps for sensor data
- Navigation to device details
- Spatial analytics

### Device Details Page

Access detailed information:
1. Click on any device
2. View comprehensive data:
   - Current readings
   - Historical charts
   - Event log
   - Configuration
   - Maintenance records

### Data Visualization

**Real-Time Charts**
- Line graphs for continuous data
- Gauge displays for current values
- Heat maps for spatial data
- Status timelines

**Historical Analysis**
- Adjustable time ranges
- Data export options
- Comparison tools
- Trend analysis

## Device Control

### Manual Control

**Individual Device Control**
1. Navigate to device
2. Click **Control** tab
3. Adjust settings:
   ```typescript
   // Example: Light control
   {
     power: "on",
     intensity: 75, // percentage
     spectrum: {
       red: 660,
       blue: 450,
       white: 5000
     }
   }
   ```
4. Confirm action
5. Monitor response

**Batch Control**
1. Select multiple devices
2. Choose **Batch Actions**
3. Select operation:
   - Turn all on/off
   - Set to specific value
   - Apply profile
   - Reset to defaults

### Scheduled Control

**Creating Schedules**
1. Navigate to **Automation** > **Schedules**
2. Click **New Schedule**
3. Configure:
   ```typescript
   {
     name: "Lighting Schedule",
     devices: ["LIGHT-001", "LIGHT-002"],
     schedule: {
       type: "daily",
       events: [
         { time: "06:00", action: "turn_on", intensity: 100 },
         { time: "18:00", action: "dim", intensity: 50 },
         { time: "22:00", action: "turn_off" }
       ]
     }
   }
   ```

**Schedule Types**
- Daily: Repeat every day
- Weekly: Specific days
- Photoperiod: Based on growth stage
- Astronomical: Sunrise/sunset based
- Custom: Complex patterns

### Automation Rules

**Rule-Based Control**
```typescript
{
  name: "Temperature Control",
  trigger: {
    type: "sensor_reading",
    device: "TEMP-001",
    condition: "greater_than",
    value: 80
  },
  conditions: [
    { type: "time_range", start: "10:00", end: "18:00" },
    { type: "device_state", device: "FAN-001", state: "off" }
  ],
  actions: [
    { device: "FAN-001", command: "turn_on", speed: 75 },
    { device: "VENT-001", command: "open", position: 50 }
  ],
  notifications: [
    { type: "push", message: "High temperature - cooling activated" }
  ]
}
```

**Automation Types**
- Threshold-based: React to sensor readings
- Time-based: Scheduled actions
- Event-driven: Respond to system events
- Cascade: Chain multiple actions
- Adaptive: ML-based optimization

## Device Groups

### Creating Groups

1. Navigate to **Devices** > **Groups**
2. Click **Create Group**
3. Define group:
   ```typescript
   {
     name: "Zone A Lighting",
     description: "All lights in Zone A",
     devices: ["LIGHT-A01", "LIGHT-A02", "LIGHT-A03"],
     sync_control: true, // Control all as one
     aggregate_data: true // Combine readings
   }
   ```

### Group Operations

- **Synchronized Control**: Control all devices together
- **Aggregated Monitoring**: View combined metrics
- **Group Scheduling**: Apply schedules to entire group
- **Bulk Maintenance**: Track maintenance for group

## Integration Features

### Home Assistant Integration

**Connecting Devices**
1. Enable Home Assistant integration
2. Map platform devices to HA entities
3. Configure two-way sync
4. Set up HA automations

**Benefits**
- Extended device compatibility
- Advanced automation engine
- Voice control via assistants
- Custom dashboards

### MQTT Bridge

**Setup MQTT Connection**
```typescript
{
  broker: "mqtt://broker.farm.local:1883",
  username: "farm_system",
  password: "secure_password",
  topics: {
    sensor_data: "farm/+/sensors/+/state",
    control: "farm/+/control/+/set",
    status: "farm/+/status"
  }
}
```

### API Access

**REST API Endpoints**
```bash
# Get device data
GET /api/v1/devices/{device_id}/data

# Control device
POST /api/v1/devices/{device_id}/control
{
  "command": "set_value",
  "value": 75
}

# Get device history
GET /api/v1/devices/{device_id}/history?start=2024-01-01&end=2024-01-31
```

## Maintenance & Calibration

### Maintenance Scheduling

1. Access device settings
2. Navigate to **Maintenance** tab
3. Set maintenance intervals:
   ```typescript
   {
     cleaning: { interval: "weekly", last: "2024-01-15" },
     calibration: { interval: "monthly", last: "2024-01-01" },
     replacement: { interval: "yearly", last: "2023-06-01" }
   }
   ```

### Calibration Procedures

**Sensor Calibration**
1. Navigate to device settings
2. Click **Calibrate**
3. Follow calibration wizard:
   - Prepare calibration solution/reference
   - Enter reference value
   - System calculates offset
   - Apply calibration
   - Verify accuracy

**Calibration Records**
- Automatic logging of all calibrations
- Drift tracking over time
- Calibration reminders
- Certificate generation

## Troubleshooting Devices

### Common Issues

**Device Offline**
1. Check power supply
2. Verify network connectivity
3. Review device logs
4. Test with ping/connection test
5. Check firewall rules

**Incorrect Readings**
1. Verify calibration
2. Check sensor placement
3. Review environmental factors
4. Inspect for damage
5. Compare with reference device

**Control Not Working**
1. Verify device permissions
2. Check control limits
3. Review automation conflicts
4. Test manual override
5. Inspect physical connections

### Diagnostic Tools

**Device Health Check**
```bash
# Run diagnostic
farm device diagnose DEVICE-001

# Output
✓ Network connectivity: OK
✓ Last communication: 30 seconds ago
✓ Data validity: Within range
⚠ Calibration: Due in 5 days
✓ Firmware: Up to date
```

**Communication Testing**
- Ping test
- Protocol verification
- Payload inspection
- Latency measurement
- Packet loss detection

## Performance Optimization

### Data Management

**Optimization Strategies**
1. Adjust polling intervals based on criticality
2. Implement data decimation for storage
3. Use edge computing for preprocessing
4. Enable caching for static data
5. Archive old data periodically

**Bandwidth Management**
```typescript
{
  critical_devices: { interval: 10 }, // seconds
  monitoring_devices: { interval: 60 },
  status_devices: { interval: 300 },
  batch_updates: true,
  compression: "gzip"
}
```

### System Performance

**Best Practices**
- Group devices by network segment
- Use local MQTT broker for high-frequency data
- Implement device-level caching
- Optimize database indices
- Regular maintenance and cleanup

## Security Considerations

### Device Security

**Authentication**
- Unique credentials per device
- Certificate-based authentication
- API key rotation
- Secure credential storage

**Network Security**
- VLAN segmentation
- Firewall rules
- Encrypted communications
- VPN for remote access

**Access Control**
- Role-based permissions
- Device-specific access
- Audit logging
- Change tracking

## Advanced Features

### Edge Computing

Deploy edge computing nodes:
1. Install edge agent on local server
2. Configure device connections
3. Set up local processing rules
4. Enable cloud sync

Benefits:
- Reduced latency
- Offline operation
- Local automation
- Bandwidth optimization

### Machine Learning

**Predictive Maintenance**
- Failure prediction
- Maintenance optimization
- Anomaly detection
- Performance degradation tracking

**Adaptive Control**
- Learning optimal settings
- Environmental adaptation
- Energy optimization
- Yield maximization

## Related Guides

- [Farm Management](./farm-management.md) - Setting up farm structure
- [Analytics & Reporting](./analytics-reporting.md) - Analyzing device data
- [Home Assistant Integration](../integrations/home-assistant.md) - Advanced automation
- [Troubleshooting](../troubleshooting/common-issues.md) - Solving problems

## Next Steps

1. Set up your first devices
2. Create device groups for easier management
3. Configure automation rules
4. Set up maintenance schedules
5. Integrate with Home Assistant for advanced features

---

*For API documentation, see [Device API Reference](/reference/api/devices/) | For troubleshooting, see [Device Troubleshooting](../troubleshooting/common-issues.md#devices)*