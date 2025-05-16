# Vertical Farm

A Home Assistant custom integration for managing vertical farm layouts, device assignments, and grow recipes.

## Features
- Define farms, rows, racks, and shelves
- Validate and manage farm configuration
- Foundation for device assignment, recipe management, and monitoring

## Installation
1. Copy the `custom_components/vertical_farm` directory to your Home Assistant `custom_components` folder.
2. Add configuration to your `configuration.yaml` (see below).

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

## Documentation
See the [README](../../README.md) for full documentation, configuration options, and usage examples.
