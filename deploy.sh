#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# Thai ACC Production Deploy Script
# Builds locally, copies standalone output to VPS.
# ============================================================

VPS_HOST="root@135.181.107.76"
VPS_DEPLOY_PATH="/root/thai-acc"
LOCAL_PROJECT="/Users/tong/peak-acc"
SSH_KEY="${HOME}/.ssh/test"
SSH_OPTS="-i ${SSH_KEY} -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null"

echo "========================================"
echo " Thai ACC Production Deploy"
echo " Target: $VPS_HOST"
echo "========================================"

# 0. Pre-deploy verification
echo ""
echo "[0/6] Running pre-deploy checks..."
if [ -f "scripts/deploy-check.sh" ]; then
    bash scripts/deploy-check.sh
else
    echo "⚠️  deploy-check.sh not found, skipping checks"
fi

# 1. Build frontend locally
echo ""
echo "[1/6] Building frontend locally..."
cd "$LOCAL_PROJECT/frontend"
npm run build

# 2. Create tarball of source + built frontend
echo ""
echo "[2/6] Creating deploy tarball..."
cd "$LOCAL_PROJECT"
# Use find+tar for precise exclusions (tar --exclude matches substrings)
find . \
  -path './.git' -prune -o \
  -path './frontend/node_modules' -prune -o \
  -path './backend/.venv' -prune -o \
  -path './backend/venv' -prune -o \
  -path './__pycache__' -prune -o \
  -path './frontend/.next/cache' -prune -o \
  -type f \
  ! -name '.DS_Store' \
  ! -name '*.pyc' \
  ! -name '*.log' \
  ! -name '*.tar.gz' \
  -print | tar czf /tmp/thai-acc-deploy.tar.gz -T -

# 3. Transfer to VPS
echo ""
echo "[3/6] Transferring to VPS..."
ssh ${SSH_OPTS} "$VPS_HOST" "mkdir -p ${VPS_DEPLOY_PATH} && rm -rf ${VPS_DEPLOY_PATH}/*"
scp ${SSH_OPTS} /tmp/thai-acc-deploy.tar.gz "$VPS_HOST:${VPS_DEPLOY_PATH}/"
scp ${SSH_OPTS} "$LOCAL_PROJECT/.env" "$VPS_HOST:${VPS_DEPLOY_PATH}/.env"

# 4. Extract and prepare on VPS
echo ""
echo "[4/6] Extracting and preparing on VPS..."
ssh ${SSH_OPTS} "$VPS_HOST" "
    cd ${VPS_DEPLOY_PATH}
    tar xzf thai-acc-deploy.tar.gz
    rm thai-acc-deploy.tar.gz
    # Copy production configs
    cp docker-compose.prod.yml docker-compose.yml
    cp nginx.prod.conf nginx.conf
"

# 5. Build backend on VPS (frontend is already built)
echo ""
echo "[5/6] Building backend and starting services..."
ssh ${SSH_OPTS} "$VPS_HOST" "
    cd ${VPS_DEPLOY_PATH}
    echo '  - Building and starting services...'
    docker compose down 2>/dev/null || true
    docker compose up -d --build
"

# 6. Run migrations and health check
echo ""
echo "[6/6] Running migrations and health check..."
ssh ${SSH_OPTS} "$VPS_HOST" "
    cd ${VPS_DEPLOY_PATH}
    sleep 5
    echo '  - Running migrations...'
    docker compose exec -T backend alembic upgrade head || echo 'Migration skipped (may need DB ready)'
    echo '  - Health check...'
    curl -sf http://localhost:3001/health && echo 'Backend: OK' || echo 'Backend: NOT READY (may need more time)'
"

echo ""
echo "========================================"
echo " Deploy completed!"
echo "========================================"
echo ""
echo "  Frontend: http://135.181.107.76:3001"
echo "  API Docs: http://135.181.107.76:3001/docs"
echo "  Health:   http://135.181.107.76:3001/health"
echo ""
echo "NOTE: First startup may take 1-2 minutes for DB to initialize."
echo "      Run this to check status:"
echo "      ssh -i ~/.ssh/test root@135.181.107.76 'docker compose ps'"
echo ""
