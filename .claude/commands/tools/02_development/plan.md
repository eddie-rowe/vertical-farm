# /plan - Issue Analysis & Planning

Analyze GitHub issues, break down requirements into subtasks, and create comprehensive implementation plans.

[Extended thinking: Use the github-issue-analyzer agent to retrieve, analyze, and decompose GitHub issues into detailed implementation plans. The agent understands the project's architecture patterns and creates comprehensive subtask breakdowns.]

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

## Agent Orchestration

| Agent | Purpose |
|-------|---------|
| **github-issue-analyzer** | Retrieve issue, analyze requirements, create subtask breakdown |

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
   🤖 Starting issue analysis workflow...
   📋 Analyzing issue: {issue}
   ```

3. **Execute Issue Analysis**

   Use Task tool with `subagent_type="github-issue-analyzer"`:

   **Prompt:** "Analyze GitHub issue: {issue}. Pull the issue details, perform comprehensive requirement analysis, and break down into actionable subtasks with clear acceptance criteria, dependencies, and implementation approach."

   **Agent Actions:**
   1. Retrieve issue details from GitHub
   2. Analyze requirements, acceptance criteria, and technical implications
   3. Identify dependencies and integration points
   4. Break down into granular, actionable subtasks
   5. Update the GitHub issue with organized task breakdown
   6. Include effort estimates and implementation recommendations

   **Architecture Considerations:**
   - Service layer patterns and authentication requirements
   - Frontend/backend integration with Next.js 15 and FastAPI
   - Supabase database and RLS considerations
   - Real-time data handling and performance factors

4. **Complete Analysis**
   **Output:**
   ```
   ✅ Analysis complete
   💡 Next step: '/dev {issue}' to implement the plan
   ```
