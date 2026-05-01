<!-- Parent: ./AGENTS.md -->
<!-- Generated: 2026-04-17 -->

# deploy/

## Purpose

VPS deployment artifacts, deployment guides, and production-ready packages.

## Key Files

| File                            | Description                                            |
| ------------------------------- | ------------------------------------------------------ |
| `keerati-erp-vps.zip`           | Standalone production build (~30MB) for VPS deployment |
| `keerati-erp-vps/`              | Uncompressed deployment directory                      |
| `PRODUCTION-READY-CHECKLIST.md` | Pre-deployment verification checklist                  |
| `README.md`                     | Deployment quick start guide                           |
| `VPS-DEPLOYMENT-GUIDE.md`       | Detailed VPS deployment instructions                   |
| `คู่มือผู้ใช้-Keerati-ERP.md`   | Thai user manual for Keerati ERP                       |

## For AI Agents

### Deployment Process

1. Upload `keerati-erp-vps.zip` to VPS
2. Extract and configure `.env` with absolute database path
3. Run `node .next/standalone/thai-acc/server.js`
4. Tunnel connects via `cloudflared` to `acc.k56mm.uk`

### Production Build

```bash
bun run build  # Creates standalone output
```

### VPS Restart Commands

```bash
# Restart server only (not tunnel)
ssh root@VPS "pkill -f 'node.*standalone'; cd /root/thai-acc && nohup node .next/standalone/thai-acc/server.js > /root/thai-acc/server.log 2>&1 &"

# Check server status
ssh root@VPS "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/"
```

## Dependencies

### Internal

- Prisma client for database connectivity
- NextAuth.js for authentication
- Cloudflare tunnel for domain routing
