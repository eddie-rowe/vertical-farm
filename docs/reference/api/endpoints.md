# API Endpoints Reference

## Core Domains

### 1. Farm Management
- **GET `/farms`**: List user's farms
- **GET `/farms/{farm_id}`**: Get specific farm details
- **POST `/farms`**: Create a new farm
- **PUT `/farms/{farm_id}`**: Update farm configuration
- **DELETE `/farms/{farm_id}`**: Delete a farm

### 2. Device Management
- **GET `/devices`**: List all devices
- **GET `/devices/{device_id}`**: Get device details
- **POST `/devices`**: Register a new device
- **PUT `/devices/{device_id}/status`**: Update device status
- **DELETE `/devices/{device_id}`**: Remove a device

### 3. Sensor Data
- **GET `/sensors`**: List all sensors
- **GET `/sensors/{sensor_id}/data`**: Retrieve sensor readings
- **POST `/sensors/{sensor_id}/calibrate`**: Calibrate sensor
- **GET `/sensors/metrics`**: Aggregate sensor metrics

### 4. Grow Automation
- **GET `/grow-plans`**: List grow plans
- **POST `/grow-plans`**: Create a new grow plan
- **PUT `/grow-plans/{plan_id}`**: Update grow plan
- **GET `/grow-plans/{plan_id}/progress`**: Get grow plan progress

### 5. Environmental Control
- **GET `/climate-control`**: Get current climate settings
- **POST `/climate-control/update`**: Modify climate parameters
- **GET `/climate-control/history`**: Retrieve climate history

### 6. User Management
- **GET `/users/profile`**: Get user profile
- **PUT `/users/profile`**: Update user profile
- **POST `/users/permissions`**: Manage user roles

### 7. Square POS Integration
- **GET `/api/v1/square/configs`**: List Square configurations
- **GET `/api/v1/square/configs/{config_id}`**: Get specific configuration
- **POST `/api/v1/square/configs`**: Create new Square configuration
- **PUT `/api/v1/square/configs/{config_id}`**: Update configuration
- **DELETE `/api/v1/square/configs/{config_id}`**: Delete configuration
- **PUT `/api/v1/square/configs/{config_id}/activate`**: Set active configuration
- **POST `/api/v1/square/test-connection`**: Test Square API connection

#### Square Data Endpoints
- **GET `/api/v1/square/locations`**: Get Square locations
- **GET `/api/v1/square/products`**: Get product catalog
- **GET `/api/v1/square/customers`**: Get customer list
- **GET `/api/v1/square/orders`**: Get order history
- **GET `/api/v1/square/payments`**: Get payment transactions
- **GET `/api/v1/square/refunds`**: Get refund transactions
- **GET `/api/v1/square/disputes`**: Get payment disputes
- **GET `/api/v1/square/payouts`**: Get bank payouts
- **GET `/api/v1/square/team-members`**: Get team member list
- **GET `/api/v1/square/inventory`**: Get inventory counts

#### Square Sync Endpoints
- **POST `/api/v1/square/sync/all/{config_id}`**: Sync all Square data
- **POST `/api/v1/square/sync/customers/{config_id}`**: Sync customers
- **POST `/api/v1/square/sync/orders/{config_id}`**: Sync orders
- **POST `/api/v1/square/sync/payments/{config_id}`**: Sync payments
- **POST `/api/v1/square/sync/products/{config_id}`**: Sync products
- **GET `/api/v1/square/sync/status/{config_id}`**: Get sync status

#### Square Webhook Endpoint
- **POST `/api/v1/square/webhook`**: Receive Square webhook events

## WebSocket Endpoints

### Real-time Monitoring
- **`/ws/farm-status`**: Real-time farm status updates
- **`/ws/device-events`**: Device event streaming
- **`/ws/sensor-data`**: Live sensor data stream

## Authentication Endpoints

### Auth Management
- **POST `/auth/login`**: User login
- **POST `/auth/logout`**: User logout
- **POST `/auth/register`**: User registration
- **POST `/auth/reset-password`**: Password reset
- **GET `/auth/verify`**: Verify authentication token

## API Response Examples

### Successful Response
```json
{
  "success": true,
  "data": {
    "farm_id": "farm_123",
    "name": "Green Vertical Farm",
    "total_devices": 15,
    "active_sensors": 22
  },
  "message": "Farm details retrieved successfully",
  "timestamp": "2025-08-22T10:30:45Z"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Farm not found",
    "details": {
      "farm_id": "farm_999"
    }
  },
  "timestamp": "2025-08-22T10:30:45Z"
}
```

## Rate Limiting Headers

Responses include rate limiting information:
- `X-RateLimit-Limit`: Total allowed requests
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Time until limit resets

## Best Practices

1. Always include authentication token
2. Handle error responses gracefully
3. Use WebSocket for real-time data
4. Implement retry mechanisms
5. Monitor rate limit headers

## Changelog

- **v1.0.0**: Initial API release
- **v1.1.0**: Added WebSocket endpoints
- **v1.2.0**: Enhanced sensor data capabilities