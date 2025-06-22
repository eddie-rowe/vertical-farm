# 🧪 Testing Guide

This document outlines the testing strategy and organization for the Vertical Farm project.

## 📁 Test Organization

We use a **hybrid test organization** that balances maintainability with CI/CD efficiency:

```
vertical-farm/
├── backend/app/tests/          # Backend unit & integration tests
├── frontend/tests/             # Frontend unit & integration tests  
├── tests/                      # Cross-cutting tests (E2E, performance)
├── .github/workflows/tests.yml # Unified CI/CD workflow
└── test-all.sh                 # Local test runner
```

### 🐍 Backend Tests (`backend/app/tests/`)

**Current Status**: ✅ **Well-organized and functional**

```
backend/app/tests/
├── conftest.py                 # Shared fixtures and mocks
├── test_main.py               # Main application tests
├── test_cache_endpoints.py    # Cache API tests
├── test_home_assistant_endpoints.py  # Home Assistant API tests
├── unit/                      # Unit tests (recommended organization)
├── integration/               # Integration tests
└── __pycache__/              # Python cache (auto-generated)
```

**Framework**: pytest with async support
**Coverage**: 26+ tests covering critical endpoints
**Features**: 
- Proper async fixtures
- Supabase mocking
- Authentication testing
- Health check validation

### ⚛️ Frontend Tests (`frontend/tests/`)

**Current Status**: ⚠️ **Minimal coverage - needs expansion**

```
frontend/tests/
├── App.test.js               # Basic app test
├── unit/
│   └── grow-recipe-utils.test.ts  # Utility tests
├── component/                # Component tests (empty)
├── e2e/                     # E2E tests (empty)
└── integration/             # Integration tests (empty)
```

**Framework**: Jest + React Testing Library
**Coverage**: Very limited
**Needs**: Comprehensive component and integration tests

### 🔗 Cross-Cutting Tests (`tests/`)

**Current Status**: ✅ **Comprehensive and well-documented**

```
tests/
├── auth/                    # Authentication tests
├── caching/                 # Cache performance tests
├── integration/             # Full-stack integration tests
├── iot/                     # IoT device integration tests
├── queues/                  # Queue system tests
├── results/                 # Test results and reports
├── scripts/                 # Test runner scripts
├── run-all-tests.js        # Main integration test runner
└── README.md               # Detailed documentation
```

**Framework**: Mixed (Node.js, Python, SQL)
**Coverage**: Comprehensive cross-system testing
**Features**: Performance testing, real-time subscriptions, IoT integration

## 🚀 Running Tests

### Local Development

#### Run All Tests
```bash
# Run everything (recommended for pre-commit)
./test-all.sh

# Or run specific test suites
./test-all.sh backend
./test-all.sh frontend  
./test-all.sh integration
```

#### Backend Tests Only
```bash
cd backend
python -m pytest app/tests/ -v
```

#### Frontend Tests Only
```bash
cd frontend
npm test
```

#### Integration Tests Only
```bash
cd tests
node run-all-tests.js
```

### GitHub Actions CI/CD

Tests run automatically on:
- **Pull Requests** to `main` or `develop`
- **Pushes** to `main` or `develop`

#### Workflow Structure

1. **Backend Tests** (parallel)
   - Python setup and caching
   - Dependency installation
   - Code formatting (black, isort)
   - Type checking (mypy)
   - Unit tests (pytest)
   - Coverage reporting

2. **Frontend Tests** (parallel)
   - Node.js setup and caching
   - Dependency installation
   - Linting (ESLint)
   - Type checking (TypeScript)
   - Unit tests (Jest)
   - Coverage reporting

3. **Integration Tests** (after unit tests pass)
   - Start backend service
   - Run cross-cutting tests
   - Performance tests (main branch only)
   - Test result collection

4. **Test Summary**
   - Aggregate results
   - Generate reports
   - Upload artifacts

## 📊 Coverage & Quality

### Current Coverage
- **Backend**: 80%+ requirement (enforced by pytest)
- **Frontend**: Not yet configured
- **Integration**: Comprehensive but not measured by coverage

### Quality Gates
- **Code Quality**: black/isort (Python), ESLint (JavaScript/TypeScript)
- **Type Checking**: mypy (Python), TypeScript
- **Security**: Dependency scanning (planned)
- **Performance**: Baseline testing on main branch

## 🔧 Migration Recommendations

### Immediate Actions (High Priority)

1. **Expand Frontend Testing** 📈
   ```bash
   # Add Jest configuration
   cd frontend
   npm install --save-dev jest @testing-library/react @testing-library/jest-dom
   ```

2. **Organize Backend Tests** 📁
   ```bash
   cd backend/app/tests
   mkdir -p unit integration
   # Move specific test files to appropriate directories
   ```

3. **Clean Up Test Artifacts** 🧹
   ```bash
   # Remove old test results (keeping directory structure)
   rm -rf frontend/test-results/.last-run.json
   ```

### Medium-Term Improvements

1. **Add Component Tests** ⚛️
   - Test all React components
   - Test custom hooks
   - Test utility functions

2. **Improve Integration Coverage** 🔗
   - Add API client tests
   - Test user workflows
   - Add error scenario testing

3. **Performance Monitoring** 📊
   - Set up continuous performance testing
   - Add performance regression detection
   - Monitor API response times

### Long-Term Enhancements

1. **Visual Regression Testing** 👁️
   - Add Playwright or Cypress for E2E
   - Screenshot comparison testing
   - Cross-browser testing

2. **Contract Testing** 🤝
   - API contract testing between frontend/backend
   - Schema validation testing
   - Backward compatibility testing

3. **Security Testing** 🔒
   - Automated security scanning
   - Penetration testing integration
   - Dependency vulnerability scanning

## 🛠️ Development Workflow

### Pre-Commit Checklist
```bash
# 1. Run all tests locally
./test-all.sh

# 2. Check coverage
cd backend && python -m pytest --cov=app --cov-report=html

# 3. Format and type check
cd backend && black . && isort . && mypy app/
cd frontend && npm run lint && npm run format
```

### Adding New Tests

#### Backend Tests
```python
# app/tests/test_new_feature.py
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_new_feature(setup_test_environment, client):
    response = await client.get("/api/v1/new-feature")
    assert response.status_code == 200
```

#### Frontend Tests
```javascript
// frontend/tests/unit/components/NewComponent.test.js
import { render, screen } from '@testing-library/react';
import NewComponent from '@/components/NewComponent';

test('renders new component', () => {
    render(<NewComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
});
```

#### Integration Tests
```javascript
// tests/integration/test_new_integration.js
// Add to existing test suite in tests/run-all-tests.js
```

## 📋 Troubleshooting

### Common Issues

1. **Backend Tests Failing**
   ```bash
   # Check dependencies
   cd backend && pip install -r requirements.txt
   
   # Check environment variables
   export TESTING=true
   export SUPABASE_URL=your_test_url
   ```

2. **Frontend Tests Not Running**
   ```bash
   # Install dependencies
   cd frontend && npm install
   
   # Check test script exists
   grep '"test"' package.json
   ```

3. **Integration Tests Timeout**
   ```bash
   # Ensure backend is running
   curl http://localhost:8000/health
   
   # Check Supabase connection
   node -e "console.log(process.env.SUPABASE_URL)"
   ```

### Getting Help

- **Backend Issues**: Check `backend/app/tests/conftest.py` for fixture setup
- **Frontend Issues**: Review Jest configuration and React Testing Library docs
- **Integration Issues**: See `tests/README.md` for comprehensive documentation
- **CI/CD Issues**: Check `.github/workflows/tests.yml` and GitHub Actions logs

## 🎯 Success Metrics

### Short-term Goals (1-2 weeks)
- [ ] Frontend test coverage > 50%
- [ ] All critical user paths tested
- [ ] CI/CD pipeline running smoothly

### Medium-term Goals (1-2 months)
- [ ] Frontend test coverage > 80%
- [ ] Performance baseline established
- [ ] Security testing integrated

### Long-term Goals (3-6 months)
- [ ] Visual regression testing
- [ ] Cross-browser E2E testing
- [ ] Automated performance monitoring
- [ ] Contract testing between services

---

**Last Updated**: January 2025
**Maintained By**: Development Team
**Next Review**: February 2025 