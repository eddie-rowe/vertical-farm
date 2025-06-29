# Square API Setup Guide

## Getting Real Square API Data

To see real Square API data instead of mock data, you need to set up Square API credentials.

### 1. Get Square Developer Account

1. Go to [Square Developer Dashboard](https://developer.squareup.com/apps)
2. Create a new application or use an existing one
3. Get your Application ID and Access Token

### 2. Set Environment Variables

Add these to your `.env` file in the backend directory:

```bash
# Square API Configuration
SQUARE_APPLICATION_ID=your_application_id_here
SQUARE_ACCESS_TOKEN=your_access_token_here
SQUARE_ENVIRONMENT=sandbox  # Use 'sandbox' for testing, 'production' for live data
```

### 3. Available API Endpoints

Once configured, these endpoints will return real Square data:

- `GET /api/v1/square/locations?config_id=test` - Your business locations
- `GET /api/v1/square/products?config_id=test` - Your catalog items
- `GET /api/v1/square/customers?config_id=test` - Your customers
- `GET /api/v1/square/orders?config_id=test` - Your orders
- `GET /api/v1/square/payments?config_id=test` - Your payments
- `POST /api/v1/square/test-connection` - Test API connection

### 4. Sandbox vs Production

- **Sandbox**: Use for testing with fake data
- **Production**: Use for real business data

### 5. Example Response

With real credentials, you'll see actual Square data like:

```json
{
  "locations": [
    {
      "id": "L12345",
      "name": "Main Farm Store",
      "address": "123 Farm Road, Farmville, CA",
      "status": "ACTIVE",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### 6. Testing the Connection

Use the test endpoint to verify your credentials work:

```bash
curl -X POST "http://localhost:8000/api/v1/square/test-connection" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "name": "Test Config",
    "application_id": "your_app_id",
    "access_token": "your_access_token",
    "environment": "sandbox"
  }'
```

This will return real Square API data instead of the hardcoded mock data! 