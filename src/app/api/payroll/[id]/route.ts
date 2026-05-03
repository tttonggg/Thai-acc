// Payroll Run Individual Operations (Agent 06: Payroll & HR Engineer)
// PATCH endpoint for approving/posting payroll and generating GL journal entries
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-utils';
import { createPayrollJournalEntry } from '@/lib/payroll-service';
import prisma from '@/lib/db';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth();
    const { id } = await params;

    const payrollRun = await prisma.payrollRun.findUnique({
      where: { id },
      include: { payrolls: true },
    });

    if (!payrollRun) {
      return NextResponse.json({ success: false, error: 'ไม่พบงวดเงินเดือน' }, { status: 404 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === 'approve' || action === 'post') {
      // Validate status transition
      if (payrollRun.status !== 'DRAFT') {
        return NextResponse.json(
          { success: false, error: 'สถานะงวดเงินเดือนไม่ถูกต้อง' },
          { status: 400 }
        );
      }

      // Create journal entry
      const journalEntry = await createPayrollJournalEntry(payrollRun.id);

      // Update payroll status to APPROVED
      const updated = await prisma.payrollRun.update({
        where: { id },
        data: { status: 'APPROVED' },
        include: { payrolls: true },
      });

      return NextResponse.json({
        success: true,
        data: {
          payrollRun: updated,
          journalEntry,
        },
      });
    }

    if (action === 'markPaid') {
      // Validate status transition
      if (payrollRun.status !== 'APPROVED') {
        return NextResponse.json(
          { success: false, error: 'งวดเงินเดือนยังไม่ได้รับการอนุมัติ' },
          { status: 400 }
        );
      }

      // Update payroll status to PAID
      const updated = await prisma.payrollRun.update({
        where: { id },
        data: { status: 'PAID' },
        include: { payrolls: true },
      });

      return NextResponse.json({
        success: true,
        data: updated,
      });
    }

    return NextResponse.json({ success: false, error: 'การกระทำไม่ถูกต้อง' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth();
    const { id } = await params;

    const payrollRun = await prisma.payrollRun.findUnique({
      where: { id },
      include: {
        payrolls: {
          include: {
            employee: true,
          },
        },
      },
    });

    if (!payrollRun) {
      return NextResponse.json({ success: false, error: 'ไม่พบงวดเงินเดือน' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: payrollRun });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
