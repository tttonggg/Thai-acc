'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertTriangle, RotateCcw } from 'lucide-react';

interface StockMovement {
  id: string;
  type: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  date: string;
  notes: string | null;
  product: { code: string; name: string; unit: string };
  warehouse: { code: string; name: string };
}

interface StockMovementEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  movement?: StockMovement | null;
  onSuccess: () => void;
}

const MOVEMENT_TYPES: Record<string, { label: string; color: string }> = {
  RECEIVE: { label: 'รับสินค้า', color: 'bg-green-100 text-green-700' },
  ISSUE: { label: 'เบิกสินค้า', color: 'bg-red-100 text-red-700' },
  TRANSFER_IN: { label: 'โอนเข้า', color: 'bg-blue-100 text-blue-700' },
  TRANSFER_OUT: { label: 'โอนออก', color: 'bg-orange-100 text-orange-700' },
  ADJUST: { label: 'ปรับปรุง', color: 'bg-purple-100 text-purple-700' },
  COUNT: { label: 'นับสต็อก', color: 'bg-gray-100 text-gray-700' },
};

export function StockMovementEditDialog({
  open,
  onOpenChange,
  movement,
  onSuccess,
}: StockMovementEditDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [reversing, setReversing] = useState(false);
  const [mode, setMode] = useState<'edit' | 'reverse'>('edit');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (movement) {
      setNotes(movement.notes || '');
      setMode('edit');
      setReversing(false);
    }
  }, [movement, open]);

  if (!movement) return null;

  const mt = MOVEMENT_TYPES[movement.type] || {
    label: movement.type,
    color: 'bg-gray-100 text-gray-700',
  };

  const handleSaveNotes = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/stock-movements/${movement.id}`, {
        credentials: 'include',
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      }).then((r) => r.json());

      if (res.success) {
        toast({
          title: 'บันทึกหมายเหตุสำเร็จ',
          description: 'อัปเดตหมายเหตุเรียบร้อยแล้ว',
        });
        onOpenChange(false);
        onSuccess();
      } else {
        toast({
          title: 'ข้อผิดพลาด',
          description: res.error,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'ข้อผิดพลาด',
        description: 'เกิดข้อผิดพลาดในการเชื่อมต่อ',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReverse = async () => {
    if (!confirm(`ยืนยันที่จะยกเลิกการเคลื่อนไหวนี้?\n\nสร้างรายการย้อนกลับเพื่อแก้ไขสต็อก`)) {
      return;
    }

    setReversing(true);
    try {
      const res = await fetch(`/api/stock-movements/${movement.id}`, {
        credentials: 'include',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reverse' }),
      }).then((r) => r.json());

      if (res.success) {
        toast({
          title: 'ยกเลิกการเคลื่อนไหวสำเร็จ',
          description: res.data.message,
        });
        onOpenChange(false);
        onSuccess();
      } else {
        toast({
          title: 'ข้อผิดพลาด',
          description: res.error,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'ข้อผิดพลาด',
        description: 'เกิดข้อผิดพลาดในการเชื่อมต่อ',
        variant: 'destructive',
      });
    } finally {
      setReversing(false);
    }
  };

  const canReverse = ['RECEIVE', 'ISSUE', 'ADJUST'].includes(movement.type);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] md:max-w-md">
        <VisuallyHidden>
          <DialogDescription>
            แก้ไขหมายเหตุหรือยกเลิกการเคลื่อนไหวสินค้าในคลังสินค้า
          </DialogDescription>
        </VisuallyHidden>
        <DialogHeader>
          <DialogTitle>รายละเอียดการเคลื่อนไหวสินค้า</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Movement Info */}
          <div className="space-y-2 rounded-lg bg-gray-50 p-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold">{movement.product.name}</p>
                <p className="font-mono text-xs text-gray-500">{movement.product.code}</p>
              </div>
              <Badge className={mt.color}>{mt.label}</Badge>
            </div>
            <div className="grid grid-cols-1 gap-2 text-xs md:grid-cols-2">
              <div>
                <span className="text-gray-500">คลัง:</span>
                <span className="ml-1 font-medium">{movement.warehouse.name}</span>
              </div>
              <div>
                <span className="text-gray-500">วันที่:</span>
                <span className="ml-1 font-medium">
                  {new Date(movement.date).toLocaleDateString('th-TH', { dateStyle: 'short' })}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between border-t pt-2 text-sm">
              <span>จำนวน:</span>
              <span
                className={`font-semibold ${
                  ['ISSUE', 'TRANSFER_OUT'].includes(movement.type)
                    ? 'text-red-600'
                    : 'text-green-600'
                }`}
              >
                {['ISSUE', 'TRANSFER_OUT'].includes(movement.type) ? '-' : '+'}
                {Math.abs(movement.quantity).toFixed(2)} {movement.product.unit}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>ต้นทุน/หน่วย:</span>
              <span className="font-medium">฿{movement.unitCost.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>มูลค่ารวม:</span>
              <span className="font-semibold">฿{movement.totalCost.toFixed(2)}</span>
            </div>
          </div>

          {/* Tabs */}
          {canReverse && (
            <div className="flex gap-2">
              <button
                onClick={() => setMode('edit')}
                className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
                  mode === 'edit'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                แก้ไขหมายเหตุ
              </button>
              <button
                onClick={() => setMode('reverse')}
                className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
                  mode === 'reverse'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <RotateCcw className="mr-1 inline h-4 w-4" />
                ยกเลิกรายการ
              </button>
            </div>
          )}

          {mode === 'edit' && (
            <div>
              <Label htmlFor="notes">หมายเหตุ</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="ระบุหมายเหตุสำหรับการเคลื่อนไหวสินค้านี้"
                disabled={loading}
                rows={3}
              />
            </div>
          )}

          {mode === 'reverse' && (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 text-yellow-600" />
                <div className="text-sm text-yellow-800">
                  <p className="font-semibold">ยกเลิกการเคลื่อนไหวสินค้า</p>
                  <p className="mt-1 text-xs">
                    ระบบจะสร้างรายการย้อนกลับเพื่อแก้ไขสต็อกให้กลับเป็นค่าเดิม
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading || reversing}
          >
            ปิด
          </Button>
          {mode === 'edit' && (
            <Button
              onClick={handleSaveNotes}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              บันทึกหมายเหตุ
            </Button>
          )}
          {mode === 'reverse' && (
            <Button
              onClick={handleReverse}
              disabled={reversing}
              className="bg-red-600 hover:bg-red-700"
            >
              {reversing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              ยืนยันการยกเลิก
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
