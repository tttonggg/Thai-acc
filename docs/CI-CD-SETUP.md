# GitHub Actions CI/CD Setup Guide

## 🚀 Overview

This repository now has automatic CI/CD pipeline that:

- ✅ Runs tests on every push
- ✅ Builds the application
- ✅ Deploys to your VPS automatically
- ✅ Free for private repositories

## 📋 Prerequisites

1. **GitHub Repository**: https://github.com/tttonggg/Thai-acc
2. **VPS Access**: SSH access to your VPS (135.181.107.76)
3. **PM2** installed on VPS (for process management)

## 🔧 Step 1: Configure GitHub Secrets

Go to your GitHub repository settings:
`https://github.com/tttonggg/Thai-acc/settings/secrets/actions`

Click **"New repository secret"** and add these secrets:

### Required Secrets:

| Secret Name           | Description                   | Example Value                       |
| --------------------- | ----------------------------- | ----------------------------------- |
| `VPS_HOST`            | Your VPS IP address or domain | `135.181.107.76` or `acc.k56mm.uk`  |
| `VPS_USER`            | SSH username                  | `root`                              |
| `VPS_SSH_PRIVATE_KEY` | Your SSH private key          | (Copy from `~/.ssh/id_rsa`)         |
| `VPS_APP_PATH`        | Application path on VPS       | `/root/thai-acc`                    |
| `DATABASE_URL`        | Database connection string    | `file:/root/thai-acc/prisma/dev.db` |
| `NEXTAUTH_URL`        | Your application URL          | `https://acc.k56mm.uk`              |
| `NEXTAUTH_SECRET`     | NextAuth secret key           | (Generate random 32+ char string)   |

### How to Get These Values:

#### 1. VPS_HOST

```bash
# Your VPS IP
echo "135.181.107.76"
```

#### 2. VPS_USER

```bash
# Usually root for VPS
echo "root"
```

#### 3. VPS_SSH_PRIVATE_KEY

```bash
# On your local machine, copy your SSH private key
cat ~/.ssh/id_rsa
# OR if you use a specific key for this VPS
cat ~/.ssh/your_vps_key

# Copy the ENTIRE output including:
# -----BEGIN OPENSSH PRIVATE KEY-----
# ...
# -----END OPENSSH PRIVATE KEY-----
```

#### 4. VPS_APP_PATH

```bash
# Path where your app is deployed on VPS
echo "/root/thai-acc"
```

#### 5. DATABASE_URL

```bash
# Check current .env on VPS
ssh root@135.181.107.76 "cat /root/thai-acc/.env | grep DATABASE_URL"
# OR use absolute path
echo "file:/root/thai-acc/prisma/dev.db"
```

#### 6. NEXTAUTH_URL

```bash
echo "https://acc.k56mm.uk"
```

#### 7. NEXTAUTH_SECRET

```bash
# Generate a random secret
openssl rand -base64 32
# OR
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## 🔧 Step 2: Prepare Your VPS

### 2.1 Install PM2 (Process Manager)

```bash
# SSH into your VPS
ssh root@135.181.107.76

# Install PM2 globally
npm install -g pm2

# Setup PM2 to start on boot
pm2 startup
# Follow the instructions it outputs
```

### 2.2 Create Deployment Directory

```bash
# Ensure app directory exists
mkdir -p /root/thai-acc
cd /root/thai-acc
```

### 2.3 Copy Deployment Script to VPS

```bash
# From your local machine
scp scripts/vps-deploy.sh root@135.181.107.76:/root/thai-acc/scripts/
```

### 2.4 Make Script Executable

```bash
# On VPS
chmod +x /root/thai-acc/scripts/vps-deploy.sh
```

## 🔧 Step 3: Initialize Git on VPS

```bash
# On VPS
cd /root/thai-acc

# Initialize git (if not already done)
git init
git remote add origin https://github.com/tttonggg/Thai-acc.git
```

## 🔧 Step 4: Test Manual Deployment

Before enabling CI/CD, test manually:

```bash
# On your local machine
cd /Users/tong/Thai-acc

# Commit all changes
git add .
git commit -m "Enable CI/CD pipeline"
git push origin main
```

Then manually deploy on VPS:

```bash
# SSH into VPS
ssh root@135.181.107.76

# Go to app directory
cd /root/thai-acc

# Pull latest code
git pull origin main

# Install dependencies
bun install

# Build application
bun run build

# Update .env
echo "DATABASE_URL=file:/root/thai-acc/prisma/dev.db" > .next/standalone/.env
echo "NEXTAUTH_URL=https://acc.k56mm.uk" >> .next/standalone/.env
echo "NEXTAUTH_SECRET=your_secret_here" >> .next/standalone/.env
echo "NODE_ENV=production" >> .next/standalone/.env

# Restart application
pm2 restart keerati-erp
# OR
cd /root/thai-acc/.next/standalone && bun run start
```

## 🔧 Step 5: Enable CI/CD

Once manual deployment works:

1. **Push to GitHub**:

```bash
git add .
git commit -m "Configure CI/CD pipeline"
git push origin main
```

2. **Check GitHub Actions**:
   - Go to: https://github.com/tttonggg/Thai-acc/actions
   - You should see your workflow running
   - Click on the workflow to see progress

3. **Monitor Deployment**:
   - Tests will run first
   - Build will start
   - Deployment to VPS will begin automatically
   - Check the logs for any errors

## 🔧 Step 6: Verify Deployment

```bash
# Check if application is running
curl https://acc.k56mm.uk/api/health

# Should return:
# {
#   "status": "ok",
#   "timestamp": "2026-04-11T...",
#   "uptime": ...,
#   "environment": "production"
# }
```

## 🎯 How It Works

### Automatic Deployment (On Push to Main)

```
You push code → GitHub Actions triggers →
  ├─ Run tests
  ├─ Build application
  ├─ Upload to VPS
  ├─ Restart application
  └─ Health check
```

### Manual Deployment (Using GitHub UI)

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

## 🔄 Rollback Procedure

If deployment fails:

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

## ⚠️ Troubleshooting

### Deployment Fails

1. **Check GitHub Secrets**: Ensure all secrets are configured correctly
2. **Check VPS SSH**: Ensure you can SSH manually: `ssh root@135.181.107.76`
3. **Check Disk Space**: `df -h` on VPS
4. **Check PM2**: `pm2 list` on VPS
5. **Check Logs**: GitHub Actions logs + VPS logs

### Application Won't Start

```bash
# On VPS
cd /root/thai-acc

# Check .env file
cat .env

# Check if port 3000 is available
lsof -i:3000

# Start manually to see errors
bun run start
```

### Tests Fail Locally

```bash
# Run tests locally first
bun run test:quick
bun run type-check
bun run lint:fix
```

## 📚 Additional Resources

- **GitHub Actions Docs**: https://docs.github.com/en/actions
- **PM2 Docs**: https://pm2.keymetrics.io/docs/usage/quick-start/
- **Next.js Deployment**: https://nextjs.org/docs/deployment

## ✅ Checklist Before First Deployment

- [ ] All GitHub secrets configured
- [ ] PM2 installed on VPS
- [ ] SSH key added to GitHub (for deployment)
- [ ] VPS app directory exists
- [ ] Database is accessible on VPS
- [ ] Manual deployment tested successfully
- [ ] Health check endpoint works
- [ ] Application is accessible at https://acc.k56mm.uk

---

**Need Help?** Check the logs at:

- GitHub Actions: https://github.com/tttonggg/Thai-acc/actions
- VPS Deployment: `/root/thai-acc/deploy.log`
