# Thai Accounting ERP - Deployment Guide

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [Installation Steps](#installation-steps)
4. [Environment Configuration](#environment-configuration)
5. [SSL/TLS Setup](#ssltls-setup)
6. [Reverse Proxy Configuration](#reverse-proxy-configuration)
7. [Docker Deployment](#docker-deployment)
8. [Cloud Deployment](#cloud-deployment)
9. [Post-Deployment Verification](#post-deployment-verification)
10. [Rollback Procedures](#rollback-procedures)

---

## System Requirements

### Minimum Requirements

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| CPU | 2 cores | 4+ cores |
| RAM | 4 GB | 8+ GB |
| Storage | 20 GB SSD | 50+ GB SSD |
| Network | 100 Mbps | 1 Gbps |

### Supported Operating Systems

- Ubuntu 22.04 LTS (Recommended)
- Debian 11+
- CentOS 8+
- Windows Server 2019+

### Required Software

- Node.js 18+ or Bun 1.0+
- Git
- Nginx or Caddy (reverse proxy)
- PM2 or systemd (process management)

---

## Pre-Deployment Checklist

- [ ] Domain name registered and DNS configured
- [ ] SSL certificate obtained (Let's Encrypt or commercial)
- [ ] Server provisioned with required specs
- [ ] Firewall configured
- [ ] Backup storage configured
- [ ] Monitoring tools installed
- [ ] Database credentials ready
- [ ] Email service configured

---

## Installation Steps

### 1. Server Preparation (Ubuntu)

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y git curl nginx certbot python3-certbot-nginx

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Or install Bun
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc

# Create app user
sudo useradd -m -s /bin/bash thaiacc
sudo usermod -aG sudo thaiacc
```

### 2. Application Setup

```bash
# Switch to app user
sudo su - thaiacc

# Clone repository
git clone https://github.com/thaiaccounting/erp.git
cd erp

# Install dependencies
bun install

# Build application
bun run build

# Create required directories
mkdir -p uploads backups logs
```

### 3. Environment Configuration

```bash
# Create production environment file
cp .env.example .env.production

# Edit configuration
nano .env.production
```

```env
# .env.production
NODE_ENV=production

# Database (SQLite for small deployments)
DATABASE_URL=file:/home/thaiacc/erp/data/prod.db

# For PostgreSQL (recommended for production)
# DATABASE_URL=postgresql://user:pass@localhost:5432/thaiacc

# Authentication
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-super-secret-key-min-32-characters

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@your-domain.com
SMTP_PASSWORD=your-app-password

# Storage
UPLOAD_DIR=/home/thaiacc/erp/uploads
BACKUP_DIR=/home/thaiacc/erp/backups

# Logging
LOG_LEVEL=info
LOG_DIR=/home/thaiacc/erp/logs
```

### 4. Database Setup

```bash
# Initialize database
bun run db:generate
bun run db:migrate

# Seed initial data (optional)
bun run db:seed

# Set proper permissions
chmod 600 .env.production
chmod 755 data/
```

---

## Environment Configuration

### Process Management with PM2

```bash
# Install PM2
sudo npm install -g pm2

# Create ecosystem file
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'thai-accounting-erp',
    cwd: '/home/thaiacc/erp',
    script: './.next/standalone/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    log_file: '/home/thaiacc/erp/logs/combined.log',
    out_file: '/home/thaiacc/erp/logs/out.log',
    error_file: '/home/thaiacc/erp/logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    max_memory_restart: '1G',
    restart_delay: 3000,
    max_restarts: 5,
    min_uptime: '10s'
  }]
};
EOF

# Start application
pm2 start ecosystem.config.js --env production

# Save PM2 config
pm2 save
pm2 startup systemd
```

### Systemd Service (Alternative)

```bash
# Create service file
sudo tee /etc/systemd/system/thai-acc.service << 'EOF'
[Unit]
Description=Thai Accounting ERP
After=network.target

[Service]
Type=simple
User=thaiacc
WorkingDirectory=/home/thaiacc/erp
ExecStart=/usr/bin/bun run start
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable thai-acc
sudo systemctl start thai-acc
```

---

## SSL/TLS Setup

### Let's Encrypt (Free)

```bash
# Obtain certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal test
sudo certbot renew --dry-run

# Setup auto-renewal cron
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

### Manual Certificate

```bash
# Create certificate directory
sudo mkdir -p /etc/ssl/thai-acc

# Copy certificates
sudo cp your-certificate.crt /etc/ssl/thai-acc/cert.pem
sudo cp your-private.key /etc/ssl/thai-acc/key.pem
sudo cp your-ca-bundle.crt /etc/ssl/thai-acc/chain.pem

# Set permissions
sudo chmod 600 /etc/ssl/thai-acc/*.pem
```

---

## Reverse Proxy Configuration

### Nginx Configuration

```nginx
# /etc/nginx/sites-available/thai-acc
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # SSL settings
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

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Client body size
    client_max_body_size 50M;

    # Static files caching
    location /_next/static {
        alias /home/thaiacc/erp/.next/static;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /static {
        alias /home/thaiacc/erp/public;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

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
        proxy_read_timeout 86400;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/thai-acc /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Caddy Configuration (Simpler Alternative)

```bash
# Install Caddy
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy
```

```
# /etc/caddy/Caddyfile
your-domain.com {
    # Automatic HTTPS
    
    # Reverse proxy
    reverse_proxy localhost:3000
    
    # File server for static files
    file_server /static/* {
        root /home/thaiacc/erp/public
    }
    
    # Headers
    header {
        X-Frame-Options "SAMEORIGIN"
        X-Content-Type-Options "nosniff"
        X-XSS-Protection "1; mode=block"
        Referrer-Policy "strict-origin-when-cross-origin"
    }
    
    # Compression
    encode gzip zstd
}
```

```bash
sudo systemctl reload caddy
```

---

## Docker Deployment

### Dockerfile

```dockerfile
# Dockerfile
FROM oven/bun:1 AS base

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

# Build application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Create directories for uploads and data
RUN mkdir -p uploads backups data
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV HOSTNAME="0.0.0.0"
CMD ["bun", "run", "server.js"]
```

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=file:/app/data/prod.db
      - NEXTAUTH_URL=${NEXTAUTH_URL}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
    volumes:
      - ./data:/app/data
      - ./uploads:/app/uploads
      - ./backups:/app/backups
      - ./logs:/app/logs
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Optional: PostgreSQL
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: thaiacc
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  # Optional: Redis for caching
  redis:
    image: redis:7-alpine
    restart: unless-stopped

volumes:
  postgres_data:
```

```bash
# Build and run
docker-compose up -d --build

# View logs
docker-compose logs -f app

# Scale application
docker-compose up -d --scale app=3
```

---

## Cloud Deployment

### Vercel (Easiest)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### AWS (EC2)

```bash
# 1. Launch EC2 instance (t3.medium or higher)
# 2. Configure security group (ports 22, 80, 443)
# 3. Connect via SSH
# 4. Follow Installation Steps above
# 5. Configure Route 53 DNS
```

### Google Cloud Platform (Cloud Run)

```bash
# Build container
gcloud builds submit --tag gcr.io/PROJECT_ID/thai-acc

# Deploy to Cloud Run
gcloud run deploy thai-acc \
  --image gcr.io/PROJECT_ID/thai-acc \
  --platform managed \
  --region asia-southeast1 \
  --allow-unauthenticated \
  --set-env-vars="NODE_ENV=production"
```

---

## Post-Deployment Verification

### Health Checks

```bash
# Check application health
curl https://your-domain.com/api/health

# Check database connection
curl https://your-domain.com/api/health/db

# Verify SSL
curl -I https://your-domain.com
```

### Log Verification

```bash
# Application logs
pm2 logs thai-accounting-erp

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# System logs
sudo journalctl -u thai-acc -f
```

### Performance Testing

```bash
# Install artillery
npm install -g artillery

# Create test config
cat > load-test.yml << 'EOF'
config:
  target: 'https://your-domain.com'
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - name: "Login and view dashboard"
    flow:
      - post:
          url: "/api/auth/callback/credentials"
          json:
            email: "admin@example.com"
            password: "admin123"
      - get:
          url: "/dashboard"
EOF

# Run load test
artillery run load-test.yml
```

---

## Rollback Procedures

### Quick Rollback

```bash
# Rollback to previous version
pm2 reload thai-accounting-erp --update-env

# Or with git
git log --oneline -10
git revert HEAD
bun run build
pm2 reload thai-accounting-erp
```

### Database Rollback

```bash
# Restore from backup
cp backups/db-backup-20260316.db data/prod.db
pm2 reload thai-accounting-erp
```

### Emergency Procedures

```bash
# Stop application
pm2 stop thai-accounting-erp

# Start in maintenance mode
MAINTENANCE_MODE=true pm2 start ecosystem.config.js

# Full restart
pm2 delete thai-accounting-erp
pm2 start ecosystem.config.js --env production
```

---

## Maintenance Windows

### Scheduled Maintenance

```bash
# Create maintenance page
sudo tee /var/www/maintenance.html << 'EOF'
<!DOCTYPE html>
<html>
<head><title>Maintenance</title></head>
<body>
  <h1>System Maintenance</h1>
  <p>We'll be back shortly.</p>
</body>
</html>
EOF

# Enable maintenance mode in Nginx
sudo tee /etc/nginx/maintenance.conf << 'EOF'
error_page 503 /maintenance.html;
location = /maintenance.html {
    root /var/www;
    internal;
}
location / {
    return 503;
}
EOF

# Toggle maintenance mode
sudo ln -s /etc/nginx/maintenance.conf /etc/nginx/sites-enabled/
sudo nginx -s reload
```

---

**Last Updated:** March 16, 2026  
**Version:** 1.0.0
