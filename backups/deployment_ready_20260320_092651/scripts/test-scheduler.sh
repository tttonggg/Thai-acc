#!/bin/bash

###############################################################################
# Thai Accounting ERP - Test Scheduling Script
#
# Sets up automated test scheduling using cron jobs
#
# Features:
# - Hourly smoke tests
# - Daily quick tests
# - Weekly full tests
# - Monthly coverage reports
# - Custom schedules
###############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Project paths
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
AUTOMATION_SCRIPT="$PROJECT_ROOT/scripts/test-automation.sh"
LOGS_DIR="$PROJECT_ROOT/logs/scheduled"
SCHEDULER_CONFIG="$PROJECT_ROOT/.test-scheduler.conf"

# Ensure logs directory exists
mkdir -p "$LOGS_DIR"

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
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}  $1${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
    echo ""
}

# Check if automation script exists
check_automation_script() {
    if [[ ! -f "$AUTOMATION_SCRIPT" ]]; then
        log_error "Test automation script not found: $AUTOMATION_SCRIPT"
        return 1
    fi

    if [[ ! -x "$AUTOMATION_SCRIPT" ]]; then
        log_warning "Automation script is not executable"
        read -p "Make it executable? (y/N): " confirm
        if [[ "$confirm" == "y" || "$confirm" == "Y" ]]; then
            chmod +x "$AUTOMATION_SCRIPT"
            log_success "Made executable"
        else
            return 1
        fi
    fi

    return 0
}

# List current cron jobs
list_current_jobs() {
    print_header "Current Scheduled Tests"

    log_info "Current crontab entries for test automation:"
    echo ""

    if crontab -l 2>/dev/null | grep -q "test-automation"; then
        crontab -l 2>/dev/null | grep "test-automation" | while read -r line; do
            local cron_expr=$(echo "$line" | awk '{print $1, $2, $3, $4, $5}')
            local command=$(echo "$line" | cut -d' ' -f6-)
            local test_type=$(echo "$command" | grep -oP '(smoke|quick|full|module|coverage)' || echo "unknown")

            echo -e "${GREEN}✓${NC} $cron_expr → $test_type"
        done
    else
        log_info "No test automation jobs scheduled"
    fi

    echo ""
}

# Add a cron job
add_cron_job() {
    local schedule=$1
    local test_type=$2
    local description=$3

    log_info "Adding cron job: $description"
    log_info "Schedule: $schedule"
    log_info "Test type: $test_type"

    local cron_entry="$schedule $AUTOMATION_SCRIPT $test_type >> $LOGS_DIR/${test_type}_scheduled.log 2>&1"

    # Add to crontab
    (crontab -l 2>/dev/null; echo "$cron_entry") | crontab -

    log_success "Cron job added successfully"

    # Save to config
    echo "$schedule|$test_type|$description|$(date +%s)" >> "$SCHEDULER_CONFIG"
}

# Remove a cron job
remove_cron_job() {
    local test_type=$1

    log_info "Removing cron job for: $test_type"

    # Remove from crontab
    crontab -l 2>/dev/null | grep -v "test-automation.*$test_type" | crontab -

    # Remove from config
    if [[ -f "$SCHEDULER_CONFIG" ]]; then
        grep -v "|$test_type|" "$SCHEDULER_CONFIG" > "${SCHEDULER_CONFIG}.tmp"
        mv "${SCHEDULER_CONFIG}.tmp" "$SCHEDULER_CONFIG"
    fi

    log_success "Cron job removed"
}

# Setup predefined schedules
setup_predefined_schedules() {
    print_header "Setup Predefined Schedules"

    echo "Select schedule presets to add:"
    echo ""
    echo "  [1] Hourly smoke tests (every hour at :00)"
    echo "  [2] Daily quick tests (2 AM)"
    echo "  [3] Weekly full tests (Sunday 3 AM)"
    echo "  [4] Monthly coverage report (1st of month 4 AM)"
    echo "  [5] All of the above"
    echo "  [6] Custom schedule"
    echo ""
    read -p "Enter choice [1-6]: " choice

    case $choice in
        1)
            add_cron_job "0 * * * *" "smoke" "Hourly smoke tests"
            ;;
        2)
            add_cron_job "0 2 * * *" "quick" "Daily quick tests"
            ;;
        3)
            add_cron_job "0 3 * * 0" "full" "Weekly full tests"
            ;;
        4)
            add_cron_job "0 4 1 * *" "coverage" "Monthly coverage report"
            ;;
        5)
            add_cron_job "0 * * * *" "smoke" "Hourly smoke tests"
            add_cron_job "0 2 * * *" "quick" "Daily quick tests"
            add_cron_job "0 3 * * 0" "full" "Weekly full tests"
            add_cron_job "0 4 1 * *" "coverage" "Monthly coverage report"
            ;;
        6)
            custom_schedule
            ;;
        *)
            log_error "Invalid choice"
            return 1
            ;;
    esac
}

# Custom schedule
custom_schedule() {
    print_header "Custom Schedule"

    echo "Create a custom test schedule"
    echo ""

    # Select test type
    echo "Test types:"
    echo "  1) smoke    - Smoke tests (2-3 min)"
    echo "  2) quick    - Quick tests (5 min)"
    echo "  3) full     - Full tests (15-20 min)"
    echo "  4) coverage - Coverage report"
    echo "  5) module   - Module-specific tests"
    echo ""
    read -p "Select test type [1-5]: " test_choice

    case $test_choice in
        1) test_type="smoke" ;;
        2) test_type="quick" ;;
        3) test_type="full" ;;
        4) test_type="coverage" ;;
        5)
            read -p "Enter module name: " module
            test_type="module $module"
            ;;
        *)
            log_error "Invalid choice"
            return 1
            ;;
    esac

    # Cron expression builder
    echo ""
    echo "Build cron expression: minute hour day month weekday"
    echo ""
    echo "Examples:"
    echo "  0 * * * *      - Every hour at :00"
    echo "  0 2 * * *      - Daily at 2 AM"
    echo "  0 */6 * * *    - Every 6 hours"
    echo "  0 2 * * 0      - Weekly on Sunday at 2 AM"
    echo "  0 0 1 * *      - Monthly on 1st at midnight"
    echo ""

    read -p "Enter minute (0-59, *): " minute
    read -p "Enter hour (0-23, *): " hour
    read -p "Enter day (1-31, *): " day
    read -p "Enter month (1-12, *): " month
    read -p "Enter weekday (0-6, *, 0=Sunday): " weekday

    local cron_expr="$minute $hour $day $month $weekday"
    local description="Custom $test_type schedule"

    echo ""
    log_info "Cron expression: $cron_expr"
    log_info "Test type: $test_type"

    read -p "Add this schedule? (y/N): " confirm
    if [[ "$confirm" == "y" || "$confirm" == "Y" ]]; then
        add_cron_job "$cron_expr" "$test_type" "$description"
    else
        log_info "Schedule not added"
    fi
}

# Remove all schedules
remove_all_schedules() {
    print_header "Remove All Schedules"

    log_warning "This will remove all test automation cron jobs"
    read -p "Continue? (y/N): " confirm

    if [[ "$confirm" == "y" || "$confirm" == "Y" ]]; then
        # Remove all test-automation cron jobs
        crontab -l 2>/dev/null | grep -v "test-automation" | crontab -
        log_success "All test schedules removed"

        # Clear config
        rm -f "$SCHEDULER_CONFIG"
    else
        log_info "Removal cancelled"
    fi
}

# View scheduled logs
view_logs() {
    print_header "View Scheduled Test Logs"

    echo "Available log files:"
    echo ""

    if ls "$LOGS_DIR"/*.log 2>/dev/null | sort -r | head -10; then
        echo ""
        read -p "Enter log filename to view (or press Enter to skip): " log_file

        if [[ -n "$log_file" && -f "$LOGS_DIR/$log_file" ]]; then
            less "$LOGS_DIR/$log_file"
        fi
    else
        log_info "No log files found"
    fi
}

# Show test statistics
show_statistics() {
    print_header "Test Statistics"

    log_info "Analyzing scheduled test history..."
    echo ""

    # Count total runs
    local total_runs=$(find "$LOGS_DIR" -name "*.log" 2>/dev/null | wc -l)
    echo "Total scheduled runs: $total_runs"

    # Count by type
    echo ""
    echo "Runs by test type:"
    for type in smoke quick full coverage; do
        local count=$(find "$LOGS_DIR" -name "${type}_scheduled.log" 2>/dev/null | wc -l)
        echo "  - $type: $count"
    done

    # Recent successes/failures
    echo ""
    echo "Recent runs:"
    ls -lt "$LOGS_DIR"/*.log 2>/dev/null | head -5 | while read -r line; do
        local file=$(echo "$line" | awk '{print $NF}')
        local filename=$(basename "$file")

        # Check last line for success/failure
        if [[ -f "$file" ]]; then
            local last_line=$(tail -1 "$file")
            if echo "$last_line" | grep -q "✅"; then
                echo -e "  ${GREEN}✓${NC} $filename"
            elif echo "$last_line" | grep -q "❌"; then
                echo -e "  ${RED}✗${NC} $filename"
            else
                echo -e "  ${YELLOW}?${NC} $filename"
            fi
        fi
    done
}

# Interactive menu
show_menu() {
    clear
    print_header "Test Scheduling Manager"

    echo "Main Menu:"
    echo ""
    echo "  1) List current schedules"
    echo "  2) Add predefined schedules"
    echo "  3) Add custom schedule"
    echo "  4) Remove schedule"
    echo "  5) Remove all schedules"
    echo "  6) View logs"
    echo "  7) Show statistics"
    echo "  8) Exit"
    echo ""
    read -p "Enter choice [1-8]: " choice

    case $choice in
        1)
            list_current_jobs
            ;;
        2)
            check_automation_script && setup_predefined_schedules
            ;;
        3)
            check_automation_script && custom_schedule
            ;;
        4)
            list_current_jobs
            echo ""
            read -p "Enter test type to remove: " test_type
            remove_cron_job "$test_type"
            ;;
        5)
            remove_all_schedules
            ;;
        6)
            view_logs
            ;;
        7)
            show_statistics
            ;;
        8)
            log_info "Goodbye!"
            exit 0
            ;;
        *)
            log_error "Invalid choice"
            ;;
    esac

    echo ""
    read -p "Press Enter to continue..."
}

# Main function
main() {
    # Check if running interactively
    if [[ -t 0 ]]; then
        # Interactive mode
        while true; do
            show_menu
        done
    else
        # Non-interactive mode (for setup)
        case "${1:-help}" in
            list)
                list_current_jobs
                ;;
            setup)
                check_automation_script && setup_predefined_schedules
                ;;
            stats)
                show_statistics
                ;;
            *)
                echo "Usage: $0 [list|setup|stats]"
                exit 1
                ;;
        esac
    fi
}

# Run main
main "$@"
