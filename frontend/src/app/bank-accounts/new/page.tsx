"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppLayout from "@/components/AppLayout";
import { useCreateBankAccount, useChartOfAccounts } from "@/hooks/useApi";
import { ArrowLeft, Wallet, Landmark, Smartphone } from "lucide-react";

const typeConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  cash: { label: "เงินสด", icon: <Wallet className="w-5 h-5" />, color: "bg-green-50 text-green-600 border-green-200" },
  bank: { label: "ธนาคาร", icon: <Landmark className="w-5 h-5" />, color: "bg-blue-50 text-blue-600 border-blue-200" },
  promptpay: { label: "PromptPay", icon: <Smartphone className="w-5 h-5" />, color: "bg-purple-50 text-purple-600 border-purple-200" },
};

export default function CreateBankAccountPage() {
  const router = useRouter();
  const createBankAccount = useCreateBankAccount();
  const { data: coaAccounts } = useChartOfAccounts();

  const [form, setForm] = useState({
    name: "",
    account_number: "",
    bank_name: "",
    account_type: "bank",
    opening_balance: "0",
    promptpay_number: "",
    gl_account_id: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return;

    setIsSubmitting(true);
    try {
      await createBankAccount.mutateAsync({
        name: form.name,
        account_number: form.account_number || undefined,
        bank_name: form.bank_name || undefined,
        account_type: form.account_type,
        opening_balance: parseFloat(form.opening_balance) || 0,
        promptpay_number: form.promptpay_number || undefined,
        gl_account_id: form.gl_account_id || undefined,
      });
      router.push("/bank-accounts");
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsSubmitting(false);
    }
  };

  const assetAccounts = coaAccounts?.filter((a: any) => a.account_type === "asset" || a.account_code?.startsWith("1"));

  return (
    <AppLayout>
      <div className="p-8 max-w-3xl">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/bank-accounts" className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">เพิ่มบัญชีธนาคาร / เงินสด</h1>
            <p className="text-gray-500 mt-1">กรอกข้อมูลบัญชีใหม่</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">ประเภทบัญชี</h2>
            <div className="grid grid-cols-3 gap-3">
              {["cash", "bank", "promptpay"].map((type) => {
                const config = typeConfig[type];
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleChange("account_type", type)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                      form.account_type === type
                        ? `${config.color} border-current`
                        : "bg-white border-gray-200 hover:border-gray-300 text-gray-600"
                    }`}
                  >
                    {config.icon}
                    <span className="text-sm font-medium">{config.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">ข้อมูลบัญชี</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อบัญชี *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  required
                  placeholder="เช่น บัญชีกสิกรไทย, เงินสดในมือ"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple"
                />
              </div>
              {form.account_type !== "cash" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">เลขบัญชี</label>
                    <input
                      type="text"
                      value={form.account_number}
                      onChange={(e) => handleChange("account_number", e.target.value)}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อธนาคาร</label>
                    <input
                      type="text"
                      value={form.bank_name}
                      onChange={(e) => handleChange("bank_name", e.target.value)}
                      placeholder="เช่น กสิกรไทย, ไทยพาณิชย์"
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple"
                    />
                  </div>
                </>
              )}
              {form.account_type === "promptpay" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">หมายเลข PromptPay</label>
                  <input
                    type="text"
                    value={form.promptpay_number}
                    onChange={(e) => handleChange("promptpay_number", e.target.value)}
                    maxLength={15}
                    placeholder="เบอร์โทรหรือเลขบัตรประชาชน"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ยอดเริ่มต้น</label>
                <input
                  type="number"
                  value={form.opening_balance}
                  onChange={(e) => handleChange("opening_balance", e.target.value)}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">บัญชี GL</label>
                <select
                  value={form.gl_account_id}
                  onChange={(e) => handleChange("gl_account_id", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple"
                >
                  <option value="">เลือกบัญชี GL</option>
                  {assetAccounts?.map((a: any) => (
                    <option key={a.id} value={a.id}>
                      {a.account_code} - {a.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Link
              href="/bank-accounts"
              className="px-6 py-2.5 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              ยกเลิก
            </Link>
            <button
              type="submit"
              disabled={isSubmitting || !form.name}
              className="px-6 py-2.5 bg-gradient-to-r from-peak-purple to-peak-teal text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "กำลังบันทึก..." : "บันทึก"}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
