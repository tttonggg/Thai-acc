# Configuration Reference

## Thai Accounting ERP - Complete Configuration Guide

This document describes all configuration options available in the Thai
Accounting ERP system.

---

## Table of Contents

1. [Environment Variables](#environment-variables)
2. [Feature Flags](#feature-flags)
3. [Rate Limiting](#rate-limiting)
4. [Email Settings](#email-settings)
5. [Database Configuration](#database-configuration)
6. [Authentication Settings](#authentication-settings)
7. [Logging Configuration](#logging-configuration)
8. [File Upload Settings](#file-upload-settings)
9. [Cache Configuration](#cache-configuration)
10. [Webhook Configuration](#webhook-configuration)

---

## Environment Variables

### Core Application

| Variable                  | Type    | Default       | Description                                           |
| ------------------------- | ------- | ------------- | ----------------------------------------------------- |
| `NODE_ENV`                | string  | `development` | Environment mode: `development`, `production`, `test` |
| `PORT`                    | number  | `3000`        | Server port number                                    |
| `HOSTNAME`                | string  | `localhost`   | Server hostname                                       |
| `NEXT_TELEMETRY_DISABLED` | boolean | `false`       | Disable Next.js telemetry                             |

### Database

| Variable             | Type   | Required | Description                   |
| -------------------- | ------ | -------- | ----------------------------- |
| `DATABASE_URL`       | string | Yes      | Database connection string    |
| `DATABASE_POOL_SIZE` | number | `10`     | Connection pool size          |
| `DATABASE_TIMEOUT`   | number | `30000`  | Query timeout in milliseconds |

**SQLite Format:**

```env
# Development (relative path)
DATABASE_URL="file:./prisma/dev.db"

# Production (absolute path required)
DATABASE_URL="file:/var/www/thai-accounting/prisma/prod.db"
```

**PostgreSQL Format:**

```env
DATABASE_URL="postgresql://user:password@host:port/database?schema=public"
# Example:
DATABASE_URL="postgresql://thaiacc:secret@localhost:5432/thai_accounting?schema=public"
```

### Authentication (NextAuth.js)

| Variable                      | Type   | Required | Description                           |
| ----------------------------- | ------ | -------- | ------------------------------------- |
| `NEXTAUTH_URL`                | string | Yes      | Canonical URL of the site             |
| `NEXTAUTH_SECRET`             | string | Yes      | Secret for JWT signing                |
| `NEXTAUTH_SESSION_MAX_AGE`    | number | `28800`  | Session duration in seconds (8 hours) |
| `NEXTAUTH_SESSION_UPDATE_AGE` | number | `86400`  | Session update interval (24 hours)    |

**Security Notes:**

- `NEXTAUTH_SECRET` must be at least 32 characters
- Generate with: `openssl rand -base64 32`
- Never commit secrets to version control
- Use different secrets for different environments

### URL Configuration

| Variable              | Type    | Default | Description                                |
| --------------------- | ------- | ------- | ------------------------------------------ |
| `NEXTAUTH_URL`        | string  | -       | Main application URL                       |
| `NEXT_PUBLIC_APP_URL` | string  | -       | Public-facing URL (for emails/links)       |
| `NEXT_PUBLIC_API_URL` | string  | -       | API base URL                               |
| `TRUST_PROXY`         | boolean | `false` | Trust proxy headers (behind reverse proxy) |

---

## Feature Flags

Feature flags allow enabling/disabling functionality without code changes.

### Core Features

| Flag                     | Type    | Default | Description                   |
| ------------------------ | ------- | ------- | ----------------------------- |
| `FEATURE_INVENTORY`      | boolean | `true`  | Enable inventory management   |
| `FEATURE_FIXED_ASSETS`   | boolean | `true`  | Enable fixed assets module    |
| `FEATURE_PAYROLL`        | boolean | `true`  | Enable payroll module         |
| `FEATURE_BANKING`        | boolean | `true`  | Enable banking and cheques    |
| `FEATURE_MULTI_CURRENCY` | boolean | `false` | Enable multi-currency support |

### Advanced Features

| Flag                       | Type    | Default | Description                  |
| -------------------------- | ------- | ------- | ---------------------------- |
| `FEATURE_WEBHOOKS`         | boolean | `false` | Enable webhook system        |
| `FEATURE_API_ACCESS`       | boolean | `true`  | Enable REST API              |
| `FEATURE_BULK_OPERATIONS`  | boolean | `false` | Enable bulk import/export    |
| `FEATURE_ADVANCED_REPORTS` | boolean | `true`  | Enable custom report builder |
| `FEATURE_AUDIT_LOG`        | boolean | `true`  | Enable audit logging         |

### Experimental Features

| Flag               | Type    | Default | Description                        |
| ------------------ | ------- | ------- | ---------------------------------- |
| `FEATURE_BETA_UI`  | boolean | `false` | Enable beta UI components          |
| `FEATURE_GRAPHQL`  | boolean | `false` | Enable GraphQL API                 |
| `FEATURE_REALTIME` | boolean | `false` | Enable WebSocket real-time updates |

**Configuration Example:**

```env
# Enable only core modules
FEATURE_INVENTORY=true
FEATURE_FIXED_ASSETS=true
FEATURE_PAYROLL=false
FEATURE_BANKING=true
FEATURE_MULTI_CURRENCY=false

# Disable webhooks for now
FEATURE_WEBHOOKS=false
```

---

## Rate Limiting

Rate limiting protects the API from abuse.

### Configuration Variables

| Variable             | Type    | Default | Description                  |
| -------------------- | ------- | ------- | ---------------------------- |
| `RATE_LIMIT_ENABLED` | boolean | `true`  | Enable rate limiting         |
| `RATE_LIMIT_IP`      | number  | `100`   | Requests per minute per IP   |
| `RATE_LIMIT_USER`    | number  | `200`   | Requests per minute per user |

### Endpoint-Specific Limits

Configure different limits for different endpoint categories:

| Category       | Limit | Window     | Environment Variable  |
| -------------- | ----- | ---------- | --------------------- |
| Authentication | 5     | 15 minutes | `RATE_LIMIT_AUTH`     |
| General API    | 60    | 1 minute   | `RATE_LIMIT_API`      |
| Reports        | 10    | 1 minute   | `RATE_LIMIT_REPORTS`  |
| Export         | 5     | 5 minutes  | `RATE_LIMIT_EXPORT`   |
| Webhooks       | 100   | 1 minute   | `RATE_LIMIT_WEBHOOKS` |

**Example Configuration:**

```env
# Enable rate limiting
RATE_LIMIT_ENABLED=true

# Strict auth limits
RATE_LIMIT_AUTH=5

# Relaxed for internal users
RATE_LIMIT_API=120

# Very strict for exports
RATE_LIMIT_EXPORT=3
```

### Bypass Rate Limiting

For trusted environments (testing, internal networks):

```env
# Disable rate limiting (NOT for production)
RATE_LIMIT_ENABLED=false

# Or bypass for specific IPs
RATE_LIMIT_TRUSTED_IPS=127.0.0.1,10.0.0.0/8
```

---

## Email Settings

### SMTP Configuration

| Variable         | Type    | Required | Description          |
| ---------------- | ------- | -------- | -------------------- |
| `SMTP_HOST`      | string  | No       | SMTP server hostname |
| `SMTP_PORT`      | number  | No       | SMTP server port     |
| `SMTP_USER`      | string  | No       | SMTP username        |
| `SMTP_PASSWORD`  | string  | No       | SMTP password        |
| `SMTP_SECURE`    | boolean | `true`   | Use TLS/SSL          |
| `SMTP_FROM`      | string  | No       | Default from address |
| `SMTP_FROM_NAME` | string  | No       | Default from name    |

**Gmail Example:**

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_SECURE=false
SMTP_FROM=your-email@gmail.com
SMTP_FROM_NAME="Thai Accounting ERP"
```

**SendGrid Example:**

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
SMTP_FROM=noreply@yourdomain.com
SMTP_FROM_NAME="Your Company"
```

### Email Features

| Variable               | Type    | Default             | Description                    |
| ---------------------- | ------- | ------------------- | ------------------------------ |
| `EMAIL_ENABLED`        | boolean | `false`             | Enable email sending           |
| `EMAIL_QUEUE_ENABLED`  | boolean | `false`             | Queue emails for async sending |
| `EMAIL_TEMPLATES_PATH` | string  | `./templates/email` | Email templates directory      |

### Notification Settings

| Variable                     | Type    | Default | Description               |
| ---------------------------- | ------- | ------- | ------------------------- |
| `NOTIFY_ON_INVOICE_CREATED`  | boolean | `false` | Email on invoice creation |
| `NOTIFY_ON_PAYMENT_RECEIVED` | boolean | `false` | Email on payment receipt  |
| `NOTIFY_ON_LOW_STOCK`        | boolean | `false` | Email on low inventory    |
| `NOTIFY_DAILY_SUMMARY`       | boolean | `false` | Daily summary email       |

---

## Database Configuration

### Connection Pooling

| Variable                | Type   | Default | Description                  |
| ----------------------- | ------ | ------- | ---------------------------- |
| `DB_POOL_MIN`           | number | `2`     | Minimum connections          |
| `DB_POOL_MAX`           | number | `10`    | Maximum connections          |
| `DB_IDLE_TIMEOUT`       | number | `30000` | Idle connection timeout (ms) |
| `DB_CONNECTION_TIMEOUT` | number | `5000`  | Connection timeout (ms)      |

### Query Configuration

| Variable                  | Type    | Default | Description               |
| ------------------------- | ------- | ------- | ------------------------- |
| `DB_QUERY_TIMEOUT`        | number  | `30000` | Query timeout (ms)        |
| `DB_SLOW_QUERY_THRESHOLD` | number  | `1000`  | Slow query threshold (ms) |
| `DB_LOG_QUERIES`          | boolean | `false` | Log all queries           |
| `DB_LOG_SLOW_QUERIES`     | boolean | `true`  | Log slow queries          |

**Example:**

```env
# Production database config
DATABASE_URL="postgresql://user:pass@localhost:5432/db"
DB_POOL_MIN=5
DB_POOL_MAX=20
DB_QUERY_TIMEOUT=60000
DB_LOG_SLOW_QUERIES=true
DB_SLOW_QUERY_THRESHOLD=500
```

---

## Authentication Settings

### Session Configuration

| Variable                  | Type   | Default | Description                           |
| ------------------------- | ------ | ------- | ------------------------------------- |
| `AUTH_SESSION_SECRET`     | string | -       | Session encryption key                |
| `AUTH_SESSION_MAX_AGE`    | number | `28800` | Session lifetime (8 hours)            |
| `AUTH_SESSION_UPDATE_AGE` | number | `86400` | Update session after (24 hours)       |
| `AUTH_SESSION_STRATEGY`   | string | `jwt`   | Session strategy: `jwt` or `database` |

### Password Policy

| Variable                        | Type    | Default | Description                          |
| ------------------------------- | ------- | ------- | ------------------------------------ |
| `AUTH_PASSWORD_MIN_LENGTH`      | number  | `8`     | Minimum password length              |
| `AUTH_PASSWORD_REQUIRE_UPPER`   | boolean | `false` | Require uppercase letters            |
| `AUTH_PASSWORD_REQUIRE_NUMBER`  | boolean | `false` | Require numbers                      |
| `AUTH_PASSWORD_REQUIRE_SPECIAL` | boolean | `false` | Require special characters           |
| `AUTH_MAX_LOGIN_ATTEMPTS`       | number  | `5`     | Max failed login attempts            |
| `AUTH_LOCKOUT_DURATION`         | number  | `900`   | Lockout duration in seconds (15 min) |

### Multi-Factor Authentication

| Variable            | Type    | Default               | Description               |
| ------------------- | ------- | --------------------- | ------------------------- |
| `AUTH_MFA_ENABLED`  | boolean | `false`               | Enable MFA                |
| `AUTH_MFA_REQUIRED` | boolean | `false`               | Require MFA for all users |
| `AUTH_MFA_ISSUER`   | string  | `Thai Accounting ERP` | MFA app issuer name       |

---

## Logging Configuration

### Log Levels

| Level   | Description                      |
| ------- | -------------------------------- |
| `error` | Error messages only              |
| `warn`  | Warnings and errors              |
| `info`  | Info, warnings, errors (default) |
| `debug` | Debug and above                  |
| `trace` | All messages                     |

### Log Configuration

| Variable        | Type   | Default  | Description                         |
| --------------- | ------ | -------- | ----------------------------------- |
| `LOG_LEVEL`     | string | `info`   | Minimum log level                   |
| `LOG_FORMAT`    | string | `json`   | Log format: `json` or `pretty`      |
| `LOG_OUTPUT`    | string | `stdout` | Output: `stdout`, `file`, or `both` |
| `LOG_FILE`      | string | -        | Log file path (if output=file)      |
| `LOG_MAX_SIZE`  | string | `10m`    | Max log file size                   |
| `LOG_MAX_FILES` | number | `5`      | Number of rotated files             |

**File Logging Example:**

```env
LOG_LEVEL=info
LOG_OUTPUT=both
LOG_FILE=/var/log/thai-accounting/app.log
LOG_MAX_SIZE=50m
LOG_MAX_FILES=10
```

### Audit Logging

| Variable              | Type    | Default | Description          |
| --------------------- | ------- | ------- | -------------------- |
| `AUDIT_LOG_ENABLED`   | boolean | `true`  | Enable audit logging |
| `AUDIT_LOG_FILE`      | string  | -       | Audit log file path  |
| `AUDIT_LOG_RETENTION` | number  | `90`    | Retention days       |

---

## File Upload Settings

### Storage Configuration

| Variable               | Type   | Default    | Description                          |
| ---------------------- | ------ | ---------- | ------------------------------------ |
| `UPLOAD_DIR`           | string | `./upload` | Upload directory                     |
| `UPLOAD_MAX_SIZE`      | string | `10mb`     | Maximum file size                    |
| `UPLOAD_ALLOWED_TYPES` | string | -          | Allowed MIME types (comma-separated) |

### Storage Provider

| Variable           | Type   | Default | Description                            |
| ------------------ | ------ | ------- | -------------------------------------- |
| `STORAGE_PROVIDER` | string | `local` | Storage: `local`, `s3`, `gcs`, `azure` |
| `STORAGE_BASE_URL` | string | -       | Base URL for stored files              |

### AWS S3 Configuration

```env
STORAGE_PROVIDER=s3
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=ap-southeast-1
AWS_BUCKET_NAME=thai-accounting-uploads
AWS_S3_ENDPOINT=optional-custom-endpoint
```

### Google Cloud Storage

```env
STORAGE_PROVIDER=gcs
GCS_PROJECT_ID=your-project-id
GCS_BUCKET_NAME=thai-accounting-uploads
GCS_KEY_FILE=/path/to/service-account-key.json
```

### Azure Blob Storage

```env
STORAGE_PROVIDER=azure
AZURE_STORAGE_ACCOUNT=your-account
AZURE_STORAGE_KEY=your-key
AZURE_STORAGE_CONTAINER=uploads
```

---

## Cache Configuration

### In-Memory Cache

| Variable         | Type    | Default | Description                    |
| ---------------- | ------- | ------- | ------------------------------ |
| `CACHE_ENABLED`  | boolean | `true`  | Enable caching                 |
| `CACHE_TTL`      | number  | `300`   | Default TTL in seconds (5 min) |
| `CACHE_MAX_SIZE` | string  | `100mb` | Maximum cache size             |

### Redis Cache (Optional)

| Variable    | Type   | Default | Description                |
| ----------- | ------ | ------- | -------------------------- |
| `REDIS_URL` | string | -       | Redis connection URL       |
| `REDIS_TTL` | number | `3600`  | Default Redis TTL (1 hour) |

**Redis URL Format:**

```env
REDIS_URL="redis://username:password@host:port/database"
# Example:
REDIS_URL="redis://localhost:6379/0"
```

---

## Webhook Configuration

### Webhook Settings

| Variable              | Type    | Default | Description                  |
| --------------------- | ------- | ------- | ---------------------------- |
| `WEBHOOK_ENABLED`     | boolean | `false` | Enable webhooks              |
| `WEBHOOK_SECRET`      | string  | -       | Secret for signing webhooks  |
| `WEBHOOK_TIMEOUT`     | number  | `5000`  | Webhook request timeout (ms) |
| `WEBHOOK_MAX_RETRIES` | number  | `3`     | Max retry attempts           |
| `WEBHOOK_RETRY_DELAY` | number  | `1000`  | Delay between retries (ms)   |

### Webhook Events

Events that can trigger webhooks:

```env
WEBHOOK_EVENTS=invoice.created,invoice.paid,receipt.created,payment.posted
```

Available events:

- `invoice.created`
- `invoice.issued`
- `invoice.paid`
- `invoice.cancelled`
- `receipt.created`
- `receipt.posted`
- `payment.created`
- `payment.posted`
- `journal.posted`
- `product.stock_low`

---

## Security Configuration

### CSRF Protection

| Variable               | Type    | Default | Description               |
| ---------------------- | ------- | ------- | ------------------------- |
| `CSRF_ENABLED`         | boolean | `true`  | Enable CSRF protection    |
| `CSRF_COOKIE_SECURE`   | boolean | `true`  | Secure cookie flag        |
| `CSRF_COOKIE_SAMESITE` | string  | `lax`   | SameSite cookie attribute |

### Content Security Policy

| Variable          | Type    | Default | Description        |
| ----------------- | ------- | ------- | ------------------ |
| `CSP_ENABLED`     | boolean | `true`  | Enable CSP headers |
| `CSP_REPORT_ONLY` | boolean | `false` | Report-only mode   |

### CORS Configuration

| Variable           | Type    | Default | Description                       |
| ------------------ | ------- | ------- | --------------------------------- |
| `CORS_ENABLED`     | boolean | `true`  | Enable CORS                       |
| `CORS_ORIGIN`      | string  | -       | Allowed origins (comma-separated) |
| `CORS_CREDENTIALS` | boolean | `true`  | Allow credentials                 |

**Example:**

```env
CORS_ORIGIN=https://app.yourdomain.com,https://admin.yourdomain.com
```

---

## Complete Configuration Example

### Development Environment (.env.development)

```env
# Application
NODE_ENV=development
PORT=3000
NEXT_TELEMETRY_DISABLED=1

# Database
DATABASE_URL="file:./prisma/dev.db"

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="dev-secret-do-not-use-in-production"

# Features
FEATURE_WEBHOOKS=false
FEATURE_MULTI_CURRENCY=false

# Logging
LOG_LEVEL=debug
LOG_FORMAT=pretty
LOG_OUTPUT=stdout

# Rate Limiting
RATE_LIMIT_ENABLED=false

# Development only
DEBUG=true
```

### Production Environment (.env.production)

```env
# Application
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0

# Database
DATABASE_URL="postgresql://thaiacc:secure-password@localhost:5432/thai_accounting"
DB_POOL_MIN=5
DB_POOL_MAX=20

# Authentication
NEXTAUTH_URL="https://erp.yourdomain.com"
NEXTAUTH_SECRET="your-64-character-secret-here-generate-with-openssl"
NEXTAUTH_SESSION_MAX_AGE=28800

# Security
TRUST_PROXY=true
CSRF_COOKIE_SECURE=true

# Features
FEATURE_WEBHOOKS=true
FEATURE_API_ACCESS=true
FEATURE_AUDIT_LOG=true

# Email
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-key
SMTP_FROM=noreply@yourdomain.com
EMAIL_ENABLED=true

# Storage
STORAGE_PROVIDER=s3
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_REGION=ap-southeast-1
AWS_BUCKET_NAME=thai-accounting-prod

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
LOG_OUTPUT=both
LOG_FILE=/var/log/thai-accounting/app.log
AUDIT_LOG_ENABLED=true
AUDIT_LOG_FILE=/var/log/thai-accounting/audit.log

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_AUTH=5
RATE_LIMIT_API=100

# Cache
REDIS_URL="redis://localhost:6379/0"
CACHE_TTL=300

# Webhooks
WEBHOOK_ENABLED=true
WEBHOOK_SECRET="webhook-signing-secret"
WEBHOOK_TIMEOUT=5000
```

---

## Environment-Specific Files

The system supports environment-specific configuration files:

```
.env                 # Default (loaded in all environments)
.env.local           # Local overrides (not committed)
.env.development     # Development environment
.env.test            # Test environment
.env.production      # Production environment
```

**Priority (highest to lowest):**

1. `process.env` (system environment)
2. `.env.{environment}.local`
3. `.env.{environment}`
4. `.env.local`
5. `.env`

---

_Last Updated: March 16, 2026_
