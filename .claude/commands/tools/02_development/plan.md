# /plan - Issue Analysis & Planning

Analyze GitHub issues, break down requirements into subtasks, and create comprehensive implementation plans.

## Usage
```
/plan <issue_number_or_url>
```

## Examples
```
/plan 123
/plan https://github.com/user/repo/issues/123
/plan 65
```

## Execution

When invoked with `/plan <issue>`, execute these steps:

1. **Validate Input**
   ```
   # If no argument provided, show error:
   "❌ Please provide an issue number or URL"
   
   # Parse issue number from various formats (123, #123, URL)
   ```
   
2. **Begin Analysis**
   **Output:**
   ```
   🤖 Starting Claude-powered issue analysis workflow...
   📋 Analyzing issue: {issue}
   ```
   
   *Note: Context is automatically initialized by UserPromptSubmit hook*

3. **Execute Issue Analysis**
   ```
   # Execute the workflow in: .claude/commands/workflows/01_planning/issue-analysis.md
   # With argument: {issue}
   ```
   **Output:**
   ```
   🔍 Invoking Claude with issue analysis workflow...
   
   Claude will now:
     1. Retrieve issue details from GitHub
     2. Analyze requirements and acceptance criteria
     3. Break down into actionable subtasks
     4. Update the GitHub issue with implementation plan
   ```

4. **Complete Analysis**
   **Output:**
   ```
   📂 Context saved and available for next steps
   💡 After analysis, use '/dev {issue}' to continue with context
   ```
   
   *Note: Context is automatically saved by PostToolUse hook after Task completes*