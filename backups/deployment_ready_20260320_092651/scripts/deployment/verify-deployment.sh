#!/bin/bash
# ============================================
# Deployment Verification Script
# ============================================

set -e

URL="${1:-http://localhost:3000}"
TIMEOUT="${2:-300}"
INTERVAL="${3:-10}"

echo "🔍 Verifying deployment at ${URL}"
echo "  Timeout: ${TIMEOUT}s"
echo "  Interval: ${INTERVAL}s"

start_time=$(date +%s)

while true; do
    current_time=$(date +%s)
    elapsed=$((current_time - start_time))
    
    if [ $elapsed -ge $TIMEOUT ]; then
        echo "❌ Verification timed out after ${TIMEOUT}s"
        exit 1
    fi
    
    # Check health endpoint
    response=$(curl -s -o /dev/null -w "%{http_code}" "${URL}/api/health" 2>/dev/null || echo "000")
    
    if [ "$response" = "200" ]; then
        echo "✅ Health check passed!"
        
        # Additional checks
        echo "🔍 Running additional checks..."
        
        # Check API endpoints
        endpoints=("/api/health" "/api/health?ready=true")
        for endpoint in "${endpoints[@]}"; do
            status=$(curl -s -o /dev/null -w "%{http_code}" "${URL}${endpoint}" 2>/dev/null || echo "000")
            if [ "$status" = "200" ] || [ "$status" = "401" ]; then
                echo "  ✅ ${endpoint}: ${status}"
            else
                echo "  ⚠️  ${endpoint}: ${status}"
            fi
        done
        
        echo "✅ Deployment verified successfully!"
        exit 0
    else
        echo "⏳ Waiting for deployment... (elapsed: ${elapsed}s, status: ${response})"
    fi
    
    sleep $INTERVAL
done
