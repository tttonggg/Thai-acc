// Scheduled Reports API - Individual Report Operations
// /api/reports/scheduled/[id] - Update, delete, and manage individual scheduled reports
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/api-utils';
import { z } from 'zod';
import { handleApiError } from '@/lib/api-error-handler';

const scheduledReportSchema = z.object({
  name: z.string().min(1).optional(),
  reportType: z
    .enum([
      'TRIAL_BALANCE',
      'BALANCE_SHEET',
      'INCOME_STATEMENT',
      'GENERAL_LEDGER',
      'AGING_AR',
      'AGING_AP',
      'VAT_REPORT',
      'WHT_REPORT',
      'INVENTORY_REPORT',
      'SALES_REPORT',
      'PURCHASE_REPORT',
    ])
    .optional(),
  schedule: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'custom']).optional(),
  dayOfWeek: z.number().min(0).max(6).optional(),
  dayOfMonth: z.number().min(1).max(31).optional(),
  monthOfYear: z.number().min(1).max(12).optional(),
  time: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .optional(),
  enabled: z.boolean().optional(),
  parameters: z
    .object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      accountId: z.string().optional(),
      customerId: z.string().optional(),
      vendorId: z.string().optional(),
      warehouseId: z.string().optional(),
      includeZeroBalances: z.boolean().optional(),
      compareToPrevious: z.boolean().optional(),
    })
    .optional(),
  recipients: z.string().min(1).optional(),
  outputFormat: z.enum(['PDF', 'EXCEL']).optional(),
  emailSubject: z.string().optional(),
  emailBody: z.string().optional(),
});

// GET /api/reports/scheduled/[id] - Get a single scheduled report
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth();

    const { id } = await params;

    const report = await prisma.scheduledReport.findUnique({
      where: { id },
      include: {
        runs: {
          orderBy: { runAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!report) {
      return NextResponse.json(
        { success: false, error: 'Scheduled report not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: report });
  } catch (error) {
    console.error('Error fetching scheduled report:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch scheduled report' },
      { status: 500 }
    );
  }
}

// PUT /api/reports/scheduled/[id] - Update a scheduled report
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth();

    const { id } = await params;
    const body = await request.json();
    const validated = scheduledReportSchema.parse(body);

    // Check if report exists
    const existing = await prisma.scheduledReport.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Scheduled report not found' },
        { status: 404 }
      );
    }

    // Validate email recipients if provided
    if (validated.recipients) {
      const emails = validated.recipients.split(',').map((e: string) => e.trim());
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      for (const email of emails) {
        if (!emailRegex.test(email)) {
          return NextResponse.json(
            { success: false, error: `Invalid email address: ${email}` },
            { status: 400 }
          );
        }
      }
    }

    const report = await prisma.scheduledReport.update({
      where: { id },
      data: validated,
    });

    return NextResponse.json({ success: true, data: report });
  } catch (error) {
    console.error('Error updating scheduled report:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update scheduled report' },
      { status: 500 }
    );
  }
}

// DELETE /api/reports/scheduled/[id] - Delete a scheduled report
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();

    const { id } = await params;

    // Check if report exists
    const existing = await prisma.scheduledReport.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Scheduled report not found' },
        { status: 404 }
      );
    }

    await prisma.scheduledReport.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Scheduled report deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting scheduled report:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete scheduled report' },
      { status: 500 }
    );
  }
}
