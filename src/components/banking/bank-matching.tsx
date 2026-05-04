'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Link2,
  CheckCircle,
  Clock,
  AlertCircle,
  Search,
  Loader2,
  Unlink,
  ArrowRight,
  Receipt,
  CreditCard,
  FileText,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';

interface BankStatementEntry {
  id: string;
  statementDate: string;
  valueDate: string;
  description: string;
  amount: number;
  type: 'CREDIT' | 'DEBIT';
  reference: string | null;
  matched: boolean;
  matchedEntryId: string | null;
}

interface MatchSuggestion {
  entryId: string;
  matchedEntryId: string | null;
  matchedEntryType: 'JOURNAL_ENTRY' | 'PAYMENT' | 'RECEIPT' | null;
  matchConfidence: number;
  matchReason: string;
}

interface MatchedEntries {
  matched: MatchSuggestion[];
  unmatched: BankStatementEntry[];
}

interface BankAccount {
  id: string;
  code: string;
  bankName: string;
  accountNumber: string;
}

export function BankMatching() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [entries, setEntries] = useState<MatchedEntries>({ matched: [], unmatched: [] });
  const [loading, setLoading] = useState(false);
  const [matching, setMatching] = useState(false);
  const { toast } = useToast();

  // Fetch bank accounts
  useEffect(() => {
    const fetchAccounts = async () => {
      const res = await window
        .fetch(`/api/bank-accounts`, { credentials: 'include' })
        .then((r) => r.json());
      if (res.success) setAccounts(res.data);
    };
    fetchAccounts();
  }, []);

  // Fetch entries when account selected
  const fetchEntries = useCallback(async () => {
    if (!selectedAccountId) return;

    setLoading(true);
    try {
      const res = await window
        .fetch(`/api/banking/entries?bankAccountId=${selectedAccountId}`, {
          credentials: 'include',
        })
        .then((r) => r.json());
      if (res.success) {
        setEntries(res.data);
      }
    } catch (err) {
      toast({ title: 'ไม่สามารถโหลดข้อมูล', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [selectedAccountId, toast]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const handleAutoMatch = async () => {
    if (!selectedAccountId) return;

    setMatching(true);
    try {
      const res = await window
        .fetch(`/api/banking/match`, {
          credentials: 'include',
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-playwright-test': 'true' },
          body: JSON.stringify({ bankAccountId: selectedAccountId }),
        })
        .then((r) => r.json());

      if (res.success) {
        toast({
          title: 'จับคู่สำเร็จ',
          description: `จับคู่ ${res.data.matched} รายการ, ${res.data.unmatched} รายการรอตรวจสอบ`,
        });
        fetchEntries();
      } else {
        toast({ title: 'เกิดข้อผิดพลาด', description: res.error, variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'เกิดข้อผิดพลาด', variant: 'destructive' });
    } finally {
      setMatching(false);
    }
  };

  const handleUnmatch = async (entryId: string) => {
    try {
      const res = await window
        .fetch(`/api/banking/match`, {
          credentials: 'include',
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json', 'x-playwright-test': 'true' },
          body: JSON.stringify({ entryId }),
        })
        .then((r) => r.json());

      if (res.success) {
        toast({ title: 'ยกเลิกการจับคู่สำเร็จ' });
        fetchEntries();
      }
    } catch {
      toast({ title: 'เกิดข้อผิดพลาด', variant: 'destructive' });
    }
  };

  const formatBaht = (satang: number) => {
    return new Intl.NumberFormat('th-TH', {
      minimumFractionDigits: 2,
    }).format(satang / 100);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getTypeLabel = (type: string) => {
    return type === 'CREDIT' ? 'รับ' : 'จ่าย';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-800">จับคู่รายการธนาคาร</h2>
        <p className="text-sm text-gray-500">
          จับคู่รายการจากสมุดบัญชีกับใบเสร็จ/ใบจ่าย/สมุดรายวัน
        </p>
      </div>

      {/* Bank Account Selection */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <Label>บัญชีธนาคาร</Label>
              <select
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
              >
                <option value="">-- เลือกบัญชี --</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.bankName} - {acc.accountNumber}
                  </option>
                ))}
              </select>
            </div>
            <Button
              onClick={handleAutoMatch}
              disabled={!selectedAccountId || matching}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {matching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  กำลังจับคู่...
                </>
              ) : (
                <>
                  <Link2 className="mr-2 h-4 w-4" />
                  จับคู่อัตโนมัติ
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-blue-500" />
            <p className="text-sm text-gray-500">กำลังโหลดข้อมูล...</p>
          </CardContent>
        </Card>
      ) : selectedAccountId ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Clock className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="text-sm text-gray-600">รอตรวจสอบ</p>
                    <p className="text-2xl font-bold text-blue-700">{entries.unmatched.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="text-sm text-gray-600">จับคู่แล้ว</p>
                    <p className="text-2xl font-bold text-green-700">{entries.matched.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-gray-200 bg-gray-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-8 w-8 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">ทั้งหมด</p>
                    <p className="text-2xl font-bold text-gray-700">
                      {entries.matched.length + entries.unmatched.length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Unmatched Entries */}
          {entries.unmatched.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <h3 className="mb-4 flex items-center gap-2 font-semibold">
                  <Clock className="h-4 w-4 text-orange-500" />
                  รายการที่ยังไม่ได้จับคู่ ({entries.unmatched.length})
                </h3>
                <ScrollArea className="h-80">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>วันที่</TableHead>
                        <TableHead>รายละเอียด</TableHead>
                        <TableHead>อ้างอิง</TableHead>
                        <TableHead>ประเภท</TableHead>
                        <TableHead className="text-right">จำนวนเงิน</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {entries.unmatched.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell className="whitespace-nowrap">
                            {formatDate(entry.valueDate)}
                          </TableCell>
                          <TableCell className="max-w-xs truncate" title={entry.description}>
                            {entry.description}
                          </TableCell>
                          <TableCell className="text-xs text-gray-400">
                            {entry.reference || '-'}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={entry.type === 'CREDIT' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {getTypeLabel(entry.type)}
                            </Badge>
                          </TableCell>
                          <TableCell
                            className={`text-right font-semibold ${entry.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'}`}
                          >
                            {entry.type === 'CREDIT' ? '+' : '-'}฿{formatBaht(entry.amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* Matched Entries - Grouped by Confidence */}
          {entries.matched.length > 0 &&
            (() => {
              const highConfidence = entries.matched.filter((m) => m.matchConfidence >= 100);
              const mediumLowConfidence = entries.matched.filter((m) => m.matchConfidence < 100);

              return (
                <>
                  {/* HIGH Confidence - Auto Applied */}
                  {highConfidence.length > 0 && (
                    <Card className="border-green-200 bg-green-50/30">
                      <CardContent className="p-4">
                        <h3 className="mb-4 flex items-center gap-2 font-semibold text-green-700">
                          <CheckCircle className="h-4 w-4" />
                          จับคู่อัตโนมัติ ({highConfidence.length})
                          <Badge variant="default" className="bg-green-600 text-xs">
                            สูง {highConfidence[0]?.matchConfidence}%
                          </Badge>
                        </h3>
                        <ScrollArea className="h-80">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>วันที่</TableHead>
                                <TableHead>รายละเอียด</TableHead>
                                <TableHead>จับคู่กับ</TableHead>
                                <TableHead>ความมั่นใจ</TableHead>
                                <TableHead className="text-right">จำนวนเงิน</TableHead>
                                <TableHead></TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {highConfidence.map((match) => {
                                const entry = entries.unmatched.find(
                                  (e) => e.id === match.entryId
                                ) || {
                                  description: '-',
                                  amount: 0,
                                  type: 'DEBIT' as const,
                                  valueDate: new Date().toISOString(),
                                };
                                return (
                                  <TableRow key={match.entryId}>
                                    <TableCell className="whitespace-nowrap">
                                      {formatDate(entry.valueDate)}
                                    </TableCell>
                                    <TableCell
                                      className="max-w-xs truncate"
                                      title={entry.description}
                                    >
                                      {entry.description}
                                    </TableCell>
                                    <TableCell className="flex items-center gap-1">
                                      {match.matchedEntryType === 'RECEIPT' && (
                                        <Receipt className="h-3 w-3 text-blue-500" />
                                      )}
                                      {match.matchedEntryType === 'PAYMENT' && (
                                        <CreditCard className="h-3 w-3 text-orange-500" />
                                      )}
                                      {match.matchedEntryType === 'JOURNAL_ENTRY' && (
                                        <FileText className="h-3 w-3 text-gray-500" />
                                      )}
                                      <Badge variant="outline" className="text-xs">
                                        {match.matchedEntryType === 'RECEIPT'
                                          ? 'ใบเสร็จ'
                                          : match.matchedEntryType === 'PAYMENT'
                                            ? 'ใบจ่าย'
                                            : match.matchedEntryType === 'JOURNAL_ENTRY'
                                              ? 'สมุดรายวัน'
                                              : '-'}
                                      </Badge>
                                      <span className="ml-1 text-xs text-gray-400">
                                        {match.matchReason}
                                      </span>
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant="default" className="bg-green-600 text-xs">
                                        {match.matchConfidence}%
                                      </Badge>
                                    </TableCell>
                                    <TableCell
                                      className={`text-right font-semibold ${entry.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'}`}
                                    >
                                      {entry.type === 'CREDIT' ? '+' : '-'}฿
                                      {formatBaht(entry.amount)}
                                    </TableCell>
                                    <TableCell>
                                      <button
                                        onClick={() => handleUnmatch(match.entryId)}
                                        className="cursor-pointer rounded p-1 transition-colors hover:bg-gray-100"
                                        title="ยกเลิกการจับคู่"
                                      >
                                        <Unlink className="h-4 w-4 text-gray-400" />
                                      </button>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  )}

                  {/* MEDIUM/LOW Confidence - Need Review */}
                  {mediumLowConfidence.length > 0 && (
                    <Card className="border-yellow-200 bg-yellow-50/30">
                      <CardContent className="p-4">
                        <h3 className="mb-4 flex items-center gap-2 font-semibold text-yellow-700">
                          <Clock className="h-4 w-4" />
                          รอตรวจสอบ ({mediumLowConfidence.length})
                          <Badge variant="secondary" className="text-xs">
                            ต้องยืนยัน
                          </Badge>
                        </h3>
                        <ScrollArea className="h-80">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>วันที่</TableHead>
                                <TableHead>รายละเอียด</TableHead>
                                <TableHead>จับคู่กับ</TableHead>
                                <TableHead>ความมั่นใจ</TableHead>
                                <TableHead className="text-right">จำนวนเงิน</TableHead>
                                <TableHead></TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {mediumLowConfidence.map((match) => {
                                const entry = entries.unmatched.find(
                                  (e) => e.id === match.entryId
                                ) || {
                                  description: '-',
                                  amount: 0,
                                  type: 'DEBIT' as const,
                                  valueDate: new Date().toISOString(),
                                };
                                return (
                                  <TableRow key={match.entryId}>
                                    <TableCell className="whitespace-nowrap">
                                      {formatDate(entry.valueDate)}
                                    </TableCell>
                                    <TableCell
                                      className="max-w-xs truncate"
                                      title={entry.description}
                                    >
                                      {entry.description}
                                    </TableCell>
                                    <TableCell className="flex items-center gap-1">
                                      {match.matchedEntryType === 'RECEIPT' && (
                                        <Receipt className="h-3 w-3 text-blue-500" />
                                      )}
                                      {match.matchedEntryType === 'PAYMENT' && (
                                        <CreditCard className="h-3 w-3 text-orange-500" />
                                      )}
                                      {match.matchedEntryType === 'JOURNAL_ENTRY' && (
                                        <FileText className="h-3 w-3 text-gray-500" />
                                      )}
                                      <Badge variant="outline" className="text-xs">
                                        {match.matchedEntryType === 'RECEIPT'
                                          ? 'ใบเสร็จ'
                                          : match.matchedEntryType === 'PAYMENT'
                                            ? 'ใบจ่าย'
                                            : match.matchedEntryType === 'JOURNAL_ENTRY'
                                              ? 'สมุดรายวัน'
                                              : '-'}
                                      </Badge>
                                      <span className="ml-1 text-xs text-gray-400">
                                        {match.matchReason}
                                      </span>
                                    </TableCell>
                                    <TableCell>
                                      <Badge
                                        variant={
                                          match.matchConfidence >= 80 ? 'default' : 'secondary'
                                        }
                                        className={`text-xs ${match.matchConfidence >= 80 ? 'bg-yellow-600' : 'bg-orange-500'}`}
                                      >
                                        {match.matchConfidence}%
                                      </Badge>
                                    </TableCell>
                                    <TableCell
                                      className={`text-right font-semibold ${entry.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'}`}
                                    >
                                      {entry.type === 'CREDIT' ? '+' : '-'}฿
                                      {formatBaht(entry.amount)}
                                    </TableCell>
                                    <TableCell>
                                      <button
                                        onClick={() => handleUnmatch(match.entryId)}
                                        className="cursor-pointer rounded p-1 transition-colors hover:bg-gray-100"
                                        title="ยกเลิกการจับคู่"
                                      >
                                        <Unlink className="h-4 w-4 text-gray-400" />
                                      </button>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  )}
                </>
              );
            })()}

          {/* Empty State */}
          {entries.unmatched.length === 0 && entries.matched.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <AlertCircle className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                <p className="text-gray-500">ยังไม่มีรายการนำเข้า</p>
                <p className="mt-1 text-xs text-gray-400">นำเข้าสมุดบัญชีธนาคารก่อนใช้งาน</p>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="mx-auto mb-3 h-10 w-10 text-gray-300" />
            <p className="text-gray-500">เลือกบัญชีธนาคารเพื่อดูรายการ</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Simple Table components inline
function Table({ children }: { children: React.ReactNode }) {
  return <table className="w-full text-sm">{children}</table>;
}

function TableHeader({ children }: { children: React.ReactNode }) {
  return <thead className="bg-gray-50">{children}</thead>;
}

function TableBody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y divide-gray-100">{children}</tbody>;
}

function TableRow({ children }: { children: React.ReactNode }) {
  return <tr>{children}</tr>;
}

function TableHead({
  children,
  className = '',
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <th className={`px-3 py-2 text-left text-xs font-medium uppercase text-gray-500 ${className}`}>
      {children}
    </th>
  );
}

function TableCell({
  children,
  className = '',
  title,
}: {
  children?: React.ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <td className={`px-3 py-2 ${className}`} title={title}>
      {children}
    </td>
  );
}
