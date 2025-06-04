# API Reference - VerticalFarm OS

*Last Updated: January 2025 | Synchronized by Hermes*

## Overview

The VerticalFarm OS API is a comprehensive RESTful service built on FastAPI, providing complete vertical farm management capabilities. This reference documents all available endpoints with their parameters, responses, and usage examples.

## Base Configuration

### Base URL
```
https://api.verticalfarm.local/api/v1
```

### Authentication
All protected endpoints require JWT Bearer token authentication:

```http
Authorization: Bearer <jwt_token>
```

### Content Type
```http
Content-Type: application/json
```

## Authentication Endpoints

### Login
Authenticate user and receive JWT token.

```http
POST /api/v1/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "secure_password"
}
```

**Response (200):**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer",
  "expires_in": 3600,
  "user": {
    "id": "uuid-string",
    "email": "user@example.com",
    "role": "farm_manager"
  }
}
```

**Error Responses:**
- `400` - Invalid credentials
- `422` - Validation error

---

## Farm Management

### List Farms
Get all farms accessible to the authenticated user.

```http
GET /api/v1/farms/
```

**Query Parameters:**
- `limit` (int, optional): Maximum number of farms to return (default: 50)
- `offset` (int, optional): Number of farms to skip (default: 0)
- `search` (string, optional): Search farms by name

**Response (200):**
```json
{
  "farms": [
    {
      "id": "farm-uuid",
      "name": "Hydroponic Farm #1",
      "description": "Main production facility",
      "location": "Building A, Floor 2",
      "status": "active",
      "created_at": "2025-01-01T00:00:00Z",
      "updated_at": "2025-01-15T10:30:00Z",
      "metrics": {
        "total_rows": 12,
        "total_racks": 48,
        "total_shelves": 192,
        "active_plants": 1440
      }
    }
  ],
  "total": 1,
  "limit": 50,
  "offset": 0
}
```

### Create Farm
Create a new farm facility.

```http
POST /api/v1/farms/
```

**Request Body:**
```json
{
  "name": "New Farm Facility",
  "description": "Lettuce production facility",
  "location": "Building B, Floor 1",
  "status": "active"
}
```

**Response (201):**
```json
{
  "id": "new-farm-uuid",
  "name": "New Farm Facility",
  "description": "Lettuce production facility",
  "location": "Building B, Floor 1",
  "status": "active",
  "created_at": "2025-01-15T10:30:00Z",
  "updated_at": "2025-01-15T10:30:00Z"
}
```

### Get Farm Details
Retrieve detailed information about a specific farm.

```http
GET /api/v1/farms/{farm_id}
```

**Path Parameters:**
- `farm_id` (string): UUID of the farm

**Response (200):**
```json
{
  "id": "farm-uuid",
  "name": "Hydroponic Farm #1",
  "description": "Main production facility",
  "location": "Building A, Floor 2",
  "status": "active",
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-15T10:30:00Z",
  "rows": [
    {
      "id": "row-uuid",
      "name": "Row A1",
      "position": 1,
      "status": "active"
    }
  ],
  "devices": [
    {
      "id": "device-uuid",
      "name": "Climate Sensor 1",
      "type": "temperature_humidity",
      "status": "online"
    }
  ]
}
```

### Update Farm
Update farm information.

```http
PUT /api/v1/farms/{farm_id}
```

**Request Body:**
```json
{
  "name": "Updated Farm Name",
  "description": "Updated description",
  "status": "maintenance"
}
```

### Delete Farm
Remove a farm and all associated data.

```http
DELETE /api/v1/farms/{farm_id}
```

**Response (204):** No content

---

## Row Management

### List Rows
Get all rows within a specific farm.

```http
GET /api/v1/rows/
```

**Query Parameters:**
- `farm_id` (string, required): UUID of the parent farm
- `limit` (int, optional): Maximum number of rows to return
- `offset` (int, optional): Number of rows to skip

**Response (200):**
```json
{
  "rows": [
    {
      "id": "row-uuid",
      "farm_id": "farm-uuid",
      "name": "Row A1",
      "position": 1,
      "status": "active",
      "rack_count": 4,
      "shelf_count": 16,
      "plant_capacity": 128
    }
  ],
  "total": 12
}
```

### Create Row
Add a new row to a farm.

```http
POST /api/v1/rows/
```

**Request Body:**
```json
{
  "farm_id": "farm-uuid",
  "name": "Row B1",
  "position": 13,
  "status": "active"
}
```

### Update Row
Modify row configuration.

```http
PUT /api/v1/rows/{row_id}
```

### Delete Row
Remove a row and all associated racks/shelves.

```http
DELETE /api/v1/rows/{row_id}
```

---

## Rack Management

### List Racks
Get all racks within a specific row.

```http
GET /api/v1/racks/
```

**Query Parameters:**
- `row_id` (string, required): UUID of the parent row
- `limit` (int, optional): Maximum number of racks to return
- `offset` (int, optional): Number of racks to skip

### Create Rack
Add a new rack to a row.

```http
POST /api/v1/racks/
```

**Request Body:**
```json
{
  "row_id": "row-uuid",
  "name": "Rack A1-1",
  "position": 1,
  "height_cm": 200,
  "width_cm": 120,
  "depth_cm": 60,
  "status": "active"
}
```

### Update Rack
Modify rack configuration.

```http
PUT /api/v1/racks/{rack_id}
```

### Delete Rack
Remove a rack and all associated shelves.

```http
DELETE /api/v1/racks/{rack_id}
```

---

## Shelf Management

### List Shelves
Get all shelves within a specific rack.

```http
GET /api/v1/shelves/
```

**Query Parameters:**
- `rack_id` (string, required): UUID of the parent rack
- `limit` (int, optional): Maximum number of shelves to return
- `offset` (int, optional): Number of shelves to skip

### Create Shelf
Add a new shelf to a rack.

```http
POST /api/v1/shelves/
```

**Request Body:**
```json
{
  "rack_id": "rack-uuid",
  "name": "Shelf A1-1-1",
  "level": 1,
  "plant_capacity": 8,
  "current_species": "lettuce_buttercrunch",
  "status": "active"
}
```

**Response (201):**
```json
{
  "id": "shelf-uuid",
  "rack_id": "rack-uuid",
  "name": "Shelf A1-1-1",
  "level": 1,
  "plant_capacity": 8,
  "current_species": "lettuce_buttercrunch",
  "current_plant_count": 0,
  "status": "active",
  "created_at": "2025-01-15T10:30:00Z"
}
```

### Update Shelf
Modify shelf configuration and plant assignments.

```http
PUT /api/v1/shelves/{shelf_id}
```

### Delete Shelf
Remove a shelf and all plant data.

```http
DELETE /api/v1/shelves/{shelf_id}
```

---

## Device Management

### Sensor Devices

#### List Sensor Devices
Get all sensor devices in the system.

```http
GET /api/v1/sensor-devices/
```

**Query Parameters:**
- `farm_id` (string, optional): Filter by farm
- `device_type` (string, optional): Filter by sensor type
- `status` (string, optional): Filter by device status

**Response (200):**
```json
{
  "devices": [
    {
      "id": "sensor-uuid",
      "name": "Climate Sensor 1",
      "device_type": "temperature_humidity",
      "farm_id": "farm-uuid",
      "location": "Row A1, Position 1",
      "status": "online",
      "last_reading": "2025-01-15T10:30:00Z",
      "battery_level": 85,
      "firmware_version": "1.2.3"
    }
  ]
}
```

#### Create Sensor Device
Register a new sensor device.

```http
POST /api/v1/sensor-devices/
```

**Request Body:**
```json
{
  "name": "pH Sensor 1",
  "device_type": "ph_sensor",
  "farm_id": "farm-uuid",
  "location": "Nutrient Tank A",
  "mac_address": "aa:bb:cc:dd:ee:ff",
  "calibration_data": {
    "ph_offset": 0.1,
    "temperature_compensation": true
  }
}
```

### Fan Devices

#### List Fans
Get all fan devices in the system.

```http
GET /api/v1/fans/
```

**Response (200):**
```json
{
  "fans": [
    {
      "id": "fan-uuid",
      "name": "Exhaust Fan 1",
      "farm_id": "farm-uuid",
      "location": "Row A1, Ceiling",
      "status": "running",
      "current_speed": 75,
      "max_speed": 3000,
      "power_consumption": 45.2,
      "runtime_hours": 1247
    }
  ]
}
```

#### Control Fan
Adjust fan speed and operation.

```http
PUT /api/v1/fans/{fan_id}
```

**Request Body:**
```json
{
  "status": "running",
  "speed_percentage": 80,
  "schedule": {
    "enabled": true,
    "start_time": "06:00",
    "end_time": "22:00"
  }
}
```

---

## User Management

### List Users
Get all users (admin only).

```http
GET /api/v1/users/
```

**Query Parameters:**
- `role` (string, optional): Filter by user role
- `status` (string, optional): Filter by user status
- `limit` (int, optional): Maximum number of users to return
- `offset` (int, optional): Number of users to skip

**Response (200):**
```json
{
  "users": [
    {
      "id": "user-uuid",
      "email": "manager@farm.com",
      "role": "farm_manager",
      "status": "active",
      "last_login": "2025-01-15T09:15:00Z",
      "created_at": "2025-01-01T00:00:00Z",
      "farms_access": ["farm-uuid-1", "farm-uuid-2"]
    }
  ],
  "total": 5
}
```

### Create User
Add a new user to the system.

```http
POST /api/v1/users/
```

**Request Body:**
```json
{
  "email": "newuser@farm.com",
  "password": "secure_password",
  "role": "operator",
  "farms_access": ["farm-uuid-1"]
}
```

### Update User
Modify user information and permissions.

```http
PUT /api/v1/users/{user_id}
```

### Delete User
Remove a user from the system.

```http
DELETE /api/v1/users/{user_id}
```

---

## Permission Management

### List Permissions
Get permission settings for users and farms.

```http
GET /api/v1/permissions/
```

**Query Parameters:**
- `user_id` (string, optional): Filter by user
- `farm_id` (string, optional): Filter by farm
- `permission_type` (string, optional): Filter by permission type

**Response (200):**
```json
{
  "permissions": [
    {
      "id": "permission-uuid",
      "user_id": "user-uuid",
      "farm_id": "farm-uuid",
      "permission_type": "read_write",
      "resource_type": "farm",
      "granted_at": "2025-01-01T00:00:00Z",
      "granted_by": "admin-user-uuid"
    }
  ]
}
```

### Grant Permission
Assign permissions to a user.

```http
POST /api/v1/permissions/
```

**Request Body:**
```json
{
  "user_id": "user-uuid",
  "farm_id": "farm-uuid",
  "permission_type": "read_only",
  "resource_type": "farm"
}
```

### Revoke Permission
Remove permissions from a user.

```http
DELETE /api/v1/permissions/{permission_id}
```

---

## System Endpoints

### Health Check
Basic system health verification.

```http
GET /health
```

**Response (200):**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-15T10:30:00Z",
  "version": "1.0.0"
}
```

### Kubernetes Health Check
Detailed health information for orchestration.

```http
GET /healthz
```

**Response (200):**
```json
{
  "status": "healthy",
  "checks": {
    "database": "connected",
    "supabase": "connected",
    "cache": "operational"
  },
  "uptime": 86400,
  "memory_usage": "45%",
  "cpu_usage": "12%"
}
```

### Supabase Connectivity Test
Verify database connection and retrieve test data.

```http
GET /supabase-items
```

**Response (200):**
```json
{
  "status": "connected",
  "items_count": 1247,
  "connection_time": 23,
  "last_sync": "2025-01-15T10:29:45Z"
}
```

---

## Error Responses

### Standard Error Format
All errors follow this consistent format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "email",
      "issue": "Email format is invalid"
    }
  },
  "timestamp": "2025-01-15T10:30:00Z",
  "request_id": "req-uuid"
}
```

### Common Error Codes
- `400` - Bad Request: Invalid input data
- `401` - Unauthorized: Missing or invalid authentication
- `403` - Forbidden: Insufficient permissions
- `404` - Not Found: Resource does not exist
- `409` - Conflict: Resource already exists
- `422` - Unprocessable Entity: Validation error
- `500` - Internal Server Error: System error

---

## Rate Limiting

API requests are limited to prevent abuse:

- **Authenticated users**: 1000 requests per hour
- **Unauthenticated users**: 100 requests per hour

Rate limit headers are included in responses:
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1642248000
```

---

## Webhooks (Future Feature)

The API will support webhooks for real-time notifications:

- **Device alerts**: Sensor threshold violations
- **System events**: Farm status changes
- **Harvest notifications**: Crop ready alerts

---

*This comprehensive API reference reflects the sophisticated endpoint architecture of VerticalFarm OS, providing complete vertical farm management capabilities through a well-designed RESTful interface.*