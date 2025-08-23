#!/bin/bash

# Sync production database schema to local Supabase
# This pulls the schema but NOT the data

echo "🔄 Syncing production schema to local Supabase..."
echo ""

# Check if Supabase is running
if ! supabase status >/dev/null 2>&1; then
    echo "❌ Supabase is not running!"
    echo "Run 'supabase start' first"
    exit 1
fi

# Check for production credentials
if [ ! -f .env.production ]; then
    echo "❌ .env.production not found!"
    echo "This file should contain your production Supabase credentials"
    exit 1
fi

# Load production URL
source .env.production
if [ -z "$SUPABASE_URL" ]; then
    echo "❌ SUPABASE_URL not found in .env.production"
    exit 1
fi

# Extract project ref from URL
PROJECT_REF=$(echo $SUPABASE_URL | sed -E 's|https://([^.]+)\.supabase\.co.*|\1|')
echo "📍 Production project: $PROJECT_REF"

# Options for the user
echo ""
echo "Choose sync option:"
echo "1) Schema only (recommended) - Tables, views, functions, policies"
echo "2) Schema + seed data - Includes sample/reference data"
echo "3) Cancel"
echo ""
read -p "Enter choice (1-3): " choice

case $choice in
    1)
        echo ""
        echo "🔍 Pulling production schema..."
        
        # Generate migrations from production
        supabase db pull --project-ref $PROJECT_REF
        
        echo ""
        echo "📝 Applying schema to local database..."
        supabase db reset
        
        echo ""
        echo "✅ Schema sync complete!"
        echo ""
        echo "Your local database now has the same structure as production."
        echo "Run 'supabase studio' to view your database."
        ;;
        
    2)
        echo ""
        echo "⚠️  WARNING: This will pull schema AND seed data!"
        echo "Make sure you have permission to access production data locally."
        read -p "Continue? (y/N) " -n 1 -r
        echo ""
        
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo "🔍 Pulling production schema..."
            supabase db pull --project-ref $PROJECT_REF
            
            echo ""
            echo "📥 Creating seed file from production data..."
            # This is a placeholder - you'd need to implement data export
            echo "Data seeding requires manual setup:"
            echo "1. Export data from production Supabase dashboard"
            echo "2. Place in supabase/seed.sql"
            echo "3. Run: supabase db reset"
            
            echo ""
            echo "See: https://supabase.com/docs/guides/cli/seeding-your-database"
        else
            echo "Cancelled."
        fi
        ;;
        
    3)
        echo "Cancelled."
        exit 0
        ;;
        
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "💡 Next steps:"
echo "- Start local development: make up"
echo "- View database: supabase studio"
echo "- Run migrations: supabase migration up"
