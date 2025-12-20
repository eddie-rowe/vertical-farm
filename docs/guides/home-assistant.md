# Home Assistant Integration Guide

Complete guide for integrating Home Assistant with your Vertical Farm platform for advanced IoT automation and device control.

## Overview

Home Assistant integration enables advanced automation, extended device compatibility, and sophisticated control scenarios for your vertical farm. This guide covers setup, configuration, and advanced automation features.

## Benefits of Integration

### Extended Device Support
- Connect 2000+ device types and brands
- Support for legacy and proprietary protocols
- Bridge incompatible systems
- Custom device integrations

### Advanced Automation
- Complex conditional logic
- Multi-device orchestration
- Time-based and event-driven automation
- Machine learning capabilities

### Enhanced Monitoring
- Unified dashboard for all devices
- Custom visualization options
- Historical data analysis
- Predictive analytics

## Prerequisites

Before starting:
- Vertical Farm platform account with admin access
- Home Assistant instance (local or cloud)
- Network connectivity between systems
- API tokens for authentication

## Setup Methods

### Method 1: Direct Access (Local/Public)

For Home Assistant instances accessible directly via URL.

#### Requirements
- Home Assistant URL (e.g., `http://192.168.1.100:8123`)
- Long-lived access token from Home Assistant

#### Configuration Steps

1. **Generate Home Assistant Token**
   ```yaml
   # In Home Assistant:
   1. Navigate to Profile (bottom left)
   2. Go to Security tab
   3. Create Long-Lived Access Token
   4. Name: "Vertical Farm Integration"
   5. Copy and save the token securely
   ```

2. **Configure Backend**
   ```bash
   # In your backend .env file
   HOME_ASSISTANT_ENABLED=true
   HOME_ASSISTANT_URL=http://192.168.1.100:8123
   HOME_ASSISTANT_TOKEN=your_token_here
   CLOUDFLARE_ACCESS_PROTECTED=false
   ```

3. **Test Connection**
   ```bash
   cd backend
   python test_home_assistant_connection.py
   ```

### Method 2: Cloudflare Protected Access

For Home Assistant behind Cloudflare Zero Trust.

#### Additional Requirements
- Cloudflare Service Token (Client ID & Secret)
- Cloudflare Access configuration

#### Configuration Steps

1. **Create Cloudflare Service Token**
   ```yaml
   1. Log into Cloudflare Zero Trust Dashboard
   2. Navigate to Access → Service Auth → Service Tokens
   3. Create Service Token:
      - Name: "Vertical Farm HA Access"
      - Duration: 1 year (recommended)
   4. Save Client ID and Client Secret
   ```

2. **Configure Access Policy**
   ```yaml
   # In Cloudflare Access:
   1. Go to your Home Assistant application
   2. Edit access policy
   3. Add Service Token as allowed identity
   4. Save policy
   ```

3. **Configure Backend**
   ```bash
   # In your backend .env file
   HOME_ASSISTANT_ENABLED=true
   HOME_ASSISTANT_URL=https://ha.yourdomain.com
   HOME_ASSISTANT_TOKEN=your_ha_token_here
   CLOUDFLARE_ACCESS_PROTECTED=true
   CLOUDFLARE_SERVICE_CLIENT_ID=your_cf_client_id
   CLOUDFLARE_SERVICE_CLIENT_SECRET=your_cf_secret
   ```

## Device Mapping

### Automatic Discovery

1. **Enable Discovery**
   ```typescript
   // In platform settings
   {
     home_assistant: {
       auto_discovery: true,
       discovery_prefix: "vertical_farm",
       discovery_interval: 300 // seconds
     }
   }
   ```

2. **Review Discovered Devices**
   - Navigate to **Integrations** → **Home Assistant**
   - Click **Discovered Devices**
   - Map to farm zones
   - Configure sync settings

### Manual Device Mapping

1. **Access Mapping Interface**
   - Go to **Devices** → **Integration Mapping**
   - Select Home Assistant tab

2. **Create Mappings**
   ```typescript
   {
     platform_device: "SENSOR-001",
     ha_entity: "sensor.greenhouse_temperature",
     sync_direction: "bidirectional", // from_ha, to_ha, bidirectional
     update_interval: 30, // seconds
     value_template: "{{ value | float }}",
     unit_conversion: {
       from: "fahrenheit",
       to: "celsius"
     }
   }
   ```

### Device Type Mappings

**Sensors**
```yaml
# Platform → Home Assistant
temperature_sensor → sensor.temperature
humidity_sensor → sensor.humidity
co2_sensor → sensor.co2
ph_sensor → sensor.ph
ec_sensor → sensor.conductivity
light_sensor → sensor.illuminance
```

**Controllers**
```yaml
# Platform → Home Assistant
light_controller → light.grow_light
pump_controller → switch.water_pump
valve_controller → switch.irrigation_valve
fan_controller → fan.exhaust_fan
climate_controller → climate.hvac_system
```

## Automation Setup

### Basic Automations

**Temperature Control**
```yaml
automation:
  - alias: "Greenhouse Temperature Control"
    trigger:
      - platform: numeric_state
        entity_id: sensor.greenhouse_temperature
        above: 30
    condition:
      - condition: time
        after: "10:00"
        before: "18:00"
    action:
      - service: fan.turn_on
        entity_id: fan.greenhouse_exhaust
        data:
          speed: high
      - service: notify.farm_manager
        data:
          message: "High temperature detected - cooling activated"
```

**Lighting Schedule**
```yaml
automation:
  - alias: "Growth Lighting Schedule"
    trigger:
      - platform: time
        at: "06:00:00"
    action:
      - service: light.turn_on
        entity_id: group.grow_lights
        data:
          brightness: 255
          color_temp: 450
  
  - alias: "Night Mode"
    trigger:
      - platform: time
        at: "22:00:00"
    action:
      - service: light.turn_off
        entity_id: group.grow_lights
```

### Advanced Automations

**Nutrient Dosing System**
```yaml
automation:
  - alias: "Intelligent Nutrient Management"
    trigger:
      - platform: state
        entity_id: sensor.ec_level
    condition:
      - condition: template
        value_template: >
          {{ states('sensor.ec_level') | float < 1.8 }}
      - condition: state
        entity_id: binary_sensor.dosing_tank_full
        state: 'on'
    action:
      - service: script.calculate_nutrient_dose
        data:
          current_ec: "{{ states('sensor.ec_level') }}"
          target_ec: 2.2
          tank_volume: 1000
      - service: switch.turn_on
        entity_id: switch.nutrient_pump_a
      - delay:
          seconds: "{{ dose_time_a }}"
      - service: switch.turn_off
        entity_id: switch.nutrient_pump_a
```

**Climate Optimization**
```yaml
automation:
  - alias: "VPD Optimization"
    trigger:
      - platform: time_pattern
        minutes: "/5"
    action:
      - service: script.calculate_vpd
        data:
          temperature: "{{ states('sensor.air_temperature') }}"
          humidity: "{{ states('sensor.relative_humidity') }}"
      - choose:
          - conditions:
              - condition: template
                value_template: "{{ vpd < 0.8 }}"
            sequence:
              - service: climate.set_temperature
                entity_id: climate.greenhouse
                data:
                  temperature: >
                    {{ states('sensor.air_temperature') | float + 1 }}
          - conditions:
              - condition: template
                value_template: "{{ vpd > 1.2 }}"
            sequence:
              - service: humidifier.turn_on
                entity_id: humidifier.greenhouse
```

## Integration Features

### Real-Time Synchronization

**Bidirectional Data Flow**
```typescript
// Configuration
{
  sync: {
    enabled: true,
    direction: "bidirectional",
    conflict_resolution: "platform_priority", // or "ha_priority"
    sync_interval: 30,
    batch_size: 100
  }
}
```

**Event Streaming**
- State changes propagated instantly
- Command execution in real-time
- Alert synchronization
- Status updates

### Custom Components

**Creating Platform Entities in HA**
```python
# custom_components/vertical_farm/sensor.py
class VerticalFarmSensor(Entity):
    def __init__(self, farm_id, sensor_type):
        self._farm_id = farm_id
        self._sensor_type = sensor_type
        self._state = None
    
    @property
    def name(self):
        return f"Farm {self._farm_id} {self._sensor_type}"
    
    @property
    def state(self):
        return self._state
    
    def update(self):
        # Fetch from Vertical Farm API
        self._state = fetch_sensor_data(
            self._farm_id, 
            self._sensor_type
        )
```

### Dashboard Integration

**Lovelace Card Configuration**
```yaml
# Home Assistant dashboard
views:
  - title: Vertical Farm
    cards:
      - type: vertical-stack
        cards:
          - type: sensor
            entity: sensor.farm_temperature
            graph: line
            hours_to_show: 24
          
          - type: gauge
            entity: sensor.farm_humidity
            min: 0
            max: 100
            severity:
              green: 40
              yellow: 30
              red: 20
          
          - type: entities
            entities:
              - light.grow_lights
              - switch.irrigation_pump
              - fan.exhaust_system
```

## Voice Control

### Setup Voice Assistants

**Google Assistant Integration**
```yaml
google_assistant:
  project_id: your-project-id
  service_account: !include service_account.json
  exposed_domains:
    - light
    - switch
    - sensor
  entity_config:
    light.grow_lights:
      name: "Greenhouse Lights"
      room: "Farm"
    switch.irrigation:
      name: "Watering System"
      room: "Farm"
```

**Alexa Integration**
```yaml
alexa:
  smart_home:
    filter:
      include_entities:
        - light.grow_lights
        - switch.irrigation_pump
        - sensor.greenhouse_temperature
    entity_config:
      light.grow_lights:
        display_categories: LIGHT
        description: "Main greenhouse lighting"
```

### Voice Commands

Common commands:
- "Turn on greenhouse lights"
- "What's the temperature in zone A?"
- "Start irrigation cycle"
- "Set grow lights to 75 percent"
- "What's the humidity level?"

## Monitoring & Alerts

### Alert Configuration

**Critical Alerts**
```yaml
alert:
  high_temperature:
    name: High Temperature Alert
    entity_id: binary_sensor.high_temp_alarm
    state: 'on'
    repeat: 30
    can_acknowledge: true
    skip_first: false
    notifiers:
      - farm_manager
      - mobile_app
    message: >
      Temperature in {{ trigger.to_state.attributes.location }} 
      is {{ states('sensor.temperature') }}°C
```

### Notification Channels

Configure multiple notification methods:
```yaml
notify:
  - platform: smtp
    name: email_notification
    server: smtp.gmail.com
    port: 587
    sender: farm@example.com
    
  - platform: pushbullet
    name: push_notification
    api_key: YOUR_API_KEY
    
  - platform: telegram
    name: telegram_notification
    chat_id: YOUR_CHAT_ID
```

## Troubleshooting

### Connection Issues

**Problem**: Can't connect to Home Assistant
```bash
# Diagnostic steps
1. Test HA URL in browser
2. Verify token validity:
   curl -X GET http://ha-url:8123/api/ \
     -H "Authorization: Bearer YOUR_TOKEN"
3. Check network connectivity
4. Review firewall rules
5. Verify Cloudflare settings (if applicable)
```

**Problem**: Devices not syncing
```bash
# Solutions
1. Check entity naming conventions
2. Verify device mappings
3. Review HA entity states
4. Check sync intervals
5. Review error logs
```

### Performance Optimization

**Reduce Latency**
- Use local Home Assistant instance
- Optimize polling intervals
- Enable WebSocket connections
- Use MQTT for high-frequency data

**Improve Reliability**
- Implement retry logic
- Use connection pooling
- Cache frequently accessed data
- Monitor connection health

## Advanced Configuration

### MQTT Bridge

**Setup MQTT Integration**
```yaml
# Home Assistant configuration.yaml
mqtt:
  broker: localhost
  port: 1883
  username: mqtt_user
  password: mqtt_password
  discovery: true
  discovery_prefix: vertical_farm
```

**Device Discovery via MQTT**
```json
{
  "topic": "vertical_farm/sensor/temperature/config",
  "payload": {
    "name": "Greenhouse Temperature",
    "state_topic": "vertical_farm/sensor/temperature/state",
    "unit_of_measurement": "°C",
    "device_class": "temperature",
    "unique_id": "vf_temp_001"
  }
}
```

### Custom Scripts

**Harvest Reminder Script**
```yaml
script:
  harvest_reminder:
    alias: "Check Harvest Schedule"
    sequence:
      - service: vertical_farm.get_harvest_schedule
        data:
          days_ahead: 7
      - condition: template
        value_template: "{{ harvest_items | length > 0 }}"
      - service: notify.all
        data:
          title: "Upcoming Harvests"
          message: >
            {{ harvest_items | length }} crops ready 
            for harvest this week
```

## Security Best Practices

### Token Management
- Use long, random tokens
- Rotate tokens regularly
- Store securely (never in code)
- Use environment variables
- Implement token expiration

### Network Security
- Use HTTPS for remote access
- Implement VPN for local access
- Segregate IoT networks
- Enable firewall rules
- Monitor access logs

### Access Control
- Limit entity exposure
- Use read-only tokens where possible
- Implement user permissions
- Audit access regularly
- Log all actions

## Maintenance

### Regular Tasks

**Weekly**
- Review automation logs
- Check device connectivity
- Verify data synchronization
- Test critical automations

**Monthly**
- Update Home Assistant
- Review and optimize automations
- Clean up unused entities
- Backup configurations

**Quarterly**
- Audit security settings
- Review access tokens
- Update integration mappings
- Performance optimization

## Related Resources

- [Home Assistant Documentation](https://www.home-assistant.io/docs/)
- [Troubleshooting Guide](./troubleshooting.md)
- [API Reference](../reference/api/README.md)

## Next Steps

1. Complete basic setup and test connection
2. Map your critical devices
3. Create essential automations
4. Set up monitoring and alerts
5. Explore advanced features

---

*For API documentation, see [API Reference](../reference/api/README.md) | For support, visit [Troubleshooting](./troubleshooting.md)*