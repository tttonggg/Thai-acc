# Security Audit: Login & Landing Page

**Date:** 2026-05-03
**Scope:** Frontend login/landing pages, auth API, nginx config, token handling

---

## 🚨 CRITICAL (Fix Immediately)

### 1. No HTTPS Enforcement
**Risk:** Man-in-the-middle attacks, credential interception, session hijacking

- `nginx.prod.conf` has SSL commented out entirely
- `frontend_url` defaults to `http://localhost:3000`
- HSTS header (`Strict-Transport-Security`) is missing
- Custom domain `https://acc3.k56mm.uk/` works but HTTP fallback is still open

**Fix:**
```nginx
# In nginx.prod.conf
server {
    listen 80;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    ssl_certificate /etc/letsencrypt/live/acc3.k56mm.uk/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/acc3.k56mm.uk/privkey.pem;
    
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
}
```

### 2. JWT Tokens in localStorage (XSS Risk)
**Risk:** If any XSS vulnerability exists, attacker steals tokens permanently

- `access_token` and `refresh_token` stored in `localStorage`
- No `httpOnly` cookie alternative
- `user_data` also stored in `localStorage` as JSON

**Impact:** Medium (Next.js React rendering mitigates most XSS, but third-party scripts or DOM-based XSS could still exploit)

**Fix:** Migrate to `httpOnly` cookies for refresh tokens. Keep access token in memory only (short-lived).

### 3. No Content-Security-Policy (CSP)
**Risk:** XSS, clickjacking, data injection

- No `Content-Security-Policy` header in nginx
- No `script-src`, `style-src`, or `connect-src` restrictions
- Inline styles and scripts in Next.js output are unprotected

**Fix:**
```nginx
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://acc3.k56mm.uk; img-src 'self' data:; font-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self';" always;
```

---

## 🔴 HIGH (Fix Soon)

### 4. OpenAPI Docs Exposed Without Auth
**Risk:** API enumeration, attack surface mapping

- `/docs` (Swagger UI) and `/openapi.json` are publicly accessible
- Attacker can discover all endpoints, schemas, and required fields

**Fix:** Add auth guard or IP restriction:
```nginx
location /docs {
    allow 127.0.0.1;
    deny all;
    # OR proxy to backend with basic auth
}
```

### 5. Fake Schema Markup (SEO Penalty Risk)
**Risk:** Google penalization for misleading structured data

Landing page schema includes:
```json
"aggregateRating": {
  "ratingValue": "4.8",
  "ratingCount": "1240"
}
```
These are fabricated numbers. Google explicitly penalizes fake review/rating markup.

**Fix:** Remove `aggregateRating` until real user reviews exist.

### 6. Version Information Leakage
**Risk:** Information disclosure aids targeted attacks

- Login page footer: `Thai ACC v0.1.0` (stale, doesn't match `v0.3.0-alpha`)
- Health endpoint exposes `version: "0.3.0-alpha"`
- OpenAPI docs expose full API schema

**Fix:** Remove version from login page. Consider hiding version from health endpoint in production.

### 7. No Account Lockout / Failed Login Tracking
**Risk:** Brute-force password attacks

- Backend has rate limiting (`10/minute`) but:
  - No per-account lockout after repeated failures
  - No progressive delay
  - No notification to user of failed attempts
  - Error message is generic ("Invalid credentials") — good practice actually

**Fix:** Consider adding account-level rate limiting and email notifications for suspicious login attempts.

### 8. Deprecated X-XSS-Protection Header
**Risk:** False sense of security, potential bypass

```nginx
add_header X-XSS-Protection "1; mode=block" always;
```
This header is deprecated by all modern browsers and can introduce vulnerabilities. CSP is the correct replacement.

**Fix:** Replace with CSP (see #3). Remove `X-XSS-Protection`.

### 9. No Permissions-Policy Header
**Risk:** Unintended browser feature access

- No restriction on camera, microphone, geolocation, etc.
- Landing page doesn't need any of these

**Fix:**
```nginx
add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=()" always;
```

### 10. CORS `frontend_url` HTTP Default
**Risk:** CORS misconfiguration if env var not set

```python
frontend_url: str = "http://localhost:3000"
```
If `FRONTEND_URL` env var is not set in production, CORS allows `http://localhost:3000`.

**Fix:** Make `frontend_url` required (no default) or default to HTTPS production URL.

---

## 🟡 MEDIUM (Nice to Have)

### 11. No autocomplete="current-password" on Login
**Risk:** Minor — password managers may not recognize field properly

**Fix:** Add `autoComplete="current-password"` to password field.

### 12. No autocomplete="username" on Email Field
**Risk:** Minor — same as above

**Fix:** Add `autoComplete="username"` to email field.

### 13. Refresh Token Not Stored Server-Side
**Risk:** Cannot revoke compromised refresh tokens individually

- Refresh tokens are JWTs validated cryptographically
- No database table tracking issued refresh tokens
- If a refresh token is stolen, it works until expiry (7 days)
- `logout()` only clears localStorage — server doesn't know

**Fix:** Add `refresh_token` table to track and revoke tokens.

### 14. Login Page Doesn't Redirect Authenticated Users
**Risk:** Minor UX/security — authenticated users can access login page

- If user already has token and visits `/login`, they see login form
- Could be used in phishing scenarios

**Fix:** Check for token on mount and redirect to `/dashboard`.

---

## ✅ GOOD PRACTICES (Keep These)

| Practice | Status |
|----------|--------|
| Passwords hashed with bcrypt | ✅ |
| JWT uses `exp` claim | ✅ |
| Access token short-lived (30 min) | ✅ |
| Refresh token has `type: "refresh"` claim | ✅ |
| Generic error messages on auth failure | ✅ |
| Rate limiting on login/register endpoints | ✅ |
| `X-Frame-Options: SAMEORIGIN` | ✅ |
| `X-Content-Type-Options: nosniff` | ✅ |
| `Referrer-Policy` header | ✅ |
| `type="email"` on email input | ✅ |
| `type="password"` on password input | ✅ |
| Input validation (Pydantic `EmailStr`, `min_length`) | ✅ |
| No password in response bodies | ✅ |
| Password show/hide toggle | ✅ |
| Loading state on submit button | ✅ |

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 3 |
| High | 7 |
| Medium | 4 |
| Good | 14 |

**Top priorities:**
1. Enable HTTPS + HSTS
2. Add Content-Security-Policy
3. Remove fake aggregateRating from schema
4. Hide /docs and /openapi.json in production
5. Consider httpOnly cookies for refresh tokens
