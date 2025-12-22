# /deploy - Issue Deployment

Deploy completed issue implementation with code review, git operations, and pull request creation.

## Usage
```
/deploy <issue_number>
```

## Examples
```
/deploy 65
/deploy 123
/deploy 42
```

## Execution

When invoked with `/deploy <issue>`, execute these steps:

1. **Validate Input**
   ```
   # If no argument provided, show error:
   "❌ Please provide an issue number"
   
   # Show usage examples:
   "   /deploy 65"
   "   /deploy 123"
   
   # Parse issue number from argument
   ```
   
2. **Begin Deployment**
   **Output:**
   ```
   🚀 Starting Claude-powered deployment workflow...
   📦 Deploying implementation for issue: {issue}
   ```
   
   *Note: Context is automatically initialized by UserPromptSubmit hook*

3. **Load Development Context**
   ```
   # Read: .claude/context/simple-context.yaml
   # Get implementation details from previous development
   # Verify all changes are committed locally
   ```
   
   *Note: Context hook (.claude/hooks/simple-context-hook.sh update) runs automatically*

4. **Execute Deployment Workflow**
   ```
   # Execute the workflow in: .claude/commands/workflows/04_deployment/issue-deployment.md
   # With argument: {issue}
   ```
   **Output:**
   ```
   🤖 Invoking Claude with deployment workflow...
   
   Claude will orchestrate:
     1. Code Quality Review & Final Testing
     2. Git Operations (add, commit, push)
     3. GitHub Issue Update (work summary)
     4. Pull Request Creation & Setup (with Review Guide)
     5. Deployment Preparation & Validation
     6. Team Notification & Review Assignment
   
   💡 This workflow handles complete issue deployment lifecycle
   ```

5. **Complete Deployment**
   **Output:**
   ```
   📂 Context saved and deployment initiated
   🔗 Pull Request created: https://github.com/{owner}/{repo}/pull/{pr_number}
   💡 Next steps:
     - Monitor CI/CD pipeline
     - Address review feedback
     - Run '/finalize {issue}' after merge
   ```
   
   *Note: Deployment status is automatically saved by PostToolUse hook*