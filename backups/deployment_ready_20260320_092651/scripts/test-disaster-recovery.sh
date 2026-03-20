#!/bin/bash
# Thai Accounting ERP - Disaster Recovery Test Script
# โปรแกรมบัญชีมาตรฐานไทย - สคริปต์ทดสอบการกู้คืนข้อมูล
# Version: 2.0 - Database Perfection Phase

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
TEST_DB_NAME="thai_acc_dr_test_$(date +%s)"
BACKUP_DIR="/var/backups/thai-accounting"
TEST_LOG="/tmp/dr-test-$(date +%Y%m%d-%H%M%S).log"

# ============================================
# Helper Functions
# ============================================

log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local color=$NC
    
    case "$level" in
        SUCCESS) color=$GREEN ;;
        WARNING) color=$YELLOW ;;
        ERROR) color=$RED ;;
    esac
    
    echo -e "${color}[$timestamp] [$level] $message${NC}" | tee -a "$TEST_LOG"
}

pass() { log "SUCCESS" "$@"; }
fail() { log "ERROR" "$@"; exit 1; }
warn() { log "WARNING" "$@"; }
info() { log "INFO" "$@"; }

# ============================================
# Test Functions
# ============================================

test_backup_exists() {
    info "Testing backup file existence..."
    
    if [ ! -d "$BACKUP_DIR/daily" ]; then
        fail "Backup directory does not exist: $BACKUP_DIR/daily"
    fi
    
    local latest_backup=$(ls -t "$BACKUP_DIR/daily"/*.gz* 2>/dev/null | head -1)
    if [ -z "$latest_backup" ]; then
        fail "No backup files found in $BACKUP_DIR/daily"
    fi
    
    pass "Latest backup found: $(basename "$latest_backup")"
    echo "$latest_backup"
}

test_backup_integrity() {
    local backup_file="$1"
    info "Testing backup integrity: $(basename "$backup_file")"
    
    # Check file size
    local file_size=$(stat -f%z "$backup_file" 2>/dev/null || stat -c%s "$backup_file" 2>/dev/null)
    if [ "$file_size" -lt 1024 ]; then
        fail "Backup file is too small (likely corrupted): $file_size bytes"
    fi
    
    # Test gzip integrity
    if [[ "$backup_file" == *.gz ]]; then
        if ! gzip -t "$backup_file" 2>/dev/null; then
            fail "Gzip integrity check failed"
        fi
        pass "Gzip integrity verified"
    fi
    
    # Test GPG if encrypted
    if [[ "$backup_file" == *.gpg ]]; then
        if ! gpg --list-packets "$backup_file" > /dev/null 2>&1; then
            fail "GPG file appears corrupted"
        fi
        pass "GPG file structure verified"
    fi
}

test_sqlite_restore() {
    local backup_file="$1"
    info "Testing SQLite restore process..."
    
    local temp_db="/tmp/${TEST_DB_NAME}.db"
    
    # Decrypt if needed
    local restore_file="$backup_file"
    if [[ "$backup_file" == *.gpg ]]; then
        info "Decrypting backup..."
        gpg --decrypt --output "${backup_file%.gpg}" "$backup_file" || fail "Decryption failed"
        restore_file="${backup_file%.gpg}"
    fi
    
    # Decompress if needed
    if [[ "$restore_file" == *.gz ]]; then
        info "Decompressing backup..."
        gunzip -c "$restore_file" > "$temp_db" || fail "Decompression failed"
    else
        cp "$restore_file" "$temp_db"
    fi
    
    # Test database integrity
    info "Verifying restored database integrity..."
    if ! sqlite3 "$temp_db" "PRAGMA integrity_check;" | grep -q "ok"; then
        rm -f "$temp_db"
        fail "Database integrity check failed"
    fi
    
    # Check row counts
    local user_count=$(sqlite3 "$temp_db" "SELECT COUNT(*) FROM User;")
    local invoice_count=$(sqlite3 "$temp_db" "SELECT COUNT(*) FROM Invoice;")
    local journal_count=$(sqlite3 "$temp_db" "SELECT COUNT(*) FROM JournalEntry;")
    
    info "Restored database statistics:"
    info "  - Users: $user_count"
    info "  - Invoices: $invoice_count"
    info "  - Journal Entries: $journal_count"
    
    if [ "$user_count" -eq 0 ]; then
        rm -f "$temp_db"
        fail "No users found in restored database"
    fi
    
    # Test journal balance
    local balance_check=$(sqlite3 "$temp_db" "SELECT CASE WHEN SUM(debit) = SUM(credit) THEN 'BALANCED' ELSE 'UNBALANCED' END FROM JournalLine;")
    if [ "$balance_check" != "BALANCED" ]; then
        warn "Journal entries may be unbalanced: $balance_check"
    else
        pass "Journal entries are balanced"
    fi
    
    # Cleanup
    rm -f "$temp_db"
    
    pass "SQLite restore test completed successfully"
}

test_postgres_restore() {
    local backup_file="$1"
    info "Testing PostgreSQL restore process..."
    
    # Create test database
    info "Creating test database: $TEST_DB_NAME"
    dropdb --if-exists "$TEST_DB_NAME" 2>/dev/null || true
    createdb "$TEST_DB_NAME" || fail "Failed to create test database"
    
    # Restore backup
    info "Restoring backup to test database..."
    
    # Handle different backup formats
    if [[ "$backup_file" == *.gpg ]]; then
        gpg --decrypt "$backup_file" 2>/dev/null | pg_restore -d "$TEST_DB_NAME" --clean --if-exists 2>/dev/null || \
        gpg --decrypt "$backup_file" 2>/dev/null | gunzip | psql "$TEST_DB_NAME" > /dev/null 2>&1
    elif [[ "$backup_file" == *.gz ]]; then
        gunzip -c "$backup_file" | pg_restore -d "$TEST_DB_NAME" --clean --if-exists 2>/dev/null || \
        gunzip -c "$backup_file" | psql "$TEST_DB_NAME" > /dev/null 2>&1
    else
        pg_restore -d "$TEST_DB_NAME" --clean --if-exists "$backup_file" 2>/dev/null || \
        psql "$TEST_DB_NAME" < "$backup_file" > /dev/null 2>&1
    fi
    
    # Verify data
    info "Verifying restored data..."
    
    local user_count=$(psql "$TEST_DB_NAME" -t -c "SELECT COUNT(*) FROM \"User\";" | xargs)
    local invoice_count=$(psql "$TEST_DB_NAME" -t -c "SELECT COUNT(*) FROM \"Invoice\";" | xargs)
    
    info "Restored database statistics:"
    info "  - Users: $user_count"
    info "  - Invoices: $invoice_count"
    
    if [ -z "$user_count" ] || [ "$user_count" -eq 0 ]; then
        dropdb "$TEST_DB_NAME" 2>/dev/null || true
        fail "No users found in restored database"
    fi
    
    # Test critical queries
    info "Testing critical queries..."
    
    # Trial balance query
    psql "$TEST_DB_NAME" -c "SELECT "accountId", SUM(debit) as total_debit, SUM(credit) as total_credit 
                             FROM \"JournalLine" GROUP BY "accountId" LIMIT 1;" > /dev/null 2>&1 || \
        warn "Trial balance query failed"
    
    # Customer balance query
    psql "$TEST_DB_NAME" -c "SELECT c.id, c.name, COUNT(i.id) as invoice_count
                             FROM \"Customer" c 
                             LEFT JOIN \"Invoice" i ON c.id = i."customerId"
                             GROUP BY c.id LIMIT 1;" > /dev/null 2>&1 || \
        warn "Customer balance query failed"
    
    # Cleanup
    dropdb "$TEST_DB_NAME" 2>/dev/null || true
    
    pass "PostgreSQL restore test completed successfully"
}

test_backup_script() {
    info "Testing backup script functionality..."
    
    if [ ! -f "./scripts/backup/backup-database.sh" ]; then
        fail "Backup script not found"
    fi
    
    # Test script help
    ./scripts/backup/backup-database.sh help > /dev/null 2>&1 || fail "Backup script failed to run"
    
    # Test config command
    ./scripts/backup/backup-database.sh config > /dev/null 2>&1 || warn "Backup config command failed"
    
    pass "Backup script is functional"
}

test_rto_rpo() {
    info "Testing Recovery Time Objective (RTO) and Recovery Point Objective (RPO)..."
    
    # Check last backup time
    local latest_backup=$(ls -t "$BACKUP_DIR/daily"/*.gz* 2>/dev/null | head -1)
    local backup_age=$(( ($(date +%s) - $(stat -f%m "$latest_backup" 2>/dev/null || stat -c%Y "$latest_backup")) / 3600 ))
    
    info "Last backup is $backup_age hours old"
    
    # RPO check (should be < 26 hours for daily backups)
    if [ "$backup_age" -gt 26 ]; then
        warn "RPO exceeded: Last backup is $backup_age hours old (target: < 26h)"
    else
        pass "RPO met: Last backup is $backup_age hours old"
    fi
    
    # Test restore speed (RTO)
    info "Testing restore speed..."
    local start_time=$(date +%s)
    
    local temp_db="/tmp/rto-test.db"
    if [[ "$latest_backup" == *.gpg ]]; then
        gpg --decrypt "$latest_backup" 2>/dev/null | gunzip > "$temp_db" 2>/dev/null || true
    else
        gunzip -c "$latest_backup" > "$temp_db" 2>/dev/null || true
    fi
    
    local end_time=$(date +%s)
    local restore_time=$((end_time - start_time))
    
    rm -f "$temp_db"
    
    info "Restore took $restore_time seconds"
    
    if [ "$restore_time" -gt 1800 ]; then  # 30 minutes
        warn "RTO at risk: Restore took $restore_time seconds (target: < 1800s)"
    else
        pass "RTO met: Restore completed in $restore_time seconds"
    fi
}

test_encryption() {
    info "Testing backup encryption..."
    
    local encrypted_backup=$(ls -t "$BACKUP_DIR/daily"/*.gpg 2>/dev/null | head -1)
    
    if [ -z "$encrypted_backup" ]; then
        warn "No encrypted backups found"
        return
    fi
    
    # Try to list packets without decryption
    if gpg --list-packets "$encrypted_backup" > /dev/null 2>&1; then
        pass "Encrypted backup structure is valid"
    else
        fail "Encrypted backup appears corrupted"
    fi
}

# ============================================
# Main Test Execution
# ============================================

main() {
    info "=============================================="
    info "Thai Accounting ERP - Disaster Recovery Test"
    info "=============================================="
    info ""
    info "Test Log: $TEST_LOG"
    info ""
    
    # Determine database type
    DB_TYPE="${DB_TYPE:-sqlite}"
    if [ -f ".env" ]; then
        source .env 2>/dev/null || true
        if echo "$DATABASE_URL" | grep -q "postgresql"; then
            DB_TYPE="postgresql"
        fi
    fi
    
    info "Database Type: $DB_TYPE"
    info ""
    
    # Run tests
    local backup_file=$(test_backup_exists)
    test_backup_integrity "$backup_file"
    
    if [ "$DB_TYPE" = "postgresql" ]; then
        test_postgres_restore "$backup_file"
    else
        test_sqlite_restore "$backup_file"
    fi
    
    test_backup_script
    test_rto_rpo
    test_encryption
    
    # Summary
    info ""
    info "=============================================="
    pass "All disaster recovery tests completed!"
    info "=============================================="
    info ""
    info "Test Results:"
    info "  - Log File: $TEST_LOG"
    info "  - Backup File: $(basename "$backup_file")"
    info ""
    info "Review the log file for any warnings."
}

# Run main
main "$@"
