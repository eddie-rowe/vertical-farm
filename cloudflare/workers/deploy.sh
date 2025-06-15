#!/bin/bash

# Cloudflare Workers Deployment Script for Vertical Farm
# This script deploys all workers and sets up the necessary KV namespaces

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
WORKERS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ACCOUNT_ID=""
API_TOKEN=""

echo -e "${BLUE}🚀 Vertical Farm Cloudflare Workers Deployment${NC}"
echo "=================================================="

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo -e "${RED}❌ Wrangler CLI not found. Please install it first:${NC}"
    echo "npm install -g wrangler"
    exit 1
fi

# Check if logged in
if ! wrangler whoami &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in to Cloudflare. Please login first:${NC}"
    echo "wrangler login"
    exit 1
fi

echo -e "${GREEN}✅ Wrangler CLI found and authenticated${NC}"

# Function to create KV namespace
create_kv_namespace() {
    local name=$1
    local description=$2
    
    echo -e "${BLUE}📦 Creating KV namespace: ${name}${NC}"
    
    # Create production namespace
    local prod_id=$(wrangler kv:namespace create "$name" --preview false 2>/dev/null | grep -o 'id = "[^"]*"' | cut -d'"' -f2)
    
    # Create preview namespace
    local preview_id=$(wrangler kv:namespace create "$name" --preview true 2>/dev/null | grep -o 'id = "[^"]*"' | cut -d'"' -f2)
    
    echo -e "${GREEN}✅ Created KV namespace: ${name}${NC}"
    echo "   Production ID: ${prod_id}"
    echo "   Preview ID: ${preview_id}"
    
    # Return both IDs
    echo "${prod_id},${preview_id}"
}

# Function to update wrangler.toml with KV namespace IDs
update_wrangler_config() {
    local worker_dir=$1
    local kv_binding=$2
    local prod_id=$3
    local preview_id=$4
    
    local config_file="${worker_dir}/wrangler.toml"
    
    if [[ -f "$config_file" ]]; then
        # Update production ID
        sed -i.bak "s/id = \"your-.*-kv-namespace-id\"/id = \"${prod_id}\"/" "$config_file"
        # Update preview ID  
        sed -i.bak "s/preview_id = \"your-preview-.*-kv-namespace-id\"/preview_id = \"${preview_id}\"/" "$config_file"
        
        echo -e "${GREEN}✅ Updated ${config_file} with KV namespace IDs${NC}"
        rm "${config_file}.bak" 2>/dev/null || true
    fi
}

# Function to deploy a worker
deploy_worker() {
    local worker_dir=$1
    local worker_name=$2
    
    echo -e "${BLUE}🚀 Deploying worker: ${worker_name}${NC}"
    
    cd "$worker_dir"
    
    if [[ -f "wrangler.toml" ]]; then
        # Deploy to development first
        echo -e "${YELLOW}📤 Deploying to development environment...${NC}"
        wrangler deploy --env development
        
        # Deploy to production
        echo -e "${YELLOW}📤 Deploying to production environment...${NC}"
        wrangler deploy --env production
        
        echo -e "${GREEN}✅ Successfully deployed ${worker_name}${NC}"
    else
        echo -e "${RED}❌ No wrangler.toml found in ${worker_dir}${NC}"
        return 1
    fi
    
    cd "$WORKERS_DIR"
}

# Main deployment process
main() {
    echo -e "${BLUE}🔧 Setting up KV namespaces...${NC}"
    
    # Create KV namespaces
    echo -e "${YELLOW}Creating cache KV namespace...${NC}"
    cache_kv_ids=$(create_kv_namespace "vertical-farm-cache" "Main API cache storage")
    cache_prod_id=$(echo "$cache_kv_ids" | cut -d',' -f1)
    cache_preview_id=$(echo "$cache_kv_ids" | cut -d',' -f2)
    
    echo -e "${YELLOW}Creating health KV namespace...${NC}"
    health_kv_ids=$(create_kv_namespace "vertical-farm-health" "Health check cache storage")
    health_prod_id=$(echo "$health_kv_ids" | cut -d',' -f1)
    health_preview_id=$(echo "$health_kv_ids" | cut -d',' -f2)
    
    echo -e "${YELLOW}Creating assets KV namespace...${NC}"
    assets_kv_ids=$(create_kv_namespace "vertical-farm-assets" "Static assets cache storage")
    assets_prod_id=$(echo "$assets_kv_ids" | cut -d',' -f1)
    assets_preview_id=$(echo "$assets_kv_ids" | cut -d',' -f2)
    
    # Update wrangler configurations
    echo -e "${BLUE}📝 Updating worker configurations...${NC}"
    
    update_wrangler_config "main-api-cache" "CACHE_KV" "$cache_prod_id" "$cache_preview_id"
    update_wrangler_config "health-check-cache" "CACHE_KV" "$health_prod_id" "$health_preview_id"
    update_wrangler_config "static-assets-cache" "ASSETS_KV" "$assets_prod_id" "$assets_preview_id"
    
    # Deploy workers
    echo -e "${BLUE}🚀 Deploying workers...${NC}"
    
    deploy_worker "main-api-cache" "Main API Cache Worker"
    deploy_worker "health-check-cache" "Health Check Cache Worker"
    deploy_worker "static-assets-cache" "Static Assets Cache Worker"
    
    echo ""
    echo -e "${GREEN}🎉 All workers deployed successfully!${NC}"
    echo ""
    echo -e "${BLUE}📋 Next Steps:${NC}"
    echo "1. Update your DNS settings to point to the workers"
    echo "2. Update the ORIGIN_URL variables in each wrangler.toml with your actual domains"
    echo "3. Test the workers using the performance test suite"
    echo "4. Monitor cache hit rates and performance metrics"
    echo ""
    echo -e "${BLUE}📊 KV Namespace IDs (save these):${NC}"
    echo "Cache KV: ${cache_prod_id} (prod), ${cache_preview_id} (preview)"
    echo "Health KV: ${health_prod_id} (prod), ${health_preview_id} (preview)"
    echo "Assets KV: ${assets_prod_id} (prod), ${assets_preview_id} (preview)"
}

# Check for help flag
if [[ "$1" == "--help" || "$1" == "-h" ]]; then
    echo "Cloudflare Workers Deployment Script"
    echo ""
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --help, -h     Show this help message"
    echo "  --dry-run      Show what would be deployed without actually deploying"
    echo ""
    echo "Prerequisites:"
    echo "1. Install Wrangler CLI: npm install -g wrangler"
    echo "2. Login to Cloudflare: wrangler login"
    echo "3. Update wrangler.toml files with your actual domain names"
    echo ""
    exit 0
fi

# Dry run mode
if [[ "$1" == "--dry-run" ]]; then
    echo -e "${YELLOW}🔍 DRY RUN MODE - No actual deployment will occur${NC}"
    echo ""
    echo "Would deploy the following workers:"
    echo "1. Main API Cache Worker (main-api-cache/)"
    echo "2. Health Check Cache Worker (health-check-cache/)"
    echo "3. Static Assets Cache Worker (static-assets-cache/)"
    echo ""
    echo "Would create the following KV namespaces:"
    echo "1. vertical-farm-cache"
    echo "2. vertical-farm-health"
    echo "3. vertical-farm-assets"
    echo ""
    exit 0
fi

# Run main deployment
main 