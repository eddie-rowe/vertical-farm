# Testing Strategy – Vertical Farm

_Last Synced: 2025-05-17_

## Overview
This document describes the testing approach for both backend and frontend, including tools, coverage goals, and best practices.

---

## Backend
- **Framework:** pytest, FastAPI TestClient
- **Test Types:**
  - Unit tests for business logic and models
  - Integration tests for API endpoints
- **Coverage Goals:**
  - 90%+ for critical endpoints and logic
- **How to Run:**
  ```sh
  cd backend
  pytest
  ```

---

## Frontend
- **Framework:** Jest, React Testing Library
- **Test Types:**
  - Unit tests for components and utilities
  - Integration tests for forms, context, and API calls
- **Coverage Goals:**
  - 80%+ for UI components and logic
- **How to Run:**
  ```sh
  cd frontend
  npm test
  ```

---

## Best Practices
- Write tests for all new features and bugfixes
- Use descriptive test names and clear assertions
- Mock external dependencies (Supabase, APIs) in tests
- Run tests locally and in CI before merging PRs

---

## See Also
- [contributing-guide.md](./contributing-guide.md)
- [backend-architecture.md](./backend-architecture.md) 