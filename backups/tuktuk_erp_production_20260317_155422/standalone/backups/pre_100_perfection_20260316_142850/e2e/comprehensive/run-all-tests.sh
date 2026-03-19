#!/bin/bash

# ============================================
# Comprehensive E2E Test Runner
# Runs all comprehensive test suites
# ============================================

set -e  # Exit on error

echo "=========================================="
echo "THAI ACCOUNTING - COMPREHENSIVE E2E TESTS"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test files
TEST_FILES=(
  "accounts.spec.ts"
  "customers.spec.ts"
  "vendors.spec.ts"
  "products.spec.ts"
)

# Counters
TOTAL=0
PASSED=0
FAILED=0

echo "Running comprehensive test suites..."
echo ""

# Run each test file
for test_file in "${TEST_FILES[@]}"; do
  TOTAL=$((TOTAL + 1))

  echo -e "${YELLOW}Running: ${test_file}${NC}"
  echo "----------------------------------------"

  if bun run test:e2e "e2e/comprehensive/${test_file}"; then
    echo -e "${GREEN}✓ PASSED: ${test_file}${NC}"
    PASSED=$((PASSED + 1))
  else
    echo -e "${RED}✗ FAILED: ${test_file}${NC}"
    FAILED=$((FAILED + 1))
  fi

  echo ""
done

# Summary
echo "=========================================="
echo "TEST SUMMARY"
echo "=========================================="
echo -e "Total Tests: ${TOTAL}"
echo -e "${GREEN}Passed: ${PASSED}${NC}"
echo -e "${RED}Failed: ${FAILED}${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}All tests passed!${NC}"
  exit 0
else
  echo -e "${RED}Some tests failed. Check output above.${NC}"
  exit 1
fi
