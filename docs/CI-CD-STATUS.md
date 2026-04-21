# CI/CD Setup Status

## ✅ Completed

### 1. CI/CD Pipeline Configuration
- **GitHub Actions Workflow**: `.github/workflows/deploy.yml` created
- **VPS Deployment Script**: `scripts/vps-deploy.sh` created
- **Documentation**: `CI-CD-SETUP.md` created

### 2. GitHub Secrets Configured
All 7 required secrets configured by user:
- `VPS_HOST` - VPS IP address/domain
- `VPS_USER` - SSH username
- `VPS_SSH_PRIVATE_KEY` - SSH private key
- `VPS_APP_PATH` - Application path on VPS
- `DATABASE_URL` - Database connection string
- `NEXTAUTH_URL` - Application URL
- `NEXTAUTH_SECRET` - NextAuth secret key

### 3. Bug Fixes Applied
- **Critical Satang/Baht conversions** in receipt and payment forms
- **Debit note form** - Fixed purchases API response handling

### 4. Pipeline Status
- **Latest Run**: #24343125212 (queued)
- **Status**: Monitoring deployment progress

## 🔄 CI/CD Pipeline Features

### Automatic Deployment (On Push to Master)
```
You push code → GitHub Actions triggers →
  ├─ Run tests (type-check, lint, smoke tests)
  ├─ Build application (bun run build)
  ├─ Upload to VPS (rsync)
  ├─ Restart application (PM2)
  └─ Health check
```

### Manual Deployment
1. Go to: https://github.com/tttonggg/Thai-acc/actions
2. Click "CI/CD Pipeline" workflow
3. Click "Run workflow" button
4. Select branch and environment
5. Click "Run workflow"

## 📊 Monitoring

### View Deployment Logs
- **GitHub**: https://github.com/tttonggg/Thai-acc/actions
- **VPS Logs**: `ssh root@135.181.107.76 "tail -f /root/thai-acc/deploy.log"`
- **PM2 Logs**: `ssh root@135.181.107.76 "pm2 logs keerati-erp"`

### Check Application Status
```bash
# SSH into VPS
ssh root@135.181.107.76

# Check PM2 status
pm2 status

# Check application logs
pm2 logs keerati-erp

# View real-time logs
pm2 logs keerati-erp --lines 100
```

## 🚀 Deployment URL
- **Production**: https://acc.k56mm.uk
- **Health Check**: https://acc.k56mm.uk/api/health

## 📝 Recent Commits
1. `ee2fada` - 🐛 FIX: Handle purchases API response format in debit note form
2. `fff2dcb` - 🚀 FEAT: CI/CD Pipeline - Automatic Deployment
3. `dc5d529` - 🔧 FIX: Receipt, Invoice, Purchase account codes and journal balancing

## ⚠️ Troubleshooting

### If Deployment Fails
1. Check GitHub Secrets are configured correctly
2. Verify VPS SSH access: `ssh root@135.181.107.76`
3. Check disk space on VPS: `df -h`
4. Check PM2 status: `pm2 list`
5. Review GitHub Actions logs

### Rollback Procedure
```bash
# SSH into VPS
ssh root@135.181.107.76

# List backups
ls -la /root/thai-acc/backups/deployments/

# Restore from backup
cp -r /root/thai-acc/backups/deployments/deploy_YYYYMMDD_HHMMSS/.next/* /root/thai-acc/.next/

# Restart application
pm2 restart keerati-erp
```

---

**Last Updated**: 2026-04-13 12:23 UTC
**Status**: 🟢 CI/CD Pipeline Active - Monitoring deployment
