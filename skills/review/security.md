# Skill: Security Hardening

## Description
Review and harden code against security vulnerabilities. Focus on OWASP Top 10, authentication, authorization, and data protection for Thai accounting systems.

## Trigger
Use when:
- Implementing authentication/authorization
- Handling sensitive financial data
- Before production deployment
- After security incidents
- Annual security audits

## Assigned Model
`opencode-go/glm-5.1` (reasoning about security patterns)

## Detailed Instruction / SOP

### Step 1: Authentication Review
```python
# BAD: No rate limiting
@router.post("/login")
def login(email: str, password: str):
    ...

# GOOD: Rate limited + brute force protection
@router.post("/login")
@rate_limit(max_requests=5, window=300)  # 5 attempts per 5 minutes
def login(email: str, password: str):
    user = get_user_by_email(email)
    if not user or not verify_password(password, user.password_hash):
        log_failed_login(email)
        raise HTTPException(401, "Invalid credentials")
    ...
```

### Step 2: Authorization (RBAC)
```python
# Check permissions
def require_permission(permission: str):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, current_user: User = Depends(get_current_user), **kwargs):
            if permission not in current_user.permissions:
                raise HTTPException(403, "Insufficient permissions")
            return await func(*args, current_user=current_user, **kwargs)
        return wrapper
    return decorator

@router.post("/api/quotations")
@require_permission("quotation.create")
async def create_quotation(...):
    ...
```

### Step 3: Input Validation
```python
# BAD: Raw input directly in query
query = f"SELECT * FROM invoices WHERE id = '{invoice_id}'"

# GOOD: Parameterized query
db.query(Invoice).filter(Invoice.id == invoice_id).first()
```

### Step 4: Data Protection
- [ ] Passwords: bcrypt with salt rounds >= 12
- [ ] API Keys: hashed in database
- [ ] Financial data: encrypted at rest
- [ ] Transit: HTTPS only
- [ ] PII: Masked in logs (tax IDs, addresses)

### Step 5: PIN Code Security (PEAK-style)
```python
class PINSecurity:
    def set_pin(self, user_id: str, pin: str):
        # Validate PIN format (4-6 digits)
        if not re.match(r"^\d{4,6}$", pin):
            raise ValueError("PIN must be 4-6 digits")
        
        # Hash PIN (separate from password)
        pin_hash = bcrypt.hash(pin)
        db.update_user(user_id, pin_hash=pin_hash)
    
    def verify_pin(self, user_id: str, pin: str) -> bool:
        user = db.get_user(user_id)
        return bcrypt.verify(pin, user.pin_hash)
```

### Step 6: Audit Logging
```python
def audit_log(action: str, entity_type: str, entity_id: str, 
              user_id: str, changes: dict):
    db.add(AuditLog(
        action=action,  # CREATE, UPDATE, DELETE
        entity_type=entity_type,
        entity_id=entity_id,
        user_id=user_id,
        changes=changes,
        ip_address=request.client.host,
        timestamp=datetime.utcnow()
    ))
```

### Step 7: OWASP Top 10 Check
- [ ] A01: Broken Access Control
- [ ] A02: Cryptographic Failures
- [ ] A03: Injection (SQL, NoSQL, Command)
- [ ] A04: Insecure Design
- [ ] A05: Security Misconfiguration
- [ ] A06: Vulnerable Components
- [ ] A07: Auth Failures
- [ ] A08: Data Integrity Failures
- [ ] A09: Logging Failures
- [ ] A10: SSRF

## Output Format
Security report: `/docs/security/{feature}-security-review.md`
