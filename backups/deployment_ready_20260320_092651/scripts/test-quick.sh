#!/bin/bash

###############################################################################
# Quick Test Script - Run high-priority smoke tests only
###############################################################################
# Runs only critical and high-priority tests for fast feedback
# Usage: ./scripts/test-quick.sh
###############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}🧪 QUICK TEST RUNNER - Smoke Tests Only${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Check if dev server is running
if ! curl -s http://localhost:3000 > /dev/null; then
    echo -e "${YELLOW}⚠️  Dev server not detected. Starting...${NC}"
    npm run dev &
    DEV_SERVER_PID=$!
    echo -e "${YELLOW}Waiting for dev server to start (15s)...${NC}"
    sleep 15
else
    echo -e "${GREEN}✅ Dev server detected${NC}"
fi

# Run only smoke tests
echo -e "${BLUE}Running smoke tests...${NC}"
echo ""

npx playwright test \
    --grep "@smoke" \
    --reporter=line \
    --workers=3 \
    --timeout=60000

TEST_RESULT=$?

# Stop dev server if we started it
if [ ! -z "$DEV_SERVER_PID" ]; then
    echo -e "${YELLOW}Stopping dev server...${NC}"
    kill $DEV_SERVER_PID 2>/dev/null || true
fi

echo ""
echo -e "${BLUE}================================================${NC}"
if [ $TEST_RESULT -eq 0 ]; then
    echo -e "${GREEN}✅ QUICK TESTS PASSED${NC}"
else
    echo -e "${RED}❌ QUICK TESTS FAILED${NC}"
fi
echo -e "${BLUE}================================================${NC}"

exit $TEST_RESULT
