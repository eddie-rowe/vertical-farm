# Vertical Farm Documentation

Welcome to the comprehensive documentation for the Vertical Farm project. This documentation is organized into numbered sections for easy navigation and logical flow.

## 📁 Documentation Structure

### [01-architecture/](./01-architecture/)
System architecture documentation including frontend, backend, database schemas, automation systems, and data flow diagrams. Contains technical design decisions and architectural patterns.

### [02-development/](./02-development/)
Development-related documentation including CI/CD workflows, contributing guidelines, release notes, and improvement recommendations. Essential reading for developers.

### [03-api/](./03-api/)
API documentation and reference materials. Includes endpoint specifications, authentication, and usage examples.

### [04-deployment/](./04-deployment/)
Deployment guides and configuration for various environments. Covers Cloudflare setup, caching strategies, and deployment workflows.

### [05-testing/](./05-testing/)
Testing strategies, guides, and results. Includes unit testing, integration testing, and security testing documentation.

### [06-security/](./06-security/)
Security model, policies, and testing results. Contains security guidelines and vulnerability assessments.

### [07-guides/](./07-guides/)
User guides and setup instructions for various integrations and features. Step-by-step tutorials and configuration guides.

### [08-reports/](./08-reports/)
Project reports, summaries, and historical documentation organized by category:
- `audits/` - Security and system audits
- `migration-reports/` - Database migration reports
- `optimization-reports/` - Performance optimization analyses
- `project-summaries/` - Project phase summaries and organizational reports
- `performance-analysis/` - Performance testing results
- `reviews/` - Code reviews and assessments
- `screenshots/` - Visual documentation

### [09-migration/](./09-migration/)
Database migration scripts, strategies, and documentation. Contains SQL files and migration planning documents.

## 🚀 Quick Start

1. **For Developers**: Start with [02-development/](./02-development/) for setup and contributing guidelines
2. **For Deployment**: Check [04-deployment/](./04-deployment/) for environment setup
3. **For API Usage**: Reference [03-api/](./03-api/) for endpoint documentation
4. **For Architecture Understanding**: Review [01-architecture/](./01-architecture/) for system design

## 📋 Document Types

- **README.md** - Overview and navigation for each section
- **Guide files** - Step-by-step instructions (e.g., `SETUP_*.md`)
- **Reference files** - Technical specifications and API docs
- **Report files** - Analysis, testing results, and summaries
- **Strategy files** - Planning and architectural decisions

## 🔍 Finding Information

- Use the numbered directory structure for logical navigation
- Each section contains a README with detailed contents
- Search functionality works best with specific technical terms
- Cross-references are provided where relevant

## 📝 Contributing to Documentation

When adding new documentation:

1. Place files in the appropriate numbered directory
2. Follow the naming conventions established in each section
3. Update the relevant README.md file
4. Use clear, descriptive filenames
5. Include proper markdown formatting and links

## 🏗️ Architecture Overview

The Vertical Farm system consists of:
- **Frontend**: Next.js application with real-time updates
- **Backend**: FastAPI with Supabase integration
- **Database**: PostgreSQL with automated migrations
- **Deployment**: Cloudflare Workers and edge computing
- **Integrations**: Home Assistant and IoT device management

For detailed technical information, see [01-architecture/](./01-architecture/).

---

Last Updated: June 2025  
Documentation Structure: v2.0  
Total Sections: 9 