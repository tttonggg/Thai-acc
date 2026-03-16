#!/bin/bash
# ============================================
# Rollback Script
# ============================================

set -e

NAMESPACE="${1:-production}"

echo "⚠️  Initiating rollback for ${NAMESPACE}..."

# Get current color
CURRENT_COLOR=$(kubectl get svc thai-erp -n "${NAMESPACE}" -o jsonpath='{.spec.selector.color}' 2>/dev/null || echo "blue")

if [ "$CURRENT_COLOR" = "blue" ]; then
    PREVIOUS_COLOR="green"
else
    PREVIOUS_COLOR="blue"
fi

echo "  Current Color: ${CURRENT_COLOR}"
echo "  Rolling back to: ${PREVIOUS_COLOR}"

# Check if previous deployment exists
if ! kubectl get deployment thai-erp-${PREVIOUS_COLOR} -n "${NAMESPACE}" &> /dev/null; then
    echo "❌ Previous deployment not found!"
    echo "   Attempting helm rollback..."
    helm rollback thai-erp -n "${NAMESPACE}"
    exit 0
fi

# Switch traffic back
echo "🔄 Switching traffic back to ${PREVIOUS_COLOR}..."
kubectl patch svc thai-erp -n "${NAMESPACE}" \
    -p "{\"spec\":{\"selector\":{\"color\":\"${PREVIOUS_COLOR}\"}}}"

# Verify rollback
sleep 10
STATUS=$(kubectl run rollback-check --rm -i --restart=Never \
    --image=curlimages/curl \
    -n "${NAMESPACE}" \
    -- curl -s -o /dev/null -w "%{http_code}" \
    http://thai-erp.${NAMESPACE}.svc.cluster.local/api/health 2>/dev/null || echo "000")

if [ "$STATUS" = "200" ]; then
    echo "✅ Rollback successful!"
else
    echo "❌ Rollback verification failed (status: ${STATUS})"
    exit 1
fi

# Scale down failed deployment
echo "🔻 Scaling down failed deployment..."
kubectl scale deployment thai-erp-${CURRENT_COLOR} --replicas=0 -n "${NAMESPACE}" || true

echo "✅ Rollback complete!"
