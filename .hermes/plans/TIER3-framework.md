# TIER3-Framework Extraction Plan

**Project**: Thai Accounting ERP (Keerati)  
**Source**: `/users/tong/Desktop/Thai-acc-sandbox`  
**Generated**: 2026-05-01  
**Status**: Planning

---

## 1. Executive Summary

This document outlines a comprehensive plan to extract the Thai Accounting ERP
system into a **reusable multi-tenant ERP framework**. The framework will
support Thai-specific accounting features while remaining generic enough for
other locales/industries.

**Key Outcomes:**

- Extractable framework with plugin architecture
- Clear separation of Thai-specific vs generic components
- Multi-tenancy via tenant context
- 280+ Prisma models organized into domain packages

---

## 2. Analysis: Thai-Specific vs Generic Components

### 2.1 GENERIC Components (Framework-Ready)

These components are not Thai-specific and can be extracted as-is:

| Component               | Location                                      | Description                                       |
| ----------------------- | --------------------------------------------- | ------------------------------------------------- |
| **SPA Routing Engine**  | `src/app/page.tsx`                            | Hybrid SPA pattern with History API               |
| **Auth System**         | `src/lib/auth.ts`, `src/lib/api-auth.ts`      | NextAuth v4 + RBAC (ADMIN/ACCOUNTANT/USER/VIEWER) |
| **API Layer**           | `src/app/api/*`                               | RESTful endpoints with Zod validation             |
| **Service Layer**       | `src/lib/*-service.ts`                        | Business logic isolation                          |
| **UI Components**       | `src/components/ui/`                          | shadcn/ui base components                         |
| **Double-Entry Engine** | `src/lib/journal-*.ts`                        | Balanced debit/credit transactions                |
| **Multi-Currency**      | `src/lib/currency.ts`                         | Currency conversion + formatting                  |
| **PDF/Excel Export**    | `src/lib/pdf-*.ts`, `src/lib/excel-export.ts` | Document generation                               |
| **Session Management**  | `src/lib/session-service.ts`                  | Session lifecycle                                 |
| **Audit Logging**       | `src/lib/audit-*.ts`                          | Security + activity logging                       |
| **Rate Limiting**       | `src/lib/rate-limit.ts`                       | API protection                                    |
| **CSRF Protection**     | `src/lib/csrf-*.ts`                           | Request validation                                |
| **MFA**                 | `src/lib/mfa*.ts`                             | Multi-factor authentication                       |
| **Zustand Stores**      | `src/stores/*.ts`                             | Client state management                           |

### 2.2 THAI-SPECIFIC Components (Localized)

These must be kept as locale-specific plugins or configuration:

| Component                  | Location                             | Reason                               |
| -------------------------- | ------------------------------------ | ------------------------------------ |
| **Thai Accounting Rules**  | `src/lib/thai-accounting.ts`         | TFRS compliance, บัญชีไทย            |
| **Thai Date Formatting**   | `src/lib/thai-accounting.ts:40-55`   | Buddhist calendar (พ.ศ.), DD/MM/YYYY |
| **Thai Number Text**       | `src/lib/thai-accounting.ts:76-142`  | หนึ่งบาทถ้วน conversion              |
| **WHT Calculations**       | `src/lib/wht-service.ts`             | ภาษีหัก ณ ที่จ่าย (PND3, PND53)      |
| **VAT Calculations**       | `src/lib/thai-accounting.ts:144-163` | 7% rate, inclusive/exclusive         |
| **Thai Chart of Accounts** | `prisma/seed.ts`                     | 181 Thai-compliant accounts          |
| **Thai Tax Forms**         | `src/lib/tax-form-service.ts`        | PND1, PND3, PND53 generation         |
| **SSC Calculations**       | `src/lib/payroll-service.ts`         | Social Security Office contributions |
| **Thai Language Labels**   | All components                       | Hardcoded Thai UI text               |
| **Thai Currency Format**   | `src/lib/thai-accounting.ts:58-65`   | ฿THB formatting                      |
| **Document Templates**     | `src/lib/templates/`                 | Thai invoice/receipt templates       |

### 2.3 Analysis Summary

```
Framework Extractability: ~65% generic, ~35% Thai-specific

Generic Layers:
  [Core]    --> Prisma/DB, Auth, API, Validation, Audit, Session
  [Domain]  --> Invoicing, Payments, Inventory, Assets, Payroll
  [UI]      --> shadcn/ui, Forms, Tables, Charts

Thai-Specific Layers:
  [Locale]  --> ThaiAccounting, WHT, VAT, TFRS, ThaiDate
  [Config]  --> ChartOfAccounts (TH), TaxForms, SSCCalculations
```

---

## 3. Framework Architecture

### 3.1 Recommended: Monorepo with Packages

```
erp-framework/
├── packages/
│   ├── core/                    # Core framework
│   │   ├── src/
│   │   │   ├── api/            # REST API utilities
│   │   │   ├── auth/           # Auth abstractions
│   │   │   ├── db/             # Prisma client
│   │   │   ├── services/       # Base services
│   │   │   └── types/          # Core types
│   │   └── package.json
│   │
│   ├── plugin-auth-nextauth/   # NextAuth plugin
│   ├── plugin-auth-custom/     # Custom credentials plugin
│   │
│   ├── ui/                     # UI component library
│   │   ├── src/
│   │   │   ├── components/     # Base components
│   │   │   └── styles/         # Tailwind + shadcn
│   │   └── package.json
│   │
│   ├── plugin-locale-th/       # Thai locale plugin
│   │   ├── src/
│   │   │   ├── accounting.ts   # Thai accounting rules
│   │   │   ├── tax/            # WHT, VAT, SSC
│   │   │   ├── date/           # Thai date utils
│   │   │   ├── currency/       # Baht formatting
│   │   │   └── i18n/           # Thai translations
│   │   └── package.json
│   │
│   ├── domain-invoicing/       # Invoice domain
│   ├── domain-payments/        # Payments domain
│   ├── domain-inventory/       # Inventory domain
│   ├── domain-payroll/         # Payroll domain
│   ├── domain-assets/          # Fixed assets domain
│   │
│   ├── template-saas/          # SaaS boilerplate
│   └── template-erp/           # Full ERP template
│
├── apps/
│   ├── demo/                   # Demo application
│   └── docs/                   # Documentation
│
└── turbo.json                  # Turborepo config
```

### 3.2 Package Responsibilities

| Package                | Description                          | Dependencies |
| ---------------------- | ------------------------------------ | ------------ |
| `core`                 | DB, API utils, types, events, config | None         |
| `ui`                   | shadcn/ui + Tailwind + theme system  | core         |
| `plugin-auth-nextauth` | NextAuth v4 integration              | core         |
| `plugin-locale-th`     | Thai accounting + localization       | core         |
| `domain-*`             | Business logic for each domain       | core, ui     |
| `template-*`           | Starter templates                    | All packages |

---

## 4. Plugin System Design

### 4.1 Plugin Interface

```typescript
// packages/core/src/plugin.ts
export interface ERPPlugin {
  name: string;
  version: string;

  // Lifecycle hooks
  init?(context: PluginContext): Promise<void> | void;
  destroy?(): Promise<void> | void;

  // Capabilities
  services?: Record<string, Service>;
  components?: Record<string, React.ComponentType>;
  routes?: PluginRoute[];
  hooks?: PluginHooks;
  middleware?: Middleware[];
  dbModels?: Prisma.Model[];
}

export interface PluginContext {
  tenant: TenantContext;
  config: FrameworkConfig;
  eventBus: EventBus;
  i18n: I18n;
}
```

### 4.2 Plugin Communication

```typescript
// Event Bus for plugin-to-plugin communication
interface EventBus {
  emit(event: string, data: any): void;
  on(event: string, handler: Handler): void;
  off(event: string, handler: Handler): void;
}

// Example: Thai plugin listens for invoice events
// packages/plugin-locale-th/src/index.ts
export const thaiPlugin: ERPPlugin = {
  name: 'locale-th',
  version: '1.0.0',

  hooks: {
    'invoice.created': async (invoice, ctx) => {
      // Auto-calculate WHT if applicable
      // Apply Thai tax rules
    },
    'journal.validate': async (entry, ctx) => {
      // Ensure Thai chart of accounts compliance
    },
  },
};
```

### 4.3 Plugin Registration

```typescript
// In app entry point
const app = createERPApp({
  plugins: [
    nextAuthPlugin({
      /* config */
    }),
    thaiLocalePlugin({ vatRate: 7, whtRates: WHT_RATES }),
    invoicingPlugin(),
    paymentsPlugin(),
  ],
});
```

### 4.4 Built-in Plugin Hooks

| Hook               | Timing                    | Purpose          |
| ------------------ | ------------------------- | ---------------- |
| `app.beforeInit`   | Before app initialization | Modify config    |
| `app.afterInit`    | After app initialization  | Post-setup       |
| `db.beforeQuery`   | Before database query     | Logging, caching |
| `db.afterQuery`    | After database query      | Audit trail      |
| `auth.beforeLogin` | Before authentication     | MFA check        |
| `auth.afterLogin`  | After authentication      | Session creation |
| `invoice.created`  | After invoice creation    | WHT calculation  |
| `journal.validate` | During journal validation | Balance check    |
| `report.generate`  | During report generation  | Thai formatting  |

---

## 5. Authentication & Multi-Tenancy Analysis

### 5.1 Current Auth Architecture

```
Current: Single-tenant per deployment
├── NextAuth v4 (credentials provider)
├── Roles: ADMIN > ACCOUNTANT > USER > VIEWER
├── Permissions: Object-based (module -> roles[])
├── MFA: TOTP support
└── Session: Database-backed
```

### 5.2 Multi-Tenancy Requirements

For framework, we need multi-tenant isolation:

```typescript
// Core types for multi-tenancy
interface Tenant {
  id: string;
  slug: string; // URL subdomain or path
  name: string;
  settings: TenantSettings;
  createdAt: Date;
}

interface TenantSettings {
  locale: string; // 'th' | 'en' | etc.
  timezone: string; // 'Asia/Bangkok'
  currency: string; // 'THB'
  fiscalYearStart: Month; // January (Thailand: April)
  taxId: string; // บัญชีภาษีอากร
}

// Tenant context (injected into all operations)
interface TenantContext {
  tenant: Tenant;
  userId: string;
  sessionId: string;
}
```

### 5.3 Multi-Tenancy Strategy

| Approach              | Pros                        | Cons                          | Recommendation |
| --------------------- | --------------------------- | ----------------------------- | -------------- |
| **Shared Schema**     | Simple, less infrastructure | Row-level security complexity | v1             |
| **Separate Schema**   | Complete isolation          | Higher infra cost             | v2+            |
| **Separate Database** | Maximum isolation           | Complex migrations            | Enterprise     |

**Recommendation**: Start with Shared Schema + Row-Level Security

```typescript
// Every query automatically filtered by tenantId
prisma.$use(async (params, next) => {
  if (params.model && isTenantModel(params.model)) {
    // Inject tenantId filter
    addTenantFilter(params);
  }
  return next(params);
});
```

### 5.4 Auth Plugin Design

```typescript
// packages/plugin-auth-nextauth/src/index.ts
export interface NextAuthPluginConfig {
  providers?: AuthProvider[];
  sessionStrategy?: 'database' | 'jwt';
  callbacks?: {
    jwt?: (token, user) => Promise<JWT>;
    session?: (session, token) => Promise<Session>;
  };
}

export const nextAuthPlugin: ERPPlugin = {
  name: 'auth-nextauth',

  async init(ctx) {
    // Register NextAuth handlers
    // Setup tenant resolution from subdomain/header
    // Configure role hierarchy
  },

  middleware: [
    // Rate limiting per tenant
    // CSRF protection
    // Session validation
  ],
};
```

---

## 6. Database & Prisma Model Organization

### 6.1 Current State

- 280+ Prisma models
- Dual-schema system (SQLite dev, PostgreSQL prod)
- Satang monetary storage (integer)
- Soft deletes on most models
- Audit trails (createdAt, updatedAt)

### 6.2 Framework Schema Design

```
packages/core/prisma/schema.prisma

// Core (shared)
model User { ... }
model Session { ... }
model Role { ... }
model Permission { ... }
model AuditLog { ... }

// Tenant-scoped (all have tenantId)
model Invoice { tenantId String ... }
model Payment { tenantId String ... }
// ... all business objects
```

### 6.3 Model Categories for Packages

| Package            | Models                                             |
| ------------------ | -------------------------------------------------- |
| `core`             | User, Session, Role, Permission, AuditLog, Setting |
| `domain-invoicing` | Invoice, InvoiceLine, Receipt                      |
| `domain-payments`  | Payment, CreditNote, DebitNote                     |
| `domain-payroll`   | Employee, PayrollPeriod, PayrollEntry              |
| `domain-inventory` | Product, Warehouse, StockMove, StockTake           |
| `domain-assets`    | Asset, AssetDepreciation                           |
| `plugin-locale-th` | TaxFiling, WithholdingTax, SsciFiling              |

---

## 7. Implementation Phases

### Phase 1: Core Framework (Weeks 1-4)

- [ ] Extract `packages/core` with base types, DB, events
- [ ] Define plugin interface
- [ ] Create event bus system
- [ ] Setup monorepo structure (Turborepo)
- [ ] Migrate auth to plugin

### Phase 2: UI Foundation (Weeks 3-6)

- [ ] Extract `packages/ui` with shadcn/ui
- [ ] Create theme system
- [ ] Build base component library
- [ ] Extract form/table primitives

### Phase 3: Auth Plugin (Weeks 5-8)

- [ ] Build `plugin-auth-nextauth`
- [ ] Implement multi-tenant context
- [ ] Add RBAC system
- [ ] Session management

### Phase 4: Domain Packages (Weeks 7-12)

- [ ] Domain invoicing package
- [ ] Domain payments package
- [ ] Domain inventory package
- [ ] Domain payroll package
- [ ] Domain assets package

### Phase 5: Thai Locale Plugin (Weeks 10-14)

- [ ] Thai accounting rules
- [ ] WHT/VAT/SSC calculations
- [ ] Thai date formatting
- [ ] Thai translations
- [ ] Chart of accounts (TH)

### Phase 6: Templates & Documentation (Weeks 13-16)

- [ ] SaaS template
- [ ] Full ERP template
- [ ] Migration guides
- [ ] Plugin development guide

---

## 8. Migration Path from Current Codebase

### 8.1 Extraction Order

```
1. First:  Core types, events, plugin interface
           (No changes to existing code)

2. Second: UI components
           (Copy to packages/ui, reference from original)

3. Third:  Auth system
           (Extract to plugin, maintain compatibility)

4. Fourth: Domain services + API routes
           (Gradual migration per module)

5. Fifth:  Thai locale plugin
           (Create new, don't modify original until ready)
```

### 8.2 Backward Compatibility

Maintain the current codebase working throughout extraction:

```
main (Keerati ERP)
 ├── Current implementation
 └── Uses: packages/* (local)
     ├── @framework/core
     ├── @framework/ui
     ├── @framework/plugin-auth-nextauth
     └── @framework/plugin-locale-th

After extraction complete:
 ├── Publish to npm
 └── Fork for other locales (Singapore, Vietnam, etc.)
```

---

## 9. Key Design Decisions

### 9.1 Why Turborepo + Nx?

- **Turborepo**: Faster builds, better caching, simpler than Nx
- **NPM workspaces**: Package management
- **TypeScript project references**: Strict typing across packages

### 9.2 Why React 19 + Next.js 16?

- Continue with current stack
- Minimize framework learning curve
- Leverage App Router features

### 9.3 Why shadcn/ui?

- Copy-paste model (no coupling to library updates)
- Customizable without forks
- Thai ERP already uses it

### 9.4 Why Prisma?

- Type-safe queries
- Works with SQLite (dev) and PostgreSQL (prod)
- Good migration tooling
- Already in use

---

## 10. Risks & Mitigations

| Risk                         | Impact              | Mitigation                         |
| ---------------------------- | ------------------- | ---------------------------------- |
| Scope creep                  | Delay delivery      | Strict phase gates                 |
| Thai-specific tight coupling | Hard to extract     | Early identification of boundaries |
| Breaking changes             | User migration pain | Semantic versioning + changelog    |
| Plugin performance overhead  | Runtime cost        | Lazy loading + code splitting      |
| Multi-tenancy complexity     | Security bugs       | Row-level security from day 1      |

---

## 11. Success Metrics

- [ ] All 280+ models accessible via package imports
- [ ] Plugin system handles 90%+ of current features
- [ ] Thai locale plugin < 20% of total codebase
- [ ] New tenant creation < 5 minutes
- [ ] Zero Thai-specific code in `core` package
- [ ] All tests pass post-migration
- [ ] Demo app runs with Thai locale plugin
- [ ] Documentation complete for plugin authors

---

## 12. Files Reference

### Source Files Analyzed

| File                         | Purpose                                   |
| ---------------------------- | ----------------------------------------- |
| `src/app/AGENTS.md`          | SPA routing architecture, 173+ API routes |
| `src/components/AGENTS.md`   | 52 feature component dirs                 |
| `src/lib/AGENTS.md`          | 80+ service files                         |
| `src/lib/thai-accounting.ts` | Thai-specific utilities (226 lines)       |
| `src/lib/auth.ts`            | NextAuth configuration                    |
| `src/lib/api-auth.ts`        | Auth helpers (requireAuth, etc.)          |
| `src/stores/AGENTS.md`       | Zustand stores (auth, theme, preferences) |
| `prisma/AGENTS.md`           | 280+ models, dual-schema system           |
| `design-system/AGENTS.md`    | shadcn/ui + theme system                  |
| `templates/AGENTS.md`        | CSV import templates                      |

### Key Thai-Specific Files to Extract

```
src/lib/thai-accounting.ts          --> plugin-locale-th
src/lib/thai-accounting-server.ts   --> plugin-locale-th
src/lib/wht-service.ts              --> plugin-locale-th
src/lib/tax-form-service.ts         --> plugin-locale-th
src/lib/payroll-service.ts          --> domain-payroll (with thai hooks)
prisma/seed.ts                      --> plugin-locale-th/seeds
```

---

## 13. Next Steps

1. **Create monorepo structure** with Turborepo
2. **Extract `packages/core`** with base types and plugin interface
3. **Validate plugin architecture** with a single plugin
4. **Begin UI package extraction**
5. **Get stakeholder sign-off** on architecture

---

_Plan generated by TIER3 subagent for Framework Extraction_ _Review with:
Architecture team, Thai accounting SME, Frontend team_
