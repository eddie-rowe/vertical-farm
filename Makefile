# Makefile for formatting, code checks, and workflow automation
# This will supercharge your local development, onboarding, CI/CD, 
# and documentation workflows - empowering both human and AI-driven processes.

BLACK_LINE_LENGTH=79
PYTHON_SRC=backend
NEXT_SRC=frontend

.PHONY: format lint test pr \
	# Backend
	run-backend test-backend lint-backend install-backend \
	# Frontend
	run-frontend build-frontend test-frontend test-frontend-e2e lint-frontend install-frontend \
	# DevOps
	up down clean-docker \
	# Docs & Agents
	docs-sync ux-analysis \
	# Meta
	setup format-all test-all help

# --- Backend Workflows ---

## Run the FastAPI backend server (dev mode)
run-backend:
	cd backend && uvicorn main:app --reload

## Run backend tests with pytest
test-backend:
	cd backend && pytest

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
test-frontend-e2e:
	cd frontend && npm run test:e2e

## Lint frontend code (ESLint)
lint-frontend:
	cd frontend && npm run lint

## Install frontend dependencies
install-frontend:
	cd frontend && npm install

# --- DevOps / Full Stack ---

## Build images and start all services with Docker Compose
up:
	docker-compose build && docker-compose up -d

## Stop all services
down:
	docker-compose down

## Clean Docker artifacts (volumes, orphans)
clean-docker:
	docker-compose down -v --remove-orphans

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
	$(MAKE) test-frontend-e2e

## Auto-commit (OpenCommit), push, and open a PR (GitHub CLI required)
pr:
	git checkout -b "feature/auto-$(date +%s)" || true
	oco
	git push -u origin HEAD
	gh pr create --fill

# --- Help ---

## List all available Makefile commands and their descriptions
help:
	@echo "\nAvailable Makefile targets:\n"
	@grep -E '^[a-zA-Z0-9_-]+:|^##' Makefile | \
		awk 'BEGIN {FS = ":|##"} /^[a-zA-Z0-9_-]+:/ {printf "\033[36m%-25s\033[0m %s\n", $$1, $$3}'
