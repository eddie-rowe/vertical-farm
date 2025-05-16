# Vertical Farm Home Assistant Integration

This custom component provides a flexible data model and configuration schema for managing a vertical farm layout in Home Assistant.

## Features
- Define farms, rows, racks, and shelves
- Validate configuration with a robust schema
- Foundation for device assignment, recipe management, and monitoring
- Optional: Custom Lovelace card for visualizing your farm (see `vertical_farm_ui/`)

## Installation
1. Copy the `custom_components/vertical_farm` directory to your Home Assistant `custom_components` folder.
2. (Optional) Copy the built frontend card (`vertical_farm_ui/dist/vertical-farm-card.js`) to your Home Assistant `www/` directory.
3. Add configuration to your `configuration.yaml` (see below).

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

## Frontend Card Usage
See [`vertical_farm_ui/README.md`](vertical_farm_ui/README.md) for instructions on building and using the custom Lovelace card.

## Development
- Lint: `flake8 custom_components/vertical_farm`
- Format: `black custom_components/vertical_farm`
- Type check: `mypy custom_components/vertical_farm`
- Test: `pytest`

## License
Apache 2.0
