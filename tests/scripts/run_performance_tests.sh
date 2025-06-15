#!/bin/bash

# Performance Testing Suite for Vertical Farm
# Measures performance before and after Cloudflare Workers implementation

set -e

echo "🚀 Vertical Farm Performance Testing Suite"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKEND_URL="http://localhost:8000"
FRONTEND_URL="http://localhost:3000"
RESULTS_DIR="tests/results"

# Create results directory
mkdir -p "$RESULTS_DIR"

# Function to check if service is running
check_service() {
    local url=$1
    local name=$2
    
    echo -e "${BLUE}Checking $name availability...${NC}"
    if curl -s --max-time 5 "$url" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ $name is running${NC}"
        return 0
    else
        echo -e "${RED}❌ $name is not running${NC}"
        return 1
    fi
}

# Function to run Python performance tests
run_python_tests() {
    echo -e "\n${BLUE}🐍 Running Python Performance Tests${NC}"
    echo "-----------------------------------"
    
    # Existing caching tests
    echo "Running existing caching tests..."
    python tests/caching/test_caching.py
    
    # Integration performance tests
    echo "Running integration performance tests..."
    python tests/integration/test_integration_features.py
    
    # New Cloudflare performance tests
    echo "Running Cloudflare performance baseline tests..."
    python tests/caching/test_cloudflare_performance.py --baseline
}

# Function to run Node.js performance tests
run_node_tests() {
    echo -e "\n${BLUE}📦 Running Node.js Performance Tests${NC}"
    echo "------------------------------------"
    
    # Run existing test suite
    node tests/scripts/run-all-tests.js
}

# Function to generate performance report
generate_report() {
    echo -e "\n${BLUE}📊 Generating Performance Report${NC}"
    echo "--------------------------------"
    
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    local report_file="$RESULTS_DIR/performance_report_$timestamp.md"
    
    cat > "$report_file" << EOF
# Vertical Farm Performance Test Report

**Generated:** $(date)
**Test Environment:** Local Development

## Test Results Summary

### Backend Performance
- **URL:** $BACKEND_URL
- **Status:** $(check_service "$BACKEND_URL/health" "Backend" && echo "✅ Running" || echo "❌ Not Running")

### Frontend Performance  
- **URL:** $FRONTEND_URL
- **Status:** $(check_service "$FRONTEND_URL" "Frontend" && echo "✅ Running" || echo "❌ Not Running")

### Key Metrics Measured
1. **API Response Times**
   - Average response time
   - P95 and P99 percentiles
   - Cache hit rates

2. **Cache Performance**
   - Cold vs warm cache performance
   - Cache warming effectiveness
   - ETag validation

3. **Concurrent Load**
   - Requests per second
   - Success rate under load
   - Response time distribution

### Files Generated
- \`baseline_performance.json\` - Detailed metrics
- \`test_results.log\` - Test execution log

## Next Steps

1. **Implement Cloudflare Workers** for caching optimization
2. **Run comparison tests** using:
   \`\`\`bash
   python tests/caching/test_cloudflare_performance.py --compare --production-url https://your-workers-url.com
   \`\`\`
3. **Analyze improvements** in response times and cache hit rates

EOF

    echo -e "${GREEN}📄 Report generated: $report_file${NC}"
}

# Main execution
main() {
    echo -e "${YELLOW}Starting performance test suite...${NC}"
    
    # Check prerequisites
    echo -e "\n${BLUE}🔍 Checking Prerequisites${NC}"
    echo "-------------------------"
    
    # Check if backend is running
    if ! check_service "$BACKEND_URL/health" "Backend"; then
        echo -e "${YELLOW}⚠️  Backend not running. Start with:${NC}"
        echo "   cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
        echo ""
    fi
    
    # Check if frontend is running
    if ! check_service "$FRONTEND_URL" "Frontend"; then
        echo -e "${YELLOW}⚠️  Frontend not running. Start with:${NC}"
        echo "   cd frontend && npm run dev"
        echo ""
    fi
    
    # Check Python dependencies
    if ! python -c "import aiohttp, requests, statistics" 2>/dev/null; then
        echo -e "${YELLOW}⚠️  Installing Python dependencies...${NC}"
        pip install aiohttp requests
    fi
    
    # Run tests based on arguments
    case "${1:-all}" in
        "python")
            run_python_tests
            ;;
        "node")
            run_node_tests
            ;;
        "baseline")
            echo -e "${BLUE}🏁 Running Baseline Performance Tests${NC}"
            python tests/caching/test_cloudflare_performance.py --baseline
            ;;
        "production")
            if [ -z "$2" ]; then
                echo -e "${RED}❌ Production URL required for production tests${NC}"
                echo "Usage: $0 production https://your-workers-url.com"
                exit 1
            fi
            echo -e "${BLUE}🚀 Running Production Performance Tests${NC}"
            python tests/caching/test_cloudflare_performance.py --production --production-url "$2"
            ;;
        "compare")
            if [ -z "$2" ]; then
                echo -e "${RED}❌ Production URL required for comparison tests${NC}"
                echo "Usage: $0 compare https://your-workers-url.com"
                exit 1
            fi
            echo -e "${BLUE}🔄 Running Performance Comparison Tests${NC}"
            python tests/caching/test_cloudflare_performance.py --compare --production-url "$2"
            ;;
        "all"|*)
            run_python_tests
            run_node_tests
            ;;
    esac
    
    # Generate report
    generate_report
    
    echo -e "\n${GREEN}🎉 Performance testing completed!${NC}"
    echo -e "${BLUE}📁 Check $RESULTS_DIR/ for detailed results${NC}"
}

# Help function
show_help() {
    cat << EOF
Vertical Farm Performance Testing Suite

Usage: $0 [COMMAND] [OPTIONS]

Commands:
  all         Run all performance tests (default)
  python      Run Python performance tests only
  node        Run Node.js performance tests only
  baseline    Run baseline performance tests (before Cloudflare Workers)
  production  Run production performance tests (requires URL)
  compare     Run comparison tests (requires URL)

Examples:
  $0                                          # Run all tests
  $0 baseline                                 # Run baseline tests
  $0 production https://api.yourfarm.com      # Test production with Workers
  $0 compare https://api.yourfarm.com         # Compare baseline vs production

Environment Variables:
  BACKEND_URL   Backend URL (default: http://localhost:8000)
  FRONTEND_URL  Frontend URL (default: http://localhost:3000)

EOF
}

# Handle help
if [[ "$1" == "--help" || "$1" == "-h" ]]; then
    show_help
    exit 0
fi

# Run main function
main "$@" 