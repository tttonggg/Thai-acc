#!/bin/bash

###############################################################################
# Module Test Script - Run tests for a specific module
###############################################################################
# Runs tests filtered by module name or tag
# Usage: ./scripts/test-module.sh <module-name|tag>
# Examples:
#   ./scripts/test-module.sh inventory
#   ./scripts/test-module.sh @smoke
#   ./scripts/test-module.sh "@critical and @smoke"
###############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if module/tag is provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: Please provide a module name or tag${NC}"
    echo ""
    echo "Usage: $0 <module-name|tag>"
    echo ""
    echo "Examples:"
    echo "  $0 inventory"
    echo "  $0 @smoke"
    echo "  $0 '@critical and @smoke'"
    echo ""
    echo "Available modules:"
    echo "  - auth"
    echo "  - accounts"
    echo "  - journal"
    echo "  - sales"
    echo "  - ar"
    echo "  - vat"
    echo "  - wht"
    echo "  - ap"
    echo "  - inventory"
    echo "  - assets"
    echo "  - banking"
    echo "  - petty-cash"
    echo "  - payroll"
    echo "  - reports"
    echo "  - admin"
    echo ""
    echo "Available tags:"
    echo "  - @smoke"
    echo "  - @critical"
    echo "  - @high"
    echo "  - @medium"
    echo "  - @low"
    echo "  - @compliance"
    echo "  - @expansion"
    echo "  - @pdf"
    exit 1
fi

MODULE="$1"

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}🧪 MODULE TEST RUNNER${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""
echo -e "Module/Tag: ${GREEN}$MODULE${NC}"
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

# Run tests for the module
echo -e "${BLUE}Running tests for module: $MODULE${NC}"
echo ""

# Try different approaches to find matching tests
# 1. First try to find files containing the module name
MATCHING_FILES=$(find e2e -name "*.spec.ts" -type f | grep -i "$MODULE" || true)

if [ ! -z "$MATCHING_FILES" ]; then
    echo -e "${GREEN}Found matching test files:${NC}"
    echo "$MATCHING_FILES"
    echo ""

    # Run the matching files
    npx playwright test $MATCHING_FILES \
        --reporter=line \
        --reporter=html \
        --timeout=120000
else
    # 2. Try to run with grep pattern
    echo -e "${YELLOW}No matching files found, trying grep pattern...${NC}"
    echo ""

    npx playwright test \
        --grep "$MODULE" \
        --reporter=line \
        --reporter=html \
        --timeout=120000
fi

TEST_RESULT=$?

# Stop dev server if we started it
if [ ! -z "$DEV_SERVER_PID" ]; then
    echo -e "${YELLOW}Stopping dev server...${NC}"
    kill $DEV_SERVER_PID 2>/dev/null || true
fi

echo ""
echo -e "${BLUE}================================================${NC}"
if [ $TEST_RESULT -eq 0 ]; then
    echo -e "${GREEN}✅ MODULE TESTS PASSED: $MODULE${NC}"
else
    echo -e "${RED}❌ MODULE TESTS FAILED: $MODULE${NC}"
fi
echo -e "${BLUE}================================================${NC}"
echo ""
echo -e "HTML Report: playwright-report/index.html"

exit $TEST_RESULT
