# 🌸 Keerati ERP - Deployment Package

## 🚀 Quick Deploy (5 Steps)

### Step 1: Upload to VPS

```bash
scp keerati-erp-vps.zip user@vps:/var/www/
```

### Step 2: Extract

```bash
ssh user@vps-ip
cd /var/www
unzip keerati-erp-vps.zip
mv keerati-erp-vps keerati-erp
cd keerati-erp
```

### Step 3: Configure

```bash
nano .env.production
```

Edit:

```env
DATABASE_URL=file:/var/www/keerati-erp/dev.db
NEXTAUTH_URL=http://your-domain.com
NEXTAUTH_SECRET=$(openssl rand -base64 32)
```

### Step 4: Start

```bash
cd app && pm2 start server.js --name "keerati-erp"
pm2 save
pm2 startup
```

### Step 5: Access

Open: `http://your-domain.com:3000`

Default login:

- Email: `admin@thaiaccounting.com`
- Password: `admin123`

---

## 📚 Documentation

- [VPS Deployment Guide](VPS-DEPLOYMENT-GUIDE.md) - Full guide with Nginx, SSL
- [คู่มือผู้ใช้](คู่มือผู้ใช้-Keerati-ERP.md) - Thai user manual

---

**Keerati ERP v1.0** 🌸 โปรแกรมบัญชีสไตล์คุณ
