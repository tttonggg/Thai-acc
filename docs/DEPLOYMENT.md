# Deployment Guide

## Thai Accounting ERP - Production Deployment

This guide covers deploying the Thai Accounting ERP system to production environments.

---

## Table of Contents

1. [Deployment Options](#deployment-options)
2. [Prerequisites](#prerequisites)
3. [Server Requirements](#server-requirements)
4. [Environment Setup](#environment-setup)
5. [SSL Configuration](#ssl-configuration)
6. [Database Setup](#database-setup)
7. [Application Deployment](#application-deployment)
8. [Reverse Proxy Setup](#reverse-proxy-setup)
9. [Process Management](#process-management)
10. [Monitoring Setup](#monitoring-setup)
11. [Backup Strategy](#backup-strategy)
12. [Troubleshooting](#troubleshooting)

---

## Deployment Options

| Method | Best For | Complexity |
|--------|----------|------------|
| **VPS/Dedicated Server** | Production workloads | Medium |
| **Docker** | Scalable deployments | Medium |
| **Cloud Platforms** | Enterprise/High availability | High |
| **Shared Hosting** | Small business/Low traffic | Low |

---

## Prerequisites

### Required Knowledge

- Linux command line basics
- Web server configuration (Nginx/Caddy)
- Database administration (SQLite/PostgreSQL)
- SSL/TLS certificate management

### Required Tools

- SSH client
- Git
- Text editor (nano/vim)
- Database client (optional)

---

## Server Requirements

### Minimum Specifications

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| CPU | 2 cores | 4+ cores |
| RAM | 4 GB | 8+ GB |
| Storage | 20 GB SSD | 50+ GB SSD |
| Network | 100 Mbps | 1 Gbps |

### Supported Operating Systems

- Ubuntu 20.04 LTS or higher
- Debian 11 or higher
- CentOS 8 / Rocky Linux 8
- AlmaLinux 8

### Software Requirements

```bash
# Required packages
- Node.js 18.x LTS
- Bun runtime (recommended) or npm
- Git
- Nginx or Caddy
- PM2 or systemd
- Certbot (for SSL)
```

---

## Environment Setup

### 1. Server Preparation

```bash
# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install required packages
sudo apt-get install -y \
  curl \
  wget \
  git \
  build-essential \
  nginx \
  certbot \
  python3-certbot-nginx

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Bun
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc
```

### 2. Create Application User

```bash
# Create dedicated user
sudo useradd -r -m -s /bin/bash thaiacc
sudo usermod -aG sudo thaiacc

# Set password
sudo passwd thaiacc

# Switch to user
sudo su - thaiacc
```

### 3. Application Directory Setup

```bash
# Create application directory
sudo mkdir -p /var/www/thai-accounting
cd /var/www/thai-accounting

# Set ownership
sudo chown -R thaiacc:thaiacc /var/www/thai-accounting
```

---

## SSL Configuration

### Using Let's Encrypt with Certbot

```bash
# Install Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Obtain certificate
sudo certbot certonly --nginx -d erp.yourdomain.com

# Auto-renewal is set up automatically
# Test renewal:
sudo certbot renew --dry-run
```

### Certificate Paths

```
/etc/letsencrypt/live/erp.yourdomain.com/
├── fullchain.pem    # Certificate + intermediates
├── privkey.pem      # Private key
├── cert.pem         # Certificate only
└── chain.pem        # Intermediates only
```

### Manual SSL Certificate

If using purchased certificates:

```bash
# Create certificate directory
sudo mkdir -p /etc/nginx/ssl

# Copy certificates
sudo cp your_domain.crt /etc/nginx/ssl/
sudo cp your_domain.key /etc/nginx/ssl/

# Set permissions
sudo chmod 600 /etc/nginx/ssl/*.key
sudo chmod 644 /etc/nginx/ssl/*.crt
```

---

## Database Setup

### Option 1: SQLite (Small Deployments)

```bash
# Database location
/var/www/thai-accounting/prisma/prod.db

# Ensure proper permissions
sudo chown thaiacc:thaiacc /var/www/thai-accounting/prisma/prod.db
sudo chmod 644 /var/www/thai-accounting/prisma/prod.db
```

**Note:** For SQLite, use absolute path in environment:
```env
DATABASE_URL="file:/var/www/thai-accounting/prisma/prod.db"
```

### Option 2: PostgreSQL (Recommended for Production)

```bash
# Install PostgreSQL
sudo apt-get install -y postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql << EOF
CREATE DATABASE thai_accounting;
CREATE USER thaiacc WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE thai_accounting TO thaiacc;
EOF

# Configure pg_hba.conf for local connections
sudo nano /etc/postgresql/14/main/pg_hba.conf

# Add:
local   thai_accounting   thaiacc                 md5

# Restart PostgreSQL
sudo systemctl restart postgresql
```

**Environment variable:**
```env
DATABASE_URL="postgresql://thaiacc:your_secure_password@localhost:5432/thai_accounting"
```

---

## Application Deployment

### 1. Clone and Build

```bash
# Switch to application user
sudo su - thaiacc

# Clone repository
cd /var/www/thai-accounting
git clone https://github.com/thaiaccounting/erp.git .

# Install dependencies
bun install

# Generate Prisma client
bun run db:generate

# Run database migrations
bun run db:migrate

# Build application
bun run build
```

### 2. Environment Configuration

Create production environment file:

```bash
cd /var/www/thai-accounting
cp .env.example .env.production
nano .env.production
```

Production environment variables:

```env
# Application
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0

# Database (PostgreSQL recommended)
DATABASE_URL="postgresql://thaiacc:password@localhost:5432/thai_accounting"

# NextAuth.js
NEXTAUTH_URL="https://erp.yourdomain.com"
NEXTAUTH_SECRET="your-very-secure-random-secret-min-32-chars"

# Security
TRUST_PROXY=true
RATE_LIMIT_ENABLED=true

# Optional: Email
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"

# Optional: Logging
LOG_LEVEL=info
LOG_FILE=/var/log/thai-accounting/app.log
```

### 3. Seed Database (First Deploy Only)

```bash
# Seed with initial data
bun run db:seed

# Or fresh reset with seed
bun run seed:fresh
```

---

## Reverse Proxy Setup

### Using Nginx

Create Nginx configuration:

```bash
sudo nano /etc/nginx/sites-available/thai-accounting
```

Configuration:

```nginx
server {
    listen 80;
    server_name erp.yourdomain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name erp.yourdomain.com;

    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/erp.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/erp.yourdomain.com/privkey.pem;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Logging
    access_log /var/log/nginx/thai-accounting-access.log;
    error_log /var/log/nginx/thai-accounting-error.log;

    # Proxy to Next.js app
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static files caching
    location /_next/static {
        proxy_pass http://localhost:3000/_next/static;
        proxy_cache_valid 200 365d;
        add_header Cache-Control "public, immutable";
    }

    # Uploads directory
    location /uploads {
        alias /var/www/thai-accounting/upload;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/thai-accounting /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Using Caddy (Simpler Alternative)

```bash
# Install Caddy
sudo apt-get install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt-get update
sudo apt-get install caddy
```

Caddyfile:

```
erp.yourdomain.com {
    reverse_proxy localhost:3000
    
    tls {
        protocols tls1.2 tls1.3
    }
    
    header {
        X-Frame-Options "SAMEORIGIN"
        X-Content-Type-Options "nosniff"
        X-XSS-Protection "1; mode=block"
        Referrer-Policy "strict-origin-when-cross-origin"
    }
    
    log {
        output file /var/log/caddy/access.log
    }
}
```

---

## Process Management

### Using PM2 (Recommended)

```bash
# Install PM2 globally
sudo npm install -g pm2

# Create ecosystem file
cat > /var/www/thai-accounting/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'thai-accounting',
    script: './node_modules/next/dist/bin/next',
    args: 'start',
    cwd: '/var/www/thai-accounting',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production'
    },
    error_file: '/var/log/thai-accounting/err.log',
    out_file: '/var/log/thai-accounting/out.log',
    log_file: '/var/log/thai-accounting/combined.log',
    time: true,
    max_memory_restart: '1G',
    restart_delay: 3000,
    max_restarts: 5,
    min_uptime: '10s'
  }]
};
EOF

# Create log directory
sudo mkdir -p /var/log/thai-accounting
sudo chown thaiacc:thaiacc /var/log/thai-accounting

# Start application
pm2 start ecosystem.config.js --env production

# Save PM2 config
pm2 save
pm2 startup systemd

# Copy and run the generated command
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u thaiacc --hp /home/thaiacc
```

PM2 Commands:

```bash
pm2 status                    # Check status
pm2 logs thai-accounting     # View logs
pm2 restart thai-accounting  # Restart app
pm2 reload thai-accounting   # Zero-downtime reload
pm2 stop thai-accounting     # Stop app
pm2 delete thai-accounting   # Remove from PM2
```

### Using systemd

```bash
sudo nano /etc/systemd/system/thai-accounting.service
```

Service file:

```ini
[Unit]
Description=Thai Accounting ERP
After=network.target

[Service]
Type=simple
User=thaiacc
WorkingDirectory=/var/www/thai-accounting
ExecStart=/usr/bin/bun run start
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable thai-accounting
sudo systemctl start thai-accounting

# Check status
sudo systemctl status thai-accounting
sudo journalctl -u thai-accounting -f
```

---

## Monitoring Setup

### Application Health Check

Create health check endpoint:

```bash
# Add to crontab for monitoring
curl -f http://localhost:3000/api/health || sudo systemctl restart thai-accounting
```

### Log Monitoring

```bash
# View application logs
sudo tail -f /var/log/thai-accounting/out.log
sudo tail -f /var/log/thai-accounting/err.log

# View Nginx logs
sudo tail -f /var/log/nginx/thai-accounting-error.log
```

### System Monitoring

Install monitoring tools:

```bash
# Basic monitoring
sudo apt-get install -y htop iotop nethogs

# For advanced monitoring, consider:
# - Netdata
# - Prometheus + Grafana
# - New Relic
# - Datadog
```

### Uptime Monitoring

Recommended services:
- UptimeRobot (free tier available)
- Pingdom
- StatusCake
- Freshping

---

## Backup Strategy

### Database Backup

```bash
# Create backup script
sudo nano /usr/local/bin/backup-thai-accounting.sh
```

Script:

```bash
#!/bin/bash

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/thai-accounting"
DB_NAME="thai_accounting"
APP_DIR="/var/www/thai-accounting"

# Create backup directory
mkdir -p $BACKUP_DIR

# PostgreSQL backup
pg_dump -U thaiacc $DB_NAME > $BACKUP_DIR/db_backup_$DATE.sql

# SQLite backup (if using SQLite)
# cp $APP_DIR/prisma/prod.db $BACKUP_DIR/db_backup_$DATE.db

# Application files backup
tar -czf $BACKUP_DIR/app_backup_$DATE.tar.gz -C $APP_DIR \
  --exclude=node_modules \
  --exclude=.next \
  --exclude=uploads .

# Keep only last 7 days of backups
find $BACKUP_DIR -type f -mtime +7 -delete

# Optional: Upload to cloud storage
# aws s3 sync $BACKUP_DIR s3://your-bucket/backups/
```

Make executable and schedule:

```bash
sudo chmod +x /usr/local/bin/backup-thai-accounting.sh

# Add to crontab (daily at 2 AM)
0 2 * * * /usr/local/bin/backup-thai-accounting.sh >> /var/log/backup.log 2>&1
```

### Restore from Backup

```bash
# Restore database
sudo -u postgres psql thai_accounting < db_backup_20260316_020000.sql

# Restore application files
cd /var/www/thai-accounting
sudo tar -xzf /var/backups/thai-accounting/app_backup_20260316_020000.tar.gz
```

---

## Troubleshooting

### Application Won't Start

```bash
# Check logs
pm2 logs thai-accounting
# or
sudo journalctl -u thai-accounting -n 100

# Check port usage
sudo lsof -i :3000

# Test directly
NODE_ENV=production bun run start
```

### Database Connection Issues

```bash
# Test database connection
psql -U thaiacc -d thai_accounting -c "SELECT 1"

# Check PostgreSQL status
sudo systemctl status postgresql

# Check connection limits
sudo -u postgres psql -c "SHOW max_connections;"
```

### Nginx Errors

```bash
# Test configuration
sudo nginx -t

# Check error logs
sudo tail -f /var/log/nginx/error.log

# Restart Nginx
sudo systemctl restart nginx
```

### SSL Certificate Issues

```bash
# Test certificate
openssl s_client -connect erp.yourdomain.com:443

# Renew certificate manually
sudo certbot renew

# Check certificate expiry
sudo certbot certificates
```

---

## Deployment Checklist

Pre-deployment:
- [ ] Server meets minimum requirements
- [ ] Domain name configured with DNS
- [ ] SSL certificate obtained
- [ ] Database server installed and configured
- [ ] Firewall configured (ports 80, 443, 22)

Deployment:
- [ ] Application code deployed
- [ ] Dependencies installed
- [ ] Database migrated
- [ ] Environment variables configured
- [ ] Application built successfully
- [ ] Process manager configured
- [ ] Reverse proxy configured
- [ ] SSL configured

Post-deployment:
- [ ] Application accessible via HTTPS
- [ ] Login working with default credentials
- [ ] Database seeded (if first deploy)
- [ ] File uploads working
- [ ] Email notifications working (if configured)
- [ ] Backup script configured
- [ ] Monitoring enabled
- [ ] Documentation updated

---

*Last Updated: March 16, 2026*
