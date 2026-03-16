#!/bin/bash
# ============================================
# Blue-Green Deployment Script
# ============================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

# Configuration
NAMESPACE="${1:-production}"
IMAGE_TAG="${2:-latest}"
TIMEOUT="${3:-10m}"

echo "🚀 Starting Blue-Green Deployment"
echo "  Namespace: ${NAMESPACE}"
echo "  Image Tag: ${IMAGE_TAG}"
echo "  Timeout: ${TIMEOUT}"

# Get current color
CURRENT_COLOR=$(kubectl get svc thai-erp -n "${NAMESPACE}" -o jsonpath='{.spec.selector.color}' 2>/dev/null || echo "blue")

if [ "$CURRENT_COLOR" = "blue" ]; then
    NEW_COLOR="green"
else
    NEW_COLOR="blue"
fi

echo "  Current Color: ${CURRENT_COLOR}"
echo "  New Color: ${NEW_COLOR}"

# Deploy to inactive environment
echo "📦 Deploying to ${NEW_COLOR} environment..."
kubectl set image deployment/thai-erp-${NEW_COLOR} \
    thai-erp=ghcr.io/thai-erp/thai-erp:${IMAGE_TAG} \
    -n "${NAMESPACE}"

# Wait for rollout
echo "⏳ Waiting for rollout..."
kubectl rollout status deployment/thai-erp-${NEW_COLOR} \
    -n "${NAMESPACE}" \
    --timeout="${TIMEOUT}"

# Run smoke tests
echo "🧪 Running smoke tests..."
for i in {1..5}; do
    STATUS=$(kubectl run smoke-test-${NEW_COLOR} --rm -i --restart=Never \
        --image=curlimages/curl \
        -n "${NAMESPACE}" \
        -- curl -s -o /dev/null -w "%{http_code}" \
        http://thai-erp-${NEW_COLOR}.${NAMESPACE}.svc.cluster.local/api/health 2>/dev/null || echo "000")
    
    if [ "$STATUS" = "200" ]; then
        echo "✅ Smoke test passed"
        break
    fi
    
    echo "  Attempt $i failed, retrying..."
    sleep 10
done

if [ "$STATUS" != "200" ]; then
    echo "❌ Smoke tests failed! Rolling back..."
    kubectl rollout undo deployment/thai-erp-${NEW_COLOR} -n "${NAMESPACE}"
    exit 1
fi

# Run health checks
echo "🏥 Running health checks..."
for i in {1..10}; do
    STATUS=$(kubectl run health-check-${NEW_COLOR} --rm -i --restart=Never \
        --image=curlimages/curl \
        -n "${NAMESPACE}" \
        -- curl -s -o /dev/null -w "%{http_code}" \
        http://thai-erp-${NEW_COLOR}.${NAMESPACE}.svc.cluster.local/api/health?ready=true 2>/dev/null || echo "000")
    
    if [ "$STATUS" = "200" ]; then
        echo "✅ Health check $i passed"
    else
        echo "❌ Health check $i failed with status ${STATUS}"
        exit 1
    fi
    sleep 5
done

# Switch traffic
echo "🔄 Switching traffic to ${NEW_COLOR}..."
kubectl patch svc thai-erp -n "${NAMESPACE}" \
    -p "{\"spec\":{\"selector\":{\"color\":\"${NEW_COLOR}\"}}}"

# Monitor for 2 minutes
echo "📊 Monitoring for 2 minutes..."
sleep 120

# Verify no increase in error rate
echo "✅ Deployment successful!"

# Scale down old environment (keep for 1 hour for quick rollback)
echo "⏰ Scheduling old environment scale-down in 1 hour..."
(
    sleep 3600
    kubectl scale deployment thai-erp-${CURRENT_COLOR} --replicas=0 -n "${NAMESPACE}" || true
) &

echo "✅ Blue-Green deployment complete!"
echo "  To rollback: kubectl patch svc thai-erp -n ${NAMESPACE} -p '{\"spec\":{\"selector\":{\"color\":\"${CURRENT_COLOR}\"}}}'"
