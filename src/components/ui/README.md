# Reusable Dialog Components

This directory contains reusable dialog components for the Thai Accounting ERP
system.

## Components

### 1. DeleteConfirmDialog

A generic delete confirmation dialog with danger styling and loading states.

**Usage:**

```tsx
import { DeleteConfirmDialog } from '@/components/ui/delete-confirm-dialog';
import { useState } from 'react';

function MyComponent() {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await fetch(`/api/items/${id}`, { method: 'DELETE' });
      // Handle success
      setIsDeleteDialogOpen(false);
    } catch (error) {
      // Handle error
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <DeleteConfirmDialog
      open={isDeleteDialogOpen}
      onOpenChange={setIsDeleteDialogOpen}
      title="ลบลูกค้า"
      message="คุณต้องการลบลูกค้ารายนี้ใช่หรือไม่?"
      confirmLabel="ลบ"
      cancelLabel="ยกเลิก"
      onConfirm={handleDelete}
      loading={isDeleting}
    />
  );
}
```

**Props:**

- `open`: boolean - Controls dialog visibility
- `onOpenChange`: (open: boolean) => void - Callback when dialog state changes
- `title`: string (default: 'ยืนยันการลบ') - Dialog title
- `message`: string (default: 'คุณต้องการลบรายการนี้ใช่หรือไม่?...') - Dialog
  message
- `confirmLabel`: string (default: 'ลบ') - Confirm button label
- `cancelLabel`: string (default: 'ยกเลิก') - Cancel button label
- `onConfirm`: () => void | Promise<void> - Callback when confirmed
- `loading`: boolean (default: false) - Show loading state

---

### 2. FormDialog

A generic form dialog wrapper that handles form submission, loading states, and
auto-close on success.

**Usage:**

```tsx
import { FormDialog } from '@/components/ui/form-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await fetch('/api/items', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      setIsOpen(false); // Auto-close on success
    } catch (error) {
      // Handle error - dialog stays open
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormDialog
      open={isOpen}
      onOpenChange={setIsOpen}
      title="เพิ่มลูกค้าใหม่"
      description="กรอกข้อมูลลูกค้าด้านล่าง"
      onSubmit={handleSubmit}
      loading={isSubmitting}
      submitLabel="บันทึก"
      cancelLabel="ยกเลิก"
      maxWidth="md"
    >
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">ชื่อลูกค้า</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ name: e.target.value })}
          />
        </div>
      </div>
    </FormDialog>
  );
}
```

**Props:**

- `open`: boolean - Controls dialog visibility
- `onOpenChange`: (open: boolean) => void - Callback when dialog state changes
- `title`: string - Dialog title
- `description`?: string - Optional dialog description
- `children`: React.ReactNode - Form content
- `onSubmit`: (e: React.FormEvent) => void | Promise<void> - Form submit handler
- `loading`: boolean (default: false) - Show loading state
- `submitLabel`: string (default: 'บันทึก') - Submit button label
- `cancelLabel`: string (default: 'ยกเลิก') - Cancel button label
- `showFooter`: boolean (default: true) - Show/hide footer buttons
- `disableSubmit`: boolean (default: false) - Disable submit button
- `maxWidth`: 'sm' | 'md' | 'lg' | 'xl' | '2xl' (default: 'lg') - Dialog max
  width

---

### 3. useDeleteConfirm Hook

A custom hook for managing delete confirmation workflow with automatic toast
notifications.

**Usage:**

```tsx
import { useDeleteConfirm } from '@/hooks/use-delete-confirm';
import { Button } from '@/components/ui/button';
import { DeleteConfirmDialog } from '@/components/ui/delete-confirm-dialog';

function MyComponent({ itemId }: { itemId: string }) {
  const { confirmDelete, isOpen, title, message, isDeleting, cancel } =
    useDeleteConfirm();

  const deleteItem = async () => {
    const response = await fetch(`/api/items/${itemId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete item');
    }

    // Refresh data or navigate away
    window.location.reload();
  };

  return (
    <>
      <Button
        variant="destructive"
        onClick={() =>
          confirmDelete(deleteItem, {
            title: 'ลบรายการสินค้า',
            message: 'คุณต้องการลบสินค้ารายการนี้ใช่หรือไม่?',
            onSuccess: () => {
              console.log('Item deleted successfully');
              // Optional: Additional success handling
            },
            onError: (error) => {
              console.error('Delete failed:', error);
              // Optional: Additional error handling
            },
          })
        }
      >
        ลบ
      </Button>

      <DeleteConfirmDialog
        open={isOpen}
        onOpenChange={cancel}
        title={title}
        message={message}
        onConfirm={() => {}} // Handled by the hook
        loading={isDeleting}
      />
    </>
  );
}
```

**Hook Returns:**

- `confirmDelete`: (deleteFn: () => Promise<void>, options?:
  DeleteConfirmOptions) => void - Function to trigger delete confirmation
- `isOpen`: boolean - Dialog open state
- `title`: string - Dialog title
- `message`: string - Dialog message
- `isDeleting`: boolean - Loading state
- `cancel`: () => void - Close dialog function

**DeleteConfirmOptions:**

```typescript
interface DeleteConfirmOptions {
  title?: string; // Custom title (default: 'ยืนยันการลบ')
  message?: string; // Custom message
  onSuccess?: () => void; // Callback on successful delete
  onError?: (error: Error) => void; // Callback on error
}
```

---

## Features

- **TypeScript Support**: All components are fully typed
- **Thai Language**: Default labels are in Thai
- **Loading States**: Built-in loading indicators and disabled states
- **Error Handling**: Automatic toast notifications for success/error
- **Accessibility**: Uses Radix UI primitives for full accessibility
- **Responsive**: Works on all screen sizes
- **Customizable**: Easy to customize labels, styles, and behavior

---

## Best Practices

1. **Always use confirm dialogs for destructive actions** - Never delete without
   confirmation
2. **Provide clear, specific messages** - Tell users exactly what will be
   deleted
3. **Handle errors gracefully** - Show user-friendly error messages
4. **Disable buttons during operations** - Prevent duplicate submissions
5. **Auto-close on success** - Close dialogs automatically after successful
   operations
6. **Use the useDeleteConfirm hook** - It provides better UX with automatic
   toast notifications

---

## Examples in the Codebase

See these files for real-world usage examples:

- `/Users/tong/Thai-acc/src/components/ar/customer-list.tsx` - Customer
  management
- `/Users/tong/Thai-acc/src/components/ap/vendor-list.tsx` - Vendor management
- `/Users/tong/Thai-acc/src/components/invoices/invoice-list.tsx` - Invoice
  management

---

## Migration Guide

To migrate existing code to use these reusable components:

### Before (Custom Dialog):

```tsx
const [showDeleteDialog, setShowDeleteDialog] = useState(false)

<Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Confirm Delete</DialogTitle>
      <DialogDescription>Are you sure?</DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
      <Button variant="destructive" onClick={handleDelete}>
        Delete
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### After (Using DeleteConfirmDialog):

```tsx
const [showDeleteDialog, setShowDeleteDialog] = useState(false)

<DeleteConfirmDialog
  open={showDeleteDialog}
  onOpenChange={setShowDeleteDialog}
  onConfirm={handleDelete}
  loading={isDeleting}
/>
```

### After (Using useDeleteConfirm Hook):

```tsx
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
