#!/bin/bash

###############################################################################
# Production Restart Script for Thai Accounting ERP System
###############################################################################

set -e  # Exit on error
set -u  # Exit on undefined variable

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}Thai Accounting ERP - Production Restart${NC}"
echo -e "${YELLOW}========================================${NC}"

# Function to restart server
restart_server() {
    echo -e "${GREEN}[INFO]${NC} Stopping server..."
    "$SCRIPT_DIR/stop-production.sh"

    echo -e "${GREEN}[INFO]${NC} Waiting 2 seconds..."
    sleep 2

    echo -e "${GREEN}[INFO]${NC} Starting server..."
    "$SCRIPT_DIR/start-production.sh"
}

# Main execution
main() {
    restart_server
}

# Run main function
main
