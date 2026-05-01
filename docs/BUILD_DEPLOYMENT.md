# Production Build Configuration & Deployment Guide

## Build Configuration Status

**Next.js Config**: `/Users/tong/Thai-acc/next.config.ts`

- ✅ Standalone output enabled: `output: "standalone"`
- ✅ TypeScript errors ignored for builds
- ✅ React Strict Mode disabled

**Build Size**: ~925MB (with all dependencies)

**Current Issues & Recommendations**

---

## 1. CRITICAL ISSUE: Manual Dependency Installation Required

### Problem

The standalone build does NOT automatically install dependencies in
`.next/standalone/node_modules`. This must be done manually after each build.

### Solution Implemented

Updated `package.json` with automated build script:

```json
"build": "next build && npm run build:standalone",
"build:standalone": "cp -r .next/static .next/standalone/.next/ && cp -r public .next/standalone/ && cd .next/standalone && npm install --production --legacy-peer-deps && cd ../.."
```

### New Build Command

```bash
npm run build
```

This now automatically:

1. Builds Next.js application
2. Copies static files
3. Installs production dependencies (351 packages)
4. Displays reminder about DATABASE_URL

---

## 2. ENVIRONMENT CONFIGURATION

### Issue: DATABASE_URL Must Use Absolute Path

The standalone build MUST use an absolute path for the database. Relative paths
cause Prisma to connect to the wrong database.

### Current Configuration

`.next/standalone/.env`:

```env
DATABASE_URL=file:/Users/tong/Thai-acc/.next/standalone/dev.db
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=B/lLqgzybPsxU6dNnvb/wG5XuEpfVfU68pVN0A7KseY=
```

### Root `.env` (for development)

```env
DATABASE_URL=file:./prisma/dev.db
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=B/lLqgzybPsxU6dNnvb/wG5XuEpfVfU68pVN0A7KseY=
```

---

## 3. DEPLOYMENT WORKFLOW

### Option 1: Using npm scripts (Recommended)

```bash
# Complete production build
npm run build

# Start production server (Bun - faster)
npm run start

# Start production server (Node.js)
npm run start:node
```

### Option 2: Using dedicated build script

```bash
# Automated production build with all steps
./scripts/build-production.sh

# Then start server
bun .next/standalone/server.js
```

### Option 3: Manual steps

```bash
# 1. Build Next.js
next build

# 2. Copy static files
cp -r .next/static .next/standalone/.next/
cp -r public .next/standalone/

# 3. Copy database
cp prisma/dev.db .next/standalone/dev.db

# 4. Install dependencies (CRITICAL!)
cd .next/standalone
npm install --production --legacy-peer-deps

# 5. Update .env with absolute DATABASE_URL
echo "DATABASE_URL=file:$(pwd)/dev.db" > .env
echo "NEXTAUTH_URL=http://localhost:3000" >> .env
echo "NEXTAUTH_SECRET=YOUR_SECRET" >> .env

# 6. Start server
cd ..
bun server.js
```

---

## 4. PRODUCTION DEPLOYMENT CHECKLIST

### Pre-Deployment

- [ ] Run `npm run build` and verify no errors
- [ ] Confirm `.next/standalone/node_modules` exists (351 packages)
- [ ] Verify `.next/standalone/.env` has absolute DATABASE_URL
- [ ] Copy database: `cp prisma/dev.db .next/standalone/dev.db`
- [ ] Test database connection: Check that users exist (4 users)
- [ ] Verify all 6 modules accessible (WHT, Inventory, Assets, Banking, Petty
      Cash, Payroll)

### Deployment (Server)

- [ ] Copy `.next/standalone/` directory to server
- [ ] Install Bun runtime: `curl -fsSL https://bun.sh/install | bash`
- [ ] Update `.env` with server's absolute paths
- [ ] Set `NODE_ENV=production`
- [ ] Configure process manager (PM2, systemd)
- [ ] Set up database backups
- [ ] Configure SSL/HTTPS
- [ ] Test all modules in production environment

### Post-Deployment

- [ ] Verify authentication works (test login)
- [ ] Test document creation (invoices, receipts, payments)
- [ ] Validate GL posting accuracy
- [ ] Check PDF generation (50 Tawi, invoices)
- [ ] Verify Thai date formatting
- [ ] Test all 6 expansion modules
- [ ] Monitor error logs
- [ ] Set up monitoring/alerting

---

## 5. TROUBLESHOOTING

### Issue: "Cannot find module" errors

**Cause**: Dependencies not installed in standalone directory

**Solution**:

```bash
cd .next/standalone
npm install --production --legacy-peer-deps
```

### Issue: "Email or password incorrect" at login

**Cause**: DATABASE_URL using relative path, connecting to wrong database

**Solution**: Update `.next/standalone/.env`:

```bash
DATABASE_URL=file:/absolute/path/to/.next/standalone/dev.db
```

### Issue: "Table does not exist" errors

**Cause**: Database empty or wrong database

**Solution**:

1. Verify database exists: `ls -lh .next/standalone/dev.db` (should be ~732KB)
2. Check database has data:
   `sqlite3 .next/standalone/dev.db "SELECT COUNT(*) FROM User;"`
3. If needed, reseed: `cp prisma/dev.db .next/standalone/dev.db`

### Issue: Port already in use

**Solution**:

```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
PORT=3001 bun .next/standalone/server.js
```

---

## 6. DOCKER DEPLOYMENT (Optional)

### Dockerfile

```dockerfile
FROM node:20-alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --production --legacy-peer-deps

# Build application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma/dev.db ./dev.db

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
```

### Build and run

```bash
docker build -t thai-accounting .
docker run -p 3000:3000 -v $(pwd)/db:/app/db thai-accounting
```

---

## 7. SYSTEM ARCHITECTURE

### Build Output Structure

```
.next/standalone/
├── server.js           # Standalone server entry point
├── package.json        # Production dependencies
├── package-lock.json   # Lock file
├── .env               # Environment config (MUST HAVE ABSOLUTE PATHS)
├── dev.db             # SQLite database (732KB)
├── node_modules/      # 351 production packages
├── public/            # Static assets (copied from root)
└── .next/             # Next.js build output
    ├── static/        # Static files (copied from .next/static)
    ├── server/        # Server-side code
    └── ...
```

### Key Dependencies Installed

- Core: `next`, `react`, `react-dom`
- Auth: `next-auth`, `bcryptjs`
- Database: `@prisma/client`
- UI: `@radix-ui/*`, `lucide-react`, `recharts`
- Utilities: `zod`, `date-fns`, `zustand`
- PDF: `jspdf`, `jspdf-autotable`, `pdfkit`

---

## 8. PERFORMANCE CONSIDERATIONS

### Bun vs Node.js

**Bun** (Recommended for production):

- Faster startup time
- Lower memory usage
- Better performance for I/O operations
- Native TypeScript support

**Node.js** (Fallback):

- More stable ecosystem
- Better debugging tools
- Wider package compatibility

### Database Considerations

**Current**: SQLite (development)

- Single-file database
- No separate database server needed
- Suitable for low to medium traffic
- Easy backup (copy file)

**Production Recommendation**: PostgreSQL

- Better concurrency
- More robust for high traffic
- Better backup/restore options
- Connection pooling

---

## 9. SECURITY CONSIDERATIONS

### Environment Variables

- ✅ `NEXTAUTH_SECRET` is set
- ⚠️ Consider using stronger random secret for production
- ⚠️ Never commit `.env` files to version control

### Database

- ✅ Database file in standalone directory
- ⚠️ Set up regular backups
- ⚠️ Consider encryption for sensitive data

### HTTPS

- ⚠️ Use HTTPS in production
- ⚠️ Configure SSL certificate
- ⚠️ Update `NEXTAUTH_URL` to use https://

---

## 10. SUMMARY

### Current Status: ✅ Build Configured Correctly

| Component      | Status | Notes                                  |
| -------------- | ------ | -------------------------------------- |
| Next.js Config | ✅     | Standalone output enabled              |
| Build Script   | ✅     | Automated with dependency installation |
| Environment    | ⚠️     | DATABASE_URL must be absolute path     |
| Database       | ✅     | Copied to standalone directory         |
| Dependencies   | ✅     | 351 packages installed                 |
| Server Start   | ✅     | Works with Bun and Node.js             |

### Recommendations

1. **Use the new automated build script**: `npm run build`
2. **Always verify DATABASE_URL uses absolute path**
3. **Consider PostgreSQL for production deployments**
4. **Set up process manager (PM2) for auto-restart**
5. **Configure database backups**
6. **Enable HTTPS in production**
7. **Set up monitoring and error tracking**

---

**Last Updated**: 2026-03-12 **Next.js Version**: 16.1.1 **Node.js Version**:
20+ **Prisma Version**: 6.11.1
