# Vertical Farm HACS Integration (Helper-Driven)

This integration helps you organize, automate, and control your vertical farm using Home Assistant's built-in helpers:
- `input_boolean`
- `input_button`
- `input_datetime`
- `input_number`
- `input_select`
- `input_text`

## How It Works
- **Naming Convention:** Name your helpers using the pattern: `farm1_row1_rack1_shelf1_attribute` (e.g., `input_number.farm1_row1_rack1_shelf1_moisture_setpoint`).
- **Discovery:** The integration automatically discovers all helpers matching this pattern and logs their structure.
- **Automation:** Use helpers in automations, scripts, and dashboards to control and monitor your farm.

## Example Helper Definitions (YAML)
```yaml
input_number:
  farm1_row1_rack1_shelf1_moisture_setpoint:
    name: "Moisture Setpoint"
    min: 0
    max: 100
    step: 1
    unit_of_measurement: "%"

input_boolean:
  farm1_row1_rack1_shelf1_irrigation_enabled:
    name: "Irrigation Enabled"

input_button:
  farm1_row1_rack1_shelf1_manual_water:
    name: "Manual Water"

input_select:
  farm1_row1_rack1_shelf1_crop_type:
    name: "Crop Type"
    options:
      - Lettuce
      - Basil
      - Kale

input_text:
  farm1_row1_rack1_shelf1_notes:
    name: "Notes"
```

## Example Automation
```yaml
automation:
  - alias: "Water shelf when button pressed"
    trigger:
      - platform: state
        entity_id: input_button.farm1_row1_rack1_shelf1_manual_water
    action:
      - service: switch.turn_on
        target:
          entity_id: switch.rack01_shelf01_fill
```

## Advanced
- You can use any combination of helpers and attributes to represent your farm structure.
- Use Home Assistant's UI to create and manage helpers.
- Extend the integration to add custom services or listeners as needed.

## Support
Open an issue at [GitHub](https://github.com/eddie-rowe/vertical-farm/issues) if you need help or want to request features.
