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
    rows:
      - id: "row1"
        name: "Row 1"
        racks:
          - id: "rack1"
            name: "Rack 1"
            shelves:
              - id: "shelf1"
                name: "Shelf 1"
              - id: "shelf2"
                name: "Shelf 2"
```

## Frontend Card
A custom Lovelace card for visualizing your farm is available in the [vertical-farm-card](https://github.com/eddie-rowe/vertical-farm-card) repository. Install it via HACS as a Plugin.

## Contributing
See [CONTRIBUTING.md](CONTRIBUTING.md).

## License
Apache 2.0
