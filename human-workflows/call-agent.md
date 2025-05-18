# Main workflow:

0. Clarify my intention
1. Select the folder scope with: @desired-folder-name
2. Select the desired agent with: @prompt-name.md
3. Paste the following into the prompt chat (example below)
   1. Expected INPUT for that agent
   2. Expected OUTPUT for that agent
   3. MCP tools to use
4. Evaluate output in respective folder/file

## Example 1: Prometheus

**CONTEXT**: `@deep-research.md` `Repos/vertical-farm/`

**PROMPT**:

```sh

research_scope:
  - Perform thorough, deep, detailed research on the most powerful and efficient cursor workflow techniques and tools from 2025 sources only.
depth: detailed review
output_format: markdown summary
output_folder: /Users/eddie.rowe/Repos/vertical-farm/reports/summaries
tools:
  - sequential_thinking
  - browser

Ensure the sequential thinking MCP server is called first before executing on this prompt.
Ensure the output is to a markdown file in the output_folder - NOT to the chat window.
```


## Example 2: Ares

**CONTEXT**: `@security-analyst.md` `Repos/vertical-farm/`

**PROMPT**:

```sh

Perform thorough, deep, detailed research on cybersecurity vulnerabilities from 2025 sources only, use that information to look at our codebase, and make recommendations to remediate vulnerabilities and weaknesses.

attack_surface: 
   - frontend
   - backend
risk_tolerance: "medium"
compliance_requirements:
   - OWASP Top 10
   - NIST CSF
   - GDPR
output_format: markdown summary
output_folder: /Users/eddie.rowe/Repos/vertical-farm/reports/summaries
tools:
  - sequential_thinking
  - browser

Ensure the sequential thinking MCP server is called first before executing on this prompt.
Ensure the output is to a markdown file in the output_folder - NOT to the chat window.
```


## Example 3: Aphrodite

**CONTEXT**: `@ui-ux-designer.md` `Repos/vertical-farm/`

**PROMPT**:

```sh

Perform thorough, deep, detailed UI/UX analysis on the specified app_url and perform your role as specified in ui-ux-designer.md

mode: "analysis-and-report"
app_url: "http://localhost:3000"
screenshots_path:
output_format: markdown summary
output_folders: 
  - /Users/eddie.rowe/Repos/vertical-farm/reports/summaries
  - /Users/eddie.rowe/Repos/vertical-farm/reports/screenshots
tools:
  - sequential_thinking
  - playwright

Ensure the sequential thinking MCP server is called first before executing on this prompt.
Ensure the summary output is to a markdown file in the respective output_folders section - NOT to the chat window.
Ensure screenshots are saved in the respective output in the respective output_folders directory.
```