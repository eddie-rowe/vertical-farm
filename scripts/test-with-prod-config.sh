#!/bin/bash

# Test locally with production configuration
# This helps verify production settings before deployment

echo "🧪 Testing with production configuration locally..."
echo ""

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo "❌ .env.production not found!"
    echo ""
    echo "To create it:"
    echo "1. Copy .env.production.example to .env.production"
    echo "2. Fill in your production values"
    echo ""
    echo "⚠️  NEVER commit .env.production to Git!"
    exit 1
fi

# Confirm with user
echo "⚠️  WARNING: This will use PRODUCTION configuration!"
echo "Make sure your production Supabase instance is accessible."
echo ""
read -p "Continue? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
fi

# Stop any running local containers
echo "1️⃣ Stopping any running containers..."
docker-compose -f docker-compose.local.yml --env-file .env.local down 2>/dev/null || true

# Start with production config
echo "2️⃣ Starting containers with production configuration..."
docker-compose -f docker-compose.local.yml --env-file .env.production up -d

echo ""
echo "✅ Running with production configuration!"
echo ""
echo "📍 Access points (using production data):"
echo "  - Frontend: http://localhost:3000"
echo "  - Backend API: http://localhost:8000"
echo ""
echo "⚠️  You are connected to PRODUCTION Supabase!"
echo ""
echo "To switch back to local development:"
echo "  make down && make up"
