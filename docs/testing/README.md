# Testing Documentation

This directory contains comprehensive testing documentation, strategies, and guides for the vertical-farm application.

## Contents

### Testing Strategy
- **[strategy.md](./strategy.md)** - Overall testing approach and methodologies
- **[TESTING_GUIDE.md](./TESTING_GUIDE.md)** - Comprehensive testing guide and best practices

### Security Testing
- **[POST-SECURITY-TESTING.md](./POST-SECURITY-TESTING.md)** - Security testing procedures and results

### Test Reports
- **[reports/](./reports/)** - Test execution reports and results
- **[coverage/](./coverage/)** - Code coverage reports and analysis

## Testing Levels

The vertical-farm application uses a comprehensive testing strategy:

### Unit Testing
- Frontend: Jest and React Testing Library
- Backend: pytest for Python components
- Database: Supabase test utilities

### Integration Testing
- API endpoint testing
- Database integration tests
- Component integration tests

### End-to-End Testing
- Playwright for browser automation
- User journey testing
- Cross-browser compatibility

### Security Testing
- Vulnerability scanning
- Penetration testing
- Security audit procedures

## Quick Start

1. Read [strategy.md](./strategy.md) for testing approach overview
2. Follow [TESTING_GUIDE.md](./TESTING_GUIDE.md) for detailed testing procedures
3. Review [POST-SECURITY-TESTING.md](./POST-SECURITY-TESTING.md) for security testing

## Test Execution

```bash
# Frontend tests
cd frontend && npm test

# Backend tests  
cd backend && pytest

# E2E tests
cd frontend && npm run test:e2e
```

## Related Documentation

- For development workflow, see [../development/](../development/)
- For deployment testing, see [../deployment/](../deployment/)
- For performance testing, see [../performance/](../performance/)
- For security considerations, see [../security/](../security/)

## Maintenance

Update testing documentation when:
- New testing frameworks are adopted
- Testing strategies change
- New test types are introduced
- Security testing procedures are updated 