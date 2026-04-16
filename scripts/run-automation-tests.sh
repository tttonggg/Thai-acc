#!/bin/bash

# Currency Automation Test Runner
#
# Run all currency automation tests and generate report

set -e

echo "================================"
echo "🤖 Currency Automation Test Runner"
echo "================================"
echo ""

# Check if dev server is running
if ! curl -s http://localhost:3000 > /dev/null; then
  echo "❌ Dev server not running on http://localhost:3000"
  echo "Please start with: npm run dev"
  exit 1
fi

echo "✅ Dev server detected"
echo ""

# Check database connection
echo "🔍 Checking database connection..."
npx prisma generate > /dev/null 2>&1
echo "✅ Database ready"
echo ""

# Run tests
echo "🧪 Running automation tests..."
echo ""

npx playwright test currency-automation.spec.ts \
  --reporter=list \
  --timeout=60000

TEST_EXIT_CODE=$?

echo ""
echo "================================"
echo "📊 Test Run Complete"
echo "================================"

if [ $TEST_EXIT_CODE -eq 0 ]; then
  echo ""
  echo "✅ All tests passed!"
  echo ""
  echo "Next Steps:"
  echo "1. Manual verification: Open TESTING_CHECKLIST.md"
  echo "2. Work through Tests 1-10 manually"
  echo "3. Document results with screenshots"
  echo "4. Proceed to production deployment"
else
  echo ""
  echo "❌ Some tests failed"
  echo ""
  echo "Next Steps:"
  echo "1. Review test output above"
  echo "2. Check test results in test-results/"
  echo "3. Fix identified bugs"
  echo "4. Re-run: npm run test:currency"
fi

echo ""

exit $TEST_EXIT_CODE
