# Vertical Farm Home Assistant Integration

This repository contains the backend integration for managing vertical farm layouts in Home Assistant.

## Features
- Define farms, rows, racks, and shelves
- Validate configuration with a robust schema
- Foundation for device assignment, recipe management, and monitoring

## Installation (via HACS)
1. Add this repository to HACS as a custom repository (category: Integration).
2. Install the "Vertical Farm" integration from HACS.
3. Add configuration to your `configuration.yaml` (see below).
4. Restart Home Assistant.

## Configuration Example
```yaml
vertical_farm:
  farm:
  id: "farm1"
  name: "Main Farm"
  location: "Greenhouse 1"
  notes: "Primary production farm"
  device_ids:
    - sensor.farm_temperature
    - sensor.farm_humidity
  position: 1
  rows:
    - id: "row1"
      name: "Row 1"
      notes: "North row"
      device_ids:
        - sensor.row1_light
      position: 1
      racks:
        - id: "rack1"
          name: "Rack 1"
          notes: "First rack in row 1"
          device_ids:
            - switch.rack1_light
          position: 1
          shelves:
            - id: "shelf1"
              name: "Shelf 1"
              notes: "Top shelf"
              device_ids:
                - sensor.shelf1_moisture
              capacity: 10
              position: 1
            - id: "shelf2"
              name: "Shelf 2"
              notes: "Bottom shelf"
              device_ids:
                - sensor.shelf2_moisture
              capacity: 8
              position: 2
        - id: "rack2"
          name: "Rack 2"
          notes: "Second rack in row 1"
          device_ids: []
          position: 2
          shelves: []
    - id: "row2"
      name: "Row 2"
      notes: "South row"
      device_ids: []
      position: 2
      racks: []

```

## Frontend Card
A custom Lovelace card for visualizing your farm is available in the [vertical-farm-card](https://github.com/eddie-rowe/vertical-farm-card) repository. Install it via HACS as a Plugin.

## Contributing
See [CONTRIBUTING.md](CONTRIBUTING.md).

## License
Apache 2.0
