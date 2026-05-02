"use client";

import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { useTrialBalance, useIncomeStatement, useBalanceSheet, useARAging, useAPAging } from "@/hooks/useApi";
import { formatCurrency } from "@/lib/utils";
import { BarChart3, TrendingUp, Scale, ClipboardList, Users, UserCheck } from "lucide-react";

function getFirstDayOfYear() {
  const d = new Date();
  return `${d.getFullYear()}-01-01`;
}

function getToday() {
  return new Date().toISOString().split("T")[0];
}

type Tab = "trial-balance" | "income-statement" | "balance-sheet" | "ar-aging" | "ap-aging";

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("trial-balance");
  const [tbDate, setTbDate] = useState(getToday());
  const [isFromDate, setIsFromDate] = useState(getFirstDayOfYear());
  const [isToDate, setIsToDate] = useState(getToday());
  const [bsDate, setBsDate] = useState(getToday());
  const [arDate, setArDate] = useState(getToday());
  const [apDate, setApDate] = useState(getToday());

  const { data: tbData, isLoading: tbLoading } = useTrialBalance({ as_of: tbDate });
  const { data: isData, isLoading: isLoading } = useIncomeStatement({ from_date: isFromDate, to_date: isToDate });
  const { data: bsData, isLoading: bsLoading } = useBalanceSheet({ as_of: bsDate });
  const { data: arData, isLoading: arLoading } = useARAging({ as_of: arDate });
  const { data: apData, isLoading: apLoading } = useAPAging({ as_of: apDate });

  const tabs = [
    { id: "trial-balance" as Tab, label: "งบทดลอง", icon: ClipboardList },
    { id: "income-statement" as Tab, label: "งบกำไรขาดทุน", icon: TrendingUp },
    { id: "balance-sheet" as Tab, label: "งบดุล", icon: Scale },
    { id: "ar-aging" as Tab, label: "ลูกหนี้ Aging", icon: Users },
    { id: "ap-aging" as Tab, label: "เจ้าหนี้ Aging", icon: UserCheck },
  ];

  return (
    <AppLayout>
      <div className="p-8">
        <div className="flex items-center gap-3 mb-8">
          <BarChart3 className="w-7 h-7 text-peak-purple" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">รายงานทางบัญชี</h1>
            <p className="text-gray-500 mt-1">Accounting Reports</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-peak-purple text-peak-purple"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Trial Balance */}
        {activeTab === "trial-balance" && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <label className="text-sm font-medium text-gray-700 mr-3">ณ วันที่</label>
              <input
                type="date"
                value={tbDate}
                onChange={(e) => setTbDate(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple"
              />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {tbLoading ? (
                <div className="p-8 text-center text-gray-500">กำลังโหลด...</div>
              ) : (
                <>
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/50">
                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">รหัส</th>
                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">ชื่อบัญชี</th>
                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">ประเภท</th>
                        <th className="text-right px-6 py-4 text-sm font-semibold text-gray-700">เดบิต</th>
                        <th className="text-right px-6 py-4 text-sm font-semibold text-gray-700">เครดิต</th>
                        <th className="text-right px-6 py-4 text-sm font-semibold text-gray-700">ยอดคงเหลือ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tbData?.items?.map((item: any) => (
                        <tr key={item.account_id} className="border-b border-gray-50 hover:bg-gray-50/50">
                          <td className="px-6 py-3 font-mono text-sm text-gray-900">{item.code}</td>
                          <td className="px-6 py-3 text-sm text-gray-900">{item.name}</td>
                          <td className="px-6 py-3 text-sm text-gray-600">{item.account_type}</td>
                          <td className="px-6 py-3 text-right text-sm text-gray-900">{formatCurrency(item.total_debit)}</td>
                          <td className="px-6 py-3 text-right text-sm text-gray-900">{formatCurrency(item.total_credit)}</td>
                          <td className="px-6 py-3 text-right text-sm font-medium text-gray-900">{formatCurrency(item.balance)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-50 font-semibold">
                        <td colSpan={3} className="px-6 py-4 text-sm text-gray-900">รวมทั้งสิ้น</td>
                        <td className="px-6 py-4 text-right text-sm text-gray-900">{formatCurrency(tbData?.grand_total_debit)}</td>
                        <td className="px-6 py-4 text-right text-sm text-gray-900">{formatCurrency(tbData?.grand_total_credit)}</td>
                        <td className="px-6 py-4 text-right text-sm text-gray-900">-</td>
                      </tr>
                    </tfoot>
                  </table>
                </>
              )}
            </div>
          </div>
        )}

        {/* Income Statement */}
        {activeTab === "income-statement" && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex gap-4 items-center">
              <div>
                <label className="text-sm font-medium text-gray-700 mr-2">ตั้งแต่</label>
                <input
                  type="date"
                  value={isFromDate}
                  onChange={(e) => setIsFromDate(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mr-2">ถึง</label>
                <input
                  type="date"
                  value={isToDate}
                  onChange={(e) => setIsToDate(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple"
                />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {isLoading ? (
                <div className="p-8 text-center text-gray-500">กำลังโหลด...</div>
              ) : (
                <div className="p-6 space-y-8">
                  {/* Revenue */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">รายได้</h3>
                    {isData?.revenue_items?.length === 0 ? (
                      <p className="text-sm text-gray-500">ไม่มีข้อมูลรายได้ในช่วงเวลานี้</p>
                    ) : (
                      <div className="space-y-2">
                        {isData?.revenue_items?.map((item: any) => (
                          <div key={item.account_id} className="flex justify-between py-2 border-b border-gray-50">
                            <span className="text-sm text-gray-700">{item.code} - {item.name}</span>
                            <span className="text-sm font-medium text-gray-900">{formatCurrency(item.amount)}</span>
                          </div>
                        ))}
                        <div className="flex justify-between pt-3 font-bold text-green-700">
                          <span>รายได้รวม</span>
                          <span>{formatCurrency(isData?.total_revenue)}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Expenses */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">ค่าใช้จ่าย</h3>
                    {isData?.expense_items?.length === 0 ? (
                      <p className="text-sm text-gray-500">ไม่มีข้อมูลค่าใช้จ่ายในช่วงเวลานี้</p>
                    ) : (
                      <div className="space-y-2">
                        {isData?.expense_items?.map((item: any) => (
                          <div key={item.account_id} className="flex justify-between py-2 border-b border-gray-50">
                            <span className="text-sm text-gray-700">{item.code} - {item.name}</span>
                            <span className="text-sm font-medium text-gray-900">{formatCurrency(item.amount)}</span>
                          </div>
                        ))}
                        <div className="flex justify-between pt-3 font-bold text-red-700">
                          <span>ค่าใช้จ่ายรวม</span>
                          <span>{formatCurrency(isData?.total_expenses)}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Net Income */}
                  <div className="pt-4 border-t-2 border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-bold text-gray-900">กำไรสุทธิ / (ขาดทุนสุทธิ)</span>
                      <span className={`text-2xl font-bold ${(isData?.net_income || 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {formatCurrency(isData?.net_income)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Balance Sheet */}
        {activeTab === "balance-sheet" && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <label className="text-sm font-medium text-gray-700 mr-3">ณ วันที่</label>
              <input
                type="date"
                value={bsDate}
                onChange={(e) => setBsDate(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple"
              />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {bsLoading ? (
                <div className="p-8 text-center text-gray-500">กำลังโหลด...</div>
              ) : (
                <div className="p-6 space-y-8">
                  {/* Assets */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">สินทรัพย์</h3>
                    {bsData?.asset_items?.length === 0 ? (
                      <p className="text-sm text-gray-500">ไม่มีข้อมูลสินทรัพย์</p>
                    ) : (
                      <div className="space-y-2">
                        {bsData?.asset_items?.map((item: any) => (
                          <div key={item.account_id} className="flex justify-between py-2 border-b border-gray-50">
                            <span className="text-sm text-gray-700">{item.code} - {item.name}</span>
                            <span className="text-sm font-medium text-gray-900">{formatCurrency(item.amount)}</span>
                          </div>
                        ))}
                        <div className="flex justify-between pt-3 font-bold text-blue-700">
                          <span>สินทรัพย์รวม</span>
                          <span>{formatCurrency(bsData?.total_assets)}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Liabilities */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">หนี้สิน</h3>
                    {bsData?.liability_items?.length === 0 ? (
                      <p className="text-sm text-gray-500">ไม่มีข้อมูลหนี้สิน</p>
                    ) : (
                      <div className="space-y-2">
                        {bsData?.liability_items?.map((item: any) => (
                          <div key={item.account_id} className="flex justify-between py-2 border-b border-gray-50">
                            <span className="text-sm text-gray-700">{item.code} - {item.name}</span>
                            <span className="text-sm font-medium text-gray-900">{formatCurrency(item.amount)}</span>
                          </div>
                        ))}
                        <div className="flex justify-between pt-3 font-bold text-red-700">
                          <span>หนี้สินรวม</span>
                          <span>{formatCurrency(bsData?.total_liabilities)}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Equity */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">ทุน</h3>
                    {bsData?.equity_items?.length === 0 ? (
                      <p className="text-sm text-gray-500">ไม่มีข้อมูลทุน</p>
                    ) : (
                      <div className="space-y-2">
                        {bsData?.equity_items?.map((item: any) => (
                          <div key={item.account_id} className="flex justify-between py-2 border-b border-gray-50">
                            <span className="text-sm text-gray-700">{item.code} - {item.name}</span>
                            <span className="text-sm font-medium text-gray-900">{formatCurrency(item.amount)}</span>
                          </div>
                        ))}
                        <div className="flex justify-between pt-3 font-bold text-purple-700">
                          <span>ทุนรวม</span>
                          <span>{formatCurrency(bsData?.total_equity)}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Check */}
                  <div className="pt-4 border-t-2 border-gray-200 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-base font-bold text-gray-900">สินทรัพย์รวม</span>
                      <span className="text-base font-bold text-blue-700">{formatCurrency(bsData?.total_assets)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-base font-bold text-gray-900">หนี้สิน + ทุน รวม</span>
                      <span className="text-base font-bold text-purple-700">{formatCurrency(bsData?.liabilities_plus_equity)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-sm text-gray-500">ความสมดุล</span>
                      <span className={`text-sm font-bold ${(bsData?.total_assets || 0) === (bsData?.liabilities_plus_equity || 0) ? "text-green-600" : "text-red-600"}`}>
                        {(bsData?.total_assets || 0) === (bsData?.liabilities_plus_equity || 0) ? "สมดุล" : "ไม่สมดุล"}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* AR Aging */}
        {activeTab === "ar-aging" && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <label className="text-sm font-medium text-gray-700 mr-3">ณ วันที่</label>
              <input
                type="date"
                value={arDate}
                onChange={(e) => setArDate(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple"
              />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
              {[
                { key: "grand_current", label: "ปัจจุบัน", color: "bg-green-50 text-green-700" },
                { key: "grand_1_30", label: "1-30 วัน", color: "bg-yellow-50 text-yellow-700" },
                { key: "grand_31_60", label: "31-60 วัน", color: "bg-orange-50 text-orange-700" },
                { key: "grand_61_90", label: "61-90 วัน", color: "bg-red-50 text-red-700" },
                { key: "grand_over_90", label: "90+ วัน", color: "bg-red-100 text-red-800" },
                { key: "grand_total", label: "รวม", color: "bg-gray-50 text-gray-900" },
              ].map((b) => (
                <div key={b.key} className={`rounded-xl border p-4 ${b.color.split(" ")[1]} border-opacity-20`}>
                  <p className="text-xs font-medium opacity-70">{b.label}</p>
                  <p className="text-lg font-bold mt-1">{formatCurrency((arData as any)?.[b.key] || 0)}</p>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {arLoading ? (
                <div className="p-8 text-center text-gray-500">กำลังโหลด...</div>
              ) : !arData?.items?.length ? (
                <div className="p-8 text-center text-gray-500">ไม่มีลูกหนี้ค้างชำระ</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      <th className="text-left px-6 py-4 font-semibold text-gray-700">ลูกค้า</th>
                      <th className="text-right px-4 py-4 font-semibold text-gray-700">ปัจจุบัน</th>
                      <th className="text-right px-4 py-4 font-semibold text-gray-700">1-30</th>
                      <th className="text-right px-4 py-4 font-semibold text-gray-700">31-60</th>
                      <th className="text-right px-4 py-4 font-semibold text-gray-700">61-90</th>
                      <th className="text-right px-4 py-4 font-semibold text-gray-700">90+</th>
                      <th className="text-right px-6 py-4 font-semibold text-gray-700">รวม</th>
                    </tr>
                  </thead>
                  <tbody>
                    {arData.items.map((item: any) => (
                      <tr key={item.contact_id} className="border-b border-gray-50 hover:bg-gray-50/50">
                        <td className="px-6 py-4 font-medium text-gray-900">{item.contact_name}</td>
                        <td className="px-4 py-4 text-right text-green-700">{formatCurrency(item.current)}</td>
                        <td className="px-4 py-4 text-right text-yellow-700">{formatCurrency(item.days_1_30)}</td>
                        <td className="px-4 py-4 text-right text-orange-700">{formatCurrency(item.days_31_60)}</td>
                        <td className="px-4 py-4 text-right text-red-700">{formatCurrency(item.days_61_90)}</td>
                        <td className="px-4 py-4 text-right text-red-800">{formatCurrency(item.days_over_90)}</td>
                        <td className="px-6 py-4 text-right font-bold text-gray-900">{formatCurrency(item.total_outstanding)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50 font-semibold">
                      <td className="px-6 py-4 text-gray-900">รวม</td>
                      <td className="px-4 py-4 text-right text-green-700">{formatCurrency(arData.grand_current)}</td>
                      <td className="px-4 py-4 text-right text-yellow-700">{formatCurrency(arData.grand_1_30)}</td>
                      <td className="px-4 py-4 text-right text-orange-700">{formatCurrency(arData.grand_31_60)}</td>
                      <td className="px-4 py-4 text-right text-red-700">{formatCurrency(arData.grand_61_90)}</td>
                      <td className="px-4 py-4 text-right text-red-800">{formatCurrency(arData.grand_over_90)}</td>
                      <td className="px-6 py-4 text-right text-gray-900">{formatCurrency(arData.grand_total)}</td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          </div>
        )}

        {/* AP Aging */}
        {activeTab === "ap-aging" && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <label className="text-sm font-medium text-gray-700 mr-3">ณ วันที่</label>
              <input
                type="date"
                value={apDate}
                onChange={(e) => setApDate(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple"
              />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
              {[
                { key: "grand_current", label: "ปัจจุบัน", color: "bg-green-50 text-green-700" },
                { key: "grand_1_30", label: "1-30 วัน", color: "bg-yellow-50 text-yellow-700" },
                { key: "grand_31_60", label: "31-60 วัน", color: "bg-orange-50 text-orange-700" },
                { key: "grand_61_90", label: "61-90 วัน", color: "bg-red-50 text-red-700" },
                { key: "grand_over_90", label: "90+ วัน", color: "bg-red-100 text-red-800" },
                { key: "grand_total", label: "รวม", color: "bg-gray-50 text-gray-900" },
              ].map((b) => (
                <div key={b.key} className={`rounded-xl border p-4 ${b.color.split(" ")[1]} border-opacity-20`}>
                  <p className="text-xs font-medium opacity-70">{b.label}</p>
                  <p className="text-lg font-bold mt-1">{formatCurrency((apData as any)?.[b.key] || 0)}</p>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {apLoading ? (
                <div className="p-8 text-center text-gray-500">กำลังโหลด...</div>
              ) : !apData?.items?.length ? (
                <div className="p-8 text-center text-gray-500">ไม่มีเจ้าหนี้ค้างชำระ</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      <th className="text-left px-6 py-4 font-semibold text-gray-700">ผู้จำหน่าย</th>
                      <th className="text-right px-4 py-4 font-semibold text-gray-700">ปัจจุบัน</th>
                      <th className="text-right px-4 py-4 font-semibold text-gray-700">1-30</th>
                      <th className="text-right px-4 py-4 font-semibold text-gray-700">31-60</th>
                      <th className="text-right px-4 py-4 font-semibold text-gray-700">61-90</th>
                      <th className="text-right px-4 py-4 font-semibold text-gray-700">90+</th>
                      <th className="text-right px-6 py-4 font-semibold text-gray-700">รวม</th>
                    </tr>
                  </thead>
                  <tbody>
                    {apData.items.map((item: any) => (
                      <tr key={item.contact_id} className="border-b border-gray-50 hover:bg-gray-50/50">
                        <td className="px-6 py-4 font-medium text-gray-900">{item.contact_name}</td>
                        <td className="px-4 py-4 text-right text-green-700">{formatCurrency(item.current)}</td>
                        <td className="px-4 py-4 text-right text-yellow-700">{formatCurrency(item.days_1_30)}</td>
                        <td className="px-4 py-4 text-right text-orange-700">{formatCurrency(item.days_31_60)}</td>
                        <td className="px-4 py-4 text-right text-red-700">{formatCurrency(item.days_61_90)}</td>
                        <td className="px-4 py-4 text-right text-red-800">{formatCurrency(item.days_over_90)}</td>
                        <td className="px-6 py-4 text-right font-bold text-gray-900">{formatCurrency(item.total_outstanding)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50 font-semibold">
                      <td className="px-6 py-4 text-gray-900">รวม</td>
                      <td className="px-4 py-4 text-right text-green-700">{formatCurrency(apData.grand_current)}</td>
                      <td className="px-4 py-4 text-right text-yellow-700">{formatCurrency(apData.grand_1_30)}</td>
                      <td className="px-4 py-4 text-right text-orange-700">{formatCurrency(apData.grand_31_60)}</td>
                      <td className="px-4 py-4 text-right text-red-700">{formatCurrency(apData.grand_61_90)}</td>
                      <td className="px-4 py-4 text-right text-red-800">{formatCurrency(apData.grand_over_90)}</td>
                      <td className="px-6 py-4 text-right text-gray-900">{formatCurrency(apData.grand_total)}</td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
