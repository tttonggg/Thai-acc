# Local Development Setup Guide

## Thai Accounting ERP - Developer Setup

This guide will walk you through setting up the Thai Accounting ERP system on
your local machine for development.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Detailed Setup](#detailed-setup)
4. [Database Configuration](#database-configuration)
5. [Environment Variables](#environment-variables)
6. [Running the Application](#running-the-application)
7. [Development Tools](#development-tools)
8. [Troubleshooting](#troubleshooting)
9. [Common Issues](#common-issues)

---

## Prerequisites

### Required Software

| Software                       | Version            | Download                           |
| ------------------------------ | ------------------ | ---------------------------------- |
| Node.js                        | 18.x LTS or higher | [nodejs.org](https://nodejs.org)   |
| Bun (optional but recommended) | 1.0.0+             | [bun.sh](https://bun.sh)           |
| Git                            | 2.30+              | [git-scm.com](https://git-scm.com) |
| SQLite                         | 3.35+              | Included with Node.js              |

### System Requirements

- **RAM:** 4GB minimum, 8GB recommended
- **Disk Space:** 2GB free space
- **OS:** Windows 10+, macOS 11+, or Linux (Ubuntu 20.04+)

### Optional Tools

- **VS Code** (recommended editor) with extensions:
  - TypeScript and JavaScript Language Features
  - Tailwind CSS IntelliSense
  - Prisma
  - ESLint
  - Prettier
- **TablePlus** or **DB Browser for SQLite** (database management)
- **Postman** or **Insomnia** (API testing)

---

## Quick Start

For experienced developers:

```bash
# 1. Clone the repository
git clone https://github.com/thaiaccounting/erp.git
cd thai-accounting-erp

# 2. Install dependencies (with Bun)
bun install

# 3. Copy environment file
cp .env.example .env

# 4. Generate Prisma client
bun run db:generate

# 5. Push database schema
bun run db:push

# 6. Seed the database
bun run db:seed

# 7. Start development server
bun run dev
```

The application will be available at `http://localhost:3000`

---

## Detailed Setup

### Step 1: Install Node.js/Bun

#### Option A: Using Bun (Recommended)

```bash
# macOS/Linux
curl -fsSL https://bun.sh/install | bash

# Windows (via WSL)
curl -fsSL https://bun.sh/install | bash
```

Verify installation:

```bash
bun --version
# Should show 1.0.0 or higher
```

#### Option B: Using Node.js

```bash
# Using nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18

# Verify
node --version  # Should show v18.x.x
npm --version
```

### Step 2: Clone Repository

```bash
# Using HTTPS
git clone https://github.com/thaiaccounting/erp.git thai-accounting-erp

# Using SSH
git clone git@github.com:thaiaccounting/erp.git thai-accounting-erp

cd thai-accounting-erp
```

### Step 3: Install Dependencies

```bash
# With Bun (faster)
bun install

# With npm
npm install
```

This installs:

- Next.js and React
- Prisma ORM
- Tailwind CSS
- shadcn/ui components
- Testing libraries
- Development tools

### Step 4: Environment Configuration

```bash
# Copy example environment file
cp .env.example .env

# Edit the file with your settings
# On macOS/Linux:
nano .env

# On Windows:
notepad .env
```

Required environment variables:

```env
# Database (SQLite)
DATABASE_URL="file:./prisma/dev.db"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here-change-in-production"

# Optional: Email
SMTP_HOST=""
SMTP_PORT=""
SMTP_USER=""
SMTP_PASSWORD=""

# Optional: External Services
API_KEY=""
```

Generate a secure secret:

```bash
# macOS/Linux
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Database Configuration

### Using SQLite (Default for Development)

SQLite is pre-configured and requires no additional setup.

```bash
# Database file location
prisma/
├── schema.prisma    # Database schema
├── dev.db          # SQLite database file
└── seed.ts         # Seed data
```

### Using PostgreSQL (Optional)

For production-like development:

```bash
# 1. Install PostgreSQL
# macOS
brew install postgresql
brew services start postgresql

# Ubuntu/Debian
sudo apt-get install postgresql
sudo service postgresql start

# 2. Create database
createdb thai_accounting_dev

# 3. Update .env
DATABASE_URL="postgresql://user:password@localhost:5432/thai_accounting_dev"
```

### Database Operations

```bash
# Generate Prisma client (after schema changes)
bun run db:generate

# Push schema to database
bun run db:push

# Run migrations
bun run db:migrate

# Reset database (WARNING: deletes all data)
bun run db:reset

# Seed with initial data
bun run db:seed

# Fresh reset + seed
bun run seed:fresh
```

### Database Seeding

The seed process creates:

- Default admin user
- 181 Thai standard chart of accounts
- Sample customers and vendors
- Document numbering sequences

Default credentials after seeding:

- **Admin:** admin@thaiaccounting.com / admin123
- **Accountant:** accountant@thaiaccounting.com / acc123
- **User:** user@thaiaccounting.com / user123
- **Viewer:** viewer@thaiaccounting.com / viewer123

---

## Environment Variables

### Required Variables

| Variable          | Description                | Example                 |
| ----------------- | -------------------------- | ----------------------- |
| `DATABASE_URL`    | Database connection string | `file:./prisma/dev.db`  |
| `NEXTAUTH_URL`    | Application URL            | `http://localhost:3000` |
| `NEXTAUTH_SECRET` | JWT signing secret         | Generate random string  |

### Optional Variables

| Variable             | Description          | Default       |
| -------------------- | -------------------- | ------------- |
| `NODE_ENV`           | Environment mode     | `development` |
| `PORT`               | Server port          | `3000`        |
| `LOG_LEVEL`          | Logging level        | `info`        |
| `RATE_LIMIT_ENABLED` | Enable rate limiting | `false`       |

### Feature Flags

| Variable           | Description                        |
| ------------------ | ---------------------------------- |
| `ENABLE_WEBHOOKS`  | Enable webhook system              |
| `ENABLE_ANALYTICS` | Enable usage analytics             |
| `ENABLE_MFA`       | Enable multi-factor authentication |

---

## Running the Application

### Development Mode

```bash
# Start development server
bun run dev

# Or with npm
npm run dev
```

Features:

- Hot module replacement
- Source maps enabled
- Detailed error messages
- API route logging

### Production Mode (Local Testing)

```bash
# Build the application
bun run build

# Start production server
bun run start
```

### Development with Debugging

**VS Code:**

1. Open Run and Debug panel (Ctrl+Shift+D)
2. Select "Next.js: debug full stack"
3. Press F5

**Chrome DevTools:**

```bash
# Start with inspect flag
node --inspect node_modules/next/dist/bin/next dev
```

---

## Development Tools

### Linting and Formatting

```bash
# Run ESLint
bun run lint

# Fix ESLint issues
bun run lint:fix

# Format with Prettier
bun run format

# Check formatting
bun run format:check
```

### Type Checking

```bash
# Run TypeScript compiler
bun run type-check

# Watch mode
bun run type-check:watch
```

### Testing

```bash
# Run unit tests
bun run test

# Run tests in watch mode
bun run test:watch

# Run with coverage
bun run test:coverage

# Run E2E tests
bun run test:e2e

# Run E2E with UI
bun run test:e2e:ui
```

### Database Management

**Prisma Studio (GUI):**

```bash
bunx prisma studio
# Opens at http://localhost:5555
```

**Database Browser:**

- Open `prisma/dev.db` in TablePlus or DB Browser
- View and edit data directly

---

## Troubleshooting

### Issue: Port 3000 already in use

**Solution:**

```bash
# Find process using port 3000
# macOS/Linux:
lsof -i :3000

# Windows:
netstat -ano | findstr :3000

# Kill process or use different port
PORT=3001 bun run dev
```

### Issue: Database connection error

**Symptoms:**

```
Error: Database connection failed
PrismaClientInitializationError
```

**Solutions:**

1. Check DATABASE_URL in .env
2. Ensure database file exists (SQLite)
3. Regenerate Prisma client:
   ```bash
   bun run db:generate
   ```
4. Reset database if schema changed:
   ```bash
   bun run db:reset
   bun run db:seed
   ```

### Issue: Module not found errors

**Solution:**

```bash
# Clear module cache
rm -rf node_modules
rm -rf .next

# Reinstall dependencies
bun install

# Rebuild
bun run build
```

### Issue: Prisma client generation fails

**Solution:**

```bash
# Clear Prisma cache
rm -rf node_modules/.prisma
rm -rf node_modules/@prisma/client

# Regenerate
bun run db:generate
```

### Issue: Authentication not working

**Solutions:**

1. Check NEXTAUTH_SECRET is set
2. Verify NEXTAUTH_URL matches your URL
3. Check browser cookies are enabled
4. Clear browser cache and cookies

---

## Common Issues

### Windows-Specific Issues

**Issue:** Script execution policy

```powershell
# Run PowerShell as Administrator
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**Issue:** Path separators

```bash
# Use forward slashes in .env
DATABASE_URL="file:./prisma/dev.db"
```

### macOS-Specific Issues

**Issue:** Xcode command line tools

```bash
xcode-select --install
```

**Issue:** Permission denied

```bash
# Fix npm/bun permissions
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) ~/.bun
```

### Linux-Specific Issues

**Issue:** Node.js version too old

```bash
# Use nvm to install latest
nvm install 18
nvm use 18
nvm alias default 18
```

**Issue:** Missing build tools

```bash
# Ubuntu/Debian
sudo apt-get install build-essential

# CentOS/RHEL
sudo yum groupinstall "Development Tools"
```

---

## Verification Checklist

After setup, verify everything works:

- [ ] Application loads at `http://localhost:3000`
- [ ] Can log in with default credentials
- [ ] Dashboard displays correctly
- [ ] Can navigate to all modules
- [ ] Can create a test invoice
- [ ] Tests pass: `bun run test:run`
- [ ] Lint passes: `bun run lint`
- [ ] Build succeeds: `bun run build`

---

## Next Steps

1. **Read the Documentation:**
   - [User Manual](./USER_MANUAL.md)
   - [API Documentation](../API_DOCUMENTATION.md)
   - [Contributing Guide](../CONTRIBUTING.md)

2. **Explore the Codebase:**
   - `src/app/` - Next.js pages and API routes
   - `src/components/` - React components
   - `src/lib/` - Utility functions and services
   - `prisma/` - Database schema

3. **Start Contributing:**
   - Look for "good first issue" labels
   - Join community discussions
   - Submit pull requests

---

## Getting Help

If you encounter issues:

1. **Check Documentation:**
   - README.md
   - This guide
   - API documentation

2. **Search Issues:**
   - GitHub Issues
   - Stack Overflow

3. **Ask Community:**
   - Discord channel
   - GitHub Discussions

4. **Contact Support:**
   - Email: dev-support@thaiaccounting.com

---

_Last Updated: March 16, 2026_
