# Feature Validation Workflow

**Purpose**: Analyze git changes and use Playwright to validate feature implementation
**Command**: `make validate ISSUE=##`
**Agent**: playwright-validator

## Overview

This workflow provides comprehensive validation of feature implementations by:
1. Analyzing git diff to understand what changed
2. Using Playwright to explore and validate the feature
3. Checking that the implementation matches requirements
4. Running automated tests to ensure functionality

## Process

### 1. Change Analysis
- Extract issue number from ISSUE parameter
- Run `git diff main...HEAD` to see all changes
- Analyze modified files to understand scope of changes
- Identify frontend components, backend endpoints, database changes

### 2. Feature Exploration
- Start development server if needed
- Use Playwright to navigate to relevant pages
- Interact with new/modified features
- Take screenshots of key functionality
- Validate user flows end-to-end

### 3. Validation Checks
- Verify feature works as intended
- Check responsive design on different screen sizes
- Validate error handling and edge cases
- Ensure accessibility standards are met
- Confirm integration with existing features

### 4. Test Execution
- Run existing automated tests
- Create temporary tests for new functionality if needed
- Validate API endpoints with sample data
- Check database constraints and RLS policies

## Usage

```bash
# Validate current branch changes
make validate ISSUE=65

# The workflow will:
# 1. Show git diff summary
# 2. Start Playwright browser
# 3. Navigate to relevant features
# 4. Perform validation tests
# 5. Generate validation report
```

## Inputs Required

- **ISSUE**: Issue number being validated
- **BASE_BRANCH**: Branch to compare against (defaults to main)

## Outputs

- Git diff summary
- Screenshot evidence of functionality
- Validation checklist results
- Recommendations for improvements
- Test execution results

## Success Criteria

- All modified features are accessible and functional
- User workflows complete successfully
- No critical accessibility or usability issues
- Existing functionality remains unaffected
- Code changes align with issue requirements