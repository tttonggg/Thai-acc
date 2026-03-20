#!/bin/bash

###############################################################################
# Production Stop Script for Thai Accounting ERP System
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
PID_FILE="$PROJECT_ROOT/production.pid"

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}Thai Accounting ERP - Production Stop${NC}"
echo -e "${YELLOW}========================================${NC}"

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

# Function to stop server
stop_server() {
    if [ ! -f "$PID_FILE" ]; then
        print_warning "PID file not found. Server may not be running."
        exit 0
    fi

    PID=$(cat "$PID_FILE")

    if ! ps -p "$PID" > /dev/null 2>&1; then
        print_warning "Server is not running (stale PID file)"
        rm -f "$PID_FILE"
        exit 0
    fi

    print_info "Stopping server (PID: $PID)..."

    # Try graceful shutdown first
    kill "$PID" 2>/dev/null || true

    # Wait up to 10 seconds for graceful shutdown
    for i in {1..10}; do
        if ! ps -p "$PID" > /dev/null 2>&1; then
            print_info "Server stopped gracefully"
            rm -f "$PID_FILE"
            exit 0
        fi
        sleep 1
    done

    # Force kill if still running
    print_warning "Server did not stop gracefully, forcing..."
    kill -9 "$PID" 2>/dev/null || true
    rm -f "$PID_FILE"

    if ! ps -p "$PID" > /dev/null 2>&1; then
        print_info "Server stopped forcefully"
    else
        print_error "Failed to stop server"
        exit 1
    fi
}

# Main execution
main() {
    stop_server
    echo ""
    print_info "Server stopped successfully"
}

# Run main function
main
