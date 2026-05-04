# Spec: Security — Restrict /docs and /openapi.json in Production

## Objective
Hide Swagger UI (`/docs`) and OpenAPI schema (`/openapi.json`) in production to reduce attack surface.

## Current State
- `/docs` → Full Swagger UI with all endpoints, schemas, auth requirements visible
- `/openapi.json` → Complete API schema in JSON
- Both publicly accessible without authentication
- Attacker can map entire API surface from these endpoints

## Implementation Options

### Option A: Basic Auth via nginx (Recommended)
Add to `nginx.prod.conf`:
```nginx
location ~ ^/(docs|openapi\.json)$ {
    auth_basic "API Docs";
    auth_basic_user_file /etc/nginx/.htpasswd;
    proxy_pass http://backend;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

Create password file on VPS:
```bash
htpasswd -cb /etc/nginx/.htpasswd admin <secure-password>
```

Mount in docker-compose:
```yaml
nginx:
  volumes:
    - /etc/nginx/.htpasswd:/etc/nginx/.htpasswd:ro
```

### Option B: Disable Completely (Simpler)
In `main.py` or env-based:
```python
if settings.env == "production":
    app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)
else:
    app = FastAPI()
```

### Option C: IP Restriction
```nginx
location ~ ^/(docs|openapi\.json)$ {
    allow 127.0.0.1;
    allow <office-ip>;
    deny all;
    proxy_pass http://backend;
}
```

## Recommendation
Use **Option A** (Basic Auth) because:
- Docs are useful for debugging in production
- Basic auth is simple and doesn't require code changes
- Can be disabled by removing the location block

## Testing
```bash
# Without auth — should get 401
curl -s http://135.181.107.76:3001/docs
# Expected: 401 Unauthorized

# With auth — should get 200
curl -s -u admin:password http://135.181.107.76:3001/docs | head -5
# Expected: HTML with Swagger UI
```

## Success Criteria
- [ ] `/docs` requires authentication
- [ ] `/openapi.json` requires authentication
- [ ] All other endpoints unaffected
- [ ] Health check still works without auth
