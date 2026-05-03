"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import AppLayout from "@/components/AppLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useContacts, useProjects } from "@/hooks/useApi";
import { formatCurrency } from "@/lib/utils";
import { ArrowLeft, Lock } from "lucide-react";

const categories = [
  { value: "travel", label: "ค่าเดินทาง" },
  { value: "meal", label: "ค่าอาหาร" },
  { value: "office", label: "ค่าอุปกรณ์สำนักงาน" },
  { value: "supplies", label: "ค่าวัสดุสิ้นเปลือง" },
  { value: "transportation", label: "ค่าขนส่ง" },
  { value: "other", label: "อื่น ๆ" },
];

export default function EditExpenseClaimPage() {
  const params = useParams();
  const router = useRouter();
  const claimId = params.id as string;
  const queryClient = useQueryClient();
  const { data: contacts } = useContacts();
  const { data: projects } = useProjects();

  const { data: claim, isLoading } = useQuery({
    queryKey: ["expense-claim", claimId],
    queryFn: () => api.get(`/expense-claims/${claimId}`).then((res) => res.data),
  });

  const updateClaim = useMutation({
    mutationFn: (data: any) => api.put(`/expense-claims/${claimId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-claims"] });
      queryClient.invalidateQueries({ queryKey: ["expense-claim", claimId] });
      router.push(`/expenses/expense-claims/${claimId}`);
    },
  });

  const [employeeName, setEmployeeName] = useState("");
  const [expenseDate, setExpenseDate] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("0");
  const [vatAmount, setVatAmount] = useState("0");
  const [contactId, setContactId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (claim) {
      setEmployeeName(claim.employee_name || "");
      setExpenseDate(claim.expense_date || "");
      setCategory(claim.category || "");
      setDescription(claim.description || "");
      setAmount(claim.amount?.toString() || "0");
      setVatAmount(claim.vat_amount?.toString() || "0");
      setContactId(claim.contact_id || "");
      setProjectId(claim.project_id || "");
      setNotes(claim.notes || "");
    }
  }, [claim]);

  const totalAmount = (parseFloat(amount) || 0) + (parseFloat(vatAmount) || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeName || !category) return;

    await updateClaim.mutateAsync({
      employee_name: employeeName,
      expense_date: expenseDate,
      category,
      description: description || undefined,
      amount: parseFloat(amount),
      vat_amount: parseFloat(vatAmount),
      contact_id: contactId || undefined,
      project_id: projectId || undefined,
      notes: notes || undefined,
    });
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="p-8 text-center">กำลังโหลด...</div>
      </AppLayout>
    );
  }

  if (!claim) {
    return (
      <AppLayout>
        <div className="p-8 text-center">ไม่พบใบเบิกค่าใช้จ่าย</div>
      </AppLayout>
    );
  }

  if (!["draft", "rejected"].includes(claim.status)) {
    return (
      <AppLayout>
        <div className="p-8 max-w-3xl">
          <div className="flex items-center gap-4 mb-8">
            <Link href={`/expenses/expense-claims/${claimId}`} className="text-gray-500 hover:text-gray-700">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">แก้ไขใบเบิกค่าใช้จ่าย</h1>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <Lock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">ไม่สามารถแก้ไขได้</h2>
            <p className="text-gray-500">
              ใบเบิกนี้อยู่ในสถานะ {claim.status} ไม่สามารถแก้ไขได้
            </p>
            <Link
              href={`/expenses/expense-claims/${claimId}`}
              className="inline-block mt-4 px-6 py-2.5 bg-gradient-to-r from-peak-purple to-peak-teal text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              กลับไปหน้ารายละเอียด
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-8 max-w-3xl">
        <div className="flex items-center gap-4 mb-8">
          <Link href={`/expenses/expense-claims/${claimId}`} className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">แก้ไขใบเบิกค่าใช้จ่าย</h1>
            <p className="text-gray-500 mt-1">{claim.claim_number}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">ข้อมูลทั่วไป</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อพนักงาน *</label>
                <input
                  type="text"
                  value={employeeName}
                  onChange={(e) => setEmployeeName(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">วันที่ใช้จ่าย *</label>
                <input
                  type="date"
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">หมวดหมู่ *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple"
                >
                  <option value="">เลือกหมวดหมู่</option>
                  {categories.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ผู้จำหน่าย (ถ้ามี)</label>
                <select
                  value={contactId}
                  onChange={(e) => setContactId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple"
                >
                  <option value="">เลือกผู้จำหน่าย</option>
                  {contacts?.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">รายละเอียด</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">โครงการ (ถ้ามี)</label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple"
                >
                  <option value="">เลือกโครงการ</option>
                  {projects?.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.project_code} - {p.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">ยอดเงิน</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">จำนวนเงิน *</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="0"
                  step="0.01"
                  required
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ภาษีมูลค่าเพิ่ม</label>
                <input
                  type="number"
                  value={vatAmount}
                  onChange={(e) => setVatAmount(e.target.value)}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple"
                />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between border-t pt-4">
              <span className="text-base font-bold text-gray-900">ยอดรวมสุทธิ:</span>
              <span className="text-base font-bold text-peak-purple">{formatCurrency(totalAmount)}</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">หมายเหตุ</h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple"
            />
          </div>

          <div className="flex justify-end gap-4">
            <Link
              href={`/expenses/expense-claims/${claimId}`}
              className="px-6 py-2.5 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              ยกเลิก
            </Link>
            <button
              type="submit"
              disabled={updateClaim.isPending || !employeeName || !category}
              className="px-6 py-2.5 bg-gradient-to-r from-peak-purple to-peak-teal text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updateClaim.isPending ? "กำลังบันทึก..." : "บันทึก"}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
