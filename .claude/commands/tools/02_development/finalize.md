# /finalize - Issue Finalization

Finalize completed issues with documentation updates, prompting logs, and closing notes.

## Usage
```
/finalize <issue_number>
```

## Examples
```
/finalize 65
/finalize 123
/finalize 42
```

## Execution

When invoked with `/finalize <issue>`, execute these steps:

1. **Validate Input**
   ```
   # If no argument provided, show error:
   "❌ Please provide an issue number"
   
   # Show usage examples:
   "   /finalize 65"
   "   /finalize 123"
   
   # Parse issue number from argument
   ```
   
2. **Begin Finalization**
   **Output:**
   ```
   📝 Starting issue finalization workflow...
   📋 Finalizing issue: {issue}
   ```
   
   *Note: Context is automatically initialized by UserPromptSubmit hook*

3. **Create Prompting Log**
   ```
   # Generate prompting log
   .claude/hooks/prompting-log.sh create-log "{issue}"
   
   # Save to: .claude/logs/{date}/issue-{issue}.md
   ```
   **Output:**
   ```
   🔧 Creating prompting log...
   📂 Prompting log saved to: .claude/logs/{date}/issue-{issue}.md
   ```

4. **Generate Closing Comment**
   ```
   # Generate comprehensive closing comment
   .claude/hooks/prompting-log.sh closing-comment "{issue}"
   
   # Save to temporary file
   > /tmp/closing-comment-{issue}.md
   ```
   **Output:**
   ```
   💬 Generating closing comment...
   📝 Closing comment saved to: /tmp/closing-comment-{issue}.md
   ```

5. **Execute Finalization Workflow**
   ```
   # Execute the workflow in: .claude/commands/workflows/06_finalization/issue-finalize.md
   # With argument: {issue}
   ```
   **Output:**
   ```
   🤖 Invoking Claude with finalization workflow...
   
   Claude will:
     1. Update relevant documentation
     2. Create comprehensive prompting log
     3. Generate closing notes for GitHub issue
     4. Close issue #{issue} with summary
     5. Archive context for future reference
   ```

6. **Reset Context**
   ```
   # Clear context for next issue
   .claude/hooks/prompting-log.sh reset
   ```
   **Output:**
   ```
   🔄 Resetting context for next issue...
   ```

7. **Complete Finalization**
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
   
   *Note: Finalization status is automatically saved for audit trail*