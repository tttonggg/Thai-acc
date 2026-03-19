# 🚀 Keerati ERP - VPS Deployment Guide

## 📋 สิ่งที่ต้องเตรียมบน VPS

### 1. System Requirements
- **OS**: Ubuntu 20.04+ / Debian 11+ / CentOS 8+
- **RAM**:  minimum 2GB (แนะนำ 4GB)
- **Disk**: minimum 5GB free space
- **CPU**: 2 cores+

### 2. Install Required Software

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node -v  # v18.x.x
npm -v   # 9.x.x

# Install PM2 (process manager)
sudo npm install -g pm2
```

---

## 📦 การติดตั้ง

### Step 1: อัปโหลดไฟล์ไปยัง VPS

```bash
# On your local machine, upload the zip file
scp deploy/keerati-erp-vps.zip user@your-vps-ip:/var/www/

# On VPS
ssh user@your-vps-ip
cd /var/www
sudo mkdir -p tuktuk-erp
cd tuktuk-erp
sudo unzip ../keerati-erp-vps.zip
sudo mv keerati-erp-vps/* .
sudo rm -rf keerati-erp-vps
```

### Step 2: ตั้งค่า Environment

```bash
cd /var/www/tuktuk-erp
sudo nano .env.production
```

แก้ไขค่าตามนี้:

```env
# Keerati ERP - Production Environment
DATABASE_URL=file:/var/www/tuktuk-erp/dev.db
NEXTAUTH_URL=http://your-domain.com  # หรือ IP:PORT
NEXTAUTH_SECRET=your-random-secret-key-min-32-chars
NODE_ENV=production
PORT=3000
BYPASS_RATE_LIMIT=false
```

**สร้าง NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### Step 3: ตั้งค่า Permissions

```bash
cd /var/www/tuktuk-erp
sudo chown -R www-data:www-data .
sudo chmod +x start.sh
```

### Step 4: Test Run

```bash
cd /var/www/tuktuk-erp/app
sudo node server.js
```

ถ้าไม่มี error ให้กด `Ctrl+C` แล้วตั้งค่า PM2

### Step 5: ตั้งค่า PM2 (Production)

```bash
cd /var/www/tuktuk-erp/app

# Start with PM2
sudo pm2 start server.js --name "tuktuk-erp" --env production

# Save PM2 config
sudo pm2 save
sudo pm2 startup systemd
```

---

## 🌐 ตั้งค่า Nginx (Reverse Proxy)

```bash
sudo apt install nginx -y

sudo nano /etc/nginx/sites-available/tuktuk-erp
```

เพิ่ม configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/tuktuk-erp /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 🔒 SSL Certificate (HTTPS)

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com
```

---

## ✅ ตรวจสอบการทำงาน

```bash
# Check PM2 status
sudo pm2 status

# Check logs
sudo pm2 logs tuktuk-erp

# Check nginx
sudo systemctl status nginx
```

เข้าใช้งาน: `https://your-domain.com`

---

## 🔧 การจัดการ

### รีสตาร์ทแอพ
```bash
sudo pm2 restart tuktuk-erp
```

### ดู Logs
```bash
sudo pm2 logs tuktuk-erp
sudo pm2 logs tuktuk-erp --lines 100
```

### อัปเดตแอพ
```bash
# Backup database
cp /var/www/tuktuk-erp/dev.db /var/www/tuktuk-erp/dev.db.backup.$(date +%Y%m%d)

# Stop app
sudo pm2 stop tuktuk-erp

# Upload new files
scp deploy/keerati-erp-vps.zip user@your-vps-ip:/var/www/tuktuk-erp/

# Extract and replace
sudo systemctl restart nginx
sudo pm2 restart tuktuk-erp
```

---

## 🛡️ Security Checklist

- [ ] เปลี่ยน NEXTAUTH_SECRET
- [ ] ปิด port 3000 จากภายนอก (ผ่าน firewall)
- [ ] ตั้งค่า UFW firewall
- [ ] เปิดใช้ HTTPS
- [ ] ตั้งค่า fail2ban

```bash
# Firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw enable
```

---

## 🆘 Troubleshooting

### Error: Port already in use
```bash
sudo lsof -ti:3000 | xargs sudo kill -9
```

### Error: Permission denied
```bash
sudo chown -R www-data:www-data /var/www/tuktuk-erp
sudo chmod -R 755 /var/www/tuktuk-erp
```

### Error: Database locked
```bash
# Check if another process using DB
sudo lsof /var/www/tuktuk-erp/dev.db

# Fix permissions
sudo chmod 644 /var/www/tuktuk-erp/dev.db
```

---

**Keerati ERP v1.0 🛺**
