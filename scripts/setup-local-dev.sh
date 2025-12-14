#!/bin/bash

# Setup script for local development with Supabase CLI + Docker Compose

echo "🚀 Setting up local development environment..."
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found!"
    echo "Install it with: brew install supabase/tap/supabase"
    echo "Or visit: https://supabase.com/docs/guides/cli"
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo "❌ Docker is not running!"
    echo "Please start Docker Desktop and try again."
    exit 1
fi

# Start Supabase
echo "1️⃣ Starting Supabase services..."
supabase start

# Get Supabase credentials
echo ""
echo "2️⃣ Getting Supabase credentials..."
echo ""

# Extract keys from supabase status using JSON output for reliability
SUPABASE_STATUS=$(supabase status --output json 2>/dev/null)
if [ -z "$SUPABASE_STATUS" ]; then
    echo "❌ Failed to get Supabase status. Is Supabase running?"
    exit 1
fi

# Parse JSON output with jq (reliable) or fallback to grep (legacy)
if command -v jq &> /dev/null; then
    ANON_KEY=$(echo "$SUPABASE_STATUS" | jq -r '.ANON_KEY // .anon_key // empty')
    SERVICE_KEY=$(echo "$SUPABASE_STATUS" | jq -r '.SERVICE_ROLE_KEY // .service_role_key // empty')
    API_URL=$(echo "$SUPABASE_STATUS" | jq -r '.API_URL // .api_url // "http://localhost:54321"')
else
    echo "⚠️  jq not found, falling back to text parsing (install jq for reliability)"
    ANON_KEY=$(supabase status | grep -i "anon key" | awk '{print $NF}')
    SERVICE_KEY=$(supabase status | grep -i "service_role key" | awk '{print $NF}')
    API_URL="http://localhost:54321"
fi

# Validate extracted keys
if [ -z "$ANON_KEY" ] || [ -z "$SERVICE_KEY" ]; then
    echo "❌ Failed to extract Supabase keys. Check supabase status output."
    exit 1
fi

# Create .env.local if it doesn't exist
if [ ! -f .env.local ]; then
    echo "3️⃣ Creating .env.local file..."
    cat > .env.local << EOF
# Supabase Local Development Keys
SUPABASE_URL=$API_URL
NEXT_PUBLIC_SUPABASE_URL=$API_URL
SUPABASE_ANON_KEY=$ANON_KEY
NEXT_PUBLIC_SUPABASE_ANON_KEY=$ANON_KEY
SUPABASE_SERVICE_KEY=$SERVICE_KEY

# Your other environment variables
NEXT_PUBLIC_API_URL=http://localhost:8000
BACKEND_CORS_ORIGINS=["http://localhost:3000","http://localhost:8000"]
PROJECT_NAME=vertical-farm
API_V1_STR=/api/v1
DEBUG=true
ENVIRONMENT=local
EOF
    echo "✅ Created .env.local with Supabase keys"
else
    echo "ℹ️  .env.local already exists. Update it with these values:"
    echo "SUPABASE_ANON_KEY=$ANON_KEY"
    echo "SUPABASE_SERVICE_KEY=$SERVICE_KEY"
fi

echo ""
echo "4️⃣ Starting application containers..."
# Use .env.local for local development
docker-compose -f docker-compose.local.yml --env-file .env.local up -d

echo ""
echo "✅ Local development environment is ready!"
echo ""
echo "📍 Access points:"
echo "  - Frontend: http://localhost:3000"
echo "  - Backend API: http://localhost:8000"
echo "  - Supabase Studio: http://localhost:54323"
echo "  - Supabase API: http://localhost:54321"
echo ""
echo "📝 Useful commands:"
echo "  - View logs: docker-compose logs -f"
echo "  - Stop everything: ./scripts/stop-local-dev.sh"
echo "  - Reset database: supabase db reset"
echo "  - View Supabase logs: supabase logs"
