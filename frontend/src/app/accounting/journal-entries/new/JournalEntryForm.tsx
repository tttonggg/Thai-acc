"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppLayout from "@/components/AppLayout";
import { useChartOfAccounts, useCreateJournalEntry } from "@/hooks/useApi";
import { formatCurrency } from "@/lib/utils";
import { Plus, Trash2, ArrowLeft, AlertCircle } from "lucide-react";

interface JELine {
  id: number;
  account_id: string;
  description: string;
  debit: string;
  credit: string;
}

export default function JournalEntryForm() {
  const router = useRouter();
  const { data: accounts } = useChartOfAccounts();
  const createJE = useCreateJournalEntry();

  const [entryDate, setEntryDate] = useState(new Date().toISOString().split("T")[0]);
  const [reference, setReference] = useState("");
  const [description, setDescription] = useState("");
  const [lines, setLines] = useState<JELine[]>([
    { id: 1, account_id: "", description: "", debit: "", credit: "" },
    { id: 2, account_id: "", description: "", debit: "", credit: "" },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const addLine = () => {
    setLines([...lines, { id: Date.now(), account_id: "", description: "", debit: "", credit: "" }]);
  };

  const removeLine = (id: number) => {
    if (lines.length <= 2) return;
    setLines(lines.filter((l) => l.id !== id));
  };

  const updateLine = (id: number, field: keyof JELine, value: string) => {
    setLines(lines.map((l) => (l.id === id ? { ...l, [field]: value } : l)));
  };

  const totalDebit = lines.reduce((sum, l) => sum + (parseFloat(l.debit) || 0), 0);
  const totalCredit = lines.reduce((sum, l) => sum + (parseFloat(l.credit) || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.001;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!isBalanced) {
      setError("ยอดเดบิตและเครดิตต้องเท่ากัน");
      return;
    }
    if (totalDebit === 0) {
      setError("กรุณากรอกยอดเงินอย่างน้อย 1 รายการ");
      return;
    }
    const hasEmptyAccount = lines.some((l) => !l.account_id && (parseFloat(l.debit) > 0 || parseFloat(l.credit) > 0));
    if (hasEmptyAccount) {
      setError("กรุณาเลือกบัญชีสำหรับทุกรายการที่มียอดเงิน");
      return;
    }

    setIsSubmitting(true);
    try {
      await createJE.mutateAsync({
        entry_date: entryDate,
        reference: reference || undefined,
        description: description || undefined,
        lines: lines
          .filter((l) => parseFloat(l.debit) > 0 || parseFloat(l.credit) > 0)
          .map((l) => ({
            account_id: l.account_id,
            description: l.description || undefined,
            debit_amount: parseFloat(l.debit) || 0,
            credit_amount: parseFloat(l.credit) || 0,
          })),
      });
      router.push("/accounting/journal-entries");
    } catch (err: any) {
      setError(err.response?.data?.detail || "เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="p-8 max-w-5xl">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/accounting/journal-entries" className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">บันทึกบัญชีใหม่</h1>
            <p className="text-gray-500 mt-1">Manual Journal Entry</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-2 px-4 py-3 bg-red-50 text-red-700 rounded-lg">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Header info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">วันที่ *</label>
                <input
                  type="date"
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">เลขที่อ้างอิง</label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="REF-001"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">รายละเอียด</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="รายละเอียดการบันทึกบัญชี"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple"
                />
              </div>
            </div>
          </div>

          {/* Lines */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">รายการบัญชี</h2>
              <button
                type="button"
                onClick={addLine}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-peak-purple bg-peak-purple/10 rounded-lg hover:bg-peak-purple/20 transition-colors"
              >
                <Plus className="w-4 h-4" />
                เพิ่มรายการ
              </button>
            </div>

            <div className="space-y-3">
              {lines.map((line) => (
                <div key={line.id} className="grid grid-cols-12 gap-3 items-start p-3 bg-gray-50 rounded-lg">
                  <div className="col-span-4">
                    <select
                      value={line.account_id}
                      onChange={(e) => updateLine(line.id, "account_id", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple"
                    >
                      <option value="">เลือกบัญชี</option>
                      {accounts?.map((acc: any) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.code} - {acc.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-4">
                    <input
                      type="text"
                      placeholder="รายละเอียด"
                      value={line.description}
                      onChange={(e) => updateLine(line.id, "description", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      placeholder="เดบิต"
                      value={line.debit}
                      onChange={(e) => updateLine(line.id, "debit", e.target.value)}
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      placeholder="เครดิต"
                      value={line.credit}
                      onChange={(e) => updateLine(line.id, "credit", e.target.value)}
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple"
                    />
                  </div>
                  <div className="absolute right-2 top-2">
                    <button
                      type="button"
                      onClick={() => removeLine(line.id)}
                      className="text-red-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Balance check */}
            <div className="mt-4 flex items-center justify-between px-4 py-3 rounded-lg bg-gray-50">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">ยอดรวม:</span>
                <span className={`text-sm font-bold ${isBalanced ? "text-green-600" : "text-red-600"}`}>
                  {isBalanced ? "สมดุล" : "ไม่สมดุล"}
                </span>
              </div>
              <div className="flex gap-8">
                <div className="text-right">
                  <span className="text-xs text-gray-500">เดบิตรวม</span>
                  <p className="text-sm font-bold text-gray-900">{formatCurrency(totalDebit)}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-gray-500">เครดิตรวม</span>
                  <p className="text-sm font-bold text-gray-900">{formatCurrency(totalCredit)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Link
              href="/accounting/journal-entries"
              className="px-6 py-2.5 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              ยกเลิก
            </Link>
            <button
              type="submit"
              disabled={isSubmitting || !isBalanced}
              className="px-6 py-2.5 bg-gradient-to-r from-peak-purple to-peak-teal text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "กำลังบันทึก..." : "บันทึกบัญชี"}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
