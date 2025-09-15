# /dev - Feature Development

Orchestrate comprehensive feature development from GitHub issue or feature description.

## Usage
```
/dev <issue_number_or_url>
/dev <feature_description>
```

## Examples
```
/dev 123
/dev https://github.com/user/repo/issues/123
/dev "Add temperature monitoring dashboard"
```

## Execution

When invoked with `/dev <argument>`, execute these steps:

1. **Validate Input**
   ```
   # If no argument provided, show error:
   "❌ Please provide either an issue number or feature description"
   
   # Show usage examples:
   "   /dev 123"
   "   /dev https://github.com/user/repo/issues/123"
   "   /dev \"Add temperature monitoring dashboard\""
   
   # Parse argument to determine if GitHub issue (number/URL) or feature description
   ```
   
2. **Begin Development**
   **Output:**
   ```
   ⚡ Starting Claude-powered feature development workflow...
   ```
   
   *Note: Context is automatically initialized by UserPromptSubmit hook*

3. **Check Existing Context**
   ```
   # Read: .claude/context/simple-context.yaml
   # Check for analysis.requirements and analysis.subtasks from /plan
   # If session.phase == "planning", we have context to continue
   ```
   
   *Note: Context hook (.claude/hooks/simple-context-hook.sh update) runs automatically*

4. **Handle Input Type**
   
   **If GitHub Issue:**
   ```
   # Parse issue number from various formats (123, #123, URL)
   ```
   **Output:**
   ```
   📋 Developing from GitHub issue: {issue}
   🤖 Claude will first analyze the issue, then start development...
   ```
   
   **Check for Prior Analysis:**
   - If analysis exists in context: Skip re-analysis, proceed to implementation
   - If no prior analysis: Run /plan workflow first, then continue
   
   **If Feature Description:**
   ```
   # Handle as feature string
   ```
   **Output:**
   ```
   🔨 Developing feature: {feature}
   🤖 Invoking Claude with feature development workflow...
   ```
   
   - No prior analysis needed, start fresh
   - Use patterns from context for consistency

5. **Execute Feature Development**
   ```
   # Execute the workflow in: .claude/commands/workflows/02_development/feature-development.md
   # With argument: {issue} or {feature}
   ```
   **Output:**
   ```
   🔄 Claude will orchestrate specialized agents for:
     • Issue analysis (if GitHub issue provided)
     • Backend architecture & API design
     • Frontend components & service layer
     • Comprehensive testing coverage
     • Code review & quality assurance
   ```
   
   **Development Process:**
   - Use agents.recommended_next if available from /plan
   - Implement based on analysis.subtasks
   - Track implementation details for context
   - Apply appropriate agent selection logic

6. **Complete Development**
   **Output:**
   ```
   📂 Context saved and available for next steps
   💡 After development: '/validate {issue}' for validation
   ```
   
   *Note: Context is automatically saved by PostToolUse hook after agents complete*