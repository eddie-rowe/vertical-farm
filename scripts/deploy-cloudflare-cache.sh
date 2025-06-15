#!/bin/bash

# Deploy Edge Functions with Cloudflare Cache API Implementation
# This replaces the memory-based caching with Cloudflare's distributed cache

echo "🚀 Deploying Edge Functions with Cloudflare Cache API..."

# Check if Supabase CLI is available
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first."
    echo "   npm install -g supabase"
    exit 1
fi

# Ensure we're in the project root
if [ ! -f "supabase/config.toml" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

echo "📦 Deploying background-task-processor with Cloudflare Cache API..."

# Deploy the updated background-task-processor
supabase functions deploy background-task-processor

if [ $? -eq 0 ]; then
    echo "✅ background-task-processor deployed successfully with Cloudflare Cache API"
else
    echo "❌ Failed to deploy background-task-processor"
    exit 1
fi

# Deploy queue-scheduler if it exists
if [ -d "supabase/functions/queue-scheduler" ]; then
    echo "📦 Deploying queue-scheduler..."
    supabase functions deploy queue-scheduler
    
    if [ $? -eq 0 ]; then
        echo "✅ queue-scheduler deployed successfully"
    else
        echo "❌ Failed to deploy queue-scheduler"
        exit 1
    fi
fi

echo ""
echo "🎉 Cloudflare Cache API Implementation Deployed Successfully!"
echo ""
echo "🔧 NEW FEATURES IMPLEMENTED:"
echo "   ✅ Cloudflare Cache API replacing memory cache"
echo "   ✅ Distributed caching across edge locations"
echo "   ✅ Reduced memory overhead in Edge Functions"
echo "   ✅ Better cache persistence between invocations"
echo "   ✅ Smart cache effectiveness monitoring"
echo ""
echo "📊 EXPECTED IMPROVEMENTS:"
echo "   🚀 Reduced individual request latency"
echo "   📈 Maintained high throughput benefits"
echo "   🌍 Global cache distribution"
echo "   💾 Lower memory usage in functions"
echo "   ⚡ Faster cold start performance"
echo ""
echo "🧪 NEXT STEPS:"
echo "   1. Run performance tests to measure improvements"
echo "   2. Monitor cache hit rates in production"
echo "   3. Compare with previous memory cache metrics"
echo ""
echo "📈 Run Cloudflare cache performance test:"
echo "   cd backend/app/tests/production_tests"
echo "   node cloudflare-cache-performance-test.js"
echo ""
echo "🔍 Monitor cache performance:"
echo "   - Check Edge Function logs for cache hit/miss ratios"
echo "   - Monitor response times in production"
echo "   - Use Cloudflare Analytics for cache insights"
echo ""
echo "⚙️  CLOUDFLARE CONFIGURATION RECOMMENDATIONS:"
echo "   1. Enable Browser Cache TTL in Cloudflare Dashboard"
echo "   2. Configure Page Rules for API endpoints"
echo "   3. Set up Cache Rules for optimal performance"
echo "   4. Monitor cache analytics in Cloudflare Dashboard" 