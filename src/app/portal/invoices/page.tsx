'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { usePortalAuthStore } from '@/stores/portal-auth-store';
import { formatThaiDate } from '@/lib/thai-accounting';
import { satangToBaht } from '@/lib/currency';
import { StatusBadge } from '@/lib/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  FileText,
  Search,
  Filter,
  ChevronRight,
  Loader2,
  AlertCircle,
  Receipt,
} from 'lucide-react';

type InvoiceStatus = 'ISSUED' | 'PARTIAL' | 'PAID' | 'DRAFT' | 'CANCELLED' | 'ALL' | 'OUTSTANDING' | 'OVERDUE';

interface Invoice {
  id: string;
  invoiceNo: string;
  invoiceDate: string;
  dueDate: string;
  status: InvoiceStatus;
  subtotal: number;
  vatAmount: number;
  totalAmount: number;
  netAmount: number;
  paidAmount: number;
  balance: number;
}

interface PaginatedResponse {
  invoices: Invoice[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const STATUS_OPTIONS: { value: InvoiceStatus; label: string }[] = [
  { value: 'ALL', label: 'ทั้งหมด' },
  { value: 'OUTSTANDING', label: 'ยังไม่ชำระ' },
  { value: 'OVERDUE', label: 'เกินกำหนด' },
  { value: 'ISSUED', label: 'ออกแล้ว' },
  { value: 'PARTIAL', label: 'บางส่วน' },
  { value: 'PAID', label: 'ชำระแล้ว' },
];

function formatBaht(satang: number): string {
  return `฿${satangToBaht(satang).toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function PortalInvoicesPage() {
  const router = useRouter();
  const { user } = usePortalAuthStore();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState<InvoiceStatus>('ALL');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvoices = useCallback(async (pageNum: number, statusVal: InvoiceStatus, searchVal: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: String(pageNum),
        pageSize: String(pageSize),
        status: statusVal,
      });
      if (searchVal) params.set('search', searchVal);

      const res = await fetch(`/api/portal/invoices?${params}`, {
        headers: { 'x-customer-id': user?.customerId ?? '' },
      });

      if (!res.ok) throw new Error('ดึงข้อมูลไม่สำเร็จ');
      const data: PaginatedResponse = await res.json();

      setInvoices(data.invoices);
      setTotal(data.total);
      setTotalPages(data.totalPages);
      setPage(pageNum);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
    } finally {
      setIsLoading(false);
    }
  }, [user?.customerId, pageSize]);

  useEffect(() => {
    fetchInvoices(1, status, search);
  }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInvoices(1, status, search);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    fetchInvoices(newPage, status, search);
  };

  const handleStatusChange = (newStatus: InvoiceStatus) => {
    setStatus(newStatus);
  };

  const renderPaginationItems = () => {
    const items: React.ReactNode[] = [];
    const maxVisible = 5;
    let start = Math.max(1, page - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    if (start > 1) {
      items.push(
        <PaginationItem key="1">
          <PaginationLink onClick={() => handlePageChange(1)}>1</PaginationLink>
        </PaginationItem>
      );
      if (start > 2) items.push(<PaginationEllipsis key="ellipsis-start" />);
    }

    for (let i = start; i <= end; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink isActive={i === page} onClick={() => handlePageChange(i)}>
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    if (end < totalPages) {
      if (end < totalPages - 1) items.push(<PaginationEllipsis key="ellipsis-end" />);
      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink onClick={() => handlePageChange(totalPages)}>{totalPages}</PaginationLink>
        </PaginationItem>
      );
    }

    return items;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-emerald-600 to-teal-600">
              <Receipt className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">ใบกำกับภาษี</h1>
              <p className="text-sm text-gray-500">รายการใบกำกับภาษีทั้งหมดของคุณ</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6 border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-end">
              {/* Status Filter */}
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="status">สถานะ</Label>
                <Select value={status} onValueChange={(v) => handleStatusChange(v as InvoiceStatus)}>
                  <SelectTrigger id="status" className="w-full md:w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Search */}
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1 md:flex-none">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                  <Input
                    placeholder="ค้นหาเลขที่ใบกำกับ..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 w-full md:w-64"
                  />
                </div>
                <Button type="submit" variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>

        {/* Error */}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Invoice List */}
        <Card className="border-0 shadow-md">
          <CardHeader className="border-b bg-white pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">รายการใบกำกับภาษี</CardTitle>
                <CardDescription>
                  {total > 0 ? `พบ ${total} รายการ` : 'ไม่พบรายการ'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-6 w-20 rounded" />
                    <Skeleton className="h-6 w-28 rounded" />
                  </div>
                ))}
              </div>
            ) : invoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <FileText className="h-12 w-12 text-gray-300 mb-3" />
                <p className="text-gray-500 font-medium">ไม่พบรายการใบกำกับภาษี</p>
                <p className="text-sm text-gray-400 mt-1">
                  {search ? 'ลองค้นหาด้วยคำอื่น' : 'ยังไม่มีใบกำกับภาษีในระบบ'}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 hover:bg-gray-50">
                    <TableHead className="w-[140px]">เลขที่ใบกำกับ</TableHead>
                    <TableHead>วันที่</TableHead>
                    <TableHead>วันครบกำหนด</TableHead>
                    <TableHead className="text-center">สถานะ</TableHead>
                    <TableHead className="text-right">จำนวนเงิน (บาท)</TableHead>
                    <TableHead className="text-right">คงเหลือ (บาท)</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => {
                    const balance = invoice.totalAmount - invoice.paidAmount;
                    const isOverdue = invoice.status === 'ISSUED' && new Date(invoice.dueDate) < new Date();
                    return (
                      <TableRow
                        key={invoice.id}
                        className="cursor-pointer hover:bg-emerald-50/50"
                        onClick={() => router.push(`/portal/invoices/${invoice.id}`)}
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-emerald-600" />
                            {invoice.invoiceNo}
                          </div>
                        </TableCell>
                        <TableCell>{formatThaiDate(invoice.invoiceDate)}</TableCell>
                        <TableCell className={isOverdue ? 'text-red-600 font-medium' : ''}>
                          <div className="flex flex-col">
                            <span>{formatThaiDate(invoice.dueDate)}</span>
                            {isOverdue && (
                              <span className="text-xs text-red-500">เกินกำหนด</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <StatusBadge status={invoice.status} />
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatBaht(invoice.totalAmount)}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={balance > 0 ? 'text-orange-600 font-medium' : 'text-green-600'}>
                            {formatBaht(balance)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>

          {/* Pagination */}
          {!isLoading && totalPages > 1 && (
            <div className="border-t p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-500">
                  แสดง {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, total)} จาก {total} รายการ
                </p>
              </div>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => handlePageChange(page - 1)}
                      className={page <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  {renderPaginationItems()}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => handlePageChange(page + 1)}
                      className={page >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
