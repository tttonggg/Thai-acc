'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DeleteConfirmDialog } from '@/components/ui/delete-confirm-dialog';
import { FormDialog } from '@/components/ui/form-dialog';
import { useDeleteConfirm } from '@/hooks/use-delete-confirm';
import { useToast } from '@/hooks/use-toast';

/**
 * Example component demonstrating the usage of reusable dialog components
 */
export function DialogExamples() {
  const { toast } = useToast();

  // Example 1: DeleteConfirmDialog with manual state management
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleManualDelete = async () => {
    setIsDeleting(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsDeleting(false);
    setIsDeleteDialogOpen(false);
    toast({
      title: 'ลบสำเร็จ',
      description: 'ลบรายการเรียบร้อยแล้ว',
    });
  };

  // Example 2: FormDialog
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '' });

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setIsFormDialogOpen(false);
    setFormData({ name: '', email: '' });
    toast({
      title: 'บันทึกสำเร็จ',
      description: 'บันทึกข้อมูลเรียบร้อยแล้ว',
    });
  };

  // Example 3: useDeleteConfirm hook
  const {
    confirmDelete,
    isOpen: isHookDialogOpen,
    title: hookTitle,
    message: hookMessage,
    isDeleting: isHookDeleting,
    cancel: hookCancel,
  } = useDeleteConfirm();

  const deleteWithHook = async () => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    // Success toast is automatically shown by the hook
  };

  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="mb-2 text-3xl font-bold">Dialog Components Examples</h1>
        <p className="text-muted-foreground">
          ตัวอย่างการใช้งาน Dialog Components ที่สามารถนำไปใช้ซ้ำได้
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">1. DeleteConfirmDialog (Manual State)</h2>
        <p className="mb-4 text-muted-foreground">
          ใช้ DeleteConfirmDialog กับการจัดการ state แบบ manual
        </p>
        <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
          ลบรายการ (Manual State)
        </Button>

        <DeleteConfirmDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          title="ลบลูกค้า"
          message="คุณต้องการลบลูกค้ารายนี้ใช่หรือไม่? การดำเนินการนี้ไม่สามารถยกเลิกได้"
          confirmLabel="ลบ"
          cancelLabel="ยกเลิก"
          onConfirm={handleManualDelete}
          loading={isDeleting}
        />
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">2. FormDialog</h2>
        <p className="mb-4 text-muted-foreground">
          ใช้ FormDialog สำหรับฟอร์มที่มีการ validate และ submit
        </p>
        <Button onClick={() => setIsFormDialogOpen(true)}>เพิ่มลูกค้าใหม่</Button>

        <FormDialog
          open={isFormDialogOpen}
          onOpenChange={setIsFormDialogOpen}
          title="เพิ่มลูกค้าใหม่"
          description="กรอกข้อมูลลูกค้าด้านล่าง"
          onSubmit={handleFormSubmit}
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
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="ชื่อบริษัท/ห้างหุ้นส่วน"
              />
            </div>
            <div>
              <Label htmlFor="email">อีเมล</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@company.co.th"
              />
            </div>
          </div>
        </FormDialog>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">3. useDeleteConfirm Hook</h2>
        <p className="mb-4 text-muted-foreground">
          ใช้ useDeleteConfirm hook สำหรับการจัดการการลบที่ง่ายและสะดวกมากขึ้น
        </p>
        <Button
          variant="destructive"
          onClick={() =>
            confirmDelete(deleteWithHook, {
              title: 'ลบสินค้า',
              message: 'คุณต้องการลบสินค้ารายการนี้ใช่หรือไม่?',
              onSuccess: () => {
                console.log('Item deleted successfully');
              },
              onError: (error) => {
                console.error('Delete failed:', error);
              },
            })
          }
        >
          ลบรายการ (useDeleteConfirm Hook)
        </Button>

        <DeleteConfirmDialog
          open={isHookDialogOpen}
          onOpenChange={hookCancel}
          title={hookTitle}
          message={hookMessage}
          onConfirm={() => {}}
          loading={isHookDeleting}
        />
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">4. FormDialog with Custom Width</h2>
        <p className="mb-4 text-muted-foreground">
          ใช้ FormDialog กับ maxWidth ที่แตกต่างกัน (sm, md, lg, xl, 2xl)
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsFormDialogOpen(true)}>
            Small (sm)
          </Button>
          <Button variant="outline" onClick={() => setIsFormDialogOpen(true)}>
            Medium (md)
          </Button>
          <Button variant="outline" onClick={() => setIsFormDialogOpen(true)}>
            Large (lg)
          </Button>
          <Button variant="outline" onClick={() => setIsFormDialogOpen(true)}>
            Extra Large (xl)
          </Button>
          <Button variant="outline" onClick={() => setIsFormDialogOpen(true)}>
            2X Large (2xl)
          </Button>
        </div>
      </div>
    </div>
  );
}
