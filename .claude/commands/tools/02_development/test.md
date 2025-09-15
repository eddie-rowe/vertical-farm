# /test - Comprehensive Local Testing

Run comprehensive local testing including all test suites, linting, and type checking.

## Usage
```
/test
```

## Examples
```
/test
```

## Execution

When invoked with `/test`, execute these steps:

1. **Validate Environment**
   ```
   # Check if development environment is running
   docker-compose ps
   supabase status
   
   # If not running: "⚠️  Development environment not running. Run '/up' first"
   
   # Load context from previous development
   # Read: .claude/context/simple-context.yaml
   ```
   
2. **Begin Testing**
   **Output:**
   ```
   🧪 Starting comprehensive local testing...
   ```
   
   *Note: Context is automatically initialized by UserPromptSubmit hook*

3. **Run Backend Tests**
   ```
   # Execute Python tests
   cd backend && DISABLE_DATADOG="true" pytest
   ```
   **Output:**
   ```
   🐍 Running backend tests...
   ✅ Backend tests: X passed, Y skipped
   ```

4. **Run Frontend Tests**
   ```
   # Execute Next.js tests
   cd frontend && npm test
   ```
   **Output:**
   ```
   ⚛️ Running frontend tests...
   ✅ Frontend tests: X passed, Y skipped
   ```

5. **Run E2E Tests**
   ```
   # Execute Playwright tests
   cd frontend && npm run test:e2e
   ```
   **Output:**
   ```
   🎭 Running E2E tests...
   ✅ E2E tests: X passed
   ```

6. **Run Linting Checks**
   ```
   # Backend linting
   black backend --check --line-length 88
   flake8 backend
   
   # Frontend linting
   cd frontend && npm run lint
   ```
   **Output:**
   ```
   🔍 Running linting checks...
   ✅ Backend linting: Clean
   ✅ Frontend linting: Clean
   ```

7. **Run Type Checking**
   ```
   # Backend type checking
   cd backend && pyright
   
   # Frontend type checking
   cd frontend && npm run type-check
   ```
   **Output:**
   ```
   📝 Running type checks...
   ✅ Backend types: No errors
   ✅ Frontend types: No errors
   ```

8. **Generate Coverage Report**
   **Output:**
   ```
   📊 Test Coverage Summary:
     Backend:  85% coverage
     Frontend: 78% coverage
     E2E:      92% scenarios covered
   
   ✅ All tests completed successfully!
   
   💡 Next steps:
     - Review coverage gaps
     - Run '/validate {issue}' for feature validation
     - Deploy when ready: '/deploy {issue}'
   ```
   
   *Note: Test results are saved by PostToolUse hook for analysis*