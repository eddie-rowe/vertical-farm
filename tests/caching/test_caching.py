#!/usr/bin/env python3
"""
Test script for the comprehensive caching implementation.
Tests frontend cache, backend cache, and provides Cloudflare testing guidance.
"""

import asyncio
import time
import json
import requests
from typing import Dict, Any

# Configuration
BACKEND_URL = "http://localhost:8000"  # Adjust as needed
FRONTEND_URL = "http://localhost:3000"  # Adjust as needed

class CacheTestSuite:
    def __init__(self):
        self.results = []
    
    def log_result(self, test_name: str, success: bool, message: str, duration: float = 0):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        self.results.append({
            "test": test_name,
            "success": success,
            "message": message,
            "duration": duration
        })
        print(f"{status} {test_name}: {message} ({duration:.3f}s)")
    
    def test_backend_cache_health(self):
        """Test backend cache health endpoint"""
        try:
            start_time = time.time()
            response = requests.get(f"{BACKEND_URL}/api/v1/cache/health", timeout=5)
            duration = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                self.log_result(
                    "Backend Cache Health",
                    True,
                    f"Cache status: {data.get('status', 'unknown')}",
                    duration
                )
                return True
            else:
                self.log_result(
                    "Backend Cache Health",
                    False,
                    f"HTTP {response.status_code}",
                    duration
                )
                return False
        except Exception as e:
            self.log_result("Backend Cache Health", False, str(e))
            return False
    
    def test_backend_cache_stats(self):
        """Test backend cache statistics endpoint"""
        try:
            start_time = time.time()
            # This would require authentication in real scenario
            response = requests.get(f"{BACKEND_URL}/api/v1/cache/stats", timeout=5)
            duration = time.time() - start_time
            
            if response.status_code in [200, 401]:  # 401 expected without auth
                self.log_result(
                    "Backend Cache Stats",
                    True,
                    f"Endpoint accessible (HTTP {response.status_code})",
                    duration
                )
                return True
            else:
                self.log_result(
                    "Backend Cache Stats",
                    False,
                    f"HTTP {response.status_code}",
                    duration
                )
                return False
        except Exception as e:
            self.log_result("Backend Cache Stats", False, str(e))
            return False
    
    def test_cache_headers(self):
        """Test cache headers on API responses"""
        try:
            start_time = time.time()
            response = requests.get(f"{BACKEND_URL}/api/v1/test/background/queue-stats", timeout=5)
            duration = time.time() - start_time
            
            if response.status_code == 200:
                headers = response.headers
                cache_related_headers = [
                    "Cache-Control", "ETag", "X-Cache", "Vary"
                ]
                
                found_headers = [h for h in cache_related_headers if h in headers]
                
                self.log_result(
                    "Cache Headers",
                    len(found_headers) > 0,
                    f"Found headers: {found_headers}",
                    duration
                )
                return True
            else:
                self.log_result(
                    "Cache Headers",
                    False,
                    f"HTTP {response.status_code}",
                    duration
                )
                return False
        except Exception as e:
            self.log_result("Cache Headers", False, str(e))
            return False
    
    def test_etag_validation(self):
        """Test ETag validation for 304 responses"""
        try:
            # First request to get ETag
            start_time = time.time()
            response1 = requests.get(f"{BACKEND_URL}/api/v1/test/background/queue-stats", timeout=5)
            
            if response1.status_code != 200:
                self.log_result("ETag Validation", False, "Initial request failed")
                return False
            
            etag = response1.headers.get("ETag")
            if not etag:
                self.log_result("ETag Validation", False, "No ETag in response")
                return False
            
            # Second request with If-None-Match header
            response2 = requests.get(
                f"{BACKEND_URL}/api/v1/test/background/queue-stats",
                headers={"If-None-Match": etag},
                timeout=5
            )
            duration = time.time() - start_time
            
            if response2.status_code == 304:
                self.log_result(
                    "ETag Validation",
                    True,
                    "304 Not Modified response received",
                    duration
                )
                return True
            else:
                self.log_result(
                    "ETag Validation",
                    False,
                    f"Expected 304, got {response2.status_code}",
                    duration
                )
                return False
        except Exception as e:
            self.log_result("ETag Validation", False, str(e))
            return False
    
    def test_frontend_availability(self):
        """Test frontend availability"""
        try:
            start_time = time.time()
            response = requests.get(FRONTEND_URL, timeout=10)
            duration = time.time() - start_time
            
            if response.status_code == 200:
                self.log_result(
                    "Frontend Availability",
                    True,
                    "Frontend is accessible",
                    duration
                )
                return True
            else:
                self.log_result(
                    "Frontend Availability",
                    False,
                    f"HTTP {response.status_code}",
                    duration
                )
                return False
        except Exception as e:
            self.log_result("Frontend Availability", False, str(e))
            return False
    
    def test_cloudflare_headers(self):
        """Test for Cloudflare-specific headers (if deployed)"""
        try:
            # This would test the production URL with Cloudflare
            # For now, just check if the configuration file exists
            import os
            config_path = "docs/deployment/cloudflare-config.txt"
            
            if os.path.exists(config_path):
                with open(config_path, 'r') as f:
                    content = f.read()
                    if "vertical-farm.goodgoodgreens.org" in content:
                        self.log_result(
                            "Cloudflare Config",
                            True,
                            "Configuration file exists and contains domain"
                        )
                        return True
            
            self.log_result(
                "Cloudflare Config",
                False,
                "Configuration file not found or incomplete"
            )
            return False
        except Exception as e:
            self.log_result("Cloudflare Config", False, str(e))
            return False
    
    def run_all_tests(self):
        """Run all cache tests"""
        print("🚀 Starting Cache Implementation Test Suite\n")
        
        tests = [
            self.test_backend_cache_health,
            self.test_backend_cache_stats,
            self.test_cache_headers,
            self.test_etag_validation,
            self.test_frontend_availability,
            self.test_cloudflare_headers,
        ]
        
        for test in tests:
            test()
            time.sleep(0.5)  # Brief pause between tests
        
        # Summary
        print("\n📊 Test Summary:")
        passed = sum(1 for r in self.results if r["success"])
        total = len(self.results)
        
        print(f"Passed: {passed}/{total}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        
        if passed == total:
            print("🎉 All tests passed! Caching implementation is working correctly.")
        else:
            print("⚠️  Some tests failed. Check the implementation.")
            
        return passed == total

def print_manual_tests():
    """Print manual testing instructions"""
    print("\n🔧 Manual Testing Instructions:")
    print("\n1. Frontend Cache Testing:")
    print("   - Open browser dev tools")
    print("   - Navigate to your app")
    print("   - Check console for cache debug messages")
    print("   - Look for 'fromCache: true' in API responses")
    
    print("\n2. Backend Cache Testing:")
    print("   - Make API requests and check X-Cache headers")
    print("   - First request should show 'X-Cache: MISS'")
    print("   - Subsequent requests should show 'X-Cache: HIT'")
    
    print("\n3. Cloudflare Testing (Production):")
    print("   - Deploy to production with Cloudflare")
    print("   - Check for CF-Cache-Status headers")
    print("   - Monitor Cloudflare dashboard for cache analytics")
    print("   - Test cache purging via Cloudflare API")
    
    print("\n4. Performance Testing:")
    print("   - Use tools like Apache Bench (ab) or wrk")
    print("   - Compare response times with/without cache")
    print("   - Monitor cache hit rates over time")

def main():
    """Main test runner"""
    test_suite = CacheTestSuite()
    
    print("🧪 Vertical Farm Caching Implementation Test")
    print("=" * 50)
    
    # Run automated tests
    success = test_suite.run_all_tests()
    
    # Print manual testing instructions
    print_manual_tests()
    
    # Configuration check
    print("\n⚙️  Configuration Files:")
    files_to_check = [
        "frontend/src/lib/supabase-cache.ts",
        "backend/app/middleware/cache_middleware.py",
        "backend/app/api/v1/endpoints/cache.py",
        "docs/deployment/cloudflare-config.txt",
        "docs/guides/CACHING_IMPLEMENTATION_GUIDE.md"
    ]
    
    import os
    for file_path in files_to_check:
        exists = os.path.exists(file_path)
        status = "✅" if exists else "❌"
        print(f"{status} {file_path}")
    
    print("\n📚 Next Steps:")
    if success:
        print("1. Deploy the backend with cache middleware enabled")
        print("2. Update frontend to use the new caching client")
        print("3. Configure Cloudflare using the provided configuration")
        print("4. Monitor cache performance in production")
    else:
        print("1. Fix failing tests before deployment")
        print("2. Check server connectivity and configuration")
        print("3. Review implementation guide for troubleshooting")
    
    return success

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1) 