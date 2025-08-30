# Makefile for formatting, code checks, and workflow automation
# This will supercharge your local development, onboarding, CI/CD, 
# and documentation workflows - empowering both human and AI-driven processes.

BLACK_LINE_LENGTH=88
PYTHON_SRC=backend
NEXT_SRC=frontend

.PHONY: format lint test pr \\
	# Backend
	run-backend test-backend lint-backend install-backend \\
	# Frontend
	run-frontend build-frontend test-frontend test-frontend-e2e lint-frontend install-frontend \\
	# DevOps
	up down clean-docker \\
	# Docs & Agents
	docs-sync ux-analysis \\
	# Meta
	setup format-all test-all help \\
	# Security & Vulnerability Scanning
	security-python security-node security-docker security-secrets security-snyk-python security-snyk-node \\
	# Claude Workflows
	pipeline plan dev test validate deploy finalize reflect \
	# Context Management
	context context-show

# --- Backend Workflows ---

## Run the FastAPI backend server (dev mode)
run-backend:
	cd backend && uvicorn main:app --reload

## Run backend tests with pytest
test-backend:
	@echo "Running backend tests..."
	set -a; source .env; set +a; export PYTHONPATH=$(CURDIR)/backend:$$PYTHONPATH; cd backend && DISABLE_DATADOG="true" pytest

## Lint backend Python code with Black
lint-backend:
	black backend --check --line-length $(BLACK_LINE_LENGTH)

## Install backend dependencies
install-backend:
	cd backend && pip install -r requirements.txt

# --- Frontend Workflows ---

## Run the Next.js frontend dev server
run-frontend:
	cd frontend && npm run dev

## Build the frontend for production
build-frontend:
	cd frontend && npm run build

## Run frontend unit tests (Jest)
test-frontend:
	cd frontend && npm test

## Run frontend E2E tests (Playwright)
test-e2e:
	cd frontend && npm run test:e2e

## Lint frontend code (ESLint)
lint-frontend:
	cd frontend && npm run lint

## Install frontend dependencies
install-frontend:
	cd frontend && npm install

# --- DevOps / Full Stack ---

## Start local development environment (with Supabase CLI)
up:
	@echo "🚀 Starting complete local development environment..."
	@echo ""
	@# Check prerequisites
	@if ! command -v supabase &> /dev/null; then \
		echo "❌ Supabase CLI not found!"; \
		echo "Install it with: brew install supabase/tap/supabase"; \
		exit 1; \
	fi
	@if ! docker info &> /dev/null; then \
		echo "❌ Docker is not running! Please start Docker Desktop."; \
		exit 1; \
	fi
	@# Start Supabase if not running
	@if ! supabase status &> /dev/null; then \
		echo "1️⃣ Starting Supabase..."; \
		supabase start; \
	else \
		echo "✅ Supabase already running"; \
	fi
	@# Create .env.local with proper Docker networking
	@if [ ! -f .env.local ]; then \
		echo "2️⃣ Creating .env.local..."; \
		./scripts/create-env-local.sh; \
		sed -i '' 's|http://localhost:54321|http://host.docker.internal:54321|g' .env.local; \
		echo "✅ Created .env.local with Docker-compatible URLs"; \
	fi
	@# Run any pending migrations and seed data
	@echo "3️⃣ Checking database migrations and seeding data..."
	@if [ -f supabase/migrations/00000000000000_production_baseline.sql ]; then \
		supabase db reset || echo "⚠️  Database already up to date"; \
	fi
	@# Start Docker containers
	@echo "4️⃣ Starting application containers..."
	@docker-compose -f docker-compose.local.yml --env-file .env.local up -d
	@echo ""
	@echo "✅ Development environment ready!"
	@echo ""
	@echo "📍 Access:"
	@echo "  Frontend:        http://localhost:3000"
	@echo "  Backend API:     http://localhost:8000"
	@echo "  API Docs:        http://localhost:8000/docs"
	@echo "  Supabase Studio: http://localhost:54323"
	@echo ""
	@echo "📝 Next steps:"
	@echo "  View logs:    make logs"
	@echo "  Stop all:     make down"
	@echo "  Reset DB:     supabase db reset"

## Build and start services with Docker Compose (alternative to 'make up')
up-docker:
	docker-compose -f docker-compose.local.yml build && docker-compose -f docker-compose.local.yml up -d

## Stop local development environment (all services)
down:
	@echo "🛑 Stopping all services..."
	@docker-compose -f docker-compose.local.yml --env-file .env.local down || true
	@echo "✅ Docker containers stopped"
	@echo ""
	@echo "ℹ️  Supabase is still running. To stop it:"
	@echo "    supabase stop"

## Stop Docker services only
down-docker:
	docker-compose -f docker-compose.local.yml down

## Clean Docker artifacts (volumes, orphans)
clean-docker:
	docker-compose -f docker-compose.local.yml down -v --remove-orphans

## View logs for all services
logs:
	docker-compose -f docker-compose.local.yml --env-file .env.local logs -f

## View logs for specific service
logs-service:
	@read -p "Enter service name (backend/frontend/datadog): " service; \
	docker-compose -f docker-compose.local.yml --env-file .env.local logs -f $$service

# --- Environment Management ---

## Create environment template files
env-templates:
	@./scripts/create-env-template.sh

## Test with production configuration locally
test-prod:
	@./scripts/test-with-prod-config.sh

## Show current environment
env-check:
	@echo "Current Docker containers:"
	@docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "backend|frontend|dd-agent" || echo "No containers running"
	@echo ""
	@if [ -f .env.local ]; then \
		echo "Local environment (.env.local) exists ✓"; \
	else \
		echo "Local environment (.env.local) missing ✗"; \
	fi
	@if [ -f .env.production ]; then \
		echo "Production environment (.env.production) exists ✓"; \
	else \
		echo "Production environment (.env.production) missing ✗"; \
	fi

## Switch to local development environment
env-local:
	@echo "Switching to local development environment..."
	@make down
	@make up

# --- Database Management ---

## Open Supabase Studio (local database UI)
db-studio:
	supabase studio

## Reset database (drop and recreate with migrations)
db-reset:
	@echo "⚠️  This will DELETE all local data and recreate the database!"
	@read -p "Continue? (y/N) " -n 1 -r; \
	echo ""; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		supabase db reset; \
	else \
		echo "Cancelled."; \
	fi

## Show migration status
db-status:
	@echo "📊 Database Status:"
	@supabase status
	@echo ""
	@echo "📝 Migrations:"
	@supabase migration list

## Verify if local schema matches production
db-verify:
	@./scripts/verify-schema-sync.sh

## Sync schema from production
db-sync:
	@./scripts/sync-production-schema.sh

## Create a new migration from local changes
db-diff:
	@read -p "Enter migration name (e.g., add_user_settings): " name; \
	supabase db diff -f $$name

# --- Documentation & Agents ---

## Sync documentation using Hermes agent
docs-sync:
# Run the Hermes doc sync agent (customize as needed)
# cursor agents/docs/docs-updater.md

## Run Athena UI/UX competitive analysis agent
ux-analysis:
#cursor agents/frontend/competitive-analysis.md

# --- Meta / Quality of Life ---

## Install all dependencies (backend & frontend)
setup:
	$(MAKE) install-backend
	$(MAKE) install-frontend

## Format all code (backend & frontend)
format-all:
	$(MAKE) lint-backend
	$(MAKE) lint-frontend

## Run comprehensive local testing (mirrors GitHub Actions pipeline)
test-all: test-lint test-security test-build test-backend test-frontend
	@echo ""
	@echo "✅ All local tests completed successfully!"
	@echo "🚀 Your code should pass GitHub Actions pipeline"

## Run all tests separately for debugging
test-ci-tests:
	$(MAKE) test-backend
	$(MAKE) test-frontend

## Run all linting checks (mirrors GitHub Actions)
test-lint: test-lint-backend test-lint-frontend
	@echo "✅ All linting checks completed"

## Run backend linting (black, flake8, pyright)
test-lint-backend:
	@echo "🔍 Running backend linting checks..."
	cd backend && black --check --line-length $(BLACK_LINE_LENGTH) app/ || (echo "❌ Black formatting failed. Run: cd backend && black app/" && exit 1)
	cd backend && python -m flake8 app/ --max-line-length=88 --ignore=E203,W503 --select=E9,F63,F7,F82 || (echo "❌ Critical syntax errors found" && exit 1)
	@echo "  ⚠️  Pyright type checking (non-blocking):"
	cd backend && python -m pip install --upgrade pyright types-requests types-redis types-PyYAML || echo "Note: Failed to install type checking tools"
	cd backend && python -m pyright app/ || echo "  Note: Type errors found but not blocking"
	@echo "✅ Backend linting completed"

## Run frontend linting (ESLint, TypeScript)
test-lint-frontend:
	@echo "🔍 Running frontend linting checks..."
	# ESLint - Allow up to 9999 warnings, but fail on any errors
	@echo "  ⚠️  ESLint warnings:"
	cd frontend && npm run lint:ci
	# TypeScript - Strict type checking, fails on any type errors
	@echo "  ⚠️  TypeScript compilation:"
	cd frontend && npx tsc --noEmit --strict --skipLibCheck

	@echo "✅ Frontend linting completed"

## Run security checks (mirrors GitHub Actions security scans)
test-security: test-security-backend test-security-frontend test-security-secrets
	@echo "✅ All security checks completed"

## Run build checks (mirrors GitHub Actions builds)
test-build: test-build-frontend test-build-backend
	@echo "✅ All build checks completed"

## Run frontend build (mirrors GitHub Actions)
test-build-frontend:
	@echo "🏗️  Running frontend build check..."
	cd frontend && npm run build
	@echo "✅ Frontend build completed"

## Run backend build check (basic validation)
test-build-backend:
	@echo "🏗️  Running backend build check..."
	cd backend && python -m py_compile app/main.py
	@echo "✅ Backend build check completed"

## Run backend security checks
test-security-backend:
	@echo "🛡️  Running backend security checks..."
	cd backend && python -m pip install --upgrade pip-audit bandit || echo "⚠️  Failed to install security tools"
	cd backend && pip-audit --desc --output-format=json || echo "⚠️  Dependency vulnerabilities found (pip-audit may need requirements)"
	cd backend && bandit -r app/ -f json -o security-report.json || echo "⚠️  Security issues found in code"
	@echo "✅ Backend security checks completed"

## Run frontend security checks  
test-security-frontend:
	@echo "🛡️  Running frontend security checks..."
	cd frontend && npm audit --audit-level=moderate || echo "⚠️  Dependency vulnerabilities found"
	@echo "✅ Frontend security checks completed"

## Run secret scanning (basic local version)
test-security-secrets:
	@echo "🔍 Running basic secret detection..."
	@if command -v grep >/dev/null 2>&1; then \
		! grep -r -i -n -E "(password|secret|key|token).*=.*['\"][^'\"]{10,}" . --exclude-dir=.git --exclude-dir=node_modules --exclude-dir=venv || echo "⚠️  Potential secrets found - review carefully"; \
	fi
	@echo "✅ Secret scanning completed"

## Enhanced backend testing (mirrors GitHub Actions)
test-backend-enhanced:
	@echo "🧪 Running enhanced backend tests..."
	set -a; source .env; set +a; export PYTHONPATH=$(CURDIR)/backend:$$PYTHONPATH; cd backend && DISABLE_DATADOG="true" python -m pytest app/tests/unit/ -v --cov=app --cov-report=html:htmlcov-unit --junit-xml=test-results-unit.xml
	set -a; source .env; set +a; export PYTHONPATH=$(CURDIR)/backend:$$PYTHONPATH; cd backend && DISABLE_DATADOG="true" python -m pytest app/tests/integration/ -v --cov=app --cov-report=html:htmlcov-integration --junit-xml=test-results-integration.xml
	set -a; source .env; set +a; export PYTHONPATH=$(CURDIR)/backend:$$PYTHONPATH; cd backend && DISABLE_DATADOG="true" python -m pytest app/tests/api/ -v --cov=app --cov-report=html:htmlcov-api --junit-xml=test-results-api.xml
	@echo "✅ Enhanced backend tests completed"

## Enhanced frontend testing (mirrors GitHub Actions)
test-frontend-enhanced:
	@echo "🧪 Running enhanced frontend tests..."
	cd frontend && npm test -- --testPathPattern=tests/unit/ --coverage --coverageDirectory=coverage/unit --watchAll=false --passWithNoTests
	cd frontend && npm test -- --testPathPattern=tests/integration/ --coverage --coverageDirectory=coverage/integration --watchAll=false --testTimeout=30000 --passWithNoTests
	@echo "✅ Enhanced frontend tests completed"

## Auto-commit (OpenCommit), push, and open a PR (GitHub CLI required)
pr:
	git checkout -b "feature/auto-$(date +%s)" || true
	oco
	git push -u origin HEAD
	gh pr create --fill

# --- Security & Vulnerability Scanning ---

## Run Python security checks (pip-audit, bandit)
security-python:
	pip install --quiet pip-audit bandit
	pip-audit
	bandit -r backend/

## Run Node.js security checks (npm audit)
security-node:
	cd frontend && npm install
	cd frontend && npm audit --audit-level=high

## Run Docker image security checks (trivy)
security-docker:
	trivy image vertical-farm_backend:latest || echo "Build backend image first."
	trivy image vertical-farm_frontend:latest || echo "Build frontend image first."

## Run secrets scanning (gitleaks)
security-secrets:
	gitleaks detect --source .

## Run Snyk security checks for Python (backend)
security-snyk-python:
	cd backend && snyk test || echo "Snyk must be installed and authenticated."

## Run Snyk security checks for Node.js (frontend)
security-snyk-node:
	cd frontend && snyk test || echo "Snyk must be installed and authenticated."

## Run all security checks
security: security-python security-node security-docker security-secrets security-snyk-python security-snyk-node
	@echo "\\nAll security checks completed. Review output above."

# --- Claude-Powered Development Workflows ---

## Debug and fix GitHub Actions pipeline failures
pipeline:
	@echo "🔧 Starting Claude-powered pipeline debugging workflow..."
	@echo ""
	@if [ -z "$(PR)" ]; then \
		echo "❌ Please provide a PR number:"; \
		echo "   make pipeline PR=123"; \
		echo "   make pipeline PR=456"; \
		exit 1; \
	fi
	@echo "🚨 Debugging pipeline for PR: $(PR)"
	@echo "🤖 Invoking Claude with pipeline debugging workflow..."
	@echo ""
	@echo "Claude will:"
	@echo "  1. Retrieve GitHub Actions logs and errors"
	@echo "  2. Analyze failure patterns and root causes"
	@echo "  3. Apply domain-specific fixes using specialized agents"
	@echo "  4. Re-trigger the workflow automatically"
	@echo "  5. Monitor and validate the fix"
	@echo ""
	@echo "Opening Claude Code with pipeline debugging workflow..."
	@echo "Please run this command in Claude Code:"
	@echo ""
	@echo "Execute the workflow in .claude/commands/workflows/05_deployment/pipeline-debug.md with argument: $(PR)"
	@echo ""
	@echo "💡 This workflow uses specialized agents for backend, frontend, security, and deployment fixes"

## Start Claude-powered issue analysis and planning workflow
plan:
	@echo "🤖 Starting Claude-powered issue analysis workflow..."
	@echo ""
	@if [ -z "$(ISSUE)" ]; then \
		echo "❌ Please provide an issue number or URL:"; \
		echo "   make plan ISSUE=123"; \
		echo "   make plan ISSUE=https://github.com/user/repo/issues/123"; \
		exit 1; \
	fi
	@echo "📋 Analyzing issue: $(ISSUE)"
	@echo "📝 Updating context..."
	@.claude/hooks/simple-context-hook.sh update
	@echo "🔍 Invoking Claude with issue analysis workflow..."
	@echo ""
	@echo "Claude will now:"
	@echo "  1. Retrieve issue details from GitHub"
	@echo "  2. Analyze requirements and acceptance criteria"
	@echo "  3. Break down into actionable subtasks"
	@echo "  4. Update the GitHub issue with implementation plan"
	@echo ""
	@echo "📂 Context available in: .claude/context/simple-context.yaml"
	@echo ""
	@echo "Opening Claude Code with issue analysis workflow..."
	@echo "Please run this command in Claude Code:"
	@echo ""
	@echo "Execute the workflow in .claude/commands/workflows/01_planning/issue-analysis.md with argument: $(ISSUE)"
	@echo "Tell Claude to check .claude/context/simple-context.yaml for context"
	@echo ""
	@echo "💡 After analysis, use 'make dev ISSUE=$(ISSUE)' to continue with context"

## Start Claude-powered feature development workflow (supports both ISSUE and FEATURE)
dev:
	@echo "⚡ Starting Claude-powered feature development workflow..."
	@echo ""
	@# Handle both ISSUE and FEATURE parameters
	@if [ -n "$(ISSUE)" ]; then \
		echo "📋 Developing from GitHub issue: $(ISSUE)"; \
		.claude/hooks/simple-context-hook.sh update; \
		echo "🤖 Claude will first analyze the issue, then start development..."; \
		echo ""; \
		echo "Please run this command in Claude Code:"; \
		echo ""; \
		echo "Execute the workflow in .claude/commands/workflows/02_development/feature-development.md with argument: $(ISSUE)"; \
		echo "Tell Claude to check .claude/context/simple-context.yaml for previous context"; \
	elif [ -n "$(FEATURE)" ]; then \
		echo "🔨 Developing feature: $(FEATURE)"; \
		.claude/hooks/simple-context-hook.sh update; \
		echo "🤖 Invoking Claude with feature development workflow..."; \
		echo ""; \
		echo "Please run this command in Claude Code:"; \
		echo ""; \
		echo "Execute the workflow in .claude/commands/workflows/02_development/feature-development.md with argument: $(FEATURE)"; \
		echo "Tell Claude to check .claude/context/simple-context.yaml for patterns to follow"; \
	else \
		echo "❌ Please provide either an issue number or feature description:"; \
		echo "   make dev ISSUE=123"; \
		echo "   make dev ISSUE=https://github.com/user/repo/issues/123"; \
		echo "   make dev FEATURE=\"Add temperature monitoring dashboard\""; \
		exit 1; \
	fi
	@echo ""
	@echo "🔄 Claude will orchestrate specialized agents for:"
	@echo "  • Issue analysis (if GitHub issue provided)"
	@echo "  • Backend architecture & API design"
	@echo "  • Frontend components & service layer"
	@echo "  • Comprehensive testing coverage"
	@echo "  • Code review & quality assurance"
	@echo ""
	@echo "💡 After development: 'make test FEATURE=\"your feature\"' for validation"

## Run comprehensive local testing (same as test-all, primary command)
test: test-all

## Claude-powered feature testing workflow (moved from test)
test-feature:
	@echo "🧪 Starting Claude-powered feature testing workflow..."
	@echo ""
	@if [ -z "$(FEATURE)" ]; then \
		echo "❌ Please provide a feature description to test:"; \
		echo "   make test-feature FEATURE=\"temperature monitoring dashboard\""; \
		echo "   make test-feature FEATURE=\"user authentication system\""; \
		echo "   make test-feature FEATURE=\"grow setup tab with real data\""; \
		exit 1; \
	fi
	@echo "🔍 Testing feature: $(FEATURE)"
	@echo "🤖 Invoking Claude with comprehensive testing workflow..."
	@echo ""
	@echo "Claude will orchestrate:"
	@echo "  1. UI/UX Feature Testing (Playwright with real data)"
	@echo "  2. Backend Integration Testing (API + service layer)"
	@echo "  3. Code Quality Review (architecture compliance)"
	@echo "  4. Performance Impact Testing (regression analysis)"
	@echo "  5. Security Validation (RLS policies + auth flows)"
	@echo "  6. Database Integration Testing (Supabase + real data)"
	@echo ""
	@echo "Opening Claude Code with feature testing workflow..."
	@echo "Please run this command in Claude Code:"
	@echo ""
	@echo "Execute the workflow in .claude/commands/workflows/03_testing/feature-testing.md with argument: $(FEATURE)"
	@echo ""
	@echo "💡 Tip: Use 'make test' for quick local validation, 'make test-feature FEATURE=...' for comprehensive feature validation"

## Start Claude-powered feature validation workflow using git diff and Playwright
validate:
	@echo "🔍 Starting Claude-powered feature validation workflow..."
	@echo ""
	@if [ -z "$(ISSUE)" ]; then \
		echo "❌ Please provide an issue number:"; \
		echo "   make validate ISSUE=65"; \
		echo "   make validate ISSUE=123"; \
		exit 1; \
	fi
	@echo "📋 Validating implementation for issue: $(ISSUE)"
	@.claude/hooks/simple-context-hook.sh update
	@echo "🤖 Invoking Claude with feature validation workflow..."
	@echo ""
	@echo "Claude will:"
	@echo "  1. Analyze git diff to understand what changed"
	@echo "  2. Use Playwright to explore and validate features"
	@echo "  3. Test user workflows end-to-end"
	@echo "  4. Validate responsive design and accessibility"
	@echo "  5. Generate validation report with evidence"
	@echo ""
	@echo "Opening Claude Code with feature validation workflow..."
	@echo "Please run this command in Claude Code:"
	@echo ""
	@echo "Execute the workflow in .claude/commands/workflows/03_testing/feature-validation.md with argument: $(ISSUE)"
	@echo ""
	@echo "💡 This workflow analyzes actual code changes and validates implementation"

## Start Claude-powered deployment workflow for completed issues
deploy:
	@echo "🚀 Starting Claude-powered deployment workflow..."
	@echo ""
	@if [ -z "$(ISSUE)" ]; then \
		echo "❌ Please provide an issue number:"; \
		echo "   make deploy ISSUE=65"; \
		echo "   make deploy ISSUE=123"; \
		exit 1; \
	fi
	@echo "📦 Deploying implementation for issue: $(ISSUE)"
	@.claude/hooks/simple-context-hook.sh update
	@echo "🤖 Invoking Claude with deployment workflow..."
	@echo ""
	@echo "Claude will orchestrate:"
	@echo "  1. Code Quality Review & Final Testing"
	@echo "  2. Git Operations (add, commit, push)"
	@echo "  3. GitHub Issue Update (work summary)"
	@echo "  4. Pull Request Creation & Setup"
	@echo "  5. Deployment Preparation & Validation"
	@echo "  6. Team Notification & Review Assignment"
	@echo ""
	@echo "Opening Claude Code with deployment workflow..."
	@echo "Please run this command in Claude Code:"
	@echo ""
	@echo "Execute the workflow in .claude/commands/workflows/04_deployment/issue-deployment.md with argument: $(ISSUE)"
	@echo ""
	@echo "💡 This workflow handles complete issue deployment lifecycle"

## Finalize issue with documentation updates and closing notes
finalize:
	@echo "📝 Starting issue finalization workflow..."
	@echo ""
	@if [ -z "$(ISSUE)" ]; then \
		echo "❌ Please provide an issue number:"; \
		echo "   make finalize ISSUE=65"; \
		echo "   make finalize ISSUE=123"; \
		exit 1; \
	fi
	@echo "📋 Finalizing issue: $(ISSUE)"
	@echo ""
	@echo "🔧 Creating prompting log..."
	@.claude/hooks/prompting-log.sh create-log "$(ISSUE)"
	@echo ""
	@echo "💬 Generating closing comment..."
	@.claude/hooks/prompting-log.sh closing-comment "$(ISSUE)" > /tmp/closing-comment-$(ISSUE).md
	@echo ""
	@echo "🤖 Invoking Claude with finalization workflow..."
	@echo ""
	@echo "Claude will:"
	@echo "  1. Update relevant documentation"
	@echo "  2. Create comprehensive prompting log"
	@echo "  3. Generate closing notes for GitHub issue"
	@echo "  4. Close issue #$(ISSUE) with summary"
	@echo "  5. Archive context for future reference"
	@echo ""
	@echo "📂 Prompting log saved to: .claude/logs/$(shell date +%Y-%m-%d)/issue-$(ISSUE).md"
	@echo "💬 Closing comment saved to: /tmp/closing-comment-$(ISSUE).md"
	@echo ""
	@echo "Opening Claude Code with finalization workflow..."
	@echo "Please run this command in Claude Code:"
	@echo ""
	@echo "Execute the workflow in .claude/commands/workflows/06_finalization/issue-finalize.md with argument: $(ISSUE)"
	@echo ""
	@echo "After finalization, run:"
	@echo "  .claude/hooks/prompting-log.sh reset  # Clear context for next issue"
	@echo ""
	@echo "💡 This completes the full development lifecycle for issue #$(ISSUE)"

## Start Claude-powered reflection workflow for improving development processes
reflect:
	@echo "🔍 Starting Claude-powered reflection workflow..."
	@echo ""
	@# Handle optional parameters with defaults
	@COMMITS_PARAM=$${COMMITS:-10}; \
	SCOPE_PARAM=$${SCOPE:-all}; \
	echo "📊 Analyzing last $$COMMITS_PARAM commits with scope: $$SCOPE_PARAM"; \
	echo "🤖 Invoking Claude with reflection workflow..."; \
	echo ""; \
	echo "Claude will:"; \
	echo "  1. Analyze recent development patterns and challenges"; \
	echo "  2. Review error logs and debugging sessions"; \
	echo "  3. Update agent/workflow definitions to prevent similar issues"; \
	echo "  4. Check style consistency across similar files"; \
	echo "  5. Generate improvement recommendations"; \
	echo "  6. Update .claude/ configurations automatically"; \
	echo ""; \
	echo "Opening Claude Code with reflection workflow..."; \
	echo "Please run this command in Claude Code:"; \
	echo ""; \
	echo "Execute the workflow in .claude/commands/workflows/maintenance/development-reflection.md with arguments: COMMITS=$$COMMITS_PARAM SCOPE=$$SCOPE_PARAM"; \
	echo ""; \
	echo "💡 Use 'make reflect COMMITS=5 SCOPE=typescript' to focus on specific areas"

# --- Simple Context Management ---

## Update context from current git state
context:
	@echo "📝 Updating context..."
	@.claude/hooks/simple-context-hook.sh update
	@echo "✅ Context updated in .claude/context/simple-context.yaml"

## Show current context
context-show:
	@echo "📊 Current context:"
	@cat .claude/context/simple-context.yaml

# --- Help ---

## List all available Makefile commands and their descriptions
help:
	@echo "\nAvailable Makefile targets:\n"
	@grep -E '^[a-zA-Z0-9_-]+:|^##' Makefile | \
		awk 'BEGIN {FS = ":|##"} /^[a-zA-Z0-9_-]+:/ {printf "\033[36m%-25s\033[0m %s\n", $$1, $$3}'
