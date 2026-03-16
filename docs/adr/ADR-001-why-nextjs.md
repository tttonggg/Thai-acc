# ADR-001: Why Next.js

## Status
Accepted

## Context
We needed to choose a frontend framework for the Thai Accounting ERP system. The system is a complex web application with:
- Server-rendered pages for SEO and performance
- API routes for backend functionality
- Real-time updates for financial data
- Complex forms and data tables
- Authentication and authorization
- File generation (PDF, Excel)

## Decision
We chose **Next.js 16** with the App Router as our primary framework.

## Consequences

### Positive
- **Full-stack capability**: Single framework for frontend and API routes
- **Server Components**: Reduced JavaScript bundle size
- **App Router**: Better routing, layouts, and nested layouts
- **Built-in optimizations**: Image optimization, font optimization
- **TypeScript first**: Excellent TypeScript support
- **Vercel integration**: Easy deployment to Vercel
- **API Routes**: Built-in API routes eliminate need for separate backend
- **Server Actions**: Form handling without API routes

### Negative
- **Learning curve**: App Router paradigm is different from Pages Router
- **Vendor lock-in**: Tied to Vercel's ecosystem
- **Complexity**: Can be overkill for simple applications
- **Server/Client boundaries**: Need to understand when to use Server vs Client components

## Alternatives Considered

### 1. React + Express
- Pros: More flexibility, mature ecosystem
- Cons: Need to maintain separate frontend and backend, more complex setup

### 2. Remix
- Pros: Great for forms, excellent developer experience
- Cons: Smaller ecosystem, newer framework

### 3. Nuxt.js (Vue)
- Pros: Vue's simplicity
- Cons: Team expertise in React, smaller ecosystem for accounting software

### 4. SvelteKit
- Pros: Performance, simplicity
- Cons: Smaller ecosystem, different paradigm

## Decision Drivers
1. Team expertise in React
2. Need for server-side rendering
3. Built-in API routes
4. TypeScript support
5. Ecosystem and community support

## References
- [Next.js Documentation](https://nextjs.org/docs)
- [Next.js App Router](https://nextjs.org/docs/app)

## Date
March 16, 2026

## Author
Development Team
