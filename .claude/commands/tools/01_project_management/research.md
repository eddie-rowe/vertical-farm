# /research - Deep Research

Research solutions, patterns, and approaches for specific topics or vision gaps.

## Usage
```
/research <topic>
```

## Examples
```
/research real-time notifications
/research "mobile app architecture"
/research IoT device integration patterns
/research Next.js 15 caching strategies
```

## Execution

When invoked with `/research <topic>`, execute these steps:

1. **Validate Input**
   ```
   # If no argument provided, show error:
   "❌ Please provide a research topic"
   "Usage: /research <topic>"
   ```

2. **Begin Research**
   **Output:**
   ```
   🤖 Starting deep research workflow...
   🔬 Researching: {topic}
   ```

3. **Execute Research Workflow**
   ```
   # Execute the workflow in: .claude/commands/workflows/00_project_management/deep-research.md
   # With argument: {topic}
   ```
   **Output:**
   ```
   🔍 Conducting research...

   Claude will now:
     1. Search for best practices and standards
     2. Analyze similar implementations
     3. Evaluate technology options
     4. Document trade-offs and recommendations
   ```

4. **Complete Research**
   **Output:**
   ```
   ═══════════════════════════════════════════════════════════════
   ✅ Research Complete
   ═══════════════════════════════════════════════════════════════

   📁 Report saved: docs/planning/research/YYYY-MM-DD-{topic}.md
   📂 Findings captured for roadmap planning

   💡 Next steps:
      • '/roadmap' - Incorporate findings into roadmap
      • '/issues' - Create issues from recommendations
   ═══════════════════════════════════════════════════════════════
   ```

## Output Location

`docs/planning/research/YYYY-MM-DD-{topic-slug}.md`
