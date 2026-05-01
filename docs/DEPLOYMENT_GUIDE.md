# Quick Deploy to VPS - Bug Fixes

**Date**: 2026-04-16 **Status**: ✅ All fixes committed

---

## Fixes Deployed

1. ✅ **CSRF Token** - Returns 401 instead of 500
2. ✅ **Currency Display** - Fixed 3-decimal bug (฿56.205 → ฿56)
3. ✅ **getClientIp Bug** - Fixed parameter type in 10 routes

---

## Deploy Command

Replace `YOUR_VPS_IP` with your actual VPS address:

```bash
VPS_HOST="root@YOUR_VPS_IP"

# Upload build files
rsync -avz --delete --exclude='cache' --exclude='trace' .next/ $VPS_HOST:/root/thai-acc/.next/
rsync -avz --delete public/ $VPS_HOST:/root/thai-acc/public/
scp package.json next.config.ts $VPS_HOST:/root/thai-acc/

# Upload fixed source files
scp src/app/api/csrf/token/route.ts $VPS_HOST:/root/thai-acc/src/app/api/csrf/token/
scp src/components/invoices/invoice-list.tsx $VPS_HOST:/root/thai-acc/src/components/invoices/
scp src/app/api/invoices/route.ts $VPS_HOST:/root/thai-acc/src/app/api/invoices/

# Restart server (NOT the tunnel!)
ssh $VPS_HOST "cd /root/thai-acc && pkill -f 'node.*next' && sleep 2 && nohup npx next start -p 3000 > /root/thai-acc/server.log 2>&1 &"

echo "✅ Deployed! Test at: https://acc.k56mm.uk"
```

---

## Test After Deployment

1. **CSRF**: `curl -s https://acc.k56mm.uk/api/csrf/token | jq .`
2. **App**: https://acc.k56mm.uk
3. **Invoice**: Try creating new invoice - should work!

---

⚠️ **DO NOT restart tunnel** - only restart the Next.js server
