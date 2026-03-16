#!/bin/bash

###############################################################################
# Pre-Deployment Verification Script
###############################################################################

set -e  # Exit on error

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

PROJECT_ROOT="/Users/tong/Thai-acc"
STANDALONE_DIR="$PROJECT_ROOT/.next/standalone"

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}Pre-Deployment Verification${NC}"
echo -e "${YELLOW}========================================${NC}"

FAILS=0

check_item() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}[✓]${NC} $2"
    else
        echo -e "${RED}[✗]${NC} $2"
        FAILS=$((FAILS + 1))
    fi
}

# Check standalone build
echo -e "\n${YELLOW}=== Checking Standalone Build ===${NC}"
test -d "$STANDALONE_DIR"
check_item $? "Standalone directory exists"

test -f "$STANDALONE_DIR/server.js"
check_item $? "Server file exists"

test -d "$STANDALONE_DIR/node_modules"
check_item $? "Production dependencies installed"

test -d "$STANDALONE_DIR/.next"
check_item $? "Static files copied"

test -d "$STANDALONE_DIR/public"
check_item $? "Public files copied"

# Check environment
echo -e "\n${YELLOW}=== Checking Environment ===${NC}"
test -f "$STANDALONE_DIR/.env"
check_item $? "Environment file exists"

grep -q "DATABASE_URL=file:/" "$STANDALONE_DIR/.env"
check_item $? "DATABASE_URL uses absolute path"

grep -q "NODE_ENV=production" "$STANDALONE_DIR/.env"
check_item $? "NODE_ENV set to production"

grep -q "NEXTAUTH_URL=" "$STANDALONE_DIR/.env"
check_item $? "NEXTAUTH_URL configured"

grep -q "NEXTAUTH_SECRET=" "$STANDALONE_DIR/.env"
check_item $? "NEXTAUTH_SECRET configured"

# Check database
echo -e "\n${YELLOW}=== Checking Database ===${NC}"
test -f "$STANDALONE_DIR/prod.db"
check_item $? "Production database exists"

if [ -f "$STANDALONE_DIR/prod.db" ]; then
    DB_SIZE=$(du -h "$STANDALONE_DIR/prod.db" | cut -f1)
    echo -e "${GREEN}[INFO]${NC} Database size: $DB_SIZE"

    if command -v sqlite3 >/dev/null 2>&1; then
        USER_COUNT=$(sqlite3 "$STANDALONE_DIR/prod.db" "SELECT COUNT(*) FROM User;" 2>/dev/null || echo "0")
        test "$USER_COUNT" -gt 0
        check_item $? "Database has users ($USER_COUNT users)"

        ACCOUNT_COUNT=$(sqlite3 "$STANDALONE_DIR/prod.db" "SELECT COUNT(*) FROM ChartOfAccount;" 2>/dev/null || echo "0")
        test "$ACCOUNT_COUNT" -gt 0
        check_item $? "Database has chart of accounts ($ACCOUNT_COUNT accounts)"
    fi
fi

# Check directories
echo -e "\n${YELLOW}=== Checking Directories ===${NC}"
test -d "$PROJECT_ROOT/logs"
check_item $? "Logs directory exists"

test -d "$PROJECT_ROOT/backups"
check_item $? "Backups directory exists"

# Check scripts
echo -e "\n${YELLOW}=== Checking Management Scripts ===${NC}"
test -f "$PROJECT_ROOT/scripts/start-production.sh"
check_item $? "Start script exists"

test -f "$PROJECT_ROOT/scripts/stop-production.sh"
check_item $? "Stop script exists"

test -f "$PROJECT_ROOT/scripts/restart-production.sh"
check_item $? "Restart script exists"

test -f "$PROJECT_ROOT/scripts/health-check.sh"
check_item $? "Health check script exists"

test -x "$PROJECT_ROOT/scripts/start-production.sh"
check_item $? "Start script is executable"

# Summary
echo -e "\n${YELLOW}========================================${NC}"
if [ $FAILS -eq 0 ]; then
    echo -e "${GREEN}All Checks Passed!${NC}"
    echo -e "${GREEN}Ready for deployment.${NC}"
    exit 0
else
    echo -e "${RED}$FAILS check(s) failed!${NC}"
    echo -e "${RED}Please fix issues before deploying.${NC}"
    exit 1
fi
