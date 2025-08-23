#!/bin/bash

# Stop script for local development

echo "🛑 Stopping local development environment..."
echo ""

# Stop Docker containers
echo "1️⃣ Stopping application containers..."
docker-compose -f docker-compose.local.yml --env-file .env.local down

# Ask if user wants to stop Supabase
echo ""
read -p "Do you want to stop Supabase CLI? (y/N) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "2️⃣ Stopping Supabase..."
    supabase stop
else
    echo "ℹ️  Keeping Supabase running"
fi

echo ""
echo "✅ Local development environment stopped!"
echo ""
echo "💡 Tips:"
echo "  - To restart: ./scripts/setup-local-dev.sh"
echo "  - To reset Supabase database: supabase db reset"
echo "  - To view Supabase status: supabase status"