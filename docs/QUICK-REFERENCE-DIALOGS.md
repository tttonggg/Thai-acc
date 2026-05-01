# Quick Reference: Reusable Dialog Components

## Import Statements

```typescript
// Components
import { DeleteConfirmDialog } from '@/components/ui/delete-confirm-dialog';
import { FormDialog } from '@/components/ui/form-dialog';

// Hooks
import { useDeleteConfirm } from '@/hooks/use-delete-confirm';
import { useToast } from '@/hooks/use-toast';

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
```

## Common Patterns

### Pattern 1: Delete with Manual State

```typescript
const [isOpen, setIsOpen] = useState(false)
const [loading, setLoading] = useState(false)

<DeleteConfirmDialog
  open={isOpen}
  onOpenChange={setIsOpen}
  onConfirm={async () => {
    setLoading(true)
    await deleteItem()
    setLoading(false)
    setIsOpen(false)
  }}
  loading={loading}
/>
```

### Pattern 2: Delete with Hook (Recommended)

```typescript
const { confirmDelete, isOpen, title, message, isDeleting, cancel } = useDeleteConfirm()

<Button onClick={() => confirmDelete(deleteItem)}>Delete</Button>

<DeleteConfirmDialog
  open={isOpen}
  onOpenChange={cancel}
  title={title}
  message={message}
  onConfirm={() => {}}
  loading={isDeleting}
/>
```

### Pattern 3: Form Dialog

```typescript
const [isOpen, setIsOpen] = useState(false)
const [loading, setLoading] = useState(false)

<FormDialog
  open={isOpen}
  onOpenChange={setIsOpen}
  title="Form Title"
  onSubmit={async (e) => {
    e.preventDefault()
    setLoading(true)
    await submitForm()
    setLoading(false)
    setIsOpen(false)
  }}
  loading={loading}
>
  <form-fields-goes-here />
</FormDialog>
```

## Props Cheat Sheet

### DeleteConfirmDialog

| Prop         | Type                        | Default        | Required |
| ------------ | --------------------------- | -------------- | -------- |
| open         | boolean                     | -              | ✅       |
| onOpenChange | (open: boolean) => void     | -              | ✅       |
| onConfirm    | () => void \| Promise<void> | -              | ✅       |
| title        | string                      | 'ยืนยันการลบ'  | ❌       |
| message      | string                      | (Thai warning) | ❌       |
| confirmLabel | string                      | 'ลบ'           | ❌       |
| cancelLabel  | string                      | 'ยกเลิก'       | ❌       |
| loading      | boolean                     | false          | ❌       |

### FormDialog

| Prop          | Type                                    | Default  | Required |
| ------------- | --------------------------------------- | -------- | -------- |
| open          | boolean                                 | -        | ✅       |
| onOpenChange  | (open: boolean) => void                 | -        | ✅       |
| title         | string                                  | -        | ✅       |
| children      | ReactNode                               | -        | ✅       |
| onSubmit      | (e: FormEvent) => void \| Promise<void> | -        | ✅       |
| description   | string                                  | -        | ❌       |
| loading       | boolean                                 | false    | ❌       |
| submitLabel   | string                                  | 'บันทึก' | ❌       |
| cancelLabel   | string                                  | 'ยกเลิก' | ❌       |
| showFooter    | boolean                                 | true     | ❌       |
| disableSubmit | boolean                                 | false    | ❌       |
| maxWidth      | 'sm'\|'md'\|'lg'\|'xl'\|'2xl'           | 'lg'     | ❌       |

### useDeleteConfirm Hook

| Return        | Type                                                              |
| ------------- | ----------------------------------------------------------------- |
| confirmDelete | (fn: () => Promise<void>, options?: DeleteConfirmOptions) => void |
| isOpen        | boolean                                                           |
| title         | string                                                            |
| message       | string                                                            |
| isDeleting    | boolean                                                           |
| cancel        | () => void                                                        |

### DeleteConfirmOptions

| Option    | Type                   | Default        |
| --------- | ---------------------- | -------------- |
| title     | string                 | 'ยืนยันการลบ'  |
| message   | string                 | (Thai warning) |
| onSuccess | () => void             | -              |
| onError   | (error: Error) => void | -              |

## Width Options (FormDialog)

- **sm**: `sm:max-w-sm` (~384px)
- **md**: `sm:max-w-md` (~448px)
- **lg**: `sm:max-w-lg` (~512px) ← Default
- **xl**: `sm:max-w-xl` (~576px)
- **2xl**: `sm:max-w-2xl` (~672px)

## Common Toast Messages

```typescript
// Success
toast({
  title: 'บันทึกสำเร็จ',
  description: 'บันทึกข้อมูลเรียบร้อยแล้ว',
});

// Error
toast({
  title: 'เกิดข้อผิดพลาด',
  description: 'ไม่สามารถบันทึกข้อมูลได้',
  variant: 'destructive',
});

// Delete Success
toast({
  title: 'ลบสำเร็จ',
  description: 'ลบรายการเรียบร้อยแล้ว',
});

// Delete Error
toast({
  title: 'เกิดข้อผิดพลาด',
  description: 'ไม่สามารถลบรายการได้',
  variant: 'destructive',
});
```

## File Locations

```
src/
├── components/
│   ├── ui/
│   │   ├── delete-confirm-dialog.tsx
│   │   ├── form-dialog.tsx
│   │   ├── index.ts
│   │   └── README.md
│   └── examples/
│       └── dialog-examples.tsx
└── hooks/
    ├── use-delete-confirm.ts
    └── index.ts
```

## Best Practices

1. ✅ **Always confirm destructive actions** - Use DeleteConfirmDialog for
   deletes
2. ✅ **Show loading states** - Set loading={true} during async operations
3. ✅ **Auto-close on success** - Call onOpenChange(false) after successful
   operations
4. ✅ **Handle errors** - Use try/catch with error toasts
5. ✅ **Disable buttons** - Use disableSubmit when form is invalid
6. ✅ **Use the hook** - Prefer useDeleteConfirm over manual state management
7. ✅ **Thai language** - Use Thai labels for user-facing text
8. ✅ **Type safety** - Always type your data and functions

## Anti-Patterns to Avoid

❌ **Don't skip confirmation** - Always confirm before deleting ❌ **Don't
ignore errors** - Always handle and show errors to users ❌ **Don't leave
dialogs open** - Close after success, keep open after error ❌ **Don't use
inline styles** - Use shadcn/ui components ❌ **Don't hardcode strings** - Use
props for customization ❌ **Don't forget loading states** - Users need to know
something is happening

## Real-World Examples

### Customer List

```typescript
// File: src/components/ar/customer-list.tsx
const { confirmDelete, isOpen, title, message, isDeleting, cancel } = useDeleteConfirm()

<Button
  variant="destructive"
  onClick={() =>
    confirmDelete(() => fetch(`/api/customers/${id}`, { method: 'DELETE' }), {
      title: 'ลบลูกค้า',
      message: 'คุณต้องการลบลูกค้ารายนี้ใช่หรือไม่?',
    })
  }
>
  ลบ
</Button>
```

### Vendor List

```typescript
// File: src/components/ap/vendor-list.tsx
// Same pattern as Customer List
```

### Invoice Actions

```typescript
// File: src/components/invoices/invoice-list.tsx
// Use FormDialog for invoice creation/editing
// Use DeleteConfirmDialog for invoice deletion
```

## Troubleshooting

**Dialog doesn't close**

- Make sure to call `onOpenChange(false)` after success
- Check if there's an error preventing completion

**Loading state not showing**

- Ensure you're passing `loading={true}` during async operations
- Check that your async function actually returns a Promise

**Toast not showing**

- Make sure you've called `useToast()` in your component
- Check that you're calling `toast()` with proper arguments

**Type errors**

- Ensure you're importing from `@/components/ui` and `@/hooks`
- Check that you're passing correct prop types

---

**Need more help?**

- See `/Users/tong/Thai-acc/src/components/ui/README.md` for detailed docs
- See `/Users/tong/Thai-acc/src/components/examples/dialog-examples.tsx` for
  examples
- See existing components like `customer-list.tsx` for real usage
