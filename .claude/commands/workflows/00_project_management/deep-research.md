Research solutions, patterns, and approaches for specific topics or vision gaps:

[Extended thinking: This workflow performs deep research on topics identified in vision gaps or specified by the user. It uses web search, documentation lookup, and codebase analysis to evaluate options and make recommendations.]

**Parse Research Topic**
- Extract topic from $ARGUMENTS
- Check if topic relates to a known vision gap from context
- Define research scope and questions to answer

**Research Execution**
Use Task tool with subagent_type="search-specialist" for web research:
- Prompt: "Research '$ARGUMENTS' with focus on:
  1. Best practices and industry standards
  2. Implementation patterns in similar projects
  3. Technology options and trade-offs
  4. Common pitfalls and how to avoid them
  5. Specific considerations for a Next.js 15 + FastAPI + Supabase stack

  Provide actionable recommendations with pros/cons for each approach."

**Documentation Lookup**
If topic relates to a specific technology:
- Use Context7 MCP to fetch relevant library documentation
- Use mcp__context7__resolve-library-id then mcp__context7__get-library-docs

**Codebase Analysis**
If topic relates to existing code:
- Use Task tool with subagent_type="Explore" to find relevant implementations
- Identify patterns already in use that could be extended

**Synthesis**
Combine findings into actionable recommendations:
- Recommended approach with justification
- Alternative approaches considered
- Implementation considerations
- Estimated complexity/effort

**Output Format**
Create `docs/planning/research/YYYY-MM-DD-{topic-slug}.md`:

```markdown
# Research: {Topic}

**Date:** YYYY-MM-DD
**Related Vision Gap:** [if applicable]
**Research Questions:**
1. ...
2. ...

## Executive Summary
[2-3 sentences with key recommendation]

## Background
[Why this research was needed]

## Findings

### Best Practices
- ...

### Technology Options

#### Option A: [Name]
**Pros:**
- ...

**Cons:**
- ...

**Fit for our stack:** [Good/Moderate/Poor]

#### Option B: [Name]
...

### Similar Implementations
[Examples from other projects]

### Common Pitfalls
- ...

## Recommendation
**Recommended Approach:** [Option name]

**Justification:**
...

**Implementation Notes:**
- ...

**Estimated Effort:** [Low/Medium/High]

## Next Steps
- [ ] ...

## Sources
- [Source 1](url)
- [Source 2](url)
```

Update context with research findings for `/roadmap` and `/issues` commands.
