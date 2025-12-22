# Issue Deployment Workflow

**Purpose**: Complete deployment lifecycle for implemented GitHub issues
**Command**: `make deploy ISSUE=##`
**Agents**: deployment-engineer, code-reviewer, github-issue-analyzer

## Overview

This workflow orchestrates the complete deployment process for a successfully implemented GitHub issue, handling code quality review, git operations, GitHub updates, and PR creation.

## Process

### 1. Pre-Deployment Validation
- **Agent**: code-reviewer
- Perform final code quality review of all changes
- Validate architectural compliance and patterns
- Ensure proper error handling and testing coverage
- Check for security vulnerabilities or anti-patterns
- Confirm coding standards adherence

### 2. Git Operations & Commit Preparation
- **Agent**: deployment-engineer
- Stage all relevant changes for the issue
- Create comprehensive commit message with:
  - Clear description of changes made
  - Reference to GitHub issue number
  - Summary of technical implementation
  - Breaking changes or migration notes (if any)
- Validate commit includes all necessary files
- Ensure no sensitive data or secrets are included

### 3. GitHub Issue Analysis & Update
- **Agent**: github-issue-analyzer  
- Analyze original GitHub issue requirements
- Generate comprehensive work summary covering:
  - Requirements that were implemented
  - Technical approach and architecture decisions
  - Database schema changes (migrations, new tables/columns)
  - Service layer enhancements and new methods
  - Component updates and UI changes
  - Testing and validation performed
  - Any limitations or future considerations
- Post detailed comment to GitHub issue with work summary
- Update issue labels (add "ready-for-review", remove "in-progress")

### 4. Pull Request Creation
- **Agent**: deployment-engineer
- Push feature branch to remote repository
- Create pull request with:
  - Descriptive title referencing the issue
  - Comprehensive description including:
    - Problem statement and solution approach
    - Technical implementation details
    - Database migrations and schema changes
    - Testing performed and validation results
    - Screenshots/evidence of functionality
    - Breaking changes or deployment considerations
  - Link to original GitHub issue
  - Appropriate labels and assignees
- Add PR template sections:
  - **Summary**: Brief overview of changes
  - **Technical Details**: Architecture and implementation notes
  - **Testing**: What testing was performed
  - **Deployment**: Any special deployment considerations
  - **Screenshots**: Visual evidence of functionality
  - **Review & Validation Steps**: Concise guide for reviewers including:
    - Key files/areas to focus code review on
    - Steps to test locally (commands, URLs, credentials if needed)
    - Feature validation checklist (what to verify works)
    - Database/migration checks (if applicable)
    - Edge cases or specific scenarios to test

### 5. Deployment Preparation
- **Agent**: deployment-engineer
- Verify all database migrations are included
- Check for any environment variable updates needed
- Validate Docker configurations if changed
- Ensure proper dependency management
- Create deployment checklist if complex changes
- Verify backward compatibility considerations

### 6. Review Assignment & Notification
- **Agent**: github-issue-analyzer
- Assign appropriate reviewers based on code changes:
  - Frontend changes: assign frontend developers
  - Backend changes: assign backend developers  
  - Database changes: assign database administrators
  - Full-stack changes: assign tech leads
- Add relevant stakeholders as reviewers
- Post notification comment with review request
- Set appropriate review requirements and checks

## Workflow Inputs

- **ISSUE**: GitHub issue number being deployed
- **BRANCH**: Current feature branch (auto-detected)
- **BASE_BRANCH**: Target branch for PR (defaults to main)

## Success Criteria

- All code changes committed and pushed successfully
- GitHub issue updated with comprehensive work summary
- Pull request created with detailed description and evidence
- Appropriate reviewers assigned and notified
- No security vulnerabilities or architectural violations
- All tests pass and feature is validated as working
- Database migrations are properly included and documented

## Usage

```bash
# Deploy completed issue
make deploy ISSUE=65

# The workflow will:
# 1. Review code quality and architecture
# 2. Commit and push changes with detailed message
# 3. Update GitHub issue with work summary
# 4. Create PR with comprehensive description
# 5. Assign reviewers and notify team
```

## Required Tools

- Git with proper authentication
- GitHub CLI (gh) for issue and PR management
- Access to the repository with push permissions
- Appropriate team member access for reviewer assignment

## Error Handling

- Pre-deployment validation failures halt the process
- Git operation failures are reported with recovery steps
- GitHub API failures include retry mechanisms
- Missing permissions are clearly communicated
- Rollback procedures for partial failures

## Security Considerations

- All commits are scanned for secrets and sensitive data
- PR descriptions avoid exposing internal system details
- Database migrations are reviewed for security implications
- Access controls and authentication are verified
- Security testing results are included in PR description