# API Documentation

This directory contains comprehensive API documentation for the vertical-farm application's backend services.

## Contents

### API Reference
- **[reference.md](./reference.md)** - Complete API endpoint documentation
- **[authentication.md](./authentication.md)** - Authentication and authorization guide
- **[rate-limiting.md](./rate-limiting.md)** - API rate limiting and usage policies

## API Overview

The vertical-farm API is built with FastAPI and provides:
- RESTful endpoints for farm management
- Real-time WebSocket connections
- Supabase integration for data persistence
- JWT-based authentication
- Comprehensive error handling

## Base URL

- **Development**: `http://localhost:8000/api/v1`
- **Production**: `https://api.vertical-farm.goodgoodgreens.org/api/v1`

## Authentication

All API endpoints require authentication via Supabase Auth:
- JWT tokens for session management
- Row Level Security (RLS) for data protection
- Role-based access control

## Quick Start

```bash
# Get authentication token
curl -X POST "https://api.vertical-farm.goodgoodgreens.org/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password"}'

# Use token in subsequent requests
curl -X GET "https://api.vertical-farm.goodgoodgreens.org/api/v1/farms" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Response Format

All API responses follow a consistent format:

```json
{
  "success": true,
  "data": {},
  "message": "Operation completed successfully",
  "timestamp": "2025-01-01T00:00:00Z"
}
```

## Error Handling

Error responses include detailed information:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {}
  },
  "timestamp": "2025-01-01T00:00:00Z"
}
```

## Rate Limiting

- **Standard users**: 100 requests per minute
- **Premium users**: 1000 requests per minute
- **WebSocket connections**: 10 concurrent connections per user

## Support

For API support and questions:
- Review the [reference documentation](./reference.md)
- Check the [authentication guide](./authentication.md)
- Contact support at api-support@goodgoodgreens.org

## API Versioning

The API uses semantic versioning:
- Current version: `v1`
- Breaking changes will increment major version
- New features increment minor version

## Related Documentation

- For backend architecture, see [../architecture/backend.md](../architecture/backend.md)
- For database schema, see [../architecture/database-schema.md](../architecture/database-schema.md)
- For security model, see [../security/model.md](../security/model.md)
- For testing APIs, see [../testing/](../testing/)

## Maintenance

Update API documentation when:
- New endpoints are added
- Existing endpoints are modified
- Authentication methods change
- Rate limiting policies are updated 