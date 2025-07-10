#!/usr/bin/env python3
"""
Debug script to test Home Assistant device import and retrieval
"""

import os
import sys
import asyncio
import httpx
from datetime import datetime

# Add the backend directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from app.db.supabase_client import get_async_supabase_client

async def test_ha_devices():
    """Test Home Assistant device import and retrieval"""
    print("🔍 Starting Home Assistant device debugging...")
    
    # Get Supabase client
    supabase = await get_async_supabase_client()
    if not supabase:
        print("❌ Failed to connect to Supabase")
        return
    
    # Test user ID (you'll need to replace this with a real user ID from your auth.users table)
    test_user_id = "test-user-id"
    
    print(f"\n1. 📊 Checking existing devices for user: {test_user_id}")
    
    try:
        # Query existing devices
        existing_result = await supabase.table("home_assistant_devices").select("*").eq("user_id", test_user_id).execute()
        print(f"   Existing devices count: {len(existing_result.data)}")
        
        if existing_result.data:
            print("   Existing devices:")
            for i, device in enumerate(existing_result.data[:3]):  # Show first 3
                print(f"     {i+1}. {device['entity_id']} - {device['name']} ({device['device_type']})")
            if len(existing_result.data) > 3:
                print(f"     ... and {len(existing_result.data) - 3} more")
        else:
            print("   No existing devices found")
            
    except Exception as e:
        print(f"   ❌ Error querying existing devices: {e}")
    
    print(f"\n2. 🧪 Creating test device for user: {test_user_id}")
    
    # Create a test device
    test_device = {
        "user_id": test_user_id,
        "entity_id": "light.debug_test_light",
        "name": "Debug Test Light",
        "device_type": "light",
        "state": "off",
        "attributes": {"brightness": 100, "color_mode": "xy"},
        "is_assigned": False,
        "last_seen": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    }
    
    try:
        # Insert test device
        insert_result = await supabase.table("home_assistant_devices").upsert(
            test_device,
            on_conflict="user_id,entity_id"
        ).execute()
        
        if insert_result.data:
            print(f"   ✅ Test device created/updated: {insert_result.data[0]['id']}")
        else:
            print("   ❌ Failed to create test device")
            
    except Exception as e:
        print(f"   ❌ Error creating test device: {e}")
    
    print(f"\n3. 🔄 Re-querying devices after test insert")
    
    try:
        # Query devices again
        final_result = await supabase.table("home_assistant_devices").select("*").eq("user_id", test_user_id).execute()
        print(f"   Final devices count: {len(final_result.data)}")
        
        if final_result.data:
            print("   All devices:")
            for i, device in enumerate(final_result.data):
                print(f"     {i+1}. {device['entity_id']} - {device['name']} ({device['device_type']}) - Created: {device.get('created_at', 'N/A')}")
        else:
            print("   Still no devices found")
            
    except Exception as e:
        print(f"   ❌ Error in final query: {e}")
    
    print(f"\n4. 🔍 Testing API endpoint directly")
    
    # Test the API endpoint directly
    api_base_url = os.getenv("API_URL", "http://localhost:8000")
    
    try:
        async with httpx.AsyncClient() as client:
            # This would need proper authentication headers in a real test
            headers = {
                "Content-Type": "application/json",
                # "Authorization": "Bearer <your-supabase-jwt-token>"
            }
            
            response = await client.get(
                f"{api_base_url}/api/v1/home-assistant/devices/imported",
                headers=headers,
                timeout=30.0
            )
            
            print(f"   API Response Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"   API Response: {data}")
            else:
                print(f"   API Error: {response.text}")
                
    except Exception as e:
        print(f"   ❌ Error testing API endpoint: {e}")
    
    print(f"\n5. 🧹 Cleaning up test device")
    
    try:
        # Clean up test device
        cleanup_result = await supabase.table("home_assistant_devices").delete().eq("user_id", test_user_id).eq("entity_id", "light.debug_test_light").execute()
        if cleanup_result.data:
            print(f"   ✅ Test device cleaned up")
        else:
            print(f"   ⚠️ Test device not found for cleanup")
            
    except Exception as e:
        print(f"   ❌ Error cleaning up: {e}")
    
    print("\n✅ Debugging complete!")

if __name__ == "__main__":
    asyncio.run(test_ha_devices()) 