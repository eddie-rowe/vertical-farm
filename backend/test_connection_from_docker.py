#!/usr/bin/env python3
"""
Test Home Assistant connectivity from within Docker container
"""
import asyncio
import aiohttp
import os
import json

async def test_connection():
    """Test connection to Home Assistant from Docker container"""
    
    # Get environment variables
    ha_url = os.getenv("HOME_ASSISTANT_URL")
    ha_token = os.getenv("HOME_ASSISTANT_TOKEN")
    cf_client_id = os.getenv("CLOUDFLARE_SERVICE_CLIENT_ID")
    cf_client_secret = os.getenv("CLOUDFLARE_SERVICE_CLIENT_SECRET")
    cf_protected = os.getenv("CLOUDFLARE_ACCESS_PROTECTED", "false").lower() == "true"
    
    print(f"🔗 Testing connection to: {ha_url}")
    print(f"🔐 Cloudflare Access Protection: {cf_protected}")
    
    if not ha_url or not ha_token:
        print("❌ Missing Home Assistant URL or token")
        return
    
    # Prepare headers
    headers = {
        "Authorization": f"Bearer {ha_token}",
        "Content-Type": "application/json"
    }
    
    # Add Cloudflare headers if configured
    if cf_protected and cf_client_id and cf_client_secret:
        headers.update({
            "CF-Access-Client-Id": cf_client_id,
            "CF-Access-Client-Secret": cf_client_secret
        })
        print("🔒 Added Cloudflare service token headers")
    
    try:
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=30)) as session:
            # Test basic connectivity
            print("\n📡 Testing basic connectivity...")
            test_url = f"{ha_url}/api/"
            async with session.get(test_url, headers=headers) as response:
                print(f"   Status: {response.status}")
                if response.status == 200:
                    data = await response.json()
                    print(f"   ✅ Connected to Home Assistant: {data.get('message', 'OK')}")
                else:
                    text = await response.text()
                    print(f"   ❌ Failed: {text[:200]}...")
                    
            # Test states endpoint
            print("\n🏠 Testing states endpoint...")
            states_url = f"{ha_url}/api/states"
            async with session.get(states_url, headers=headers) as response:
                print(f"   Status: {response.status}")
                if response.status == 200:
                    states = await response.json()
                    print(f"   ✅ Found {len(states)} entities")
                    
                    # Count device types
                    lights = [s for s in states if s['entity_id'].startswith('light.')]
                    switches = [s for s in states if s['entity_id'].startswith('switch.')]
                    sensors = [s for s in states if s['entity_id'].startswith('sensor.')]
                    
                    print(f"   💡 Lights: {len(lights)}")
                    print(f"   🔌 Switches: {len(switches)}")
                    print(f"   📊 Sensors: {len(sensors)}")
                else:
                    text = await response.text()
                    print(f"   ❌ Failed: {text[:200]}...")
                    
    except Exception as e:
        print(f"❌ Connection error: {e}")

if __name__ == "__main__":
    asyncio.run(test_connection()) 