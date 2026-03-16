# Backup and Restore Guide

## Thai Accounting ERP - Data Protection and Recovery

This guide covers comprehensive backup and restore procedures for the Thai Accounting ERP system.

---

## Table of Contents

1. [Backup Strategy Overview](#backup-strategy-overview)
2. [Automated Backup Setup](#automated-backup-setup)
3. [Manual Backup Procedures](#manual-backup-procedures)
4. [Point-in-Time Recovery](#point-in-time-recovery)
5. [Disaster Recovery Plan](#disaster-recovery-plan)
6. [Backup Verification](#backup-verification)
7. [Cloud Backup Storage](#cloud-backup-storage)
8. [Restore Procedures](#restore-procedures)
9. [Troubleshooting](#troubleshooting)

---

## Backup Strategy Overview

### Backup Types

| Type | Frequency | Retention | Description |
|------|-----------|-----------|-------------|
| **Full Backup** | Daily | 30 days | Complete database + files |
| **Incremental** | Hourly | 7 days | Changes since last backup |
| **Transaction Log** | Continuous | 24 hours | All database transactions |
| **Config Backup** | On change | 90 days | Configuration files |

### 3-2-1 Backup Rule

- **3** copies of your data
- **2** different storage media
- **1** copy offsite

### Backup Components

1. **Database** - All transactional data
2. **Application Files** - Code and configuration
3. **Uploads** - User-uploaded files
4. **Logs** - System and audit logs

---

## Automated Backup Setup

### Using systemd Timers (Linux)

#### 1. Create Backup Script

```bash
sudo mkdir -p /opt/thai-accounting/scripts
sudo nano /opt/thai-accounting/scripts/backup.sh
```

```bash
#!/bin/bash

# Thai Accounting ERP Backup Script
set -euo pipefail

# Configuration
APP_DIR="/var/www/thai-accounting"
BACKUP_DIR="/var/backups/thai-accounting"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30
DB_TYPE="postgresql"  # or "sqlite"
DB_NAME="thai_accounting"
DB_USER="thaiacc"

# Create backup directories
mkdir -p "$BACKUP_DIR"/{database,files,uploads,logs}

# Logging
exec 1> >(tee -a "$BACKUP_DIR/backup_$DATE.log")
exec 2>&1

echo "=== Backup Started: $(date) ==="

# Database Backup
if [ "$DB_TYPE" == "postgresql" ]; then
    echo "Backing up PostgreSQL database..."
    pg_dump -U "$DB_USER" -d "$DB_NAME" | gzip > "$BACKUP_DIR/database/db_$DATE.sql.gz"
else
    echo "Backing up SQLite database..."
    sqlite3 "$APP_DIR/prisma/prod.db" ".backup '$BACKUP_DIR/database/db_$DATE.sqlite'"
    gzip "$BACKUP_DIR/database/db_$DATE.sqlite"
fi

# Application Files Backup
echo "Backing up application files..."
tar -czf "$BACKUP_DIR/files/app_$DATE.tar.gz" \
    --exclude='node_modules' \
    --exclude='.next' \
    --exclude='uploads' \
    --exclude='*.log' \
    -C "$APP_DIR" .

# Uploads Backup
echo "Backing up uploads..."
tar -czf "$BACKUP_DIR/uploads/uploads_$DATE.tar.gz" -C "$APP_DIR" upload

# Configuration Backup
echo "Backing up configuration..."
tar -czf "$BACKUP_DIR/files/config_$DATE.tar.gz" \
    -C "$APP_DIR" \
    .env* \
    package.json \
    next.config.* \
    prisma/schema.prisma

# Logs Backup
echo "Backing up logs..."
tar -czf "$BACKUP_DIR/logs/logs_$DATE.tar.gz" -C /var/log thai-accounting 2>/dev/null || true

# Create backup manifest
cat > "$BACKUP_DIR/backup_$DATE.manifest" << EOF
Backup Date: $(date)
Database: $DB_NAME
Backup Type: Full
Components:
  - Database: database/db_$DATE.sql.gz
  - Application: files/app_$DATE.tar.gz
  - Uploads: uploads/uploads_$DATE.tar.gz
  - Config: files/config_$DATE.tar.gz
  - Logs: logs/logs_$DATE.tar.gz
EOF

# Calculate checksums
echo "Generating checksums..."
cd "$BACKUP_DIR"
find . -name "*$DATE*" -type f -exec sha256sum {} \; > "checksums_$DATE.sha256"

# Cleanup old backups
echo "Cleaning up old backups (older than $RETENTION_DAYS days)..."
find "$BACKUP_DIR" -name "*.gz" -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name "*.log" -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name "*.manifest" -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name "*.sha256" -mtime +$RETENTION_DAYS -delete

# Sync to cloud storage (optional)
if command -v aws &> /dev/null; then
    echo "Syncing to S3..."
    aws s3 sync "$BACKUP_DIR" s3://your-backup-bucket/thai-accounting/ \
        --exclude "*.log" \
        --storage-class STANDARD_IA
fi

# Send notification
echo "=== Backup Completed: $(date) ==="
echo "Backup size: $(du -sh $BACKUP_DIR | cut -f1)"

# Optional: Send email notification
if [ -f /usr/bin/mail ]; then
    echo "Backup completed successfully on $(hostname)" | \
        mail -s "Backup Notification - $(date +%Y-%m-%d)" admin@yourdomain.com
fi

exit 0
```

Make executable:
```bash
sudo chmod +x /opt/thai-accounting/scripts/backup.sh
```

#### 2. Create systemd Service

```bash
sudo nano /etc/systemd/system/thai-accounting-backup.service
```

```ini
[Unit]
Description=Thai Accounting ERP Backup
After=network.target postgresql.service

[Service]
Type=oneshot
User=thaiacc
Group=thaiacc
ExecStart=/opt/thai-accounting/scripts/backup.sh
StandardOutput=journal
StandardError=journal
```

#### 3. Create systemd Timer

```bash
sudo nano /etc/systemd/system/thai-accounting-backup.timer
```

```ini
[Unit]
Description=Run Thai Accounting ERP Backup Daily

[Timer]
OnCalendar=daily
OnCalendar=*-*-* 02:00:00
Persistent=true

[Install]
WantedBy=timers.target
```

#### 4. Enable Timer

```bash
sudo systemctl daemon-reload
sudo systemctl enable thai-accounting-backup.timer
sudo systemctl start thai-accounting-backup.timer

# Check status
sudo systemctl list-timers thai-accounting-backup.timer
sudo systemctl status thai-accounting-backup.timer
```

### Using Cron (Alternative)

```bash
# Edit crontab
sudo crontab -e

# Add daily backup at 2 AM
0 2 * * * /opt/thai-accounting/scripts/backup.sh >> /var/log/thai-accounting/backup.log 2>&1

# Add hourly incremental backup
0 * * * * /opt/thai-accounting/scripts/backup-incremental.sh >> /var/log/thai-accounting/backup-incr.log 2>&1
```

---

## Manual Backup Procedures

### Database-Only Backup

#### PostgreSQL

```bash
# Full database backup
pg_dump -U thaiacc thai_accounting > backup_$(date +%Y%m%d).sql

# Compressed backup
pg_dump -U thaiacc thai_accounting | gzip > backup_$(date +%Y%m%d).sql.gz

# Custom format (allows selective restore)
pg_dump -U thaiacc -Fc thai_accounting > backup_$(date +%Y%m%d).dump

# Parallel backup (faster for large databases)
pg_dump -U thaiacc -Fd -j 4 thai_accounting -f backup_$(date +%Y%m%d)_dir
```

#### SQLite

```bash
# Online backup (doesn't lock database)
sqlite3 /var/www/thai-accounting/prisma/prod.db ".backup '/tmp/backup_$(date +%Y%m%d).db'"

# Export to SQL
sqlite3 /var/www/thai-accounting/prisma/prod.db ".dump" > backup_$(date +%Y%m%d).sql
```

### File System Backup

```bash
# Application files (excluding large directories)
tar -czf app_backup_$(date +%Y%m%d).tar.gz \
    --exclude='node_modules' \
    --exclude='.next' \
    --exclude='uploads' \
    --exclude='*.log' \
    -C /var/www/thai-accounting .

# Uploads directory
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz \
    -C /var/www/thai-accounting upload

# Complete system backup
tar -czf full_backup_$(date +%Y%m%d).tar.gz \
    --exclude='node_modules' \
    --exclude='.next' \
    /var/www/thai-accounting \
    /var/log/thai-accounting \
    /etc/nginx/sites-available/thai-accounting
```

### Configuration Backup

```bash
# Backup all configuration
CONFIG_BACKUP="config_$(date +%Y%m%d).tar.gz"

tar -czf "$CONFIG_BACKUP" \
    /var/www/thai-accounting/.env* \
    /var/www/thai-accounting/prisma/schema.prisma \
    /etc/nginx/sites-available/thai-accounting \
    /etc/systemd/system/thai-accounting*.service \
    /etc/systemd/system/thai-accounting*.timer \
    /opt/thai-accounting/scripts/
```

---

## Point-in-Time Recovery

### PostgreSQL PITR Setup

#### 1. Enable WAL Archiving

```bash
sudo nano /etc/postgresql/14/main/postgresql.conf
```

```ini
# WAL Archiving
wal_level = replica
archive_mode = on
archive_command = 'test ! -f /var/lib/postgresql/backups/wal/%f && cp %p /var/lib/postgresql/backups/wal/%f'
max_wal_sizers = 1GB
wal_keep_size = 512MB
```

#### 2. Create WAL Archive Directory

```bash
sudo mkdir -p /var/lib/postgresql/backups/wal
sudo chown postgres:postgres /var/lib/postgresql/backups/wal
```

#### 3. Base Backup for PITR

```bash
# Create base backup
pg_basebackup -D /var/lib/postgresql/backups/base/$(date +%Y%m%d) \
    -Ft -z -P -X stream -c fast
```

#### 4. Recovery Procedure

```bash
# Stop PostgreSQL
sudo systemctl stop postgresql

# Restore base backup
tar -xzf /var/lib/postgresql/backups/base/20260316/base.tar.gz -C /var/lib/postgresql/14/main/

# Create recovery.conf
cat > /var/lib/postgresql/14/main/recovery.conf << EOF
restore_command = 'cp /var/lib/postgresql/backups/wal/%f %p'
recovery_target_time = '2026-03-16 14:30:00'
recovery_target_action = 'promote'
EOF

# Start PostgreSQL
sudo systemctl start postgresql
```

---

## Disaster Recovery Plan

### Recovery Time Objectives (RTO)

| Scenario | RTO | RPO |
|----------|-----|-----|
| Database corruption | 2 hours | 1 hour |
| Server failure | 4 hours | 24 hours |
| Data center loss | 24 hours | 24 hours |
| Ransomware attack | 8 hours | 24 hours |

### DR Procedures

#### Scenario 1: Database Corruption

```bash
# 1. Stop application
sudo systemctl stop thai-accounting

# 2. Restore database from last good backup
pg_restore -U thaiacc -d thai_accounting --clean backup_20260316.dump

# 3. Verify data integrity
psql -U thaiacc -d thai_accounting -c "SELECT COUNT(*) FROM invoices;"

# 4. Restart application
sudo systemctl start thai-accounting
```

#### Scenario 2: Complete Server Failure

```bash
# On new server:

# 1. Install dependencies (see DEPLOYMENT.md)

# 2. Restore application
tar -xzf app_backup_20260316.tar.gz -C /var/www/thai-accounting

# 3. Restore database
pg_restore -U thaiacc -d thai_accounting backup_20260316.dump

# 4. Restore uploads
tar -xzf uploads_backup_20260316.tar.gz -C /var/www/thai-accounting

# 5. Restore configuration
tar -xzf config_backup_20260316.tar.gz -C /

# 6. Set permissions
sudo chown -R thaiacc:thaiacc /var/www/thai-accounting

# 7. Start services
sudo systemctl start thai-accounting
sudo systemctl start nginx
```

#### Scenario 3: Ransomware Recovery

```bash
# 1. Isolate affected systems immediately
# 2. DO NOT pay ransom
# 3. Rebuild server from scratch with latest OS
# 4. Restore from clean backups (verify backup date is before infection)
# 5. Update all passwords and secrets
# 6. Apply all security patches
# 7. Restore data
# 8. Verify data integrity
# 9. Monitor for any signs of reinfection
```

---

## Backup Verification

### Automated Verification Script

```bash
sudo nano /opt/thai-accounting/scripts/verify-backup.sh
```

```bash
#!/bin/bash

BACKUP_DIR="/var/backups/thai-accounting"
LATEST_BACKUP=$(ls -t $BACKUP_DIR/database/*.gz | head -1)
VERIFY_DIR="/tmp/backup-verify-$(date +%s)"

echo "Verifying backup: $LATEST_BACKUP"

# Create temp directory
mkdir -p "$VERIFY_DIR"

# Extract backup
gunzip -c "$LATEST_BACKUP" > "$VERIFY_DIR/verify.sql"

# Check SQL syntax
if head -20 "$VERIFY_DIR/verify.sql" | grep -q "PostgreSQL database dump\|SQLite format"; then
    echo "✓ Backup format is valid"
else
    echo "✗ Backup format is invalid!"
    exit 1
fi

# Check for key tables (PostgreSQL)
if grep -q "CREATE TABLE.*Invoice" "$VERIFY_DIR/verify.sql"; then
    echo "✓ Invoice table found"
else
    echo "✗ Invoice table missing!"
    exit 1
fi

if grep -q "CREATE TABLE.*JournalEntry" "$VERIFY_DIR/verify.sql"; then
    echo "✓ JournalEntry table found"
else
    echo "✗ JournalEntry table missing!"
    exit 1
fi

# Cleanup
rm -rf "$VERIFY_DIR"

# Verify checksums
cd "$BACKUP_DIR"
if sha256sum -c checksums_*.sha256 > /dev/null 2>&1; then
    echo "✓ Checksums verified"
else
    echo "✗ Checksum mismatch!"
    exit 1
fi

echo "Backup verification completed successfully!"
```

### Monthly Restore Test

```bash
# Schedule monthly test restore
0 3 1 * * /opt/thai-accounting/scripts/test-restore.sh
```

Test restore script:

```bash
#!/bin/bash
# Creates a temporary database and restores backup to verify

TEST_DB="test_restore_$(date +%s)"
LATEST_DUMP="/var/backups/thai-accounting/database/$(ls -t /var/backups/thai-accounting/database/*.gz | head -1)"

# Create test database
sudo -u postgres createdb "$TEST_DB"

# Restore backup
gunzip -c "$LATEST_DUMP" | sudo -u postgres psql "$TEST_DB"

# Run integrity checks
sudo -u postgres psql "$TEST_DB" -c "
    SELECT 
        (SELECT COUNT(*) FROM invoices) as invoice_count,
        (SELECT COUNT(*) FROM journal_entries) as je_count,
        (SELECT COUNT(*) FROM accounts) as account_count;
"

# Cleanup
sudo -u postgres dropdb "$TEST_DB"

echo "Test restore completed successfully!"
```

---

## Cloud Backup Storage

### AWS S3 Backup

```bash
# Install AWS CLI
sudo apt-get install -y awscli

# Configure AWS
aws configure

# Sync backups to S3
aws s3 sync /var/backups/thai-accounting s3://your-backup-bucket/thai-accounting/ \
    --storage-class STANDARD_IA \
    --sse AES256

# Set lifecycle policy (move to Glacier after 90 days)
aws s3api put-bucket-lifecycle-configuration \
    --bucket your-backup-bucket \
    --lifecycle-configuration file://lifecycle.json
```

Lifecycle policy:

```json
{
  "Rules": [
    {
      "ID": "Move old backups to Glacier",
      "Status": "Enabled",
      "Filter": {
        "Prefix": "thai-accounting/"
      },
      "Transitions": [
        {
          "Days": 90,
          "StorageClass": "GLACIER"
        }
      ],
      "Expiration": {
        "Days": 2555
      }
    }
  ]
}
```

### Google Cloud Storage

```bash
# Install gsutil
sudo apt-get install -y google-cloud-sdk

# Authenticate
gcloud auth login

# Create bucket
gsutil mb -l asia-southeast1 gs://thai-accounting-backups

# Sync backups
gsutil -m rsync -r /var/backups/thai-accounting gs://thai-accounting-backups/
```

### Azure Blob Storage

```bash
# Install Azure CLI
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# Login
az login

# Upload backups
az storage blob upload-batch \
    --destination thai-accounting-backups \
    --source /var/backups/thai-accounting
```

---

## Restore Procedures

### Full System Restore

```bash
#!/bin/bash
# Full system restore script

BACKUP_DATE="$1"  # Pass date as argument: 20260316
BACKUP_DIR="/var/backups/thai-accounting"

if [ -z "$BACKUP_DATE" ]; then
    echo "Usage: $0 <YYYYMMDD>"
    exit 1
fi

echo "Starting full restore from $BACKUP_DATE..."

# Stop services
sudo systemctl stop thai-accounting
sudo systemctl stop nginx

# Restore database
echo "Restoring database..."
if [ -f "$BACKUP_DIR/database/db_$BACKUP_DATE.sql.gz" ]; then
    gunzip -c "$BACKUP_DIR/database/db_$BACKUP_DATE.sql.gz" | \
        sudo -u postgres psql thai_accounting
elif [ -f "$BACKUP_DIR/database/db_$BACKUP_DATE.dump" ]; then
    pg_restore -U thaiacc -d thai_accounting --clean "$BACKUP_DIR/database/db_$BACKUP_DATE.dump"
else
    echo "Database backup not found!"
    exit 1
fi

# Restore application files
echo "Restoring application files..."
tar -xzf "$BACKUP_DIR/files/app_$BACKUP_DATE.tar.gz" -C /var/www/thai-accounting

# Restore uploads
echo "Restoring uploads..."
tar -xzf "$BACKUP_DIR/uploads/uploads_$BACKUP_DATE.tar.gz" -C /var/www/thai-accounting

# Restore configuration
echo "Restoring configuration..."
tar -xzf "$BACKUP_DIR/files/config_$BACKUP_DATE.tar.gz" -C /

# Fix permissions
sudo chown -R thaiacc:thaiacc /var/www/thai-accounting

# Start services
sudo systemctl start thai-accounting
sudo systemctl start nginx

echo "Restore completed!"
echo "Please verify the application is working correctly."
```

### Selective Restore

#### Restore Single Table

```bash
# Extract specific table from backup
gunzip -c backup_20260316.sql.gz | \
    grep -A 1000 "CREATE TABLE.*invoices" | \
    head -1000 > invoices_restore.sql

# Restore to database
psql -U thaiacc thai_accounting < invoices_restore.sql
```

#### Restore to Different Database

```bash
# Create new database
sudo -u postgres createdb thai_accounting_test

# Restore backup
gunzip -c backup_20260316.sql.gz | sudo -u postgres psql thai_accounting_test
```

---

## Troubleshooting

### Common Issues

#### Backup Fails Due to Permissions

```bash
# Fix permissions
sudo chown -R thaiacc:thaiacc /var/backups/thai-accounting
sudo chmod 755 /var/backups/thai-accounting

# If using PostgreSQL, ensure pg_dump access
sudo usermod -aG postgres thaiacc
```

#### Insufficient Disk Space

```bash
# Check disk usage
df -h

# Find large files
find /var/backups/thai-accounting -size +100M

# Clean old backups manually
find /var/backups/thai-accounting -mtime +7 -delete

# Compress old backups further
find /var/backups/thai-accounting -name "*.tar.gz" -mtime +3 -exec gzip -9 {} \;
```

#### Database Locked During Backup

```bash
# For SQLite, use online backup
sqlite3 /var/www/thai-accounting/prisma/prod.db ".backup '/tmp/backup.db'"

# For PostgreSQL, use concurrent backup
pg_dump -U thaiacc --lock-wait-timeout=5000 thai_accounting > backup.sql
```

#### Corrupted Backup

```bash
# Test archive integrity
tar -tzf backup_file.tar.gz > /dev/null

# If corrupted, try to recover
gzip -t backup_file.sql.gz  # Test gzip integrity

# Restore from alternative location (S3)
aws s3 cp s3://your-backup-bucket/thai-accounting/backup_file.sql.gz /tmp/
```

---

## Backup Checklist

### Daily
- [ ] Automated backup completed
- [ ] Backup logs reviewed for errors
- [ ] Backup size is reasonable

### Weekly
- [ ] Verify backup files exist
- [ ] Check backup integrity
- [ ] Review backup retention

### Monthly
- [ ] Test restore procedure
- [ ] Verify cloud backup sync
- [ ] Update backup scripts if needed
- [ ] Review RTO/RPO compliance

### Annually
- [ ] Full disaster recovery drill
- [ ] Update DR documentation
- [ ] Review backup strategy
- [ ] Test offsite restoration

---

*Last Updated: March 16, 2026*

**Remember:** A backup is only as good as your ability to restore from it. Test your restores regularly!
