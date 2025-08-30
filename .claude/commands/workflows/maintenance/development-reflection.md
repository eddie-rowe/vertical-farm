Analyze recent development patterns and improve agent definitions to prevent similar debugging issues:

[Extended thinking: This workflow analyzes recent development challenges to identify patterns in errors, debugging complexity, and workflow inefficiencies. It then delegates to specialized agents to improve development processes and prevent similar issues in the future.]

**Input**: $ARGUMENTS (format: COMMITS=N SCOPE=area)

## Agent Orchestration Strategy

Delegate analysis and improvements to specialized agents based on discovered patterns:

### Phase 1: Pattern Discovery
Use Task tool with **error-detective** agent:
- Analyze last N commits for error patterns and debugging sessions
- Search through logs, commit messages, and development challenges  
- Identify cascading error scenarios and repeated issues
- Classify problems by type: TypeScript, testing, build, architecture

### Phase 2: Style Consistency Analysis  
Use Task tool with **style-consistency-checker** agent:
- Compare similar files across codebase for pattern consistency
- Identify deviations from established project conventions
- Check service layer, component, and type definition patterns
- Generate standardization recommendations

### Phase 3: Agent Enhancement
Use Task tool with **prompt-engineer** agent:
- Update agent definitions based on discovered error patterns
- Add constraints to prevent identified anti-patterns
- Enhance validation steps for common failure points
- Improve error handling and early detection capabilities

### Phase 4: Workflow Optimization
Use Task tool with **dx-optimizer** agent:  
- Improve development tooling and command workflows
- Add prevention checkpoints for common failure patterns
- Update documentation with lessons learned
- Optimize build-test separation and resource management

## Vertical Farm Context Considerations

Focus on patterns specific to the platform:
- Service layer architecture adherence and violations
- TypeScript interface consistency across farm entities
- Test strategy optimization (unit vs E2E vs build validation)
- Supabase integration patterns and RLS compliance
- Next.js 15 Server/Client Component usage patterns

## Expected Outcomes

Each agent should contribute to preventing issues like:
- TypeScript property errors cascading through build pipeline
- E2E tests generating large files in local development  
- Build errors mixed with test failures causing debugging confusion
- Inconsistent patterns across similar service/component files
- Poor separation between local and CI testing strategies

Analysis scope: $ARGUMENTS