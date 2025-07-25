#!/bin/bash

# Backend Test Runner Script
# This script runs the comprehensive test suite for the FastAPI backend

echo "🧪 Starting Backend Test Suite..."
echo "=================================="

# Check if we're in the correct directory
if [ ! -f "requirements.txt" ]; then
    echo "❌ Error: Please run this script from the backend directory"
    exit 1
fi

# Check if virtual environment exists
if [ ! -d "venv" ] && [ ! -d ".venv" ] && [ -z "$VIRTUAL_ENV" ]; then
    echo "⚠️  Warning: No virtual environment detected"
    echo "   Consider creating one with: python -m venv venv && source venv/bin/activate"
fi

# Install/update dependencies
echo "📦 Installing/updating dependencies..."
pip install -r requirements.txt

# Create test environment file if it doesn't exist
if [ ! -f ".env.test" ]; then
    echo "🔧 Creating test environment file..."
    cat > .env.test << EOL
# Test Environment Configuration
ENVIRONMENT=test
SUPABASE_URL=https://test.supabase.co
SUPABASE_SERVICE_KEY=test_service_key
SUPABASE_ANON_KEY=test_anon_key
JWT_SECRET_KEY=test_jwt_secret_key_for_testing_only
CORS_ORIGINS=["http://localhost:3000"]
LOG_LEVEL=INFO
EOL
fi

# Run different test suites based on argument
case "$1" in
    "unit")
        echo "🔬 Running unit tests only..."
        pytest -m "unit" -v
        ;;
    "integration") 
        echo "🔗 Running integration tests only..."
        pytest -m "integration" -v
        ;;
    "api")
        echo "🌐 Running API tests only..."
        pytest -m "api" -v
        ;;
    "coverage")
        echo "📊 Running tests with detailed coverage report..."
        pytest --cov=app --cov-report=html --cov-report=term-missing --cov-fail-under=80
        echo "📋 Coverage report generated in htmlcov/index.html"
        ;;
    "fast")
        echo "⚡ Running fast tests only (excluding slow tests)..."
        pytest -m "not slow" -v
        ;;
    "critical")
        echo "🚨 Running critical endpoint tests only..."
        pytest app/tests/test_home_assistant_endpoints.py app/tests/test_main.py -v
        ;;
    "lint")
        echo "🧹 Running code quality checks..."
        echo "Running black..."
        black --check app/
        echo "Running isort..."
        isort --check-only app/
        echo "Flake8 has been removed from the project"
        echo "Running mypy..."
        mypy app/
        ;;
    "fix")
        echo "🔧 Fixing code formatting..."
        black app/
        isort app/
        echo "✅ Code formatting fixed"
        ;;
    "all")
        echo "🎯 Running complete test suite with coverage..."
        pytest --cov=app --cov-report=term-missing --cov-report=html -v
        ;;
    *)
        echo "🎯 Running default test suite..."
        pytest -v
        ;;
esac

# Check test results
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ All tests passed successfully!"
    echo ""
    echo "📝 Available test commands:"
    echo "   ./run_tests.sh unit        - Run unit tests only"
    echo "   ./run_tests.sh integration - Run integration tests only"  
    echo "   ./run_tests.sh api         - Run API tests only"
    echo "   ./run_tests.sh coverage    - Run with detailed coverage"
    echo "   ./run_tests.sh fast        - Run fast tests (exclude slow)"
    echo "   ./run_tests.sh critical    - Run critical endpoint tests"
    echo "   ./run_tests.sh lint        - Run code quality checks"
    echo "   ./run_tests.sh fix         - Fix code formatting"
    echo "   ./run_tests.sh all         - Run complete test suite"
else
    echo ""
    echo "❌ Some tests failed. Please check the output above."
    exit 1
fi 