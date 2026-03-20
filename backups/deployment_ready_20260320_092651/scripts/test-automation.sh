#!/bin/bash

###############################################################################
# Thai Accounting ERP - Comprehensive Test Automation Script
#
# Features:
# - Automated test scheduling and execution
# - Multi-tier test running (smoke, quick, full)
# - Parallel test execution
# - Test result aggregation and reporting
# - Coverage tracking and trend analysis
# - Slack/Discord notifications
# - Email reports
# - Historical test data storage
#
# Usage:
#   ./scripts/test-automation.sh [command] [options]
#
# Commands:
#   smoke       - Run smoke tests (2-3 min)
#   quick       - Run quick tests (5 min)
#   full        - Run full test suite (15-20 min)
#   module      - Run specific module tests
#   coverage    - Generate coverage report
#   schedule    - Set up automated test scheduling
#   report      - Generate test report
#   notify      - Send test notifications
#   clean       - Clean test artifacts
###############################################################################

set -e  # Exit on error
set -o pipefail  # Exit on pipe failure

###############################################################################
# Configuration
###############################################################################

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Project paths
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

TEST_RESULTS_DIR="$PROJECT_ROOT/test-results"
TEST_HISTORY_DIR="$PROJECT_ROOT/test-history"
COVERAGE_DIR="$PROJECT_ROOT/coverage"
ARTIFACTS_DIR="$PROJECT_ROOT/test-artifacts"
LOGS_DIR="$PROJECT_ROOT/logs"

# Test configuration
SERVER_URL="http://localhost:3000"
PARALLEL_WORKERS=${PARALLEL_WORKERS:-4}
TEST_TIMEOUT=${TEST_TIMEOUT:-60000}  # 60 seconds per test
RETRY_COUNT=${RETRY_COUNT:-2}

# Notification settings (set in environment or .env)
SLACK_WEBHOOK_URL=${SLACK_WEBHOOK_URL:-""}
DISCORD_WEBHOOK_URL=${DISCORD_WEBHOOK_URL:-""}
EMAIL_RECIPIENTS=${EMAIL_RECIPIENTS:-""}

# Timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DATE=$(date +"%Y-%m-%d")

###############################################################################
# Utility Functions
###############################################################################

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

log_debug() {
    if [[ "${DEBUG:-false}" == "true" ]]; then
        echo -e "${PURPLE}🔍 $1${NC}"
    fi
}

print_header() {
    echo ""
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}  $1${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
    echo ""
}

print_step() {
    echo -e "${BLUE}▶ $1${NC}"
}

# Create necessary directories
create_directories() {
    mkdir -p "$TEST_RESULTS_DIR"
    mkdir -p "$TEST_HISTORY_DIR"
    mkdir -p "$COVERAGE_DIR"
    mkdir -p "$ARTIFACTS_DIR"
    mkdir -p "$LOGS_DIR"
    mkdir -p "$ARTIFACTS_DIR/screenshots"
    mkdir -p "$ARTIFACTS_DIR/videos"
    mkdir -p "$ARTIFACTS_DIR/traces"
}

# Save test results to history
save_test_history() {
    local test_type=$1
    local exit_code=$2

    local history_file="$TEST_HISTORY_DIR/${test_type}_${TIMESTAMP}.json"

    cat > "$history_file" <<EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "date": "$DATE",
  "test_type": "$test_type",
  "exit_code": $exit_code,
  "branch": "$(git branch --show-current)",
  "commit": "$(git rev-parse HEAD)",
  "author": "$(git log -1 --format='%an')",
  "message": "$(git log -1 --format='%s')"
}
EOF

    log_debug "Test history saved to: $history_file"
}

# Get test statistics
get_test_stats() {
    local json_file="$TEST_RESULTS_DIR/results.json"

    if [[ ! -f "$json_file" ]]; then
        echo "{}"
        return
    fi

    # Parse JSON and get stats (requires jq)
    if command -v jq &> /dev/null; then
        jq '{status: .stats, expected: .stats.expected, skipped: .stats.skipped, unexpected: .stats.unexpected, flaky: .stats.flaky}' "$json_file"
    else
        # Fallback: count using grep
        local passed=$(grep -o '"passed":[0-9]*' "$json_file" | grep -o '[0-9]*' | head -1)
        local failed=$(grep -o '"failed":[0-9]*' "$json_file" | grep -o '[0-9]*' | head -1)
        local skipped=$(grep -o '"skipped":[0-9]*' "$json_file" | grep -o '[0-9]*' | head -1)
        echo "{\"passed\": ${passed:-0}, \"failed\": ${failed:-0}, \"skipped\": ${skipped:-0}}"
    fi
}

###############################################################################
# Server Management
###############################################################################

check_server() {
    log_debug "Checking if server is running at $SERVER_URL"

    if curl -s -o /dev/null -w "%{http_code}" "$SERVER_URL" | grep -q "200\|302\|404"; then
        return 0
    else
        return 1
    fi
}

start_server() {
    if check_server; then
        log_info "Server already running"
        return 0
    fi

    log_info "Starting development server..."
    mkdir -p "$LOGS_DIR"

    # Start server in background
    nohup bun run dev > "$LOGS_DIR/dev-server-$TIMESTAMP.log" 2>&1 &
    local server_pid=$!
    echo $server_pid > "$LOGS_DIR/dev-server.pid"

    # Wait for server to start
    log_info "Waiting for server to be ready..."
    local max_attempts=60
    local attempt=0

    while [[ $attempt -lt $max_attempts ]]; do
        if check_server; then
            log_success "Server started (PID: $server_pid)"
            return 0
        fi
        attempt=$((attempt + 1))
        sleep 1
    done

    log_error "Server failed to start within ${max_attempts}s"
    return 1
}

stop_server() {
    local pid_file="$LOGS_DIR/dev-server.pid"

    if [[ -f "$pid_file" ]]; then
        local pid=$(cat "$pid_file")
        if kill -0 "$pid" 2>/dev/null; then
            log_info "Stopping server (PID: $pid)..."
            kill "$pid" 2>/dev/null || true
            wait "$pid" 2>/dev/null || true
            rm -f "$pid_file"
            log_success "Server stopped"
        fi
    fi
}

###############################################################################
# Test Execution Functions
###############################################################################

# Run smoke tests (critical path only)
run_smoke_tests() {
    print_header "Running Smoke Tests (Critical Path)"

    create_directories
    start_server

    print_step "Executing smoke test suite..."
    local start_time=$(date +%s)

    if bun run test:e2e --grep "@smoke" \
        --reporter=html \
        --reporter=json \
        --output="$TEST_RESULTS_DIR/results.json" \
        --output="$TEST_RESULTS_DIR/smoke-report.html"; then
        local exit_code=0
        log_success "Smoke tests passed"
    else
        local exit_code=$?
        log_error "Smoke tests failed (exit code: $exit_code)"
    fi

    local end_time=$(date +%s)
    local duration=$((end_time - start_time))

    echo ""
    log_info "Smoke tests completed in ${duration}s"

    save_test_history "smoke" $exit_code
    generate_test_report "smoke" $exit_code $duration

    return $exit_code
}

# Run quick tests (smoke + additional critical tests)
run_quick_tests() {
    print_header "Running Quick Tests"

    create_directories
    start_server

    print_step "Executing quick test suite..."
    local start_time=$(date +%s)

    # Run smoke tests + critical module tests
    if bun run test:e2e --grep "@smoke or @critical" \
        --workers=$PARALLEL_WORKERS \
        --reporter=html \
        --reporter=json \
        --reporter=junit \
        --output="$TEST_RESULTS_DIR/results.json"; then
        local exit_code=0
        log_success "Quick tests passed"
    else
        local exit_code=$?
        log_error "Quick tests failed (exit code: $exit_code)"
    fi

    local end_time=$(date +%s)
    local duration=$((end_time - start_time))

    echo ""
    log_info "Quick tests completed in ${duration}s"

    save_test_history "quick" $exit_code
    generate_test_report "quick" $exit_code $duration

    return $exit_code
}

# Run full test suite
run_full_tests() {
    print_header "Running Full Test Suite"

    create_directories
    start_server

    print_step "Executing complete E2E test suite..."
    local start_time=$(date +%s)

    # Run all E2E tests
    if bun run test:e2e \
        --workers=$PARALLEL_WORKERS \
        --reporter=html \
        --reporter=json \
        --reporter=junit \
        --retries=$RETRY_COUNT; then
        local e2e_exit_code=0
        log_success "E2E tests passed"
    else
        local e2e_exit_code=$?
        log_error "E2E tests failed (exit code: $e2e_exit_code)"
    fi

    # Run unit tests
    print_step "Running unit tests..."
    if bun run test:run; then
        local unit_exit_code=0
        log_success "Unit tests passed"
    else
        local unit_exit_code=$?
        log_error "Unit tests failed (exit code: $unit_exit_code)"
    fi

    local end_time=$(date +%s)
    local duration=$((end_time - start_time))

    echo ""
    log_info "Full test suite completed in ${duration}s"

    # Combined exit code
    local exit_code=$((e2e_exit_code + unit_exit_code))
    save_test_history "full" $exit_code
    generate_test_report "full" $exit_code $duration

    return $exit_code
}

# Run module-specific tests
run_module_tests() {
    local module=$1

    if [[ -z "$module" ]]; then
        log_error "Module name required"
        echo ""
        echo "Usage: $0 module <module-name>"
        echo ""
        echo "Available modules:"
        echo "  - accounts"
        echo "  - customers"
        echo "  - vendors"
        echo "  - invoices"
        echo "  - receipts"
        echo "  - payments"
        echo "  - inventory"
        echo "  - payroll"
        echo "  - banking"
        echo "  - assets"
        echo "  - petty-cash"
        echo "  - reports"
        return 1
    fi

    print_header "Running Module Tests: $module"

    create_directories
    start_server

    print_step "Executing tests for module: $module..."
    local start_time=$(date +%s)

    if bun run test:e2e "e2e/comprehensive/${module}.spec.ts" \
        --reporter=html \
        --reporter=json; then
        local exit_code=0
        log_success "Module tests passed"
    else
        local exit_code=$?
        log_error "Module tests failed (exit code: $exit_code)"
    fi

    local end_time=$(date +%s)
    local duration=$((end_time - start_time))

    echo ""
    log_info "Module tests completed in ${duration}s"

    save_test_history "module-$module" $exit_code
    generate_test_report "module-$module" $exit_code $duration

    return $exit_code
}

# Generate coverage report
run_coverage_tests() {
    print_header "Generating Coverage Report"

    create_directories

    print_step "Running unit tests with coverage..."
    local start_time=$(date +%s)

    if bun run test:coverage; then
        local exit_code=0
        log_success "Coverage tests passed"
    else
        local exit_code=$?
        log_error "Coverage tests failed (exit code: $exit_code)"
    fi

    local end_time=$(date +%s)
    local duration=$((end_time - start_time))

    echo ""
    log_info "Coverage report generated in ${duration}s"
    log_info "Coverage report: $COVERAGE_DIR/index.html"

    save_test_history "coverage" $exit_code

    return $exit_code
}

###############################################################################
# Reporting Functions
###############################################################################

# Generate test report
generate_test_report() {
    local test_type=$1
    local exit_code=$2
    local duration=$3

    local report_file="$TEST_RESULTS_DIR/${test_type}_report_${TIMESTAMP}.md"

    # Get test statistics
    local stats=$(get_test_stats)

    cat > "$report_file" <<EOF
# Test Report: ${test_type}

**Date**: $(date +"%Y-%m-%d %H:%M:%S")
**Branch**: $(git branch --show-current)
**Commit**: $(git rev-parse --short HEAD)
**Duration**: ${duration}s

## Test Results

| Metric | Value |
|--------|-------|
| **Status** | $(if [[ $exit_code -eq 0 ]]; then echo "✅ PASSED"; else echo "❌ FAILED"; fi) |
| **Exit Code** | $exit_code |
| **Duration** | ${duration}s |

## Statistics

\`\`\`json
$stats
\`\`\`

## Artifacts

- **HTML Report**: \`playwright-report/index.html\`
- **Screenshots**: \`test-artifacts/screenshots/\`
- **Videos**: \`test-artifacts/videos/\`
- **Traces**: \`test-artifacts/traces/\`

## History

Recent test runs:

EOF

    # Add recent history (last 5 runs)
    if ls "$TEST_HISTORY_DIR"/*.json 2>/dev/null | sort -r | head -5 | while read -r file; do
        local file_date=$(basename "$file" .json)
        local file_status=$(grep -o '"exit_code": [0-9]*' "$file" | head -1 | cut -d: -f2)
        local status_symbol=$(if [[ $file_status == "0" ]]; then echo "✅"; else echo "❌"; fi)

        echo "- $status_symbol \`$file_date\`" >> "$report_file"
    done; then
        :
    fi

    cat >> "$report_file" <<EOF

---
Generated by Thai Accounting ERP Test Automation
EOF

    log_success "Test report generated: $report_file"
}

# Send notification
send_notification() {
    local test_type=$1
    local exit_code=$2
    local duration=$3

    local status="PASSED"
    local color="good"
    if [[ $exit_code -ne 0 ]]; then
        status="FAILED"
        color="danger"
    fi

    local branch=$(git branch --show-current)
    local commit=$(git rev-parse --short HEAD)
    local message=$(git log -1 --format='%s')

    # Slack notification
    if [[ -n "$SLACK_WEBHOOK_URL" ]]; then
        log_info "Sending Slack notification..."

        curl -s -X POST "$SLACK_WEBHOOK_URL" \
            -H 'Content-Type: application/json' \
            -d "{
                \"attachments\": [{
                    \"color\": \"$color\",
                    \"title\": \"Test ${status}: ${test_type}\",
                    \"fields\": [
                        {\"title\": \"Branch\", \"value\": \"$branch\", \"short\": true},
                        {\"title\": \"Commit\", \"value\": \"$commit\", \"short\": true},
                        {\"title\": \"Duration\", \"value\": \"${duration}s\", \"short\": true},
                        {\"title\": \"Status\", \"value\": \"$status\", \"short\": true}
                    ],
                    \"footer\": \"Thai Accounting ERP\",
                    \"ts\": $(date +%s)
                }]
            }" > /dev/null 2>&1 || log_warning "Failed to send Slack notification"
    fi

    # Discord notification
    if [[ -n "$DISCORD_WEBHOOK_URL" ]]; then
        log_info "Sending Discord notification..."

        curl -s -X POST "$DISCORD_WEBHOOK_URL" \
            -H 'Content-Type: application/json' \
            -d "{
                \"embeds\": [{
                    \"title\": \"Test ${status}: ${test_type}\",
                    \"color\": $(if [[ $exit_code -eq 0 ]]; then echo "3066993"; else echo "15158332"; fi),
                    \"fields\": [
                        {\"name\": \"Branch\", \"value\": \"$branch\", \"inline\": true},
                        {\"name\": \"Commit\", \"value\": \"$commit\", \"inline\": true},
                        {\"name\": \"Duration\", \"value\": \"${duration}s\", \"inline\": true}
                    ],
                    \"timestamp\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\"
                }]
            }" > /dev/null 2>&1 || log_warning "Failed to send Discord notification"
    fi

    # Email notification (requires mailx or sendmail)
    if [[ -n "$EMAIL_RECIPIENTS" ]] && command -v mailx &> /dev/null; then
        log_info "Sending email notification..."

        local email_body="Test ${status}: ${test_type}

Branch: ${branch}
Commit: ${commit}
Duration: ${duration}s

Details attached."

        echo "$email_body" | mailx -s "Test ${status}: ${test_type}" "$EMAIL_RECIPIENTS" \
            || log_warning "Failed to send email notification"
    fi
}

###############################################################################
# Scheduling Functions
###############################################################################

# Setup cron jobs for automated testing
setup_scheduling() {
    print_header "Setting Up Test Scheduling"

    log_info "This will set up cron jobs for automated test execution"
    log_warning "Requires sudo privileges"

    echo ""
    echo "Select schedule frequency:"
    echo "  1) Hourly (smoke tests)"
    echo "  2) Daily (quick tests)"
    echo "  3) Weekly (full tests)"
    echo "  4) Custom"
    echo ""
    read -p "Enter choice [1-4]: " choice

    local cron_expr=""
    local test_command=""

    case $choice in
        1)
            cron_expr="0 * * * *"
            test_command="$PROJECT_ROOT/scripts/test-automation.sh smoke"
            ;;
        2)
            cron_expr="0 2 * * *"
            test_command="$PROJECT_ROOT/scripts/test-automation.sh quick"
            ;;
        3)
            cron_expr="0 2 * * 0"
            test_command="$PROJECT_ROOT/scripts/test-automation.sh full"
            ;;
        4)
            read -p "Enter cron expression (e.g., '0 2 * * *'): " cron_expr
            read -p "Enter test command: " test_command
            ;;
        *)
            log_error "Invalid choice"
            return 1
            ;;
    esac

    local crontab_entry="$cron_expr cd $PROJECT_ROOT && $test_command >> $LOGS_DIR/scheduled-tests.log 2>&1"

    log_info "Adding to crontab:"
    echo "$crontab_entry"
    echo ""

    read -p "Add this cron job? (y/N): " confirm

    if [[ "$confirm" == "y" || "$confirm" == "Y" ]]; then
        (crontab -l 2>/dev/null; echo "$crontab_entry") | crontab -
        log_success "Cron job added successfully"
        log_info "View crontab with: crontab -l"
    else
        log_info "Cron job not added"
    fi
}

###############################################################################
# Cleanup Functions
###############################################################################

# Clean test artifacts
clean_artifacts() {
    print_header "Cleaning Test Artifacts"

    log_info "Cleaning old test results..."

    # Remove test results older than 7 days
    find "$TEST_RESULTS_DIR" -name "*.json" -mtime +7 -delete 2>/dev/null || true
    find "$TEST_RESULTS_DIR" -name "*.html" -mtime +7 -delete 2>/dev/null || true

    # Remove test history older than 30 days
    find "$TEST_HISTORY_DIR" -name "*.json" -mtime +30 -delete 2>/dev/null || true

    # Remove old screenshots and videos
    find "$ARTIFACTS_DIR/screenshots" -name "*.png" -mtime +7 -delete 2>/dev/null || true
    find "$ARTIFACTS_DIR/videos" -name "*.webm" -mtime +7 -delete 2>/dev/null || true

    # Remove old logs
    find "$LOGS_DIR" -name "*.log" -mtime +30 -delete 2>/dev/null || true

    log_success "Cleanup completed"
}

# Clean all test data
clean_all() {
    print_header "Cleaning All Test Data"

    log_warning "This will remove all test results, history, and artifacts"
    read -p "Continue? (y/N): " confirm

    if [[ "$confirm" == "y" || "$confirm" == "Y" ]]; then
        rm -rf "$TEST_RESULTS_DIR"/*
        rm -rf "$TEST_HISTORY_DIR"/*
        rm -rf "$ARTIFACTS_DIR"/*
        rm -rf "$COVERAGE_DIR"/*
        log_success "All test data cleaned"
    else
        log_info "Cleanup cancelled"
    fi
}

###############################################################################
# Help Function
###############################################################################

show_help() {
    cat <<EOF
${CYAN}Thai Accounting ERP - Test Automation${NC}

${BLUE}Usage:${NC}
  $0 [command] [options]

${BLUE}Commands:${NC}
  ${GREEN}smoke${NC}         Run smoke tests (critical path only, 2-3 min)
  ${GREEN}quick${NC}         Run quick tests (smoke + critical, 5 min)
  ${GREEN}full${NC}          Run full test suite (15-20 min)
  ${GREEN}module${NC}        Run tests for specific module
  ${GREEN}coverage${NC}      Generate coverage report
  ${GREEN}schedule${NC}      Set up automated test scheduling (cron)
  ${GREEN}report${NC}        Generate test report from last run
  ${GREEN}notify${NC}        Send test notifications
  ${GREEN}clean${NC}         Clean old test artifacts
  ${GREEN}clean-all${NC}     Clean all test data
  ${GREEN}help${NC}          Show this help message

${BLUE}Options:${NC}
  ${YELLOW}--debug${NC}       Enable debug output
  ${YELLOW}--no-notify${NC}   Skip notifications
  ${YELLOW}--no-server${NC}   Skip server management

${BLUE}Examples:${NC}
  $0 smoke
  $0 module invoices
  $0 full --debug
  $0 schedule

${BLUE}Environment Variables:${NC}
  ${YELLOW}PARALLEL_WORKERS${NC}    Number of parallel workers (default: 4)
  ${YELLOW}TEST_TIMEOUT${NC}        Test timeout in ms (default: 60000)
  ${YELLOW}RETRY_COUNT${NC}         Test retry count (default: 2)
  ${YELLOW}SLACK_WEBHOOK_URL${NC}   Slack webhook for notifications
  ${YELLOW}DISCORD_WEBHOOK_URL${NC}  Discord webhook for notifications
  ${YELLOW}EMAIL_RECIPIENTS${NC}     Email recipients for notifications

${BLUE}Test Artifacts:${NC}
  Results:     $TEST_RESULTS_DIR
  History:     $TEST_HISTORY_DIR
  Coverage:    $COVERAGE_DIR
  Artifacts:   $ARTIFACTS_DIR
  Logs:        $LOGS_DIR

EOF
}

###############################################################################
# Main Function
###############################################################################

main() {
    local command=${1:-help}
    local notify=true

    # Parse arguments
    shift || true
    while [[ $# -gt 0 ]]; do
        case $1 in
            --debug)
                export DEBUG=true
                shift
                ;;
            --no-notify)
                notify=false
                shift
                ;;
            *)
                shift
                ;;
        esac
    done

    # Execute command
    case $command in
        smoke)
            run_smoke_tests
            local exit_code=$?
            [[ "$notify" == "true" ]] && send_notification "smoke" $exit_code 0
            exit $exit_code
            ;;
        quick)
            run_quick_tests
            local exit_code=$?
            [[ "$notify" == "true" ]] && send_notification "quick" $exit_code 0
            exit $exit_code
            ;;
        full)
            run_full_tests
            local exit_code=$?
            [[ "$notify" == "true" ]] && send_notification "full" $exit_code 0
            exit $exit_code
            ;;
        module)
            run_module_tests "$2"
            local exit_code=$?
            [[ "$notify" == "true" ]] && send_notification "module-$2" $exit_code 0
            exit $exit_code
            ;;
        coverage)
            run_coverage_tests
            exit $?
            ;;
        schedule)
            setup_scheduling
            exit $?
            ;;
        report)
            generate_test_report "custom" 0 0
            exit $?
            ;;
        notify)
            send_notification "${2:-custom}" 0 0
            exit $?
            ;;
        clean)
            clean_artifacts
            exit $?
            ;;
        clean-all)
            clean_all
            exit $?
            ;;
        help|--help|-h)
            show_help
            exit 0
            ;;
        *)
            log_error "Unknown command: $command"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# Trap cleanup on exit
trap 'stop_server' EXIT INT TERM

# Run main function
main "$@"
