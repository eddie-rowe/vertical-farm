# Issue Finalization Workflow

Complete the development lifecycle by documenting work, creating logs, and closing GitHub issues with comprehensive notes.

## Purpose

The finalization workflow ensures that:
- All work is properly documented
- Development journey is captured in prompting logs
- GitHub issues are closed with detailed summaries
- Context is archived for future reference
- The system is ready for the next issue

## Usage

```bash
make finalize ISSUE=123
```

This command will:
1. Generate a prompting log in `.claude/logs/YYYY-MM-DD/issue-123.md`
2. Create a comprehensive closing comment for the GitHub issue
3. Archive the current context to `.claude/context/archive/`
4. Invoke Claude to update documentation and close the issue
5. Reset context for the next development cycle

## Prompting Log Format

Each prompting log captures:
- **Prompt**: Original issue description
- **Todos**: Tasks that were generated and completed
- **Summary**: What was implemented, including commits and files
- **Next Steps**: Follow-up work or improvements to consider
- **Follow up prompt**: Suggested prompt for continuing the work

## GitHub Closing Comment

The generated closing comment includes:
- Implementation summary with commit count and files changed
- Key files modified
- Validation status
- Links to prompting logs and archived context
- Next steps for deployment

## Workflow Components

### 1. Prompting Log Generator (`prompting-log.sh`)
- Extracts information from git history
- Creates structured markdown logs
- Archives context automatically
- Generates closing comments

### 2. Finalization Workflow (`issue-finalize.md`)
- Updates relevant documentation
- Creates comprehensive logs
- Closes GitHub issues
- Archives all artifacts

### 3. Context Archival
- Saves current context to archive
- Preserves decision history
- Maintains audit trail
- Enables future reference

## Benefits

✅ **Complete Documentation**: Every issue has a full record
✅ **Knowledge Preservation**: Decisions and learnings are captured
✅ **Clean Handoff**: Issues are closed with all necessary information
✅ **Ready for Next**: Context is reset for the next issue
✅ **Team Visibility**: Everyone can see what was done and why

## Example Output

### Prompting Log Example
```markdown
# Issue 123 - Prompting Log
Date: 2024-01-15
Branch: feature-123-user-authentication

## Prompt
Implement user authentication with JWT tokens

## Todos that were generated
- Set up authentication service
- Create login/logout endpoints
- Implement JWT token generation
- Add authentication middleware
- Create user session management

## Summary
Implemented complete authentication system with JWT tokens...

## Next Steps
- Add refresh token mechanism
- Implement password reset flow
- Add OAuth providers

## Follow up prompt
"Add OAuth authentication providers (Google, GitHub) to the existing auth system"
```

### Closing Comment Example
```markdown
## ✅ Issue Completed

This issue has been successfully implemented and validated.

### 📊 Summary
- **Commits**: 8
- **Files Changed**: 15
- **Branch**: `feature-123-user-authentication`

### 📝 Implementation Details
- Implemented JWT authentication
- Added login/logout endpoints
- Created middleware for protected routes
- Added user session management

### ✅ Validation
- All tests passing
- Security review completed
- Documentation updated

### 📚 Documentation
- Prompting log: `.claude/logs/2024-01-15/issue-123.md`
- Context archived: `.claude/context/archive/issue-123-context.yaml`

### 🚀 Next Steps
Ready for merge and deployment
```

## Integration with Development Workflow

The finalization step completes the full development cycle:

```
plan → dev → test → validate → deploy → finalize
```

After finalization:
- The issue is closed with full documentation
- Context is cleared for the next issue
- Prompting logs are available for reference
- Team has complete visibility of work done

## Best Practices

1. **Always finalize before starting new work** - Ensures clean context
2. **Review the prompting log** - Verify it captures key decisions
3. **Check the closing comment** - Ensure it's comprehensive
4. **Archive important decisions** - They're valuable for future reference
5. **Use follow-up prompts** - They guide future enhancements

## Troubleshooting

If finalization fails:
- Check that you're on the correct branch
- Ensure the issue number is correct
- Verify git history is available
- Make sure context file exists

To manually reset context:
```bash
.claude/hooks/prompting-log.sh reset
```

## Summary

The finalization workflow ensures every piece of work is properly documented, closed, and archived. This creates a valuable knowledge base of development decisions and enables smooth transitions between issues.