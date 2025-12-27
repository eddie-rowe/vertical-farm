# /validate - Feature Validation

Comprehensively validate feature implementation using git diff analysis and Playwright testing.

[Extended thinking: Analyze git changes and use Playwright to validate feature implementation. This workflow explores the application, takes screenshots, tests user flows, and ensures the implementation matches requirements.]

## Usage
```
/validate <issue_number>
```

## Examples
```
/validate 65
/validate 123
```

## Agent Orchestration

| Agent | Purpose |
|-------|---------|
| **playwright-tester** | UI/UX validation, screenshot evidence, user flow testing |

## Execution

When invoked with `/validate <issue>`, execute these steps:

1. **Validate Input**
   ```
   # If no argument provided, show error:
   "❌ Please provide an issue number"

   # Parse issue number from argument
   ```

2. **Begin Validation**
   **Output:**
   ```
   🔍 Starting feature validation workflow...
   📋 Validating implementation for issue: {issue}
   ```

3. **Change Analysis**
   - Run `git diff main...HEAD` to see all changes
   - Analyze modified files to understand scope
   - Identify frontend components, backend endpoints, database changes

4. **Feature Exploration with Playwright**
   - Start development server if needed
   - Navigate to relevant pages
   - Interact with new/modified features
   - Take screenshots of key functionality
   - Validate user flows end-to-end

5. **Validation Checks**
   | Check | Description |
   |-------|-------------|
   | Functionality | Feature works as intended |
   | Responsive | Works on different screen sizes |
   | Error Handling | Edge cases handled gracefully |
   | Accessibility | Standards met (keyboard nav, contrast, labels) |
   | Integration | Works with existing features |

6. **Test Execution**
   - Run existing automated tests
   - Validate API endpoints with sample data
   - Check database constraints and RLS policies

7. **Generate Report**
   **Outputs:**
   - Git diff summary
   - Screenshot evidence of functionality
   - Validation checklist results
   - Recommendations for improvements

   **Success Criteria:**
   - All modified features accessible and functional
   - User workflows complete successfully
   - No critical accessibility or usability issues
   - Existing functionality unaffected
   - Code changes align with issue requirements

8. **Complete Validation**
   **Output:**
   ```
   ✅ Validation complete
   💡 Next step: '/deploy {issue}' to create PR
   ```
