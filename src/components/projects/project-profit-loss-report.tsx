'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface ProfitLossReport {
  id: string;
  code: string;
  name: string;
  status: string;
  customer?: { name: string };
  budgetRevenue?: number;
  budgetCost?: number;
  actualRevenue: number;
  actualCost: number;
  profit: number;
  profitPercent: number;
  budgetRevenueUsed?: number;
  budgetCostUsed?: number;
  transactionCount: number;
}

async function fetchProfitLossReport() {
  const res = await fetch('/api/projects/reports/profit-loss');
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
}

function satangToBaht(satang: number): string {
  return (satang / 100).toLocaleString('th-TH', { minimumFractionDigits: 2 });
}

const statusLabels: Record<string, string> = {
  ACTIVE: 'กำลังดำเนินการ',
  COMPLETED: 'เสร็จสิ้น',
  CANCELLED: 'ยกเลิก',
};

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-blue-100 text-blue-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
};

export function ProjectProfitLossReport() {
  const { data: reports, isLoading } = useQuery({
    queryKey: ['project-profit-loss'],
    queryFn: fetchProfitLossReport,
  });

  const totalRevenue = reports?.reduce((sum: number, r: ProfitLossReport) => sum + r.actualRevenue, 0) || 0;
  const totalCost = reports?.reduce((sum: number, r: ProfitLossReport) => sum + r.actualCost, 0) || 0;
  const totalProfit = totalRevenue - totalCost;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">รายงานกำไร/ขาดทุนต่อโปรเจกต์</h1>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">รายได้รวม</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ฿{satangToBaht(totalRevenue)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">ค่าใช้จ่ายรวม</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ฿{satangToBaht(totalCost)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">กำไร/ขาดทุนรวม</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ฿{satangToBaht(totalProfit)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>รายละเอียดต่อโปรเจกต์</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">กำลังโหลด...</div>
          ) : !reports || reports.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">ไม่มีข้อมูลโปรเจกต์</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>รหัส</TableHead>
                  <TableHead>ชื่อโปรเจกต์</TableHead>
                  <TableHead>ลูกค้า</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead className="text-right">รายได้จริง</TableHead>
                  <TableHead className="text-right">ค่าใช้จ่ายจริง</TableHead>
                  <TableHead className="text-right">กำไร/ขาดทุน</TableHead>
                  <TableHead className="text-right">%</TableHead>
                  <TableHead className="text-right">งบรายได้</TableHead>
                  <TableHead className="text-right">งบค่าใช้จ่าย</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report: ProfitLossReport) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-mono text-sm">{report.code}</TableCell>
                    <TableCell className="font-medium">{report.name}</TableCell>
                    <TableCell>{report.customer?.name || '-'}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[report.status]}>
                        {statusLabels[report.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-green-600">
                      ฿{satangToBaht(report.actualRevenue)}
                    </TableCell>
                    <TableCell className="text-right text-red-600">
                      ฿{satangToBaht(report.actualCost)}
                    </TableCell>
                    <TableCell className={`text-right font-medium ${report.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ฿{satangToBaht(report.profit)}
                    </TableCell>
                    <TableCell className="text-right">
                      {report.profitPercent.toFixed(1)}%
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {report.budgetRevenueUsed !== null ? `${report.budgetRevenueUsed?.toFixed(0)}%` : '-'}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {report.budgetCostUsed !== null ? `${report.budgetCostUsed?.toFixed(0)}%` : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
