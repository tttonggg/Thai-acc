# Thai Accounting ERP - Production Deployment Guide

Complete guide for deploying Thai Accounting ERP to production environments.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start Deployment](#quick-start-deployment)
3. [Manual Deployment Steps](#manual-deployment-steps)
4. [Service Management](#service-management)
5. [Health Monitoring](#health-monitoring)
6. [Troubleshooting](#troubleshooting)
7. [Security Considerations](#security-considerations)
8. [Backup and Recovery](#backup-and-recovery)

---

## Prerequisites

### System Requirements

- **OS**: Linux (Ubuntu 20.04+, Debian 11+, CentOS 8+) or macOS
- **Runtime**: Bun 1.0+ or Node.js 20+
- **Memory**: 1GB RAM minimum (2GB recommended)
- **Disk**: 500MB free space minimum
- **Database**: SQLite (included) or PostgreSQL 14+

### Required Software

```bash
# Install Bun (recommended)
curl -fsSL https://bun.sh/install | bash

# OR install Node.js
sudo apt-get update
sudo apt-get install -y nodejs npm

# Install build tools
sudo apt-get install -y build-essential python3

# Install SQLite3 (for development)
sudo apt-get install -y sqlite3
```

---

## Quick Start Deployment

### Automated Deployment

```bash
# Clone repository
cd Thai-acc

# Run deployment script
sudo ./scripts/deploy-production.sh
```

This script will:
1. Check system requirements
2. Backup existing database
3. Install dependencies
4. Build application
5. Deploy to /opt/thai-accounting
6. Create systemd service
7. Start and verify deployment

---

## Service Management

```bash
# Start service
sudo systemctl start thai-accounting

# Stop service
sudo systemctl stop thai-accounting

# Check status
sudo systemctl status thai-accounting

# View logs
sudo journalctl -u thai-accounting -f
```

---

## Health Monitoring

```bash
# Run health check
sudo ./scripts/health-check.sh
```

Checks:
- Service running
- Port listening
- Web response
- Database health
- Disk space
- Memory usage
- Log errors
- API endpoints

---

## Troubleshooting

### Login Fails

Edit `/opt/thai-accounting/.env`:
```
DATABASE_URL=file:/opt/thai-accounting/dev.db
```

Restart service:
```bash
sudo systemctl restart thai-accounting
```

---

## Security

### Change Default Password

```
Email: admin@thaiaccounting.com
Password: admin123
```

### Generate Secure Secret

```bash
openssl rand -base64 32
```

---

## Version

- **Application**: Thai Accounting ERP
- **Version**: 1.0.0
- **Status**: Production Ready ✅
