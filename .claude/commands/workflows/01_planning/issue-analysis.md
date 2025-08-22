Analyze GitHub issues and break them down into actionable development subtasks:

[Extended thinking: This workflow uses the github-issue-analyzer agent to retrieve, analyze, and decompose GitHub issues into detailed implementation plans that development teams can execute. The agent understands the project's architecture patterns and creates comprehensive subtask breakdowns.]

Use the Task tool to delegate to the GitHub Issue Analyzer agent:

**Issue Analysis & Decomposition**
- Use Task tool with subagent_type="github-issue-analyzer"
- Prompt: "Analyze GitHub issue(s): $ARGUMENTS. Pull the issue details, perform comprehensive requirement analysis, and break down into actionable subtasks with clear acceptance criteria, dependencies, and implementation approach."
- The agent will:
  1. Retrieve issue details from GitHub using the MCP server
  2. Analyze requirements, acceptance criteria, and technical implications
  3. Identify dependencies and integration points
  4. Break down into granular, actionable subtasks
  5. Update the GitHub issue with organized task breakdown
  6. Include effort estimates and implementation recommendations

The agent considers the vertical farming platform's architecture:
- Service layer patterns and authentication requirements
- Frontend/backend integration with Next.js 15 and FastAPI
- Supabase database and RLS considerations
- Real-time data handling and performance factors

Issue reference(s): $ARGUMENTS