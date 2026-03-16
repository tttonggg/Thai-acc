#!/bin/bash
# ============================================
# C3. Automated Backup Script for PostgreSQL
# Thai Accounting ERP System
# ============================================

set -euo pipefail

# Configuration
DB_NAME="${DB_NAME:-thai_acc_db}"
DB_USER="${DB_USER:-postgres}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/thai-acc}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
S3_BUCKET="${S3_BUCKET:-}"
S3_REGION="${S3_REGION:-ap-southeast-1}"
ENCRYPTION_KEY="${ENCRYPTION_KEY:-}"
LOG_FILE="${BACKUP_DIR}/backup.log"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DATE=$(date +%Y%m%d)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    local level=$1
    local message=$2
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "[${timestamp}] [${level}] ${message}" | tee -a "$LOG_FILE"
}

# Create backup directory
mkdir -p "$BACKUP_DIR"
mkdir -p "$BACKUP_DIR/daily"
mkdir -p "$BACKUP_DIR/weekly"
mkdir -p "$BACKUP_DIR/monthly"

# ============================================
# Functions
# ============================================

# Check if required tools are installed
check_prerequisites() {
    log "INFO" "Checking prerequisites..."
    
    if ! command -v pg_dump &> /dev/null; then
        log "ERROR" "pg_dump not found. Please install PostgreSQL client tools."
        exit 1
    fi
    
    if ! command -v pg_dumpall &> /dev/null; then
        log "WARNING" "pg_dumpall not found. Role backups will be skipped."
    fi
    
    if [[ -n "$S3_BUCKET" ]] && ! command -v aws &> /dev/null; then
        log "WARNING" "AWS CLI not found. S3 upload will be skipped."
    fi
    
    if [[ -n "$ENCRYPTION_KEY" ]] && ! command -v gpg &> /dev/null; then
        log "WARNING" "GPG not found. Encryption will be skipped."
    fi
    
    log "INFO" "Prerequisites check completed."
}

# Test database connection
test_connection() {
    log "INFO" "Testing database connection..."
    
    if ! pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" > /dev/null 2>&1; then
        log "ERROR" "Cannot connect to database at $DB_HOST:$DB_PORT"
        exit 1
    fi
    
    log "INFO" "Database connection successful."
}

# Create full database backup
backup_full() {
    local backup_type=$1
    local backup_file="${BACKUP_DIR}/${backup_type}/${DB_NAME}_${backup_type}_${TIMESTAMP}.sql"
    local compressed_file="${backup_file}.gz"
    
    log "INFO" "Creating ${backup_type} backup: $compressed_file"
    
    # Create backup with verbose output
    pg_dump \
        --host="$DB_HOST" \
        --port="$DB_PORT" \
        --username="$DB_USER" \
        --dbname="$DB_NAME" \
        --verbose \
        --no-owner \
        --no-acl \
        --format=plain \
        --file="$backup_file" 2>> "$LOG_FILE"
    
    # Compress backup
    log "INFO" "Compressing backup..."
    gzip -f "$backup_file"
    
    # Encrypt if key is provided
    if [[ -n "$ENCRYPTION_KEY" ]] && command -v gpg &> /dev/null; then
        log "INFO" "Encrypting backup..."
        gpg --symmetric --cipher-algo AES256 --compress-algo 1 \
            --passphrase "$ENCRYPTION_KEY" --batch --yes \
            --output "${compressed_file}.gpg" "$compressed_file"
        rm "$compressed_file"
        compressed_file="${compressed_file}.gpg"
    fi
    
    # Calculate checksum
    sha256sum "$compressed_file" > "${compressed_file}.sha256"
    
    local file_size=$(du -h "$compressed_file" | cut -f1)
    log "INFO" "${backup_type} backup completed: $file_size"
    
    echo "$compressed_file"
}

# Backup roles and globals
backup_globals() {
    local globals_file="${BACKUP_DIR}/daily/globals_${TIMESTAMP}.sql"
    local compressed_file="${globals_file}.gz"
    
    if command -v pg_dumpall &> /dev/null; then
        log "INFO" "Backing up global objects (roles, tablespaces)..."
        
        pg_dumpall \
            --host="$DB_HOST" \
            --port="$DB_PORT" \
            --username="$DB_USER" \
            --globals-only \
            --file="$globals_file" 2>> "$LOG_FILE"
        
        gzip -f "$globals_file"
        log "INFO" "Global objects backup completed."
    fi
}

# Backup specific schema
backup_schema() {
    local schema=$1
    local backup_file="${BACKUP_DIR}/daily/${DB_NAME}_schema_${schema}_${TIMESTAMP}.sql"
    local compressed_file="${backup_file}.gz"
    
    log "INFO" "Backing up schema: $schema"
    
    pg_dump \
        --host="$DB_HOST" \
        --port="$DB_PORT" \
        --username="$DB_USER" \
        --dbname="$DB_NAME" \
        --schema="$schema" \
        --verbose \
        --file="$backup_file" 2>> "$LOG_FILE"
    
    gzip -f "$backup_file"
    
    log "INFO" "Schema $schema backup completed."
}

# Backup specific tables
backup_tables() {
    local tables=("journal_entries" "invoices" "receipts" "payments")
    
    for table in "${tables[@]}"; do
        local backup_file="${BACKUP_DIR}/daily/${DB_NAME}_table_${table}_${TIMESTAMP}.sql"
        local compressed_file="${backup_file}.gz"
        
        log "INFO" "Backing up table: $table"
        
        pg_dump \
            --host="$DB_HOST" \
            --port="$DB_PORT" \
            --username="$DB_USER" \
            --dbname="$DB_NAME" \
            --table="$table" \
            --data-only \
            --file="$backup_file" 2>> "$LOG_FILE"
        
        gzip -f "$backup_file"
    done
}

# Upload to S3
upload_to_s3() {
    local file=$1
    local backup_type=$2
    
    if [[ -n "$S3_BUCKET" ]] && command -v aws &> /dev/null; then
        log "INFO" "Uploading to S3: s3://${S3_BUCKET}/${backup_type}/"
        
        aws s3 cp "$file" "s3://${S3_BUCKET}/${backup_type}/" \
            --region "$S3_REGION" \
            --storage-class STANDARD_IA
        
        aws s3 cp "${file}.sha256" "s3://${S3_BUCKET}/${backup_type}/" \
            --region "$S3_REGION"
        
        log "INFO" "S3 upload completed."
    fi
}

# Cleanup old backups
cleanup_old_backups() {
    log "INFO" "Cleaning up backups older than $RETENTION_DAYS days..."
    
    # Local cleanup
    find "$BACKUP_DIR" -name "*.gz" -type f -mtime +$RETENTION_DAYS -delete
    find "$BACKUP_DIR" -name "*.gpg" -type f -mtime +$RETENTION_DAYS -delete
    find "$BACKUP_DIR" -name "*.sha256" -type f -mtime +$RETENTION_DAYS -delete
    
    # S3 cleanup (if configured)
    if [[ -n "$S3_BUCKET" ]] && command -v aws &> /dev/null; then
        log "INFO" "Cleaning up S3 backups..."
        
        local cutoff_date=$(date -d "$RETENTION_DAYS days ago" +%Y-%m-%d)
        
        aws s3api list-objects-v2 \
            --bucket "$S3_BUCKET" \
            --query "Contents[?LastModified<='${cutoff_date}'].Key" \
            --output text | \
            while read -r key; do
                if [[ -n "$key" ]]; then
                    aws s3 rm "s3://${S3_BUCKET}/${key}"
                fi
            done
    fi
    
    log "INFO" "Cleanup completed."
}

# Verify backup integrity
verify_backup() {
    local backup_file=$1
    
    log "INFO" "Verifying backup: $backup_file"
    
    # Verify checksum
    if [[ -f "${backup_file}.sha256" ]]; then
        if sha256sum -c "${backup_file}.sha256" > /dev/null 2>&1; then
            log "INFO" "Checksum verification passed."
        else
            log "ERROR" "Checksum verification failed!"
            return 1
        fi
    fi
    
    # Test gzip integrity
    if [[ "$backup_file" == *.gz && ! "$backup_file" == *.gpg ]]; then
        if gzip -t "$backup_file" 2>/dev/null; then
            log "INFO" "Archive integrity verified."
        else
            log "ERROR" "Archive integrity check failed!"
            return 1
        fi
    fi
    
    return 0
}

# Send notification
send_notification() {
    local status=$1
    local message=$2
    
    # Slack webhook (if configured)
    if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
        curl -s -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"Backup ${status}: ${message}\"}" \
            "$SLACK_WEBHOOK_URL" > /dev/null || true
    fi
    
    # Email notification (if configured)
    if [[ -n "${EMAIL_TO:-}" ]] && command -v mail &> /dev/null; then
        echo "$message" | mail -s "Thai-ACC Backup ${status}" "$EMAIL_TO" || true
    fi
}

# ============================================
# Main Execution
# ============================================

main() {
    log "INFO" "========================================"
    log "INFO" "Starting Thai-ACC Database Backup"
    log "INFO" "Timestamp: $TIMESTAMP"
    log "INFO" "========================================"
    
    # Check what type of backup to perform
    local backup_type="${1:-daily}"
    
    check_prerequisites
    test_connection
    
    case "$backup_type" in
        "full")
            log "INFO" "Performing full backup..."
            local backup_file=$(backup_full "full")
            backup_globals
            verify_backup "$backup_file"
            upload_to_s3 "$backup_file" "full"
            ;;
        "daily")
            log "INFO" "Performing daily backup..."
            local backup_file=$(backup_full "daily")
            backup_globals
            verify_backup "$backup_file"
            upload_to_s3 "$backup_file" "daily"
            ;;
        "weekly")
            log "INFO" "Performing weekly backup..."
            local backup_file=$(backup_full "weekly")
            backup_globals
            verify_backup "$backup_file"
            upload_to_s3 "$backup_file" "weekly"
            ;;
        "monthly")
            log "INFO" "Performing monthly backup..."
            local backup_file=$(backup_full "monthly")
            backup_globals
            backup_tables
            verify_backup "$backup_file"
            upload_to_s3 "$backup_file" "monthly"
            ;;
        "schema")
            if [[ -z "${2:-}" ]]; then
                log "ERROR" "Schema name required for schema backup"
                exit 1
            fi
            backup_schema "$2"
            ;;
        "cleanup")
            cleanup_old_backups
            exit 0
            ;;
        *)
            echo "Usage: $0 {full|daily|weekly|monthly|schema <name>|cleanup}"
            exit 1
            ;;
    esac
    
    # Cleanup old backups
    cleanup_old_backups
    
    log "INFO" "========================================"
    log "INFO" "Backup completed successfully!"
    log "INFO" "========================================"
    
    send_notification "SUCCESS" "${backup_type} backup completed at $(date)"
}

# Run main function
main "$@"
