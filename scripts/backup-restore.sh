#!/bin/bash
# ============================================
# Database Restore Script for PostgreSQL
# Thai Accounting ERP System
# ============================================

set -euo pipefail

# Configuration
DB_NAME="${DB_NAME:-thai_acc_db}"
DB_USER="${DB_USER:-postgres}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/thai-acc}"
ENCRYPTION_KEY="${ENCRYPTION_KEY:-}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    local level=$1
    local message=$2
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "[${timestamp}] [${level}] ${message}"
}

# List available backups
list_backups() {
    log "INFO" "Available backups in $BACKUP_DIR:"
    
    find "$BACKUP_DIR" -name "*.gz*" -type f -printf '%T@ %p\n' | \
        sort -rn | \
        head -20 | \
        cut -d' ' -f2- | \
        while read -r file; do
            local size=$(du -h "$file" | cut -f1)
            local date=$(stat -c %y "$file" | cut -d'.' -f1)
            echo "  $date | $size | $file"
        done
}

# Verify backup file
verify_backup() {
    local file=$1
    
    if [[ ! -f "$file" ]]; then
        log "ERROR" "Backup file not found: $file"
        return 1
    fi
    
    # Check checksum if available
    if [[ -f "${file}.sha256" ]]; then
        log "INFO" "Verifying checksum..."
        if sha256sum -c "${file}.sha256"; then
            log "INFO" "${GREEN}Checksum verified${NC}"
        else
            log "ERROR" "${RED}Checksum verification failed!${NC}"
            return 1
        fi
    fi
    
    return 0
}

# Decrypt backup if needed
decrypt_backup() {
    local file=$1
    
    if [[ "$file" == *.gpg ]]; then
        if [[ -z "$ENCRYPTION_KEY" ]]; then
            log "ERROR" "Encrypted backup requires ENCRYPTION_KEY"
            exit 1
        fi
        
        log "INFO" "Decrypting backup..."
        local decrypted_file="${file%.gpg}"
        
        gpg --decrypt \
            --passphrase "$ENCRYPTION_KEY" \
            --batch --yes \
            --output "$decrypted_file" "$file"
        
        echo "$decrypted_file"
    else
        echo "$file"
    fi
}

# Restore from backup
restore_backup() {
    local backup_file=$1
    local target_db=${2:-$DB_NAME}
    
    log "INFO" "========================================"
    log "INFO" "Starting restore from: $backup_file"
    log "INFO" "Target database: $target_db"
    log "INFO" "========================================"
    
    # Verify backup
    verify_backup "$backup_file"
    
    # Decrypt if needed
    local decrypted_file=$(decrypt_backup "$backup_file")
    
    # Test connection
    log "INFO" "Testing database connection..."
    if ! pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" > /dev/null 2>&1; then
        log "ERROR" "Cannot connect to database"
        exit 1
    fi
    
    # Confirm destructive operation
    read -p "This will DROP and recreate database '$target_db'. Are you sure? (yes/no): " confirm
    if [[ "$confirm" != "yes" ]]; then
        log "INFO" "Restore cancelled."
        exit 0
    fi
    
    # Drop and create database
    log "INFO" "Dropping existing database..."
    dropdb --host="$DB_HOST" --port="$DB_PORT" --username="$DB_USER" \
        --if-exists "$target_db" 2>/dev/null || true
    
    log "INFO" "Creating new database..."
    createdb --host="$HOST" --port="$DB_PORT" --username="$DB_USER" \
        --owner="$DB_USER" "$target_db"
    
    # Restore from backup
    log "INFO" "Restoring data..."
    if [[ "$decrypted_file" == *.gz ]]; then
        gunzip -c "$decrypted_file" | psql \
            --host="$DB_HOST" \
            --port="$DB_PORT" \
            --username="$DB_USER" \
            --dbname="$target_db" \
            --set ON_ERROR_STOP=on
    else
        psql \
            --host="$DB_HOST" \
            --port="$DB_PORT" \
            --username="$DB_USER" \
            --dbname="$target_db" \
            --set ON_ERROR_STOP=on \
            --file="$decrypted_file"
    fi
    
    # Cleanup decrypted file if different from original
    if [[ "$decrypted_file" != "$backup_file" ]]; then
        rm -f "$decrypted_file"
    fi
    
    log "INFO" "${GREEN}Restore completed successfully!${NC}"
}

# Restore to point-in-time (if WAL archiving is enabled)
restore_point_in_time() {
    local backup_file=$1
    local target_timestamp=$2
    
    log "INFO" "Performing point-in-time recovery to: $target_timestamp"
    
    # This requires WAL archiving to be configured
    # Steps would include:
    # 1. Stop PostgreSQL
    # 2. Clear data directory
    # 3. Extract base backup
    # 4. Configure recovery.conf or postgresql.conf
    # 5. Start PostgreSQL for recovery
    
    log "WARNING" "Point-in-time recovery requires manual configuration"
    log "INFO" "Please refer to PostgreSQL documentation for PITR setup"
}

# Validate restored database
validate_restore() {
    local target_db=${1:-$DB_NAME}
    
    log "INFO" "Validating restored database..."
    
    # Check connection
    if ! psql --host="$DB_HOST" --port="$DB_PORT" --username="$DB_USER" \
         --dbname="$target_db" -c "SELECT 1" > /dev/null 2>&1; then
        log "ERROR" "Cannot connect to restored database"
        return 1
    fi
    
    # Count tables
    local table_count=$(psql --host="$DB_HOST" --port="$DB_PORT" --username="$DB_USER" \
        --dbname="$target_db" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'")
    
    log "INFO" "Tables found: $table_count"
    
    # Check for critical tables
    local critical_tables=("invoices" "journal_entries" "customers" "products")
    for table in "${critical_tables[@]}"; do
        local count=$(psql --host="$DB_HOST" --port="$DB_PORT" --username="$DB_USER" \
            --dbname="$target_db" -t -c "SELECT COUNT(*) FROM $table" 2>/dev/null || echo "0")
        log "INFO" "Table $table: $count rows"
    done
    
    log "INFO" "${GREEN}Validation completed${NC}"
}

# Main execution
main() {
    local command="${1:-help}"
    
    case "$command" in
        "list")
            list_backups
            ;;
        "restore")
            if [[ -z "${2:-}" ]]; then
                log "ERROR" "Backup file required"
                echo "Usage: $0 restore <backup_file> [target_db]"
                exit 1
            fi
            restore_backup "$2" "${3:-$DB_NAME}"
            validate_restore "${3:-$DB_NAME}"
            ;;
        "verify")
            if [[ -z "${2:-}" ]]; then
                log "ERROR" "Backup file required"
                exit 1
            fi
            verify_backup "$2"
            ;;
        "validate")
            validate_restore "${2:-$DB_NAME}"
            ;;
        "help"|*)
            echo "Thai-ACC Database Restore Tool"
            echo ""
            echo "Usage: $0 <command> [options]"
            echo ""
            echo "Commands:"
            echo "  list                          List available backups"
            echo "  restore <file> [db]           Restore from backup file"
            echo "  verify <file>                 Verify backup integrity"
            echo "  validate [db]                 Validate restored database"
            echo ""
            echo "Environment Variables:"
            echo "  DB_NAME       Database name (default: thai_acc_db)"
            echo "  DB_USER       Database user (default: postgres)"
            echo "  DB_HOST       Database host (default: localhost)"
            echo "  DB_PORT       Database port (default: 5432)"
            echo "  BACKUP_DIR    Backup directory (default: /var/backups/thai-acc)"
            echo "  ENCRYPTION_KEY Encryption key for encrypted backups"
            ;;
    esac
}

main "$@"
