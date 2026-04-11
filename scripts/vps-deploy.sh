#!/bin/bash

# Thai-acc VPS Deployment Script
# This script handles deployment on the VPS side

set -e

APP_DIR="/root/thai-acc"
BACKUP_DIR="/root/thai-acc/backups/deployments"
LOG_FILE="/root/thai-acc/deploy.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1" | tee -a "$LOG_FILE"
}

# Create backup before deployment
create_backup() {
    log "Creating backup..."
    BACKUP_NAME="deploy_$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR/$BACKUP_NAME"

    # Backup current application
    if [ -d "$APP_DIR/.next" ]; then
        cp -r "$APP_DIR/.next" "$BACKUP_DIR/$BACKUP_NAME/"
    fi

    if [ -f "$APP_DIR/package.json" ]; then
        cp "$APP_DIR/package.json" "$BACKUP_DIR/$BACKUP_NAME/"
    fi

    # Keep only last 5 backups
    ls -t "$BACKUP_DIR" | tail -n +6 | xargs -I {} rm -rf "$BACKUP_DIR/{}"

    log "Backup created: $BACKUP_NAME"
}

# Stop running application
stop_app() {
    log "Stopping application..."
    cd "$APP_DIR"

    if pm2 list | grep -q "keerati-erp"; then
        pm2 stop keerati-erp || warning "Failed to stop PM2 process"
    fi

    # Kill any running Node processes on port 3000
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
}

# Start application
start_app() {
    log "Starting application..."
    cd "$APP_DIR"

    # Make sure .env exists
    if [ ! -f ".env" ]; then
        error ".env file not found. Please create it first."
    fi

    # Update DATABASE_URL to absolute path if needed
    sed -i.bak 's|DATABASE_URL=file:prisma/dev.db|DATABASE_URL=file:/root/thai-acc/prisma/dev.db|g' .env
    rm -f .env.bak

    # Start with PM2 if available, otherwise use bun
    if command -v pm2 &> /dev/null; then
        pm2 start bun --name "keerati-erp" -- run start
        pm2 save
    else
        nohup bun run start > /root/thai-acc/app.log 2>&1 &
    fi

    log "Application started"
}

# Health check
health_check() {
    log "Running health check..."

    sleep 5

    if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
        log "Health check passed ✓"
        return 0
    else
        error "Health check failed ✗"
    fi
}

# Main deployment flow
main() {
    log "=== Starting Deployment ==="

    create_backup
    stop_app

    log "Installing dependencies..."
    cd "$APP_DIR"
    bun install

    log "Running database migrations..."
    bun run db:push

    start_app
    health_check

    log "=== Deployment Complete ==="
    log "Application is running at: https://acc.k56mm.uk"
}

# Run main function
main "$@"
