#!/usr/bin/env python3
"""
Production Background Queue Testing
Tests real task processing, queue performance, and error handling
"""

import asyncio
import aiohttp
import time
import json
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any
import statistics

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class BackgroundQueueTester:
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.session = None
        self.metrics = {
            "tasks_submitted": 0,
            "tasks_completed": 0,
            "tasks_failed": 0,
            "processing_times": [],
            "queue_depths": [],
            "errors": []
        }
    
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def submit_task(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Submit a task to the background queue"""
        try:
            async with self.session.post(
                f"{self.base_url}/api/v1/test/background/submit",
                json=task_data
            ) as response:
                if response.status == 200:
                    self.metrics["tasks_submitted"] += 1
                    return await response.json()
                else:
                    error = f"Failed to submit task: {response.status}"
                    self.metrics["errors"].append(error)
                    logger.error(error)
                    return {"error": error}
        except Exception as e:
            error = f"Exception submitting task: {str(e)}"
            self.metrics["errors"].append(error)
            logger.error(error)
            return {"error": error}
    
    async def get_queue_stats(self) -> Dict[str, Any]:
        """Get current queue statistics"""
        try:
            async with self.session.get(
                f"{self.base_url}/api/v1/test/background/queue-stats"
            ) as response:
                if response.status == 200:
                    stats = await response.json()
                    if "queue_depth" in stats:
                        self.metrics["queue_depths"].append(stats["queue_depth"])
                    return stats
                else:
                    return {"error": f"Failed to get stats: {response.status}"}
        except Exception as e:
            error = f"Exception getting queue stats: {str(e)}"
            logger.error(error)
            return {"error": error}
    
    async def test_real_tasks(self, num_tasks: int = 100):
        """Test with realistic production tasks"""
        logger.info(f"🚀 Starting real task test with {num_tasks} tasks")
        
        # Define realistic task types
        task_types = [
            {
                "type": "send_notification",
                "payload": {
                    "user_id": 123,
                    "message": "Sensor reading alert",
                    "priority": "high"
                }
            },
            {
                "type": "process_sensor_data",
                "payload": {
                    "sensor_id": "temp_001",
                    "readings": [22.5, 23.1, 22.8],
                    "timestamp": datetime.now().isoformat()
                }
            },
            {
                "type": "generate_report",
                "payload": {
                    "farm_id": 456,
                    "report_type": "daily_summary",
                    "date": datetime.now().date().isoformat()
                }
            },
            {
                "type": "backup_data",
                "payload": {
                    "table": "sensor_readings",
                    "date_range": "last_24h"
                }
            }
        ]
        
        start_time = time.time()
        
        # Submit tasks in batches to simulate realistic load
        batch_size = 10
        for i in range(0, num_tasks, batch_size):
            batch_tasks = []
            for j in range(min(batch_size, num_tasks - i)):
                task = task_types[j % len(task_types)].copy()
                task["payload"]["batch_id"] = i // batch_size
                task["payload"]["task_index"] = j
                batch_tasks.append(self.submit_task(task))
            
            # Submit batch concurrently
            await asyncio.gather(*batch_tasks)
            
            # Monitor queue depth
            stats = await self.get_queue_stats()
            if "queue_depth" in stats:
                logger.info(f"📊 Batch {i//batch_size + 1}: Queue depth = {stats['queue_depth']}")
            
            # Small delay between batches
            await asyncio.sleep(0.5)
        
        end_time = time.time()
        submission_time = end_time - start_time
        
        logger.info(f"✅ Submitted {num_tasks} tasks in {submission_time:.2f}s")
        logger.info(f"📈 Submission rate: {num_tasks/submission_time:.2f} tasks/second")
    
    async def test_queue_performance(self, duration_minutes: int = 5):
        """Monitor queue performance over time"""
        logger.info(f"📊 Monitoring queue performance for {duration_minutes} minutes")
        
        end_time = time.time() + (duration_minutes * 60)
        sample_interval = 10  # seconds
        
        while time.time() < end_time:
            stats = await self.get_queue_stats()
            
            if "error" not in stats:
                logger.info(f"📈 Queue Stats: {json.dumps(stats, indent=2)}")
                
                # Track processing metrics
                if "processed_count" in stats:
                    self.metrics["tasks_completed"] = stats["processed_count"]
                if "failed_count" in stats:
                    self.metrics["tasks_failed"] = stats["failed_count"]
            
            await asyncio.sleep(sample_interval)
    
    async def test_failure_scenarios(self):
        """Test how the system handles task failures"""
        logger.info("🧪 Testing failure scenarios")
        
        failure_tasks = [
            {
                "type": "intentional_failure",
                "payload": {"should_fail": True, "error_type": "timeout"}
            },
            {
                "type": "invalid_task",
                "payload": {"malformed": "data", "missing": "required_fields"}
            },
            {
                "type": "resource_intensive",
                "payload": {"simulate_heavy_load": True, "duration": 30}
            }
        ]
        
        for task in failure_tasks:
            result = await self.submit_task(task)
            logger.info(f"🔍 Failure test result: {result}")
            await asyncio.sleep(2)
    
    async def test_load_burst(self, burst_size: int = 500):
        """Test system behavior under sudden load burst"""
        logger.info(f"💥 Testing load burst with {burst_size} tasks")
        
        start_time = time.time()
        
        # Submit all tasks simultaneously
        tasks = []
        for i in range(burst_size):
            task_data = {
                "type": "burst_test",
                "payload": {
                    "task_id": i,
                    "timestamp": datetime.now().isoformat(),
                    "burst_size": burst_size
                }
            }
            tasks.append(self.submit_task(task_data))
        
        # Wait for all submissions to complete
        await asyncio.gather(*tasks)
        
        end_time = time.time()
        burst_time = end_time - start_time
        
        logger.info(f"⚡ Burst completed in {burst_time:.2f}s")
        logger.info(f"📊 Burst rate: {burst_size/burst_time:.2f} tasks/second")
        
        # Monitor queue recovery
        for i in range(10):
            stats = await self.get_queue_stats()
            if "queue_depth" in stats:
                logger.info(f"📉 Recovery check {i+1}: Queue depth = {stats['queue_depth']}")
            await asyncio.sleep(5)
    
    def generate_report(self) -> str:
        """Generate a comprehensive test report"""
        report = f"""
🎯 Background Queue Production Test Report
==========================================
📅 Test Date: {datetime.now().isoformat()}
⏱️  Test Duration: Multiple phases

📊 Task Metrics:
- Tasks Submitted: {self.metrics['tasks_submitted']}
- Tasks Completed: {self.metrics['tasks_completed']}
- Tasks Failed: {self.metrics['tasks_failed']}
- Success Rate: {(self.metrics['tasks_completed'] / max(self.metrics['tasks_submitted'], 1)) * 100:.1f}%

📈 Queue Performance:
- Max Queue Depth: {max(self.metrics['queue_depths']) if self.metrics['queue_depths'] else 'N/A'}
- Avg Queue Depth: {statistics.mean(self.metrics['queue_depths']):.1f if self.metrics['queue_depths'] else 'N/A'}
- Queue Samples: {len(self.metrics['queue_depths'])}

❌ Errors Encountered: {len(self.metrics['errors'])}
"""
        
        if self.metrics['errors']:
            report += "\n🚨 Error Details:\n"
            for i, error in enumerate(self.metrics['errors'][:5], 1):
                report += f"  {i}. {error}\n"
            if len(self.metrics['errors']) > 5:
                report += f"  ... and {len(self.metrics['errors']) - 5} more errors\n"
        
        # Performance thresholds
        report += "\n🎯 Performance Assessment:\n"
        success_rate = (self.metrics['tasks_completed'] / max(self.metrics['tasks_submitted'], 1)) * 100
        
        if success_rate >= 99:
            report += "✅ SUCCESS: Task success rate meets production standards (≥99%)\n"
        elif success_rate >= 95:
            report += "⚠️  WARNING: Task success rate below optimal (95-99%)\n"
        else:
            report += "❌ CRITICAL: Task success rate below acceptable threshold (<95%)\n"
        
        max_queue_depth = max(self.metrics['queue_depths']) if self.metrics['queue_depths'] else 0
        if max_queue_depth < 100:
            report += "✅ SUCCESS: Queue depth remained manageable (<100)\n"
        elif max_queue_depth < 500:
            report += "⚠️  WARNING: Queue depth reached concerning levels (100-500)\n"
        else:
            report += "❌ CRITICAL: Queue depth exceeded safe limits (>500)\n"
        
        return report

async def main():
    """Run comprehensive background queue production tests"""
    async with BackgroundQueueTester() as tester:
        try:
            # Test 1: Real task processing
            await tester.test_real_tasks(num_tasks=50)
            
            # Test 2: Monitor performance
            await tester.test_queue_performance(duration_minutes=2)
            
            # Test 3: Failure scenarios
            await tester.test_failure_scenarios()
            
            # Test 4: Load burst
            await tester.test_load_burst(burst_size=100)
            
            # Generate and display report
            report = tester.generate_report()
            print(report)
            
            # Save report to file
            with open(f"background-queue-test-{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt", "w") as f:
                f.write(report)
            
        except Exception as e:
            logger.error(f"Test failed with exception: {str(e)}")
            raise

if __name__ == "__main__":
    asyncio.run(main()) 