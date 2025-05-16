import logging
from homeassistant.helpers.entity import Entity
from homeassistant.const import STATE_UNKNOWN
from .const import DOMAIN

_LOGGER = logging.getLogger(__name__)


async def async_setup_platform(
    hass, config, async_add_entities, discovery_info=None
):
    # Not used with config entry setup
    pass


async def async_setup_entry(hass, config_entry, async_add_entities):
    # Not used yet (for config flow)
    pass


async def async_setup(hass, config, async_add_entities, discovery_info=None):
    """Set up sensors for each farm element with assigned entities."""
    farm = hass.data.get(DOMAIN)
    registry = hass.data.get(f"{DOMAIN}_device_registry")
    if not farm or not registry:
        _LOGGER.error("Farm or device registry not found during sensor setup.")
        return

    sensors = []

    def add_sensors_for_element(element, level):
        # For each assigned entity, create a sensor that mirrors its state
        if hasattr(element, "device_ids") and element.device_ids:
            for entity_id in element.device_ids:
                sensors.append(FarmProxySensor(level, element.id, entity_id))
        # Recurse
        if hasattr(element, "rows"):
            for row in element.rows:
                add_sensors_for_element(row, "row")
        if hasattr(element, "racks"):
            for rack in element.racks:
                add_sensors_for_element(rack, "rack")
        if hasattr(element, "shelves"):
            for shelf in element.shelves:
                add_sensors_for_element(shelf, "shelf")

    add_sensors_for_element(farm, "farm")
    async_add_entities(sensors)


class FarmProxySensor(Entity):
    def __init__(self, level, object_id, entity_id):
        self._level = level
        self._object_id = object_id
        self._entity_id = entity_id
        self._name = f"{level.capitalize()} {object_id} ({entity_id})"
        self._state = STATE_UNKNOWN

    @property
    def name(self):
        return self._name

    @property
    def unique_id(self):
        return (
            f"vertical_farm_{self._level}_{self._object_id}_{self._entity_id}"
        )

    @property
    def state(self):
        return self._state

    @property
    def extra_state_attributes(self):
        return {
            "level": self._level,
            "object_id": self._object_id,
            "proxied_entity_id": self._entity_id,
        }

    async def async_update(self):
        hass = self.hass
        if hass is None:
            return
        state_obj = hass.states.get(self._entity_id)
        self._state = state_obj.state if state_obj else STATE_UNKNOWN
