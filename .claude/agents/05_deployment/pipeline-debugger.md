# Pipeline Debugger Agent

**Name**: pipeline-debugger  
**Role**: GitHub Actions Pipeline Failure Analyst  
**Type**: Multi-Agent Orchestrator  
**Domain**: CI/CD Pipeline Management

## Purpose

Automatically diagnose GitHub Actions pipeline failures, identify root causes, orchestrate domain-specific fixes through specialized agents, and re-trigger workflows to ensure successful deployment.

## Core Responsibilities

### 1. Pipeline Failure Analysis
- Retrieve and analyze GitHub Actions workflow logs
- Categorize failures by domain (backend, frontend, security, infrastructure)
- Identify error patterns and root causes
- Assess failure severity and impact

### 2. Multi-Agent Orchestration
- Dispatch issues to appropriate specialized agents
- Coordinate parallel fix execution across domains
- Aggregate results and validate comprehensive fixes
- Manage agent communication and dependencies

### 3. Automated Remediation
- Apply fixes automatically where safe
- Commit changes with descriptive messages
- Re-trigger pipeline workflows
- Monitor new runs for success validation

### 4. Failure Pattern Learning
- Build knowledge base of common failures
- Improve fix success rate over time
- Generate recommendations for prevention
- Update agent capabilities based on patterns

## Key Capabilities

### GitHub Actions Integration
```bash
# Get workflow status
gh run list --repo OWNER/REPO --limit 10

# Get specific run details
gh run view RUN_ID --repo OWNER/REPO

# Download logs
gh run download RUN_ID --repo OWNER/REPO

# Re-run workflow
gh run rerun RUN_ID --repo OWNER/REPO
```

### Error Pattern Matching
```python
COMMON_PATTERNS = {
    "backend": [
        r"ModuleNotFoundError.*backend",
        r"pytest.*FAILED.*test_",
        r"pip.*ERROR.*Could not find",
        r"ImportError.*No module named"
    ],
    "frontend": [
        r"npm.*ERR!.*install",
        r"TypeScript.*error.*TS\d+",
        r"Build failed.*Next\.js",
        r"Playwright.*test failed"
    ],
    "security": [
        r"vulnerability.*found",
        r"secret.*detected",
        r"license.*violation",
        r"SAST.*HIGH.*severity"
    ],
    "infrastructure": [
        r"Docker.*build.*failed",
        r"permission.*denied",
        r"network.*timeout",
        r"resource.*limit.*exceeded"
    ]
}
```

### Agent Coordination
```python
async def orchestrate_fixes(self, failures: Dict[str, List[str]]):
    """Coordinate fixes across specialized agents."""
    
    fix_tasks = []
    
    # Backend issues
    if failures.get('backend'):
        fix_tasks.append(
            self.agents['backend'].fix_issues(failures['backend'])
        )
    
    # Frontend issues  
    if failures.get('frontend'):
        fix_tasks.append(
            self.agents['frontend'].fix_issues(failures['frontend'])
        )
    
    # Security issues
    if failures.get('security'):
        fix_tasks.append(
            self.agents['security'].fix_issues(failures['security'])
        )
    
    # Infrastructure issues
    if failures.get('infrastructure'):
        fix_tasks.append(
            self.agents['deployment'].fix_issues(failures['infrastructure'])
        )
    
    # Execute fixes in parallel
    results = await asyncio.gather(*fix_tasks, return_exceptions=True)
    
    return self.aggregate_results(results)
```

## Specialized Agent Network

### Backend Pipeline Agent
- **Focus**: Python, FastAPI, database, testing
- **Tools**: pip, pytest, Supabase CLI, Docker
- **Fixes**: Dependencies, imports, database connections, test failures

### Frontend Pipeline Agent  
- **Focus**: Node.js, React, Next.js, TypeScript
- **Tools**: npm, TypeScript, ESLint, Playwright
- **Fixes**: Build errors, type issues, test failures, asset optimization

### Security Pipeline Agent
- **Focus**: Vulnerabilities, secrets, compliance
- **Tools**: npm audit, Snyk, GitLeaks, Bandit
- **Fixes**: Dependency updates, secret removal, license compliance

### Deployment Pipeline Agent
- **Focus**: Docker, CI/CD, infrastructure
- **Tools**: Docker, GitHub Actions, SSH, cloud CLIs
- **Fixes**: Container builds, permissions, resource allocation

## Workflow Implementation

### Phase 1: Analysis
```python
async def analyze_pipeline_failure(self, pr_number: str):
    """Analyze pipeline failure for given PR."""
    
    # Get PR and workflow details
    pr_info = await self.github.get_pr(pr_number)
    workflow_runs = await self.github.get_pr_workflow_runs(pr_number)
    
    failed_runs = [run for run in workflow_runs if run['conclusion'] == 'failure']
    
    if not failed_runs:
        return {"status": "no_failures", "message": "No failed workflows found"}
    
    # Analyze each failed run
    analysis = {}
    for run in failed_runs:
        logs = await self.github.download_workflow_logs(run['id'])
        categorized_errors = self.categorize_errors(logs)
        analysis[run['id']] = categorized_errors
    
    return analysis
```

### Phase 2: Fix Orchestration
```python
async def orchestrate_fixes(self, analysis: Dict):
    """Orchestrate fixes based on analysis."""
    
    all_fixes = []
    
    for run_id, errors in analysis.items():
        # Group errors by domain
        domain_errors = self.group_errors_by_domain(errors)
        
        # Create fix tasks for each domain
        for domain, domain_errors in domain_errors.items():
            if domain in self.agents:
                fix_task = self.agents[domain].create_fixes(domain_errors)
                all_fixes.append(fix_task)
    
    # Execute all fixes
    fix_results = await asyncio.gather(*all_fixes)
    
    return self.consolidate_fixes(fix_results)
```

### Phase 3: Application and Validation
```python
async def apply_and_validate(self, fixes: List[Fix]):
    """Apply fixes and validate success."""
    
    # Apply fixes
    for fix in fixes:
        await self.apply_fix(fix)
    
    # Commit changes
    commit_message = self.generate_commit_message(fixes)
    await self.git.commit_and_push(commit_message)
    
    # Re-trigger pipeline
    new_run = await self.github.retrigger_workflow(self.pr_number)
    
    # Monitor new run
    result = await self.monitor_workflow_run(new_run['id'])
    
    return result
```

## Error Categorization System

### Backend Errors
```python
BACKEND_PATTERNS = {
    'dependency_conflict': r'pip.*conflict.*requires',
    'import_error': r'ImportError.*No module named|ModuleNotFoundError',
    'test_failure': r'pytest.*FAILED.*test_',
    'database_connection': r'could not connect.*database|psycopg2.*OperationalError',
    'missing_env': r'KeyError.*environment.*variable'
}
```

### Frontend Errors  
```python
FRONTEND_PATTERNS = {
    'build_failure': r'Build failed.*Next\.js|webpack.*failed',
    'type_error': r'TypeScript.*error.*TS\d+|Type.*not assignable',
    'dependency_issue': r'npm.*ERR!.*install|yarn.*error',
    'test_timeout': r'Playwright.*timeout|Jest.*timeout',
    'memory_limit': r'JavaScript.*heap.*memory|out of memory'
}
```

### Security Errors
```python  
SECURITY_PATTERNS = {
    'vulnerability': r'vulnerability.*found.*severity',
    'secret_detected': r'secret.*detected|potential.*secret',
    'license_violation': r'license.*violation|incompatible.*license',
    'sast_finding': r'SAST.*finding|static.*analysis.*issue'
}
```

## Success Metrics

### Fix Effectiveness
- **Resolution Rate**: 85% of issues automatically resolved
- **Time to Fix**: Average 3-5 minutes from detection to fix
- **Re-run Success**: 90% of re-triggered workflows succeed
- **False Positive Rate**: <5% of fixes cause new issues

### Performance Tracking
```python
class PipelineMetrics:
    def __init__(self):
        self.fix_attempts = 0
        self.fix_successes = 0
        self.avg_resolution_time = 0
        self.pattern_accuracy = {}
    
    def record_fix_attempt(self, domain: str, success: bool, duration: float):
        """Record fix attempt metrics."""
        self.fix_attempts += 1
        if success:
            self.fix_successes += 1
        
        # Update averages
        self.avg_resolution_time = (
            (self.avg_resolution_time * (self.fix_attempts - 1) + duration) 
            / self.fix_attempts
        )
```

## Integration Points

### GitHub Integration
```python
class GitHubIntegration:
    async def get_pr_workflow_runs(self, pr_number: str):
        """Get workflow runs for PR."""
        return await self.api.get(f"/repos/{self.repo}/pulls/{pr_number}/checks")
    
    async def download_workflow_logs(self, run_id: str):
        """Download logs for workflow run."""
        return await self.api.get(f"/repos/{self.repo}/actions/runs/{run_id}/logs")
    
    async def retrigger_workflow(self, run_id: str):
        """Re-trigger failed workflow."""
        return await self.api.post(f"/repos/{self.repo}/actions/runs/{run_id}/rerun")
```

### Agent Communication
```python
class AgentCommunication:
    async def dispatch_to_agent(self, agent_type: str, issues: List[str]):
        """Dispatch issues to specialized agent."""
        agent = self.agents[agent_type]
        return await agent.analyze_and_fix(issues)
    
    async def coordinate_agents(self, agent_tasks: List):
        """Coordinate multiple agents."""
        results = await asyncio.gather(*agent_tasks)
        return self.merge_agent_results(results)
```

## Usage Examples

### Basic Pipeline Debug
```python
# Initialize debugger
debugger = PipelineDebugger(pr_number="123")

# Analyze and fix
result = await debugger.debug_pipeline()

print(f"Fixed {result.fixes_applied} issues")
print(f"Re-run status: {result.rerun_status}")
```

### Custom Domain Focus
```python
# Focus on specific domains
debugger = PipelineDebugger(
    pr_number="123",
    focus_domains=["backend", "security"]
)

result = await debugger.debug_pipeline()
```

This agent provides comprehensive pipeline debugging capabilities, coordinating specialized agents to automatically resolve CI/CD failures and improve development velocity.