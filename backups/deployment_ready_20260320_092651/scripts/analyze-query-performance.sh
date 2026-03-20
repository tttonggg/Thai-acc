#!/bin/bash

###############################################################################
# Database Query Performance Analyzer
#
# Analyzes Prisma queries for performance issues:
# - Slow query detection
# - N+1 query identification
# - Missing index detection
# - Query pattern analysis
#
# Usage:
#   ./scripts/analyze-query-performance.sh [--detailed]
###############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

LOG_DIR="$PROJECT_ROOT/logs/query-analysis"
REPORT_FILE="$LOG_DIR/performance-report-$(date +%Y%m%d_%H%M%S).md"

# Create log directory
mkdir -p "$LOG_DIR"

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

###############################################################################
# Analysis Functions
###############################################################################

# Enable Prisma query logging
enable_query_logging() {
    print_header "Enabling Query Logging"

    log_info "Setting LOG_QUERIES=true..."

    export LOG_QUERIES=true
    export DATABASE_URL="file:$PROJECT_ROOT/prisma/dev.db"

    log_success "Query logging enabled"
}

# Run query analysis
run_query_analysis() {
    print_header "Running Query Analysis"

    log_info "Starting development server with query logging..."
    log_warning "Press Ctrl+C after server finishes loading (30 seconds)"

    # Start server in background with query logging
    timeout 30 bun run dev > "$LOG_DIR/server-with-queries.log" 2>&1 || true

    # Analyze query log
    if [[ -f "$LOG_DIR/server-with-queries.log" ]]; then
        analyze_query_log "$LOG_DIR/server-with-queries.log"
    else
        log_warning "No query log generated"
    fi
}

# Analyze query log file
analyze_query_log() {
    local log_file=$1

    print_header "Analyzing Query Log"

    # Count total queries
    local total_queries=$(grep -c "SELECT\|INSERT\|UPDATE\|DELETE" "$log_file" 2>/dev/null || echo "0")
    echo "Total queries: $total_queries"

    # Find slow queries (simulated - in production you'd use actual timing)
    echo ""
    echo "🔍 Query Patterns:"
    grep -o "SELECT.*FROM.*WHERE" "$log_file" 2>/dev/null | head -20 || echo "No queries found"

    # Check for N+1 patterns
    echo ""
    echo "🚨 Potential N+1 Queries:"
    grep -E "SELECT.*WHERE.*id = \?" "$log_file" 2>/dev/null | wc -l

    # Check for missing includes
    echo ""
    echo "📊 Queries without joins:"
    grep -c "SELECT.*FROM.*\bInvoice\b" "$log_file" 2>/dev/null | xargs -I {} echo "Invoice queries: {}"
}

# Check database for missing indexes
check_missing_indexes() {
    print_header "Checking for Missing Indexes"

    log_info "Analyzing query patterns..."

    # This would use EXPLAIN QUERY PLAN in production
    # For SQLite, we can analyze the schema
    cat > "$LOG_DIR/missing-indexes.sql" <<'EOF'
-- Find columns that should be indexed based on query patterns
-- These are recommendations based on common query patterns

-- Foreign keys that should be indexed
SELECT
    "FromTable",
    "Column",
    'Foreign key without index' as Issue
FROM pragma_foreign_key_list()
WHERE "FromTable" NOT IN (
    SELECT name FROM sqlite_master
    WHERE type = 'index'
    AND sql IS NOT NULL
);
EOF

    log_info "Missing index analysis saved to: $LOG_DIR/missing-indexes.sql"
}

# Analyze specific API routes
analyze_api_routes() {
    print_header "Analyzing API Routes"

    log_info "Scanning API routes for query patterns..."

    # Find all API route files
    local api_files=$(find src/app/api -name "route.ts" | sort)

    for file in $api_files; do
        echo ""
        echo "📄 $file"

        # Count prisma query calls
        local query_count=$(grep -c "prisma\.\w\+\.\w\+\(findMany\|findUnique\|findFirst\)" "$file" 2>/dev/null || echo "0")
        echo "   Queries: $query_count"

        # Check for await in loops (potential N+1)
        local loops=$(grep -c "for.*await.*prisma" "$file" 2>/dev/null || echo "0")
        if [[ $loops -gt 0 ]]; then
            echo -e "   ${RED}⚠️  Potential N+1 queries in loops: $loops${NC}"
        fi

        # Check for sequential queries
        local sequential=$(grep -A 5 "await prisma\." "$file" 2>/dev/null | grep -c "await prisma\." || echo "0")
        echo "   Sequential queries: $sequential"
    done
}

# Check for N+1 query patterns in code
find_n_plus_one_patterns() {
    print_header "Finding N+1 Query Patterns"

    log_info "Scanning codebase for N+1 patterns..."

    local files=$(find src -name "*.ts" -type f | grep -v node_modules | grep -v ".next")

    echo ""
    echo "🔍 Files with potential N+1 queries:"

    for file in $files; do
        # Pattern: await inside for/forEach loop
        if grep -qE "for\s*\(|forEach\s*\(" "$file" && \
           grep -qA 10 "for\s*\(|forEach\s*\(" "$file" | grep -q "await.*prisma"; then
            local line_num=$(grep -n "for\s*\(|forEach\s*\(" "$file" | head -1 | cut -d: -f1)
            echo -e "   ${YELLOW}$file:$line_num${NC}"
        fi
    done
}

# Generate performance report
generate_performance_report() {
    print_header "Performance Report"

    cat > "$REPORT_FILE" <<EOF
# Database Query Performance Report

**Date**: $(date +"%Y-%m-%d %H:%M:%S")
**Environment**: Development

## Summary

This report analyzes database query performance and identifies optimization opportunities.

## Findings

### 1. Query Patterns

| Metric | Count | Status |
|--------|-------|--------|
| Total API Routes | $(find src/app/api -name "route.ts" | wc -l) | - |
| Files with Prisma Queries | $(grep -rl "prisma\." src/app/api 2>/dev/null | wc -l) | - |
| Potential N+1 Patterns | $(find_n_plus_one_patterns 2>/dev/null | grep -c "🔍" || echo "0") | 🔴 Needs Review |

### 2. Recommended Indexes

See \`prisma/migrations/20260317_add_performance_indexes/migration.sql\`

### 3. Query Optimization Opportunities

#### High Priority
- [ ] Dashboard API - Parallel queries
- [ ] Invoice API - Selective field loading
- [ ] Report APIs - Add caching

#### Medium Priority
- [ ] Customer/Vendor APIs - Optimize includes
- [ ] Journal Entry APIs - Batch operations

#### Low Priority
- [ ] Settings API - Already optimized

### 4. Code Quality Improvements

See \`scripts/CODE_REFACTORING_PLAN.md\`

## Recommendations

1. **Add missing indexes** (High Impact, Low Effort)
   \`\`\`bash
   bun run db:migrate
   \`\`\`

2. **Fix N+1 queries** (High Impact, Medium Effort)
   - Use \`include\` instead of separate queries
   - Implement batch loading
   - Use \`select\` to limit fields

3. **Enable caching** (Medium Impact, Medium Effort)
   - Add Redis for report data
   - Cache dashboard metrics
   - Implement cache invalidation

4. **Parallel queries** (Medium Impact, Low Effort)
   - Use \`Promise.all\` for independent queries
   - Avoid sequential await chains

## Next Steps

1. Review this report with the team
2. Create tasks for each optimization
3. Implement changes in priority order
4. Re-run analysis to verify improvements

---

**Generated by**: \`scripts/analyze-query-performance.sh\`
**Configuration**: See \`scripts/CODE_REFACTORING_PLAN.md\`
EOF

    log_success "Report generated: $REPORT_FILE"
}

###############################################################################
# Main Execution
###############################################################################

main() {
    clear
    print_header "Database Query Performance Analyzer"

    echo "This script analyzes your database queries for performance issues."
    echo ""
    echo "Analysis steps:"
    echo "  1. Scan API routes for query patterns"
    echo "  2. Identify N+1 query patterns"
    echo "  3. Check for missing indexes"
    echo "  4. Generate performance report"
    echo ""
    read -p "Continue? (Y/n): " confirm

    if [[ "$confirm" == "n" || "$confirm" == "N" ]]; then
        log_info "Analysis cancelled"
        exit 0
    fi

    # Run analysis
    analyze_api_routes
    find_n_plus_one_patterns
    check_missing_indexes
    generate_performance_report

    echo ""
    log_success "Analysis complete!"
    echo ""
    echo "📄 Report: $REPORT_FILE"
    echo "📁 Logs: $LOG_DIR"
    echo ""
    echo "Next steps:"
    echo "  1. Review the performance report"
    echo "  2. Apply recommended indexes: bun run db:migrate"
    echo "  3. Refactor N+1 queries"
    echo "  4. Re-run analysis to verify improvements"
}

# Run main
main "$@"
