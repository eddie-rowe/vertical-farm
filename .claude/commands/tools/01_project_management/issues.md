# /issues - Generate GitHub Issues

Generate well-structured GitHub issues from the roadmap. This is the handoff point to the SDLC loop.

## Usage
```
/issues
```

## Examples
```
/issues
```

## Execution

When invoked with `/issues`, execute these steps:

1. **Begin Issue Generation**
   **Output:**
   ```
   🤖 Starting issue generation workflow...
   📋 Converting roadmap items to GitHub issues
   ```

2. **Execute Issue Generation Workflow**
   ```
   # Execute the workflow in: .claude/commands/workflows/00_project_management/issue-generation.md
   ```
   **Output:**
   ```
   🔍 Analyzing roadmap for issue creation...

   Claude will now:
     1. Review roadmap milestones and deliverables
     2. Check for existing issues to avoid duplicates
     3. Draft issue specifications
     4. Confirm with you before creating
     5. Create issues with proper labels and milestones
   ```

3. **Complete Issue Generation**
   **Output:**
   ```
   ═══════════════════════════════════════════════════════════════
   ✅ Issues Created
   ═══════════════════════════════════════════════════════════════

   📋 Created N new issues:

   | # | Title | Type | Milestone |
   |---|-------|------|-----------|
   | 123 | feat: Feature X | enhancement | v2.0 |
   | 124 | fix: Bug Y | bug | v2.0 |

   ⏭️ Ready for SDLC Loop:
      • Pick an issue to work on
      • Run '/plan <issue#>' to analyze and break down
      • Continue: /dev → /test → /validate → /deploy

   🔗 View issues: https://github.com/eddie-rowe/vertical-farm/issues
   ═══════════════════════════════════════════════════════════════
   ```

## Output

- GitHub issues with:
  - Descriptive titles with type prefix (feat:, fix:, etc.)
  - Acceptance criteria
  - Labels and milestones
  - Links to related issues

## Handoff to SDLC

After `/issues` creates issues, transition to development:

```
/issues creates #123
    ↓
/plan 123 → /dev 123 → /test → /validate 123 → /deploy 123
```
