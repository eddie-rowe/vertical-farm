# Vertical Farm Platform

A full-stack, AI-augmented platform for managing, simulating, and optimizing vertical farming operations.  
This project combines a modern Next.js frontend, a Python FastAPI backend, automation/testing agents, and human-in-the-loop workflows to deliver a robust, extensible solution for smart agriculture.

---

## Table of Contents

- [Features](#features)
- [Architecture Overview](#architecture-overview)
- [Directory Structure](#directory-structure)
- [Getting Started](#getting-started)
- [Development](#development)
- [Testing](#testing)
- [AI Agents & Automation](#ai-agents--automation)
- [Documentation](#documentation)
- [Reports & Analytics](#reports--analytics)
- [Contributing](#contributing)
- [License](#license)

---

## Features

- **Modern Frontend**: Next.js 15, TypeScript, Tailwind CSS, App Router, and Supabase integration.
- **Backend API**: Python FastAPI with modular routers, authentication, and Supabase client.
- **AI/Automation Agents**: Modular agents for UI/UX, security, DevOps, research, and more.
- **Human Workflows**: Human-in-the-loop workflow definitions for collaborative operations.
- **Project Management**: Taskmaster-driven task breakdown, complexity analysis, and reporting.
- **Comprehensive Testing**: Playwright E2E, unit, and integration tests for both frontend and backend.
- **Rich Documentation**: Architecture, security, deployment, and API docs included.
- **Analytics & Reporting**: Automated UI/UX, security, and workflow analysis with visual reports.

---

## Architecture Overview

- **Frontend**:  
  - Next.js 15 (App Router, SSR/SSG)
  - TypeScript, Tailwind CSS
  - Supabase for authentication and data
  - Modular components, context, and hooks
- **Backend**:  
  - FastAPI (Python 3)
  - Modular routers, models, and authentication
  - Supabase integration
  - Dockerized for easy deployment
- **Agents**:  
  - AI/automation agents for UI/UX, security, DevOps, research, and backend review
- **Workflows**:  
  - Human-in-the-loop and automated workflow definitions
- **Project Management**:  
  - Taskmaster for task breakdown, tracking, and complexity analysis

---

## Directory Structure

```
vertical-farm/
├── frontend/         # Next.js app (UI, components, tests, public assets)
├── backend/          # FastAPI app (API, models, routers, tests)
├── agents/           # Modular AI/automation agents (frontend, backend, devops, etc.)
├── human-workflows/  # Human-in-the-loop workflow definitions
├── tasks/            # Taskmaster tasks and breakdowns
├── scripts/          # PRDs, complexity reports, and utility scripts
├── docs/             # Architecture, API, security, and deployment docs
├── reports/          # Automated analysis, UI/UX, security, and screenshots
├── .github/          # GitHub workflows and config
├── docker-compose.yml
├── Makefile
└── .taskmasterconfig
```

---

## Getting Started

### Prerequisites

- Node.js (v18+)
- Python 3.9+
- Docker (for full-stack/local deployment)
- Supabase account (for auth/data)

### Quickstart

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-org/vertical-farm.git
   cd vertical-farm
   ```

2. **Start with Docker Compose (recommended):**
   ```bash
   docker-compose up --build
   ```
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Backend: [http://localhost:8000](http://localhost:8000)

3. **Or run frontend and backend separately:**

   **Frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

   **Backend:**
   ```bash
   cd backend
   pip install -r requirements.txt
   uvicorn main:app --reload
   ```

---

## Development

- **Frontend:**  
  - Source: `frontend/src/`
  - Main entry: `frontend/src/app/`
  - Components: `frontend/src/components/`
  - Context: `frontend/src/context/`
  - Styles: `frontend/src/app/globals.css`
  - Public assets: `frontend/public/`
- **Backend:**  
  - Source: `backend/`
  - Main entry: `backend/main.py`
  - Routers: `backend/routers.py`
  - Models: `backend/models.py`
  - Auth: `backend/auth.py`
- **Agents:**  
  - Modular agents in `agents/` (see subfolders for frontend, backend, devops, etc.)
- **Workflows:**  
  - Human workflows in `human-workflows/`

---

## Testing

- **Frontend:**
  - Unit tests: `frontend/tests/`
  - Playwright E2E: `frontend/tests/playwright/`
  - Example: `npm run test` (see Playwright config for E2E)
- **Backend:**
  - Pytest: `backend/tests/`
  - Example: `pytest backend/tests/`
- **Reports:**
  - Automated UI/UX, security, and workflow reports in `reports/summaries/`
  - Screenshots in `reports/screenshots/`

---

## AI Agents & Automation

- **UI/UX Designer**: Automated UI/UX analysis and recommendations
- **Security Analyst**: Security review and vulnerability scanning
- **DevOps Reviewer**: CI/CD and infrastructure checks
- **Research Agent**: Deep research and competitive analysis
- **Backend/DB Reviewers**: API and database schema review
- **Human-in-the-loop**: Workflows for collaborative review and approval

See `agents/` and `human-workflows/` for details.

---

## Documentation

- **Architecture**: `docs/architecture-summary.md`, `docs/frontend-architecture.md`, `docs/backend-architecture.md`
- **API Reference**: `docs/api-reference.md`
- **Security**: `docs/security-model.md`
- **Testing**: `docs/testing-strategy.md`
- **Deployment**: `docs/deployment-workflow.md`
- **Database**: `docs/database-schema.md`
- **Contributing**: `docs/contributing-guide.md`
- **Release Notes**: `docs/release-notes.md`

---

## Reports & Analytics

- **UI/UX Analysis**: `reports/summaries/ui-ux-analysis-*.md`
- **Security Reports**: `reports/summaries/security-report-*.md`
- **Screenshots**: `reports/screenshots/`
- **Task Complexity**: `scripts/task-complexity-report.json`
- **Project Dashboard**: `docs/project-dashboard.txt`

---

## Contributing

See [docs/contributing-guide.md](docs/contributing-guide.md) for guidelines.

---

## License

This project is licensed under the [MIT License](LICENSE).

---

**For more details, see the documentation in the `docs/` folder and the existing README files in submodules.**
