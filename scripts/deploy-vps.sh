#!/bin/bash
###############################################################################
# Thai Accounting ERP - VPS Deployment Script
# Purpose: Build locally and deploy to VPS via SSH
###############################################################################

set -e

# Configuration
VPS_HOST="135.181.107.76"
VPS_USER="root"
VPS_KEY="~/.ssh/test"
VPS_APP_DIR="/root/thai-acc"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Step 1: Build locally with bun
log_info "Building application locally with bun..."
rm -rf .next
bun install --ignore-scripts
bun run db:generate
bun run build
log_success "Build complete"

# Step 2: Sync to VPS
log_info "Syncing to VPS..."
rsync -avz -e "ssh -i $VPS_KEY" \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='prisma/*.db' \
  --exclude='logs' \
  --exclude='test-results' \
  --exclude='.git' \
  --exclude='backups' \
  --exclude='*.log' \
  ./ root@${VPS_HOST}:${VPS_APP_DIR}/
log_success "Sync complete"

# Step 3: Install deps & db:migrate on VPS
log_info "Installing dependencies and migrating database on VPS..."
ssh -i $VPS_KEY root@${VPS_HOST} "cd ${VPS_APP_DIR} && npm install --legacy-peer-deps --ignore-scripts && npm run db:generate"
log_success "Dependencies installed"

# Step 4: Restart the next-server process
log_info "Restarting next-server on VPS..."
ssh -i $VPS_KEY root@${VPS_HOST} "pkill -f 'next-server' || true; sleep 2; cd ${VPS_APP_DIR} && nohup node .next/standalone/server.js > server.log 2>&1 &"
sleep 5

# Verify
log_info "Verifying deployment..."
RESULT=$(ssh -i $VPS_KEY root@${VPS_HOST} "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000" 2>/dev/null || echo "000")
if [ "$RESULT" = "200" ] || [ "$RESULT" = "301" ] || [ "$RESULT" = "302" ]; then
  log_success "Deployment complete! https://acc.k56mm.uk (HTTP $RESULT)"
else
  log_error "Server returned HTTP $RESULT - check logs on VPS"
fi
