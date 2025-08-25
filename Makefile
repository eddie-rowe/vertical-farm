# Makefile for formatting, code checks, and workflow automation
# This will supercharge your local development, onboarding, CI/CD, 
# and documentation workflows - empowering both human and AI-driven processes.

BLACK_LINE_LENGTH=79
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
	pipeline plan dev test validate deploy

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

## Run all tests (backend, frontend, e2e)
test-all:
	$(MAKE) test-backend
	$(MAKE) test-frontend
	$(MAKE) test-e2e

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
	@echo "🔍 Invoking Claude with issue analysis workflow..."
	@echo ""
	@echo "Claude will now:"
	@echo "  1. Retrieve issue details from GitHub"
	@echo "  2. Analyze requirements and acceptance criteria"
	@echo "  3. Break down into actionable subtasks"
	@echo "  4. Update the GitHub issue with implementation plan"
	@echo ""
	@echo "Opening Claude Code with issue analysis workflow..."
	@echo "Please run this command in Claude Code:"
	@echo ""
	@echo "Execute the workflow in .claude/commands/workflows/01_planning/issue-analysis.md with argument: $(ISSUE)"
	@echo ""
	@echo "💡 After analysis, use 'make dev FEATURE=\"your feature description\"' to start implementation, then 'make test FEATURE=\"your feature description\"' to validate"

## Start Claude-powered feature development workflow (supports both ISSUE and FEATURE)
dev:
	@echo "⚡ Starting Claude-powered feature development workflow..."
	@echo ""
	@# Handle both ISSUE and FEATURE parameters
	@if [ -n "$(ISSUE)" ]; then \
		echo "📋 Developing from GitHub issue: $(ISSUE)"; \
		echo "🤖 Claude will first analyze the issue, then start development..."; \
		echo ""; \
		echo "Please run this command in Claude Code:"; \
		echo ""; \
		echo "Execute the workflow in .claude/commands/workflows/02_development/feature-development.md with argument: $(ISSUE)"; \
	elif [ -n "$(FEATURE)" ]; then \
		echo "🔨 Developing feature: $(FEATURE)"; \
		echo "🤖 Invoking Claude with feature development workflow..."; \
		echo ""; \
		echo "Please run this command in Claude Code:"; \
		echo ""; \
		echo "Execute the workflow in .claude/commands/workflows/02_development/feature-development.md with argument: $(FEATURE)"; \
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

## Start Claude-powered feature testing workflow
test:
	@echo "🧪 Starting Claude-powered feature testing workflow..."
	@echo ""
	@if [ -z "$(FEATURE)" ]; then \
		echo "❌ Please provide a feature description to test:"; \
		echo "   make test FEATURE=\"temperature monitoring dashboard\""; \
		echo "   make test FEATURE=\"user authentication system\""; \
		echo "   make test FEATURE=\"grow setup tab with real data\""; \
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
	@echo "💡 Tip: Use 'make test-all' for quick unit/e2e tests, 'make test FEATURE=...' for comprehensive feature validation"

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

# --- Help ---

## List all available Makefile commands and their descriptions
help:
	@echo "\nAvailable Makefile targets:\n"
	@grep -E '^[a-zA-Z0-9_-]+:|^##' Makefile | \
		awk 'BEGIN {FS = ":|##"} /^[a-zA-Z0-9_-]+:/ {printf "\033[36m%-25s\033[0m %s\n", $$1, $$3}'
