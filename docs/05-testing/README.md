# Testing Documentation

This directory contains comprehensive testing documentation for the Vertical Farm project, covering development, integration, and production testing strategies.

## 📁 Testing Documentation Structure

### Core Testing Strategy
- **[Overview](#testing-overview)** - Testing philosophy and approach
- **[Strategy](#testing-strategy)** - Comprehensive testing strategy for all components
- **[Tools & Frameworks](#tools--frameworks)** - Testing tools and setup

### Specialized Testing
- **[Production Testing](./production-testing-strategy.md)** - Production-level testing and monitoring
- **[Security Testing](./security-testing.md)** - Security testing results and procedures

### Testing Results & Reports
- **[Security Test Results](./POST-SECURITY-TESTING-RESULTS.md)** - Latest security testing results

---

## Testing Overview

This document describes the comprehensive testing approach for the Vertical Farm project, covering backend FastAPI services, Next.js frontend, database operations, and external integrations.

## Testing Strategy

### Backend Testing (FastAPI)

#### Framework & Tools
- **Framework:** pytest, FastAPI TestClient
- **Coverage:** pytest-cov
- **Mocking:** unittest.mock, pytest-mock

#### Test Types

**Unit Tests**
- Business logic validation
- Pydantic model testing
- Utility function testing
- Error handling scenarios

**Integration Tests**
- API endpoint testing with TestClient
- Database interaction testing
- External service integration (Home Assistant, Supabase)
- Authentication and authorization flows

**Performance Tests**
- Response time benchmarks
- Concurrent request handling
- Database query performance
- Caching effectiveness

#### Running Backend Tests
```bash
cd backend
pytest                              # Run all tests
pytest -v                          # Verbose output
pytest --cov=app --cov-report=html # Coverage report
pytest tests/unit/                 # Run only unit tests
pytest tests/integration/          # Run only integration tests
```

### Frontend Testing (Next.js)

#### Framework & Tools
- **Framework:** Jest, React Testing Library
- **E2E Testing:** Playwright or Cypress
- **Visual Testing:** Storybook with Chromatic

#### Test Types

**Unit Tests**
- Component rendering and behavior
- Custom hooks testing
- Utility function validation
- Context providers and reducers

**Integration Tests**
- Form submission workflows
- API integration testing
- Navigation and routing
- Authentication flows

**End-to-End Tests**
- Complete user workflows
- Cross-browser compatibility
- Mobile responsiveness
- Performance testing

#### Running Frontend Tests
```bash
cd frontend
npm test                           # Run all tests
npm test -- --watch              # Watch mode
npm test -- --coverage           # Coverage report
npm run test:e2e                  # E2E tests (if configured)
```

### Database Testing

#### Supabase Testing Strategy
- **Test Database:** Separate Supabase project for testing
- **Data Seeding:** Automated test data creation
- **Migration Testing:** Database schema change validation
- **Performance Testing:** Query optimization validation

#### Test Types
- **Schema Tests:** Table structure and constraints
- **RLS Testing:** Row Level Security policy validation
- **Function Tests:** Database function and trigger testing
- **Performance Tests:** Query performance and indexing

```bash
# Database testing commands
npm run db:test:setup            # Setup test database
npm run db:test:seed             # Seed test data
npm run db:test:migrate          # Test migrations
npm run db:test:reset            # Reset test database
```

### Integration Testing

#### External Service Testing
- **Home Assistant Integration**
  - Connection handling and authentication
  - Device state synchronization
  - Error handling and recovery
  - WebSocket connection stability

- **Supabase Integration**
  - Authentication flows
  - Real-time subscriptions
  - Edge function testing
  - Background job processing

#### Testing External Services
```python
# Example integration test
async def test_home_assistant_integration():
    # Test connection
    connection = await ha_client.connect()
    assert connection.is_connected
    
    # Test device retrieval
    devices = await ha_client.get_devices()
    assert len(devices) > 0
    
    # Test error handling
    with pytest.raises(HAConnectionError):
        await ha_client.connect(invalid_url="http://invalid:8123")
```

### Performance Testing

#### Key Metrics
- **Response Time:** Target <200ms for API endpoints
- **Throughput:** Target >100 requests/second
- **Cache Hit Rate:** Target >80% for cacheable content
- **Database Performance:** Target <50ms for queries

#### Performance Testing Tools
```bash
# Load testing with k6
k6 run --vus 50 --duration 5m performance-test.js

# Database performance testing
python scripts/db_performance_test.py

# Frontend performance testing
npm run lighthouse:audit
```

### Security Testing

#### Security Test Coverage
- **Authentication:** JWT token validation and expiration
- **Authorization:** Role-based access control
- **Input Validation:** SQL injection and XSS prevention
- **API Security:** Rate limiting and CORS configuration
- **Data Protection:** PII handling and encryption

#### Security Testing Tools
```bash
# OWASP ZAP security scanning
docker run -t owasp/zap2docker-stable zap-api-scan.py \
  -t http://localhost:8000/openapi.json

# Dependency vulnerability scanning
npm audit
safety check
```

## Tools & Frameworks

### Testing Infrastructure

#### Backend (Python/FastAPI)
```python
# pytest configuration (pytest.ini)
[tool:pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts = 
    --strict-markers
    --disable-warnings
    --cov=app
    --cov-report=term-missing
    --cov-report=html
```

#### Frontend (Next.js/React)
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
  ],
}
```

### Continuous Integration

#### GitHub Actions Workflow
```yaml
name: Test Suite
on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - name: Install dependencies
        run: pip install -r requirements.txt
      - name: Run tests
        run: pytest --cov=app --cov-report=xml
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        
  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm test -- --coverage --watchAll=false
```

### Test Data Management

#### Test Database Setup
```sql
-- Create test-specific data
INSERT INTO test_users (id, email, role) VALUES
  ('test-user-1', 'test@example.com', 'admin'),
  ('test-user-2', 'user@example.com', 'user');

-- Create test farms and devices
INSERT INTO test_farms (id, name, user_id) VALUES
  ('test-farm-1', 'Test Farm', 'test-user-1');
```

#### Test Data Fixtures
```python
# conftest.py - Pytest fixtures
@pytest.fixture
async def test_client():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac

@pytest.fixture
def test_user():
    return {
        "id": "test-user-1",
        "email": "test@example.com",
        "role": "admin"
    }

@pytest.fixture
async def authenticated_client(test_client, test_user):
    # Create authenticated client
    token = create_test_jwt(test_user)
    test_client.headers = {"Authorization": f"Bearer {token}"}
    return test_client
```

## Coverage Goals

### Target Coverage
- **Backend:** 90%+ for critical business logic, 80%+ overall
- **Frontend:** 80%+ for components and utilities, 70%+ overall
- **Integration:** 100% for critical user paths
- **E2E:** 100% for main user workflows

### Coverage Reporting
```bash
# Generate coverage reports
pytest --cov=app --cov-report=html        # Backend
npm test -- --coverage --watchAll=false   # Frontend

# View coverage reports
open htmlcov/index.html                    # Backend
open coverage/lcov-report/index.html       # Frontend
```

## Best Practices

### Test Organization
1. **Structure:** Mirror source code structure in test directories
2. **Naming:** Use descriptive test names that explain the scenario
3. **Isolation:** Each test should be independent and idempotent
4. **Data:** Use factories and fixtures for test data creation
5. **Mocking:** Mock external dependencies to ensure test reliability

### Test Writing Guidelines
```python
# Good test example
async def test_create_farm_with_valid_data_creates_farm_successfully():
    """Test that creating a farm with valid data returns the created farm."""
    # Arrange
    farm_data = FarmFactory.build()
    
    # Act
    response = await client.post("/api/v1/farms", json=farm_data)
    
    # Assert
    assert response.status_code == 201
    assert response.json()["name"] == farm_data["name"]
    assert response.json()["id"] is not None
```

### Continuous Testing
1. **Pre-commit Hooks:** Run tests before commits
2. **CI/CD Integration:** Automated testing in pipelines
3. **Code Coverage:** Monitor and maintain coverage thresholds
4. **Performance Regression:** Alert on performance degradation

## Troubleshooting

### Common Issues

#### Test Database Connection
```bash
# Check database connection
export DATABASE_URL="postgresql://test_user:test_pass@localhost:5432/test_db"
python -c "import asyncpg; print('Connection successful')"
```

#### Missing Dependencies
```bash
# Backend
pip install -r requirements-dev.txt
pip install pytest pytest-asyncio pytest-cov

# Frontend
npm install --save-dev jest @testing-library/react @testing-library/jest-dom
```

#### Environment Variables
```bash
# Create test environment file
cp .env.example .env.test
# Update with test-specific values
```

## Related Documentation

- [Production Testing Strategy](./production-testing-strategy.md) - Production-level testing approach
- [Security Testing Results](./POST-SECURITY-TESTING-RESULTS.md) - Security test findings
- [Contributing Guide](../02-development/contributing.md) - Development workflow including testing
- [API Documentation](../03-api/README.md) - API testing endpoints

---

*Last Updated: [Current Date]*
*Consolidated from: strategy.md, TESTING_GUIDE.md* 