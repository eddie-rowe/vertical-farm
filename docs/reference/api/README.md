# Vertical Farming Platform API Reference

## Overview

The Vertical Farming Platform API provides a comprehensive set of endpoints for managing and monitoring vertical farming operations. Built with FastAPI and integrated with Supabase, this API offers robust, secure, and real-time capabilities for agricultural management.

### Key Features

- 🌱 Farm Management
- 🌡️ Environmental Monitoring
- 🤖 Device and Automation Control
- 📊 Analytics and Reporting
- 🔐 Secure Authentication

## Getting Started

### Prerequisites

- Python 3.13+
- Supabase account
- API Key and Authentication Token

### Authentication

All API requests require authentication via JWT tokens. See the [Authentication Guide](./authentication.md) for detailed instructions.

### Base URLs

- **Development**: `http://localhost:8000/api/v1`
- **Production**: `https://api.vertical-farm.goodgoodgreens.org/api/v1`

## Quick Connection Example

```python
from vertical_farm_api import VerticalFarmClient

# Initialize the client
client = VerticalFarmClient(
    base_url='https://api.vertical-farm.goodgoodgreens.org/api/v1',
    api_key='YOUR_API_KEY'
)

# Example: Get farm details
farm_details = client.farms.get_farm('farm_id')
print(farm_details)
```

## Documentation Contents

- [Authentication Guide](./authentication.md)
- [Endpoints Reference](./endpoints.md)

## Support and Community

- 📧 Support Email: api-support@goodgoodgreens.org
- 🌐 Documentation: [Comprehensive API Docs](https://vertical-farm.goodgoodgreens.org/docs)
- 🆘 Issues: [GitHub Issues](https://github.com/your-org/vertical-farm/issues)

## Versioning

The API follows semantic versioning:
- Current Version: `v1`
- Breaking changes will increment the major version
- New features will increment the minor version

## Rate Limiting

- Standard Users: 100 requests/minute
- Premium Users: 1000 requests/minute
- WebSocket Connections: 10 concurrent per user

## Legal and Compliance

- [Terms of Service](https://vertical-farm.goodgoodgreens.org/tos)
- [Privacy Policy](https://vertical-farm.goodgoodgreens.org/privacy)