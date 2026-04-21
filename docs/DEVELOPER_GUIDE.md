# Thai Accounting ERP - Developer Guide

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Project Structure](#project-structure)
3. [Technology Stack](#technology-stack)
4. [Development Environment Setup](#development-environment-setup)
5. [Coding Conventions](#coding-conventions)
6. [Database Schema](#database-schema)
7. [API Development Guide](#api-development-guide)
8. [Component Development](#component-development)
9. [Testing Guide](#testing-guide)
10. [Deployment Guide](#deployment-guide)

---

## Architecture Overview

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Web App     │  │  Mobile Web  │  │  API Clients │      │
│  │  (Next.js)   │  │  (PWA)       │  │  (REST)      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Gateway Layer                       │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  Next.js App Router (API Routes)                        ││
│  │  - Authentication Middleware                            ││
│  │  - Rate Limiting                                        ││
│  │  - Request Validation                                   ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Service Layer                            │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │  Accounting  │ │  Inventory   │ │  Payroll     │        │
│  │  Service     │ │  Service     │ │  Service     │        │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │  Report      │ │  Tax         │ │  PDF         │        │
│  │  Service     │ │  Service     │ │  Generator   │        │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Data Access Layer                       │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  Prisma ORM                                             ││
│  │  - Database Models                                      ││
│  │  - Migrations                                           ││
│  │  - Seeds                                                ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Data Storage                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  SQLite      │  │  File        │  │  Cache       │      │
│  │  (Primary)   │  │  Storage     │  │  (Redis)     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Key Architectural Principles

1. **Layered Architecture**: Clear separation between presentation, business logic, and data layers
2. **Domain-Driven Design**: Services organized by business domain
3. **API-First**: RESTful API design for all operations
4. **Type Safety**: Full TypeScript coverage
5. **Test-Driven**: Comprehensive test coverage

---

## Project Structure

```
thai-accounting-erp/
├── prisma/                      # Database schema and migrations
│   ├── schema.prisma           # Prisma schema definition
│   ├── seed.ts                 # Database seeding
│   └── migrations/             # Database migrations
│
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Auth route group
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── api/               # API routes
│   │   │   ├── accounts/
│   │   │   ├── invoices/
│   │   │   ├── journal/
│   │   │   └── ...
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Home page
│   │   └── globals.css        # Global styles
│   │
│   ├── components/             # React components
│   │   ├── ui/                # shadcn/ui components
│   │   ├── layout/            # Layout components
│   │   ├── forms/             # Form components
│   │   ├── tables/            # Table components
│   │   ├── dialogs/           # Dialog components
│   │   └── help-center/       # Help center component
│   │
│   ├── lib/                    # Utilities and services
│   │   ├── db.ts              # Prisma client
│   │   ├── auth.ts            # Authentication config
│   │   ├── validations.ts     # Zod schemas
│   │   ├── api-utils.ts       # API utilities
│   │   ├── inventory-service.ts
│   │   ├── payroll-service.ts
│   │   ├── pdf-generator.ts
│   │   └── ...
│   │
│   ├── hooks/                  # Custom React hooks
│   ├── stores/                 # Zustand stores
│   ├── types/                  # TypeScript types
│   └── test/                   # Test utilities
│
├── docs/                       # Documentation
│   ├── tutorials/             # Video tutorial scripts
│   ├── postman-collection.json
│   └── ...
│
├── e2e/                        # Playwright E2E tests
├── tests/                      # Additional tests
├── public/                     # Static assets
└── scripts/                    # Build and utility scripts
```

---

## Technology Stack

| Category | Technology | Version | Purpose |
|----------|------------|---------|---------|
| Framework | Next.js | 16.1.1 | React framework |
| Language | TypeScript | 5.x | Type safety |
| Styling | Tailwind CSS | 4.x | Utility-first CSS |
| UI Components | shadcn/ui | latest | Component library |
| Database | Prisma + SQLite | 6.11.1 | ORM and database |
| Auth | NextAuth.js | 4.24.11 | Authentication |
| Forms | React Hook Form + Zod | 7.x / 4.x | Form handling |
| State | Zustand | 5.x | State management |
| Data Fetching | TanStack Query | 5.x | Server state |
| Testing | Vitest + Playwright | latest | Testing |
| Icons | Lucide React | 0.525.0 | Icon library |

---

## Development Environment Setup

### Prerequisites

- Node.js 18+ or Bun 1.0+
- Git
- VS Code (recommended)

### Installation

```bash
# Clone repository
git clone https://github.com/thaiaccounting/erp.git
cd erp

# Install dependencies
bun install

# Setup environment
cp .env.example .env

# Generate Prisma client
bun run db:generate

# Run database migrations
bun run db:migrate

# Seed database
bun run db:seed

# Start development server
bun run dev
```

### Environment Variables

```env
# Database
DATABASE_URL=file:./prisma/dev.db

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-min-32-characters-long

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# API Keys (optional)
API_KEY_SECRET=your-api-key
```

### VS Code Extensions (Recommended)

- ESLint
- Prettier
- Tailwind CSS IntelliSense
- Prisma
- Thunder Client (API testing)

---

## Coding Conventions

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `InvoiceList.tsx` |
| Files (utils) | camelCase | `formatCurrency.ts` |
| Files (services) | kebab-case | `inventory-service.ts` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| Functions | camelCase | `calculateTotal` |
| Types/Interfaces | PascalCase | `InvoiceData` |
| Enums | PascalCase | `InvoiceStatus` |
| Database Models | PascalCase | `Invoice` |

### File Organization

```typescript
// 1. Imports (external → internal)
import React from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { useInvoice } from '@/hooks/useInvoice';

// 2. Types
interface InvoiceProps {
  invoice: Invoice;
}

// 3. Constants
const TAX_RATE = 0.07;

// 4. Component
export function InvoiceCard({ invoice }: InvoiceProps) {
  // Component implementation
}

// 5. Exports
export default InvoiceCard;
```

### Component Structure

```typescript
'use client'; // If client component

import { useState } from 'react';
import { z } from 'zod';

// Types
interface Props {
  // ...
}

// Validation schema
const schema = z.object({
  // ...
});

// Component
export function ComponentName({ prop1, prop2 }: Props) {
  // Hooks
  const [state, setState] = useState();
  
  // Handlers
  const handleClick = () => {
    // ...
  };
  
  // Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
}
```

### API Route Structure

```typescript
// app/api/resource/route.ts
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { apiResponse } from '@/lib/api-utils';

const schema = z.object({
  // Validation schema
});

// GET /api/resource
export async function GET(req: Request) {
  try {
    // 1. Authentication
    const session = await auth();
    if (!session) {
      return apiResponse.unauthorized();
    }
    
    // 2. Authorization
    if (!canAccess(session.user.role, 'resource', 'read')) {
      return apiResponse.forbidden();
    }
    
    // 3. Parse query params
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    
    // 4. Fetch data
    const data = await prisma.resource.findMany({
      take: 20,
      skip: (page - 1) * 20,
    });
    
    // 5. Return response
    return apiResponse.success(data);
  } catch (error) {
    return apiResponse.error(error);
  }
}

// POST /api/resource
export async function POST(req: Request) {
  try {
    // 1. Authentication
    const session = await auth();
    if (!session) {
      return apiResponse.unauthorized();
    }
    
    // 2. Validate request body
    const body = await req.json();
    const validated = schema.parse(body);
    
    // 3. Create record
    const created = await prisma.resource.create({
      data: validated,
    });
    
    // 4. Return response
    return apiResponse.created(created);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiResponse.validationError(error);
    }
    return apiResponse.error(error);
  }
}
```

---

## Database Schema

### Core Models

```prisma
// User and Authentication
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String
  password      String    // hashed
  role          UserRole  @default(USER)
  isActive      Boolean   @default(true)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  invoices      Invoice[]
  journalEntries JournalEntry[]
}

// Chart of Accounts
model Account {
  id            String      @id @default(cuid())
  code          String      @unique
  name          String
  nameEn        String?
  type          AccountType
  parentId      String?
  isDetail      Boolean     @default(true)
  isActive      Boolean     @default(true)
  
  parent        Account?    @relation("AccountHierarchy", fields: [parentId], references: [id])
  children      Account[]   @relation("AccountHierarchy")
  journalLines  JournalLine[]
}

// Invoices
model Invoice {
  id            String        @id @default(cuid())
  number        String        @unique
  customerId    String
  date          DateTime
  dueDate       DateTime
  status        InvoiceStatus @default(DRAFT)
  subtotal      Decimal       @db.Decimal(15, 2)
  vatAmount     Decimal       @db.Decimal(15, 2)
  total         Decimal       @db.Decimal(15, 2)
  
  customer      Customer      @relation(fields: [customerId], references: [id])
  lines         InvoiceLine[]
  createdBy     User          @relation(fields: [createdById], references: [id])
  createdById   String
}

// Journal Entries
model JournalEntry {
  id            String        @id @default(cuid())
  number        String        @unique
  date          DateTime
  description   String
  status        JournalStatus @default(DRAFT)
  
  lines         JournalLine[]
  createdBy     User          @relation(fields: [createdById], references: [id])
  createdById   String
}

model JournalLine {
  id              String       @id @default(cuid())
  journalEntryId  String
  accountId       String
  description     String?
  debit           Decimal      @db.Decimal(15, 2) @default(0)
  credit          Decimal      @db.Decimal(15, 2) @default(0)
  
  journalEntry    JournalEntry @relation(fields: [journalEntryId], references: [id], onDelete: Cascade)
  account         Account      @relation(fields: [accountId], references: [id])
}
```

### Schema Changes

```bash
# After modifying schema.prisma
bun run db:generate

# Create migration
bun run db:migrate

# Reset database (development only)
bun run db:reset
```

---

## API Development Guide

### REST API Conventions

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/resource | List resources |
| GET | /api/resource/:id | Get single resource |
| POST | /api/resource | Create resource |
| PUT | /api/resource/:id | Update resource |
| DELETE | /api/resource/:id | Delete resource |
| POST | /api/resource/:id/action | Custom action |

### Response Format

```typescript
// Success response
{
  success: true,
  data: { ... },
  meta: {
    timestamp: "2026-03-16T10:00:00Z",
    requestId: "req_123"
  }
}

// Error response
{
  success: false,
  error: {
    code: "VALIDATION_ERROR",
    message: "Invalid input",
    details: [...]
  },
  meta: { ... }
}

// Paginated response
{
  success: true,
  data: [...],
  pagination: {
    page: 1,
    limit: 20,
    total: 100,
    totalPages: 5
  }
}
```

### Error Handling

```typescript
// lib/api-utils.ts
export const apiResponse = {
  success: (data: any, status = 200) => 
    Response.json({ success: true, data }, { status }),
  
  created: (data: any) =>
    Response.json({ success: true, data }, { status: 201 }),
  
  noContent: () =>
    new Response(null, { status: 204 }),
  
  badRequest: (message: string) =>
    Response.json({ success: false, error: message }, { status: 400 }),
  
  unauthorized: () =>
    Response.json({ success: false, error: 'Unauthorized' }, { status: 401 }),
  
  forbidden: () =>
    Response.json({ success: false, error: 'Forbidden' }, { status: 403 }),
  
  notFound: () =>
    Response.json({ success: false, error: 'Not found' }, { status: 404 }),
  
  validationError: (errors: z.ZodError) =>
    Response.json({ 
      success: false, 
      error: 'Validation error',
      details: errors.errors 
    }, { status: 422 }),
  
  error: (error: any) =>
    Response.json({ 
      success: false, 
      error: error.message || 'Internal server error' 
    }, { status: 500 }),
};
```

---

## Component Development

### shadcn/ui Components

```bash
# Add new component
npx shadcn add button

# Add with dependencies
npx shadcn add dialog

# Update component
npx shadcn add button --overwrite
```

### Custom Component Pattern

```typescript
// components/custom/DataTable.tsx
'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  onRowClick?: (row: T) => void;
}

export function DataTable<T>({ data, columns, onRowClick }: DataTableProps<T>) {
  // Implementation
}
```

---

## Testing Guide

### Unit Tests (Vitest)

```typescript
// lib/__tests__/formatCurrency.test.ts
import { describe, it, expect } from 'vitest';
import { formatCurrency } from '@/lib/formatCurrency';

describe('formatCurrency', () => {
  it('formats THB correctly', () => {
    expect(formatCurrency(1000)).toBe('฿1,000.00');
  });
  
  it('handles decimal values', () => {
    expect(formatCurrency(1000.50)).toBe('฿1,000.50');
  });
});
```

### Component Tests

```typescript
// components/__tests__/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/button';

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
  
  it('handles click events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    fireEvent.click(screen.getByText('Click'));
    expect(handleClick).toHaveBeenCalled();
  });
});
```

### E2E Tests (Playwright)

```typescript
// e2e/invoice.spec.ts
import { test, expect } from '@playwright/test';

test('create invoice', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[name="email"]', 'admin@thaiaccounting.com');
  await page.fill('[name="password"]', 'admin123');
  await page.click('button[type="submit"]');
  
  await page.goto('/invoices');
  await page.click('text=Create New Invoice');
  await page.fill('[name="customer"]', 'Customer A');
  await page.click('text=Save');
  
  await expect(page.locator('text=Invoice created')).toBeVisible();
});
```

### Running Tests

```bash
# Unit tests
bun run test

# Unit tests with coverage
bun run test:coverage

# E2E tests
bun run test:e2e

# E2E with UI
bun run test:e2e:ui
```

---

## Deployment Guide

### Build

```bash
# Production build
bun run build

# Output: .next/standalone/
```

### Deployment Checklist

- [ ] Set production environment variables
- [ ] Run database migrations
- [ ] Verify database connection
- [ ] Configure SSL/TLS
- [ ] Set up monitoring
- [ ] Configure backups

### Docker Deployment

```dockerfile
# Dockerfile
FROM oven/bun:1

WORKDIR /app

COPY package.json bun.lockb ./
RUN bun install --production

COPY . .
RUN bun run build

EXPOSE 3000

CMD ["bun", "run", "start"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=file:/data/dev.db
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
    volumes:
      - ./data:/data
```

---

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)

---

**Last Updated:** March 16, 2026  
**Version:** 1.0.0
