#!/bin/bash

# Cloudflare Deployment Script for Vertical Farm
# Deploys Workers, configures security rules, and sets up KV namespaces

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID}"
API_TOKEN="${CLOUDFLARE_API_TOKEN}"
ZONE_ID="${CLOUDFLARE_ZONE_ID}"

# Check required environment variables
check_env_vars() {
    echo -e "${YELLOW}Checking environment variables...${NC}"
    
    if [ -z "$ACCOUNT_ID" ]; then
        echo -e "${RED}Error: CLOUDFLARE_ACCOUNT_ID not set${NC}"
        exit 1
    fi
    
    if [ -z "$API_TOKEN" ]; then
        echo -e "${RED}Error: CLOUDFLARE_API_TOKEN not set${NC}"
        exit 1
    fi
    
    if [ -z "$ZONE_ID" ]; then
        echo -e "${RED}Error: CLOUDFLARE_ZONE_ID not set${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}Environment variables OK${NC}"
}

# Deploy Workers
deploy_workers() {
    echo -e "${YELLOW}Deploying Cloudflare Workers...${NC}"
    
    # Deploy sensor processor worker
    cd workers/sensor-processor
    echo "Deploying sensor-processor worker..."
    wrangler deploy --env production
    cd ../..
    
    echo -e "${GREEN}Workers deployed successfully${NC}"
}

# Create KV namespaces
create_kv_namespaces() {
    echo -e "${YELLOW}Creating KV namespaces...${NC}"
    
    # Create device cache namespace
    echo "Creating device cache namespace..."
    wrangler kv:namespace create "DEVICE_CACHE" --env production
    wrangler kv:namespace create "DEVICE_CACHE" --env development --preview
    
    echo -e "${GREEN}KV namespaces created${NC}"
}

# Configure security rules
configure_security() {
    echo -e "${YELLOW}Configuring security rules...${NC}"
    
    # Apply WAF rules
    echo "Applying WAF rules..."
    curl -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/firewall/rules" \
        -H "Authorization: Bearer $API_TOKEN" \
        -H "Content-Type: application/json" \
        --data @security/waf-rules.json
    
    # Apply rate limiting rules
    echo "Applying rate limiting rules..."
    curl -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/rate_limits" \
        -H "Authorization: Bearer $API_TOKEN" \
        -H "Content-Type: application/json" \
        --data @security/rate-limiting.json
    
    echo -e "${GREEN}Security rules configured${NC}"
}

# Configure CDN caching
configure_cdn() {
    echo -e "${YELLOW}Configuring CDN caching...${NC}"
    
    # Apply cache rules
    echo "Applying cache rules..."
    curl -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/rulesets" \
        -H "Authorization: Bearer $API_TOKEN" \
        -H "Content-Type: application/json" \
        --data @cdn/cache-rules.json
    
    echo -e "${GREEN}CDN caching configured${NC}"
}

# Verify deployment
verify_deployment() {
    echo -e "${YELLOW}Verifying deployment...${NC}"
    
    # Check worker status
    echo "Checking worker status..."
    wrangler status sensor-processor --env production
    
    # Test KV namespace
    echo "Testing KV namespace..."
    wrangler kv:key put --binding=DEVICE_CACHE "test:key" "test-value" --env production
    wrangler kv:key get --binding=DEVICE_CACHE "test:key" --env production
    wrangler kv:key delete --binding=DEVICE_CACHE "test:key" --env production
    
    echo -e "${GREEN}Deployment verified successfully${NC}"
}

# Main deployment function
main() {
    echo -e "${GREEN}Starting Cloudflare deployment for Vertical Farm...${NC}"
    
    check_env_vars
    
    # Check if wrangler is installed
    if ! command -v wrangler &> /dev/null; then
        echo -e "${RED}Error: Wrangler CLI not found. Please install it first.${NC}"
        echo "npm install -g wrangler"
        exit 1
    fi
    
    # Login check
    echo "Checking Wrangler authentication..."
    if ! wrangler whoami &> /dev/null; then
        echo -e "${YELLOW}Please login to Wrangler first:${NC}"
        echo "wrangler login"
        exit 1
    fi
    
    # Deploy components
    create_kv_namespaces
    deploy_workers
    configure_security
    configure_cdn
    verify_deployment
    
    echo -e "${GREEN}🎉 Cloudflare deployment completed successfully!${NC}"
    echo -e "${YELLOW}Next steps:${NC}"
    echo "1. Update your DNS settings to point to Cloudflare"
    echo "2. Update environment variables in your application"
    echo "3. Test the sensor data processing endpoints"
    echo "4. Monitor the Cloudflare dashboard for performance metrics"
}

# Run main function
main "$@" 