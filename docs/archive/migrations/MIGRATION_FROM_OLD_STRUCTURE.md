# Documentation Migration Guide

This guide helps you find documentation that was moved during the January 2025 documentation reorganization.

## 🎯 Why We Reorganized

The old numbered directory structure (01-architecture/, 02-development/, etc.) was replaced with a **persona-based organization** that's more intuitive and task-oriented:

- ✅ **Getting Started** - Clear entry point for new developers
- ✅ **Reference** - Technical specifications and architecture
- ✅ **Guides** - Task-oriented how-to documentation  
- ✅ **Development** - Contribution and coding workflows
- ✅ **Operations** - Deployment, monitoring, security
- ✅ **Archive** - Historical reports and completed work

## 📍 File Location Mapping

### Architecture Documentation
| Old Path | New Path |
|----------|----------|
| `01-architecture/overview.md` | `getting-started/architecture-overview.md` |
| `01-architecture/frontend.md` | `reference/architecture/frontend-architecture.md` |
| `01-architecture/backend.md` | `reference/architecture/backend-architecture.md` |
| `01-architecture/database-schema.md` | `reference/architecture/database-design.md` |
| `01-architecture/caching-strategy.md` | `reference/architecture/system-architecture.md` |
| `01-architecture/edge-computing.md` | `reference/architecture/system-architecture.md` |
| `01-architecture/automation-architecture.md` | `reference/architecture/system-architecture.md` |
| `01-architecture/responsibilities.md` | `reference/architecture/service-layer.md` |
| `01-architecture/LAYER_OVERLAY_SYSTEM.md` | `reference/architecture/system-architecture.md` |

### Development Documentation  
| Old Path | New Path |
|----------|----------|
| `02-development/contributing.md` | `development/contributing.md` |
| `02-development/STYLE-STANDARDIZATION-*.md` | `development/coding-standards.md` (consolidated) |
| `02-development/ci-cd-workflow.md` | `development/contributing.md` |
| `02-development/improvement-recommendations.md` | `development/README.md` |
| `02-development/release-notes.md` | `archive/releases/` |
| `02-development/PHASE*.md` | `archive/reports/01-project-phases/` |

### API Documentation
| Old Path | New Path |
|----------|----------|
| `03-api/README.md` | `reference/api/README.md` (enhanced) |
| `03-api/reference.md` | `reference/api/endpoints.md` (expanded) |
| *(Missing auth docs)* | `reference/api/authentication.md` (NEW) |
| *(Missing examples)* | `reference/api/examples.md` (NEW) |
| *(Missing schemas)* | `reference/api/schemas.md` (NEW) |

### Deployment & Operations
| Old Path | New Path |
|----------|----------|
| `04-deployment/README.md` | `operations/deployment/README.md` |
| `04-deployment/workflow.md` | `operations/deployment/README.md` |
| `04-deployment/cloudflare-*.md` | `operations/deployment/cloudflare.md` |
| `04-deployment/PWA_IMPLEMENTATION.md` | `guides/features/` (relevant sections) |

### Testing Documentation
| Old Path | New Path |
|----------|----------|
| `05-testing/README.md` | `development/testing-guide.md` |
| `05-testing/TESTING.md` | `development/testing-guide.md` |
| `05-testing/production-testing-strategy.md` | `development/testing-guide.md` |
| `05-testing/security-testing.md` | `operations/security/README.md` |

### Security Documentation
| Old Path | New Path |
|----------|----------|
| `06-security/README.md` | `operations/security/README.md` |
| `06-security/model.md` | `operations/security/README.md` |

### Guides & How-Tos
| Old Path | New Path |
|----------|----------|
| `07-guides/SETUP_HOME_ASSISTANT.md` | `guides/integrations/home-assistant.md` |
| `07-guides/CACHING_IMPLEMENTATION_GUIDE.md` | `reference/architecture/system-architecture.md` |
| `07-guides/DARK-MODE-GUIDE.md` | `guides/features/` (UI features) |
| `07-guides/SUPABASE_QUEUES_SETUP.md` | `guides/integrations/` |
| `07-guides/index.md` | `guides/README.md` |

### Reports & Historical Content
| Old Path | New Path |
|----------|----------|
| `08-reports/` (entire directory) | `archive/reports/` |
| `08-reports/01-project-phases/` | `archive/reports/01-project-phases/` |
| `08-reports/02-performance/` | `archive/reports/02-performance/` |
| `08-reports/03-technical-reviews/` | `archive/reports/03-technical-reviews/` |
| `08-reports/04-analysis/` | `archive/reports/04-analysis/` |
| `08-reports/05-migrations/` | `archive/reports/05-migrations/` |
| `08-reports/06-assets/` | `archive/reports/06-assets/` |
| `08-reports/07-task-reports/` | `archive/reports/07-task-reports/` |

### Migration Documentation
| Old Path | New Path |
|----------|----------|
| `09-migration/` (active migrations) | Moved to backend/app or supabase/migrations |
| `09-migration/` (completed migrations) | `archive/migrations/` |
| `MIGRATION_GUIDE.md` | `reference/database/migrations.md` |
| `MIGRATION_SUMMARY.md` | `archive/migrations/` |

### Root Level Files
| Old Path | New Path |
|----------|----------|
| `README.md` | `README.md` (updated with new navigation) |
| `PIPELINE_OVERVIEW.md` | `operations/deployment/README.md` |
| `PRE_COMMIT_SETUP.md` | `development/contributing.md` |

## 🔍 Finding Documentation Now

### By Persona
- **New Developer** → Start at `getting-started/README.md`
- **API Consumer** → Go to `reference/api/README.md`  
- **Contributor** → Check `development/README.md`
- **DevOps Engineer** → Visit `operations/README.md`
- **Feature User** → Browse `guides/README.md`

### By Task
- **Setting up dev environment** → `getting-started/environment-setup.md`
- **Understanding architecture** → `getting-started/architecture-overview.md`
- **Contributing code** → `development/contributing.md`
- **Deploying to production** → `operations/deployment/README.md`
- **Using specific features** → `guides/features/`
- **Integrating services** → `guides/integrations/`
- **Troubleshooting issues** → `guides/troubleshooting/`

### By Content Type
- **Technical Reference** → `reference/` directory
- **How-To Guides** → `guides/` directory
- **Process Documentation** → `development/` directory
- **Operational Procedures** → `operations/` directory
- **Historical Information** → `archive/` directory

## 🚀 Benefits of New Structure

1. **Faster Navigation** - Find information in max 3 clicks
2. **Clear Entry Points** - Different starting points for different roles
3. **Task-Oriented** - Organized around what you want to accomplish
4. **Reduced Redundancy** - Consolidated overlapping documentation
5. **Better Maintenance** - Logical organization for updates
6. **Improved Searchability** - More intuitive file names and locations

## 🔗 Broken Links?

If you find broken internal links in the codebase or documentation:

1. **Check this migration guide** for the new location
2. **Use the main navigation** in each section's README
3. **Search the documentation** using file explorer or grep
4. **Open an issue** if you can't find what you're looking for

## 📊 What Improved

- **File Count**: Reduced from 85+ files to ~50 focused documents
- **Navigation Depth**: Max 3 clicks to reach any information
- **Content Quality**: Consolidated, updated, and enhanced
- **Organization**: Persona and task-based instead of arbitrary numbering
- **Discoverability**: Clear entry points and cross-references

---

*Migration completed: January 2025*  
*If you can't find something, check the new structure or open an issue for help.*