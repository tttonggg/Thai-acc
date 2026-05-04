# Spec: Security — Enable HTTPS + Let's Encrypt + HSTS

## Objective
Enable HTTPS on the production VPS with Let's Encrypt certificates and HSTS headers. Currently the site serves HTTP only, which is a critical security vulnerability.

## Current State
- `nginx.prod.conf` has SSL configuration commented out
- `https://acc3.k56mm.uk/` works (Cloudflare or some proxy in front?) but backend communication may be HTTP
- `frontend_url` in backend config defaults to `http://localhost:3000`
- No HSTS header
- No HTTP→HTTPS redirect

## Implementation Plan

### Step 1: Install Certbot on VPS
```bash
ssh -i ~/.ssh/test root@135.181.107.76
apt-get update
apt-get install -y certbot
```

### Step 2: Obtain Certificate
```bash
certbot certonly --standalone -d acc3.k56mm.uk --agree-tos -m admin@thai-acc.com --non-interactive
```

### Step 3: Update nginx.prod.conf
```nginx
server {
    listen 80;
    server_name acc3.k56mm.uk;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name acc3.k56mm.uk;

    ssl_certificate /etc/letsencrypt/live/acc3.k56mm.uk/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/acc3.k56mm.uk/privkey.pem;
    ssl_trusted_certificate /etc/letsencrypt/live/acc3.k56mm.uk/chain.pem;

    # SSL hardening
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # HSTS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

    # Existing security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=()" always;

    # ... rest of existing config
}
```

### Step 4: Auto-renewal (cron)
```bash
0 3 * * * certbot renew --quiet --deploy-hook "docker exec thai-acc-nginx-1 nginx -s reload"
```

### Step 5: Update Backend CORS
```python
frontend_url: str = "https://acc3.k56mm.uk"
```

### Step 6: Test
```bash
curl -sI https://acc3.k56mm.uk/ | grep -i "strict-transport"
# Expected: strict-transport-security: max-age=31536000

curl -sI http://acc3.k56mm.uk/ | grep -i "location"
# Expected: location: https://acc3.k56mm.uk/
```

## Docker Considerations
- nginx container needs access to `/etc/letsencrypt/` via volume mount
- Update `docker-compose.prod.yml` to mount certs

```yaml
nginx:
  volumes:
    - /etc/letsencrypt:/etc/letsencrypt:ro
    - /var/www/certbot:/var/www/certbot
```

## Boundaries
- Always: test HTTPS redirect and HSTS header after deployment
- Ask first: if Cloudflare or another CDN is in front (may need different cert approach)
- Never: commit private keys to git

## Success Criteria
- [ ] HTTP requests redirect to HTTPS
- [ ] HTTPS serves valid certificate (A+ on SSL Labs)
- [ ] HSTS header present on all responses
- [ ] Auto-renewal configured
- [ ] Backend CORS updated to HTTPS URL
