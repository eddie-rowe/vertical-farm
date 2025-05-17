"""
Config flow for the Vertical Farm HACS integration (helper-driven).
- Allows users to create/edit farm layouts and assign entities via the UI.
- Auto-creates/updates Home Assistant helpers for each farm element.
"""
from homeassistant import config_entries
from homeassistant.core import callback
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers import service
from homeassistant.helpers.selector import selector
from .const import DOMAIN
import voluptuous as vol
import logging

_LOGGER = logging.getLogger(__name__)

# Helper creation service mapping
HELPER_SERVICES = {
    "input_number": "input_number/create",
    "input_boolean": "input_boolean/create",
    "input_button": "input_button/create",
    "input_select": "input_select/create",
    "input_text": "input_text/create",
    "input_datetime": "input_datetime/create",
}

class VerticalFarmConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    VERSION = 1
    
    async def async_step_user(self, user_input=None):
        if user_input is not None:
            action = user_input["action"]
            if action == "create":
                return await self.async_step_create_farm()
            elif action == "edit":
                return await self.async_step_edit_farm()
            elif action == "assign":
                return await self.async_step_assign_entity()
        return self.async_show_form(
            step_id="user",
            data_schema=vol.Schema({
                vol.Required("action"): vol.In(["create", "edit", "assign"])
            }),
            description_placeholders={
                "desc": "Create or edit your farm layout, or assign entities."
            },
        )

    async def async_step_create_farm(self, user_input=None):
        if user_input is not None:
            farm_name = user_input["farm_name"]
            row_qty = user_input["row_qty"]
            rack_qty = user_input["rack_qty"]
            shelf_qty = user_input["shelf_qty"]
            tray_capacity = user_input["tray_capacity"]
            farm_id = farm_name.lower().replace(" ", "_")
            # Create helpers for each shelf
            for row in range(1, row_qty + 1):
                for rack in range(1, rack_qty + 1):
                    for shelf in range(1, shelf_qty + 1):
                        base = f"{farm_id}_row{row}_rack{rack}_shelf{shelf}"
                        # Moisture setpoint
                        await self.hass.services.async_call(
                            "input_number", "create",
                            {
                                "name": f"{base}_moisture_setpoint",
                                "min": 0,
                                "max": 100,
                                "step": 1,
                                "unit_of_measurement": "%",
                                "initial": 50,
                                "icon": "mdi:water-percent"
                            }, blocking=True
                        )
                        # Irrigation enabled
                        await self.hass.services.async_call(
                            "input_boolean", "create",
                            {"name": f"{base}_irrigation_enabled"}, blocking=True
                        )
                        # Manual water button
                        await self.hass.services.async_call(
                            "input_button", "create",
                            {"name": f"{base}_manual_water"}, blocking=True
                        )
                        # Crop type select
                        await self.hass.services.async_call(
                            "input_select", "create",
                            {
                                "name": f"{base}_crop_type",
                                "options": ["Lettuce", "Basil", "Kale"],
                                "icon": "mdi:sprout"
                            }, blocking=True
                        )
                        # Notes text
                        await self.hass.services.async_call(
                            "input_text", "create",
                            {"name": f"{base}_notes"}, blocking=True
                        )
                        # Tray capacity number
                        await self.hass.services.async_call(
                            "input_number", "create",
                            {
                                "name": f"{base}_tray_capacity",
                                "min": 0,
                                "max": 100,
                                "step": 1,
                                "initial": tray_capacity,
                                "icon": "mdi:tray"
                            }, blocking=True
                        )
            return self.async_create_entry(title=farm_name, data=user_input)
        return self.async_show_form(
            step_id="create_farm",
            data_schema=vol.Schema({
                vol.Required("farm_name"): str,
                vol.Required("row_qty", default=1): int,
                vol.Required("rack_qty", default=1): int,
                vol.Required("shelf_qty", default=1): int,
                vol.Required("tray_capacity", default=1): int,
            }),
        )

    async def async_step_edit_farm(self, user_input=None):
        # For simplicity, just prompt for farm name and new structure
        if user_input is not None:
            farm_name = user_input["farm_name"]
            row_qty = user_input["row_qty"]
            rack_qty = user_input["rack_qty"]
            shelf_qty = user_input["shelf_qty"]
            tray_capacity = user_input["tray_capacity"]
            farm_id = farm_name.lower().replace(" ", "_")
            # TODO: Remove or update helpers as needed (not implemented here for brevity)
            # For now, just add new ones if missing
            for row in range(1, row_qty + 1):
                for rack in range(1, rack_qty + 1):
                    for shelf in range(1, shelf_qty + 1):
                        base = f"{farm_id}_row{row}_rack{rack}_shelf{shelf}"
                        # Same as create logic above
                        await self.hass.services.async_call(
                            "input_number", "create",
                            {
                                "name": f"{base}_moisture_setpoint",
                                "min": 0,
                                "max": 100,
                                "step": 1,
                                "unit_of_measurement": "%",
                                "initial": 50,
                                "icon": "mdi:water-percent"
                            }, blocking=True
                        )
                        await self.hass.services.async_call(
                            "input_boolean", "create",
                            {"name": f"{base}_irrigation_enabled"}, blocking=True
                        )
                        await self.hass.services.async_call(
                            "input_button", "create",
                            {"name": f"{base}_manual_water"}, blocking=True
                        )
                        await self.hass.services.async_call(
                            "input_select", "create",
                            {
                                "name": f"{base}_crop_type",
                                "options": ["Lettuce", "Basil", "Kale"],
                                "icon": "mdi:sprout"
                            }, blocking=True
                        )
                        await self.hass.services.async_call(
                            "input_text", "create",
                            {"name": f"{base}_notes"}, blocking=True
                        )
                        await self.hass.services.async_call(
                            "input_number", "create",
                            {
                                "name": f"{base}_tray_capacity",
                                "min": 0,
                                "max": 100,
                                "step": 1,
                                "initial": tray_capacity,
                                "icon": "mdi:tray"
                            }, blocking=True
                        )
            return self.async_create_entry(title=farm_name, data=user_input)
        return self.async_show_form(
            step_id="edit_farm",
            data_schema=vol.Schema({
                vol.Required("farm_name"): str,
                vol.Required("row_qty", default=1): int,
                vol.Required("rack_qty", default=1): int,
                vol.Required("shelf_qty", default=1): int,
                vol.Required("tray_capacity", default=1): int,
            }),
            description_placeholders={
                "desc": "Edit an existing farm layout."
            },
        )

    async def async_step_assign_entity(self, user_input=None):
        entity_reg = er.async_get(self.hass)
        entities = [e.entity_id for e in entity_reg.entities.values()]
        if user_input is not None:
            # Store assignment as an input_text helper for mapping
            farm_id = user_input["farm_id"]
            row_id = user_input.get("row_id", "row1")
            rack_id = user_input.get("rack_id", "rack1")
            shelf_id = user_input.get("shelf_id", "shelf1")
            entity_id = user_input["entity_id"]
            mapping_name = f"{farm_id}_{row_id}_{rack_id}_{shelf_id}_assigned_entity"
            await self.hass.services.async_call(
                "input_text", "create",
                {"name": mapping_name, "initial": entity_id}, blocking=True
            )
            return self.async_create_entry(title="Assign Entity", data=user_input)
        return self.async_show_form(
            step_id="assign_entity",
            data_schema=vol.Schema({
                vol.Required("entity_id"): vol.In(entities),
                vol.Required("farm_id"): str,
                vol.Optional("row_id", default="row1"): str,
                vol.Optional("rack_id", default="rack1"): str,
                vol.Optional("shelf_id", default="shelf1"): str,
            }),
            description_placeholders={
                "desc": "Assign an entity to a farm/row/rack/shelf."
            },
        )
