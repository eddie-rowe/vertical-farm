# API Request/Response Schemas

## Core Schemas

### User Schema
```python
class UserSchema(BaseModel):
    id: UUID
    email: EmailStr
    full_name: Optional[str]
    role: UserRole
    created_at: datetime
    updated_at: datetime
```

### Farm Schema
```python
class FarmSchema(BaseModel):
    id: UUID
    name: str
    location: str
    total_area_sqft: float
    devices_count: int
    status: FarmStatus
    owner_id: UUID
```

### Device Schema
```python
class DeviceSchema(BaseModel):
    id: UUID
    name: str
    type: DeviceType
    farm_id: UUID
    status: DeviceStatus
    last_sync: datetime
    configuration: Dict[str, Any]
```

### Sensor Schema
```python
class SensorSchema(BaseModel):
    id: UUID
    name: str
    type: SensorType
    device_id: UUID
    unit: str
    current_value: float
    min_threshold: Optional[float]
    max_threshold: Optional[float]
```

### Grow Plan Schema
```python
class GrowPlanSchema(BaseModel):
    id: UUID
    name: str
    crop_type: str
    start_date: date
    expected_harvest_date: date
    stages: List[GrowStage]
    farm_id: UUID
```

## Enumerations

### User Roles
```python
class UserRole(str, Enum):
    ADMIN = "admin"
    FARM_MANAGER = "farm_manager"
    ANALYST = "analyst"
    USER = "user"
```

### Device Types
```python
class DeviceType(str, Enum):
    CLIMATE_CONTROL = "climate_control"
    IRRIGATION = "irrigation"
    LIGHTING = "lighting"
    SENSOR_HUB = "sensor_hub"
```

### Sensor Types
```python
class SensorType(str, Enum):
    TEMPERATURE = "temperature"
    HUMIDITY = "humidity"
    CO2 = "co2"
    PH = "ph"
    LIGHT_INTENSITY = "light_intensity"
```

## Request/Response Examples

### User Registration Request
```json
{
  "email": "farmer@example.com",
  "password": "secure_password",
  "full_name": "Jane Doe",
  "farm_name": "Green Vertical Farm"
}
```

### Farm Creation Response
```json
{
  "success": true,
  "data": {
    "id": "farm_123",
    "name": "Urban Green Farm",
    "location": "New York, NY",
    "total_area_sqft": 500,
    "created_at": "2025-08-22T10:30:45Z"
  }
}
```

## Validation Rules

- Email must be unique
- Passwords require:
  - Minimum 12 characters
  - At least one uppercase letter
  - At least one number
  - At least one special character

## Serialization Notes

- All timestamps in ISO 8601 format
- UUIDs used for all unique identifiers
- Optional fields can be null
- Enums use string representation

## Type Conversion

```python
# Example type conversion
def convert_farm_to_dict(farm: FarmSchema) -> Dict[str, Any]:
    return {
        'id': str(farm.id),
        'name': farm.name,
        'created_at': farm.created_at.isoformat()
    }
```

## Schema Versioning

- Current Version: `v1`
- Backward compatibility maintained
- Breaking changes increment major version

## Related Documentation

- [Database Schema](../../architecture/database-schema.md)
- [Type Definitions](../../types/README.md)