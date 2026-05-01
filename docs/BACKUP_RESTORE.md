# Thai Accounting ERP - Backup and Restore Guide

## Table of Contents

1. [Backup Strategy Overview](#backup-strategy-overview)
2. [Automated Backup Setup](#automated-backup-setup)
3. [Manual Backup Procedures](#manual-backup-procedures)
4. [Restore Procedures](#restore-procedures)
5. [Disaster Recovery Plan](#disaster-recovery-plan)
6. [Backup Verification](#backup-verification)
7. [Cloud Backup Options](#cloud-backup-options)
8. [Retention Policies](#retention-policies)

---

## Backup Strategy Overview

### 3-2-1 Backup Rule

- **3** copies of data
- **2** different storage media
- **1** offsite copy

### What to Backup

| Component     | Type              | Frequency | Retention |
| ------------- | ----------------- | --------- | --------- |
| Database      | SQLite/PostgreSQL | Daily     | 30 days   |
| Uploads       | Files             | Daily     | 30 days   |
| Configuration | Environment files | Weekly    | 90 days   |
| Logs          | System logs       | Weekly    | 90 days   |

### Backup Types

1. **Full Backup**: Complete copy of all data
2. **Incremental**: Changes since last backup
3. **Differential**: Changes since last full backup

---

## Automated Backup Setup

### Daily Automated Backup Script

```bash
#!/bin/bash
# /opt/backup/scripts/backup-daily.sh

set -e

# Configuration
APP_DIR="/home/thaiacc/erp"
BACKUP_DIR="/backup/daily"
DB_PATH="$APP_DIR/data/prod.db"
UPLOADS_DIR="$APP_DIR/uploads"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="thai-acc-backup-$DATE"
RETENTION_DAYS=30

# Create backup directory
mkdir -p "$BACKUP_DIR/$BACKUP_NAME"

# Function to log messages
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$BACKUP_DIR/backup.log"
}

log "Starting backup: $BACKUP_NAME"

# Backup database
log "Backing up database..."
sqlite3 "$DB_PATH" ".backup '$BACKUP_DIR/$BACKUP_NAME/database.db'"
if [ $? -eq 0 ]; then
    log "Database backup successful"
else
    log "ERROR: Database backup failed"
    exit 1
fi

# Backup uploads
log "Backing up uploads..."
tar -czf "$BACKUP_DIR/$BACKUP_NAME/uploads.tar.gz" -C "$APP_DIR" uploads/
if [ $? -eq 0 ]; then
    log "Uploads backup successful"
else
    log "ERROR: Uploads backup failed"
    exit 1
fi

# Backup configuration
log "Backing up configuration..."
cp "$APP_DIR/.env.production" "$BACKUP_DIR/$BACKUP_NAME/"
cp -r "$APP_DIR/prisma" "$BACKUP_DIR/$BACKUP_NAME/"

# Create metadata
cat > "$BACKUP_DIR/$BACKUP_NAME/metadata.json" << EOF
{
    "backup_name": "$BACKUP_NAME",
    "created_at": "$(date -Iseconds)",
    "version": "$(cat $APP_DIR/package.json | grep version | head -1 | awk -F: '{ print $2 }' | sed 's/[",]//g' | tr -d ' ')",
    "database_size": "$(du -h $BACKUP_DIR/$BACKUP_NAME/database.db | cut -f1)",
    "uploads_size": "$(du -h $BACKUP_DIR/$BACKUP_NAME/uploads.tar.gz | cut -f1)"
}
EOF

# Compress entire backup
tar -czf "$BACKUP_DIR/${BACKUP_NAME}.tar.gz" -C "$BACKUP_DIR" "$BACKUP_NAME"
rm -rf "$BACKUP_DIR/$BACKUP_NAME"

# Calculate checksum
sha256sum "$BACKUP_DIR/${BACKUP_NAME}.tar.gz" > "$BACKUP_DIR/${BACKUP_NAME}.tar.gz.sha256"

log "Backup completed: ${BACKUP_NAME}.tar.gz"

# Cleanup old backups
log "Cleaning up backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -name "thai-acc-backup-*.tar.gz" -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name "thai-acc-backup-*.tar.gz.sha256" -mtime +$RETENTION_DAYS -delete

# Sync to remote storage (optional)
if [ -f "/opt/backup/scripts/sync-remote.sh" ]; then
    log "Syncing to remote storage..."
    /opt/backup/scripts/sync-remote.sh "$BACKUP_DIR/${BACKUP_NAME}.tar.gz"
fi

log "Backup process completed successfully"
```

### Cron Setup

```bash
# Make script executable
chmod +x /opt/backup/scripts/backup-daily.sh

# Edit crontab
sudo crontab -e

# Add daily backup at 2 AM
0 2 * * * /opt/backup/scripts/backup-daily.sh >> /var/log/backup.log 2>&1

# Add weekly full backup at 3 AM on Sundays
0 3 * * 0 /opt/backup/scripts/backup-weekly.sh >> /var/log/backup.log 2>&1

# Verify cron jobs
sudo crontab -l
```

### Systemd Timer (Alternative)

```bash
# Create backup service
sudo tee /etc/systemd/system/thai-acc-backup.service << 'EOF'
[Unit]
Description=Thai Accounting ERP Backup
After=network.target

[Service]
Type=oneshot
User=thaiacc
ExecStart=/opt/backup/scripts/backup-daily.sh
EOF

# Create timer
sudo tee /etc/systemd/system/thai-acc-backup.timer << 'EOF'
[Unit]
Description=Run Thai Accounting ERP backup daily

[Timer]
OnCalendar=daily
Persistent=true

[Install]
WantedBy=timers.target
EOF

# Enable timer
sudo systemctl daemon-reload
sudo systemctl enable thai-acc-backup.timer
sudo systemctl start thai-acc-backup.timer

# Check status
sudo systemctl list-timers thai-acc-backup.timer
```

---

## Manual Backup Procedures

### In-Application Backup

```bash
# Via application UI
# Settings → Backup & Restore → Create Backup
```

### Command Line Backup

```bash
# 1. Stop application (optional but recommended)
pm2 stop thai-accounting-erp

# 2. Backup database
cp /home/thaiacc/erp/data/prod.db /backup/manual/prod-$(date +%Y%m%d).db

# 3. Backup uploads
tar -czf /backup/manual/uploads-$(date +%Y%m%d).tar.gz /home/thaiacc/erp/uploads/

# 4. Backup configuration
cp /home/thaiacc/erp/.env.production /backup/manual/env-$(date +%Y%m%d)

# 5. Restart application
pm2 start thai-accounting-erp
```

### Hot Backup (No Downtime)

```bash
# For SQLite - use backup API
sqlite3 /home/thaiacc/erp/data/prod.db ".backup /backup/hot/backup-$(date +%Y%m%d).db"

# For PostgreSQL
pg_dump -h localhost -U thaiacc thaiacc > /backup/hot/backup-$(date +%Y%m%d).sql
```

---

## Restore Procedures

### Full Restore

```bash
#!/bin/bash
# restore.sh - Full system restore

set -e

BACKUP_FILE=$1
RESTORE_DIR="/tmp/restore-$(date +%s)"
APP_DIR="/home/thaiacc/erp"

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup-file.tar.gz>"
    exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
    echo "Backup file not found: $BACKUP_FILE"
    exit 1
fi

# Verify checksum
echo "Verifying backup integrity..."
if ! sha256sum -c "${BACKUP_FILE}.sha256"; then
    echo "ERROR: Backup checksum verification failed!"
    exit 1
fi

# Extract backup
mkdir -p "$RESTORE_DIR"
echo "Extracting backup..."
tar -xzf "$BACKUP_FILE" -C "$RESTORE_DIR"

# Find extracted directory
EXTRACTED_DIR=$(find "$RESTORE_DIR" -maxdepth 1 -type d | tail -1)

echo "Stopping application..."
pm2 stop thai-accounting-erp

echo "Creating safety backup of current data..."
cp "$APP_DIR/data/prod.db" "$APP_DIR/data/prod.db.pre-restore-$(date +%Y%m%d%H%M%S)"

echo "Restoring database..."
cp "$EXTRACTED_DIR/database.db" "$APP_DIR/data/prod.db"

echo "Restoring uploads..."
tar -xzf "$EXTRACTED_DIR/uploads.tar.gz" -C "$APP_DIR"

echo "Restoring configuration..."
cp "$EXTRACTED_DIR/.env.production" "$APP_DIR/.env.production.restored"

echo "Setting permissions..."
chown -R thaiacc:thaiacc "$APP_DIR/data"
chown -R thaiacc:thaiacc "$APP_DIR/uploads"
chmod 600 "$APP_DIR/data/prod.db"

echo "Starting application..."
pm2 start thai-accounting-erp

echo "Verifying restore..."
sleep 5
curl -s http://localhost:3000/api/health | grep -q "ok" && echo "Restore successful!" || echo "Warning: Health check failed"

# Cleanup
rm -rf "$RESTORE_DIR"

echo "Restore completed. Check logs for any issues."
echo "Previous database saved as: $APP_DIR/data/prod.db.pre-restore-*"
```

### Point-in-Time Recovery (PostgreSQL)

```bash
# Restore from base backup
pg_restore -h localhost -U thaiacc -d thaiacc base-backup.dump

# Apply WAL files for point-in-time recovery
pg_waldump /var/lib/postgresql/wal/...
```

### Selective Restore

```bash
# Restore only database
cp backup/database.db /home/thaiacc/erp/data/prod.db

# Restore only specific uploads
tar -xzf backup/uploads.tar.gz -C /home/thaiacc/erp uploads/2024/
```

---

## Disaster Recovery Plan

### Recovery Time Objectives (RTO)

| Scenario            | RTO      | RPO      |
| ------------------- | -------- | -------- |
| Database corruption | 1 hour   | 24 hours |
| Server failure      | 4 hours  | 24 hours |
| Data center failure | 8 hours  | 24 hours |
| Catastrophic event  | 24 hours | 48 hours |

### Recovery Procedures

#### Scenario 1: Database Corruption

```bash
# 1. Identify last good backup
ls -lt /backup/daily/*.tar.gz | head -5

# 2. Stop application
pm2 stop thai-accounting-erp

# 3. Restore from backup
./restore.sh /backup/daily/thai-acc-backup-YYYYMMDD_HHMMSS.tar.gz

# 4. Verify data integrity
sqlite3 /home/thaiacc/erp/data/prod.db "PRAGMA integrity_check;"

# 5. Start application
pm2 start thai-accounting-erp
```

#### Scenario 2: Server Failure

```bash
# On new server:
# 1. Install dependencies (see DEPLOYMENT_GUIDE.md)

# 2. Download latest backup from remote storage
aws s3 cp s3://backup-bucket/thai-acc/latest.tar.gz /backup/

# 3. Restore
./restore.sh /backup/latest.tar.gz

# 4. Update DNS or configure load balancer
```

#### Scenario 3: Complete Data Loss

```bash
# Emergency recovery procedure
# 1. Provision new server
# 2. Install application
# 3. Restore from offsite backup
# 4. Notify users of downtime
# 5. Post-incident review
```

### Disaster Recovery Checklist

- [ ] Activate incident response team
- [ ] Assess damage and scope
- [ ] Notify stakeholders
- [ ] Execute recovery procedures
- [ ] Verify data integrity
- [ ] Resume operations
- [ ] Document incident
- [ ] Post-mortem analysis

---

## Backup Verification

### Automated Verification Script

```bash
#!/bin/bash
# verify-backup.sh

BACKUP_FILE=$1
TEMP_DIR=$(mktemp -d)

echo "Verifying backup: $BACKUP_FILE"

# Check file exists and readable
if [ ! -r "$BACKUP_FILE" ]; then
    echo "FAIL: Cannot read backup file"
    exit 1
fi

# Verify checksum
if [ -f "${BACKUP_FILE}.sha256" ]; then
    if sha256sum -c "${BACKUP_FILE}.sha256"; then
        echo "PASS: Checksum verification"
    else
        echo "FAIL: Checksum mismatch"
        rm -rf "$TEMP_DIR"
        exit 1
    fi
fi

# Extract and verify contents
tar -xzf "$BACKUP_FILE" -C "$TEMP_DIR"
EXTRACTED_DIR=$(find "$TEMP_DIR" -maxdepth 1 -type d | tail -1)

# Check required files exist
for file in "database.db" "uploads.tar.gz" "metadata.json"; do
    if [ -f "$EXTRACTED_DIR/$file" ]; then
        echo "PASS: $file exists"
    else
        echo "FAIL: $file missing"
        rm -rf "$TEMP_DIR"
        exit 1
    fi
done

# Verify database integrity
if sqlite3 "$EXTRACTED_DIR/database.db" "PRAGMA integrity_check;" | grep -q "ok"; then
    echo "PASS: Database integrity check"
else
    echo "FAIL: Database corruption detected"
    rm -rf "$TEMP_DIR"
    exit 1
fi

# Check metadata
if [ -f "$EXTRACTED_DIR/metadata.json" ]; then
    cat "$EXTRACTED_DIR/metadata.json"
fi

# Cleanup
rm -rf "$TEMP_DIR"

echo "Backup verification completed successfully"
```

### Monthly Restore Test

```bash
#!/bin/bash
# monthly-restore-test.sh

# This should run on a separate test server

LATEST_BACKUP=$(ls -t /backup/daily/*.tar.gz | head -1)
TEST_DIR="/tmp/restore-test-$(date +%Y%m%d)"

echo "Testing restore of: $LATEST_BACKUP"

# Perform restore test
./restore.sh "$LATEST_BACKUP"

# Run health checks
curl -s http://localhost:3000/api/health | grep -q "ok" || exit 1

# Run basic tests
bun run test:smoke

# Report results
echo "Restore test completed at $(date)"
echo "Backup tested: $LATEST_BACKUP"
```

---

## Cloud Backup Options

### AWS S3 Backup

```bash
# Install AWS CLI
sudo apt install awscli

# Configure
aws configure

# Backup script
#!/bin/bash
BACKUP_FILE=$1
BUCKET="thai-acc-backups"

# Upload with encryption
aws s3 cp "$BACKUP_FILE" "s3://$BUCKET/daily/" --sse AES256

# Set lifecycle policy
aws s3api put-bucket-lifecycle-configuration \
    --bucket $BUCKET \
    --lifecycle-configuration file://lifecycle.json
```

### Google Cloud Storage

```bash
# Upload backup
gsutil cp backup.tar.gz gs://thai-acc-backups/daily/

# Enable versioning
gsutil versioning set on gs://thai-acc-backups
```

### Azure Blob Storage

```bash
# Upload backup
az storage blob upload \
    --container-name backups \
    --file backup.tar.gz \
    --name daily/backup.tar.gz \
    --account-name thaiaccstorage
```

---

## Retention Policies

### Local Backup Retention

```bash
# Daily backups: 30 days
find /backup/daily -name "*.tar.gz" -mtime +30 -delete

# Weekly backups: 12 weeks
find /backup/weekly -name "*.tar.gz" -mtime +84 -delete

# Monthly backups: 12 months
find /backup/monthly -name "*.tar.gz" -mtime +365 -delete
```

### Cloud Retention Policy

```json
// lifecycle.json for S3
{
  "Rules": [
    {
      "ID": "DailyBackupRetention",
      "Status": "Enabled",
      "Filter": {
        "Prefix": "daily/"
      },
      "Expiration": {
        "Days": 30
      }
    },
    {
      "ID": "MonthlyBackupTransition",
      "Status": "Enabled",
      "Filter": {
        "Prefix": "monthly/"
      },
      "Transitions": [
        {
          "Days": 90,
          "StorageClass": "GLACIER"
        }
      ]
    }
  ]
}
```

---

**Last Updated:** March 16, 2026  
**Backup Frequency:** Daily at 02:00  
**Next Review:** April 16, 2026
