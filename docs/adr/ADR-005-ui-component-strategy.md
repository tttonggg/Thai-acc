# ADR-005: UI Component Strategy

## Status
Accepted

## Context
We needed a UI component strategy for the Thai Accounting ERP system. Requirements:
- Consistent design across the application
- Accessible components
- Customizable styling
- TypeScript support
- Good developer experience
- Thai language support (RTL considerations)

## Decision
We chose **shadcn/ui** with **Tailwind CSS** as our component strategy.

## Consequences

### Positive
- **Copy-paste components**: Full ownership of component code
- **Tailwind CSS**: Utility-first CSS, easy customization
- **Radix UI primitives**: Built on accessible, unstyled primitives
- **TypeScript**: Full type safety
- **Customizable**: Easy to modify for our needs
- **No runtime dependency**: Components are part of our codebase
- **Dark mode support**: Built-in dark mode
- **Consistent design**: Pre-designed components that work together

### Negative
- **Manual updates**: Need to manually update components
- **Bundle size**: Can grow if not careful
- **Learning curve**: Need to learn Tailwind CSS
- **No theme marketplace**: Can't easily switch themes

## Component Architecture

### shadcn/ui Components
```bash
# Core components
npx shadcn add button
npx shadcn add input
npx shadcn add select
npx shadcn add table
npx shadcn add dialog
npx shadcn add dropdown-menu
npx shadcn add card
npx shadcn add tabs

# Form components
npx shadcn add form
npx shadcn add label
npx shadcn add checkbox
npx shadcn add radio-group
```

### Custom Components
```typescript
// components/custom/DataTable.tsx
'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// Custom implementation building on shadcn/ui
```

### Component Hierarchy
```
shadcn/ui (Base)
    ↓
Extended Components (Enhanced)
    ↓
Domain Components (Business-specific)
    ↓
Page Components (Page-specific)
```

## Styling Strategy

### Tailwind Configuration
```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        // ... more colors
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        thai: ['var(--font-thai)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
```

### CSS Variables (theming)
```css
/* globals.css */
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    /* ... */
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    /* ... */
  }
}
```

## Form Handling Strategy

### React Hook Form + Zod
```typescript
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

const formSchema = z.object({
  email: z.string().email(),
  amount: z.number().positive(),
});

export function InvoiceForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* Form fields */}
      </form>
    </Form>
  );
}
```

## Alternatives Considered

### 1. Material-UI (MUI)
- Pros: Comprehensive, mature
- Cons: Heavy bundle size, customization complexity

### 2. Chakra UI
- Pros: Developer experience, accessibility
- Cons: Runtime CSS-in-JS, v2 migration complexity

### 3. Ant Design
- Pros: Comprehensive, enterprise-focused
- Cons: Heavy, Chinese-focused design

### 4. Bootstrap
- Pros: Familiar
- Cons: Outdated, jQuery dependency

### 5. Custom components from scratch
- Pros: Full control, minimal bundle
- Cons: Time-consuming, accessibility challenges

## Decision Drivers
1. Customization flexibility
2. TypeScript support
3. Accessibility
4. Developer experience
5. Bundle size
6. Ownership of code

## References
- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Radix UI](https://www.radix-ui.com/)
- [Tailwind CSS](https://tailwindcss.com/)

## Date
March 16, 2026

## Author
Development Team
