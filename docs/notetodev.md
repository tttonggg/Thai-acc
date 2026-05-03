# VPS Deployment Notes for Dev Team

## What Happened

Attempted clean deploy to production VPS (2026-05-02) failed due to **Prisma platform mismatch**.

### Root Cause

| Build Machine | CPU Arch | Prisma Engine |
|--------------|---------|---------------|
| macOS (local dev) | darwin-arm64 | ❌ Built with this |
| VPS (debian) | debian-openssl-3.0.x | ❌ Required but missing |

The standalone build contains pre-compiled Prisma query engines. When built on macOS, only `libquery_engine-darwin-arm64.dylib.node` is included. When deployed to Linux VPS, the engine fails to load.

### Symptoms

```
PrismaClientInitializationError: 
Prisma Client could not locate the Query Engine for runtime "debian-openssl-3.0.x"
```

This causes: `Database connection error. Please try again.` on login attempts.

## Solutions

### ✅ SOLUTION 1: Build on VPS (Immediate fix)

```bash
ssh -i ~/.ssh/test root@135.181.107.76

# Install bun
curl -fsSL https://bun.sh/install | bash
export PATH=$HOME/.bun/bin:$PATH

# Pull latest and build
cd /root/thai-acc
git pull
bun install
bun run build

# Setup env and copy DB
# (See DEPLOY.md for full steps)
```

### ✅ SOLUTION 2: Docker Build in CI/CD (Long-term fix)

Edit `Dockerfile` or create `Dockerfile.linux-build` that builds on Linux:
- GitHub Actions builds in Docker container
- Always produces Linux-native Prisma engines
- Upload artifact to VPS

### ✅ SOLUTION 3: Add binaryTargets locally (Quick manual fix)

Edit `prisma/schema.prisma` before building:
```prisma
generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "debian-openssl-3.0.x"]
}
```
Then run `bun run db:generate && bun run build`

## Lessons Learned

1. **Standalone builds are platform-specific** - cannot build on macOS and deploy to Linux
2. **Docker is the solution** - use Linux containers for building
3. **Never touch other tunnels** - only tunnel `e4880092-554d-471c-aa65-ec8c25b7e6bd`
4. **Always verify health before auth** - `/api/health` must return 200 before testing login

## Current Status

- Server running: Yes (`curl https://acc.k56mm.uk/api/health` returns `{"status":"ok"}`)
- Auth working: No (401 due to Prisma engine mismatch)
- Static assets: Working
- Cloudflare proxy: Working

## Files Created

- `docs/DEPLOY.md` - Full deployment instructions
- `docs/notetodev.md` - This file

## Next Steps

1. Someone with VPS access needs to `git pull && bun run build` on the VPS
2. Or set up Docker-based CI/CD pipeline
3. Once rebuilt, auth should work automatically

## References

- Problem explanation: `docs/DEPLOY.md`
- Tunnel config: `CLAUDE.md` section "VPS Tunnel Configuration"
- Current .env on VPS: `/root/thai-acc/.next/standalone/Thai-acc/.env`
