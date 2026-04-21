# Thai Accounting ERP - Security Hardening Guide

## Table of Contents

1. [Security Overview](#security-overview)
2. [System Security Checklist](#system-security-checklist)
3. [Firewall Configuration](#firewall-configuration)
4. [SSL/TLS Configuration](#ssltls-configuration)
5. [Secret Management](#secret-management)
6. [Authentication Hardening](#authentication-hardening)
7. [Database Security](#database-security)
8. [Application Security](#application-security)
9. [Audit and Monitoring](#audit-and-monitoring)
10. [Penetration Testing](#penetration-testing)

---

## Security Overview

This guide provides comprehensive security hardening recommendations for the Thai Accounting ERP system. Implementation of these measures is critical for protecting financial data and ensuring compliance with Thai data protection regulations.

### Security Principles

1. **Defense in Depth**: Multiple layers of security
2. **Least Privilege**: Minimal access rights
3. **Encryption**: Data at rest and in transit
4. **Monitoring**: Continuous security monitoring
5. **Regular Updates**: Keep all components updated

---

## System Security Checklist

### Pre-Deployment

- [ ] Change all default passwords
- [ ] Disable unnecessary services
- [ ] Configure automatic security updates
- [ ] Set up firewall rules
- [ ] Enable SELinux/AppArmor (if applicable)
- [ ] Configure secure SSH access
- [ ] Set up log aggregation
- [ ] Create backup strategy

### Post-Deployment

- [ ] Enable HTTPS only
- [ ] Configure security headers
- [ ] Set up rate limiting
- [ ] Enable audit logging
- [ ] Configure monitoring alerts
- [ ] Set up intrusion detection
- [ ] Test disaster recovery
- [ ] Document security procedures

---

## Firewall Configuration

### UFW (Ubuntu)

```bash
# Install UFW
sudo apt install ufw

# Default deny
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH (change port if non-standard)
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow monitoring (optional)
sudo ufw allow from 10.0.0.0/8 to any port 9090

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status verbose
```

### iptables Rules

```bash
#!/bin/bash
# firewall-rules.sh

# Flush existing rules
iptables -F
iptables -X

# Default policy
iptables -P INPUT DROP
iptables -P FORWARD DROP
iptables -P OUTPUT ACCEPT

# Allow loopback
iptables -A INPUT -i lo -j ACCEPT

# Allow established connections
iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT

# Allow SSH
iptables -A INPUT -p tcp --dport 22 -m state --state NEW -j ACCEPT

# Allow HTTP/HTTPS
iptables -A INPUT -p tcp --dport 80 -m state --state NEW -j ACCEPT
iptables -A INPUT -p tcp --dport 443 -m state --state NEW -j ACCEPT

# Rate limit SSH
iptables -A INPUT -p tcp --dport 22 -m state --state NEW -m recent --set
iptables -A INPUT -p tcp --dport 22 -m state --state NEW -m recent --update --seconds 60 --hitcount 4 -j DROP

# Save rules
iptables-save > /etc/iptables/rules.v4
```

### Cloud Firewall (AWS Security Groups)

```bash
# Allow SSH from specific IP
aws ec2 authorize-security-group-ingress \
    --group-id sg-xxxxxxxxx \
    --protocol tcp \
    --port 22 \
    --cidr YOUR_IP/32

# Allow HTTPS from anywhere
aws ec2 authorize-security-group-ingress \
    --group-id sg-xxxxxxxxx \
    --protocol tcp \
    --port 443 \
    --cidr 0.0.0.0/0
```

---

## SSL/TLS Configuration

### Strong SSL Configuration (Nginx)

```nginx
server {
    listen 443 ssl http2;
    
    # Certificate paths
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # Modern SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;
    
    # Strong cipher suites
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    
    # Session configuration
    ssl_session_cache shared:SSL:50m;
    ssl_session_timeout 1d;
    ssl_session_tickets off;
    
    # OCSP Stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    ssl_trusted_certificate /etc/letsencrypt/live/your-domain.com/chain.pem;
    resolver 8.8.8.8 8.8.4.4 valid=300s;
    resolver_timeout 5s;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
    
    # Content Security Policy
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https:; frame-ancestors 'none'; base-uri 'self'; form-action 'self';" always;
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name _;
    return 301 https://$host$request_uri;
}
```

### SSL Testing

```bash
# Test SSL configuration
nmap --script ssl-enum-ciphers -p 443 your-domain.com

# Test with SSL Labs
curl -s https://www.ssllabs.com/ssltest/analyze.html?d=your-domain.com

# Check certificate expiry
echo | openssl s_client -servername your-domain.com -connect your-domain.com:443 2>/dev/null | openssl x509 -noout -dates
```

---

## Secret Management

### Environment Variables

```bash
# .env.production - NEVER commit this file
# Set permissions
chmod 600 .env.production
chown thaiacc:thaiacc .env.production

# Load in systemd service
sudo systemctl edit thai-acc
```

```ini
[Service]
Environment="NODE_ENV=production"
EnvironmentFile=/home/thaiacc/erp/.env.production
```

### Secret Rotation

```bash
#!/bin/bash
# rotate-secrets.sh

# Generate new secrets
NEW_AUTH_SECRET=$(openssl rand -base64 32)
NEW_API_KEY=$(openssl rand -hex 32)

# Backup current secrets
cp .env.production .env.production.backup.$(date +%Y%m%d)

# Update secrets
sed -i "s/NEXTAUTH_SECRET=.*/NEXTAUTH_SECRET=$NEW_AUTH_SECRET/" .env.production
sed -i "s/API_KEY_SECRET=.*/API_KEY_SECRET=$NEW_API_KEY/" .env.production

# Reload application
pm2 reload thai-accounting-erp

echo "Secrets rotated on $(date)"
```

### HashiCorp Vault (Enterprise)

```bash
# Install Vault
wget https://releases.hashicorp.com/vault/1.15.0/vault_1.15.0_linux_amd64.zip
unzip vault_1.15.0_linux_amd64.zip
sudo mv vault /usr/local/bin/

# Configure Vault
vault secrets enable -path=secret kv-v2
vault kv put secret/thai-acc \
    database_url="file:/app/data/prod.db" \
    nextauth_secret="super-secret-key" \
    smtp_password="email-password"

# Application retrieves secrets
vault kv get -format=json secret/thai-acc
```

---

## Authentication Hardening

### NextAuth Configuration

```typescript
// lib/auth.ts
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        // Validation logic with rate limiting
        const result = await validateCredentials(credentials);
        return result;
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60, // 8 hours
    updateAge: 60 * 60, // 1 hour
  },
  jwt: {
    maxAge: 8 * 60 * 60,
  },
  cookies: {
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: true,
      },
    },
  },
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      // Additional validation
      return true;
    },
    async session({ session, token }) {
      // Add role to session
      if (session.user) {
        session.user.role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/auth/error',
  },
};
```

### Rate Limiting

```typescript
// lib/rate-limit.ts
import { LRUCache } from 'lru-cache';

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
    check: (limit: number, token: string) =>
      new Promise<void>((resolve, reject) => {
        const tokenCount = (tokenCache.get(token) as number[]) || [0];
        if (tokenCount[0] === 0) {
          tokenCache.set(token, [1]);
        } else {
          tokenCount[0] += 1;
          tokenCache.set(token, tokenCount);
        }
        
        if (tokenCount[0] > limit) {
          reject(new Error('Rate limit exceeded'));
        } else {
          resolve();
        }
      }),
  };
}

// Usage in API route
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
});

export async function POST(req: Request) {
  try {
    await limiter.check(5, 'CACHE_TOKEN'); // 5 requests per minute
    // Handle request
  } catch {
    return new Response('Too Many Requests', { status: 429 });
  }
}
```

### Password Policy

```typescript
// lib/password-policy.ts
import { z } from 'zod';

const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must not exceed 128 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const result = passwordSchema.safeParse(password);
  
  if (result.success) {
    return { valid: true, errors: [] };
  }
  
  return {
    valid: false,
    errors: result.error.errors.map(e => e.message),
  };
}
```

---

## Database Security

### SQLite Security

```bash
# Set file permissions
chmod 600 /app/data/prod.db
chown thaiacc:thaiacc /app/data/prod.db

# Directory permissions
chmod 700 /app/data

# Backup permissions
chmod 600 /app/backups/*.db
```

### PostgreSQL Security

```sql
-- Create dedicated user
CREATE USER thaiacc WITH PASSWORD 'strong-password';

-- Create database
CREATE DATABASE thaiacc OWNER thaiacc;

-- Revoke public access
REVOKE ALL ON DATABASE thaiacc FROM PUBLIC;

-- Grant specific permissions
GRANT CONNECT ON DATABASE thaiacc TO thaiacc;
GRANT USAGE ON SCHEMA public TO thaiacc;
GRANT CREATE ON SCHEMA public TO thaiacc;
GRANT ALL ON ALL TABLES IN SCHEMA public TO thaiacc;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO thaiacc;

-- Enable SSL
ALTER SYSTEM SET ssl = on;
ALTER SYSTEM SET ssl_cert_file = '/etc/ssl/certs/server.crt';
ALTER SYSTEM SET ssl_key_file = '/etc/ssl/private/server.key';
```

### Connection Encryption

```env
# .env.production
# For PostgreSQL with SSL
DATABASE_URL=postgresql://user:pass@localhost:5432/db?sslmode=require
```

---

## Application Security

### Input Validation

```typescript
// lib/validations.ts
import { z } from 'zod';

export const invoiceSchema = z.object({
  customerId: z.string().uuid(),
  invoiceDate: z.string().datetime(),
  lines: z.array(z.object({
    productId: z.string().uuid().optional(),
    description: z.string().min(1).max(500),
    quantity: z.number().positive(),
    unitPrice: z.number().positive(),
  })).min(1),
});

export function validateInvoice(data: unknown) {
  return invoiceSchema.parse(data);
}
```

### SQL Injection Prevention

```typescript
// Always use Prisma ORM
// Good
const invoices = await prisma.invoice.findMany({
  where: { status: 'ISSUED' }
});

// Never do this
const query = `SELECT * FROM invoices WHERE status = '${userInput}'`;
```

### XSS Prevention

```typescript
// Components automatically escape in React
// For dangerouslySetInnerHTML, sanitize first
import DOMPurify from 'isomorphic-dompurify';

function SafeHtml({ html }: { html: string }) {
  const sanitized = DOMPurify.sanitize(html);
  return <div dangerouslySetInnerHTML={{ __html: sanitized }} />;
}
```

### CSRF Protection

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // CSRF token validation for state-changing requests
  if (['POST', 'PUT', 'DELETE'].includes(request.method)) {
    const csrfToken = request.headers.get('X-CSRF-Token');
    const cookieToken = request.cookies.get('csrf-token')?.value;
    
    if (csrfToken !== cookieToken) {
      return new NextResponse('Invalid CSRF token', { status: 403 });
    }
  }
  
  return response;
}
```

---

## Audit and Monitoring

### Security Logging

```typescript
// lib/security-logger.ts
import winston from 'winston';

const securityLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ 
      filename: '/var/log/thai-acc/security.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

export function logSecurityEvent(event: string, details: Record<string, unknown>) {
  securityLogger.info({
    event,
    ...details,
    timestamp: new Date().toISOString(),
  });
}

// Usage
logSecurityEvent('LOGIN_ATTEMPT', {
  userId: 'user_123',
  ip: '192.168.1.1',
  success: true,
});
```

### File Integrity Monitoring

```bash
# Install AIDE
sudo apt install aide

# Initialize database
sudo aideinit

# Run check
sudo aide --check

# Setup cron
sudo crontab -e
0 3 * * * /usr/bin/aide --check | mail -s "AIDE Check" admin@your-domain.com
```

### Fail2Ban Configuration

```bash
# Install fail2ban
sudo apt install fail2ban

# Configure for SSH and application
sudo tee /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log

[thai-acc]
enabled = true
port = http,https
filter = thai-acc
logpath = /var/log/thai-acc/security.log
maxretry = 10
bantime = 3600
EOF

# Create filter
sudo tee /etc/fail2ban/filter.d/thai-acc.conf << 'EOF'
[Definition]
failregex = ^.*LOGIN_FAILURE.*IP:<HOST>.*$
ignoreregex =
EOF

sudo systemctl restart fail2ban
```

---

## Penetration Testing

### Automated Scanning

```bash
# OWASP ZAP
wget https://github.com/zaproxy/zaproxy/releases/download/v2.14.0/ZAP_2.14.0_Linux.tar.gz
tar -xzf ZAP_2.14.0_Linux.tar.gz
./ZAP_2.14.0/zap.sh -daemon -host 0.0.0.0 -port 8080

# Run scan
zap-cli --zap-url http://localhost:8080 --api-key your-api-key open-url https://your-domain.com
zap-cli --zap-url http://localhost:8080 spider https://your-domain.com
zap-cli --zap-url http://localhost:8080 active-scan https://your-domain.com
zap-cli --zap-url http://localhost:8080 report -o zap-report.html -f html
```

### Manual Testing Checklist

- [ ] SQL Injection attempts
- [ ] XSS attempts (stored, reflected, DOM)
- [ ] CSRF token bypass
- [ ] Authentication bypass
- [ ] Session fixation
- [ ] Insecure direct object references
- [ ] Security misconfigurations
- [ ] Sensitive data exposure
- [ ] Missing function-level access control
- [ ] Cross-site request forgery
- [ ] Using components with known vulnerabilities
- [ ] Unvalidated redirects and forwards

### Security Headers Test

```bash
# Test security headers
curl -I https://your-domain.com | grep -E "(X-|Strict|Content)"

# Online test
curl -s https://securityheaders.com/?q=your-domain.com&followRedirects=on
```

---

## Compliance

### PDPA (Thailand) Compliance

1. **Data Collection Consent**
   - Explicit consent for data collection
   - Clear privacy policy
   - Right to access and delete data

2. **Data Protection**
   - Encryption at rest and in transit
   - Access controls
   - Regular security audits

3. **Breach Notification**
   - Incident response plan
   - Notification procedures
   - Documentation requirements

---

**Last Updated:** March 16, 2026  
**Classification:** CONFIDENTIAL
