# API Changelog

All notable changes to the Thai Accounting ERP API will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-03-16

### Added - Major Features
- 🎉 **Initial stable release** - Production-ready API
- ✅ **Complete Authentication System** - NextAuth.js integration with session management
- ✅ **Role-Based Access Control** - Four-tier permission system (ADMIN, ACCOUNTANT, USER, VIEWER)
- ✅ **Full Chart of Accounts API** - 181 Thai standard accounts with hierarchical structure
- ✅ **Double-Entry Bookkeeping** - Complete journal entry system with auto-balancing

### Core Accounting Modules
- ✅ **Sales Invoice Management** - Full invoice lifecycle (create, issue, void, export PDF)
- ✅ **Receipt Management** - Payment allocation, WHT handling, posting to GL
- ✅ **Payment Management** - Vendor payments with multi-method support
- ✅ **Purchase Invoice Management** - AP tracking and payment allocation
- ✅ **Credit/Debit Notes** - Adjustment documents with GL impact

### Advanced Modules
- ✅ **Inventory Management** - Multi-warehouse, WAC costing, stock movements, transfers
- ✅ **Fixed Assets** - Asset registration, TAS 16 depreciation calculations
- ✅ **Banking** - Bank accounts, cheque lifecycle, reconciliation
- ✅ **Petty Cash** - Fund management, voucher system, reimbursements
- ✅ **Payroll** - Employee management, SSC/PND1 calculations, payroll runs
- ✅ **Withholding Tax** - PND3/PND53 certificates, 50 Tawi PDF generation

### Reports & Exports
- ✅ **Financial Reports** - General Ledger, Balance Sheet, Income Statement, Trial Balance
- ✅ **Tax Reports** - VAT reports (Input/Output), WHT reports (PND3/PND53)
- ✅ **Export Capabilities** - PDF, Excel, CSV exports for all reports
- ✅ **Custom Reports** - User-defined report builder

### Integrations
- ✅ **Webhook System** - Real-time event notifications
- ✅ **API Documentation** - Interactive docs with multi-language examples
- ✅ **Rate Limiting** - Configurable limits per endpoint category
- ✅ **CSRF Protection** - Security middleware

---

## [0.9.0] - 2026-03-01

### Added
- Inventory management endpoints with multi-warehouse support
- Payroll module with employee and payslip management
- Banking module with cheque lifecycle management
- WAC (Weighted Average Cost) calculation for inventory
- Stock transfer between warehouses
- Petty cash fund and voucher management
- Multi-currency support foundation

### Changed
- Improved error messages with Thai language support
- Enhanced validation error details with field-level information
- Optimized database queries for large datasets

### Fixed
- Memory leak in long-running report generation
- Race condition in concurrent invoice creation
- Timezone handling in date filters

---

## [0.8.0] - 2026-02-15

### Added
- Fixed assets module with depreciation calculations
- Petty cash management endpoints
- Withholding tax certificate management
- PND3/PND53 report generation
- Asset disposal and revaluation support
- Bank reconciliation endpoints

### Changed
- Refactored authentication middleware for better performance
- Updated Prisma schema for asset tracking
- Improved PDF generation speed

### Deprecated
- Legacy `/api/v0/invoices` endpoints (removed in 1.0.0)

---

## [0.7.0] - 2026-02-01

### Added
- Credit notes and debit notes support
- Multi-currency foundation (exchange rates table)
- Customer and vendor aging reports
- Product categories and variants
- Document attachments support

### Changed
- Enhanced invoice line item structure
- Updated VAT calculation precision

### Fixed
- Decimal precision in currency calculations
- Invoice voiding with partial payments
- Receipt allocation edge cases

---

## [0.6.0] - 2026-01-15

### Added
- Initial beta release
- Core accounting features
- Basic authentication
- Chart of accounts management
- Simple journal entries
- Customer and vendor management

---

## Migration Guides

### Upgrading from 0.9.x to 1.0.0

#### Breaking Changes
1. **Authentication Response Format**
   ```javascript
   // Before (0.9.x)
   {
     "token": "...",
     "user": { ... }
   }
   
   // After (1.0.0)
   {
     "success": true,
     "data": {
       "sessionToken": "...",
       "user": { ... }
     }
   }
   ```

2. **Pagination Response**
   ```javascript
   // Before (0.9.x)
   {
     "items": [...],
     "total": 100
   }
   
   // After (1.0.0)
   {
     "success": true,
     "data": [...],
     "pagination": {
       "page": 1,
       "limit": 20,
       "total": 100,
       "totalPages": 5
     }
   }
   ```

3. **Error Response Format**
   ```javascript
   // Before (0.9.x)
   {
     "error": "Validation failed",
     "details": [...]
   }
   
   // After (1.0.0)
   {
     "success": false,
     "error": {
       "code": "VALIDATION_ERROR",
       "message": "Validation failed",
       "details": [...]
     }
   }
   ```

#### Migration Steps
1. Update all API calls to expect new response format
2. Replace `token` with `data.sessionToken` in authentication
3. Update pagination handling to use `pagination` object
4. Update error handling to check `success` flag

### Upgrading from 0.8.x to 0.9.x

#### Changes
1. **Invoice Line Items** - Added `vatRate` field (defaults to 7%)
2. **Receipt Allocations** - Now require explicit `whtAmount` field
3. **Journal Entry Lines** - Account IDs now use full UUID format

#### Deprecations
- `POST /api/invoices/:id/pay` - Use receipts endpoint instead
- `GET /api/reports/ar-aging-v1` - Use `/api/reports/ar-aging`

---

## API Version Compatibility

| Client Version | API Version | Status |
|----------------|-------------|--------|
| 1.x.x | 1.0.0 | ✅ Fully Compatible |
| 0.9.x | 0.9.0 - 1.0.0 | ⚠️ Deprecated |
| 0.8.x | 0.8.0 - 0.9.0 | ❌ Not Supported |
| < 0.8 | All | ❌ Not Supported |

---

## End of Life Policy

| Version | Release Date | End of Support | End of Life |
|---------|--------------|----------------|-------------|
| 1.0.0 | 2026-03-16 | 2027-03-16 | 2028-03-16 |
| 0.9.0 | 2026-03-01 | 2026-09-01 | 2026-12-01 |
| 0.8.0 | 2026-02-15 | 2026-08-15 | 2026-11-15 |
| 0.7.0 | 2026-02-01 | 2026-08-01 | 2026-11-01 |

---

## Known Issues

### Version 1.0.0
- **ISSUE-001**: Large report exports (>10MB) may timeout on slow connections
  - **Workaround**: Use date range filters to split reports
  - **Fix Planned**: 1.0.1

- **ISSUE-002**: Concurrent journal entry posting may cause locking
  - **Workaround**: Implement client-side retry with exponential backoff
  - **Fix Planned**: 1.0.2

---

## Roadmap

### Version 1.1.0 (Planned - Q2 2026)
- [ ] GraphQL API support
- [ ] Bulk operations endpoints
- [ ] Advanced search with Elasticsearch
- [ ] Real-time updates via WebSockets

### Version 1.2.0 (Planned - Q3 2026)
- [ ] Multi-company support
- [ ] Inter-company transactions
- [ ] Consolidated financial reports
- [ ] API versioning via URL path

### Version 2.0.0 (Planned - 2027)
- [ ] gRPC support for high-performance operations
- [ ] Event streaming (SSE)
- [ ] Machine learning-powered insights
- [ ] OpenAPI 3.1 specification

---

## Security Notices

### 2026-03-10: Security Update
- Fixed potential XSS vulnerability in PDF export
- Updated JWT token validation
- Enhanced rate limiting for authentication endpoints

### 2026-02-20: Security Update
- Patched SQL injection vulnerability in search endpoints
- Updated dependencies with security fixes

---

## How to Report Issues

1. **Security Issues**: Email security@thaiaccounting.com
2. **Bug Reports**: https://github.com/thaiaccounting/erp/issues
3. **Feature Requests**: https://community.thaiaccounting.com

---

**Last Updated**: 2026-03-16  
**Maintained by**: Thai Accounting ERP Development Team
