# /pipeline - Pipeline Debugging

Automatically debug and fix GitHub Actions pipeline failures for pull requests.

[Extended thinking: Analyze GitHub Actions pipeline failures, identify root causes using error patterns, apply domain-specific fixes with specialized agents (python-pro, javascript-pro, security-auditor, deployment-engineer), and re-trigger the workflow.]

## Usage
```
/pipeline <pr_number>
```

## Examples
```
/pipeline 123
/pipeline 456
```

## Agent Orchestration

| Domain | Agent | Handles |
|--------|-------|---------|
| Backend | **python-pro** | Python/FastAPI issues, test failures |
| Backend | **database-optimizer** | Database-related problems |
| Frontend | **javascript-pro** | Node.js/React issues, type errors |
| Frontend | **frontend-developer** | UI/component problems |
| Security | **security-auditor** | Vulnerabilities, compliance |
| Infrastructure | **deployment-engineer** | Docker/CI problems |

## Execution

When invoked with `/pipeline <pr>`, execute these steps:

1. **Validate Input**
   ```
   # If no argument provided, show error:
   "❌ Please provide a PR number"

   # Parse PR number from argument
   ```

2. **Begin Pipeline Debugging**
   **Output:**
   ```
   🔧 Starting pipeline debugging workflow...
   🚨 Debugging pipeline for PR: {pr}
   ```

3. **Retrieve Pipeline Status**
   ```bash
   gh run list --limit 1 --branch {pr_branch}
   gh run view {run_id} --log-failed
   ```
   - Get PR details and associated workflow runs
   - Identify failed jobs and their error logs
   - Categorize failures by domain

4. **Error Pattern Analysis**
   - Analyze error messages and stack traces
   - Identify common failure patterns
   - Determine severity and impact

5. **Domain-Specific Diagnosis & Fixes**

   **Backend Issues:**
   - `python-pro`: Python/FastAPI issues, dependency conflicts, test failures
   - `database-optimizer`: Database-related problems

   **Frontend Issues:**
   - `javascript-pro`: Node.js/React issues, type errors
   - `frontend-developer`: UI/component problems, build timeouts

   **Security Issues:**
   - `security-auditor`: Vulnerabilities, dependency updates, compliance

   **Infrastructure Issues:**
   - `deployment-engineer`: Docker/CI problems, resource allocation, permissions

6. **Apply Changes**
   - Commit all fixes with descriptive messages
   - Push changes to trigger new pipeline run

7. **Complete Pipeline Fix**
   **Output:**
   ```
   ✅ Pipeline fixes applied and pushed
   🔄 New workflow run triggered
   💡 Monitor the re-triggered workflow for success
   ```

## Failure Categories

| Category | Symptoms | Agent |
|----------|----------|-------|
| Test Failures | pytest/jest failures | python-pro, javascript-pro |
| Build Errors | Compilation/bundling fails | frontend-developer, deployment-engineer |
| Type Errors | TypeScript/mypy errors | typescript-pro, python-pro |
| Security Scan | Vulnerability alerts | security-auditor |
| Docker Issues | Container build fails | deployment-engineer |
| Dependency | Package conflicts | python-pro, javascript-pro |
