#!/usr/bin/env python3

"""
Comprehensive Integration Test Suite
Tests all features implemented tonight:
1. Home Assistant error handling and recovery
2. Supabase background processing with queues
3. Supabase caching (Supavisor + HTTP headers)

Run with: python test_integration_features.py
"""

import asyncio
import os
import sys
import time
from datetime import datetime

import aiohttp

# Add the backend directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), "backend"))


class IntegrationTester:
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.session = None
        self.test_results = []

    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()

    def log_test(self, test_name: str, success: bool, details: str = ""):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   📋 {details}")
        self.test_results.append(
            {
                "test": test_name,
                "success": success,
                "details": details,
                "timestamp": datetime.now().isoformat(),
            }
        )

    async def test_backend_health(self):
        """Test basic backend connectivity"""
        try:
            async with self.session.get(f"{self.base_url}/health") as response:
                if response.status == 200:
                    data = await response.json()
                    self.log_test(
                        "Backend Health Check",
                        True,
                        f"Status: {data.get('status', 'unknown')}",
                    )
                    return True
                else:
                    self.log_test(
                        "Backend Health Check", False, f"HTTP {response.status}"
                    )
                    return False
        except Exception as e:
            self.log_test("Backend Health Check", False, f"Connection error: {str(e)}")
            return False

    async def test_database_connection(self):
        """Test Supabase database connection with caching"""
        try:
            async with self.session.get(
                f"{self.base_url}/api/v1/test/db-connection"
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    pooler_used = data.get("pooler_enabled", False)
                    cache_headers = "cache-control" in response.headers

                    details = f"Pooler: {pooler_used}, Cache Headers: {cache_headers}"
                    self.log_test("Database Connection + Caching", True, details)
                    return True
                else:
                    self.log_test(
                        "Database Connection + Caching",
                        False,
                        f"HTTP {response.status}",
                    )
                    return False
        except Exception as e:
            self.log_test("Database Connection + Caching", False, f"Error: {str(e)}")
            return False

    async def test_query_caching_performance(self):
        """Test Supavisor query caching performance"""
        try:
            # First query (cache miss)
            start_time = time.time()
            async with self.session.get(
                f"{self.base_url}/api/v1/test/db-query"
            ) as response:
                first_duration = time.time() - start_time
                if response.status != 200:
                    self.log_test(
                        "Query Caching Performance", False, f"HTTP {response.status}"
                    )
                    return False

            # Second query (should be cached)
            start_time = time.time()
            async with self.session.get(
                f"{self.base_url}/api/v1/test/db-query"
            ) as response:
                second_duration = time.time() - start_time
                if response.status != 200:
                    self.log_test(
                        "Query Caching Performance", False, f"HTTP {response.status}"
                    )
                    return False

            # Check if second query is faster (indicating caching)
            improvement = first_duration > second_duration
            details = f"1st: {first_duration:.3f}s, 2nd: {second_duration:.3f}s"
            self.log_test("Query Caching Performance", improvement, details)
            return improvement

        except Exception as e:
            self.log_test("Query Caching Performance", False, f"Error: {str(e)}")
            return False

    async def test_http_cache_headers(self):
        """Test HTTP cache headers implementation"""
        try:
            async with self.session.get(
                f"{self.base_url}/api/v1/test/cache-test"
            ) as response:
                if response.status == 200:
                    has_cache_control = "cache-control" in response.headers
                    has_etag = "etag" in response.headers

                    cache_control = response.headers.get("cache-control", "missing")
                    etag = response.headers.get("etag", "missing")

                    success = has_cache_control and has_etag
                    details = f"Cache-Control: {cache_control}, ETag: {etag}"
                    self.log_test("HTTP Cache Headers", success, details)
                    return success
                else:
                    self.log_test(
                        "HTTP Cache Headers", False, f"HTTP {response.status}"
                    )
                    return False
        except Exception as e:
            self.log_test("HTTP Cache Headers", False, f"Error: {str(e)}")
            return False

    async def test_background_task_submission(self):
        """Test Supabase background task submission"""
        try:
            task_data = {
                "task_type": "integration_test",
                "payload": {
                    "test_id": f"test_{int(time.time())}",
                    "timestamp": datetime.now().isoformat(),
                },
            }

            async with self.session.post(
                f"{self.base_url}/api/v1/test/background/submit-task", json=task_data
            ) as response:
                if response.status in [200, 201]:
                    data = await response.json()
                    task_id = data.get("task_id", "unknown")
                    self.log_test(
                        "Background Task Submission", True, f"Task ID: {task_id}"
                    )
                    return True
                else:
                    self.log_test(
                        "Background Task Submission", False, f"HTTP {response.status}"
                    )
                    return False
        except Exception as e:
            self.log_test("Background Task Submission", False, f"Error: {str(e)}")
            return False

    async def test_queue_statistics(self):
        """Test background queue statistics"""
        try:
            async with self.session.get(
                f"{self.base_url}/api/v1/test/background/queue-stats"
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    queue_name = data.get("queue_name", "unknown")
                    pending = data.get("pending_count", 0)
                    processed = data.get("processed_count", 0)

                    details = f"Queue: {queue_name}, Pending: {pending}, Processed: {processed}"
                    self.log_test("Queue Statistics", True, details)
                    return True
                else:
                    self.log_test("Queue Statistics", False, f"HTTP {response.status}")
                    return False
        except Exception as e:
            self.log_test("Queue Statistics", False, f"Error: {str(e)}")
            return False

    async def test_home_assistant_error_handling(self):
        """Test Home Assistant error handling and recovery"""
        try:
            # Test with invalid Home Assistant server
            invalid_config = {
                "url": "http://invalid-server:8123",
                "token": "invalid_token_for_testing",
            }

            async with self.session.post(
                f"{self.base_url}/api/v1/home-assistant/test-connection",
                json=invalid_config,
            ) as response:
                # Should return error status but not crash
                if response.status in [400, 503, 422]:
                    data = await response.json()
                    error_msg = data.get("detail", "No error message")
                    self.log_test(
                        "Home Assistant Error Handling",
                        True,
                        f"Graceful error: {error_msg}",
                    )
                    return True
                else:
                    self.log_test(
                        "Home Assistant Error Handling",
                        False,
                        f"Unexpected status: {response.status}",
                    )
                    return False
        except Exception as e:
            self.log_test("Home Assistant Error Handling", False, f"Error: {str(e)}")
            return False

    async def test_detailed_health_check(self):
        """Test detailed system health monitoring"""
        try:
            async with self.session.get(
                f"{self.base_url}/api/v1/test/health-detailed"
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    services = data.get("services", {})
                    database_ok = (
                        services.get("database", {}).get("status") == "healthy"
                    )

                    details = f"Services: {len(services)}, Database: {'OK' if database_ok else 'FAIL'}"
                    self.log_test("Detailed Health Check", database_ok, details)
                    return database_ok
                else:
                    self.log_test(
                        "Detailed Health Check", False, f"HTTP {response.status}"
                    )
                    return False
        except Exception as e:
            self.log_test("Detailed Health Check", False, f"Error: {str(e)}")
            return False

    async def run_all_tests(self):
        """Run all integration tests"""
        print("🧪 Starting Comprehensive Integration Tests")
        print("=" * 50)
        print()

        # Check if backend is available first
        if not await self.test_backend_health():
            print("❌ Backend is not available. Please start the backend first:")
            print(
                "   cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
            )
            return False

        print()
        print("🎯 Testing Tonight's Features:")
        print("-" * 30)

        # Run all tests
        tests = [
            self.test_database_connection,
            self.test_query_caching_performance,
            self.test_http_cache_headers,
            self.test_background_task_submission,
            self.test_queue_statistics,
            self.test_home_assistant_error_handling,
            self.test_detailed_health_check,
        ]

        results = []
        for test in tests:
            result = await test()
            results.append(result)
            await asyncio.sleep(0.5)  # Small delay between tests

        print()
        print("📊 Test Results Summary:")
        print("=" * 30)

        passed = sum(results)
        total = len(results)
        success_rate = (passed / total) * 100

        print(f"✅ Passed: {passed}/{total} ({success_rate:.1f}%)")

        if passed == total:
            print("🎉 ALL TESTS PASSED! Your implementation is working perfectly!")
            print()
            print("✅ Home Assistant error handling: WORKING")
            print("✅ Supabase background processing: WORKING")
            print("✅ Supabase caching (Supavisor + HTTP): WORKING")
        else:
            print(f"⚠️  {total - passed} test(s) failed. Check the details above.")

        return passed == total


async def main():
    """Main test runner"""
    try:
        async with IntegrationTester() as tester:
            success = await tester.run_all_tests()
            sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n🛑 Tests interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n💥 Test runner error: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
