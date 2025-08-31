# Issue Finalization Workflow

Finalize completed issue by updating documentation, creating prompting logs, and closing the GitHub issue with comprehensive notes.

## Workflow Process

Use the Task tool with multiple specialized agents to finalize the issue:

### 1. Documentation Update
**Agent**: docs-architect
**Prompt**: "Review all changes in .claude/context/simple-context.yaml and git diff for issue $ARGUMENTS. Update relevant documentation:
- Update README.md if new features were added
- Update CONTRIBUTING.md if new patterns were established
- Update .claude/commands/README.md if new workflows were created
- Update any API documentation if endpoints changed
- Create or update architecture diagrams if structure changed"

### 2. Generate Prompting Log
**Agent**: general-purpose
**Prompt**: "Create a prompting log for issue $ARGUMENTS by:
1. Reading .claude/context/simple-context.yaml for context
2. Analyzing git log for commit messages
3. Reviewing the GitHub issue for original requirements
4. Creating a log file in .claude/logs/$(date +%Y-%m-%d)/issue-$ARGUMENTS.md with:

```markdown
# Issue $ARGUMENTS - Prompting Log
Date: $(date +%Y-%m-%d)
Branch: [branch name]

## Prompt
[Original issue description and requirements]

## Todos that were generated
[List of subtasks and todos created during development]

## Summary
[What was actually implemented, key decisions made, challenges overcome]

## Next Steps
[Any follow-up work, improvements, or related issues to consider]

## Follow up prompt
[Suggested prompt for continuing or enhancing this work]
```
"

### 3. Create Issue Summary
**Agent**: general-purpose  
**Prompt**: "Generate a comprehensive closing comment for GitHub issue $ARGUMENTS that includes:
- Summary of what was implemented
- List of files changed (from git diff)
- Key architectural decisions made
- Test results and validation status
- Documentation updates made
- Link to prompting log
- Any known limitations or future improvements

Format as a professional GitHub comment with proper markdown."

### 4. Close GitHub Issue
**Agent**: general-purpose
**Prompt**: "Using the GitHub MCP server:
1. Add the closing comment to issue $ARGUMENTS
2. Close the issue with appropriate labels (completed, documented)
3. Link any related PRs or follow-up issues"

### 5. Archive Context
**Agent**: general-purpose
**Prompt**: "Archive the current context by:
1. Copying .claude/context/simple-context.yaml to .claude/context/archive/issue-$ARGUMENTS-context.yaml
2. Clearing the current context for next issue
3. Creating a summary in .claude/context/archive/README.md"

## Success Criteria
- [ ] Documentation reflects all changes
- [ ] Prompting log captures development journey
- [ ] GitHub issue has comprehensive closing notes
- [ ] Context is archived for future reference
- [ ] Team can understand what was done and why

Input: $ARGUMENTS