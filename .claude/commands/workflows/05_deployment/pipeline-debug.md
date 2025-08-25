# Pipeline Debug and Fix Workflow

**Agent**: Pipeline Debugger  
**Type**: Multi-Agent Orchestration Workflow  
**Goal**: Automatically diagnose and fix GitHub Actions pipeline failures

## Overview

This workflow analyzes GitHub Actions pipeline failures, identifies root causes, applies domain-specific fixes using specialized Claude agents, and re-triggers the workflow.

## Usage

```bash
# From Makefile
make pipeline PR=123

# Direct command
Execute the workflow in .claude/commands/workflows/05_deployment/pipeline-debug.md with argument: PR_NUMBER
```

## Workflow Steps

### Phase 1: Pipeline Analysis

1. **Retrieve Pipeline Status**
   - Get PR details and associated workflow runs
   - Identify failed jobs and their error logs
   - Categorize failures by domain (backend, frontend, security, deployment)

2. **Error Pattern Analysis**
   - Analyze error messages and stack traces
   - Identify common failure patterns
   - Determine severity and impact

### Phase 2: Domain-Specific Diagnosis & Fixes
3. **Backend Issues**
   - Use `python-pro` agent to diagnose and fix Python/FastAPI issues
   - Use `database-optimizer` agent for database-related problems
   - Handle dependency conflicts, test failures, API endpoint issues

4. **Frontend Issues**
   - Use `javascript-pro` agent to diagnose and fix Node.js/React issues
   - Use `frontend-developer` agent for UI/component problems
   - Handle build timeouts, type errors, test failures

5. **Security Issues**
   - Use `security-auditor` agent to diagnose and fix vulnerabilities
   - Handle dependency updates, secret detection, compliance issues
   - Apply security policy fixes automatically

6. **Infrastructure Issues**
   - Use `deployment-engineer` agent to diagnose and fix Docker/CI problems
   - Handle resource allocation, network connectivity, permission issues
   - Optimize build configurations and deployment settings

### Phase 3: Integration
7. **Apply Changes**
   - Commit all fixes with descriptive messages
   - Push changes to trigger new pipeline run