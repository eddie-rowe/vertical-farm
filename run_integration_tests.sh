#!/bin/bash

# Integration Test Runner for Vertical Farm
# Tests all features implemented tonight

echo "🧪 Vertical Farm Integration Test Runner"
echo "========================================="
echo ""

# Check if backend is running
echo "🔍 Checking if backend is running..."
if curl -s http://localhost:8000/health > /dev/null; then
    echo "✅ Backend is running on http://localhost:8000"
else
    echo "❌ Backend is not running!"
    echo ""
    echo "Please start the backend first:"
    echo "  cd backend"
    echo "  uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
    echo ""
    exit 1
fi

echo ""
echo "🚀 Starting integration tests..."
echo ""

# Run the Python test suite
python3 test_integration_features.py

# Capture exit code
TEST_EXIT_CODE=$?

echo ""
echo "📊 Test Results Summary:"
echo "========================"

if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo "🎉 All tests passed! Your implementation is working perfectly!"
    echo ""
    echo "✅ Home Assistant error handling: WORKING"
    echo "✅ Supabase background processing: WORKING" 
    echo "✅ Supabase caching (Supavisor + HTTP): WORKING"
else
    echo "⚠️  Some tests failed. Check the output above for details."
    echo ""
    echo "Common issues:"
    echo "- Make sure Supabase is configured correctly"
    echo "- Check that all environment variables are set"
    echo "- Verify database migrations are up to date"
fi

echo ""
echo "🔗 Quick Manual Tests:"
echo "======================"
echo "• Health Check: curl http://localhost:8000/health"
echo "• Database Test: curl http://localhost:8000/api/v1/test/db-connection"
echo "• Cache Test: curl http://localhost:8000/api/v1/test/cache-test"
echo "• Queue Stats: curl http://localhost:8000/api/v1/test/background/queue-stats"

exit $TEST_EXIT_CODE 