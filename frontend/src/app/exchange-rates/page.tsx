"use client";

import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { useExchangeRates, useCreateExchangeRate } from "@/hooks/useApi";
import { formatThaiDate } from "@/lib/utils";
import { Plus, ArrowLeftRight, X } from "lucide-react";

const currencies = ["THB", "USD", "EUR", "CNY", "JPY", "GBP"];

const adjTypeLabels: Record<string, string> = {
  manual: "กำหนดเอง",
  default: "ค่าเริ่มต้น",
};

const adjTypeColors: Record<string, string> = {
  manual: "bg-blue-50 text-blue-700",
  default: "bg-gray-100 text-gray-600",
};

export default function ExchangeRatesPage() {
  const { data: rates, isLoading } = useExchangeRates();
  const createRate = useCreateExchangeRate();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    from_currency: "USD",
    to_currency: "THB",
    rate: "",
    effective_date: new Date().toISOString().split("T")[0],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createRate.mutateAsync({
        from_currency: form.from_currency,
        to_currency: form.to_currency,
        rate: parseFloat(form.rate),
        effective_date: form.effective_date,
      });
      setShowForm(false);
      setForm({
        from_currency: "USD",
        to_currency: "THB",
        rate: "",
        effective_date: new Date().toISOString().split("T")[0],
      });
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
    }
  };

  return (
    <AppLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <ArrowLeftRight className="w-7 h-7 text-peak-purple" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">อัตราแลกเปลี่ยน</h1>
              <p className="text-gray-500 mt-1">Exchange Rates</p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-peak-purple to-peak-teal text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? "ยกเลิก" : "เพิ่มอัตรา"}
          </button>
        </div>

        {/* Create Form */}
        {showForm && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8 max-w-2xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">เพิ่มอัตราแลกเปลี่ยน</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">จากสกุลเงิน</label>
                  <select
                    value={form.from_currency}
                    onChange={(e) => setForm({ ...form, from_currency: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple"
                  >
                    {currencies.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">เป็นสกุลเงิน</label>
                  <select
                    value={form.to_currency}
                    onChange={(e) => setForm({ ...form, to_currency: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple"
                  >
                    {currencies.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">อัตรา</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={form.rate}
                    onChange={(e) => setForm({ ...form, rate: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple"
                    placeholder="36.50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">วันที่มีผล</label>
                  <input
                    type="date"
                    value={form.effective_date}
                    onChange={(e) => setForm({ ...form, effective_date: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={createRate.isPending}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-peak-purple to-peak-teal text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {createRate.isPending ? "กำลังบันทึก..." : "บันทึก"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Rates Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">กำลังโหลด...</div>
          ) : rates?.length === 0 ? (
            <div className="p-8 text-center text-gray-500">ยังไม่มีอัตราแลกเปลี่ยน</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">จาก</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">เป็น</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-gray-700">อัตรา</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">วันที่มีผล</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">แหล่งที่มา</th>
                </tr>
              </thead>
              <tbody>
                {rates?.map((rate: any) => (
                  <tr key={rate.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{rate.from_currency}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{rate.to_currency}</td>
                    <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                      {parseFloat(rate.rate).toFixed(6)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{formatThaiDate(rate.effective_date)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${adjTypeColors[rate.source] || "bg-gray-100 text-gray-600"}`}>
                        {adjTypeLabels[rate.source] || rate.source}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
