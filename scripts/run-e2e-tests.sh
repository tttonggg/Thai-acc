#!/bin/bash

###############################################################################
# Thai Accounting ERP - E2E Test Runner Script
#
# This script automates the complete E2E testing workflow including:
# - Starting dev server if not running
# - Running database migrations
# - Seeding test data
# - Running all E2E tests
# - Generating comprehensive reports
# - Cleanup and results summary
###############################################################################

set -e  # Exit on error
set -o pipefail  # Exit on pipe failure

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

SERVER_URL="http://localhost:3000"
SERVER_PID=""
TEST_RESULTS_DIR="$PROJECT_ROOT/test-results"
PLAYWRIGHT_REPORT="$PROJECT_ROOT/playwright-report"

# Functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_header() {
    echo ""
    echo "========================================"
    echo "$1"
    echo "========================================"
    echo ""
}

# Check if server is running
check_server() {
    log_info "Checking if dev server is running..."

    if curl -s -o /dev/null -w "%{http_code}" "$SERVER_URL" | grep -q "200\|302\|404"; then
        log_success "Dev server is running at $SERVER_URL"
        return 0
    else
        log_warning "Dev server is not running"
        return 1
    fi
}

# Start dev server
start_server() {
    log_info "Starting dev server..."

    # Create logs directory if it doesn't exist
    mkdir -p "$PROJECT_ROOT/logs"

    # Start server in background
    nohup npm run dev > "$PROJECT_ROOT/logs/dev-server.log" 2>&1 &
    SERVER_PID=$!

    # Wait for server to start
    log_info "Waiting for server to start..."
    for i in {1..60}; do
        if curl -s -o /dev/null -w "%{http_code}" "$SERVER_URL" | grep -q "200\|302\|404"; then
            log_success "Server started successfully (PID: $SERVER_PID)"
            return 0
        fi
        sleep 1
    done

    log_error "Server failed to start within 60 seconds"
    return 1
}

# Stop server if we started it
stop_server() {
    if [ -n "$SERVER_PID" ]; then
        log_info "Stopping dev server (PID: $SERVER_PID)..."
        kill $SERVER_PID 2>/dev/null || true
        wait $SERVER_PID 2>/dev/null || true
        log_success "Server stopped"
    fi
}

# Setup database
setup_database() {
    print_header "Setting Up Database"

    # Generate Prisma client
    log_info "Generating Prisma client..."
    npm run db:generate --silent

    # Run migrations
    log_info "Running database migrations..."
    npm run db:push --silent || log_warning "Migration failed or not needed"

    # Check if we need to seed
    log_info "Checking if database needs seeding..."
    USER_COUNT=$(npx prisma db execute --stdin <<< "SELECT COUNT(*) as count FROM User;" 2>/dev/null | grep -E "^[0-9]+$" || echo "0")

    if [ "$USER_COUNT" -lt 4 ]; then
        log_info "Seeding database with test data..."
        npm run seed --silent
        log_success "Database seeded successfully"
    else
        log_success "Database already seeded ($USER_COUNT users found)"
    fi
}

# Run tests
run_tests() {
    print_header "Running E2E Tests"

    # Clean previous test results
    log_info "Cleaning previous test results..."
    rm -rf "$TEST_RESULTS_DIR"
    rm -rf "$PLAYWRIGHT_REPORT"
    mkdir -p "$TEST_RESULTS_DIR"

    # Run Playwright tests
    log_info "Running Playwright tests..."
    if npm run test:e2e "$@"; then
        log_success "All tests passed!"
        return 0
    else
        log_warning "Some tests failed"
        return 1
    fi
}

# Generate report
generate_report() {
    print_header "Generating Test Report"

    # Check if results exist
    if [ ! -f "$TEST_RESULTS_DIR/results.json" ]; then
        log_warning "No test results found. Skipping report generation."
        return 1
    fi

    # Generate HTML report
    log_info "Generating HTML report..."
    if npx ts-node "$PROJECT_ROOT/scripts/generate-playwright-report.ts"; then
        log_success "Report generated successfully"

        # Display summary
        if [ -f "$TEST_RESULTS_DIR/playwright-report.json" ]; then
            echo ""
            log_info "Test Summary:"
            cat "$TEST_RESULTS_DIR/playwright-report.json" | grep -E '"totalTests"|"passed"|"failed"|"skipped"' | sed 's/"/  /g' | sed 's/,//g'
        fi

        # Open report in browser if on macOS
        if [[ "$OSTYPE" == "darwin"* ]]; then
            log_info "Opening report in browser..."
            open "$TEST_RESULTS_DIR/report.html"
        fi

        return 0
    else
        log_error "Failed to generate report"
        return 1
    fi
}

# Cleanup
cleanup() {
    print_header "Cleanup"

    log_info "Cleaning up temporary files..."

    # Remove old screenshots (keep last 10)
    find "$TEST_RESULTS_DIR" -name "*.png" -type f -mtime +7 -delete 2>/dev/null || true

    # Remove old videos (keep last 5)
    find "$TEST_RESULTS_DIR" -name "*.webm" -type f -mtime +7 -delete 2>/dev/null || true

    # Remove old traces (keep last 5)
    find "$TEST_RESULTS_DIR" -name "*.zip" -type f -mtime +7 -delete 2>/dev/null || true

    log_success "Cleanup complete"
}

# Display results
show_results() {
    print_header "Test Results"

    if [ -d "$PLAYWRIGHT_REPORT" ]; then
        log_info "HTML Report available at: $PLAYWRIGHT_REPORT/index.html"
    fi

    if [ -f "$TEST_RESULTS_DIR/report.html" ]; then
        log_info "Custom Report available at: $TEST_RESULTS_DIR/report.html"
    fi

    if [ -f "$TEST_RESULTS_DIR/results.json" ]; then
        log_info "JSON Results available at: $TEST_RESULTS_DIR/results.json"
    fi

    echo ""
    log_info "To view detailed results, run:"
    echo "  npx playwright show-report"
    echo ""
}

# Main execution
main() {
    print_header "Thai Accounting ERP - E2E Test Runner"

    # Parse arguments
    SKIP_SETUP=false
    SKIP_SERVER=false
    TEST_ARGS=""

    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-setup)
                SKIP_SETUP=true
                shift
                ;;
            --skip-server)
                SKIP_SERVER=true
                shift
                ;;
            --debug)
                TEST_ARGS="$TEST_ARGS --debug"
                shift
                ;;
            --ui)
                TEST_ARGS="$TEST_ARGS --ui"
                shift
                ;;
            --headed)
                TEST_ARGS="$TEST_ARGS --headed"
                shift
                ;;
            *)
                TEST_ARGS="$TEST_ARGS $1"
                shift
                ;;
        esac
    done

    # Setup
    if [ "$SKIP_SETUP" = false ]; then
        setup_database
    fi

    # Start server if needed
    if [ "$SKIP_SERVER" = false ]; then
        if ! check_server; then
            start_server
            trap stop_server EXIT
        fi
    fi

    # Run tests
    if run_tests $TEST_ARGS; then
        TEST_RESULT=0
    else
        TEST_RESULT=$?
    fi

    # Generate report
    generate_report || true

    # Cleanup
    cleanup

    # Show results
    show_results

    # Exit with test result
    exit $TEST_RESULT
}

# Run main function
main "$@"
