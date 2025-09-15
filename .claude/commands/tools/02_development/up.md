# /up - Start Development Environment

Start the complete local development environment including Supabase and Docker containers.

## Usage
```
/up
```

## Examples
```
/up
```

## Execution

When invoked with `/up`, execute these steps:

1. **Check Prerequisites**
   ```
   # Check for Supabase CLI
   command -v supabase
   # If not found: "❌ Supabase CLI not found! Install with: brew install supabase/tap/supabase"
   
   # Check Docker is running
   docker info
   # If not running: "❌ Docker is not running! Please start Docker Desktop."
   ```
   
2. **Begin Environment Setup**
   **Output:**
   ```
   🚀 Starting complete local development environment...
   ```
   
   *Note: Context is automatically initialized by UserPromptSubmit hook*

3. **Start Supabase Services**
   ```
   # Check if Supabase is already running
   supabase status
   
   # If not running, start it
   supabase start
   ```
   **Output:**
   ```
   1️⃣ Starting Supabase...
   ✅ Supabase running
   ```

4. **Configure Environment**
   ```
   # Create .env.local if it doesn't exist
   ./scripts/create-env-local.sh
   
   # Update URLs for Docker networking
   sed -i '' 's|http://localhost:54321|http://host.docker.internal:54321|g' .env.local
   ```
   **Output:**
   ```
   2️⃣ Creating .env.local...
   ✅ Created .env.local with Docker-compatible URLs
   ```

5. **Initialize Database**
   ```
   # Run migrations and seed data
   supabase db reset
   ```
   **Output:**
   ```
   3️⃣ Checking database migrations and seeding data...
   ✅ Database initialized
   ```

6. **Start Application Containers**
   ```
   # Start Docker containers
   docker-compose -f docker-compose.local.yml --env-file .env.local up -d
   ```
   **Output:**
   ```
   4️⃣ Starting application containers...
   ```

7. **Complete Setup**
   **Output:**
   ```
   ✅ Development environment ready!
   
   📍 Access:
     Frontend:        http://localhost:3000
     Backend API:     http://localhost:8000
     API Docs:        http://localhost:8000/docs
     Supabase Studio: http://localhost:54323
   
   📝 Next steps:
     Start development: /plan {issue} to analyze an issue
     View logs:         docker-compose logs -f
     Stop all:          /down or make down
     Reset DB:          supabase db reset
   ```
   
   *Note: Environment configuration is saved by PostToolUse hook for subsequent runs*