#!/bin/bash

# Production Health Check Script
# Monitors database caching, background processing, and Home Assistant integration
# Run every 5 minutes via cron: */5 * * * * /path/to/production-health-check.sh

set -euo pipefail

# Configuration
BASE_URL="${BASE_URL:-http://localhost:8000}"
LOG_FILE="${LOG_FILE:-/var/log/vertical-farm/health-check.log}"
ALERT_WEBHOOK="${ALERT_WEBHOOK:-}"  # Slack/Discord webhook for alerts
METRICS_FILE="${METRICS_FILE:-/tmp/vertical-farm-metrics.json}"

# Thresholds
DB_RESPONSE_THRESHOLD=100  # milliseconds
CACHE_HIT_THRESHOLD=80     # percentage
QUEUE_DEPTH_THRESHOLD=100  # number of tasks
ERROR_RATE_THRESHOLD=1     # percentage

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Alert function
alert() {
    local level="$1"
    local message="$2"
    
    log "🚨 ALERT [$level]: $message"
    
    if [[ -n "$ALERT_WEBHOOK" ]]; then
        curl -s -X POST "$ALERT_WEBHOOK" \
            -H "Content-Type: application/json" \
            -d "{\"text\":\"🚨 Vertical Farm Alert [$level]: $message\"}" \
            || log "Failed to send alert webhook"
    fi
}

# Test database connection and caching
test_database() {
    log "🗄️  Testing database connection and caching..."
    
    local start_time=$(date +%s%3N)
    local response=$(curl -s -w "%{http_code}" -o /tmp/db_response.json "$BASE_URL/api/v1/test/db-connection" || echo "000")
    local end_time=$(date +%s%3N)
    local response_time=$((end_time - start_time))
    
    if [[ "$response" == "200" ]]; then
        local status=$(jq -r '.status // "unknown"' /tmp/db_response.json 2>/dev/null || echo "unknown")
        local cached=$(jq -r '.cached // false' /tmp/db_response.json 2>/dev/null || echo "false")
        
        echo "  ✅ Database: $status (${response_time}ms)"
        
        if [[ "$response_time" -gt "$DB_RESPONSE_THRESHOLD" ]]; then
            alert "WARNING" "Database response time high: ${response_time}ms (threshold: ${DB_RESPONSE_THRESHOLD}ms)"
        fi
        
        # Test query performance
        local query_start=$(date +%s%3N)
        local query_response=$(curl -s -w "%{http_code}" -o /tmp/query_response.json "$BASE_URL/api/v1/test/db-query" || echo "000")
        local query_end=$(date +%s%3N)
        local query_time=$((query_end - query_start))
        
        if [[ "$query_response" == "200" ]]; then
            local query_cached=$(jq -r '.cached // false' /tmp/query_response.json 2>/dev/null || echo "false")
            echo "  📊 Query: ${query_time}ms (cached: $query_cached)"
            
            if [[ "$query_cached" == "true" && "$query_time" -gt 50 ]]; then
                alert "WARNING" "Cached query slow: ${query_time}ms (expected: <50ms)"
            fi
        else
            alert "ERROR" "Database query test failed: HTTP $query_response"
        fi
        
        return 0
    else
        alert "CRITICAL" "Database connection failed: HTTP $response"
        return 1
    fi
}

# Test HTTP cache headers
test_cache_headers() {
    log "🚀 Testing HTTP cache headers..."
    
    local headers=$(curl -s -D - "$BASE_URL/api/v1/test/cache-test" -o /dev/null 2>&1 || echo "")
    
    if echo "$headers" | grep -q "cache-control:"; then
        local cache_control=$(echo "$headers" | grep -i "cache-control:" | cut -d' ' -f2- | tr -d '\r')
        echo "  ✅ Cache-Control: $cache_control"
        
        if echo "$headers" | grep -q "etag:"; then
            local etag=$(echo "$headers" | grep -i "etag:" | cut -d' ' -f2- | tr -d '\r')
            echo "  🏷️  ETag: $etag"
        else
            alert "WARNING" "Missing ETag header in cache response"
        fi
        
        return 0
    else
        alert "ERROR" "Missing Cache-Control headers"
        return 1
    fi
}

# Test background processing
test_background_processing() {
    log "⚙️  Testing background processing..."
    
    # Get queue statistics
    local stats_response=$(curl -s -w "%{http_code}" -o /tmp/queue_stats.json "$BASE_URL/api/v1/test/background/queue-stats" || echo "000")
    
    if [[ "$stats_response" == "200" ]]; then
        local queue_depth=$(jq -r '.queue_depth // 0' /tmp/queue_stats.json 2>/dev/null || echo "0")
        local processed=$(jq -r '.processed_count // 0' /tmp/queue_stats.json 2>/dev/null || echo "0")
        local failed=$(jq -r '.failed_count // 0' /tmp/queue_stats.json 2>/dev/null || echo "0")
        
        echo "  📊 Queue depth: $queue_depth"
        echo "  ✅ Processed: $processed"
        echo "  ❌ Failed: $failed"
        
        if [[ "$queue_depth" -gt "$QUEUE_DEPTH_THRESHOLD" ]]; then
            alert "WARNING" "Queue depth high: $queue_depth (threshold: $QUEUE_DEPTH_THRESHOLD)"
        fi
        
        # Calculate error rate
        local total=$((processed + failed))
        if [[ "$total" -gt 0 ]]; then
            local error_rate=$((failed * 100 / total))
            if [[ "$error_rate" -gt "$ERROR_RATE_THRESHOLD" ]]; then
                alert "WARNING" "Background task error rate high: ${error_rate}% (threshold: ${ERROR_RATE_THRESHOLD}%)"
            fi
        fi
        
        # Test task submission
        local submit_response=$(curl -s -w "%{http_code}" -o /tmp/submit_response.json \
            -X POST "$BASE_URL/api/v1/test/background/submit" \
            -H "Content-Type: application/json" \
            -d '{"type":"health_check","payload":{"timestamp":"'$(date -Iseconds)'"}}' || echo "000")
        
        if [[ "$submit_response" == "200" ]]; then
            echo "  ✅ Task submission: OK"
        else
            alert "ERROR" "Background task submission failed: HTTP $submit_response"
        fi
        
        return 0
    else
        alert "ERROR" "Background queue stats failed: HTTP $stats_response"
        return 1
    fi
}

# Test Home Assistant integration
test_home_assistant() {
    log "🏠 Testing Home Assistant integration..."
    
    local ha_response=$(curl -s -w "%{http_code}" -o /tmp/ha_response.json "$BASE_URL/api/v1/test/home-assistant-error" || echo "000")
    
    if [[ "$ha_response" == "200" ]]; then
        local status=$(jq -r '.status // "unknown"' /tmp/ha_response.json 2>/dev/null || echo "unknown")
        local error_handling=$(jq -r '.error_handling // "unknown"' /tmp/ha_response.json 2>/dev/null || echo "unknown")
        
        echo "  ✅ Status: $status"
        echo "  🛡️  Error handling: $error_handling"
        
        if [[ "$status" == "error" && "$error_handling" != "graceful" ]]; then
            alert "WARNING" "Home Assistant error handling not graceful"
        fi
        
        return 0
    else
        alert "ERROR" "Home Assistant test failed: HTTP $ha_response"
        return 1
    fi
}

# Test overall system health
test_system_health() {
    log "🎯 Testing overall system health..."
    
    local health_response=$(curl -s -w "%{http_code}" -o /tmp/health_response.json "$BASE_URL/api/v1/test/health-detailed" || echo "000")
    
    if [[ "$health_response" == "200" ]]; then
        local overall=$(jq -r '.overall // "unknown"' /tmp/health_response.json 2>/dev/null || echo "unknown")
        echo "  🎯 Overall status: $overall"
        
        # Check individual services
        local db_status=$(jq -r '.services.database.status // "unknown"' /tmp/health_response.json 2>/dev/null || echo "unknown")
        local bg_status=$(jq -r '.services.background_processing.status // "unknown"' /tmp/health_response.json 2>/dev/null || echo "unknown")
        local ha_status=$(jq -r '.services.home_assistant.status // "unknown"' /tmp/health_response.json 2>/dev/null || echo "unknown")
        
        echo "  🗄️  Database: $db_status"
        echo "  ⚙️  Background: $bg_status"
        echo "  🏠 Home Assistant: $ha_status"
        
        if [[ "$overall" != "healthy" ]]; then
            alert "WARNING" "System health degraded: $overall"
        fi
        
        return 0
    else
        alert "CRITICAL" "System health check failed: HTTP $health_response"
        return 1
    fi
}

# Collect and store metrics
collect_metrics() {
    local timestamp=$(date -Iseconds)
    local metrics="{
        \"timestamp\": \"$timestamp\",
        \"database\": $(cat /tmp/db_response.json 2>/dev/null || echo '{}'),
        \"queue\": $(cat /tmp/queue_stats.json 2>/dev/null || echo '{}'),
        \"health\": $(cat /tmp/health_response.json 2>/dev/null || echo '{}')
    }"
    
    echo "$metrics" > "$METRICS_FILE"
    
    # Keep last 24 hours of metrics (assuming 5-minute intervals)
    if [[ -f "${METRICS_FILE}.history" ]]; then
        tail -n 288 "${METRICS_FILE}.history" > "${METRICS_FILE}.tmp" || true
        mv "${METRICS_FILE}.tmp" "${METRICS_FILE}.history"
    fi
    
    echo "$metrics" >> "${METRICS_FILE}.history"
}

# Performance summary
performance_summary() {
    log "📊 Performance Summary:"
    
    if [[ -f "$METRICS_FILE" ]]; then
        local db_time=$(jq -r '.database.response_time_ms // "N/A"' "$METRICS_FILE" 2>/dev/null || echo "N/A")
        local queue_depth=$(jq -r '.queue.queue_depth // "N/A"' "$METRICS_FILE" 2>/dev/null || echo "N/A")
        local overall_status=$(jq -r '.health.overall // "N/A"' "$METRICS_FILE" 2>/dev/null || echo "N/A")
        
        echo "  🗄️  DB Response: ${db_time}ms"
        echo "  📊 Queue Depth: $queue_depth"
        echo "  🎯 Overall: $overall_status"
    fi
}

# Main execution
main() {
    log "🚀 Starting production health check..."
    
    local exit_code=0
    
    # Create log directory if it doesn't exist
    mkdir -p "$(dirname "$LOG_FILE")"
    
    # Run all tests
    test_database || exit_code=1
    test_cache_headers || exit_code=1
    test_background_processing || exit_code=1
    test_home_assistant || exit_code=1
    test_system_health || exit_code=1
    
    # Collect metrics
    collect_metrics
    
    # Show summary
    performance_summary
    
    if [[ $exit_code -eq 0 ]]; then
        log "✅ All health checks passed"
    else
        log "❌ Some health checks failed"
        alert "ERROR" "Health check failures detected"
    fi
    
    # Cleanup temporary files
    rm -f /tmp/db_response.json /tmp/query_response.json /tmp/queue_stats.json \
          /tmp/ha_response.json /tmp/health_response.json /tmp/submit_response.json
    
    log "🏁 Health check completed (exit code: $exit_code)"
    exit $exit_code
}

# Run main function
main "$@" 