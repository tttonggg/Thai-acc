# Contributing to Thai Accounting ERP

Thank you for your interest in contributing to Thai Accounting ERP! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Workflow](#development-workflow)
4. [Code Style Guidelines](#code-style-guidelines)
5. [Commit Message Format](#commit-message-format)
6. [Pull Request Process](#pull-request-process)
7. [Testing Requirements](#testing-requirements)
8. [Documentation](#documentation)
9. [Issue Reporting](#issue-reporting)
10. [Community](#community)

---

## Code of Conduct

This project and everyone participating in it is governed by our commitment to:

- **Be respectful** - Treat everyone with respect. Healthy debate is encouraged, but harassment is not tolerated.
- **Be constructive** - Provide constructive feedback and be open to receiving it.
- **Be collaborative** - Work together towards the best solutions for users.
- **Be professional** - Maintain professionalism in all interactions.

## Getting Started

### Prerequisites

- Node.js 18+ or Bun runtime
- Git
- A code editor (VS Code recommended)
- Basic knowledge of TypeScript, React, and Next.js

### Setting Up Development Environment

1. **Fork the repository**
   ```bash
   git clone https://github.com/your-username/thai-accounting-erp.git
   cd thai-accounting-erp
   ```

2. **Install dependencies**
   ```bash
   bun install
   # or
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

4. **Set up database**
   ```bash
   bun run db:generate
   bun run db:push
   bun run seed
   ```

5. **Start development server**
   ```bash
   bun run dev
   ```

## Development Workflow

### Branching Strategy

We use a simplified Git Flow:

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - New features
- `bugfix/*` - Bug fixes
- `hotfix/*` - Urgent production fixes

### Creating a Feature Branch

```bash
# From develop branch
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feature/your-feature-name

# Make your changes
git add .
git commit -m "feat: add new feature"

# Push to your fork
git push origin feature/your-feature-name
```

### Branch Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| Feature | `feature/description` | `feature/invoice-templates` |
| Bugfix | `bugfix/description` | `bugfix/vat-calculation` |
| Hotfix | `hotfix/description` | `hotfix/login-error` |
| Docs | `docs/description` | `docs/api-examples` |

## Code Style Guidelines

### TypeScript

- Use strict mode enabled
- Explicit return types for functions
- Prefer `interface` over `type` for object shapes
- Use meaningful variable names

```typescript
// Good
interface InvoiceProps {
  id: string;
  customerName: string;
  totalAmount: number;
}

function calculateTotal(items: LineItem[]): number {
  return items.reduce((sum, item) => sum + item.amount, 0);
}

// Avoid
function calc(i: any) {
  return i.reduce((s: any, x: any) => s + x.amt, 0);
}
```

### React Components

- Use functional components with hooks
- Props interface for every component
- Default exports for page components
- Named exports for reusable components

```typescript
// components/invoices/InvoiceCard.tsx
interface InvoiceCardProps {
  invoice: Invoice;
  onSelect: (id: string) => void;
}

export function InvoiceCard({ invoice, onSelect }: InvoiceCardProps) {
  return (
    <div onClick={() => onSelect(invoice.id)}>
      {/* Component content */}
    </div>
  );
}
```

### File Naming

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `InvoiceList.tsx` |
| Utilities | camelCase | `formatCurrency.ts` |
| Hooks | camelCase with 'use' prefix | `useInvoiceData.ts` |
| Styles | kebab-case.module.css | `invoice-card.module.css` |
| Tests | ComponentName.test.ts | `InvoiceList.test.tsx` |

### API Routes

```typescript
// Standard API structure
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

const schema = z.object({
  customerId: z.string().min(1),
  amount: z.number().positive(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session) {
    return Response.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const validated = schema.parse(body);
    
    // Business logic here
    const result = await createInvoice(validated);
    
    return Response.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { success: false, error: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Invoice creation error:', error);
    return Response.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### CSS/Tailwind

- Use Tailwind CSS utility classes
- Custom CSS only when necessary
- Responsive design with mobile-first approach
- Consistent spacing scale

```tsx
// Good - Tailwind classes
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow">

// Avoid - Inline styles
<div style={{ display: 'flex', padding: '16px' }}>
```

## Commit Message Format

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

### Format

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only changes |
| `style` | Code style changes (formatting, semicolons, etc) |
| `refactor` | Code refactoring |
| `perf` | Performance improvements |
| `test` | Adding or updating tests |
| `chore` | Build process or auxiliary tool changes |

### Examples

```
feat(invoices): add support for recurring invoices

fix(vat): correct calculation for inclusive VAT

docs(api): add examples for webhook handling

refactor(db): optimize invoice query performance

test(journal): add tests for auto-balancing

chore(deps): update Next.js to version 16
```

### Scope Guidelines

Common scopes:
- `invoices` - Sales invoice module
- `receipts` - Receipt management
- `journal` - Journal entries
- `reports` - Financial reports
- `api` - API endpoints
- `ui` - User interface components
- `db` - Database schema or queries
- `auth` - Authentication
- `tax` - Tax calculations

## Pull Request Process

### Before Submitting

1. **Update your branch**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout your-feature-branch
   git rebase develop
   ```

2. **Run tests**
   ```bash
   bun run test
   bun run test:e2e
   ```

3. **Check code quality**
   ```bash
   bun run lint
   bun run type-check
   ```

### PR Guidelines

1. **Title Format**: `[TYPE] Brief description`
   - Example: `[FEAT] Add multi-currency support`

2. **Description Template**:
   ```markdown
   ## Description
   Brief description of changes

   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   - [ ] Documentation update

   ## Testing
   - [ ] Unit tests added/updated
   - [ ] E2E tests added/updated
   - [ ] Manual testing performed

   ## Checklist
   - [ ] Code follows style guidelines
   - [ ] Self-review completed
   - [ ] Documentation updated
   - [ ] No console errors

   ## Screenshots (if applicable)
   [Add screenshots for UI changes]
   ```

3. **Review Process**:
   - At least 1 approval required
   - All CI checks must pass
   - No merge conflicts
   - Address review comments

### PR Size Guidelines

- **Small PRs** (< 200 lines): Quick review
- **Medium PRs** (200-500 lines): Standard review
- **Large PRs** (> 500 lines): May require multiple reviewers

Consider breaking large changes into smaller PRs.

## Testing Requirements

### Unit Tests

```typescript
// Example test structure
import { describe, it, expect } from 'vitest';
import { calculateVAT } from '@/lib/tax-utils';

describe('calculateVAT', () => {
  it('calculates VAT correctly for exclusive price', () => {
    const result = calculateVAT(1000, 7, 'exclusive');
    expect(result.vatAmount).toBe(70);
    expect(result.totalWithVAT).toBe(1070);
  });

  it('calculates VAT correctly for inclusive price', () => {
    const result = calculateVAT(1070, 7, 'inclusive');
    expect(result.vatAmount).toBe(70);
    expect(result.baseAmount).toBe(1000);
  });
});
```

### Test Coverage Requirements

| Module | Minimum Coverage |
|--------|------------------|
| Critical (tax, calculations) | 90% |
| Business logic | 80% |
| UI components | 70% |
| API routes | 80% |

### E2E Tests

```typescript
// Example E2E test
test('user can create and issue invoice', async ({ page }) => {
  await page.goto('/invoices');
  await page.click('button:has-text("New Invoice")');
  
  await page.fill('[name="customerId"]', 'CUST-001');
  await page.fill('[name="lines[0].description"]', 'Service Fee');
  await page.fill('[name="lines[0].amount"]', '1000');
  
  await page.click('button:has-text("Save")');
  await page.click('button:has-text("Issue")');
  
  await expect(page.locator('.status')).toHaveText('ISSUED');
});
```

### Running Tests

```bash
# Run all tests
bun run test

# Run with coverage
bun run test:coverage

# Run E2E tests
bun run test:e2e

# Run specific test file
bun run test src/lib/__tests__/tax-utils.test.ts
```

## Documentation

### Code Documentation

```typescript
/**
 * Calculates VAT amount for a given price
 * @param amount - Base amount
 * @param vatRate - VAT rate as percentage (e.g., 7 for 7%)
 * @param type - Whether amount includes VAT or not
 * @returns Object containing vatAmount, baseAmount, and total
 * @example
 * calculateVAT(1000, 7, 'exclusive')
 * // Returns: { vatAmount: 70, baseAmount: 1000, total: 1070 }
 */
function calculateVAT(
  amount: number,
  vatRate: number,
  type: 'inclusive' | 'exclusive'
): VATResult {
  // Implementation
}
```

### Documentation Updates

Update documentation when:
- Adding new features
- Changing API contracts
- Modifying database schema
- Updating configuration options

Documentation locations:
- `/docs/*.md` - User and technical docs
- `API_DOCUMENTATION.md` - API reference
- `README.md` - Project overview
- Inline code comments

## Issue Reporting

### Bug Reports

Use this template:

```markdown
**Description**
Clear description of the bug

**Steps to Reproduce**
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

**Expected Behavior**
What should happen

**Actual Behavior**
What actually happens

**Screenshots**
If applicable

**Environment**
- OS: [e.g., Windows 10]
- Browser: [e.g., Chrome 120]
- Version: [e.g., 1.0.0]

**Additional Context**
Any other information
```

### Feature Requests

```markdown
**Feature Description**
Clear description of the feature

**Problem Statement**
What problem does this solve?

**Proposed Solution**
How should it work?

**Alternatives Considered**
Other approaches

**Additional Context**
Mockups, examples, etc.
```

### Security Issues

**DO NOT** create public issues for security vulnerabilities.

Email: security@thaiaccounting.com

Include:
- Description of vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

## Community

### Communication Channels

- **GitHub Discussions** - General questions and ideas
- **Discord** - Real-time chat (invite link in README)
- **Monthly Community Call** - Video call for contributors

### Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Awarded contributor badges

### Becoming a Maintainer

Regular contributors may be invited to become maintainers. Criteria:
- Consistent quality contributions
- Understanding of codebase
- Community participation
- Alignment with project goals

---

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (MIT License).

---

Thank you for contributing to Thai Accounting ERP! 🎉

*Last Updated: March 16, 2026*
