# /dev - Feature Development

Orchestrate comprehensive feature development from GitHub issue or feature description.

[Extended thinking: Analyze the input and intelligently orchestrate the most appropriate specialized agents. Ensure proper service layer architecture, RLS compliance, and modern React/Next.js patterns while adapting to the specific development context.]

## Usage
```
/dev <issue_number_or_url>
/dev <feature_description>
```

## Examples
```
/dev 123
/dev https://github.com/user/repo/issues/123
/dev "Add temperature monitoring dashboard"
```

## Agent Orchestration

### Analysis & Requirements (invoke first)
| Agent | When to Use |
|-------|-------------|
| **backend-architect** | Always - Determine FastAPI vs PostgREST approach |
| **sql-pro** | If database schema changes or RLS policies needed |

### Implementation (based on analysis)
| Agent | When to Use |
|-------|-------------|
| **typescript-pro** | Always - Frontend service layer (mandatory singleton pattern) |
| **frontend-developer** | If UI components needed - Next.js Server/Client patterns |
| **python-pro** | Only if FastAPI backend required |

### Quality Assurance (after implementation)
| Agent | When to Use |
|-------|-------------|
| **test-automator** | Always - Comprehensive test coverage |
| **code-reviewer** | Always - Architecture compliance review |

## Architecture Decision Framework

**Use FastAPI when:**
- External integrations (Home Assistant, payment processing)
- Complex background tasks and automation
- Real-time processing requiring custom logic
- Third-party API orchestration

**Use PostgREST/Supabase when:**
- Standard CRUD operations (farms, devices, users, grows)
- Database-driven features with RLS
- Real-time subscriptions via Supabase
- Most core business operations (90% of features)

## Execution

When invoked with `/dev <argument>`, execute these steps:

1. **Validate Input**
   ```
   # If no argument provided, show error:
   "❌ Please provide either an issue number or feature description"

   # Parse argument to determine if GitHub issue (number/URL) or feature description
   ```

2. **Begin Development**
   **Output:**
   ```
   ⚡ Starting feature development workflow...
   ```

3. **Handle Input Type**

   **If GitHub Issue:**
   - Parse issue number from various formats (123, #123, URL)
   - Check for prior analysis from `/plan` - skip re-analysis if exists
   - Fetch issue details and requirements

   **If Feature Description:**
   - Start fresh with the provided description
   - Use patterns from CLAUDE.md for consistency

4. **Execute Development with Agent Orchestration**

   **Development Process:**
   1. Use `backend-architect` to determine architecture approach
   2. Use `sql-pro` if database changes needed
   3. Use `typescript-pro` for service layer implementation
   4. Use `frontend-developer` or `python-pro` based on requirements
   5. Use `test-automator` for test coverage
   6. Use `code-reviewer` for final review

   **Adaptive Decision Making:**
   - Use agents.recommended_next if available from /plan
   - Run independent agents in parallel when possible
   - Iterate on feedback before proceeding

5. **Architecture Requirements**

   All implementations must ensure:
   - **Service Layer**: Mandatory for all data operations
   - **RLS Policies**: Multi-tenant farm data protection
   - **No Direct DB Calls**: Components must use services only
   - **Type Safety**: Full TypeScript and Python typing
   - **CLAUDE.md Compliance**: Follow all project patterns

6. **Complete Development**
   **Output:**
   ```
   ✅ Development complete
   💡 Next step: '/validate {issue}' to test the implementation
   ```
