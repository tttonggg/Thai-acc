# Spec: Security — Migrate Refresh Tokens to httpOnly Cookies

## Objective
Move refresh token storage from `localStorage` (XSS-vulnerable) to `httpOnly` cookies (XSS-proof but still CSRF-vulnerable). This is a defense-in-depth improvement.

## Current State
```javascript
// Frontend (localStorage)
localStorage.setItem("access_token", token);
localStorage.setItem("refresh_token", refreshToken);

// API call
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

## Target Architecture
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Browser   │────▶│   Backend   │────▶│   Cookie    │
│  (memory)   │     │  (API)      │     │  (httpOnly) │
│ access_token│     │             │     │ refresh_token│
└─────────────┘     └─────────────┘     └─────────────┘
```

## Implementation Plan

### Step 1: Backend — Set Cookie on Login/Register/Refresh

In `auth.py` login/refresh endpoints:
```python
from fastapi import Response

@router.post("/login")
def login(response: Response, ...):
    # ... existing logic ...
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True,  # HTTPS only
        samesite="lax",
        max_age=7 * 24 * 60 * 60,  # 7 days
    )
    return {"access_token": access_token, "token_type": "bearer", "user": user}
```

### Step 2: Backend — Read Cookie on Refresh

```python
@router.post("/refresh")
def refresh_token(request: Request, response: Response, db: Session = Depends(get_db)):
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(401, "No refresh token")
    # ... validate and issue new tokens ...
    response.set_cookie(key="refresh_token", value=new_refresh_token, httponly=True, secure=True, samesite="lax")
    return {"access_token": new_access_token, "token_type": "bearer", "user": user}
```

### Step 3: Backend — Clear Cookie on Logout

Add a logout endpoint:
```python
@router.post("/logout")
def logout(response: Response):
    response.delete_cookie("refresh_token")
    return {"message": "Logged out"}
```

### Step 4: Frontend — Remove localStorage for Refresh Token

Update `useAuth.ts`:
```typescript
const login = (token: string, userData: User) => {
    localStorage.setItem("access_token", token);  // Keep access token in localStorage (short-lived)
    localStorage.setItem("user_data", JSON.stringify(userData));
    setUser(userData);
};

const logout = () => {
    api.post("/auth/logout");  // Tell backend to clear cookie
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_data");
    setUser(null);
    window.location.href = "/login";
};
```

### Step 5: Frontend — Axios withCredentials

Update `api.ts`:
```typescript
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,  // Send cookies with requests
});
```

### Step 6: CORS Update

Backend must allow credentials:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,  # Required for cookies
    allow_methods=[...],
    allow_headers=[...],
)
```

## Tests
- Login sets httpOnly cookie
- Refresh reads cookie and returns new access token
- Logout clears cookie
- Access token still works from localStorage
- Cookie is not accessible via JavaScript (`document.cookie` returns empty for refresh_token)

## Security Notes
- Access token (30 min) stays in memory/localStorage — acceptable risk for short lifetime
- Refresh token (7 days) in httpOnly cookie — protected from XSS
- CSRF risk on refresh endpoint is low because refresh token is cryptographically random
- `SameSite=Lax` prevents cross-origin POSTs from carrying the cookie

## Success Criteria
- [ ] Refresh token stored in httpOnly cookie after login
- [ ] Frontend can still refresh access token automatically
- [ ] Logout clears cookie on backend
- [ ] Cookie not visible to JavaScript
- [ ] All auth tests pass
