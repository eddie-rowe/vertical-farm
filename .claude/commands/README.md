# Claude Code Commands for Vertical Farm

Production-ready commands and workflows specifically configured for the Vertical Farm Management Platform.

## 📁 Directory Structure

```
.claude/commands/
├── README.md                    # This file
├── 2025-08-report.md           # Development report
├── tools/                      # Single-purpose utility commands
│   ├── accessibility-audit.md
│   ├── ai-assistant.md
│   ├── ai-review.md
│   ├── api-mock.md
│   ├── api-scaffold.md
│   ├── code-explain.md
│   ├── code-migrate.md
│   ├── compliance-check.md
│   ├── config-validate.md
│   ├── context-restore.md
│   ├── context-save.md
│   ├── cost-optimize.md
│   ├── data-pipeline.md
│   ├── data-validation.md
│   ├── db-migrate.md
│   ├── debug-trace.md
│   ├── deploy-checklist.md
│   ├── deps-audit.md
│   ├── deps-upgrade.md
│   ├── doc-generate.md
│   ├── docker-optimize.md
│   ├── error-analysis.md
│   ├── error-trace.md
│   ├── issue.md
│   ├── k8s-manifest.md
│   ├── langchain-agent.md
│   ├── monitor-setup.md
│   ├── multi-agent-optimize.md
│   ├── multi-agent-review.md
│   ├── onboard.md
│   ├── pr-enhance.md
│   ├── prompt-optimize.md
│   ├── refactor-clean.md
│   ├── security-scan.md
│   ├── slo-implement.md
│   ├── smart-debug.md
│   ├── standup-notes.md
│   ├── tech-debt.md
│   └── test-harness.md
└── workflows/                   # Multi-step orchestrated workflows
    ├── 01_planning/
    │   └── issue-analysis.md
    ├── 02_development/
    │   ├── feature-development.md
    │   └── full-review.md
    ├── 03_testing/
    │   ├── feature-testing.md
    │   └── feature-validation.md
    ├── 04_documentation/
    ├── 05_deployment/
    │   ├── git-workflow.md
    │   └── pipeline-debug.md
    ├── maintenance/
    │   ├── context-pruning.md
    │   ├── development-reflection.md
    │   └── improve-agent.md
    ├── performance/
    │   ├── multi-platform.md
    │   └── performance-optimization.md
    └── security/
        ├── incident-response.md
        └── security-hardening.md
```

## 🚀 Workflows (Multi-Step Orchestration)

Workflows orchestrate multiple operations across domains for complex tasks.

### Planning & Analysis
- **issue-analysis** - Analyze GitHub issues and create implementation plans

### Development
- **feature-development** - Complete feature implementation with backend, frontend, testing
- **full-review** - Comprehensive code review from multiple perspectives

### Testing & Validation
- **feature-testing** - Automated test suite generation and execution
- **feature-validation** - End-to-end validation including integration tests

### Deployment
- **git-workflow** - Git branching strategies and PR management
- **pipeline-debug** - CI/CD pipeline debugging and optimization

### Maintenance
- **context-pruning** - Clean up and optimize project context
- **development-reflection** - Analyze development patterns and improvements
- **improve-agent** - Enhance AI agent performance and prompt optimization

### Performance
- **multi-platform** - Cross-platform optimization strategies
- **performance-optimization** - End-to-end performance improvements

### Security
- **incident-response** - Production incident investigation and resolution
- **security-hardening** - Comprehensive security improvements

## 🔧 Tools (Single-Purpose Commands)

Focused utilities for specific operations.

### AI & Machine Learning
- **ai-assistant** - Build AI-powered features and chatbots
- **ai-review** - AI/ML code review and optimization
- **langchain-agent** - Create LangChain/LangGraph agents
- **prompt-optimize** - Optimize AI prompts for performance

### Architecture & Code Quality
- **code-explain** - Generate detailed code explanations
- **code-migrate** - Migrate between languages/frameworks
- **refactor-clean** - Refactor for maintainability
- **tech-debt** - Analyze and prioritize technical debt

### Data & Database
- **data-pipeline** - Design scalable data architectures
- **data-validation** - Implement validation systems
- **db-migrate** - Database migration strategies

### DevOps & Infrastructure
- **deploy-checklist** - Deployment configurations and checklists
- **docker-optimize** - Container optimization strategies
- **k8s-manifest** - Kubernetes deployment manifests
- **monitor-setup** - Monitoring and observability setup
- **slo-implement** - Service Level Objectives implementation

### Development & Testing
- **api-mock** - Create realistic API mocks
- **api-scaffold** - Generate production-ready API endpoints
- **test-harness** - Comprehensive test suite creation

### Security & Compliance
- **accessibility-audit** - Accessibility testing and fixes
- **compliance-check** - Regulatory compliance (GDPR, HIPAA)
- **security-scan** - Security scanning with remediation

### Debugging & Analysis
- **debug-trace** - Advanced debugging strategies
- **error-analysis** - Error pattern analysis
- **error-trace** - Production error diagnosis
- **issue** - Create well-structured GitHub issues
- **smart-debug** - Intelligent debugging assistance

### Dependencies & Configuration
- **config-validate** - Configuration validation
- **deps-audit** - Dependency security auditing
- **deps-upgrade** - Safe dependency upgrades

### Documentation & Collaboration
- **doc-generate** - Generate comprehensive documentation
- **pr-enhance** - Enhance pull request quality
- **standup-notes** - Generate standup meeting notes

### Cost & Resources
- **cost-optimize** - Cloud and infrastructure cost optimization

### Context Management
- **context-save** - Save project context and state
- **context-restore** - Restore saved context

### Team & Process
- **onboard** - New developer environment setup
- **multi-agent-optimize** - Multi-perspective optimization
- **multi-agent-review** - Multi-perspective code review

## 📊 Command Usage Examples

### For Vertical Farm Project

```bash
# Implement farm monitoring feature
/feature-development Add real-time sensor monitoring dashboard

# Security audit for farm data
/security-scan Check RLS policies and authentication flows

# Optimize Home Assistant integration
/performance-optimization Improve device polling and caching

# Debug sensor data issues
/smart-debug Investigate missing sensor readings in shelves

# Database migration for new features
/db-migrate Add harvest tracking tables with RLS

# Generate API documentation
/doc-generate Create OpenAPI docs for farm management endpoints

# Review farm hierarchy implementation
/full-review Analyze Farm → Row → Rack → Shelf relationships

# Optimize Docker containers
/docker-optimize Reduce container size for faster deployments

# Create monitoring dashboards
/monitor-setup Set up Grafana dashboards for farm metrics
```

## 🎯 Best Practices

### When to Use Workflows
- Complex features requiring multiple domains
- End-to-end implementations
- Multi-step processes with dependencies
- Comprehensive analysis and fixes

### When to Use Tools
- Specific, focused tasks
- Single-domain operations
- Quick fixes or analyses
- Building blocks for larger features

### Command Chaining
```bash
# Example: Complete feature implementation
/feature-development User authentication system
/test-harness Add integration tests for auth
/security-scan Audit authentication implementation
/docker-optimize Optimize auth service container
/k8s-manifest Deploy auth service to production
```

## 🔄 Integration with Vertical Farm

Commands are optimized for:
- **Supabase PostgREST** operations with RLS
- **FastAPI** integration endpoints
- **Next.js 15** with App Router
- **Home Assistant** device control
- **Farm hierarchy** (Farm → Row → Rack → Shelf)
- **Layer overlay system** for visualization
- **Service layer architecture** enforcement

## 📝 Adding Custom Commands

1. Create `.md` file in appropriate directory
2. Use `$ARGUMENTS` placeholder for user input
3. Follow naming convention: `lowercase-hyphen.md`
4. Include clear sections and examples

## 🐛 Troubleshooting

**Command not found**: Verify file exists in `.claude/commands/`
**Slow execution**: Workflows coordinate multiple operations
**Generic output**: Provide more project-specific context
**Integration issues**: Check file paths and dependencies

## 📚 Resources

- [Claude Code Documentation](https://docs.anthropic.com/en/docs/claude-code)
- [Vertical Farm CLAUDE.md](../../CLAUDE.md) - Project-specific guidance
- [Vertical Farm README](../../README.md) - Project overview