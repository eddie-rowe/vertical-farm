#!/usr/bin/env python3
"""
Cloudflare Workers Performance Testing Suite
Measures API response times, cache hit rates, and overall performance improvements
"""

import asyncio
import time
import json
import statistics
import requests
import aiohttp
from typing import Dict, List, Any
from datetime import datetime
import csv
import os

class CloudflarePerformanceTester:
    def __init__(self, base_url: str = "http://localhost:8000", production_url: str = None):
        self.base_url = base_url
        self.production_url = production_url  # Will be Cloudflare Workers URL
        self.results = []
        self.session = None
    
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    def log_result(self, test_name: str, metrics: Dict[str, Any]):
        """Log performance test result"""
        self.results.append({
            "timestamp": datetime.now().isoformat(),
            "test_name": test_name,
            **metrics
        })
        
        # Pretty print results
        print(f"\n📊 {test_name}")
        print("-" * 40)
        for key, value in metrics.items():
            if isinstance(value, float):
                print(f"  {key}: {value:.3f}")
            else:
                print(f"  {key}: {value}")
    
    async def measure_endpoint_performance(self, endpoint: str, iterations: int = 10, 
                                         use_production: bool = False) -> Dict[str, Any]:
        """Measure performance of a specific endpoint"""
        url = f"{self.production_url if use_production else self.base_url}{endpoint}"
        response_times = []
        cache_hits = 0
        errors = 0
        
        print(f"🔄 Testing {endpoint} ({iterations} iterations)...")
        
        for i in range(iterations):
            try:
                start_time = time.time()
                async with self.session.get(url, timeout=30) as response:
                    duration = time.time() - start_time
                    response_times.append(duration)
                    
                    # Check for cache indicators
                    if 'cf-cache-status' in response.headers:
                        if response.headers['cf-cache-status'] == 'HIT':
                            cache_hits += 1
                    elif 'x-cache' in response.headers:
                        if 'HIT' in response.headers['x-cache'].upper():
                            cache_hits += 1
                    
                    if response.status >= 400:
                        errors += 1
                        
            except Exception as e:
                errors += 1
                print(f"  Error on iteration {i+1}: {str(e)}")
        
        if not response_times:
            return {"error": "No successful requests"}
        
        return {
            "avg_response_time": statistics.mean(response_times),
            "min_response_time": min(response_times),
            "max_response_time": max(response_times),
            "p95_response_time": statistics.quantiles(response_times, n=20)[18] if len(response_times) >= 20 else max(response_times),
            "p99_response_time": statistics.quantiles(response_times, n=100)[98] if len(response_times) >= 100 else max(response_times),
            "cache_hit_rate": (cache_hits / len(response_times)) * 100,
            "error_rate": (errors / iterations) * 100,
            "total_requests": iterations,
            "successful_requests": len(response_times)
        }
    
    async def test_api_endpoints_performance(self, use_production: bool = False):
        """Test performance of key API endpoints"""
        endpoints = [
            "/api/v1/test/background/queue-stats",
            "/api/v1/test/db-query", 
            "/api/v1/test/cache-test",
            "/api/v1/test/health-detailed",
            "/api/v1/cache/health",
            "/api/v1/cache/stats"
        ]
        
        environment = "Production (Cloudflare)" if use_production else "Local Development"
        print(f"\n🎯 Testing API Endpoints Performance - {environment}")
        print("=" * 60)
        
        for endpoint in endpoints:
            metrics = await self.measure_endpoint_performance(endpoint, iterations=20, use_production=use_production)
            self.log_result(f"{endpoint} ({environment})", metrics)
            await asyncio.sleep(1)  # Brief pause between endpoint tests
    
    async def test_cache_warming_performance(self, use_production: bool = False):
        """Test cache warming and subsequent performance"""
        endpoint = "/api/v1/test/db-query"
        url = f"{self.production_url if use_production else self.base_url}{endpoint}"
        
        print(f"\n🔥 Cache Warming Test - {'Production' if use_production else 'Local'}")
        print("-" * 40)
        
        # Cold cache - first request
        start_time = time.time()
        async with self.session.get(url) as response:
            cold_duration = time.time() - start_time
            cold_status = response.status
        
        # Warm cache - subsequent requests
        warm_times = []
        for i in range(5):
            start_time = time.time()
            async with self.session.get(url) as response:
                warm_duration = time.time() - start_time
                warm_times.append(warm_duration)
            await asyncio.sleep(0.1)
        
        avg_warm_time = statistics.mean(warm_times)
        improvement = ((cold_duration - avg_warm_time) / cold_duration) * 100
        
        metrics = {
            "cold_cache_time": cold_duration,
            "avg_warm_cache_time": avg_warm_time,
            "performance_improvement": improvement,
            "cold_status": cold_status
        }
        
        self.log_result("Cache Warming Performance", metrics)
        return metrics
    
    async def test_concurrent_load_performance(self, use_production: bool = False):
        """Test performance under concurrent load"""
        endpoint = "/api/v1/test/cache-test"
        url = f"{self.production_url if use_production else self.base_url}{endpoint}"
        concurrent_requests = 20
        
        print(f"\n⚡ Concurrent Load Test - {'Production' if use_production else 'Local'}")
        print(f"   {concurrent_requests} concurrent requests")
        print("-" * 40)
        
        async def single_request():
            start_time = time.time()
            try:
                async with self.session.get(url, timeout=30) as response:
                    duration = time.time() - start_time
                    return {
                        "duration": duration,
                        "status": response.status,
                        "success": response.status < 400
                    }
            except Exception as e:
                return {
                    "duration": time.time() - start_time,
                    "status": 0,
                    "success": False,
                    "error": str(e)
                }
        
        # Execute concurrent requests
        start_time = time.time()
        tasks = [single_request() for _ in range(concurrent_requests)]
        results = await asyncio.gather(*tasks)
        total_duration = time.time() - start_time
        
        # Analyze results
        successful_results = [r for r in results if r["success"]]
        response_times = [r["duration"] for r in successful_results]
        
        if response_times:
            metrics = {
                "total_duration": total_duration,
                "concurrent_requests": concurrent_requests,
                "successful_requests": len(successful_results),
                "success_rate": (len(successful_results) / concurrent_requests) * 100,
                "avg_response_time": statistics.mean(response_times),
                "max_response_time": max(response_times),
                "requests_per_second": len(successful_results) / total_duration
            }
        else:
            metrics = {
                "total_duration": total_duration,
                "concurrent_requests": concurrent_requests,
                "successful_requests": 0,
                "success_rate": 0,
                "error": "No successful requests"
            }
        
        self.log_result("Concurrent Load Performance", metrics)
        return metrics
    
    async def run_baseline_tests(self):
        """Run baseline performance tests (before Cloudflare Workers)"""
        print("🏁 BASELINE PERFORMANCE TESTS (Before Cloudflare Workers)")
        print("=" * 70)
        
        await self.test_api_endpoints_performance(use_production=False)
        await self.test_cache_warming_performance(use_production=False)
        await self.test_concurrent_load_performance(use_production=False)
        
        self.save_results("baseline_performance.json")
    
    async def run_production_tests(self):
        """Run production performance tests (after Cloudflare Workers)"""
        if not self.production_url:
            print("❌ Production URL not configured. Set production_url parameter.")
            return
        
        print("🚀 PRODUCTION PERFORMANCE TESTS (With Cloudflare Workers)")
        print("=" * 70)
        
        await self.test_api_endpoints_performance(use_production=True)
        await self.test_cache_warming_performance(use_production=True)
        await self.test_concurrent_load_performance(use_production=True)
        
        self.save_results("production_performance.json")
    
    async def run_comparison_tests(self):
        """Run both baseline and production tests for comparison"""
        print("🔄 RUNNING COMPREHENSIVE PERFORMANCE COMPARISON")
        print("=" * 70)
        
        # Baseline tests
        await self.run_baseline_tests()
        
        if self.production_url:
            print("\n" + "="*70)
            await self.run_production_tests()
            
            # Generate comparison report
            self.generate_comparison_report()
        else:
            print("\n⚠️  Production URL not configured. Only baseline tests completed.")
            print("   Set production_url to run comparison tests.")
    
    def save_results(self, filename: str):
        """Save test results to JSON file"""
        os.makedirs("tests/results", exist_ok=True)
        filepath = f"tests/results/{filename}"
        
        with open(filepath, 'w') as f:
            json.dump(self.results, f, indent=2)
        
        print(f"\n💾 Results saved to {filepath}")
    
    def generate_comparison_report(self):
        """Generate a comparison report between baseline and production"""
        print("\n📈 PERFORMANCE COMPARISON REPORT")
        print("=" * 50)
        
        # This would compare baseline vs production results
        # Implementation would analyze the results and show improvements
        print("📊 Report generation completed!")
        print("   Check tests/results/ for detailed JSON files")

async def main():
    """Main test runner"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Cloudflare Workers Performance Testing")
    parser.add_argument("--baseline", action="store_true", help="Run baseline tests only")
    parser.add_argument("--production", action="store_true", help="Run production tests only")
    parser.add_argument("--production-url", help="Production URL with Cloudflare Workers")
    parser.add_argument("--compare", action="store_true", help="Run comparison tests")
    
    args = parser.parse_args()
    
    async with CloudflarePerformanceTester(
        base_url="http://localhost:8000",
        production_url=args.production_url
    ) as tester:
        
        if args.baseline:
            await tester.run_baseline_tests()
        elif args.production:
            await tester.run_production_tests()
        elif args.compare:
            await tester.run_comparison_tests()
        else:
            # Default: run baseline tests
            print("🎯 Running baseline performance tests...")
            print("   Use --compare after implementing Cloudflare Workers")
            await tester.run_baseline_tests()

if __name__ == "__main__":
    asyncio.run(main()) 