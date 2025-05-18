# Cursor Workflow Techniques: Deep Research Synthesis (r/cursor, May 2025)

_Last Synced: 2025-05-17_

## Introduction
This report distills the most powerful and efficient workflow techniques for Cursor, as discussed on [r/cursor](https://www.reddit.com/r/cursor/) and the Cursor Community Forum. It covers agent orchestration, safety/guardrails, prompt engineering, backup/recovery, and integration strategies, with actionable recommendations and a best practices checklist.

---

## Key Techniques & Patterns

### 1. **Agent Safety & Guardrails**
- **Non-Destructive Defaults:** Always enable settings/rules that prevent large-scale deletions or modifications without explicit approval ([source](https://forum.cursor.com/t/guardrails-against-large-scale-feature-removal/40374)).
- **Automatic Backups:** Configure automatic backups before agent-initiated edits. Use version control and, if possible, workspace snapshots.
- **Change Thresholds:** Set thresholds (e.g., >10% codebase change) to require user approval before proceeding.
- **Audit Trails:** Maintain logs of all agent actions for traceability and rollback.

### 2. **Frequent Commits & CI Integration**
- **Commit Often:** Users report that frequent commits and pushes to remote repos are the best defense against accidental loss ([source](https://forum.cursor.com/t/guardrails-against-large-scale-feature-removal/40374)).
- **CI Pipelines:** Integrate CI to catch regressions and enforce code quality after agent edits.

### 3. **Agent Role Separation & Orchestration**
- **Multi-Agent Agencies:** Assign distinct roles (e.g., Project Lead, Engineer, QA) to agents for complex projects ([source](https://forum.cursor.com/t/agent-advice-am-i-doing-it-wrong/34561)).
- **Orchestration Challenges:** Be aware that agent orchestration can break if context is lost or files are restructured. Document agent roles and requirements clearly.

### 4. **Prompt Engineering Best Practices**
- **Explicit Instructions:** Provide clear, role-specific instructions in agent prompts.
- **Context Windows:** Watch for context loss in long sessions; restart or split sessions as needed.
- **Denylist/Allowlist:** Use prompt-level or config-level denylists for dangerous shell commands.

### 5. **Backup/Restore & Recovery**
- **Restore Points:** Use Cursor’s restore/checkpoint features to recover from major errors ([source](https://forum.cursor.com/t/guardrails-against-large-scale-feature-removal/40374)).
- **Manual Backups:** For critical work, make manual backups before large refactors.

### 6. **File Locking & Protection**
- **Lock Critical Files:** Some users recommend file lock functions to prevent agent edits to sensitive files ([source](https://forum.cursor.com/t/guardrails-against-large-scale-feature-removal/40374)).

### 7. **Integration & Automation**
- **External Tools:** Integrate with shell scripts, PowerShell wrappers, and CI/CD for safe automation.
- **Logging & Monitoring:** Use detailed logs and monitoring for all agent-initiated operations.

---

## Common Pitfalls & Failure Modes
- **Cascading Deletions:** Agents can accidentally remove large portions of code if not properly constrained.
- **Loss of Context:** Long sessions or file restructuring can break agent orchestration.
- **Shell Command Risks:** Unrestricted shell access can lead to system-level damage.
- **Dependency on Agent Memory:** Don’t rely solely on agent memory for project state—use external documentation and checkpoints.

---

## Best Practices Checklist
- [ ] Enable agent safety/guardrail settings (deletion thresholds, backups, approval prompts)
- [ ] Commit and push frequently; use CI pipelines
- [ ] Separate agent roles and document their responsibilities
- [ ] Use explicit, role-specific prompts
- [ ] Maintain a denylist/allowlist for shell commands
- [ ] Lock critical files from agent edits
- [ ] Use restore points and manual backups before major changes
- [ ] Monitor agent actions with detailed logs
- [ ] Integrate with external tools for automation and safety

---

## References
- [Guardrails against large scale feature removal](https://forum.cursor.com/t/guardrails-against-large-scale-feature-removal/40374)
- [Agent Advice, Am I Doing it Wrong?](https://forum.cursor.com/t/agent-advice-am-i-doing-it-wrong/34561)
- [Best Practices & Setups for Custom Agents in Cursor](https://forum.cursor.com/t/best-practices-setups-for-custom-agents-in-cursor/76725)
- [Cursor Community Forum](https://forum.cursor.com/)

---

_Prometheus – Research Illuminator, May 2025_