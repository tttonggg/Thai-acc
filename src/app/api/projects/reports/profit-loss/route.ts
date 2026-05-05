import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/api-utils';
import { AuthError } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  try {
    await requireAuth();

    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');
    const status = searchParams.get('status');

    const where: any = { deletedAt: null };
    if (projectId) where.id = projectId;
    if (status) where.status = status;

    const projects = await prisma.project.findMany({
      where,
      include: {
        customer: { select: { id: true, code: true, name: true } },
        transactions: true,
      },
    });

    const reports = projects.map(project => {
      const revenue = project.transactions
        .filter(t => t.type === 'REVENUE')
        .reduce((sum, t) => sum + t.amount, 0);
      const expense = project.transactions
        .filter(t => t.type === 'EXPENSE' || t.type === 'TIME_COST')
        .reduce((sum, t) => sum + t.amount, 0);
      const profit = revenue - expense;
      const profitPercent = revenue > 0 ? Math.round((profit / revenue) * 10000) / 100 : 0;

      const budgetRevenueUsed = project.budgetRevenue 
        ? Math.round((revenue / project.budgetRevenue) * 10000) / 100 
        : null;
      const budgetCostUsed = project.budgetCost 
        ? Math.round((expense / project.budgetCost) * 10000) / 100 
        : null;

      return {
        id: project.id,
        code: project.code,
        name: project.name,
        status: project.status,
        customer: project.customer,
        budgetRevenue: project.budgetRevenue,
        budgetCost: project.budgetCost,
        actualRevenue: revenue,
        actualCost: expense,
        profit,
        profitPercent,
        budgetRevenueUsed,
        budgetCostUsed,
        transactionCount: project.transactions.length,
      };
    });

    return NextResponse.json({ success: true, data: reports });
  } catch (error: unknown) {
    const err = error as { statusCode?: number };
    if (err?.statusCode === 401) {
      return NextResponse.json({ success: false, error: 'ไม่ได้รับอนุญาต' }, { status: 401 });
    }
    console.error('Profit-loss report error:', error);
    return NextResponse.json({ success: false, error: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
