# Environment Setup Guide

This guide provides detailed instructions for setting up your local development environment with all necessary tools and services.

## 📋 Prerequisites

Before starting, ensure you have the following installed:

### Required Tools

| Tool | Version | Installation |
|------|---------|--------------|
| **Node.js** | 18+ | [nodejs.org](https://nodejs.org/) |
| **Python** | 3.13+ | [python.org](https://www.python.org/) |
| **Docker Desktop** | Latest | [docker.com](https://www.docker.com/products/docker-desktop/) |
| **Supabase CLI** | Latest | See installation below |
| **Git** | 2.0+ | [git-scm.com](https://git-scm.com/) |

### Recommended IDE Setup

- **Cursor IDE** with the following extensions:
  - GitHub MCP server
  - Sequential Thinking MCP server
  - Context7 MCP Server
  - Supabase MCP server

## 🛠️ Step-by-Step Setup

### 1. Install Supabase CLI

The Supabase CLI is essential for local development. Choose your platform:

#### macOS (Homebrew)
```bash
brew install supabase/tap/supabase
```

#### Windows (Scoop)
```bash
# First, install Scoop if you haven't
iwr -useb get.scoop.sh | iex

# Add Supabase bucket
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git

# Install Supabase CLI
scoop install supabase
```

#### Linux / Manual Installation
```bash
# Download the latest release
wget https://github.com/supabase/cli/releases/latest/download/supabase_linux_amd64.tar.gz

# Extract
tar -xvf supabase_linux_amd64.tar.gz

# Move to PATH
sudo mv supabase /usr/local/bin/

# Verify installation
supabase --version
```

### 2. Clone the Repository

```bash
# Clone via HTTPS
git clone https://github.com/eddie-rowe/vertical-farm.git

# Or via SSH (if you have SSH keys set up)
git clone git@github.com:eddie-rowe/vertical-farm.git

# Navigate to project
cd vertical-farm
```

### 3. Initialize Supabase

```bash
# Start Supabase services
# First time will download Docker images (may take 5-10 minutes)
supabase start

# Verify it's running
supabase status
```

You should see output like:
```
         API URL: http://localhost:54321
     GraphQL URL: http://localhost:54321/graphql/v1
          DB URL: postgresql://postgres:postgres@localhost:54322/postgres
      Studio URL: http://localhost:54323
    Inbucket URL: http://localhost:54324
      JWT secret: your-jwt-secret
        anon key: eyJ0eXAiOiJKV1QiLCJhbGc...
service_role key: eyJ0eXAiOiJKV1QiLCJhbGc...
```

**Save these values!** You'll need them for environment configuration.

### 4. Configure Environment Variables

#### Automated Setup (Recommended)

```bash
# Make the setup script executable
chmod +x scripts/setup-local-dev.sh

# Run the setup script
./scripts/setup-local-dev.sh
```

This script will:
- ✅ Extract Supabase credentials automatically
- ✅ Create `.env.local` with proper values
- ✅ Start all application services
- ✅ Verify everything is running

#### Manual Setup

If you prefer manual configuration:

```bash
# Create environment file
cp .env.example .env.local

# Edit .env.local with your favorite editor
nano .env.local  # or vim, code, etc.
```

Add these values from `supabase status`:
```env
# Supabase Configuration
SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=<your-anon-key-from-status>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key-from-status>
SUPABASE_SERVICE_KEY=<your-service-role-key-from-status>
SUPABASE_JWT_SECRET=<your-jwt-secret-from-status>

# Backend Configuration
BACKEND_CORS_ORIGINS=["http://localhost:3000","http://localhost:8000"]
PROJECT_NAME=vertical-farm
API_V1_STR=/api/v1
DEBUG=true
ENVIRONMENT=local

# Frontend Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 5. Start Application Services

```bash
# Using Docker Compose (recommended)
docker-compose -f docker-compose-with-supabase-cli.yml up -d

# Or manually in separate terminals:
# Terminal 1 - Backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload

# Terminal 2 - Frontend
cd frontend
npm install
npm run dev
```

### 6. Verify Everything is Running

Check all services are accessible:

| Service | URL | Expected Result |
|---------|-----|-----------------|
| Frontend | http://localhost:3000 | Vertical Farm UI |
| Backend API | http://localhost:8000 | API root message |
| API Docs | http://localhost:8000/docs | Swagger UI |
| Supabase Studio | http://localhost:54323 | Database management UI |
| Email Testing | http://localhost:54324 | Inbucket email interface |

## 🗄️ Database Setup

### Initial Schema

The database migrations run automatically when you start Supabase. To verify:

```bash
# List applied migrations
supabase migration list

# View current schema
supabase db dump
```

### Create Test Data

1. Open Supabase Studio: http://localhost:54323
2. Navigate to the SQL Editor
3. Run test data scripts:

```sql
-- Create a test user (if auth is needed)
INSERT INTO auth.users (email, encrypted_password)
VALUES ('test@example.com', crypt('password123', gen_salt('bf')));

-- Add your test data here
INSERT INTO farms (name, owner_id) 
VALUES ('Test Farm', (SELECT id FROM auth.users LIMIT 1));
```

### Working with Migrations

```bash
# Create a new migration
supabase migration new add_new_feature

# Edit the migration file
nano supabase/migrations/<timestamp>_add_new_feature.sql

# Apply migrations (restart Supabase)
supabase db reset  # WARNING: Drops all data!
# Or
supabase stop
supabase start
```

## 🔧 Development Workflow

### Daily Development

```bash
# Start your day
supabase start
docker-compose -f docker-compose-with-supabase-cli.yml up -d

# Check status
supabase status
docker-compose -f docker-compose-with-supabase-cli.yml ps

# View logs
supabase logs
docker-compose -f docker-compose-with-supabase-cli.yml logs -f

# End your day
docker-compose -f docker-compose-with-supabase-cli.yml down
supabase stop
```

### Useful Commands

```bash
# Database management
supabase db reset                    # Reset to clean state
supabase db dump > backup.sql        # Backup schema
supabase db push                     # Push local changes to remote
supabase db pull                     # Pull remote schema locally

# Type generation
supabase gen types typescript --local > frontend/types/database.ts

# Direct database access
psql postgresql://postgres:postgres@localhost:54322/postgres
```

## 🔍 Troubleshooting

### Common Issues

#### Supabase won't start
```bash
# Check Docker is running
docker ps

# Check port conflicts
lsof -i :54321
lsof -i :54322

# Clean restart
supabase stop
docker system prune -a  # WARNING: Removes all Docker data
supabase start
```

#### Environment variable issues
```bash
# Verify variables are loaded
echo $SUPABASE_URL

# Check .env.local exists and has correct values
cat .env.local

# Restart services after changing env vars
docker-compose -f docker-compose-with-supabase-cli.yml restart
```

#### Database connection errors
```bash
# Test direct connection
psql postgresql://postgres:postgres@localhost:54322/postgres

# Check Supabase logs
supabase logs --follow

# Verify migrations
supabase migration list
```

### Getting Help

1. Check the [Supabase CLI docs](https://supabase.com/docs/guides/cli)
2. Review [common issues](../guides/troubleshooting/)
3. Search [GitHub issues](https://github.com/eddie-rowe/vertical-farm/issues)
4. Ask in team discussions

## 🎯 Next Steps

Now that your environment is set up:

1. **Run tests** to ensure everything works:
   ```bash
   docker-compose -f docker-compose-with-supabase-cli.yml exec backend pytest
   docker-compose -f docker-compose-with-supabase-cli.yml exec frontend npm test
   ```

2. **Explore the codebase**:
   - Backend: `backend/app/`
   - Frontend: `frontend/src/`
   - Database: `supabase/migrations/`

3. **Read the architecture docs**: [Architecture Overview](architecture-overview.md)

4. **Start contributing**: [Contributing Guide](../../CONTRIBUTING.md)

## 🚀 Pro Tips

1. **Use Supabase Studio** for database exploration and debugging
2. **Enable SQL logging** in development for query debugging
3. **Use the TypeScript types** generated from your schema
4. **Commit your migrations** but never commit `.env` files
5. **Regular backups**: `supabase db dump > backups/$(date +%Y%m%d).sql`

---

*🎉 Congratulations! You now have a fully configured local development environment. Happy coding!*
