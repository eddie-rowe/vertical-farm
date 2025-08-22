#!/bin/bash
# Simple script to create .env.local from Supabase status

echo "Creating .env.local from Supabase status..."

# Get keys
ANON_KEY=$(supabase status | grep "anon key" | awk '{print $3}')
SERVICE_KEY=$(supabase status | grep "service_role key" | awk '{print $3}')
JWT_SECRET=$(supabase status | grep "JWT secret" | awk '{print $3}')

if [ -z "$ANON_KEY" ]; then
    echo "❌ Could not get keys. Is Supabase running?"
    echo "Run: supabase start"
    exit 1
fi

cat > .env.local << EOF
# Supabase Local
# Project ref: lvjhhvxwxeeupamyahmr
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=$ANON_KEY
SUPABASE_SERVICE_KEY=$SERVICE_KEY
SUPABASE_JWT_SECRET=$JWT_SECRET

# Next.js
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=$ANON_KEY
NEXT_PUBLIC_API_URL=http://localhost:8000

# Backend
BACKEND_CORS_ORIGINS=["http://localhost:3000","http://localhost:8000"]
PROJECT_NAME=vertical-farm
API_V1_STR=/api/v1
DEBUG=true
ENVIRONMENT=local
FRONTEND_HOST=http://localhost:3000
SECRET_KEY=local-development-secret
EOF

echo "✅ Created .env.local"
echo ""
echo "Now run:"
echo "docker-compose -f docker-compose.local.yml --env-file .env.local up -d"
