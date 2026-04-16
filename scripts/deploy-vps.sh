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
VPS_DB_DIR="/root/thai-acc/prisma"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Step 1: Build locally
log_info "Building application locally..."
rm -rf .next
npm install
npm run db:generate
npm run build
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
  ./ root@${VPS_HOST}:${VPS_APP_DIR}/
log_success "Sync complete"

# Step 3: Install deps & rebuild on VPS
log_info "Installing dependencies on VPS..."
ssh -i $VPS_KEY root@${VPS_HOST} "cd ${VPS_APP_DIR} && npm install && npm run db:generate"

# Step 4: Restart app on VPS
log_info "Restarting application on VPS..."
ssh -i $VPS_KEY root@${VPS_HOST} "pkill -f 'next dev' || true; cd ${VPS_APP_DIR} && nohup npm run dev > dev.log 2>&1 &"
sleep 5

# Verify
log_info "Verifying deployment..."
ssh -i $VPS_KEY root@${VPS_HOST} "curl -s http://localhost:3000 | head -c 100 && echo '...'" | head -c 100
log_success "Deployment complete! https://acc.k56mm.uk"
