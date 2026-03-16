# Security Hardening Guide

## Thai Accounting ERP - Security Best Practices

This guide provides comprehensive security hardening recommendations for deploying Thai Accounting ERP in production environments.

---

## Table of Contents

1. [Security Checklist](#security-checklist)
2. [Server Hardening](#server-hardening)
3. [Database Security](#database-security)
4. [Application Security](#application-security)
5. [API Security](#api-security)
6. [Network Security](#network-security)
7. [Backup Encryption](#backup-encryption)
8. [Monitoring & Auditing](#monitoring--auditing)
9. [Incident Response](#incident-response)

---

## Security Checklist

Use this checklist before deploying to production:

### Pre-Deployment
- [ ] Changed all default passwords
- [ ] Generated strong NEXTAUTH_SECRET
- [ ] Disabled debug mode (DEBUG=false)
- [ ] Enabled HTTPS only
- [ ] Configured firewall rules
- [ ] Disabled unnecessary services
- [ ] Updated all dependencies
- [ ] Scanned for vulnerabilities (`npm audit`)

### Application
- [ ] Rate limiting enabled
- [ ] CSRF protection enabled
- [ ] Secure session cookies
- [ ] Password policy enforced
- [ ] Account lockout configured
- [ ] Audit logging enabled
- [ ] Input validation active

### Infrastructure
- [ ] Server OS updated
- [ ] SSH key authentication only
- [ ] Automatic security updates enabled
- [ ] Log rotation configured
- [ ] Backup encryption enabled
- [ ] SSL/TLS properly configured

---

## Server Hardening

### Operating System Security

#### Ubuntu/Debian

```bash
# Update system
sudo apt-get update && sudo apt-get upgrade -y
sudo apt-get autoremove -y

# Install security updates automatically
sudo apt-get install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades

# Configure automatic updates
sudo nano /etc/apt/apt.conf.d/50unattended-upgrades
```

#### SSH Hardening

```bash
# Edit SSH configuration
sudo nano /etc/ssh/sshd_config

# Recommended settings:
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
MaxAuthTries 3
ClientAliveInterval 300
ClientAliveCountMax 2
AllowUsers thaiacc
Protocol 2
X11Forwarding no

# Restart SSH
sudo systemctl restart sshd
```

#### Firewall Configuration (UFW)

```bash
# Install and enable UFW
sudo apt-get install -y ufw
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow specific ports
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status verbose
```

### User Account Security

```bash
# Create dedicated application user
sudo useradd -r -m -s /bin/bash thaiacc
sudo usermod -aG sudo thaiacc

# Set strong password
sudo passwd thaiacc

# Lock root password
sudo passwd -l root

# Remove unnecessary users
sudo userdel -r games
sudo userdel -r irc
```

### File System Security

```bash
# Set proper permissions on application files
sudo chown -R thaiacc:thaiacc /var/www/thai-accounting
sudo chmod -R 755 /var/www/thai-accounting

# Protect sensitive files
sudo chmod 600 /var/www/thai-accounting/.env*
sudo chmod 600 /var/www/thai-accounting/prisma/*.db

# Set proper log permissions
sudo chown -R thaiacc:thaiacc /var/log/thai-accounting
sudo chmod 755 /var/log/thai-accounting
sudo chmod 644 /var/log/thai-accounting/*.log
```

---

## Database Security

### SQLite Security

```bash
# Set strict permissions
chmod 600 /var/www/thai-accounting/prisma/prod.db

# Regular backups with encryption
sqlite3 /var/www/thai-accounting/prisma/prod.db ".backup /tmp/backup.sql"
gpg --symmetric --cipher-algo AES256 /tmp/backup.sql
```

### PostgreSQL Security

```bash
# Edit PostgreSQL configuration
sudo nano /etc/postgresql/14/main/postgresql.conf

# Security settings:
listen_addresses = 'localhost'
ssl = on
ssl_ciphers = 'HIGH:!aNULL:!MD5'
password_encryption = scram-sha-256
log_connections = on
log_disconnections = on
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
log_statement = 'mod'
```

```bash
# Edit pg_hba.conf for authentication
sudo nano /etc/postgresql/14/main/pg_hba.conf

# Use strong authentication:
local   all             postgres                                peer
local   thai_accounting thaiacc                                scram-sha-256
host    thai_accounting thaiacc         127.0.0.1/32            scram-sha-256
host    thai_accounting thaiacc         ::1/128                 scram-sha-256

# Reject all other connections:
host    all             all             0.0.0.0/0               reject
```

### Database User Security

```sql
-- Create limited privilege user
CREATE USER app_user WITH ENCRYPTED PASSWORD 'strong_password';
GRANT CONNECT ON DATABASE thai_accounting TO app_user;
GRANT USAGE ON SCHEMA public TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_user;

-- Revoke dangerous permissions
REVOKE ALL ON DATABASE postgres FROM app_user;
REVOKE ALL ON SCHEMA pg_catalog FROM app_user;
REVOKE ALL ON SCHEMA information_schema FROM app_user;
```

---

## Application Security

### Environment Variables

```bash
# Generate strong secrets
export NEXTAUTH_SECRET=$(openssl rand -base64 32)
export DB_PASSWORD=$(openssl rand -base64 24)
export WEBHOOK_SECRET=$(openssl rand -base64 32)

# Store in secure location
echo "NEXTAUTH_SECRET=$NEXTAUTH_SECRET" >> /var/www/thai-accounting/.env.production
echo "DATABASE_URL=postgresql://app_user:$DB_PASSWORD@localhost:5432/thai_accounting" >> /var/www/thai-accounting/.env.production
```

### NextAuth.js Security

```typescript
// src/lib/auth.ts
import { NextAuthOptions } from "next-auth";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 hours
    updateAge: 24 * 60 * 60, // 24 hours
  },
  
  cookies: {
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: true, // HTTPS only
      },
    },
  },
  
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  
  // Rate limiting for auth endpoints
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      // Check rate limiting
      const isRateLimited = await checkAuthRateLimit(credentials?.email);
      if (isRateLimited) {
        return false;
      }
      return true;
    },
  },
};
```

### Password Policy

```typescript
// src/lib/password-policy.ts
export const passwordPolicy = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  maxAge: 90, // days
  historyCount: 5, // prevent reuse of last 5 passwords
};

export function validatePassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (password.length < passwordPolicy.minLength) {
    errors.push(`Password must be at least ${passwordPolicy.minLength} characters`);
  }
  
  if (passwordPolicy.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push("Password must contain uppercase letters");
  }
  
  if (passwordPolicy.requireNumbers && !/\d/.test(password)) {
    errors.push("Password must contain numbers");
  }
  
  if (passwordPolicy.requireSpecialChars && !/[!@#$%^&*]/.test(password)) {
    errors.push("Password must contain special characters");
  }
  
  return { valid: errors.length === 0, errors };
}
```

### Session Security

```typescript
// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Security headers
  const response = NextResponse.next();
  
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
  );
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  
  // Check authentication for protected routes
  const token = request.cookies.get("next-auth.session-token");
  const isAuthPage = request.nextUrl.pathname.startsWith("/auth");
  const isProtectedRoute = 
    request.nextUrl.pathname.startsWith("/dashboard") ||
    request.nextUrl.pathname.startsWith("/api");
  
  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL("/auth/signin", request.url));
  }
  
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

---

## API Security

### Rate Limiting Configuration

```typescript
// src/lib/rate-limit.ts
import { LRUCache } from "lru-cache";

interface RateLimitOptions {
  uniqueTokenPerInterval?: number;
  interval?: number;
}

export function rateLimit(options?: RateLimitOptions) {
  const tokenCache = new LRUCache({
    max: options?.uniqueTokenPerInterval || 500,
    ttl: options?.interval || 60000,
  });
  
  return {
    check: (token: string, limit: number) => {
      const tokenCount = (tokenCache.get(token) as number[]) || [0];
      if (tokenCount[0] === 0) {
        tokenCache.set(token, [1]);
        return { success: true, limit, remaining: limit - 1 };
      }
      
      const currentUsage = tokenCount[0];
      if (currentUsage >= limit) {
        return { success: false, limit, remaining: 0 };
      }
      
      tokenCount[0] = currentUsage + 1;
      tokenCache.set(token, tokenCount);
      return { success: true, limit, remaining: limit - tokenCount[0] };
    },
  };
}

// Usage in API routes
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
});

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") || "anonymous";
  const { success, remaining } = await limiter.check(ip, 10);
  
  if (!success) {
    return Response.json(
      { error: "Too many requests" },
      { status: 429, headers: { "X-RateLimit-Remaining": String(remaining) } }
    );
  }
  
  // Process request
}
```

### Input Validation

```typescript
// src/lib/validation.ts
import { z } from "zod";

export const invoiceSchema = z.object({
  customerId: z.string().min(1, "Customer is required").max(50),
  invoiceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  lines: z.array(z.object({
    description: z.string().min(1).max(500),
    quantity: z.number().positive(),
    unitPrice: z.number().nonnegative(),
    vatRate: z.number().min(0).max(100),
  })).min(1, "At least one line item required"),
});

// Sanitize input
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, "") // Remove < and >
    .trim()
    .slice(0, 1000); // Limit length
}
```

---

## Network Security

### SSL/TLS Configuration

#### Nginx SSL Hardening

```nginx
server {
    listen 443 ssl http2;
    server_name erp.yourdomain.com;
    
    # SSL Certificates
    ssl_certificate /etc/letsencrypt/live/erp.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/erp.yourdomain.com/privkey.pem;
    
    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;
    ssl_session_tickets off;
    
    # OCSP Stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    ssl_trusted_certificate /etc/letsencrypt/live/erp.yourdomain.com/chain.pem;
    resolver 8.8.8.8 8.8.4.4 valid=300s;
    resolver_timeout 5s;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
    
    # ... rest of configuration
}
```

#### SSL Certificate Renewal

```bash
# Test auto-renewal
sudo certbot renew --dry-run

# Set up cron job for renewal
sudo crontab -e

# Add line:
0 3 * * * /usr/bin/certbot renew --quiet --deploy-hook "systemctl reload nginx"
```

### DDoS Protection

```bash
# Install and configure fail2ban
sudo apt-get install -y fail2ban

# Create custom jail
sudo nano /etc/fail2ban/jail.local

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
action = iptables-multiport[name=ReqLimit, port="http,https", protocol=tcp]
logpath = /var/log/nginx/error.log
findtime = 600
bantime = 7200
maxretry = 10

[nginx-auth]
enabled = true
filter = nginx-auth
action = iptables-multiport[name=NoAuthFailures, port="http,https", protocol=tcp]
logpath = /var/log/nginx/access.log
findtime = 600
bantime = 3600
maxretry = 3
```

---

## Backup Encryption

### Automated Encrypted Backups

```bash
#!/bin/bash
# /usr/local/bin/backup-encrypted.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/thai-accounting"
ENCRYPTION_KEY_FILE="/etc/thai-accounting/backup-key.pub"
RETENTION_DAYS=30

# Create backup directory
mkdir -p $BACKUP_DIR

# Database backup
pg_dump thai_accounting > $BACKUP_DIR/db_backup_$DATE.sql

# Encrypt database backup
gpg --encrypt --recipient-file $ENCRYPTION_KEY_FILE \
    --output $BACKUP_DIR/db_backup_$DATE.sql.gpg \
    $BACKUP_DIR/db_backup_$DATE.sql

# Remove unencrypted file
rm $BACKUP_DIR/db_backup_$DATE.sql

# Application files backup (excluding sensitive data)
tar -czf $BACKUP_DIR/app_backup_$DATE.tar.gz \
    --exclude='node_modules' \
    --exclude='.next' \
    --exclude='uploads' \
    --exclude='.env*' \
    -C /var/www thai-accounting

# Encrypt application backup
gpg --encrypt --recipient-file $ENCRYPTION_KEY_FILE \
    --output $BACKUP_DIR/app_backup_$DATE.tar.gz.gpg \
    $BACKUP_DIR/app_backup_$DATE.tar.gz

# Remove unencrypted file
rm $BACKUP_DIR/app_backup_$DATE.tar.gz

# Upload to secure storage (S3 with encryption)
aws s3 sync $BACKUP_DIR s3://your-backup-bucket/backups/ \
    --sse aws:kms \
    --sse-kms-key-id alias/thai-accounting-backup

# Clean up old backups
find $BACKUP_DIR -name "*.gpg" -mtime +$RETENTION_DAYS -delete

# Log backup completion
echo "[$DATE] Backup completed successfully" >> /var/log/thai-accounting/backup.log
```

### Restore from Encrypted Backup

```bash
#!/bin/bash
# /usr/local/bin/restore-encrypted.sh

BACKUP_FILE=$1
DECRYPTION_KEY="/etc/thai-accounting/backup-key.private"

# Decrypt backup
gpg --decrypt --batch --yes \
    --passphrase-file $DECRYPTION_KEY \
    --output /tmp/restore.sql \
    $BACKUP_FILE

# Restore database
psql thai_accounting < /tmp/restore.sql

# Clean up
rm /tmp/restore.sql

echo "Restore completed from: $BACKUP_FILE"
```

---

## Monitoring & Auditing

### Audit Logging

```typescript
// src/lib/audit.ts
import { prisma } from "./db";

interface AuditEvent {
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  oldValue?: any;
  newValue?: any;
  ipAddress: string;
  userAgent: string;
}

export async function logAudit(event: AuditEvent) {
  await prisma.auditLog.create({
    data: {
      userId: event.userId,
      action: event.action,
      resource: event.resource,
      resourceId: event.resourceId,
      oldValue: event.oldValue ? JSON.stringify(event.oldValue) : null,
      newValue: event.newValue ? JSON.stringify(event.newValue) : null,
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
      timestamp: new Date(),
    },
  });
}
```

### Security Monitoring with AIDE

```bash
# Install AIDE (Advanced Intrusion Detection Environment)
sudo apt-get install -y aide

# Initialize database
sudo aideinit

# Move database to secure location
sudo mv /var/lib/aide/aide.db.new /var/lib/aide/aide.db

# Create daily check script
sudo nano /etc/cron.daily/aide-check

#!/bin/bash
/usr/bin/aide --check | mail -s "AIDE Check $(hostname)" admin@yourdomain.com

sudo chmod +x /etc/cron.daily/aide-check
```

### Log Analysis

```bash
# Install logwatch for daily summaries
sudo apt-get install -y logwatch

# Configure logwatch
sudo nano /etc/logwatch/conf/logwatch.conf

MailTo = admin@yourdomain.com
Detail = High
Service = http
Service = sshd
Service = nginx
```

---

## Incident Response

### Security Incident Checklist

#### Immediate Actions (First 15 minutes)
- [ ] Identify the incident type and scope
- [ ] Isolate affected systems if necessary
- [ ] Preserve evidence (logs, memory dumps)
- [ ] Notify security team and management

#### Short-term Actions (First hour)
- [ ] Contain the incident
- [ ] Block malicious IP addresses
- [ ] Revoke compromised credentials
- [ ] Document all actions taken

#### Long-term Actions
- [ ] Perform root cause analysis
- [ ] Apply patches and fixes
- [ ] Update security controls
- [ ] Conduct post-incident review

### Incident Response Contacts

| Role | Contact | Responsibility |
|------|---------|----------------|
| Security Team | security@yourdomain.com | Incident handling |
| System Admin | admin@yourdomain.com | System recovery |
| Management | manager@yourdomain.com | Decision making |
| Legal | legal@yourdomain.com | Compliance issues |

---

## Security Testing

### Regular Security Checks

```bash
# Run security audit monthly

# 1. Check for vulnerable packages
npm audit

# 2. Check for outdated packages
npm outdated

# 3. Check file permissions
find /var/www/thai-accounting -type f -perm /o+w

# 4. Check for sensitive data in logs
grep -r "password\|secret\|token" /var/log/

# 5. Verify SSL configuration
openssl s_client -connect erp.yourdomain.com:443 -servername erp.yourdomain.com

# 6. Test rate limiting
curl -X POST http://localhost:3000/api/auth/callback/credentials \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"wrong"}' \
  --repeat 10
```

---

*Last Updated: March 16, 2026*

**Remember:** Security is an ongoing process, not a one-time setup. Regularly review and update your security measures.
