#!/bin/bash

# Load environment variables from .env file
if [ -f "../../.env" ]; then
    set -a  # automatically export all variables
    source ../../.env
    set +a  # stop automatically exporting
fi

# Check required environment variables
required_vars=("CLOUDFLARE_ACCOUNT_ID" "CLOUDFLARE_API_TOKEN" "DOMAIN" "SUPABASE_URL" "SUPABASE_ANON_KEY")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "Error: $var is not set"
        exit 1
    fi
done

echo "🚀 Starting Cloudflare Workers deployment..."

# Function to deploy a worker with environment variable substitution
deploy_worker() {
    local worker_dir=$1
    local worker_name=$2
    
    echo "📦 Deploying $worker_name..."
    
    cd "$worker_dir"
    
    # Create a temporary wrangler.toml with substituted variables
    envsubst < wrangler.toml > wrangler.tmp.toml
    
    # Deploy using the temporary file
    wrangler deploy --config wrangler.tmp.toml
    
    # Clean up temporary file
    rm wrangler.tmp.toml
    
    cd ..
}

# Deploy each worker
deploy_worker "sensor-processor" "sensor-processor"
deploy_worker "main-api-cache" "main-api-cache"
deploy_worker "static-assets-cache" "static-assets-cache"
deploy_worker "health-check-cache" "health-check-cache"

echo "✅ All workers deployed successfully!" 