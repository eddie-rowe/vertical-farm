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

# NOTE: 'make up' has been migrated to Claude Code slash command: /up

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

## Install security scanning tools (TruffleHog, Semgrep, Checkov)
setup-security:
	@echo "🛡️  Installing security scanning tools..."
	@./scripts/install-security-tools.sh

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
test-security: test-security-backend test-security-frontend test-security-secrets test-security-sast test-security-iac
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

## Run secret scanning (enhanced version using TruffleHog if available)
test-security-secrets:
	@echo "🔍 Running secret detection..."
	@if command -v trufflehog >/dev/null 2>&1; then \
		echo "Using TruffleHog for comprehensive secret scanning..."; \
		trufflehog git file://. --only-verified --json --no-update > .security-reports/trufflehog-local.json || true; \
		VERIFIED_SECRETS=$$(jq '[.[] | select(.Verified == true)] | length' .security-reports/trufflehog-local.json 2>/dev/null || echo "0"); \
		if [ "$$VERIFIED_SECRETS" -gt 0 ]; then \
			echo "❌ $$VERIFIED_SECRETS verified secrets found!"; \
			jq -r '.[] | select(.Verified == true) | "🚨 \(.DetectorName): \(.Raw)" | .[0:100]' .security-reports/trufflehog-local.json 2>/dev/null || echo "Error parsing results"; \
			exit 1; \
		else \
			echo "✅ No verified secrets found"; \
		fi; \
	else \
		echo "TruffleHog not found, using basic grep scanning..."; \
		! grep -r -i -n -E "(password|secret|key|token).*=.*['\"][^'\"]{10,}" . --exclude-dir=.git --exclude-dir=node_modules --exclude-dir=venv --exclude-dir=.security-reports || echo "⚠️  Potential secrets found - review carefully"; \
	fi
	@echo "✅ Secret scanning completed"

## Run Static Application Security Testing (SAST) with Semgrep
test-security-sast:
	@echo "🛡️  Running SAST analysis with Semgrep..."
	@mkdir -p .security-reports
	@if command -v semgrep >/dev/null 2>&1; then \
		echo "Running Semgrep with security rulesets..."; \
		semgrep \
			--config=p/security-audit \
			--config=p/secrets \
			--config=p/owasp-top-ten \
			--config=p/javascript \
			--config=p/python \
			--json \
			--output=.security-reports/semgrep-local.json \
			. || true; \
		SEMGREP_CRITICAL=$$(jq '[.results[] | select(.extra.severity == "ERROR")] | length' .security-reports/semgrep-local.json 2>/dev/null || echo "0"); \
		SEMGREP_HIGH=$$(jq '[.results[] | select(.extra.severity == "WARNING")] | length' .security-reports/semgrep-local.json 2>/dev/null || echo "0"); \
		echo "Critical findings: $$SEMGREP_CRITICAL, High findings: $$SEMGREP_HIGH"; \
		if [ "$$SEMGREP_CRITICAL" -gt 0 ]; then \
			echo "❌ Critical security issues found:"; \
			jq -r '.results[] | select(.extra.severity == "ERROR") | "🚨 \(.path):\(.start.line): \(.extra.message)"' .security-reports/semgrep-local.json | head -5; \
			exit 1; \
		elif [ "$$SEMGREP_HIGH" -gt 5 ]; then \
			echo "⚠️  High number of security warnings ($$SEMGREP_HIGH). Consider reviewing."; \
		else \
			echo "✅ No critical SAST issues found"; \
		fi; \
	else \
		echo "⚠️  Semgrep not installed. Install with: pip install semgrep"; \
		echo "   Skipping SAST analysis (non-blocking for local development)"; \
	fi
	@echo "✅ SAST analysis completed"

## Run Infrastructure as Code (IaC) security scanning with Checkov
test-security-iac:
	@echo "🏗️  Running Infrastructure as Code security scan..."
	@mkdir -p .security-reports
	@if command -v checkov >/dev/null 2>&1; then \
		echo "Running Checkov on infrastructure files..."; \
		checkov \
			--framework dockerfile \
			--framework kubernetes \
			--framework yaml \
			--output json \
			--output-file .security-reports/checkov-local.json \
			--directory . || true; \
		if [ -f .security-reports/checkov-local.json ]; then \
			IAC_CRITICAL=$$(jq '.results.failed_checks | map(select(.severity == "CRITICAL")) | length' .security-reports/checkov-local.json 2>/dev/null || echo "0"); \
			IAC_HIGH=$$(jq '.results.failed_checks | map(select(.severity == "HIGH")) | length' .security-reports/checkov-local.json 2>/dev/null || echo "0"); \
			echo "Critical IaC issues: $$IAC_CRITICAL, High IaC issues: $$IAC_HIGH"; \
			if [ "$$IAC_CRITICAL" -gt 0 ]; then \
				echo "❌ Critical infrastructure security issues found:"; \
				jq -r '.results.failed_checks[] | select(.severity == "CRITICAL") | "🚨 \(.file_path): \(.check_name)"' .security-reports/checkov-local.json | head -3; \
				exit 1; \
			else \
				echo "✅ No critical infrastructure issues found"; \
			fi; \
		else \
			echo "✅ No infrastructure files found to scan"; \
		fi; \
	else \
		echo "⚠️  Checkov not installed. Install with: pip install checkov"; \
		echo "   Skipping IaC analysis (non-blocking for local development)"; \
	fi
	@echo "✅ IaC security scan completed"

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
# NOTE: These commands have been migrated to Claude Code slash commands
# Use the slash commands directly in Claude Code for better integration:
#   /plan <issue>     - Analyze GitHub issues and create implementation plans
#   /dev <issue>      - Develop features from issues or descriptions  
#   /validate <issue> - Validate implementations with Playwright
#   /pipeline <pr>    - Debug and fix CI/CD pipeline failures
#   /reflect          - Analyze development patterns and improve workflows
#
# These make targets are kept for backward compatibility but may be removed in future versions.

# NOTE: 'make test' has been migrated to Claude Code slash command: /test

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


# NOTE: 'make deploy' has been migrated to Claude Code slash command: /deploy

# NOTE: 'make finalize' has been migrated to Claude Code slash command: /finalize


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
