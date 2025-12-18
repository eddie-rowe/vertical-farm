# /roadmap - Implementation Roadmap

Create or update the implementation roadmap with milestones, priorities, and dependencies.

## Usage
```
/roadmap
```

## Examples
```
/roadmap
```

## Execution

When invoked with `/roadmap`, execute these steps:

1. **Begin Roadmap Planning**
   **Output:**
   ```
   🤖 Starting roadmap planning workflow...
   🗺️ Building implementation roadmap
   ```

2. **Execute Roadmap Workflow**
   ```
   # Execute the workflow in: .claude/commands/workflows/00_project_management/roadmap-planning.md
   ```
   **Output:**
   ```
   🔍 Gathering roadmap context...

   Claude will now:
     1. Review vision and research findings
     2. Break vision into milestones
     3. Prioritize by dependencies and value
     4. Define acceptance criteria
     5. Create/update GitHub milestones
   ```

3. **Complete Roadmap**
   **Output:**
   ```
   ═══════════════════════════════════════════════════════════════
   ✅ Roadmap Updated
   ═══════════════════════════════════════════════════════════════

   📁 Roadmap saved: docs/planning/roadmap.md
   🏁 GitHub milestones synchronized

   Milestones:
     • Milestone 1: [Name] - [Target]
     • Milestone 2: [Name] - [Target]

   💡 Next steps:
      • '/issues' - Generate GitHub issues from roadmap
      • '/kanban' - Optimize project board
   ═══════════════════════════════════════════════════════════════
   ```

## Output Location

- `docs/planning/roadmap.md` (living document)
- GitHub milestones (synchronized)
