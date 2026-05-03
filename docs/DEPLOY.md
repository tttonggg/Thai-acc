# Production Deployment Guide

## Problem Summary

Previous deploys failed due to **platform mismatch**: build created on macOS (darwin-arm64) but deployed to Linux (debian). Prisma's query engine binary is platform-specific and cannot be patched post-upload.

## Clean Deploy Steps

### Option 1: Build on VPS (Recommended for now)

```bash
# On VPS
ssh -i ~/.ssh/test root@135.181.107.76

# Install bun if not present
curl -fsSL https://bun.sh/install | bash
export PATH=$HOME/.bun/bin:$PATH

# Clone repo (or pull latest)
cd /root/thai-acc
git pull

# Build on Linux
bun install
bun run build

# Setup env
cat > /root/thai-acc/.next/standalone/Thai-acc/.env << 'EOF'
DATABASE_URL=file:/root/thai-acc/.next/standalone/Thai-acc/prisma/dev.db
NEXTAUTH_URL=https://acc.k56mm.uk
NEXTAUTH_SECRET=B/lLqgzybPsxU6dNnvb/wG5XuEpfVfU68pVN0A7KseY=
NODE_ENV=production
EOF

# Copy seeded DB
cp /root/thai-acc/prisma/dev.db /root/thai-acc/.next/standalone/Thai-acc/prisma/dev.db

# Start server
cd /root/thai-acc/.next/standalone/Thai-acc
PORT=3000 node server.js
```

### Option 2: Docker Build in CI/CD (RECOMMENDED)

This is the best long-term solution - builds happen in Linux containers, not macOS.

```dockerfile
# Dockerfile.linux-build
FROM oven/bun:1-debian AS builder
WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install
COPY . .
RUN bun run build
# Output: .next/standalone/ with Linux-native Prisma engines
```

**GitHub Actions Example:**
```yaml
- name: Build Linux standalone
  run: |
    docker build -f Dockerfile.linux-build -o .next/standalone .
    # Upload .next/standalone/ as artifact

- name: Deploy to VPS
  run: rsync -avz --delete .next/standalone/ root@vps:/root/thai-acc/.next/standalone/
```

**Why this works:** Docker always builds for its own kernel (Linux), so Prisma engines match the deployment target.

### Option 3: Fix Local Build (For manual deploy)

1. Edit `prisma/schema.prisma`:
```prisma
generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "debian-openssl-3.0.x"]
}
```

2. Regenerate client:
```bash
bun run db:generate
bun run build
```

3. Upload standalone to VPS

## Current Status

- ✅ Clean build created locally
- ✅ Uploaded to VPS
- ❌ Auth fails - Prisma engine mismatch (macOS build on Linux)
- ⏳ Needs rebuild on Linux

## Verification

```bash
# Health check
curl https://acc.k56mm.uk/api/health

# Login test (after rebuild)
curl -X POST https://acc.k56mm.uk/api/auth/callback/credentials \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@thaiaccounting.com","password":"admin123","csrfToken":<csrf>}'

# Should return session with user data, not "Database connection error"
```
