# /merge - Pull Request Merge

Merge approved pull requests with pre-merge validation, CI verification, and post-merge cleanup.

## Usage
```
/merge <pr_number> [--strategy <squash|merge|rebase>]
```

## Examples
```
/merge 68
/merge 123 --strategy squash
/merge 42 --strategy rebase
```

## Execution

When invoked with `/merge <pr>`, execute these steps:

1. **Validate Input**
   ```
   # If no argument provided, show error:
   "❌ Please provide a PR number"

   # Show usage examples:
   "   /merge 68"
   "   /merge 123 --strategy squash"

   # Parse PR number and optional strategy (default: squash)
   ```

2. **Begin Merge Process**
   **Output:**
   ```
   🔀 Starting pull request merge workflow...
   📋 Merging PR: #{pr}
   ```

   *Note: Context is automatically initialized by UserPromptSubmit hook*

3. **Pre-Merge Validation**
   ```
   # Fetch PR status
   gh pr view {pr} --json title,state,reviewDecision,statusCheckRollup,mergeable,headRefName,baseRefName

   # Validate:
   # - PR is open (not already merged/closed)
   # - All required reviews approved
   # - All CI checks passing
   # - No merge conflicts
   # - Branch is up-to-date with base
   ```
   **Output:**
   ```
   🔍 Pre-Merge Checks:

   PR: #{pr} - {title}
   Branch: {head} → {base}

   ✅ State: Open
   ✅ Reviews: Approved ({count} approvals)
   ✅ CI Status: All checks passing
   ✅ Mergeable: Yes
   ✅ Up-to-date: Yes
   ```

4. **Handle Validation Failures**
   ```
   # If any check fails, report and offer remediation

   # Not approved:
   "❌ PR requires approval. Run '/review {pr}' to check status."

   # CI failing:
   "❌ CI checks failing. Run '/pipeline {pr}' to debug."

   # Merge conflicts:
   "❌ Merge conflicts detected. Please resolve conflicts first."
   "   git fetch origin && git rebase origin/{base}"

   # Out of date:
   "⚠️ Branch is behind {base}. Updating..."
   gh pr update-branch {pr}
   ```

5. **Confirm Merge Strategy**
   ```
   # Display merge strategy being used
   # Default: squash (combines all commits)
   ```
   **Output:**
   ```
   📝 Merge Strategy: {strategy}

   Squash: Combines all commits into single commit
   Merge:  Creates merge commit preserving history
   Rebase: Rebases commits onto base branch

   Proceeding with {strategy} merge...
   ```

6. **Execute Merge**
   ```
   # Perform the merge
   gh pr merge {pr} --{strategy} --delete-branch

   # Options:
   # --squash: Squash and merge (default)
   # --merge: Create merge commit
   # --rebase: Rebase and merge
   # --delete-branch: Delete head branch after merge
   ```
   **Output:**
   ```
   🔀 Merging PR #{pr}...

   ✅ Pull request merged successfully!
   🗑️ Branch '{head}' deleted
   ```

7. **Post-Merge Verification**
   ```
   # Verify merge was successful
   gh pr view {pr} --json state,mergedAt,mergedBy

   # Check deployment status (if applicable)
   gh run list --branch {base} --limit 1
   ```
   **Output:**
   ```
   ✅ Post-Merge Verification:

   Merged At: {timestamp}
   Merged By: {user}
   Merge Commit: {sha}

   🚀 Deployment Status:
     Pipeline: {running|completed|pending}
     URL: {deployment_url}
   ```

8. **Update Local Repository**
   ```
   # Switch to main branch and pull latest
   git checkout {base}
   git pull origin {base}

   # Clean up local feature branch
   git branch -d {head} 2>/dev/null || true
   ```
   **Output:**
   ```
   📂 Local Repository Updated:

   ✅ Switched to {base}
   ✅ Pulled latest changes
   ✅ Cleaned up local branch
   ```

9. **Link Related Issues**
   ```
   # Check for linked issues in PR body
   # Issues with "Closes #X" or "Fixes #X" are auto-closed

   # Report linked issues
   ```
   **Output:**
   ```
   🔗 Linked Issues:

   Auto-closed by this merge:
     - #{issue_1}: {title}
     - #{issue_2}: {title}

   💡 Run '/finalize {issue}' to complete documentation
   ```

10. **Complete Merge**
    **Output:**
    ```
    ✅ PR #{pr} merged successfully!

    📊 Summary:
      Strategy: {strategy}
      Commits: {count} → 1 (squashed)
      Files Changed: {files}
      Additions: +{additions}
      Deletions: -{deletions}

    💡 Next Steps:
      - '/finalize {issue}' - Complete issue documentation
      - '/reflect' - Review development patterns

    🎉 Great work!
    ```

    *Note: Merge status is automatically saved by PostToolUse hook*

## Merge Strategies

### Squash (Default)
- Combines all commits into a single commit
- Creates clean, linear history
- Best for feature branches with many small commits
- Commit message summarizes all changes

### Merge
- Creates a merge commit
- Preserves full branch history
- Best for long-running branches or releases
- Shows branch structure in history

### Rebase
- Rebases commits onto base branch
- Creates linear history without merge commits
- Best for small, well-organized branches
- Preserves individual commit messages

## Error Handling

### Common Issues

**PR Not Found**
```
❌ PR #{pr} not found. Check the PR number and try again.
```

**Already Merged**
```
ℹ️ PR #{pr} has already been merged.
   Merged at: {timestamp}
   Merge commit: {sha}
```

**Closed Without Merge**
```
❌ PR #{pr} was closed without merging.
   Use 'gh pr reopen {pr}' to reopen if needed.
```

**Protected Branch**
```
❌ Cannot merge: Branch protection rules not satisfied.
   Missing: {requirements}
   Run '/review {pr}' for details.
```

## Safety Features

- Pre-merge validation prevents merging broken code
- Automatic branch deletion keeps repository clean
- Local repository sync ensures consistency
- Issue linking provides traceability
- Deployment monitoring catches post-merge issues
