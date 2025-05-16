from typing import Dict, List, Optional, Tuple

class DeviceRegistry:
    """
    Registry to track and manage Home Assistant entity assignments to farm, row, rack, or shelf.
    """
    def __init__(self):
        # Maps entity_id to a tuple: (level, object_id)
        self._entity_map: Dict[str, Tuple[str, str]] = {}

    def assign_entity(self, entity_id: str, level: str, object_id: str):
        """Assign a Home Assistant entity to a specific object (farm/row/rack/shelf) by id."""
        self._entity_map[entity_id] = (level, object_id)

    def unassign_entity(self, entity_id: str):
        """Remove an entity assignment."""
        if entity_id in self._entity_map:
            del self._entity_map[entity_id]

    def get_assignment(self, entity_id: str) -> Optional[Tuple[str, str]]:
        """Get the assignment (level, object_id) for an entity."""
        return self._entity_map.get(entity_id)

    def get_entities_for_object(self, level: str, object_id: str) -> List[str]:
        """Get all entity_ids assigned to a specific object."""
        return [eid for eid, (lvl, oid) in self._entity_map.items() if lvl == level and oid == object_id]

    def all_assignments(self) -> Dict[str, Tuple[str, str]]:
        """Return all entity assignments."""
        return dict(self._entity_map)
