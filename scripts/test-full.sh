#!/bin/bash

###############################################################################
# Full Test Script - Run all comprehensive tests
###############################################################################
# Runs all test suites with database verification and reporting
# Usage: ./scripts/test-full.sh [--no-db-verify] [--parallel]
###############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse arguments
DB_VERIFY=true
PARALLEL=true

while [[ $# -gt 0 ]]; do
    case $1 in
        --no-db-verify)
            DB_VERIFY=false
            shift
            ;;
        --parallel)
            PARALLEL=true
            shift
            ;;
        --sequential)
            PARALLEL=false
            shift
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}🧪 FULL TEST RUNNER - All Test Suites${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""
echo -e "Database Verification: ${GREEN}$DB_VERIFY${NC}"
echo -e "Parallel Execution: ${GREEN}$PARALLEL${NC}"
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

# Start timing
START_TIME=$(date +%s)

# Run all tests
echo -e "${BLUE}Running all test suites...${NC}"
echo ""

if [ "$PARALLEL" = true ]; then
    WORKERS_FLAG="--workers=3"
else
    WORKERS_FLAG="--workers=1"
fi

npx playwright test \
    $WORKERS_FLAG \
    --reporter=html \
    --reporter=line \
    --timeout=120000

TEST_RESULT=$?

# End timing
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
MINUTES=$((DURATION / 60))
SECONDS=$((DURATION % 60))

# Stop dev server if we started it
if [ ! -z "$DEV_SERVER_PID" ]; then
    echo -e "${YELLOW}Stopping dev server...${NC}"
    kill $DEV_SERVER_PID 2>/dev/null || true
fi

# Database verification (if enabled)
if [ "$DB_VERIFY" = true ] && [ $TEST_RESULT -eq 0 ]; then
    echo ""
    echo -e "${BLUE}================================================${NC}"
    echo -e "${BLUE}📊 Running Database Verification${NC}"
    echo -e "${BLUE}================================================${NC}"

    if [ -f "tests/scripts/verify-database.sh" ]; then
        ./tests/scripts/verify-database.sh
    else
        echo -e "${YELLOW}⚠️  Database verification script not found${NC}"
    fi
fi

# Run master test runner for comprehensive report
if [ $TEST_RESULT -eq 0 ]; then
    echo ""
    echo -e "${BLUE}================================================${NC}"
    echo -e "${BLUE}📊 Generating Master Report${NC}"
    echo -e "${BLUE}================================================${NC}"

    if [ -f "tests/master-test-runner.ts" ]; then
        npx ts-node tests/master-test-runner.ts || echo -e "${YELLOW}⚠️  Master test runner failed${NC}"
    else
        echo -e "${YELLOW}⚠️  Master test runner not found${NC}"
    fi
fi

echo ""
echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}Test Execution Complete${NC}"
echo -e "${BLUE}================================================${NC}"
echo -e "Duration: ${GREEN}${MINUTES}m ${SECONDS}s${NC}"
echo -e "HTML Report: ${GREEN}playwright-report/index.html${NC}"

if [ $TEST_RESULT -eq 0 ]; then
    echo -e "${GREEN}✅ ALL TESTS PASSED${NC}"
else
    echo -e "${RED}❌ SOME TESTS FAILED${NC}"
fi
echo -e "${BLUE}================================================${NC}"

exit $TEST_RESULT
