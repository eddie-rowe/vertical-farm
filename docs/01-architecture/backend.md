# Backend Architecture - VerticalFarm OS

*Last Updated: 2025-06-03 | Synchronized by Hermes*

## Overview

The VerticalFarm OS backend is a **sophisticated, multi-layered FastAPI application** built with enterprise-grade architecture patterns. This is **not** a simple single-file application, but rather a comprehensive system designed for scalable vertical farm management.

## Technology Stack

### Core Framework
- **FastAPI** (Python 3.13.3) - High-performance async web framework
- **Docker** - Containerization and deployment
- **Supabase** (PostgreSQL) - Database and auth backend
- **JWT Authentication** - Secure token-based auth
- **Datadog** - Application performance monitoring and logging

### Additional Integrations
- **Password Utilities** - Secure password hashing and validation
- **Security Layer** - Comprehensive security middlewares
- **Configuration Management** - Environment-based config system

## Architecture Overview

```
backend/
├── app/
│   ├── api/v1/endpoints/          # Modular endpoint organization
│   │   ├── fans.py               # Fan device management
│   │   ├── farms.py              # Farm hierarchy operations  
│   │   ├── items.py              # Generic item CRUD
│   │   ├── login.py              # Authentication endpoints
│   │   ├── racks.py              # Rack management
│   │   ├── rows.py               # Row management
│   │   ├── sensor_devices.py     # Sensor device operations
│   │   ├── shelves.py            # Shelf management
│   │   ├── user_permissions.py   # Permission management
│   │   └── users.py              # User management
│   ├── crud/                     # Data access layer
│   ├── models/                   # Database models
│   ├── schemas/                  # Pydantic schemas
│   ├── config.py                 # Configuration management
│   ├── security.py               # Security utilities
│   ├── password_utils.py         # Password handling
│   ├── datadog_setup.py          # APM integration
│   └── main.py                   # Application entry point
├── tests/                        # Comprehensive test suite
│   ├── test_api/                 # API endpoint tests
│   ├── test_crud/                # CRUD operation tests
│   └── integration/              # Integration tests
├── requirements.txt              # Python dependencies
└── Dockerfile                    # Container configuration
```

## Core Features

### 1. Hierarchical Farm Management
The system implements a complete farm hierarchy with dedicated endpoints:

- **Farms** (`/api/v1/farms/`) - Top-level farm management
- **Rows** (`/api/v1/rows/`) - Row operations within farms
- **Racks** (`/api/v1/racks/`) - Rack management within rows
- **Shelves** (`/api/v1/shelves/`) - Individual shelf operations

### 2. Device Management
Comprehensive device integration system:

- **Sensor Devices** (`/api/v1/sensor-devices/`) - Environmental monitoring
- **Fan Systems** (`/api/v1/fans/`) - Climate control
- **Extensible Device Framework** - Plugin architecture for new devices

### 3. User Management & Permissions
Enterprise-grade user system:

- **User Management** (`/api/v1/users/`) - Complete user lifecycle
- **Permission System** (`/api/v1/permissions/`) - Granular access control
- **JWT Authentication** - Secure session management
- **Role-Based Access** - Hierarchical permission structure

### 4. Advanced Security
Multi-layered security implementation:

- **JWT Token Management** - Secure authentication flow
- **Password Security** - Advanced hashing and validation
- **Request Validation** - Comprehensive input sanitization
- **Permission Middleware** - Route-level access control

### 5. Monitoring & Observability
Production-ready monitoring:

- **Datadog Integration** - Real-time APM and logging
- **Health Check Endpoints** - `/health` and `/healthz`
- **Performance Metrics** - Request timing and error tracking
- **Structured Logging** - Comprehensive audit trails

## API Endpoints

### Authentication
```
POST /api/v1/login     # User authentication
POST /api/v1/logout    # Session termination
```

### Farm Hierarchy
```
GET|POST|PUT|DELETE /api/v1/farms/         # Farm management
GET|POST|PUT|DELETE /api/v1/rows/          # Row operations
GET|POST|PUT|DELETE /api/v1/racks/         # Rack management
GET|POST|PUT|DELETE /api/v1/shelves/       # Shelf operations
```

### Device Management
```
GET|POST|PUT|DELETE /api/v1/sensor-devices/  # Sensor operations
GET|POST|PUT|DELETE /api/v1/fans/            # Fan control
```

### User & Permissions
```
GET|POST|PUT|DELETE /api/v1/users/           # User management
GET|POST|PUT|DELETE /api/v1/permissions/     # Permission control
```

### System
```
GET /health           # Basic health check
GET /healthz          # Kubernetes-style health
GET /supabase-items   # Supabase connectivity test
```

## Data Layer

### CRUD Operations
Sophisticated data access layer with:
- **Async Database Operations** - Non-blocking database calls
- **Transaction Management** - ACID compliance
- **Query Optimization** - Efficient data retrieval
- **Relationship Handling** - Complex entity relationships

### Schema Validation
- **Pydantic Models** - Type-safe data validation
- **Request/Response Schemas** - API contract enforcement
- **Database Models** - SQLAlchemy ORM integration

## Testing Strategy

### Test Coverage
```
tests/
├── test_api/          # Endpoint testing
│   ├── test_farms.py
│   ├── test_users.py
│   └── test_auth.py
├── test_crud/         # Data layer testing
└── integration/       # End-to-end testing
```

### Testing Frameworks
- **pytest** - Primary testing framework
- **FastAPI TestClient** - API endpoint testing
- **Database Fixtures** - Isolated test data
- **Mock Integrations** - External service testing

## Deployment

### Docker Configuration
- **Multi-stage builds** - Optimized container size
- **Environment configuration** - Flexible deployment
- **Health checks** - Container orchestration support

### Environment Variables
```
SUPABASE_URL           # Database connection
SUPABASE_KEY           # Authentication key
DATADOG_API_KEY        # Monitoring integration
JWT_SECRET_KEY         # Token signing
```

## Development Workflow

### Code Organization
- **Modular Architecture** - Clear separation of concerns
- **Type Hints** - Full Python typing support
- **Error Handling** - Comprehensive exception management
- **Logging Strategy** - Structured application logs

### API Versioning
- **Version Prefix** - `/api/v1/` for future compatibility
- **Backward Compatibility** - Migration strategies
- **Documentation** - Auto-generated API docs

## Performance Considerations

### Optimization Features
- **Async Processing** - Non-blocking operations
- **Connection Pooling** - Efficient database usage
- **Caching Strategy** - Response optimization
- **Rate Limiting** - Resource protection

### Monitoring
- **Real-time Metrics** - Datadog integration
- **Error Tracking** - Exception monitoring
- **Performance Profiling** - Request optimization

## Security Model

### Authentication Flow
1. **User Login** → JWT token generation
2. **Token Validation** → Middleware verification
3. **Permission Check** → Role-based access
4. **Resource Access** → Authorized operations

### Data Protection
- **Input Validation** - XSS/injection prevention
- **Password Security** - Bcrypt hashing
- **Session Management** - Secure token handling
- **CORS Configuration** - Cross-origin security

---

*This documentation reflects the actual sophisticated architecture of the VerticalFarm OS backend, correcting the previous oversimplified description. The system demonstrates enterprise-grade patterns suitable for production vertical farm operations.*