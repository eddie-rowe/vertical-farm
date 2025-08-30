# Vertical Farm Feature Development Workflow

Implement features for the vertical farming platform using intelligent agent orchestration. Supports both GitHub issues and direct feature descriptions.

[Extended thinking: This workflow intelligently analyzes the input (GitHub issue or feature description) and orchestrates the most appropriate specialized agents. It ensures proper service layer architecture, RLS compliance, and modern React/Next.js patterns while adapting to the specific development context.]

## Intelligent Workflow Orchestration

**Input**: $ARGUMENTS (GitHub issue number/URL or feature description)

**Context**: Vertical farming platform with Next.js 15 + FastAPI + Supabase requiring service layer architecture and RLS compliance.

## Smart Agent Selection

The LLM should analyze the input and intelligently orchestrate these agents:

### Analysis & Requirements
- **backend-architect**: Determine if feature needs FastAPI (integrations, background tasks) or PostgREST (CRUD operations)
- **sql-pro**: Plan database schema changes and RLS policies for PostgREST API

### Implementation
- **typescript-pro**: Frontend service layer (mandatory singleton pattern) using Supabase client
- **frontend-developer**: Next.js components with proper Server/Client patterns  
- **python-pro**: Only if FastAPI backend needed (Home Assistant, payments, automation, complex integrations)

### Quality Assurance
- **test-automator**: Comprehensive test coverage strategy
- **code-reviewer**: Architecture compliance and quality review

## Adaptive Decision Making

The LLM should determine:
- Is this a GitHub issue or feature description?
- Does this feature need FastAPI backend or just PostgREST/Supabase?
- Which agents are essential vs optional for this specific task?
- What's the optimal sequence based on dependencies?
- Should agents run in parallel or sequentially?
- When to iterate vs proceed to next step?

## Architecture Decision Framework

**Use FastAPI when:**
- External integrations (Home Assistant, payment processing)
- Complex background tasks and automation
- Real-time processing requiring custom logic
- Data transformation beyond database capabilities
- Third-party API orchestration

**Use PostgREST/Supabase when:**
- Standard CRUD operations (farms, devices, users, grows)
- Database-driven features with RLS
- Simple data validation and constraints
- Real-time subscriptions via Supabase
- Most core business operations

## Architecture Requirements

All implementations must ensure:
- **Service Layer**: Mandatory for all data operations
- **RLS Policies**: Multi-tenant farm data protection
- **No Direct DB Calls**: Components must use services only
- **Error Handling**: Proper patterns at service layer
- **Type Safety**: Full TypeScript and Python typing
- **CLAUDE.md Compliance**: Follow all project patterns

Input: $ARGUMENTS
