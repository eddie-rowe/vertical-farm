# Contributing Guide – Vertical Farm

_Last Synced: 2025-05-17_

## Welcome!
Thank you for your interest in contributing to the Vertical Farm project. This guide will help you get started and ensure a smooth collaboration.

---

## Getting Started
1. **Clone the repository:**
   ```sh
   git clone https://github.com/your-org/vertical-farm.git
   ```
2. **Install dependencies:**
   - Backend: `cd backend && pip install -r requirements.txt`
   - Frontend: `cd frontend && npm install`
3. **Copy and configure environment variables:**
   - Copy `.env.example` to `.env` in both backend and frontend, and fill in required secrets.
4. **Run locally:**
   - Use `docker-compose up --build` from the project root for full stack.

---

## Coding Standards
- **Python:** Follow PEP8, use type hints, and docstrings.
- **TypeScript/JS:** Use Prettier and ESLint (see `frontend/` configs).
- **Commits:** Use clear, descriptive commit messages (see [Conventional Commits](https://www.conventionalcommits.org/)).
- **Tests:** Add/maintain tests for all new features and bugfixes.

---

## Pull Request Process
1. Fork the repo and create a feature branch.
2. Make your changes and add/modify tests as needed.
3. Run all tests locally before submitting.
4. Open a pull request with a clear description of your changes.
5. Link related issues and request a review.

---

## Documentation
- Update relevant markdown docs in `docs/` for any code or feature changes.
- Use the Hermes agent to sync docs with codebase when possible.

---

## Code of Conduct
- Be respectful and constructive in all interactions.
- See [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) if available.

---

## Questions?
Open an issue or start a discussion in the repository. 