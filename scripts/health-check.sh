#!/bin/bash

###############################################################################
# Thai Accounting ERP - Production Health Check Script
# Purpose: Monitor application health and performance
###############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
APP_URL="${APP_URL:-http://localhost:3000}"
PRODUCTION_DIR="/opt/thai-accounting"
DB_NAME="dev.db"
LOG_DIR="/var/log/thai-accounting"
PID_FILE="/var/run/thai-accounting.pid"

# Health check thresholds
MAX_RESPONSE_TIME=5000  # 5 seconds
MAX_DISK_USAGE=90       # 90%
MAX_MEMORY_USAGE=90     # 90%
MIN_DISK_SPACE=500      # 500MB

###############################################################################
# Functions
###############################################################################

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
}

check_service_running() {
    log_info "Checking if service is running..."
    
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p "$PID" > /dev/null 2>&1; then
            log_success "Service is running (PID: $PID)"
            return 0
        else
            log_error "PID file exists but process not running"
            return 1
        fi
    else
        log_error "Service is not running (no PID file)"
        return 1
    fi
}

check_port_listening() {
    log_info "Checking if port 3000 is listening..."
    
    if command -v netstat &> /dev/null; then
        if netstat -tuln 2>/dev/null | grep -q ":3000 "; then
            log_success "Port 3000 is listening"
            return 0
        else
            log_error "Port 3000 not listening"
            return 1
        fi
    elif command -v ss &> /dev/null; then
        if ss -tuln 2>/dev/null | grep -q ":3000 "; then
            log_success "Port 3000 is listening"
            return 0
        else
            log_error "Port 3000 not listening"
            return 1
        fi
    else
        log_warning "Cannot check port (netstat/ss not available)"
        return 0
    fi
}

check_web_response() {
    log_info "Checking web server response..."
    
    if command -v curl &> /dev/null; then
        START_TIME=$(date +%s%3N)
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL" --max-time 10)
        END_TIME=$(date +%s%3N)
        RESPONSE_TIME=$((END_TIME - START_TIME))
        
        if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "304" ]; then
            log_success "Web server responding (HTTP $HTTP_CODE, ${RESPONSE_TIME}ms)"
            
            if [ "$RESPONSE_TIME" -gt "$MAX_RESPONSE_TIME" ]; then
                log_warning "Response time exceeds threshold (${RESPONSE_TIME}ms > ${MAX_RESPONSE_TIME}ms)"
            fi
            
            return 0
        else
            log_error "Web server not responding (HTTP $HTTP_CODE)"
            return 1
        fi
    else
        log_warning "curl not available, skipping web check"
        return 0
    fi
}

check_database() {
    log_info "Checking database..."
    
    if [ ! -f "$PRODUCTION_DIR/$DB_NAME" ]; then
        log_error "Database not found at: $PRODUCTION_DIR/$DB_NAME"
        return 1
    fi
    
    # Check database file is not corrupted
    if ! sqlite3 "$PRODUCTION_DIR/$DB_NAME" "SELECT COUNT(*) FROM User" > /dev/null 2>&1; then
        log_error "Database is corrupted"
        return 1
    fi
    
    # Get database stats
    DB_SIZE=$(du -h "$PRODUCTION_DIR/$DB_NAME" | cut -f1)
    USER_COUNT=$(sqlite3 "$PRODUCTION_DIR/$DB_NAME" "SELECT COUNT(*) FROM User")
    ACCOUNT_COUNT=$(sqlite3 "$PRODUCTION_DIR/$DB_NAME" "SELECT COUNT(*) FROM ChartOfAccount")
    
    log_success "Database is healthy (${DB_SIZE})"
    log_info "  • Users: $USER_COUNT"
    log_info "  • Chart of Accounts: $ACCOUNT_COUNT"
    
    return 0
}

check_disk_space() {
    log_info "Checking disk space..."
    
    # Get disk usage percentage
    DISK_USAGE=$(df "$PRODUCTION_DIR" | awk 'NR==2{print $5}' | sed 's/%//')
    
    if [ "$DISK_USAGE" -gt "$MAX_DISK_USAGE" ]; then
        log_error "Disk usage critically high (${DISK_USAGE}% > ${MAX_DISK_USAGE}%)"
        return 1
    elif [ "$DISK_USAGE" -gt 80 ]; then
        log_warning "Disk usage high (${DISK_USAGE}%)"
    else
        log_success "Disk usage OK (${DISK_USAGE}%)"
    fi
    
    # Get available disk space
    DISK_AVAILABLE=$(df -m "$PRODUCTION_DIR" | awk 'NR==2{print $4}')
    
    if [ "$DISK_AVAILABLE" -lt "$MIN_DISK_SPACE" ]; then
        log_error "Insufficient disk space (${DISK_AVAILABLE}MB < ${MIN_DISK_SPACE}MB)"
        return 1
    fi
    
    log_info "  • Available: ${DISK_AVAILABLE}MB"
    
    return 0
}

check_memory_usage() {
    log_info "Checking memory usage..."
    
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        
        if command -v ps &> /dev/null; then
            # Get memory usage in MB
            MEM_USAGE=$(ps -o rss= -p "$PID" | awk '{print int($1/1024)}')
            
            if [ -n "$MEM_USAGE" ]; then
                log_info "  • Memory: ${MEM_USAGE}MB"
                
                # Get total system memory
                if [ -f /proc/meminfo ]; then
                    TOTAL_MEM=$(grep MemTotal /proc/meminfo | awk '{print int($2/1024)}')
                    MEM_PERCENT=$((MEM_USAGE * 100 / TOTAL_MEM))
                    
                    if [ "$MEM_PERCENT" -gt "$MAX_MEMORY_USAGE" ]; then
                        log_error "Memory usage critically high (${MEM_PERCENT}%)"
                        return 1
                    elif [ "$MEM_PERCENT" -gt 70 ]; then
                        log_warning "Memory usage high (${MEM_PERCENT}%)"
                    else
                        log_success "Memory usage OK (${MEM_PERCENT}%)"
                    fi
                fi
            fi
        fi
    fi
    
    return 0
}

check_logs_for_errors() {
    log_info "Checking recent logs for errors..."
    
    if [ -f "$LOG_DIR/production.log" ]; then
        # Check last 50 lines for errors
        ERROR_COUNT=$(tail -n 50 "$LOG_DIR/production.log" | grep -ci "error" || true)
        
        if [ "$ERROR_COUNT" -gt 10 ]; then
            log_warning "Found $ERROR_COUNT error(s) in recent logs"
        elif [ "$ERROR_COUNT" -gt 0 ]; then
            log_info "Found $ERROR_COUNT error(s) in recent logs"
        else
            log_success "No errors in recent logs"
        fi
    else
        log_warning "Log file not found: $LOG_DIR/production.log"
    fi
    
    return 0
}

check_api_endpoints() {
    log_info "Checking critical API endpoints..."
    
    ENDPOINTS=(
        "/api/accounts"
        "/api/users"
    )
    
    ALL_OK=true
    
    for endpoint in "${ENDPOINTS[@]}"; do
        if command -v curl &> /dev/null; then
            HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${APP_URL}${endpoint}" --max-time 5)
            
            if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "401" ]; then
                log_success "$endpoint (HTTP $HTTP_CODE)"
            else
                log_error "$endpoint (HTTP $HTTP_CODE)"
                ALL_OK=false
            fi
        fi
    done
    
    if [ "$ALL_OK" = true ]; then
        return 0
    else
        return 1
    fi
}

generate_health_report() {
    OVERALL_STATUS=$1
    
    echo ""
    echo "========================================="
    echo "  Health Check Report"
    echo "========================================="
    echo "Date: $(date '+%Y-%m-%d %H:%M:%S')"
    echo "Application: Thai Accounting ERP"
    echo "URL: $APP_URL"
    echo ""
    echo "Status: $OVERALL_STATUS"
    echo ""
    echo "Checks Performed:"
    echo "  • Service Status"
    echo "  • Port Listening"
    echo "  • Web Response"
    echo "  • Database Health"
    echo "  • Disk Space"
    echo "  • Memory Usage"
    echo "  • Log Errors"
    echo "  • API Endpoints"
    echo ""
    echo "========================================="
}

###############################################################################
# Main Health Check Flow
###############################################################################

main() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  Thai Accounting ERP - Health Check${NC}"
    echo -e "${BLUE}========================================${NC}\n"
    
    FAILED_CHECKS=0
    
    # Run all checks
    check_service_running || ((FAILED_CHECKS++))
    check_port_listening || ((FAILED_CHECKS++))
    check_web_response || ((FAILED_CHECKS++))
    check_database || ((FAILED_CHECKS++))
    check_disk_space || ((FAILED_CHECKS++))
    check_memory_usage || ((FAILED_CHECKS++))
    check_logs_for_errors || ((FAILED_CHECKS++))
    check_api_endpoints || ((FAILED_CHECKS++))
    
    # Generate overall status
    if [ "$FAILED_CHECKS" -eq 0 ]; then
        OVERALL_STATUS="${GREEN}HEALTHY${NC}"
        EXIT_CODE=0
    elif [ "$FAILED_CHECKS" -le 2 ]; then
        OVERALL_STATUS="${YELLOW}WARNING${NC}"
        EXIT_CODE=1
    else
        OVERALL_STATUS="${RED}CRITICAL${NC}"
        EXIT_CODE=2
    fi
    
    generate_health_report "$OVERALL_STATUS"
    
    exit $EXIT_CODE
}

# Run main function
main "$@"
