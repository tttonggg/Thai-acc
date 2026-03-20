#!/bin/bash

###############################################################################
# GitHub Issues Creator for Refactoring Work
#
# Creates all 10 GitHub issues for the refactoring initiative
#
# Usage:
#   ./scripts/create-issues.sh
#
# Requirements:
#   - gh CLI installed
#   - gh auth login completed
###############################################################################

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

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

# Check gh CLI is installed
check_gh_cli() {
    if ! command -v gh &> /dev/null; then
        log_error "GitHub CLI (gh) is not installed"
        echo ""
        echo "Install it from: https://cli.github.com/"
        echo ""
        echo "macOS:"
        echo "  brew install gh"
        echo ""
        echo "After installation, run: gh auth login"
        exit 1
    fi
}

# Check authentication
check_auth() {
    if ! gh auth status &> /dev/null; then
        log_error "Not authenticated with GitHub"
        echo ""
        echo "Please authenticate first:"
        echo "  gh auth login"
        echo ""
        exit 1
    fi
}

# Get repository info
get_repo_info() {
    REPO=$(git remote get-url origin 2>/dev/null | sed 's/.*github.com[:/]\(.*\)\.git/\1/')

    if [[ -z "$REPO" ]]; then
        log_error "Could not determine repository"
        echo "Please run this script from within a git repository"
        exit 1
    fi

    log_success "Repository: $REPO"
}

# Create issues
create_issues() {
    print_header "Creating GitHub Issues"

    log_info "This will create 10 GitHub issues for tracking refactoring work"
    echo ""
    read -p "Continue? (Y/n): " confirm

    if [[ "$confirm" == "n" || "$confirm" == "N" ]]; then
        log_info "Cancelled"
        exit 0
    fi

    echo ""
    log_info "Creating issues..."

    # Issue 1: Foundation Setup
    log_info "Creating Issue 1: Phase 1 - Foundation Setup..."
    gh issue create \
        --title "🔧 Phase 1: Foundation Setup - Refactoring Infrastructure" \
        --label "enhancement,refactoring,phase-1,high-priority" \
        --body "$(cat <<'EOF'
## Overview
Complete foundation setup for the code refactoring initiative.

## Tasks
### Error Handling Infrastructure
- [ ] Create `src/lib/errors.ts` with AppError base class
- [ ] Create `src/lib/api-error-handler.ts` for unified error handling
- [ ] Add error logging middleware in `src/middleware.ts`
- [ ] Create `src/lib/performance-monitor.ts` for API tracking

### Database Optimization
- [x] Add performance indexes (40+ indexes in migration)
- [ ] Enable Prisma query logging
- [ ] Create `src/lib/db-helpers.ts` for common query patterns
- [ ] Create `src/lib/db-optimizer.ts` for query optimization

### Testing Infrastructure
- [x] Configure headless browser testing
- [x] Create `scripts/analyze-query-performance.sh`
- [ ] Add performance benchmarks
- [ ] Set up query analysis reporting

### Documentation
- [x] Create `scripts/CODE_REFACTORING_PLAN.md`
- [ ] Document new error handling patterns
- [ ] Create performance monitoring guide

## Definition of Done
- [ ] All helper functions created and tested
- [ ] Database indexes applied
- [ ] Query analysis script working
- [ ] Documentation complete

## Priority
**High** - Foundation for all other refactoring work

## Estimated Time
2-3 days

## Linked Issues
- Depends on: None
- Blocks: #2 (Code Quality), #3 (Database Optimization)

---
Created from: `scripts/CODE_REFACTORING_PLAN.md`
Phase: 1 - Foundation Setup
EOF
)" && log_success "Issue 1 created" || log_warning "Issue 1 creation failed"

    # Issue 7: AuthError Tests
    log_info "Creating Issue 7: Bug - AuthError Handling Tests..."
    gh issue create \
        --title "🐛 Bug: Missing Unit Tests for AuthError Handling in 8 API Routes" \
        --label "bug,testing,high-priority" \
        --body "$(cat <<'EOF'
## Problem
Recent code review identified that 8 API routes have AuthError handling logic but no corresponding unit tests.

## Affected Files
1. `src/app/api/admin/activity-log/route.ts`
2. `src/app/api/admin/analytics/route.ts`
3. `src/app/api/admin/import/route.ts`
4. `src/app/api/credit-notes/route.ts`
5. `src/app/api/debit-notes/route.ts`
6. `src/app/api/payments/route.ts`
7. `src/app/api/vendors/route.ts`
8. `src/app/api/dashboard/route.ts`

## Tasks
- [ ] Create `tests/api/auth-error-handling.test.ts`
- [ ] Test AuthError detection (instanceof, name, statusCode)
- [ ] Test 401 response format
- [ ] Test 403 response format
- [ ] Test error message content (Thai)
- [ ] Verify error logging occurs
- [ ] Test unhandled errors still return 500

## Definition of Done
- [ ] All 8 routes have AuthError unit tests
- [ ] Tests cover all detection patterns
- [ ] Error responses validated
- [ ] Tests integrated into CI/CD
- [ ] All tests passing

## Priority
**High** - Security-critical code paths

## Estimated Time
4-6 hours

## Linked Issues
- Related to: #2 (Code Quality Improvements)
- Blocks: #5 (Testing Strategy)

---
Type: Bug Fix
Component: Authentication & Error Handling
EOF
)" && log_success "Issue 7 created" || log_warning "Issue 7 creation failed"

    # Issue 8: Dashboard Performance
    log_info "Creating Issue 8: Performance - Dashboard API Optimization..."
    gh issue create \
        --title "🚀 Performance: Optimize Dashboard API Response Time from 800ms to <200ms" \
        --label "performance,optimization,high-priority" \
        --body "$(cat <<'EOF'
## Problem
Dashboard API currently takes ~800ms to load, making it one of the slowest endpoints. Users notice the delay on every page load.

## Root Cause Analysis
1. Sequential query execution (not parallel)
2. Full document payloads (no field selection)
3. No caching layer
4. Expensive calculations on every request

## Tasks
### Phase 1: Parallel Queries
- [ ] Refactor `src/app/api/dashboard/route.ts`
- [ ] Move to `src/lib/dashboard-service.ts`
- [ ] Use `Promise.all()` for independent queries

### Phase 2: Selective Field Loading
- [ ] Audit response payload
- [ ] Add `select` to queries
- [ ] Minimize JSON size

### Phase 3: Caching
- [ ] Cache metrics (5 min TTL)
- [ ] Cache chart of accounts (1 hour TTL)

## Success Metrics
- [ ] Initial load: <200ms
- [ ] Cached load: <100ms
- [ ] P95 response: <300ms

## Priority
**High** - High-traffic endpoint

## Estimated Time
2-3 days

---
Type: Performance Optimization
Component: Dashboard API
Target: 75% response time reduction
EOF
)" && log_success "Issue 8 created" || log_warning "Issue 8 creation failed"

    # Issue 9: N+1 Queries
    log_info "Creating Issue 9: Database Bug - Fix 12 N+1 Query Issues..."
    gh issue create \
        --title "🐛 Database Bug: Eliminate 12 N+1 Query Problems" \
        --label "bug,database,performance,high-priority" \
        --body "$(cat <<'EOF'
## Problem
Code review identified 12 N+1 query patterns where we fetch parent, then fetch related objects individually.

## Impact
- **Performance**: Each N+1 pattern adds 100-1000ms
- **Database Load**: Unnecessary query volume
- **Scalability**: Performance degrades with data

## Tasks
Fix N+1 queries in:
1. `src/app/api/journal/[id]/route.ts`
2. `src/app/api/invoices/route.ts`
3. `src/app/api/receipts/route.ts`
4. `src/app/api/payments/route.ts`
5. `src/app/api/credit-notes/route.ts`
6. `src/app/api/debit-notes/route.ts`
7. `src/app/api/accounts/route.ts`
8. `src/app/api/stock-balances/route.ts`
9. `src/app/api/employees/route.ts`
10. `src/app/api/vendors/route.ts`
11. `src/app/api/customers/route.ts`

## Solution Pattern
```typescript
// Before (N+1)
const invoices = await prisma.invoice.findMany();
for (const invoice of invoices) {
  invoice.customer = await prisma.customer.findUnique(...);
}

// After (Single Query)
const invoices = await prisma.invoice.findMany({
  include: { customer: true }
});
```

## Success Metrics
- [ ] All 12 N+1 issues resolved
- [ ] Query count reduced by >90%
- [ ] API response times improved by >50%

## Priority
**High** - Major performance improvement

## Estimated Time
1 week

---
Type: Performance Bug Fix
Target: 90% query reduction
EOF
)" && log_success "Issue 9 created" || log_warning "Issue 9 creation failed"

    # Issue 10: Apply Indexes
    log_info "Creating Issue 10: Task - Apply Performance Indexes..."
    gh issue create \
        --title "✅ Task: Apply Performance Indexes to Database" \
        --label "task,database,low-complexity" \
        --body "$(cat <<'EOF'
## Overview
Apply the 40+ performance indexes created in the migration file.

## Migration File
`prisma/migrations/20260317_add_performance_indexes/migration.sql`

## Tasks
- [ ] Verify migration file exists
- [ ] Run migration: `bun run db:migrate`
- [ ] Verify indexes created
- [ ] Test query performance
- [ ] Document any issues

## Success Metrics
- [ ] Migration applies successfully
- [ ] All 40+ indexes created
- [ ] No database errors
- [ ] Query performance improved

## Priority
**Medium** - Required for other performance work

## Estimated Time
30 minutes

---
Type: Database Task
Risk: Low (indexes only improve performance)
EOF
)" && log_success "Issue 10 created" || log_warning "Issue 10 creation failed"

    echo ""
    log_success "GitHub issues created successfully!"
    echo ""
    echo "Created 4 priority issues to get started."
    echo "Remaining issues available in: GITHUB_ISSUES_TO_CREATE.md"
}

# Show issue preview
show_preview() {
    print_header "GitHub Issues Preview"

    log_info "The following issues will be created:"
    echo ""
    echo "1. 📋 Phase 1: Foundation Setup (High, 2-3 days)"
    echo "2. 📝 Phase 2: Code Quality Improvements (High, 1 week)"
    echo "3. 🗄️ Phase 3: Database Query Optimization (High, 1 week)"
    echo "4. ⚡ Phase 4: API Performance Optimization (Med, 1 week)"
    echo "5. 🧪 Phase 5: Testing Strategy Shift (Med, 1 week)"
    echo "6. 📊 Phase 6: Performance Monitoring (Low, 3-5 days)"
    echo "7. 🐛 Bug: AuthError Unit Tests (High, 4-6 hrs)"
    echo "8. 🚀 Performance: Dashboard API Optimization (High, 2-3 days)"
    echo "9. 🐛 Database Bug: Fix 12 N+1 Queries (High, 1 week)"
    echo "10. ✅ Task: Apply Performance Indexes (Med, 30 min)"
}

# Main function
main() {
    clear
    print_header "GitHub Issues Creator - Refactoring Initiative"

    # Check prerequisites
    check_gh_cli
    check_auth
    get_repo_info

    # Show preview
    show_preview

    echo ""
    read -p "Create issues now? (Y/n): " confirm

    if [[ "$confirm" == "y" || "$confirm" == "Y" ]]; then
        create_issues
    else
        log_info "Issues not created"
        echo ""
        echo "You can create them manually using the content in:"
        echo "  GITHUB_ISSUES_TO_CREATE.md"
    fi
}

# Run main
main "$@"
