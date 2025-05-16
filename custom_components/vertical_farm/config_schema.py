import voluptuous as vol

# Define the schema for a shelf
SHELF_SCHEMA = vol.Schema({
    vol.Required('id'): str,
    vol.Required('name'): str,
    vol.Optional('capacity'): vol.All(int, vol.Range(min=1)),
    vol.Optional('notes'): str,
})

# Define the schema for a rack (contains shelves)
RACK_SCHEMA = vol.Schema({
    vol.Required('id'): str,
    vol.Required('name'): str,
    vol.Optional('notes'): str,
    vol.Required('shelves'): [SHELF_SCHEMA],
})

# Define the schema for a row (contains racks)
ROW_SCHEMA = vol.Schema({
    vol.Required('id'): str,
    vol.Required('name'): str,
    vol.Optional('notes'): str,
    vol.Required('racks'): [RACK_SCHEMA],
})

# Define the schema for a farm (contains rows)
FARM_SCHEMA = vol.Schema({
    vol.Required('id'): str,
    vol.Required('name'): str,
    vol.Optional('location'): str,
    vol.Optional('notes'): str,
    vol.Required('rows'): [ROW_SCHEMA],
})

# Top-level schema for the integration (can be extended for more options)
CONFIG_SCHEMA = vol.Schema({
    vol.Required('farm'): FARM_SCHEMA
})
