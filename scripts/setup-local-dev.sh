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

# Extract keys from supabase status
ANON_KEY=$(supabase status | grep "anon key" | awk '{print $3}')
SERVICE_KEY=$(supabase status | grep "service_role key" | awk '{print $3}')

# Create .env.local if it doesn't exist
if [ ! -f .env.local ]; then
    echo "3️⃣ Creating .env.local file..."
    cat > .env.local << EOF
# Supabase Local Development Keys
SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=$ANON_KEY
NEXT_PUBLIC_SUPABASE_ANON_KEY=$ANON_KEY
SUPABASE_SERVICE_KEY=$SERVICE_KEY
SUPABASE_JWT_SECRET=your-jwt-secret-from-supabase-status

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
