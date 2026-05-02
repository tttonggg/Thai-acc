"use client";

import { useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import AppLayout from "@/components/AppLayout";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useBankAccountTransactions, useReconcileLines } from "@/hooks/useApi";
import { formatCurrency } from "@/lib/utils";
import { formatThaiDate } from "@/lib/utils";
import {
  ArrowLeft,
  Landmark,
  Wallet,
  Smartphone,
  CheckSquare,
  Square,
  Calendar,
  Filter,
  Save,
  Upload,
  FileText,
  Trash2,
  ChevronDown,
  ChevronUp,
  Link2,
  X,
} from "lucide-react";
import {
  useStatementImports,
  useImportStatement,
  useStatementLines,
  useMatchSuggestions,
  useMatchStatementLine,
  useDeleteStatementImport,
} from "@/hooks/useApi";

const typeConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  cash: { label: "เงินสด", icon: <Wallet className="w-5 h-5" />, color: "bg-green-50 text-green-600" },
  bank: { label: "ธนาคาร", icon: <Landmark className="w-5 h-5" />, color: "bg-blue-50 text-blue-600" },
  promptpay: { label: "PromptPay", icon: <Smartphone className="w-5 h-5" />, color: "bg-purple-50 text-purple-600" },
};

export default function BankAccountDetailPage() {
  const params = useParams();
  const accountId = params.id as string;

  const { data: account } = useQuery({
    queryKey: ["bank-account", accountId],
    queryFn: () => api.get(`/bank-accounts/${accountId}`).then((res) => res.data),
    enabled: !!accountId,
  });

  const [showReconciled, setShowReconciled] = useState("N");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedLines, setSelectedLines] = useState<Set<string>>(new Set());
  const [showImports, setShowImports] = useState(false);
  const [expandedImport, setExpandedImport] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: statementImports, isLoading: importsLoading } = useStatementImports(accountId);
  const importMutation = useImportStatement();
  const deleteImportMutation = useDeleteStatementImport();

  const { data: statementLines } = useStatementLines(
    accountId,
    expandedImport || "",
    true
  );
  const { data: matchSuggestions } = useMatchSuggestions(
    accountId,
    expandedImport || ""
  );
  const matchLineMutation = useMatchStatementLine();

  const { data: transactions, isLoading } = useBankAccountTransactions(accountId, {
    is_reconciled: showReconciled || undefined,
    from_date: fromDate || undefined,
    to_date: toDate || undefined,
  });

  const reconcileMutation = useReconcileLines();

  const toggleLine = (id: string) => {
    const next = new Set(selectedLines);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedLines(next);
  };

  const handleReconcile = async (reconcile: boolean) => {
    if (selectedLines.size === 0) return;
    await reconcileMutation.mutateAsync({
      id: accountId,
      data: { line_ids: Array.from(selectedLines), reconcile },
    });
    setSelectedLines(new Set());
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await importMutation.mutateAsync({ id: accountId, file });
      alert("นำเข้าสำเร็จ");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch {
      alert("นำเข้าล้มเหลว");
    }
  };

  const handleDeleteImport = async (importId: string) => {
    if (!confirm("ยืนยันการลบ?")) return;
    try {
      await deleteImportMutation.mutateAsync({ id: accountId, importId });
    } catch {
      alert("ลบล้มเหลว");
    }
  };

  const handleMatchLine = async (lineId: string, jeLineId?: string) => {
    try {
      await matchLineMutation.mutateAsync({
        id: accountId,
        importId: expandedImport!,
        data: { line_id: lineId, je_line_id: jeLineId || null },
      });
    } catch {
      alert("Matching ล้มเหลว");
    }
  };

  const getSuggestionsForLine = (lineId: string) => {
    return matchSuggestions?.suggestions?.find((s: any) => s.line_id === lineId)?.suggested_matches || [];
  };

  const config = typeConfig[account?.account_type] || typeConfig.cash;
  const unreconciledTotal = transactions
    ?.filter((t: any) => t.is_reconciled === "N")
    .reduce((sum: number, t: any) => sum + parseFloat(t.debit_amount || 0) - parseFloat(t.credit_amount || 0), 0) || 0;

  return (
    <AppLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/bank-accounts" className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          {account && (
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${config.color} flex items-center justify-center`}>
                  {config.icon}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{account.name}</h1>
                  <p className="text-gray-500 text-sm">{account.bank_name || config.label} {account.account_number ? `· ${account.account_number}` : ""}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Stats */}
        {account && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <p className="text-sm text-gray-500">ยอดคงเหลือ</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(account.current_balance)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <p className="text-sm text-gray-500">ยอดยังไม่กระทบยอด</p>
              <p className="text-2xl font-bold text-orange-600">{formatCurrency(unreconciledTotal)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <p className="text-sm text-gray-500">ยอดกระทบยอดแล้ว</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(parseFloat(account.current_balance || 0) - unreconciledTotal)}</p>
            </div>
          </div>
        )}

        {/* Statement Import */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-peak-purple" />
              <h3 className="text-lg font-semibold text-gray-900">นำเข้า Statement ธนาคาร</h3>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                accept=".csv,.xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={importMutation.isPending}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-peak-purple to-peak-teal text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                {importMutation.isPending ? "กำลังนำเข้า..." : "นำเข้าไฟล์ CSV"}
              </button>
              <button
                onClick={() => setShowImports(!showImports)}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                ประวัติการนำเข้า
                {showImports ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {showImports && (
            <div className="mt-4">
              {importsLoading ? (
                <div className="text-center text-gray-500 py-4">กำลังโหลด...</div>
              ) : !statementImports?.length ? (
                <div className="text-center text-gray-500 py-4">ยังไม่มีการนำเข้า</div>
              ) : (
                <div className="space-y-2">
                  {statementImports.map((imp: any) => (
                    <div key={imp.id} className="border border-gray-100 rounded-lg overflow-hidden">
                      <div
                        className="flex items-center justify-between px-4 py-3 bg-gray-50/50 cursor-pointer hover:bg-gray-50"
                        onClick={() => setExpandedImport(expandedImport === imp.id ? null : imp.id)}
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-900">{imp.file_name}</span>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            imp.status === "completed" ? "bg-green-50 text-green-700" :
                            imp.status === "failed" ? "bg-red-50 text-red-700" :
                            "bg-yellow-50 text-yellow-700"
                          }`}>
                            {imp.status === "completed" ? "สำเร็จ" :
                             imp.status === "failed" ? "ล้มเหลว" : "กำลังประมวลผล"}
                          </span>
                          <span className="text-xs text-gray-500">
                            {imp.line_count} รายการ · {formatThaiDate(imp.statement_date_from)} - {formatThaiDate(imp.statement_date_to)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">
                            เดบิต {formatCurrency(imp.total_debit)} · เครดิต {formatCurrency(imp.total_credit)}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteImport(imp.id);
                            }}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          {expandedImport === imp.id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                        </div>
                      </div>

                      {expandedImport === imp.id && (
                        <div className="px-4 py-3">
                          {!statementLines?.length ? (
                            <div className="text-center text-gray-500 py-4">ไม่มีรายการที่ยังไม่กระทบยอด</div>
                          ) : (
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-gray-100">
                                  <th className="text-left py-2 font-medium text-gray-600">วันที่</th>
                                  <th className="text-left py-2 font-medium text-gray-600">รายละเอียด</th>
                                  <th className="text-right py-2 font-medium text-gray-600">เดบิต</th>
                                  <th className="text-right py-2 font-medium text-gray-600">เครดิต</th>
                                  <th className="text-left py-2 font-medium text-gray-600">การจับคู่</th>
                                  <th className="w-20"></th>
                                </tr>
                              </thead>
                              <tbody>
                                {statementLines.map((line: any) => {
                                  const suggestions = getSuggestionsForLine(line.id);
                                  return (
                                    <tr key={line.id} className="border-b border-gray-50">
                                      <td className="py-2 text-gray-900">{formatThaiDate(line.transaction_date)}</td>
                                      <td className="py-2 text-gray-900">{line.description || "-"}</td>
                                      <td className="py-2 text-right text-gray-900">{formatCurrency(line.debit_amount)}</td>
                                      <td className="py-2 text-right text-gray-900">{formatCurrency(line.credit_amount)}</td>
                                      <td className="py-2">
                                        {line.is_matched === "Y" ? (
                                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700">
                                            <Link2 className="w-3 h-3" />
                                            จับคู่แล้ว
                                          </span>
                                        ) : suggestions.length > 0 ? (
                                          <div className="space-y-1">
                                            {suggestions.slice(0, 2).map((s: any) => (
                                              <button
                                                key={s.je_line_id}
                                                onClick={() => handleMatchLine(line.id, s.je_line_id)}
                                                className="block w-full text-left px-2 py-1 rounded text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                                              >
                                                {s.document_number || "JE"} · {formatThaiDate(s.entry_date)} · คะแนน {s.score}
                                              </button>
                                            ))}
                                          </div>
                                        ) : (
                                          <span className="text-xs text-gray-400">ไม่พบรายการที่ตรงกัน</span>
                                        )}
                                      </td>
                                      <td className="py-2 text-right">
                                        {line.is_matched === "Y" && (
                                          <button
                                            onClick={() => handleMatchLine(line.id)}
                                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                          >
                                            <X className="w-4 h-4" />
                                          </button>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">แสดง:</span>
              <select
                value={showReconciled}
                onChange={(e) => setShowReconciled(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple"
              >
                <option value="N">ยังไม่กระทบยอด</option>
                <option value="Y">กระทบยอดแล้ว</option>
                <option value="">ทั้งหมด</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">ตั้งแต่</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple"
              />
              <span className="text-sm text-gray-600">ถึง</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple"
              />
            </div>
            {selectedLines.size > 0 && (
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-sm text-gray-500">เลือก {selectedLines.size} รายการ</span>
                {showReconciled !== "Y" && (
                  <button
                    onClick={() => handleReconcile(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                  >
                    <CheckSquare className="w-4 h-4" />
                    กระทบยอด
                  </button>
                )}
                {showReconciled !== "N" && (
                  <button
                    onClick={() => handleReconcile(false)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
                  >
                    <Square className="w-4 h-4" />
                    ยกเลิกกระทบยอด
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">กำลังโหลด...</div>
          ) : !transactions?.length ? (
            <div className="p-8 text-center text-gray-500">ไม่มีรายการ</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="px-4 py-4 w-10"></th>
                  <th className="text-left px-4 py-4 font-semibold text-gray-700">วันที่</th>
                  <th className="text-left px-4 py-4 font-semibold text-gray-700">ประเภท</th>
                  <th className="text-left px-4 py-4 font-semibold text-gray-700">เลขที่เอกสาร</th>
                  <th className="text-left px-4 py-4 font-semibold text-gray-700">รายละเอียด</th>
                  <th className="text-right px-4 py-4 font-semibold text-gray-700">เดบิต</th>
                  <th className="text-right px-4 py-4 font-semibold text-gray-700">เครดิต</th>
                  <th className="text-center px-4 py-4 font-semibold text-gray-700">สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t: any) => (
                  <tr
                    key={t.id}
                    className={`border-b border-gray-50 hover:bg-gray-50/50 ${selectedLines.has(t.id) ? "bg-peak-purple/5" : ""}`}
                  >
                    <td className="px-4 py-4">
                      <button onClick={() => toggleLine(t.id)}>
                        {selectedLines.has(t.id) ? (
                          <CheckSquare className="w-5 h-5 text-peak-purple" />
                        ) : (
                          <Square className="w-5 h-5 text-gray-300" />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-4 text-gray-900">{formatThaiDate(t.entry_date)}</td>
                    <td className="px-4 py-4">
                      <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-600">
                        {t.entry_type}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-gray-600 font-mono">{t.document_number || "-"}</td>
                    <td className="px-4 py-4 text-gray-900">{t.description || "-"}</td>
                    <td className="px-4 py-4 text-right text-gray-900">{formatCurrency(t.debit_amount)}</td>
                    <td className="px-4 py-4 text-right text-gray-900">{formatCurrency(t.credit_amount)}</td>
                    <td className="px-4 py-4 text-center">
                      {t.is_reconciled === "Y" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
                          <CheckSquare className="w-3 h-3" />
                          กระทบยอด
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-50 text-orange-700">
                          <Square className="w-3 h-3" />
                          รอดำเนินการ
                        </span>
                      )}
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
