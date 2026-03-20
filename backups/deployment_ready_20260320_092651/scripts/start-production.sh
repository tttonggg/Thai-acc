#!/bin/bash

###############################################################################
# Production Start Script for Thai Accounting ERP System
###############################################################################

set -e  # Exit on error
set -u  # Exit on undefined variable

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
STANDALONE_DIR="$PROJECT_ROOT/.next/standalone"
LOG_DIR="$PROJECT_ROOT/logs"
PID_FILE="$PROJECT_ROOT/production.pid"
LOG_FILE="$LOG_DIR/production.log"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Thai Accounting ERP - Production Start${NC}"
echo -e "${GREEN}========================================${NC}"

# Function to print colored messages
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Function to check if server is already running
check_running() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p "$PID" > /dev/null 2>&1; then
            print_warning "Server is already running (PID: $PID)"
            return 0
        else
            print_warning "Stale PID file found, removing..."
            rm -f "$PID_FILE"
        fi
    fi
    return 1
}

# Function to create necessary directories
create_directories() {
    print_info "Creating necessary directories..."
    mkdir -p "$LOG_DIR"
    mkdir -p "$PROJECT_ROOT/backups"
}

# Function to verify standalone build
verify_build() {
    print_info "Verifying standalone build..."

    if [ ! -d "$STANDALONE_DIR" ]; then
        print_error "Standalone build not found at $STANDALONE_DIR"
        print_info "Please run: bun run build"
        exit 1
    fi

    if [ ! -f "$STANDALONE_DIR/server.js" ]; then
        print_error "Server file not found at $STANDALONE_DIR/server.js"
        exit 1
    fi

    if [ ! -d "$STANDALONE_DIR/node_modules" ]; then
        print_error "Production dependencies not installed"
        print_info "Please run: bun run build"
        exit 1
    fi

    print_info "Build verification passed"
}

# Function to setup database
setup_database() {
    print_info "Setting up production database..."

    # Check if production database exists
    if [ ! -f "$STANDALONE_DIR/prod.db" ]; then
        print_warning "Production database not found"
        print_info "Creating from seed data..."

        # Copy development database if exists
        if [ -f "$PROJECT_ROOT/prisma/dev.db" ]; then
            cp "$PROJECT_ROOT/prisma/dev.db" "$STANDALONE_DIR/prod.db"
            print_info "Database copied from development"
        else
            print_error "No database found. Please run: bun run db:push && bun run seed"
            exit 1
        fi
    fi

    # Verify database size
    DB_SIZE=$(du -h "$STANDALONE_DIR/prod.db" | cut -f1)
    print_info "Production database size: $DB_SIZE"
}

# Function to verify environment configuration
verify_env() {
    print_info "Verifying environment configuration..."

    # Check if .env file exists in standalone
    if [ ! -f "$STANDALONE_DIR/.env" ]; then
        print_error "Environment file not found at $STANDALONE_DIR/.env"
        exit 1
    fi

    # Source the environment file to check variables
    source "$STANDALONE_DIR/.env"

    # Check required variables
    if [ -z "${DATABASE_URL:-}" ]; then
        print_error "DATABASE_URL not set in .env file"
        exit 1
    fi

    if [ -z "${NEXTAUTH_URL:-}" ]; then
        print_error "NEXTAUTH_URL not set in .env file"
        exit 1
    fi

    if [ -z "${NEXTAUTH_SECRET:-}" ]; then
        print_error "NEXTAUTH_SECRET not set in .env file"
        exit 1
    fi

    # Check if DATABASE_URL uses absolute path
    if [[ ! "$DATABASE_URL" =~ ^file:/.* ]]; then
        print_warning "DATABASE_URL should use absolute path for production"
        print_warning "Current: $DATABASE_URL"
    fi

    print_info "Environment verification passed"
}

# Function to backup database
backup_database() {
    print_info "Creating database backup..."
    BACKUP_FILE="$PROJECT_ROOT/backups/prod.db.$(date +%Y%m%d_%H%M%S)"
    cp "$STANDALONE_DIR/prod.db" "$BACKUP_FILE"
    print_info "Backup created: $BACKUP_FILE"
}

# Function to start server
start_server() {
    print_info "Starting production server..."

    cd "$STANDALONE_DIR"

    # Start server in background with logging
    NODE_ENV=production nohup node server.js >> "$LOG_FILE" 2>&1 &
    SERVER_PID=$!

    # Save PID
    echo "$SERVER_PID" > "$PID_FILE"

    # Wait for server to start
    sleep 3

    # Check if server is running
    if ps -p "$SERVER_PID" > /dev/null 2>&1; then
        print_info "Server started successfully (PID: $SERVER_PID)"
        print_info "Log file: $LOG_FILE"
        print_info "Access the application at: http://localhost:3000"
    else
        print_error "Failed to start server. Check log file: $LOG_FILE"
        rm -f "$PID_FILE"
        exit 1
    fi
}

# Function to display status
display_status() {
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}Server Status${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo -e "Status: ${GREEN}Running${NC}"
    echo -e "PID: $SERVER_PID"
    echo -e "Port: 3000"
    echo -e "Log: $LOG_FILE"
    echo -e "Database: $STANDALONE_DIR/prod.db"
    echo ""
    echo -e "${YELLOW}Useful Commands:${NC}"
    echo -e "  View logs: tail -f $LOG_FILE"
    echo -e "  Stop server: $SCRIPT_DIR/stop-production.sh"
    echo -e "  Restart: $SCRIPT_DIR/restart-production.sh"
    echo -e "  Health check: $SCRIPT_DIR/health-check.sh"
    echo ""
}

# Main execution
main() {
    # Check if already running
    if check_running; then
        exit 0
    fi

    # Setup
    create_directories
    verify_build
    verify_env
    setup_database
    backup_database

    # Start server
    start_server
    display_status
}

# Run main function
main
