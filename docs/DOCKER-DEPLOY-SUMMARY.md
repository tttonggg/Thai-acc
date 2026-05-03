# Docker CI/CD Deployment Summary
**Date:** May 2, 2026
**Project:** Thai Accounting ERP
**Author:** Claude Code

---

## Problem: macOS → Linux Platform Mismatch

**Symptom:**
- macOS builds produced `darwin-arm64` Prisma engines
- Linux VPS needed `debian-openssl-3.0.x` engines
- Result: "Database connection error" + 401 "ไม่ได้รับอนุญาต" on all API calls

**Root Cause:**
When building on macOS, Prisma generates platform-specific binaries. These binaries don't work on Linux VPS.

---

## Solution: Docker CI/CD Pipeline

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     GitHub Actions CI                          │
├─────────────────────────────────────────────────────────────────┤
│  1. Checkout code (ubuntu-latest)                              │
│  2. Docker Buildx setup                                        │
│  3. Login to GitHub Container Registry (ghcr.io)               │
│  4. Build Docker image (Linux-native build)                    │
│     - Uses node:20-alpine                                      │
│     - Runs: npm install → prisma generate → npm run build      │
│  5. Push to ghcr.io/tttonggg/thai-acc:[sha-tag]               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     VPS (Linux)                                │
├─────────────────────────────────────────────────────────────────┤
│  1. SSH via appleboy/ssh-action                                │
│  2. docker stop thai-acc-app && docker rm thai-acc-app        │
│  3. docker pull ghcr.io/tttonggg/thai-acc:[sha]               │
│  4. docker run -d -p 3000:3000 \                              │
│       -e DATABASE_URL=file:/app/prisma/dev.db \               │
│       -e NEXTAUTH_URL=https://acc.k56mm.uk \                  │
│       -e NEXTAUTH_SECRET=[secret] \                           │
│       -v /root/thai-acc/prisma:/app/prisma \                  │
│       ghcr.io/tttonggg/thai-acc:[sha]                         │
│  5. Health check: curl http://localhost:3000/api/health       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Files Changed

| File | Change |
|------|--------|
| `Dockerfile` | Multi-stage build: deps → builder → runner |
| `.github/workflows/deploy-vps.yml` | Complete rewrite: git clone → Docker build |
| `next.config.ts` | Handle missing git in Docker build |
| `docs/CLAUDE.md` | Updated deployment section with Docker info |

---

## Dockerfile Key Points

```dockerfile
# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN npm install --ignore-scripts --legacy-peer-deps
RUN npx prisma generate  # Generates Linux binaries

# Stage 2: Builder
FROM node:20-alpine AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma
COPY . .
RUN npm run build  # Next.js standalone output

# Stage 3: Runner (non-root security)
FROM node:20-alpine AS runner
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
```

---

## GitHub Secrets Required

| Secret | Value |
|--------|-------|
| `VPS_HOST` | `135.181.107.76` |
| `VPS_USER` | `root` |
| `VPS_SSH_PRIVATE_KEY` | Private key content |
| `NEXTAUTH_SECRET` | NextAuth secret string |
| `CLOUDFLARED_TUNNEL_TOKEN` | For Cloudflare tunnel |

---

## Benefits

1. **No platform mismatch** - Linux container built on Linux runners
2. **Consistent builds** - Same image from CI to production
3. **Faster deploys** - Cached Docker layers
4. **Rollback easy** - `docker pull` previous SHA
5. **Isolation** - App runs in container, doesn't affect host

---

## Troubleshooting

**Container won't start?**
```bash
docker logs thai-acc-app
```

**Check environment variables?**
```bash
docker inspect thai-acc-app --format '{{.Config.Env}}'
```

**Check if running?**
```bash
docker ps | grep thai-acc-app
```

**Force restart:**
```bash
docker stop thai-acc-app && docker rm thai-acc-app
docker run -d --name thai-acc-app -p 3000:3000 [image]
```

---

## Deployment Flow

1. Push to `master` branch
2. GitHub Actions triggers `Deploy to VPS (Docker)` workflow
3. Docker image builds (~3-5 min) and pushes to GHCR
4. VPS pulls image and starts container
5. Health check validates deployment

**Manual trigger:** GitHub → Actions → "Deploy to VPS (Docker)" → Run workflow