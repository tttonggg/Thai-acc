<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-17 -->

# src/types

## Purpose
TypeScript type declarations for external JavaScript libraries that lack built-in types.

## Key Files
| File | Description |
|------|-------------|
| `crypto-js.d.ts` | AES/SHA256/HMAC type declarations for encryption library |
| `speakeasy.d.ts` | TOTP 2FA type declarations for authenticator integration |
| `zxcvbn.d.ts` | Password strength analyzer types |

## For AI Agents

### Working In This Directory
- These are ambient type declarations (*.d.ts files)
- They extend the global namespace for their respective libraries
- No implementation, only type definitions

### Usage Pattern

**crypto-js** (used in encryption.ts for MFA secrets, session tokens):
```typescript
import CryptoJS from 'crypto-js'
const encrypted = CryptoJS.AES.encrypt(data, secret)
```

**speakeasy** (used in MFA service):
```typescript
import speakeasy from 'speakeasy'
const token = speakeasy.totp({ secret: base32Secret })
```

**zxcvbn** (used in password validation):
```typescript
import zxcvbn from 'zxcvbn'
const result = zxcvbn(password)
console.log(result.score) // 0-4
```

## Dependencies

### External
- crypto-js - AES/SHA256/HMAC encryption
- speakeasy - TOTP/HOTP authenticator
- zxcvbn - Password strength estimation