'use client';

import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface DeleteConfirmOptions {
  title?: string;
  message?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

interface DeleteConfirmState {
  isOpen: boolean;
  title: string;
  message: string;
  isDeleting: boolean;
}

export function useDeleteConfirm() {
  const [state, setState] = useState<DeleteConfirmState>({
    isOpen: false,
    title: 'ยืนยันการลบ',
    message: 'คุณต้องการลบรายการนี้ใช่หรือไม่? การดำเนินการนี้ไม่สามารถยกเลิกได้',
    isDeleting: false,
  });
  const [deleteCallback, setDeleteCallback] = useState<(() => Promise<void>) | null>(null);
  const { toast } = useToast();

  const confirm = useCallback((options: DeleteConfirmOptions = {}) => {
    return new Promise<void>((resolve, reject) => {
      setState({
        isOpen: true,
        title: options.title || 'ยืนยันการลบ',
        message:
          options.message || 'คุณต้องการลบรายการนี้ใช่หรือไม่? การดำเนินการนี้ไม่สามารถยกเลิกได้',
        isDeleting: false,
      });

      setDeleteCallback(async () => {
        try {
          setState((prev) => ({ ...prev, isDeleting: true }));
          // Call the actual delete function passed by the component
          resolve();
          setState((prev) => ({ ...prev, isOpen: false, isDeleting: false }));
          options.onSuccess?.();
        } catch (error) {
          setState((prev) => ({ ...prev, isDeleting: false }));
          const err = error instanceof Error ? error : new Error('Delete operation failed');
          options.onError?.(err);
          reject(err);
        }
      });
    });
  }, []);

  const handleConfirm = useCallback(async () => {
    if (deleteCallback) {
      try {
        await deleteCallback();
        setState((prev) => ({ ...prev, isOpen: false, isDeleting: false }));
        toast({
          title: 'ลบสำเร็จ',
          description: 'ลบรายการเรียบร้อยแล้ว',
        });
      } catch (error) {
        setState((prev) => ({ ...prev, isDeleting: false }));
        toast({
          title: 'เกิดข้อผิดพลาด',
          description: error instanceof Error ? error.message : 'ไม่สามารถลบรายการได้',
          variant: 'destructive',
        });
      }
    }
  }, [deleteCallback, toast]);

  const cancel = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: false }));
    setDeleteCallback(null);
  }, []);

  const confirmDelete = useCallback(
    (deleteFn: () => Promise<void>, options: DeleteConfirmOptions = {}) => {
      setState({
        isOpen: true,
        title: options.title || 'ยืนยันการลบ',
        message:
          options.message || 'คุณต้องการลบรายการนี้ใช่หรือไม่? การดำเนินการนี้ไม่สามารถยกเลิกได้',
        isDeleting: false,
      });

      setDeleteCallback(async () => {
        try {
          setState((prev) => ({ ...prev, isDeleting: true }));
          await deleteFn();
          setState((prev) => ({ ...prev, isOpen: false, isDeleting: false }));
          options.onSuccess?.();
          toast({
            title: 'ลบสำเร็จ',
            description: 'ลบรายการเรียบร้อยแล้ว',
          });
        } catch (error) {
          setState((prev) => ({ ...prev, isDeleting: false }));
          const err = error instanceof Error ? error : new Error('Delete operation failed');
          options.onError?.(err);
          toast({
            title: 'เกิดข้อผิดพลาด',
            description: err.message || 'ไม่สามารถลบรายการได้',
            variant: 'destructive',
          });
        }
      });
    },
    [toast]
  );

  return {
    isOpen: state.isOpen,
    title: state.title,
    message: state.message,
    isDeleting: state.isDeleting,
    confirmDelete,
    handleConfirm,
    cancel,
  };
}
