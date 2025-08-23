# API Integration Examples

## Python Examples

### Initializing Client

```python
from vertical_farm_api import VerticalFarmClient

client = VerticalFarmClient(
    base_url='https://api.vertical-farm.goodgoodgreens.org/api/v1',
    api_key='YOUR_API_KEY'
)
```

### Farm Management

```python
# List farms
farms = client.farms.list()

# Create a new farm
new_farm = client.farms.create({
    'name': 'Urban Green Farm',
    'location': 'New York, NY',
    'total_area_sqft': 500
})

# Get specific farm details
farm_details = client.farms.get('farm_123')
```

### Sensor Data Retrieval

```python
# Get sensor readings
sensor_data = client.sensors.get_readings('sensor_456')

# Retrieve historical sensor data
historical_data = client.sensors.get_history(
    sensor_id='sensor_456', 
    start_date='2025-08-01', 
    end_date='2025-08-22'
)
```

## JavaScript/TypeScript Examples

### Fetch Farm Details

```typescript
import { VerticalFarmClient } from '@goodgoodgreens/vertical-farm-api';

const client = new VerticalFarmClient({
  baseUrl: 'https://api.vertical-farm.goodgoodgreens.org/api/v1',
  apiKey: 'YOUR_API_KEY'
});

async function getFarmDetails(farmId: string) {
  try {
    const farm = await client.farms.get(farmId);
    console.log(farm);
  } catch (error) {
    console.error('Failed to retrieve farm details', error);
  }
}
```

### Real-time Device Monitoring

```typescript
const deviceSocket = client.websocket.connectDeviceEvents();

deviceSocket.on('status-update', (event) => {
  console.log('Device status changed:', event);
});

deviceSocket.on('error', (error) => {
  console.error('WebSocket error:', error);
});
```

## curl Examples

### Authentication

```bash
# User Login
curl -X POST "https://api.vertical-farm.goodgoodgreens.org/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"securepassword"}'

# Get Farm Details
curl -X GET "https://api.vertical-farm.goodgoodgreens.org/api/v1/farms/farm_123" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Postman Collection

A complete Postman collection is available for download:
[Vertical Farm API Postman Collection](https://api.vertical-farm.goodgoodgreens.org/postman-collection.json)

## Common Integration Patterns

### Error Handling

```python
try:
    farm_data = client.farms.get('farm_123')
except ApiError as e:
    if e.status_code == 404:
        print("Farm not found")
    elif e.status_code == 403:
        print("Unauthorized access")
```

### Pagination

```python
# Retrieve paginated farm list
farms = client.farms.list(page=1, per_page=20)

# Check for more pages
if farms.has_next_page:
    next_page = client.farms.list(page=2, per_page=20)
```

## SDK Support

- Python SDK: `pip install vertical-farm-api`
- JavaScript/TypeScript: `npm install @goodgoodgreens/vertical-farm-api`
- Supports major languages: Python, JavaScript, TypeScript, Go, Java

## Troubleshooting

1. Always check API key validity
2. Ensure correct endpoint URL
3. Handle network interruptions
4. Use SDK's built-in retry mechanisms
5. Monitor rate limit headers