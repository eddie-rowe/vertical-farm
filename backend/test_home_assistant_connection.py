#!/usr/bin/env python3
"""
Test script for Home Assistant connectivity.

This script tests the connection to your Home Assistant instance
and validates that the API is working correctly.

Usage:
    1. Copy home_assistant_config.env.example to .env
    2. Fill in your HOME_ASSISTANT_TOKEN
    3. Run: python test_home_assistant_connection.py
"""

import asyncio
import os
import sys
from pathlib import Path

# Add the app directory to the path so we can import our modules
sys.path.append(str(Path(__file__).parent / "app"))

from app.services.home_assistant_client import HomeAssistantClient
from app.core.config import get_settings


async def test_home_assistant_connection():
    """Test the Home Assistant connection and display basic information."""
    
    print("🏠 Home Assistant Connection Test")
    print("=" * 50)
    
    try:
        # Load settings
        settings = get_settings()
        
        # Check configuration
        if not settings.HOME_ASSISTANT_ENABLED:
            print("❌ HOME_ASSISTANT_ENABLED is False")
            print("   Set HOME_ASSISTANT_ENABLED=true in your .env file")
            return False
            
        if not settings.HOME_ASSISTANT_URL:
            print("❌ HOME_ASSISTANT_URL is not set")
            print("   Set HOME_ASSISTANT_URL in your .env file")
            return False
            
        if not settings.HOME_ASSISTANT_TOKEN:
            print("❌ HOME_ASSISTANT_TOKEN is not set")
            print("   Set HOME_ASSISTANT_TOKEN in your .env file")
            return False
        
        print(f"✅ Configuration loaded:")
        print(f"   URL: {settings.HOME_ASSISTANT_URL}")
        print(f"   HA Token: {'*' * 20}...{settings.HOME_ASSISTANT_TOKEN[-4:]}")
        
        # Check Cloudflare Access configuration
        if settings.CLOUDFLARE_ACCESS_PROTECTED:
            if settings.CLOUDFLARE_SERVICE_CLIENT_ID and settings.CLOUDFLARE_SERVICE_CLIENT_SECRET:
                print(f"   CF Client ID: {settings.CLOUDFLARE_SERVICE_CLIENT_ID[:8]}...")
                print(f"   CF Secret: {'*' * 20}...{settings.CLOUDFLARE_SERVICE_CLIENT_SECRET[-4:]}")
                print("   🔒 Cloudflare Access protection enabled")
            else:
                print("   ⚠️  Cloudflare Access enabled but tokens missing!")
        else:
            print("   🌐 Direct access (no Cloudflare protection)")
        print()
        
        # Test connection
        print("🔌 Testing connection...")
        
        # Prepare client arguments
        client_kwargs = {
            "base_url": settings.HOME_ASSISTANT_URL,
            "access_token": settings.HOME_ASSISTANT_TOKEN
        }
        
        # Add Cloudflare service token if configured
        if (settings.CLOUDFLARE_ACCESS_PROTECTED and 
            settings.CLOUDFLARE_SERVICE_CLIENT_ID and 
            settings.CLOUDFLARE_SERVICE_CLIENT_SECRET):
            client_kwargs.update({
                "cloudflare_client_id": settings.CLOUDFLARE_SERVICE_CLIENT_ID,
                "cloudflare_client_secret": settings.CLOUDFLARE_SERVICE_CLIENT_SECRET
            })
            print("   Using Cloudflare Access authentication...")
        
        client = HomeAssistantClient(**client_kwargs)
        
        async with client:
            # Health check
            print("🩺 Performing health check...")
            health = await client.health_check()
            print(f"   Health status: {health}")
            
            # Check if REST API is working (most important for basic functionality)
            if not health.get("rest_api"):
                print("❌ REST API connection failed")
                return False
            else:
                print("✅ REST API connection successful")
                
            if not health.get("websocket"):
                print("⚠️  WebSocket connection failed (real-time updates won't work)")
                print("   This is often due to Cloudflare proxy settings but doesn't affect basic functionality")
            else:
                print("✅ WebSocket connection successful")
            
            # Get basic info
            print("📊 Getting Home Assistant info...")
            config = await client.get_config()
            print(f"   Version: {config.get('version', 'Unknown')}")
            print(f"   Location: {config.get('location_name', 'Unknown')}")
            print(f"   Timezone: {config.get('time_zone', 'Unknown')}")
            print()
            
            # Get entities count
            print("🔍 Discovering entities...")
            entities = await client.get_entities()
            total_entities = len(entities)
            
            # Count by domain
            domains = {}
            for entity in entities:
                domain = entity.get("entity_id", "").split(".")[0]
                domains[domain] = domains.get(domain, 0) + 1
            
            print(f"   Total entities: {total_entities}")
            print("   By type:")
            for domain, count in sorted(domains.items()):
                if count > 0 and domain in ["light", "switch", "sensor", "fan", "cover", "climate"]:
                    print(f"     {domain}: {count}")
            print()
            
            # Test specific device types for farming
            print("🌱 Checking farming-relevant devices...")
            farming_domains = ["light", "switch", "sensor", "fan"]
            
            for domain in farming_domains:
                domain_entities = [e for e in entities if e.get("entity_id", "").startswith(f"{domain}.")]
                print(f"   {domain.capitalize()}s: {len(domain_entities)}")
                
                # Show first few entities as examples
                for entity in domain_entities[:3]:
                    entity_id = entity.get("entity_id", "")
                    friendly_name = entity.get("attributes", {}).get("friendly_name", entity_id)
                    state = entity.get("state", "unknown")
                    print(f"     - {friendly_name} ({entity_id}): {state}")
                
                if len(domain_entities) > 3:
                    print(f"     ... and {len(domain_entities) - 3} more")
                print()
            
            print("✅ Connection test completed successfully!")
            print("\n🎉 Your Home Assistant integration is ready to use!")
            
            return True
            
    except Exception as e:
        print(f"❌ Connection test failed: {e}")
        print("\nTroubleshooting tips:")
        print("1. Verify your Home Assistant is accessible at the configured URL")
        print("2. Check that your access token is valid and has the right permissions")
        print("3. Ensure your Home Assistant instance is running and healthy")
        print("4. If using the public URL, verify Cloudflare is properly configured")
        return False


if __name__ == "__main__":
    success = asyncio.run(test_home_assistant_connection())
    sys.exit(0 if success else 1) 