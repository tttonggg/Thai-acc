# Thai Accounting ERP - Database Restore Procedures

# โปรแกรมบัญชีมาตรฐานไทย - ขั้นตอนการกู้คืนฐานข้อมูล

## 1. Disaster Recovery Scenarios

### Scenario A: Complete Database Loss

**Symptoms:** Database file corrupted or deleted, application cannot start

**Recovery Steps:**

1. **Stop the application**

   ```bash
   cd /path/to/thai-acc
   ./scripts/stop-production.sh
   ```

2. **Identify the latest backup**

   ```bash
   ./scripts/backup/backup-database.sh list
   ```

3. **Restore from backup**

   ```bash
   # For SQLite
   ./scripts/backup/backup-database.sh restore thai-acc-20260315-120000.db.gz.gpg

   # For PostgreSQL
   ./scripts/backup/backup-database.sh restore thai-acc-pg-20260315-120000.sql.gpg
   ```

4. **Verify database integrity**

   ```bash
   # SQLite
   sqlite3 prisma/dev.db "PRAGMA integrity_check;"

   # PostgreSQL
   psql -h localhost -U thaiacc -d thai_accounting -c "SELECT 1;"
   ```

5. **Start the application**
   ```bash
   ./scripts/start-production.sh
   ```

### Scenario B: Point-in-Time Recovery (PostgreSQL)

**Use Case:** Recover to a specific point before a data corruption event

**Prerequisites:**

- WAL archiving enabled
- Base backup available

**Recovery Steps:**

1. **Stop PostgreSQL**

   ```bash
   sudo systemctl stop postgresql
   ```

2. **Prepare recovery environment**

   ```bash
   sudo -u postgres rm -rf /var/lib/postgresql/data/*
   sudo -u postgres mkdir -p /var/lib/postgresql/data
   ```

3. **Restore base backup**

   ```bash
   sudo -u postgres pg_basebackup -D /var/lib/postgresql/data -X fetch
   ```

4. **Create recovery configuration**

   ```bash
   cat > /var/lib/postgresql/data/recovery.conf <<EOF
   restore_command = 'cp /var/backups/wal/%f %p'
   recovery_target_time = '2026-03-15 14:30:00'
   recovery_target_action = 'promote'
   EOF
   ```

5. **Start PostgreSQL**
   ```bash
   sudo systemctl start postgresql
   ```

### Scenario C: Partial Data Recovery

**Use Case:** Recover specific tables or records

**Steps:**

1. **Restore to temporary database**

   ```bash
   # Create temp database
   createdb thai_acc_temp

   # Restore backup to temp
   pg_restore -d thai_acc_temp backup_file.sql
   ```

2. **Export specific data**

   ```bash
   pg_dump -t "Invoice" thai_acc_temp > invoices_backup.sql
   ```

3. **Import to production**

   ```bash
   psql thai_accounting < invoices_backup.sql
   ```

4. **Clean up**
   ```bash
   dropdb thai_acc_temp
   ```

## 2. Restore Verification Checklist

After any restore operation, verify:

- [ ] Application starts successfully
- [ ] User login works
- [ ] Recent transactions are present
- [ ] Financial reports generate correctly
- [ ] VAT records are intact
- [ ] Customer/Vendor balances are correct
- [ ] Inventory quantities match physical count
- [ ] Bank reconciliation matches statements

## 3. Automated Verification Script

```bash
#!/bin/bash
# Run after restore to verify data integrity

echo "=== Post-Restore Verification ==="

# Check user count
USER_COUNT=$(psql -U thaiacc -d thai_accounting -t -c "SELECT COUNT(*) FROM \"User\";")
echo "✓ Users: $USER_COUNT"

# Check recent invoices
INVOICE_COUNT=$(psql -U thaiacc -d thai_accounting -t -c "SELECT COUNT(*) FROM \"Invoice\" WHERE \"createdAt\" > NOW() - INTERVAL '30 days';")
echo "✓ Recent Invoices (30d): $INVOICE_COUNT"

# Check journal balance
BALANCE_CHECK=$(psql -U thaiacc -d thai_accounting -t -c "SELECT CASE WHEN SUM(debit) = SUM(credit) THEN 'BALANCED' ELSE 'UNBALANCED' END FROM \"JournalLine\";")
echo "✓ Journal Balance: $BALANCE_CHECK"

# Check stock quantities
NEGATIVE_STOCK=$(psql -U thaiacc -d thai_accounting -t -c "SELECT COUNT(*) FROM \"StockBalance\" WHERE quantity < 0;")
echo "✓ Negative Stock Items: $NEGATIVE_STOCK"

# Verify totals match
TOTAL_INVOICES=$(psql -U thaiacc -d thai_accounting -t -c "SELECT SUM(\"totalAmount\") FROM \"Invoice\" WHERE status IN ('ISSUED', 'PARTIAL', 'PAID');")
echo "✓ Total Invoice Amount: $(echo $TOTAL_INVOICES | xargs) บาท"

echo "=== Verification Complete ==="
```

## 4. Backup Monitoring

### Setup Cron Jobs

```bash
# Edit crontab
crontab -e

# Daily full backup at 2 AM
0 2 * * * /path/to/thai-acc/scripts/backup/backup-database.sh full >> /var/log/thai-acc-backup.log 2>&1

# Hourly incremental backup (PostgreSQL only)
0 * * * * /path/to/thai-acc/scripts/backup/backup-database.sh incremental >> /var/log/thai-acc-backup.log 2>&1

# Weekly verification
0 3 * * 0 /path/to/thai-acc/scripts/backup/backup-database.sh verify /var/backups/thai-accounting/daily/latest.gpg >> /var/log/thai-acc-verify.log 2>&1
```

### Health Check Endpoint

Add to your monitoring system:

```bash
#!/bin/bash
# backup-health-check.sh

MANIFEST="/var/backups/thai-accounting/last-backup.manifest"

if [ ! -f "$MANIFEST" ]; then
    echo "CRITICAL: No backup manifest found"
    exit 2
fi

BACKUP_TIME=$(jq -r '.timestamp' "$MANIFEST")
BACKUP_AGE=$(( ($(date +%s) - $(date -d "$BACKUP_TIME" +%s)) / 3600 ))

if [ $BACKUP_AGE -gt 26 ]; then
    echo "CRITICAL: Last backup is ${BACKUP_AGE}h old"
    exit 2
elif [ $BACKUP_AGE -gt 6 ]; then
    echo "WARNING: Last backup is ${BACKUP_AGE}h old"
    exit 1
else
    echo "OK: Last backup is ${BACKUP_AGE}h old"
    exit 0
fi
```

## 5. Emergency Contacts

| Role             | Name | Contact | Responsibility  |
| ---------------- | ---- | ------- | --------------- |
| System Admin     |      |         | Infrastructure  |
| Database Admin   |      |         | Data recovery   |
| Business Owner   |      |         | Decision making |
| External Support |      |         | Escalation      |

## 6. Recovery Time Objectives (RTO)

| Scenario        | RTO        | RPO       |
| --------------- | ---------- | --------- |
| Full restore    | 30 minutes | 1 hour    |
| Partial restore | 15 minutes | 1 hour    |
| Point-in-time   | 60 minutes | 5 minutes |

## 7. Post-Recovery Actions

1. **Document the incident**
   - Cause of data loss
   - Recovery time taken
   - Data loss extent (if any)

2. **Update backup strategy** if needed

3. **Test additional backups** to ensure they work

4. **Review and update** this procedure
