#!/bin/bash
# SSL Setup Script for Thai ACC
# Run this after pointing your domain to the server IP

set -e

DOMAIN=${1:-""}
EMAIL=${2:-"admin@example.com"}

if [ -z "$DOMAIN" ]; then
    echo "Usage: ./setup-ssl.sh <domain> [email]"
    echo "Example: ./setup-ssl.sh accounting.yourcompany.com admin@yourcompany.com"
    exit 1
fi

echo "Setting up SSL for domain: $DOMAIN"

# Install certbot if not present
if ! command -v certbot &> /dev/null; then
    echo "Installing certbot..."
    apt-get update
    apt-get install -y certbot
fi

# Obtain certificate
echo "Obtaining SSL certificate from Let's Encrypt..."
certbot certonly --standalone -d "$DOMAIN" --agree-tos --email "$EMAIL" --non-interactive

# Update nginx config with actual domain
NGINX_CONF="/root/thai-acc/nginx.prod.conf"
if [ -f "$NGINX_CONF" ]; then
    sed -i "s/your-domain.com/$DOMAIN/g" "$NGINX_CONF"
    
    # Uncomment SSL lines
    sed -i 's/# listen 443/listen 443/g' "$NGINX_CONF"
    sed -i 's/# ssl_certificate/ssl_certificate/g' "$NGINX_CONF"
    sed -i 's/# ssl_certificate_key/ssl_certificate_key/g' "$NGINX_CONF"
    sed -i 's/# ssl_trusted_certificate/ssl_trusted_certificate/g' "$NGINX_CONF"
    sed -i 's/# include \/etc\/letsencrypt/include \/etc\/letsencrypt/g' "$NGINX_CONF"
    sed -i 's/# ssl_dhparam/ssl_dhparam/g' "$NGINX_CONF"
    sed -i 's/# if (\$scheme/if (\$scheme/g' "$NGINX_CONF"
    sed -i 's/#     return 301/    return 301/g' "$NGINX_CONF"
    sed -i 's/# }/}/g' "$NGINX_CONF"
    
    echo "Nginx config updated"
fi

# Add certbot renewal hook for Docker
RENEWAL_HOOK="/etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh"
mkdir -p "$(dirname "$RENEWAL_HOOK")"
cat > "$RENEWAL_HOOK" << 'EOF'
#!/bin/bash
# Reload nginx after cert renewal
cd /root/thai-acc && docker compose exec nginx nginx -s reload || true
EOF
chmod +x "$RENEWAL_HOOK"

echo "SSL setup complete!"
echo ""
echo "Next steps:"
echo "1. Update your .env file: FRONTEND_URL=https://$DOMAIN"
echo "2. Run: cd /root/thai-acc && docker compose up -d --build"
echo "3. Test HTTPS: https://$DOMAIN"
