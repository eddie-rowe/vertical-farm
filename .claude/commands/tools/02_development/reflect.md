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

2. **Validate Prerequisites**
   ```
   # Check git repository exists
   git rev-parse --is-inside-work-tree

   # Verify sufficient commits exist
   COMMIT_COUNT=$(git rev-list --count HEAD)
   if [ $COMMIT_COUNT -lt {commits} ]; then
     echo "⚠️ Only {COMMIT_COUNT} commits available, analyzing all"
   fi
   ```

3. **Begin Reflection**
   **Output:**
   ```
   🔍 Starting development reflection workflow...
   📊 Analyzing last {commits} commits with scope: {scope}
   ```

4. **Gather Development Data**
   ```
   # Get commit history with details
   git log --oneline -n {commits}
   git log --stat -n {commits}

   # Get changed files summary
   git diff --stat HEAD~{commits}..HEAD

   # Check for any failed CI runs (if scope allows)
   gh run list --limit 5 --json status,conclusion,name
   ```
   **Output:**
   ```
   📋 Commit Summary:
     Total Commits: {count}
     Files Changed: {files}
     Additions: +{additions}
     Deletions: -{deletions}

   🔄 Recent CI Status:
     Passing: {pass_count}
     Failing: {fail_count}
   ```

5. **Phase 1: Error Pattern Analysis**
   ```
   # Launch error-detective agent to analyze patterns
   # - Search commit messages for "fix", "bug", "error"
   # - Identify debugging sessions from git history
   # - Classify issues by type based on scope
   ```
   **Output:**
   ```
   🔍 Error Pattern Analysis:

   Common Issues Found:
     - {pattern_1}: {count} occurrences
     - {pattern_2}: {count} occurrences

   Debugging Sessions:
     - {commit_sha}: {description}
   ```

6. **Phase 2: Code Quality Review**
   ```
   # Launch code-reviewer agent for consistency check
   # - Compare similar files for pattern consistency
   # - Check service layer adherence
   # - Verify type definition patterns
   ```
   **Output:**
   ```
   📊 Code Quality Assessment:

   Pattern Consistency: {score}/10
   Service Layer Compliance: {compliant}/{total}
   Type Coverage: {percentage}%

   Recommendations:
     - {recommendation_1}
     - {recommendation_2}
   ```

7. **Phase 3: Workflow Optimization**
   ```
   # Launch dx-optimizer agent for improvements
   # - Review development workflow efficiency
   # - Identify bottlenecks in build/test cycle
   # - Suggest tooling improvements
   ```
   **Output:**
   ```
   ⚡ Workflow Optimization:

   Current Bottlenecks:
     - {bottleneck_1}
     - {bottleneck_2}

   Suggested Improvements:
     - {improvement_1}
     - {improvement_2}
   ```

8. **Generate Reflection Report**
   ```
   # Create reflection summary and save to reports directory
   mkdir -p .claude/reports/reflections
   # Save to .claude/reports/reflections/YYYY-MM-DD-reflection.md
   ```
   **Output:**
   ```
   📝 Reflection Summary:

   Key Findings:
     ✅ {positive_pattern_1}
     ✅ {positive_pattern_2}
     ⚠️ {area_for_improvement_1}
     ⚠️ {area_for_improvement_2}

   Action Items:
     - [ ] {action_1}
     - [ ] {action_2}
   ```

9. **Complete Reflection**
   **Output:**
   ```
   ✅ Reflection complete!

   📊 Analysis Summary:
     Commits Analyzed: {commits}
     Scope: {scope}
     Issues Identified: {issue_count}
     Improvements Suggested: {improvement_count}

   💡 Next Steps:
     - Review action items above
     - '/dev' to continue development with insights
     - '/reflect 20' for deeper analysis

   📂 Report saved: .claude/reports/reflections/YYYY-MM-DD-reflection.md
   ```

## Report Storage

Reflection reports are saved to `.claude/reports/reflections/` with the naming convention:
- `YYYY-MM-DD-reflection.md` - Standard daily reflection
- `YYYY-MM-DD-reflection-{scope}.md` - Scope-specific reflection

Reports include:
- Executive summary
- Error pattern analysis with tables
- Code quality scores
- Workflow bottlenecks
- Prioritized action items

## Scope Options

| Scope | Focus Area | Files Analyzed |
|-------|------------|----------------|
| `all` | Complete analysis (default) | All changed files |
| `typescript` | Frontend TypeScript code | `frontend/src/**/*.ts(x)` |
| `backend` | Python backend code | `backend/**/*.py` |
| `testing` | Test implementations | `**/*.test.ts`, `**/*_test.py` |
| `infrastructure` | DevOps/Docker | `Dockerfile`, `docker-compose.*`, `.github/` |
| `database` | Supabase/PostgreSQL | `supabase/migrations/`, RLS policies |
| `security` | Security patterns | Auth, RLS, input validation |
| `performance` | Optimization opportunities | Caching, queries, bundle size |

## Agents Used

This command orchestrates multiple specialized agents:

1. **error-detective** - Analyzes error patterns and debugging sessions
2. **code-reviewer** - Checks code quality and pattern consistency
3. **dx-optimizer** - Suggests workflow and tooling improvements

## Integration

Pairs well with:
- `/dev` - Apply insights to new development
- `/test` - Verify improvements haven't introduced regressions
- `/pipeline` - Debug specific CI failures identified during reflection