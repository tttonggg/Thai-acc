# AGENTS.md - src/lib/ Directory

**Parent Reference**: [../AGENTS.md](../AGENTS.md)

## Purpose

This directory contains the **business logic layer** and **utility functions** for the Thai Accounting ERP system. It serves as the central service layer where all application logic, data transformations, and business rules are implemented.

## Key Files

### Core Infrastructure

- **`db.ts`** - Prisma client singleton and database connection management
- **`auth.ts`** - NextAuth configuration and authentication system
- **`auth-full.ts`** - Complete authentication configuration (server-side)
- **`api-utils.ts`** - API response helpers and authentication utilities (`requireAuth`, `auth()`, `requireRole`, `canEdit()`, `isAdmin()`)
- **`validations.ts`** - Zod validation schemas for all API inputs

### Critical Business Services

- **`thai-accounting.ts`** - Thai-specific accounting functions (date formatting, tax calculations, SSC, TFRS compliance)
- **`currency.ts`** - Baht/Satang conversion utilities (CRITICAL for monetary display and storage)
- **`inventory-service.ts`** - Stock management and WAC (Weighted Average Cost) costing
- **`asset-service.ts`** - Fixed asset depreciation calculations and management
- **`payroll-service.ts`** - Thai SSC calculations, PND1 forms, and payroll processing
- **`wht-service.ts`** - Withholding tax automation and calculations
- **`petty-cash-service.ts`** - Petty cash vouchers and management
- **`cheque-service.ts`** - Cheque tracking and management
- **`stock-take-service.ts`** - Stock taking and inventory adjustment logic
- **`purchase-service.ts`** - Purchase order and invoice processing
- **`quotation-service.ts`** - Quotation generation and management

### Security & Authentication

- **`csrf-service.ts`** - CSRF token generation and validation
- **`csrf-service-server.ts`** - Server-side CSRF service
- **`rate-limit.ts`** - API rate limiting implementation
- **`mfa-service.ts`** - Multi-factor authentication service
- **`mfa.ts`** - MFA configuration and utilities
- **`encryption.ts`** - Data encryption utilities
- **`encryption-service.ts`** - Encryption service implementation

### PDF & Document Generation

- **`pdf-generator.ts`** - PDF generation using jsPDF for invoices, receipts, reports
- **`pdfkit-generator.ts`** - PDFKit implementation for complex documents
- **`excel-export.ts`** - Excel export functionality for reports and data
- **`tax-form-service.ts`** - Thai tax form generation (PND1, PND3, etc.)

### Database & ORM

- **`db-helpers.ts`** - Database helper functions and utilities
- **`db-optimizer.ts`** - Database query optimization utilities
- **`secure-db.ts`** - Database security utilities

### Audit & Monitoring

- **`activity-logger.ts`** - User activity logging and tracking
- **`audit-logger.ts`** - Security audit logging
- **`audit-service.ts`** - Comprehensive audit trail service
- **`audit-middleware.ts`** - Audit middleware for automatic logging
- **`performance-monitor.ts`** - Application performance monitoring
- **`api-analytics.ts`** - API usage analytics and metrics

### API & Web Services

- **`api-auth.ts`** - API authentication utilities
- **`api-security.ts`** - API security middleware
- **`api-error-handler.ts`** - Centralized API error handling
- **`webhook-service.ts`** - Webhook management and processing
- **`webhook-security.ts`** - Webhook security utilities
- **`socket.ts`** - WebSocket utilities for real-time updates

### Business Logic Services

- **`budget-service.ts`** - Budget management and tracking
- **`period-service.ts`** - Accounting period management
- **`session-service.ts`** - Session management utilities
- **`intercompany-service.ts`** - Intercompany transactions management
- **`analytics-service.ts`** - Business analytics and reporting

### Miscellaneous Utilities

- **`thai-accounting-server.ts`** - Server-side Thai accounting functions
- **`currency-service.ts`** - Additional currency utilities
- **`password-strength.ts`** - Password strength validation
- **`password-validator.ts`** - Password validation utilities
- **`errors.ts`** - Custom error definitions
- **`api-version.ts`** - API version management
- **`status-badge.tsx`** - UI status component

## Subdirectories

### `constants/`
- **Purpose**: Application-wide constants and configurations
- **`error-messages.ts`** - Standardized error messages

### `db/`
- **Purpose**: Database utilities and connection management
- **`connection-pool.ts`** - Database connection pool management
- **`query-monitor.ts`** - Query performance monitoring

### `graphql/`
- **Purpose**: GraphQL schema and resolvers
- **`schema.ts`** - GraphQL type definitions
- **`resolvers.ts`** - GraphQL resolvers
- **`dataloaders.ts`** - Data loaders for GraphQL optimization

### `middleware/`
- **Purpose**: Custom middleware implementations
- **`analytics-middleware.ts`** - Analytics tracking middleware
- **`version-middleware.ts`** - API version middleware

### `monitoring/`
- **Purpose**: Application monitoring utilities
- **`logger.ts`** - Centralized logging system

### `services/`
- **Purpose**: Additional business logic services
- **`analytics-service.ts`** - Business analytics service
- **`webhook-service.ts`** - Webhook management service

### `templates/`
- **Purpose**: Document templates for PDF generation
- **`invoice-template.html`** - Invoice HTML template
- **`receipt-template.html`** - Receipt HTML template

## For AI Agents

### Critical Patterns to Follow

1. **Always Use Services for Business Logic**
   - Never implement business logic directly in API routes
   - Always call service functions from route handlers
   - Keep API routes thin - only handle request/response

2. **Satang/Baht Conversion Pattern**
   ```typescript
   // User input → Database (POST routes)
   import { bahtToSatang } from './currency'
   const invoice = await prisma.invoice.create({
     data: {
       totalAmount: bahtToSatang(userEnteredAmount), // 1234.56 → 123456
     }
   })

   // Database → Display (GET routes)
   import { satangToBaht } from './currency'
   const invoice = await prisma.invoice.findUnique({ where: { id } })
   return {
     ...invoice,
     totalAmount: satangToBaht(invoice.totalAmount), // 123456 → 1234.56
   }
   ```

3. **Thai Accounting Functions**
   - Use functions from `thai-accounting.ts` for Thai-specific calculations
   - Thai date formatting: `formatThaiDate()` (DD/MM/YYYY with Thai year)
   - Tax calculations: Use built-in tax rate constants and functions

4. **Authentication Helpers**
   - Use `requireAuth()` to throw if user not authenticated
   - Use `auth()` to return null if not authenticated
   - Use `requireRole()`, `canEdit()`, `isAdmin()` for permission checks

5. **Validation**
   - ALWAYS use Zod schemas from `validations.ts`
   - Never trust client-side validation
   - Validate all API inputs before processing

### Common Patterns

1. **Service Layer Architecture**
   ```typescript
   // Service file: invoice-service.ts
   export async function createInvoice(data: InvoiceCreateInput) {
     // Business logic here
   }

   // API route: src/app/api/invoices/route.ts
   export async function POST(request: Request) {
     const data = await request.json()
     const result = await invoiceService.createInvoice(data)
     return apiResponse(result)
   }
   ```

2. **Prisma Transactions**
   - Use `prisma.$transaction()` for double-entry accounting
   - Always ensure debit = credit
   - Handle rollback on errors

3. **Error Handling**
   - Use standardized error messages from constants
   - Throw appropriate errors with Thai messages
   - Use `apiErrorHandler` for consistent error responses

### Important Notes

- **All monetary values MUST be stored in Satang (integers)**
- **Database reset required when fixing Satang/Baht conversion bugs**
- **Thai accounting follows TFRS standards**
- **Use Prisma parameterized queries only - no raw SQL**
- **Always add soft delete conditions: `where: { deletedAt: null }`**
- **Document numbering via `generateDocNumber()` - never implement ad-hoc numbering**

## Dependencies

- **Prisma ORM** - Database operations and migrations
- **NextAuth.js v4** - Authentication and session management
- **Zod v4** - Schema validation
- **jsPDF & PDFKit** - PDF generation
- **xlsx** - Excel export functionality
- **TypeScript** - Type safety and development

## Testing

Test files are located in `__tests__/` subdirectory:
- Unit tests for individual services
- Integration tests for API endpoints
- Mock data and fixtures for Thai accounting scenarios