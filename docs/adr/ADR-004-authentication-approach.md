# ADR-004: Authentication Approach

## Status

Accepted

## Context

We needed an authentication solution for the Thai Accounting ERP system.
Requirements:

- Session-based authentication
- Role-based access control (RBAC)
- Secure password storage
- CSRF protection
- Easy integration with Next.js
- Support for multiple roles (ADMIN, ACCOUNTANT, USER, VIEWER)

## Decision

We chose **NextAuth.js (Auth.js)** with Credentials Provider.

## Consequences

### Positive

- **Next.js integration**: Seamless integration with Next.js
- **Session management**: Built-in session handling
- **CSRF protection**: Automatic CSRF token handling
- **Secure by default**: HTTP-only cookies, secure headers
- **Database adapters**: Supports Prisma adapter
- **Callbacks**: Flexible callbacks for customizing behavior
- **JWT support**: Can use JWT or database sessions
- **Role handling**: Easy to add custom user properties

### Negative

- **Complexity**: Can be complex to customize
- **Documentation**: App Router documentation is still evolving
- **Credentials provider**: Less secure than OAuth, but necessary for our use
  case
- **Customization limits**: Some customization requires workarounds

## Implementation

### Configuration

```typescript
// lib/auth.ts
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcrypt';
import { prisma } from './db';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // Validation logic
        const user = await prisma.user.findUnique({
          where: { email: credentials?.email },
        });

        if (!user) return null;

        const isValid = await compare(credentials!.password, user.password);

        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
};
```

### Session Strategy

- **Development**: JWT sessions
- **Production**: Database sessions with Prisma adapter

## Security Considerations

1. **Password Hashing**: bcrypt with 10 rounds
2. **Session Expiry**: 8 hours
3. **CSRF Protection**: Double-submit cookie pattern
4. **Rate Limiting**: Login attempts limited
5. **Secure Headers**: Helmet.js integration

## Alternatives Considered

### 1. Custom JWT implementation

- Pros: Full control
- Cons: Security risks, more code to maintain

### 2. Supabase Auth

- Pros: Managed service, real-time
- Cons: External dependency, vendor lock-in

### 3. Auth0 / Clerk

- Pros: Feature-rich, managed
- Cons: Cost, external dependency, overkill for our needs

### 4. Lucia Auth

- Pros: Framework-agnostic, modern
- Cons: Newer, smaller community

## Decision Drivers

1. Next.js integration
2. Security
3. Flexibility
4. Community support
5. Cost (free)

## References

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Auth.js (v5) Documentation](https://authjs.dev/)

## Date

March 16, 2026

## Author

Development Team
