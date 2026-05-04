// Scheduled Reports API
// /api/reports/scheduled - Manage scheduled report configurations
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/api-utils';
import { z } from 'zod';
import { handleApiError } from '@/lib/api-error-handler';

// Validation schema for creating/updating scheduled reports
const scheduledReportSchema = z.object({
  name: z.string().min(1, 'Report name is required'),
  reportType: z.enum([
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
  ]),
  schedule: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'custom']),
  dayOfWeek: z.number().min(0).max(6).optional(),
  dayOfMonth: z.number().min(1).max(31).optional(),
  monthOfYear: z.number().min(1).max(12).optional(),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  enabled: z.boolean().default(true),
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
  recipients: z.string().min(1, 'At least one recipient email is required'),
  outputFormat: z.enum(['PDF', 'EXCEL']).default('PDF'),
  emailSubject: z.string().optional(),
  emailBody: z.string().optional(),
});

// GET /api/reports/scheduled - List all scheduled reports
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();

    const { searchParams } = request.nextUrl;
    const enabled = searchParams.get('enabled');
    const reportType = searchParams.get('reportType');

    const where: any = {};
    if (enabled === 'true') where.enabled = true;
    if (enabled === 'false') where.enabled = false;
    if (reportType) where.reportType = reportType;

    const reports = await prisma.scheduledReport.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }],
      include: {
        runs: {
          orderBy: { runAt: 'desc' },
          take: 5,
        },
      },
    });

    // Calculate next run date for each report
    const reportsWithNextRun = reports.map((report) => ({
      ...report,
      nextRunDate: calculateNextRunDate(
        report.schedule,
        report.dayOfWeek,
        report.dayOfMonth,
        report.monthOfYear,
        report.time
      ),
      lastRunStatus: report.runs[0]?.status || null,
      lastRunAt: report.runs[0]?.runAt || null,
    }));

    return NextResponse.json({
      success: true,
      data: reportsWithNextRun,
      count: reportsWithNextRun.length,
    });
  } catch (error: unknown) {
    console.error('Error fetching scheduled reports:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch scheduled reports' },
      { status: 500 }
    );
  }
}

// POST /api/reports/scheduled - Create a new scheduled report
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();

    const body = await request.json();
    const validated = scheduledReportSchema.parse(body);

    // Validate schedule-specific fields
    validateScheduleFields(
      validated.schedule,
      validated.dayOfWeek,
      validated.dayOfMonth,
      validated.monthOfYear
    );

    // Validate email recipients
    const emails = validated.recipients.split(',').map((e) => e.trim());
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (const email of emails) {
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { success: false, error: `Invalid email address: ${email}` },
          { status: 400 }
        );
      }
    }

    const report = await prisma.scheduledReport.create({
      data: {
        ...validated,
        createdBy: session?.id || 'system',
      } as any,
    });

    return NextResponse.json({
      success: true,
      data: {
        ...report,
        nextRunDate: calculateNextRunDate(
          report.schedule,
          report.dayOfWeek,
          report.dayOfMonth,
          report.monthOfYear,
          report.time
        ),
      },
    });
  } catch (error: unknown) {
    console.error('Error creating scheduled report:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create scheduled report' },
      { status: 500 }
    );
  }
}

// Helper function to calculate next run date
function calculateNextRunDate(
  schedule: string,
  dayOfWeek?: number | null,
  dayOfMonth?: number | null,
  monthOfYear?: number | null,
  time?: string | null
): Date | null {
  if (!time) return null;

  const [hours, minutes] = time.split(':').map(Number);
  const now = new Date();
  const next = new Date();

  next.setHours(hours, minutes, 0, 0);

  switch (schedule) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;

    case 'weekly':
      if (dayOfWeek === undefined || dayOfWeek === null) return null;
      const currentDay = now.getDay();
      const daysUntilNext = (dayOfWeek - currentDay + 7) % 7 || 7;
      next.setDate(next.getDate() + daysUntilNext);
      break;

    case 'monthly':
      if (dayOfMonth === undefined || dayOfMonth === null) return null;
      next.setDate(dayOfMonth);
      if (next <= now) {
        next.setMonth(next.getMonth() + 1);
      }
      // Handle edge case where dayOfMonth doesn't exist in some months
      if (next.getDate() !== dayOfMonth) {
        next.setDate(0); // Last day of month
      }
      break;

    case 'quarterly':
      if (
        dayOfMonth === undefined ||
        dayOfMonth === null ||
        monthOfYear === undefined ||
        monthOfYear === null
      )
        return null;
      next.setMonth(monthOfYear - 1); // monthOfYear is 1-12
      next.setDate(dayOfMonth);
      if (next <= now) {
        next.setFullYear(next.getFullYear() + 1);
      }
      break;

    case 'custom':
      return null;

    default:
      return null;
  }

  return next;
}

// Helper function to validate schedule-specific fields
function validateScheduleFields(
  schedule: string,
  dayOfWeek?: number | null,
  dayOfMonth?: number | null,
  monthOfYear?: number | null
): void {
  switch (schedule) {
    case 'weekly':
      if (dayOfWeek === undefined || dayOfWeek === null) {
        throw new Error('dayOfWeek is required for weekly schedules');
      }
      break;

    case 'monthly':
      if (dayOfMonth === undefined || dayOfMonth === null) {
        throw new Error('dayOfMonth is required for monthly schedules');
      }
      break;

    case 'quarterly':
      if (
        dayOfMonth === undefined ||
        dayOfMonth === null ||
        monthOfYear === undefined ||
        monthOfYear === null
      ) {
        throw new Error('dayOfMonth and monthOfYear are required for quarterly schedules');
      }
      break;
  }
}
