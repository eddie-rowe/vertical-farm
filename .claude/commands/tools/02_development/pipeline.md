# /pipeline - Pipeline Debugging

Automatically debug and fix GitHub Actions pipeline failures for pull requests.

## Usage
```
/pipeline <pr_number>
```

## Examples
```
/pipeline 123
/pipeline 456
/pipeline 789
```

## Execution

When invoked with `/pipeline <pr>`, execute these steps:

1. **Validate Input**
   ```
   # If no argument provided, show error:
   "❌ Please provide a PR number"
   
   # Show usage examples:
   "   /pipeline 123"
   "   /pipeline 456"
   
   # Parse PR number from argument
   ```
   
2. **Begin Pipeline Debugging**
   **Output:**
   ```
   🔧 Starting Claude-powered pipeline debugging workflow...
   🚨 Debugging pipeline for PR: {pr}
   ```
   
   *Note: Context is automatically initialized by UserPromptSubmit hook*

3. **Retrieve Pipeline Status**
   ```
   # Get failed workflow runs for the PR
   gh run list --limit 1 --branch {pr_branch}
   gh run view {run_id} --log-failed
   ```
   
   *Note: Context is automatically captured for pipeline workflow*

4. **Execute Pipeline Debug Workflow**
   ```
   # Execute the workflow in: .claude/commands/workflows/05_deployment/pipeline-debug.md
   # With argument: {pr}
   ```
   **Output:**
   ```
   🤖 Invoking Claude with pipeline debugging workflow...
   
   Claude will:
     1. Retrieve GitHub Actions logs and errors
     2. Analyze failure patterns and root causes
     3. Apply domain-specific fixes using specialized agents
     4. Re-trigger the workflow automatically
     5. Monitor and validate the fix
   
   💡 This workflow uses specialized agents for backend, frontend, security, and deployment fixes
   ```

5. **Complete Pipeline Fix**
   **Output:**
   ```
   📂 Context saved and available for next steps
   💡 Pipeline fixes applied and pushed. Monitor the re-triggered workflow for success
   ```
   
   *Note: Context is automatically saved by PostToolUse hook after fixes complete*