# Development Workflow Commands

This directory contains the core development workflow slash commands for the Vertical Farm project.

## Available Commands

### Environment & Setup
- `/up` - Start Development Environment

### Development Workflow
- `/plan` - Issue Analysis & Planning
- `/dev` - Feature Development
- `/validate` - Feature Validation
- `/test` - Comprehensive Local Testing
- `/deploy` - Issue Deployment
- `/finalize` - Issue Finalization

### Maintenance & Debugging
- `/pipeline` - Pipeline Debugging
- `/reflect` - Development Reflection

## Workflow Integration

### Complete Development Lifecycle

The full workflow from environment setup to issue closure:

```
/up → /plan 123 → /dev 123 → /test → /validate 123 → /deploy 123 → /finalize 123
```

1. **Setup**: Start development environment
2. **Plan**: Analyze the issue and create subtasks
3. **Develop**: Implement the feature using specialized agents
4. **Test**: Run comprehensive local tests
5. **Validate**: Test the implementation with Playwright
6. **Deploy**: Create PR and handle deployment
7. **Finalize**: Close issue with documentation

### Standard Development Flow

For typical feature development:

```
/plan 123 → /dev 123 → /validate 123 → /deploy 123
```

### Quick Development Flow

Skip planning when the issue is already well-defined:

```
/dev 123 → /test → /validate 123 → /deploy 123
```

### Standalone Feature Development

Develop features without a GitHub issue:

```
/dev "Add user preferences panel" → /test → /validate → /deploy
```

### Pipeline Troubleshooting

When CI/CD fails on a pull request:

```
PR created � Pipeline fails � /pipeline {pr} � Automatic fix � Pipeline passes
```

### Continuous Improvement

Periodically reflect on development patterns:

```
Development � /reflect � Improved workflows � Better development
```

Best used:
- After completing major features
- When encountering repeated issues
- During sprint retrospectives

## Context Flow

Each command in the workflow maintains context through `.claude/context/simple-context.yaml`:

- `/plan` creates initial analysis context
- `/dev` uses analysis to guide implementation
- `/validate` references implementation for testing
- Context is automatically managed by hooks

## Command Parameters

### Issue-based Commands
- Accept issue numbers: `123`
- Accept issue URLs: `https://github.com/user/repo/issues/123`
- Accept hash format: `#123`

### Feature-based Commands
- Accept feature descriptions: `"Add temperature monitoring"`
- Must be quoted if containing spaces

### Optional Parameters
- `/reflect [commits] [scope]` - Defaults to 10 commits, all scopes
- `/pipeline <pr>` - Requires PR number

## Hook Integration

All commands integrate with these hooks:
- **UserPromptSubmit**: Initializes context at command start
- **PostToolUse**: Saves context after agents complete
- **Simple Context Hook**: Updates `.claude/context/simple-context.yaml`

## Related Workflows

Each command executes a corresponding workflow:
- `/plan` � `.claude/commands/workflows/01_planning/issue-analysis.md`
- `/dev` � `.claude/commands/workflows/02_development/feature-development.md`
- `/validate` � `.claude/commands/workflows/03_testing/feature-validation.md`
- `/pipeline` � `.claude/commands/workflows/05_deployment/pipeline-debug.md`
- `/reflect` � `.claude/commands/workflows/maintenance/development-reflection.md`