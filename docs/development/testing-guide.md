# Testing Guide

Comprehensive testing strategy and implementation guide for the Vertical Farm project.

## 🎯 Testing Philosophy

We follow the **Testing Pyramid** approach:
- **Many Unit Tests** - Fast, isolated, high coverage
- **Some Integration Tests** - Component interaction validation  
- **Few E2E Tests** - Critical user journey validation
- **Continuous Production Testing** - Real-world validation

## 📁 Test Organization

```
vertical-farm/
├── backend/app/tests/          # Backend Python tests
│   ├── conftest.py            # Shared fixtures and mocks
│   ├── unit/                  # Unit tests
│   ├── integration/           # Integration tests
│   └── api/                   # API endpoint tests
├── frontend/tests/             # Frontend JavaScript/TypeScript tests
│   ├── unit/                  # Component unit tests
│   ├── integration/           # Feature integration tests
│   └── e2e/                   # End-to-end tests
├── tests/                      # Cross-system tests
│   ├── auth/                  # Authentication flow tests
│   ├── caching/              # Cache performance tests
│   ├── integration/          # Full-stack integration
│   └── iot/                  # IoT device tests
└── .github/workflows/tests.yml # CI/CD test automation
```

## 🚀 Running Tests

### Quick Commands

```bash
# Run ALL tests (recommended before committing)
./test-all.sh

# Backend tests only
cd backend && pytest -v
cd backend && pytest --cov=app --cov-report=html

# Frontend tests only  
cd frontend && npm test
cd frontend && npm run test:e2e

# Integration tests only
cd tests && node run-all-tests.js

# Specific test suites
pytest backend/app/tests/unit/          # Backend unit tests
pytest backend/app/tests/integration/   # Backend integration
npm test -- --testPathPattern=unit      # Frontend unit tests
```

### Docker Testing

```bash
# Run tests in Docker containers
docker-compose exec backend pytest
docker-compose exec frontend npm test

# Run with coverage
docker-compose exec backend pytest --cov=app
docker-compose exec frontend npm test -- --coverage
```

## ✍️ Writing Tests

### Backend Tests (Python/FastAPI)

#### Unit Test Example

```python
# backend/app/tests/unit/test_farm_service.py
import pytest
from unittest.mock import Mock, AsyncMock
from app.services.farm_service import FarmService
from app.schemas.farm import FarmCreate

@pytest.mark.asyncio
async def test_create_farm_with_valid_data():
    """Test that creating a farm with valid data returns the created farm."""
    # Arrange
    mock_db = AsyncMock()
    service = FarmService(mock_db)
    farm_data = FarmCreate(
        name="Test Farm",
        location="Test Location",
        size_sqm=100.0
    )
    
    # Act
    result = await service.create_farm(farm_data, user_id="test-user")
    
    # Assert
    assert result.name == farm_data.name
    assert result.location == farm_data.location
    mock_db.add.assert_called_once()
    mock_db.commit.assert_called_once()
```

#### Integration Test Example

```python
# backend/app/tests/integration/test_farm_endpoints.py
import pytest
from httpx import AsyncClient
from app.main import app

@pytest.mark.asyncio
async def test_farm_crud_workflow():
    """Test complete CRUD workflow for farms."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        # Create farm
        create_response = await client.post(
            "/api/v1/farms",
            json={"name": "Test Farm", "location": "Test", "size_sqm": 100},
            headers={"Authorization": f"Bearer {test_token}"}
        )
        assert create_response.status_code == 201
        farm_id = create_response.json()["id"]
        
        # Read farm
        get_response = await client.get(
            f"/api/v1/farms/{farm_id}",
            headers={"Authorization": f"Bearer {test_token}"}
        )
        assert get_response.status_code == 200
        assert get_response.json()["name"] == "Test Farm"
        
        # Update farm
        update_response = await client.patch(
            f"/api/v1/farms/{farm_id}",
            json={"name": "Updated Farm"},
            headers={"Authorization": f"Bearer {test_token}"}
        )
        assert update_response.status_code == 200
        
        # Delete farm
        delete_response = await client.delete(
            f"/api/v1/farms/{farm_id}",
            headers={"Authorization": f"Bearer {test_token}"}
        )
        assert delete_response.status_code == 204
```

#### Test Fixtures

```python
# backend/app/tests/conftest.py
import pytest
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.security import create_access_token

@pytest.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Provide a transactional database session for tests."""
    async with get_db() as session:
        yield session
        await session.rollback()

@pytest.fixture
def test_user():
    """Provide a test user object."""
    return {
        "id": "test-user-123",
        "email": "test@example.com",
        "role": "admin"
    }

@pytest.fixture
def auth_headers(test_user):
    """Provide authentication headers with test token."""
    token = create_access_token(test_user)
    return {"Authorization": f"Bearer {token}"}
```

### Frontend Tests (TypeScript/React)

#### Component Unit Test

```typescript
// frontend/tests/unit/components/FarmCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { FarmCard } from '@/components/features/agriculture/FarmCard'
import { mockFarm } from '../fixtures/farms'

describe('FarmCard', () => {
  it('renders farm information correctly', () => {
    render(<FarmCard farm={mockFarm} />)
    
    expect(screen.getByText(mockFarm.name)).toBeInTheDocument()
    expect(screen.getByText(mockFarm.location)).toBeInTheDocument()
    expect(screen.getByText(`${mockFarm.size_sqm} m²`)).toBeInTheDocument()
  })
  
  it('handles click events', async () => {
    const handleClick = jest.fn()
    render(<FarmCard farm={mockFarm} onClick={handleClick} />)
    
    const card = screen.getByRole('article')
    fireEvent.click(card)
    
    expect(handleClick).toHaveBeenCalledWith(mockFarm.id)
  })
  
  it('shows correct status indicator', () => {
    const offlineFarm = { ...mockFarm, status: 'offline' }
    render(<FarmCard farm={offlineFarm} />)
    
    const statusIndicator = screen.getByTestId('status-indicator')
    expect(statusIndicator).toHaveClass('state-offline')
  })
})
```

#### Service Test

```typescript
// frontend/tests/unit/services/FarmService.test.ts
import { FarmService } from '@/services/domain/farm/FarmService'
import { createClient } from '@/utils/supabase/client'

jest.mock('@/utils/supabase/client')

describe('FarmService', () => {
  let service: FarmService
  let mockSupabase: any
  
  beforeEach(() => {
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn()
    }
    ;(createClient as jest.Mock).mockReturnValue(mockSupabase)
    service = FarmService.getInstance()
  })
  
  describe('getFarmsByUser', () => {
    it('returns user farms successfully', async () => {
      const mockFarms = [{ id: '1', name: 'Farm 1' }]
      mockSupabase.select.mockResolvedValue({ data: mockFarms, error: null })
      
      const result = await service.getFarmsByUser('user-123')
      
      expect(result).toEqual(mockFarms)
      expect(mockSupabase.from).toHaveBeenCalledWith('farms')
      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', 'user-123')
    })
    
    it('handles errors gracefully', async () => {
      mockSupabase.select.mockResolvedValue({ 
        data: null, 
        error: { message: 'Database error' } 
      })
      
      await expect(service.getFarmsByUser('user-123')).rejects.toThrow('Failed to fetch farms')
    })
  })
})
```

#### Integration Test

```typescript
// frontend/tests/integration/farm-management.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FarmManagement } from '@/app/(app)/farms/page'
import { mockServer } from '../mocks/server'

describe('Farm Management Integration', () => {
  beforeAll(() => mockServer.listen())
  afterEach(() => mockServer.resetHandlers())
  afterAll(() => mockServer.close())
  
  it('completes farm creation workflow', async () => {
    const user = userEvent.setup()
    render(<FarmManagement />)
    
    // Open create form
    const createButton = screen.getByRole('button', { name: /create farm/i })
    await user.click(createButton)
    
    // Fill form
    await user.type(screen.getByLabelText(/farm name/i), 'New Test Farm')
    await user.type(screen.getByLabelText(/location/i), 'Test Location')
    await user.type(screen.getByLabelText(/size/i), '250')
    
    // Submit
    const submitButton = screen.getByRole('button', { name: /save/i })
    await user.click(submitButton)
    
    // Verify success
    await waitFor(() => {
      expect(screen.getByText('Farm created successfully')).toBeInTheDocument()
      expect(screen.getByText('New Test Farm')).toBeInTheDocument()
    })
  })
})
```

### E2E Tests (Playwright)

```typescript
// frontend/tests/e2e/farm-workflow.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Farm Management Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'testpassword')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')
  })
  
  test('create and manage farm', async ({ page }) => {
    // Navigate to farms
    await page.click('a[href="/farms"]')
    
    // Create new farm
    await page.click('button:has-text("Create Farm")')
    await page.fill('input[name="name"]', 'E2E Test Farm')
    await page.fill('input[name="location"]', 'E2E Location')
    await page.fill('input[name="size_sqm"]', '500')
    await page.click('button:has-text("Save")')
    
    // Verify creation
    await expect(page.locator('text=Farm created successfully')).toBeVisible()
    await expect(page.locator('text=E2E Test Farm')).toBeVisible()
    
    // Edit farm
    await page.click('button[aria-label="Edit E2E Test Farm"]')
    await page.fill('input[name="name"]', 'Updated E2E Farm')
    await page.click('button:has-text("Update")')
    
    // Verify update
    await expect(page.locator('text=Farm updated successfully')).toBeVisible()
    await expect(page.locator('text=Updated E2E Farm')).toBeVisible()
  })
})
```

## 🏭 Production Testing

### Load Testing

```javascript
// tests/performance/load-test.js
import http from 'k6/http'
import { check, sleep } from 'k6'

export const options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 0 },   // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    http_req_failed: ['rate<0.1'],    // Error rate under 10%
  },
}

export default function () {
  const res = http.get('http://localhost:8000/api/v1/farms')
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  })
  sleep(1)
}
```

### Production Monitoring

```python
# backend/app/tests/production/health_check.py
import asyncio
import aiohttp
from datetime import datetime

async def production_health_check():
    """Run production health checks."""
    checks = {
        'api_health': 'http://api.example.com/health',
        'database': 'http://api.example.com/api/v1/test/db-health',
        'cache': 'http://api.example.com/api/v1/test/cache-health',
        'home_assistant': 'http://api.example.com/api/v1/test/ha-health'
    }
    
    results = {}
    async with aiohttp.ClientSession() as session:
        for name, url in checks.items():
            try:
                async with session.get(url, timeout=5) as response:
                    results[name] = {
                        'status': response.status,
                        'healthy': response.status == 200,
                        'response_time': response.headers.get('X-Response-Time'),
                        'timestamp': datetime.utcnow().isoformat()
                    }
            except Exception as e:
                results[name] = {
                    'healthy': False,
                    'error': str(e),
                    'timestamp': datetime.utcnow().isoformat()
                }
    
    return results
```

### Chaos Engineering

```python
# tests/chaos/network_failures.py
import random
import asyncio

async def simulate_network_failures():
    """Simulate various network failure scenarios."""
    scenarios = [
        simulate_high_latency,
        simulate_packet_loss,
        simulate_connection_timeout,
        simulate_intermittent_failures
    ]
    
    for scenario in scenarios:
        print(f"Running: {scenario.__name__}")
        result = await scenario()
        print(f"Result: {result}")
        await asyncio.sleep(5)  # Cool down between scenarios

async def simulate_high_latency():
    """Add 500ms latency to all requests."""
    # Implementation using tc or proxy
    pass

async def simulate_packet_loss():
    """Drop 10% of packets randomly."""
    # Implementation using iptables or tc
    pass
```

## 📊 Test Coverage

### Coverage Goals

| Component | Target | Current | Status |
|-----------|--------|---------|--------|
| Backend Business Logic | 90% | 85% | 🟡 |
| Backend Overall | 80% | 75% | 🟡 |
| Frontend Components | 80% | 45% | 🔴 |
| Frontend Overall | 70% | 40% | 🔴 |
| Integration Tests | 100% | 90% | 🟡 |
| E2E Critical Paths | 100% | 80% | 🟡 |

### Generating Coverage Reports

```bash
# Backend coverage with HTML report
cd backend
pytest --cov=app --cov-report=html --cov-report=term
open htmlcov/index.html

# Frontend coverage with HTML report
cd frontend
npm test -- --coverage --watchAll=false
open coverage/lcov-report/index.html

# Combined coverage report
./scripts/generate-coverage-report.sh
```

### Coverage Configuration

```ini
# backend/.coveragerc
[run]
source = app
omit = 
    */tests/*
    */migrations/*
    */__pycache__/*

[report]
exclude_lines =
    pragma: no cover
    def __repr__
    raise AssertionError
    raise NotImplementedError
    if __name__ == .__main__.:
```

```javascript
// frontend/jest.config.js
module.exports = {
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.tsx',
    '!src/**/index.ts',
  ],
  coverageThresholds: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
}
```

## 🔄 CI/CD Testing

### GitHub Actions Workflow

```yaml
# .github/workflows/tests.yml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.13'
      - name: Install dependencies
        run: |
          cd backend
          pip install -r requirements.txt
          pip install -r requirements-dev.txt
      - name: Run linting
        run: |
          cd backend
          black --check .
          isort --check .
          flake8 .
      - name: Run type checking
        run: |
          cd backend
          mypy app/
      - name: Run tests with coverage
        run: |
          cd backend
          pytest --cov=app --cov-report=xml
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./backend/coverage.xml

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      - name: Install dependencies
        run: |
          cd frontend
          npm ci
      - name: Run linting
        run: |
          cd frontend
          npm run lint
      - name: Run type checking
        run: |
          cd frontend
          npm run type-check
      - name: Run tests with coverage
        run: |
          cd frontend
          npm test -- --coverage --watchAll=false
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./frontend/coverage/lcov.info

  e2e-tests:
    needs: [backend-tests, frontend-tests]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Start services
        run: docker-compose up -d
      - name: Wait for services
        run: |
          npm install -g wait-on
          wait-on http://localhost:3000 http://localhost:8000/health
      - name: Run E2E tests
        run: |
          cd frontend
          npm run test:e2e
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: frontend/playwright-report/
```

## 🐛 Debugging Tests

### Backend Debugging

```python
# Use pytest debugging
pytest -v -s  # Verbose with print statements
pytest --pdb  # Drop into debugger on failure
pytest --trace  # Drop into debugger at start

# Debug specific test
pytest backend/app/tests/test_farms.py::test_create_farm -vv

# Use logging in tests
import logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

def test_something():
    logger.debug("Debug information")
    # Test code
```

### Frontend Debugging

```javascript
// Use debug mode
npm test -- --no-coverage --verbose

// Debug specific test
npm test -- --testNamePattern="FarmCard"

// Use debug utilities
import { debug } from '@testing-library/react'

test('debug component', () => {
  const { container } = render(<Component />)
  debug(container)  // Prints DOM structure
})

// Use breakpoints
test('with breakpoint', () => {
  debugger;  // Execution stops here when debugging
  // Test code
})
```

## ✅ Test Quality Checklist

### Before Writing Tests
- [ ] Understand the requirement/bug being tested
- [ ] Plan test cases (happy path, edge cases, error cases)
- [ ] Set up proper test data/fixtures
- [ ] Consider test maintainability

### While Writing Tests
- [ ] Follow AAA pattern (Arrange, Act, Assert)
- [ ] Use descriptive test names
- [ ] One assertion per test (when possible)
- [ ] Mock external dependencies
- [ ] Clean up after tests

### After Writing Tests
- [ ] Tests pass locally
- [ ] Tests are deterministic (not flaky)
- [ ] Coverage increased or maintained
- [ ] Tests documented if complex
- [ ] CI/CD pipeline passes

## 📈 Testing Metrics

### Key Performance Indicators

- **Test Execution Time**: <5 minutes for unit tests
- **Test Reliability**: <1% flaky test rate
- **Coverage Trend**: Increasing or stable
- **Test-to-Code Ratio**: 1:1 minimum
- **Bug Detection Rate**: >80% caught by tests

### Monthly Testing Report

Track and report:
- Total tests written/updated
- Coverage changes
- Test execution time trends
- Flaky tests identified and fixed
- Production issues that tests missed

---

*Testing is not about finding bugs, it's about building confidence in our code.*