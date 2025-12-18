# /vision - Product Vision Definition

Define or refine the product vision and identify gaps between current state and goals.

## Usage
```
/vision
```

## Examples
```
/vision
```

## Execution

When invoked with `/vision`, execute these steps:

1. **Begin Vision Definition**
   **Output:**
   ```
   🤖 Starting vision definition workflow...
   🎯 Reviewing goals and identifying gaps
   ```

2. **Execute Vision Workflow**
   ```
   # Execute the workflow in: .claude/commands/workflows/00_project_management/vision-definition.md
   ```
   **Output:**
   ```
   🔍 Gathering vision context...

   Claude will now:
     1. Review existing vision document
     2. Gather your input on goals and priorities
     3. Define success metrics
     4. Identify gaps between current and desired state
   ```

3. **Complete Vision**
   **Output:**
   ```
   ═══════════════════════════════════════════════════════════════
   ✅ Vision Updated
   ═══════════════════════════════════════════════════════════════

   📁 Vision saved: docs/planning/vision.md
   📂 Vision gaps captured for next steps

   💡 Next steps:
      • '/research <topic>' - Research solutions for vision gaps
      • '/roadmap' - Plan implementation milestones
   ═══════════════════════════════════════════════════════════════
   ```

## Output Location

`docs/planning/vision.md` (living document, updated in place)
