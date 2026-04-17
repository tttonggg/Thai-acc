# AGENTS.md - src/app/ Directory

**Parent Reference**: [../AGENTS.md](../AGENTS.md)

## Purpose

Next.js 16 App Router directory containing the core application routing structure with hybrid SPA architecture for the Thai Accounting ERP System.

## CRITICAL ARCHITECTURE NOTES

### Hybrid SPA Pattern (NOT Standard Next.js Routing)

This application uses a **hybrid SPA (Single Page Application) pattern** instead of standard Next.js file-based routing:

- **Single Entry Point**: All pages render from [`src/app/page.tsx`](page.tsx) using `activeModule` state
- **URL Sync**: URL state maintained via `window.history.pushState()` and `popstate` listener
- **Client-Side Navigation**: No Next.js routing - all navigation handled through React state
- **Browser History**: Back/forward buttons work via `popstate` event handling

### SPA Routing Implementation

**Location**: [`src/app/page.tsx:100-191`](page.tsx)

```typescript
// URL → Module mapping (client-side only)
const moduleToPath: Record<Module, string> = {
  'dashboard': '/',
  'accounts': '/accounts',
  'journal': '/journal',
  // ... 30+ modules
}

// Module → URL mapping (client-side only)  
const pathToModule: Record<string, Module> = {
  '/': 'dashboard',
  '/accounts': 'accounts',
  '/journal': 'journal',
  // ... 30+ modules
}
```

### Adding New Modules (6-Step Process)

When adding a new module to the application, you MUST follow all 6 steps:

1. **Add to Module Type Union** ([`src/app/page.tsx:82-119`](page.tsx)):
   ```typescript
   export type Module = 
     | 'dashboard'
     | 'accounts'
     // ... existing modules
     | 'new-module'  // ← ADD NEW MODULE HERE
   ```

2. **Add to URL Mapping Maps** ([`src/app/page.tsx:131-167`](page.tsx)):
   ```typescript
   const moduleToPath: Record<Module, string> = {
     // ... existing mappings
     'new-module': '/new-module'  // ← ADD TO BOTH MAPS
   }
   
   const pathToModule: Record<string, Module> = {
     // ... existing mappings  
     '/new-module': 'new-module'  // ← ADD TO BOTH MAPS
   }
   ```

3. **Add Navigation Button** ([`src/components/layout/keerati-sidebar.tsx`](../components/layout/keerati-sidebar.tsx)):
   ```typescript
   // Add to sidebar menu items array
   { id: 'new-module' as Module, label: 'New Module', icon: SomeIcon }
   ```

4. **Create Component** ([`src/components/new-module/new-module-component.tsx`](../components/new-module/new-module-component.tsx)):
   ```typescript
   import { NewModuleComponent } from '@/components/new-module/new-module-component'
   
   // In renderModule() switch case:
   case 'new-module':
     return <NewModuleComponent />
   ```

5. **Add to renderModule Switch** ([`src/app/page.tsx:264-416`](page.tsx)):
   ```typescript
   case 'new-module':
     return <NewModuleComponent />
   ```

6. **Create API Routes** ([`src/app/api/new-resource/route.ts`](api/new-resource/route.ts)):
   - Create directory structure: `src/app/api/new-resource/`
   - Add route files: `route.ts`, `[id]/route.ts`, etc.

## Key Files

### Core Application Files

- **[`src/app/layout.tsx`](layout.tsx)**: Root layout with providers, fonts, and metadata
- **[`src/app/page.tsx`](page.tsx)**: Main application entry point (SPA architecture)
- **[`src/app/globals.css`](globals.css)**: Global CSS styles and Tailwind classes

### API Routes
- **[`src/app/api/auth/[...nextauth]/route.ts`](api/auth/[...nextauth]/route.ts)**: NextAuth.js authentication configuration
- **[`src/app/api/csrf/route.ts`](api/csrf/route.ts)**: CSRF token generation endpoint
- **[`src/app/api/graphql/route.ts`](api/graphql/route.ts)**: GraphQL API endpoint

## Subdirectories

### API Route Groups (173+ Endpoints)

#### Core Accounting
- **`api/accounts/`**: Chart of accounts APIs
- **`api/journal/`**: Journal entry APIs
- **`api/invoices/`**: Invoice management APIs
- **`api/receipts/`**: Receipt management APIs

#### Financial Management
- **`api/wht/`**: Withholding tax APIs
- **`api/budgets/`**: Budget management APIs
- **`api/accounting-periods/`**: Accounting period APIs
- **`api/exchange-rates/`**: Currency exchange APIs

#### Trade & Inventory
- **`api/inventory/`**: Stock management APIs
- **`api/products/`**: Product catalog APIs
- **`api/warehouses/`**: Warehouse management APIs
- **`api/stock-takes/`**: Stock take functionality APIs
- **`api/stock-movements/`**: Stock movement tracking APIs

#### Purchasing
- **`api/purchase-requests/`**: Purchase request APIs
- **`api/purchase-orders/`**: Purchase order APIs
- **`api/purchases/`**: Purchase invoice APIs
- **`api/goods-receipt-notes/`**: Goods receipt APIs
- **`api/vendors/`**: Vendor management APIs

#### Receivables & Payables
- **`api/customers/`**: Customer management APIs
- **`api/payments/`**: Payment APIs
- **`api/credit-notes/`**: Credit note APIs
- **`api/debit-notes/`**: Debit note APIs
- **`api/cheques/`**: Cheque management APIs

#### Assets & Payroll
- **`api/assets/`**: Fixed assets APIs
- **`api/payroll/`**: Payroll processing APIs
- **`api/employees/`**: Employee management APIs
- **`api/petty-cash/`**: Petty cash APIs

#### Reports & Analytics
- **`api/reports/`**: Financial report APIs
  - `trial-balance/`: Trial balance reports
  - `income-statement/`: Income statements
  - `general-ledger/`: General ledger
  - `vat/`: VAT reports
  - `wht/`: WHT reports
- **`api/analytics/`**: Analytics APIs
- **`api/dashboard/`**: Dashboard data APIs

#### System Management
- **`api/users/`**: User management APIs
- **`api/settings/`**: System settings APIs
- **`api/company/`**: Company configuration APIs
- **`api/entities/`**: Entity management APIs
- **`api/upload/`**: File upload APIs
- **`api/notifications/`**: Notification APIs

#### Utilities
- **`api/currencies/`**: Currency management APIs
- **`api/health/`**: Health check APIs
- **`api/versions/`**: Version information APIs
- **`api/sessions/`**: Session management APIs
- **`api/metrics/`**: Application metrics APIs
- **`api/docs/`**: Documentation APIs

#### Advanced Features
- **`api/webhooks/`**: Webhook handler APIs
- **`api/inter-company/`**: Inter-company transaction APIs
- **`api/tax-forms/`**: Tax form generation APIs
- **`api/bank-accounts/`**: Bank account management APIs

### Core Features
- **`docs/`**: Documentation pages
- **`stock-takes/`**: Stock take functionality components

## AI Agent Guidelines

### CRITICAL SPA Routing Pattern

When working with this application, understand that:

1. **No Next.js Routing**: URL changes do NOT trigger Next.js page loads
2. **Client-Side State**: `activeModule` state determines which component renders
3. **History API**: `window.history.pushState()` updates URL without reload
4. **Popstate Listener**: Browser back/forward handled via `popstate` event
5. **Invoice Detail**: Special case - `/invoices/:id` pattern handled separately

### 6-Module Addition Process (MUST FOLLOW)

**Step 1**: Add to Module type in `page.tsx`
**Step 2**: Add to both `moduleToPath` and `pathToModule` maps  
**Step 3**: Add navigation button to sidebar
**Step 4**: Create component in `src/components/[module]/`
**Step 5**: Add case to `renderModule()` switch
**Step 6**: Create API routes in `src/app/api/[module]/`

### API Route Patterns

#### Standard Structure
```typescript
// GET /api/resource - List all items
export async function GET(request: NextRequest) {
  const items = await prisma.item.findMany()
  return apiResponse(items)
}

// POST /api/resource - Create new item
export async function POST(request: NextRequest) {
  const body = await request.json()
  const validated = schema.parse(body)
  const item = await prisma.item.create({ data: validated })
  return apiResponse(item)
}

// GET /api/resource/[id] - Get single item
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const item = await prisma.item.findUnique({ where: { id: params.id } })
  return apiResponse(item)
}

// PUT /api/resource/[id] - Update item
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await request.json()
  const validated = schema.parse(body)
  const item = await prisma.item.update({ 
    where: { id: params.id }, 
    data: validated 
  })
  return apiResponse(item)
}

// DELETE /api/resource/[id] - Delete item
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  await prisma.item.delete({ where: { id: params.id } })
  return apiResponse({ success: true })
}
```

#### Response Format
```typescript
// Success response
return apiResponse(data)

// Error response  
throw new Error("Error message")
```

### Zod Validation Requirements

**ALL API inputs MUST use Zod schemas**:

```typescript
import { z } from 'zod'

const itemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  quantity: z.number().positive('Quantity must be positive'),
  price: z.number().min(0, 'Price cannot be negative'),
})

// In route handler
const body = await request.json()
const validated = itemSchema.parse(body)
```

### CSRF Protection Requirements

**Required for**: All POST/PUT/PATCH/DELETE operations on `/api/`

**Implementation**:
```typescript
import { validateCsrfToken } from '@/lib/csrf-service-server'

export async function POST(request: NextRequest) {
  // 1. Validate CSRF token from headers
  validateCsrfToken(request)
  
  // 2. Get CSRF token from client
  const csrfToken = getCsrfTokenFromHeaders(request)
  
  // 3. Process request
  // ...
}
```

**Exempt Paths**: `/api/auth/*`, `/api/csrf/token`, `/api/webhooks/`

### Auth Helper Usage

#### Auth Helpers ([`src/lib/api-auth.ts`](../../lib/api-auth.ts))
```typescript
// For protected routes - throws if not authenticated
const user = await requireAuth()

// For conditionals - returns null if not authenticated  
const user = await auth()

// For role-based access
await requireRole(['ADMIN', 'ACCOUNTANT'])

// For permission checks
if (await canEdit()) {
  // User can edit (ADMIN or ACCOUNTANT)
}

// For admin-only access
if (await isAdmin()) {
  // User is ADMIN
}
```

**Usage Pattern**:
```typescript
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    
    if (!await canEdit()) {
      throw new Error("No edit permission")
    }
    
    // Process request
    return apiResponse(createdItem)
  } catch (error) {
    // Error handling
  }
}
```

## Common Patterns

### API Route Structure
- **Directory**: `src/app/api/resource/`
- **Files**: `route.ts`, `[id]/route.ts`, `special-action/route.ts`
- **Naming**: Follow REST conventions (GET, POST, PUT, DELETE)

### Service Layer Pattern
Business logic in `src/lib/*-service.ts`, API routes call services:
```typescript
import { invoiceService } from '@/lib/invoice-service'

// Route calls service
const invoice = await invoiceService.create(validatedData)
```

### Monetary Storage Pattern
**CRITICAL**: All monetary values stored as Satang integers:
```typescript
// User input → Database
import { bahtToSatang } from '@/lib/currency'
totalAmount: bahtToSatang(userInput)  // 1234.56 → 123456

// Database → Display  
import { satangToBaht } from '@/lib/currency'
satangToBaht(invoice.totalAmount)  // 123456 → 1234.56
```

### Double-Entry Accounting
All transactions must balance using Prisma transactions:
```typescript
await prisma.$transaction(async (tx) => {
  // Debit entry
  await tx.journalEntry.create({ data: debitData })
  // Credit entry
  await tx.journalEntry.create({ data: creditData })
})
```

## Dependencies

### Core Dependencies
- **Next.js 16**: App Router with hybrid SPA architecture
- **NextAuth.js v4**: Authentication and session management
- **Prisma ORM v6**: Database operations with TypeScript
- **Zod v4**: Schema validation for API inputs
- **TypeScript 5**: Type safety and development experience

### UI & State Management
- **shadcn/ui**: New York style component library
- **Tailwind CSS v4**: Utility-first CSS framework
- **Zustand v5**: Client-side state management
- **TanStack Query v5**: Server state management

### Runtime
- **Bun**: JavaScript runtime package manager

## Testing Notes

- **Test Bypass**: Use `x-playwright-test: true` header to bypass rate limiting
- **Mock Authentication**: Tests use bypass auth for testing endpoints
- **CSRF Exemption**: Test routes exempt from CSRF requirements

## Security

- **Rate Limiting**: Configured in middleware.ts
- **CSRF Protection**: Required for all API mutations
- **Authentication**: NextAuth.js with role-based access control
- **Input Validation**: Zod schemas for all API inputs
- **SQL Injection Prevention**: Parameterized queries via Prisma