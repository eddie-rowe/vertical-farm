# /finalize - Issue Finalization

Finalize completed issues with documentation updates, prompting logs, and closing notes.

[Extended thinking: Complete the development lifecycle by updating documentation, creating prompting logs for future reference, generating comprehensive closing notes, and closing the GitHub issue. Archive context for audit trail.]

## Usage
```
/finalize <issue_number>
```

## Examples
```
/finalize 65
/finalize 123
```

## Agent Orchestration

| Step | Agent | Purpose |
|------|-------|---------|
| Documentation | **docs-architect** | Update README, API docs, architecture diagrams |
| Prompting Log | **general-purpose** | Create development journey log |
| Issue Summary | **general-purpose** | Generate closing comment |
| Close Issue | **general-purpose** | Close with labels, link PRs |
| Archive | **general-purpose** | Archive context for reference |

## Execution

When invoked with `/finalize <issue>`, execute these steps:

1. **Validate Input**
   ```
   # If no argument provided, show error:
   "❌ Please provide an issue number"

   # Parse issue number from argument
   ```

2. **Begin Finalization**
   **Output:**
   ```
   📝 Starting issue finalization workflow...
   📋 Finalizing issue: {issue}
   ```

3. **Documentation Update** (docs-architect)
   Review all changes and update:
   - README.md if new features were added
   - CONTRIBUTING.md if new patterns were established
   - API documentation if endpoints changed
   - Architecture diagrams if structure changed

4. **Generate Prompting Log** (general-purpose)
   Create log file at `.claude/logs/{date}/issue-{issue}.md`:

   ```markdown
   # Issue {issue} - Prompting Log
   Date: {date}
   Branch: {branch name}

   ## Prompt
   [Original issue description and requirements]

   ## Todos Generated
   [List of subtasks created during development]

   ## Summary
   [What was implemented, key decisions, challenges overcome]

   ## Next Steps
   [Follow-up work, improvements, related issues]

   ## Follow-up Prompt
   [Suggested prompt for continuing or enhancing this work]
   ```

5. **Create Issue Summary** (general-purpose)
   Generate comprehensive closing comment including:
   - Summary of what was implemented
   - List of files changed (from git diff)
   - Key architectural decisions made
   - Test results and validation status
   - Documentation updates made
   - Link to prompting log
   - Any known limitations or future improvements

6. **Close GitHub Issue** (general-purpose)
   - Add the closing comment to issue
   - Close with appropriate labels (completed, documented)
   - Link any related PRs or follow-up issues

7. **Archive Context** (general-purpose)
   - Archive context for future reference
   - Clear current context for next issue

8. **Complete Finalization**
   **Output:**
   ```
   ✅ Issue #{issue} finalized successfully!

   📊 Summary:
     - Documentation updated
     - Prompting log created
     - GitHub issue closed with summary
     - Context archived and reset

   💡 This completes the full development lifecycle for issue #{issue}
   🎯 Ready for next issue!
   ```

## Success Criteria

- Documentation reflects all changes
- Prompting log captures development journey
- GitHub issue has comprehensive closing notes
- Context is archived for future reference
- Team can understand what was done and why
