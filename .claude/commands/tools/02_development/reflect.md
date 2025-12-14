# /reflect - Development Reflection

Analyze recent development patterns, identify improvements, and update workflows automatically.

## Usage
```
/reflect [commits] [scope]
```

## Examples
```
/reflect
/reflect 5
/reflect 10 typescript
/reflect 20 backend
```

## Execution

When invoked with `/reflect [commits] [scope]`, execute these steps:

1. **Parse Parameters**
   ```
   # Default commits: 10 if not specified
   # Default scope: "all" if not specified
   
   # Valid scopes: all, typescript, backend, testing, 
   #               infrastructure, database, security, performance
   ```
   
2. **Begin Reflection**
   **Output:**
   ```
   🔍 Starting Claude-powered reflection workflow...
   📊 Analyzing last {commits} commits with scope: {scope}
   ```
   
   *Note: Context is automatically initialized by UserPromptSubmit hook*

3. **Analyze Recent Development**
   ```
   # Analyze recent commits
   git log --oneline -n {commits}
   git diff HEAD~{commits}
   ```
   
   *Note: Context is automatically captured for reflection workflow*

4. **Execute Reflection Workflow**
   ```
   # Execute the workflow in: .claude/commands/workflows/maintenance/development-reflection.md
   # With arguments: COMMITS={commits} SCOPE={scope}
   ```
   **Output:**
   ```
   🤖 Invoking Claude with reflection workflow...
   
   Claude will:
     1. Analyze recent development patterns and challenges
     2. Review error logs and debugging sessions
     3. Update agent/workflow definitions to prevent similar issues
     4. Check style consistency across similar files
     5. Generate improvement recommendations
     6. Update .claude/ configurations automatically
   
   💡 Use '/reflect 5 typescript' to focus on specific areas
   ```

5. **Complete Reflection**
   **Output:**
   ```
   📂 Context saved and improvements applied
   💡 Review updated configurations and continue development with enhanced workflows
   ```
   
   *Note: Context is automatically saved by PostToolUse hook after reflection completes*

## Scope Options

- `all` - Complete analysis (default)
- `typescript` - Frontend TypeScript code
- `backend` - Python backend code
- `testing` - Test implementations
- `infrastructure` - DevOps/Docker
- `database` - Supabase/PostgreSQL
- `security` - Security patterns
- `performance` - Optimization opportunities