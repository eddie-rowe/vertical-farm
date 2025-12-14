# /validate - Feature Validation

Comprehensively validate feature implementation using git diff analysis and Playwright testing.

## Usage
```
/validate <issue_number>
```

## Examples
```
/validate 65
/validate 123
/validate 42
```

## Execution

When invoked with `/validate <issue>`, execute these steps:

1. **Validate Input**
   ```
   # If no argument provided, show error:
   "❌ Please provide an issue number"
   
   # Show usage examples:
   "   /validate 65"
   "   /validate 123"
   
   # Parse issue number from argument
   ```
   
2. **Begin Validation**
   **Output:**
   ```
   🔍 Starting Claude-powered feature validation workflow...
   📋 Validating implementation for issue: {issue}
   ```
   
   *Note: Context is automatically initialized by UserPromptSubmit hook*

3. **Load Development Context**
   ```
   # Read: .claude/context/simple-context.yaml
   # Get analysis.requirements for validation criteria
   # Get implementation.files_modified to focus testing
   # Check session.phase == "development" to ensure ready
   ```
   
   *Note: Context hook (.claude/hooks/simple-context-hook.sh update) runs automatically*

4. **Execute Feature Validation**
   ```
   # Execute the workflow in: .claude/commands/workflows/03_testing/feature-validation.md
   # With argument: {issue}
   ```
   **Output:**
   ```
   🤖 Invoking Claude with feature validation workflow...
   
   Claude will:
     1. Analyze git diff to understand what changed
     2. Use Playwright to explore and validate features
     3. Test user workflows end-to-end
     4. Validate responsive design and accessibility
     5. Generate validation report with evidence
   
   💡 This workflow analyzes actual code changes and validates implementation
   ```

5. **Complete Validation**
   **Output:**
   ```
   📂 Context saved and available for next steps
   💡 After validation: '/deploy {issue}' to create PR and deploy
   ```
   
   *Note: Context is automatically saved by PostToolUse hook after validation completes*