#!/bin/bash
# Thai Accounting ERP System - Automated Database Backup Script
# โปรแกรมบัญชีมาตรฐานไทย - สคริปต์สำรองข้อมูลอัตโนมัติ
# Version: 2.0 - Database Perfection Phase

set -euo pipefail

# ============================================
# Configuration
# ============================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="${SCRIPT_DIR}/backup-config.env"
LOG_FILE="${SCRIPT_DIR}/backup.log"
LOCK_FILE="/tmp/thai-acc-backup.lock"

# Default configuration (override in backup-config.env)
BACKUP_DIR="/var/backups/thai-accounting"
RETENTION_DAYS=30
DB_TYPE="${DB_TYPE:-sqlite}"  # sqlite or postgresql
ENCRYPTION_ENABLED=true
GPG_RECIPIENT="backup@thaiaccounting.local"
S3_BUCKET=""
S3_ENDPOINT=""
NOTIFICATION_EMAIL=""
POSTGRES_HOST="localhost"
POSTGRES_PORT="5432"
POSTGRES_DB="thai_accounting"
POSTGRES_USER="postgres"
SLACK_WEBHOOK=""

# Load custom configuration if exists
if [ -f "$CONFIG_FILE" ]; then
    source "$CONFIG_FILE"
fi

# Create backup directory
mkdir -p "$BACKUP_DIR"
mkdir -p "$BACKUP_DIR/daily"
mkdir -p "$BACKUP_DIR/hourly"
mkdir -p "$BACKUP_DIR/archive"
mkdir -p "$BACKUP_DIR/logs"

# ============================================
# Logging Functions
# ============================================
log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [$level] $message" | tee -a "$LOG_FILE"
}

log_info() { log "INFO" "$@"; }
log_warn() { log "WARN" "$@"; }
log_error() { log "ERROR" "$@"; }

# ============================================
# Lock Management
# ============================================
acquire_lock() {
    if [ -f "$LOCK_FILE" ]; then
        local pid=$(cat "$LOCK_FILE")
        if kill -0 "$pid" 2>/dev/null; then
            log_error "Backup already running (PID: $pid)"
            exit 1
        else
            log_warn "Removing stale lock file"
            rm -f "$LOCK_FILE"
        fi
    fi
    echo $$ > "$LOCK_FILE"
}

release_lock() {
    rm -f "$LOCK_FILE"
}

# ============================================
# SQLite Backup Functions
# ============================================
backup_sqlite_full() {
    local backup_name="thai-acc-$(date +%Y%m%d-%H%M%S).db"
    local backup_path="$BACKUP_DIR/daily/$backup_name"
    local db_path="${DB_PATH:-./prisma/dev.db}"
    
    log_info "Starting SQLite full backup: $backup_name"
    
    # Verify database integrity before backup
    if ! sqlite3 "$db_path" "PRAGMA integrity_check;" | grep -q "ok"; then
        log_error "Database integrity check failed!"
        send_alert "Database integrity check failed before backup"
        return 1
    fi
    
    # Create backup with SQLite's backup command (online backup)
    sqlite3 "$db_path" ".backup '$backup_path'"
    
    if [ ! -f "$backup_path" ]; then
        log_error "Backup file was not created"
        return 1
    fi
    
    # Verify backup
    if ! sqlite3 "$backup_path" "PRAGMA integrity_check;" | grep -q "ok"; then
        log_error "Backup integrity check failed!"
        rm -f "$backup_path"
        return 1
    fi
    
    # Compress backup
    local compressed_path="${backup_path}.gz"
    gzip -c "$backup_path" > "$compressed_path"
    rm -f "$backup_path"
    
    # Encrypt if enabled
    if [ "$ENCRYPTION_ENABLED" = true ] && [ -n "$GPG_RECIPIENT" ]; then
        encrypt_backup "$compressed_path"
    fi
    
    local final_size=$(du -h "${compressed_path}.gpg" 2>/dev/null || du -h "$compressed_path" | cut -f1)
    log_info "SQLite full backup completed: $final_size"
    
    echo "$backup_path"
}

backup_sqlite_incremental() {
    log_info "Incremental backup not supported for SQLite, creating full backup"
    backup_sqlite_full
}

# ============================================
# PostgreSQL Backup Functions
# ============================================
backup_postgres_full() {
    local backup_name="thai-acc-pg-$(date +%Y%m%d-%H%M%S).sql"
    local backup_path="$BACKUP_DIR/daily/$backup_name"
    
    log_info "Starting PostgreSQL full backup: $backup_name"
    
    # Create backup
    PGPASSWORD="${POSTGRES_PASSWORD}" pg_dump \
        -h "$POSTGRES_HOST" \
        -p "$POSTGRES_PORT" \
        -U "$POSTGRES_USER" \
        -d "$POSTGRES_DB" \
        --format=custom \
        --compress=9 \
        --verbose \
        --file="$backup_path"
    
    if [ ! -f "$backup_path" ]; then
        log_error "Backup file was not created"
        return 1
    fi
    
    # Encrypt if enabled
    if [ "$ENCRYPTION_ENABLED" = true ] && [ -n "$GPG_RECIPIENT" ]; then
        encrypt_backup "$backup_path"
        backup_path="${backup_path}.gpg"
    fi
    
    local final_size=$(du -h "$backup_path" | cut -f1)
    log_info "PostgreSQL full backup completed: $final_size"
    
    echo "$backup_path"
}

backup_postgres_incremental() {
    local backup_name="thai-acc-pg-incr-$(date +%Y%m%d-%H%M%S).tar"
    local backup_path="$BACKUP_DIR/hourly/$backup_name"
    local wal_archive_dir="$BACKUP_DIR/wal-archive"
    
    log_info "Starting PostgreSQL incremental (WAL) backup"
    
    mkdir -p "$wal_archive_dir"
    
    # Create base backup using pg_basebackup
    PGPASSWORD="${POSTGRES_PASSWORD}" pg_basebackup \
        -h "$POSTGRES_HOST" \
        -p "$POSTGRES_PORT" \
        -U "$POSTGRES_USER" \
        -D - \
        --format=tar \
        --wal-method=fetch \
        --verbose 2>>"$LOG_FILE" | gzip > "$backup_path.gz"
    
    if [ ! -f "$backup_path.gz" ]; then
        log_error "Incremental backup failed"
        return 1
    fi
    
    log_info "PostgreSQL incremental backup completed"
    echo "$backup_path.gz"
}

# ============================================
# Encryption Functions
# ============================================
encrypt_backup() {
    local file="$1"
    local encrypted="${file}.gpg"
    
    log_info "Encrypting backup: $(basename "$file")"
    
    gpg --encrypt \
        --recipient "$GPG_RECIPIENT" \
        --trust-model always \
        --output "$encrypted" \
        "$file" 2>>"$LOG_FILE"
    
    if [ -f "$encrypted" ]; then
        rm -f "$file"
        log_info "Encryption completed: $(basename "$encrypted")"
    else
        log_error "Encryption failed"
        return 1
    fi
}

# ============================================
# Retention and Cleanup
# ============================================
cleanup_old_backups() {
    log_info "Cleaning up backups older than $RETENTION_DAYS days"
    
    # Remove old daily backups
    find "$BACKUP_DIR/daily" -name "*.db.gz*" -mtime +$RETENTION_DAYS -delete
    find "$BACKUP_DIR/daily" -name "*.sql*" -mtime +$RETENTION_DAYS -delete
    
    # Remove old hourly backups (keep for 7 days)
    find "$BACKUP_DIR/hourly" -name "*.tar.gz*" -mtime +7 -delete
    
    # Compress and archive backups between 7-30 days
    find "$BACKUP_DIR/daily" -name "*.db.gz" -mtime +7 -mtime -$RETENTION_DAYS -exec mv {} "$BACKUP_DIR/archive/" \;
    
    log_info "Cleanup completed"
}

# ============================================
# Cloud Upload (S3 Compatible)
# ============================================
upload_to_s3() {
    local file="$1"
    local remote_path="s3://$S3_BUCKET/backups/$(basename "$file")"
    
    if [ -z "$S3_BUCKET" ]; then
        log_warn "S3 bucket not configured, skipping upload"
        return 0
    fi
    
    log_info "Uploading to S3: $remote_path"
    
    if command -v aws &> /dev/null; then
        aws s3 cp "$file" "$remote_path" --storage-class STANDARD_IA
    elif command -v s3cmd &> /dev/null; then
        s3cmd put "$file" "$remote_path"
    elif command -v rclone &> /dev/null; then
        rclone copy "$file" "remote:$S3_BUCKET/backups/"
    else
        log_warn "No S3 client found (aws, s3cmd, or rclone)"
        return 1
    fi
    
    log_info "Upload completed"
}

# ============================================
# Notifications
# ============================================
send_alert() {
    local message="$1"
    local subject="Thai Accounting ERP - Backup Alert"
    
    log_error "$message"
    
    # Email notification
    if [ -n "$NOTIFICATION_EMAIL" ] && command -v mail &> /dev/null; then
        echo "$message" | mail -s "$subject" "$NOTIFICATION_EMAIL"
    fi
    
    # Slack notification
    if [ -n "$SLACK_WEBHOOK" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"$subject: $message\"}" \
            "$SLACK_WEBHOOK" 2>/dev/null
    fi
}

send_success_notification() {
    local backup_file="$1"
    local backup_size="$2"
    local duration="$3"
    
    if [ -n "$NOTIFICATION_EMAIL" ] && command -v mail &> /dev/null; then
        echo "Backup completed successfully.
File: $backup_file
Size: $backup_size
Duration: $duration
Timestamp: $(date)" | mail -s "Thai Accounting ERP - Backup Success" "$NOTIFICATION_EMAIL"
    fi
}

# ============================================
# Main Backup Functions
# ============================================
run_full_backup() {
    local start_time=$(date +%s)
    local backup_file
    
    log_info "Starting full backup process"
    
    case "$DB_TYPE" in
        sqlite)
            backup_file=$(backup_sqlite_full)
            ;;
        postgresql)
            backup_file=$(backup_postgres_full)
            ;;
        *)
            log_error "Unknown database type: $DB_TYPE"
            exit 1
            ;;
    esac
    
    if [ $? -ne 0 ] || [ -z "$backup_file" ]; then
        send_alert "Full backup failed"
        return 1
    fi
    
    # Get final file (might have .gpg extension)
    local final_file="${backup_file}.gz"
    [ -f "${final_file}.gpg" ] && final_file="${final_file}.gpg"
    
    local backup_size=$(du -h "$final_file" | cut -f1)
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    # Upload to S3
    upload_to_s3 "$final_file"
    
    # Cleanup old backups
    cleanup_old_backups
    
    # Send success notification
    send_success_notification "$final_file" "$backup_size" "${duration}s"
    
    log_info "Full backup process completed in ${duration}s"
    
    # Write backup manifest
    cat > "$BACKUP_DIR/last-backup.manifest" <<EOF
{
  "timestamp": "$(date -Iseconds)",
  "type": "full",
  "database": "$DB_TYPE",
  "file": "$final_file",
  "size": "$backup_size",
  "duration_seconds": $duration
}
EOF
    
    return 0
}

run_incremental_backup() {
    log_info "Starting incremental backup process"
    
    if [ "$DB_TYPE" != "postgresql" ]; then
        log_warn "Incremental backup only supported for PostgreSQL"
        run_full_backup
        return $?
    fi
    
    local backup_file=$(backup_postgres_incremental)
    
    if [ $? -ne 0 ]; then
        send_alert "Incremental backup failed"
        return 1
    fi
    
    upload_to_s3 "$backup_file"
    
    log_info "Incremental backup process completed"
    return 0
}

# ============================================
# Restore Functions
# ============================================
list_backups() {
    echo "Available backups:"
    echo "=================="
    echo "Daily backups:"
    ls -lh "$BACKUP_DIR/daily/" 2>/dev/null || echo "  (none)"
    echo ""
    echo "Hourly backups:"
    ls -lh "$BACKUP_DIR/hourly/" 2>/dev/null || echo "  (none)"
    echo ""
    echo "Archived backups:"
    ls -lh "$BACKUP_DIR/archive/" 2>/dev/null || echo "  (none)"
}

restore_backup() {
    local backup_file="$1"
    local target_path="${2:-}"
    
    if [ ! -f "$backup_file" ]; then
        # Try to find in backup directory
        if [ -f "$BACKUP_DIR/daily/$backup_file" ]; then
            backup_file="$BACKUP_DIR/daily/$backup_file"
        elif [ -f "$BACKUP_DIR/archive/$backup_file" ]; then
            backup_file="$BACKUP_DIR/archive/$backup_file"
        else
            log_error "Backup file not found: $backup_file"
            return 1
        fi
    fi
    
    log_info "Restoring from backup: $backup_file"
    
    # Decrypt if needed
    if [[ "$backup_file" == *.gpg ]]; then
        log_info "Decrypting backup..."
        gpg --decrypt --output "${backup_file%.gpg}" "$backup_file"
        backup_file="${backup_file%.gpg}"
    fi
    
    # Decompress if needed
    if [[ "$backup_file" == *.gz ]]; then
        log_info "Decompressing backup..."
        gunzip -c "$backup_file" > "${backup_file%.gz}"
        backup_file="${backup_file%.gz}"
    fi
    
    case "$DB_TYPE" in
        sqlite)
            local db_path="${target_path:-./prisma/dev.db}"
            # Create backup of current database
            if [ -f "$db_path" ]; then
                cp "$db_path" "${db_path}.pre-restore-$(date +%Y%m%d-%H%M%S)"
            fi
            cp "$backup_file" "$db_path"
            log_info "SQLite database restored to: $db_path"
            ;;
        postgresql)
            log_info "Restoring PostgreSQL database..."
            PGPASSWORD="${POSTGRES_PASSWORD}" pg_restore \
                -h "$POSTGRES_HOST" \
                -p "$POSTGRES_PORT" \
                -U "$POSTGRES_USER" \
                -d "$POSTGRES_DB" \
                --clean \
                --if-exists \
                "$backup_file"
            log_info "PostgreSQL database restored"
            ;;
    esac
    
    log_info "Restore completed successfully"
}

# ============================================
# Verify Backup
# ============================================
verify_backup() {
    local backup_file="$1"
    
    log_info "Verifying backup: $backup_file"
    
    if [ ! -f "$backup_file" ]; then
        log_error "Backup file not found"
        return 1
    fi
    
    # Check file integrity
    if [[ "$backup_file" == *.gpg ]]; then
        if ! gpg --list-packets "$backup_file" > /dev/null 2>&1; then
            log_error "GPG file appears to be corrupted"
            return 1
        fi
    elif [[ "$backup_file" == *.gz ]]; then
        if ! gzip -t "$backup_file" 2>/dev/null; then
            log_error "Gzip file appears to be corrupted"
            return 1
        fi
    fi
    
    # Test restore to temporary location
    local temp_dir=$(mktemp -d)
    
    case "$DB_TYPE" in
        sqlite)
            # Decrypt and decompress
            local test_db="$temp_dir/test.db"
            if [[ "$backup_file" == *.gpg ]]; then
                gpg --decrypt "$backup_file" 2>/dev/null | gunzip > "$test_db"
            else
                gunzip -c "$backup_file" > "$test_db"
            fi
            
            # Verify database integrity
            if sqlite3 "$test_db" "PRAGMA integrity_check;" | grep -q "ok"; then
                log_info "Backup verification successful"
            else
                log_error "Backup verification failed - database integrity check failed"
                rm -rf "$temp_dir"
                return 1
            fi
            ;;
        postgresql)
            # TODO: Implement PostgreSQL verification
            log_info "PostgreSQL backup verification (basic file check only)"
            ;;
    esac
    
    rm -rf "$temp_dir"
    log_info "Backup verification completed"
    return 0
}

# ============================================
# Command Line Interface
# ============================================
show_help() {
    cat <<EOF
Thai Accounting ERP - Database Backup Tool
Usage: $0 [command] [options]

Commands:
  full              Run full database backup
  incremental       Run incremental backup (PostgreSQL only)
  list              List available backups
  restore <file>    Restore database from backup file
  verify <file>     Verify backup file integrity
  cleanup           Clean up old backups
  config            Show current configuration
  help              Show this help message

Environment Variables:
  DB_TYPE           Database type (sqlite|postgresql)
  DB_PATH           Path to SQLite database
  POSTGRES_HOST     PostgreSQL host
  POSTGRES_DB       PostgreSQL database name
  POSTGRES_USER     PostgreSQL username
  POSTGRES_PASSWORD PostgreSQL password
  BACKUP_DIR        Backup directory path
  ENCRYPTION_ENABLED Enable GPG encryption (true|false)
  GPG_RECIPIENT     GPG recipient for encryption
  S3_BUCKET         S3 bucket for remote backup
  RETENTION_DAYS    Number of days to retain backups

Examples:
  $0 full
  $0 restore thai-acc-20260315-120000.db.gz.gpg
  $0 verify /path/to/backup.sql.gz.gpg
EOF
}

show_config() {
    echo "Current Configuration:"
    echo "====================="
    echo "Database Type: $DB_TYPE"
    echo "Backup Directory: $BACKUP_DIR"
    echo "Retention Days: $RETENTION_DAYS"
    echo "Encryption: $ENCRYPTION_ENABLED"
    echo "GPG Recipient: $GPG_RECIPIENT"
    echo "S3 Bucket: ${S3_BUCKET:-(not configured)}"
    echo "Notification Email: ${NOTIFICATION_EMAIL:-(not configured)}"
    
    if [ "$DB_TYPE" = "postgresql" ]; then
        echo ""
        echo "PostgreSQL Settings:"
        echo "  Host: $POSTGRES_HOST"
        echo "  Port: $POSTGRES_PORT"
        echo "  Database: $POSTGRES_DB"
        echo "  User: $POSTGRES_USER"
    else
        echo ""
        echo "SQLite Settings:"
        echo "  Database Path: ${DB_PATH:-./prisma/dev.db}"
    fi
}

# ============================================
# Main
# ============================================
main() {
    local command="${1:-help}"
    
    # Setup trap for cleanup
    trap release_lock EXIT
    
    case "$command" in
        full)
            acquire_lock
            run_full_backup
            ;;
        incremental)
            acquire_lock
            run_incremental_backup
            ;;
        list)
            list_backups
            ;;
        restore)
            if [ -z "${2:-}" ]; then
                echo "Error: Backup file required"
                echo "Usage: $0 restore <backup-file> [target-path]"
                exit 1
            fi
            restore_backup "$2" "${3:-}"
            ;;
        verify)
            if [ -z "${2:-}" ]; then
                echo "Error: Backup file required"
                echo "Usage: $0 verify <backup-file>"
                exit 1
            fi
            verify_backup "$2"
            ;;
        cleanup)
            cleanup_old_backups
            ;;
        config)
            show_config
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            echo "Unknown command: $command"
            show_help
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
