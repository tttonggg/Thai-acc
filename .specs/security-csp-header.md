# Spec: Security — Add Content-Security-Policy (CSP) Header

## Objective
Add a Content-Security-Policy header to prevent XSS, data injection, and unauthorized resource loading.

## Current State
- No CSP header in nginx
- Next.js app uses inline scripts/styles for hydration
- API calls to same origin `/api/v1/`
- No external scripts/fonts/CDNs currently used

## CSP Directive Design

```nginx
add_header Content-Security-Policy "
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data:;
  font-src 'self';
  connect-src 'self' https://acc3.k56mm.uk;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
" always;
```

### Rationale per directive

| Directive | Value | Why |
|-----------|-------|-----|
| `default-src 'self'` | Fallback for unspecified directives | Base restriction |
| `script-src 'self' 'unsafe-inline' 'unsafe-eval'` | Next.js needs inline scripts for hydration and `eval` for some optimizations | Required for Next.js to work |
| `style-src 'self' 'unsafe-inline'` | Tailwind + Next.js use inline styles | Required |
| `img-src 'self' data:` | SVG favicon, inline images | data: needed for favicon |
| `font-src 'self'` | Self-hosted fonts | No external fonts |
| `connect-src 'self' https://acc3.k56mm.uk` | API calls | Frontend calls same origin |
| `frame-ancestors 'none'` | Prevent clickjacking | Equivalent to X-Frame-Options DENY |
| `base-uri 'self'` | Prevent base tag injection | Restrict `<base>` element |
| `form-action 'self'` | Prevent form submission hijacking | Forms only submit to same origin |

## Implementation

### Option A: nginx (Recommended)
Add to `nginx.prod.conf` in the `server` block:
```nginx
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' https://acc3.k56mm.uk; frame-ancestors 'none'; base-uri 'self'; form-action 'self';" always;
```

### Option B: Next.js (Report-Only first)
For testing before enforcing:
```typescript
// In layout.tsx or next.config.js
headers: async () => [{
  source: '/:path*',
  headers: [{
    key: 'Content-Security-Policy-Report-Only',
    value: '...'
  }]
}]
```

## Testing
```bash
curl -sI https://acc3.k56mm.uk/ | grep -i content-security
# Should show the CSP header

# Check in browser DevTools → Network → Response Headers
# Verify no CSP violations in Console
```

## Future Hardening
Once `unsafe-inline` is removed from script-src:
- Add `nonce` support via Next.js (`next/script` with strategy)
- Move to strict CSP: `script-src 'self'` only
- This requires Next.js build changes and is out of scope for now

## Success Criteria
- [ ] CSP header present on all responses
- [ ] No CSP violations in browser console
- [ ] App functionality unchanged (login, API calls, routing)
- [ ] Report-Only mode tested first if possible
