#!/bin/bash

# test-all.sh - Run all tests locally
# Usage: ./test-all.sh [backend|frontend|integration|all]

set -e

# Load environment variables based on environment
if [ "$CI" = "true" ] || [ "$GITHUB_ACTIONS" = "true" ]; then
    echo "Running in CI environment - using GitHub secrets/variables"
    # In GitHub Actions, environment variables are already set
    # Just verify critical ones are present
    if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
        echo "Warning: Required Supabase environment variables not found in CI"
    fi
elif [ -f ".env" ]; then
    echo "Loading environment variables from .env file..."
    # Use a safer method to load .env that handles special characters
    set -a  # automatically export all variables
    source .env 2>/dev/null || true
    set +a  # stop automatically exporting
    echo "Environment variables loaded from .env file"
else
    echo "Warning: .env file not found and not in CI. Integration tests may fail without proper environment variables."
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default to running all tests
TEST_TYPE=${1:-all}

echo -e "${BLUE}🧪 Vertical Farm Test Suite${NC}"
echo "=================================="

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2 PASSED${NC}"
    else
        echo -e "${RED}❌ $2 FAILED${NC}"
        return 1
    fi
}

# Backend tests
run_backend_tests() {
    echo -e "\n${YELLOW}🐍 Running Backend Tests...${NC}"
    cd backend
    
    # Check if virtual environment exists
    if [ ! -d "venv" ]; then
        echo "Creating Python virtual environment..."
        python -m venv venv
    fi
    
    # Activate virtual environment
    source venv/bin/activate
    
    # Install dependencies
    echo "Installing Python dependencies..."
    pip install -q --upgrade pip
    pip install -q -e .[test,dev]
    
    # Flake8 has been removed from the project - focusing on black and mypy
    
    # Run type checking
    echo "Running mypy type checking..."
    mypy app/ --ignore-missing-imports || echo "Type checking completed with warnings"
    
    # Run tests
    echo "Running pytest..."
    export TESTING=true
    python -m pytest app/tests/ -v --cov=app --cov-report=term-missing
    
    local exit_code=$?
    deactivate
    cd ..
    return $exit_code
}

# Frontend tests
run_frontend_tests() {
    echo -e "\n${YELLOW}⚛️  Running Frontend Tests...${NC}"
    cd frontend
    
    # Install dependencies
    echo "Installing Node.js dependencies..."
    npm install
    
    # Run linting if configured
    if [ -f ".eslintrc.js" ] || [ -f ".eslintrc.json" ]; then
        echo "Running ESLint..."
        npm run lint
    else
        echo "No ESLint configuration found, skipping lint"
    fi
    
    # Run type checking if TypeScript is configured
    if [ -f "tsconfig.json" ]; then
        echo "Running TypeScript type checking..."
        npx tsc --noEmit
    else
        echo "No TypeScript configuration found, skipping type check"
    fi
    
    # Run tests if configured
    if grep -q '"test"' package.json; then
        echo "Running Jest tests..."
        npm test -- --coverage --watchAll=false
    else
        echo "No frontend tests configured yet"
        cd ..
        return 0
    fi
    
    local exit_code=$?
    cd ..
    return $exit_code
}

# Integration tests
run_integration_tests() {
    echo -e "\n${YELLOW}🔗 Running Integration Tests...${NC}"
    
    # Check if backend is running
    if ! curl -s http://localhost:8000/health > /dev/null; then
        echo "Backend not running. Starting backend..."
        cd backend
        source venv/bin/activate
        uvicorn app.main:app --host 0.0.0.0 --port 8000 &
        BACKEND_PID=$!
        echo "Backend started with PID: $BACKEND_PID"
        cd ..
        
        # Wait for backend to start
        echo "Waiting for backend to start..."
        for i in {1..30}; do
            if curl -s http://localhost:8000/health > /dev/null; then
                echo "Backend is ready!"
                break
            fi
            sleep 1
        done
    fi
    
    # Run integration tests
    cd tests
    echo "Running integration test suite..."
    node run-all-tests.js
    
    local exit_code=$?
    
    # Stop backend if we started it
    if [ ! -z "$BACKEND_PID" ]; then
        echo "Stopping backend (PID: $BACKEND_PID)..."
        kill $BACKEND_PID 2>/dev/null || true
    fi
    
    cd ..
    return $exit_code
}

# Main execution
case $TEST_TYPE in
    backend)
        run_backend_tests
        print_status $? "Backend Tests"
        ;;
    frontend)
        run_frontend_tests
        print_status $? "Frontend Tests"
        ;;
    integration)
        run_integration_tests
        print_status $? "Integration Tests"
        ;;
    all)
        echo -e "\n${BLUE}Running all test suites...${NC}"
        
        # Track results
        BACKEND_RESULT=0
        FRONTEND_RESULT=0
        INTEGRATION_RESULT=0
        
        # Run backend tests
        run_backend_tests
        BACKEND_RESULT=$?
        
        # Run frontend tests
        run_frontend_tests
        FRONTEND_RESULT=$?
        
        # Run integration tests (only if backend and frontend pass)
        if [ $BACKEND_RESULT -eq 0 ] && [ $FRONTEND_RESULT -eq 0 ]; then
            run_integration_tests
            INTEGRATION_RESULT=$?
        else
            echo -e "${YELLOW}⚠️  Skipping integration tests due to unit test failures${NC}"
            INTEGRATION_RESULT=1
        fi
        
        # Print summary
        echo -e "\n${BLUE}📊 Test Summary${NC}"
        echo "=================="
        print_status $BACKEND_RESULT "Backend Tests" || true
        print_status $FRONTEND_RESULT "Frontend Tests" || true
        print_status $INTEGRATION_RESULT "Integration Tests" || true
        
        # Exit with error if any tests failed
        if [ $BACKEND_RESULT -ne 0 ] || [ $FRONTEND_RESULT -ne 0 ] || [ $INTEGRATION_RESULT -ne 0 ]; then
            echo -e "\n${RED}❌ Some tests failed${NC}"
            exit 1
        else
            echo -e "\n${GREEN}✅ All tests passed!${NC}"
            exit 0
        fi
        ;;
    *)
        echo "Usage: $0 [backend|frontend|integration|all]"
        exit 1
        ;;
esac 