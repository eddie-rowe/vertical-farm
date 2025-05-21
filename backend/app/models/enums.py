from enum import Enum

class PermissionLevel(str, Enum):
    VIEWER = "viewer"
    EDITOR = "editor"
    MANAGER = "manager"

class UserRole(str, Enum):
    FARM_MANAGER = "farm_manager"
    OPERATOR = "operator"
    HA_POWER_USER = "ha_power_user"
    ADMIN = "admin" 