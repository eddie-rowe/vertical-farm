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

class RowOrientation(str, Enum):
    HORIZONTAL = "horizontal"
    VERTICAL = "vertical"

class FanType(str, Enum):
    AXIAL = "axial"
    CENTRIFUGAL = "centrifugal"

class SensorType(str, Enum):
    TEMPERATURE = "temperature"
    HUMIDITY = "humidity"

class ParentType(str, Enum):
    RACK = "rack"
    SHELF = "shelf" 