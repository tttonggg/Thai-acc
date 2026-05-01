# 🌸 Keerati ERP - Deployment Package

## 📦 Package Contents

```
keerati-erp-vps/
├── .next/              # Next.js build output
├── public/             # Static assets
├── prisma/             # Database schema
├── node_modules/       # Dependencies
├── server.js           # Application entry point
├── dev.db              # SQLite database
├── schema.prisma       # Prisma schema
├── package.json        # Package config
├── .env.production     # Environment template
├── start.sh            # Startup script
└── README.md           # This file
```

## 🚀 Quick Deploy

### 1. Upload to VPS

```bash
scp -r keerati-erp-vps user@your-vps:/var/www/
```

### 2. Configure

```bash
cd /var/www/keerati-erp-vps
nano .env.production
```

Update:

```env
DATABASE_URL=file:/var/www/keerati-erp-vps/dev.db
NEXTAUTH_URL=http://your-domain.com
NEXTAUTH_SECRET=$(openssl rand -base64 32)
```

### 3. Start

```bash
npm install --production
pm2 start server.js --name "keerati-erp"
pm2 save
pm2 startup
```

### 4. Access

```
http://your-domain.com:3000
```

**Default Login:**

- Email: `admin@thaiaccounting.com`
- Password: `admin123`

## ✅ Features Verified

| Feature                       | Status     |
| ----------------------------- | ---------- |
| Client-side Print (All pages) | ✅ Working |
| VAT Report Print              | ✅ Working |
| WHT Report Print              | ✅ Working |
| Invoice Print                 | ✅ Working |
| Receipt Print                 | ✅ Working |
| Payment Print                 | ✅ Working |
| Report Print                  | ✅ Working |

## 📋 System Requirements

- Node.js 18+
- 2GB RAM minimum
- 1GB disk space

## 🔧 Troubleshooting

If print buttons don't work:

1. Check browser allows popups
2. Ensure BYPASS_RATE_LIMIT=true in .env (for testing)
3. Check server logs: `pm2 logs keerati-erp`

---

**Keerati ERP v1.0** 🌸
