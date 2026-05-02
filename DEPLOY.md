# Thai ACC — Production Deployment Guide

This document covers deploying the Thai ACC stack (FastAPI + Next.js + PostgreSQL) to a VPS using Docker Compose.

---

## Prerequisites

On your **local machine**:
- Docker Engine >= 24.0
- Docker Compose >= 2.20
- `ssh` and `scp` (pre-installed on macOS/Linux)
- Access to target VPS: `root@135.181.107.76`

On the **VPS** (`135.181.107.76`):
- Docker Engine installed
- Docker Compose installed
- SSH access with key-based auth configured

### Quick VPS Docker install (if needed)

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# Log out and back in
```

---

## Initial Setup

### 1. Clone / prepare project on VPS

```bash
ssh root@135.181.107.76
mkdir -p /root/thai-acc
```

### 2. Configure environment variables

Copy the example file and fill in real values:

```bash
cp .env.example .env
nano .env
```

Required variables:

| Variable | Description |
|----------|-------------|
| `DB_PASSWORD` | Strong PostgreSQL password |
| `JWT_SECRET_KEY` | Random 256-bit secret for JWT signing |
| `FRONTEND_URL` | Public domain, e.g. `https://accounting.yourcompany.com` |

> **Security:** Never commit `.env` to git. It is already in `.gitignore`.

### 3. Run first deploy

From your **local machine**:

```bash
cd /Users/tong/peak-acc
./deploy.sh
```

The script will:
1. Build images locally
2. Save and `scp` them to the VPS
3. Load images on the VPS
4. Start services with `docker-compose up -d`
5. Run a health check against the backend

---

## Post-Deploy Verification

Check services are running:

```bash
ssh root@135.181.107.76 "cd /root/thai-acc && docker-compose ps"
```

View logs:

```bash
# All services
ssh root@135.181.107.76 "cd /root/thai-acc && docker-compose logs -f"

# Backend only
ssh root@135.181.107.76 "cd /root/thai-acc && docker-compose logs -f backend"

# Database
ssh root@135.181.107.76 "cd /root/thai-acc && docker-compose logs -f db"
```

Health endpoints:
- Backend: `http://135.181.107.76:3001/health`
- API Docs: `http://135.181.107.76:3001/docs`
- App: `http://135.181.107.76:3001/`

---

## SSL with Let's Encrypt

Once DNS points your domain to `135.181.107.76`, enable HTTPS:

### 1. Install certbot on the VPS

```bash
ssh root@135.181.107.76
apt-get update && apt-get install -y certbot
```

### 2. Obtain certificate (standalone mode)

```bash
certbot certonly --standalone -d your-domain.com -d www.your-domain.com
```

Certificates are saved to:
```
/etc/letsencrypt/live/your-domain.com/
```

### 3. Update nginx config

Edit `/root/thai-acc/nginx.conf` (copied from `nginx.prod.conf`):

- Uncomment the SSL `listen` and certificate lines
- Uncomment the HTTP-to-HTTPS redirect block
- Mount the Let's Encrypt directory into the nginx container by updating `docker-compose.yml`:

```yaml
  nginx:
    volumes:
      - ./nginx.prod.conf:/etc/nginx/nginx.conf:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro
      - /var/www/certbot:/var/www/certbot:ro
```

### 4. Restart nginx

```bash
cd /root/thai-acc && docker-compose restart nginx
```

### 5. Auto-renewal

Add a cron job on the VPS:

```bash
crontab -e
# Add:
0 3 * * * certbot renew --quiet && cd /root/thai-acc && docker-compose restart nginx
```

---

## Updating the Application

For each new release, re-run the deploy script from your local machine:

```bash
cd /Users/tong/peak-acc
./deploy.sh
```

The script rebuilds images, transfers them, and restarts services with zero-downtime considerations (containers are stopped then started — for true zero-downtime, consider a blue/green or rolling update strategy).

---

## Database Backups

Run a manual backup:

```bash
ssh root@135.181.107.76 "cd /root/thai-acc && docker-compose exec -T db pg_dump -U thaiacc thaiacc" > backup_$(date +%F).sql
```

Add a daily cron job on the VPS:

```bash
0 2 * * * cd /root/thai-acc && docker-compose exec -T db pg_dump -U thaiacc thaiacc > /root/backups/thaiacc_$(date +\%F).sql
```

---

## Troubleshooting

### Containers fail to start

```bash
ssh root@135.181.107.76 "cd /root/thai-acc && docker-compose logs --tail=100"
```

### Backend health check fails

1. Check if backend can reach the database:
   ```bash
   ssh root@135.181.107.76 "cd /root/thai-acc && docker-compose exec backend curl -f http://db:5432"
   ```
2. Verify `DATABASE_URL` in `.env` matches `DB_PASSWORD`.

### Nginx returns 502 Bad Gateway

1. Ensure backend container is running:
   ```bash
   docker-compose ps backend
   ```
2. Check backend logs for startup errors.

### Port already in use

Thai ACC runs on port `3001` by default to avoid conflicting with other services on the host. If you need to change the port, edit `docker-compose.prod.yml`:

```yaml
  nginx:
    ports:
      - "3001:80"
```

### Disk space issues

Clean unused images and volumes:
```bash
docker system prune -af --volumes
```

---

## Architecture Overview

```
Internet
    │
    ▼
┌─────────────┐
│   Nginx     │  ← Reverse proxy, static caching
│   :3001     │
└──────┬──────┘
       │
   ┌───┴────┐
   ▼        ▼
┌──────┐  ┌─────────┐
│Frontend│  │ Backend │  ← Next.js (3000)    FastAPI + Gunicorn (8000)
│:3000  │  │ :8000   │
└──────┘  └────┬────┘
               │
               ▼
          ┌──────────┐
          │PostgreSQL│  ← Internal only (no exposed port)
          │  :5432   │
          └──────────┘
```

- **Nginx** handles all external traffic, reverse-proxies `/api/` to backend and `/` to frontend.
- **Frontend** is built at image build time with `NEXT_PUBLIC_API_URL=/api/v1`.
- **Backend** runs 4 uvicorn workers under gunicorn for concurrency.
- **Database** has no published ports; only accessible within the Docker network.

---

## Security Checklist

- [ ] `.env` file is present on VPS and not in git
- [ ] `DB_PASSWORD` is strong and unique
- [ ] `JWT_SECRET_KEY` is at least 32 random bytes
- [ ] UFW/firewall allows only ports 22, 3001
- [ ] SSH key-based auth is enforced (no password login)
- [ ] Automatic security updates are enabled on VPS
- [ ] Database backups are scheduled
- [ ] SSL certificates are configured and auto-renewing
